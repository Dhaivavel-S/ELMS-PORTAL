document.addEventListener('DOMContentLoaded', () => {
    checkAuth('ADMIN');

    if (document.getElementById('adminStatsGrid')) {
        loadAdminStats();
    }

    if (document.getElementById('manageLeavesTable')) {
        loadAllLeaves();
    }

    if (document.getElementById('employeesTable')) {
        loadEmployees();
    }
});

async function loadAdminStats() {
    const token = localStorage.getItem('elms_token');
    try {
        const res = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('adminTotalEmp').innerText = data.totalEmployees || 0;
            document.getElementById('adminPendingLeaves').innerText = data.leaveStats.pending || 0;
            document.getElementById('adminApprovedLeaves').innerText = data.leaveStats.approved || 0;
            document.getElementById('adminRejectedLeaves').innerText = data.leaveStats.rejected || 0;
        }
    } catch (err) { console.error(err); }
}

async function loadAllLeaves() {
    const token = localStorage.getItem('elms_token');
    try {
        const res = await fetch('/api/admin/all-leaves', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const tbody = document.getElementById('manageLeavesBody');
            tbody.innerHTML = '';
            data.requests.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#LV-${r.id}</td>
                    <td>${r.full_name} (${r.employee_id})</td>
                    <td>${r.leave_type}</td>
                    <td>${r.start_date.split('T')[0]} to ${r.end_date.split('T')[0]}</td>
                    <td>${r.total_days}</td>
                    <td>${r.reason}</td>
                    <td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td>
                    <td>
                        ${r.status === 'Pending' ? `
                            <button onclick="processLeave(${r.id}, 'Approved')" style="background:#10b981; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Approve</button>
                            <button onclick="processLeave(${r.id}, 'Rejected')" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Reject</button>
                        ` : 'Processed'}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) { console.error(err); }
}

async function processLeave(id, action) {
    const comments = prompt(`Reason/Comment for ${action}:`) || '';
    const token = localStorage.getItem('elms_token');
    try {
        const res = await fetch(`/api/admin/process-leave/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action, comments })
        });
        const data = await res.json();
        alert(data.message);
        loadAllLeaves();
    } catch (err) { alert('Action failed.'); }
}

async function loadEmployees() {
    const token = localStorage.getItem('elms_token');
    try {
        const res = await fetch('/api/admin/employees', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const tbody = document.getElementById('employeesBody');
            tbody.innerHTML = '';
            data.employees.forEach(e => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${e.employee_id}</td>
                    <td>${e.full_name}</td>
                    <td>${e.email}</td>
                    <td>${e.department}</td>
                    <td>${e.designation}</td>
                    <td>${e.role}</td>
                    <td><span class="badge ${e.status === 'ACTIVE' ? 'badge-approved' : 'badge-rejected'}">${e.status}</span></td>
                    <td>
                        <button onclick="toggleEmployeeStatus(${e.id})" style="background:#3b82f6; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Toggle Status</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) { console.error(err); }
}

async function toggleEmployeeStatus(id) {
    const token = localStorage.getItem('elms_token');
    try {
        const res = await fetch(`/api/admin/toggle-status/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        alert(data.message);
        loadEmployees();
    } catch (err) { alert('Failed to update employee status.'); }
}