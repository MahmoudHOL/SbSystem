(function () {
  var tabsRoot = document.getElementById('posTabs');
  var access = {
    tab_sales_log: false,
    tab_returns: false,
    tab_credit_customers: false,
    sales_log_edit_quantity: false,
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

  function applyVisibility() {
    setTabVisible('tab-pos-sales-log', 'panel-pos-sales-log', !!access.tab_sales_log);
    setTabVisible('tab-pos-returns', 'panel-pos-returns', !!access.tab_returns);
    setTabVisible('tab-pos-credit', 'panel-pos-credit', !!access.tab_credit_customers);
    activateFirstVisibleTab();
  }

  window.POS_ACCESS = access;
  window.hasPosPermission = function (key) {
    return !!(window.POS_ACCESS && window.POS_ACCESS[key]);
  };

  fetch('/api/pos-access', { credentials: 'same-origin' })
    .then(function (res) { return res.json(); })
    .then(function (result) {
      if (!result || !result.success || !result.data) throw new Error('failed');
      window.POS_ACCESS = Object.assign(access, result.data || {});
      applyVisibility();
      window.dispatchEvent(new Event('pos:access-ready'));
    })
    .catch(function () {
      applyVisibility();
      window.dispatchEvent(new Event('pos:access-ready'));
    });
})();

