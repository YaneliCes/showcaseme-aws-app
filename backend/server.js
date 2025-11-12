const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Enable CORS and load env
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/healthz", (req, res) => res.send("OK"));

// Simple API route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express backend!" });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
