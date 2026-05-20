/**
 * HTML includes loader (sync) to ensure fragments
 * are injected before feature scripts run.
 */
(function () {
  function loadInclude(el) {
    var url = el.getAttribute('data-include-html');
    if (!url) return;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        el.outerHTML = xhr.responseText;
      } else {
        el.innerHTML = '';
      }
    } catch (e) {
      el.innerHTML = '';
    }
  }

  function run() {
    var includeNodes = document.querySelectorAll('[data-include-html]');
    includeNodes.forEach(loadInclude);
  }

  run();
})();
