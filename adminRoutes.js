const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Get Admin Overview Stats
router.get('/stats', verifyAdmin, async (req, res) => {
    try {
        const [userStats] = await db.query('SELECT COUNT(*) as total_employees FROM users WHERE role = "EMPLOYEE"');
        const [leaveStats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
            FROM leave_requests
        `);

        res.json({
            success: true,
            totalEmployees: userStats[0].total_employees,
            leaveStats: leaveStats[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Manage Leaves - Fetch all requests
router.get('/all-leaves', verifyAdmin, async (req, res) => {
    try {
        const [requests] = await db.query(`
            SELECT lr.*, u.full_name, u.employee_id, u.department 
            FROM leave_requests lr
            JOIN users u ON lr.user_id = u.id
            ORDER BY lr.applied_at DESC
        `);
        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Approve or Reject Leave
router.put('/process-leave/:id', verifyAdmin, async (req, res) => {
    try {
        const leaveId = req.params.id;
        const { action, comments } = req.body; // action: 'Approved' or 'Rejected'
        const adminId = req.user.id;

        if (!['Approved', 'Rejected'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action.' });
        }

        const [leaveReq] = await db.query('SELECT * FROM leave_requests WHERE id = ?', [leaveId]);
        if (leaveReq.length === 0) return res.status(404).json({ success: false, message: 'Request not found.' });

        const request = leaveReq[0];

        // Prevent double processing
        if (request.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'This leave request has already been processed.' });
        }

        // Update Leave Status
        await db.query('UPDATE leave_requests SET status = ? WHERE id = ?', [action, leaveId]);

        // Record Approval Log
        await db.query('INSERT INTO leave_approvals (leave_request_id, admin_id, action, comments) VALUES (?, ?, ?, ?)', [leaveId, adminId, action, comments || '']);

        // Deduct Leave Balance if Approved
        if (action === 'Approved') {
            const columnMap = {
                'Casual Leave': 'casual_leave',
                'Sick Leave': 'sick_leave',
                'Earned Leave': 'earned_leave',
                'Emergency Leave': 'emergency_leave'
            };
            const balanceCol = columnMap[request.leave_type];
            if (balanceCol) {
                await db.query(`UPDATE leave_balances SET ${balanceCol} = GREATEST(0, ${balanceCol} - ?) WHERE user_id = ?`, [request.total_days, request.user_id]);
            }
        }

        // Create notification for employee
        await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [
            request.user_id,
            `Your leave application for ${request.leave_type} (${request.start_date} to ${request.end_date}) has been ${action}.`
        ]);

        res.json({ success: true, message: `Leave request ${action.toLowerCase()} successfully.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Employee Management Routes
router.get('/employees', verifyAdmin, async (req, res) => {
    try {
        const [employees] = await db.query('SELECT id, employee_id, full_name, email, department, designation, role, status, created_at FROM users ORDER BY created_at DESC');
        res.json({ success: true, employees });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

router.put('/toggle-status/:id', verifyAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const [user] = await db.query('SELECT status FROM users WHERE id = ?', [userId]);

        if (user.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

        const newStatus = user[0].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await db.query('UPDATE users SET status = ? WHERE id = ?', [newStatus, userId]);

        res.json({ success: true, message: `Employee status changed to ${newStatus}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;