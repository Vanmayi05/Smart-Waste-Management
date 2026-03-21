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
    // 2. File Upload Interaction & Preview
    // ==========================================
    const fileInput = document.getElementById('file');
    const fileNameDisplay = document.querySelector('.file-name');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image-btn');
    let base64ImageString = "";
    
    if(fileInput && fileNameDisplay) {
        fileInput.addEventListener('change', function() {
            if(this.files && this.files.length > 0) {
                fileNameDisplay.textContent = this.files[0].name;
                const reader = new FileReader();
                reader.onload = function(e) {
                    base64ImageString = e.target.result;
                    imagePreview.src = base64ImageString;
                    imagePreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(this.files[0]);
            } else {
                clearImageSelection();
            }
        });
    }

    if(removeImageBtn) {
        removeImageBtn.addEventListener('click', clearImageSelection);
    }

    function clearImageSelection() {
        if(fileInput) fileInput.value = '';
        if(fileNameDisplay) fileNameDisplay.textContent = "No file chosen";
        if(imagePreview) imagePreview.src = '';
        if(imagePreviewContainer) imagePreviewContainer.style.display = 'none';
        base64ImageString = "";
    }

    // ==========================================
    // 3. Fetch & Render Citizen Complaints API
    // ==========================================
    async function fetchCitizenComplaints() {
        const complaintsList = document.getElementById('complaints-list');
        if (!complaintsList) return;
        
        try {
            complaintsList.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="bx bx-loader-alt bx-spin" style="font-size: 24px;"></i></div>';
            
            const response = await fetch('http://localhost:8080/api/complaints');
            if(!response.ok) throw new Error('Failed to fetch');
            const allComplaints = await response.json();
            
            complaintsList.innerHTML = '';
            
            if(allComplaints.length === 0) {
                complaintsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 20px;">You have no active complaints.</p>';
                return;
            }

            allComplaints.forEach(c => {
                let badgeClass = 'pending';
                let badgeText = 'Pending';
                if(c.status === 'In Progress') { badgeClass = 'in-progress'; badgeText = 'In Progress'; }
                if(c.status === 'Resolved') { badgeClass = 'success'; badgeText = 'Resolved'; }

                const dateRaw = new Date(c.createdAt);
                const dateStr = dateRaw.toLocaleDateString() + ' ' + dateRaw.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                const imageHtml = c.image ? `<div style="margin-top: 12px; border-radius: 8px; overflow: hidden; border: 1px solid var(--glass-border);"><img src="${c.image}" style="width: 100%; max-height: 200px; object-fit: cover; display: block;"></div>` : '';

                const html = `
                    <div class="complaint-item" style="animation: fadeIn 0.5s ease;">
                        <div class="c-header">
                            <span class="c-id" style="font-size: 13px; color: var(--text-secondary); font-weight: 500;"><i class='bx bx-time'></i> ${dateStr}</span>
                            <span class="badge ${badgeClass}">${badgeText}</span>
                        </div>
                        <h4 style="margin-top: 10px;">${c.title}</h4>
                        <p class="c-desc">${c.description}</p>
                        ${imageHtml}
                    </div>
                `;
                complaintsList.insertAdjacentHTML('beforeend', html);
            });
        } catch(err) {
            complaintsList.innerHTML = '<p style="text-align: center; color: #ef4444;">Failed to connect to backend.</p>';
        }
    }

    // Run initial render
    fetchCitizenComplaints();

    // ==========================================
    // 4. Complaint Form Submission (Real API)
    // ==========================================
    const complaintForm = document.getElementById('complaint-form');
    const submitBtn = document.getElementById('submit-complaint-btn');

    if (complaintForm) {
        complaintForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const categorySelect = complaintForm.querySelector('select');
            const categoryText = categorySelect.options[categorySelect.selectedIndex].text;
            const locationVal = complaintForm.querySelector('#location-text') ? complaintForm.querySelector('#location-text').value : complaintForm.querySelector('input[type="text"]').value;
            const descVal = complaintForm.querySelector('textarea').value;

            const finalTitle = categoryText + " at " + locationVal;

            const originalContent = submitBtn.innerHTML;
            submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Submitting...";
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';

            try {
                const response = await fetch('http://localhost:8080/api/complaints', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: finalTitle,
                        description: descVal,
                        image: base64ImageString, // Attached if uploaded, else empty
                        lat: selectedLat,
                        lng: selectedLng
                    })
                });

                if(!response.ok) throw new Error('Failed to submit');

                submitBtn.innerHTML = "Submitted ✓";
                submitBtn.style.background = 'var(--success)';
                submitBtn.style.color = 'white';
                submitBtn.style.borderColor = 'var(--success)';
                submitBtn.style.opacity = '1';
                
                complaintForm.reset();
                clearImageSelection();
                
                selectedLat = null;
                selectedLng = null;
                if (complaintMarker) {
                    complaintMarker.remove();
                    complaintMarker = null;
                }

                // Refresh the list directly from API
                fetchCitizenComplaints();

                setTimeout(() => {
                    submitBtn.innerHTML = originalContent;
                    submitBtn.style.background = '';
                    submitBtn.style.color = '';
                    submitBtn.style.borderColor = '';
                    submitBtn.disabled = false;
                }, 2000);

            } catch(err) {
                alert("Failed to create complaint.");
                submitBtn.innerHTML = originalContent;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            }
        });
    }

    // ==========================================
    // 5. Interactive Complaint Map
    // ==========================================
    let selectedLat = null;
    let selectedLng = null;
    let complaintMarker = null;

    const mapEl = document.getElementById('complaint-map');
    let cMap;
    if (mapEl) {
        cMap = L.map('complaint-map').setView([12.9716, 77.5946], 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(cMap);

        // Fix map rendering issues inside hidden tabs if user navigates dynamically
        const allDynamicTabs = document.querySelectorAll('.nav-links li');
        allDynamicTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                setTimeout(() => cMap.invalidateSize(), 300);
            });
        });

        // Highlight Whitefield Ward (Project Focus Area)
        const whitefieldCoords = [
            [12.9899, 77.7289],
            [12.9835, 77.7511],
            [12.9631, 77.7601],
            [12.9511, 77.7501],
            [12.9535, 77.7315],
            [12.9711, 77.7121]
        ];

        const whitefieldPolygon = L.polygon(whitefieldCoords, {
            color: '#3B82F6',      // Blue border matching UI accents
            weight: 2,
            fillColor: '#3B82F6',
            fillOpacity: 0.2,
            interactive: false     // Disable interaction so citizens can easily drop pins INSIDE the polygon without clicking the polygon itself
        }).addTo(cMap);

        // Auto-center user view onto Whitefield boundaries
        cMap.fitBounds(whitefieldPolygon.getBounds());

        cMap.on('click', function(e) {
            selectedLat = e.latlng.lat;
            selectedLng = e.latlng.lng;
            
            if (complaintMarker) {
                cMap.removeLayer(complaintMarker);
            }
            complaintMarker = L.marker([selectedLat, selectedLng]).addTo(cMap);
        });
    }

});
