/**
 * نقطة البيع - تبويب استرجاع / تعديل فواتير POS
 * (يعرض فواتير نقطة البيع فقط مع عدد التعديلات وزر تعديل)
 */
(function () {
  var returnsTbody = document.getElementById('pos-returns-tbody');
  var returnsTab = document.getElementById('tab-pos-returns');
  var returnsLoaded = false;

  function formatPosDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function loadPosReturns() {
    if (!returnsTbody || returnsLoaded) return;
    returnsLoaded = true;
    returnsTbody.innerHTML =
      '<tr><td colspan="8" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/sale-invoices?all=1&source=pos', { credentials: 'same-origin' })
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
          returnsTbody.innerHTML =
            '<tr><td colspan="8" class="text-center text-dark">لا توجد فواتير نقطة بيع.</td></tr>';
          return;
        }
        returnsTbody.innerHTML = res.data
          .map(function (inv) {
            var totalAmount = Number(inv.total_amount || 0);
            var itemsCount = Number(inv.total_items || 0);
            var edits = Number(inv.edit_count || 0);
            var dateStr = formatPosDate(inv.created_at);
            return (
              '<tr>' +
              '<td>' +
              inv.id +
              '</td>' +
              '<td>' +
              dateStr +
              '</td>' +
              '<td>' +
              (inv.warehouse_name || '—') +
              '</td>' +
              '<td>' +
              (inv.customer_name || 'عميل نقدي') +
              '</td>' +
              '<td>' +
              totalAmount.toFixed(2) +
              '</td>' +
              '<td>' +
              itemsCount.toFixed(3).replace(/\\. ?0+$/, '') +
              '</td>' +
              '<td>' +
              edits +
              '</td>' +
              '<td><button type="button" class="btn btn-sm btn-dashboard btn-info pos-return-edit-btn" data-id="' +
              inv.id +
              '">تعديل</button></td>' +
              '</tr>'
            );
          })
          .join('');
        returnsTbody.querySelectorAll('.pos-return-edit-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            if (!id) return;
            if (window.openPosSaleDetails) {
              window.openPosSaleDetails(id);
            } else {
              var event = new CustomEvent('pos-open-sale-details', { detail: { id: id } });
              window.dispatchEvent(event);
            }
          });
        });
      })
      .catch(function () {
        returnsTbody.innerHTML =
          '<tr><td colspan="8" class="text-center text-danger">فشل تحميل فواتير نقطة البيع.</td></tr>';
      });
  }

  if (returnsTab) {
    returnsTab.addEventListener('shown.bs.tab', loadPosReturns);
  }

  // عند تعديل فاتورة من أي مكان، يمكننا إعادة تحميل الجدول إذا كان التبويب نشطاً
  window.addEventListener('pos-sale-edited', function () {
    if (!returnsTab) return;
    if (!returnsTab.classList.contains('active')) {
      // نجبر إعادة التحميل في المرة القادمة
      returnsLoaded = false;
      return;
    }
    returnsLoaded = false;
    loadPosReturns();
  });
})();

