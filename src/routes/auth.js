const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { User, AuditLog } = require("../models");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "15m",
  });
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
    }
  );
  return { accessToken, refreshToken };
};

// Register
router.post(
  "/register",
  [
    body("name").notEmpty().isLength({ min: 2, max: 100 }),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, email, password } = req.body;
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "User already exists" });
      }

      const user = await User.create({
        name,
        email,
        password,
        role: "citizen",
      });
      const { accessToken } = generateTokens(user.id);

      res.status(201).json({
        success: true,
        data: { user: user.toJSON(), token: accessToken },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Login
router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await User.findByEmail(email);
      if (!user || !(await user.comparePassword(password))) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const { accessToken } = generateTokens(user.id);
      await user.update({ last_login: new Date() });

      res.json({
        success: true,
        data: { user: user.toJSON(), token: accessToken },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get current user
router.get("/me", auth, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// Logout
router.post("/logout", auth, (req, res) => {
  res.json({ success: true, message: "Logout successful" });
});

module.exports = router;
