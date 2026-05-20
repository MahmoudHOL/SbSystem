/**
 * POS credit profiles and per-invoice settlements
 */
(function () {
  var tabCredit = document.getElementById('tab-pos-credit');
  var customersTbody = document.getElementById('pos-credit-customers-tbody');
  var invoicesWrap = document.getElementById('pos-credit-invoices-wrap');
  var invoicesTbody = document.getElementById('pos-credit-invoices-tbody');
  var customerTitle = document.getElementById('pos-credit-customer-title');
  var creditMsg = document.getElementById('pos-credit-msg');

  var loaded = false;
  var currentCustomerId = null;
  var currentCustomerName = '';

  function money(v) {
    return Number(v || 0).toFixed(2);
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function showMsg(text, isError) {
    if (!creditMsg) return;
    creditMsg.textContent = text || '';
    creditMsg.className = 'form-message mt-2 mb-0 ' + (isError ? 'error' : 'success');
  }

  function loadCreditCustomers() {
    if (!customersTbody) return;
    customersTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/credit-customers/profile', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !Array.isArray(res.data) || !res.data.length) {
          customersTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">لا يوجد عملاء عليهم أجل حالياً.</td></tr>';
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
            '<td><button type="button" class="btn btn-sm btn-dashboard btn-info btn-open-credit-profile" data-id="' + c.customer_id + '" data-name="' + esc(c.customer_name) + '">فتح الملف</button></td>' +
            '</tr>'
          );
        }).join('');
        customersTbody.querySelectorAll('.btn-open-credit-profile').forEach(function (btn) {
          btn.addEventListener('click', function () {
            currentCustomerId = parseInt(btn.getAttribute('data-id'), 10);
            currentCustomerName = btn.getAttribute('data-name') || '';
            loadCreditInvoicesForCustomer();
          });
        });
      })
      .catch(function () {
        customersTbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">فشل تحميل ملف العملاء.</td></tr>';
      });
  }

  function settleFromInvoice(creditInvoiceId, amount) {
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
        note: 'سداد من شاشة عميل الأجل',
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success) {
          showMsg(res.message || 'فشل تسجيل السداد', true);
          return;
        }
        showMsg(res.message || 'تم تسجيل السداد');
        loadCreditInvoicesForCustomer();
        loadCreditCustomers();
      })
      .catch(function () {
        showMsg('خطأ في الاتصال أثناء تسجيل السداد', true);
      });
  }

  function loadCreditInvoicesForCustomer() {
    if (!currentCustomerId || !invoicesTbody) return;
    if (customerTitle) customerTitle.textContent = 'العميل: ' + currentCustomerName;
    if (invoicesWrap) invoicesWrap.classList.remove('d-none');
    invoicesTbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/credit-customers/' + encodeURIComponent(currentCustomerId) + '/invoices', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !Array.isArray(res.data) || !res.data.length) {
          invoicesTbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">لا توجد فواتير أجل مفتوحة لهذا العميل.</td></tr>';
          return;
        }
        var totalRemaining = res.data.reduce(function (s, inv) { return s + Number(inv.remaining_amount || 0); }, 0);
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
            '<td><button type="button" class="btn btn-sm btn-outline-info btn-show-invoice-details" data-invoice-id="' + inv.sale_invoice_id + '">تفاصيل الفاتورة</button></td>' +
            '<td>' + (Number(inv.remaining_amount || 0) > 0
              ? '<div class="d-flex align-items-center gap-1"><input type="number" class="form-control form-control-sm settle-amount" min="0.01" step="0.01" value="' + money(inv.remaining_amount) + '" style="width:90px;"><button type="button" class="btn btn-sm btn-outline-light btn-settle-invoice" data-id="' + inv.id + '">سداد</button></div>'
              : '<span class="text-muted">—</span>') + '</td>' +
            '</tr>'
          );
        }).join('');
        invoicesTbody.querySelectorAll('.btn-show-invoice-details').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var invoiceId = parseInt(btn.getAttribute('data-invoice-id'), 10);
            if (invoiceId && typeof window.openPosSaleDetails === 'function') {
              window.openPosSaleDetails(invoiceId);
            }
          });
        });
        invoicesTbody.querySelectorAll('.btn-settle-invoice').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = parseInt(btn.getAttribute('data-id'), 10);
            var row = btn.closest('tr');
            var amountInput = row ? row.querySelector('.settle-amount') : null;
            var amount = amountInput ? Number(amountInput.value) : NaN;
            if (id) settleFromInvoice(id, amount);
          });
        });
      })
      .catch(function () {
        invoicesTbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">فشل تحميل الفواتير.</td></tr>';
      });
  }

  if (tabCredit) {
    tabCredit.addEventListener('shown.bs.tab', function () {
      if (!loaded) loaded = true;
      loadCreditCustomers();
    });
  }
})();

