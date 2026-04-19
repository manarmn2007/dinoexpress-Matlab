// Global dependencies are loaded from telemetry.js and ui.js

let map, robotMarker;

function initMap() {
    // Use a sleek dark basemap from CartoDB
    const mapboxTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    map = L.map('map-container', {
        zoomControl: false,
        attributionControl: false
    }).setView([origin.lat, origin.lng], 16);

    L.tileLayer(mapboxTiles, {
        maxZoom: 19
    }).addTo(map);

    // Draw glowing route line
    const routePoints = fullRoute.map(p => [p.lat, p.lng]);

    // Outer glow
    L.polyline(routePoints, {
        color: '#8b5cf6',
        weight: 8,
        opacity: 0.3,
        lineCap: 'round',
        lineJoin: 'round'
    }).addTo(map);

    // Core line
    L.polyline(routePoints, {
        color: '#a78bfa',
        weight: 3,
        opacity: 1,
        dashArray: '5, 8',
        lineCap: 'round'
    }).addTo(map);

    // Markers
    const originIcon = L.divIcon({
        html: `<div class="custom-point-marker"></div>`,
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });

    const destIcon = L.divIcon({
        html: `
      <div style="position:relative">
        <div class="custom-point-marker" style="background:#10b981; border-color:#09090b;"></div>
        <div style="position:absolute; top:-30px; left:-10px; background:var(--bg-surface-elevated); padding:4px 8px; border-radius:8px; font-weight:bold; font-size:12px; color:white; white-space:nowrap; border: 1px solid var(--glass-border);">Destination</div>
      </div>
    `,
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });

    L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(map);
    L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(map);

    // Robot Marker
    const robotSvgIcon = L.divIcon({
        html: `
      <div class="custom-robot-marker">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="10" rx="2"></rect>
          <circle cx="12" cy="5" r="2"></circle>
          <path d="M12 7v4"></path>
          <line x1="8" y1="16" x2="8" y2="16"></line>
          <line x1="16" y1="16" x2="16" y2="16"></line>
        </svg>
      </div>`,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
    });

    robotMarker = L.marker([origin.lat, origin.lng], { icon: robotSvgIcon }).addTo(map);

    // Fix map sizing when tab switches
    window.addEventListener('mapResized', () => {
        setTimeout(() => {
            map.invalidateSize();
            if (robotMarker) map.panTo(robotMarker.getLatLng());
        }, 100);
    });
}

function initApp() {
    const telemetry = new TelemetrySimulator();
    const ui = new UI(telemetry);

    initMap();

    telemetry.onUpdate((state) => {
        // Calculate full progress
        const totalProgress = telemetry.getTotalProgress();
        ui.update(state, totalProgress);

        // Update marker position and pan map smoothly
        if (robotMarker && map) {
            const latlng = [state.position.lat, state.position.lng];
            robotMarker.setLatLng(latlng);
            map.panTo(latlng, { animate: true, duration: 1.0, easeLinearity: 0.5 });
        }
    });

    // Start the telemetry simulation loop
    setTimeout(() => {
        ui.showToast("Your DropBot is on its way!", "success");
        telemetry.start();
    }, 1000);
}

window.addEventListener('DOMContentLoaded', initApp);
