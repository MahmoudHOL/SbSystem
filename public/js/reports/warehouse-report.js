(function () {
  var warehouseSelect = document.getElementById('warehouse-report-select');
  var warehouseProductsTitle = document.getElementById('warehouse-products-title');
  var warehouseProductsTbody = document.getElementById('warehouse-products-tbody');
  var warehouseProductsWrap = document.getElementById('warehouse-products-wrap');
  var btnPrintWarehouseCheckAll = document.getElementById('btn-print-warehouse-check-all');
  var btnPrintWarehouseCheckErrors = document.getElementById('btn-print-warehouse-check-errors');
  var warehouseAllSummary = document.getElementById('warehouse-all-summary');
  var summaryTotalProducts = document.getElementById('summary-total-products');
  var summaryAtMinimum = document.getElementById('summary-at-minimum');
  var summaryOutOfStock = document.getElementById('summary-out-of-stock');
  var cardAtMinimum = document.getElementById('card-at-minimum');
  var cardOutOfStock = document.getElementById('card-out-of-stock');
  var modalStockAlerts = document.getElementById('modal-stock-alerts');
  var modalStockAlertsLabel = document.getElementById('modal-stock-alerts-label');
  var modalStockAlertsTbody = document.getElementById('modal-stock-alerts-tbody');
  var modalAlertsExtraTh = document.getElementById('modal-alerts-extra-th');
  var salesInsightsTabBtn = document.getElementById('tab-warehouse-sales-insights');
  var insightsFromDateEl = document.getElementById('insights-from-date');
  var insightsToDateEl = document.getElementById('insights-to-date');
  var btnInsightsApply = document.getElementById('btn-insights-apply');
  var btnInsightsReset = document.getElementById('btn-insights-reset');
  var insightsFilterMsg = document.getElementById('insights-filter-msg');
  var inventoryValueTotalEl = document.getElementById('inventory-value-total');
  var inventoryValueSelectedEl = document.getElementById('inventory-value-selected');
  var totalSoldItemsEl = document.getElementById('total-sold-items');
  var topSellingTbody = document.getElementById('top-selling-tbody');
  var salesProductsTbody = document.getElementById('sales-products-tbody');
  var currentWarehouseRows = [];
  var currentWarehouseName = '—';

  function formatQty(v) {
    var n = Number(v);
    if (isNaN(n)) return '0';
    return String(Math.round(n));
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function formatMoney(v) {
    var n = Number(v);
    if (isNaN(n)) return '0.00';
    return n.toFixed(2);
  }

  function formatMoneyWithLabel(v) {
    return formatMoney(v) + ' ج.م';
  }

  function toInt(v) {
    var n = Number(v);
    if (isNaN(n)) return 0;
    return Math.max(0, Math.round(n));
  }

  function printWarehouseCheckReport(rows, mode) {
    if (!rows || !rows.length) {
      window.alert('لا توجد منتجات للطباعة.');
      return;
    }
    var printMode = mode === 'errors_only' ? 'errors_only' : 'all';
    var printableRows = printMode === 'errors_only'
      ? rows.filter(function (r) { return r.status === 'bad'; })
      : rows.slice();
    if (!printableRows.length) {
      window.alert('لا توجد منتجات خطأ للطباعة.');
      return;
    }
    var reportDate = new Date().toLocaleString('ar-EG');
    var trHtml = '';
    var totalShortageValue = 0;
    var totalShortageQty = 0;

    printableRows.forEach(function (r, idx) {
      var systemQty = toInt(r.quantity);
      var isBad = r.status === 'bad';
      var shortageQty = isBad ? toInt(r.correctedQty) : 0;
      var unitPrice = Number(r.unit_price || 0);
      var shortageValue = shortageQty * unitPrice;
      var statusText = isBad ? 'خطأ' : 'صواب';

      totalShortageValue += shortageValue;
      totalShortageQty += shortageQty;

      trHtml +=
        '<tr>' +
        '<td>' + (idx + 1) + '</td>' +
        '<td>' + esc(r.product_name || '—') + '</td>' +
        '<td>' + esc(r.barcode || '—') + '</td>' +
        '<td>' + systemQty + '</td>' +
        '<td>' + shortageQty + '</td>' +
        '<td>' + formatMoney(unitPrice) + '</td>' +
        '<td>' + formatMoney(shortageValue) + '</td>' +
        '<td>' + statusText + '</td>' +
        '</tr>';
    });

    var win = window.open('', '_blank');
    if (!win) {
      window.alert('تعذر فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة.');
      return;
    }
    var html =
      '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>جرد المخزن</title>' +
      '<link rel="stylesheet" href="/css/print-invoice.css">' +
      '</head><body class="print-invoice-sale">' +
      '<div class="invoice-paper"><div class="invoice-paper-main">' +
      '<div class="invoice-header">' +
      '<div class="invoice-header-logo"></div>' +
      '<div class="invoice-header-center"><h1 class="invoice-title">نموذج جرد المخزن</h1></div>' +
      '<div class="invoice-header-logo"></div>' +
      '</div>' +
      '<div class="meta">' +
      '<span><strong>المخزن:</strong> ' + esc(currentWarehouseName) + '</span>' +
      '<span><strong>تاريخ الطباعة:</strong> ' + esc(reportDate) + '</span>' +
      '<span><strong>عدد المنتجات:</strong> ' + printableRows.length + '</span>' +
      '</div>' +
      '<table><thead><tr>' +
      '<th>#</th><th>المنتج</th><th>الباركود</th><th>كمية النظام</th><th>العجز</th><th>سعر الوحدة</th><th>قيمة العجز</th><th>الحالة</th>' +
      '</tr></thead><tbody>' + trHtml + '</tbody></table>' +
      '<div class="totals">' +
      '<div class="row"><span class="label">إجمالي العجز:</span><span>' + formatMoney(totalShortageValue) + '</span></div>' +
      '<div class="row"><span class="label">إجمالي عجز عدد المنتجات:</span><span>' + totalShortageQty + '</span></div>' +
      '</div>' +
      '<p class="footer-note">هذا التقرير مطبوع بنفس نمط فاتورة البيع لعرض نتائج الجرد (الصواب والخطأ).</p>' +
      '</div></div>' +
      '<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},300);});<\/script>' +
      '</body></html>';
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  function bindWarehouseRowActions() {
    if (!warehouseProductsTbody) return;
    warehouseProductsTbody.addEventListener('change', function (e) {
      var target = e.target;
      if (!target) return;
      var index = Number(target.getAttribute('data-index'));
      if (!Number.isInteger(index) || !currentWarehouseRows[index]) return;
      var row = currentWarehouseRows[index];

      if (target.classList.contains('js-stock-ok')) {
        row.status = 'ok';
        row.correctedQty = '';
      } else if (target.classList.contains('js-stock-bad')) {
        row.status = 'bad';
        window.alert('من فضلك اكتب الكمية الصحيحة لهذا المنتج.');
      } else if (target.classList.contains('js-correct-qty')) {
        row.correctedQty = target.value;
      } else {
        return;
      }

      loadWarehouseRowsTable();
    });
  }

  function loadWarehouseRowsTable() {
    if (!warehouseProductsTbody) return;
    if (!currentWarehouseRows.length) {
      warehouseProductsTbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted">لا توجد منتجات في هذا المخزن حالياً</td></tr>';
      return;
    }
    var html = '';
    currentWarehouseRows.forEach(function (p, idx) {
      var isOk = p.status !== 'bad';
      var isBad = !isOk;
      html +=
        '<tr>' +
        '<td>' + esc(p.product_name) + '</td>' +
        '<td><code class="small">' + esc(p.barcode) + '</code></td>' +
        '<td>' + formatQty(p.quantity) + '</td>' +
        '<td><input type="checkbox" class="form-check-input js-stock-ok chk-ok" data-index="' + idx + '"' + (isOk ? ' checked' : '') + '></td>' +
        '<td><input type="checkbox" class="form-check-input js-stock-bad chk-bad" data-index="' + idx + '"' + (isBad ? ' checked' : '') + '></td>' +
        '<td>' +
        (isBad
          ? '<input type="number" min="0" step="1" class="form-control form-control-sm js-correct-qty" data-index="' + idx + '"' +
            ' value="' + esc(p.correctedQty || '') + '" placeholder="اكتب الكمية الصحيحة">'
          : '<span class="text-muted small">—</span>') +
        '</td>' +
        '</tr>';
    });
    warehouseProductsTbody.innerHTML = html;
  }

  function updateWarehouseView() {
    if (!warehouseSelect) return;
    var v = warehouseSelect.value;
    if (v === 'all') {
      if (warehouseAllSummary) warehouseAllSummary.classList.remove('d-none');
      if (warehouseProductsWrap) warehouseProductsWrap.classList.add('d-none');
      loadWarehousesStockSummary();
    } else {
      if (warehouseAllSummary) warehouseAllSummary.classList.add('d-none');
      if (warehouseProductsWrap) warehouseProductsWrap.classList.remove('d-none');
      loadWarehouseProductsDetails();
    }

    if (isSalesInsightsTabActive()) {
      loadInventorySalesInsights();
    }
  }

  function isSalesInsightsTabActive() {
    return !!(salesInsightsTabBtn && salesInsightsTabBtn.classList.contains('active'));
  }

  function loadWarehousesStockSummary() {
    if (!summaryTotalProducts || !summaryAtMinimum || !summaryOutOfStock) return;
    summaryTotalProducts.textContent = '…';
    summaryAtMinimum.textContent = '…';
    summaryOutOfStock.textContent = '…';
    fetch('/api/reports/warehouses-stock-summary', { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success || !data.data) throw new Error('bad');
        var d = data.data;
        summaryTotalProducts.textContent = formatQty(d.total_products_count);
        summaryAtMinimum.textContent = formatQty(d.at_minimum_count);
        summaryOutOfStock.textContent = formatQty(d.out_of_stock_count);
      })
      .catch(function () {
        summaryTotalProducts.textContent = '—';
        summaryAtMinimum.textContent = '—';
        summaryOutOfStock.textContent = '—';
      });
  }

  function openStockAlertsModal(type) {
    if (!modalStockAlerts || !modalStockAlertsTbody || !modalStockAlertsLabel) return;
    var isMin = type === 'at_minimum';
    modalStockAlertsLabel.textContent = isMin
      ? 'المنتجات التي وصلت للحد الأدنى (حسب المخزن)'
      : 'المنتجات التي نفدت (كمية 0)';
    if (modalAlertsExtraTh) {
      modalAlertsExtraTh.classList.toggle('d-none', !isMin);
    }
    var colSpan = isMin ? 5 : 4;
    modalStockAlertsTbody.innerHTML =
      '<tr><td colspan="' + colSpan + '" class="text-center text-muted p-4">جاري التحميل...</td></tr>';

    var modal = bootstrap.Modal.getOrCreateInstance(modalStockAlerts);
    modal.show();

    fetch('/api/reports/warehouses-stock-alerts?type=' + encodeURIComponent(type), {
      credentials: 'same-origin',
    })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success) throw new Error('bad');
        var rows = data.data || [];
        if (!rows.length) {
          modalStockAlertsTbody.innerHTML =
            '<tr><td colspan="' + colSpan + '" class="text-center text-muted p-4">لا توجد بيانات</td></tr>';
          return;
        }
        var html = '';
        rows.forEach(function (r) {
          html +=
            '<tr>' +
            '<td>' + esc(r.warehouse_name) + '</td>' +
            '<td>' + esc(r.product_name) + '</td>' +
            '<td><code class="small">' + esc(r.barcode) + '</code></td>' +
            '<td>' + formatQty(r.quantity) + '</td>';
          if (isMin) {
            html += '<td>' + formatQty(r.effective_minimum) + '</td>';
          }
          html += '</tr>';
        });
        modalStockAlertsTbody.innerHTML = html;
      })
      .catch(function () {
        modalStockAlertsTbody.innerHTML =
          '<tr><td colspan="' + colSpan + '" class="text-center text-danger p-4">تعذر تحميل القائمة</td></tr>';
      });
  }

  function bindSummaryCard(el, type) {
    if (!el) return;
    el.addEventListener('click', function () {
      openStockAlertsModal(type);
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openStockAlertsModal(type);
      }
    });
  }

  bindSummaryCard(cardAtMinimum, 'at_minimum');
  bindSummaryCard(cardOutOfStock, 'out_of_stock');

  function loadWarehouseOptions() {
    if (!warehouseSelect) return;
    var prev = warehouseSelect.value;
    fetch('/api/warehouses', { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success) throw new Error('bad_data');
        var html = '<option value="all">كل المخازن</option>';
        (data.data || []).forEach(function (w) {
          html += '<option value="' + w.id + '">' + esc(w.name || '—') + '</option>';
        });
        warehouseSelect.innerHTML = html;
        var keep = prev === 'all';
        if (!keep && prev) {
          for (var i = 0; i < warehouseSelect.options.length; i += 1) {
            if (warehouseSelect.options[i].value === String(prev)) {
              keep = true;
              break;
            }
          }
        }
        warehouseSelect.value = keep ? prev : 'all';
        updateWarehouseView();
      })
      .catch(function () {
        warehouseSelect.innerHTML = '<option value="all">كل المخازن</option>';
        warehouseSelect.value = 'all';
        updateWarehouseView();
      });
  }

  function loadWarehouseProductsDetails() {
    if (!warehouseSelect || !warehouseProductsTbody) return;
    var warehouseId = warehouseSelect.value;
    var warehouseName = warehouseSelect.options[warehouseSelect.selectedIndex]
      ? warehouseSelect.options[warehouseSelect.selectedIndex].text
      : '—';

    if (!warehouseId || warehouseId === 'all') {
      return;
    }

    warehouseProductsTbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted">جاري التحميل...</td></tr>';

    fetch('/api/reports/warehouse-products-details?warehouse_id=' + encodeURIComponent(warehouseId), {
      credentials: 'same-origin',
    })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success) throw new Error('bad_data');
        var rows = data.data || [];
        if (warehouseProductsTitle) {
          warehouseProductsTitle.innerHTML =
            '<i class="fas fa-boxes-stacked me-2"></i>منتجات المخزن: ' + esc(warehouseName);
        }
        if (!rows.length) {
          warehouseProductsTbody.innerHTML =
            '<tr><td colspan="6" class="text-center text-muted">لا توجد منتجات في هذا المخزن حالياً</td></tr>';
          currentWarehouseRows = [];
          return;
        }
        currentWarehouseRows = rows.map(function (p) {
          return {
            product_id: p.product_id,
            product_name: p.product_name || '—',
            barcode: p.barcode || '—',
            quantity: toInt(p.quantity),
            unit_price: Number(p.unit_price || 0),
            status: 'ok',
            correctedQty: '',
          };
        });
        currentWarehouseName = warehouseName;
        loadWarehouseRowsTable();
      })
      .catch(function () {
        currentWarehouseRows = [];
        warehouseProductsTbody.innerHTML =
          '<tr><td colspan="6" class="text-center text-danger">تعذر تحميل بيانات المخزن</td></tr>';
      });
  }

  function getInsightsFilters() {
    var fromDate = insightsFromDateEl && insightsFromDateEl.value ? String(insightsFromDateEl.value) : '';
    var toDate = insightsToDateEl && insightsToDateEl.value ? String(insightsToDateEl.value) : '';
    return {
      from_date: fromDate,
      to_date: toDate,
    };
  }

  function setInsightsLoading() {
    if (inventoryValueTotalEl) inventoryValueTotalEl.textContent = '...';
    if (inventoryValueSelectedEl) inventoryValueSelectedEl.textContent = '...';
    if (totalSoldItemsEl) totalSoldItemsEl.textContent = '...';
    if (topSellingTbody) {
      topSellingTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">جاري التحميل...</td></tr>';
    }
    if (salesProductsTbody) {
      salesProductsTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">جاري التحميل...</td></tr>';
    }
  }

  function renderSalesRows(tbodyEl, rows, emptyText) {
    if (!tbodyEl) return;
    if (!rows || !rows.length) {
      tbodyEl.innerHTML = '<tr><td colspan="5" class="text-center text-muted">' + esc(emptyText) + '</td></tr>';
      return;
    }
    var html = '';
    rows.forEach(function (row, idx) {
      html += '<tr>' +
        '<td>' + (idx + 1) + '</td>' +
        '<td>' + esc(row.product_name || '—') + '</td>' +
        '<td>' + formatQty(row.sale_times) + '</td>' +
        '<td>' + formatQty(row.quantity_sold) + '</td>' +
        '<td>' + formatMoney(row.sales_amount) + '</td>' +
        '</tr>';
    });
    tbodyEl.innerHTML = html;
  }

  function loadInventorySalesInsights() {
    if (!inventoryValueTotalEl || !topSellingTbody || !salesProductsTbody) return;
    var params = new URLSearchParams();
    params.set('warehouse_id', (warehouseSelect && warehouseSelect.value) ? warehouseSelect.value : 'all');
    var filters = getInsightsFilters();
    if (filters.from_date) params.set('from_date', filters.from_date);
    if (filters.to_date) params.set('to_date', filters.to_date);

    setInsightsLoading();
    fetch('/api/reports/inventory-sales-insights?' + params.toString(), { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success || !data.data) throw new Error('bad');
        var d = data.data;
        if (inventoryValueTotalEl) inventoryValueTotalEl.textContent = formatMoneyWithLabel(d.inventory_value_total);
        if (inventoryValueSelectedEl) inventoryValueSelectedEl.textContent = formatMoneyWithLabel(d.inventory_value_selected);
        if (totalSoldItemsEl) totalSoldItemsEl.textContent = formatQty(d.total_sold_items);
        renderSalesRows(topSellingTbody, d.top_selling || [], 'لا توجد مبيعات في هذه الفترة');
        renderSalesRows(salesProductsTbody, d.products_sales || [], 'لا توجد بيانات مبيعات حسب الفلتر الحالي');
      })
      .catch(function () {
        if (inventoryValueTotalEl) inventoryValueTotalEl.textContent = '—';
        if (inventoryValueSelectedEl) inventoryValueSelectedEl.textContent = '—';
        if (totalSoldItemsEl) totalSoldItemsEl.textContent = '—';
        if (topSellingTbody) {
          topSellingTbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">تعذر تحميل البيانات</td></tr>';
        }
        if (salesProductsTbody) {
          salesProductsTbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">تعذر تحميل البيانات</td></tr>';
        }
      });
  }

  if (warehouseSelect) {
    warehouseSelect.addEventListener('change', updateWarehouseView);
  }

  if (salesInsightsTabBtn) {
    salesInsightsTabBtn.addEventListener('shown.bs.tab', function () {
      loadInventorySalesInsights();
    });
  }

  function validateBadRows(rows) {
    for (var i = 0; i < rows.length; i += 1) {
      var r = rows[i];
      if (r.status === 'bad') {
        if (r.correctedQty === '' || r.correctedQty == null) {
          window.alert('من فضلك اكتب الكمية الصحيحة لكل منتج محدد كخطأ.');
          return false;
        }
        var q = Number(r.correctedQty);
        if (isNaN(q) || q < 0 || Math.floor(q) !== q) {
          window.alert('الكمية الصحيحة يجب أن تكون رقماً صحيحاً (بدون كسور).');
          return false;
        }
      }
    }
    return true;
  }

  if (btnPrintWarehouseCheckAll) {
    btnPrintWarehouseCheckAll.addEventListener('click', function () {
      if (!currentWarehouseRows.length) {
        window.alert('لا توجد منتجات مطلوبة للطباعة.');
        return;
      }
      if (!validateBadRows(currentWarehouseRows)) {
        return;
      }
      printWarehouseCheckReport(currentWarehouseRows, 'all');
    });
  }

  if (btnPrintWarehouseCheckErrors) {
    btnPrintWarehouseCheckErrors.addEventListener('click', function () {
      if (!currentWarehouseRows.length) {
        window.alert('لا توجد منتجات مطلوبة للطباعة.');
        return;
      }
      if (!validateBadRows(currentWarehouseRows)) {
        return;
      }
      printWarehouseCheckReport(currentWarehouseRows, 'errors_only');
    });
  }

  bindWarehouseRowActions();

  window.addEventListener('warehouses:updated', loadWarehouseOptions);

  if (btnInsightsApply) {
    btnInsightsApply.addEventListener('click', function () {
      if (insightsFilterMsg) insightsFilterMsg.textContent = '';
      if (insightsFromDateEl && insightsToDateEl && insightsFromDateEl.value && insightsToDateEl.value && insightsFromDateEl.value > insightsToDateEl.value) {
        if (insightsFilterMsg) insightsFilterMsg.textContent = 'تاريخ "من" يجب أن يكون أصغر أو يساوي تاريخ "إلى".';
        return;
      }
      if (isSalesInsightsTabActive()) {
        loadInventorySalesInsights();
      }
    });
  }

  if (btnInsightsReset) {
    btnInsightsReset.addEventListener('click', function () {
      if (insightsFromDateEl) insightsFromDateEl.value = '';
      if (insightsToDateEl) insightsToDateEl.value = '';
      if (insightsFilterMsg) insightsFilterMsg.textContent = '';
      if (isSalesInsightsTabActive()) {
        loadInventorySalesInsights();
      }
    });
  }

  loadWarehouseOptions();
})();
