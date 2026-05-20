/**
 * POS cart: customer, discounts, checkout
 */
(function () {
  var warehouseSelect = document.getElementById('pos-warehouse');
  var paymentMethodSelect = document.getElementById('pos-payment-method');
  var paymentModeSelect = document.getElementById('pos-payment-mode');
  var customerPhoneInput = document.getElementById('pos-customer-phone');
  var customerNameInput = document.getElementById('pos-customer-name');
  var customerMsg = document.getElementById('pos-customer-message');
  var btnFindCustomer = document.getElementById('pos-btn-find-customer');

  var cartBody = document.getElementById('pos-cart-body');
  var subtotalEl = document.getElementById('pos-subtotal');
  var invDiscountTypeEl = document.getElementById('pos-invoice-discount-type');
  var invDiscountValueEl = document.getElementById('pos-invoice-discount-value');
  var invDiscountUnitEl = document.getElementById('pos-invoice-discount-unit');
  var invDiscountAmountEl = document.getElementById('pos-invoice-discount-amount');
  var finalTotalEl = document.getElementById('pos-final-total');
  var creditFieldsWrap = document.getElementById('pos-credit-fields-wrap');
  var requiredAmountEl = document.getElementById('pos-required-amount');
  var amountPaidEl = document.getElementById('pos-amount-paid');
  var remainingAmountEl = document.getElementById('pos-remaining-amount');

  var btnCheckout = document.getElementById('pos-btn-checkout');
  var btnClear = document.getElementById('pos-btn-clear');
  var submitMsg = document.getElementById('pos-submit-message');

  var cart = [];
  var currentCustomerId = null;

  function setCustomerMessage(text, isError) {
    if (!customerMsg) return;
    customerMsg.textContent = text || '';
    customerMsg.className =
      'small mb-0 mt-1 ' + (text ? (isError ? 'text-danger' : 'text-success') : 'text-muted');
  }

  function refreshCartRowLineTotals(tr, idx) {
    if (!tr || !cart[idx]) return;
    var unitAfter = getItemUnitPrice(cart[idx]);
    var base = Number(cart[idx].basePrice || 0);
    var lineTotal = unitAfter * (cart[idx].quantity || 0);
    var priceCell = tr.querySelector('.pos-price-cell');
    if (priceCell) {
      var baseEl = priceCell.querySelector('.pos-line-base');
      var unitEl = priceCell.querySelector('.pos-line-unitafter');
      if (baseEl) baseEl.textContent = 'أصلي: ' + base.toFixed(2);
      if (unitEl) unitEl.textContent = 'بعد خصم: ' + unitAfter.toFixed(2);
    }
    var tds = tr.querySelectorAll('td');
    if (tds[4]) tds[4].textContent = lineTotal.toFixed(2);
  }

  function renderCart() {
    if (!cartBody) return;
    if (!cart.length) {
      cartBody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted py-4">السلة فارغة. اضغط على منتج من القائمة على اليسار للإضافة.</td></tr>';
      updateTotals();
      return;
    }

    var rowsHtml = '';
    cart.forEach(function (item, idx) {
      var unitAfter = getItemUnitPrice(item);
      var baseList = Number(item.basePrice || 0);
      var lineTotal = unitAfter * (item.quantity || 0);
      rowsHtml +=
        '<tr data-idx="' + idx + '">' +
        '<td>' + (item.name || '—') + '</td>' +
        '<td>' +
        '<input type="number" class="form-control form-control-sm text-center pos-item-qty" ' +
        'min="1" step="1" data-idx="' + idx + '" value="' + (item.quantity || 1) + '">' +
        '</td>' +
        '<td class="pos-price-cell">' +
        '<div class="pos-line-base small text-white-50">أصلي: ' +
        baseList.toFixed(2) +
        '</div>' +
        '<div class="pos-line-unitafter">بعد خصم: ' +
        unitAfter.toFixed(2) +
        '</div></td>' +
        '<td>' +
        '<div class="d-flex align-items-center gap-1">' +
        '<select class="form-select form-select-sm pos-item-discount-type" data-idx="' + idx + '" style="width: 70px;">' +
        '<option value="fixed"' + (item.discountType === 'fixed' ? ' selected' : '') + '>قيمة</option>' +
        '<option value="percent"' + (item.discountType === 'percent' ? ' selected' : '') + '>٪</option>' +
        '</select>' +
        '<input type="number" class="form-control form-control-sm text-center pos-item-discount-value" ' +
        'data-idx="' + idx + '" min="0" step="0.01" value="' + (item.discountValue || 0) + '" ' +
        'style="min-width: 72px; font-size: 1rem;">' +
        '</div>' +
        '</td>' +
        '<td>' + lineTotal.toFixed(2) + '</td>' +
        '<td class="text-center">' +
        '<button type="button" class="btn btn-sm btn-outline-danger pos-item-remove" data-idx="' + idx + '">' +
        '<i class="fas fa-times"></i>' +
        '</button>' +
        '</td>' +
        '</tr>';
    });

    cartBody.innerHTML = rowsHtml;

    // Attach events
    cartBody.querySelectorAll('.pos-item-qty').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        var v = parseFloat(this.value);
        if (isNaN(v) || v <= 0 || !cart[idx]) {
          this.value = cart[idx] ? cart[idx].quantity : 1;
          return;
        }
        cart[idx].quantity = v;
        renderCart();
      });
    });
    cartBody.querySelectorAll('.pos-item-discount-type').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        if (!cart[idx]) return;
        cart[idx].discountType = this.value === 'percent' ? 'percent' : 'fixed';
        renderCart();
      });
    });
    cartBody.querySelectorAll('.pos-item-discount-value').forEach(function (inp) {
      function syncLineDiscountFromField(el) {
        var idx = parseInt(el.getAttribute('data-idx'), 10);
        if (!cart[idx]) return;
        var v = parseFloat(el.value);
        cart[idx].discountValue = !isNaN(v) && v >= 0 ? v : 0;
        refreshCartRowLineTotals(el.closest('tr'), idx);
        updateTotals();
      }
      inp.addEventListener('input', function () {
        syncLineDiscountFromField(this);
      });
      inp.addEventListener('change', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        if (!cart[idx]) return;
        var v = parseFloat(this.value);
        if (isNaN(v) || v < 0) {
          this.value = '0';
          cart[idx].discountValue = 0;
        } else {
          cart[idx].discountValue = v;
        }
        refreshCartRowLineTotals(this.closest('tr'), idx);
        updateTotals();
      });
    });
    cartBody.querySelectorAll('.pos-item-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        if (isNaN(idx)) return;
        cart.splice(idx, 1);
        renderCart();
      });
    });

    updateTotals();
  }

  function getItemUnitPrice(item) {
    var base = Number(item.basePrice || 0);
    var type = item.discountType === 'percent' ? 'percent' : 'fixed';
    var v = Number(item.discountValue || 0);
    if (v <= 0) return base;
    if (type === 'fixed') {
      var p = base - v;
      return p > 0 ? p : 0;
    }
    // percent
    if (v > 100) v = 100;
    var discountAmount = (base * v) / 100;
    var p2 = base - discountAmount;
    return p2 > 0 ? p2 : 0;
  }

  function getSubtotal() {
    return cart.reduce(function (sum, item) {
      var unit = getItemUnitPrice(item);
      var qty = Number(item.quantity || 0);
      return sum + unit * qty;
    }, 0);
  }

  function getInvoiceDiscountAmount(subtotal) {
    if (!invDiscountTypeEl || !invDiscountValueEl) return 0;
    var type = invDiscountTypeEl.value === 'percent' ? 'percent' : 'fixed';
    var raw = parseFloat(invDiscountValueEl.value);
    if (isNaN(raw) || raw <= 0 || subtotal <= 0) return 0;
    if (type === 'fixed') {
      return Math.min(raw, subtotal);
    }
    // percent
    var pct = raw;
    if (pct > 100) pct = 100;
    return (subtotal * pct) / 100;
  }

  function updateTotals() {
    var subtotal = getSubtotal();
    var invDiscAmount = getInvoiceDiscountAmount(subtotal);
    var finalTotal = Math.max(0, subtotal - invDiscAmount);

    if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
    if (invDiscountAmountEl) invDiscountAmountEl.textContent = invDiscAmount.toFixed(2);
    if (finalTotalEl) finalTotalEl.textContent = finalTotal.toFixed(2);

    var isCredit = paymentModeSelect && paymentModeSelect.value === 'credit';
    if (requiredAmountEl) requiredAmountEl.value = finalTotal.toFixed(2);
    if (isCredit && amountPaidEl) {
      var paidRaw = parseFloat(amountPaidEl.value);
      var paidForCalc = isNaN(paidRaw) || paidRaw < 0 ? 0 : paidRaw;
      if (paidForCalc > finalTotal) paidForCalc = finalTotal;
      if (remainingAmountEl) remainingAmountEl.value = (finalTotal - paidForCalc).toFixed(2);
    } else if (remainingAmountEl) {
      remainingAmountEl.value = '0.00';
    }
  }

  function handleInvoiceDiscountTypeChange() {
    if (!invDiscountTypeEl || !invDiscountUnitEl) return;
    var type = invDiscountTypeEl.value === 'percent' ? 'percent' : 'fixed';
    invDiscountUnitEl.textContent = type === 'percent' ? '%' : 'ج.م';
    updateTotals();
  }

  function addProductFromList(prod) {
    if (!prod) return;
    var productId = prod.id != null ? parseInt(prod.id, 10) : null;
    var basePrice = prod.sale_price != null ? Number(prod.sale_price) : 0;
    if (isNaN(basePrice) || basePrice < 0) basePrice = 0;

    var existing = cart.find(function (it) {
      return it.product_id && productId && it.product_id === productId;
    });
    if (existing) {
      existing.quantity = (existing.quantity || 0) + 1;
    } else {
      cart.push({
        product_id: productId,
        name: prod.name || '',
        barcode: prod.barcode || null,
        quantity: 1,
        basePrice: basePrice,
        discountType: 'fixed',
        discountValue: 0,
      });
    }
    renderCart();
  }

  function clearCartAndForm() {
    cart = [];
    currentCustomerId = null;
    if (customerNameInput) customerNameInput.value = '';
    if (customerPhoneInput) customerPhoneInput.value = '';
    if (paymentMethodSelect) paymentMethodSelect.value = '';
    if (paymentModeSelect) paymentModeSelect.value = 'cash';
    if (creditFieldsWrap) creditFieldsWrap.style.display = 'none';
    if (amountPaidEl) amountPaidEl.value = '0.00';
    if (requiredAmountEl) requiredAmountEl.value = '0.00';
    if (remainingAmountEl) remainingAmountEl.value = '0.00';
    if (invDiscountValueEl) invDiscountValueEl.value = '0';
    if (invDiscountTypeEl) invDiscountTypeEl.value = 'fixed';
    handleInvoiceDiscountTypeChange();
    setCustomerMessage('', false);
    if (submitMsg) {
      submitMsg.textContent = '';
      submitMsg.className = 'form-message mt-1 mb-0';
    }
    renderCart();
  }

  function handlePaymentModeChange() {
    var isCredit = paymentModeSelect && paymentModeSelect.value === 'credit';
    if (creditFieldsWrap) creditFieldsWrap.style.display = isCredit ? 'flex' : 'none';
    if (isCredit) {
      if (customerNameInput) {
        customerNameInput.placeholder = 'اسم العميل (إجباري للأجل)';
      }
      if (amountPaidEl && (!amountPaidEl.value || Number(amountPaidEl.value) < 0)) {
        amountPaidEl.value = '0.00';
      }
    } else if (customerNameInput) {
      customerNameInput.placeholder = 'اسم العميل (اختياري)';
    }
    updateTotals();
  }

  function normalizeAmountPaidInput() {
    if (!amountPaidEl) return;
    var finalTotal = parseFloat(finalTotalEl ? finalTotalEl.textContent : '0');
    if (isNaN(finalTotal) || finalTotal < 0) finalTotal = 0;
    var paid = parseFloat(amountPaidEl.value);
    if (isNaN(paid) || paid < 0) paid = 0;
    if (paid > finalTotal) paid = finalTotal;
    amountPaidEl.value = paid.toFixed(2);
    if (remainingAmountEl) {
      remainingAmountEl.value = (finalTotal - paid).toFixed(2);
    }
  }

  function loadWarehouses() {
    if (!warehouseSelect) return;
    var prev = warehouseSelect.value;
    fetch('/api/warehouses', { credentials: 'same-origin' })
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        if (!res.success || !Array.isArray(res.data)) return;
        var list = res.data;
        var opts = '';
        var defaultValue = '';
        if (list.length === 1) {
          // إذا كان للمستخدم مخزن واحد فقط: عيّنه افتراضياً وأخفِ خيار الفراغ
          defaultValue = String(list[0].id);
          opts = list
            .map(function (w) {
              return (
                '<option value="' + w.id + '">' + (w.name || '') + '</option>'
              );
            })
            .join('');
        } else {
          // أكثر من مخزن أو لا يوجد تقييد: اترك للمستخدم الاختيار مع خيار فارغ
          opts =
            '<option value="">— اختر المخزن —</option>' +
            list
              .map(function (w) {
                return (
                  '<option value="' + w.id + '">' + (w.name || '') + '</option>'
                );
              })
              .join('');
        }
        warehouseSelect.innerHTML = opts;
        if (defaultValue) {
          warehouseSelect.value = defaultValue;
        } else if (
          prev &&
          list.some(function (w) {
            return String(w.id) === String(prev);
          })
        ) {
          warehouseSelect.value = prev;
        }
      })
      .catch(function () {});
  }

  function loadPaymentMethods() {
    if (!paymentMethodSelect) return;
    fetch('/api/payment-methods', { credentials: 'same-origin' })
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        if (!res.success || !Array.isArray(res.data)) return;
        var defaultId = null;
        var opts =
          '<option value="">بدون تحديد</option>' +
          res.data
            .map(function (pm) {
              if (pm.is_default_pos) defaultId = pm.id;
              return (
                '<option value="' + pm.id + '">' + (pm.name || '') + '</option>'
              );
            })
            .join('');
        paymentMethodSelect.innerHTML = opts;
        if (defaultId) paymentMethodSelect.value = String(defaultId);
      })
      .catch(function () {});
  }

  function lookupCustomerByPhone() {
    if (!customerPhoneInput) return;
    var phone = (customerPhoneInput.value || '').trim();
    currentCustomerId = null;
    if (!phone) {
      setCustomerMessage('أدخل رقم الهاتف للبحث عن العميل (اختياري).', false);
      return;
    }
    setCustomerMessage('جاري البحث عن العميل...', false);
    fetch('/api/customers/by-phone?phone=' + encodeURIComponent(phone), {
      credentials: 'same-origin',
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        if (!res.success) {
          setCustomerMessage(res.message || 'خطأ في البحث عن العميل.', true);
          return;
        }
        if (!res.customer) {
          setCustomerMessage('لا يوجد عميل بهذا الرقم. سيتم حفظ البيانات كعميل جديد عند إتمام البيع.', false);
          return;
        }
        currentCustomerId = res.customer.id;
        if (customerNameInput && (!customerNameInput.value || !customerNameInput.value.trim())) {
          customerNameInput.value = res.customer.name || '';
        }
        if (customerPhoneInput) customerPhoneInput.value = res.customer.phone || phone;
        setCustomerMessage('تم العثور على العميل وتم تعبئة اسمه.', false);
      })
      .catch(function () {
        setCustomerMessage('خطأ في الاتصال أثناء البحث عن العميل.', true);
      });
  }

  function checkout() {
    if (!submitMsg) return;
    submitMsg.textContent = '';
    submitMsg.className = 'form-message mt-1 mb-0';

    if (!warehouseSelect || !warehouseSelect.value) {
      submitMsg.textContent = 'اختر المخزن أولاً.';
      submitMsg.className = 'form-message mt-1 mb-0 error';
      return;
    }
    if (!cart.length) {
      submitMsg.textContent = 'السلة فارغة.';
      submitMsg.className = 'form-message mt-1 mb-0 error';
      return;
    }

    var subtotal = getSubtotal();
    var invoiceDiscAmount = getInvoiceDiscountAmount(subtotal);
    var finalTotal = Math.max(0, subtotal - invoiceDiscAmount);

    var discountType =
      invDiscountTypeEl && invDiscountTypeEl.value === 'percent' ? 'percent' : 'fixed';
    var rawDiscValue = invDiscountValueEl ? parseFloat(invDiscountValueEl.value) : 0;
    var discountPercent = 0;
    var discountValue = 0;

    if (!isNaN(rawDiscValue) && rawDiscValue > 0) {
      if (discountType === 'percent') {
        discountPercent = Math.min(rawDiscValue, 100);
      } else {
        discountValue = Math.min(rawDiscValue, subtotal);
      }
    }

    var customerPhone = customerPhoneInput ? customerPhoneInput.value.trim() : '';
    var customerName = customerNameInput ? customerNameInput.value.trim() : '';
    var isCredit = paymentModeSelect && paymentModeSelect.value === 'credit';
    var amountPaid = finalTotal;
    if (isCredit && amountPaidEl) {
      amountPaid = parseFloat(amountPaidEl.value);
      if (isNaN(amountPaid) || amountPaid < 0) amountPaid = 0;
      if (amountPaid > finalTotal) amountPaid = finalTotal;
    }

    if (isCredit && !customerName) {
      submitMsg.textContent = 'اسم العميل إجباري عند البيع بالأجل.';
      submitMsg.className = 'form-message mt-1 mb-0 error';
      return;
    }

    var payload = {
      warehouse_id: parseInt(warehouseSelect.value, 10),
      customer_id: currentCustomerId || null,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      payment_method_id:
        paymentMethodSelect && paymentMethodSelect.value
          ? parseInt(paymentMethodSelect.value, 10)
          : null,
      amount_paid: amountPaid,
      ajel: isCredit,
      discount_percent: discountPercent,
      discount_value: discountValue,
      source: 'pos',
      items: cart.map(function (item) {
        var base = Number(item.basePrice || 0);
        var unitAfter = getItemUnitPrice(item);
        var type = item.discountType === 'percent' ? 'percent' : 'fixed';
        var v = Number(item.discountValue || 0);
        var itemPct = 0;
        var itemVal = 0;
        if (v > 0 && base > 0) {
          if (type === 'percent') {
            itemPct = Math.min(v, 100);
            itemVal = (base * itemPct) / 100;
          } else {
            itemVal = Math.min(v, base);
            itemPct = base > 0 ? (itemVal / base) * 100 : 0;
          }
        }
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          sale_price: unitAfter,
          unit_price_before_discount: base,
          item_discount_percent: itemPct,
          item_discount_value: itemVal,
        };
      }),
    };

    if (btnCheckout) btnCheckout.disabled = true;
    submitMsg.textContent = 'جاري حفظ الفاتورة...';
    submitMsg.className = 'form-message mt-1 mb-0';

    fetch('/api/sale-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        if (!res.success) {
          submitMsg.textContent = res.message || 'فشل حفظ الفاتورة.';
          submitMsg.className = 'form-message mt-1 mb-0 error';
          return;
        }
        submitMsg.textContent = res.message || 'تم تسجيل الفاتورة بنجاح.';
        submitMsg.className = 'form-message mt-1 mb-0 success';

        // فتح فاتورة طباعة POS A4
        if (res.data && res.data.id) {
          window.open(
            '/print-pos-sale-invoice.html?id=' + res.data.id,
            '_blank',
            'width=800,height=900'
          );
        }

        clearCartAndForm();
      })
      .catch(function () {
        submitMsg.textContent = 'خطأ في الاتصال أثناء حفظ الفاتورة.';
        submitMsg.className = 'form-message mt-1 mb-0 error';
      })
      .finally(function () {
        if (btnCheckout) btnCheckout.disabled = false;
      });
  }

  // Events
  if (btnFindCustomer && customerPhoneInput) {
    btnFindCustomer.addEventListener('click', lookupCustomerByPhone);
    customerPhoneInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        lookupCustomerByPhone();
      }
    });
  }

  if (invDiscountTypeEl) {
    invDiscountTypeEl.addEventListener('change', handleInvoiceDiscountTypeChange);
  }
  if (invDiscountValueEl) {
    invDiscountValueEl.addEventListener('input', updateTotals);
    invDiscountValueEl.addEventListener('change', updateTotals);
  }

  if (btnCheckout) {
    btnCheckout.addEventListener('click', checkout);
  }
  if (paymentModeSelect) {
    paymentModeSelect.addEventListener('change', handlePaymentModeChange);
  }
  if (amountPaidEl) {
    amountPaidEl.addEventListener('input', updateTotals);
    amountPaidEl.addEventListener('change', function () {
      normalizeAmountPaidInput();
      updateTotals();
    });
    amountPaidEl.addEventListener('blur', function () {
      normalizeAmountPaidInput();
      updateTotals();
    });
  }
  if (btnClear) {
    btnClear.addEventListener('click', clearCartAndForm);
  }

  window.addEventListener('warehouses:updated', loadWarehouses);

  // Initial load
  loadWarehouses();
  loadPaymentMethods();
  handlePaymentModeChange();
  handleInvoiceDiscountTypeChange();
  renderCart();

  // expose minimal API for products panel
  window.posCart = window.posCart || {};
  window.posCart.addProductFromList = addProductFromList;
})();

