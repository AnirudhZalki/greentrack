// -----------------------
// 1. UI & UTILITY FUNCTIONS
// -----------------------

// Custom Toast Notification (Replaces native alert)
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    
    // Create container if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Style specific to error vs success
    toast.style.borderLeft = type === 'error' ? '5px solid #ef4444' : '5px solid #4ade80';

    container.appendChild(toast);

    // Animation: Slide in
    setTimeout(() => toast.style.transform = 'translateX(0)', 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Global Logout
function logout() {
    localStorage.removeItem("token");
    showToast("Logging out securely...", "success");
    setTimeout(() => location.href = "login.html", 1500);
}

// -----------------------
// 2. MAP PICKER (ADD PLANTATION)
// -----------------------

let modal = document.getElementById("mapModal");
let modalMap, marker, selectedLat, selectedLng;

function openMap() {
    if (!modal) return;
    
    modal.style.display = "flex";

    // Initialize map only once, or resize it if already exists
    if (!modalMap) {
        modalMap = L.map("modalMap").setView([20.59, 78.96], 5);
        
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© OpenStreetMap'
        }).addTo(modalMap);

        // Click to drop pin
        modalMap.on("click", (e) => {
            selectedLat = e.latlng.lat;
            selectedLng = e.latlng.lng;

            if (marker) modalMap.removeLayer(marker);

            marker = L.marker([selectedLat, selectedLng], { draggable: true }).addTo(modalMap);
            showToast("Location selected!", "success");
        });
        
        // Add "Locate Me" button control
        addLocateControl(modalMap);

    } else {
        // Fix Leaflet gray box issue when showing hidden div
        setTimeout(() => modalMap.invalidateSize(), 200);
    }
}

function closeMap() {
    if(modal) modal.style.display = "none";
}

function saveLocation() {
    if (!selectedLat || !selectedLng) {
        showToast("Please select a location on the map first.", "error");
        return;
    }
    document.getElementById("lat").value = selectedLat;
    document.getElementById("lng").value = selectedLng;
    
    // Visual feedback on the button/input
    const btn = document.querySelector('.map-btn');
    if(btn) btn.innerHTML = '<i class="fas fa-check"></i> Location Saved';
    
    closeMap();
}

// -----------------------
// 3. LIVE MAP (DASHBOARD)
// -----------------------

if (document.getElementById("liveMap")) {
    const map = L.map("liveMap").setView([20.59, 78.96], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© GreenTrack'
    }).addTo(map);

    // --- Custom Icons ---
    const leafIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/12674/12674251.png", // 3D Green Tree
        iconSize: [40, 40],
        popupAnchor: [0, -20]
    });

    const fireIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/785/785116.png", // Fire
        iconSize: [35, 35],
        popupAnchor: [0, -20]
    });

    const alertIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/564/564619.png", // Warning
        iconSize: [35, 35],
        popupAnchor: [0, -20]
    });

    // --- Fetch Data ---
    fetch("/plant/all")
        .then(res => res.json())
        .then(data => {
            data.forEach(p => {
                const popupContent = `
                    <div class="map-popup">
                        <img src="/uploads/${p.photo}" onerror="this.src='https://via.placeholder.com/150'">
                        <h4>${p.treeName}</h4>
                        <span class="badge">Verified</span>
                    </div>
                `;
                
                L.marker([p.latitude, p.longitude], { icon: leafIcon })
                    .addTo(map)
                    .bindPopup(popupContent);
            });
        })
        .catch(err => console.error("Error loading map data:", err));

    // --- Demo Alerts ---
    L.marker([11.5, 76.9], { icon: fireIcon }).addTo(map)
        .bindPopup("<b style='color:red'>🔥 Forest Fire Reported</b><br>High Risk Zone");
        
    L.marker([23.1, 84.9], { icon: alertIcon }).addTo(map)
        .bindPopup("<b>⚠️ Illegal Logging Activity</b><br>Reported 2 hours ago");

    // Attempt to locate user
    map.locate({setView: true, maxZoom: 10});
    map.on('locationfound', (e) => {
        L.circle(e.latlng, { radius: e.accuracy / 2, color: '#4ade80' }).addTo(map);
    });
}

// Helper: Add 'Locate Me' Button to Maps
function addLocateControl(mapInstance) {
    const locateBtn = L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function () {
            const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom');
            btn.innerHTML = '<i class="fas fa-crosshairs"></i>';
            btn.style.width = '30px';
            btn.style.height = '30px';
            btn.style.backgroundColor = 'white';
            btn.style.cursor = 'pointer';
            btn.title = "Locate Me";
            
            btn.onclick = function() {
                mapInstance.locate({setView: true, maxZoom: 14});
            }
            return btn;
        }
    });
    mapInstance.addControl(new locateBtn());
}