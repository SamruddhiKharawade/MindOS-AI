// backend/src/middleware/auth.middleware.js

import jwt  from "jsonwebtoken";
import User from "../models/User.js";

const createError = (message, statusCode = 401) => {
  const error     = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const protect = async (req, res, next) => {
  console.log("🍪 Cookies received:", req.cookies);
  console.log("🔑 Auth header:", req.headers.authorization); 
  try {
    // ── Try cookie first ──────────────────────────────────────────────────
    let token = req.cookies?.mindos_token;

    // ── Fallback: try Authorization header ────────────────────────────────
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please log in.",
      });
    }

    // Verify token signature + expiry
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "mindos_super_secret_key"
    );

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }
console.log("Found user:", user?._id, user?.username); // add this
req.user = user;

    // Add just before next():
console.log("✅ User attached:", req.user?._id, req.user?.username);
next();
   
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }
    next(error);
  }
};