const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Employee/Admin Registration
router.post('/register', async (req, res) => {
    try {
        const { employee_id, full_name, email, password, department, designation, role } = req.body;

        if (!employee_id || !full_name || !email || !password || !department || !designation) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const [existing] = await db.query('SELECT * FROM users WHERE email = ? OR employee_id = ?', [email, employee_id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email or Employee ID already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';

        const [result] = await db.query(
            'INSERT INTO users (employee_id, full_name, email, password, department, designation, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [employee_id, full_name, email, hashedPassword, department, designation, userRole]
        );

        // Initialize leave balance for employee
        await db.query(
            'INSERT INTO leave_balances (user_id, casual_leave, sick_leave, earned_leave, emergency_leave) VALUES (?, 12, 10, 15, 5)',
            [result.insertId]
        );

        res.status(201).json({ success: true, message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const user = users[0];

        if (user.status === 'INACTIVE') {
            return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact Admin.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.full_name, employee_id: user.employee_id },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '12h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                employee_id: user.employee_id,
                full_name: user.full_name,
                email: user.email,
                department: user.department,
                designation: user.designation,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

module.exports = router;