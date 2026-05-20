(function () {
  var tabTransfer = document.getElementById('tab-transfer');
  var panelTransfer = document.getElementById('panel-transfer');
  if (!panelTransfer) return;

  var fromSelect = document.getElementById('transfer-from-warehouse');
  var toSelect = document.getElementById('transfer-to-warehouse');
  var modePartialRadio = document.getElementById('transfer-mode-partial');
  var modeAllRadio = document.getElementById('transfer-mode-all');
  var productsTableWrap = document.getElementById('transfer-products-wrap');
  var transferTbody = document.getElementById('transfer-products-tbody');
  var transferSearch = document.getElementById('transfer-search');
  var btnExecuteTransfer = document.getElementById('btn-execute-transfer');
  var btnExecuteAll = document.getElementById('btn-execute-transfer-all');
  var msgBox = document.getElementById('transfer-msg');

  function showMsg(text, isError) {
    if (!msgBox) return;
    msgBox.textContent = text || '';
    if (!text) {
      msgBox.className = 'form-message mt-2 mb-0';
    } else {
      msgBox.className = 'form-message mt-2 mb-0 ' + (isError ? 'error' : 'success');
    }
  }

  function loadWarehousesIntoSelect(selectEl) {
    if (!selectEl) return;
    fetch('/api/warehouses', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        var current = selectEl.value;
        selectEl.innerHTML = '<option value="">— اختر المخزن —</option>' +
          res.data.map(function (w) {
            return '<option value="' + w.id + '">' + (w.name || '') + '</option>';
          }).join('');
        if (current) selectEl.value = current;
      });
  }

  function toggleModeUI() {
    var isAll = modeAllRadio && modeAllRadio.checked;
    if (productsTableWrap) {
      productsTableWrap.style.display = isAll ? 'none' : 'block';
    }
    if (btnExecuteTransfer) btnExecuteTransfer.style.display = isAll ? 'none' : 'inline-block';
    if (btnExecuteAll) btnExecuteAll.style.display = isAll ? 'inline-block' : 'none';
    showMsg('', false);
  }

  function loadProductsForTransfer() {
    if (!fromSelect || !transferTbody) return;
    var fromId = fromSelect.value;
    if (!fromId) {
      transferTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">اختر مخزن المصدر أولاً.</td></tr>';
      return;
    }
    transferTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">جاري تحميل الأصناف...</td></tr>';

    fetch('/api/products', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) {
          transferTbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">فشل تحميل المنتجات.</td></tr>';
          return;
        }
        var products = res.data;
        fetch('/api/warehouse-stock?warehouse_id=' + encodeURIComponent(fromId), { credentials: 'same-origin' })
          .then(function (r2) { return r2.json(); })
          .then(function (stockRes) {
            var stockMap = {};
            if (stockRes.success && stockRes.data) stockMap = stockRes.data;
            var rows = products.filter(function (p) {
              var q = stockMap[p.id] != null ? Number(stockMap[p.id]) : 0;
              return q > 0;
            });
            if (!rows.length) {
              transferTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">لا توجد كميات في هذا المخزن.</td></tr>';
              return;
            }
            transferTbody.innerHTML = rows.map(function (p) {
              var available = stockMap[p.id] != null ? Number(stockMap[p.id]) : 0;
              return '<tr data-product-id="' + p.id + '" data-available="' + available + '">' +
                '<td>' + (p.name || '—') + '</td>' +
                '<td>' + (p.barcode || '—') + '</td>' +
                '<td>' + available + '</td>' +
                '<td><input type="number" class="form-control form-control-sm transfer-qty" min="0.001" step="0.001" max="' + available + '" value="0"></td>' +
                '<td><button type="button" class="btn btn-sm btn-outline-light btn-fill-all">كل الكمية</button></td>' +
                '</tr>';
            }).join('');

            transferTbody.querySelectorAll('.btn-fill-all').forEach(function (btn) {
              btn.addEventListener('click', function () {
                var tr = this.closest('tr');
                var avail = parseFloat(tr.getAttribute('data-available')) || 0;
                var inp = tr.querySelector('.transfer-qty');
                if (inp) inp.value = avail;
              });
            });

            applyTransferFilter();
          })
          .catch(function () {
            transferTbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">فشل تحميل الكميات.</td></tr>';
          });
      })
      .catch(function () {
        transferTbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">فشل تحميل المنتجات.</td></tr>';
      });
  }

  function applyTransferFilter() {
    if (!transferTbody) return;
    var q = transferSearch && transferSearch.value ? transferSearch.value.trim().toLowerCase() : '';
    var rows = transferTbody.querySelectorAll('tr[data-product-id]');
    if (!rows.length) return;
    rows.forEach(function (tr) {
      var nameCell = tr.children[0] ? tr.children[0].textContent || '' : '';
      var barcodeCell = tr.children[1] ? tr.children[1].textContent || '' : '';
      var text = (nameCell + ' ' + barcodeCell).toLowerCase();
      var match = !q || text.indexOf(q) !== -1;
      tr.style.display = match ? '' : 'none';
    });
  }

  function executePartialTransfer() {
    if (!fromSelect || !toSelect || !transferTbody) return;
    var fromId = fromSelect.value;
    var toId = toSelect.value;
    if (!fromId || !toId) {
      showMsg('اختر المخزن المصدر والمخزن الهدف أولاً', true);
      return;
    }
    if (fromId === toId) {
      showMsg('يجب أن يكون المخزن المصدر مختلفاً عن الهدف', true);
      return;
    }
    var rows = transferTbody.querySelectorAll('tr[data-product-id]');
    var items = [];
    rows.forEach(function (tr) {
      var productId = tr.getAttribute('data-product-id');
      var available = parseFloat(tr.getAttribute('data-available')) || 0;
      var inp = tr.querySelector('.transfer-qty');
      var qty = inp ? parseFloat(inp.value) : 0;
      if (productId && qty > 0) {
        if (qty > available) {
          items = null;
          showMsg('الكمية المطلوب نقلها لأحد الأصناف أكبر من المتاح', true);
          return;
        }
        items.push({ product_id: parseInt(productId, 10), quantity: qty });
      }
    });
    if (items === null) return;
    if (!items.length) {
      showMsg('أدخل كمية واحدة على الأقل للنقل', true);
      return;
    }

    btnExecuteTransfer.disabled = true;
    showMsg('', false);
    fetch('/api/warehouse-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        from_warehouse_id: parseInt(fromId, 10),
        to_warehouse_id: parseInt(toId, 10),
        mode: 'partial',
        items: items,
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.success) {
          showMsg(res.message || 'تم نقل الكميات بنجاح', false);
          loadProductsForTransfer();
          loadTransferLog();
        } else {
          showMsg(res.message || 'فشل عملية النقل', true);
        }
      })
      .catch(function () {
        showMsg('خطأ في الاتصال', true);
      })
      .finally(function () {
        btnExecuteTransfer.disabled = false;
      });
  }

  function executeAllTransfer() {
    if (!fromSelect || !toSelect) return;
    var fromId = fromSelect.value;
    var toId = toSelect.value;
    if (!fromId || !toId) {
      showMsg('اختر المخزن المصدر والمخزن الهدف أولاً', true);
      return;
    }
    if (fromId === toId) {
      showMsg('يجب أن يكون المخزن المصدر مختلفاً عن الهدف', true);
      return;
    }

    if (!confirm('سيتم نقل كل كميات المخزن المصدر إلى المخزن الهدف. هل أنت متأكد؟')) return;

    btnExecuteAll.disabled = true;
    showMsg('', false);
    fetch('/api/warehouse-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        from_warehouse_id: parseInt(fromId, 10),
        to_warehouse_id: parseInt(toId, 10),
        mode: 'all',
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.success) {
          showMsg(res.message || 'تم نقل كل الكميات بنجاح', false);
          loadProductsForTransfer();
          loadTransferLog();
        } else {
          showMsg(res.message || 'فشل عملية النقل', true);
        }
      })
      .catch(function () {
        showMsg('خطأ في الاتصال', true);
      })
      .finally(function () {
        btnExecuteAll.disabled = false;
      });
  }

  if (modePartialRadio && modeAllRadio) {
    modePartialRadio.addEventListener('change', toggleModeUI);
    modeAllRadio.addEventListener('change', toggleModeUI);
  }

  if (fromSelect) {
    fromSelect.addEventListener('change', function () {
      if (modePartialRadio && modePartialRadio.checked) {
        loadProductsForTransfer();
      } else {
        transferTbody && (transferTbody.innerHTML = '');
      }
    });
  }

  if (transferSearch) {
    transferSearch.addEventListener('input', applyTransferFilter);
  }

  if (btnExecuteTransfer) {
    btnExecuteTransfer.addEventListener('click', executePartialTransfer);
  }
  if (btnExecuteAll) {
    btnExecuteAll.addEventListener('click', executeAllTransfer);
  }

  var transferLogTbody = document.getElementById('transfer-log-tbody');

  function formatTransferDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function loadTransferLog() {
    if (!transferLogTbody) return;
    transferLogTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/warehouse-transfers?limit=100', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data || res.data.length === 0) {
          transferLogTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">لا توجد عمليات نقل مسجلة.</td></tr>';
          return;
        }
        var html = '';
        res.data.forEach(function (t) {
          var itemsCount = t.items && t.items.length ? t.items.length : 0;
          var itemsHtml = '';
          if (t.items && t.items.length) {
            itemsHtml = '<table class="table table-sm table-warehouses mb-0"><thead><tr><th>المنتج</th><th>الباركود</th><th>الكمية</th></tr></thead><tbody>' +
              t.items.map(function (it) {
                return '<tr><td>' + (it.product_name || '—') + '</td><td>' + (it.barcode || '—') + '</td><td>' + Number(it.quantity) + '</td></tr>';
              }).join('') + '</tbody></table>';
          } else {
            itemsHtml = '<p class="text-muted small mb-0">لا توجد تفاصيل.</p>';
          }
          html += '<tr data-transfer-id="' + t.id + '">' +
            '<td>' + t.id + '</td>' +
            '<td>' + (t.from_warehouse_name || '—') + '</td>' +
            '<td>' + (t.to_warehouse_name || '—') + '</td>' +
            '<td>' + itemsCount + '</td>' +
            '<td>' + (t.user_name || '—') + '</td>' +
            '<td>' + formatTransferDate(t.transferred_at) + '</td>' +
            '<td><button type="button" class="btn btn-sm btn-transfer-detail"><i class="fas fa-list-ul me-1"></i>تفاصيل</button></td>' +
            '</tr>' +
            '<tr class="transfer-detail-row d-none" data-detail-for="' + t.id + '"><td colspan="7" class="bg-dark">' + itemsHtml + '</td></tr>';
        });
        transferLogTbody.innerHTML = html;
        transferLogTbody.querySelectorAll('.btn-transfer-detail').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var tr = this.closest('tr');
            var id = tr.getAttribute('data-transfer-id');
            var detailRow = transferLogTbody.querySelector('tr[data-detail-for="' + id + '"]');
            if (detailRow) detailRow.classList.toggle('d-none');
          });
        });
      })
      .catch(function () {
        transferLogTbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">فشل تحميل السجل.</td></tr>';
      });
  }

  function onTabShown() {
    loadWarehousesIntoSelect(fromSelect);
    loadWarehousesIntoSelect(toSelect);
    toggleModeUI();
    if (modePartialRadio && modePartialRadio.checked) {
      loadProductsForTransfer();
    }
    loadTransferLog();
  }

  if (tabTransfer) {
    tabTransfer.addEventListener('shown.bs.tab', onTabShown);
  }

  window.addEventListener('warehouses:updated', function () {
    loadWarehousesIntoSelect(fromSelect);
    loadWarehousesIntoSelect(toSelect);
  });
})();

