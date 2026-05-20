(function () {
  var tabsRoot = document.getElementById('warehousesTabs');
  var access = {
    tab_warehouses: false,
    tab_dispatch: false,
    tab_suppliers_list: false,
    dispatch_create_supplier: false,
    dispatch_search: false,
    dispatch_add_product: false,
    products_minimum_stock: false,
    products_edit: false,
    products_suppliers: false,
    products_delete: false,
    suppliers_statement: false,
    log_edit_amount: false,
    log_edit_invoice: false,
    log_delete_invoice: false,
  };

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
    if (!tabsRoot || !window.bootstrap || !window.bootstrap.Tab) return;
    var first = tabsRoot.querySelector('button.nav-link:not([aria-disabled="true"])');
    if (first) {
      window.bootstrap.Tab.getOrCreateInstance(first).show();
    }
  }

  function applyStaticVisibility() {
    setTabVisible('tab-warehouses', 'panel-warehouses', !!access.tab_warehouses);
    setTabVisible('tab-products', 'panel-products', !!access.tab_dispatch);
    setTabVisible('tab-suppliers-list', 'panel-suppliers-list', !!access.tab_suppliers_list);
    if (!access.dispatch_create_supplier) {
      var createSupplierCard = document.getElementById('dispatch-create-supplier-card');
      if (createSupplierCard) createSupplierCard.classList.add('d-none');
    }
    if (!access.dispatch_add_product) {
      var addProductCard = document.getElementById('dispatch-add-product-card');
      if (addProductCard) addProductCard.classList.add('d-none');
    }
    if (!access.dispatch_search) {
      var nameInput = document.getElementById('product-name');
      var barcodeInput = document.getElementById('product-barcode');
      var generateBarcodeBtn = document.getElementById('btn-generate-barcode');
      if (nameInput) nameInput.disabled = true;
      if (barcodeInput) barcodeInput.disabled = true;
      if (generateBarcodeBtn) generateBarcodeBtn.classList.add('d-none');
    }
    if (!access.products_minimum_stock) {
      var minBtn = document.getElementById('btn-open-minimum-stock-modal');
      if (minBtn) minBtn.classList.add('d-none');
    }
    activateFirstVisibleTab();
  }

  window.WAREHOUSES_ACCESS = access;
  window.hasWarehousesPermission = function (key) {
    return !!(window.WAREHOUSES_ACCESS && window.WAREHOUSES_ACCESS[key]);
  };

  fetch('/api/warehouses-access', { credentials: 'same-origin' })
    .then(function (res) { return res.json(); })
    .then(function (result) {
      if (!result || !result.success || !result.data) throw new Error('failed');
      window.WAREHOUSES_ACCESS = Object.assign(access, result.data || {});
      applyStaticVisibility();
      window.dispatchEvent(new Event('warehouses:access-ready'));
    })
    .catch(function () {
      applyStaticVisibility();
      window.dispatchEvent(new Event('warehouses:access-ready'));
    });
})();

