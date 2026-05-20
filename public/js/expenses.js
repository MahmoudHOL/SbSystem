/**
 * المصروفات - لوحة التحكم (مخزن، فئات، طريقة دفع، إضافة، سرد، تقرير)
 */
(function () {
  var expenseWarehouseSelect = document.getElementById('expense-warehouse');
  var expenseDirectionSelect = document.getElementById('expense-direction');
  var expenseCategorySelect = document.getElementById('expense-category');
  var expensePaymentSelect = document.getElementById('expense-payment-method');
  var expenseAmountInput = document.getElementById('expense-amount');
  var expenseDateInput = document.getElementById('expense-date');
  var expenseNoteInput = document.getElementById('expense-note');
  var btnAddExpense = document.getElementById('btn-add-expense');
  var expenseFormMessage = document.getElementById('expense-form-message');
  var expensesTbody = document.getElementById('expenses-tbody');
  var reportFrom = document.getElementById('report-from');
  var reportTo = document.getElementById('report-to');
  var btnLoadReport = document.getElementById('btn-load-report');
  var reportContent = document.getElementById('expenses-report-content');
  var canAddExpenses = true;
  var canEditExpenses = true;
  var canDeleteExpenses = true;
  var addExpenseCard = document.getElementById('add-expense-card');

  function setExpenseMessage(text, isError) {
    if (!expenseFormMessage) return;
    expenseFormMessage.textContent = text || '';
    expenseFormMessage.style.color = isError ? '#e57373' : 'var(--copper-light)';
    expenseFormMessage.classList.remove('d-none');
    setTimeout(function () {
      expenseFormMessage.textContent = '';
      expenseFormMessage.classList.add('d-none');
    }, 4000);
  }

  function reloadExpenseWarehousesSelect() {
    if (!expenseWarehouseSelect) return;
    var prev = expenseWarehouseSelect.value;
    fetch('/api/warehouses', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        var warehouses = res.data;
        expenseWarehouseSelect.innerHTML = '<option value="">اختر المخزن</option>' +
          warehouses.map(function (w) { return '<option value="' + w.id + '">' + (w.name || '—') + '</option>'; }).join('');
        if (prev && warehouses.some(function (w) { return String(w.id) === String(prev); })) {
          expenseWarehouseSelect.value = prev;
        } else if (warehouses.length === 1) {
          expenseWarehouseSelect.value = String(warehouses[0].id);
        }
      })
      .catch(function () {});
  }

  function loadExpenseDropdowns() {
    var today = new Date().toISOString().slice(0, 10);
    if (expenseDateInput) expenseDateInput.value = today;

    Promise.all([
      fetch('/api/warehouses', { credentials: 'same-origin' }).then(function (r) { return r.json(); }),
      fetch('/api/expense-categories', { credentials: 'same-origin' }).then(function (r) { return r.json(); }),
      fetch('/api/payment-methods', { credentials: 'same-origin' }).then(function (r) { return r.json(); }),
    ]).then(function (results) {
      var warehouses = results[0].success && results[0].data ? results[0].data : [];
      var categories = results[1].success && results[1].data ? results[1].data : [];
      var methods = results[2].success && results[2].data ? results[2].data : [];
      if (expenseWarehouseSelect) {
        expenseWarehouseSelect.innerHTML = '<option value="">اختر المخزن</option>' +
          warehouses.map(function (w) { return '<option value="' + w.id + '">' + (w.name || '—') + '</option>'; }).join('');
        if (warehouses.length === 1) expenseWarehouseSelect.value = warehouses[0].id;
      }
      if (expenseCategorySelect) {
        expenseCategorySelect.innerHTML = '<option value="">اختر الفئة</option>' +
          categories.map(function (c) { return '<option value="' + c.id + '">' + (c.name || '—') + '</option>'; }).join('');
      }
      if (expensePaymentSelect) {
        expensePaymentSelect.innerHTML = '<option value="">اختياري</option>' +
          methods.map(function (m) { return '<option value="' + m.id + '">' + (m.name || '—') + '</option>'; }).join('');
      }
    }).catch(function () {});
  }

  function formatDateSafe(val) {
    if (!val) return '—';
    var d = new Date(val);
    if (isNaN(d.getTime())) return '—';
    var day = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    return day + '/' + month + '/' + year;
  }

  function formatDateTimeSafe(val) {
    if (!val) return '—';
    var d = new Date(val);
    if (isNaN(d.getTime())) return '—';
    var day = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    var h = d.getHours();
    var m = d.getMinutes();
    return day + '/' + month + '/' + year + ' ' + (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  var editingExpenseId = null;

  function setEditMode(id) {
    editingExpenseId = id ? parseInt(id, 10) : null;
    if (btnAddExpense) {
      btnAddExpense.innerHTML = editingExpenseId
        ? '<i class="fas fa-save me-1"></i> حفظ التعديل'
        : '<i class="fas fa-plus me-1"></i> إضافة مصروف';
      btnAddExpense.classList.toggle('d-none', !editingExpenseId && !canAddExpenses);
    }
    var cancelBtn = document.getElementById('btn-cancel-expense-edit');
    if (cancelBtn) cancelBtn.classList.toggle('d-none', !editingExpenseId);
  }

  function applyExpenseCardVisibility() {
    if (addExpenseCard) addExpenseCard.style.display = (canAddExpenses || canEditExpenses) ? '' : 'none';
    setEditMode(editingExpenseId);
  }

  function loadExpensesAccess() {
    return fetch('/api/expenses-access', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.success || !res.data) return;
        canAddExpenses = !!res.data.create;
        canEditExpenses = !!res.data.update;
        canDeleteExpenses = !!res.data.delete;
        applyExpenseCardVisibility();
      })
      .catch(function () {});
  }

  function loadExpenseForEdit(id) {
    fetch('/api/expenses/' + id, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('Network ' + r.status);
        return r.json();
      })
      .then(function (res) {
        if (!res.success || !res.data) {
          setExpenseMessage('لم يتم العثور على المصروف', true);
          return;
        }
        var e = res.data;
        if (expenseWarehouseSelect) expenseWarehouseSelect.value = e.warehouse_id || '';
        if (expenseDirectionSelect) expenseDirectionSelect.value = (e.direction === 'in') ? 'in' : 'out';
        if (expenseCategorySelect) expenseCategorySelect.value = e.expense_category_id || '';
        if (expensePaymentSelect) expensePaymentSelect.value = e.payment_method_id || '';
        if (expenseAmountInput) expenseAmountInput.value = (e.amount != null ? Number(e.amount) : '');
        if (expenseDateInput) expenseDateInput.value = e.expense_date ? e.expense_date.slice(0, 10) : '';
        if (expenseNoteInput) expenseNoteInput.value = e.note || '';
        setEditMode(id);
        document.querySelector('.feature-card h5') && document.querySelector('.feature-card h5').scrollIntoView({ behavior: 'smooth' });
      })
      .catch(function () {
        setExpenseMessage('فشل تحميل بيانات المصروف', true);
      });
  }

  function loadExpenses() {
    if (!expensesTbody) return;
    expensesTbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-3">جاري التحميل...</td></tr>';
    fetch('/api/expenses?limit=50', { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('Network ' + r.status);
        return r.json();
      })
      .then(function (res) {
        try {
          if (!res || !res.success) {
            expensesTbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-3">لا توجد مصروفات</td></tr>';
            return;
          }
          var list = Array.isArray(res.data) ? res.data : [];
          if (list.length === 0) {
            expensesTbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-3">لا توجد مصروفات مسجلة</td></tr>';
            return;
          }
          expensesTbody.innerHTML = list.map(function (e) {
            var expenseDateStr = formatDateSafe(e.expense_date);
            var enteredStr = formatDateTimeSafe(e.created_at);
            var dirLabel = e.direction_label || (e.direction === 'in' ? 'وارد' : 'خارج');
            var dirClass = e.direction === 'in' ? 'text-success' : 'text-danger';
            var amt = Number(e.amount);
            var amountStr = (isNaN(amt) ? '0' : amt.toFixed(2));
            var actions = [];
            if (canEditExpenses) actions.push('<button type="button" class="btn btn-dashboard btn-outline-info btn-sm py-0 px-2 me-1" data-expense-edit="' + e.id + '" title="تعديل"><i class="fas fa-edit"></i></button>');
            if (canDeleteExpenses) actions.push('<button type="button" class="btn btn-outline-danger btn-sm py-0 px-2" data-expense-delete="' + e.id + '" title="حذف"><i class="fas fa-trash-alt"></i></button>');
            var actionsHtml = actions.length ? actions.join('') : '—';
            return '<tr><td>' + expenseDateStr + '</td><td>' + enteredStr + '</td><td>' + (e.warehouse_name || '—') + '</td><td><span class="' + dirClass + '">' + dirLabel + '</span></td><td>' + (e.category_name || '—') + '</td><td>' + (e.payment_method_name || '—') + '</td><td>' + amountStr + '</td><td>' + (e.note || '—') + '</td><td>' + (e.user_name || '—') + '</td><td>' + actionsHtml + '</td></tr>';
          }).join('');
        } catch (err) {
          console.error('loadExpenses render error:', err);
          expensesTbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger py-3">خطأ في عرض البيانات</td></tr>';
        }
        expensesTbody.querySelectorAll('[data-expense-edit]').forEach(function (btn) {
          btn.addEventListener('click', function () { loadExpenseForEdit(this.getAttribute('data-expense-edit')); });
        });
        expensesTbody.querySelectorAll('[data-expense-delete]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-expense-delete');
            if (!id || !confirm('هل تريد حذف هذا المصروف؟ لا يمكن التراجع.')) return;
            var row = this.closest('tr');
            if (row) row.style.opacity = '0.6';
            fetch('/api/expenses/' + id, { method: 'DELETE', credentials: 'same-origin' })
              .then(function (r) { return r.json(); })
              .then(function (data) {
                if (data.success) {
                  setExpenseMessage(data.message || 'تم حذف المصروف');
                  loadExpenses();
                } else {
                  setExpenseMessage(data.message || 'فشل الحذف', true);
                  if (row) row.style.opacity = '1';
                }
              })
              .catch(function () {
                setExpenseMessage('خطأ في الاتصال', true);
                if (row) row.style.opacity = '1';
              });
          });
        });
      })
      .catch(function (err) {
        console.error('loadExpenses error:', err);
        expensesTbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger py-3">فشل تحميل المصروفات. تحقق من الاتصال أو سجّل الدخول من جديد.</td></tr>';
      });
  }

  if (btnAddExpense) {
    btnAddExpense.addEventListener('click', function () {
      var warehouseId = expenseWarehouseSelect ? expenseWarehouseSelect.value : '';
      var direction = expenseDirectionSelect ? expenseDirectionSelect.value : 'out';
      var categoryId = expenseCategorySelect ? expenseCategorySelect.value : '';
      var paymentId = expensePaymentSelect ? expensePaymentSelect.value : '';
      var amount = expenseAmountInput ? parseFloat(expenseAmountInput.value) : NaN;
      var dateVal = expenseDateInput ? expenseDateInput.value : '';
      var note = expenseNoteInput ? expenseNoteInput.value.trim() : '';
      if (!warehouseId) {
        setExpenseMessage('اختر المخزن', true);
        return;
      }
      if (!categoryId) {
        setExpenseMessage('اختر فئة المصروف', true);
        return;
      }
      if (amount === undefined || isNaN(amount) || amount < 0) {
        setExpenseMessage('أدخل مبلغاً صحيحاً', true);
        return;
      }
      btnAddExpense.disabled = true;
      var body = {
        warehouse_id: parseInt(warehouseId, 10),
        direction: direction === 'in' ? 'in' : 'out',
        expense_category_id: parseInt(categoryId, 10),
        payment_method_id: paymentId ? parseInt(paymentId, 10) : null,
        amount: amount,
        note: note || null,
        expense_date: dateVal || new Date().toISOString().slice(0, 10),
      };
      var isEdit = editingExpenseId;
      var url = isEdit ? '/api/expenses/' + editingExpenseId : '/api/expenses';
      var method = isEdit ? 'PUT' : 'POST';
      fetch(url, {
        method: method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            setExpenseMessage(data.message || (isEdit ? 'تم تحديث المصروف' : 'تم تسجيل المصروف'));
            setEditMode(null);
            if (expenseAmountInput) expenseAmountInput.value = '';
            if (expenseNoteInput) expenseNoteInput.value = '';
            loadExpenses();
          } else {
            setExpenseMessage(data.message || 'فشل الحفظ', true);
          }
        })
        .catch(function () {
          setExpenseMessage('خطأ في الاتصال', true);
        })
        .finally(function () {
          btnAddExpense.disabled = false;
        });
    });
  }

  var cancelEditBtn = document.getElementById('btn-cancel-expense-edit');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', function () {
      setEditMode(null);
      if (expenseAmountInput) expenseAmountInput.value = '';
      if (expenseNoteInput) expenseNoteInput.value = '';
      if (expenseDateInput) expenseDateInput.value = new Date().toISOString().slice(0, 10);
      setExpenseMessage('تم إلغاء التعديل');
    });
  }

  function loadReport() {
    if (!reportContent) return;
    var fromVal = reportFrom ? reportFrom.value : '';
    var toVal = reportTo ? reportTo.value : '';
    if (!fromVal || !toVal) {
      reportContent.innerHTML = '<p class="text-muted small">اختر من تاريخ وإلى تاريخ ثم اضغط عرض التقرير.</p>';
      return;
    }
    reportContent.innerHTML = '<p class="text-muted small">جاري تحميل التقرير...</p>';
    var url = '/api/expenses?limit=500&from=' + encodeURIComponent(fromVal) + '&to=' + encodeURIComponent(toVal);
    fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) {
          reportContent.innerHTML = '<p class="text-muted small">لا توجد بيانات في هذه الفترة.</p>';
          return;
        }
        var list = res.data;
        var totalIn = 0;
        var totalOut = 0;
        var byCategory = {};
        var byWarehouse = {};
        list.forEach(function (e) {
          var amt = Number(e.amount);
          if (e.direction === 'in') totalIn += amt; else totalOut += amt;
          var cat = e.category_name || '—';
          byCategory[cat] = (byCategory[cat] || 0) + amt;
          var wh = e.warehouse_name || '—';
          byWarehouse[wh] = (byWarehouse[wh] || 0) + amt;
        });
        var diff = totalIn - totalOut;
        var rows = [];
        rows.push('<div class="row mb-3"><div class="col-md-4"><div class="p-3 bg-light rounded"><strong>إجمالي الوارد</strong><br><span class="text-success">' + totalIn.toFixed(2) + ' ج.م</span></div></div><div class="col-md-4"><div class="p-3 bg-light rounded"><strong>إجمالي الخارج</strong><br><span class="text-danger">' + totalOut.toFixed(2) + ' ج.م</span></div></div><div class="col-md-4"><div class="p-3 bg-light rounded"><strong>الفرق (وارد − خارج)</strong><br>' + (diff >= 0 ? '<span class="text-success">' : '<span class="text-danger">') + diff.toFixed(2) + ' ج.م</span></div></div></div>');
        rows.push('<h6 class="mt-3">حسب الفئة</h6><table class="table table-sm"><thead><tr><th>الفئة</th><th>المبلغ</th></tr></thead><tbody>');
        Object.keys(byCategory).sort().forEach(function (cat) {
          rows.push('<tr><td>' + cat + '</td><td>' + byCategory[cat].toFixed(2) + '</td></tr>');
        });
        rows.push('</tbody></table><h6 class="mt-3">حسب المخزن</h6><table class="table table-sm"><thead><tr><th>المخزن</th><th>المبلغ</th></tr></thead><tbody>');
        Object.keys(byWarehouse).sort().forEach(function (wh) {
          rows.push('<tr><td>' + wh + '</td><td>' + byWarehouse[wh].toFixed(2) + '</td></tr>');
        });
        rows.push('</tbody></table>');
        reportContent.innerHTML = rows.join('');
      })
      .catch(function () {
        reportContent.innerHTML = '<p class="text-danger small">فشل تحميل التقرير.</p>';
      });
  }

  if (btnLoadReport) btnLoadReport.addEventListener('click', loadReport);
  if (reportFrom && reportTo) {
    var d = new Date();
    reportTo.value = d.toISOString().slice(0, 10);
    d.setDate(1);
    reportFrom.value = d.toISOString().slice(0, 10);
  }

  applyExpenseCardVisibility();
  loadExpensesAccess().finally(function () {
    loadExpenseDropdowns();
    loadExpenses();
  });

  window.addEventListener('warehouses:updated', reloadExpenseWarehousesSelect);
})();
