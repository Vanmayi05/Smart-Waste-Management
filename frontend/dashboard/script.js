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
    // 5. Admin Complaints Table, API Fetching & Searching
    // ==========================================
    
    let allComplaintsData = [];
    let dashboardMap = null;
    let complaintMarkersGroup = null;

    async function fetchComplaints() {
        const tbody = document.getElementById('admin-complaints-tbody');
        if (!tbody) return;

        try {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;"><i class="bx bx-loader-alt bx-spin" style="font-size: 24px;"></i><br><span style="color: var(--text-secondary); margin-top: 8px; display: inline-block;">Loading complaints...</span></td></tr>';
            
            const response = await fetch('http://localhost:8080/api/complaints');
            if (!response.ok) throw new Error('API Error');
            allComplaintsData = await response.json();
            
            renderComplaintsList(allComplaintsData);
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 20px;">Could not connect to the Backend API. Ensure the server is running on port 8080.</td></tr>';
        }
    }

    function renderComplaintsList(complaintsList) {
        const tbody = document.getElementById('admin-complaints-tbody');
        if (!tbody) return;

        if (complaintMarkersGroup) {
            complaintMarkersGroup.clearLayers();
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
                ? `<button class="action-btn resolve-btn" data-id="${c._id}" style="background: var(--success); border-color: var(--success); color: white; padding: 6px 12px; font-size: 13px; cursor: pointer; border-radius: 8px; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);">Resolve ✓</button>`
                : `<span style="color: var(--success); font-weight: 600; font-size: 14px;"><i class='bx bx-check-double'></i> Closed</span>`;

            const thumbnailHtml = c.image 
                ? `<img src="${c.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 1px solid var(--glass-border);" title="Click to view full image" onclick="document.getElementById('modal-image').src=this.src; document.getElementById('image-modal').style.display='flex';">`
                : `<div style="width: 50px; height: 50px; background: rgba(255,255,255,0.05); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);"><i class='bx bx-image'></i></div>`;

            tr.innerHTML = `
                <td style="color: var(--text-secondary); font-size: 13px;">${dateStr}</td>
                <td>${thumbnailHtml}</td>
                <td style="font-weight: 600; color: var(--text-primary);">${c.title}</td>
                <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-secondary);" title="${c.description}">${c.description}</td>
                <td>${badgeHtml}</td>
                <td>${resolveBtnHtml}</td>
            `;

            // Plot Map Marker
            if (c.lat && c.lng && dashboardMap && complaintMarkersGroup) {
                const marker = L.marker([c.lat, c.lng]).addTo(complaintMarkersGroup);
                marker.bindPopup(`
                    <div style="font-family: 'Outfit', sans-serif; text-align: center;">
                        <span style="font-size: 11px; color: #888;">#TKT-${c._id.substring(18).toUpperCase()}</span><br>
                        <b>${c.title}</b><br>
                        <span style="font-size: 12px; color: #666;">${c.status}</span>
                    </div>
                `);
                c.mapMarker = marker;
            }

            // Bind click to auto-zoom
            tr.style.cursor = 'pointer';
            tr.classList.add('hoverable-row');
            tr.onmouseenter = function() { this.style.backgroundColor = 'rgba(255,255,255,0.02)'; };
            tr.onmouseleave = function() { this.style.backgroundColor = ''; };
            
            tr.addEventListener('click', (e) => {
                if(e.target.tagName.toLowerCase() === 'button' || e.target.tagName.toLowerCase() === 'img') return;
                
                if (c.lat && c.lng && dashboardMap) {
                    dashboardMap.flyTo([c.lat, c.lng], 16, { animate: true, duration: 1.2 });
                    if (c.mapMarker) {
                        setTimeout(() => c.mapMarker.openPopup(), 1200);
                    }
                    const mapEl = document.getElementById('map');
                    if(mapEl) mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });

            tbody.appendChild(tr);
        });

        // Rebind Resolve buttons
        const resolveBtns = document.querySelectorAll('.resolve-btn');
        resolveBtns.forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                
                this.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i>";
                this.disabled = true;
                this.style.opacity = '0.7';

                try {
                    const res = await fetch(`http://localhost:8080/api/complaints/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Resolved' })
                    });
                    if(res.ok) {
                        fetchComplaints(); // Refresh UI fully from backend
                    } else {
                        throw new Error('Update failed');
                    }
                } catch(err) {
                    alert('Error updating complaint Status.');
                    this.innerHTML = "Resolve ✓";
                    this.disabled = false;
                    this.style.opacity = '1';
                }
            });
        });
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
                if (dashboardMap) dashboardMap.setView([12.9716, 77.5946], 12);
                return;
            }
            
            const filtered = allComplaintsData.filter(c => {
                return (c.title && c.title.toLowerCase().includes(term)) ||
                       (c.description && c.description.toLowerCase().includes(term)) ||
                       (c.status && c.status.toLowerCase().includes(term));
            });
            renderComplaintsList(filtered);

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
                    const bounds = L.latLngBounds(mapComplaints.map(c => [c.lat, c.lng]));
                    if (bounds.isValid()) {
                        dashboardMap.flyToBounds(bounds, { padding: [40, 40], animate: true, duration: 1.2 });
                    }
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
    // 6. Interactive Leaflet Map Configuration
    // ==========================================
    const mapContainerElement = document.getElementById('map');
    if (mapContainerElement) {
        dashboardMap = L.map('map').setView([12.9716, 77.5946], 12);
        complaintMarkersGroup = L.layerGroup().addTo(dashboardMap);

        const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        });

        const mapboxSatelliteLayer = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=YOUR_MAPBOX_ACCESS_TOKEN', {
            maxZoom: 19,
            attribution: '&copy; Mapbox'
        });

        osmLayer.addTo(map);

        const baseMaps = {
            "Standard Map": osmLayer,
            "Satellite View": mapboxSatelliteLayer
        };

        L.control.layers(baseMaps).addTo(dashboardMap);

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
            color: '#10B981',      // Emerald Green border
            weight: 2,
            fillColor: '#10B981',
            fillOpacity: 0.25,
            interactive: true      // Allows popups without blocking map drags
        }).addTo(dashboardMap);

        whitefieldPolygon.bindPopup("<div style='text-align:center;'><b>Whitefield Ward</b><br><span style='font-size: 11px; color: #666;'>Project Focus Area</span></div>");
        
        // Auto-center the map exactly over the Whitefield focus area on load
        dashboardMap.fitBounds(whitefieldPolygon.getBounds());

        // Map container needs invalidation if bounding client dimensions mutate rapidly
        const observer = new ResizeObserver(() => {
            if (dashboardMap) dashboardMap.invalidateSize();
        });
        observer.observe(mapContainerElement);
    }

});
