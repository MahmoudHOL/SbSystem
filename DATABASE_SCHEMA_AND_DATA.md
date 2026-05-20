# قاعدة البيانات sb_pos – الجداول والبيانات

تم استخراج البنية والبيانات من MySQL عبر CMD/PowerShell. المستخدم: `root`.

---

## 1. المستخدمون والصلاحيات

### `users`
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK, auto_increment | معرف المستخدم |
| username | varchar(100), UNIQUE | اسم الدخول |
| password_hash | varchar(255) | كلمة المرور (bcrypt) |
| full_name | varchar(200) | الاسم الكامل |
| is_active | tinyint(1), default 1 | نشط / معطل |
| created_at, updated_at | datetime | |

**البيانات الحالية (2):**
| id | username | full_name | is_active |
|----|----------|-----------|-----------|
| 1 | admin | (عربي) | 1 |
| 2 | panda | panda | 1 |

---

## 2. المخازن والطرفيات

### `warehouses`
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | معرف المخزن |
| name | varchar(200) | اسم المخزن |
| created_at, updated_at | datetime | |

**البيانات (3):** id=1 hello, id=2 hunter, id=3 **Sb**.

### `suppliers` (الموردون)
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | معرف المورد |
| name | varchar(200) | الاسم |
| phone | varchar(50) | الهاتف |
| note | text | ملاحظات |
| created_at, updated_at | datetime | |

**البيانات (2):** 1=panda (+201227076043), 2=مورد آخر (+201224944302).

### `customers` (العملاء)
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | معرف العميل |
| name | varchar(200) | الاسم |
| phone | varchar(50) | الهاتف |
| created_at, updated_at | datetime | |

**البيانات:** الجدول **فارغ** حالياً.

### `payment_methods` (طرق الدفع)
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| name | varchar(200) | اسم الطريقة |
| created_at, updated_at | datetime | |

**البيانات (1):** id=1 **insta**.

### `discount_rates` (نسب الخصم)
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| user_id | int unsigned, NULL | NULL = خصم عام |
| rate_percent | decimal(5,2) | نسبة الخصم % |
| is_global | tinyint(1) | 1=عام، 0=لمستخدم محدد |
| created_at, updated_at | datetime | |

**البيانات (2):** خصم عام 20% (user_id=NULL), خصم للمستخدم 2 (panda) 30%.

---

## 3. المنتجات والأسعار والمخزون

### `products`
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| name | varchar(255) | اسم المنتج |
| barcode | char(12), UNIQUE | الباركود |
| deleted_at | datetime, NULL | حذف soft |
| created_at, updated_at | datetime | |

**البيانات (5 منتجات):** hi(123456789012), man(123456789011), nm(123456789778), hello(123456789772), **Cam**(235098650855).

### `product_prices`
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| product_id | int unsigned | FK → products |
| purchase_price | decimal(12,2) | سعر الشراء |
| sale_price | decimal(12,2) | سعر البيع |
| deleted_at | datetime, NULL | |
| created_at, updated_at | datetime | |

**البيانات (5):** كل منتج له سعر شراء وبيع (مثلاً Cam: شراء 350، بيع 450).

### `warehouse_stock` (كمية كل منتج في كل مخزن)
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| product_id | int unsigned | FK → products |
| warehouse_id | int unsigned | FK → warehouses |
| quantity | decimal(15,3) | الكمية |
| deleted_at | datetime, NULL | |
| created_at, updated_at | datetime | |

**البيانات (9 سجلات):** أغلب الحركة في المخزن **Sb (id=3)** — مثلاً: منتج Cam (6) كمية 198، منتج hi (1) كمية 24، إلخ.

### `stock_movements` (سجل حركة المخزون)
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| product_id | int unsigned | |
| warehouse_id | int unsigned | |
| quantity_before | decimal(15,3) | الكمية قبل |
| quantity_after | decimal(15,3) | الكمية بعد |
| user_id | int unsigned, NULL | من قام بالحركة |
| created_at | datetime | |

**البيانات:** **59** حركة (شراء، بيع، تحويل، مرتجع).

---

## 4. فواتير البيع (نقطة البيع + المخازن)

### `sale_invoices`
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| warehouse_id | int unsigned | المخزن |
| customer_id | int unsigned, NULL | العميل (إن وُجد) |
| customer_name | varchar(200), NULL | اسم العميل (نص حر) |
| customer_phone | varchar(50), NULL | هاتف العميل |
| supplier_id | int unsigned, NULL | (قد يُستخدم في بعض الشاشات) |
| total_amount | decimal(15,2) | إجمالي الفاتورة |
| global_discount_percent / global_discount_value | decimal | خصم عام (إن وُجد في الجدول) |
| amount_paid | decimal(15,2) | المبلغ المدفوع |
| payment_method_id | int unsigned, NULL | طريقة الدفع |
| discount_percent | decimal(5,2) | نسبة الخصم % |
| discount_value | decimal(15,2) | قيمة الخصم |
| total_before_discount | decimal(15,2) | الإجمالي قبل الخصم |
| total_items | decimal(15,3) | عدد القطع |
| user_id | int unsigned, NULL | المستخدم الذي أنشأ الفاتورة |
| **is_pos** | tinyint(1), default 0 | **1 = من نقطة البيع، 0 = من شاشة المخازن** |
| created_at, updated_at | datetime | |

**البيانات (6 فواتير):** كلها **is_pos=0** (من المخازن)، المخزن 3 (Sb)، المستخدم 2 (panda).  
مثال: فاتورة 1 = 2700 ج.م مدفوع 2000؛ فاتورة 6 = عميل "hello"، 24 ج.م مدفوع 12.

### `sale_invoice_items` (أصناف فاتورة البيع)
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| sale_invoice_id | int unsigned | FK → sale_invoices |
| product_id | int unsigned | المنتج |
| quantity | decimal(15,3) | الكمية |
| unit_sale_price | decimal(12,2) | سعر الوحدة |
| line_total | decimal(15,2) | المجموع للصنف |

**البيانات (6 أسطر):** فاتورة 1: 6 قطع Cam × 450؛ فاتورة 6: 2 قطع hi × 12 = 24، إلخ.

### `sale_invoice_edit_log` (سجل تعديل فواتير البيع)
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| sale_invoice_id | int unsigned | الفاتورة المعدّلة |
| user_id | int unsigned, NULL | من عدّل |
| edited_at | datetime | وقت التعديل |

**البيانات (1):** فاتورة البيع 6 عدّلها المستخدم 2 في 2026-02-27 22:07:44.

### `sale_returns` (مرتجعات البيع)
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| sale_invoice_id | int unsigned | الفاتورة الأصلية |
| supplier_id | int unsigned, NULL | |
| warehouse_id | int unsigned | المخزن (إرجاع للمخزن) |
| total_return_amount | decimal(15,2) | إجمالي المرتجع |
| user_id | int unsigned, NULL | |
| note | varchar(255), NULL | ملاحظة |
| created_at | datetime | |

**البيانات:** **فارغ** — لا توجد مرتجعات بيع.

### `sale_return_items` (أصناف مرتجع البيع)
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| sale_return_id | int unsigned | FK → sale_returns |
| product_id | int unsigned | |
| quantity_before | decimal(15,3) | الكمية قبل في المخزن |
| quantity_returned | decimal(15,3) | الكمية المرتجعة |
| quantity_after | decimal(15,3) | الكمية بعد في المخزن |
| unit_sale_price | decimal(12,2) | سعر البيع |
| line_total | decimal(15,2) | المجموع |

**البيانات:** فارغ (لعدم وجود مرتجعات بيع).

---

## 5. فواتير الشراء والمرتجعات

### `purchase_invoices`
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| supplier_id | int unsigned, NULL | المورد |
| warehouse_id | int unsigned | المخزن |
| total_amount | decimal(15,2) | الإجمالي |
| amount_paid | decimal(15,2) | المدفوع |
| user_id | int unsigned, NULL | |
| created_at, updated_at | datetime | |

**البيانات (12 فاتورة):** من مخازن 1 و 3، موردون 1 و 2، مبالغ من 11 إلى 70000.

### `purchase_invoice_items`
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| purchase_invoice_id | int unsigned | FK → purchase_invoices |
| product_id | int unsigned | |
| quantity | decimal(15,3) | |
| unit_purchase_price | decimal(12,2) | سعر الشراء |
| unit_sale_price | decimal(12,2) | سعر البيع (للمرجع) |
| line_total | decimal(15,2) | |

**البيانات:** عدة أصناف مرتبطة بفواتير الشراء (منتجات 1,3,4,5,6).

### `purchase_invoice_edit_log`
سجل تعديل فواتير الشراء. **البيانات (1):** فاتورة شراء 13 عدّلها المستخدم 2.

### `purchase_returns`
مرتجعات الشراء. **البيانات (1):** مرتجع من فاتورة شراء 13، مورد 2، مخزن 3، مبلغ 350.

### `purchase_return_items`
أصناف مرتجع الشراء. **البيانات (1):** صنف واحد (منتج 6، كمية مرتجعة 1، من 200 إلى 199).

---

## 6. تحويلات المخزون

### `stock_transfers`
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| from_warehouse_id | int unsigned | من مخزن |
| to_warehouse_id | int unsigned | إلى مخزن |
| user_id | int unsigned, NULL | |
| transferred_at | datetime | |

**البيانات (3):** كلها من المخزن 1 (hello) إلى المخزن 3 (Sb)، مستخدم 2.

### `stock_transfer_items`
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| stock_transfer_id | int unsigned | FK → stock_transfers |
| product_id | int unsigned | |
| quantity | decimal(15,3) | الكمية المنقولة |

**البيانات (4 أسطر):** تحويل منتجات 4,5,1,6 بكميات مختلفة في نقل واحد.

---

## 7. مدفوعات الموردين

### `supplier_payments`
| العمود | النوع | الوصف |
|--------|--------|--------|
| id | int unsigned, PK | |
| supplier_id | int unsigned | المورد |
| amount | decimal(15,2) | المبلغ |
| direction | enum('to_supplier','from_supplier') | للمورد / من المورد |
| note | varchar(255), NULL | |
| user_id | int unsigned, NULL | |
| created_at | datetime | |

**البيانات (3):** دفعات لمورد 1 و 2 (to_supplier / from_supplier).

---

## ملخص سريع

| الجدول | عدد السجلات | ملاحظة |
|--------|-------------|--------|
| users | 2 | admin, panda |
| warehouses | 3 | hello, hunter, Sb |
| suppliers | 2 | |
| customers | 0 | فارغ |
| payment_methods | 1 | insta |
| discount_rates | 2 | عام 20%، مستخدم 30% |
| products | 5 | حذف soft بـ deleted_at |
| product_prices | 5 | |
| warehouse_stock | 9 | أغلب الكميات في مخزن Sb |
| stock_movements | 59 | سجل كل الحركات |
| sale_invoices | 6 | **كلها is_pos=0** (من المخازن فقط) |
| sale_invoice_items | 6 | |
| sale_invoice_edit_log | 1 | فاتورة 6 |
| sale_returns | 0 | لا مرتجعات بيع |
| sale_return_items | 0 | |
| purchase_invoices | 12 | |
| purchase_invoice_items | عدة | |
| purchase_returns | 1 | |
| purchase_return_items | 1 | |
| stock_transfers | 3 | من 1 → 3 |
| stock_transfer_items | 4 | |
| supplier_payments | 3 | |

**لماذا لا تظهر فواتير في نقطة البيع؟**  
نقطة البيع تعرض فقط الفواتير التي **is_pos = 1**. كل الفواتير الحالية **is_pos = 0** (صادرة من شاشة المخازن)، لذلك سجل المبيعات والاسترجاع في POS يظهران فارغين.
