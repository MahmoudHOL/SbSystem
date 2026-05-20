/**
 * نقطة البيع - سجل المبيعات وتفاصيل الفاتورة
 */
(function () {
  const posSalesLogTbody = document.getElementById('pos-sales-log-tbody');
  const posSalesLogTab = document.getElementById('tab-pos-sales-log');
  const posSaleEditSaveBtn = document.getElementById('pos-sale-edit-save');
  let posSalesLogLoaded = false;
  let currentEditInvoice = null;
  let canViewSalesLogTab = true;
  let canEditQuantityFromDetails = true;

  function can(key) {
    return typeof window.hasPosPermission === 'function'
      ? window.hasPosPermission(key)
      : true;
  }

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

  /** قبل أي خصم (أصناف + فاتورة) مقابل النهائي المحفوظ — يعتمد gross_before_all_discounts من البنود */
  function saleLogDisplayFromInvoice(inv, netAmountOverride) {
    var gross =
      inv.gross_before_all_discounts != null && inv.gross_before_all_discounts !== ''
        ? Number(inv.gross_before_all_discounts)
        : inv.total_before_discount != null
          ? Number(inv.total_before_discount)
          : Number(inv.total_amount || 0);
    var net =
      netAmountOverride != null && !isNaN(netAmountOverride)
        ? Number(netAmountOverride)
        : Number(inv.total_amount || 0);
    var disc = Math.max(0, gross - net);
    var pct = gross > 0 ? (disc / gross) * 100 : 0;
    return { gross: gross, discount: disc, discountPct: pct, net: net };
  }

  function openPosSaleDetails(id) {
    var modalEl = document.getElementById('pos-sale-details-modal');
    var titleEl = document.getElementById('pos-sale-details-title');
    var metaEl = document.getElementById('pos-sale-details-meta');
    var tbodyEl = document.getElementById('pos-sale-details-tbody');
    var summaryEl = document.getElementById('pos-sale-details-summary');
    if (!modalEl || !tbodyEl) return;
    if (titleEl) titleEl.textContent = 'تفاصيل فاتورة بيع #' + id;
    tbodyEl.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted">جاري التحميل...</td></tr>';
    if (metaEl) metaEl.textContent = '';
    if (summaryEl) summaryEl.textContent = '';
    fetch('/api/sale-invoices/' + encodeURIComponent(id), { credentials: 'same-origin' })
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        if (!res.success || !res.data) {
          tbodyEl.innerHTML =
            '<tr><td colspan="5" class="text-center text-danger">فشل تحميل تفاصيل الفاتورة.</td></tr>';
          return;
        }
        var inv = (currentEditInvoice = res.data);
        var rows =
          inv.items && inv.items.length
            ? inv.items
                .map(function (it) {
                  // نستخدم كميات صحيحة في نقطة البيع
                  var qty = Math.max(0, Math.round(Number(it.quantity || 0)));
                  var unitSale = Number(it.unit_sale_price || 0);
                  var unitBefore =
                    it.unit_price_before_discount != null
                      ? Number(it.unit_price_before_discount)
                      : unitSale;
                  var lineTotal = Number(it.line_total || qty * unitSale || 0);
                  var qtyCellContent = '';
                  if (canEditQuantityFromDetails) {
                    qtyCellContent =
                      '<div class="d-flex align-items-center gap-2 flex-wrap">' +
                      '<button type="button" class="btn btn-sm btn-outline-light pos-edit-minus">−</button>' +
                      '<input type="number" class="form-control form-control-sm pos-edit-qty" min="0" step="1" value="' +
                      qty +
                      '" data-sale="' +
                      unitSale +
                      '" data-base="' +
                      unitBefore +
                      '">' +
                      '<button type="button" class="btn btn-sm btn-outline-light pos-edit-remove">حذف الصنف</button>' +
                      '</div>';
                  } else {
                    qtyCellContent = '<span class="fw-semibold">' + qty + '</span>';
                  }
                  return (
                    '<tr data-product-id="' +
                    it.product_id +
                    '">' +
                    '<td>' +
                    (it.product_name || '—') +
                    '</td>' +
                    '<td>' +
                    (it.barcode || '—') +
                    '</td>' +
                    '<td>' +
                    qtyCellContent +
                    '</td>' +
                    '<td>' +
                    unitSale.toFixed(2) +
                    '</td>' +
                    '<td>' +
                    lineTotal.toFixed(2) +
                    '</td>' +
                    '</tr>'
                  );
                })
                .join('')
            : '<tr><td colspan="5" class="text-center text-muted">لا توجد أصناف.</td></tr>';
        tbodyEl.innerHTML = rows;
        if (metaEl) {
          var dateLabel = formatPosDate(inv.created_at);
          metaEl.textContent =
            'المخزن: ' +
            (inv.warehouse_name || '—') +
            ' · العميل: ' +
            (inv.customer_name || 'عميل نقدي') +
            ' · التاريخ: ' +
            dateLabel;
        }
        if (summaryEl) {
          var d0 = saleLogDisplayFromInvoice(inv, null);
          var itemsCount = Number(inv.total_items || 0);
          summaryEl.textContent =
            'قبل الخصم: ' +
            d0.gross.toFixed(2) +
            ' ج.م · الخصم: ' +
            d0.discount.toFixed(2) +
            ' (' +
            d0.discountPct.toFixed(2) +
            '%) · بعد الخصم: ' +
            d0.net.toFixed(2) +
            ' ج.م · عدد القطع: ' +
            itemsCount.toFixed(3).replace(/\.?0+$/, '');
        }

        // ربط أزرار +/− وحذف الصنف مع تحديث الملخص
        if (tbodyEl && canEditQuantityFromDetails) {
          function recomputeEditSummary() {
            if (!currentEditInvoice || !summaryEl) return;
            var grossBefore = 0;
            var netLines = 0;
            var itemsCount = 0;
            var rows2 = tbodyEl.querySelectorAll('tr[data-product-id]');
            rows2.forEach(function (tr) {
              if (tr.querySelector('.pos-edit-remove')?.dataset.remove === '1') return;
              var qtyInput = tr.querySelector('.pos-edit-qty');
              if (!qtyInput) return;
              var qtyVal = parseInt(qtyInput.value || '0', 10);
              if (!qtyVal || qtyVal <= 0) return;
              var saleVal = parseFloat(qtyInput.getAttribute('data-sale') || '0');
              var baseVal = parseFloat(
                qtyInput.getAttribute('data-base') || qtyInput.getAttribute('data-sale') || '0'
              );
              itemsCount += qtyVal;
              grossBefore += qtyVal * baseVal;
              netLines += qtyVal * saleVal;
              var totalCell = tr.querySelector('td:last-child');
              if (totalCell) totalCell.textContent = (qtyVal * saleVal).toFixed(2);
            });
            var invPct = Number(currentEditInvoice.discount_percent || 0);
            var invVal = Number(currentEditInvoice.discount_value || 0);
            var afterInvoice;
            if (invPct > 0) {
              afterInvoice = Math.max(0, netLines - (netLines * invPct) / 100);
            } else if (invVal > 0) {
              afterInvoice = Math.max(0, netLines - invVal);
            } else {
              afterInvoice = netLines;
            }
            var discountTotal = Math.max(0, grossBefore - afterInvoice);
            var discountPct = grossBefore > 0 ? (discountTotal / grossBefore) * 100 : 0;
            summaryEl.textContent =
              'قبل الخصم: ' +
              grossBefore.toFixed(2) +
              ' ج.م · الخصم: ' +
              discountTotal.toFixed(2) +
              ' (' +
              discountPct.toFixed(2) +
              '%) · بعد الخصم: ' +
              afterInvoice.toFixed(2) +
              ' ج.م · عدد القطع: ' +
              itemsCount.toFixed(0);
          }

          tbodyEl.querySelectorAll('.pos-edit-plus').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var row = this.closest('tr');
              var qtyInput = row && row.querySelector('.pos-edit-qty');
              if (!qtyInput) return;
              var v = parseInt(qtyInput.value || '0', 10) || 0;
              qtyInput.value = v + 1;
              recomputeEditSummary();
            });
          });
          tbodyEl.querySelectorAll('.pos-edit-minus').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var row = this.closest('tr');
              var qtyInput = row && row.querySelector('.pos-edit-qty');
              if (!qtyInput) return;
              var v = parseInt(qtyInput.value || '0', 10) || 0;
              v = v - 1;
              if (v < 0) v = 0;
              qtyInput.value = v;
              recomputeEditSummary();
            });
          });
          tbodyEl.querySelectorAll('.pos-edit-qty').forEach(function (inp) {
            inp.addEventListener('change', function () {
              var v = parseInt(this.value || '0', 10);
              if (isNaN(v) || v < 0) v = 0;
              this.value = v;
              recomputeEditSummary();
            });
          });
          tbodyEl.querySelectorAll('.pos-edit-remove').forEach(function (btn) {
            btn.addEventListener('click', function () {
              this.dataset.remove = '1';
              var row = this.closest('tr');
              if (row) row.classList.add('table-danger');
              recomputeEditSummary();
            });
          });
          // أول مرة بعد تحميل البيانات
          recomputeEditSummary();
        }
      })
      .catch(function () {
        tbodyEl.innerHTML =
          '<tr><td colspan="5" class="text-center text-danger">فشل تحميل تفاصيل الفاتورة.</td></tr>';
      })
      .finally(function () {
        if (window.bootstrap && modalEl) {
          var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
          modal.show();
        }
      });
  }

  // نكشف الدالة عالمياً ليستفيد منها تبويب الاسترجاع
  window.openPosSaleDetails = openPosSaleDetails;

  function loadPosSalesLog() {
    if (!posSalesLogTbody || posSalesLogLoaded || !canViewSalesLogTab) return;
    posSalesLogLoaded = true;
    posSalesLogTbody.innerHTML =
      '<tr><td colspan="11" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/sale-invoices?all=1&source=pos', { credentials: 'same-origin' })
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
          posSalesLogTbody.innerHTML =
            '<tr><td colspan="11" class="text-center text-dark">لا توجد فواتير بيع.</td></tr>';
          return;
        }
        posSalesLogTbody.innerHTML = res.data
          .map(function (inv) {
            var d = saleLogDisplayFromInvoice(inv, null);
            var itemsCount = Number(inv.total_items || 0);
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
              (inv.payment_method_name || '—') +
              '</td>' +
              '<td>' +
              d.gross.toFixed(2) +
              '</td>' +
              '<td>' +
              d.discount.toFixed(2) +
              ' (' +
              d.discountPct.toFixed(2) +
              '%)</td>' +
              '<td>' +
              d.net.toFixed(2) +
              '</td>' +
              '<td>' +
              itemsCount.toFixed(3).replace(/\.?0+$/, '') +
              '</td>' +
              '<td>' +
              (inv.user_name || '—') +
              '</td>' +
              '<td><button type="button" class="btn btn-sm btn-dashboard btn-info pos-sale-details-btn" data-id="' +
              inv.id +
              '">تفاصيل</button></td>' +
              '</tr>'
            );
          })
          .join('');
        posSalesLogTbody.querySelectorAll('.pos-sale-details-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            if (id) openPosSaleDetails(id);
          });
        });
      })
      .catch(function () {
        posSalesLogTbody.innerHTML =
          '<tr><td colspan="11" class="text-center text-danger">فشل تحميل سجل المبيعات.</td></tr>';
      });
  }

  if (posSalesLogTab) {
    posSalesLogTab.addEventListener('shown.bs.tab', loadPosSalesLog);
  }

  function applyPosSalesLogAccess() {
    canViewSalesLogTab = can('tab_sales_log');
    canEditQuantityFromDetails = can('sales_log_edit_quantity');
    if (posSaleEditSaveBtn) {
      posSaleEditSaveBtn.classList.toggle('d-none', !canEditQuantityFromDetails);
    }
  }
  window.addEventListener('pos:access-ready', applyPosSalesLogAccess);
  applyPosSalesLogAccess();

  if (posSaleEditSaveBtn) {
    posSaleEditSaveBtn.addEventListener('click', function () {
      if (!canEditQuantityFromDetails) return;
      if (!currentEditInvoice) return;
      var tbodyEl = document.getElementById('pos-sale-details-tbody');
      if (!tbodyEl) return;
      var rows = tbodyEl.querySelectorAll('tr[data-product-id]');
      var items = [];
      rows.forEach(function (tr) {
        var pid = parseInt(tr.getAttribute('data-product-id'), 10);
        if (!pid) return;
        var qtyInput = tr.querySelector('.pos-edit-qty');
        if (!qtyInput) return;
        var removeBtn = tr.querySelector('.pos-edit-remove');
        var qty = parseFloat(qtyInput.value || '0');
        if (removeBtn && removeBtn.dataset.remove === '1') {
          return;
        }
        if (qty <= 0) {
          return;
        }
        var unitSale = parseFloat(qtyInput.getAttribute('data-sale') || '0');
        items.push({
          product_id: pid,
          quantity: qty,
          sale_price: unitSale,
        });
      });
      if (!items.length) {
        alert('يجب أن تحتوي الفاتورة على صنف واحد على الأقل بعد التعديل.');
        return;
      }
      var payload = {
        warehouse_id: currentEditInvoice.warehouse_id,
        supplier_id: currentEditInvoice.supplier_id,
        amount_paid: currentEditInvoice.amount_paid,
        items: items,
      };
      posSaleEditSaveBtn.disabled = true;
      fetch('/api/pos/sale-invoices/' + currentEditInvoice.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (res) {
          if (!res.success) {
            alert(res.message || 'فشل حفظ تعديل الفاتورة.');
            return;
          }
          alert('تم حفظ تعديل الفاتورة بنجاح.');
          // إعادة تحميل سجلات المبيعات والاسترجاع في الواجهة
          posSalesLogLoaded = false;
          if (posSalesLogTab && posSalesLogTab.classList.contains('active')) {
            loadPosSalesLog();
          }
          // نطلق حدث عام ليقوم تبويب الاسترجاع بتحديث نفسه إذا احتاج
          window.dispatchEvent(
            new CustomEvent('pos-sale-edited', { detail: { id: currentEditInvoice.id } })
          );
          // إغلاق المودال
          var modalEl = document.getElementById('pos-sale-details-modal');
          if (window.bootstrap && modalEl) {
            var modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
          }
        })
        .catch(function () {
          alert('خطأ في الاتصال. لم يتم حفظ تعديل الفاتورة.');
        })
        .finally(function () {
          posSaleEditSaveBtn.disabled = false;
        });
    });
  }
})();

