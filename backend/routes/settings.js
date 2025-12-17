const express = require("express");
const bcrypt = require("bcryptjs");
const { getConnection } = require("../lib/db");
const requireAuth = require("../utils/requireAuth");

const router = express.Router();
router.use(requireAuth);

// helpers
const clean = (v) => String(v || "").trim();
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

router.put("/account", async (req, res) => {
    const userId = req.session.user?.id;
    if (!userId) {
        return res.status(401).json({ status: "error", message: "Not logged in." });
    }

    const username = clean(req.body.username);
    const email = clean(req.body.email).toLowerCase();

    const currentPassword = req.body.currentPassword ? String(req.body.currentPassword) : null;
    const newPassword = req.body.newPassword ? String(req.body.newPassword) : null;

    const privacy = clean(req.body.privacy);
    const tier = clean(req.body.tier);

    // basic validation
    if (username.length < 3 || username.length > 30) {
        return res.status(400).json({
            status: "error",
            message: "Username must be 3–30 characters.",
        });
    }

    if (!isEmail(email) || email.length > 100) {
        return res.status(400).json({ status: "error", message: "Invalid email address." });
    }

    if (!["public", "private"].includes(privacy)) {
        return res.status(400).json({ status: "error", message: "Invalid privacy value." });
    }

    if (!["free", "premium"].includes(tier)) {
        return res.status(400).json({ status: "error", message: "Invalid tier value." });
    }

    if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
        return res.status(400).json({
            status: "error",
            message: "To change password, provide both currentPassword and newPassword.",
        });
    }

    if (newPassword && newPassword.length < 8) {
        return res.status(400).json({
            status: "error",
            message: "New password must be at least 8 characters.",
        });
    }

    const conn = await getConnection();

    try {
        await conn.beginTransaction();

        // if password change requested, verify current password
        if (currentPassword && newPassword) {
            const urows = await conn.query(
                `SELECT password FROM Users WHERE id = ? LIMIT 1`,
                [userId]
            );

            if (!urows || urows.length === 0) {
                await conn.rollback();
                return res.status(404).json({ status: "error", message: "User not found." });
            }

            const ok = await bcrypt.compare(currentPassword, urows[0].password);
            if (!ok) {
                await conn.rollback();
                return res.status(400).json({
                    status: "error",
                    message: "Current password is incorrect.",
                });
            }

            const newHash = await bcrypt.hash(newPassword, 10);
            await conn.query(`UPDATE Users SET password = ? WHERE id = ?`, [newHash, userId]);
        }

        // update username/email
        await conn.query(
            `UPDATE Users SET username = ?, email = ? WHERE id = ?`,
            [username, email, userId]
        );

        // update privacy/tier
        await conn.query(
            `UPDATE UserProfiles SET privacy = ?, tier = ? WHERE user_id = ?`,
            [privacy, tier, userId]
        );

        await conn.commit();

        // IMPORTANT: keep session in sync so /api/session shows new values
        req.session.user.username = username;
        req.session.user.email = email;

        return res.json({ status: "success" });
    } catch (err) {
        await conn.rollback();

        // handle unique constraints nicely
        if (err && (err.code === "ER_DUP_ENTRY" || err.errno === 1062)) {
            const msg = String(err.sqlMessage || "");
            if (msg.includes("Users.username")) {
                return res.status(409).json({
                    status: "error",
                    message: "Username already taken.",
                });
            }
            if (msg.includes("Users.email")) {
                return res.status(409).json({
                    status: "error",
                    message: "Email already in use.",
                });
            }
            return res.status(409).json({ status: "error", message: "Duplicate value." });
        }

        console.error("PUT /api/settings/account error:", err);
        return res.status(500).json({ status: "error", message: "Failed to update settings." });
    } finally {
        conn.release();
    }
});

module.exports = router;