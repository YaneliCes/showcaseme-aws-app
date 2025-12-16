const express = require("express");
const { getConnection } = require("../lib/db");
const requireAuth = require("../utils/requireAuth");

const router = express.Router();
router.use(requireAuth);

const ALLOWED_TYPES = new Set(["hard", "soft"]);

function cleanType(type) {
    const t = String(type || "").trim().toLowerCase();
    return ALLOWED_TYPES.has(t) ? t : null;
}


 // GET /api/profile/skills/catalog?type=hard
 // Returns dropdown options
router.get("/catalog", async (req, res) => {
    const type = cleanType(req.query.type);

    if (!type) {
        return res.status(400).json({ status: "error", message: "Invalid type." });
    }

    const conn = await getConnection();
    try {
        const rows = await conn.query(
            `SELECT id, name, type
            FROM Skills
            WHERE type = ?
            ORDER BY name ASC`,
            [type]
        );

        return res.json({ status: "success", skills: rows || [] });
    } catch (err) {
        console.error("GET /skills/catalog error:", err);
        return res.status(500).json({ status: "error", message: "Failed to load skills catalog." });
    } finally {
        conn.release();
    }
});

// GET /api/profile/skills?type=hard
// Returns user's saved skills
router.get("/", async (req, res) => {
    const userId = req.session.user.id;
    const type = cleanType(req.query.type);

    if (!type) {
        return res.status(400).json({ status: "error", message: "Invalid type." });
    }

    const conn = await getConnection();
    try {
        const rows = await conn.query(
            `SELECT s.id, s.name, s.type, us.proficiency
             FROM UserSkills us
             JOIN Skills s ON s.id = us.skill_id
             WHERE us.user_id = ? AND s.type = ?
             ORDER BY s.name ASC`,
            [userId, type]
        );

        return res.json({ status: "success", skills: rows || [] });
    } catch (err) {
        console.error("GET /skills error:", err);
        return res.status(500).json({ status: "error", message: "Failed to load user skills." });
    } finally {
        conn.release();
    }
});

// POST /api/profile/skills
// body: { skill_id: 12, proficiency: 3 }
router.post("/", async (req, res) => {
    const userId = req.session.user.id;
    const skillId = Number(req.body?.skill_id);
    const proficiency = req.body?.proficiency === null || req.body?.proficiency === undefined
        ? null
        : Number(req.body.proficiency);

    if (!Number.isFinite(skillId) || skillId <= 0) {
        return res.status(400).json({ status: "error", message: "Invalid skill_id." });
    }

    const conn = await getConnection();
    try {
        // Validate skill exists
        const rows = await conn.query(`SELECT id FROM Skills WHERE id = ? LIMIT 1`, [skillId]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Skill not found." });
        }

        // Insert
        await conn.query(
            `INSERT INTO UserSkills (user_id, skill_id, proficiency)
            VALUES (?, ?, ?)`,
            [userId, skillId, Number.isFinite(proficiency) ? proficiency : null]
        );

        return res.status(201).json({ status: "success" });
    } catch (err) {
        if (err && err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ status: "error", message: "Skill already added." });
        }
        console.error("POST /skills error:", err);
        return res.status(500).json({ status: "error", message: "Failed to add skill." });
    } finally {
        conn.release();
    }
});

// DELETE /api/profile/skills/:skillId
router.delete("/:skillId", async (req, res) => {
    const userId = req.session.user.id;
    const skillId = Number(req.params.skillId);

    if (!Number.isFinite(skillId) || skillId <= 0) {
        return res.status(400).json({ status: "error", message: "Invalid skill id." });
    }

    const conn = await getConnection();
    try {
        const result = await conn.query(
            `DELETE FROM UserSkills
            WHERE user_id = ? AND skill_id = ?`,
            [userId, skillId]
        );

        return res.json({ status: "success", deleted: result.affectedRows || 0 });
    } catch (err) {
        console.error("DELETE /skills error:", err);
        return res.status(500).json({ status: "error", message: "Failed to remove skill." });
    } finally {
        conn.release();
    }
});

module.exports = router;