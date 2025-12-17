const express = require("express");
const { getConnection } = require("../lib/db");
const requireAuth = require("../utils/requireAuth");

const router = express.Router();
router.use(requireAuth);

async function getPendingCount(conn, viewerId) {
    const rows = await conn.query(
        `SELECT COUNT(*) AS c
        FROM UserFavorites incoming
        WHERE incoming.favorite_user_id = ?
            AND NOT EXISTS (
                SELECT 1
                FROM UserFavorites outgoing
                WHERE outgoing.user_id = ?
                AND outgoing.favorite_user_id = incoming.user_id
                LIMIT 1
            )
        `,
        [viewerId, viewerId]
    );

    return Number(rows?.[0]?.c || 0);
}

// GET /api/network
// Optional: ?q=searchText
// Returns users you follow, plus pendingCount
// Includes private profiles only if they follow you back (mutual)
router.get("/", async (req, res) => {
    const viewerId = req.session.user.id;
    const q = String(req.query.q || "").trim();

    const conn = await getConnection();
    try {
        // IMPORTANT:
        // The first "?" appears in the SELECT (followedBy CASE),
        // then the next two "?" appear in the WHERE clause.
        const params = [viewerId, viewerId, viewerId];

        let where = 
        `WHERE f.user_id = ?
            AND (
                up.privacy = 'public'
                OR EXISTS (
                    SELECT 1
                    FROM UserFavorites f2
                    WHERE f2.user_id = u.id
                        AND f2.favorite_user_id = ?
                    LIMIT 1
                )
            )
        `;

        if (q) {
            const like = `%${q}%`;
            where += 
            `AND (
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
            `SELECT
                u.id AS user_id, u.username,
                up.bio, up.title, up.city, up.state, up.country, up.privacy, up.tier, up.updated,
                i.name AS industry_name,
                COALESCE(pe.projects, 0) AS projects,
                COALESCE(pe.experiences, 0) AS experiences,
                COALESCE(pe.affiliations, 0) AS affiliations,
                COALESCE(us.hardSkills, 0) AS hardSkills,
                COALESCE(us.softSkills, 0) AS softSkills,

                1 AS following,
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM UserFavorites f2
                        WHERE f2.user_id = u.id
                          AND f2.favorite_user_id = ?
                        LIMIT 1
                    ) THEN 1 ELSE 0
                END AS followedBy
            FROM UserFavorites f
            JOIN Users u ON u.id = f.favorite_user_id
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

        const pendingCount = await getPendingCount(conn, viewerId);

        return res.json({
            status: "success",
            users: rows || [],
            pendingCount
        });
    } catch (err) {
        console.error("GET /api/network error:", err);
        return res.status(500).json({ status: "error", message: "Failed to load network." });
    } finally {
        conn.release();
    }
});

// GET /api/network/pending
// Optional: ?q=searchText
// Returns users who follow you but you do NOT follow back, plus pendingCount
router.get("/pending", async (req, res) => {
    const viewerId = req.session.user.id;
    const q = String(req.query.q || "").trim();

    const conn = await getConnection();
    try {
        const params = [viewerId, viewerId, viewerId];
        let where = 
            `WHERE incoming.favorite_user_id = ?
                AND NOT EXISTS (
                        SELECT 1
                        FROM UserFavorites outgoing
                        WHERE outgoing.user_id = ?
                        AND outgoing.favorite_user_id = incoming.user_id
                        LIMIT 1
                )
            `;
        if (q) {
            const like = `%${q}%`;
            where += 
                `AND (
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
            `
            SELECT
                u.id AS user_id,u.username,
                up.bio, up.title, up.city, up.state, up.country, up.privacy, up.tier, up.updated,
                i.name AS industry_name,
                COALESCE(pe.projects, 0) AS projects,
                COALESCE(pe.experiences, 0) AS experiences,
                COALESCE(pe.affiliations, 0) AS affiliations,
                COALESCE(us.hardSkills, 0) AS hardSkills,
                COALESCE(us.softSkills, 0) AS softSkills,

                0 AS following,
                1 AS followedBy
            FROM UserFavorites incoming
            JOIN Users u
                ON u.id = incoming.user_id
            JOIN UserProfiles up
                ON up.user_id = u.id
            LEFT JOIN Industries i
                ON i.id = up.industry_id

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

        const pendingCount = await getPendingCount(conn, viewerId);

        return res.json({
            status: "success",
            users: rows || [],
            pendingCount
        });
    } catch (err) {
        console.error("GET /api/network/pending error:", err);
        return res.status(500).json({ status: "error", message: "Failed to load pending list." });
    } finally {
        conn.release();
    }
});

module.exports = router;