const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const requireAuth = require("../utils/requireAuth");
const { getConnection } = require("../lib/db");

const router = express.Router();
router.use(requireAuth);

// Store in memory so we can inspect bytes safely before writing to disk
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
    },
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
    const userId = Number(req.session.user.id);

    try {
        if (!req.file) {
            return res.status(400).json({ status: "error", message: "No file uploaded." });
        }

        // Reject dangerous filename patterns even though we never use it
        const original = String(req.file.originalname || "").toLowerCase();
        if (original.includes(".php") || original.includes(".phtml") || original.includes(".phar")) {
            return res.status(400).json({ status: "error", message: "Invalid file type." });
        }

        // Strong check: magic bytes
        if (!isPdfMagic(req.file.buffer)) {
            return res.status(400).json({ status: "error", message: "File is not a valid PDF." });
        }

        // Save with random name (never trust user filename)
        const uploadsDir = path.join(__dirname, "..", "uploads", "resumes");
        fs.mkdirSync(uploadsDir, { recursive: true });

        const fileId = crypto.randomBytes(16).toString("hex");
        const filename = `${fileId}.pdf`;
        const diskPath = path.join(uploadsDir, filename);

        fs.writeFileSync(diskPath, req.file.buffer);

        // Public URL (served by express.static below)
        const publicUrl = `/uploads/resumes/${filename}`;

        // Store in DB
        const conn = await getConnection();
        try {
            await conn.query(`INSERT IGNORE INTO UserProfiles (user_id) VALUES (?)`, [userId]);
            await conn.query(
                `UPDATE UserProfiles SET resume_url = ? WHERE user_id = ?`,
                [publicUrl, userId]
            );
        } finally {
            conn.release();
        }

        return res.json({ status: "success", resume_url: publicUrl });
    } catch (err) {
        console.error("Resume upload error:", err);

        const msg = String(err.message || "");
        if (msg.includes("File too large")) {
            return res.status(413).json({ status: "error", message: "PDF is too large." });
        }

        return res.status(500).json({ status: "error", message: "Upload failed." });
    }
});

module.exports = router;