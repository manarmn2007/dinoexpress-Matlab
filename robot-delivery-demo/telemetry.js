// Generate a realistic looking route in a city block 
// (Coordinates slightly offset to create a path)
const generateRoute = () => {
    const startLat = 40.730610;
    const startLng = -73.935242;
    const points = [];
    let currentLat = startLat;
    let currentLng = startLng;

    points.push({ lat: currentLat, lng: currentLng });

    // Create 15 waypoints
    for (let i = 0; i < 15; i++) {
        // Add small increments to create a zig-zag city block path
        currentLat += (Math.random() > 0.5 ? 0.0005 : 0);
        currentLng -= (Math.random() > 0.5 ? 0.0005 : 0);
        points.push({ lat: currentLat, lng: currentLng });
    }
    return points;
};

const ROUTE = generateRoute();

class TelemetrySimulator {
    constructor() {
        this.state = {
            position: ROUTE[0],
            routeIndex: 0,
            battery: 100,
            mode: 'NORMAL',
            eta: 25,
            foodTemp: 85,
            progress: 0,
            obstacleActive: false,
            arrived: false
        };
        this.listeners = [];
        this.tickInterval = null;
        this.timer = 0;
    }

    onUpdate(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.state));
    }

    start() {
        this.notify(); // Initial state broadcast
        this.tickInterval = setInterval(() => {
            this.tick();
        }, 1000);
    }

    tick() {
        if (this.state.arrived) return;
        this.timer++;

        this.updateFactors();
        this.determineMode();
        this.moveRobot();

        this.notify();
    }

    updateFactors() {
        // Battery drops 1% every 2 ticks
        if (this.timer % 2 === 0 && this.state.battery > 5) {
            this.state.battery -= 1;
        }
        // Food temp drops slightly every 4 ticks
        if (this.timer % 4 === 0 && this.state.foodTemp > 50) {
            this.state.foodTemp -= 1;
        }
    }

    determineMode() {
        if (this.state.obstacleActive) {
            this.state.mode = 'OBSTACLE';
        } else if (this.state.battery < 20) {
            this.state.mode = 'BATTERY_LOW';
        } else if (this.state.foodTemp < 65) {
            this.state.mode = 'HOT_FOOD';
        } else {
            this.state.mode = 'NORMAL';
        }

        // Scripted events for demonstration:
        // Event 1: At 10s, trigger an obstacle
        if (this.timer === 10 && !this.state.obstacleActive) {
            this.state.obstacleActive = true;
            setTimeout(() => {
                this.state.obstacleActive = false;
            }, 5000); // clear after 5s
        }

        // Event 2: Rapid battery depletion simulation around 25s
        if (this.timer === 25) {
            this.state.battery = 18;
        }
    }

    moveRobot() {
        if (this.state.obstacleActive) return; // blocked

        // Progress along current segment
        this.state.progress += 0.15; // Move 15% along segment per tick

        if (this.state.progress >= 1) {
            this.state.routeIndex++;
            this.state.progress = 0;
            this.state.eta = Math.max(1, this.state.eta - 1);
        }

        if (this.state.routeIndex >= ROUTE.length - 1) {
            this.state.arrived = true;
            this.state.eta = 0;
            this.state.mode = 'ARRIVED';
            this.state.position = ROUTE[ROUTE.length - 1];
        } else {
            const current = ROUTE[this.state.routeIndex];
            const next = ROUTE[this.state.routeIndex + 1];

            // Linear interpolation
            this.state.position = {
                lat: current.lat + (next.lat - current.lat) * this.state.progress,
                lng: current.lng + (next.lng - current.lng) * this.state.progress
            };
        }
    }

    getTotalProgress() {
        const totalSegments = ROUTE.length - 1;
        return Math.min(100, ((this.state.routeIndex + this.state.progress) / totalSegments) * 100);
    }
}

const origin = ROUTE[0];
const destination = ROUTE[ROUTE.length - 1];
const fullRoute = ROUTE;
