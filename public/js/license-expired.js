(function () {
  var fpEl = document.getElementById('machine-fingerprint');
  var reasonEl = document.getElementById('license-reason');
  fetch('/api/license-status', { credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (!res || !res.success || !res.data) return;
      if (fpEl) fpEl.textContent = res.data.fingerprint || '—';
      if (reasonEl) reasonEl.textContent = 'Reason: ' + (res.data.reason || 'license_required') + ' | Mode: ' + (res.data.mode || '-');
    })
    .catch(function () {});
})();
