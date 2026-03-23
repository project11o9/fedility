const { pool } = require("../config/db");
const AppError = require("../utils/AppError");

async function listUsers(_req, res) {
  const users = await pool.query(
    "SELECT id, name, email, wallet_balance, credit_score, status, role, created_at FROM users ORDER BY id"
  );

  return res.json({ success: true, users: users.rows });
}

async function updateWallet(req, res) {
  const { userId, balance } = req.body;
  const parsedBalance = Number(balance);

  if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
    throw new AppError(400, "Balance must be a non-negative number");
  }

  const result = await pool.query(
    "UPDATE users SET wallet_balance = $1, updated_at = NOW() WHERE id = $2 RETURNING id",
    [parsedBalance, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "User not found");
  }

  return res.json({ success: true, message: "Wallet updated" });
}

async function toggleUser(req, res) {
  const { userId, status } = req.body;
  if (!["active", "disabled"].includes(status)) {
    throw new AppError(400, "Invalid status");
  }

  const result = await pool.query(
    "UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id",
    [status, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "User not found");
  }

  return res.json({ success: true, message: "User status updated" });
}

async function listDeposits(_req, res) {
  const result = await pool.query(
    `SELECT dr.id, dr.user_id, u.name, u.email, dr.amount, dr.type, dr.status, dr.created_at
     FROM deposit_requests dr
     JOIN users u ON u.id = dr.user_id
     ORDER BY dr.created_at DESC
     LIMIT 200`
  );

  return res.json({ success: true, deposits: result.rows });
}

async function approveDeposit(req, res) {
  const { requestId } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const requestResult = await client.query(
      "SELECT id, user_id, amount, status FROM deposit_requests WHERE id = $1 FOR UPDATE",
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      throw new AppError(404, "Deposit request not found");
    }

    const request = requestResult.rows[0];
    if (request.status !== "pending") {
      throw new AppError(409, "Deposit request already processed");
    }

    await client.query(
      "UPDATE users SET wallet_balance = wallet_balance + $1, updated_at = NOW() WHERE id = $2",
      [request.amount, request.user_id]
    );

    await client.query(
      "INSERT INTO transactions (user_id, type, amount, status) VALUES ($1, $2, $3, $4)",
      [request.user_id, "deposit", request.amount, "approved"]
    );

    await client.query("UPDATE deposit_requests SET status = 'approved' WHERE id = $1", [requestId]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return res.json({ success: true, message: "Deposit approved" });
}

async function listWithdraws(_req, res) {
  const result = await pool.query(
    `SELECT wr.id, wr.user_id, u.name, u.email, wr.amount, wr.upi, wr.status, wr.created_at
     FROM withdraw_requests wr
     JOIN users u ON u.id = wr.user_id
     ORDER BY wr.created_at DESC
     LIMIT 200`
  );

  return res.json({ success: true, withdraws: result.rows });
}

async function approveWithdraw(req, res) {
  const { requestId } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const requestResult = await client.query(
      "SELECT id, user_id, amount, status FROM withdraw_requests WHERE id = $1 FOR UPDATE",
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      throw new AppError(404, "Withdraw request not found");
    }

    const request = requestResult.rows[0];
    if (request.status !== "pending") {
      throw new AppError(409, "Withdraw request already processed");
    }

    const userResult = await client.query(
      "SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE",
      [request.user_id]
    );

    if (userResult.rows.length === 0) {
      throw new AppError(404, "User not found");
    }

    if (Number(userResult.rows[0].wallet_balance) < Number(request.amount)) {
      throw new AppError(400, "Insufficient user balance to approve withdraw");
    }

    await client.query(
      "UPDATE users SET wallet_balance = wallet_balance - $1, updated_at = NOW() WHERE id = $2",
      [request.amount, request.user_id]
    );

    await client.query(
      "INSERT INTO transactions (user_id, type, amount, status) VALUES ($1, $2, $3, $4)",
      [request.user_id, "withdraw", request.amount, "approved"]
    );

    await client.query("UPDATE withdraw_requests SET status = 'approved' WHERE id = $1", [requestId]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return res.json({ success: true, message: "Withdraw approved" });
}

async function updateStock(req, res) {
  const { stockId, price, change } = req.body;

  const parsedPrice = Number(price);
  const parsedChange = Number(change);

  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    throw new AppError(400, "Price must be a positive number");
  }

  if (!Number.isFinite(parsedChange)) {
    throw new AppError(400, "Change must be a number");
  }

  const result = await pool.query(
    "UPDATE stocks SET price = $1, change_percent = $2, updated_at = NOW() WHERE id = $3 RETURNING id",
    [parsedPrice, parsedChange, stockId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, "Stock not found");
  }

  return res.json({ success: true, message: "Stock updated" });
}

module.exports = {
  listUsers,
  updateWallet,
  toggleUser,
  listDeposits,
  approveDeposit,
  listWithdraws,
  approveWithdraw,
  updateStock
};
