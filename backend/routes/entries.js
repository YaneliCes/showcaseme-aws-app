const express = require("express");
const { getConnection } = require("../lib/db");
const { logActivity } = require("../utils/activityLogger");
const requireAuth = require("../utils/requireAuth");

const router = express.Router();
router.use(requireAuth);

const ALLOWED_TYPES = new Set(["project", "job", "affiliation", "education"]);

function cleanType(type) {
    const t = String(type || "").trim().toLowerCase();
    return ALLOWED_TYPES.has(t) ? t : null;
}

// GET /api/profile/entries?type=project
router.get("/", async (req, res) => {
    const userId = req.session.user.id;
    const entryType = cleanType(req.query.type);

    if (!entryType) {
        return res.status(400).json({
            status: "error",
            message: "Invalid entry type.",
        })
    }

    const conn = await getConnection();

    try {
        const rows = await conn.query (
            `SELECT id, type, title, organization, start_date, end_date, is_current, 
            details, url, display_order, created, updated
            FROM PortfolioEntries
            WHERE user_id = ? AND type = ?
            ORDER BY display_order ASC, updated DESC`,
            [userId, entryType]
        );

        return res.json ({
            status: "success",
            entries: rows || [],
        });
    } catch (err) {
        console.error("GET /entries error:", err);
        return res.status(500).json({
            status: "error",
            message: "Failed to load entries."
        });
    } finally {
        conn.release();
    }
});

// POST /api/profile/entries
router.post("/", async (req, res) => {
    const userId = req.session.user.id;
    const {
        type, 
        title, 
        organization = null, 
        start_date = null,
        end_date = null,
        is_current = 0,
        details = null,
        url = null,
        display_order = 0,
    } = req.body || {};

    const entryType = cleanType(type)
    if (!entryType) {
        return res.status(400).json({
            status: "error",
            message: "Invalid type.",
        });
    }

    if (!title || !String(title).trim()) {
        return res.status(400).json({
            status: "Error",
            message: "Title is required.",
        });
    }

    const conn = await getConnection();
    try {
        const result = await conn.query (
            `INSERT INTO PortfolioEntries
            (user_id, type, title, organization, start_date, end_date, is_current, details, url, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, entryType, 
            String(title).trim(), organization ? String(organization).trim() : null, 
            start_date || null, end_date || null, is_current ? 1 : 0, 
            details ? String(details) : null, url? String(url).trim() : null, 
            Number(display_order) || 0]
        );

        await logActivity(req, {
            eventType: "portfolio_entry_create",
            route: "/api/profile/entries",
            metadata: { type: entryType },
        });

        return res.status(201).json({
            status: "success",
            id: Number(result.insertId),
        });
    } catch (err) {
        console.error("POST /entries error:", err);
        return res.status(500).json({
            status: "error",
            message: "Failed to create entry.",
        });
    } finally {
        conn.release();
    }
});

// PUT /api/profile/entries/:id
router.put("/:id", async (req, res) => {
    const userId = req.session.user.id;
    const entryId = Number(req.params.id);

    if (!Number.isFinite(entryId)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid id.",
        });
    }

    const {
        title,
        organization = null,
        start_date = null,
        end_date = null,
        is_current = 0,
        details = null,
        url = null,
        display_order = 0,
    } = req.body || {};

    if (!title || !String(title).trim()) {
        return res.status(400).json({
            status: "error",
            message: "Title is required.",
        });
    }

    const conn = await getConnection();
    try {
        const rows = await conn.query(
            `SELECT id
            FROM PortfolioEntries
            WHERE id = ? AND user_id = ?
            LIMIT 1`,
            [entryId, userId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Entry not found.",
            });
        }

        await conn.query(
            `UPDATE PortfolioEntries
            SET title = ?, organization = ?, start_date = ?, end_date = ?, is_current = ?, details = ?, url = ?, display_order = ?
            WHERE id = ? AND user_id = ?`,
            [
                String(title).trim(),
                organization ? String(organization).trim() : null,
                start_date || null,
                end_date || null,
                is_current ? 1 : 0,
                details ? String(details) : null,
                url ? String(url).trim() : null,
                Number(display_order) || 0,
                entryId,
                userId,
            ]
        );

        await logActivity(req, {
            eventType: "portfolio_entry_update",
            route: "/api/profile/entries/:id",
            metadata: { id: entryId },
        });

        return res.json({ status: "success" });
    } catch (err) {
        console.error("PUT /entries/:id error:", err);
        return res.status(500).json({
            status: "error",
            message: "Failed to update entry.",
        });
    } finally {
        conn.release();
    }
});

// DELETE /api/profile/entries/:id
router.delete("/:id", async (req, res) => {
    const userId = req.session.user.id;
    const entryId = Number(req.params.id);

    if (!Number.isFinite(entryId)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid id.",
        });
    }

    const conn = await getConnection();
    try {
        const result = await conn.query(
            `DELETE FROM PortfolioEntries
            WHERE id = ? AND user_id = ?`,
            [entryId, userId]
        );

        await logActivity(req, {
            eventType: "portfolio_entry_delete",
            route: "/api/profile/entries/:id",
            metadata: { id: entryId },
        });

        return res.json({
            status: "success",
            deleted: result.affectedRows || 0,
        });
    } catch (err) {
        console.error("DELETE /entries/:id error:", err);
        return res.status(500).json({
            status: "error",
            message: "Failed to delete entry.",
        });
    } finally {
        conn.release();
    }
});

module.exports = router;