const express = require("express");
const { getConnection } = require("../lib/db");

const router = express.Router();

// GET /api/feed
// Returns ONLY public users with preview info + counts
router.get("/", async (req, res) => {
    const q = String(req.query.q || "").trim();
    const conn = await getConnection();

    try {
        const params = [];
        let where = `WHERE up.privacy = 'public'`;

        if (q) {
            const like = `%${q}%`;
            where += `
                AND (
                    u.username LIKE ?
                    OR up.title LIKE ?
                    OR up.city LIKE ?
                    OR up.state LIKE ?
                    OR up.country LIKE ?
                    OR i.name LIKE ?
                )
            `;
            params.push(like, like, like, like, like, like);
        }

        const rows = await conn.query(
            `SELECT u.id AS user_id, u.username, up.bio, up.title, up.city, 
            up.state, up.country, up.privacy, up.tier, up.updated,
            i.name AS industry_name,
            COALESCE(pe.projects, 0) AS projects,
            COALESCE(pe.experiences, 0) AS experiences,
            COALESCE(pe.affiliations, 0) AS affiliations,
            COALESCE(us.hardSkills, 0) AS hardSkills,
            COALESCE(us.softSkills, 0) AS softSkills
            FROM Users u
            JOIN UserProfiles up ON up.user_id = u.id
            LEFT JOIN Industries i ON i.id = up.industry_id

            LEFT JOIN (
                SELECT
                    user_id,
                    SUM(CASE WHEN type = 'project' THEN 1 ELSE 0 END) AS projects,
                    SUM(CASE WHEN type = 'job' THEN 1 ELSE 0 END) AS experiences,
                    SUM(CASE WHEN type = 'affiliation' THEN 1 ELSE 0 END) AS affiliations
                FROM PortfolioEntries
                GROUP BY user_id
            ) pe
                ON pe.user_id = u.id

            LEFT JOIN (
                SELECT
                    us.user_id,
                    SUM(CASE WHEN s.type = 'hard' THEN 1 ELSE 0 END) AS hardSkills,
                    SUM(CASE WHEN s.type = 'soft' THEN 1 ELSE 0 END) AS softSkills
                FROM UserSkills us
                JOIN Skills s ON s.id = us.skill_id
                GROUP BY us.user_id
            ) us
                ON us.user_id = u.id

            ${where}
            ORDER BY up.updated DESC, u.username ASC
            `,
            params
        );

        return res.json({ status: "success", users: rows || [] });
    } catch (err) {
        console.error("GET /api/feed error:", err);
        return res.status(500).json({ status: "error", message: "Failed to load feed." });
    } finally {
        conn.release();
    }
});

module.exports = router;