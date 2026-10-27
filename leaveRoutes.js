const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply for Leave
router.post('/apply', verifyToken, async (req, res) => {
    try {
        const { leave_type, start_date, end_date, reason } = req.body;
        const userId = req.user.id;

        if (!leave_type || !start_date || !end_date || !reason) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const start = new Date(start_date);
        const end = new Date(end_date);

        if (end < start) {
            return res.status(400).json({ success: false, message: 'End date cannot be prior to start date.' });
        }

        const diffTime = Math.abs(end - start);
        const total_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Check overlapping leave applications
        const [overlapping] = await db.query(
            `SELECT * FROM leave_requests 
             WHERE user_id = ? AND status IN ('Pending', 'Approved') 
             AND ((start_date BETWEEN ? AND ?) OR (end_date BETWEEN ? AND ?))`,
            [userId, start_date, end_date, start_date, end_date]
        );

        if (overlapping.length > 0) {
            return res.status(400).json({ success: false, message: 'You already have a leave applied/approved during this date range.' });
        }

        // Save Leave Request
        await db.query(
            'INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, leave_type, start_date, end_date, total_days, reason]
        );

        res.status(201).json({ success: true, message: 'Leave application submitted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Get My Leaves
router.get('/my-leaves', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [leaves] = await db.query('SELECT * FROM leave_requests WHERE user_id = ? ORDER BY applied_at DESC', [userId]);
        res.json({ success: true, leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Cancel Pending Leave
router.put('/cancel/:id', verifyToken, async (req, res) => {
    try {
        const leaveId = req.params.id;
        const userId = req.user.id;

        const [leave] = await db.query('SELECT * FROM leave_requests WHERE id = ? AND user_id = ?', [leaveId, userId]);

        if (leave.length === 0) {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }

        if (leave[0].status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Only pending leave applications can be cancelled.' });
        }

        await db.query('UPDATE leave_requests SET status = "Cancelled" WHERE id = ?', [leaveId]);
        res.json({ success: true, message: 'Leave application cancelled.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;