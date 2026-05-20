(function () {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  var content = document.getElementById('content');
  var btnPrint = document.getElementById('btn-print');

  function render(inv, company) {
    var companyName = company && company.name ? company.name : '';
    var companyLogo = company && company.logo_url ? company.logo_url : null;
    if (companyName) {
      document.title = companyName;
    } else {
      document.title = 'فاتورة شراء';
    }
    var wm = document.getElementById('watermark');
    if (wm && companyLogo) {
      wm.innerHTML = '<img src="' + companyLogo + '" alt="شعار المنشأة">';
      wm.style.display = 'flex';
    }
    var d = inv.created_at ? new Date(inv.created_at) : null;
    var dateStr = d && !isNaN(d.getTime()) ? d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    var totalPieces = 0;
    var rows = (inv.items || []).map(function (it) {
      totalPieces += Number(it.quantity) || 0;
      return '<tr><td>' + (it.product_name || '—') + '</td><td>' + (it.barcode || '—') + '</td><td>' + it.quantity + '</td><td>' + Number(it.unit_purchase_price).toFixed(2) + '</td><td>' + Number(it.line_total).toFixed(2) + '</td></tr>';
    }).join('');
    content.innerHTML =
      '<div class="invoice-header">' +
      '<div class="invoice-header-logo">' +
      (companyLogo ? '<img src="' + companyLogo + '" alt="شعار المنشأة">' : '') +
      '</div>' +
      '<div class="invoice-header-center">' +
      (companyName ? '<div class="company-name">' + companyName + '</div>' : '') +
      '<h1 class="invoice-title">فاتورة شراء #' + inv.id + '</h1>' +
      '</div>' +
      '<div class="invoice-header-logo"></div>' +
      '</div>' +
      '<div class="meta">' +
      '<span><strong>التاريخ:</strong> ' + dateStr + '</span>' +
      '<span><strong>المورد:</strong> ' + (inv.supplier_name || 'بدون مورد') + '</span>' +
      '<span><strong>المخزن:</strong> ' + (inv.warehouse_name || '—') + '</span>' +
      (inv.payment_method_name ? '<span><strong>طريقة الدفع:</strong> ' + inv.payment_method_name + '</span>' : '') +
      '</div>' +
      '<table><thead><tr><th>المنتج</th><th>الباركود</th><th>الكمية</th><th>سعر الشراء</th><th>المجموع</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="totals">' +
      '<div class="row"><span class="label">المبلغ الإجمالي:</span><span>' + Number(inv.total_amount).toFixed(2) + '</span></div>' +
      '<div class="row"><span class="label">المبلغ المدفوع:</span><span>' + Number(inv.amount_paid).toFixed(2) + '</span></div>' +
      '<div class="row"><span class="label">المتبقي:</span><span>' + Number(inv.total_amount - inv.amount_paid).toFixed(2) + '</span></div>' +
      '<div class="row"><span class="label">إجمالي عدد القطع:</span><span>' + Math.round(totalPieces) + '</span></div>' +
      '</div>' +
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
    fetch('/api/purchase-invoices/' + id, { credentials: 'same-origin' }).then(function (r) { return r.json(); }),
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
