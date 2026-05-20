/**
 * إعدادات النظام - طرق الدفع + نسب الخصم (كل تاب له صلاحية منفصلة)
 */
(function () {
  var systemTabsEl = document.getElementById('systemTabs');
  var systemTabAccess = {
    payment_methods: false,
    discounts: false,
    user_warehouses: false,
    expense_categories: false,
    company_profile: false,
    backup: false,
  };

  function setSystemTabVisibility(tabId, panelId, allowed) {
    var tab = document.getElementById(tabId);
    var panel = document.getElementById(panelId);
    if (tab && tab.parentElement) {
      tab.parentElement.classList.toggle('d-none', !allowed);
      tab.setAttribute('aria-disabled', allowed ? 'false' : 'true');
    }
    if (panel) {
      panel.classList.toggle('d-none', !allowed);
    }
  }

  function activateFirstVisibleSystemTab() {
    if (!systemTabsEl || !window.bootstrap || !window.bootstrap.Tab) return;
    var firstVisible = systemTabsEl.querySelector('button.nav-link:not([aria-disabled="true"]):not(.d-none)');
    if (firstVisible) {
      window.bootstrap.Tab.getOrCreateInstance(firstVisible).show();
    }
  }

  // طرق الدفع
  const pmForm = document.getElementById('add-payment-method-form');
  const pmMessageEl = document.getElementById('payment-method-message');
  const pmBtnAdd = document.getElementById('btn-add-payment-method');
  const pmTbody = document.getElementById('payment-methods-tbody');

  function showInlineMessage(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    el.style.color = isError ? '#e57373' : 'var(--copper-light)';
    el.classList.remove('d-none');
    setTimeout(function () {
      el.textContent = '';
      el.classList.add('d-none');
    }, 4500);
  }

  function loadPaymentMethods() {
    if (!pmTbody) return;
    pmTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">جاري التحميل...</td></tr>';
    fetch('/api/payment-methods', { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success || !result.data) {
          pmTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">لا توجد طرق دفع</td></tr>';
          return;
        }
        var list = result.data;
        if (list.length === 0) {
          pmTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">لا توجد طرق دفع. أضف طريقة من النموذج.</td></tr>';
          return;
        }
        pmTbody.innerHTML = list.map(function (row, i) {
          var date = row.created_at ? new Date(row.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' }) : '—';
          var defaultCell = row.is_default_pos
            ? '<span class="badge bg-success">افتراضي</span>'
            : '<button type="button" class="btn btn-sm btn-outline-secondary set-pos-default-btn" data-id="' + row.id + '">تعيين افتراضي</button>';
          return '<tr><td>' + (i + 1) + '</td><td>' + (row.name || '—') + '</td><td>' + date + '</td><td>' + defaultCell + '</td></tr>';
        }).join('');
        pmTbody.querySelectorAll('.set-pos-default-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-id');
            if (!id) return;
            this.disabled = true;
            fetch('/api/payment-methods/' + id + '/default-pos', {
              method: 'PATCH',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
            })
              .then(function (r) { return r.json(); })
              .then(function (data) {
                if (data.success) {
                  loadPaymentMethods();
                } else {
                  showInlineMessage(pmMessageEl, data.message || 'فشل التعيين', true);
                }
              })
              .catch(function () {
                showInlineMessage(pmMessageEl, 'خطأ في الاتصال', true);
              })
              .finally(function () {
                btn.disabled = false;
              });
          });
        });
      })
      .catch(function () {
        pmTbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">فشل تحميل البيانات</td></tr>';
      });
  }

  if (pmForm) {
    pmForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInput = document.getElementById('payment-method-name');
      var name = (nameInput && nameInput.value) ? nameInput.value.trim() : '';
      if (!name) {
        showInlineMessage(pmMessageEl, 'أدخل اسم طريقة الدفع', true);
        return;
      }
      if (pmBtnAdd) pmBtnAdd.disabled = true;
      pmMessageEl.textContent = '';

      fetch('/api/payment-methods', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            showInlineMessage(pmMessageEl, data.message || 'تمت الإضافة');
            if (nameInput) nameInput.value = '';
            loadPaymentMethods();
          } else {
            showInlineMessage(pmMessageEl, data.message || 'فشل الإضافة', true);
          }
        })
        .catch(function () {
          showInlineMessage(pmMessageEl, 'خطأ في الاتصال', true);
        })
        .finally(function () {
          if (pmBtnAdd) pmBtnAdd.disabled = false;
        });
    });
  }

  // نسب الخصم
  const globalForm = document.getElementById('global-discount-form');
  const globalInput = document.getElementById('global-discount');
  const globalMessageEl = document.getElementById('global-discount-message');
  const globalBtn = document.getElementById('btn-save-global-discount');
  const discountUsersTbody = document.getElementById('discount-users-tbody');

  function loadDiscountConfig() {
    if (!discountUsersTbody && !globalInput) return;
    if (discountUsersTbody) {
      discountUsersTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">جاري التحميل...</td></tr>';
    }
    fetch('/api/discount-config', { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success || !result.data) {
          if (discountUsersTbody) {
            discountUsersTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">تعذر تحميل البيانات</td></tr>';
          }
          return;
        }
        var data = result.data;
        if (globalInput && data.global_rate != null) {
          globalInput.value = data.global_rate;
        }

        if (discountUsersTbody) {
          var users = data.users || [];
          if (users.length === 0) {
            discountUsersTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">لا يوجد مستخدمون بعد</td></tr>';
            return;
          }
          discountUsersTbody.innerHTML = users.map(function (u) {
            var fullName = u.full_name || '—';
            var current =
              u.rate_percent != null
                ? u.rate_percent + ' %'
                : '<span class=\"text-muted\">على الخصم العام</span>';
            var editValue = u.rate_percent != null ? u.rate_percent : '';
            return (
              '<tr>' +
              '<td>' + (u.username || '—') + '</td>' +
              '<td>' + fullName + '</td>' +
              '<td>' + current + '</td>' +
              '<td>' +
              '<div class=\"input-group input-group-sm\">' +
              '<input type=\"number\" class=\"form-control input-user-discount\" min=\"0\" max=\"100\" step=\"0.01\" data-user-id=\"' + u.id + '\" value=\"' + editValue + '\" placeholder=\"مثال: 5 أو 10\">' +
              '<button type=\"button\" class=\"btn btn-dashboard btn-info btn-save-user-discount\" data-user-id=\"' + u.id + '\"><i class=\"fas fa-save me-1\"></i> حفظ</button>' +
              '</div>' +
              '</td>' +
              '</tr>'
            );
          }).join('');

          discountUsersTbody.querySelectorAll('.btn-save-user-discount').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var userId = btn.getAttribute('data-user-id');
              var input = discountUsersTbody.querySelector('.input-user-discount[data-user-id=\"' + userId + '\"]');
              if (!input) return;
              var raw = input.value.trim();
              var body;
              if (!raw) {
                body = { userId: userId, percent: '' }; // مسح الخصم الخاص
              } else {
                var val = Number(raw);
                if (Number.isNaN(val) || val < 0 || val > 100) {
                  alert('نسبة خصم المستخدم يجب أن تكون بين 0 و 100');
                  return;
                }
                body = { userId: userId, percent: val };
              }
              btn.disabled = true;
              fetch('/api/discount-user', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                  if (!data.success) {
                    alert(data.message || 'فشل حفظ الخصم');
                  } else {
                    loadDiscountConfig();
                  }
                })
                .catch(function () {
                  alert('خطأ في الاتصال');
                })
                .finally(function () {
                  btn.disabled = false;
                });
            });
          });
        }
      })
      .catch(function () {
        if (discountUsersTbody) {
          discountUsersTbody.innerHTML = '<tr><td colspan=\"4\" class=\"text-center text-danger py-4\">فشل تحميل نسب الخصم</td></tr>';
        }
      });
  }

  if (globalForm) {
    globalForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!globalInput) return;
      var raw = globalInput.value.trim();
      var val = raw === '' ? 0 : Number(raw);
      if (Number.isNaN(val) || val < 0 || val > 100) {
        showInlineMessage(globalMessageEl, 'نسبة الخصم العام يجب أن تكون بين 0 و 100', true);
        return;
      }
      if (globalBtn) globalBtn.disabled = true;
      fetch('/api/discount-global', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percent: val }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            showInlineMessage(globalMessageEl, data.message || 'تم حفظ الخصم العام');
            loadDiscountConfig();
          } else {
            showInlineMessage(globalMessageEl, data.message || 'فشل حفظ الخصم العام', true);
          }
        })
        .catch(function () {
          showInlineMessage(globalMessageEl, 'خطأ في الاتصال', true);
        })
        .finally(function () {
          if (globalBtn) globalBtn.disabled = false;
        });
    });
  }

  function initSystemTabsAccess() {
    fetch('/api/system-tabs-access', { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result || !result.success || !result.data) {
          throw new Error('failed');
        }
        systemTabAccess = Object.assign(systemTabAccess, result.data || {});

        setSystemTabVisibility('tab-payment-methods', 'panel-payment-methods', !!systemTabAccess.payment_methods);
        setSystemTabVisibility('tab-discounts', 'panel-discounts', !!systemTabAccess.discounts);
        setSystemTabVisibility('tab-user-warehouses', 'panel-user-warehouses', !!systemTabAccess.user_warehouses);
        setSystemTabVisibility('tab-expense-categories', 'panel-expense-categories', !!systemTabAccess.expense_categories);
        setSystemTabVisibility('tab-company-profile', 'panel-company-profile', !!systemTabAccess.company_profile);
        setSystemTabVisibility('tab-backup-paths', 'panel-backup-paths', !!systemTabAccess.backup);

        if (systemTabAccess.payment_methods) loadPaymentMethods();
        if (systemTabAccess.discounts) loadDiscountConfig();

        // فتح التبويب حسب الـ hash في الرابط (مثال: /settings/system#panel-backup-paths)
        if (window.location.hash) {
          var hashId = window.location.hash;
          var trigger = document.querySelector('[data-bs-target="' + hashId + '"]');
          if (trigger && trigger.parentElement && !trigger.parentElement.classList.contains('d-none') && window.bootstrap && window.bootstrap.Tab) {
            window.bootstrap.Tab.getOrCreateInstance(trigger).show();
          } else {
            activateFirstVisibleSystemTab();
          }
        } else {
          activateFirstVisibleSystemTab();
        }
      })
      .catch(function () {
        var content = document.getElementById('systemTabContent');
        if (content) {
          content.innerHTML = '<div class="alert alert-danger">ليس لديك صلاحية الدخول إلى تبويبات إعدادات النظام.</div>';
        }
      });
  }

  // تبويب تحديد مخزن لي المستخدم
  var tabUserWarehouses = document.getElementById('tab-user-warehouses');
  var userWarehousesTbody = document.getElementById('user-warehouses-tbody');
  var userWarehousesMessage = document.getElementById('user-warehouses-message');
  var userWarehousesLoaded = false;

  function showUserWarehousesMessage(text, isError) {
    if (!userWarehousesMessage) return;
    userWarehousesMessage.textContent = text || '';
    userWarehousesMessage.style.color = isError ? '#e57373' : 'var(--copper-light)';
    userWarehousesMessage.classList.remove('d-none');
    setTimeout(function () {
      userWarehousesMessage.textContent = '';
      userWarehousesMessage.classList.add('d-none');
    }, 4000);
  }

  function loadUserWarehouses() {
    if (!userWarehousesTbody) return;
    userWarehousesTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">جاري التحميل...</td></tr>';
    fetch('/api/user-warehouses', { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success || !result.data) {
          userWarehousesTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">تعذر تحميل البيانات</td></tr>';
          return;
        }
        var users = result.data.users || [];
        var warehouses = result.data.warehouses || [];
        if (users.length === 0) {
          userWarehousesTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">لا يوجد مستخدمون نشطون</td></tr>';
          return;
        }
        userWarehousesTbody.innerHTML = users.map(function (u) {
          var linkedIds = (u.warehouses || []).map(function (w) { return w.id; });
          var availableWarehouses = warehouses.filter(function (w) { return linkedIds.indexOf(w.id) === -1; });
          var badges = (u.warehouses || []).map(function (w) {
            return (
              '<span class="badge bg-info me-1 mb-1">' +
              (w.name || '—') +
              ' <button type="button" class="btn-remove-uw btn btn-link btn-sm p-0 ms-1 text-danger" data-user-id="' + u.id + '" data-warehouse-id="' + w.id + '" title="إلغاء الربط">&times;</button></span>'
            );
          }).join('');
          var selectHtml =
            '<select class="form-select form-select-sm d-inline-block w-auto me-1 select-warehouse-for-user" data-user-id="' + u.id + '">' +
            '<option value="">اختر مخزن</option>' +
            availableWarehouses.map(function (w) {
              return '<option value="' + w.id + '">' + (w.name || '—') + '</option>';
            }).join('') +
            '</select>' +
            '<button type="button" class="btn btn-dashboard btn-info btn-sm btn-add-user-warehouse" data-user-id="' + u.id + '"><i class="fas fa-plus me-1"></i>إضافة</button>';
          if (availableWarehouses.length === 0) {
            selectHtml = '<span class="text-muted small">كل المخازن مرتبطة</span>';
          }
          return (
            '<tr>' +
            '<td>' + (u.username || '—') + '</td>' +
            '<td>' + (u.full_name || '—') + '</td>' +
            '<td>' + (badges || '<span class="text-muted">لا مخازن</span>') + '</td>' +
            '<td>' + selectHtml + '</td>' +
            '</tr>'
          );
        }).join('');

        userWarehousesTbody.querySelectorAll('.btn-remove-uw').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var userId = this.getAttribute('data-user-id');
            var warehouseId = this.getAttribute('data-warehouse-id');
            if (!userId || !warehouseId) return;
            btn.disabled = true;
            fetch('/api/user-warehouses?user_id=' + encodeURIComponent(userId) + '&warehouse_id=' + encodeURIComponent(warehouseId), {
              method: 'DELETE',
              credentials: 'same-origin',
            })
              .then(function (res) { return res.json(); })
              .then(function (data) {
                if (data.success) {
                  showUserWarehousesMessage(data.message || 'تم إلغاء الربط');
                  userWarehousesLoaded = false;
                  loadUserWarehouses();
                } else {
                  showUserWarehousesMessage(data.message || 'فشل إلغاء الربط', true);
                }
              })
              .catch(function () {
                showUserWarehousesMessage('خطأ في الاتصال', true);
              })
              .finally(function () {
                btn.disabled = false;
              });
          });
        });

        userWarehousesTbody.querySelectorAll('.btn-add-user-warehouse').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var userId = this.getAttribute('data-user-id');
            var row = this.closest('tr');
            var sel = row ? row.querySelector('.select-warehouse-for-user') : null;
            var warehouseId = sel ? sel.value : '';
            if (!userId || !warehouseId) {
              showUserWarehousesMessage('اختر مخزن أولاً', true);
              return;
            }
            btn.disabled = true;
            fetch('/api/user-warehouses', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: parseInt(userId, 10), warehouse_id: parseInt(warehouseId, 10) }),
            })
              .then(function (res) { return res.json(); })
              .then(function (data) {
                if (data.success) {
                  showUserWarehousesMessage(data.message || 'تم ربط المستخدم بالمخزن');
                  userWarehousesLoaded = false;
                  loadUserWarehouses();
                } else {
                  showUserWarehousesMessage(data.message || 'فشل الربط', true);
                }
              })
              .catch(function () {
                showUserWarehousesMessage('خطأ في الاتصال', true);
              })
              .finally(function () {
                btn.disabled = false;
              });
          });
        });
      })
      .catch(function () {
        userWarehousesTbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">فشل تحميل البيانات</td></tr>';
      });
  }

  if (tabUserWarehouses && userWarehousesTbody) {
    tabUserWarehouses.addEventListener('shown.bs.tab', function () {
      if (!systemTabAccess.user_warehouses) return;
      if (!userWarehousesLoaded) {
        userWarehousesLoaded = true;
        loadUserWarehouses();
      }
    });
  }

  window.addEventListener('warehouses:updated', function () {
    if (userWarehousesTbody) {
      userWarehousesLoaded = true;
      loadUserWarehouses();
    }
  });

  // فئات المصروفات
  var expenseCategoryForm = document.getElementById('add-expense-category-form');
  var expenseCategoryMessage = document.getElementById('expense-category-message');
  var expenseCategoryBtn = document.getElementById('btn-add-expense-category');
  var expenseCategoriesTbody = document.getElementById('expense-categories-tbody');
  var tabExpenseCategories = document.getElementById('tab-expense-categories');
  var expenseCategoriesLoaded = false;

  function loadExpenseCategories() {
    if (!expenseCategoriesTbody) return;
    expenseCategoriesTbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">جاري التحميل...</td></tr>';
    fetch('/api/expense-categories', { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success || !result.data) {
          expenseCategoriesTbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">لا توجد فئات</td></tr>';
          return;
        }
        var list = result.data;
        if (list.length === 0) {
          expenseCategoriesTbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">لا توجد فئات مصروفات. أضف فئة من النموذج.</td></tr>';
          return;
        }
        expenseCategoriesTbody.innerHTML = list.map(function (row, i) {
          var date = row.created_at ? new Date(row.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' }) : '—';
          return '<tr><td>' + (i + 1) + '</td><td>' + (row.name || '—') + '</td><td>' + date + '</td></tr>';
        }).join('');
      })
      .catch(function () {
        expenseCategoriesTbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">فشل تحميل البيانات</td></tr>';
      });
  }

  if (expenseCategoryForm) {
    expenseCategoryForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInput = document.getElementById('expense-category-name');
      var name = (nameInput && nameInput.value) ? nameInput.value.trim() : '';
      if (!name) {
        showInlineMessage(expenseCategoryMessage, 'أدخل اسم الفئة', true);
        return;
      }
      if (expenseCategoryBtn) expenseCategoryBtn.disabled = true;
      expenseCategoryMessage.textContent = '';
      fetch('/api/expense-categories', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            showInlineMessage(expenseCategoryMessage, data.message || 'تمت الإضافة');
            if (nameInput) nameInput.value = '';
            loadExpenseCategories();
          } else {
            showInlineMessage(expenseCategoryMessage, data.message || 'فشل الإضافة', true);
          }
        })
        .catch(function () {
          showInlineMessage(expenseCategoryMessage, 'خطأ في الاتصال', true);
        })
        .finally(function () {
          if (expenseCategoryBtn) expenseCategoryBtn.disabled = false;
        });
    });
  }

  if (tabExpenseCategories && expenseCategoriesTbody) {
    tabExpenseCategories.addEventListener('shown.bs.tab', function () {
      if (!systemTabAccess.expense_categories) return;
      if (!expenseCategoriesLoaded) {
        expenseCategoriesLoaded = true;
        loadExpenseCategories();
      }
    });
  }

  // بيانات المنشأة
  var companyForm = document.getElementById('company-profile-form');
  var companyNameInput = document.getElementById('company-name');
  var companyLogoInput = document.getElementById('company-logo');
  var companyLogoPreview = document.getElementById('company-logo-preview');
  var companyProfileMessage = document.getElementById('company-profile-message');
  var btnSaveCompanyProfile = document.getElementById('btn-save-company-profile');
  var tabCompanyProfile = document.getElementById('tab-company-profile');

  function showCompanyMessage(text, isError) {
    if (!companyProfileMessage) return;
    companyProfileMessage.textContent = text || '';
    companyProfileMessage.style.color = isError ? '#e57373' : 'var(--copper-light)';
    companyProfileMessage.classList.remove('d-none');
    setTimeout(function () {
      companyProfileMessage.textContent = '';
      companyProfileMessage.classList.add('d-none');
    }, 4000);
  }

  function setLogoPreview(src) {
    if (!companyLogoPreview) return;
    if (src) {
      companyLogoPreview.src = src;
      companyLogoPreview.classList.remove('d-none');
    } else {
      companyLogoPreview.src = '';
      companyLogoPreview.classList.add('d-none');
    }
  }

  function loadCompanyProfile() {
    if (!companyNameInput) return;
    fetch('/api/company-profile', { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success || !result.data) {
          setLogoPreview('');
          return;
        }
        var data = result.data;
        if (data.name != null) {
          companyNameInput.value = data.name;
        }
        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        } else {
          setLogoPreview('');
        }
      })
      .catch(function () {
        setLogoPreview('');
      });
  }

  if (companyForm) {
    companyForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!companyNameInput) return;
      var name = companyNameInput.value ? companyNameInput.value.trim() : '';
      if (!name) {
        showCompanyMessage('اسم المنشأة مطلوب', true);
        return;
      }
      var formData = new FormData();
      formData.append('company_name', name);
      if (companyLogoInput && companyLogoInput.files && companyLogoInput.files[0]) {
        formData.append('company_logo', companyLogoInput.files[0]);
      }
      if (btnSaveCompanyProfile) btnSaveCompanyProfile.disabled = true;
      fetch('/api/company-profile', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data.success) {
            showCompanyMessage(data.message || 'فشل حفظ بيانات المنشأة', true);
          } else {
            showCompanyMessage(data.message || 'تم حفظ بيانات المنشأة');
            loadCompanyProfile();
          }
        })
        .catch(function () {
          showCompanyMessage('خطأ في الاتصال', true);
        })
        .finally(function () {
          if (btnSaveCompanyProfile) btnSaveCompanyProfile.disabled = false;
        });
    });
  }

  if (companyLogoInput) {
    companyLogoInput.addEventListener('change', function () {
      var file = companyLogoInput.files && companyLogoInput.files[0];
      if (!file) return;
      if (!file.type || !file.type.startsWith('image/')) {
        showCompanyMessage('الرجاء اختيار ملف صورة صالح', true);
        companyLogoInput.value = '';
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        setLogoPreview(e.target.result || '');
      };
      reader.readAsDataURL(file);
    });
  }

  if (tabCompanyProfile) {
    tabCompanyProfile.addEventListener('shown.bs.tab', function () {
      if (!systemTabAccess.company_profile) return;
      loadCompanyProfile();
    });
  }

  // مسارات النسخ الاحتياطي / استيراد البيانات
  var tabBackupPaths = document.getElementById('tab-backup-paths');
  var backupPathsTbody = document.getElementById('backup-paths-tbody');
  var backupPathMessage = document.getElementById('backup-path-message');
  var addBackupPathForm = document.getElementById('add-backup-path-form');
  var btnShowAddBackupPath = document.getElementById('btn-show-add-backup-path');
  var backupPathInput = document.getElementById('backup-path-input');
  var btnSaveBackupPath = document.getElementById('btn-save-backup-path');
  var backupTimeForm = document.getElementById('backup-time-form');
  var backupTimeInput = document.getElementById('backup-time-input');
  var btnSaveBackupTime = document.getElementById('btn-save-backup-time');
  var btnRunBackupNow = document.getElementById('btn-run-backup-now');
  var backupTimeMessage = document.getElementById('backup-time-message');
  var backupImportForm = document.getElementById('backup-import-form');
  var backupImportFile = document.getElementById('backup-import-file');
  var btnRunBackupImport = document.getElementById('btn-run-backup-import');
  var backupImportMessage = document.getElementById('backup-import-message');
  var backupPathsLoaded = false;

  function loadBackupPaths() {
    if (!backupPathsTbody) return;
    backupPathsTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">جاري التحميل...</td></tr>';
    fetch('/api/backup-paths', { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success || !result.data) {
          backupPathsTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">لا توجد بيانات</td></tr>';
          return;
        }
        var list = result.data;
        if (!list.length) {
          backupPathsTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">لا يوجد أي مسار محفوظ بعد</td></tr>';
          return;
        }
        backupPathsTbody.innerHTML = list.map(function (row, i) {
          var date = row.created_at ? new Date(row.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' }) : '—';
          var action = '<button type="button" class="btn btn-sm btn-outline-danger btn-delete-backup-path" data-id="' + row.id + '"><i class="fas fa-trash-alt me-1"></i>حذف</button>';
          return '<tr><td>' + (i + 1) + '</td><td dir="ltr">' + (row.backup_path || '—') + '</td><td>' + date + '</td><td>' + action + '</td></tr>';
        }).join('');

        backupPathsTbody.querySelectorAll('.btn-delete-backup-path').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            if (!id) return;
            if (!window.confirm('هل أنت متأكد من حذف هذا المسار؟')) return;
            btn.disabled = true;
            fetch('/api/backup-paths/' + encodeURIComponent(id), {
              method: 'DELETE',
              credentials: 'same-origin',
            })
              .then(function (res) { return res.json(); })
              .then(function (data) {
                if (!data.success) {
                  showInlineMessage(backupPathMessage, data.message || 'فشل حذف المسار', true);
                  return;
                }
                showInlineMessage(backupPathMessage, data.message || 'تم حذف المسار');
                loadBackupPaths();
              })
              .catch(function () {
                showInlineMessage(backupPathMessage, 'خطأ في الاتصال', true);
              })
              .finally(function () {
                btn.disabled = false;
              });
          });
        });
      })
      .catch(function () {
        backupPathsTbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4">فشل تحميل البيانات</td></tr>';
      });
  }

  function loadBackupSettings() {
    if (!backupTimeInput) return;
    fetch('/api/backup-settings', { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result.success || !result.data) return;
        backupTimeInput.value = result.data.backup_time || '00:00';
      })
      .catch(function () {
        backupTimeInput.value = backupTimeInput.value || '00:00';
      });
  }

  if (btnShowAddBackupPath && addBackupPathForm) {
    btnShowAddBackupPath.addEventListener('click', function () {
      addBackupPathForm.classList.toggle('d-none');
      if (!addBackupPathForm.classList.contains('d-none') && backupPathInput) {
        backupPathInput.focus();
      }
    });
  }

  if (addBackupPathForm) {
    addBackupPathForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!backupPathInput) return;
      var pathValue = backupPathInput.value ? backupPathInput.value.trim() : '';
      if (!pathValue) {
        showInlineMessage(backupPathMessage, 'الرجاء تحديد مسار أولاً', true);
        return;
      }
      if (btnSaveBackupPath) btnSaveBackupPath.disabled = true;
      fetch('/api/backup-paths', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup_path: pathValue }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data.success) {
            showInlineMessage(backupPathMessage, data.message || 'فشل حفظ المسار', true);
            return;
          }
          showInlineMessage(backupPathMessage, data.message || 'تم حفظ المسار');
          backupPathInput.value = '';
          loadBackupPaths();
        })
        .catch(function () {
          showInlineMessage(backupPathMessage, 'خطأ في الاتصال', true);
        })
        .finally(function () {
          if (btnSaveBackupPath) btnSaveBackupPath.disabled = false;
        });
    });
  }

  if (tabBackupPaths && backupPathsTbody) {
    tabBackupPaths.addEventListener('shown.bs.tab', function () {
      if (!systemTabAccess.backup) return;
      if (!backupPathsLoaded) {
        backupPathsLoaded = true;
        loadBackupPaths();
        loadBackupSettings();
      }
    });
  }

  if (backupTimeForm) {
    backupTimeForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var timeValue = backupTimeInput && backupTimeInput.value ? backupTimeInput.value.trim() : '';
      if (!timeValue) timeValue = '00:00';
      if (btnSaveBackupTime) btnSaveBackupTime.disabled = true;
      fetch('/api/backup-settings', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup_time: timeValue }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data.success) {
            showInlineMessage(backupTimeMessage, data.message || 'فشل حفظ وقت النسخ الاحتياطي', true);
            return;
          }
          if (backupTimeInput && data.data && data.data.backup_time) {
            backupTimeInput.value = data.data.backup_time;
          }
          showInlineMessage(backupTimeMessage, data.message || 'تم حفظ وقت النسخ الاحتياطي');
        })
        .catch(function () {
          showInlineMessage(backupTimeMessage, 'خطأ في الاتصال', true);
        })
        .finally(function () {
          if (btnSaveBackupTime) btnSaveBackupTime.disabled = false;
        });
    });
  }

  if (btnRunBackupNow) {
    btnRunBackupNow.addEventListener('click', function () {
      btnRunBackupNow.disabled = true;
      fetch('/api/backup-run-now', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data.success) {
            showInlineMessage(backupTimeMessage, data.message || 'فشل تنفيذ النسخ الاحتياطي الآن', true);
            return;
          }
          showInlineMessage(backupTimeMessage, data.message || 'تم تنفيذ النسخ الاحتياطي الآن');
          loadBackupPaths();
        })
        .catch(function () {
          showInlineMessage(backupTimeMessage, 'خطأ في الاتصال', true);
        })
        .finally(function () {
          btnRunBackupNow.disabled = false;
        });
    });
  }

  if (backupImportForm) {
    backupImportForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!backupImportFile || !backupImportFile.files || !backupImportFile.files[0]) {
        showInlineMessage(backupImportMessage, 'اختر ملف SQL أولاً', true);
        return;
      }
      if (!window.confirm('هل تريد استيراد هذا الملف إلى قاعدة البيانات الآن؟')) return;
      if (btnRunBackupImport) btnRunBackupImport.disabled = true;

      var formData = new FormData();
      formData.append('backup_file', backupImportFile.files[0]);

      fetch('/api/backup-import', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data.success) {
            showInlineMessage(backupImportMessage, data.message || 'فشل استيراد البيانات', true);
            return;
          }
          showInlineMessage(backupImportMessage, data.message || 'تم استيراد البيانات بنجاح');
          backupImportForm.reset();
        })
        .catch(function () {
          showInlineMessage(backupImportMessage, 'خطأ في الاتصال أثناء الاستيراد', true);
        })
        .finally(function () {
          if (btnRunBackupImport) btnRunBackupImport.disabled = false;
        });
    });
  }

  initSystemTabsAccess();

  var yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
