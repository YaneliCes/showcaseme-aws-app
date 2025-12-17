const express = require("express");
const bcrypt = require("bcryptjs");
const { getConnection } = require("../lib/db");
const { logActivity } = require("../utils/activityLogger");
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

            const result = await conn.query(
                `INSERT INTO Users (email, username, first_name, last_name, password)
                VALUES (?, ?, ?, ?, ?)`,
                [email, username, firstname, lastname, hash]
            );

            const userId = Number(result.insertId);
            req.session.user = { id: userId, username, email };

            await logActivity(req, {
                eventType: "register",
                route: "/api/register",
                metadata: { username, email },
            });

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

            // Only select what we need (and includes MFA fields)
            const rows = await conn.query(
                `SELECT id, email, username, password, mfa_enabled, mfa_secret
                FROM Users
                WHERE ${field} = ?
                LIMIT 1`,
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

            const userId = Number(user.id);
            const mfaEnabled = Number(user.mfa_enabled) === 1;

            // If MFA is enabled, do NOT fully log in yet
            if (mfaEnabled) {
                req.session.mfa_pending = {
                    id: userId,
                    username: user.username,
                    email: user.email
                };

                return res.json({
                    status: "mfa_required",
                    message: "MFA required."
                });
            }

            // Normal login success (no MFA)
            req.session.user = {
                id: userId,
                username: user.username,
                email: user.email,
            };

            await logActivity(req, {
                eventType: "login",
                route: "/api/login",
                metadata: {
                    id: userId,
                    username: user.username,
                    email: user.email,
                },
            });

            return res.json({
                status: "success",
                message: "Logged in successfully.",
                user: {
                    id: userId,
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

// POST /api/login/mfa
const speakeasy = require("speakeasy");
router.post("/login/mfa", async (req, res) => {
    try {
        const code = String(req.body.code || "").trim();

        if (!code) {
            return res.status(400).json({ status: "error", message: "Code is required." });
        }

        if (!req.session || !req.session.mfa_pending) {
            return res.status(400).json({ status: "error", message: "No MFA login in progress." });
        }

        const pending = req.session.mfa_pending;
        const userId = Number(pending.id);

        const conn = await getConnection();
        try {
            const rows = await conn.query(
                `SELECT id, email, username, mfa_enabled, mfa_secret
                FROM Users
                WHERE id = ?
                LIMIT 1`,
                [userId]
            );

            const user = rows?.[0];
            if (!user) {
                return res.status(401).json({ status: "error", message: "Invalid session." });
            }

            if (Number(user.mfa_enabled) !== 1 || !user.mfa_secret) {
                return res.status(400).json({ status: "error", message: "MFA not enabled for this account." });
            }

            const ok = speakeasy.totp.verify({
                secret: user.mfa_secret,
                encoding: "base32",
                token: code,
                window: 1
            });

            if (!ok) {
                return res.status(401).json({ status: "error", message: "Invalid MFA code." });
            }

            // Finalize login
            req.session.user = {
                id: Number(user.id),
                username: user.username,
                email: user.email
            };

            // Clear pending state
            delete req.session.mfa_pending;

            await logActivity(req, {
                eventType: "login_mfa",
                route: "/api/login/mfa",
                metadata: {
                    id: Number(user.id),
                    username: user.username,
                    email: user.email,
                },
            });

            return res.json({
                status: "success",
                message: "MFA verified.",
                user: {
                    id: Number(user.id),
                    username: user.username,
                    email: user.email
                }
            });
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error("Login MFA crash:", err);
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
            id: req.session.user.id,
            username: req.session.user.username,
            email: req.session.user.email,
        });
    }

    return res.status(401).json({
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

        logActivity(req, {
            eventType: "logout",
            route: "/api/logout",
        });

        res.clearCookie("connect.sid");
        return res.json({ status: "success", message: "Logged out." });
    });
});

// POST /api/track-page
router.post("/track-page", async (req, res) => {
  try {
        const { path } = req.body || {};

        await logActivity(req, {
            eventType: "page_view",
            route: path || req.originalUrl,
        });

        return res.json({ status: "ok" });
    } catch (err) {
        console.error("Page tracking error:", err);
        return res.status(500).json({ status: "error" });
    }
});


module.exports = router;