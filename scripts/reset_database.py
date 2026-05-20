#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SB Smart - reset MySQL database: TRUNCATE all tables, then single user admin / 123456.
Same behavior as scripts/reset-database.js

Requires:
  pip install pymysql bcrypt

Config: environment variables DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
(or optional .env next to project root - loaded if python-dotenv not used: simple parser below)
Defaults: localhost, 3306, pandora, 2202122, sb_pos
"""

from __future__ import annotations

import os
import sys

# --- optional .env (no extra package) ---
def _load_env_file(path: str) -> None:
    if not os.path.isfile(path):
        return
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, val = line.partition("=")
                key, val = key.strip(), val.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = val
    except OSError:
        pass


_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_load_env_file(os.path.join(_root, ".env"))

try:
    import pymysql
    import bcrypt
except ImportError:
    print("Install: pip install pymysql bcrypt", file=sys.stderr)
    sys.exit(1)

ADMIN_USER = "admin"
ADMIN_PASSWORD = "123456"


def quote_id(name: str) -> str:
    return "`" + str(name).replace("`", "``") + "`"


def main() -> int:
    host = os.environ.get("DB_HOST", "localhost")
    port = int(os.environ.get("DB_PORT", "3306") or "3306")
    user = os.environ.get("DB_USER", "pandora")
    password = os.environ.get("DB_PASSWORD", "2202122")
    database = os.environ.get("DB_NAME", "sb_pos")

    ok = input("Type YES to erase ALL data and create admin/123456: ").strip()
    if ok.upper() != "YES":
        print("Cancelled.")
        return 0

    conn = None
    try:
        conn = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
        )
        with conn.cursor() as cur:
            cur.execute("SET FOREIGN_KEY_CHECKS = 0")
            cur.execute(
                """
                SELECT TABLE_NAME AS name FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = %s AND TABLE_TYPE = 'BASE TABLE'
                """,
                (database,),
            )
            names = [r["name"] for r in cur.fetchall() if r.get("name")]
            for name in names:
                cur.execute(f"TRUNCATE TABLE {quote_id(name)}")
                print("truncated:", name)
            cur.execute("SET FOREIGN_KEY_CHECKS = 1")

            pw_hash = bcrypt.hashpw(
                ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt(rounds=10)
            ).decode("ascii")

            cur.execute("SHOW COLUMNS FROM users")
            cols = {row["Field"] for row in cur.fetchall()}
            parts: list[str] = []
            vals: list = []
            if "username" in cols:
                parts.append(quote_id("username"))
                vals.append(ADMIN_USER)
            if "email" in cols:
                parts.append(quote_id("email"))
                vals.append(None)
            parts.append(quote_id("password_hash"))
            vals.append(pw_hash)
            if "full_name" in cols:
                parts.append(quote_id("full_name"))
                vals.append(None)
            if "is_active" in cols:
                parts.append(quote_id("is_active"))
                vals.append(1)
            placeholders = ", ".join(["%s"] * len(vals))
            sql = f"INSERT INTO users ({', '.join(parts)}) VALUES ({placeholders})"
            cur.execute(sql, vals)

            try:
                cur.execute(
                    "INSERT IGNORE INTO minimum_stock_default (id, default_minimum_quantity) VALUES (1, 0)"
                )
            except pymysql.Error:
                pass

        conn.commit()
        print("Done. Login: admin / 123456")
        return 0
    except Exception as e:
        print("Error:", e, file=sys.stderr)
        if conn:
            conn.rollback()
        return 1
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    sys.exit(main())
