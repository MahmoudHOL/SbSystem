(function () {
  var fromDateInput = document.getElementById('report-from-date');
  var toDateInput = document.getElementById('report-to-date');
  var btnApplyFilter = document.getElementById('btn-apply-report-filter');
  var btnAll = document.getElementById('btn-report-all');
  var filterMsg = document.getElementById('report-filter-msg');
  var posCardsWrap = document.getElementById('pos-report-cards');
  var warehouseCardsWrap = document.getElementById('warehouse-report-cards');
  var warehouseSelectorWrap = document.getElementById('warehouse-selector-wrap');
  var warehouseSelect = document.getElementById('warehouse-report-select');
  var btnLoadWarehouseProducts = document.getElementById('btn-load-warehouse-products');
  var warehouseProductsWrap = document.getElementById('warehouse-products-wrap');
  var warehouseProductsTitle = document.getElementById('warehouse-products-title');
  var warehouseProductsTbody = document.getElementById('warehouse-products-tbody');
  var posFiltersWrap = document.getElementById('pos-profit-filters-wrap');
  var reportTabsWrap = document.getElementById('reportTabs');
  var activeTab = 'pos-profit';
  var warehouseOptionsLoaded = false;

  function formatMoney(v) {
    return Number(v || 0).toFixed(2);
  }

  function showMsg(text, isError) {
    if (!filterMsg) return;
    filterMsg.textContent = text || '';
    filterMsg.className = 'form-message mt-3 mb-0 ' + (isError ? 'error' : 'success');
  }

  function renderPosReportCards(payload) {
    var cardsWrap = posCardsWrap;
    if (!cardsWrap) return;
    var payments = payload && payload.payments ? payload.payments : [];

    var cardsHtml = '';
    if (!payments.length) {
      cardsWrap.innerHTML =
        '<div class="col-12"><div class="feature-card"><h4>لا توجد بيانات</h4><p class="text-muted mb-0">لا توجد فواتير نقطة بيع حالياً.</p></div></div>';
      return;
    }

    (payments || []).forEach(function (p) {
      cardsHtml +=
        '<div class="col-md-6 col-lg-3 mb-3"><div class="feature-card">' +
        '<h4>' + (p.payment_method_name || 'بدون تحديد') + '</h4>' +
        '<p class="text-muted mb-1">عدد الفواتير: ' + (p.invoices_count || 0) + '</p>' +
        '<div class="fw-bold">' + formatMoney(p.net_sales_after_discount) + '</div>' +
        '</div></div>';
    });

    cardsWrap.innerHTML = cardsHtml;
  }

  function loadPosReport(opts) {
    var cardsWrap = posCardsWrap;
    if (!cardsWrap) return;
    var options = opts || {};
    var params = new URLSearchParams();
    if (options.all) {
      params.set('all', '1');
    } else {
      if (options.from_date) params.set('from_date', options.from_date);
      if (options.to_date) params.set('to_date', options.to_date);
    }
    var url = '/api/reports/pos-profit' + (params.toString() ? ('?' + params.toString()) : '');
    fetch(url, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success || !data.data) throw new Error('bad_data');
        renderPosReportCards(data.data);
        if (data.data.filters && data.data.filters.all) {
          showMsg('عرض كل البيانات (افتراضي)', false);
        } else {
          showMsg('تم تطبيق فلتر التاريخ بنجاح', false);
        }
      })
      .catch(function () {
        cardsWrap.innerHTML =
          '<div class="col-12"><div class="feature-card"><h4>تعذر تحميل التقرير</h4><p class="text-muted mb-0">حاول تحديث الصفحة</p></div></div>';
        showMsg('فشل تحميل البيانات', true);
      });
  }

  function renderWarehouseReportCards(rows) {
    if (!warehouseCardsWrap) return;
    var data = Array.isArray(rows) ? rows : [];
    if (!data.length) {
      warehouseCardsWrap.innerHTML =
        '<div class="col-12"><div class="feature-card"><h4>لا توجد بيانات</h4><p class="text-muted mb-0">لا توجد مخازن أو بيانات مخزون حالياً.</p></div></div>';
      return;
    }

    var cardsHtml = '';
    data.forEach(function (row) {
      cardsHtml +=
        '<div class="col-md-6 col-lg-3 mb-3"><div class="feature-card">' +
        '<h4>' + (row.name || '—') + '</h4>' +
        '<p class="text-muted mb-1">عدد المنتجات: ' + (row.products_count || 0) + '</p>' +
        '<div class="fw-bold">إجمالي الكمية: ' + formatMoney(row.total_quantity || 0) + '</div>' +
        '</div></div>';
    });

    warehouseCardsWrap.innerHTML = cardsHtml;
  }

  function loadWarehouseReport() {
    if (!warehouseCardsWrap) return;
    fetch('/api/reports/warehouses-products', { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success) throw new Error('bad_data');
        renderWarehouseReportCards(data.data || []);
      })
      .catch(function () {
        warehouseCardsWrap.innerHTML =
          '<div class="col-12"><div class="feature-card"><h4>تعذر تحميل التقرير</h4><p class="text-muted mb-0">حاول تحديث الصفحة</p></div></div>';
      });
  }

  function renderWarehouseOptions(rows) {
    if (!warehouseSelect) return;
    var data = Array.isArray(rows) ? rows : [];
    var html = '<option value="">-- اختر المخزن --</option>';
    data.forEach(function (w) {
      html += '<option value="' + w.id + '">' + (w.name || '—') + '</option>';
    });
    warehouseSelect.innerHTML = html;
  }

  function loadWarehouseOptions() {
    if (warehouseOptionsLoaded) return;
    fetch('/api/warehouses', { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success) throw new Error('bad_data');
        renderWarehouseOptions(data.data || []);
        warehouseOptionsLoaded = true;
      })
      .catch(function () {
        if (warehouseSelect) {
          warehouseSelect.innerHTML = '<option value="">تعذر تحميل المخازن</option>';
        }
      });
  }

  function renderWarehouseProductsDetails(rows, warehouseName) {
    if (!warehouseProductsTbody) return;
    var data = Array.isArray(rows) ? rows : [];
    if (warehouseProductsTitle) {
      warehouseProductsTitle.innerHTML =
        '<i class="fas fa-boxes-stacked me-2"></i>منتجات المخزن: ' + (warehouseName || '—');
    }
    if (!data.length) {
      warehouseProductsTbody.innerHTML =
        '<tr><td colspan="3" class="text-center text-muted">لا توجد منتجات في هذا المخزن حالياً</td></tr>';
      return;
    }

    var html = '';
    data.forEach(function (p) {
      html +=
        '<tr>' +
        '<td>' + (p.product_name || '—') + '</td>' +
        '<td>' + (p.barcode || '—') + '</td>' +
        '<td>' + formatMoney(p.quantity || 0) + '</td>' +
        '</tr>';
    });
    warehouseProductsTbody.innerHTML = html;
  }

  function loadWarehouseProductsDetails() {
    if (!warehouseSelect || !warehouseProductsTbody) return;
    var warehouseId = warehouseSelect.value;
    var warehouseName = warehouseSelect.options[warehouseSelect.selectedIndex]
      ? warehouseSelect.options[warehouseSelect.selectedIndex].text
      : '—';

    if (!warehouseId) {
      warehouseProductsTbody.innerHTML =
        '<tr><td colspan="3" class="text-center text-muted">اختر مخزناً أولاً</td></tr>';
      return;
    }

    warehouseProductsTbody.innerHTML =
      '<tr><td colspan="3" class="text-center text-muted">جاري التحميل...</td></tr>';

    fetch('/api/reports/warehouse-products-details?warehouse_id=' + encodeURIComponent(warehouseId), {
      credentials: 'same-origin',
    })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success) throw new Error('bad_data');
        renderWarehouseProductsDetails(data.data || [], warehouseName);
      })
      .catch(function () {
        warehouseProductsTbody.innerHTML =
          '<tr><td colspan="3" class="text-center text-danger">تعذر تحميل بيانات المخزن</td></tr>';
      });
  }

  function setActiveTab(tabName) {
    activeTab = tabName === 'warehouse-report' ? 'warehouse-report' : 'pos-profit';
    var tabButtons = reportTabsWrap ? reportTabsWrap.querySelectorAll('[data-tab]') : [];
    tabButtons.forEach(function (btn) {
      var isActive = btn.getAttribute('data-tab') === activeTab;
      btn.classList.toggle('active', isActive);
    });

    if (posCardsWrap) posCardsWrap.classList.toggle('d-none', activeTab !== 'pos-profit');
    if (posFiltersWrap) posFiltersWrap.classList.toggle('d-none', activeTab !== 'pos-profit');
    if (warehouseCardsWrap) warehouseCardsWrap.classList.toggle('d-none', activeTab !== 'warehouse-report');
    if (warehouseSelectorWrap) warehouseSelectorWrap.classList.toggle('d-none', activeTab !== 'warehouse-report');
    if (warehouseProductsWrap) warehouseProductsWrap.classList.toggle('d-none', activeTab !== 'warehouse-report');

    if (activeTab === 'warehouse-report') {
      showMsg('', false);
      loadWarehouseReport();
      loadWarehouseOptions();
    }
  }

  if (btnApplyFilter) {
    btnApplyFilter.addEventListener('click', function () {
      var fromDate = fromDateInput && fromDateInput.value ? fromDateInput.value : '';
      var toDate = toDateInput && toDateInput.value ? toDateInput.value : '';
      if (fromDate && toDate && fromDate > toDate) {
        showMsg('تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية', true);
        return;
      }
      loadPosReport({
        all: false,
        from_date: fromDate || null,
        to_date: toDate || null,
      });
    });
  }

  if (btnAll) {
    btnAll.addEventListener('click', function () {
      if (fromDateInput) fromDateInput.value = '';
      if (toDateInput) toDateInput.value = '';
      loadPosReport({ all: true });
    });
  }

  if (reportTabsWrap) {
    reportTabsWrap.addEventListener('click', function (e) {
      var target = e.target && e.target.closest ? e.target.closest('[data-tab]') : null;
      if (!target) return;
      setActiveTab(target.getAttribute('data-tab'));
    });
  }

  if (btnLoadWarehouseProducts) {
    btnLoadWarehouseProducts.addEventListener('click', function () {
      loadWarehouseProductsDetails();
    });
  }

  // الافتراضي: عرض كل شيء
  loadPosReport({ all: true });
  setActiveTab(activeTab);
})();

