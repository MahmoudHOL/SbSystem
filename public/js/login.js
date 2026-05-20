/**
 * تسجيل الدخول (شاشة Intro منفصلة في /splash أو من Electron)
 */

(function () {
  const loginForm = document.getElementById('login-form');
  const msgError = document.getElementById('msg-error');

  // إرسال النموذج
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (msgError) msgError.classList.remove('visible');
      const btn = loginForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'جاري الدخول...';
      }

      const formData = new FormData(loginForm);
      const body = {
        username: formData.get('username') || '',
        password: formData.get('password') || '',
      };

      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));

        if (data.success) {
          window.location.href = '/dashboard';
          return;
        }
        if (msgError) {
          msgError.textContent = data.message || 'فشل تسجيل الدخول';
          msgError.classList.add('visible');
        }
      } catch (err) {
        if (msgError) {
          msgError.textContent = 'حدث خطأ في الاتصال. حاول مرة أخرى.';
          msgError.classList.add('visible');
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'تسجيل الدخول';
        }
      }
    });
  }

})();
