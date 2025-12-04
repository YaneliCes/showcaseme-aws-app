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
  console.log("=== /api/login HIT ===");
  console.log("Raw body:", req.body);

  try {
    const { cleaned, errors } = validateLoginInput(req.body || {});
    console.log("Cleaned login input:", cleaned, "Errors:", errors);

    if (errors.length > 0) {
      console.log("Validation failed:", errors);
      return res.status(400).json({
        status: "error",
        message: errors[0],
        errors,
      });
    }

    const { identifier, password } = cleaned;
    console.log("Using identifier:", identifier);

    const conn = await getConnection();
    console.log("Got DB connection");

    try {
      const isEmail = identifier.includes("@");
      const field = isEmail ? "email" : "username";
      const lookupValue = isEmail ? identifier.toLowerCase() : identifier;

      console.log("Login lookup field:", field, "value:", lookupValue);

      const rows = await conn.query(
        `SELECT * FROM Users WHERE ${field} = ? LIMIT 1`,
        [lookupValue]
      );

      console.log("DB rows:", rows);

      if (!rows || rows.length === 0) {
        console.log("No user found for", lookupValue);
        return res.status(401).json({
          status: "error",
          message: "Invalid credentials.",
        });
      }

      const user = rows[0];
      console.log("User row:", {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordLen: user.password && user.password.length
      });

      const match = await bcrypt.compare(password, user.password);
      console.log("Password match result:", match);

      if (!match) {
        console.log("Password mismatch for user", user.username);
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
      console.log("Session set for user:", req.session.user);

      return res.json({
        status: "success",
        message: "Logged in successfully.",
        user: {
          username: user.username,
          email: user.email,
        },
      });
    } finally {
      console.log("Releasing DB connection");
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