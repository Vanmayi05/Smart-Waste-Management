document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. Sidebar Navigation Structure
    // ==========================================
    const navLinks = document.querySelectorAll('.nav-links li');
    const pageSections = document.querySelectorAll('.page-section');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const headerContentMap = {
        'page-home': { title: 'Welcome Back', subtitle: 'Your neighborhood waste management overview' },
        'page-map': { title: 'Live Collection Map', subtitle: 'Real-time geographic tracking of fleet' },
        'page-complaints': { title: 'My Complaints', subtitle: 'Submit and track service requests' },
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('data-target');
            
            // If it's a normal link like Logout without a data-target, let the browser handle it
            if (!targetId) return;
            
            e.preventDefault();

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            pageSections.forEach(sec => sec.classList.remove('active'));

            if (targetId) {
                const targetSec = document.getElementById(targetId);
                if (targetSec) targetSec.classList.add('active');
                
                if (headerContentMap[targetId]) {
                    pageTitle.textContent = headerContentMap[targetId].title;
                    pageSubtitle.textContent = headerContentMap[targetId].subtitle;
                }
            }
        });
    });

    // ==========================================
    // 2. File Upload Interaction
    // ==========================================
    const fileInput = document.getElementById('file');
    const fileNameDisplay = document.querySelector('.file-name');
    
    if(fileInput && fileNameDisplay) {
        fileInput.addEventListener('change', function() {
            if(this.files.length > 0) {
                fileNameDisplay.textContent = this.files[0].name;
            } else {
                fileNameDisplay.textContent = "No file chosen";
            }
        });
    }

    // ==========================================
    // 0. Init LocalStorage State
    // ==========================================
    if (!localStorage.getItem('complaints')) {
        localStorage.setItem('complaints', JSON.stringify([
            { id: 'TKT-402', citizen: 'Citizen User', category: 'Missed Pickup', location: 'Sector 4 Residential', date: 'Oct 12, 2023', status: 'in-progress', desc: 'Trash was not collected yesterday despite being put out on time.' },
            { id: 'TKT-385', citizen: 'Citizen User', category: 'Damaged Public Bin', location: 'Central Park South Gate', date: 'Sep 28, 2023', status: 'resolved', desc: 'The lid is completely broken off.' }
        ]));
    }

    function renderCitizenComplaints() {
        const complaintsList = document.getElementById('complaints-list');
        if (!complaintsList) return;
        
        let complaints = JSON.parse(localStorage.getItem('complaints')) || [];
        complaintsList.innerHTML = ''; // clear hardcoded items

        const myComplaints = complaints.filter(c => c.citizen === 'Citizen User');

        for (let i = myComplaints.length - 1; i >= 0; i--) {
            const c = myComplaints[i];
            const badgeClass = c.status;
            let badgeText = 'Pending';
            if(c.status === 'in-progress') badgeText = 'In Progress';
            if(c.status === 'resolved') badgeText = 'Resolved';

            const html = `
                <div class="complaint-item" style="animation: fadeIn 0.5s ease;">
                    <div class="c-header">
                        <span class="c-id">#${c.id}</span>
                        <span class="badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <h4>${c.category}</h4>
                    <p class="c-loc"><i class='bx bx-map'></i> ${c.location}</p>
                    <p class="c-desc">${c.desc}</p>
                    <span class="c-date">Submitted: ${c.date}</span>
                </div>
            `;
            complaintsList.insertAdjacentHTML('beforeend', html);
        }
    }

    // Run initial render
    renderCitizenComplaints();

    // ==========================================
    // 3. Complaint Form Submission (Mock Logic)
    // ==========================================
    const complaintForm = document.getElementById('complaint-form');
    const submitBtn = document.getElementById('submit-complaint-btn');

    if (complaintForm) {
        complaintForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Extract values
            const categorySelect = complaintForm.querySelector('select');
            const categoryText = categorySelect.options[categorySelect.selectedIndex].text;
            const locationVal = complaintForm.querySelector('input[type="text"]').value;
            const descVal = complaintForm.querySelector('textarea').value;

            // Visual feedback
            const originalContent = submitBtn.innerHTML;
            submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Submitting...";
            submitBtn.style.opacity = '0.8';
            submitBtn.style.pointerEvents = 'none';

            // Simulate network request
            setTimeout(() => {
                submitBtn.innerHTML = "Submitted ✓";
                submitBtn.style.background = 'var(--success)';
                submitBtn.style.opacity = '1';
                
                const now = new Date();
                const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const id = 'TKT-' + Math.floor(100 + Math.random() * 900); // random TKT-XXX
                
                const newComplaint = {
                    id: id,
                    citizen: 'Citizen User',
                    category: categoryText,
                    location: locationVal,
                    date: dateStr,
                    status: 'pending',
                    desc: descVal
                };
                
                // Read from local storage and push new item
                let complaints = JSON.parse(localStorage.getItem('complaints')) || [];
                complaints.push(newComplaint);
                
                // Write back to local storage
                localStorage.setItem('complaints', JSON.stringify(complaints));

                // Re-render complaints list
                renderCitizenComplaints();
                
                // Reset form
                complaintForm.reset();
                if(fileNameDisplay) fileNameDisplay.textContent = "No file chosen";

                setTimeout(() => {
                    submitBtn.innerHTML = originalContent;
                    submitBtn.style.background = '';
                    submitBtn.style.pointerEvents = 'auto';
                }, 2000);
            }, 1000);
        });
    }

});
