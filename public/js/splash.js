(function () {
  var video = document.getElementById('intro-video');
  var skip = document.getElementById('skip-intro');
  function finish() {
    if (window.electronAPI && typeof window.electronAPI.splashDone === 'function') {
      window.electronAPI.splashDone();
    } else {
      window.location.href = '/login';
    }
  }
  if (video) video.play().catch(function () {});
  if (video) video.addEventListener('ended', finish);
  if (skip) skip.addEventListener('click', finish);
})();
