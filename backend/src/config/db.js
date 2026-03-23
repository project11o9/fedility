const { Pool } = require("pg");
const config = require("./env");

const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  max: config.DB_POOL_MAX,
  idleTimeoutMillis: config.DB_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: config.DB_CONNECTION_TIMEOUT_MS
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

async function initializeDatabase() {
  await pool.query("SELECT 1");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      wallet_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
      credit_score INTEGER NOT NULL DEFAULT 650,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT users_status_check CHECK (status IN ('active', 'disabled')),
      CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL,
      amount NUMERIC(14,2) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'approved',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT transactions_type_check CHECK (type IN ('deposit', 'withdraw')),
      CONSTRAINT transactions_amount_check CHECK (amount > 0)
    );

    CREATE TABLE IF NOT EXISTS deposit_requests (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC(14,2) NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'manual',
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT deposit_amount_check CHECK (amount > 0),
      CONSTRAINT deposit_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
    );

    CREATE TABLE IF NOT EXISTS withdraw_requests (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC(14,2) NOT NULL,
      upi VARCHAR(120) NOT NULL DEFAULT 'UPI',
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT withdraw_amount_check CHECK (amount > 0),
      CONSTRAINT withdraw_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
    );

    CREATE TABLE IF NOT EXISTS stocks (
      id BIGSERIAL PRIMARY KEY,
      symbol VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(120) NOT NULL,
      price NUMERIC(14,2) NOT NULL,
      change_percent NUMERIC(8,2) NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  console.log("✅ PostgreSQL connected and schema initialized");
}

module.exports = { pool, initializeDatabase };
