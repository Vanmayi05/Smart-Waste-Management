document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. Sidebar Navigation Structure
    // ==========================================
    const navLinks = document.querySelectorAll('.nav-links li');
    const pageSections = document.querySelectorAll('.page-section');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const headerContentMap = {
        'page-dashboard': { title: 'Dashboard', subtitle: 'Overview of current waste management operations' },
        'page-map': { title: 'Live Map', subtitle: 'Real-time geographic tracking of fleet and bins' },
        'page-vehicles': { title: 'Fleet Management', subtitle: 'Monitor active vehicles and schedules' },
        'page-complaints': { title: 'Complaints', subtitle: 'Review and resolve citizen reported issues' },
        'page-reports': { title: 'Analytics', subtitle: 'Deep dive into performance metrics and trends' },
        'page-settings': { title: 'Settings', subtitle: 'Manage system preferences and operators' },
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if(link.querySelector('a').getAttribute('href') !== '#') return;
            e.preventDefault();

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const targetId = link.getAttribute('data-target');

            pageSections.forEach(sec => {
                sec.classList.remove('active');
            });

            if (targetId) {
                const targetSec = document.getElementById(targetId);
                if (targetSec) {
                    targetSec.classList.add('active');
                }
                
                if (headerContentMap[targetId]) {
                    pageTitle.textContent = headerContentMap[targetId].title;
                    pageSubtitle.textContent = headerContentMap[targetId].subtitle;
                }
            }
        });
    });

    // ==========================================
    // 2. Map Filter Interactive Buttons
    // ==========================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const mapMarkers = document.querySelectorAll('.map-marker');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterType = btn.getAttribute('data-filter');

            mapMarkers.forEach(marker => {
                marker.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                if (filterType === 'critical') {
                    if (marker.classList.contains('critical')) {
                        marker.style.opacity = '1';
                        marker.style.transform = 'translate(-50%, -50%) scale(1.1)';
                    } else {
                        marker.style.opacity = '0';
                        marker.style.transform = 'translate(-50%, -50%) scale(0.5)';
                        setTimeout(() => marker.style.pointerEvents = 'none', 300);
                    }
                } else {
                    marker.style.opacity = '1';
                    marker.style.transform = 'translate(-50%, -50%) scale(1)';
                    marker.style.pointerEvents = 'auto';
                }
            });
        });
    });

    // ==========================================
    // 3. Alerts Action Click Behaviors
    // ==========================================
    const actionBtns = document.querySelectorAll('.alert-item .action-btn');

    actionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); 
            const originalText = this.textContent;
            this.textContent = '...';
            this.style.opacity = '0.7';
            this.style.pointerEvents = 'none';

            setTimeout(() => {
                this.textContent = 'Done ✓';
                this.style.background = 'var(--success)';
                this.style.color = '#fff';
                this.style.borderColor = 'var(--success)';
                this.style.opacity = '1';

                const parentAlert = this.closest('.alert-item');
                if (parentAlert) {
                    parentAlert.style.opacity = '0.5';
                }
            }, 800);
        });
    });

    // ==========================================
    // 4. View All Button Pulse Effect
    // ==========================================
    const viewAllBtn = document.querySelector('.view-all-btn');
    if(viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
             viewAllBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Loading...';
             setTimeout(() => {
                 viewAllBtn.innerHTML = 'View All History <i class="bx bx-right-arrow-alt"></i>';
             }, 1000);
        });
    }

    // ==========================================
    // 5. Admin Complaints Table & LocalStorage Logic
    // ==========================================
    
    // Safety check just in case Citizen hasn't initialized yet
    if (!localStorage.getItem('complaints')) {
        localStorage.setItem('complaints', JSON.stringify([
            { id: 'TKT-402', citizen: 'Citizen User', category: 'Missed Pickup', location: 'Sector 4 Residential', date: 'Oct 12, 2023', status: 'in-progress', desc: 'Trash was not collected.' },
            { id: 'TKT-385', citizen: 'Citizen User', category: 'Damaged Public Bin', location: 'Central Park South Gate', date: 'Sep 28, 2023', status: 'resolved', desc: 'The lid is broken.' }
        ]));
    }

    function renderAdminTable() {
        const tbody = document.querySelector('.admin-table tbody');
        if (!tbody) return;

        let complaints = JSON.parse(localStorage.getItem('complaints')) || [];
        tbody.innerHTML = ''; // clear initial hardcoded HTML rows

        // Loop backwards to show newest tickets first
        for (let i = complaints.length - 1; i >= 0; i--) {
            const c = complaints[i];
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="tkt-id">${c.id}</td>
                <td>${c.citizen}</td>
                <td>${c.category}</td>
                <td>${c.location}</td>
                <td>${c.date}</td>
                <td>
                    <select class="status-select ${c.status}" data-id="${c.id}">
                        <option value="pending" ${c.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${c.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${c.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        }

        // Rebind status changes
        const statusSelects = document.querySelectorAll('.status-select');
        statusSelects.forEach(select => {
            select.addEventListener('change', function() {
                // Update CSS classes for color
                this.classList.remove('pending', 'in-progress', 'resolved');
                this.classList.add(this.value);
                
                // Visual feedback pop
                this.style.transform = 'scale(1.05)';
                setTimeout(() => this.style.transform = 'scale(1)', 200);

                // Update LocalStorage Backend
                const targetId = this.getAttribute('data-id');
                const newStatus = this.value;
                
                let complaintsList = JSON.parse(localStorage.getItem('complaints')) || [];
                const idx = complaintsList.findIndex(item => item.id === targetId);
                if (idx !== -1) {
                    complaintsList[idx].status = newStatus;
                    localStorage.setItem('complaints', JSON.stringify(complaintsList));
                }
            });
        });
    }

    // Call initially
    renderAdminTable();

    // Event listener to re-render if jumping back to Complaints dashboard
    const adminComplaintTabBtn = document.querySelector('[data-target="page-complaints"]');
    if(adminComplaintTabBtn) {
        adminComplaintTabBtn.addEventListener('click', renderAdminTable);
    }

    // ==========================================
    // 6. Admin Add Alert Logic
    // ==========================================
    const openAddBtn = document.getElementById('open-add-alert-btn');
    const addAlertForm = document.getElementById('add-alert-form');
    const cancelAlertBtn = document.getElementById('cancel-alert-btn');
    const saveAlertBtn = document.getElementById('save-alert-btn');
    const alertsList = document.querySelector('.alerts-list');

    if (openAddBtn && addAlertForm) {
        openAddBtn.addEventListener('click', () => {
            addAlertForm.style.display = addAlertForm.style.display === 'none' ? 'block' : 'none';
        });

        cancelAlertBtn.addEventListener('click', () => {
             addAlertForm.style.display = 'none';
        });

        saveAlertBtn.addEventListener('click', () => {
            const title = document.getElementById('new-alert-title').value;
            const desc = document.getElementById('new-alert-desc').value;
            const type = document.getElementById('new-alert-type').value;

            if(!title || !desc) return; // Prevent empty

            const originalContent = saveAlertBtn.innerHTML;
            saveAlertBtn.innerHTML = "Publishing...";

            setTimeout(() => {
                let icon = 'bx-info-circle';
                if(type === 'warning') icon = 'bxs-error';
                if(type === 'critical') icon = 'bxs-flame';
                if(type === 'success') icon = 'bxs-check-circle';

                const newAlertHTML = `
                    <div class="alert-item ${type}" style="animation: fadeIn 0.4s ease;">
                        <div class="alert-icon"><i class='bx ${icon}'></i></div>
                        <div class="alert-content">
                            <h4>${title}</h4>
                            <p>${desc}</p>
                            <span class="time">Just now</span>
                        </div>
                        <button class="action-btn">Action</button>
                    </div>
                `;
                
                alertsList.insertAdjacentHTML('afterbegin', newAlertHTML);
                
                document.getElementById('new-alert-title').value = '';
                document.getElementById('new-alert-desc').value = '';
                addAlertForm.style.display = 'none';
                saveAlertBtn.innerHTML = originalContent;
                
                const newBtn = alertsList.querySelector('.alert-item:first-child .action-btn');
                if(newBtn) {
                    newBtn.addEventListener('click', function(e) { e.stopPropagation(); this.textContent='Done ✓'; this.style.background='var(--success)'; this.style.borderColor='var(--success)'; this.style.color='white'; setTimeout(()=>this.closest('.alert-item').style.opacity='0.5', 1000); });
                }

            }, 600);
        });
    }

});
