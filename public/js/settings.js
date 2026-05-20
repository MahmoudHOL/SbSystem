/**
 * صفحة المستخدمين - تحميل القائمة + إنشاء مستخدم + تعطيل مستخدم
 */
(function () {
  var usersTableBody = document.getElementById('usersTableBody');
  var formCreateUser = document.getElementById('formCreateUser');
  var createUserMessage = document.getElementById('createUserMessage');
  var currentMe = null;
  var formEditUser = document.getElementById('formEditUser');
  var editUserId = document.getElementById('editUserId');
  var editUsername = document.getElementById('editUsername');
  var editFullName = document.getElementById('editFullName');
  var editPassword = document.getElementById('editPassword');
  var editIsActive = document.getElementById('editIsActive');
  var editUsernameHelp = document.getElementById('editUsernameHelp');
  var btnSaveUserEdit = document.getElementById('btnSaveUserEdit');
  var editUserModalEl = document.getElementById('editUserModal');
  var editUserModal = editUserModalEl && window.bootstrap && window.bootstrap.Modal
    ? window.bootstrap.Modal.getOrCreateInstance(editUserModalEl)
    : null;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showMessage(text, isError) {
    if (!createUserMessage) return;
    createUserMessage.textContent = text || '';
    createUserMessage.style.color = isError ? '#e57373' : 'var(--copper-light)';
  }

  function formatDate(value) {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleDateString('ar-EG', { dateStyle: 'medium' });
    } catch (_) {
      return '—';
    }
  }

  function renderUsers(list) {
    if (!usersTableBody) return;
    if (!Array.isArray(list) || list.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">لا يوجد مستخدمون بعد</td></tr>';
      return;
    }

    usersTableBody.innerHTML = list.map(function (u) {
      var statusBadge = u.is_active
        ? '<span class="badge bg-success">نشط</span>'
        : '<span class="badge bg-secondary">معطّل</span>';
      var actions = u.is_active
        ? '<button type="button" class="btn btn-sm btn-outline-danger btn-disable-user me-1" data-id="' + u.id + '"><i class="fas fa-user-slash me-1"></i>تعطيل</button>'
        : '<span class="text-muted small me-1">—</span>';
      actions += '<button type="button" class="btn btn-sm btn-outline-primary btn-edit-user" data-id="' + u.id + '" data-username="' + esc(u.username || '') + '" data-full-name="' + esc(u.full_name || '') + '" data-active="' + (u.is_active ? '1' : '0') + '"><i class="fas fa-edit me-1"></i>تعديل</button>';

      return (
        '<tr>' +
        '<td>' + esc(u.username || '—') + '</td>' +
        '<td>' + esc(u.full_name || '—') + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + formatDate(u.created_at) + '</td>' +
        '<td>' + actions + '</td>' +
        '</tr>'
      );
    }).join('');

    usersTableBody.querySelectorAll('.btn-disable-user').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        if (!id) return;
        if (!window.confirm('هل تريد تعطيل هذا المستخدم؟')) return;

        btn.disabled = true;
        fetch('/api/users/' + encodeURIComponent(id), {
          method: 'DELETE',
          credentials: 'same-origin',
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (!data.success) {
              showMessage(data.message || 'فشل تعطيل المستخدم', true);
              return;
            }
            showMessage(data.message || 'تم تعطيل المستخدم');
            loadUsers();
          })
          .catch(function (err) {
            showMessage(err && err.message ? err.message : 'خطأ في الاتصال', true);
          })
          .finally(function () {
            btn.disabled = false;
          });
      });
    });

    usersTableBody.querySelectorAll('.btn-edit-user').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        var currentUsername = btn.getAttribute('data-username') || '';
        var currentFullName = btn.getAttribute('data-full-name') || '';
        var currentActive = btn.getAttribute('data-active') === '1';
        if (!id) return;
        if (!formEditUser || !editUserModal) return;
        editUserId.value = id;
        editUsername.value = currentUsername;
        editFullName.value = currentFullName === '—' ? '' : currentFullName;
        editPassword.value = '';
        editIsActive.value = currentActive ? '1' : '0';

        var isAdminUser = currentUsername.toLowerCase() === 'admin';
        editUsername.readOnly = isAdminUser;
        if (editUsernameHelp) {
          editUsernameHelp.classList.toggle('d-none', !isAdminUser);
        }

        editUserModal.show();
      });
    });
  }

  function loadUsers() {
    if (!usersTableBody) return;
    usersTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">جاري التحميل...</td></tr>';
    fetch('/api/users', { credentials: 'same-origin' })
      .then(function (res) {
        return res.json()
          .then(function (body) {
            if (!res.ok || !body || body.success === false) {
              var msg = (body && body.message) ? body.message : 'فشل جلب المستخدمين';
              throw new Error(msg);
            }
            return body;
          })
          .catch(function () {
            if (!res.ok) {
              throw new Error('ليس لديك صلاحيات');
            }
            throw new Error('فشل جلب المستخدمين');
          });
      })
      .then(function (result) {
        renderUsers(result.data || []);
      })
      .catch(function (err) {
        showMessage((err && err.message) || 'ليس لديك صلاحيات', true);
        usersTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">ليس لديك صلاحيات</td></tr>';
      });
  }

  if (formCreateUser) {
    formCreateUser.addEventListener('submit', function (e) {
      e.preventDefault();
      var formData = new FormData(formCreateUser);
      var payload = {
        username: (formData.get('username') || '').toString().trim(),
        password: (formData.get('password') || '').toString(),
        full_name: (formData.get('full_name') || '').toString().trim(),
      };

      if (!payload.username || payload.username.length < 2) {
        showMessage('اسم المستخدم مطلوب (حرفان على الأقل)', true);
        return;
      }
      if (!payload.password || payload.password.length < 4) {
        showMessage('كلمة المرور مطلوبة (4 أحرف على الأقل)', true);
        return;
      }

      var submitBtn = formCreateUser.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      showMessage('');

      fetch('/api/users', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data.success) {
            showMessage(data.message || 'فشل إنشاء المستخدم', true);
            return;
          }
          showMessage(data.message || 'تم إنشاء المستخدم بنجاح');
          formCreateUser.reset();
          loadUsers();
        })
        .catch(function (err) {
          showMessage(err && err.message ? err.message : 'خطأ في الاتصال', true);
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  if (formEditUser) {
    formEditUser.addEventListener('submit', function (e) {
      e.preventDefault();
      var id = editUserId ? String(editUserId.value || '').trim() : '';
      var username = editUsername ? editUsername.value.trim() : '';
      var fullName = editFullName ? editFullName.value.trim() : '';
      var password = editPassword ? editPassword.value.trim() : '';
      var isActive = editIsActive ? editIsActive.value === '1' : true;

      if (!id) {
        showMessage('معرف المستخدم غير صالح', true);
        return;
      }
      if (!username || username.length < 2) {
        showMessage('اسم المستخدم مطلوب (حرفان على الأقل)', true);
        return;
      }
      if (password && password.length < 4) {
        showMessage('كلمة المرور يجب أن تكون 4 أحرف على الأقل', true);
        return;
      }
      if (currentMe && Number(currentMe.id) === Number(id) && !isActive) {
        showMessage('لا يمكنك تعطيل حسابك الحالي', true);
        return;
      }

      if (btnSaveUserEdit) btnSaveUserEdit.disabled = true;
      fetch('/api/users/' + encodeURIComponent(id), {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          full_name: fullName,
          is_active: isActive,
          password: password,
        }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data.success) {
            showMessage(data.message || 'فشل تعديل المستخدم', true);
            return;
          }
          showMessage(data.message || 'تم تعديل المستخدم');
          if (editUserModal) editUserModal.hide();
          loadUsers();
        })
        .catch(function (err) {
          showMessage(err && err.message ? err.message : 'خطأ في الاتصال', true);
        })
        .finally(function () {
          if (btnSaveUserEdit) btnSaveUserEdit.disabled = false;
        });
    });
  }

  function loadCurrentUser() {
    fetch('/api/me', { credentials: 'same-origin' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (me) {
        currentMe = me || null;
      })
      .catch(function () {
        currentMe = null;
      });
  }

  loadCurrentUser();
  loadUsers();
})();
