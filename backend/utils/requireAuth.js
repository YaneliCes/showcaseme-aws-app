module.exports = function requireAuth(req, res, next) {
    // Check if the user exists and is authenticated
    if (req.session && req.session.user && req.session.user.id) {
        return next();
    }

    return res.status(401).json({
        status: "error",
        message: "Not authenticated.",
    });
};