(function () {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  var infoEl = document.getElementById('supplier-info');
  var tbody = document.getElementById('statement-tbody');
  var summary = document.getElementById('statement-summary');
  var btnPrint = document.getElementById('btn-print-statement');
  var btnPay = document.getElementById('btn-supplier-pay');
  var btnBack = document.getElementById('btn-back');
  var paymentsTbody = document.getElementById('payments-tbody');
  var searchInput = document.getElementById('search-invoice');
  var btnSearch = document.getElementById('btn-search-invoice');
  var btnClearSearch = document.getElementById('btn-clear-search');

  function formatDate(d) {
    if (!d) return '—';
    var dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function load() {
    if (!id) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">معرف المورد غير صالح.</td></tr>';
      return;
    }
    fetch('/api/suppliers/' + id + '/statement', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) {
          tbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">فشل تحميل كشف الحساب.</td></tr>';
          return;
        }
        var s = res.data.supplier;
        if (infoEl) {
          if (s) {
            infoEl.innerHTML = '<span>المورد: ' + (s.name || '—') + '</span>' + (s.phone ? '<span>الهاتف: ' + s.phone + '</span>' : '');
          } else {
            infoEl.textContent = 'لا يوجد بيانات لهذا المورد.';
          }
        }
        var m = res.data.movements || [];
        if (!m.length) {
          tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">لا توجد حركات مسجلة لهذا المورد.</td></tr>';
        } else {
          var totalDebitRows = 0;          // إجمالي علينا (من الحركات)
          var totalCreditRows = 0;         // إجمالي له عندنا (من الحركات)
          var totalPaidToSupplier = 0;     // ما تم تسديده للمورد
          var totalCollectedFromSupplier = 0; // ما تم تحصيله من المورد

          tbody.innerHTML = m.map(function (row) {
            var isPurchase = row.kind === 'invoice';
            var isSale = row.kind === 'sale';
            var isPayment = row.kind === 'payment';
            var isInvoicePayment = row.kind === 'invoice_payment';
            var typeLabel = isPurchase ? 'فاتورة شراء' : (isSale ? 'فاتورة بيع' : 'تسديد');
            var rowClass = isPurchase ? 'invoice-row' : (isSale ? 'sale-row' : 'payment-row');
            var idText = (isPurchase || isSale) ? row.id : '—';
            var productsCount = (isPurchase || isSale) ? row.products_count : 0;
            var totalTxt = (isPurchase || isSale) ? Number(row.total_amount).toFixed(2) : '0.00';
            var paidTxt = (isPurchase || isSale) ? Number(row.amount_paid).toFixed(2) : '0.00';

            totalDebitRows += Number(row.debit) || 0;
            totalCreditRows += Number(row.credit) || 0;
            if (isInvoicePayment) {
              totalPaidToSupplier += Number(row.pay_amount) || 0;
            } else if (isPayment) {
              if (row.pay_direction === 'to_supplier') totalPaidToSupplier += Number(row.pay_amount) || 0;
              if (row.pay_direction === 'from_supplier') totalCollectedFromSupplier += Number(row.pay_amount) || 0;
            }

            var detailsBtn = isPurchase
              ? '<button type="button" class="btn btn-sm btn-inv-details-from-supplier" data-kind="purchase" data-id="' + row.id + '"><i class="fas fa-file-invoice me-1"></i>طباعة</button>'
              : (isSale ? '<button type="button" class="btn btn-sm btn-inv-details-from-supplier" data-kind="sale" data-id="' + row.id + '"><i class="fas fa-print me-1"></i>طباعة</button>' : '<span class="text-muted">—</span>');
            return '<tr class="' + rowClass + '" data-kind="' + row.kind + '" data-id="' + ((isPurchase || isSale) ? row.id : '') + '">' +
              '<td>' + typeLabel + '</td><td>' + idText + '</td><td>' + formatDate(row.created_at) + '</td><td>' + productsCount + '</td><td>' + totalTxt + '</td><td>' + paidTxt + '</td>' +
              '<td>' + Number(row.debit).toFixed(2) + '</td><td>' + Number(row.credit).toFixed(2) + '</td><td>' + Number(row.balance_after).toFixed(2) + '</td><td>' + (row.user_name || '—') + '</td>' +
              '<td class="no-print">' + detailsBtn + '</td></tr>';
          }).join('') +
          '<tr class="payment-row">' +
            '<td><strong>الإجماليات</strong></td>' +
            '<td>—</td>' +
            '<td>—</td>' +
            '<td>—</td>' +
            '<td>—</td>' +
            '<td>—</td>' +
            '<td><strong>' + totalDebitRows.toFixed(2) + '</strong></td>' +
            '<td><strong>' + totalCreditRows.toFixed(2) + '</strong></td>' +
            '<td><strong>' + (Number((res.data.totals && res.data.totals.balance) || 0)).toFixed(2) + '</strong></td>' +
            '<td>—</td>' +
            '<td class="no-print">—</td>' +
          '</tr>' +
          '<tr class="payment-row">' +
            '<td colspan="11"><strong>السداد:</strong> دفعت للمورد = ' + totalPaidToSupplier.toFixed(2) +
            ' | المورد دفع لي = ' + totalCollectedFromSupplier.toFixed(2) + '</td>' +
          '</tr>';
          tbody.querySelectorAll('.btn-inv-details-from-supplier').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var invId = this.getAttribute('data-id');
              var kind = this.getAttribute('data-kind');
              if (!invId) return;
              var url = kind === 'sale' ? '/print-sale-invoice.html?id=' + invId : '/print-purchase-invoice.html?id=' + invId;
              window.open(url, '_blank', 'width=800,height=900');
            });
          });
        }
        if (paymentsTbody) {
          var payments = m.filter(function (row) { return row.kind === 'payment' || row.kind === 'invoice_payment'; });
          if (!payments.length) {
            paymentsTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">لا توجد مدفوعات بعد.</td></tr>';
          } else {
            paymentsTbody.innerHTML = payments.map(function (row) {
              var isInvoicePayment = row.kind === 'invoice_payment';
              var isToSupplier = row.pay_direction === 'to_supplier';
              var typeLabel = isInvoicePayment
                ? 'دفعة فاتورة شراء #' + row.id
                : (isToSupplier ? 'أنا دفعت للمورد' : 'المورد دفع لي');
              var cls = isToSupplier ? 'amount-out' : 'amount-in';
              return '<tr><td>' + formatDate(row.created_at) + '</td><td>' + typeLabel + '</td><td class="' + cls + '">' + Number(row.pay_amount).toFixed(2) + '</td><td>' + (row.note || '—') + '</td><td>' + (row.user_name || '—') + '</td></tr>';
            }).join('');
          }
        }
        if (summary && res.data.totals) {
          var t = res.data.totals;
          var bal = Number(t.balance) || 0;
          var debitVal = bal > 0 ? bal : 0;
          var creditVal = bal < 0 ? -bal : 0;
          var totalSettlement = (m || []).reduce(function (acc, row) {
            if (row.kind === 'invoice_payment') {
              return acc + (Number(row.pay_amount) || 0);
            }
            if (row.kind === 'payment') {
              return acc + (Number(row.pay_amount) || 0);
            }
            return acc;
          }, 0);
          var balanceClass = 'badge-balance-neutral';
          if (bal > 0) balanceClass = 'badge-balance-positive';
          else if (bal < 0) balanceClass = 'badge-balance-negative';
          summary.innerHTML =
            '<span class="badge badge-settlement">إجمالي السداد: ' + totalSettlement.toFixed(2) + '</span>' +
            '<span class="badge badge-debit">إجمالي مدين (علينا): ' + debitVal.toFixed(2) + '</span>' +
            '<span class="badge badge-credit">إجمالي دائن (له عندنا): ' + creditVal.toFixed(2) + '</span>' +
            '<span class="badge ' + balanceClass + '">الرصيد الحالي: ' + bal.toFixed(2) + '</span>';
        }
      })
      .catch(function () {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">فشل الاتصال بالخادم.</td></tr>';
      });
  }

  if (btnPrint) btnPrint.addEventListener('click', function () { window.print(); });
  if (btnBack) {
    btnBack.addEventListener('click', function () {
      if (window.history.length > 1) window.history.back();
      else window.location.href = '/warehouses';
    });
  }
  if (btnPay) {
    btnPay.addEventListener('click', function () {
      var modalEl = document.getElementById('modal-supplier-pay');
      if (modalEl && window.bootstrap && bootstrap.Modal) {
        document.getElementById('pay-amount').value = '';
        document.getElementById('pay-note').value = '';
        document.getElementById('pay-msg').textContent = '';
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    });
  }
  var btnSavePay = document.getElementById('btn-save-pay');
  if (btnSavePay) {
    btnSavePay.addEventListener('click', function () {
      var amountEl = document.getElementById('pay-amount');
      var dirEl = document.getElementById('pay-direction');
      var noteEl = document.getElementById('pay-note');
      var msgEl = document.getElementById('pay-msg');
      var amount = parseFloat(amountEl.value || '0');
      var dir = dirEl.value;
      var note = (noteEl.value || '').trim();
      if (!amount || amount <= 0 || isNaN(amount)) {
        if (msgEl) { msgEl.textContent = 'أدخل مبلغاً صحيحاً أكبر من صفر.'; msgEl.className = 'form-message mt-1 mb-0 error'; }
        return;
      }
      fetch('/api/suppliers/' + id + '/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ amount: amount, direction: dir, note: note || null })
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.success) {
            if (msgEl) { msgEl.textContent = res.message || 'فشل تسجيل الحركة'; msgEl.className = 'form-message mt-1 mb-0 error'; }
            return;
          }
          if (msgEl) { msgEl.textContent = res.message || 'تم تسجيل الحركة بنجاح'; msgEl.className = 'form-message mt-1 mb-0 success'; }
          var modalEl = document.getElementById('modal-supplier-pay');
          if (modalEl && window.bootstrap && bootstrap.Modal) {
            var m = bootstrap.Modal.getInstance(modalEl);
            if (m) m.hide();
          }
          load();
        })
        .catch(function () {
          if (msgEl) { msgEl.textContent = 'خطأ في الاتصال بالخادم'; msgEl.className = 'form-message mt-1 mb-0 error'; }
        });
    });
  }
  function applySearch() {
    if (!tbody) return;
    var term = (searchInput && searchInput.value ? searchInput.value.trim() : '');
    var rows = tbody.querySelectorAll('tr[data-kind]');
    if (!term) { rows.forEach(function (tr) { tr.style.display = ''; }); return; }
    rows.forEach(function (tr) {
      var kind = tr.getAttribute('data-kind');
      var idVal = tr.getAttribute('data-id') || '';
      if ((kind === 'invoice' || kind === 'sale') && idVal && idVal.indexOf(term) !== -1) tr.style.display = '';
      else if (kind === 'payment') tr.style.display = 'none';
      else tr.style.display = 'none';
    });
  }
  if (btnSearch) btnSearch.addEventListener('click', applySearch);
  if (btnClearSearch) btnClearSearch.addEventListener('click', function () { if (searchInput) searchInput.value = ''; applySearch(); });
  if (searchInput) searchInput.addEventListener('keyup', function (e) { if (e.key === 'Enter') applySearch(); });
  load();
})();
