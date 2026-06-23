const express = require('express');
const router = express.Router();
const { requireAdmin, ADMIN_TOKEN } = require('../middleware/auth');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

router.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        return res.json({ success: true, token: ADMIN_TOKEN });
    }
    res.status(401).json({ success: false, message: 'Invalid username or password' });
});

router.get('/verify', requireAdmin, (req, res) => {
    res.json({ success: true });
});

module.exports = router;
