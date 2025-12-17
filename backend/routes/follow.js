const express = require("express");
const { getConnection } = require("../lib/db");
const requireAuth = require("../utils/requireAuth");

const router = express.Router();
router.use(requireAuth);

// Helper: find target user by username (and their privacy)
async function getTargetByUsername(conn, username) {
    const rows = await conn.query(
        `SELECT u.id AS user_id, u.username, up.privacy
        FROM Users u
        JOIN UserProfiles up ON up.user_id = u.id
        WHERE u.username = ?
        LIMIT 1`,
        [username]
    );
    return rows && rows.length ? rows[0] : null;
}

// GET /api/follow/:username
// Returns follow status + counts between viewer and target user
router.get("/:username", async (req, res) => {
    const viewerId = req.session.user.id;
    const username = String(req.params.username || "").trim();

    if (!username) {
        return res.status(400).json({ status: "error", message: "Missing username." });
    }

    const conn = await getConnection();
    try {
        const target = await getTargetByUsername(conn, username);

        if (!target) {
            return res.status(404).json({ status: "error", message: "User not found." });
        }

        // // Optional: block meta for private users unless it's self
        // if (target.privacy !== "public" && Number(target.user_id) !== Number(viewerId)) {
        //     return res.status(403).json({ status: "error", message: "This profile is private." });
        // }

        const targetId = Number(target.user_id);

        // viewer -> target
        const followingRows = await conn.query(
            `SELECT 1 FROM UserFavorites WHERE user_id = ? AND favorite_user_id = ? LIMIT 1`,
            [viewerId, targetId]
        );

        // target -> viewer
        const followedByRows = await conn.query(
            `SELECT 1 FROM UserFavorites WHERE user_id = ? AND favorite_user_id = ? LIMIT 1`,
            [targetId, viewerId]
        );

        const followersCountRows = await conn.query(
            `SELECT COUNT(*) AS c FROM UserFavorites WHERE favorite_user_id = ?`,
            [targetId]
        );

        const followingCountRows = await conn.query(
            `SELECT COUNT(*) AS c FROM UserFavorites WHERE user_id = ?`,
            [targetId]
        );

        const following = !!(followingRows && followingRows.length);
        const followedBy = !!(followedByRows && followedByRows.length);

        return res.json({
            status: "success",
            meta: {
                target_user_id: targetId,
                following,
                followedBy,
                connection: following && followedBy,
                counts: {
                    followers: Number(followersCountRows?.[0]?.c || 0),
                    following: Number(followingCountRows?.[0]?.c || 0),
                },
            },
        });
    } catch (err) {
        console.error("GET /api/follow/:username error:", err);
        return res.status(500).json({ status: "error", message: "Failed to load follow status." });
    } finally {
        conn.release();
    }
});

// POST /api/follow/:username
// viewer follows target
router.post("/:username", async (req, res) => {
    const viewerId = req.session.user.id;
    const username = String(req.params.username || "").trim();

    if (!username) {
        return res.status(400).json({ status: "error", message: "Missing username." });
    }

    const conn = await getConnection();
    try {
        const target = await getTargetByUsername(conn, username);

        if (!target) {
            return res.status(404).json({ status: "error", message: "User not found." });
        }

        const targetId = Number(target.user_id);

        if (Number(targetId) === Number(viewerId)) {
            return res.status(400).json({ status: "error", message: "You can't follow yourself." });
        }

        // Insert (idempotent)
        await conn.query(
            `INSERT INTO UserFavorites (user_id, favorite_user_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE created = created`,
            [viewerId, targetId]
        );

        return res.status(201).json({ status: "success" });
    } catch (err) {
        console.error("POST /api/follow/:username error:", err);
        return res.status(500).json({ status: "error", message: "Failed to follow user." });
    } finally {
        conn.release();
    }
});

// DELETE /api/follow/:username
// viewer unfollows target
router.delete("/:username", async (req, res) => {
    const viewerId = req.session.user.id;
    const username = String(req.params.username || "").trim();

    if (!username) {
        return res.status(400).json({ status: "error", message: "Missing username." });
    }

    const conn = await getConnection();
    try {
        const target = await getTargetByUsername(conn, username);

        if (!target) {
            return res.status(404).json({ status: "error", message: "User not found." });
        }

        const targetId = Number(target.user_id);

        if (Number(targetId) === Number(viewerId)) {
            return res.status(400).json({ status: "error", message: "You can't unfollow yourself." });
        }

        const result = await conn.query(
            `DELETE FROM UserFavorites WHERE user_id = ? AND favorite_user_id = ?`,
            [viewerId, targetId]
        );

        return res.json({ status: "success", deleted: Number(result?.affectedRows || 0) });
    } catch (err) {
        console.error("DELETE /api/follow/:username error:", err);
        return res.status(500).json({ status: "error", message: "Failed to unfollow user." });
    } finally {
        conn.release();
    }
});

module.exports = router;