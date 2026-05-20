/**
 * صفحة المخازن - تاب المنتجات: إضافة، قائمة، حذف ناعم
 */
(function () {
  function can(key) {
    return typeof window.hasWarehousesPermission === 'function'
      ? window.hasWarehousesPermission(key)
      : true;
  }
  var helpers = window.WarehousesProductsHelpers || {};
  var getSelectedValues = helpers.getSelectedValues || function () { return []; };
  var setSelectedValues = helpers.setSelectedValues || function () {};
  var parseCsvIds = helpers.parseCsvIds || function () { return []; };

  const form = document.getElementById('add-product-form');
  const inputName = document.getElementById('product-name');
  const inputBarcode = document.getElementById('product-barcode');
  var addProductWarehouse = document.getElementById('add-product-warehouse');
  const btnGenerateBarcode = document.getElementById('btn-generate-barcode');
  const btnResetAddForm = document.getElementById('btn-reset-add-product-form');
  const useSerialCheckbox = document.getElementById('dispatch-use-serial');
  const serialFieldsWrap = document.getElementById('dispatch-serial-fields-wrap');
  const serialFieldsContainer = document.getElementById('dispatch-serial-fields');
  const btnGenerateSerialEan = document.getElementById('btn-generate-serial-ean');
  const btnAdd = document.getElementById('btn-add-product');
  const formMsg = document.getElementById('product-form-message');
  const productLookupHint = document.getElementById('product-lookup-hint');
  const nameSuggestionsEl = document.getElementById('product-name-suggestions');
  var nameSearchTimer = null;
  var nameSearchRequestId = 0;
  const tbody = document.getElementById('products-tbody');
  const tableEmpty = document.getElementById('products-table-empty');

  const defaultMinInput = document.getElementById('default-minimum-stock-input');
  const btnSaveDefaultMin = document.getElementById('btn-save-default-minimum');
  const btnApplyUnsetMin = document.getElementById('btn-apply-minimum-unset');
  const minPanelMsg = document.getElementById('minimum-stock-panel-msg');
  const modalMinimumGlobal = document.getElementById('modal-minimum-stock-global');
  const modalMinEl = document.getElementById('modal-product-minimum');
  const minProductIdInput = document.getElementById('minimum-product-id');
  const minProductNameEl = document.getElementById('minimum-product-name');
  const minProductInput = document.getElementById('minimum-product-input');
  const minProductMsg = document.getElementById('minimum-product-message');
  const btnSaveProductMin = document.getElementById('btn-save-product-minimum');
  const btnClearProductMin = document.getElementById('btn-clear-product-minimum');
  const modalProductSuppliersEl = document.getElementById('modal-product-suppliers');
  const productSuppliersNameEl = document.getElementById('product-suppliers-product-name');
  const productSuppliersCountEl = document.getElementById('product-suppliers-count');
  const productSuppliersListEl = document.getElementById('product-suppliers-list');

  function showMsg(text, isError) {
    if (!formMsg) return;
    formMsg.textContent = text;
    formMsg.className = 'form-message mt-2 ' + (isError ? 'error' : 'success');
  }

  function clearMsg() {
    if (formMsg) formMsg.textContent = '';
  }

  function showMinPanelMsg(text, isError) {
    if (!minPanelMsg) return;
    minPanelMsg.textContent = text || '';
    minPanelMsg.className = 'form-message mt-2 mb-0 ' + (isError ? 'error' : 'success');
  }

  function showMinProductMsg(text, isError) {
    if (!minProductMsg) return;
    minProductMsg.textContent = text || '';
    minProductMsg.className = 'form-message mt-2 mb-0 ' + (isError ? 'error' : 'success');
  }

  function loadDefaultMinimum() {
    if (!defaultMinInput) return;
    fetch('/api/minimum-stock/default', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.success && res.data) {
          defaultMinInput.value = String(Math.round(Number(res.data.default_minimum_quantity) || 0));
        }
      })
      .catch(function () { /* ignore */ });
  }

  if (modalMinimumGlobal) {
    modalMinimumGlobal.addEventListener('shown.bs.modal', function () {
      showMinPanelMsg('', false);
      loadDefaultMinimum();
    });
  }

  function setLookupHint(text) {
    if (productLookupHint) productLookupHint.textContent = text || '';
  }

  function normalizeBarcode(value) {
    return String(value || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 12);
  }

  function eanCheckDigit12(base12) {
    var sum = 0;
    for (var i = 0; i < 12; i += 1) {
      var d = Number(base12.charAt(i)) || 0;
      sum += (i % 2 === 0) ? d : (d * 3);
    }
    return String((10 - (sum % 10)) % 10);
  }

  function generateRandomEan13() {
    var b = '';
    for (var i = 0; i < 12; i += 1) b += String(Math.floor(Math.random() * 10));
    return b + eanCheckDigit12(b);
  }

  function renderSerialInputs(count, values) {
    if (!serialFieldsContainer) return;
    var n = Math.max(0, Math.floor(Number(count) || 0));
    if (n <= 0) {
      serialFieldsContainer.innerHTML = '';
      return;
    }
    var arr = Array.isArray(values) ? values : [];
    var html = '';
    for (var i = 0; i < n; i += 1) {
      var val = arr[i] != null ? String(arr[i]) : '';
      html +=
        '<div class="col-12 col-md-4 col-lg-3">' +
        '<label class="form-label small mb-1">Serial #' + (i + 1) + '</label>' +
        '<input type="text" class="form-control form-control-sm dispatch-serial-input" data-serial-idx="' + i + '" value="' + suggestionEscapeAttr(val) + '" maxlength="64" placeholder="EAN / Serial">' +
        '</div>';
    }
    serialFieldsContainer.innerHTML = html;
  }

  function collectSerialsFromInputs() {
    if (!serialFieldsContainer) return [];
    return Array.prototype.map.call(
      serialFieldsContainer.querySelectorAll('.dispatch-serial-input'),
      function (el) { return String(el.value || '').trim(); }
    );
  }

  function clearSerialUI() {
    if (useSerialCheckbox) useSerialCheckbox.checked = false;
    if (serialFieldsWrap) serialFieldsWrap.classList.add('d-none');
    if (serialFieldsContainer) serialFieldsContainer.innerHTML = '';
  }

  function syncSerialInputsWithQuantity() {
    if (!useSerialCheckbox || !useSerialCheckbox.checked) return;
    var q = parseFloat(form && form.quantity ? form.quantity.value : '');
    var n = Number.isFinite(q) ? Math.floor(q) : 0;
    if (!Number.isFinite(q) || q <= 0 || Math.floor(q) !== q) {
      renderSerialInputs(0);
      return;
    }
    var prev = collectSerialsFromInputs();
    renderSerialInputs(n, prev);
  }

  function resetAddProductFormForNext() {
    if (inputName) inputName.value = '';
    if (inputBarcode) inputBarcode.value = '';
    if (form && form.quantity) form.quantity.value = '0';
    if (form && form.purchase_price) form.purchase_price.value = '0';
    if (form && form.sale_price) form.sale_price.value = '0';
    setLookupHint('');
    clearSerialUI();
  }

  function getAddFormWarehouseId() {
    return addProductWarehouse && addProductWarehouse.value ? String(addProductWarehouse.value) : '';
  }

  function lookupProductByBarcode(barcodeDigits) {
    var wh = getAddFormWarehouseId();
    var qs = wh ? ('?warehouse_id=' + encodeURIComponent(wh)) : '';
    return fetch('/api/products/by-barcode/' + encodeURIComponent(barcodeDigits) + qs, { credentials: 'same-origin' })
      .then(function (r) { return r.json(); });
  }

  function applyProductLookupData(data) {
    if (!data) {
      setLookupHint('');
      return;
    }
    if (inputName && data.name) inputName.value = data.name;
    if (inputBarcode && data.barcode != null && normalizeBarcode(data.barcode).length === 12) {
      inputBarcode.value = normalizeBarcode(data.barcode);
    }
    if (form && form.purchase_price && data.purchase_price != null) {
      form.purchase_price.value = String(Number(data.purchase_price));
    }
    if (form && form.sale_price && data.sale_price != null) {
      form.sale_price.value = String(Number(data.sale_price));
    }
    var parts = [];
    if (data.warehouse_quantity != null && getAddFormWarehouseId()) {
      parts.push('الرصيد في المخزن المختار: ' + Number(data.warehouse_quantity));
    }
    if (data.total_quantity != null) {
      parts.push('إجمالي الكمية (كل المخازن): ' + Number(data.total_quantity));
    }
    setLookupHint(parts.join(' — '));
  }

  function suggestionEscapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function suggestionEscapeAttr(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function hideNameSuggestions() {
    if (!nameSuggestionsEl) return;
    nameSuggestionsEl.classList.add('d-none');
    nameSuggestionsEl.innerHTML = '';
  }

  function renderNameSuggestions(rows) {
    if (!nameSuggestionsEl || !rows.length) {
      hideNameSuggestions();
      return;
    }
    nameSuggestionsEl.innerHTML = rows.map(function (r) {
      var nm = r.name || '';
      var bc = normalizeBarcode(r.barcode || '');
      var pid = r.id != null ? String(r.id) : '';
      var wq = r.warehouse_quantity != null ? String(Number(r.warehouse_quantity)) : '';
      var tq = r.total_quantity != null ? String(Number(r.total_quantity)) : '';
      return '<button type="button" class="list-group-item list-group-item-action product-name-suggestion-item text-end" ' +
        'data-product-id="' + suggestionEscapeAttr(pid) + '" ' +
        'data-name="' + suggestionEscapeAttr(nm) + '" ' +
        'data-barcode="' + suggestionEscapeAttr(bc) + '" ' +
        'data-purchase="' + Number(r.purchase_price || 0) + '" ' +
        'data-sale="' + Number(r.sale_price || 0) + '" ' +
        'data-whqty="' + suggestionEscapeAttr(wq) + '" ' +
        'data-totalqty="' + suggestionEscapeAttr(tq) + '">' +
        '<span class="fw-medium">' + suggestionEscapeHtml(nm) + '</span>' +
        ' <span class="text-muted small">' + suggestionEscapeHtml(bc) + '</span></button>';
    }).join('');
    nameSuggestionsEl.classList.remove('d-none');
    nameSuggestionsEl.querySelectorAll('.product-name-suggestion-item').forEach(function (btn) {
      btn.addEventListener('mousedown', function (e) {
        e.preventDefault();
        var pickName = this.getAttribute('data-name') || '';
        var pickBarcode = normalizeBarcode(this.getAttribute('data-barcode') || '');
        if (inputName) inputName.value = pickName;
        var whStr = this.getAttribute('data-whqty');
        var tqStr = this.getAttribute('data-totalqty');
        applyProductLookupData({
          name: pickName,
          barcode: pickBarcode,
          purchase_price: parseFloat(this.getAttribute('data-purchase')),
          sale_price: parseFloat(this.getAttribute('data-sale')),
          warehouse_quantity: whStr === '' ? null : Number(whStr),
          total_quantity: tqStr === '' ? null : Number(tqStr),
        });
        hideNameSuggestions();
      });
    });
  }

  if (inputName && nameSuggestionsEl) {
    function runNameSearch() {
      var q = (inputName.value || '').trim();
      if (q.length < 1) {
        hideNameSuggestions();
        return;
      }
      var myId = ++nameSearchRequestId;
      var wh = getAddFormWarehouseId();
      var qs = 'q=' + encodeURIComponent(q) + (wh ? '&warehouse_id=' + encodeURIComponent(wh) : '');
      fetch('/api/products/search?' + qs, { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (myId !== nameSearchRequestId) return;
          if (!res.success || !res.data || !res.data.length) {
            hideNameSuggestions();
            return;
          }
          renderNameSuggestions(res.data);
        })
        .catch(function () { hideNameSuggestions(); });
    }

    inputName.addEventListener('input', function () {
      clearTimeout(nameSearchTimer);
      var q = (inputName.value || '').trim();
      if (q.length < 1) {
        hideNameSuggestions();
        return;
      }
      nameSearchTimer = setTimeout(runNameSearch, 180);
    });
    inputName.addEventListener('focus', function () {
      clearTimeout(nameSearchTimer);
      nameSearchTimer = setTimeout(runNameSearch, 80);
    });
    inputName.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideNameSuggestions();
    });
  }

  document.addEventListener('click', function (e) {
    if (!nameSuggestionsEl || nameSuggestionsEl.classList.contains('d-none')) return;
    var t = e.target;
    if (inputName && (t === inputName || inputName.contains(t))) return;
    if (nameSuggestionsEl.contains(t)) return;
    hideNameSuggestions();
  });

  if (inputName) {
    inputName.addEventListener('blur', function () {
      setTimeout(function () {
        hideNameSuggestions();
      }, 200);
      var name = (inputName.value || '').trim();
      if (!name) return;
      var wh = getAddFormWarehouseId();
      var qs = '?name=' + encodeURIComponent(name) + (wh ? '&warehouse_id=' + encodeURIComponent(wh) : '');
      fetch('/api/products/by-name' + qs, { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.success || !res.data) return;
          if (inputBarcode) inputBarcode.value = normalizeBarcode(res.data.barcode || '');
          applyProductLookupData(res.data);
        })
        .catch(function () { /* ignore */ });
    });
  }

  if (inputBarcode) {
    inputBarcode.addEventListener('input', function () {
      this.value = normalizeBarcode(this.value);
      var b = this.value;
      if (b.length !== 12) {
        if (b.length < 12) setLookupHint('');
        return;
      }
      lookupProductByBarcode(b)
        .then(function (res) {
          if (res && res.success && res.data) applyProductLookupData(res.data);
          else setLookupHint('');
        })
        .catch(function () { /* ignore */ });
    });
  }

  if (addProductWarehouse) {
    addProductWarehouse.addEventListener('change', function () {
      var b = inputBarcode && normalizeBarcode(inputBarcode.value || '') || '';
      if (b.length === 12) {
        lookupProductByBarcode(b)
          .then(function (res) {
            if (res && res.success && res.data) applyProductLookupData(res.data);
          })
          .catch(function () { /* ignore */ });
      } else {
        var n = inputName && (inputName.value || '').trim();
        if (n) {
          var wh = getAddFormWarehouseId();
          var qs = '?name=' + encodeURIComponent(n) + (wh ? '&warehouse_id=' + encodeURIComponent(wh) : '');
          fetch('/api/products/by-name' + qs, { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (res) {
              if (res && res.success && res.data) applyProductLookupData(res.data);
            })
            .catch(function () { /* ignore */ });
        }
      }
    });
  }

  var warehouseSelect = document.getElementById('products-warehouse-select');
  var addProductSupplier = document.getElementById('add-product-supplier');
  var editProductSupplier = document.getElementById('edit-product-supplier');

  function loadSuppliersForProductForms() {
    if (!addProductSupplier && !editProductSupplier) return;
    fetch('/api/suppliers', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        var opts = '<option value="">بدون مورد</option>' +
          res.data.map(function (s) {
            return '<option value="' + s.id + '">' + (s.name || '') + '</option>';
          }).join('');
        var keepAdd = addProductSupplier ? getSelectedValues(addProductSupplier) : [];
        var keepEdit = editProductSupplier ? getSelectedValues(editProductSupplier) : [];
        if (addProductSupplier) addProductSupplier.innerHTML = opts;
        if (editProductSupplier) editProductSupplier.innerHTML = opts;
        if (addProductSupplier && keepAdd.length) setSelectedValues(addProductSupplier, keepAdd);
        if (editProductSupplier && keepEdit.length) setSelectedValues(editProductSupplier, keepEdit);
      })
      .catch(function () { /* ignore */ });
  }

  function loadWarehousesSelect() {
    if (!warehouseSelect) return;
    fetch('/api/warehouses', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        var current = warehouseSelect.value;
        warehouseSelect.innerHTML = '<option value="">— المجموع الكلي —</option>' +
          res.data.map(function (w) { return '<option value="' + w.id + '">' + (w.name || '') + '</option>'; }).join('');
        if (current) warehouseSelect.value = current;
      });
  }

  var dispatchCart = [];
  var dispatchCartTbody = document.getElementById('dispatch-cart-tbody');
  var dispatchCartEmpty = document.getElementById('dispatch-cart-empty');
  var dispatchTotalRequired = document.getElementById('dispatch-total-required');
  var dispatchAmountPaid = document.getElementById('dispatch-amount-paid');
  var dispatchPaymentMethod = document.getElementById('dispatch-payment-method');
  var dispatchCurrentSupplierName = document.getElementById('dispatch-current-supplier-name');
  var btnDispatchPayment = document.getElementById('btn-dispatch-payment');
  var btnClearDispatchCart = document.getElementById('btn-clear-dispatch-cart');
  var dispatchPaymentMsg = document.getElementById('dispatch-payment-msg');

  function showDispatchPaymentMsg(text, isError) {
    if (!dispatchPaymentMsg) return;
    dispatchPaymentMsg.textContent = text || '';
    dispatchPaymentMsg.className = 'form-message mt-2 mb-0 ' + (isError ? 'error' : 'success');
  }

  function loadDispatchPaymentMethods() {
    if (!dispatchPaymentMethod) return;
    fetch('/api/payment-methods', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        var cur = dispatchPaymentMethod.value;
        dispatchPaymentMethod.innerHTML = '<option value="">بدون تحديد</option>' +
          res.data.map(function (pm) {
            return '<option value="' + pm.id + '">' + (pm.name || '') + '</option>';
          }).join('');
        if (cur) dispatchPaymentMethod.value = cur;
      })
      .catch(function () { /* ignore */ });
  }

  function updateDispatchSupplierLabel() {
    if (!dispatchCurrentSupplierName || !addProductSupplier) return;
    var opt = addProductSupplier.options[addProductSupplier.selectedIndex];
    var name = opt && opt.value ? (opt.textContent || opt.innerText || '').trim() : '';
    dispatchCurrentSupplierName.textContent = name || '—';
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function renderDispatchCart() {
    if (!dispatchCartTbody) return;
    if (dispatchCart.length === 0) {
      dispatchCartTbody.innerHTML = '';
      if (dispatchCartEmpty) dispatchCartEmpty.classList.remove('d-none');
      if (dispatchTotalRequired) dispatchTotalRequired.textContent = '0.00';
      return;
    }
    if (dispatchCartEmpty) dispatchCartEmpty.classList.add('d-none');
    var total = 0;
    dispatchCartTbody.innerHTML = dispatchCart.map(function (item, idx) {
      var line = (item.quantity || 0) * (parseFloat(item.purchase_price) || 0);
      var serialBadge = item.use_serial
        ? (' <span class="badge bg-info">Serial: ' + ((item.serials || []).length || 0) + '</span>')
        : '';
      total += line;
      return '<tr data-didx="' + idx + '">' +
        '<td>' + escapeHtml(item.name || '—') + '</td>' +
        '<td>' + escapeHtml(item.barcode || '—') + (item.product_id ? '' : ' <span class="badge bg-secondary">جديد</span>') + serialBadge + '</td>' +
        '<td><input type="number" class="form-control form-control-sm dispatch-qty-input" data-didx="' + idx + '" min="0.001" step="0.001" value="' + item.quantity + '"></td>' +
        '<td>' + Number(item.purchase_price || 0).toFixed(2) + '</td>' +
        '<td>' + Number(item.sale_price || 0).toFixed(2) + '</td>' +
        '<td>' + line.toFixed(2) + '</td>' +
        '<td><button type="button" class="btn btn-sm btn-outline-danger dispatch-remove" data-didx="' + idx + '">حذف</button></td>' +
        '</tr>';
    }).join('');
    if (dispatchTotalRequired) dispatchTotalRequired.textContent = total.toFixed(2);

    dispatchCartTbody.querySelectorAll('.dispatch-qty-input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var ix = parseInt(this.getAttribute('data-didx'), 10);
        var v = parseFloat(this.value);
        if (!isNaN(v) && v > 0 && dispatchCart[ix]) {
          dispatchCart[ix].quantity = v;
          renderDispatchCart();
        }
      });
    });
    dispatchCartTbody.querySelectorAll('.dispatch-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ix = parseInt(this.getAttribute('data-didx'), 10);
        dispatchCart.splice(ix, 1);
        renderDispatchCart();
      });
    });
  }

  function addToDispatchCart(item) {
    var qty = parseFloat(item.quantity) || 0;
    if (qty <= 0) return;
    var barcodeNorm = normalizeBarcode(item.barcode || '') || '';
    var pid = item.product_id ? parseInt(item.product_id, 10) : null;
    var existing = dispatchCart.find(function (c) {
      if (pid && c.product_id) return parseInt(c.product_id, 10) === pid;
      if (!pid && !c.product_id && barcodeNorm && normalizeBarcode(c.barcode || '') === barcodeNorm) return true;
      return false;
    });
    if (existing) {
      existing.quantity = (existing.quantity || 0) + qty;
      if (item.use_serial) {
        existing.use_serial = true;
        existing.serials = (existing.serials || []).concat(item.serials || []);
      }
    } else {
      dispatchCart.push({
        product_id: pid,
        name: item.name || '',
        barcode: barcodeNorm || null,
        quantity: qty,
        purchase_price: parseFloat(item.purchase_price) || 0,
        sale_price: parseFloat(item.sale_price) || 0,
        use_serial: !!item.use_serial,
        serials: Array.isArray(item.serials) ? item.serials.slice() : [],
      });
    }
    renderDispatchCart();
  }

  function loadWarehousesForAddForm() {
    if (!addProductWarehouse) return;
    fetch('/api/warehouses', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        addProductWarehouse.innerHTML = '<option value="">— اختر المخزن —</option>' +
          res.data.map(function (w) { return '<option value="' + w.id + '">' + (w.name || '') + '</option>'; }).join('');
      });
  }

  function loadProducts() {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/products', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">لا توجد منتجات. أضف منتجاً جديداً.</td></tr>';
          if (tableEmpty) tableEmpty.classList.remove('d-none');
          return;
        }
        var warehouseId = warehouseSelect && warehouseSelect.value ? warehouseSelect.value : '';
        var stockMap = {};
        if (warehouseId) {
          fetch('/api/warehouse-stock?warehouse_id=' + warehouseId, { credentials: 'same-origin' })
            .then(function (r2) { return r2.json(); })
            .then(function (stockRes) {
              if (stockRes.success && stockRes.data) stockMap = stockRes.data;
              renderProductsRows(res.data, stockMap);
            })
            .catch(function () { renderProductsRows(res.data, {}); });
        } else {
          res.data.forEach(function (p) {
            stockMap[p.id] = p.total_quantity != null ? p.total_quantity : 0;
          });
          renderProductsRows(res.data, stockMap);
        }
      })
      .catch(function () {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">فشل تحميل المنتجات</td></tr>';
      });
  }

  function escapeAttr(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function renderProductsRows(products, stockMap) {
    if (tableEmpty) tableEmpty.classList.add('d-none');
    var purchase = 0, sale = 0, qty = 0;
    tbody.innerHTML = products.map(function (p) {
      purchase = p.purchase_price != null ? Number(p.purchase_price) : 0;
      sale = p.sale_price != null ? Number(p.sale_price) : 0;
      qty = stockMap[p.id] != null ? Number(stockMap[p.id]) : 0;
      var effMin = Math.round(Number(p.effective_minimum_quantity != null ? p.effective_minimum_quantity : 0));
      var hasCustom = !!p.has_custom_minimum && Number(p.has_custom_minimum) !== 0;
      var minLabel = effMin + (hasCustom
        ? ' <span class="badge bg-secondary">خاص</span>'
        : ' <span class="text-muted small">عام</span>');
      var safeName = escapeAttr(p.name || '');
      var supplierIdsCsv = p.supplier_ids_csv ? String(p.supplier_ids_csv) : '';
      var supplierCell = p.supplier_names ? (p.supplier_names || '—') : '—';
      var supplierCount = parseCsvIds(supplierIdsCsv).length;
      var actionButtons = '';
      if (can('products_minimum_stock')) {
        actionButtons +=
          '<button type="button" class="btn btn-sm btn-outline-info me-1 btn-set-product-minimum"' +
          ' data-id="' + p.id + '"' +
          ' data-name="' + safeName + '"' +
          ' data-effective="' + effMin + '"' +
          ' data-has-custom="' + (hasCustom ? '1' : '0') + '"' +
          ' title="تعيين الحد الأدنى">' +
          '<i class="fas fa-arrow-down-short-wide me-1"></i>حد أدنى</button>';
      }
      if (can('products_edit')) {
        actionButtons +=
          '<button type="button" class="btn btn-sm btn-outline-primary me-1 btn-edit-product"' +
          ' data-id="' + p.id + '"' +
          ' data-name="' + safeName + '"' +
          ' data-barcode="' + (p.barcode || '') + '"' +
          ' data-purchase="' + purchase.toFixed(2) + '"' +
          ' data-sale="' + sale.toFixed(2) + '"' +
          ' data-supplier-ids="' + escapeAttr(supplierIdsCsv) + '"' +
          '>' +
          '<i class="fas fa-pen me-1"></i>تعديل</button>';
      }
      if (can('products_suppliers')) {
        actionButtons +=
          '<button type="button" class="btn btn-sm btn-outline-secondary me-1 btn-product-suppliers"' +
          ' data-name="' + safeName + '"' +
          ' data-supplier-names="' + escapeAttr(supplierCell === '—' ? '' : supplierCell) + '"' +
          ' data-supplier-count="' + supplierCount + '"' +
          '>' +
          '<i class="fas fa-truck me-1"></i>الموردين (' + supplierCount + ')</button>';
      }
      if (can('products_delete')) {
        actionButtons +=
          '<button type="button" class="btn-delete-soft btn-delete-product" data-id="' + p.id + '">' +
          '<i class="fas fa-trash-alt me-1"></i>حذف</button>';
      }
      if (!actionButtons) actionButtons = '<span class="text-muted small">—</span>';
      return '<tr>' +
        '<td>' + p.id + '</td>' +
        '<td>' + (p.name || '—') + '</td>' +
        '<td>' + (p.barcode || '—') + '</td>' +
        '<td>' + supplierCell + '</td>' +
        '<td>' + qty + '</td>' +
        '<td>' + purchase.toFixed(2) + '</td>' +
        '<td>' + sale.toFixed(2) + '</td>' +
        '<td>' + minLabel + '</td>' +
        '<td>' + actionButtons + '</td>' +
        '</tr>';
    }).join('');

    document.querySelectorAll('.btn-set-product-minimum').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!modalMinEl || !minProductIdInput || !minProductNameEl || !minProductInput) return;
        showMinProductMsg('', false);
        minProductIdInput.value = this.getAttribute('data-id') || '';
        minProductNameEl.textContent = this.getAttribute('data-name') || '—';
        minProductInput.value = this.getAttribute('data-effective') || '0';
        var modal = bootstrap.Modal.getOrCreateInstance(modalMinEl);
        modal.show();
      });
    });

    document.querySelectorAll('.btn-delete-product').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        if (!id || !confirm('حذف هذا المنتج (حذف ناعم)؟')) return;
        fetch('/api/products/' + id, { method: 'DELETE', credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.success) { loadProducts(); showMsg(data.message, false); }
            else showMsg(data.message || 'فشل الحذف', true);
          })
          .catch(function () { showMsg('حدث خطأ', true); });
      });
    });

    document.querySelectorAll('.btn-product-suppliers').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!modalProductSuppliersEl || !productSuppliersNameEl || !productSuppliersCountEl || !productSuppliersListEl) return;
        var name = this.getAttribute('data-name') || '—';
        var supplierNames = this.getAttribute('data-supplier-names') || '';
        var count = parseInt(this.getAttribute('data-supplier-count') || '0', 10);
        if (isNaN(count) || count < 0) count = 0;
        productSuppliersNameEl.textContent = name;
        productSuppliersCountEl.textContent = String(count);
        if (!supplierNames) {
          productSuppliersListEl.innerHTML = '<span class="text-muted small">لا يوجد موردون مرتبطون بهذا المنتج.</span>';
        } else {
          var tags = supplierNames.split('،').map(function (s) { return s.trim(); }).filter(Boolean);
          productSuppliersListEl.innerHTML = tags.map(function (tag) {
            return '<span class="badge bg-secondary">' + escapeAttr(tag) + '</span>';
          }).join('');
        }
        var modal = bootstrap.Modal.getOrCreateInstance(modalProductSuppliersEl);
        modal.show();
      });
    });

    // زر تعديل المنتج
    var editButtons = document.querySelectorAll('.btn-edit-product');
    var modalEl = document.getElementById('modal-edit-product');
    var editIdInput = document.getElementById('edit-product-id');
    var editNameInput = document.getElementById('edit-product-name');
    var editBarcodeInput = document.getElementById('edit-product-barcode');
    var editPurchaseInput = document.getElementById('edit-product-purchase');
    var editSaleInput = document.getElementById('edit-product-sale');
    var editSupplierSelect = document.getElementById('edit-product-supplier');
    var editMsgEl = document.getElementById('edit-product-message');
    var btnSaveEdit = document.getElementById('btn-save-product-edit');

    function showEditMsg(text, isError) {
      if (!editMsgEl) return;
      editMsgEl.textContent = text || '';
      editMsgEl.className = 'form-message mt-3 mb-0 ' + (isError ? 'error' : 'success');
    }

    if (editBarcodeInput) {
      editBarcodeInput.addEventListener('input', function () {
        this.value = normalizeBarcode(this.value);
      });
    }

    editButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!modalEl || !editIdInput || !editNameInput || !editBarcodeInput || !editPurchaseInput || !editSaleInput) return;
        showEditMsg('', false);
        editIdInput.value = this.getAttribute('data-id') || '';
        editNameInput.value = this.getAttribute('data-name') || '';
        editBarcodeInput.value = normalizeBarcode(this.getAttribute('data-barcode') || '');
        editPurchaseInput.value = this.getAttribute('data-purchase') || '0';
        editSaleInput.value = this.getAttribute('data-sale') || '0';
        if (editSupplierSelect) {
          var supplierIds = parseCsvIds(this.getAttribute('data-supplier-ids') || '');
          setSelectedValues(editSupplierSelect, supplierIds);
        }
        var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      });
    });

    if (btnSaveEdit && modalEl && editIdInput && editNameInput && editBarcodeInput && editPurchaseInput && editSaleInput) {
      btnSaveEdit.onclick = function () {
        showEditMsg('', false);
        var id = parseInt(editIdInput.value, 10);
        var name = (editNameInput.value || '').trim();
        var barcode = normalizeBarcode(editBarcodeInput.value || '');
        var purchase = parseFloat(editPurchaseInput.value);
        var sale = parseFloat(editSaleInput.value);
        if (!id) { showEditMsg('معرف المنتج غير صالح', true); return; }
        if (!name) { showEditMsg('اسم المنتج مطلوب', true); return; }
        if (barcode.length !== 12) {
          showEditMsg('الباركود يجب أن يكون 12 خانة (حروف أو أرقام) بالضبط', true);
          return;
        }
        if (isNaN(purchase) || purchase < 0) purchase = 0;
        if (isNaN(sale) || sale < 0) sale = 0;

        btnSaveEdit.disabled = true;
        btnSaveEdit.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>جاري التحقق...';

        // تحقق من عدم تكرار الباركود مع منتج آخر
        fetch('/api/products/by-barcode/' + encodeURIComponent(barcode), { credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function (check) {
            if (check && check.success && check.data && check.data.id !== id) {
              showEditMsg('هذا الباركود مستخدم لمنتج آخر. اختر باركود مختلف.', true);
              btnSaveEdit.disabled = false;
              btnSaveEdit.innerHTML = '<i class="fas fa-check me-1"></i>حفظ التعديلات';
              return Promise.reject(new Error('barcode_taken'));
            }

            btnSaveEdit.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>جاري الحفظ...';

            var payloadEdit = {
              name: name,
              barcode: barcode,
              purchase_price: purchase,
              sale_price: sale,
            };
            if (editSupplierSelect) payloadEdit.supplier_ids = getSelectedValues(editSupplierSelect);
            return fetch('/api/products/' + id, {
              method: 'PUT',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payloadEdit),
            });
          })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data) return;
            if (data.success) {
              showEditMsg(data.message || 'تم حفظ التعديلات', false);
              var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
              setTimeout(function () {
                modal.hide();
                loadProducts();
              }, 500);
            } else {
              showEditMsg(data.message || 'فشل حفظ التعديلات', true);
            }
          })
          .catch(function (err) {
            if (err && err.message === 'barcode_taken') return;
            showEditMsg('حدث خطأ في الاتصال', true);
          })
          .finally(function () {
            btnSaveEdit.disabled = false;
            btnSaveEdit.innerHTML = '<i class="fas fa-check me-1"></i>حفظ التعديلات';
          });
      };
    }
  }

  if (warehouseSelect) {
    warehouseSelect.addEventListener('change', function () { loadProducts(); });
  }
  function initProductsTabAccess() {
    if (!can('tab_dispatch')) return;
    loadWarehousesSelect();
    loadWarehousesForAddForm();
    loadSuppliersForProductForms();

  if (form && btnAdd) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearMsg();
      showDispatchPaymentMsg('', false);
      var name = (inputName && inputName.value || '').trim();
      var barcode = normalizeBarcode(inputBarcode && inputBarcode.value || '');
      var purchase = parseFloat(form.purchase_price && form.purchase_price.value) || 0;
      var sale = parseFloat(form.sale_price && form.sale_price.value) || 0;
      var warehouseId = form.warehouse_id && form.warehouse_id.value ? form.warehouse_id.value : '';
      var quantity = parseFloat(form.quantity && form.quantity.value);
      var useSerial = !!(useSerialCheckbox && useSerialCheckbox.checked);
      var serials = collectSerialsFromInputs();
      if (isNaN(quantity) || quantity <= 0) {
        showMsg('أدخل كمية أكبر من صفر لإضافة الصنف للسلة', true);
        return;
      }
      if (!name) { showMsg('اسم الصنف مطلوب', true); return; }
      if (barcode && barcode.length !== 12) {
        showMsg('إذا كُتب الباركود فيجب أن يكون 12 خانة (حروف أو أرقام) بالضبط', true);
        return;
      }
      if (useSerial) {
        if (Math.floor(quantity) !== quantity) {
          showMsg('عند استخدام Serial يجب أن تكون الكمية عدداً صحيحاً', true);
          return;
        }
        if (serials.length !== quantity) {
          showMsg('عدد حقول Serial يجب أن يساوي الكمية', true);
          return;
        }
        var cleaned = serials.map(function (s) { return String(s || '').trim(); });
        if (cleaned.some(function (s) { return !s; })) {
          showMsg('املأ كل حقول Serial أو ألغِ خيار Serial', true);
          return;
        }
        var uniq = new Set(cleaned);
        if (uniq.size !== cleaned.length) {
          showMsg('لا يمكن تكرار Serial داخل نفس الصنف', true);
          return;
        }
        serials = cleaned;
      } else {
        serials = [];
      }

      btnAdd.disabled = true;
      btnAdd.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>جاري التحقق...';

      var lookupPromise;
      if (barcode) {
        var whQs = warehouseId ? ('?warehouse_id=' + encodeURIComponent(warehouseId)) : '';
        lookupPromise = fetch('/api/products/by-barcode/' + encodeURIComponent(barcode) + whQs, { credentials: 'same-origin' })
          .then(function (r) { return r.json(); });
      } else {
        lookupPromise = Promise.resolve({ success: false, data: null });
      }

      lookupPromise
        .then(function (check) {
          if (check && check.success && check.data) {
            addToDispatchCart({
              product_id: check.data.id,
              name: check.data.name || name,
              barcode: check.data.barcode || barcode || null,
              quantity: quantity,
              purchase_price: purchase,
              sale_price: sale,
              use_serial: useSerial,
              serials: serials,
            });
            var stockNote = '';
            if (check.data.warehouse_quantity != null && warehouseId) {
              stockNote = ' الرصيد الحالي في المخزن: ' + Number(check.data.warehouse_quantity) + '.';
            } else if (check.data.total_quantity != null) {
              stockNote = ' إجمالي المخزون: ' + Number(check.data.total_quantity) + '.';
            }
            showMsg('تمت إضافة الصنف للسلة (منتج مسجل).' + stockNote + ' يمكنك تسجيل الدفعة عند الانتهاء.', false);
          } else {
            addToDispatchCart({
              product_id: null,
              name: name,
              barcode: barcode || null,
              quantity: quantity,
              purchase_price: purchase,
              sale_price: sale,
              use_serial: useSerial,
              serials: serials,
            });
            showMsg('تمت إضافة صنف جديد للسلة (يُنشأ عند تسجيل الدفعة).', false);
          }
          resetAddProductFormForNext();
        })
        .catch(function () {
          showMsg('حدث خطأ في الاتصال', true);
        })
        .finally(function () {
          btnAdd.disabled = false;
          btnAdd.innerHTML = '<i class="fas fa-cart-plus me-2"></i>إضافة للسلة';
        });
    });
  }

  if (btnClearDispatchCart) {
    btnClearDispatchCart.addEventListener('click', function () {
      if (dispatchCart.length && !confirm('مسح كل أصناف السلة؟')) return;
      dispatchCart = [];
      renderDispatchCart();
      showDispatchPaymentMsg('', false);
    });
  }

  if (btnResetAddForm) {
    btnResetAddForm.addEventListener('click', function () {
      clearMsg();
      resetAddProductFormForNext();
      if (inputName) inputName.focus();
    });
  }

  if (useSerialCheckbox) {
    useSerialCheckbox.addEventListener('change', function () {
      if (useSerialCheckbox.checked) {
        if (serialFieldsWrap) serialFieldsWrap.classList.remove('d-none');
        syncSerialInputsWithQuantity();
      } else {
        clearSerialUI();
      }
    });
  }

  if (form && form.quantity) {
    form.quantity.addEventListener('input', syncSerialInputsWithQuantity);
    form.quantity.addEventListener('change', syncSerialInputsWithQuantity);
  }

  if (btnGenerateSerialEan) {
    btnGenerateSerialEan.addEventListener('click', function () {
      if (!useSerialCheckbox || !useSerialCheckbox.checked) return;
      var fields = serialFieldsContainer ? serialFieldsContainer.querySelectorAll('.dispatch-serial-input') : [];
      if (!fields.length) return;
      fields.forEach(function (el) {
        if (!String(el.value || '').trim()) el.value = generateRandomEan13();
      });
    });
  }

  if (addProductSupplier) {
    addProductSupplier.addEventListener('change', function () {
      updateDispatchSupplierLabel();
    });
    setTimeout(updateDispatchSupplierLabel, 0);
  }

  if (btnDispatchPayment && addProductWarehouse && addProductSupplier && dispatchAmountPaid) {
    btnDispatchPayment.addEventListener('click', function () {
      showDispatchPaymentMsg('', false);
      var warehouseId = addProductWarehouse.value;
      var supplierVal = addProductSupplier.value ? addProductSupplier.value : '';
      if (!warehouseId) {
        showDispatchPaymentMsg('اختر المخزن في نموذج إضافة الصنف', true);
        return;
      }
      if (dispatchCart.length === 0) {
        showDispatchPaymentMsg('السلة فارغة', true);
        return;
      }
      var amountPaid = parseFloat(dispatchAmountPaid.value) || 0;
      var pmId = dispatchPaymentMethod && dispatchPaymentMethod.value ? parseInt(dispatchPaymentMethod.value, 10) : null;
      var payload = {
        supplier_id: supplierVal ? parseInt(supplierVal, 10) : null,
        warehouse_id: parseInt(warehouseId, 10),
        amount_paid: amountPaid,
        payment_method_id: pmId,
        items: dispatchCart.map(function (it) {
          return {
            product_id: it.product_id || null,
            name: it.name || null,
            barcode: it.barcode || null,
            quantity: it.quantity,
            purchase_price: it.purchase_price,
            sale_price: it.sale_price,
            use_serial: !!it.use_serial,
            serials: Array.isArray(it.serials) ? it.serials : [],
          };
        }),
      };
      btnDispatchPayment.disabled = true;
      fetch('/api/purchase-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            dispatchCart = [];
            renderDispatchCart();
            dispatchAmountPaid.value = '0';
            var selectedOpt = addProductSupplier.options[addProductSupplier.selectedIndex];
            var supplierName = selectedOpt && selectedOpt.value ? (selectedOpt.textContent || '').trim() : '';
            showDispatchPaymentMsg((data.message || 'تم تسجيل الدفعة وفاتورة الشراء') + (supplierName ? (' · المورد: ' + supplierName) : ''), false);
            clearMsg();
            loadProducts();
            if (data.data && data.data.id) {
              window.open('/print-purchase-invoice.html?id=' + data.data.id, '_blank', 'width=800,height=900');
            }
          } else {
            showDispatchPaymentMsg(data.message || 'فشل التسجيل', true);
          }
        })
        .catch(function () {
          showDispatchPaymentMsg('خطأ في الاتصال', true);
        })
        .finally(function () {
          btnDispatchPayment.disabled = false;
        });
    });
  }

  renderDispatchCart();

  // توليد باركود عشوائي من 12 رقم مع التحقق من عدم التكرار
  function randomBarcode12() {
    var s = '';
    // أول رقم من 1 إلى 9 حتى لا يبدأ الباركود بصفر
    s += (1 + Math.floor(Math.random() * 9)).toString();
    for (var i = 1; i < 12; i++) {
      s += Math.floor(Math.random() * 10).toString();
    }
    return s;
  }

  function generateUniqueBarcode(attemptsLeft) {
    attemptsLeft = attemptsLeft || 5;
    if (!inputBarcode) return;
    if (attemptsLeft <= 0) {
      showMsg('تعذّر توليد باركود غير مكرر الآن، حاول مرة أخرى.', true);
      if (btnGenerateBarcode) {
        btnGenerateBarcode.disabled = false;
        btnGenerateBarcode.innerHTML = '<i class="fas fa-magic"></i>';
      }
      return;
    }
    var code = randomBarcode12();
    fetch('/api/products/by-barcode/' + encodeURIComponent(code), { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.success && !res.data) {
          inputBarcode.value = code;
          showMsg('تم توليد باركود جديد غير مكرر.', false);
          if (btnGenerateBarcode) {
            btnGenerateBarcode.disabled = false;
            btnGenerateBarcode.innerHTML = '<i class="fas fa-magic"></i>';
          }
        } else {
          generateUniqueBarcode(attemptsLeft - 1);
        }
      })
      .catch(function () {
        showMsg('حدث خطأ أثناء التحقق من الباركود المولد.', true);
        if (btnGenerateBarcode) {
          btnGenerateBarcode.disabled = false;
          btnGenerateBarcode.innerHTML = '<i class="fas fa-magic"></i>';
        }
      });
  }

  if (btnGenerateBarcode && inputBarcode) {
    btnGenerateBarcode.addEventListener('click', function () {
      clearMsg();
      btnGenerateBarcode.disabled = true;
      btnGenerateBarcode.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      generateUniqueBarcode(7);
    });
  }

  if (btnSaveDefaultMin && defaultMinInput) {
    btnSaveDefaultMin.addEventListener('click', function () {
      var v = parseFloat(defaultMinInput.value);
      if (Number.isNaN(v) || v < 0) {
        showMinPanelMsg('أدخل رقماً صالحاً (≥ 0)', true);
        return;
      }
      btnSaveDefaultMin.disabled = true;
      fetch('/api/minimum-stock/default', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_minimum_quantity: Math.round(v) }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            showMinPanelMsg(data.message || 'تم الحفظ', false);
            loadProducts();
          } else {
            showMinPanelMsg(data.message || 'فشل الحفظ', true);
          }
        })
        .catch(function () { showMinPanelMsg('حدث خطأ في الاتصال', true); })
        .finally(function () { btnSaveDefaultMin.disabled = false; });
    });
  }

  if (btnApplyUnsetMin && defaultMinInput) {
    btnApplyUnsetMin.addEventListener('click', function () {
      var v = parseFloat(defaultMinInput.value);
      if (Number.isNaN(v) || v < 0) {
        showMinPanelMsg('أدخل قيمة في الحقل أولاً (≥ 0)', true);
        return;
      }
      if (!confirm('تطبيق الحد الأدنى ' + Math.round(v) + ' على كل المنتجات التي ليس لها حد خاص؟')) return;
      btnApplyUnsetMin.disabled = true;
      fetch('/api/minimum-stock/apply-unset', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minimum_quantity: Math.round(v) }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            showMinPanelMsg(data.message || 'تم التطبيق', false);
            loadProducts();
          } else {
            showMinPanelMsg(data.message || 'فشل التطبيق', true);
          }
        })
        .catch(function () { showMinPanelMsg('حدث خطأ في الاتصال', true); })
        .finally(function () { btnApplyUnsetMin.disabled = false; });
    });
  }

  function putProductMinimum(productId, minimumQuantityOrNull) {
    return fetch('/api/minimum-stock/product/' + encodeURIComponent(productId), {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minimum_quantity: minimumQuantityOrNull }),
    }).then(function (r) { return r.json(); });
  }

  if (btnSaveProductMin && modalMinEl && minProductIdInput && minProductInput) {
    btnSaveProductMin.addEventListener('click', function () {
      var id = parseInt(minProductIdInput.value, 10);
      if (!id) {
        showMinProductMsg('معرف المنتج غير صالح', true);
        return;
      }
      var raw = (minProductInput.value || '').trim();
      if (raw === '') {
        showMinProductMsg('أدخل رقماً أو استخدم «إعادة للافتراضي»', true);
        return;
      }
      var v = parseFloat(raw);
      if (Number.isNaN(v) || v < 0) {
        showMinProductMsg('الحد الأدنى يجب أن يكون رقماً ≥ 0', true);
        return;
      }
      btnSaveProductMin.disabled = true;
      putProductMinimum(id, Math.round(v))
        .then(function (data) {
          if (data.success) {
            showMinProductMsg(data.message || 'تم الحفظ', false);
            var modal = bootstrap.Modal.getOrCreateInstance(modalMinEl);
            setTimeout(function () {
              modal.hide();
              loadProducts();
            }, 400);
          } else {
            showMinProductMsg(data.message || 'فشل الحفظ', true);
          }
        })
        .catch(function () { showMinProductMsg('حدث خطأ في الاتصال', true); })
        .finally(function () { btnSaveProductMin.disabled = false; });
    });
  }

  if (btnClearProductMin && modalMinEl && minProductIdInput) {
    btnClearProductMin.addEventListener('click', function () {
      var id = parseInt(minProductIdInput.value, 10);
      if (!id) return;
      if (!confirm('إزالة الحد الخاص لهذا المنتج والاعتماد على الافتراضي العام؟')) return;
      btnClearProductMin.disabled = true;
      putProductMinimum(id, null)
        .then(function (data) {
          if (data.success) {
            showMinProductMsg(data.message || 'تم', false);
            var modal = bootstrap.Modal.getOrCreateInstance(modalMinEl);
            setTimeout(function () {
              modal.hide();
              loadProducts();
            }, 400);
          } else {
            showMinProductMsg(data.message || 'فشل', true);
          }
        })
        .catch(function () { showMinProductMsg('حدث خطأ في الاتصال', true); })
        .finally(function () { btnClearProductMin.disabled = false; });
    });
  }

  var tabProducts = document.getElementById('tab-products');
    if (tabProducts) {
      tabProducts.addEventListener('shown.bs.tab', function () {
        if (!can('tab_dispatch')) return;
      loadWarehousesSelect();
      loadWarehousesForAddForm();
      loadSuppliersForProductForms();
      setTimeout(updateDispatchSupplierLabel, 0);
      loadDispatchPaymentMethods();
      loadDefaultMinimum();
      loadProducts();
    });
  }
    if (document.querySelector('#panel-products.show, #panel-products.active')) {
      loadSuppliersForProductForms();
      setTimeout(updateDispatchSupplierLabel, 0);
      loadDispatchPaymentMethods();
      loadDefaultMinimum();
      loadProducts();
    }
  }

  window.addEventListener('suppliers:updated', function () {
    if (!can('tab_dispatch')) return;
    loadSuppliersForProductForms();
    setTimeout(updateDispatchSupplierLabel, 0);
  });

  window.addEventListener('warehouses:updated', function () {
    if (!can('tab_dispatch')) return;
    loadWarehousesSelect();
    loadWarehousesForAddForm();
  });

  window.addEventListener('warehouses:access-ready', initProductsTabAccess);
  initProductsTabAccess();
})();
