function pagination(query) {
  const read = (value, fallback, max) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) throw Object.assign(new Error('Invalid pagination'), { status: 400 });
    return Number(value);
  };
  const page = read(query.page, 1, 100000);
  const limit = read(query.limit, 24, 100);
  let cursor = null;
  if (query.cursor !== undefined) {
    try { cursor = Number(Buffer.from(String(query.cursor), 'base64url').toString('utf8')); }
    catch { throw Object.assign(new Error('Invalid pagination'), { status: 400 }); }
    if (!Number.isSafeInteger(cursor) || cursor < 1) throw Object.assign(new Error('Invalid pagination'), { status: 400 });
  }
  return { page, limit, offset: (page - 1) * limit, cursor };
}
function cursorFor(rows, limit) { return rows.length > limit ? Buffer.from(String(rows[limit - 1].id)).toString('base64url') : null; }
module.exports = { pagination, cursorFor };
