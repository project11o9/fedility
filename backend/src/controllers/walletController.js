const { pool } = require("../config/db");
const AppError = require("../utils/AppError");
const { getWalletByUserId, getRecentTransactions } = require("../models/walletModel");

function parsePositiveAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(400, "Amount must be a positive number");
  }
  return amount;
}

async function getWallet(req, res) {
  const userId = req.user.userId;
  const wallet = await getWalletByUserId(userId);

  if (!wallet) {
    throw new AppError(404, "User not found");
  }

  const transactions = await getRecentTransactions(userId);

  return res.json({
    success: true,
    balance: Number(wallet.wallet_balance),
    transactions
  });
}

async function createDeposit(req, res) {
  const userId = req.user.userId;
  const amount = parsePositiveAmount(req.body.amount);

  await pool.query(
    "INSERT INTO deposit_requests (user_id, amount, type, status) VALUES ($1, $2, $3, 'pending')",
    [userId, amount, "manual"]
  );

  return res.json({ success: true, message: "Deposit request created" });
}

async function createWithdraw(req, res) {
  const userId = req.user.userId;
  const amount = parsePositiveAmount(req.body.amount);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      "SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE",
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError(404, "User not found");
    }

    if (Number(userResult.rows[0].wallet_balance) < amount) {
      throw new AppError(400, "Insufficient balance");
    }

    await client.query(
      "INSERT INTO withdraw_requests (user_id, amount, upi, status) VALUES ($1, $2, $3, 'pending')",
      [userId, amount, "UPI"]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return res.json({ success: true, message: "Withdraw request submitted" });
}

module.exports = {
  getWallet,
  createDeposit,
  createWithdraw
};
