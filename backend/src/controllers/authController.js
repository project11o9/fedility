const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");
const config = require("../config/env");
const { findByEmail, createUser } = require("../models/userModel");
const { signUserToken } = require("../services/tokenService");

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function signup(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError(400, "Name, email and password are required");
  }

  if (!validateEmail(email)) {
    throw new AppError(400, "Invalid email format");
  }

  if (String(password).length < 8) {
    throw new AppError(400, "Password must be at least 8 characters long");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = String(name).trim();

  const existingUser = await findByEmail(normalizedEmail);
  if (existingUser) {
    throw new AppError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const role = config.ADMIN_EMAILS.includes(normalizedEmail) ? "admin" : "user";

  const user = await createUser({
    name: normalizedName,
    email: normalizedEmail,
    password: hashedPassword,
    role
  });

  const token = signUserToken(user);

  return res.status(201).json({
    success: true,
    message: "Signup successful",
    token,
    user: sanitizeUser(user)
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError(400, "Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await findByEmail(normalizedEmail);

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.status !== "active") {
    throw new AppError(403, "Account is disabled");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = signUserToken(user);

  return res.json({
    success: true,
    message: "Login successful",
    token,
    user: sanitizeUser(user)
  });
}

module.exports = {
  signup,
  login
};
