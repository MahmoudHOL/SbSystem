(function () {
  var customersTbody = document.getElementById('credit-customers-tbody');
  var invoicesWrap = document.getElementById('credit-invoices-wrap');
  var invoicesTbody = document.getElementById('credit-invoices-tbody');
  var customerTitle = document.getElementById('credit-customer-title');
  var msgEl = document.getElementById('credit-msg');

  var modalEl = document.getElementById('creditInvoiceDetailsModal');
  var modalTitle = document.getElementById('creditInvoiceDetailsTitle');
  var modalMeta = document.getElementById('creditInvoiceDetailsMeta');
  var modalTbody = document.getElementById('creditInvoiceDetailsTbody');

  var currentCustomerId = null;
  var currentCustomerName = '';
  var canViewDetails = true;
  var canSettle = true;

  function money(v) {
    return Number(v || 0).toFixed(2);
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function showMsg(text, isError) {
    if (!msgEl) return;
    msgEl.textContent = text || '';
    msgEl.className = 'form-message mt-2 mb-0 ' + (isError ? 'error' : 'success');
  }

  function loadCreditCustomersAccess() {
    return fetch('/api/credit-customers-access', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.success || !res.data) return;
        canViewDetails = !!res.data.details;
        canSettle = !!res.data.settle;
      })
      .catch(function () {});
  }

  function openInvoiceDetails(invoiceId) {
    if (!invoiceId || !modalEl || !modalTbody) return;
    if (modalTitle) modalTitle.textContent = 'تفاصيل الفاتورة #' + invoiceId;
    if (modalMeta) modalMeta.textContent = '';
    modalTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/credit-customers/invoices/' + encodeURIComponent(invoiceId) + '/details', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) {
          modalTbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">تعذر تحميل تفاصيل الفاتورة.</td></tr>';
          return;
        }
        var inv = res.data;
        if (modalMeta) {
          modalMeta.textContent =
            'العميل: ' + (inv.customer_name || '—') +
            ' · المخزن: ' + (inv.warehouse_name || '—') +
            ' · بعد الخصم: ' + money(inv.total_amount) + ' ج.م';
        }
        var items = Array.isArray(inv.items) ? inv.items : [];
        if (!items.length) {
          modalTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">لا توجد أصناف.</td></tr>';
          return;
        }
        modalTbody.innerHTML = items.map(function (it) {
          return (
            '<tr>' +
            '<td>' + esc(it.product_name || '—') + '</td>' +
            '<td>' + esc(it.barcode || '—') + '</td>' +
            '<td>' + Number(it.quantity || 0) + '</td>' +
            '<td>' + money(it.unit_sale_price) + '</td>' +
            '<td>' + money(it.line_total) + '</td>' +
            '</tr>'
          );
        }).join('');
      })
      .catch(function () {
        modalTbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">فشل الاتصال.</td></tr>';
      })
      .finally(function () {
        if (window.bootstrap) {
          window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
      });
  }

  function settleInvoice(creditInvoiceId, amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      showMsg('مبلغ السداد غير صالح', true);
      return;
    }
    fetch('/api/credit-invoices/' + encodeURIComponent(creditInvoiceId) + '/settlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        amount: amount,
        payment_method_id: null,
        note: 'سداد من صفحة ملف عملاء الأجل',
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success) {
          showMsg(res.message || 'فشل تسجيل السداد', true);
          return;
        }
        showMsg(res.message || 'تم تسجيل السداد');
        loadCustomerInvoices();
        loadCustomers();
      })
      .catch(function () {
        showMsg('خطأ في الاتصال أثناء السداد', true);
      });
  }

  function loadCustomerInvoices() {
    if (!currentCustomerId || !invoicesTbody) return;
    if (invoicesWrap) invoicesWrap.classList.remove('d-none');
    invoicesTbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/credit-customers/' + encodeURIComponent(currentCustomerId) + '/invoices', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !Array.isArray(res.data) || !res.data.length) {
          invoicesTbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">لا توجد فواتير مفتوحة لهذا العميل.</td></tr>';
          if (customerTitle) customerTitle.textContent = 'العميل: ' + currentCustomerName + ' · إجمالي المطلوب: 0.00 ج.م';
          return;
        }
        var totalRemaining = res.data.reduce(function (s, row) { return s + Number(row.remaining_amount || 0); }, 0);
        if (customerTitle) {
          customerTitle.textContent = 'العميل: ' + currentCustomerName + ' · إجمالي المطلوب: ' + money(totalRemaining) + ' ج.م';
        }
        invoicesTbody.innerHTML = res.data.map(function (inv, idx) {
          var statusLabel = inv.status === 'settled' ? 'مسددة' : (inv.status === 'partial' ? 'سداد جزئي' : 'مفتوحة');
          return (
            '<tr>' +
            '<td>' + (idx + 1) + '</td>' +
            '<td>#' + inv.sale_invoice_id + '</td>' +
            '<td>' + esc(inv.invoice_created_at || inv.created_at || '—') + '</td>' +
            '<td>' + money(inv.invoice_total_amount) + '</td>' +
            '<td>' + money(inv.amount_paid) + '</td>' +
            '<td>' + money(inv.amount_settled) + '</td>' +
            '<td>' + money(inv.remaining_amount) + '</td>' +
            '<td>' + esc(statusLabel) + '</td>' +
            '<td>' + (canViewDetails
              ? '<button type="button" class="btn btn-sm btn-outline-info btn-show-details" data-invoice-id="' + inv.sale_invoice_id + '">تفاصيل</button>'
              : '<span class="text-muted">—</span>') + '</td>' +
            '<td>' +
            (canSettle
              ? ('<div class="d-flex align-items-center gap-1">' +
                 '<input type="number" class="form-control form-control-sm settle-amount" min="0.01" step="0.01" value="' + money(inv.remaining_amount) + '" style="width:90px;">' +
                 '<button type="button" class="btn btn-sm btn-outline-light btn-settle" data-credit-id="' + inv.id + '">سداد</button>' +
                 '</div>')
              : '<span class="text-muted">—</span>') +
            '</td>' +
            '</tr>'
          );
        }).join('');

        invoicesTbody.querySelectorAll('.btn-show-details').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var invoiceId = parseInt(btn.getAttribute('data-invoice-id'), 10);
            if (invoiceId) openInvoiceDetails(invoiceId);
          });
        });
        invoicesTbody.querySelectorAll('.btn-settle').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var creditId = parseInt(btn.getAttribute('data-credit-id'), 10);
            var row = btn.closest('tr');
            var amountInput = row ? row.querySelector('.settle-amount') : null;
            var amount = amountInput ? Number(amountInput.value) : NaN;
            if (creditId) settleInvoice(creditId, amount);
          });
        });
      })
      .catch(function () {
        invoicesTbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">فشل تحميل الفواتير.</td></tr>';
      });
  }

  function loadCustomers() {
    if (!customersTbody) return;
    customersTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/credit-customers/profile', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !Array.isArray(res.data) || !res.data.length) {
          customersTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">لا يوجد عملاء عليهم رصيد أجل.</td></tr>';
          return;
        }
        customersTbody.innerHTML = res.data.map(function (c) {
          return (
            '<tr>' +
            '<td>' + esc(c.customer_name) + '</td>' +
            '<td>' + esc(c.customer_phone || '—') + '</td>' +
            '<td>' + Number(c.invoices_count || 0) + '</td>' +
            '<td>' + money(c.total_required) + '</td>' +
            '<td>' + money(c.total_paid_at_invoice) + '</td>' +
            '<td>' + money(c.total_settled) + '</td>' +
            '<td>' + money(c.total_remaining) + '</td>' +
            '<td>' + (canViewDetails
              ? '<button type="button" class="btn btn-sm btn-dashboard btn-info btn-open-profile" data-id="' + c.customer_id + '" data-name="' + esc(c.customer_name) + '">تفاصيل</button>'
              : '<span class="text-muted">—</span>') + '</td>' +
            '</tr>'
          );
        }).join('');

        customersTbody.querySelectorAll('.btn-open-profile').forEach(function (btn) {
          btn.addEventListener('click', function () {
            currentCustomerId = parseInt(btn.getAttribute('data-id'), 10);
            currentCustomerName = btn.getAttribute('data-name') || '';
            loadCustomerInvoices();
          });
        });
      })
      .catch(function () {
        customersTbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">فشل تحميل العملاء.</td></tr>';
      });
  }

  loadCreditCustomersAccess().finally(function () {
    loadCustomers();
  });
})();

