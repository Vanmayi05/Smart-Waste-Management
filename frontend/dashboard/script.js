function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

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

                // Native Map Instance Singleton Transport
                const mapEl = document.getElementById('map');
                if (mapEl) {
                    if (targetId === 'page-dashboard') {
                        const container = document.querySelector('#page-dashboard .map-container');
                        if (container && !container.contains(mapEl)) {
                            mapEl.style.height = '500px';
                            container.appendChild(mapEl);
                        }
                    } else if (targetId === 'page-map') {
                        const container = document.querySelector('#page-map .glass-card');
                        if(container && !container.contains(mapEl)) {
                            const placeholder = container.querySelector('.placeholder-content');
                            if(placeholder) placeholder.style.display = 'none';
                            container.style.padding = '0';
                            container.style.height = 'calc(100vh - 140px)';
                            mapEl.style.height = '100%';
                            container.appendChild(mapEl);
                        }
                    } else if (targetId === 'page-vehicles') {
                        const container = document.getElementById('vehicles-map-container');
                        if(container && !container.contains(mapEl)) {
                            mapEl.style.height = '100%';
                            mapEl.style.width = '100%';
                            mapEl.style.borderRadius = '12px';
                            mapEl.style.position = 'absolute';
                            container.appendChild(mapEl);
                        }
                    }

                    if (typeof dashboardMap !== 'undefined' && dashboardMap) {
                        setTimeout(() => dashboardMap.resize(), 100);
                        if (typeof window.updateMapContext === 'function') window.updateMapContext(targetId);
                    }
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
    // 3. Alerts Action Click Behaviors & Full Screen Toggle
    // ==========================================
    
    window.updateMapContext = function(pageId) {
        if (typeof dashboardMap === 'undefined' || !dashboardMap) return;
        if (pageId === 'page-vehicles') {
            if (complaintMarkersGroup) complaintMarkersGroup.forEach(m => { if(m.marker && m.marker._element) m.marker._element.style.display = 'none'; });
            if (facilitiesMarkersGroup) facilitiesMarkersGroup.forEach(m => { if(m._element) m._element.style.display = 'none'; });
            if (vehiclesConfig) vehiclesConfig.forEach(v => { if(v.marker && v.marker._element) v.marker._element.style.display = 'block'; });
        } else {
            if (complaintMarkersGroup) complaintMarkersGroup.forEach(m => { if(m.marker && m.marker._element) m.marker._element.style.display = 'block'; });
            if (facilitiesMarkersGroup) facilitiesMarkersGroup.forEach(m => { if(m._element) m._element.style.display = 'block'; });
            if (vehiclesConfig) vehiclesConfig.forEach(v => { if(v.marker && v.marker._element) v.marker._element.style.display = 'block'; });
        }
    };

    const fsToggleBtn = document.getElementById('toggle-fullscreen-map');
    if (fsToggleBtn) {
        fsToggleBtn.addEventListener('click', () => {
            const mapContainer = document.getElementById('vehicles-map-container');
            if (!document.fullscreenElement) {
                mapContainer.requestFullscreen().catch(err => alert("Fullscreen error: " + err.message));
                fsToggleBtn.innerHTML = "<i class='bx bx-exit-fullscreen'></i> Exit Full Screen";
            } else {
                document.exitFullscreen();
                fsToggleBtn.innerHTML = "<i class='bx bx-fullscreen'></i> Full Screen Map";
            }
        });
        
        document.addEventListener('fullscreenchange', () => {
            setTimeout(() => { if (dashboardMap) dashboardMap.resize(); }, 150);
            if (!document.fullscreenElement) fsToggleBtn.innerHTML = "<i class='bx bx-fullscreen'></i> Full Screen Map";
        });
    }

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
    // 5. Admin Complaints Table, API Fetching & Searching
    // ==========================================
    
    let allComplaintsData = [];
    let dashboardMap = null;
    let complaintMarkersGroup = [];
    let facilitiesMarkersGroup = [];
    let admTimelineChart = null;
    let admStatusChart = null;
    let admAreaBarChart = null;
    let admFleetPieChart = null;
    
    let adminResolveId, adminResolveCmpLat, adminResolveCmpLng, adminResolveBase64Image, adminResolveLat, adminResolveLng;

    async function fetchComplaints() {
        const tbody = document.getElementById('admin-complaints-tbody');
        if (!tbody) return;

        try {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;"><i class="bx bx-loader-alt bx-spin" style="font-size: 24px;"></i><br><span style="color: var(--text-secondary); margin-top: 8px; display: inline-block;">Loading complaints...</span></td></tr>';
            
            const response = await fetch('http://localhost:8080/api/complaints');
            if (!response.ok) throw new Error('API Error');
            allComplaintsData = await response.json();
            
            renderComplaintsList(allComplaintsData);
            renderAnalyticsCharts(allComplaintsData);
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 20px;">Could not connect to the Backend API. Ensure the server is running on port 8080.</td></tr>';
        }
    }

    function renderComplaintsList(complaintsList) {
        const tbody = document.getElementById('admin-complaints-tbody');
        if (!tbody) return;

        if (complaintMarkersGroup && complaintMarkersGroup.length > 0) {
            complaintMarkersGroup.forEach(m => m.remove());
            complaintMarkersGroup = [];
        }

        tbody.innerHTML = '';

        if (!complaintsList || complaintsList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 40px;">No complaints found.</td></tr>';
            return;
        }

        complaintsList.forEach(c => {
            const tr = document.createElement('tr');
            const dateRaw = new Date(c.createdAt);
            const dateStr = dateRaw.toLocaleDateString() + ' ' + dateRaw.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let badgeStyle = '';
            if(c.status === 'Pending') badgeStyle = 'background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);';
            else if(c.status === 'In Progress') badgeStyle = 'background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);';
            else if(c.status === 'Resolved') badgeStyle = 'background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);';
            else badgeStyle = 'background: rgba(255, 255, 255, 0.1); color: #fff;';

            const badgeHtml = `<span style="padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; ${badgeStyle}">${c.status}</span>`;

            const resolveBtnHtml = c.status !== 'Resolved' 
                ? `<button class="action-btn resolve-btn" data-id="${c._id}" data-lat="${c.lat}" data-lng="${c.lng}" style="background: var(--success); border-color: var(--success); color: white; padding: 6px 12px; font-size: 13px; cursor: pointer; border-radius: 8px; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);">Resolve ✓</button>`
                : `<span style="color: var(--success); font-weight: 600; font-size: 14px;"><i class='bx bx-check-double'></i> Closed</span>`;

            const thumbnailHtml = c.image 
                ? `<img src="${c.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 1px solid var(--glass-border);" title="Click to view full image" onclick="document.getElementById('modal-image').src=this.src; document.getElementById('image-modal').style.display='flex';">`
                : `<div style="width: 50px; height: 50px; background: rgba(255,255,255,0.05); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);"><i class='bx bx-image'></i></div>`;

            let feedbackAdminHtml = '';
            if (c.feedback && c.feedback.rating) {
                const stars = '⭐'.repeat(c.feedback.rating);
                feedbackAdminHtml = `<div style="margin-top: 8px; padding: 6px 10px; background: rgba(16, 185, 129, 0.05); border-left: 2px solid #10b981; border-radius: 0 4px 4px 0; font-size: 12px; white-space: normal;">
                    <span style="font-size: 10px; font-weight: 600; color: #10b981; display: block; margin-bottom: 2px;">CITIZEN FEEDBACK</span>
                    ${stars} ${c.feedback.comment ? `<span style="color: var(--text-secondary); margin-left: 5px;">"${c.feedback.comment}"</span>` : ''}
                </div>`;
            }

            let resolutionProofHtml = '';
            if (c.status === 'Resolved' && c.resolutionImage) {
                resolutionProofHtml = `<div style="margin-top: 8px; padding: 6px 10px; background: rgba(59, 130, 246, 0.05); border-left: 2px solid #3b82f6; border-radius: 0 4px 4px 0; font-size: 12px; white-space: normal;">
                    <span style="font-size: 10px; font-weight: 600; color: #3b82f6; display: block; margin-bottom: 4px;"><i class='bx bx-target-lock'></i> RESOLUTION PROOF (Verified GPS)</span>
                    <span style="display: block; font-size: 11px; color: var(--text-secondary); margin-bottom: 2px;"><b>Citizen Location:</b> ${c.lat ? c.lat.toFixed(5) : 'N/A'}, ${c.lng ? c.lng.toFixed(5) : 'N/A'}</span>
                    <span style="display: block; font-size: 11px; color: var(--text-secondary); margin-bottom: 6px;"><b>Resolution Location:</b> ${c.resolutionLat ? c.resolutionLat.toFixed(5) : 'N/A'}, ${c.resolutionLng ? c.resolutionLng.toFixed(5) : 'N/A'}</span>
                    <img src="${c.resolutionImage}" style="height: 50px; border-radius: 6px; border: 1px solid var(--glass-border); cursor: pointer;" onclick="document.getElementById('modal-image').src=this.src; document.getElementById('image-modal').style.display='flex';">
                </div>`;
            }

            tr.innerHTML = `
                <td style="color: var(--text-secondary); font-size: 13px;">${dateStr}</td>
                <td>${thumbnailHtml}</td>
                <td style="font-weight: 600; color: var(--text-primary);">${c.title}</td>
                <td style="max-width: 250px; white-space: normal; overflow: hidden; text-overflow: ellipsis; color: var(--text-secondary);" title="${c.description}">
                    ${c.description}
                    ${resolutionProofHtml}
                    ${feedbackAdminHtml}
                </td>
                <td>${badgeHtml}</td>
                <td>${resolveBtnHtml}</td>
            `;

            // Plot Map Marker
            if (c.lat && c.lng && dashboardMap) {
                let iconHtml = "<div style='width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);";
                if(c.status === 'Resolved') iconHtml += " background: #10b981;'><i class='bx bx-check'></i></div>";
                else if (c.status === 'In Progress') iconHtml += " background: #3b82f6;'><i class='bx bx-loader-alt bx-spin'></i></div>";
                else iconHtml += " background: #f59e0b;'><i class='bx bx-error'></i></div>";
                
                let el = document.createElement('div');
                el.innerHTML = iconHtml;

                const marker = new mapboxgl.Marker({element: el}).setLngLat([c.lng, c.lat]).addTo(dashboardMap);
                marker.complaintStatus = c.status;
                marker.setPopup(new mapboxgl.Popup({offset: 15}).setHTML(`
                    <div style="font-family: 'Outfit', sans-serif; text-align: center;">
                        <span style="font-size: 11px; color: #888;">#TKT-${c._id.substring(18).toUpperCase()}</span><br>
                        <b>${c.title}</b><br>
                        <span style="font-size: 12px; color: #666;">${c.status}</span>
                    </div>
                `));
                c.mapMarker = marker;
                complaintMarkersGroup.push(marker);
            }

            // Bind click to auto-zoom
            tr.style.cursor = 'pointer';
            tr.classList.add('hoverable-row');
            tr.onmouseenter = function() { this.style.backgroundColor = 'rgba(255,255,255,0.02)'; };
            tr.onmouseleave = function() { this.style.backgroundColor = ''; };
            
            tr.addEventListener('click', (e) => {
                if(e.target.tagName.toLowerCase() === 'button' || e.target.tagName.toLowerCase() === 'img') return;
                
                if (c.lat && c.lng && dashboardMap) {
                    dashboardMap.flyTo({ center: [c.lng, c.lat], zoom: 16, duration: 1200 });
                    if (c.mapMarker && c.mapMarker.getPopup()) {
                        setTimeout(() => { if(!c.mapMarker.getPopup().isOpen()) c.mapMarker.togglePopup(); }, 1200);
                    }
                    const mapEl = document.getElementById('map');
                    if(mapEl) mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });

            tbody.appendChild(tr);
        });

        // ==========================================
        // 🔹 5B. Admin Modal Geolocation Verification Flow
        // ==========================================
        const resolveBtns = document.querySelectorAll('.resolve-btn');
        const adminModal = document.getElementById('admin-popup-modal');
        const closeAdminModal = document.getElementById('close-admin-modal');
        
        const adminModalFileInput = document.getElementById('admin-modal-file');
        const adminModalFileName = document.getElementById('admin-modal-file-name');
        
        const adminModalGeoBtn = document.getElementById('admin-modal-geo-btn');
        const adminModalCoordsDisplay = document.getElementById('admin-modal-coords-display');
        const adminModalLatVal = document.getElementById('admin-modal-lat-val');
        const adminModalLngVal = document.getElementById('admin-modal-lng-val');
        
        const adminModalConfirmBtn = document.getElementById('admin-modal-confirm-submit');

        // Dynamic State Caches
        adminResolveId = null;
        adminResolveCmpLat = null;
        adminResolveCmpLng = null;
        
        adminResolveBase64Image = null;
        adminResolveLat = null;
        adminResolveLng = null;

        // 1. Initial Resolution Button Intercept
        resolveBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const cmpLat = parseFloat(this.getAttribute('data-lat'));
                const cmpLng = parseFloat(this.getAttribute('data-lng'));

                if (!cmpLat || !cmpLng || isNaN(cmpLat) || isNaN(cmpLng)) {
                    alert('Cannot verify resolution: This complaint has no verified geolocation associated with it.');
                    return;
                }

                adminResolveId = id;
                adminResolveCmpLat = cmpLat;
                adminResolveCmpLng = cmpLng;
                
                if(adminModal) adminModal.style.display = 'flex';
                
                // Initialize Popup Map Layout
                if(!window.adminPopupMap) {
                    window.adminPopupMap = new mapboxgl.Map({
                        container: 'admin-modal-map',
                        style: 'mapbox://styles/mapbox/streets-v12',
                        center: [cmpLng, cmpLat],
                        zoom: 15
                    });

                    // Explicit 'Click-to-Select' Location Binding strictly matching Citizen logic
                    window.adminPopupMap.on('click', function(e) {
                        adminResolveLat = e.lngLat.lat;
                        adminResolveLng = e.lngLat.lng;
                        
                        adminModalLatVal.textContent = adminResolveLat.toFixed(5);
                        adminModalLngVal.textContent = adminResolveLng.toFixed(5);
                        adminModalCoordsDisplay.style.display = 'block';

                        if(window.adminPopupAdminMarker) window.adminPopupAdminMarker.remove();
                        let adminEl = document.createElement('div');
                        adminEl.innerHTML = "<div style='width: 16px; height: 16px; background-color: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);'></div>";
                        window.adminPopupAdminMarker = new mapboxgl.Marker({element: adminEl}).setLngLat([adminResolveLng, adminResolveLat]).addTo(window.adminPopupMap);

                        if(window.adminPopupMap.getSource('adminPopupLine')) {
                            if(window.adminPopupMap.getLayer('adminPopupLineLayer')) window.adminPopupMap.removeLayer('adminPopupLineLayer');
                            window.adminPopupMap.removeSource('adminPopupLine');
                        }
                        
                        if(adminResolveCmpLat && adminResolveCmpLng) {
                            window.adminPopupMap.addSource('adminPopupLine', {
                                'type': 'geojson',
                                'data': { 'type': 'Feature', 'geometry': { 'type': 'LineString', 'coordinates': [[adminResolveCmpLng, adminResolveCmpLat], [adminResolveLng, adminResolveLat]] } }
                            });
                            window.adminPopupMap.addLayer({
                                'id': 'adminPopupLineLayer',
                                'type': 'line',
                                'source': 'adminPopupLine',
                                'layout': { 'line-join': 'round', 'line-cap': 'round' },
                                'paint': { 'line-color': '#ef4444', 'line-width': 3, 'line-dasharray': [2, 2] }
                            });
                        }
                    });
                } else {
                    window.adminPopupMap.flyTo({center: [cmpLng, cmpLat], zoom: 15});
                }
                setTimeout(() => window.adminPopupMap.resize(), 300);

                if(window.adminPopupCmpMarker) window.adminPopupCmpMarker.remove();
                window.adminPopupCmpMarker = new mapboxgl.Marker({ color: '#f97316' }).setLngLat([cmpLng, cmpLat]).addTo(window.adminPopupMap);
                
                if(window.adminPopupAdminMarker) window.adminPopupAdminMarker.remove();
                if(window.adminPopupMap.getSource('adminPopupLine')) {
                    if(window.adminPopupMap.getLayer('adminPopupLineLayer')) window.adminPopupMap.removeLayer('adminPopupLineLayer');
                    window.adminPopupMap.removeSource('adminPopupLine');
                }
            });
        });

        // Only bind inner modal loop events *once* per DOM instantiation natively
        if (adminModal && !adminModal.dataset.boundFlag) {
            adminModal.dataset.boundFlag = 'true';

            // 2. Picture Proof Array
            adminModalFileInput.addEventListener('change', function() {
                if (this.files && this.files.length > 0) {
                    const file = this.files[0];
                    adminModalFileName.textContent = file.name;
                    const reader = new FileReader();
                    reader.onload = (ev) => { adminResolveBase64Image = ev.target.result; };
                    reader.readAsDataURL(file);
                }
            });

            // 3. Admin Geolocation Interceptor
            adminModalGeoBtn.addEventListener('click', () => {
                adminModalGeoBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Locating...";
                adminModalGeoBtn.disabled = true;

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            adminResolveLat = position.coords.latitude;
                            adminResolveLng = position.coords.longitude;
                            
                            adminModalLatVal.textContent = adminResolveLat.toFixed(5);
                            adminModalLngVal.textContent = adminResolveLng.toFixed(5);
                            adminModalCoordsDisplay.style.display = 'block';

                            if(window.adminPopupAdminMarker) window.adminPopupAdminMarker.remove();
                            let adminEl = document.createElement('div');
                            adminEl.innerHTML = "<div style='width: 16px; height: 16px; background-color: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);'></div>";
                            window.adminPopupAdminMarker = new mapboxgl.Marker({element: adminEl}).setLngLat([adminResolveLng, adminResolveLat]).addTo(window.adminPopupMap);
                            
                            if(window.adminPopupMap.getSource('adminPopupLine')) {
                                if(window.adminPopupMap.getLayer('adminPopupLineLayer')) window.adminPopupMap.removeLayer('adminPopupLineLayer');
                                window.adminPopupMap.removeSource('adminPopupLine');
                            }
                            window.adminPopupMap.addSource('adminPopupLine', {
                                'type': 'geojson',
                                'data': {
                                    'type': 'Feature',
                                    'geometry': {
                                        'type': 'LineString',
                                        'coordinates': [[adminResolveCmpLng, adminResolveCmpLat], [adminResolveLng, adminResolveLat]]
                                    }
                                }
                            });
                            window.adminPopupMap.addLayer({
                                'id': 'adminPopupLineLayer',
                                'type': 'line',
                                'source': 'adminPopupLine',
                                'layout': { 'line-join': 'round', 'line-cap': 'round' },
                                'paint': { 'line-color': '#ef4444', 'line-width': 3, 'line-dasharray': [2, 2] }
                            });

                            let bbox = turf.bbox(turf.lineString([[adminResolveCmpLng, adminResolveCmpLat], [adminResolveLng, adminResolveLat]]));
                            window.adminPopupMap.fitBounds(bbox, { padding: 40 });

                            adminModalGeoBtn.innerHTML = "<i class='bx bx-check'></i> Location Grabbed";
                            adminModalGeoBtn.style.background = "rgba(16, 185, 129, 0.1)";
                            adminModalGeoBtn.style.color = "#10b981";
                            adminModalGeoBtn.style.border = "1px solid rgba(16, 185, 129, 0.3)";
                            setTimeout(() => { adminModalGeoBtn.disabled = false; }, 2000);
                        },
                        (error) => {
                            alert("Could not fetch geolocation automatically.");
                            adminModalGeoBtn.innerHTML = "<i class='bx bx-target-lock'></i> Use My Current Location";
                            adminModalGeoBtn.disabled = false;
                        }, 
                        { enableHighAccuracy: true }
                    );
                } else {
                    alert("Geolocation is not supported by your browser.");
                    adminModalGeoBtn.innerHTML = "<i class='bx bx-target-lock'></i> Use My Current Location";
                    adminModalGeoBtn.disabled = false;
                }
            });

            // 4. Verification Check and API PUT execute
            adminModalConfirmBtn.addEventListener('click', async () => {
                if (!adminResolveBase64Image) {
                    alert("Verification Failed: Please attach a photo proof of resolution!");
                    return;
                }
                if (!adminResolveLat || !adminResolveLng) {
                    alert("Verification Failed: Please grab your exact GPS coordinates!");
                    return;
                }

                // Check physical bounding conditions synchronously inside the browser
                const distance = calculateDistance(adminResolveCmpLat, adminResolveCmpLng, adminResolveLat, adminResolveLng);
                if (distance > 500) {
                    alert(`You are not at the complaint location. (Distance: ${Math.round(distance)}m)`);
                    return;
                }

                const originalText = adminModalConfirmBtn.innerHTML;
                adminModalConfirmBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Submitting Verification...";
                adminModalConfirmBtn.disabled = true;

                try {
                    const res = await fetch(`http://localhost:8080/api/complaints/${adminResolveId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            status: 'Resolved',
                            resolutionImage: adminResolveBase64Image,
                            resolutionLat: adminResolveLat,
                            resolutionLng: adminResolveLng
                        })
                    });

                    if (res.ok) {
                        adminModalConfirmBtn.innerHTML = "Resolution Complete ✓";
                        fetchComplaints(); // Dynamically re-render Admin DB arrays locally

                        setTimeout(() => {
                            adminModal.style.display = 'none';

                            // Clean loop boundaries accurately
                            adminModalConfirmBtn.innerHTML = "Confirm Resolution <i class='bx bx-check-double'></i>";
                            adminModalConfirmBtn.disabled = false;
                            
                            adminModalGeoBtn.innerHTML = "<i class='bx bx-target-lock'></i> Use My Current Location";
                            adminModalGeoBtn.style.background = "rgba(16, 185, 129, 0.1)";
                            adminModalGeoBtn.style.color = "#10b981";
                            adminModalGeoBtn.style.border = "1px solid rgba(16, 185, 129, 0.3)";
                            adminModalCoordsDisplay.style.display = 'none';
                            
                            if(window.adminPopupCmpMarker) window.adminPopupCmpMarker.remove();
                            if(window.adminPopupAdminMarker) window.adminPopupAdminMarker.remove();
                            if(window.adminPopupMap && window.adminPopupMap.getSource('adminPopupLine')) {
                                if(window.adminPopupMap.getLayer('adminPopupLineLayer')) window.adminPopupMap.removeLayer('adminPopupLineLayer');
                                window.adminPopupMap.removeSource('adminPopupLine');
                            }
                            
                            adminModalFileName.textContent = 'No file chosen';
                            adminModalFileInput.value = '';
                            
                            adminResolveId = null;
                            adminResolveCmpLat = null;
                            adminResolveCmpLng = null;
                            adminResolveBase64Image = null;
                            adminResolveLat = null;
                            adminResolveLng = null;
                        }, 1000);
                    } else {
                        throw new Error('Update bounds failed');
                    }
                } catch(err) {
                    alert('Error enforcing Admin limits on Database.');
                    adminModalConfirmBtn.innerHTML = originalText;
                    adminModalConfirmBtn.disabled = false;
                }
            });

            // 5. Native Close Handler
            closeAdminModal.addEventListener('click', () => { adminModal.style.display = 'none'; });
        }
    }

    function renderAnalyticsCharts(complaints) {
        let resolved = 0, pending = 0, inProgress = 0;
        const dateCounts = {};
        const areaCounts = { "Zone A": 21, "Zone B": 14, "Zone C": 8, "Zone D": 5 };

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

        const labels = Object.keys(dateCounts).sort((a,b) => new Date(a) - new Date(b)).slice(-10);
        const dataPoints = labels.map(l => dateCounts[l]);

        // Rigorous Dashboard Mathematics
        const totalValid = complaints.length;
        let wasteCollectedKg = totalValid * 40; 
        let totalTripsOptimized = resolved * 1.5;
        let co2Saved = wasteCollectedKg * 0.5;
        let fuelSaved = totalTripsOptimized * 0.2;
        let efficiency = totalValid === 0 ? 100 : Math.round((resolved / totalValid) * 100);
        
        let admTotalDom = document.getElementById('adm-total-waste');
        if (admTotalDom) admTotalDom.innerText = (wasteCollectedKg / 1000).toFixed(1);
        let admCo2Dom = document.getElementById('adm-co2-red');
        if (admCo2Dom) admCo2Dom.innerText = co2Saved.toFixed(0);
        let admEffDom = document.getElementById('adm-efficiency');
        if (admEffDom) admEffDom.innerText = efficiency;

        // 1. Complaints Heat Trend (Line Chart)
        const ctxTime = document.getElementById('adm-timeline-chart');
        if (ctxTime) {
            if (admTimelineChart) admTimelineChart.destroy();
            admTimelineChart = new Chart(ctxTime, {
                type: 'line',
                data: {
                    labels: labels.length ? labels : ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'],
                    datasets: [{
                        label: 'Complaints',
                        data: dataPoints.length ? dataPoints : [5, 10, 8, 15, 12, 18, 11],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2, fill: true, tension: 0.4,
                        pointBackgroundColor: '#ef4444'
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', stepSize: 2 } }
                    }
                }
            });
        }

        // 2. Resolution Performance (Donut)
        const ctxStatus = document.getElementById('adm-status-chart');
        if (ctxStatus) {
            if (admStatusChart) admStatusChart.destroy();
            admStatusChart = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Resolved', 'In Progress', 'Pending'],
                    datasets: [{
                        data: [resolved || 45, inProgress || 15, pending || 20],
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
                        borderWidth: 0, hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '70%',
                    plugins: { legend: { position: 'right', labels: { color: '#aaa', padding: 20, usePointStyle: true } } }
                }
            });
        }

        // 3. Area-wise Complaints (Bar)
        const ctxArea = document.getElementById('adm-area-bar-chart');
        if (ctxArea) {
            if (admAreaBarChart) admAreaBarChart.destroy();
            admAreaBarChart = new Chart(ctxArea, {
                type: 'bar',
                data: {
                    labels: Object.keys(areaCounts),
                    datasets: [{
                        label: 'Volume',
                        data: Object.values(areaCounts),
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } }
                }
            });
        }

        // 4. Fleet Usage (Pie)
        const ctxFleet = document.getElementById('adm-fleet-pie-chart');
        if (ctxFleet) {
            if (admFleetPieChart) admFleetPieChart.destroy();
            admFleetPieChart = new Chart(ctxFleet, {
                type: 'pie',
                data: {
                    labels: ['Wet Cargo', 'Dry Cargo'],
                    datasets: [{
                        data: [65, 35],
                        backgroundColor: ['#10b981', '#3b82f6'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#aaa', usePointStyle: true } } }
                }
            });
        }
    }

    // Call initially
    fetchComplaints();

    // Event listener to re-render if jumping back to Complaints dashboard
    const adminComplaintTabBtn = document.querySelector('[data-target="page-complaints"]');
    if(adminComplaintTabBtn) {
        adminComplaintTabBtn.addEventListener('click', fetchComplaints);
    }

    // Real-time Search functionality
    const complaintSearchInput = document.querySelector('#page-complaints .search-box input');
    if (complaintSearchInput) {
        complaintSearchInput.placeholder = "Search title, description, or status...";
        complaintSearchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            if (!term) {
                renderComplaintsList(allComplaintsData);
                renderAnalyticsCharts(allComplaintsData);
                if (dashboardMap) dashboardMap.setView([12.9716, 77.5946], 12);
                return;
            }
            
            const filtered = allComplaintsData.filter(c => {
                return (c.title && c.title.toLowerCase().includes(term)) ||
                       (c.description && c.description.toLowerCase().includes(term)) ||
                       (c.status && c.status.toLowerCase().includes(term));
            });
            renderComplaintsList(filtered);
            renderAnalyticsCharts(filtered);

            // Auto-Zoom Map bounded dynamics explicitly built on Search matches
            if (dashboardMap && filtered.length > 0) {
                const mapComplaints = filtered.filter(c => c.lat && c.lng);
                if (mapComplaints.length === 1) {
                    const matchedC = mapComplaints[0];
                    dashboardMap.flyTo([matchedC.lat, matchedC.lng], 16, { animate: true, duration: 1.2 });
                    if (matchedC.mapMarker) {
                        setTimeout(() => matchedC.mapMarker.openPopup(), 1200);
                    }
                } else if (mapComplaints.length > 1) {
                    const coords = mapComplaints.map(c => [c.lng, c.lat]);
                    const bbox = turf.bbox(turf.multiPoint(coords));
                    dashboardMap.fitBounds(bbox, { padding: 40, duration: 1200 });
                }
            }

        });
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

    // ==========================================
    // 6. Interactive Mapbox Dashboard Instance
    // ==========================================
    const mapContainerElement = document.getElementById('map');
    if (mapContainerElement) {
        dashboardMap = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [77.74, 12.97],
            zoom: 12.5,
            pitch: 60,
            bearing: -15
        });
        
        function nearest(pt, list) {
            let n = null, d = Infinity;
            for (let l of list) { let md = Math.pow(pt[0]-l.coords[0],2) + Math.pow(pt[1]-l.coords[1],2); if (md < d) { d = md; n = l; } }
            return n;
        }
        function sequencePoints(pts) {
            if(pts.length === 0) return [];
            let r = [pts[0]]; let u = new Set([0]);
            while(r.length < pts.length) {
                let l = r[r.length-1], nI = -1, mD=Infinity;
                for(let i=0; i<pts.length; i++){ if(!u.has(i)){ let d=Math.pow(l[0]-pts[i][0],2)+Math.pow(l[1]-pts[i][1],2); if(d<mD){mD=d;nI=i;} } }
                if(nI !== -1){ r.push(pts[nI]); u.add(nI); }
            }
            return r;
        }
        async function getFullRoute(pts) {
            if(pts.length < 2) return null;
            let coordinates = [];
            for (let i = 0; i < pts.length - 1; i++) {
                let url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pts[i][0]},${pts[i][1]};${pts[i+1][0]},${pts[i+1][1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
                try {
                    let res = await fetch(url); let data = await res.json();
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

        let vehiclesConfig = [];

        dashboardMap.on('load', async () => {
            try {
                const [wasteData, dwccData, plantData] = await Promise.all([
                    fetch('../map-data/waste_points.geojson').then(r=>r.json()),
                    fetch('../map-data/BBMP_Dry_Waste_Collection_Centres.geojson').then(r=>r.json()),
                    fetch('../map-data/waste_processing_units.geojson').then(r=>r.json())
                ]);

                if(wasteData && wasteData.features) {
                    wasteData.features.forEach(f => {
                        let coords = f.geometry.coordinates; let title = f.properties.name || f.properties.place_type || "Waste Point";
                        let m = new mapboxgl.Marker({ color: '#f97316' }).setLngLat(coords).setPopup(new mapboxgl.Popup({offset: 15}).setText(title)).addTo(dashboardMap);
                        facilitiesMarkersGroup.push(m);
                    });
                }
                if(dwccData && dwccData.features) {
                    dwccData.features.forEach(f => {
                        let coords = f.geometry.coordinates; let title = f.properties.Name || "Collection Centre";
                        let m = new mapboxgl.Marker({ color: '#3b82f6' }).setLngLat(coords).setPopup(new mapboxgl.Popup({offset: 15}).setText(title)).addTo(dashboardMap);
                        facilitiesMarkersGroup.push(m);
                    });
                }
                if(plantData && plantData.features) {
                    plantData.features.forEach(f => {
                        let coords = f.geometry.coordinates; let title = f.properties.Name || "Processing Unit";
                        let m = new mapboxgl.Marker({ color: '#10b981' }).setLngLat(coords).setPopup(new mapboxgl.Popup({offset: 15}).setText(title)).addTo(dashboardMap);
                        facilitiesMarkersGroup.push(m);
                    });
                }

                const plants = plantData.features.map(f => ({ coords: f.geometry.coordinates.slice(0,2) }));
                const pccs = dwccData.features.map(f => ({ coords: f.geometry.coordinates.slice(0,2) }));
                const colonyPointsWet = []; const colonyPointsDry = [];
                const indPointsWet = []; const indPointsDry = []; const aptPointsDry = [];

                wasteData.features.forEach((f, idx) => {
                    const coords = f.geometry.coordinates; const pt = f.properties.place_type; const name = (f.properties.name || "").toLowerCase();
                    let category = "colony"; 
                    if (pt === "industrial") category = "industrial";
                    else if (name.includes("apartment") || name.includes("villa") || name.includes("heights") || name.includes("springs")) category = "apartment";
                    
                    if (category === "colony") { 
                        if(idx % 2 === 0) colonyPointsWet.push(coords); 
                        else colonyPointsDry.push(coords); 
                    }
                    else if (category === "industrial") { 
                        if(idx % 2 === 0) indPointsWet.push(coords); 
                        else indPointsDry.push(coords); 
                    }
                    else if (category === "apartment") { aptPointsDry.push(coords); }
                });

                vehiclesConfig.push(
                    { id: "v1", icon: '🛺', type: "auto", waste: "wet", color: "#10b981", name: "Wet Auto", points: sequencePoints(colonyPointsWet), destType: "plant" },
                    { id: "v2", icon: '🛺', type: "auto", waste: "dry", color: "#3b82f6", name: "Dry Auto", points: sequencePoints(colonyPointsDry), destType: "dwcc" },
                    { id: "v3", icon: '🚛', type: "truck", waste: "wet", color: "#10b981", name: "Wet Truck", points: sequencePoints(indPointsWet), destType: "plant" },
                    { id: "v4", icon: '🚛', type: "truck", waste: "dry", color: "#3b82f6", name: "Dry Truck", points: sequencePoints(indPointsDry), destType: "dwcc" },
                    { id: "v5", icon: '🚛', type: "truck", waste: "dry", color: "#3b82f6", name: "Dry Apt Truck", points: sequencePoints(aptPointsDry), destType: "dwcc" }
                );

                for(let v of vehiclesConfig) {
                    if(v.points.length === 0) continue;
                    let lastPoint = v.points[v.points.length - 1]; let destList = v.destType === "plant" ? plants : pccs;
                    let dest = nearest(lastPoint, destList); if(dest) v.points.push(dest.coords);
                    v.routeInfo = await getFullRoute(v.points);
                    if(!v.routeInfo || v.routeInfo.geometry.coordinates.length === 0) continue;

                    dashboardMap.addSource("route-"+v.id, { type: 'geojson', data: { type: 'Feature', geometry: v.routeInfo.geometry } });
                    let paintOptions = { 'line-color': v.color, 'line-width': v.waste === 'wet' ? 5 : 3, 'line-opacity': v.waste === 'wet' ? 0.2 : 0.15, 'line-opacity-transition': { duration: 500 } };
                    if (v.waste === 'wet') paintOptions['line-dasharray'] = [2, 2];
                    dashboardMap.addLayer({ id: "route-"+v.id, type: 'line', source: "route-"+v.id, paint: paintOptions });
                    
                    dashboardMap.addSource("trail-"+v.id, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
                    dashboardMap.addLayer({ id: "trail-"+v.id, type: 'line', source: "trail-"+v.id, paint: { 'line-color': '#fff', 'line-width': v.waste === 'wet' ? 6 : 4, 'line-opacity': 0.9, 'line-blur': 4 } });

                    let wrapper = document.createElement('div');
                    wrapper.style.cursor = 'pointer';
                    let el = document.createElement('div');
                    el.className = 'vehicle-icon-inner';
                    el.style.display = 'flex'; el.style.alignItems = 'center'; el.style.justifyContent = 'center';
                    el.style.backgroundColor = v.color; el.style.border = '2px solid white'; el.textContent = v.icon;
                    el.style.transition = 'all 0.4s ease';
                    el.style.color = v.color;
                    if (v.type === 'auto') { el.style.width = '20px'; el.style.height = '20px'; el.style.borderRadius = '50%'; el.style.fontSize = '12px'; el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'; } 
                    else { el.style.width = '32px'; el.style.height = '32px'; el.style.borderRadius = '4px'; el.style.fontSize = '18px'; el.style.boxShadow = '0 4px 6px rgba(0,0,0,0.4)'; }
                    wrapper.appendChild(el);

                    v.marker = new mapboxgl.Marker({element: wrapper})
                        .setLngLat(v.points[0])
                        .setPopup(new mapboxgl.Popup({offset: 15}).setHTML(`
                            <div style="font-family: 'Outfit', sans-serif; padding: 5px;">
                                <h4 style="margin: 0; color: ${v.color};">${v.name}</h4>
                                <span style="font-size: 12px; color: #666;">Handling ${v.waste.toLocaleUpperCase()} waste</span><br>
                                <span style="font-size: 11px; color: #888;">System ID: ${v.id}</span>
                            </div>
                        `))
                        .addTo(dashboardMap);
                        
                    v.currentDist = 0; v.currentSpeed = 0; v.visitedIdx = 0; v.isPaused = false;
                    v.maxSpeed = v.type === 'auto' ? 0.00035 : 0.0005; v.accel = v.type === 'auto' ? 0.00001 : 0.000004; v.decel = v.type === 'auto' ? 0.000015 : 0.000008;
                    v.line = turf.lineString(v.routeInfo.geometry.coordinates); v.totalDist = turf.length(v.line, {units: 'kilometers'});

                    v.legDists = [];
                    for(let i=1; i<v.points.length-1; i++) { let snapped = turf.nearestPointOnLine(v.line, turf.point(v.points[i])); v.legDists.push(snapped.properties.location); }
                    v.legDists.sort((a,b)=>a-b);
                }
                
                setInterval(() => {
                    for(let v of vehiclesConfig) {
                        if(!v.marker || !v.routeInfo || v.routeInfo.geometry.coordinates.length < 2) continue;
                        
                        if (!v.targetIdx) v.targetIdx = 1;
                        let currentLoc = v.marker.getLngLat();
                        
                        let targetLocArray = v.routeInfo.geometry.coordinates[v.targetIdx];
                        if (!targetLocArray) { v.targetIdx = 1; targetLocArray = v.routeInfo.geometry.coordinates[1]; }
                        let targetLng = targetLocArray[0]; let targetLat = targetLocArray[1];

                        // Smooth Mathematical Easing (No Hopping)
                        let newLng = currentLoc.lng + (targetLng - currentLoc.lng) * 0.05;
                        let newLat = currentLoc.lat + (targetLat - currentLoc.lat) * 0.05;
                        
                        let degDist = Math.sqrt(Math.pow(targetLat - newLat, 2) + Math.pow(targetLng - newLng, 2));
                        if(degDist < 0.0001 && v.targetIdx < v.routeInfo.geometry.coordinates.length - 1) {
                            v.targetIdx++;
                        }
                        
                        v.marker.setLngLat([newLng, newLat]);
                        
                        // Optional Live Trail rendering
                        if (dashboardMap.getSource("trail-"+v.id)) {
                            let drawnPath = v.routeInfo.geometry.coordinates.slice(0, v.targetIdx);
                            drawnPath.push([newLng, newLat]);
                            if(drawnPath.length > 30) drawnPath = drawnPath.slice(-30);
                            dashboardMap.getSource("trail-"+v.id).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: drawnPath } });
                        }
                    }
                }, 50);

                // Fleet Sidebar UI Update Loop (Separated from Physics 50ms to save DOM memory)
                setInterval(() => {
                    const listContainer = document.getElementById('fleet-list');
                    if (!listContainer) return;

                    let wetActive = 0, dryActive = 0;
                    let htmlStr = '';

                    vehiclesConfig.forEach(v => {
                        let isIdle = (v.targetIdx >= v.routeInfo.geometry.coordinates.length - 1);
                        let statusTag = !isIdle ? `<span style="color:#10b981; font-size:12px; font-weight:600;"><i class='bx bx-play-circle'></i> Moving</span>` 
                                                : `<span style="color:#f59e0b; font-size:12px; font-weight:600;"><i class='bx bx-pause-circle'></i> Idle</span>`;
                        
                        if (!isIdle) { if (v.waste === 'wet') wetActive++; else dryActive++; }

                        htmlStr += `
                        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; display: flex; align-items: center; gap: 12px;">
                            <div style="width: 36px; height: 36px; border-radius: ${v.type==='auto'?'50%':'4px'}; background: ${v.color}; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                                ${v.icon}
                            </div>
                            <div style="flex: 1;">
                                <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: var(--text-primary);">${v.name}</h4>
                                <span style="font-size: 11px; color: var(--text-secondary); text-transform: capitalize;">${v.waste} Cargo</span>
                            </div>
                            <div>${statusTag}</div>
                        </div>`;
                    });

                    document.getElementById('active-wet-count').innerText = wetActive;
                    document.getElementById('active-dry-count').innerText = dryActive;
                    let fleetTotalDOM = document.getElementById('adm-active-fleet');
                    if(fleetTotalDOM) fleetTotalDOM.innerText = (wetActive + dryActive).toString();
                    listContainer.innerHTML = htmlStr;

                }, 1000);

                // Add Original QGIS Features
                try {
                    let wfRes = await fetch('../map-data/areas.geojson');
                    if(wfRes.ok) {
                        let wfData = await wfRes.json();
                        dashboardMap.addSource('whitefield', { type: 'geojson', data: wfData });
                        dashboardMap.addLayer({ 'id': 'whitefield-boundary', 'type': 'fill', 'source': 'whitefield', 'paint': { 'fill-color': '#1E88E5', 'fill-opacity': 0.2 } });
                        dashboardMap.addLayer({ 'id': 'whitefield-outline', 'type': 'line', 'source': 'whitefield', 'paint': { 'line-color': '#1E88E5', 'line-width': 3 } });
                    }
                } catch(e) { console.log('No areas.geojson found.'); }

                // Add Base Heatmap Layer natively
                dashboardMap.addSource('heatmap-source', {
                    type: 'image', url: 'heatmap.png',
                    coordinates: [[77.7100, 12.9900], [77.7700, 12.9900], [77.7700, 12.9500], [77.7100, 12.9500]]
                });
                dashboardMap.addLayer({
                    'id': 'heatmap-layer', 'type': 'raster', 'source': 'heatmap-source',
                    'paint': { 'raster-opacity': 0.6 }
                });

                // Helper to restore mapbox layers after setStyle
                window.readdCustomMapboxLayers = async function() {
                    // Restore vehicles routes & trails
                    vehiclesConfig.forEach(v => {
                        if (v.routeInfo && v.routeInfo.geometry && v.routeInfo.geometry.coordinates.length > 0) {
                            if(!dashboardMap.getSource("route-"+v.id)) dashboardMap.addSource("route-"+v.id, { type: 'geojson', data: { type: 'Feature', geometry: v.routeInfo.geometry } });
                            if(!dashboardMap.getLayer("route-"+v.id)) {
                                let paintOptions = { 'line-color': v.color, 'line-width': v.waste === 'wet' ? 5 : 3, 'line-opacity': v.waste === 'wet' ? 0.2 : 0.15, 'line-opacity-transition': { duration: 500 } };
                                if (v.waste === 'wet') paintOptions['line-dasharray'] = [2, 2];
                                dashboardMap.addLayer({ id: "route-"+v.id, type: 'line', source: "route-"+v.id, paint: paintOptions });
                            }
                            if(!dashboardMap.getSource("trail-"+v.id)) dashboardMap.addSource("trail-"+v.id, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
                            if(!dashboardMap.getLayer("trail-"+v.id)) dashboardMap.addLayer({ id: "trail-"+v.id, type: 'line', source: "trail-"+v.id, paint: { 'line-color': '#fff', 'line-width': v.waste === 'wet' ? 6 : 4, 'line-opacity': 0.9, 'line-blur': 4 } });
                        }
                    });

                    // Restore Whitefield
                    try {
                        if(!dashboardMap.getSource('whitefield')) {
                            let wfRes = await fetch('../map-data/areas.geojson');
                            if(wfRes.ok) {
                                let wfData = await wfRes.json();
                                dashboardMap.addSource('whitefield', { type: 'geojson', data: wfData });
                            }
                        }
                        if(!dashboardMap.getLayer('whitefield-boundary')) dashboardMap.addLayer({ 'id': 'whitefield-boundary', 'type': 'fill', 'source': 'whitefield', 'paint': { 'fill-color': '#1E88E5', 'fill-opacity': 0.2 } });
                        if(!dashboardMap.getLayer('whitefield-outline')) dashboardMap.addLayer({ 'id': 'whitefield-outline', 'type': 'line', 'source': 'whitefield', 'paint': { 'line-color': '#1E88E5', 'line-width': 3 } });
                    } catch(e) {}

                    // Restore Heatmap
                    if(!dashboardMap.getSource('heatmap-source')) {
                        dashboardMap.addSource('heatmap-source', {
                            type: 'image', url: 'heatmap.png',
                            coordinates: [[77.7100, 12.9900], [77.7700, 12.9900], [77.7700, 12.9500], [77.7100, 12.9500]]
                        });
                    }
                    if(!dashboardMap.getLayer('heatmap-layer')) dashboardMap.addLayer({ 'id': 'heatmap-layer', 'type': 'raster', 'source': 'heatmap-source', 'paint': { 'raster-opacity': 0.6 } });

                    // Restore 3D Buildings
                    if (!dashboardMap.getLayer('3d-buildings')) {
                        dashboardMap.addLayer({
                            'id': '3d-buildings', 'source': 'composite', 'source-layer': 'building',
                            'filter': ['==', 'extrude', 'true'], 'type': 'fill-extrusion', 'minzoom': 11,
                            'paint': {
                                'fill-extrusion-color': '#1E293B',
                                'fill-extrusion-height': ['*', ['get', 'height'], 1.2],
                                'fill-extrusion-base': ['get', 'min_height'],
                                'fill-extrusion-opacity': 0.85
                            }
                        });
                    }
                };

                dashboardMap.on('style.load', () => {
                   window.readdCustomMapboxLayers().then(() => {
                       const activeTab = document.querySelector('.nav-links li.active');
                       if(activeTab && typeof window.updateMapVisibilityOptions === 'function') {
                           window.updateMapVisibilityOptions(activeTab.getAttribute('data-target'));
                       }
                   });
                });
                
                // Initialize default map context based on active layout
                const activeTab = document.querySelector('.nav-links li.active');
                if(activeTab && typeof window.updateMapContext === 'function') {
                    window.updateMapContext(activeTab.getAttribute('data-target'));
                }

            } catch(e) { console.error("Mapbox init failed", e); }
        });

        // Native Navigation Filter Control Plugin
        class LiveMapFilterControl {
            onAdd(map) {
                this.map = map;
                this.container = document.createElement('div');
                this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
                this.container.innerHTML = `
                    <select id="live-map-filter-ctrl" style="padding: 6px 10px; font-family: Outfit; font-weight: 500; font-size: 14px; border: none; outline: none; border-radius: 4px; cursor: pointer;">
                        <option value="all">View: All Data</option>
                        <option value="critical">View: Critical Fixes</option>
                    </select>
                `;
                this.container.querySelector('select').addEventListener('change', (e) => {
                    let val = e.target.value;
                    complaintMarkersGroup.forEach(m => {
                        let status = m.complaintStatus;
                        if(val === 'all') m.addTo(this.map);
                        else if(val === 'critical' && status !== 'Resolved') m.addTo(this.map);
                        else m.remove();
                    });
                    facilitiesMarkersGroup.forEach(m => {
                         if(val === 'all') m.addTo(this.map);
                         else m.remove();
                    });
                });
                return this.container;
            }
            onRemove() {
                this.container.parentNode.removeChild(this.container);
                this.map = undefined;
            }
        }
        window.filterControlInstance = new LiveMapFilterControl();

        // Context Switching Logic Singleton
        let currentMapStyle = 'mapbox://styles/mapbox/dark-v11';
        
        window.updateMapVisibilityOptions = function(pageId) {
            dashboardMap.scrollZoom.enable();

            const mapEl = document.getElementById('map');
            if(mapEl) mapEl.style.filter = "brightness(1)";

            if (pageId === 'page-dashboard') {
                if(mapEl) mapEl.style.filter = "brightness(0.9)";
                if(dashboardMap.hasControl(window.filterControlInstance)) dashboardMap.removeControl(window.filterControlInstance);
                complaintMarkersGroup.forEach(m => {
                    if (m.complaintStatus !== 'Resolved') m.addTo(dashboardMap);
                    else m.remove();
                });
                facilitiesMarkersGroup.forEach(m => m.remove());
                vehiclesConfig.forEach(v => {
                    if (v.marker) {
                        v.marker.addTo(dashboardMap);
                        let inner = v.marker.getElement().querySelector('.vehicle-icon-inner');
                        if(inner) {
                            inner.style.transform = "scale(0.85)";
                            inner.style.opacity = "0.7";
                            inner.style.boxShadow = 'none';
                        }
                    }
                    if (dashboardMap.getLayer("route-"+v.id)) dashboardMap.setLayoutProperty("route-"+v.id, "visibility", "visible");
                    if (dashboardMap.getLayer("trail-"+v.id)) dashboardMap.setLayoutProperty("trail-"+v.id, "visibility", "visible");
                });
                if (dashboardMap.getLayer("whitefield-boundary")) {
                    dashboardMap.setLayoutProperty("whitefield-boundary", "visibility", "visible");
                    dashboardMap.setPaintProperty("whitefield-boundary", "fill-opacity", 0.15);
                }
                if (dashboardMap.getLayer("whitefield-outline")) dashboardMap.setLayoutProperty("whitefield-outline", "visibility", "visible");
                if (dashboardMap.getLayer("heatmap-layer")) {
                    dashboardMap.setLayoutProperty("heatmap-layer", "visibility", "visible");
                    dashboardMap.setPaintProperty("heatmap-layer", "raster-opacity", 0.3); // Light heatmap for dashboard
                }
                if (dashboardMap.getLayer('3d-buildings')) dashboardMap.setLayoutProperty("3d-buildings", "visibility", "visible");
                setTimeout(() => { dashboardMap.flyTo({ zoom: 14.5, center: [77.74, 12.97], pitch: 60, bearing: -15, duration: 1500 }); }, 100);
            } 
            else if (pageId === 'page-map') {
                if(!dashboardMap.hasControl(window.filterControlInstance)) dashboardMap.addControl(window.filterControlInstance, 'top-left');
                const sel = document.getElementById('live-map-filter-ctrl');
                const val = sel ? sel.value : 'all';
                complaintMarkersGroup.forEach(m => {
                    if(val === 'all') m.addTo(dashboardMap);
                    else if(val === 'critical' && m.complaintStatus !== 'Resolved') m.addTo(dashboardMap);
                    else m.remove();
                });
                facilitiesMarkersGroup.forEach(m => { if(val==='all') m.addTo(dashboardMap); else m.remove(); });
                
                vehiclesConfig.forEach(v => {
                    if (v.marker) {
                        v.marker.addTo(dashboardMap);
                        let inner = v.marker.getElement().querySelector('.vehicle-icon-inner');
                        if(inner) {
                            inner.style.transform = "scale(1.2)";
                            inner.style.opacity = "1";
                            inner.style.boxShadow = '0 0 5px rgba(255,255,255,0.4)';
                        }
                    }
                    if (dashboardMap.getLayer("route-"+v.id)) dashboardMap.setLayoutProperty("route-"+v.id, "visibility", "visible");
                    if (dashboardMap.getLayer("trail-"+v.id)) dashboardMap.setLayoutProperty("trail-"+v.id, "visibility", "visible");
                });
                if (dashboardMap.getLayer("whitefield-boundary")) {
                    dashboardMap.setLayoutProperty("whitefield-boundary", "visibility", "visible");
                    dashboardMap.setPaintProperty("whitefield-boundary", "fill-opacity", 0.05);
                }
                if (dashboardMap.getLayer("whitefield-outline")) dashboardMap.setLayoutProperty("whitefield-outline", "visibility", "visible");
                if (dashboardMap.getLayer("heatmap-layer")) {
                    dashboardMap.setLayoutProperty("heatmap-layer", "visibility", "visible");
                    dashboardMap.setPaintProperty("heatmap-layer", "raster-opacity", 0.8); // Aggressive heatmap for Live Map
                }
                if (dashboardMap.getLayer('3d-buildings')) dashboardMap.setLayoutProperty("3d-buildings", "visibility", "none");
                setTimeout(() => { dashboardMap.flyTo({ zoom: 14.5, center: [77.74, 12.97], pitch: 0, bearing: 0, duration: 1500 }); }, 100);
            }
            else if (pageId === 'page-vehicles') {
                if(dashboardMap.hasControl(window.filterControlInstance)) dashboardMap.removeControl(window.filterControlInstance);
                complaintMarkersGroup.forEach(m => m.remove());
                facilitiesMarkersGroup.forEach(m => m.remove());
                vehiclesConfig.forEach(v => {
                    if (v.marker) {
                        v.marker.addTo(dashboardMap);
                        let inner = v.marker.getElement().querySelector('.vehicle-icon-inner');
                        if(inner) {
                            inner.style.transform = "scale(1.8)";
                            inner.style.opacity = "1";
                            inner.style.boxShadow = `0 0 20px 8px ${v.color}`;
                        }
                    }
                    if (dashboardMap.getLayer("route-"+v.id)) { dashboardMap.setLayoutProperty("route-"+v.id, "visibility", "visible"); dashboardMap.setPaintProperty("route-"+v.id, "line-opacity", 0.4); }
                    if (dashboardMap.getLayer("trail-"+v.id)) { dashboardMap.setLayoutProperty("trail-"+v.id, "visibility", "visible"); dashboardMap.setPaintProperty("trail-"+v.id, "line-width", 6); }
                });
                if (dashboardMap.getLayer("whitefield-boundary")) dashboardMap.setLayoutProperty("whitefield-boundary", "visibility", "none");
                if (dashboardMap.getLayer("whitefield-outline")) dashboardMap.setLayoutProperty("whitefield-outline", "visibility", "none");
                if (dashboardMap.getLayer("heatmap-layer")) dashboardMap.setLayoutProperty("heatmap-layer", "visibility", "none");
                if (dashboardMap.getLayer('3d-buildings')) dashboardMap.setLayoutProperty("3d-buildings", "visibility", "none");
                setTimeout(() => { dashboardMap.flyTo({ zoom: 16.5, center: [77.74, 12.97], pitch: 65, bearing: 45, duration: 2000 }); }, 100);
            }
        };

        window.updateMapContext = function(pageId) {
            if (!dashboardMap) return;
            
            let requestedStyle = currentMapStyle;
            if(pageId === 'page-dashboard') { 
                requestedStyle = 'mapbox://styles/mapbox/dark-v11';
            } else if (pageId === 'page-map') { 
                requestedStyle = 'mapbox://styles/mapbox/satellite-streets-v12';
            } else if (pageId === 'page-vehicles') { 
                requestedStyle = 'mapbox://styles/mapbox/navigation-night-v1';
            }

            if(currentMapStyle !== requestedStyle) {
                currentMapStyle = requestedStyle;
                dashboardMap.setStyle(requestedStyle); // this removes custom layers, 'style.load' will trigger re-adding
            } else {
                if(dashboardMap.isStyleLoaded()) window.updateMapVisibilityOptions(pageId);
            }
        };

        // Smart Alert Generation Sync Logic
        const notifiedComplaints = new Set();
        setInterval(() => {
            if (typeof allComplaintsData !== 'undefined' && allComplaintsData.length > 0) {
                allComplaintsData.forEach(c => {
                    if (c.status === 'Resolved' || !c.lat || !c.lng) return;
                    if (notifiedComplaints.has(c._id)) return;

                    vehiclesConfig.forEach(item => {
                        if(!item.marker) return;
                        let itemCoords = item.marker.getLngLat();
                        const distance = Math.sqrt(Math.pow(c.lat - itemCoords.lat, 2) + Math.pow(c.lng - itemCoords.lng, 2));
                        if (distance < 0.015) { 
                            notifiedComplaints.add(c._id);
                            const alertsList = document.querySelector('.alerts-list');
                            if (alertsList) {
                                const alertHtml = `<div class="alert-item info" style="background: rgba(59, 130, 246, 0.05); border-left: 3px solid #3b82f6; animation: slideIn 0.3s ease;"><div class="alert-icon"><i class='bx bxs-truck' style="color: #3b82f6;"></i></div><div class="alert-content"><h4 style="color: #3b82f6;">Vehicle Approaching</h4><p>Vehicle <b>${item.name}</b> arriving to resolve ticket <b>${c.title}</b>.</p><span class="time">Just now</span></div></div>`;
                                alertsList.insertAdjacentHTML('afterbegin', alertHtml);
                            }
                        }
                    });
                });
            }
        }, 3000);
        
        const observer = new ResizeObserver(() => {
            if (dashboardMap) dashboardMap.resize();
        });
        observer.observe(mapContainerElement);
    }
});
