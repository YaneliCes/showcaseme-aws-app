const express = require("express");
const crypto = require("crypto");
const multer = require("multer");
const requireAuth = require("../utils/requireAuth");
const { getConnection } = require("../lib/db");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const router = express.Router();
router.use(requireAuth);

const REGION = process.env.AWS_REGION || "us-east-2";
const BUCKET = process.env.RESUME_BUCKET;
const s3 = new S3Client({ region: REGION });

// Store in memory so we can inspect bytes safely before uploading to S3
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const okMime = file.mimetype === "application/pdf";
        if (!okMime) return cb(new Error("Only PDF files are allowed."));
        cb(null, true);
    },
});

function isPdfMagic(buffer) {
    // PDF files start with: %PDF-
    if (!buffer || buffer.length < 5) return false;
    return buffer.slice(0, 5).toString("utf8") === "%PDF-";
}

router.post("/", upload.single("resume"), async (req, res) => {
    const userId = Number(req.session?.user?.id);

    try {
        if (!BUCKET) {
            return res.status(500).json({
                status: "error",
                message: "Server missing RESUME_BUCKET configuration.",
            });
        }

        if (!userId) {
            return res
                .status(401)
                .json({ status: "error", message: "Not authenticated." });
        }

        if (!req.file) {
            return res
                .status(400)
                .json({ status: "error", message: "No file uploaded." });
        }

        // Reject dangerous filename patterns even though we never use it
        const original = String(req.file.originalname || "").toLowerCase();
        if (
            original.includes(".php") ||
            original.includes(".phtml") ||
            original.includes(".phar")
        ) {
            return res
                .status(400)
                .json({ status: "error", message: "Invalid file type." });
        }

        // Strong check: magic bytes
        if (!isPdfMagic(req.file.buffer)) {
            return res
                .status(400)
                .json({ status: "error", message: "File is not a valid PDF." });
        }

        // S3 key (unique + grouped per user)
        const fileId = crypto.randomBytes(16).toString("hex");
        const key = `resumes/${userId}/${fileId}.pdf`;

        // Upload to S3 
        await s3.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                Body: req.file.buffer,
                ContentType: "application/pdf",
                // Optional (good practice):
                // ServerSideEncryption: "AES256",
            })
        );

        // Store the S3 key in DB (NOT a /uploads path)
        const conn = await getConnection();
        try {
            await conn.query(
                `INSERT IGNORE INTO UserProfiles (user_id) VALUES (?)`,
                [userId]
            );
            await conn.query(
                `UPDATE UserProfiles SET resume_url = ? WHERE user_id = ?`,
                [key, userId]
            );
        } finally {
            conn.release();
        }

        return res.json({ status: "success", resume_url: key });
    } catch (err) {
        console.error("Resume upload error:", err);

        const msg = String(err?.message || "");
        if (msg.includes("File too large")) {
            return res
                .status(413)
                .json({ status: "error", message: "PDF is too large." });
        }

        // AWS SDK errors often come through with name/code
        if (err?.name === "AccessDenied" || err?.Code === "AccessDenied") {
            return res.status(403).json({
                status: "error",
                message:
                    "Upload failed (S3 access denied). Check IAM role permissions.",
            });
        }

        return res
            .status(500)
            .json({ status: "error", message: "Upload failed." });
    }
});

module.exports = router;