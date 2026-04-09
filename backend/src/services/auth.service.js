// backend/src/services/auth.service.js

import jwt  from "jsonwebtoken";
import User from "../models/User.js";

const createError = (message, statusCode = 400) => {
  const error      = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// ─── Generate JWT ─────────────────────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// ─── Cookie options ───────────────────────────────────────────────────────────
// backend/src/services/auth.service.js

export const cookieOptions = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000,
  path:     "/",
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
export const register = async ({ username, email, password }) => {
  // Check all fields provided
  if (!username || !email || !password) {
    throw createError("Username, email and password are required", 400);
  }

  // Check if email already exists
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw createError("An account with this email already exists", 409);
  }

  // Create user — password hashed automatically via pre-save hook
  const user = await User.create({ username, email, password });

  // Generate JWT
  const token = generateToken(user._id);

  return {
    token,
    user: {
      id:       user._id,
      username: user.username,
      email:    user.email,
    },
  };
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const login = async ({ email, password }) => {
  if (!email || !password) {
    throw createError("Email and password are required", 400);
  }

  // Find user — explicitly select password (it's excluded by default)
  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select("+password");

  if (!user) {
    // Generic message — don't reveal whether email exists
    throw createError("Invalid email or password", 401);
  }

  // Compare entered password with stored hash
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw createError("Invalid email or password", 401);
  }

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id:       user._id,
      username: user.username,
      email:    user.email,
    },
  };
};

// ─── GET ME ───────────────────────────────────────────────────────────────────
export const getMe = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw createError("User not found", 404);
  return user;
};