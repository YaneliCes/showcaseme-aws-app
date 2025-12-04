const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const authRouter = require("./routes/auth");

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 3000;

const { testQuery } = require("./lib/db");

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
      maxAge: 1000 * 60 * 60 * 24,   // 1 day
    },
  })
);

// Auth routes (register, login, logout, session))
app.use("/api", authRouter);

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

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Backend running on port ${PORT}`)
);