const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const session = require("express-session");

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 3000;

const { testQuery, getConnection } = require("./lib/db");

// CORS
app.use(
  cors({
    origin: true,        // reflect the request origin
    credentials: true,   // allow cookies
  })
);

// JSON body parsing
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Health check
app.get("/healthz", (req, res) => res.send("OK"));

// Simple API route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express backend!" });
});

// DB test route
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await testQuery();
    res.json({ ok: true, result });
  } catch (err) {
    console.error("DB test error:", err);
    res.status(500).json({ ok: false, error: "DB connection failed" });
  }
});

// Register route
app.post("/api/register", async (req, res) => {
  try {
    const { firstname, lastname, email, username, password } = req.body || {};

    if (!firstname || !lastname || !email || !username || !password) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required.",
      });
    }

    const conn = await getConnection();

    try {
      const hash = await bcrypt.hash(password, 10);

      await conn.query(
        `INSERT INTO Users (email, username, first_name, last_name, password)
         VALUES (?, ?, ?, ?, ?)`,
        [email, username, firstname, lastname, hash]
      );

      // optional: auto-login after register
      req.session.user = {
        username,
        email,
      };

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

// Login route (creates session)
app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    // identifier can be username OR email

    if (!identifier || !password) {
      return res.status(400).json({
        status: "error",
        message: "Identifier and password are required.",
      });
    }

    const conn = await getConnection();

    try {
      // Decide if identifier is email or username
      const isEmail = identifier.includes("@");
      const field = isEmail ? "email" : "username";

      const rows = await conn.query(
        `SELECT * FROM Users WHERE ${field} = ? LIMIT 1`,
        [identifier]
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

      // Save minimal info in session
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

// Session route (check if logged in)
app.get("/api/session", (req, res) => {
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

// Logout route (destroy session)
app.post("/api/logout", (req, res) => {
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

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Backend running on port ${PORT}`)
);