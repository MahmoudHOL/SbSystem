/**
 * لوحة التحكم - الشريط الجانبي + جلب اسم المستخدم
 */

(function () {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mainContent = document.getElementById('mainContent');
  const userDisplayName = document.getElementById('userDisplayName');
  const notificationsModal = document.getElementById('stockNotificationsModal');
  const stockNotificationsBadge = document.getElementById('stockNotificationsBadge');
  const countOutOfStock = document.getElementById('countOutOfStock');
  const countLowStock = document.getElementById('countLowStock');
  const stockNotificationsTbody = document.getElementById('stockNotificationsTbody');
  const creditCustomersCountEl = document.getElementById('dashboard-credit-customers-count');
  const creditTotalRemainingEl = document.getElementById('dashboard-credit-total-remaining');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function renderStockNotifications(payload) {
    const data = payload && payload.data ? payload.data : {};
    const counts = data.counts || {};
    const items = Array.isArray(data.items) ? data.items : [];
    const outCount = Number(counts.out_of_stock || 0);
    const lowCount = Number(counts.low_stock || 0);
    const totalCount = outCount + lowCount;

    if (countOutOfStock) countOutOfStock.textContent = 'منتهي: ' + outCount;
    if (countLowStock) countLowStock.textContent = 'أوشك على الانتهاء: ' + lowCount;
    if (stockNotificationsBadge) {
      stockNotificationsBadge.textContent = String(totalCount);
      stockNotificationsBadge.classList.toggle('d-none', totalCount <= 0);
    }

    if (!stockNotificationsTbody) return;
    if (!items.length) {
      stockNotificationsTbody.innerHTML =
        '<tr><td colspan="5" class="text-center text-muted">لا توجد إشعارات حالياً</td></tr>';
      return;
    }

    const rows = items.map(function (it) {
      const isOut = it.alert_type === 'out_of_stock';
      const mark = isOut
        ? '<span class="badge bg-danger">منتهي</span>'
        : '<span class="badge bg-warning text-dark">أوشك على الانتهاء</span>';
      return (
        '<tr>' +
        '<td>' + mark + '</td>' +
        '<td>' + esc(it.product_name || '—') + '</td>' +
        '<td><code class="small">' + esc(it.barcode || '—') + '</code></td>' +
        '<td>' + esc(it.warehouse_name || '—') + '</td>' +
        '<td>' + Math.round(Number(it.quantity || 0)) + '</td>' +
        '</tr>'
      );
    }).join('');

    stockNotificationsTbody.innerHTML = rows;
  }

  function loadStockNotifications() {
    return fetch('/api/dashboard/stock-notifications?limit=80', { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success) throw new Error('bad_data');
        renderStockNotifications(data);
      })
      .catch(function () {
        if (stockNotificationsTbody) {
          stockNotificationsTbody.innerHTML =
            '<tr><td colspan="5" class="text-center text-danger">تعذر تحميل الإشعارات</td></tr>';
        }
      });
  }

  function loadCreditCustomersSummary() {
    if (!creditCustomersCountEl || !creditTotalRemainingEl) return;
    creditCustomersCountEl.textContent = '...';
    creditTotalRemainingEl.textContent = '...';
    fetch('/api/credit-customers/profile', { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success || !Array.isArray(data.data)) throw new Error('bad_data');
        var list = data.data;
        var totalRemaining = list.reduce(function (sum, row) {
          return sum + Number(row.total_remaining || 0);
        }, 0);
        creditCustomersCountEl.textContent = String(list.length);
        creditTotalRemainingEl.textContent = totalRemaining.toFixed(2) + ' ج.م';
      })
      .catch(function () {
        creditCustomersCountEl.textContent = '0';
        creditTotalRemainingEl.textContent = '0.00 ج.م';
      });
  }

  function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('show');
    if (mainContent) mainContent.classList.toggle('sidebar-open');
  }

  if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

  // السنة في التذييل
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // جلب اسم المستخدم من الجلسة
  function loadUser() {
    fetch('/api/me', { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then(function (data) {
        if (userDisplayName) {
          userDisplayName.textContent = data.fullName || data.username || 'مستخدم';
        }
      })
      .catch(function () {
        if (userDisplayName) userDisplayName.textContent = 'مستخدم';
      });
  }

  loadUser();
  loadStockNotifications();
  loadCreditCustomersSummary();
  if (notificationsModal) {
    notificationsModal.addEventListener('show.bs.modal', function () {
      if (stockNotificationsTbody) {
        stockNotificationsTbody.innerHTML =
          '<tr><td colspan="5" class="text-center text-muted">جاري التحميل...</td></tr>';
      }
      loadStockNotifications();
    });
  }

  // تأثير ظهور البطاقات
  document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(function (card, index) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      setTimeout(function () {
        card.style.transition = 'all 0.6s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  });
})();
