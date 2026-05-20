/**
 * صفحة المخازن - تاب المخازن: جلب القائمة وإضافة مخزن
 */
(function () {
  function can(key) {
    return typeof window.hasWarehousesPermission === 'function'
      ? window.hasWarehousesPermission(key)
      : true;
  }
  const form = document.getElementById('add-warehouse-form');
  const inputName = document.getElementById('warehouse-name');
  const btnAdd = document.getElementById('btn-add');
  const formMessage = document.getElementById('form-message');
  const tbody = document.getElementById('warehouses-tbody');
  const tableEmpty = document.getElementById('table-empty');

  function showFormMessage(text, isError) {
    if (!formMessage) return;
    formMessage.textContent = text;
    formMessage.classList.remove('success', 'error');
    formMessage.classList.add(isError ? 'error' : 'success');
  }

  function clearFormMessage() {
    if (formMessage) {
      formMessage.textContent = '';
      formMessage.classList.remove('success', 'error');
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function renderList(items) {
    if (!tbody) return;
    if (!items || items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">لا توجد مخازن. أضف مخزناً جديداً.</td></tr>';
      if (tableEmpty) tableEmpty.classList.remove('d-none');
      return;
    }
    if (tableEmpty) tableEmpty.classList.add('d-none');
    tbody.innerHTML = items
      .map(function (w) {
        return (
          '<tr>' +
          '<td>' + w.id + '</td>' +
          '<td>' + (w.name || '—') + '</td>' +
          '<td>' + formatDate(w.created_at) + '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function loadWarehouses() {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/warehouses', { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('فشل جلب المخازن');
        return res.json();
      })
      .then(function (result) {
        if (result.success && result.data) {
          renderList(result.data);
        } else {
          renderList([]);
        }
      })
      .catch(function () {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">فشل تحميل القائمة</td></tr>';
      });
  }

  if (form && inputName && btnAdd) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFormMessage();
      var name = (inputName.value || '').trim();
      if (!name) {
        showFormMessage('أدخل اسم المخزن', true);
        return;
      }
      btnAdd.disabled = true;
      btnAdd.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>جاري الإضافة...';

      fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name: name }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.message || 'فشل الإضافة');
            return data;
          });
        })
        .then(function (data) {
          showFormMessage(data.message || 'تم إضافة المخزن بنجاح', false);
          inputName.value = '';
          loadWarehouses();
          if (typeof window.notifyWarehousesChanged === 'function') {
            window.notifyWarehousesChanged();
          }
        })
        .catch(function (err) {
          showFormMessage(err.message || 'حدث خطأ. حاول مرة أخرى.', true);
        })
        .finally(function () {
          btnAdd.disabled = false;
          btnAdd.innerHTML = '<i class="fas fa-plus me-2"></i>إضافة';
        });
    });
  }

  function initWarehousesTab() {
    if (!can('tab_warehouses')) return;
    loadWarehouses();
  }

  window.addEventListener('warehouses:access-ready', initWarehousesTab);
  initWarehousesTab();

  if (document.getElementById('currentYear')) {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
  }
})();
