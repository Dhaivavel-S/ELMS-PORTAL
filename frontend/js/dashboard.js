document.addEventListener('DOMContentLoaded', () => {
    checkAuth('EMPLOYEE');
    loadDashboardData();
});

async function loadDashboardData() {
    const token = localStorage.getItem('elms_token');
    const user = JSON.parse(localStorage.getItem('elms_user') || '{}');

    document.getElementById('userName').innerText = user.full_name || 'Employee';
    document.getElementById('userEmpId').innerText = user.employee_id || '';
    document.getElementById('userDept').innerText = user.department || '';

    try {
        const res = await fetch('/api/employee/dashboard-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById('totalLeaves').innerText = data.stats.total || 0;
            document.getElementById('pendingLeaves').innerText = data.stats.pending || 0;
            document.getElementById('approvedLeaves').innerText = data.stats.approved || 0;
            document.getElementById('rejectedLeaves').innerText = data.stats.rejected || 0;

            const remaining = (data.balances.casual_leave || 0) + (data.balances.sick_leave || 0) + 
                              (data.balances.earned_leave || 0) + (data.balances.emergency_leave || 0);
            document.getElementById('remainingBalance').innerText = remaining;

            renderRecentTable(data.recentLeaves);
        }
    } catch (err) {
        console.error('Error loading dashboard data:', err);
    }
}

function renderRecentTable(leaves) {
    const tbody = document.getElementById('recentLeavesBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    leaves.forEach(l => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#LV-${l.id}</td>
            <td>${l.leave_type}</td>
            <td>${l.start_date.split('T')[0]} to ${l.end_date.split('T')[0]}</td>
            <td>${l.total_days} Days</td>
            <td><span class="badge badge-${l.status.toLowerCase()}">${l.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}