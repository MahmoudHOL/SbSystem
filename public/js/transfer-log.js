(function () {
  var tbody = document.getElementById('transfer-log-tbody');
  if (!tbody) return;

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function load() {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/warehouse-transfers?limit=200', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">لا توجد عمليات نقل مسجلة.</td></tr>';
          return;
        }
        var html = '';
        res.data.forEach(function (t) {
          var itemsCount = t.items && t.items.length ? t.items.length : 0;
          var itemsHtml = '';
          if (t.items && t.items.length) {
            itemsHtml = '<table class="table table-sm table-warehouses mb-0"><thead><tr><th>المنتج</th><th>الباركود</th><th>الكمية</th></tr></thead><tbody>' +
              t.items.map(function (it) {
                return '<tr><td>' + (it.product_name || '—') + '</td><td>' + (it.barcode || '—') + '</td><td>' + Number(it.quantity) + '</td></tr>';
              }).join('') + '</tbody></table>';
          } else {
            itemsHtml = '<p class="text-muted small mb-0">لا توجد تفاصيل.</p>';
          }
          html += '<tr data-transfer-id="' + t.id + '">' +
            '<td>' + t.id + '</td>' +
            '<td>' + (t.from_warehouse_name || '—') + '</td>' +
            '<td>' + (t.to_warehouse_name || '—') + '</td>' +
            '<td>' + itemsCount + '</td>' +
            '<td>' + (t.user_name || '—') + '</td>' +
            '<td>' + formatDate(t.transferred_at) + '</td>' +
            '<td><button type="button" class="btn btn-sm btn-transfer-detail"><i class="fas fa-list-ul me-1"></i>تفاصيل</button></td>' +
            '</tr>' +
            '<tr class="transfer-detail-row d-none" data-detail-for="' + t.id + '"><td colspan="7" class="bg-dark">' + itemsHtml + '</td></tr>';
        });
        tbody.innerHTML = html;
        tbody.querySelectorAll('.btn-transfer-detail').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var tr = btn.closest('tr');
            var id = tr.getAttribute('data-transfer-id');
            var detailRow = tbody.querySelector('tr[data-detail-for="' + id + '"]');
            if (detailRow) detailRow.classList.toggle('d-none');
          });
        });
      })
      .catch(function () {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">فشل تحميل السجل.</td></tr>';
      });
  }

  load();
})();
