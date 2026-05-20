/**
 * إدراج صف في product_price_history عند تغيير سعر الشراء أو البيع (سجل تراكمي مع effective_at).
 */
async function recordProductPriceHistoryIfChanged(conn, params) {
  const {
    productId,
    purchaseBefore,
    saleBefore,
    purchaseAfter,
    saleAfter,
    source,
    referenceId,
    userId,
  } = params;

  const pb = Number(purchaseBefore) || 0;
  const sb = Number(saleBefore) || 0;
  const pa = Number(purchaseAfter) || 0;
  const sa = Number(saleAfter) || 0;

  if (pb === pa && sb === sa) return;

  await conn.execute(
    `INSERT INTO product_price_history (
      product_id, purchase_price, sale_price, source, reference_id, user_id
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [productId, pa, sa, source, referenceId != null ? referenceId : null, userId != null ? userId : null]
  );
}

module.exports = { recordProductPriceHistoryIfChanged };
