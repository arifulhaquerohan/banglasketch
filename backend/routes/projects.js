const { pagination, cursorFor } = require("../middleware/pagination");
const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// GET all projects
router.get("/", async (req, res) => {
  try {
    if (Object.keys(req.query).some(key => !['page','limit','cursor','category','featured','search'].includes(key))) return res.status(400).json({ success: false, error: 'Invalid filter' });
    const { page, limit, offset, cursor } = pagination(req.query);
    const { category, featured, search } = req.query;
    for (const value of [category, featured, search]) if (value !== undefined && (typeof value !== 'string' || value.length > 200)) return res.status(400).json({ success: false, error: 'Invalid filter' });
    let q = "SELECT id, title, slug, description, category, featured_image, date_completed, featured FROM projects WHERE published = true AND deleted_at IS NULL";
    const params = [];
    if (category) { params.push(category); q += ` AND category = $${params.length}`; }
    if (featured === "true") { q += " AND featured = true"; }
    if (search) { params.push(search); q += ` AND similarity(title || ' ' || COALESCE(description,'') || ' ' || category, $${params.length}) > 0.05`; }
    if (cursor) { params.push(cursor); q += ` AND id < $${params.length}`; }
    q += " ORDER BY id DESC";
    q += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit + 1, cursor ? 0 : offset);
    const result = await pool.query(q, params);
    res.set('Cache-Control', 'public, max-age=0, s-maxage=60');
    res.json({ success: true, data: result.rows.slice(0, limit), pagination: { page, limit, hasMore: result.rows.length > limit, nextCursor: cursorFor(result.rows, limit) } });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: err.status === 400 ? "Invalid pagination" : "Unable to process request" }); }
});

// GET by slug
router.get("/:slug", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects WHERE slug = $1 AND published = true AND deleted_at IS NULL", [req.params.slug]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: err.status === 400 ? "Invalid pagination" : "Unable to process request" }); }
});

module.exports = router;
