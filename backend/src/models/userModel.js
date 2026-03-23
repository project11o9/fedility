const { pool } = require("../config/db");

async function findByEmail(email) {
  const result = await pool.query(
    "SELECT id, name, email, password, role, status FROM users WHERE email = $1 LIMIT 1",
    [email]
  );
  return result.rows[0] || null;
}

async function createUser({ name, email, password, role }) {
  const result = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
    [name, email, password, role]
  );
  return result.rows[0];
}

module.exports = {
  findByEmail,
  createUser
};
