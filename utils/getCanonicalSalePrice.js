/**
 * سعر البيع الرسمي للمنتج حتى لحظة تنفيذ الطلب:
 * آخر سجل في product_price_history ثم الاحتياطي من product_prices.
 */
async function getCanonicalSalePrice(conn, productId) {
  const pid = parseInt(productId, 10);
  if (!pid) return null;
  const [hist] = await conn.execute(
    `SELECT sale_price FROM product_price_history
     WHERE product_id = ? AND effective_at <= NOW(3)
     ORDER BY effective_at DESC, id DESC
     LIMIT 1`,
    [pid]
  );
  if (hist.length) {
    return Number(hist[0].sale_price);
  }
  const [pp] = await conn.execute(
    `SELECT sale_price FROM product_prices
     WHERE product_id = ? AND deleted_at IS NULL
     ORDER BY id DESC
     LIMIT 1`,
    [pid]
  );
  if (pp.length) {
    return Number(pp[0].sale_price);
  }
  return null;
}

module.exports = { getCanonicalSalePrice };
