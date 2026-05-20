(function () {
  var dateInput = document.getElementById('shift-date');
  var btnLoad = document.getElementById('btn-load-shift');
  var msgEl = document.getElementById('shift-msg');
  var paymentsTbody = document.getElementById('shift-payments-tbody');
  var closuresTbody = document.getElementById('shift-closures-tbody');
  var totalInvoicesEl = document.getElementById('shift-total-invoices');
  var grandTotalAmountEl = document.getElementById('shift-grand-total-amount');
  var btnPrint = document.getElementById('btn-print-shift');
  var receivePaymentMethodEl = document.getElementById('receive-payment-method');
  var receiveRequiredAmountEl = document.getElementById('receive-required-amount');
  var receiveEmployeeEl = document.getElementById('receive-employee');
  var receivePaidAmountEl = document.getElementById('receive-paid-amount');
  var receiveRemainingAmountEl = document.getElementById('receive-remaining-amount');
  var receiveMsgEl = document.getElementById('receive-msg');
  var btnApplyReceive = document.getElementById('btn-apply-receive');
  var shiftTabsRoot = document.getElementById('shiftTabs');
  var shiftAccess = {
    tab_payment_summary: true,
    tab_receive_amounts: true,
    tab_shift_log: true,
  };

  var lastSummary = null; // نحتفظ بآخر ملخص لتحضير الطباعة
  var employeesRates = [];

  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function showMsg(text, isError) {
    if (!msgEl) return;
    msgEl.textContent = text || '';
    msgEl.className = 'form-message mt-2 mb-0 ' + (isError ? 'error' : 'success');
  }

  function setTabVisible(tabId, panelId, allowed) {
    var tab = document.getElementById(tabId);
    var panel = document.getElementById(panelId);
    if (tab && tab.parentElement) {
      tab.parentElement.classList.toggle('d-none', !allowed);
      tab.setAttribute('aria-disabled', allowed ? 'false' : 'true');
    }
    if (panel) panel.classList.toggle('d-none', !allowed);
  }

  function activateFirstVisibleTab() {
    if (!shiftTabsRoot || !window.bootstrap || !window.bootstrap.Tab) return;
    var first = shiftTabsRoot.querySelector('button.nav-link:not([aria-disabled="true"])');
    if (first) window.bootstrap.Tab.getOrCreateInstance(first).show();
  }

  function applyTabsAccess() {
    setTabVisible('tab-shift-payments', 'panel-shift-payments', !!shiftAccess.tab_payment_summary);
    setTabVisible('tab-shift-receive', 'panel-shift-receive', !!shiftAccess.tab_receive_amounts);
    setTabVisible('tab-shift-log', 'panel-shift-log', !!shiftAccess.tab_shift_log);
    activateFirstVisibleTab();
  }

  function renderSummary(data) {
    if (!data) return;
    var payments = data.payments || [];
    lastSummary = data;
    fillReceivePaymentMethods();

    // طرق الدفع
    if (paymentsTbody) {
      if (!payments.length) {
        paymentsTbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">لا توجد فواتير نقطة بيع للمستخدم الحالي.</td></tr>';
      } else {
        var totalInvoices = 0;
        paymentsTbody.innerHTML = payments.map(function (p) {
          totalInvoices += p.invoices_count || 0;
          return '<tr>' +
            '<td>' + (p.payment_method_name || 'بدون تحديد') + '</td>' +
            '<td>' + (p.invoices_count || 0) + '</td>' +
            '<td>' + Number(p.total_amount || 0).toFixed(2) + '</td>' +
            '</tr>';
        }).join('');
        if (totalInvoicesEl) totalInvoicesEl.textContent = totalInvoices;
      }
    }

    if (grandTotalAmountEl) {
      var ta = data.totals && data.totals.total_amount != null ? Number(data.totals.total_amount) : 0;
      grandTotalAmountEl.textContent = ta.toFixed(2);
    }
  }

  function showReceiveMsg(text, isError) {
    if (!receiveMsgEl) return;
    receiveMsgEl.textContent = text || '';
    receiveMsgEl.className = 'form-message mt-3 mb-0 ' + (isError ? 'error' : 'success');
  }

  function fillReceivePaymentMethods() {
    if (!receivePaymentMethodEl) return;
    var payments = lastSummary && lastSummary.payments ? lastSummary.payments : [];
    receivePaymentMethodEl.innerHTML = '<option value="">— اختر طريقة الدفع —</option>' +
      payments.map(function (p) {
        var key = p.payment_method_id == null ? 'null' : String(p.payment_method_id);
        return '<option value="' + key + '">' + (p.payment_method_name || 'بدون تحديد') + '</option>';
      }).join('');
    if (receiveRequiredAmountEl) receiveRequiredAmountEl.value = '0';
    if (receiveRemainingAmountEl) receiveRemainingAmountEl.value = '0.00';
  }

  function fillEmployees() {
    if (!receiveEmployeeEl) return;
    receiveEmployeeEl.innerHTML = '<option value="">— اختر الموظف —</option>' +
      employeesRates.map(function (u, idx) {
        var name = (u.full_name || u.username || 'موظف');
        return '<option value="' + idx + '">' + name + '</option>';
      }).join('');
  }

  function loadEmployees() {
    if (!shiftAccess.tab_receive_amounts) return;
    fetch('/api/pos-shift-employees', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        employeesRates = res.data;
        fillEmployees();
      })
      .catch(function () {});
  }

  function updateRequiredFromMethod() {
    if (!receivePaymentMethodEl || !receiveRequiredAmountEl) return;
    var methodKey = receivePaymentMethodEl.value;
    var payments = lastSummary && lastSummary.payments ? lastSummary.payments : [];
    var paymentItem = payments.find(function (p) {
      var key = p.payment_method_id == null ? 'null' : String(p.payment_method_id);
      return key === methodKey;
    });
    if (!paymentItem) {
      receiveRequiredAmountEl.value = '0';
      if (receiveRemainingAmountEl) receiveRemainingAmountEl.value = '0.00';
      return;
    }
    // المطلوب = إجمالي المبلغ المتبقي حسب طريقة الدفع المختارة
    var required = Number(paymentItem.total_amount || 0);
    receiveRequiredAmountEl.value = required.toFixed(2);
    if (receiveRemainingAmountEl) receiveRemainingAmountEl.value = required.toFixed(2);
  }

  function applyReceive() {
    var methodKey = receivePaymentMethodEl ? receivePaymentMethodEl.value : '';
    var employeeIdx = receiveEmployeeEl ? parseInt(receiveEmployeeEl.value, 10) : NaN;
    var paidAmount = receivePaidAmountEl ? Number(receivePaidAmountEl.value || 0) : 0;
    var payments = lastSummary && lastSummary.payments ? lastSummary.payments : [];
    var paymentItem = payments.find(function (p) {
      var key = p.payment_method_id == null ? 'null' : String(p.payment_method_id);
      return key === methodKey;
    });

    if (!paymentItem) {
      showReceiveMsg('اختر طريقة الدفع أولاً.', true);
      return;
    }
    if (Number.isNaN(employeeIdx) || !employeesRates[employeeIdx]) {
      showReceiveMsg('اختر الموظف أولاً.', true);
      return;
    }
    if (Number.isNaN(paidAmount) || paidAmount <= 0) {
      showReceiveMsg('اكتب مبلغًا مستلمًا صحيحًا أكبر من صفر.', true);
      return;
    }

    var requiredAmount = Number(paymentItem.total_amount || 0);
    if (paidAmount > requiredAmount) {
      showReceiveMsg('المبلغ المستلم أكبر من المطلوب لهذه الطريقة.', true);
      return;
    }

    var emp = employeesRates[employeeIdx];
    var empName = (emp && (emp.full_name || emp.username)) ? (emp.full_name || emp.username) : 'الموظف';
    var payload = {
      payment_method_id: paymentItem.payment_method_id,
      employee_user_id: emp.id,
      received_amount: paidAmount,
    };
    fetch('/api/pos-shift-closures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success) {
          showReceiveMsg(res.message || 'فشل حفظ التقفيل', true);
          return;
        }
        if (receivePaidAmountEl) receivePaidAmountEl.value = '0';
        var remaining = res.data && res.data.remaining_amount != null ? Number(res.data.remaining_amount) : 0;
        if (receiveRemainingAmountEl) receiveRemainingAmountEl.value = remaining.toFixed(2);
        showReceiveMsg('تم حفظ التقفيل وخصم المبلغ بواسطة ' + empName + '.', false);
        loadShift();
        loadShiftClosures();
      })
      .catch(function () {
        showReceiveMsg('خطأ في الاتصال أثناء حفظ التقفيل', true);
      });
  }

  function formatClosureDateTime(isoOrStr) {
    if (isoOrStr == null || isoOrStr === '') return '—';
    var d = new Date(isoOrStr);
    if (isNaN(d.getTime())) {
      return String(isoOrStr);
    }
    var day = String(d.getDate()).padStart(2, '0');
    var mo = String(d.getMonth() + 1).padStart(2, '0');
    var y = d.getFullYear();
    var h = String(d.getHours()).padStart(2, '0');
    var mi = String(d.getMinutes()).padStart(2, '0');
    var s = String(d.getSeconds()).padStart(2, '0');
    return day + '/' + mo + '/' + y + ' ' + h + ':' + mi + ':' + s;
  }

  function loadShiftClosures() {
    if (!shiftAccess.tab_shift_log) return;
    if (!closuresTbody) return;
    closuresTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">جاري تحميل سجل التقفيل...</td></tr>';
    fetch('/api/pos-shift-closures', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data || !res.data.length) {
          closuresTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">لا توجد عمليات تقفيل بعد.</td></tr>';
          return;
        }
        closuresTbody.innerHTML = res.data.map(function (row) {
          var dateStr = formatClosureDateTime(row.created_at);
          var titleEsc = String(row.created_at || '').replace(/"/g, '&quot;');
          return '<tr>' +
            '<td>' + row.id + '</td>' +
            '<td class="text-nowrap" dir="ltr" title="' + titleEsc + '">' + dateStr + '</td>' +
            '<td>' + (row.closed_by_name || '—') + '</td>' +
            '<td>' + (row.payment_method_name || 'بدون تحديد') + '</td>' +
            '<td>' + (row.employee_name || '—') + '</td>' +
            '<td>' + Number(row.required_amount || 0).toFixed(2) + '</td>' +
            '<td>' + Number(row.received_amount || 0).toFixed(2) + '</td>' +
            '<td>' + Number(row.remaining_amount || 0).toFixed(2) + '</td>' +
            '</tr>';
        }).join('');
      })
      .catch(function () {
        closuresTbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">فشل تحميل سجل التقفيل.</td></tr>';
      });
  }

  function loadShift() {
    if (!shiftAccess.tab_payment_summary) return;
    // حالياً الملخص لكل الأيام، لذلك قيمة التاريخ لا تؤثر
    var d = dateInput && dateInput.value ? dateInput.value : todayStr();
    showMsg('جاري تحميل ملخص الشفت لكل الأيام...', false);
    if (btnLoad) {
      btnLoad.disabled = true;
      btnLoad.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>جاري التحميل...';
    }
    fetch('/api/pos-shift-summary', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success) {
          showMsg(res.message || 'فشل جلب الملخص', true);
          return;
        }
        showMsg('تم جلب الملخص لكل الأيام', false);
        renderSummary(res.data);
      })
      .catch(function () {
        showMsg('خطأ في الاتصال بالخادم', true);
      })
      .finally(function () {
        if (btnLoad) {
          btnLoad.disabled = false;
          btnLoad.innerHTML = '<i class="fas fa-sync me-1"></i>عرض الملخص';
        }
      });
  }

  if (btnLoad) {
    btnLoad.addEventListener('click', loadShift);
  }
  if (receivePaymentMethodEl) {
    receivePaymentMethodEl.addEventListener('change', function () {
      updateRequiredFromMethod();
      showReceiveMsg('', false);
    });
  }
  if (btnApplyReceive) {
    btnApplyReceive.addEventListener('click', applyReceive);
  }

  function printShift() {
    if (!lastSummary || !lastSummary.payments || !lastSummary.payments.length) {
      showMsg('لا يوجد ملخص جاهز للطباعة. اضغط "عرض الملخص" أولاً.', true);
      return;
    }
    var payments = lastSummary.payments;
    var totals = lastSummary.totals || {};
    var totalInvoices = payments.reduce(function (sum, p) {
      return sum + (p.invoices_count || 0);
    }, 0);
    var win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      showMsg('تعذّر فتح نافذة الطباعة. تحقق من إعدادات المتصفح.', true);
      return;
    }
    var html =
      '<!DOCTYPE html>' +
      '<html lang="ar" dir="rtl">' +
      '<head>' +
      '<meta charset="UTF-8">' +
      '<title>طباعة ملخص تقفيل الخزن</title>' +
      '<link rel="stylesheet" href="/vendor/bootstrap/dist/css/bootstrap.min.css">' +
      '<style>body{padding:20px;background:#f8f9fa;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}h1{font-size:1.4rem;margin-bottom:1rem}table{background:#fff}</style>' +
      '</head>' +
      '<body>' +
      '<h1>ملخص تقفيل الخزن حسب طرق الدفع (نقطة البيع فقط)</h1>' +
      '<table class="table table-bordered table-sm">' +
      '<thead class="table-dark"><tr>' +
      '<th>طريقة الدفع</th>' +
      '<th>عدد الفواتير</th>' +
      '<th>إجمالي المبلغ</th>' +
      '</tr></thead><tbody>';
    payments.forEach(function (p) {
      html +=
        '<tr>' +
        '<td>' + (p.payment_method_name || 'بدون تحديد') + '</td>' +
        '<td>' + (p.invoices_count || 0) + '</td>' +
        '<td>' + Number(p.total_amount || 0).toFixed(2) + '</td>' +
        '</tr>';
    });
    html +=
      '</tbody>' +
      '<tfoot>' +
      '<tr class="table-secondary">' +
      '<th>الإجمالي</th>' +
      '<th>' + totalInvoices + '</th>' +
      '<th>' + Number(totals.total_amount || 0).toFixed(2) + '</th>' +
      '</tr>' +
      '</tfoot>' +
      '</table>' +
      '</body></html>';
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  if (btnPrint) {
    btnPrint.addEventListener('click', printShift);
  }

  // تحميل ملخص اليوم تلقائياً عند فتح الصفحة
  fetch('/api/shift-close-access', { credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res && res.success && res.data) {
        shiftAccess = {
          tab_payment_summary: !!res.data.tab_payment_summary,
          tab_receive_amounts: !!res.data.tab_receive_amounts,
          tab_shift_log: !!res.data.tab_shift_log,
        };
      }
    })
    .catch(function () {})
    .finally(function () {
      applyTabsAccess();
      loadEmployees();
      loadShift();
      loadShiftClosures();
    });
})();

