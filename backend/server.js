const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const entriesRouter = require("./routes/entries");
const skillsRouter = require("./routes/skills");
const feedRouter = require("./routes/feed");
const publicPortfolioRouter = require("./routes/publicPortfolio");

dotenv.config();

const app = express();

app.set("json replacer", (key, value) => {
  if (typeof value === "bigint") return Number(value);
  return value;
});

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

// Profile routes (edit profile, projects, experience, etc.)
app.use("/api/profile", profileRouter);

// Entry routes (edit portoflio - projects, experience, affiliations)
app.use("/api/profile/entries", entriesRouter);

// Skills route (hard and soft skills)
app.use("/api/profile/skills", skillsRouter);

// Feed route (grab public users)
app.use("/api/feed", feedRouter);
app.use("/api/public/portfolio", publicPortfolioRouter);


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