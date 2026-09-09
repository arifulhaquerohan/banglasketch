const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { getCredentials } = require("../services/adminCredentials");

const roleRank = { viewer: 0, editor: 1, admin: 2, owner: 3 };

async function verifyAdmin(req, res, next) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ success: false, error: "Admin authentication is not configured" });
  }

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: "No token" });

  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (payload.sub) {
      const result = await pool.query(
        "SELECT id, email, display_name, role, active, token_version FROM admin_users WHERE id = $1",
        [payload.sub]
      );
      const user = result.rows[0];
      if (!user?.active || user.token_version !== payload.version) {
        return res.status(401).json({ success: false, error: "Session expired; please sign in again" });
      }
      req.admin = { ...payload, ...user };
    } else {
      const credentials = await getCredentials();
      if (payload.version !== credentials.version) {
        return res.status(401).json({ success: false, error: "Session expired; please sign in again" });
      }
      req.admin = payload;
    }
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
}

const requireRole = (minimum) => (req, res, next) =>
  roleRank[req.admin?.role] >= roleRank[minimum]
    ? next()
    : res.status(403).json({ success: false, error: "Insufficient permission" });

module.exports = { verifyAdmin, requireRole, roleRank };
