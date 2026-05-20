/**
 * صفحة المخازن - تاب مورد: إنشاء مورد وعرض القائمة
 */
(function () {
  function can(key) {
    return typeof window.hasWarehousesPermission === 'function'
      ? window.hasWarehousesPermission(key)
      : true;
  }
  const form = document.getElementById('add-supplier-form');
  const btnAdd = document.getElementById('btn-add-supplier');
  const formMsg = document.getElementById('supplier-form-message');
  const tbody = document.getElementById('suppliers-tbody');
  const tableEmpty = document.getElementById('suppliers-table-empty');

  function showMsg(text, isError) {
    if (!formMsg) return;
    formMsg.textContent = text;
    formMsg.className = 'form-message mt-2 ' + (isError ? 'error' : 'success');
  }

  function clearMsg() {
    if (formMsg) formMsg.textContent = '';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function loadSuppliers() {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/suppliers', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">لا يوجد موردون. أضف مورداً جديداً.</td></tr>';
          if (tableEmpty) tableEmpty.classList.remove('d-none');
          return;
        }
        if (tableEmpty) tableEmpty.classList.add('d-none');
        tbody.innerHTML = res.data.map(function (s) {
          var statementAction = can('suppliers_statement')
            ? ('<button type="button" class="btn btn-sm btn-supplier-statement" data-id="' + s.id + '" data-name="' + (s.name || '') + '" data-phone="' + (s.phone || '') + '"><i class="fas fa-balance-scale me-1"></i>كشف حساب</button>')
            : '<span class="text-muted small">—</span>';
          return '<tr>' +
            '<td>' + s.id + '</td>' +
            '<td>' + (s.name || '—') + '</td>' +
            '<td>' + (s.phone || '—') + '</td>' +
            '<td>' + (s.note || '—') + '</td>' +
            '<td>' + formatDate(s.created_at) + '</td>' +
            '<td>' + statementAction + '</td>' +
            '</tr>';
        }).join('');
        tbody.querySelectorAll('.btn-supplier-statement').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            window.location.href = '/supplier-statement.html?id=' + id;
          });
        });
      })
      .catch(function () {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">فشل تحميل الموردين</td></tr>';
      });
  }

  if (form && btnAdd) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearMsg();
      var name = (form.name && form.name.value || '').trim();
      var phone = (form.phone && form.phone.value || '').trim();
      var note = (form.note && form.note.value || '').trim();
      if (!name) { showMsg('اسم المورد مطلوب', true); return; }
      if (!phone) { showMsg('رقم الهاتف مطلوب', true); return; }
      btnAdd.disabled = true;
      btnAdd.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>جاري الإضافة...';
      fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name: name, phone: phone, note: note || null })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            showMsg(data.message || 'تم إضافة المورد بنجاح', false);
            form.reset();
            loadSuppliers();
            window.dispatchEvent(new Event('suppliers:updated'));
          } else {
            showMsg(data.message || 'فشل الإضافة', true);
          }
        })
        .catch(function () { showMsg('حدث خطأ في الاتصال', true); })
        .finally(function () {
          btnAdd.disabled = false;
          btnAdd.innerHTML = '<i class="fas fa-plus me-2"></i>إضافة';
        });
    });
  }

  var tabSuppliersList = document.getElementById('tab-suppliers-list');
  if (tabSuppliersList) {
    tabSuppliersList.addEventListener('shown.bs.tab', function () { loadSuppliers(); });
  }

  function initSuppliersTabByAccess() {
    if (!can('tab_suppliers_list')) return;
    if (document.querySelector('#panel-suppliers-list.show, #panel-suppliers-list.active')) {
      loadSuppliers();
    }
  }
  window.addEventListener('warehouses:access-ready', initSuppliersTabByAccess);
  initSuppliersTabByAccess();
})();
