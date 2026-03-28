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

                if (targetId === 'page-home') {
                    setTimeout(() => { if(window.mapboxHomeMap) window.mapboxHomeMap.resize(); }, 150);
                } else if (targetId === 'page-map') {
                    setTimeout(() => { if(window.mapboxLiveMap) window.mapboxLiveMap.resize(); }, 150);
                } else if (targetId === 'page-complaints') {
                    setTimeout(() => { if(cMap) cMap.invalidateSize(); }, 150);
                }
            }
        });
    });

    // ==========================================
    // 2. Map Layout Sizing Refreshes
    // ==========================================
    
    let mainMapLat = null;
    let mainMapLng = null;
    let mainMapMarker = null;
    let cMap = null;

    const mapContainer = document.getElementById('complaint-map');
    if (mapContainer) {
        cMap = L.map('complaint-map').setView([12.9716, 77.5946], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(cMap);

        cMap.on('click', function(e) {
            mainMapLat = e.latlng.lat;
            mainMapLng = e.latlng.lng;
            if(mainMapMarker) cMap.removeLayer(mainMapMarker);
            mainMapMarker = L.marker([mainMapLat, mainMapLng]).addTo(cMap);
        });

        const mainGeoBtn = document.getElementById('geo-btn');
        if (mainGeoBtn) {
            mainGeoBtn.addEventListener('click', () => {
                const originalHtml = mainGeoBtn.innerHTML;
                mainGeoBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Locating...";
                if(navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            mainMapLat = pos.coords.latitude;
                            mainMapLng = pos.coords.longitude;
                            if(mainMapMarker) cMap.removeLayer(mainMapMarker);
                            mainMapMarker = L.marker([mainMapLat, mainMapLng]).addTo(cMap);
                            cMap.setView([mainMapLat, mainMapLng], 15);
                            mainGeoBtn.innerHTML = "<i class='bx bx-check'></i> Found!";
                            setTimeout(() => mainGeoBtn.innerHTML = originalHtml, 2000);
                        },
                        (err) => {
                            alert('Could not fetch GPS for main map.');
                            mainGeoBtn.innerHTML = originalHtml;
                        }
                    );
                }
            });
        }
    }

    // ==========================================
    // 3. Fetch & Render Citizen Complaints API
    // ==========================================
    
    let citTrendChart = null;
    let citAreaBarChart = null;
    let citStatusDonut = null;
    let citDailyLineChart = null;
    let citWastePieChart = null;

    function renderCitizenAnalytics(complaints) {
        // Build Data Variables
        let resolved = 0, pending = 0, inProgress = 0;
        const dateCounts = {};
        const areaCounts = { "Zone A": 12, "Zone B": 8, "Zone C": 19, "Zone D": 5 };

        complaints.forEach(c => {
            if (c.status === 'Resolved') resolved++;
            else if (c.status === 'In Progress') inProgress++;
            else pending++;

            if (c.createdAt) {
                const d = new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                dateCounts[d] = (dateCounts[d] || 0) + 1;
            }
            if (c.location && areaCounts[c.location]) areaCounts[c.location]++;
        });

        const labels = Object.keys(dateCounts).sort((a,b) => new Date(a) - new Date(b)).slice(-7);
        const dataPoints = labels.map(l => dateCounts[l]);

        // Rigorous Citizen Mathematics Overrides
        const totalValid = complaints.length;
        let wasteCollectedKg = totalValid * 40; 
        let totalTripsOptimized = resolved * 1.5;
        let co2Saved = wasteCollectedKg * 0.5;
        let fuelSaved = totalTripsOptimized * 0.2;
        let efficiency = totalValid === 0 ? 100 : Math.round((resolved / totalValid) * 100);

        let citWasteDom = document.getElementById('cit-waste-cleaned');
        if (citWasteDom) citWasteDom.innerText = (wasteCollectedKg / 1000).toFixed(1) + " Tons";
        
        let citActiveDom = document.getElementById('cit-active-comp');
        if (citActiveDom) citActiveDom.innerText = (pending + inProgress).toString();
        
        let citCleanDom = document.getElementById('cit-clean-score');
        if (citCleanDom) citCleanDom.innerText = efficiency + "%";
        
        let citCo2Dom = document.getElementById('cit-co2-saved');
        if (citCo2Dom) citCo2Dom.innerText = co2Saved.toFixed(0) + " kg";
        
        let citFuelDom = document.getElementById('cit-fuel-saved');
        if (citFuelDom) citFuelDom.innerText = fuelSaved.toFixed(0) + " L";
        
        let citRecycleDom = document.getElementById('cit-recycle-rate');
        if (citRecycleDom) citRecycleDom.innerText = efficiency > 50 ? "68%" : "42%";

        // 1. Home Overview - Trend Chart
        const ctxTrend = document.getElementById('cit-trend-chart');
        if (ctxTrend) {
            if (citTrendChart) citTrendChart.destroy();
            citTrendChart = new Chart(ctxTrend, {
                type: 'line',
                data: {
                    labels: labels.length ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Complaints',
                        data: dataPoints.length ? dataPoints : [2, 5, 3, 6, 2, 8, 4],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', stepSize: 2 } }
                    }
                }
            });
        }

        // 2. Reports - Area Bar Chart
        const ctxArea = document.getElementById('cit-area-bar-chart');
        if (ctxArea) {
            if (citAreaBarChart) citAreaBarChart.destroy();
            citAreaBarChart = new Chart(ctxArea, {
                type: 'bar',
                data: {
                    labels: Object.keys(areaCounts),
                    datasets: [{
                        label: 'Complaints',
                        data: Object.values(areaCounts),
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                    }
                }
            });
        }

        // 3. Reports - Status Donut
        const ctxStatus = document.getElementById('cit-status-donut');
        if (ctxStatus) {
            if (citStatusDonut) citStatusDonut.destroy();
            citStatusDonut = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Resolved', 'In Progress', 'Pending'],
                    datasets: [{
                        data: [resolved || 15, inProgress || 5, pending || 8],
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
                        borderWidth: 0, hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '70%',
                    plugins: { legend: { position: 'right', labels: { color: '#aaa', usePointStyle: true, boxWidth: 10 } } }
                }
            });
        }

        // 4. Reports - Daily Line Chart
        const ctxDaily = document.getElementById('cit-daily-line-chart');
        if (ctxDaily) {
            if (citDailyLineChart) citDailyLineChart.destroy();
            citDailyLineChart = new Chart(ctxDaily, {
                type: 'line',
                data: {
                    labels: labels.length ? labels : ['1st', '2nd', '3rd', '4th', '5th'],
                    datasets: [{
                        label: 'Reports',
                        data: dataPoints.length ? dataPoints : [5, 2, 7, 4, 1],
                        borderColor: '#f59e0b',
                        borderWidth: 2, tension: 0.3, pointRadius: 3
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                    scales: { x: { display: false }, y: { display: false } }
                }
            });
        }

        // 5. Reports - Waste Pie Chart
        const ctxWaste = document.getElementById('cit-waste-pie-chart');
        if (ctxWaste) {
            if (citWastePieChart) citWastePieChart.destroy();
            citWastePieChart = new Chart(ctxWaste, {
                type: 'pie',
                data: {
                    labels: ['Wet Waste', 'Dry Waste', 'E-Waste', 'Hazardous'],
                    datasets: [{
                        data: [45, 35, 12, 8],
                        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#aaa', usePointStyle: true, boxWidth: 8 } } }
                }
            });
        }
    }

    async function fetchCitizenComplaints() {
        const complaintsList = document.getElementById('complaints-list');
        if (!complaintsList) return;
        
        try {
            complaintsList.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="bx bx-loader-alt bx-spin" style="font-size: 24px;"></i></div>';
            
            const response = await fetch('http://localhost:8080/api/complaints');
            if(!response.ok) throw new Error('Failed to fetch');
            const allComplaints = await response.json();
            
            renderCitizenAnalytics(allComplaints);
            initMapboxTracking(allComplaints);

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

                let feedbackHtml = '';
                if (c.status === 'Resolved') {
                    if (c.feedback && c.feedback.rating) {
                        const stars = '⭐'.repeat(c.feedback.rating);
                        feedbackHtml = `
                            <div style="margin-top: 15px; padding: 12px; border-radius: 8px; background: rgba(16, 185, 129, 0.05); border: 1px dashed rgba(16, 185, 129, 0.3);">
                                <div style="font-size: 13px; font-weight: 600; color: #10b981; margin-bottom: 4px;">Feedback Submitted</div>
                                <div style="font-size: 15px; margin-bottom: 4px;">${stars}</div>
                                ${c.feedback.comment ? `<div style="font-size: 13px; color: var(--text-secondary); line-height: 1.4;">"${c.feedback.comment}"</div>` : ''}
                            </div>
                        `;
                    } else {
                        feedbackHtml = `
                            <div style="margin-top: 15px; padding: 12px; border-radius: 8px; background: rgba(59, 130, 246, 0.05); border: 1px solid var(--glass-border);">
                                <div style="font-size: 13px; font-weight: 500; color: var(--text-primary); margin-bottom: 8px;">Rate this resolution:</div>
                                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px;">
                                    <select id="rating-${c._id}" style="padding: 6px; border-radius: 6px; border: 1px solid var(--glass-border); background: var(--glass-bg); color: var(--text-primary); outline: none;">
                                        <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                                        <option value="4">⭐⭐⭐⭐ Good</option>
                                        <option value="3">⭐⭐⭐ Average</option>
                                        <option value="2">⭐⭐ Poor</option>
                                        <option value="1">⭐ Terrible</option>
                                    </select>
                                </div>
                                <textarea id="comment-${c._id}" placeholder="Optional comment..." rows="2" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--glass-border); background: var(--glass-bg); color: var(--text-primary); font-family: 'Outfit', sans-serif; font-size: 13px; resize: none; margin-bottom: 8px; outline: none;"></textarea>
                                <button type="button" class="submit-feedback-btn" data-id="${c._id}" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.3s;">Submit Feedback</button>
                            </div>
                        `;
                    }
                }

                const html = `
                    <div class="complaint-item" style="animation: fadeIn 0.5s ease;">
                        <div class="c-header">
                            <span class="c-id" style="font-size: 13px; color: var(--text-secondary); font-weight: 500;"><i class='bx bx-time'></i> ${dateStr}</span>
                            <span class="badge ${badgeClass}">${badgeText}</span>
                        </div>
                        <h4 style="margin-top: 10px;">${c.title}</h4>
                        <p class="c-desc">${c.description}</p>
                        ${imageHtml}
                        ${feedbackHtml}
                    </div>
                `;
                complaintsList.insertAdjacentHTML('beforeend', html);
            });

            // Bind explicitly created Feedback submission buttons natively
            const feedbackBtns = complaintsList.querySelectorAll('.submit-feedback-btn');
            feedbackBtns.forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.getAttribute('data-id');
                    const ratingSelect = document.getElementById(`rating-${id}`);
                    const commentArea = document.getElementById(`comment-${id}`);
                    
                    if(!ratingSelect) return;
                    
                    const ratingVal = ratingSelect.value;
                    const commentVal = commentArea ? commentArea.value.trim() : "";

                    this.textContent = 'Submitting...';
                    this.disabled = true;

                    try {
                        const res = await fetch(`http://localhost:8080/api/complaints/${id}/feedback`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ rating: Number(ratingVal), comment: commentVal })
                        });
                        
                        if (res.ok) {
                            fetchCitizenComplaints(); // Dynamic reload injecting the immutable visual stars inherently!
                        } else {
                            throw new Error("Failed to submit");
                        }
                    } catch (err) {
                        alert("Error submitting feedback. Please try again.");
                        this.textContent = 'Submit Feedback';
                        this.disabled = false;
                    }
                });
            });
        } catch(err) {
            complaintsList.innerHTML = '<p style="text-align: center; color: #ef4444;">Failed to connect to backend.</p>';
        }
    }

    // Run initial render
    fetchCitizenComplaints();

    // ==========================================
    // 4. Modal-Based Complaint Submission Flow
    // ==========================================
    const complaintForm = document.getElementById('complaint-form');
    const popupModal = document.getElementById('citizen-popup-modal');
    const closeModal = document.getElementById('close-citizen-modal');
    
    const modalFileInput = document.getElementById('modal-file');
    const modalFileName = document.getElementById('modal-file-name');
    const modalGeoBtn = document.getElementById('modal-geo-btn');
    const modalCoordsDisplay = document.getElementById('modal-coords-display');
    const modalLatVal = document.getElementById('modal-lat-val');
    const modalLngVal = document.getElementById('modal-lng-val');
    const modalConfirmBtn = document.getElementById('modal-confirm-submit');

    let cachedTitle = "";
    let cachedDesc = "";
    
    let modalBase64Image = null;
    let modalLat = null;
    let modalLng = null;

    if (complaintForm && popupModal) {
        
        // 1. Initial Submit intercepts variables and launches Modal
        complaintForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const categorySelect = complaintForm.querySelector('select');
            const categoryText = categorySelect.options[categorySelect.selectedIndex].text;
            const locationVal = complaintForm.querySelector('#location-text').value;
            cachedDesc = complaintForm.querySelector('textarea').value;
            
            cachedTitle = categoryText + " at " + locationVal;
            
            // Decouple explicitly: Force Modal Maps to require secondary input flawlessly
            modalLat = null;
            modalLng = null;
            if (window.modalMarker && window.citizenPopupMap) {
                window.citizenPopupMap.removeLayer(window.modalMarker);
                window.modalMarker = null;
            }
            if (modalCoordsDisplay) modalCoordsDisplay.style.display = 'none';
            if (modalGeoBtn) {
                modalGeoBtn.innerHTML = "<i class='bx bx-target-lock'></i> Use My Current Location";
                modalGeoBtn.style.background = "rgba(16, 185, 129, 0.1)";
                modalGeoBtn.style.color = "#10b981";
                modalGeoBtn.style.border = "1px solid rgba(16, 185, 129, 0.3)";
            }
            
            popupModal.style.display = 'flex';
            
            // Initialize Localized Map Layout identically but neutrally
            if(!window.citizenPopupMap) {
                window.citizenPopupMap = L.map('citizen-modal-map').setView([12.9716, 77.5946], 13);
                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(window.citizenPopupMap);
                
                window.citizenPopupMap.on('click', function(e) {
                    modalLat = e.latlng.lat;
                    modalLng = e.latlng.lng;
                    if(window.modalMarker) window.citizenPopupMap.removeLayer(window.modalMarker);
                    window.modalMarker = L.marker([modalLat, modalLng]).addTo(window.citizenPopupMap);
                    if(modalLatVal) {
                        modalLatVal.textContent = modalLat.toFixed(5);
                        modalLngVal.textContent = modalLng.toFixed(5);
                        modalCoordsDisplay.style.display = 'block';
                    }
                });
            }
            
            setTimeout(() => {
                if(window.citizenPopupMap) {
                    window.citizenPopupMap.invalidateSize();
                    window.citizenPopupMap.setView([12.9716, 77.5946], 13);
                }
            }, 300);
        });

        // 2. Modal File Image Picker
        if (modalFileInput) {
            modalFileInput.addEventListener('change', function() {
                if (this.files && this.files.length > 0) {
                    const file = this.files[0];
                    modalFileName.textContent = file.name;
                    const reader = new FileReader();
                    reader.onload = (ev) => { modalBase64Image = ev.target.result; };
                    reader.readAsDataURL(file);
                }
            });
        }

        // 3. Modal Browser Geolocation Capture
        if (modalGeoBtn) {
            modalGeoBtn.addEventListener('click', () => {
                modalGeoBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Locating...";
                modalGeoBtn.disabled = true;

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            modalLat = position.coords.latitude;
                            modalLng = position.coords.longitude;
                            
                            modalLatVal.textContent = modalLat.toFixed(5);
                            modalLngVal.textContent = modalLng.toFixed(5);
                            modalCoordsDisplay.style.display = 'block';
                            
                            if(window.modalMarker && window.citizenPopupMap) window.citizenPopupMap.removeLayer(window.modalMarker);
                            if(window.citizenPopupMap) {
                                window.modalMarker = L.marker([modalLat, modalLng]).addTo(window.citizenPopupMap);
                                window.citizenPopupMap.setView([modalLat, modalLng], 15);
                            }

                            modalGeoBtn.innerHTML = "<i class='bx bx-check'></i> Location Grabbed";
                            modalGeoBtn.style.background = "rgba(16, 185, 129, 0.1)";
                            modalGeoBtn.style.color = "#10b981";
                            modalGeoBtn.style.border = "1px solid rgba(16, 185, 129, 0.3)";
                            setTimeout(() => { modalGeoBtn.disabled = false; }, 2000);
                        },
                        (error) => {
                            alert("Could not fetch geolocation automatically.");
                            modalGeoBtn.innerHTML = "<i class='bx bx-target-lock'></i> Use My Current Location";
                            modalGeoBtn.disabled = false;
                        }, 
                        { enableHighAccuracy: true }
                    );
                } else {
                    alert("Geolocation is not supported by your browser.");
                    modalGeoBtn.innerHTML = "<i class='bx bx-target-lock'></i> Use My Current Location";
                    modalGeoBtn.disabled = false;
                }
            });
        }

        // 4. Modal Final Backend API Construction
        if (modalConfirmBtn) {
            modalConfirmBtn.addEventListener('click', async () => {
                if (!modalBase64Image) {
                    alert("Error: Please attach an image proof before submitting.");
                    return;
                }
                if (!modalLat || !modalLng) {
                    alert("Error: Please capture your exact GPS coordinates.");
                    return;
                }

                const originalBtnText = modalConfirmBtn.innerHTML;
                modalConfirmBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Submitting...";
                modalConfirmBtn.disabled = true;

                try {
                    const response = await fetch('http://localhost:8080/api/complaints', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: cachedTitle,
                            description: cachedDesc,
                            image: modalBase64Image,
                            lat: modalLat,
                            lng: modalLng
                        })
                    });

                    if(!response.ok) throw new Error('Failed to submit');

                    modalConfirmBtn.innerHTML = "Submitted ✓";
                    complaintForm.reset();
                    
                    fetchCitizenComplaints(); // Dynamically insert list item

                    setTimeout(() => {
                        popupModal.style.display = 'none';

                        // Reset internal variables for next submission cleanly
                        modalConfirmBtn.innerHTML = "Confirm Submission <i class='bx bx-send'></i>";
                        modalConfirmBtn.disabled = false;
                        modalGeoBtn.innerHTML = "<i class='bx bx-target-lock'></i> Use My Current Location";
                        modalGeoBtn.style.background = "rgba(16, 185, 129, 0.1)";
                        modalGeoBtn.style.color = "#10b981";
                        modalGeoBtn.style.border = "1px solid rgba(16, 185, 129, 0.3)";
                        modalGeoBtn.style.border = "1px solid rgba(16, 185, 129, 0.3)";
                        modalCoordsDisplay.style.display = 'none';
                        if(window.modalMarker && window.citizenPopupMap) window.citizenPopupMap.removeLayer(window.modalMarker);
                        
                        modalFileName.textContent = 'No file chosen';
                        modalFileInput.value = '';
                        modalBase64Image = null;
                        
                        mainMapLat = null;
                        mainMapLng = null;
                        if(mainMapMarker && cMap) cMap.removeLayer(mainMapMarker);
                        
                        modalLat = null;
                        modalLng = null;
                    }, 1000);

                } catch(err) {
                    alert("Failed to confirm complaint submission to API.");
                    modalConfirmBtn.innerHTML = originalBtnText;
                    modalConfirmBtn.disabled = false;
                }
            });
        }

        // 5. Close window explicitly
        if (closeModal) {
            closeModal.addEventListener('click', () => { popupModal.style.display = 'none'; });
        }
    }

    // ==========================================
    // 5. Mapbox Live Tracking Engine
    // ==========================================
    window.mapboxLiveMap = null;
    window.mapboxHomeMap = null;
    let mapboxComplaintMarkers = [];

    async function initMapboxTracking(complaintsList) {
        if (!window.mapboxLiveMap) {
            mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';
            const USER_LOC = [77.635, 12.965]; 

            const mapContainer = document.getElementById('mapbox-live-map');
            if (mapContainer) {
                window.mapboxLiveMap = new mapboxgl.Map({
                    container: 'mapbox-live-map',
                    style: 'mapbox://styles/mapbox/navigation-night-v1',
                    center: [77.74, 12.97],
                    zoom: 15.5,
                    pitch: 45,
                    bearing: -10
                });

                // Home map completely removed natively as per Smart Dashboard design constraints.

                // Navigation helpers
                function dist(a,b){ return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2); }
                function nearest(point, list){
                    if(list.length === 0) return null;
                    let best = list[0]; let d = dist(point, best.coords);
                    for(let i=1;i<list.length;i++){
                        let curD = dist(point, list[i].coords);
                        if(curD < d){ d = curD; best = list[i]; }
                    }
                    return best;
                }
                function sequencePoints(points) {
                    if(points.length <= 1) return points;
                    let seq = [points[0]]; let unvisited = points.slice(1);
                    while(unvisited.length > 0) {
                        let last = seq[seq.length - 1]; let nearestIdx = 0; let minDist = dist(last, unvisited[0]);
                        for(let i=1; i<unvisited.length; i++) {
                            let d = dist(last, unvisited[i]);
                            if(d < minDist) { minDist = d; nearestIdx = i; }
                        }
                        seq.push(unvisited.splice(nearestIdx, 1)[0]);
                    }
                    return seq;
                }
                async function getFullRoute(points) {
                    if(points.length < 2) return null;
                    let coordinates = [];
                    for(let i = 0; i < points.length - 1; i += 24) {
                        let chunk = points.slice(i, Math.min(i + 25, points.length));
                        let coordsStr = chunk.map(p => p[0]+","+p[1]).join(";");
                        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsStr}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
                        try {
                            const res = await fetch(url); const data = await res.json();
                            if(data.routes && data.routes.length > 0) {
                                let r = data.routes[0];
                                if(coordinates.length === 0) coordinates.push(...r.geometry.coordinates);
                            else coordinates.push(...r.geometry.coordinates.slice(1));
                            }
                        } catch(e) {}
                        await new Promise(r => setTimeout(r, 200));
                    }
                    return { geometry: { type: "LineString", coordinates } };
                }

                // Unblock Simulation Hook (Fetch outside hidden map contexts!)
                let wasteData, dwccData, plantData, areasData;
                try {
                    const res = await Promise.all([
                        fetch('../map-data/waste_points.geojson').then(r=>r.json()),
                        fetch('../map-data/BBMP_Dry_Waste_Collection_Centres.geojson').then(r=>r.json()),
                        fetch('../map-data/waste_processing_units.geojson').then(r=>r.json()),
                        fetch('../dashboard/areas.geojson').then(r=>r.json())
                    ]);
                    wasteData = res[0]; dwccData = res[1]; plantData = res[2]; areasData = res[3];
                } catch(err) { console.error("Error loading Mapbox GeoJSON data", err); }

                // Vehicles Data Extraction & Initialization
                const plants = plantData && plantData.features ? plantData.features.map(f => ({ coords: f.geometry.coordinates.slice(0,2) })) : [];
                const pccs = dwccData && dwccData.features ? dwccData.features.map(f => ({ coords: f.geometry.coordinates.slice(0,2) })) : [];
                const colonyPointsWet = []; const colonyPointsDry = [];
                const indPointsWet = []; const indPointsDry = []; const aptPointsDry = [];

                if (wasteData && wasteData.features) {
                    wasteData.features.forEach((f, idx) => {
                        const coords = f.geometry.coordinates; const pt = f.properties.place_type; const name = (f.properties.name || "").toLowerCase();
                        let category = "colony"; 
                        if (pt === "industrial") category = "industrial";
                        else if (name.includes("apartment") || name.includes("villa") || name.includes("heights")) category = "apartment";
                        if (category === "colony") { if(idx%2===0) colonyPointsWet.push(coords); else colonyPointsDry.push(coords); }
                        else if (category === "industrial") { if(idx%2===0) indPointsWet.push(coords); else indPointsDry.push(coords); }
                        else if (category === "apartment") { aptPointsDry.push(coords); }
                    });
                }

                let runVehicles = [
                    { id: "v1", icon: '🛺', type: "auto", waste: "wet", color: "#10b981", points: sequencePoints(colonyPointsWet), destType: "plant" },
                    { id: "v2", icon: '🛺', type: "auto", waste: "dry", color: "#3b82f6", points: sequencePoints(colonyPointsDry), destType: "dwcc" },
                    { id: "v3", icon: '🚛', type: "truck", waste: "wet", color: "#10b981", points: sequencePoints(indPointsWet), destType: "plant" },
                    { id: "v4", icon: '🚛', type: "truck", waste: "dry", color: "#3b82f6", points: sequencePoints(indPointsDry), destType: "dwcc" },
                    { id: "v5", icon: '🚛', type: "truck", waste: "dry", color: "#3b82f6", points: sequencePoints(aptPointsDry), destType: "dwcc" }
                ];

                for(let v of runVehicles) {
                    if(v.points.length === 0) continue;
                    let lastPoint = v.points[v.points.length - 1]; let destList = v.destType === "plant" ? plants : pccs;
                    let dest = nearest(lastPoint, destList); if(dest) v.points.push(dest.coords);
                    v.routeInfo = await getFullRoute(v.points);
                    if(!v.routeInfo || v.routeInfo.geometry.coordinates.length === 0) continue;

                    let wrapper = document.createElement('div');
                    wrapper.innerHTML = `<div style="background:${v.color}; border:2px solid #fff; border-radius:${v.type==='auto'?'50%':'4px'}; width:${v.type==='auto'?'25px':'38px'}; height:${v.type==='auto'?'25px':'38px'}; display:flex; align-items:center; justify-content:center; font-size:${v.type==='auto'?'14px':'22px'}; box-shadow:0 0 15px 5px ${v.color};">${v.icon}</div>`;
                    v.marker = new mapboxgl.Marker({element: wrapper}).setLngLat(v.points[0]).addTo(window.mapboxLiveMap);
                        
                    v.currentDist = 0; v.currentSpeed = 0; v.visitedIdx = 0; v.isPaused = false;
                    v.maxSpeed = v.type === 'auto' ? 0.00035 : 0.0005; v.accel = v.type === 'auto' ? 0.00001 : 0.000004; v.decel = v.type === 'auto' ? 0.000015 : 0.000008;
                    v.line = turf.lineString(v.routeInfo.geometry.coordinates); v.totalDist = turf.length(v.line, {units: 'kilometers'});

                    v.legDists = [];
                    for(let i=1; i<v.points.length-1; i++) { let snapped = turf.nearestPointOnLine(v.line, turf.point(v.points[i])); v.legDists.push(snapped.properties.location); }
                    v.legDists.sort((a,b)=>a-b);
                }
                
                // Citizen Marker Hook cleanly locking drag behaviors
                let citizenWrapper = document.createElement('div');
                citizenWrapper.innerHTML = `<div style="width: 25px; height: 25px; border-radius: 50%; background: rgba(239, 68, 68, 0.2); display: flex; align-items: center; justify-content: center; border: 2px dashed #ef4444;"><div style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%; box-shadow: 0 0 10px #ef4444;"></div></div>`;
                
                let citizenMarker = new mapboxgl.Marker({ element: citizenWrapper, draggable: true }).setLngLat([77.74, 12.97]).addTo(window.mapboxLiveMap);
                document.getElementById('eta-panel').style.display = 'block';

                function setupLiveMapData() {
                    // Setup Setup true-route ETA Polylines natively binding Dashboard styles
                    if(!window.mapboxLiveMap.getSource('eta-wet-line')) {
                        window.mapboxLiveMap.addSource('eta-wet-line', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
                        window.mapboxLiveMap.addSource('eta-dry-line', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
                        window.mapboxLiveMap.addLayer({ id: 'eta-wet-line', type: 'line', source: 'eta-wet-line', paint: { 'line-color': '#10b981', 'line-width': 4, 'line-opacity': 0.9 } });
                        window.mapboxLiveMap.addLayer({ id: 'eta-dry-line', type: 'line', source: 'eta-dry-line', paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 0.9 } });
                        
                        // Dotted connecting lines mapping the final snap geometry perfectly
                        window.mapboxLiveMap.addSource('eta-wet-connect', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
                        window.mapboxLiveMap.addSource('eta-dry-connect', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
                        window.mapboxLiveMap.addLayer({ id: 'eta-wet-connect', type: 'line', source: 'eta-wet-connect', paint: { 'line-color': '#10b981', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.6 } });
                        window.mapboxLiveMap.addLayer({ id: 'eta-dry-connect', type: 'line', source: 'eta-dry-connect', paint: { 'line-color': '#3b82f6', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.6 } });
                    }

                    if(wasteData && wasteData.features) {
                        wasteData.features.forEach(f => {
                            new mapboxgl.Marker({ color: '#f97316' }).setLngLat(f.geometry.coordinates).setPopup(new mapboxgl.Popup({offset: 15}).setText(f.properties.name || "Waste Point")).addTo(window.mapboxLiveMap);
                        });
                    }
                    if(dwccData && dwccData.features) {
                        dwccData.features.forEach(f => {
                            new mapboxgl.Marker({ color: '#3b82f6' }).setLngLat(f.geometry.coordinates).setPopup(new mapboxgl.Popup({offset: 15}).setText(f.properties.Name || "DWCC")).addTo(window.mapboxLiveMap);
                        });
                    }
                    if(plantData && plantData.features) {
                        plantData.features.forEach(f => {
                            new mapboxgl.Marker({ color: '#10b981' }).setLngLat(f.geometry.coordinates).setPopup(new mapboxgl.Popup({offset: 15}).setText(f.properties.Name || "Plant")).addTo(window.mapboxLiveMap);
                        });
                    }
                }

                if (window.mapboxLiveMap.isStyleLoaded()) setupLiveMapData(); else window.mapboxLiveMap.on('load', setupLiveMapData);

                // Engine core running interpolation natively generating smooth trajectories cleanly
                setInterval(() => {
                    let citizenCoords = citizenMarker.getLngLat();
                    let minWetEtaDist = Infinity, nearestWetInfo = null;
                    let minDryEtaDist = Infinity, nearestDryInfo = null;

                    for(let v of runVehicles) {
                        if(!v.marker || !v.routeInfo || v.routeInfo.geometry.coordinates.length < 2) continue;
                        
                        if (!v.targetIdx) v.targetIdx = 1;
                        let currentLoc = v.marker.getLngLat();
                        
                        let targetLocArray = v.routeInfo.geometry.coordinates[v.targetIdx];
                        if (!targetLocArray) { v.targetIdx = 1; targetLocArray = v.routeInfo.geometry.coordinates[1]; }
                        let targetLng = targetLocArray[0]; let targetLat = targetLocArray[1];

                        // Smooth Mathematical Easing explicitly requested
                        let newLng = currentLoc.lng + (targetLng - currentLoc.lng) * 0.05;
                        let newLat = currentLoc.lat + (targetLat - currentLoc.lat) * 0.05;
                        
                        let degDist = Math.sqrt(Math.pow(targetLat - newLat, 2) + Math.pow(targetLng - newLng, 2));
                        if(degDist < 0.0001 && v.targetIdx < v.routeInfo.geometry.coordinates.length - 1) {
                            v.targetIdx++;
                        }
                        
                        v.marker.setLngLat([newLng, newLat]);
                        
                        // Euclidean Distance Alert Proximity logic explicitly requested
                        let distToCitizen = Math.sqrt(Math.pow(citizenCoords.lat - newLat, 2) + Math.pow(citizenCoords.lng - newLng, 2));
                        
                        // Calculate metrics for drawing routes and alerts natively
                        if (v.waste === 'wet' && distToCitizen < minWetEtaDist) {
                            minWetEtaDist = distToCitizen;
                            nearestWetInfo = { vehicle: v, loc: [newLng, newLat], dist: distToCitizen };
                        }
                        if (v.waste === 'dry' && distToCitizen < minDryEtaDist) {
                            minDryEtaDist = distToCitizen;
                            nearestDryInfo = { vehicle: v, loc: [newLng, newLat], dist: distToCitizen };
                        }
                    }

                    if(nearestWetInfo) {
                        let km = nearestWetInfo.dist * 111.32; // basic degree to km conversion
                        document.getElementById('eta-wet-dist').innerHTML = `<i class='bx bx-trip'></i> ${km.toFixed(2)} km`;
                        let wetMins = Math.max(1, Math.round((km / 20) * 60));
                        document.getElementById('eta-wet-time').innerHTML = (km < 0.015) ? '<span style="color:var(--success); font-weight:700;">Arriving Now!</span>' : wetMins + ' mins';
                        
                        // Visualize dynamic straight line from vehicle to Citizen explicitly mimicking Route Path organically
                        if (window.mapboxLiveMap.getSource('eta-wet-line')) window.mapboxLiveMap.getSource('eta-wet-line').setData(turf.lineString([nearestWetInfo.loc, [citizenCoords.lng, citizenCoords.lat]]));
                    }
                    if(nearestDryInfo) {
                        let km = nearestDryInfo.dist * 111.32;
                        document.getElementById('eta-dry-dist').innerHTML = `<i class='bx bx-trip'></i> ${km.toFixed(2)} km`;
                        let dryMins = Math.max(1, Math.round((km / 20) * 60));
                        document.getElementById('eta-dry-time').innerHTML = (km < 0.015) ? '<span style="color:var(--success); font-weight:700;">Arriving Now!</span>' : dryMins + ' mins';
                        
                        if (window.mapboxLiveMap.getSource('eta-dry-line')) window.mapboxLiveMap.getSource('eta-dry-line').setData(turf.lineString([nearestDryInfo.loc, [citizenCoords.lng, citizenCoords.lat]]));
                    }

                }, 50); // setInterval matching native mathematical looping constraints
            }
        }
    }

});
