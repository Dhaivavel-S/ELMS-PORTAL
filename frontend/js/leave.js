document.addEventListener('DOMContentLoaded', () => {
    checkAuth('EMPLOYEE');
    
    const applyForm = document.getElementById('applyLeaveForm');
    if (applyForm) {
        applyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('elms_token');
            const payload = {
                leave_type: document.getElementById('leave_type').value,
                start_date: document.getElementById('start_date').value,
                end_date: document.getElementById('end_date').value,
                reason: document.getElementById('reason').value
            };

            try {
                const res = await fetch('/api/leave/apply', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    alert(data.message);
                    window.location.href = 'my-leaves.html';
                } else {
                    alert(data.message);
                }
            } catch (err) {
                alert('Error submitting leave request.');
            }
        });
    }

    if (document.getElementById('myLeavesTable')) {
        loadMyLeaves();
    }
});

async function loadMyLeaves() {
    const token = localStorage.getItem('elms_token');
    try {
        const res = await fetch('/api/leave/my-leaves', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            const tbody = document.getElementById('myLeavesBody');
            tbody.innerHTML = '';

            data.leaves.forEach(l => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#LV-${l.id}</td>
                    <td>${l.leave_type}</td>
                    <td>${l.start_date.split('T')[0]}</td>
                    <td>${l.end_date.split('T')[0]}</td>
                    <td>${l.total_days}</td>
                    <td>${l.reason}</td>
                    <td><span class="badge badge-${l.status.toLowerCase()}">${l.status}</span></td>
                    <td>
                        ${l.status === 'Pending' ? `<button onclick="cancelLeave(${l.id})" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Cancel</button>` : '-'}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

async function cancelLeave(id) {
    if (!confirm('Are you sure you want to cancel this leave?')) return;
    const token = localStorage.getItem('elms_token');
    try {
        const res = await fetch(`/api/leave/cancel/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        alert(data.message);
        loadMyLeaves();
    } catch (err) {
        alert('Could not cancel request.');
    }
}