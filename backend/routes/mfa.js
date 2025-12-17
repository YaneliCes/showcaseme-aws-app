const express = require("express");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const requireAuth = require("../utils/requireAuth");
const { getConnection } = require("../lib/db");

const router = express.Router();
router.use(requireAuth);

// GET /api/mfa/status
router.get("/status", async (req, res) => {
    const userId = Number(req.session.user.id);
    const conn = await getConnection();

    try {
        const rows = await conn.query(
            `SELECT mfa_enabled FROM Users WHERE id = ? LIMIT 1`,
            [userId]
        );

        const enabled = Number(rows?.[0]?.mfa_enabled || 0) === 1;

        return res.json({
            status: "success",
            enabled
        });
    } catch (err) {
        console.error("GET /api/mfa/status error:", err);
        return res.status(500).json({ status: "error", message: "Failed to load MFA status." });
    } finally {
        conn.release();
    }
});

// POST /api/mfa/setup
// Generates a new secret and returns QR + secret
router.post("/setup", async (req, res) => {
    const userId = Number(req.session.user.id);
    const username = String(req.session.user.username || "user");
    const conn = await getConnection();

    try {
        const secret = speakeasy.generateSecret({
            name: `ShowcaseMe (${username})`,
        });

        await conn.query(
            `UPDATE Users SET mfa_secret = ?, mfa_enabled = 0 WHERE id = ?`,
            [secret.base32, userId]
        );

        const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

        return res.json({
            status: "success",
            secret: secret.base32,
            otpauth_url: secret.otpauth_url,
            qr: qrDataUrl
        });
    } catch (err) {
        console.error("POST /api/mfa/setup error:", err);
        return res.status(500).json({ status: "error", message: "Failed to start MFA setup." });
    } finally {
        conn.release();
    }
});

// POST /api/mfa/verify-setup
// Verifies code and enables MFA
router.post("/verify-setup", async (req, res) => {
    const userId = Number(req.session.user.id);
    const code = String(req.body.code || "").trim();
    const conn = await getConnection();

    try {
        const rows = await conn.query(
            `SELECT mfa_secret FROM Users WHERE id = ? LIMIT 1`,
            [userId]
        );

        const secret = rows?.[0]?.mfa_secret;
        if (!secret) {
            return res.status(400).json({ status: "error", message: "No MFA secret found. Start setup again." });
        }

        const ok = speakeasy.totp.verify({
            secret,
            encoding: "base32",
            token: code,
            window: 1
        });

        if (!ok) {
            return res.status(400).json({ status: "error", message: "Invalid code." });
        }

        await conn.query(`UPDATE Users SET mfa_enabled = 1 WHERE id = ?`, [userId]);

        return res.json({ status: "success" });
    } catch (err) {
        console.error("POST /api/mfa/verify-setup error:", err);
        return res.status(500).json({ status: "error", message: "Failed to verify MFA." });
    } finally {
        conn.release();
    }
});

// POST /api/mfa/disable
router.post("/disable", async (req, res) => {
    const userId = Number(req.session.user.id);
    const conn = await getConnection();

    try {
        await conn.query(
            `UPDATE Users SET mfa_enabled = 0, mfa_secret = NULL WHERE id = ?`,
            [userId]
        );

        return res.json({ status: "success" });
    } catch (err) {
        console.error("POST /api/mfa/disable error:", err);
        return res.status(500).json({ status: "error", message: "Failed to disable MFA." });
    } finally {
        conn.release();
    }
});

module.exports = router;