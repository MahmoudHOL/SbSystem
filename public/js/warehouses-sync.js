/**
 * بعد إنشاء مخزن جديد استدعِ notifyWarehousesChanged() لتحديث القوائم المنسدلة
 * في نفس الصفحة وباقي التابات (عبر storage).
 */
(function () {
  var EVT = 'warehouses:updated';
  var BUMP_KEY = 'sb-warehouses-bump';

  window.notifyWarehousesChanged = function () {
    try {
      window.dispatchEvent(new CustomEvent(EVT));
      localStorage.setItem(BUMP_KEY, String(Date.now()));
    } catch (e) {}
  };

  window.addEventListener('storage', function (e) {
    if (e.key !== BUMP_KEY || e.newValue == null) return;
    try {
      window.dispatchEvent(new CustomEvent(EVT));
    } catch (err) {}
  });
})();
