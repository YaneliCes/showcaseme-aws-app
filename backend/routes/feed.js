const express = require("express");
const { getConnection } = require("../lib/db");
const requireAuth = require("../utils/requireAuth");

const router = express.Router();
router.use(requireAuth);

// GET /api/feed
// Includes public + private users.
// Private users show limited preview unless viewer is mutually connected (or self).
router.get("/", async (req, res) => {
    const viewerId = Number(req.session.user.id);
    const q = String(req.query.q || "").trim();
    const conn = await getConnection();

    try {
        const params = [];
        let where = `WHERE 1=1`;

        if (q) {
            const like = `%${q}%`;
            where += `
                AND (
                u.username LIKE ?
                OR COALESCE(up.title,'') LIKE ?
                OR COALESCE(up.city,'') LIKE ?
                OR COALESCE(up.state,'') LIKE ?
                OR COALESCE(up.country,'') LIKE ?
                OR COALESCE(i.name,'') LIKE ?
                )
            `;
        params.push(like, like, like, like, like, like);
        }

        // We compute relationship flags via LEFT JOINs:
        // vf: viewer follows target
        // tv: target follows viewer
        const rows = await conn.query(
            `SELECT
                u.id AS user_id,
                u.username, up.bio, up.title, up.city, up.state, up.country, up.privacy, up.tier, up.updated,

                i.name AS industry_name,

                COALESCE(pe.projects, 0) AS projects,
                COALESCE(pe.experiences, 0) AS experiences,
                COALESCE(pe.affiliations, 0) AS affiliations,
                COALESCE(us.hardSkills, 0) AS hardSkills,
                COALESCE(us.softSkills, 0) AS softSkills,

                CASE WHEN vf.user_id IS NULL THEN 0 ELSE 1 END AS viewer_following,
                CASE WHEN tv.user_id IS NULL THEN 0 ELSE 1 END AS viewer_followed_by

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
            ) pe ON pe.user_id = u.id

            LEFT JOIN (
                SELECT
                us.user_id,
                SUM(CASE WHEN s.type = 'hard' THEN 1 ELSE 0 END) AS hardSkills,
                SUM(CASE WHEN s.type = 'soft' THEN 1 ELSE 0 END) AS softSkills
                FROM UserSkills us
                JOIN Skills s ON s.id = us.skill_id
                GROUP BY us.user_id
            ) us ON us.user_id = u.id

            LEFT JOIN UserFavorites vf
                ON vf.user_id = ? AND vf.favorite_user_id = u.id

            LEFT JOIN UserFavorites tv
                ON tv.user_id = u.id AND tv.favorite_user_id = ?

                    ${where}
            ORDER BY
                (up.tier = 'premium') DESC,
                CASE WHEN up.tier = 'premium' THEN RAND() ELSE NULL END,
                up.updated DESC,
                u.username ASC`,
            [viewerId, viewerId, ...params]
        );

        // Now redact private users if not connected (and not self)
        const safe = (rows || []).map((r) => {
        const isSelf = Number(r.user_id) === viewerId;
        const following = Number(r.viewer_following) === 1;
        const followedBy = Number(r.viewer_followed_by) === 1;
        const connected = following && followedBy;

            const base = {
                user_id: r.user_id,
                username: r.username,
                privacy: r.privacy,
                tier: r.tier,
                updated: r.updated,
                following,
                followedBy,
                connection: connected,
            };

            // Public OR connected OR self => full preview
            if (r.privacy === "public" || connected || isSelf) {
                return {
                ...base,
                bio: r.bio,
                title: r.title,
                city: r.city,
                state: r.state,
                country: r.country,
                industry_name: r.industry_name,
                projects: r.projects,
                experiences: r.experiences,
                affiliations: r.affiliations,
                hardSkills: r.hardSkills,
                softSkills: r.softSkills,
                canViewPortfolio: true,
                };
            }

            // Private + not connected => redacted preview
            return {
                ...base,
                bio: null,
                title: null,
                city: null,
                state: null,
                country: null,
                industry_name: null,
                projects: null,
                experiences: null,
                affiliations: null,
                hardSkills: null,
                softSkills: null,
                canViewPortfolio: false,
            };
        });

        return res.json({ status: "success", users: safe });
    } catch (err) {
            console.error("GET /api/feed error:", err);
            return res.status(500).json({ status: "error", message: "Failed to load feed." });
    } finally {
            conn.release();
    }
});

module.exports = router;