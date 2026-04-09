// backend/src/models/User.js

import mongoose  from "mongoose";
import bcrypt    from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  [true, "Username is required"],
      trim:      true,
      minlength: [3,  "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },

    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },

    password: {
      type:      String,
      required:  [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select:    false, // never returned in queries by default
    },
  },
  { timestamps: true }
);

// ─── Hash password before saving ──────────────────────────────────────────────
// This hook runs automatically before every .save() call
// If the password hasn't changed, skip hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt   = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: compare password ────────────────────────────────────────
// Called during login to check if entered password matches stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;