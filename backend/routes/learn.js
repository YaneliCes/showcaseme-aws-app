const express = require("express");
const { getConnection } = require("../lib/db");
const requireAuth = require("../utils/requireAuth");

const router = express.Router();
router.use(requireAuth);

// GET /api/learn/industries
// Returns all industries for the dropdown
router.get("/industries", async (req, res) => {
    const conn = await getConnection();
    try {
        const rows = await conn.query(
            `SELECT id, name
            FROM Industries
            ORDER BY name ASC`
        );

        return res.json({ status: "success", industries: rows || [] });
    } catch (err) {
        console.error("GET /api/learn/industries error:", err);
        return res.status(500).json({ status: "error", message: "Failed to load industries." });
    } finally {
        conn.release();
    }
});

// GET /api/learn
// Query: ?industryId=INT (required), optional ?q=searchText
// Returns courses/resources for that industry
router.get("/", async (req, res) => {
    const industryId = Number(req.query.industryId || 0);
    const q = String(req.query.q || "").trim();

    if (!industryId) {
        return res.status(400).json({ status: "error", message: "Missing industryId." });
    }

    const conn = await getConnection();
    try {
        const params = [industryId];
        let where = `WHERE ci.industry_id = ?`;

        if (q) {
            const like = `%${q}%`;
            where += 
                `AND (
                    c.title LIKE ?
                    OR c.provider LIKE ?
                    OR c.description LIKE ?
                    OR c.url LIKE ?
                )`;
            params.push(like, like, like, like);
        }

        const rows = await conn.query(
            `SELECT c.id, c.title, c.provider, c.url, c.description
            FROM Courses c
            JOIN CourseIndustries ci
                ON ci.course_id = c.id
            ${where}
            ORDER BY c.title ASC`,
            params
        );

        return res.json({ status: "success", resources: rows || [] });
    } catch (err) {
        console.error("GET /api/learn error:", err);
        return res.status(500).json({ status: "error", message: "Failed to load resources." });
    } finally {
        conn.release();
    }
});

module.exports = router;