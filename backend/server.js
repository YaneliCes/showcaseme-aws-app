const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Enable CORS and load env
dotenv.config();
const app = express();
const PORT = process.env.APP_PORT || 3000;

// Import DB helper
const { testQuery } = require("./lib/db");

app.use(cors());
app.use(express.json());

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

app.listen(PORT, "0.0.0.0", () => console.log(`Backend running on port ${PORT}`));