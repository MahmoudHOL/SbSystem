/**
 * قبل أي طلب معدّل إلى /api/ يتم التحقق من أن الخادم يستجيب والجلسة صالحة.
 * يقلل من تنفيذ عمليات بعد انقطاع السيرفر ثم إعادة إرسال طلب كان يبدو فاشلاً دون التأكد من الاتصال.
 * لا يُغيّر طلبات GET ولا POST /login (خارج /api/).
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;

  var origFetch = window.fetch.bind(window);
  var PING_TIMEOUT_MS = 8000;

  function pathnameForRequest(input, init) {
    init = init || {};
    try {
      if (typeof input === 'string') {
        return new URL(input, window.location.origin).pathname;
      }
      if (input && typeof input === 'object' && typeof input.url === 'string') {
        return new URL(input.url, window.location.origin).pathname;
      }
    } catch (e) {}
    return '';
  }

  function methodForRequest(input, init) {
    init = init || {};
    if (init.method) return String(init.method).toUpperCase();
    if (input && typeof input === 'object' && input.method) {
      return String(input.method).toUpperCase();
    }
    return 'GET';
  }

  function shouldGuardApiMutation(input, init) {
    var method = methodForRequest(input, init);
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false;
    var path = pathnameForRequest(input, init);
    if (!path.startsWith('/api/')) return false;
    return true;
  }

  function verifyServerSession() {
    var ctrl = new AbortController();
    var t = setTimeout(function () {
      ctrl.abort();
    }, PING_TIMEOUT_MS);
    return origFetch('/api/me?_sb_ping=' + Date.now(), {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      signal: ctrl.signal,
    })
      .then(function (res) {
        clearTimeout(t);
        if (res.status === 401) {
          return {
            ok: false,
            message: 'انتهت الجلسة. سجّل الدخول من جديد قبل تنفيذ العملية.',
          };
        }
        if (!res.ok) {
          return {
            ok: false,
            message: 'الخادم غير متاح مؤقتاً (' + res.status + '). تأكد من تشغيل السيرفر ثم أعد المحاولة.',
          };
        }
        return { ok: true };
      })
      .catch(function (e) {
        clearTimeout(t);
        if (e && e.name === 'AbortError') {
          return {
            ok: false,
            message: 'انتهت مهلة الاتصال بالخادم. تحقق من الشبكة والسيرفر قبل إعادة المحاولة.',
          };
        }
        return {
          ok: false,
          message:
            'لا يوجد اتصال فعّال بالخادم. لا تُنفَّذ العملية حتى يعود الاتصال؛ بعد التأكد أعد المحاولة يدوياً فقط.',
        };
      });
  }

  window.fetch = function (input, init) {
    if (!shouldGuardApiMutation(input, init)) {
      return origFetch(input, init);
    }
    return verifyServerSession().then(function (check) {
      if (!check.ok) {
        var err = new Error(check.message);
        err.sbNetBlocked = true;
        return Promise.reject(err);
      }
      return origFetch(input, init);
    });
  };

  window.SbNet = {
    verifyServerSession: verifyServerSession,
    fetch: origFetch,
  };
})();
