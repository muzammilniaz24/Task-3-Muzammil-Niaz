const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'hotel-admin-secret-token';

function requireAdmin(req, res, next) {
    const token = req.headers['x-admin-token'];
    if (token && token === ADMIN_TOKEN) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Admin access required' });
}

module.exports = { requireAdmin, ADMIN_TOKEN };
