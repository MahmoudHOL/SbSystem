/**
 * تاب فواتير - فاتورة شراء (باركود، سلة، مورد، تسجيل)
 */
(function () {
  var invBarcode = document.getElementById('inv-barcode');
  var btnLookupBarcode = document.getElementById('btn-lookup-barcode');
  var invManualRow = document.getElementById('inv-manual-row');
  var invName = document.getElementById('inv-name');
  var invManualBarcode = document.getElementById('inv-manual-barcode');
  var invQty = document.getElementById('inv-qty');
  var invPurchase = document.getElementById('inv-purchase');
  var invSale = document.getElementById('inv-sale');
  var btnAddToCart = document.getElementById('btn-add-to-cart');
  var invLookupMsg = document.getElementById('inv-lookup-msg');
  var invWarehouse = document.getElementById('inv-warehouse');
  var invCartTbody = document.getElementById('inv-cart-tbody');
  var invCartEmpty = document.getElementById('inv-cart-empty');
  var invTotalPieces = document.getElementById('inv-total-pieces');
  var invTotalAmount = document.getElementById('inv-total-amount');
  var invSupplier = document.getElementById('inv-supplier');
  var invAmountPaid = document.getElementById('inv-amount-paid');
  var invPaymentMethod = document.getElementById('inv-payment-method');
  var btnSubmitPurchase = document.getElementById('btn-submit-purchase');
  var invSubmitMsg = document.getElementById('inv-submit-msg');

  var purchaseCart = [];
  function normalizeBarcode(value) {
    return String(value || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 12);
  }

  function showLookupMsg(t, err) {
    if (!invLookupMsg) return;
    invLookupMsg.textContent = t;
    invLookupMsg.className = 'form-message mt-2 mb-0 ' + (err ? 'error' : 'success');
  }

  function renderCart() {
    if (!invCartTbody) return;
    var totalDisplay = document.getElementById('inv-total-display');
    if (purchaseCart.length === 0) {
      invCartTbody.innerHTML = '';
      if (invCartEmpty) invCartEmpty.classList.remove('d-none');
      if (invTotalPieces) invTotalPieces.textContent = '0';
      if (invTotalAmount) invTotalAmount.textContent = '0.00';
      if (totalDisplay) totalDisplay.textContent = 'المجموع: 0.00';
      return;
    }
    if (invCartEmpty) invCartEmpty.classList.add('d-none');
    var totalPieces = 0;
    var totalAmount = 0;
    invCartTbody.innerHTML = purchaseCart.map(function (item, idx) {
      var lineTotal = (item.quantity * (item.purchase_price || 0));
      totalPieces += item.quantity;
      totalAmount += lineTotal;
      return '<tr data-idx="' + idx + '">' +
        '<td>' + (item.name || '—') + '</td>' +
        '<td>' + (item.barcode || '—') + '</td>' +
        '<td><div class="d-flex align-items-center gap-1 justify-content-center"><button type="button" class="btn-inv-minus">−</button><input type="number" class="invoice-qty-input inv-cart-qty" data-idx="' + idx + '" value="' + item.quantity + '" min="0.001" step="0.001"><button type="button" class="btn-inv-plus">+</button></div></td>' +
        '<td>' + Number(item.purchase_price || 0).toFixed(2) + '</td>' +
        '<td>' + Number(item.sale_price || 0).toFixed(2) + '</td>' +
        '<td>' + lineTotal.toFixed(2) + '</td>' +
        '<td><div class="d-flex gap-1 flex-wrap justify-content-center">' +
        '<button type="button" class="btn-inv-change-price" data-idx="' + idx + '">تغيير السعر</button>' +
        '<button type="button" class="btn-inv-remove inv-cart-remove" data-idx="' + idx + '">حذف</button></div></td></tr>';
    }).join('');
    if (invTotalPieces) invTotalPieces.textContent = totalPieces;
    if (invTotalAmount) invTotalAmount.textContent = totalAmount.toFixed(2);
    if (totalDisplay) totalDisplay.textContent = 'المجموع: ' + totalAmount.toFixed(2);

    invCartTbody.querySelectorAll('.inv-cart-qty').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        var v = parseFloat(this.value);
        if (!isNaN(v) && v > 0 && purchaseCart[idx]) { purchaseCart[idx].quantity = v; renderCart(); }
      });
    });
    invCartTbody.querySelectorAll('.btn-inv-plus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.closest('tr').getAttribute('data-idx'), 10);
        if (purchaseCart[idx]) { purchaseCart[idx].quantity = (purchaseCart[idx].quantity || 0) + 1; renderCart(); }
      });
    });
    invCartTbody.querySelectorAll('.btn-inv-minus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.closest('tr').getAttribute('data-idx'), 10);
        if (purchaseCart[idx]) {
          var q = purchaseCart[idx].quantity - 1;
          if (q <= 0) { purchaseCart.splice(idx, 1); } else { purchaseCart[idx].quantity = q; }
          renderCart();
        }
      });
    });
    invCartTbody.querySelectorAll('.inv-cart-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        purchaseCart.splice(idx, 1);
        renderCart();
      });
    });
    invCartTbody.querySelectorAll('.btn-inv-change-price').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        if (purchaseCart[idx] == null) return;
        var item = purchaseCart[idx];
        var modalEl = document.getElementById('modal-change-price');
        var nameEl = document.getElementById('modal-change-price-product-name');
        var purchaseInp = document.getElementById('modal-purchase-price');
        var saleInp = document.getElementById('modal-sale-price');
        if (nameEl) nameEl.textContent = item.name || '—';
        if (purchaseInp) {
          purchaseInp.value = Number(item.purchase_price || 0);
          purchaseInp.style.backgroundColor = '#1a1a1a';
          purchaseInp.style.color = '#e8e4df';
          purchaseInp.style.borderColor = 'rgba(184, 115, 51, 0.5)';
        }
        if (saleInp) {
          saleInp.value = Number(item.sale_price || 0);
          saleInp.style.backgroundColor = '#1a1a1a';
          saleInp.style.color = '#e8e4df';
          saleInp.style.borderColor = 'rgba(184, 115, 51, 0.5)';
        }
        if (modalEl) {
          modalEl.setAttribute('data-cart-idx', idx);
          var modal = window.bootstrap && bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(modalEl) : null;
          if (modal) modal.show();
        }
      });
    });
  }

  var modalChangePrice = document.getElementById('modal-change-price');
  if (modalChangePrice) {
    modalChangePrice.addEventListener('shown.bs.modal', function () {
      var box = modalChangePrice.querySelector('.modal-content');
      if (box) {
        box.style.backgroundColor = '#1a1a1a';
        box.style.color = '#e8e4df';
      }
      modalChangePrice.querySelectorAll('.form-label').forEach(function (l) {
        l.style.color = '#e8e4df';
      });
      var purchaseInp = document.getElementById('modal-purchase-price');
      var saleInp = document.getElementById('modal-sale-price');
      [purchaseInp, saleInp].forEach(function (inp) {
        if (inp) {
          inp.style.backgroundColor = '#1a1a1a';
          inp.style.color = '#e8e4df';
          inp.style.border = '1px solid rgba(184, 115, 51, 0.5)';
        }
      });
    });
  }
  var btnApplyPrice = document.getElementById('btn-apply-price');
  if (modalChangePrice && btnApplyPrice) {
    btnApplyPrice.addEventListener('click', function () {
      var idx = modalChangePrice.getAttribute('data-cart-idx');
      if (idx === null || idx === '') return;
      idx = parseInt(idx, 10);
      var purchaseInp = document.getElementById('modal-purchase-price');
      var saleInp = document.getElementById('modal-sale-price');
      var p = purchaseInp ? parseFloat(purchaseInp.value) : NaN;
      var s = saleInp ? parseFloat(saleInp.value) : NaN;
      if (!purchaseCart[idx]) return;
      if (!isNaN(p) && p >= 0) purchaseCart[idx].purchase_price = p;
      if (!isNaN(s) && s >= 0) purchaseCart[idx].sale_price = s;
      var modal = window.bootstrap && bootstrap.Modal ? bootstrap.Modal.getInstance(modalChangePrice) : null;
      if (modal) modal.hide();
      renderCart();
    });
  }

  function addToCart(item) {
    var qty = parseFloat(item.quantity) || 1;
    var barcodeNorm = normalizeBarcode(item.barcode || '') || null;
    var existing = purchaseCart.find(function (c) {
      if (item.product_id && c.product_id) return c.product_id === item.product_id;
      if (barcodeNorm && c.barcode) return normalizeBarcode(c.barcode) === barcodeNorm;
      return false;
    });
    if (existing) {
      existing.quantity = (existing.quantity || 0) + qty;
    } else {
      purchaseCart.push({
        product_id: item.product_id || null,
        name: item.name || '',
        barcode: barcodeNorm,
        quantity: qty,
        purchase_price: parseFloat(item.purchase_price) || 0,
        sale_price: parseFloat(item.sale_price) || 0
      });
    }
    renderCart();
  }

  function loadInvWarehouses() {
    if (!invWarehouse) return;
    fetch('/api/warehouses', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        invWarehouse.innerHTML = '<option value="">— اختر المخزن —</option>' + res.data.map(function (w) { return '<option value="' + w.id + '">' + (w.name || '') + '</option>'; }).join('');
      });
  }

  function loadInvSuppliers() {
    if (!invSupplier) return;
    fetch('/api/suppliers', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        invSupplier.innerHTML = '<option value="">بدون مورد</option>' + res.data.map(function (s) { return '<option value="' + s.id + '">' + (s.name || '') + '</option>'; }).join('');
      });
  }

  function loadPaymentMethods() {
    fetch('/api/payment-methods', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        var options = '<option value="">بدون تحديد</option>' +
          res.data.map(function (pm) { return '<option value="' + pm.id + '">' + (pm.name || '') + '</option>'; }).join('');
        if (invPaymentMethod) invPaymentMethod.innerHTML = options;
        if (salePaymentMethod) salePaymentMethod.innerHTML = options;
      })
      .catch(function () {});
  }

  function doLookup() {
    var b = normalizeBarcode(invBarcode && invBarcode.value || '');
    if (b.length !== 12) { showLookupMsg('الباركود 12 خانة (حروف أو أرقام)', true); return; }
    showLookupMsg('جاري البحث...', false);
    fetch('/api/products/by-barcode/' + b, { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success) { showLookupMsg(res.message || 'خطأ', true); return; }
        if (res.data) {
          addToCart({
            product_id: res.data.id,
            name: res.data.name,
            barcode: res.data.barcode,
            quantity: 1,
            purchase_price: res.data.purchase_price,
            sale_price: res.data.sale_price
          });
          showLookupMsg('تمت الإضافة للسلة', false);
          if (invBarcode) invBarcode.value = '';
        } else {
          if (invManualRow) invManualRow.classList.remove('d-none');
          if (invManualBarcode) invManualBarcode.value = b;
          if (invName) invName.value = '';
          if (invQty) invQty.value = '1';
          if (invPurchase) invPurchase.value = '0';
          if (invSale) invSale.value = '0';
          showLookupMsg('المنتج غير موجود. أضف البيانات يدوياً ثم إضافة للسلة.', false);
        }
      })
      .catch(function () { showLookupMsg('خطأ في الاتصال', true); });
  }

  if (invBarcode) {
    invBarcode.addEventListener('keypress', function (e) { if (e.key === 'Enter') { e.preventDefault(); doLookup(); } });
  }
  if (btnLookupBarcode) btnLookupBarcode.addEventListener('click', doLookup);

  if (btnAddToCart && invManualRow) {
    btnAddToCart.addEventListener('click', function () {
      var name = (invName && invName.value || '').trim();
      addToCart({
        product_id: null,
        name: name || 'منتج جديد',
        barcode: normalizeBarcode(invManualBarcode && invManualBarcode.value || '') || null,
        quantity: parseFloat(invQty && invQty.value) || 1,
        purchase_price: parseFloat(invPurchase && invPurchase.value) || 0,
        sale_price: parseFloat(invSale && invSale.value) || 0
      });
      invManualRow.classList.add('d-none');
      if (invLookupMsg) invLookupMsg.textContent = '';
    });
  }

  if (btnSubmitPurchase && invWarehouse && invSupplier && invAmountPaid) {
    btnSubmitPurchase.addEventListener('click', function () {
      var warehouseId = invWarehouse.value;
      if (!warehouseId) { if (invSubmitMsg) invSubmitMsg.textContent = 'اختر المخزن'; invSubmitMsg.className = 'form-message mt-2 mb-0 error'; return; }
      if (purchaseCart.length === 0) { if (invSubmitMsg) invSubmitMsg.textContent = 'السلة فارغة'; invSubmitMsg.className = 'form-message mt-2 mb-0 error'; return; }
      var supplierId = invSupplier.value || null;
      var amountPaid = parseFloat(invAmountPaid.value) || 0;
      var paymentMethodId = invPaymentMethod && invPaymentMethod.value ? parseInt(invPaymentMethod.value, 10) : null;
      var payload = {
        supplier_id: supplierId ? parseInt(supplierId, 10) : null,
        warehouse_id: parseInt(warehouseId, 10),
        amount_paid: amountPaid,
        payment_method_id: paymentMethodId,
        items: purchaseCart.map(function (it) {
          return {
            product_id: it.product_id || null,
            name: it.name || null,
            barcode: it.barcode || null,
            quantity: it.quantity,
            purchase_price: it.purchase_price,
            sale_price: it.sale_price
          };
        })
      };
      btnSubmitPurchase.disabled = true;
      if (invSubmitMsg) invSubmitMsg.textContent = '';
      fetch('/api/purchase-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            purchaseCart = [];
            renderCart();
            if (invAmountPaid) invAmountPaid.value = '0';
            if (invSubmitMsg) { invSubmitMsg.textContent = data.message || 'تم تسجيل الفاتورة'; invSubmitMsg.className = 'form-message mt-2 mb-0 success'; }
            loadPurchaseInvoicesList();
            if (data.data && data.data.id) {
              window.open('/print-purchase-invoice.html?id=' + data.data.id, '_blank', 'width=800,height=900');
            }
          } else {
            if (invSubmitMsg) { invSubmitMsg.textContent = data.message || 'فشل'; invSubmitMsg.className = 'form-message mt-2 mb-0 error'; }
          }
        })
        .catch(function () { if (invSubmitMsg) { invSubmitMsg.textContent = 'خطأ في الاتصال'; invSubmitMsg.className = 'form-message mt-2 mb-0 error'; } })
        .finally(function () { btnSubmitPurchase.disabled = false; });
    });
  }

  function loadPurchaseInvoicesList() {
    var tbody = document.getElementById('inv-list-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/purchase-invoices?all=1', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">لا توجد فواتير مسجلة.</td></tr>';
          return;
        }
        tbody.innerHTML = res.data.map(function (inv) {
          var d = inv.created_at ? new Date(inv.created_at) : null;
          var dateStr = d && !isNaN(d.getTime()) ? d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
          return '<tr><td>' + inv.id + '</td><td>' + (inv.supplier_name || 'بدون مورد') + '</td><td>' + (inv.warehouse_name || '—') + '</td><td>' + Number(inv.total_amount).toFixed(2) + '</td><td>' + Number(inv.amount_paid).toFixed(2) + '</td><td>' + dateStr + '</td><td><button type="button" class="btn btn-sm btn-inv-details" data-id="' + inv.id + '"><i class="fas fa-list me-1"></i>تفاصيل</button></td><td><button type="button" class="btn btn-sm btn-inv-return" data-id="' + inv.id + '"><i class="fas fa-undo me-1"></i>مرتجع</button></td></tr>';
        }).join('');
        tbody.querySelectorAll('.btn-inv-details').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            if (!id) return;
            fetch('/api/purchase-invoices/' + id, { credentials: 'same-origin' })
              .then(function (r) { return r.json(); })
              .then(function (data) {
                if (!data.success || !data.data) return;
                var inv = data.data;
                var d = inv.created_at ? new Date(inv.created_at) : null;
                var dateStr = d && !isNaN(d.getTime()) ? d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                var metaEl = document.getElementById('inv-details-meta');
                if (metaEl) metaEl.textContent = 'فاتورة #' + inv.id + ' | ' + dateStr + ' | المورد: ' + (inv.supplier_name || 'بدون مورد') + ' | المخزن: ' + (inv.warehouse_name || '—');
                var tbodyDetails = document.getElementById('inv-details-tbody');
                if (tbodyDetails) {
                  tbodyDetails.innerHTML = (inv.items || []).map(function (it) {
                    return '<tr><td>' + (it.product_name || '—') + '</td><td>' + (it.barcode || '—') + '</td><td>' + it.quantity + '</td><td>' + Number(it.unit_purchase_price).toFixed(2) + '</td><td>' + Number(it.unit_sale_price).toFixed(2) + '</td><td>' + Number(it.line_total).toFixed(2) + '</td></tr>';
                  }).join('');
                }
                var modalEl = document.getElementById('modal-invoice-details');
                if (modalEl && window.bootstrap && bootstrap.Modal) {
                  var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                  modal.show();
                }
              })
              .catch(function () {});
          });
        });

        tbody.querySelectorAll('.btn-inv-return').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            if (!id) return;
            openPurchaseReturnModal(parseInt(id, 10));
          });
        });
      })
      .catch(function () { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">فشل التحميل</td></tr>'; });
  }

  var btnClearInvCart = document.getElementById('btn-clear-inv-cart');
  if (btnClearInvCart) {
    btnClearInvCart.addEventListener('click', function () {
      purchaseCart = [];
      renderCart();
      if (invSubmitMsg) invSubmitMsg.textContent = '';
    });
  }

  // ——— مرتجع فاتورة الشراء ———
  var purchaseReturnModalEl = document.getElementById('modal-purchase-return');
  var purchaseReturnTbody = document.getElementById('purchase-return-tbody');
  var purchaseReturnMeta = document.getElementById('purchase-return-meta');
  var purchaseReturnMsg = document.getElementById('purchase-return-msg');
  var btnSubmitPurchaseReturn = document.getElementById('btn-submit-purchase-return');

  function openPurchaseReturnModal(invoiceId) {
    if (!purchaseReturnModalEl || !purchaseReturnTbody) return;
    purchaseReturnMsg.textContent = '';
    purchaseReturnTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">جاري تحميل بيانات الفاتورة...</td></tr>';
    fetch('/api/purchase-invoices/' + invoiceId, { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success || !data.data) {
          purchaseReturnTbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">تعذر جلب بيانات الفاتورة</td></tr>';
          return;
        }
        var inv = data.data;
        var d = inv.created_at ? new Date(inv.created_at) : null;
        var dateStr = d && !isNaN(d.getTime())
          ? d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '—';
        if (purchaseReturnMeta) {
          purchaseReturnMeta.textContent =
            'فاتورة #' + inv.id + ' | ' + dateStr + ' | المورد: ' + (inv.supplier_name || 'بدون مورد') + ' | المخزن: ' + (inv.warehouse_name || '—');
        }
        purchaseReturnModalEl.setAttribute('data-invoice-id', String(inv.id));
        if (!inv.items || !inv.items.length) {
          purchaseReturnTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">لا توجد أصناف في هذه الفاتورة.</td></tr>';
        } else {
          purchaseReturnTbody.innerHTML = inv.items.map(function (it, idx) {
            return '<tr>' +
              '<td>' + (it.product_name || '—') + '</td>' +
              '<td>' + (it.barcode || '—') + '</td>' +
              '<td>' + it.quantity + '</td>' +
              '<td>' + Number(it.unit_purchase_price).toFixed(2) + '</td>' +
              '<td><input type="number" class="form-control form-control-sm purchase-return-qty" data-product-id="' + (it.product_id || '') + '" data-index="' + idx + '" min="0" max="' + it.quantity + '" step="0.001" value="0"></td>' +
              '</tr>';
          }).join('');
        }
        if (window.bootstrap && bootstrap.Modal) {
          var modal = bootstrap.Modal.getOrCreateInstance(purchaseReturnModalEl);
          modal.show();
        }
      })
      .catch(function () {
        purchaseReturnTbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">فشل تحميل بيانات الفاتورة</td></tr>';
      });
  }

  if (btnSubmitPurchaseReturn && purchaseReturnModalEl && purchaseReturnTbody) {
    btnSubmitPurchaseReturn.addEventListener('click', function () {
      var invoiceId = parseInt(purchaseReturnModalEl.getAttribute('data-invoice-id') || '0', 10);
      if (!invoiceId) return;
      var rows = purchaseReturnTbody.querySelectorAll('.purchase-return-qty');
      var items = [];
      rows.forEach(function (inp) {
        var qty = parseFloat(inp.value);
        var productId = parseInt(inp.getAttribute('data-product-id') || '0', 10);
        if (productId && !isNaN(qty) && qty > 0) {
          items.push({ product_id: productId, quantity: qty });
        }
      });
      if (!items.length) {
        purchaseReturnMsg.textContent = 'أدخل كمية مرتجعة لصنف واحد على الأقل';
        purchaseReturnMsg.className = 'form-message mt-2 mb-0 error';
        return;
      }
      btnSubmitPurchaseReturn.disabled = true;
      purchaseReturnMsg.textContent = '';
      fetch('/api/purchase-invoices/' + invoiceId + '/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ items: items }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            purchaseReturnMsg.textContent = data.message || 'تم تسجيل المرتجع';
            purchaseReturnMsg.className = 'form-message mt-2 mb-0 success';
            loadPurchaseInvoicesList();
          } else {
            purchaseReturnMsg.textContent = data.message || 'فشل تسجيل المرتجع';
            purchaseReturnMsg.className = 'form-message mt-2 mb-0 error';
          }
        })
        .catch(function () {
          purchaseReturnMsg.textContent = 'خطأ في الاتصال';
          purchaseReturnMsg.className = 'form-message mt-2 mb-0 error';
        })
        .finally(function () {
          btnSubmitPurchaseReturn.disabled = false;
        });
    });
  }

  function loadInvProducts() {
    var listEl = document.getElementById('inv-products-list');
    if (!listEl) return;
    var placeholder = listEl.querySelector('.inv-products-placeholder');
    listEl.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'inv-products-placeholder text-center py-3 mb-0';
    p.textContent = 'جاري تحميل المنتجات...';
    listEl.appendChild(p);
    fetch('/api/products', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        listEl.innerHTML = '';
        if (!res.success || !res.data || res.data.length === 0) {
          var empty = document.createElement('p');
          empty.className = 'inv-products-placeholder text-center py-3 mb-0';
          empty.textContent = 'لا توجد منتجات. أضف منتجات من تاب المنتجات.';
          listEl.appendChild(empty);
          return;
        }
        var wrap = document.createElement('div');
        wrap.className = 'inv-products-wrap';
        res.data.forEach(function (prod) {
          var purchase = prod.purchase_price != null ? Number(prod.purchase_price) : 0;
          var sale = prod.sale_price != null ? Number(prod.sale_price) : 0;
          var div = document.createElement('div');
          div.className = 'inv-product-item';
          div.innerHTML =
            '<span class="inv-product-name">' + (prod.name || '—') + '</span>' +
            '<span class="inv-product-meta">' + (prod.barcode || '—') + ' | شراء: ' + purchase.toFixed(2) + ' | بيع: ' + sale.toFixed(2) + '</span>' +
            '<button type="button" class="btn-inv-add-product" data-id="' + prod.id + '" data-name="' + (prod.name || '').replace(/"/g, '&quot;') + '" data-barcode="' + (prod.barcode || '') + '" data-purchase="' + purchase + '" data-sale="' + sale + '"><i class="fas fa-plus me-1"></i>إضافة للسلة</button>';
          wrap.appendChild(div);
        });
        listEl.appendChild(wrap);
        listEl.querySelectorAll('.btn-inv-add-product').forEach(function (btn) {
          btn.addEventListener('click', function () {
            addToCart({
              product_id: parseInt(this.getAttribute('data-id'), 10),
              name: this.getAttribute('data-name'),
              barcode: this.getAttribute('data-barcode'),
              quantity: 1,
              purchase_price: parseFloat(this.getAttribute('data-purchase')) || 0,
              sale_price: parseFloat(this.getAttribute('data-sale')) || 0
            });
            renderCart();
          });
        });
      })
      .catch(function () {
        listEl.innerHTML = '';
        var err = document.createElement('p');
        err.className = 'inv-products-placeholder text-center py-3 mb-0';
        err.textContent = 'فشل تحميل المنتجات.';
        listEl.appendChild(err);
      });
  }

  var tabInvoices = document.getElementById('tab-invoices');
  if (tabInvoices) {
    tabInvoices.addEventListener('shown.bs.tab', function () {
      showPurchasePanel();
      loadInvWarehouses();
      loadSaleWarehouses();
      loadSaleSuppliers();
      loadInvSuppliers();
       loadPaymentMethods();
      loadPurchaseInvoicesList();
      loadSaleInvoicesList();
    });
  }

  // ——— فاتورة بيع: التبديل بين شراء/بيع ———
  var pillPurchase = document.getElementById('pill-purchase');
  var pillSale = document.getElementById('pill-sale');
  var purchasePanel = document.getElementById('purchase-invoice-form');
  var salePanel = document.getElementById('sale-invoice-form');

  function showPurchasePanel() {
    if (pillPurchase) pillPurchase.classList.add('active');
    if (pillSale) pillSale.classList.remove('active');
    if (purchasePanel) purchasePanel.classList.remove('d-none');
    if (salePanel) salePanel.classList.add('d-none');
  }
  function showSalePanel() {
    if (pillSale) pillSale.classList.add('active');
    if (pillPurchase) pillPurchase.classList.remove('active');
    if (salePanel) salePanel.classList.remove('d-none');
    if (purchasePanel) purchasePanel.classList.add('d-none');
    loadSaleSuppliers();
    loadSaleInvoicesList();
    var saleWh = document.getElementById('sale-warehouse');
    if (saleWh && saleWh.value) loadSaleProducts(saleWh.value);
  }

  if (pillPurchase) pillPurchase.addEventListener('click', showPurchasePanel);
  if (pillSale) pillSale.addEventListener('click', showSalePanel);

  // ——— سلة البيع والمنتجات المتوفرة ———
  var saleCart = [];
  var saleWarehouseEl = document.getElementById('sale-warehouse');
  var saleProductsListEl = document.getElementById('sale-products-list');
  var saleCartTbody = document.getElementById('sale-cart-tbody');
  var saleCartEmpty = document.getElementById('sale-cart-empty');
  var saleTotalDisplay = document.getElementById('sale-total-display');
  var saleTotalAmount = document.getElementById('sale-total-amount');
  var saleAmountPaid = document.getElementById('sale-amount-paid');
  var salePaymentMethod = document.getElementById('sale-payment-method');
  var btnSubmitSale = document.getElementById('btn-submit-sale');
  var saleSubmitMsg = document.getElementById('sale-submit-msg');
  var saleLookupMsg = document.getElementById('sale-lookup-msg');

  var saleStockMap = {}; // product_id -> quantity في المخزن المختار

  function getSaleCartQtyForProduct(productId) {
    return saleCart.filter(function (it) { return it.product_id === productId; }).reduce(function (sum, it) { return sum + (it.quantity || 0); }, 0);
  }

  function loadSaleWarehouses() {
    var el = document.getElementById('sale-warehouse');
    if (!el) return;
    fetch('/api/warehouses', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        el.innerHTML = '<option value="">— اختر المخزن —</option>' + res.data.map(function (w) { return '<option value="' + w.id + '">' + (w.name || '') + '</option>'; }).join('');
      });
  }

  function loadSaleSuppliers() {
    var el = document.getElementById('sale-supplier');
    if (!el) return;
    fetch('/api/suppliers', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        el.innerHTML = '<option value="">بدون مورد</option>' + res.data.map(function (s) { return '<option value="' + s.id + '">' + (s.name || '') + '</option>'; }).join('');
      });
  }

  function loadSaleProducts(warehouseId) {
    if (!saleProductsListEl) return;
    if (!warehouseId) {
      saleProductsListEl.innerHTML = '<p class="inv-products-placeholder text-center py-3 mb-0">اختر المخزن أولاً.</p>';
      return;
    }
    saleProductsListEl.innerHTML = '<p class="inv-products-placeholder text-center py-3 mb-0">جاري تحميل المنتجات المتوفرة...</p>';
    Promise.all([
      fetch('/api/products', { credentials: 'same-origin' }).then(function (r) { return r.json(); }),
      fetch('/api/warehouse-stock?warehouse_id=' + warehouseId, { credentials: 'same-origin' }).then(function (r) { return r.json(); })
    ]).then(function (results) {
      var productsRes = results[0];
      var stockRes = results[1];
      saleStockMap = (stockRes.success && stockRes.data) ? stockRes.data : {};
      if (!productsRes.success || !productsRes.data || !productsRes.data.length) {
        saleProductsListEl.innerHTML = '<p class="inv-products-placeholder text-center py-3 mb-0">لا توجد منتجات.</p>';
        return;
      }
      var products = productsRes.data.filter(function (p) {
        var stock = saleStockMap[p.id] != null ? Number(saleStockMap[p.id]) : 0;
        return stock > 0;
      });
      if (products.length === 0) {
        saleProductsListEl.innerHTML = '<p class="inv-products-placeholder text-center py-3 mb-0">لا يوجد في هذا المخزن منتجات بكمية متاحة للبيع.</p>';
        return;
      }
      var wrap = document.createElement('div');
      wrap.className = 'inv-products-wrap';
      products.forEach(function (prod) {
        var stock = saleStockMap[prod.id] != null ? Number(saleStockMap[prod.id]) : 0;
        var inCart = getSaleCartQtyForProduct(prod.id);
        var available = Math.max(0, stock - inCart);
        var salePrice = prod.sale_price != null ? Number(prod.sale_price) : 0;
        var div = document.createElement('div');
        div.className = 'inv-product-item';
        div.setAttribute('data-product-id', prod.id);
        div.innerHTML =
          '<span class="inv-product-name">' + (prod.name || '—') + '</span>' +
          '<span class="inv-product-meta">متاح: ' + available + ' | بيع: ' + salePrice.toFixed(2) + '</span>' +
          '<div class="d-flex align-items-center gap-2">' +
          '<input type="number" class="form-control form-control-sm sale-qty-inp" style="width:70px" min="1" max="' + available + '" value="1" data-id="' + prod.id + '" data-name="' + (prod.name || '').replace(/"/g, '&quot;') + '" data-barcode="' + (prod.barcode || '') + '" data-sale="' + salePrice + '">' +
          '<button type="button" class="btn-inv-add-product btn-add-sale" data-id="' + prod.id + '" data-name="' + (prod.name || '').replace(/"/g, '&quot;') + '" data-barcode="' + (prod.barcode || '') + '" data-sale="' + salePrice + '"><i class="fas fa-plus me-1"></i>إضافة</button>' +
          '</div>';
        wrap.appendChild(div);
      });
      saleProductsListEl.innerHTML = '';
      saleProductsListEl.appendChild(wrap);
      wrap.querySelectorAll('.btn-add-sale').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = parseInt(this.getAttribute('data-id'), 10);
          var name = this.getAttribute('data-name');
          var barcode = this.getAttribute('data-barcode');
          var salePrice = parseFloat(this.getAttribute('data-sale')) || 0;
          var row = this.closest('.inv-product-item');
          var qtyInp = row ? row.querySelector('.sale-qty-inp') : null;
          var qty = qtyInp ? (parseFloat(qtyInp.value) || 0) : 1;
          var stock = saleStockMap[id] != null ? Number(saleStockMap[id]) : 0;
          var inCart = getSaleCartQtyForProduct(id);
          var available = Math.max(0, stock - inCart);
          if (qty <= 0) {
            if (saleLookupMsg) { saleLookupMsg.textContent = 'الكمية يجب أن تكون أكبر من 0'; saleLookupMsg.className = 'form-message mt-2 mb-0 error'; }
            return;
          }
          if (qty > available) {
            if (saleLookupMsg) { saleLookupMsg.textContent = 'الكمية تتجاوز المتاح (' + available + ')'; saleLookupMsg.className = 'form-message mt-2 mb-0 error'; }
            return;
          }
          var existingSale = saleCart.find(function (c) { return c.product_id === id; });
          if (existingSale) {
            existingSale.quantity = (existingSale.quantity || 0) + qty;
          } else {
            saleCart.push({
              product_id: id,
              name: name,
              barcode: barcode,
              quantity: qty,
              sale_price: salePrice
            });
          }
          if (saleLookupMsg) saleLookupMsg.textContent = '';
          renderSaleCart();
          loadSaleProducts(saleWarehouseEl ? saleWarehouseEl.value : '');
        });
      });
    }).catch(function () {
      saleProductsListEl.innerHTML = '<p class="inv-products-placeholder text-center py-3 mb-0">فشل تحميل المنتجات.</p>';
    });
  }

  function renderSaleCart() {
    if (!saleCartTbody) return;
    if (saleCart.length === 0) {
      saleCartTbody.innerHTML = '';
      if (saleCartEmpty) saleCartEmpty.classList.remove('d-none');
      if (saleTotalAmount) saleTotalAmount.textContent = '0.00';
      if (saleTotalDisplay) saleTotalDisplay.textContent = 'المجموع: 0.00';
      return;
    }
    if (saleCartEmpty) saleCartEmpty.classList.add('d-none');
    var total = 0;
    saleCartTbody.innerHTML = saleCart.map(function (item, idx) {
      var lineTotal = (item.quantity || 0) * (item.sale_price || 0);
      total += lineTotal;
      return '<tr data-idx="' + idx + '">' +
        '<td>' + (item.name || '—') + '</td>' +
        '<td>' + (item.barcode || '—') + '</td>' +
        '<td>' + (item.quantity || 0) + '</td>' +
        '<td>' + Number(item.sale_price || 0).toFixed(2) + '</td>' +
        '<td>' + lineTotal.toFixed(2) + '</td>' +
        '<td><button type="button" class="btn-inv-remove sale-cart-remove" data-idx="' + idx + '">حذف</button></td></tr>';
    }).join('');
    if (saleTotalAmount) saleTotalAmount.textContent = total.toFixed(2);
    if (saleTotalDisplay) saleTotalDisplay.textContent = 'المجموع: ' + total.toFixed(2);
    saleCartTbody.querySelectorAll('.sale-cart-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        saleCart.splice(idx, 1);
        renderSaleCart();
        if (saleWarehouseEl && saleWarehouseEl.value) loadSaleProducts(saleWarehouseEl.value);
      });
    });
  }

  if (saleWarehouseEl) {
    saleWarehouseEl.addEventListener('change', function () {
      saleCart = [];
      renderSaleCart();
      loadSaleProducts(this.value);
    });
  }

  var saleSupplierEl = document.getElementById('sale-supplier');
  if (btnSubmitSale && saleWarehouseEl && saleAmountPaid) {
    btnSubmitSale.addEventListener('click', function () {
      var warehouseId = saleWarehouseEl.value;
      if (!warehouseId) {
        if (saleSubmitMsg) { saleSubmitMsg.textContent = 'اختر المخزن'; saleSubmitMsg.className = 'form-message mt-2 mb-0 error'; }
        return;
      }
      if (saleCart.length === 0) {
        if (saleSubmitMsg) { saleSubmitMsg.textContent = 'السلة فارغة'; saleSubmitMsg.className = 'form-message mt-2 mb-0 error'; }
        return;
      }
      var supplierId = saleSupplierEl && saleSupplierEl.value ? saleSupplierEl.value : '';
      var amountPaid = parseFloat(saleAmountPaid.value) || 0;
      var paymentMethodId = salePaymentMethod && salePaymentMethod.value ? parseInt(salePaymentMethod.value, 10) : null;
      var payload = {
        warehouse_id: parseInt(warehouseId, 10),
        supplier_id: supplierId ? parseInt(supplierId, 10) : null,
        amount_paid: amountPaid,
        payment_method_id: paymentMethodId,
        items: saleCart.map(function (it) {
          return {
            product_id: it.product_id,
            quantity: it.quantity,
            sale_price: it.sale_price
          };
        })
      };
      btnSubmitSale.disabled = true;
      if (saleSubmitMsg) saleSubmitMsg.textContent = '';
      fetch('/api/sale-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            saleCart = [];
            renderSaleCart();
            if (saleAmountPaid) saleAmountPaid.value = '0';
            if (saleSubmitMsg) { saleSubmitMsg.textContent = data.message || 'تم تسجيل فاتورة البيع'; saleSubmitMsg.className = 'form-message mt-2 mb-0 success'; }
            loadSaleInvoicesList();
            if (saleWarehouseEl && saleWarehouseEl.value) loadSaleProducts(saleWarehouseEl.value);
            if (data.data && data.data.id) {
              window.open('/print-sale-invoice.html?id=' + data.data.id, '_blank', 'width=800,height=900');
            }
          } else {
            if (saleSubmitMsg) { saleSubmitMsg.textContent = data.message || 'فشل'; saleSubmitMsg.className = 'form-message mt-2 mb-0 error'; }
          }
        })
        .catch(function () {
          if (saleSubmitMsg) { saleSubmitMsg.textContent = 'خطأ في الاتصال'; saleSubmitMsg.className = 'form-message mt-2 mb-0 error'; }
        })
        .finally(function () { btnSubmitSale.disabled = false; });
    });
  }

  function loadSaleInvoicesList() {
    var tbody = document.getElementById('sale-list-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/sale-invoices?all=1', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">لا توجد فواتير بيع.</td></tr>';
          return;
        }
        tbody.innerHTML = res.data.map(function (inv) {
          var d = inv.created_at ? new Date(inv.created_at) : null;
          var dateStr = d && !isNaN(d.getTime()) ? d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
          return '<tr><td>' + inv.id + '</td><td>' + (inv.warehouse_name || '—') + '</td><td>' + (inv.supplier_name || '—') + '</td><td>' + Number(inv.total_amount).toFixed(2) + '</td><td>' + Number(inv.amount_paid).toFixed(2) + '</td><td>' + dateStr + '</td><td><button type="button" class="btn btn-sm btn-inv-print-sale" data-id="' + inv.id + '"><i class="fas fa-print me-1"></i>طباعة</button></td></tr>';
        }).join('');
        tbody.querySelectorAll('.btn-inv-print-sale').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            if (id) window.open('/print-sale-invoice.html?id=' + id, '_blank', 'width=800,height=900');
          });
        });
      })
      .catch(function () { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">فشل التحميل</td></tr>'; });
  }

  var btnClearSaleCart = document.getElementById('btn-clear-sale-cart');
  if (btnClearSaleCart) {
    btnClearSaleCart.addEventListener('click', function () {
      saleCart = [];
      renderSaleCart();
      if (saleSubmitMsg) saleSubmitMsg.textContent = '';
      if (saleWarehouseEl && saleWarehouseEl.value) loadSaleProducts(saleWarehouseEl.value);
    });
  }

  function refreshInvoiceWarehouseSelects() {
    loadInvWarehouses();
    loadSaleWarehouses();
  }
  window.addEventListener('warehouses:updated', refreshInvoiceWarehouseSelects);
})();