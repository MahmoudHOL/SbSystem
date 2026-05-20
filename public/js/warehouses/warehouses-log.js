/**
 * تاب سجل الشراء والبيع - كامل السجلات مع فلتر بالمورد
 */
(function () {
  var tabLog = document.getElementById('tab-log');
  var filterEl = document.getElementById('log-supplier-filter');
  var purchaseTbody = document.getElementById('log-purchase-tbody');
  var saleTbody = document.getElementById('log-sale-tbody');
  var btnLogPurchase = document.getElementById('btn-log-purchase');
  var btnLogSale = document.getElementById('btn-log-sale');
  var purchaseCard = document.getElementById('log-purchase-card');
  var saleCard = document.getElementById('log-sale-card');
  var invoiceSearchInput = document.getElementById('log-invoice-search');
  var btnInvoiceSearch = document.getElementById('btn-log-search');
  var editAmountModalEl = document.getElementById('modal-edit-amount-paid');
  var editAmountMeta = document.getElementById('edit-amount-paid-meta');
  var editAmountInput = document.getElementById('edit-amount-paid-input');
  var editAmountMsg = document.getElementById('edit-amount-paid-msg');
  var btnSaveAmountPaid = document.getElementById('btn-save-amount-paid');

  var purchaseDataAll = [];
  var saleDataAll = [];
  var canEditInvoices = true;
  var canDeleteInvoices = true;
  var canEditAmount = true;

  function can(key) {
    return typeof window.hasWarehousesPermission === 'function'
      ? window.hasWarehousesPermission(key)
      : true;
  }

  function formatLogDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function loadLogSuppliers() {
    if (!filterEl) return;
    var opts = filterEl.querySelectorAll('option:not([value=""]):not([value="none"])');
    opts.forEach(function (o) { o.remove(); });
    fetch('/api/suppliers', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        res.data.forEach(function (s) {
          var opt = document.createElement('option');
          opt.value = s.id;
          opt.textContent = s.name || '—';
          filterEl.appendChild(opt);
        });
      });
  }

  function applyFiltersAndRender() {
    var invoiceVal = invoiceSearchInput && invoiceSearchInput.value
      ? parseInt(invoiceSearchInput.value, 10)
      : null;

    if (purchaseTbody) {
      if (!purchaseDataAll.length) {
        purchaseTbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">لا توجد فواتير شراء.</td></tr>';
      } else {
        var filteredPurchase = purchaseDataAll.filter(function (inv) {
          if (!invoiceVal || isNaN(invoiceVal)) return true;
          return inv.id === invoiceVal;
        });
        if (!filteredPurchase.length) {
          purchaseTbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">لا توجد فواتير مطابقة لهذا الرقم.</td></tr>';
        } else {
          purchaseTbody.innerHTML = filteredPurchase.map(function (inv) {
            var editCnt = Number(inv.edit_count) || 0;
            var editCell = editCnt === 0 ? '0' : '<span class="me-1">' + editCnt + '</span><button type="button" class="btn btn-sm btn-outline-light btn-show-edit-log" data-id="' + inv.id + '" data-kind="purchase">عرض</button>';
            var actions = '';
            if (canEditAmount) {
              actions += '<button type="button" class="btn btn-sm btn-outline-light me-1 btn-inv-edit-paid" data-id="' + inv.id + '" data-total="' + Number(inv.total_amount).toFixed(2) + '" data-paid="' + Number(inv.amount_paid).toFixed(2) + '"><i class="fas fa-money-bill me-1"></i>المبلغ</button>';
            }
            if (canEditInvoices) {
              actions += '<button type="button" class="btn btn-sm btn-dashboard btn-info me-1 btn-inv-edit-full-purchase" data-id="' + inv.id + '"><i class="fas fa-edit me-1"></i>تعديل</button>';
            }
            if (canDeleteInvoices) {
              actions += '<button type="button" class="btn btn-sm btn-outline-danger btn-inv-delete-purchase" data-id="' + inv.id + '"><i class="fas fa-trash me-1"></i>حذف</button>';
            }
            return '<tr><td>' + inv.id + '</td><td>' + (inv.supplier_name || '—') + '</td><td>' + (inv.warehouse_name || '—') + '</td><td>' + Number(inv.total_amount).toFixed(2) + '</td><td>' + Number(inv.amount_paid).toFixed(2) + '</td><td>' + formatLogDate(inv.created_at) + '</td><td>' + editCell + '</td><td><button type="button" class="btn btn-sm btn-inv-print-log" data-kind="purchase" data-id="' + inv.id + '"><i class="fas fa-print me-1"></i>طباعة</button></td><td>' + (actions || '—') + '</td></tr>';
          }).join('');
          purchaseTbody.querySelectorAll('.btn-inv-print-log').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = this.getAttribute('data-id');
              if (id) window.open('/print-purchase-invoice.html?id=' + id, '_blank', 'width=800,height=900');
            });
          });
          purchaseTbody.querySelectorAll('.btn-inv-edit-paid').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = this.getAttribute('data-id');
              var total = this.getAttribute('data-total');
              var paid = this.getAttribute('data-paid');
              openEditAmountPaidModal(id, total, paid);
            });
          });
          purchaseTbody.querySelectorAll('.btn-inv-edit-full-purchase').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = this.getAttribute('data-id');
              if (id) openEditPurchaseInvoiceFull(id);
            });
          });
          purchaseTbody.querySelectorAll('.btn-show-edit-log').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = this.getAttribute('data-id');
              var kind = this.getAttribute('data-kind');
              if (id && kind) openEditLogModal(id, kind);
            });
          });
          purchaseTbody.querySelectorAll('.btn-inv-delete-purchase').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = this.getAttribute('data-id');
              if (!id) return;
              if (!confirm('حذف فاتورة الشراء #' + id + '؟ سيتم إخفاؤها من السجل.')) return;
              btn.disabled = true;
              fetch('/api/purchase-invoices/' + id, { method: 'DELETE', credentials: 'same-origin' })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                  if (res.success) { loadLogData(); } else { alert(res.message || 'فشل الحذف'); }
                })
                .catch(function () { alert('خطأ في الاتصال'); })
                .finally(function () { btn.disabled = false; });
            });
          });
        }
      }
    }

    if (saleTbody) {
      if (!saleDataAll.length) {
        saleTbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">لا توجد فواتير بيع.</td></tr>';
      } else {
        var filteredSale = saleDataAll.filter(function (inv) {
          if (!invoiceVal || isNaN(invoiceVal)) return true;
          return inv.id === invoiceVal;
        });
        if (!filteredSale.length) {
          saleTbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">لا توجد فواتير مطابقة لهذا الرقم.</td></tr>';
        } else {
          saleTbody.innerHTML = filteredSale.map(function (inv) {
            var editCnt = Number(inv.edit_count) || 0;
            var editCell = editCnt === 0 ? '0' : '<span class="me-1">' + editCnt + '</span><button type="button" class="btn btn-sm btn-outline-light btn-show-edit-log" data-id="' + inv.id + '" data-kind="sale">عرض</button>';
            var actions = '';
            if (canEditInvoices) {
              actions += '<button type="button" class="btn btn-sm btn-dashboard btn-info me-1 btn-inv-edit-full-sale" data-id="' + inv.id + '"><i class="fas fa-edit me-1"></i>تعديل</button>';
            }
            if (canDeleteInvoices) {
              actions += '<button type="button" class="btn btn-sm btn-outline-danger btn-inv-delete-sale" data-id="' + inv.id + '"><i class="fas fa-trash me-1"></i>حذف</button>';
            }
            return '<tr><td>' + inv.id + '</td><td>' + (inv.supplier_name || '—') + '</td><td>' + (inv.warehouse_name || '—') + '</td><td>' + Number(inv.total_amount).toFixed(2) + '</td><td>' + Number(inv.amount_paid).toFixed(2) + '</td><td>' + formatLogDate(inv.created_at) + '</td><td>' + editCell + '</td><td><button type="button" class="btn btn-sm btn-inv-print-log-sale" data-id="' + inv.id + '"><i class="fas fa-print me-1"></i>طباعة</button></td><td>' + (actions || '—') + '</td></tr>';
          }).join('');
          saleTbody.querySelectorAll('.btn-inv-print-log-sale').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = this.getAttribute('data-id');
              if (id) window.open('/print-sale-invoice.html?id=' + id, '_blank', 'width=800,height=900');
            });
          });
          saleTbody.querySelectorAll('.btn-inv-edit-full-sale').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = this.getAttribute('data-id');
              if (id) openEditSaleInvoiceFull(id);
            });
          });
          saleTbody.querySelectorAll('.btn-show-edit-log').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = this.getAttribute('data-id');
              var kind = this.getAttribute('data-kind');
              if (id && kind) openEditLogModal(id, kind);
            });
          });
          saleTbody.querySelectorAll('.btn-inv-delete-sale').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = this.getAttribute('data-id');
              if (!id) return;
              if (!confirm('حذف فاتورة البيع #' + id + '؟ سيتم إخفاؤها من السجل.')) return;
              btn.disabled = true;
              fetch('/api/sale-invoices/' + id, { method: 'DELETE', credentials: 'same-origin' })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                  if (res.success) { loadLogData(); } else { alert(res.message || 'فشل الحذف'); }
                })
                .catch(function () { alert('خطأ في الاتصال'); })
                .finally(function () { btn.disabled = false; });
            });
          });
        }
      }
    }
  }

  function openEditLogModal(invoiceId, kind) {
    var modalEl = document.getElementById('modal-invoice-edit-log');
    var titleEl = document.getElementById('modal-edit-log-title');
    var tbody = document.getElementById('modal-edit-log-tbody');
    var emptyEl = document.getElementById('modal-edit-log-empty');
    if (!modalEl || !tbody) return;
    var kindLabel = kind === 'sale' ? 'بيع' : 'شراء';
    if (titleEl) titleEl.textContent = 'سجل تعديلات فاتورة ' + kindLabel + ' #' + invoiceId;
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">جاري التحميل...</td></tr>';
    if (emptyEl) emptyEl.classList.add('d-none');
    var url = kind === 'sale' ? '/api/sale-invoices/' + invoiceId + '/edit-log' : '/api/purchase-invoices/' + invoiceId + '/edit-log';
    fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data || res.data.length === 0) {
          tbody.innerHTML = '';
          if (emptyEl) emptyEl.classList.remove('d-none');
          return;
        }
        if (emptyEl) emptyEl.classList.add('d-none');
        tbody.innerHTML = res.data.map(function (row, i) {
          var dateStr = row.edited_at ? formatLogDate(row.edited_at) : '—';
          return '<tr><td>' + (i + 1) + '</td><td>' + (row.user_name || '—') + '</td><td>' + dateStr + '</td></tr>';
        }).join('');
        if (window.bootstrap && bootstrap.Modal && modalEl) {
          var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
          modal.show();
        }
      })
      .catch(function () {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">فشل تحميل السجل</td></tr>';
        if (window.bootstrap && modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
      });
  }

  function loadLogData() {
    var supplierVal = filterEl && filterEl.value ? filterEl.value : '';
    var q = 'all=1';
    if (supplierVal) q += '&supplier_id=' + encodeURIComponent(supplierVal);

    if (purchaseTbody) {
      purchaseTbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">جاري التحميل...</td></tr>';
      fetch('/api/purchase-invoices?' + q, { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.success || !res.data || res.data.length === 0) {
            purchaseDataAll = [];
            applyFiltersAndRender();
            return;
          }
          purchaseDataAll = res.data;
          applyFiltersAndRender();
        })
        .catch(function () {
          purchaseDataAll = [];
          purchaseTbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">فشل التحميل</td></tr>';
        });
    }

    if (saleTbody) {
      saleTbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">جاري التحميل...</td></tr>';
      fetch('/api/sale-invoices?' + q, { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.success || !res.data || res.data.length === 0) {
            saleDataAll = [];
            applyFiltersAndRender();
            return;
          }
          saleDataAll = res.data;
          applyFiltersAndRender();
        })
        .catch(function () {
          saleDataAll = [];
          saleTbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">فشل التحميل</td></tr>';
        });
    }
  }

  function openEditAmountPaidModal(id, total, paid) {
    if (!editAmountModalEl || !editAmountInput) return;
    editAmountModalEl.setAttribute('data-invoice-id', id);
    if (editAmountMeta) {
      editAmountMeta.textContent = 'فاتورة #' + id + ' | المبلغ المطلوب: ' + total + ' | المدفوع الحالي: ' + paid;
    }
    editAmountInput.value = paid || '0';
    if (editAmountMsg) editAmountMsg.textContent = '';
    if (window.bootstrap && bootstrap.Modal) {
      var modal = bootstrap.Modal.getOrCreateInstance(editAmountModalEl);
      modal.show();
    }
  }

  function showPurchaseLog() {
    if (purchaseCard) purchaseCard.classList.remove('d-none');
    if (saleCard) saleCard.classList.add('d-none');
    if (btnLogPurchase) {
      btnLogPurchase.classList.add('btn-dashboard', 'btn-info');
      btnLogPurchase.classList.remove('btn-outline-light');
    }
    if (btnLogSale) {
      btnLogSale.classList.remove('btn-dashboard', 'btn-info');
      btnLogSale.classList.add('btn-outline-light');
    }
  }

  function showSaleLog() {
    if (saleCard) saleCard.classList.remove('d-none');
    if (purchaseCard) purchaseCard.classList.add('d-none');
    if (btnLogSale) {
      btnLogSale.classList.add('btn-dashboard', 'btn-info');
      btnLogSale.classList.remove('btn-outline-light');
    }
    if (btnLogPurchase) {
      btnLogPurchase.classList.remove('btn-dashboard', 'btn-info');
      btnLogPurchase.classList.add('btn-outline-light');
    }
  }

  if (btnLogPurchase) {
    btnLogPurchase.addEventListener('click', function () {
      showPurchaseLog();
    });
  }
  if (btnLogSale) {
    btnLogSale.addEventListener('click', function () {
      showSaleLog();
    });
  }

  if (tabLog) {
    tabLog.addEventListener('shown.bs.tab', function () {
      canEditAmount = can('log_edit_amount');
      canEditInvoices = can('log_edit_invoice');
      canDeleteInvoices = can('log_delete_invoice');
      loadLogSuppliers();
      loadLogData();
      showPurchaseLog();
    });
  }
  window.addEventListener('warehouses:access-ready', function () {
    canEditAmount = can('log_edit_amount');
    canEditInvoices = can('log_edit_invoice');
    canDeleteInvoices = can('log_delete_invoice');
    if (document.querySelector('#panel-log.show, #panel-log.active')) {
      applyFiltersAndRender();
    }
  });
  if (filterEl) {
    filterEl.addEventListener('change', loadLogData);
  }

  if (btnInvoiceSearch) {
    btnInvoiceSearch.addEventListener('click', function () {
      applyFiltersAndRender();
    });
  }
  if (invoiceSearchInput) {
    invoiceSearchInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyFiltersAndRender();
      }
    });
  }

  if (btnSaveAmountPaid && editAmountModalEl && editAmountInput) {
    btnSaveAmountPaid.addEventListener('click', function () {
      var id = editAmountModalEl.getAttribute('data-invoice-id');
      if (!id) return;
      var amount = parseFloat(editAmountInput.value);
      if (isNaN(amount) || amount < 0) {
        if (editAmountMsg) {
          editAmountMsg.textContent = 'قيمة المبلغ غير صحيحة';
          editAmountMsg.className = 'form-message mt-2 mb-0 error';
        }
        return;
      }
      btnSaveAmountPaid.disabled = true;
      if (editAmountMsg) editAmountMsg.textContent = '';
      fetch('/api/purchase-invoices/' + id + '/amount-paid', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ amount_paid: amount }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            if (editAmountMsg) {
              editAmountMsg.textContent = data.message || 'تم التحديث';
              editAmountMsg.className = 'form-message mt-2 mb-0 success';
            }
            loadLogData();
          } else if (editAmountMsg) {
            editAmountMsg.textContent = data.message || 'فشل التحديث';
            editAmountMsg.className = 'form-message mt-2 mb-0 error';
          }
        })
        .catch(function () {
          if (editAmountMsg) {
            editAmountMsg.textContent = 'خطأ في الاتصال';
            editAmountMsg.className = 'form-message mt-2 mb-0 error';
          }
        })
        .finally(function () {
          btnSaveAmountPaid.disabled = false;
        });
    });
  }

  /* تعديل الفاتورة كاملاً (شراء) - تحميل وعرض وحفظ في قاعدة البيانات */
  var modalPurchaseFull = document.getElementById('modal-edit-purchase-invoice-full');
  var fullEditPurchaseId = document.getElementById('full-edit-purchase-invoice-id');
  var fullEditPurchaseWarehouse = document.getElementById('full-edit-purchase-warehouse');
  var fullEditPurchaseSupplier = document.getElementById('full-edit-purchase-supplier');
  var fullEditPurchaseAmountPaid = document.getElementById('full-edit-purchase-amount-paid');
  var fullEditPurchaseItemsTbody = document.getElementById('full-edit-purchase-items-tbody');
  var fullEditPurchaseMsg = document.getElementById('full-edit-purchase-msg');
  var btnSavePurchaseFull = document.getElementById('btn-save-purchase-invoice-full');

  function loadWarehousesForFullEdit(selectEl, selectedId, cb) {
    if (!selectEl) { if (cb) cb(); return; }
    fetch('/api/warehouses', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) { if (cb) cb(); return; }
        selectEl.innerHTML = '<option value="">— اختر المخزن —</option>';
        res.data.forEach(function (w) {
          var opt = document.createElement('option');
          opt.value = w.id;
          opt.textContent = w.name || '—';
          if (Number(selectedId) === Number(w.id)) opt.selected = true;
          selectEl.appendChild(opt);
        });
        if (cb) cb();
      })
      .catch(function () { if (cb) cb(); });
  }

  function loadSuppliersForFullEdit(selectEl, selectedId, cb) {
    if (!selectEl) { if (cb) cb(); return; }
    fetch('/api/suppliers', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) { if (cb) cb(); return; }
        selectEl.innerHTML = '<option value="">بدون مورد</option>';
        res.data.forEach(function (s) {
          var opt = document.createElement('option');
          opt.value = s.id;
          opt.textContent = s.name || '—';
          if (Number(selectedId) === Number(s.id)) opt.selected = true;
          selectEl.appendChild(opt);
        });
        if (cb) cb();
      })
      .catch(function () { if (cb) cb(); });
  }

  function openEditPurchaseInvoiceFull(id) {
    if (!fullEditPurchaseId || !fullEditPurchaseItemsTbody) return;
    fullEditPurchaseId.value = id;
    if (fullEditPurchaseMsg) fullEditPurchaseMsg.textContent = '';
    fullEditPurchaseItemsTbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/purchase-invoices/' + id, { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) {
          fullEditPurchaseItemsTbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">فشل تحميل الفاتورة</td></tr>';
          return;
        }
        var inv = res.data;
        loadWarehousesForFullEdit(fullEditPurchaseWarehouse, inv.warehouse_id, function () {
          loadSuppliersForFullEdit(fullEditPurchaseSupplier, inv.supplier_id, function () {});
        });
        if (fullEditPurchaseAmountPaid) fullEditPurchaseAmountPaid.value = Number(inv.amount_paid) || 0;
        fullEditPurchaseItemsTbody.innerHTML = '';
        (inv.items || []).forEach(function (it) {
          var purchPrice = Number(it.unit_purchase_price) || 0;
          var salePrice = Number(it.unit_sale_price) || 0;
          var lineTotal = (Number(it.quantity) * purchPrice).toFixed(2);
          var tr = document.createElement('tr');
          tr.setAttribute('data-product-id', it.product_id);
          tr.setAttribute('data-unit-purchase-price', purchPrice);
          tr.setAttribute('data-unit-sale-price', salePrice);
          tr.innerHTML =
            '<td>' + (it.product_name || '—') + ' <small class="text-muted">' + (it.barcode || '') + '</small></td>' +
            '<td><input type="number" class="form-control form-control-sm qty" min="0.001" step="0.001" value="' + Number(it.quantity) + '"></td>' +
            '<td><span class="text-muted">' + purchPrice.toFixed(2) + '</span></td>' +
            '<td><span class="text-muted">' + salePrice.toFixed(2) + '</span></td>' +
            '<td class="line-total">' + lineTotal + '</td>' +
            '<td><button type="button" class="btn btn-sm btn-outline-danger btn-remove-row"><i class="fas fa-times"></i></button></td>';
          fullEditPurchaseItemsTbody.appendChild(tr);
          var qtyInp = tr.querySelector('.qty');
          function updateLineTotal() {
            var q = parseFloat(qtyInp.value) || 0;
            tr.querySelector('.line-total').textContent = (q * purchPrice).toFixed(2);
          }
          qtyInp.addEventListener('input', updateLineTotal);
          tr.querySelector('.btn-remove-row').addEventListener('click', function () { tr.remove(); });
        });
        if (window.bootstrap && bootstrap.Modal && modalPurchaseFull) {
          var modal = bootstrap.Modal.getOrCreateInstance(modalPurchaseFull);
          modal.show();
        }
      })
      .catch(function () {
        fullEditPurchaseItemsTbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">خطأ في الاتصال</td></tr>';
      });
  }

  if (btnSavePurchaseFull && fullEditPurchaseId) {
    btnSavePurchaseFull.addEventListener('click', function () {
      var id = fullEditPurchaseId.value;
      if (!id) return;
      var warehouseId = fullEditPurchaseWarehouse && fullEditPurchaseWarehouse.value ? fullEditPurchaseWarehouse.value : '';
      var supplierId = fullEditPurchaseSupplier && fullEditPurchaseSupplier.value ? fullEditPurchaseSupplier.value : '';
      var amountPaid = parseFloat(fullEditPurchaseAmountPaid && fullEditPurchaseAmountPaid.value) || 0;
      var rows = fullEditPurchaseItemsTbody ? fullEditPurchaseItemsTbody.querySelectorAll('tr[data-product-id]') : [];
      var items = [];
      rows.forEach(function (tr) {
        var productId = tr.getAttribute('data-product-id');
        var qty = parseFloat(tr.querySelector('.qty') && tr.querySelector('.qty').value) || 0;
        var purchasePrice = parseFloat(tr.getAttribute('data-unit-purchase-price')) || 0;
        var salePrice = parseFloat(tr.getAttribute('data-unit-sale-price')) || 0;
        if (productId && qty > 0) items.push({ product_id: parseInt(productId, 10), quantity: qty, purchase_price: purchasePrice, sale_price: salePrice });
      });
      if (!items.length) {
        if (fullEditPurchaseMsg) { fullEditPurchaseMsg.textContent = 'يجب وجود صنف واحد على الأقل'; fullEditPurchaseMsg.className = 'form-message mt-2 mb-0 error'; }
        return;
      }
      if (!warehouseId) {
        if (fullEditPurchaseMsg) { fullEditPurchaseMsg.textContent = 'اختر المخزن'; fullEditPurchaseMsg.className = 'form-message mt-2 mb-0 error'; }
        return;
      }
      btnSavePurchaseFull.disabled = true;
      if (fullEditPurchaseMsg) fullEditPurchaseMsg.textContent = '';
      fetch('/api/purchase-invoices/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ supplier_id: supplierId || null, warehouse_id: parseInt(warehouseId, 10), amount_paid: amountPaid, items: items }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            if (fullEditPurchaseMsg) { fullEditPurchaseMsg.textContent = data.message || 'تم حفظ التعديل في قاعدة البيانات'; fullEditPurchaseMsg.className = 'form-message mt-2 mb-0 success'; }
            loadLogData();
            if (window.bootstrap && modalPurchaseFull) bootstrap.Modal.getInstance(modalPurchaseFull).hide();
          } else {
            if (fullEditPurchaseMsg) { fullEditPurchaseMsg.textContent = data.message || 'فشل الحفظ'; fullEditPurchaseMsg.className = 'form-message mt-2 mb-0 error'; }
          }
        })
        .catch(function () {
          if (fullEditPurchaseMsg) { fullEditPurchaseMsg.textContent = 'خطأ في الاتصال'; fullEditPurchaseMsg.className = 'form-message mt-2 mb-0 error'; }
        })
        .finally(function () { btnSavePurchaseFull.disabled = false; });
    });
  }

  /* تعديل الفاتورة كاملاً (بيع) */
  var modalSaleFull = document.getElementById('modal-edit-sale-invoice-full');
  var fullEditSaleId = document.getElementById('full-edit-sale-invoice-id');
  var fullEditSaleWarehouse = document.getElementById('full-edit-sale-warehouse');
  var fullEditSaleSupplier = document.getElementById('full-edit-sale-supplier');
  var fullEditSaleAmountPaid = document.getElementById('full-edit-sale-amount-paid');
  var fullEditSaleItemsTbody = document.getElementById('full-edit-sale-items-tbody');
  var fullEditSaleMsg = document.getElementById('full-edit-sale-msg');
  var btnSaveSaleFull = document.getElementById('btn-save-sale-invoice-full');

  function openEditSaleInvoiceFull(id) {
    if (!fullEditSaleId || !fullEditSaleItemsTbody) return;
    fullEditSaleId.value = id;
    if (fullEditSaleMsg) fullEditSaleMsg.textContent = '';
    fullEditSaleItemsTbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">جاري التحميل...</td></tr>';
    fetch('/api/sale-invoices/' + id, { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) {
          fullEditSaleItemsTbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">فشل تحميل الفاتورة</td></tr>';
          return;
        }
        var inv = res.data;
        loadWarehousesForFullEdit(fullEditSaleWarehouse, inv.warehouse_id, function () {
          loadSuppliersForFullEdit(fullEditSaleSupplier, inv.supplier_id, function () {});
        });
        if (fullEditSaleAmountPaid) fullEditSaleAmountPaid.value = Number(inv.amount_paid) || 0;
        fullEditSaleItemsTbody.innerHTML = '';
        (inv.items || []).forEach(function (it) {
          var salePrice = Number(it.unit_sale_price) || 0;
          var lineTotal = (Number(it.quantity) * salePrice).toFixed(2);
          var tr = document.createElement('tr');
          tr.setAttribute('data-product-id', it.product_id);
          tr.setAttribute('data-unit-sale-price', salePrice);
          tr.innerHTML =
            '<td>' + (it.product_name || '—') + ' <small class="text-muted">' + (it.barcode || '') + '</small></td>' +
            '<td><input type="number" class="form-control form-control-sm qty" min="0.001" step="0.001" value="' + Number(it.quantity) + '"></td>' +
            '<td><span class="text-muted">' + salePrice.toFixed(2) + '</span></td>' +
            '<td class="line-total">' + lineTotal + '</td>' +
            '<td><button type="button" class="btn btn-sm btn-outline-danger btn-remove-row"><i class="fas fa-times"></i></button></td>';
          fullEditSaleItemsTbody.appendChild(tr);
          var qtyInp = tr.querySelector('.qty');
          function updateLineTotal() {
            var q = parseFloat(qtyInp.value) || 0;
            tr.querySelector('.line-total').textContent = (q * salePrice).toFixed(2);
          }
          qtyInp.addEventListener('input', updateLineTotal);
          tr.querySelector('.btn-remove-row').addEventListener('click', function () { tr.remove(); });
        });
        if (window.bootstrap && bootstrap.Modal && modalSaleFull) {
          var modal = bootstrap.Modal.getOrCreateInstance(modalSaleFull);
          modal.show();
        }
      })
      .catch(function () {
        fullEditSaleItemsTbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">خطأ في الاتصال</td></tr>';
      });
  }

  if (btnSaveSaleFull && fullEditSaleId) {
    btnSaveSaleFull.addEventListener('click', function () {
      var id = fullEditSaleId.value;
      if (!id) return;
      var warehouseId = fullEditSaleWarehouse && fullEditSaleWarehouse.value ? fullEditSaleWarehouse.value : '';
      var supplierId = fullEditSaleSupplier && fullEditSaleSupplier.value ? fullEditSaleSupplier.value : null;
      var amountPaid = parseFloat(fullEditSaleAmountPaid && fullEditSaleAmountPaid.value) || 0;
      var rows = fullEditSaleItemsTbody ? fullEditSaleItemsTbody.querySelectorAll('tr[data-product-id]') : [];
      var items = [];
      rows.forEach(function (tr) {
        var productId = tr.getAttribute('data-product-id');
        var qty = parseFloat(tr.querySelector('.qty') && tr.querySelector('.qty').value) || 0;
        var salePrice = parseFloat(tr.getAttribute('data-unit-sale-price')) || 0;
        if (productId && qty > 0) items.push({ product_id: parseInt(productId, 10), quantity: qty, sale_price: salePrice });
      });
      if (!items.length) {
        if (fullEditSaleMsg) { fullEditSaleMsg.textContent = 'يجب وجود صنف واحد على الأقل'; fullEditSaleMsg.className = 'form-message mt-2 mb-0 error'; }
        return;
      }
      if (!warehouseId) {
        if (fullEditSaleMsg) { fullEditSaleMsg.textContent = 'اختر المخزن'; fullEditSaleMsg.className = 'form-message mt-2 mb-0 error'; }
        return;
      }
      btnSaveSaleFull.disabled = true;
      if (fullEditSaleMsg) fullEditSaleMsg.textContent = '';
      fetch('/api/sale-invoices/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ supplier_id: supplierId, warehouse_id: parseInt(warehouseId, 10), amount_paid: amountPaid, items: items }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            if (fullEditSaleMsg) { fullEditSaleMsg.textContent = data.message || 'تم حفظ التعديل في قاعدة البيانات'; fullEditSaleMsg.className = 'form-message mt-2 mb-0 success'; }
            loadLogData();
            if (window.bootstrap && modalSaleFull) bootstrap.Modal.getInstance(modalSaleFull).hide();
          } else {
            if (fullEditSaleMsg) { fullEditSaleMsg.textContent = data.message || 'فشل الحفظ'; fullEditSaleMsg.className = 'form-message mt-2 mb-0 error'; }
          }
        })
        .catch(function () {
          if (fullEditSaleMsg) { fullEditSaleMsg.textContent = 'خطأ في الاتصال'; fullEditSaleMsg.className = 'form-message mt-2 mb-0 error'; }
        })
        .finally(function () { btnSaveSaleFull.disabled = false; });
    });
  }
})();
