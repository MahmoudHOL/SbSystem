import base64
import json
import os
import subprocess
import sys
import hashlib
import socket
import traceback
from datetime import datetime, timedelta, timezone
from urllib import request, error

from PyQt5.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QLabel, QPushButton,
    QHBoxLayout, QMessageBox
)
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

try:
    import pymysql
except Exception:  # pragma: no cover
    pymysql = None

DB_HOST = "127.0.0.1"
DB_PORT = 3306
DB_USER = "root"
DB_PASSWORD = "2202122"
DB_NAME = "sb_pos"
LICENSE_DB_PEPPER = "SB_SMART_DB_ONLY_LICENSE_v1"
ADMIN_PASSWORD_HASH = "$2a$10$CcGPdq1CV/h4fpk1pgtBxO7o1Kwz2.x4amjvQsbcsB3VSYay3TtKm"
ERROR_LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "license-manager-error.log")


def utc_now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


class LicenseManager(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("مدير ترخيص SB Smart")
        self.resize(760, 210)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout()

        layout.addWidget(QLabel("التفعيل يتم مباشرة داخل قاعدة البيانات (مشفر ومربوط بالجهاز)."))

        days_row = QHBoxLayout()
        days_row.addWidget(QLabel("مدة التجربة ثابتة: 7 أيام"))
        layout.addLayout(days_row)

        btn_row = QHBoxLayout()
        self.btn_trial = QPushButton("تفعيل تجريبي لهذا الجهاز")
        self.btn_permanent = QPushButton("تفعيل دائم لهذا الجهاز")
        self.btn_expired = QPushButton("إلغاء/تعطيل الترخيص لهذا الجهاز")
        btn_row.addWidget(self.btn_trial)
        btn_row.addWidget(self.btn_permanent)
        btn_row.addWidget(self.btn_expired)
        layout.addLayout(btn_row)

        admin_row = QHBoxLayout()
        self.btn_reset_admin = QPushButton("إعادة كلمة مرور admin إلى 123456")
        self.btn_reset_license = QPushButton("إعادة تهيئة الترخيص")
        admin_row.addWidget(self.btn_reset_admin)
        admin_row.addWidget(self.btn_reset_license)
        layout.addLayout(admin_row)

        self.status_label = QLabel("جاهز")
        layout.addWidget(self.status_label)

        self.setLayout(layout)

        self.btn_trial.clicked.connect(self.make_trial)
        self.btn_permanent.clicked.connect(self.make_permanent)
        self.btn_expired.clicked.connect(self.make_expired)
        self.btn_reset_admin.clicked.connect(self.reset_admin_password)
        self.btn_reset_license.clicked.connect(self.reset_license_state)

        self.current_license = None

    def _get_machine_guid(self):
        try:
            output = subprocess.check_output(
                ['reg', 'query', r'HKLM\SOFTWARE\Microsoft\Cryptography', '/v', 'MachineGuid'],
                stderr=subprocess.DEVNULL,
                text=True
            )
            parts = output.strip().split()
            return parts[-1] if parts else ""
        except Exception:
            return ""

    def _get_cpu_models(self):
        try:
            output = subprocess.check_output(
                ['wmic', 'cpu', 'get', 'name'],
                stderr=subprocess.DEVNULL,
                text=True
            )
            lines = [x.strip() for x in output.splitlines() if x.strip() and x.strip().lower() != "name"]
            if not lines:
                return ""
            model = lines[0]
            cpu_count = os.cpu_count() or 1
            # Node os.cpus() typically returns one entry per logical CPU.
            return "|".join([model] * cpu_count)
        except Exception:
            return ""

    def _fallback_fingerprint(self):
        platform_value = "win32" if sys.platform.startswith("win") else sys.platform
        machine = (os.environ.get("PROCESSOR_ARCHITECTURE", "") or "").lower()
        arch = "x64" if machine in ("amd64", "x86_64") else ("x86" if machine in ("x86", "i386") else machine or "x64")
        src = "||".join([
            socket.gethostname(),
            platform_value,
            arch,
            self._get_machine_guid(),
            self._get_cpu_models(),
        ])
        return hashlib.sha256(src.encode("utf-8")).hexdigest()

    def _get_server_fingerprint(self):
        try:
            with request.urlopen("http://127.0.0.1:3000/api/license-status", timeout=3) as resp:
                raw = resp.read().decode("utf-8", errors="ignore")
                data = json.loads(raw) if raw else {}
                fp = ((data.get("data") or {}).get("fingerprint") or "").strip()
                return fp or None
        except Exception:
            return None

    def _get_server_license_status(self):
        try:
            with request.urlopen("http://127.0.0.1:3000/api/license-status", timeout=5) as resp:
                raw = resp.read().decode("utf-8", errors="ignore")
                data = json.loads(raw) if raw else {}
                return (data.get("data") or {})
        except Exception as e:
            raise RuntimeError(f"تعذر قراءة حالة الترخيص من السيرفر: {e}")

    def _resolve_fingerprint(self, require_server=True):
        # Always prefer/require server fingerprint to guarantee exact match with Node.js runtime.
        server_fp = self._get_server_fingerprint()
        if server_fp:
            return server_fp
        if require_server:
            raise RuntimeError("السيرفر غير متصل. شغّل sb-server.exe أولاً ثم أعد المحاولة.")
        return self._fallback_fingerprint()

    def _db_connect(self):
        if pymysql is None:
            raise RuntimeError("PyMySQL غير مثبت. نفذ: pip install pymysql")
        try:
            return pymysql.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                charset="utf8mb4",
                cursorclass=pymysql.cursors.Cursor,
                autocommit=False
            )
        except Exception as e:
            raise RuntimeError(f"تعذر الاتصال بقاعدة البيانات: {e}")

    def _ensure_license_schema(self, cur):
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS app_license_state (
              id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
              machine_fingerprint VARCHAR(128) NULL,
              license_type ENUM('trial', 'permanent') NULL,
              license_status ENUM('active', 'blocked') NOT NULL DEFAULT 'blocked',
              reason_code VARCHAR(64) NULL,
              issued_at DATETIME NULL,
              expires_at DATETIME NULL,
              signature TEXT NULL,
              encrypted_payload LONGTEXT NULL,
              payload_iv VARCHAR(64) NULL,
              payload_tag VARCHAR(64) NULL,
              raw_license_json JSON NULL,
              last_checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
        )
        for col_sql in [
            "ALTER TABLE app_license_state ADD COLUMN encrypted_payload LONGTEXT NULL AFTER signature",
            "ALTER TABLE app_license_state ADD COLUMN payload_iv VARCHAR(64) NULL AFTER encrypted_payload",
            "ALTER TABLE app_license_state ADD COLUMN payload_tag VARCHAR(64) NULL AFTER payload_iv",
        ]:
            try:
                cur.execute(col_sql)
            except Exception:
                pass

    def _derive_device_key(self, fingerprint):
        return hashlib.sha256(f"{fingerprint}::{LICENSE_DB_PEPPER}".encode("utf-8")).digest()

    def _encrypt_for_device(self, license_obj, fingerprint):
        key = self._derive_device_key(fingerprint)
        iv = os.urandom(12)
        aes = AESGCM(key)
        plaintext = json.dumps(license_obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        encrypted_with_tag = aes.encrypt(iv, plaintext, None)
        ciphertext = encrypted_with_tag[:-16]
        tag = encrypted_with_tag[-16:]
        return {
            "payload": base64.b64encode(ciphertext).decode("utf-8"),
            "iv": base64.b64encode(iv).decode("utf-8"),
            "tag": base64.b64encode(tag).decode("utf-8"),
        }

    def _apply_current_to_db(self):
        if not self.current_license:
            return
        fingerprint = self._resolve_fingerprint(require_server=True)
        if self.current_license.get("machine_fingerprint") != fingerprint:
            raise RuntimeError("الترخيص لا يخص هذا الجهاز.")
        enc = self._encrypt_for_device(self.current_license, fingerprint)
        conn = self._db_connect()
        try:
            cur = conn.cursor()
            self._ensure_license_schema(cur)
            cur.execute(
                """
                INSERT INTO app_license_state (
                  id, machine_fingerprint, license_type, license_status, reason_code,
                  issued_at, expires_at, signature, encrypted_payload, payload_iv, payload_tag,
                  raw_license_json, last_checked_at, updated_at
                ) VALUES (
                  1, %s, %s, %s, NULL, %s, %s, %s, %s, %s, %s, NULL, NOW(), NOW()
                )
                ON DUPLICATE KEY UPDATE
                  machine_fingerprint = VALUES(machine_fingerprint),
                  license_type = VALUES(license_type),
                  license_status = VALUES(license_status),
                  reason_code = NULL,
                  issued_at = VALUES(issued_at),
                  expires_at = VALUES(expires_at),
                  signature = VALUES(signature),
                  encrypted_payload = VALUES(encrypted_payload),
                  payload_iv = VALUES(payload_iv),
                  payload_tag = VALUES(payload_tag),
                  raw_license_json = NULL,
                  last_checked_at = NOW(),
                  updated_at = NOW()
                """,
                (
                    fingerprint,
                    self.current_license.get("type"),
                    "active" if self.current_license.get("status") == "active" else "blocked",
                    self.current_license.get("issued_at"),
                    self.current_license.get("expires_at"),
                    None,
                    enc["payload"],
                    enc["iv"],
                    enc["tag"],
                ),
            )
            conn.commit()
        finally:
            conn.close()

        # Critical verification: server must report active license immediately.
        server_status = self._get_server_license_status()
        if not server_status.get("ok"):
            reason = server_status.get("reason") or "unknown_reason"
            raise RuntimeError(
                f"تم حفظ الترخيص في قاعدة البيانات لكن السيرفر لم يفعّل الترخيص (reason: {reason}). "
                f"تأكد أن sb-server.exe محدث لنسخة الترخيص الجديدة."
            )

        msg = "تم تطبيق الترخيص بنجاح وتم تفعيله في السيرفر."
        self.status_label.setText(msg)
        QMessageBox.information(self, "تم", msg)

    def reset_admin_password(self):
        confirm = QMessageBox.question(
            self,
            "تأكيد",
            "هل تريد إعادة كلمة مرور admin إلى 123456؟",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        if confirm != QMessageBox.Yes:
            return

        try:
            conn = self._db_connect()
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO users (username, password_hash, full_name, is_active)
                VALUES ('admin', %s, 'admin', 1)
                ON DUPLICATE KEY UPDATE
                  password_hash = VALUES(password_hash),
                  is_active = 1,
                  updated_at = NOW()
                """,
                (ADMIN_PASSWORD_HASH,),
            )
            conn.commit()
            conn.close()
            msg = "تمت إعادة كلمة مرور admin إلى 123456"
            self.status_label.setText(msg)
            QMessageBox.information(self, "تم", msg)
        except Exception as e:
            msg = f"فشل إعادة كلمة مرور admin: {e}"
            self.status_label.setText(msg)
            QMessageBox.warning(self, "خطأ", msg)

    def reset_license_state(self):
        confirm = QMessageBox.question(
            self,
            "تأكيد",
            "سيتم حذف التفعيل الحالي من قاعدة البيانات. هل تريد المتابعة؟",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        if confirm != QMessageBox.Yes:
            return

        try:
            conn = self._db_connect()
            cur = conn.cursor()
            self._ensure_license_schema(cur)
            cur.execute(
                """
                INSERT INTO app_license_state (
                  id, machine_fingerprint, license_type, license_status, reason_code,
                  issued_at, expires_at, signature, encrypted_payload, payload_iv, payload_tag,
                  raw_license_json, last_checked_at, updated_at
                ) VALUES (
                  1, NULL, NULL, 'blocked', 'manual_reset', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
                )
                ON DUPLICATE KEY UPDATE
                  machine_fingerprint = NULL,
                  license_type = NULL,
                  license_status = 'blocked',
                  reason_code = 'manual_reset',
                  issued_at = NULL,
                  expires_at = NULL,
                  signature = NULL,
                  encrypted_payload = NULL,
                  payload_iv = NULL,
                  payload_tag = NULL,
                  raw_license_json = NULL,
                  last_checked_at = NOW(),
                  updated_at = NOW()
                """
            )
            conn.commit()
            conn.close()
            msg = "تمت إعادة تهيئة الترخيص"
            self.status_label.setText(msg)
            QMessageBox.information(self, "تم", msg)
        except Exception as e:
            msg = f"فشل إعادة تهيئة الترخيص: {e}"
            self.status_label.setText(msg)
            QMessageBox.warning(self, "خطأ", msg)

    def _build_license(self, lic_type, status="active", expires_at=None):
        fp = self._resolve_fingerprint(require_server=True)
        if not fp:
            QMessageBox.warning(self, "خطأ", "تعذر قراءة بصمة الجهاز.")
            return None
        lic = {
            "type": lic_type,
            "machine_fingerprint": fp,
            "issued_at": utc_now_iso(),
            "expires_at": expires_at,
            "status": status,
        }
        return lic

    def make_trial(self):
        expires = (datetime.now(timezone.utc) + timedelta(days=7)).replace(microsecond=0).isoformat()
        self.current_license = self._build_license("trial", "active", expires)
        if self.current_license:
            try:
                self._apply_current_to_db()
            except Exception as e:
                msg = f"فشل تطبيق الترخيص: {e}"
                self.status_label.setText(msg)
                QMessageBox.warning(self, "خطأ", msg)

    def make_permanent(self):
        self.current_license = self._build_license("permanent", "active", None)
        if self.current_license:
            try:
                self._apply_current_to_db()
            except Exception as e:
                msg = f"فشل تطبيق الترخيص: {e}"
                self.status_label.setText(msg)
                QMessageBox.warning(self, "خطأ", msg)

    def make_expired(self):
        expires = (datetime.now(timezone.utc) - timedelta(days=1)).replace(microsecond=0).isoformat()
        self.current_license = self._build_license("trial", "expired", expires)
        if self.current_license:
            try:
                self._apply_current_to_db()
            except Exception as e:
                msg = f"فشل تطبيق الترخيص: {e}"
                self.status_label.setText(msg)
                QMessageBox.warning(self, "خطأ", msg)

if __name__ == "__main__":
    def _handle_unexpected_exception(exc_type, exc_value, exc_tb):
        try:
            with open(ERROR_LOG_FILE, "a", encoding="utf-8") as f:
                f.write("\n==== Unhandled Exception ====\n")
                traceback.print_exception(exc_type, exc_value, exc_tb, file=f)
        except Exception:
            pass
        try:
            QMessageBox.critical(
                None,
                "خطأ",
                f"حدث خطأ غير متوقع وتم حفظه في:\n{ERROR_LOG_FILE}"
            )
        except Exception:
            pass

    sys.excepthook = _handle_unexpected_exception
    app = QApplication(sys.argv)
    w = LicenseManager()
    w.show()
    app.exec_()
