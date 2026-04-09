// backend/src/controllers/auth.controller.js

import * as authService          from "../services/auth.service.js";
import { cookieOptions }         from "../services/auth.service.js";

const getUserId = (req) => {
  if (!req.user) {
    throw Object.assign(new Error("Not authenticated"), { statusCode: 401 });
  }
  return req.user._id;
};
// ─── REGISTER ─────────────────────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const { token, user } = await authService.register({
      username, email, password,
    });

    // Set JWT as httpOnly cookie
    res.cookie("mindos_token", token, cookieOptions);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data:    { user },
    });
  } catch (error) {
    next(error);
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user }     = await authService.login({ email, password });

    res.cookie("mindos_token", token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data:    { user },
    });
  } catch (error) {
    next(error);
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  // Clear the cookie by setting maxAge to 0
  res.cookie("mindos_token", "", {
    ...cookieOptions,
    maxAge: 0,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// ─── GET ME ───────────────────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user._id);
    res.status(200).json({
      success: true,
      data:    { user },
    });
  } catch (error) {
    next(error);
  }
};