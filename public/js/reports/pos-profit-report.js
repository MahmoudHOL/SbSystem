(function () {
  var fromDateInput = document.getElementById('report-from-date');
  var toDateInput = document.getElementById('report-to-date');
  var btnApplyFilter = document.getElementById('btn-apply-report-filter');
  var btnAll = document.getElementById('btn-report-all');
  var filterMsg = document.getElementById('report-filter-msg');
  var posCardsWrap = document.getElementById('pos-report-cards');
  var grandTotalsWrap = document.getElementById('pos-grand-totals-cards');
  var productsSummaryWrap = document.getElementById('pos-products-summary-cards');
  var productsSoldTbody = document.getElementById('pos-products-sold-tbody');
  var productsSumQty = document.getElementById('pos-products-sum-qty');
  var productsSumAmt = document.getElementById('pos-products-sum-amt');
  var productsTableWrap = document.getElementById('pos-products-table-wrap');
  var invoicesTableWrap = document.getElementById('pos-invoices-table-wrap');
  var invoicesTbody = document.getElementById('pos-invoices-tbody');
  var expensesTableWrap = document.getElementById('pos-expenses-table-wrap');
  var expensesTbody = document.getElementById('pos-expenses-tbody');
  var currentInvoices = [];
  var currentExpenses = [];

  function formatMoney(v) {
    return Number(v || 0).toFixed(2);
  }

  function formatInt(v) {
    return String(Math.trunc(Number(v || 0)));
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function showMsg(text, isError) {
    if (!filterMsg) return;
    filterMsg.textContent = text || '';
    filterMsg.className = 'form-message mt-3 mb-0 ' + (isError ? 'error' : 'success');
  }

  function formatDateTime(value) {
    if (!value) return '—';
    var d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('ar-EG');
  }

  function cardCol(title, value, subtitle, opts) {
    var options = opts || {};
    var colClass = options.colClass || 'col-12 col-sm-auto mb-0';
    var actionAttr = options.action ? ' data-action="' + escapeHtml(options.action) + '"' : '';
    var extraClass = options.className ? ' ' + options.className : '';
    var style = options.style ? ' style="' + escapeHtml(options.style) + '"' : '';
    var sub = subtitle ? '<p class="text-muted small mb-1">' + escapeHtml(subtitle) + '</p>' : '';
    return (
      '<div class="' + colClass + '">' +
      '<div class="feature-card h-100' + extraClass + '"' + actionAttr + style + '>' +
      '<h4 class="h6 text-muted mb-2">' + escapeHtml(title) + '</h4>' +
      sub +
      '<div class="fw-bold fs-5">' + value + '</div>' +
      '</div></div>'
    );
  }

  function renderGrandTotals(totals) {
    if (!grandTotalsWrap) return;
    var t = totals || {};
    var grandCol = 'col-12 col-sm-auto mb-0';
    grandTotalsWrap.innerHTML =
      cardCol('إجمالي المبيعات', formatMoney(t.gross_sales_before_discount), 'اضغط لعرض الفواتير', {
        action: 'show-invoices',
        style: 'cursor:pointer;',
        colClass: grandCol,
      }) +
      cardCol('إجمالي الخصومات', formatMoney(t.discounts_total), null, { colClass: grandCol }) +
      cardCol('صافي المبيعات بعد الخصم', formatMoney(t.net_sales_after_discount), null, { colClass: grandCol }) +
      cardCol('إجمالي الربح (تقريبي)', formatMoney(t.total_profit), 'حسب سعر الشراء الحالي', { colClass: grandCol }) +
      cardCol('إجمالي المصروفات', formatMoney(t.expenses_total_out), 'اضغط لعرض قائمة المصروفات', {
        action: 'show-expenses',
        style: 'cursor:pointer;',
        colClass: grandCol,
      }) +
      cardCol('صافي الربح بعد المصروفات', formatMoney(t.net_profit_after_expenses), 'الربح - صافي المصروفات', { colClass: grandCol }) +
      cardCol('أجل العملاء (لنا)', formatMoney(t.customers_credit_remaining), 'المتبقي على العملاء ضمن الفترة', { colClass: grandCol }) +
      cardCol('رصيد الموردين (علينا)', formatMoney(t.suppliers_balance_payable), 'الموجب فقط = علينا للموردين', { colClass: grandCol }) +
      cardCol('لنا عند الموردين', formatMoney(t.suppliers_balance_receivable), 'السالب يتم عرضه كقيمة موجبة لنا', { colClass: grandCol }) +
      cardCol('النتيجة بعد الأجل والموردين', formatMoney(t.net_profit_after_credit_and_suppliers), 'بعد المصروفات + أجل العملاء - علينا للموردين + لنا عند الموردين', { colClass: grandCol });
  }

  function renderInvoicesTable(invoices) {
    if (!invoicesTbody) return;
    var rows = invoices || [];
    if (!rows.length) {
      invoicesTbody.innerHTML =
        '<tr><td colspan="9" class="text-center text-muted">لا توجد فواتير مبيعات في هذه الفترة.</td></tr>';
      return;
    }
    var html = '';
    rows.forEach(function (r, idx) {
      var editedText = r.is_edited
        ? 'معدلة (' + (r.edit_count || 0) + ')'
        : 'غير معدلة';
      var editedClass = r.is_edited ? 'text-danger fw-semibold' : 'text-success';
      html +=
        '<tr>' +
        '<td>' + (idx + 1) + '</td>' +
        '<td>#' + (r.invoice_id || '—') + '</td>' +
        '<td>' + escapeHtml(formatDateTime(r.created_at)) + '</td>' +
        '<td>' + escapeHtml(r.customer_name || '—') + '</td>' +
        '<td>' + escapeHtml(r.payment_method_name || 'بدون تحديد') + '</td>' +
        '<td>' + formatMoney(r.gross_total) + '</td>' +
        '<td>' + formatMoney(r.discount_total) + '</td>' +
        '<td>' + formatMoney(r.net_total) + '</td>' +
        '<td class="' + editedClass + '">' + escapeHtml(editedText) + '</td>' +
        '</tr>';
    });
    invoicesTbody.innerHTML = html;
  }

  function renderProductsSummary(summary) {
    if (!productsSummaryWrap) return;
    var s = summary || {};
    productsSummaryWrap.innerHTML =
      cardCol('عدد المنتجات المباعة', String(s.distinct_products || 0), 'اضغط لعرض المنتجات', {
        action: 'show-products',
        style: 'cursor:pointer;',
      }) +
      cardCol('إجمالي الكمية المباعة', formatInt(s.total_quantity_sold), 'مجموع الوحدات') +
      cardCol('إجمالي مبالغ البنود', formatMoney(s.total_amount), 'مجموع line_total في الفترة');
  }

  function renderExpensesTable(expenses) {
    if (!expensesTbody) return;
    var rows = expenses || [];
    if (!rows.length) {
      expensesTbody.innerHTML =
        '<tr><td colspan="8" class="text-center text-muted">لا توجد مصروفات ضمن هذه الفترة.</td></tr>';
      return;
    }
    var html = '';
    rows.forEach(function (r, idx) {
      var cls = r.direction === 'in' ? 'text-success' : 'text-danger';
      html +=
        '<tr>' +
        '<td>' + (idx + 1) + '</td>' +
        '<td>' + escapeHtml(formatDateTime(r.expense_date || r.created_at)) + '</td>' +
        '<td>' + escapeHtml(r.user_name || '—') + '</td>' +
        '<td class="' + cls + '">' + escapeHtml(r.direction_label || '—') + '</td>' +
        '<td>' + escapeHtml(r.category_name || '—') + '</td>' +
        '<td>' + escapeHtml(r.payment_method_name || '—') + '</td>' +
        '<td>' + formatMoney(r.amount) + '</td>' +
        '<td>' + escapeHtml(r.note || '—') + '</td>' +
        '</tr>';
    });
    expensesTbody.innerHTML = html;
  }

  function renderPaymentCards(payments) {
    if (!posCardsWrap) return;
    var list = payments || [];
    if (!list.length) {
      posCardsWrap.innerHTML =
        '<div class="col-12 col-sm-auto mb-0"><div class="feature-card"><h4 class="h6">لا فواتير نقطة بيع</h4><p class="text-muted mb-0">لا توجد فواتير في هذه الفترة.</p></div></div>';
      return;
    }
    var cardsHtml = '';
    list.forEach(function (p) {
      cardsHtml +=
        '<div class="col-12 col-sm-auto mb-0"><div class="feature-card h-100">' +
        '<h4 class="h6">' + escapeHtml(p.payment_method_name || 'بدون تحديد') + '</h4>' +
        '<p class="text-muted mb-1 small">عدد الفواتير: ' + (p.invoices_count || 0) + '</p>' +
        '<p class="text-muted mb-1 small">الربح: ' + formatMoney(p.profit) + '</p>' +
        '<div class="fw-bold">' + formatMoney(p.net_sales_after_discount) + '</div>' +
        '<p class="text-muted small mb-0 mt-1">صافي بعد الخصم</p>' +
        '</div></div>';
    });
    posCardsWrap.innerHTML = cardsHtml;
  }

  function renderProductsTable(products, summary) {
    if (!productsSoldTbody) return;
    var rows = products || [];
    if (!rows.length) {
      productsSoldTbody.innerHTML =
        '<tr><td colspan="4" class="text-center text-muted">لا مبيعات لأصناف في هذه الفترة.</td></tr>';
      if (productsSumQty) productsSumQty.textContent = '0';
      if (productsSumAmt) productsSumAmt.textContent = '0.00';
      return;
    }
    var html = '';
    rows.forEach(function (r, idx) {
      html +=
        '<tr>' +
        '<td>' + (idx + 1) + '</td>' +
        '<td>' + escapeHtml(r.product_name || '—') + '</td>' +
        '<td>' + formatInt(r.quantity_sold) + '</td>' +
        '<td>' + formatMoney(r.amount_total) + '</td>' +
        '</tr>';
    });
    productsSoldTbody.innerHTML = html;
    var s = summary || {};
    if (productsSumQty) productsSumQty.textContent = formatInt(s.total_quantity_sold || 0);
    if (productsSumAmt) productsSumAmt.textContent = formatMoney(s.total_amount || 0);
  }

  function renderPosReport(payload) {
    if (!payload) return;
    currentInvoices = Array.isArray(payload.invoices) ? payload.invoices : [];
    currentExpenses = Array.isArray(payload.expenses) ? payload.expenses : [];
    renderGrandTotals(payload.totals);
    renderProductsSummary(payload.products_summary);
    renderPaymentCards(payload.payments);
    renderProductsTable(payload.products_sold, payload.products_summary);
    if (invoicesTbody) {
      invoicesTbody.innerHTML =
        '<tr><td colspan="9" class="text-center text-muted">اضغط على كرت إجمالي المبيعات لعرض الفواتير.</td></tr>';
    }
    if (invoicesTableWrap) invoicesTableWrap.classList.add('d-none');
    if (expensesTbody) {
      expensesTbody.innerHTML =
        '<tr><td colspan="8" class="text-center text-muted">اضغط على كرت إجمالي المصروفات لعرض القائمة.</td></tr>';
    }
    if (expensesTableWrap) expensesTableWrap.classList.add('d-none');
    if (productsTableWrap) productsTableWrap.classList.add('d-none');
  }

  function loadPosReport(opts) {
    var options = opts || {};
    var params = new URLSearchParams();
    if (options.all) {
      params.set('all', '1');
    } else {
      if (options.from_date) params.set('from_date', options.from_date);
      if (options.to_date) params.set('to_date', options.to_date);
    }

    var url = '/api/reports/pos-profit' + (params.toString() ? ('?' + params.toString()) : '');
    if (grandTotalsWrap) {
      grandTotalsWrap.innerHTML =
        '<div class="col-12 col-sm-auto mb-0"><div class="feature-card"><p class="text-muted mb-0">جاري التحميل...</p></div></div>';
    }
    if (posCardsWrap) {
      posCardsWrap.innerHTML =
        '<div class="col-12 col-sm-auto mb-0"><div class="feature-card"><p class="text-muted mb-0">جاري التحميل...</p></div></div>';
    }
    if (productsSummaryWrap) productsSummaryWrap.innerHTML = '';
    if (productsSoldTbody) {
      productsSoldTbody.innerHTML =
        '<tr><td colspan="4" class="text-center text-muted">جاري التحميل...</td></tr>';
    }

    fetch(url, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success || !data.data) throw new Error('bad_data');
        renderPosReport(data.data);
        if (data.data.filters && data.data.filters.all) {
          showMsg('عرض كل الفترات (بدون تقييد تاريخ). تفاصيل المنتجات تطابق نفس النطاق.', false);
        } else {
          showMsg('تم تطبيق فلتر التاريخ على كل أجزاء التقرير.', false);
        }
      })
      .catch(function () {
        if (grandTotalsWrap) {
          grandTotalsWrap.innerHTML =
            '<div class="col-12 col-sm-auto mb-0"><div class="feature-card text-danger">تعذر تحميل الإجماليات</div></div>';
        }
        if (posCardsWrap) {
          posCardsWrap.innerHTML =
            '<div class="col-12 col-sm-auto mb-0"><div class="feature-card text-danger">تعذر تحميل التقرير</div></div>';
        }
        if (productsSoldTbody) {
          productsSoldTbody.innerHTML =
            '<tr><td colspan="4" class="text-center text-danger">فشل التحميل</td></tr>';
        }
        showMsg('فشل تحميل البيانات', true);
      });
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

  if (grandTotalsWrap) {
    grandTotalsWrap.addEventListener('click', function (e) {
      var target = e.target && e.target.closest ? e.target.closest('[data-action="show-invoices"]') : null;
      var expenseTarget = e.target && e.target.closest ? e.target.closest('[data-action="show-expenses"]') : null;
      if (target) {
        renderInvoicesTable(currentInvoices);
        if (invoicesTableWrap) {
          invoicesTableWrap.classList.remove('d-none');
          invoicesTableWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }
      if (expenseTarget) {
        renderExpensesTable(currentExpenses);
        if (expensesTableWrap) {
          expensesTableWrap.classList.remove('d-none');
          expensesTableWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }

  if (productsSummaryWrap) {
    productsSummaryWrap.addEventListener('click', function (e) {
      var target = e.target && e.target.closest ? e.target.closest('[data-action="show-products"]') : null;
      if (!target) return;
      if (productsTableWrap) {
        productsTableWrap.classList.remove('d-none');
        productsTableWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  loadPosReport({ all: true });
})();
