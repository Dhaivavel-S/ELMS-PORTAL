const API_BASE = '/api/auth';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('elms_token', data.token);
                    localStorage.setItem('elms_user', JSON.stringify(data.user));
                    
                    if (data.user.role === 'ADMIN') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    alert(data.message);
                }
            } catch (err) {
                alert('Login failed. Please verify server connection.');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                employee_id: document.getElementById('employee_id').value,
                full_name: document.getElementById('full_name').value,
                email: document.getElementById('email').value,
                department: document.getElementById('department').value,
                designation: document.getElementById('designation').value,
                password: document.getElementById('password').value,
                role: document.getElementById('role').value
            };

            try {
                const res = await fetch(`${API_BASE}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (data.success) {
                    alert('Registration successful! Please login.');
                    window.location.href = 'index.html';
                } else {
                    alert(data.message);
                }
            } catch (err) {
                alert('Registration failed.');
            }
        });
    }
});

function logout() {
    localStorage.removeItem('elms_token');
    localStorage.removeItem('elms_user');
    window.location.href = 'index.html';
}

function checkAuth(requiredRole = null) {
    const token = localStorage.getItem('elms_token');
    const user = JSON.parse(localStorage.getItem('elms_user') || '{}');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    if (requiredRole && user.role !== requiredRole) {
        alert('Unauthorized access!');
        window.location.href = user.role === 'ADMIN' ? 'admin-dashboard.html' : 'dashboard.html';
    }
}