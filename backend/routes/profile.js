const express = require("express");
const { getConnection } = require("../lib/db");
const { logActivity } = require("../utils/activityLogger");
const requireAuth = require("../utils/requireAuth");

const router = express.Router();
router.use(requireAuth);

// GET /api/profile
// Returns user + profile + industry
router.get("/", async (req, res) => {
    const userId = req.session.user.id;
    const conn = await getConnection();

    try {
        await conn.query(
            `INSERT IGNORE INTO UserProfiles (user_id) VALUES (?)`,
            [userId]
        );

        const rows = await conn.query (
            `SELECT
                u.id, u.username, u.email, u.first_name, u.last_name, u.created,
                p.bio, p.profile_image_url, p.resume_url, p.privacy, p.tier, p.updated,
                p.industry_id, i.name AS industry_name,
                p.title, p.city, p.state, p.country
            FROM Users u
            LEFT JOIN UserProfiles p ON p.user_id = u.id
            LEFT JOIN Industries i ON i.id = p.industry_id
            WHERE u.id = ?
            LIMIT 1`,
            [userId]
        );

        return res.json({
            status: "success",
            profile: rows?.[0] || null,
        });
    } catch (err) {
        console.error("GET /profile error:", err);
        return res.status(500).json({ 
            status: "error", 
            message: "Failed to load profile." 
        });
    } finally {
        conn.release();
    }
});

// PUT /api/profile
// Updates user profile
router.put("/", async (req, res) => {
    const userId = req.session.user.id;

    const {
        bio = null,
        profile_image_url = null,
        resume_url = null,
        privacy = "public",
        industry_id = null,
        title = null,
        city = null,
        state = null,
        country = null,
    } = req.body || {};

    const allowedPrivacy = new Set(["public", "private"]);
    if (!allowedPrivacy.has(privacy)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid privacy value.",
        });
    }

    const industryIdClean = industry_id === null || industry_id === "" ? null : Number(industry_id);
    if (industryIdClean !== null && Number.isNaN(industryIdClean)) {
        return res.status(400).json({
            status: "error",
            message: "industry_id must be a number or null.",
        });
    }
    
    const conn = await getConnection();

    try {
        // Ensure profle exists
        await conn.query (
            `INSERT IGNORE INTO UserProfiles (user_id) VALUES (?)`,
            [userId]
        );

        // Check if industry exists if provided
        if (industryIdClean !== null) {
            const industryRows = await conn.query (
                `SELECT id FROM Industries WHERE id = ? LIMIT 1`,
                [industryIdClean]
            );
            if (!industryRows || industryRows.length === 0) {
                return res.status(400).json({
                    status: "error",
                    message: "Industry not found.",
                });
            }
        }

        await conn.query (
            `UPDATE UserProfiles
            SET bio = ?, profile_image_url = ?, resume_url = ?, privacy = ?, industry_id = ?, title = ?, city = ?, state = ?, country = ?
            WHERE user_id = ?`,
            [bio, profile_image_url, resume_url, privacy, industryIdClean, title, city, state, country, userId]
        );

        await logActivity(req, {
            eventType: "profile_update",
            route: "/api/profile",
            metadata: {
                userId,
                privacy,
                industry_id: industryIdClean,
            },
        });

        return res.json({ status: "success" });
    } catch (err) {
        console.error("PUT /profile error:", err);
        return res.status(500).json({
            status: "error",
            message: "Failed to update profile.",
        });
    } finally {
        conn.release();
    }
});

// GET /api/profile/industries
router.get("/industries", async (req, res) => {
    const conn = await getConnection();
    try {
        const rows = await conn.query (
            `SELECT id, name FROM Industries ORDER BY name ASC`
        );
        return res.json({ 
            status: "success", 
            industries: rows });
    } catch (err) {
        console.error("GET /industries error:", err);
        return res.status(500).json({ 
            status: "error" 
        });
    } finally {
        conn.release();
    }
});

// GET /api/profile/stats
router.get("/stats", async (req, res) => {
    const userId = req.session.user.id;
    const conn = await getConnection();

    try {
        const [projectsRow] = await conn.query (
            `SELECT COUNT(*) AS c
            FROM PortfolioEntries
            WHERE user_id = ? AND type = 'project'`,
            [userId]
        );

        const [experienceRow] = await conn.query (
            `SELECT COUNT(*) AS c
            FROM PortfolioEntries
            WHERE user_id = ? AND type = 'job'`,
            [userId]
        );

        const [educationRow] = await conn.query (
            `SELECT COUNT(*) AS c
            FROM PortfolioEntries
            WHERE user_id = ? AND type = 'education'`,
            [userId]
        );

        const [affiliationsRow] = await conn.query (
            `SELECT COUNT(*) AS c
            FROM PortfolioEntries
            WHERE user_id = ? AND type = 'affiliation'`,
            [userId]
        );

        const [hardSkillsRow] = await conn.query (
            `SELECT COUNT(*) AS c
            FROM UserSkills us
            JOIN Skills s ON s.id = us.skill_id
            WHERE us.user_id = ? AND s.type = 'hard'`,
            [userId]
        );

        const [softSkillsRow] = await conn.query (
            `SELECT COUNT(*) AS c
            FROM UserSkills us
            JOIN Skills s ON s.id = us.skill_id
            WHERE us.user_id = ? AND s.type = 'soft'`,
            [userId]
        );

        const [favsRow] = await conn.query (
            `SELECT COUNT(*) AS c
            FROM UserFavorites
            WHERE user_id = ?`,
            [userId]
        );

        // today's views
        const [viewsRow] = await conn.query (
            `SELECT view_count
            FROM ProfileViewDaily
            WHERE user_id = ? AND date = CURDATE()
            LIMIT 1`,
            [userId]
        );

        return res.json({
            status: "success",
            stats: {
                projects: Number(projectsRow?.c || 0),
                experiences: Number(experienceRow?.c || 0),
                educations: Number(educationRow?.c || 0),
                affiliations: Number(affiliationsRow?.c || 0),
                hardSkills: Number(hardSkillsRow?.c || 0),
                softSkills: Number(softSkillsRow?.c || 0),
                favorites: Number(favsRow?.c || 0),
                profileViewsToday: Number(viewsRow?.view_count || 0),
            },
        });
    } catch (err) {
        console.error("GET /stats error:", err);
        return res.status(500).json({
            status: "error",
            message: "Failed to load stats.",
        });
    } finally {
        conn.release();
    }
});


module.exports = router;