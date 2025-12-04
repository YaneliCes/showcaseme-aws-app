const express = require("express");
const bcrypt = require("bcryptjs");
const { getConnection } = require("../lib/db");
const {
  validateRegisterInput,
  validateLoginInput,
} = require("../utils/validation");

const router = express.Router();

// POST /api/register
router.post("/register", async (req, res) => {
  try {
    const { cleaned, errors } = validateRegisterInput(req.body || {});

    if (errors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: errors[0],
        errors,
      });
    }

    const { firstname, lastname, email, username, password } = cleaned;

    const conn = await getConnection();

    try {
      const hash = await bcrypt.hash(password, 10);

      await conn.query(
        `INSERT INTO Users (email, username, first_name, last_name, password)
         VALUES (?, ?, ?, ?, ?)`,
        [email, username, firstname, lastname, hash]
      );

      req.session.user = { username, email };

      return res.status(201).json({
        status: "success",
        message: "User registered successfully.",
        user: { username, email },
      });
    } catch (err) {
      console.error("Register error:", err);
      const msg = String(err.message || "");

      if (msg.includes("Duplicate entry") && msg.includes("email")) {
        return res.status(409).json({
          status: "error",
          message: "Email is already in use.",
        });
      }
      if (msg.includes("Duplicate entry") && msg.includes("username")) {
        return res.status(409).json({
          status: "error",
          message: "Username is already taken.",
        });
      }

      return res.status(500).json({
        status: "error",
        message: "Failed to register user.",
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Register crash:", err);
    return res.status(500).json({
      status: "error",
      message: "Unexpected server error.",
    });
  }
});

// POST /api/login
router.post("/login", async (req, res) => {
  try {
    const { cleaned, errors } = validateLoginInput(req.body || {});
    if (errors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: errors[0],
        errors,
      });
    }

    const { identifier, password } = cleaned;
    const conn = await getConnection();

    try {
      const isEmail = identifier.includes("@");
      const field = isEmail ? "email" : "username";
      const lookupValue = isEmail ? identifier.toLowerCase() : identifier;

      const rows = await conn.query(
        `SELECT * FROM Users WHERE ${field} = ? LIMIT 1`,
        [lookupValue]
      );

      if (!rows || rows.length === 0) {
        return res.status(401).json({
          status: "error",
          message: "Invalid credentials.",
        });
      }

      const user = rows[0];

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({
          status: "error",
          message: "Invalid credentials.",
        });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };

      return res.json({
        status: "success",
        message: "Logged in successfully.",
        user: {
          username: user.username,
          email: user.email,
        },
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Login crash:", err);
    return res.status(500).json({
      status: "error",
      message: "Unexpected server error.",
    });
  }
});

// GET /api/session
router.get("/session", (req, res) => {
  if (req.session && req.session.user) {
    return res.json({
      status: "success",
      message: "Session active.",
      username: req.session.user.username,
      email: req.session.user.email,
    });
  }

  return res.json({
    status: "error",
    message: "Not logged in.",
  });
});

// POST /api/logout
router.post("/logout", (req, res) => {
  if (!req.session) {
    return res.json({ status: "success", message: "Already logged out." });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({
        status: "error",
        message: "Failed to log out.",
      });
    }

    res.clearCookie("connect.sid");
    return res.json({ status: "success", message: "Logged out." });
  });
});

module.exports = router;