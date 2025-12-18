const express = require("express");
const requireAuth = require("../utils/requireAuth");
const { getConnection } = require("../lib/db");

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const router = express.Router();
router.use(requireAuth);

const REGION = process.env.AWS_REGION || "us-east-2";
const BUCKET = process.env.RESUME_BUCKET;
const s3 = new S3Client({ region: REGION });

router.get("/resume-url", async (req, res) => {
    const userId = Number(req.session.user.id);

    if (!BUCKET) {
        return res.status(500).json({
            status: "error",
            message: "Server missing RESUME_BUCKET configuration.",
        });
    }

    const conn = await getConnection();
    try {
        const rows = await conn.query(
            `SELECT resume_url FROM UserProfiles WHERE user_id = ? LIMIT 1`,
            [userId]
        );

        const key = String(rows?.[0]?.resume_url || "").trim();
        if (!key) {
            return res.json({ status: "success", url: null });
        }

        // ignore old local paths if any
        if (key.startsWith("/uploads/")) {
            return res.json({ status: "success", url: null });
        }

        const cmd = new GetObjectCommand({
            Bucket: BUCKET,
            Key: key,
            ResponseContentType: "application/pdf",
            ResponseContentDisposition: "inline",
        });

        const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
        return res.json({ status: "success", url });
    } catch (err) {
        console.error("GET /api/profile/resume-url error:", err);
        return res.status(500).json({ status: "error", message: "Failed to sign resume." });
    } finally {
        conn.release();
    }
});

module.exports = router;
