(function () {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  var content = document.getElementById('content');
  var btnPrint = document.getElementById('btn-print');

  function render(inv, company) {
    var companyName = company && company.name ? company.name : '';
    var companyLogo = company && company.logo_url ? company.logo_url : null;
    var wm = document.getElementById('watermark');
    if (wm && companyLogo) {
      wm.innerHTML = '<img src="' + companyLogo + '" alt="شعار المنشأة">';
      wm.style.display = 'flex';
    }
    if (companyName) {
      document.title = companyName;
    } else {
      document.title = 'فاتورة بيع';
    }
    var invoiceDateStr = '—';
    if (inv.invoice_date) {
      var idt = new Date(inv.invoice_date + 'T12:00:00');
      if (!isNaN(idt.getTime())) invoiceDateStr = idt.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    } else if (inv.created_at) {
      var cd = new Date(inv.created_at);
      if (!isNaN(cd.getTime())) invoiceDateStr = cd.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    var enteredAt = inv.entered_at || inv.created_at;
    var enteredStr = enteredAt ? (new Date(enteredAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })) : '—';
    var totalBefore = inv.total_before_discount != null ? Number(inv.total_before_discount) : Number(inv.total_amount);
    var total = Number(inv.total_amount);
    var paid = Number(inv.amount_paid);
    var diff = total - paid;
    var itemsCount = inv.total_items != null ? Number(inv.total_items) : 0;
    var discountValue = inv.discount_value != null ? Number(inv.discount_value) : 0;
    var discountPercent = inv.discount_percent != null ? Number(inv.discount_percent) : 0;
    var rows = (inv.items || []).map(function (it) {
      return '<tr><td>' + (it.product_name || '—') + '</td><td>' + (it.barcode || '—') + '</td><td>' + it.quantity + '</td><td>' + Number(it.unit_sale_price).toFixed(2) + '</td><td>' + Number(it.line_total).toFixed(2) + '</td></tr>';
    }).join('');
    var noteText = diff > 0 ? 'العميل مدين لنا: ' + diff.toFixed(2) : (diff < 0 ? 'له مال عندنا (تقدم): ' + Math.abs(diff).toFixed(2) : 'تم التسوية.');
    content.innerHTML =
      '<div class="invoice-header">' +
      '<div class="invoice-header-logo">' +
      (companyLogo ? '<img src="' + companyLogo + '" alt="شعار المنشأة">' : '') +
      '</div>' +
      '<div class="invoice-header-center">' +
      (companyName ? '<div class="company-name">' + companyName + '</div>' : '') +
      '<h1 class="invoice-title">فاتورة بيع #' + inv.id + '</h1>' +
      '</div>' +
      '<div class="invoice-header-logo"></div>' +
      '</div>' +
      '<div class="meta">' +
      '<span><strong>تاريخ الفاتورة:</strong> ' + invoiceDateStr + '</span>' +
      '<span><strong>تاريخ الإدخال:</strong> ' + enteredStr + '</span>' +
      '<span><strong>المخزن:</strong> ' + (inv.warehouse_name || '—') + '</span>' +
      '<span><strong>العميل:</strong> ' + (inv.customer_name || 'عميل نقدي') + '</span>' +
      '<span><strong>الهاتف:</strong> ' + (inv.customer_phone || '—') + '</span>' +
      '<span><strong>طريقة الدفع:</strong> ' + (inv.payment_method_name || '—') + '</span>' +
      '</div>' +
      '<table><thead><tr><th>المنتج</th><th>الباركود</th><th>الكمية</th><th>سعر البيع</th><th>المجموع</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="totals">' +
      '<div class="row"><span class="label">إجمالي:</span><span>' + total.toFixed(2) + '</span></div>' +
      '<div class="row"><span class="label">إجمالي عدد القطع:</span><span>' + Math.round(itemsCount) + '</span></div>' +
      '</div>' +
      '<p class="note"><strong>ملاحظة:</strong> ' + noteText + '</p>' +
      '<p class="footer-note">' +
      'هذه الفاتورة صادرة من نظام محاسبي ذكي تم تطويره بواسطة <strong>SB Smart</strong> المتخصصة في حلول البرمجيات و IT.' +
      ' للتعرف أكثر: <strong>sbsmart.com</strong>' +
      '</p>';
  }

  function doPrint() {
    window.print();
  }

  if (btnPrint) btnPrint.addEventListener('click', doPrint);

  if (!id) {
    content.innerHTML = '<p class="msg">معرف الفاتورة غير صالح.</p>';
    return;
  }

  Promise.all([
    fetch('/api/sale-invoices/' + id, { credentials: 'same-origin' }).then(function (r) { return r.json(); }),
    fetch('/api/company-profile', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).catch(function () { return { success: false }; })
  ])
    .then(function (results) {
      var invRes = results[0];
      var companyRes = results[1];
      if (invRes.success && invRes.data) {
        var companyData = companyRes && companyRes.success ? (companyRes.data || null) : null;
        render(invRes.data, companyData);
        setTimeout(doPrint, 400);
      } else {
        content.innerHTML = '<p class="msg">' + (invRes.message || 'لم يتم العثور على الفاتورة.') + '</p>';
      }
    })
    .catch(function () {
      content.innerHTML = '<p class="msg">فشل تحميل الفاتورة. تأكد من تسجيل الدخول.</p>';
    });
})();
