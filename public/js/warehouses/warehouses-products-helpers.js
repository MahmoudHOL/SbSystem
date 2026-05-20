(function () {
  function getSelectedValues(selectEl) {
    if (!selectEl) return [];
    return Array.prototype.slice.call(selectEl.selectedOptions || [])
      .map(function (opt) { return String(opt.value || '').trim(); })
      .filter(function (v) { return v !== ''; });
  }

  function setSelectedValues(selectEl, values) {
    if (!selectEl) return;
    var wanted = new Set((values || []).map(function (v) { return String(v); }));
    Array.prototype.slice.call(selectEl.options || []).forEach(function (opt) {
      opt.selected = wanted.has(String(opt.value));
    });
  }

  function parseCsvIds(csv) {
    if (!csv) return [];
    return String(csv)
      .split(',')
      .map(function (v) { return v.trim(); })
      .filter(function (v) { return /^[0-9]+$/.test(v); });
  }

  window.WarehousesProductsHelpers = {
    getSelectedValues: getSelectedValues,
    setSelectedValues: setSelectedValues,
    parseCsvIds: parseCsvIds,
  };
})();
