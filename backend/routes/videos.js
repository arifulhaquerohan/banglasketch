const { pagination } = require("../middleware/pagination");
const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.get("/", async (req, res) => {
  try {
    const { page, limit, offset } = pagination(req.query);
    const { featured } = req.query;
    let q = "SELECT * FROM videos WHERE published = true AND deleted_at IS NULL";
    const params = [];
    if (featured === "true") q += " AND featured = true";
    q += " ORDER BY display_order ASC, created_at DESC";
    q += `, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit + 1, offset);
    const result = await pool.query(q, params);
    res.set('Cache-Control', 'public, max-age=0, s-maxage=60');
    res.json({ success: true, data: result.rows.slice(0, limit), pagination: { page, limit, hasMore: result.rows.length > limit } });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: "Unable to process request" }); }
});

module.exports = router;
