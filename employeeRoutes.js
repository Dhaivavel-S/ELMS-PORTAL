const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get Dashboard Stats for logged in employee
router.get('/dashboard-stats', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [stats] = await db.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
             FROM leave_requests WHERE user_id = ?`, [userId]
        );

        const [balances] = await db.query('SELECT * FROM leave_balances WHERE user_id = ?', [userId]);
        const [recentLeaves] = await db.query('SELECT * FROM leave_requests WHERE user_id = ? ORDER BY applied_at DESC LIMIT 5', [userId]);

        res.json({
            success: true,
            stats: stats[0],
            balances: balances[0] || {},
            recentLeaves
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Get User Profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const [user] = await db.query('SELECT id, employee_id, full_name, email, department, designation, role, created_at FROM users WHERE id = ?', [req.user.id]);
        if (user.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user: user[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;