(function () {
  var openBtn = document.getElementById('btn-open-permissions-panel');
  var panel = document.getElementById('permissions-panel');
  var msgEl = document.getElementById('permissions-msg');
  var formCreateRole = document.getElementById('form-create-permission-role');
  var roleCodeEl = document.getElementById('perm-role-code');
  var roleNameEl = document.getElementById('perm-role-name');
  var roleDescEl = document.getElementById('perm-role-description');
  var roleSelectEl = document.getElementById('perm-role-select');
  var roleAssignSelectEl = document.getElementById('perm-assign-role-select');
  var actionsWrap = document.getElementById('perm-actions-wrap');
  var userSelectEl = document.getElementById('perm-user-select');
  var btnAssignRole = document.getElementById('btn-assign-role');
  var usersTbody = document.getElementById('perm-users-tbody');
  var permissionsCard = document.getElementById('settings-permissions-card');
  var canManagePermissions = false;

  if (!openBtn || !panel) return;

  function showMsg(text, isError) {
    if (!msgEl) return;
    msgEl.textContent = text || '';
    msgEl.className = 'form-message mt-3 mb-0 ' + (isError ? 'error' : 'success');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function looksBrokenEncoding(value) {
    var s = String(value || '');
    if (!s) return false;
    return /[Ï┘╣╚╔]/.test(s);
  }

  function roleLabel(role) {
    if (!role) return '—';
    var display = role.display_name || role.name || '';
    if (looksBrokenEncoding(display)) {
      display = role.code || display;
    }
    if (!display) display = role.code || ('Role #' + (role.id || ''));
    return display;
  }

  function actionTitle(moduleKey, actionKey, fallback) {
    var map = {
      'settings.users:view': 'عرض المستخدمين',
      'settings.users:create': 'إنشاء مستخدم',
      'settings.users:update': 'تعديل مستخدم',
      'settings.users:disable': 'تعطيل مستخدم',
      'settings.system.payment_methods:view': 'الدخول إلى تبويب طرق الدفع',
      'settings.system.discounts:view': 'الدخول إلى تبويب الخصم العام ونسب الموظفين',
      'settings.system.user_warehouses:view': 'الدخول إلى تبويب تحديد مخزن لي المستخدم',
      'settings.system.expense_categories:view': 'الدخول إلى تبويب فئات المصروفات',
      'settings.system.company_profile:view': 'الدخول إلى تبويب بيانات المنشأة',
      'settings.system.backup:view': 'الدخول إلى تبويب النسخ الاحتياطي / الاستيراد',
      'warehouses.tabs.warehouses:view': 'فتح تاب المخازن',
      'warehouses.tabs.dispatch:view': 'فتح تاب إذن توريد',
      'warehouses.dispatch:create_supplier': 'إنشاء مورد (إذن توريد)',
      'warehouses.dispatch:search': 'بحث منتج (إذن توريد)',
      'warehouses.dispatch:add_product': 'إضافة صنف (إذن توريد)',
      'warehouses.products:minimum_stock': 'الحد الأدنى (قائمة المنتجات)',
      'warehouses.products:edit': 'تعديل منتج (قائمة المنتجات)',
      'warehouses.products:suppliers': 'الموردين (قائمة المنتجات)',
      'warehouses.products:delete': 'حذف منتج (قائمة المنتجات)',
      'warehouses.tabs.suppliers_list:view': 'فتح تاب قائمة الموردين',
      'warehouses.suppliers:statement': 'كشف حساب المورد',
      'warehouses.log:edit_amount': 'سجل الشراء/البيع: زر المبلغ',
      'warehouses.log:edit_invoice': 'سجل الشراء/البيع: زر التعديل',
      'warehouses.log:delete_invoice': 'سجل الشراء/البيع: زر الحذف',
      'pos.page:view': 'دخول صفحة نقطة البيع',
      'pos.tabs.sales_log:view': 'POS: عرض تبويب سجل المبيعات',
      'pos.tabs.returns:view': 'POS: عرض تبويب استرجاع/تعديل',
      'pos.tabs.credit_customers:view': 'POS: عرض تبويب ملف عملاء الأجل',
      'pos.sales_log:edit_quantity': 'POS: تعديل الكمية من التفاصيل',
      'expenses:create': 'المصروفات: إضافة مصروف',
      'expenses:update': 'المصروفات: تعديل مصروف',
      'expenses:delete': 'المصروفات: حذف مصروف',
      'credit_customers:details': 'ملف عملاء الأجل: التفاصيل',
      'credit_customers:settle': 'ملف عملاء الأجل: السداد',
      'shift_close.tabs.payment_summary:view': 'تقفيل الشفت: تبويب ملخص طرق الدفع',
      'shift_close.tabs.receive_amounts:view': 'تقفيل الشفت: تبويب استلام المبالغ',
      'shift_close.tabs.shift_log:view': 'تقفيل الشفت: تبويب سجل تقفيل الشفت',
      'reports.pos_profit:view': 'التقارير: تقرير المبيعات',
      'reports.warehouse_report:view': 'التقارير: تقرير الجرد',
      'settings.permissions:manage': 'الإعدادات: إدارة الصلاحيات',
    };
    var key = String(moduleKey || '') + ':' + String(actionKey || '');
    return map[key] || fallback || actionKey || 'صلاحية';
  }

  function getJson(url, opts) {
    return fetch(url, Object.assign({ credentials: 'same-origin' }, opts || {})).then(function (res) {
      return res.json().then(function (body) {
        if (!res.ok || !body || body.success === false) {
          throw new Error((body && body.message) || 'حدث خطأ');
        }
        return body;
      });
    });
  }

  function loadSettingsHomeAccess() {
    return fetch('/api/settings-home-access', { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (body) {
        canManagePermissions = !!(body && body.success && body.data && body.data.permissions_manage);
      })
      .catch(function () {
        canManagePermissions = false;
      })
      .finally(function () {
        if (permissionsCard) permissionsCard.classList.toggle('d-none', !canManagePermissions);
        if (!canManagePermissions) panel.classList.add('d-none');
      });
  }

  function renderUsersTable(rows) {
    if (!usersTbody) return;
    if (!rows || !rows.length) {
      usersTbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">لا يوجد مستخدمون</td></tr>';
      return;
    }
    usersTbody.innerHTML = rows.map(function (r) {
      var roleName = r.role_display_name || r.role_name || r.role_code || 'غير محدد';
      return '<tr>' +
        '<td>' + esc(r.full_name || r.username || '—') + (String(r.username || '').toLowerCase() === 'admin' ? ' <span class="badge bg-info">admin</span>' : '') + '</td>' +
        '<td>' + esc(roleName) + '</td>' +
        '</tr>';
    }).join('');
  }

  function loadRolesAndUsers() {
    return Promise.all([
      getJson('/api/permission-roles'),
      getJson('/api/permission-users'),
    ]).then(function (results) {
      var roles = (results[0] && results[0].data) || [];
      var users = (results[1] && results[1].data) || [];

      var roleOptions = roles.map(function (r) {
        return '<option value="' + r.id + '">' + esc(roleLabel(r)) + '</option>';
      }).join('');
      if (roleSelectEl) roleSelectEl.innerHTML = roleOptions || '<option value="">لا يوجد أنواع</option>';
      if (roleAssignSelectEl) roleAssignSelectEl.innerHTML = roleOptions || '<option value="">لا يوجد أنواع</option>';

      if (userSelectEl) {
        userSelectEl.innerHTML = users
          .filter(function (u) { return String(u.username || '').toLowerCase() !== 'admin'; })
          .map(function (u) {
            var name = (u.full_name || u.username || '—') + ' (' + (u.username || '') + ')';
            return '<option value="' + u.user_id + '">' + esc(name) + '</option>';
          }).join('') || '<option value="">لا يوجد موظفون</option>';
      }

      renderUsersTable(users);
      loadRoleMatrix();
    });
  }

  function loadRoleMatrix() {
    if (!roleSelectEl || !actionsWrap) return;
    var roleId = roleSelectEl.value;
    if (!roleId) {
      actionsWrap.innerHTML = '<p class="text-muted mb-0">اختر نوع صلاحية</p>';
      return;
    }
    actionsWrap.innerHTML = '<p class="text-muted mb-0">جاري التحميل...</p>';
    getJson('/api/permission-role-matrix?role_id=' + encodeURIComponent(roleId))
      .then(function (result) {
        var rows = result.data || [];
        if (!rows.length) {
          actionsWrap.innerHTML = '<p class="text-muted mb-0">لا توجد صلاحيات.</p>';
          return;
        }
        actionsWrap.innerHTML = rows.map(function (r) {
          return '<label class="form-check form-switch">' +
            '<input class="form-check-input js-perm-action" type="checkbox" data-permission-id="' + r.permission_id + '"' + (r.is_allowed ? ' checked' : '') + '>' +
            '<span class="form-check-label">' + esc(actionTitle(r.module_key, r.action_key, r.title)) + '</span>' +
            '</label>';
        }).join('');
      })
      .catch(function (err) {
        actionsWrap.innerHTML = '<p class="text-danger mb-0">' + esc(err.message || 'فشل التحميل') + '</p>';
      });
  }

  openBtn.addEventListener('click', function () {
    if (!canManagePermissions) return;
    panel.classList.remove('d-none');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    loadRolesAndUsers().catch(function (err) {
      showMsg(err.message || 'فشل تحميل لوحة الصلاحيات', true);
    });
  });

  if (formCreateRole) {
    formCreateRole.addEventListener('submit', function (e) {
      e.preventDefault();
      var payload = {
        code: roleCodeEl ? String(roleCodeEl.value || '').trim() : '',
        name: roleNameEl ? String(roleNameEl.value || '').trim() : '',
        description: roleDescEl ? String(roleDescEl.value || '').trim() : '',
      };
      getJson('/api/permission-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (result) {
          showMsg(result.message || 'تم الإضافة', false);
          formCreateRole.reset();
          return loadRolesAndUsers();
        })
        .catch(function (err) {
          showMsg(err.message || 'فشل الإضافة', true);
        });
    });
  }

  if (roleSelectEl) {
    roleSelectEl.addEventListener('change', loadRoleMatrix);
  }

  if (actionsWrap) {
    actionsWrap.addEventListener('change', function (e) {
      var target = e.target;
      if (!target || !target.classList.contains('js-perm-action')) return;
      var roleId = roleSelectEl ? roleSelectEl.value : '';
      var permissionId = target.getAttribute('data-permission-id');
      if (!roleId || !permissionId) return;
      getJson('/api/permission-role-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: Number(roleId),
          permission_id: Number(permissionId),
          is_allowed: target.checked,
        }),
      }).catch(function (err) {
        target.checked = !target.checked;
        showMsg(err.message || 'فشل حفظ الصلاحية', true);
      });
    });
  }

  if (btnAssignRole) {
    btnAssignRole.addEventListener('click', function () {
      var userId = userSelectEl ? userSelectEl.value : '';
      var roleId = roleAssignSelectEl ? roleAssignSelectEl.value : '';
      if (!userId || !roleId) {
        showMsg('اختر الموظف ونوع الصلاحية', true);
        return;
      }
      getJson('/api/permission-users/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(userId), role_id: Number(roleId) }),
      })
        .then(function (result) {
          showMsg(result.message || 'تم الربط', false);
          return loadRolesAndUsers();
        })
        .catch(function (err) {
          showMsg(err.message || 'فشل الربط', true);
        });
    });
  }

  loadSettingsHomeAccess();
})();

