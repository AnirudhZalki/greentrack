document.addEventListener("DOMContentLoaded", () => {
    // -----------------------
    // 1. GLOBAL UI & UTILITIES
    // -----------------------

    // Custom Toast Notification (Replaces native alert)
    window.showToast = function(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);

        // Slide in animation
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    window.logout = function() {
        localStorage.removeItem("token");
        showToast("Logging out...", "success");
        setTimeout(() => location.href = "login.html", 1500);
    };

    // -----------------------
    // 2. LEAFLET MAP CHECK
    // -----------------------
    if (typeof L === 'undefined') {
        console.error("Leaflet.js is not loaded! Ensure the CDN links are in your HTML.");
        return;
    }

    // -----------------------
    // 3. MAP PICKER (For Adding Plantations)
    // -----------------------
    const mapModal = document.getElementById("mapModal");
    let pickerMap, pickerMarker, selectedLat, selectedLng;

    window.openMap = function() {
        if (!mapModal) return;
        mapModal.style.display = "flex";

        // Initialize map only once
        if (!pickerMap) {
            pickerMap = L.map("modalMap").setView([20.59, 78.96], 5);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© OpenStreetMap'
            }).addTo(pickerMap);

            pickerMap.on("click", (e) => {
                selectedLat = e.latlng.lat;
                selectedLng = e.latlng.lng;

                if (pickerMarker) pickerMap.removeLayer(pickerMarker);
                pickerMarker = L.marker([selectedLat, selectedLng]).addTo(pickerMap);
                showToast("Location selected!", "success");
            });
        }
        
        // CRITICAL FIX: Refresh map size after modal opens to prevent gray tiles
        setTimeout(() => {
            pickerMap.invalidateSize();
        }, 200);
    };

    window.closeMap = function() {
        if (mapModal) mapModal.style.display = "none";
    };

    window.saveLocation = function() {
        if (!selectedLat || !selectedLng) {
            showToast("Please pick a location on the map.", "error");
            return;
        }
        const latInput = document.getElementById("lat");
        const lngInput = document.getElementById("lng");
        
        if(latInput && lngInput) {
            latInput.value = selectedLat;
            lngInput.value = selectedLng;
            showToast("Coordinates saved!", "success");
            closeMap();
        }
    };

    // -----------------------
    // 4. LIVE DASHBOARD MAP
    // -----------------------
    // -----------------------
    // 4. LIVE DASHBOARD MAP (UPDATED)
    // -----------------------
    const liveMapContainer = document.getElementById("liveMap");
    
    if (liveMapContainer) {
         const dashboardMap = L.map("liveMap").setView([20.59, 78.96], 5);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© GreenTrack'
        }).addTo(dashboardMap);

        // Define Icons
        const treeIcon = L.icon({
            iconUrl: "https://cdn-icons-png.flaticon.com/512/12674/12674251.png",
            iconSize: [32, 32],
            popupAnchor: [0, -10]
        });

        const fireIcon = L.icon({
            iconUrl: "https://cdn-icons-png.flaticon.com/512/785/785116.png",
            iconSize: [30, 30]
        });

        // Load Data from Backend
        fetch("/plant/all")
            .then(res => res.json())
            .then(data => {
                data.forEach(p => {
                    if(p.latitude && p.longitude) {
                        const popupContent = `
                            <div style="text-align:center">
                                <strong>${p.treeName}</strong><br>
                                <img src="/uploads/${p.photo}" style="width:100px; height:80px; object-fit:cover; border-radius:8px; margin-top:5px;">
                            </div>
                        `;
                        L.marker([p.latitude, p.longitude], { icon: treeIcon })
                            .addTo(dashboardMap)
                            .bindPopup(popupContent);
                    }
                });
            })
            .catch(err => console.error("Failed to load plants:", err));

        // Add Demo Risks
        L.marker([11.5, 76.9], { icon: fireIcon }).addTo(dashboardMap).bindPopup("🔥 Active Fire Alert");

        // "Locate Me" Feature
        dashboardMap.locate({ setView: true, maxZoom: 10 });
        dashboardMap.on('locationfound', (e) => {
            L.circle(e.latlng, { radius: e.accuracy / 2, color: '#2d6a4f' }).addTo(dashboardMap)
             .bindPopup("You are here").openPopup();
        });

        // 1. CONNECT TO SOCKET.IO
        const socket = io(); // Connects to the server automatically

        // 2. LISTEN FOR FIRE ALERTS
        socket.on("fire_alert", (data) => {
            console.log("Received Alert:", data);
            
            // Add a Pulsing Red Circle
            const fireCircle = L.circle([data.lat, data.lng], {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5,
                radius: 5000 // 5km radius visual
            }).addTo(dashboardMap);

            // Add Icon Marker
            L.marker([data.lat, data.lng], { icon: fireIcon })
                .addTo(dashboardMap)
                .bindPopup(`
                    <strong>🔥 FIRE DETECTED!</strong><br>
                    Temp: ${data.temp}°C<br>
                    Time: ${new Date().toLocaleTimeString()}
                `)
                .openPopup();

            // Pan map to the fire
            dashboardMap.setView([data.lat, data.lng], 10);
            
            // Show Toast Alert
            showToast(`⚠️ Fire Alert at Lat: ${data.lat}`, "error");
        });
    }
});