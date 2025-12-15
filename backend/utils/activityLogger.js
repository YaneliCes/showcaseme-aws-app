const { getConnection } = require("../lib/db");

async function logActivity(req, { eventType, route, metadata = null }) {
    try {
        const conn = await getConnection();

        // if the user is logged in, we’ll log their id
        const userId =
            req.session && req.session.user && req.session.user.id
                ? Number(req.session.user.id)
                : null;

        const ip =
            (req.headers["x-forwarded-for"] &&
                req.headers["x-forwarded-for"].split(",")[0].trim()) ||
            req.socket?.remoteAddress ||
            null;

        const userAgent = req.headers["user-agent"] || null;

        await conn.query(
            `INSERT INTO ActivityLog (user_id, event_type, route, method, ip_address, user_agent, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                eventType,
                route || req.originalUrl || null,
                req.method || null,
                ip,
                userAgent,
                metadata ? JSON.stringify(metadata) : null,
            ]
        );

        conn.release();
    } catch (err) {
        console.error("Failed to log activity:", err.message);
        // logging should NEVER break the app, so no throw here
    }
}

module.exports = { logActivity };