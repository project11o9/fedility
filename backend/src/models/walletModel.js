const { pool } = require("../config/db");

async function getWalletByUserId(userId) {
  const result = await pool.query(
    "SELECT wallet_balance FROM users WHERE id = $1 AND status = 'active'",
    [userId]
  );
  return result.rows[0] || null;
}

async function getRecentTransactions(userId) {
  const result = await pool.query(
    "SELECT type, amount, status, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
    [userId]
  );
  return result.rows;
}

module.exports = {
  getWalletByUserId,
  getRecentTransactions
};
