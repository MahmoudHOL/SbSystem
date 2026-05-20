/**
 * حقن شريط عنوان مخصص عند التشغيل داخل Electron
 */
(function () {
  if (typeof window.electronAPI === 'undefined') return;

  document.body.classList.add('electron-app', 'has-titlebar');

  var titlebar = document.createElement('div');
  titlebar.className = 'electron-titlebar';
  titlebar.innerHTML =
    '<span class="electron-titlebar-title">SB Smart</span>' +
    '<div class="electron-titlebar-controls">' +
    '  <button type="button" id="electron-btn-minimize" aria-label="تصغير">−</button>' +
    '  <button type="button" id="electron-btn-maximize" aria-label="تكبير">□</button>' +
    '  <button type="button" id="electron-btn-close" class="close" aria-label="إغلاق">×</button>' +
    '</div>';

  document.body.insertBefore(titlebar, document.body.firstChild);

  // منع الـ scroll عندما تكون عجلة الماوس فوق شريط العنوان
  titlebar.addEventListener('wheel', function (e) {
    e.preventDefault();
  }, { passive: false });

  var btnMin = document.getElementById('electron-btn-minimize');
  var btnMax = document.getElementById('electron-btn-maximize');
  var btnClose = document.getElementById('electron-btn-close');

  if (btnMin) btnMin.addEventListener('click', function () { window.electronAPI.minimize(); });
  if (btnMax) btnMax.addEventListener('click', function () { window.electronAPI.maximize(); });
  if (btnClose) btnClose.addEventListener('click', function () { window.electronAPI.close(); });

  var titleEl = titlebar.querySelector('.electron-titlebar-title');
  if (window.electronAPI.setTitle && titleEl) {
    var docTitle = document.title;
    if (docTitle) titleEl.textContent = docTitle;
    if (typeof document.addEventListener === 'function') {
      var observer = new MutationObserver(function () {
        if (document.title) titleEl.textContent = document.title;
      });
      observer.observe(document.querySelector('title') || document.head, { childList: true, characterData: true, subtree: true });
    }
  }
})();
