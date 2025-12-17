const express = require("express");
const { getConnection } = require("../lib/db");

const router = express.Router();

// GET /api/public/portfolio/:username
// Returns portfolio data if:
// - target is public, OR
// - viewer is the same user, OR
// - target is private but viewer has a mutual connection with target
router.get("/:username", async (req, res) => {
    const username = String(req.params.username || "").trim();
    if (!username) {
        return res.status(400).json({ status: "error", message: "Missing username." });
    }

    const viewerId = req.session?.user?.id ? Number(req.session.user.id) : null;

    const conn = await getConnection();
    try {
        const rows = await conn.query(
            `SELECT
                u.id AS user_id, u.username, up.bio, up.profile_image_url, up.resume_url, up.title,
                up.city, up.state, up.country, up.privacy, up.tier, up.updated, i.name AS industry_name
            FROM Users u
            JOIN UserProfiles up ON up.user_id = u.id
            LEFT JOIN Industries i ON i.id = up.industry_id
            WHERE u.username = ?
            LIMIT 1`,
            [username]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ status: "error", message: "User not found." });
        }

        const profile = rows[0];
        const targetId = Number(profile.user_id);

        // If private: allow only if self OR mutual connection
        if (profile.privacy !== "public") {
            if (!viewerId) {
                return res.status(403).json({ status: "error", message: "This portfolio is private." });
            }

            if (viewerId !== targetId) {
                // mutual = viewer follows target AND target follows viewer
                const [viewerFollows, targetFollows] = await Promise.all([
                conn.query(
                    `SELECT 1 FROM UserFavorites WHERE user_id = ? AND favorite_user_id = ? LIMIT 1`,
                    [viewerId, targetId]
                ),
                conn.query(
                    `SELECT 1 FROM UserFavorites WHERE user_id = ? AND favorite_user_id = ? LIMIT 1`,
                    [targetId, viewerId]
                ),
                ]);

                const mutual = !!(viewerFollows?.length && targetFollows?.length);

                if (!mutual) {
                    return res.status(403).json({ status: "error", message: "This portfolio is private." });
                }
            }
        }

        // If we got here, we can return full portfolio
        const userId = targetId;

        const [projects, jobs, affiliations, education] = await Promise.all([
            conn.query(
                `SELECT * FROM PortfolioEntries WHERE user_id = ? AND type = 'project' ORDER BY display_order ASC, updated DESC`,
                [userId]
            ),
            conn.query(
                `SELECT * FROM PortfolioEntries WHERE user_id = ? AND type = 'job' ORDER BY display_order ASC, updated DESC`,
                [userId]
            ),
            conn.query(
                `SELECT * FROM PortfolioEntries WHERE user_id = ? AND type = 'affiliation' ORDER BY display_order ASC, updated DESC`,
                [userId]
            ),
            conn.query(
                `SELECT * FROM PortfolioEntries WHERE user_id = ? AND type = 'education' ORDER BY display_order ASC, updated DESC`,
                [userId]
            ),
        ]);

        const [hardSkills, softSkills] = await Promise.all([
            conn.query(
                `SELECT s.id, s.name, us.proficiency
                FROM UserSkills us
                JOIN Skills s ON s.id = us.skill_id
                WHERE us.user_id = ? AND s.type = 'hard'
                ORDER BY s.name ASC`,
                [userId]
            ),
            conn.query(
                `SELECT s.id, s.name, us.proficiency
                FROM UserSkills us
                JOIN Skills s ON s.id = us.skill_id
                WHERE us.user_id = ? AND s.type = 'soft'
                ORDER BY s.name ASC`,
                [userId]
            ),
        ]);

        return res.json({
            status: "success",
            profile: {
                user_id: profile.user_id,
                username: profile.username,
                bio: profile.bio || "",
                profile_image_url: profile.profile_image_url || null,
                resume_url: profile.resume_url || null,
                title: profile.title || "",
                city: profile.city || "",
                state: profile.state || "",
                country: profile.country || "",
                industry_name: profile.industry_name || "",
                privacy: profile.privacy,
                tier: profile.tier,
                updated: profile.updated,
            },
            entries: {
                projects: projects || [],
                experiences: jobs || [],
                affiliations: affiliations || [],
                education: education || [],
            },
            skills: {
                hard: hardSkills || [],
                soft: softSkills || [],
            },
        });
    } catch (err) {
        console.error("GET /api/public/portfolio/:username error:", err);
        return res.status(500).json({ status: "error", message: "Failed to load portfolio." });
    } finally {
        conn.release();
    }
});

module.exports = router;