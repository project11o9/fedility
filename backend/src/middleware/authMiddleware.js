const jwt = require("jsonwebtoken");
const config = require("../config/env");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: token missing" });
  }

  try {
    req.user = jwt.verify(token, config.JWT_SECRET);
    return next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: "Unauthorized: invalid token" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return next();
  };
}

module.exports = { authMiddleware, requireRole };
