/**
 * POS - فورم المنتجات (مقسمة حسب الحروف)
 * تعتمد فقط على /api/products
 */

(function () {
  const sectionsContainer = document.getElementById('pos-products-sections');
  const alphabetNav = document.getElementById('pos-alphabet-nav');
  const searchBarcode = document.getElementById('pos-search-barcode');
  const searchName = document.getElementById('pos-search-name');

  let allProducts = [];
  let currentProducts = [];

  if (!sectionsContainer) {
    return;
  }

  function getFirstChar(name) {
    if (!name) return '#';
    let n = name.trim();
    if (n.startsWith('ال') && n.length > 2) {
      n = n.substring(2);
    }
    const ch = n.charAt(0).toUpperCase();
    if (/[\u0600-\u06FF]/.test(ch)) {
      if (['أ', 'إ', 'آ', 'ا', 'ء'].includes(ch)) return 'ا';
      return ch;
    }
    if (/[A-Z]/.test(ch)) return ch;
    if (/[0-9]/.test(ch)) return '0-9';
    return '#';
  }

  function sortProducts(list) {
    return list
      .slice()
      .sort(function (a, b) {
        const aName = (a.name || '').trim();
        const bName = (b.name || '').trim();
        return aName.localeCompare(bName, 'ar', {
          sensitivity: 'base',
          numeric: true,
        });
      });
  }

  function setActiveButton(ch) {
    if (!alphabetNav) return;
    alphabetNav.querySelectorAll('button').forEach(function (b) {
      if (b.dataset.char === ch) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  function buildAlphabetNav(grouped) {
    if (!alphabetNav) return;
    alphabetNav.innerHTML = '';

    const btnAll = document.createElement('button');
    btnAll.type = 'button';
    btnAll.className = 'btn btn-sm btn-outline-secondary active';
    btnAll.textContent = 'الكل';
    btnAll.dataset.char = 'all';
    btnAll.addEventListener('click', function () {
      setActiveButton('all');
      renderAllFlat();
    });
    alphabetNav.appendChild(btnAll);

    const english = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const arabic = [
      'ا',
      'ب',
      'ت',
      'ث',
      'ج',
      'ح',
      'خ',
      'د',
      'ذ',
      'ر',
      'ز',
      'س',
      'ش',
      'ص',
      'ض',
      'ط',
      'ظ',
      'ع',
      'غ',
      'ف',
      'ق',
      'ك',
      'ل',
      'م',
      'ن',
      'ه',
      'و',
      'ي',
    ];
    const numbers = ['0-9'];
    const other = ['#'];
    const order = english.concat(arabic, numbers, other);

    order.forEach(function (ch) {
      if (!grouped[ch] || grouped[ch].length === 0) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-outline-secondary';
      btn.textContent = ch;
      btn.dataset.char = ch;
      btn.addEventListener('click', function () {
        setActiveButton(ch);
        renderSingleLetter(ch);
      });
      alphabetNav.appendChild(btn);
    });
  }

  function buildGroups(products) {
    const grouped = {};
    products.forEach(function (p) {
      const ch = getFirstChar(p.name || '');
      if (!grouped[ch]) grouped[ch] = [];
      grouped[ch].push(p);
    });
    return grouped;
  }

  function renderAllFlat() {
    const products = currentProducts;
    sectionsContainer.innerHTML = '';
    if (!products.length) {
      const p = document.createElement('p');
      p.className = 'text-muted text-center mb-0';
      p.textContent = 'لا توجد منتجات مطابقة.';
      sectionsContainer.appendChild(p);
      return;
    }

    const container = document.createElement('div');
    container.className = 'd-flex flex-wrap gap-2';

    sortProducts(products).forEach(function (p) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-outline-primary';
      btn.textContent =
        (p.name || '') +
        ' - ' +
        Number(p.sale_price || 0).toFixed(2) +
        ' ج.م';
      btn.addEventListener('click', function () {
        if (window.posCart && typeof window.posCart.addProductFromList === 'function') {
          window.posCart.addProductFromList({
            id: p.id,
            name: p.name,
            barcode: p.barcode,
            sale_price: p.sale_price,
          });
        }
      });
      container.appendChild(btn);
    });

    sectionsContainer.appendChild(container);
  }

  function renderSingleLetter(ch) {
    const grouped = buildGroups(currentProducts);
    const list = grouped[ch] || [];

    sectionsContainer.innerHTML = '';
    if (!list.length) {
      const p = document.createElement('p');
      p.className = 'text-muted text-center mb-0';
      p.textContent = 'لا توجد منتجات لهذا الحرف.';
      sectionsContainer.appendChild(p);
      return;
    }

    const section = document.createElement('div');
    section.className = 'mb-3';
    section.dataset.letter = ch;

    const header = document.createElement('div');
    header.className = 'mb-2 fw-bold';
    header.textContent = ch + ' (' + list.length + ')';
    section.appendChild(header);

    const container = document.createElement('div');
    container.className = 'd-flex flex-wrap gap-2';

    sortProducts(list).forEach(function (p) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-outline-primary';
      btn.textContent =
        (p.name || '') +
        ' - ' +
        Number(p.sale_price || 0).toFixed(2) +
        ' ج.م';
      btn.addEventListener('click', function () {
        if (window.posCart && typeof window.posCart.addProductFromList === 'function') {
          window.posCart.addProductFromList({
            id: p.id,
            name: p.name,
            barcode: p.barcode,
            sale_price: p.sale_price,
          });
        }
      });
      container.appendChild(btn);
    });

    section.appendChild(container);
    sectionsContainer.appendChild(section);
  }

  function renderProducts(filtered) {
    const products = filtered || allProducts;
    currentProducts = products;

    sectionsContainer.innerHTML = '';
    if (!products.length) {
      const p = document.createElement('p');
      p.className = 'text-muted text-center mb-0';
      p.textContent = 'لا توجد منتجات مطابقة.';
      sectionsContainer.appendChild(p);
      if (alphabetNav) alphabetNav.innerHTML = '';
      return;
    }

    const grouped = buildGroups(products);
    buildAlphabetNav(grouped);

    const english = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const arabic = [
      'ا',
      'ب',
      'ت',
      'ث',
      'ج',
      'ح',
      'خ',
      'د',
      'ذ',
      'ر',
      'ز',
      'س',
      'ش',
      'ص',
      'ض',
      'ط',
      'ظ',
      'ع',
      'غ',
      'ف',
      'ق',
      'ك',
      'ل',
      'م',
      'ن',
      'ه',
      'و',
      'ي',
    ];
    const numbers = ['0-9'];
    const other = ['#'];
    const order = english.concat(arabic, numbers, other);
    // إذا تم الضغط على "الكل" أو في البداية: عرض كل المنتجات بدون سكاشن
    renderAllFlat();
    setActiveButton('all');
  }

  function applySearch() {
    const barcodeTerm = (
      (searchBarcode && searchBarcode.value) ||
      ''
    )
      .trim()
      .toLowerCase();
    const nameTerm = (
      (searchName && searchName.value) ||
      ''
    )
      .trim()
      .toLowerCase();

    if (!barcodeTerm && !nameTerm) {
      renderProducts(null);
      return;
    }

    const filtered = allProducts.filter(function (p) {
      const name = (p.name || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      let ok = true;
      if (barcodeTerm) ok = ok && barcode.includes(barcodeTerm);
      if (nameTerm) ok = ok && name.includes(nameTerm);
      return ok;
    });

    renderProducts(filtered);
  }

  function loadProducts() {
    sectionsContainer.innerHTML =
      '<p class="text-muted text-center mb-0">جاري تحميل المنتجات...</p>';
    fetch('/api/products', { credentials: 'same-origin' })
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        if (!res.success || !Array.isArray(res.data)) {
          sectionsContainer.innerHTML =
            '<p class="text-danger text-center mb-0">فشل تحميل المنتجات.</p>';
          return;
        }
        allProducts = res.data || [];
        renderProducts(null);
      })
      .catch(function () {
        sectionsContainer.innerHTML =
          '<p class="text-danger text-center mb-0">فشل تحميل المنتجات.</p>';
      });
  }

  if (searchBarcode) {
    searchBarcode.addEventListener('input', applySearch);
  }
  if (searchName) {
    searchName.addEventListener('input', applySearch);
  }

  // سنة التذييل
  var yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  loadProducts();
})();

