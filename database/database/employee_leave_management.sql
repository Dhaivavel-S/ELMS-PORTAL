CREATE DATABASE IF NOT EXISTS employee_leave_management;
USE employee_leave_management;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS leave_approvals;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS leave_balances;
DROP TABLE IF EXISTS users;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    role ENUM('EMPLOYEE', 'ADMIN') DEFAULT 'EMPLOYEE',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Balances Table
CREATE TABLE leave_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    casual_leave INT DEFAULT 12,
    sick_leave INT DEFAULT 10,
    earned_leave INT DEFAULT 15,
    emergency_leave INT DEFAULT 5,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Leave Requests Table
CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    leave_type ENUM('Casual Leave', 'Sick Leave', 'Earned Leave', 'Emergency Leave') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Leave Approvals Table
CREATE TABLE leave_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leave_request_id INT NOT NULL,
    admin_id INT NOT NULL,
    action ENUM('Approved', 'Rejected') NOT NULL,
    comments TEXT,
    action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample Initial Data (Passwords are bcrypt hashed for "Password123!")
-- Note: Replace hashes with real generated hashes or log in using updated registers
INSERT INTO users (employee_id, full_name, email, password, department, designation, role, status) VALUES
('ADM-001', 'System Administrator', 'admin@company.com', '$2b$10$e.wA4.U.3E6i5yJ6N6.P/.Nf.pD6kX/Fm1s9E2L3A4B5C6D7E8F9G', 'IT Support', 'System Admin', 'ADMIN', 'ACTIVE'),
('EMP-101', 'John Doe', 'john@company.com', '$2b$10$e.wA4.U.3E6i5yJ6N6.P/.Nf.pD6kX/Fm1s9E2L3A4B5C6D7E8F9G', 'Engineering', 'Senior Developer', 'EMPLOYEE', 'ACTIVE');

INSERT INTO leave_balances (user_id, casual_leave, sick_leave, earned_leave, emergency_leave) VALUES
(1, 12, 10, 15, 5),
(2, 12, 10, 15, 5);