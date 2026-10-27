document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    const token = localStorage.getItem('elms_token');

    try {
        const res = await fetch('/api/employee/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const u = data.user;
            document.getElementById('profName').innerText = u.full_name;
            document.getElementById('profEmpId').innerText = u.employee_id;
            document.getElementById('profEmail').innerText = u.email;
            document.getElementById('profDept').innerText = u.department;
            document.getElementById('profDesig').innerText = u.designation;
            document.getElementById('profRole').innerText = u.role;
        }
    } catch (err) { console.error(err); }
});