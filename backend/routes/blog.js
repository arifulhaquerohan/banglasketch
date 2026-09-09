const { recordView } = require("../services/blogViews");
const { pagination, cursorFor } = require("../middleware/pagination");
const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// GET all published posts
router.get("/", async (req, res) => {
  try {
    if (Object.keys(req.query).some(key => !['page','limit','cursor','category','featured','search'].includes(key))) return res.status(400).json({ success: false, error: 'Invalid filter' });
    const { page, limit, offset, cursor } = pagination(req.query);
    const { category, featured, search } = req.query;
    for (const value of [category, featured, search]) if (value !== undefined && (typeof value !== 'string' || value.length > 200)) return res.status(400).json({ success: false, error: 'Invalid filter' });
    let q = "SELECT id, title, slug, excerpt, featured_image, category, tags, author, published_date, reading_time, featured, views_count FROM blog_posts WHERE published = true AND deleted_at IS NULL AND (scheduled_publish_date IS NULL OR scheduled_publish_date <= NOW())";
    const params = [];
    if (category && category !== "All") { params.push(category); q += ` AND category = $${params.length}`; }
    if (featured === "true") q += " AND featured = true";
    if (search) { params.push(search); q += ` AND to_tsvector('english', title || ' ' || COALESCE(excerpt,'') || ' ' || COALESCE(content,'')) @@ websearch_to_tsquery('english', $${params.length})`; }
    if (cursor) { params.push(cursor); q += ` AND id < $${params.length}`; }
    q += " ORDER BY id DESC";
    q += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit + 1, cursor ? 0 : offset);
    const result = await pool.query(q, params);
    res.set('Cache-Control', 'public, max-age=0, s-maxage=60');
    res.json({ success: true, data: result.rows.slice(0, limit), pagination: { page, limit, hasMore: result.rows.length > limit, nextCursor: cursorFor(result.rows, limit) } });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: err.status === 400 ? "Invalid pagination" : "Unable to process request" }); }
});

// GET by slug is read-only; analytics must not lock the content row.
router.get("/:slug", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM blog_posts WHERE slug = $1 AND published = true AND deleted_at IS NULL AND (scheduled_publish_date IS NULL OR scheduled_publish_date <= NOW())",
      [req.params.slug]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: "Not found" });
    recordView(result.rows[0].id);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(err.status === 400 ? 400 : 500).json({ success: false, error: err.status === 400 ? "Invalid pagination" : "Unable to process request" }); }
});

module.exports = router;
