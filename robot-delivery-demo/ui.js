class UI {
    constructor(telemetryRef) {
        this.telemetry = telemetryRef;

        // View Management
        this.views = document.querySelectorAll('.view');
        this.tabBtns = document.querySelectorAll('.tab-item');

        // Data Elements
        this.mapEtaLarge = document.getElementById('map-eta-large');
        this.mapStatusText = document.getElementById('map-status-text');
        this.mapProgressBar = document.getElementById('map-progress-bar');
        this.statusIndicator = document.querySelector('.status-indicator');

        this.robotoAvatarWrapper = document.getElementById('robot-avatar-wrapper');
        this.robotStatusTitle = document.getElementById('robot-status-title');
        this.robotStatusDesc = document.getElementById('robot-status-desc');

        this.robotEta = document.getElementById('robot-eta');
        this.robotBattery = document.getElementById('robot-battery');
        this.robotTemp = document.getElementById('robot-temp');
        this.batteryIcon = document.getElementById('battery-icon');

        // Controls
        this.btnChangeFace = document.getElementById('btn-change-face');
        this.btnWave = document.getElementById('btn-wave');
        this.btnDraw = document.getElementById('btn-draw');
        this.btnPickupAction = document.getElementById('btn-pickup-action');

        // Modals & Toasts
        this.toastContainer = document.getElementById('toast-container');
        this.modal = document.getElementById('action-modal');
        this.btnModalConfirm = document.getElementById('btn-modal-confirm');
        this.btnModalCancel = document.getElementById('btn-modal-cancel');

        // Drawing Modal UI
        this.drawModal = document.getElementById('draw-modal');
        this.drawCanvas = document.getElementById('large-draw-canvas');
        this.btnDrawApply = document.getElementById('btn-draw-apply');
        this.btnDrawClear = document.getElementById('btn-draw-clear');
        this.drawModalBackdrop = document.getElementById('draw-modal-backdrop');
        this.colorSwatches = document.querySelectorAll('.color-swatch');

        this.currentMode = null;
        this.facesUnlocked = JSON.parse(localStorage.getItem('unlocked_faces') || '["happy"]');
        this.currentFaceIndex = 0;

        this.customFaceDataUrl = null;
        this.isCustomFaceActive = false;

        this.initDrawCanvas();
        this.bindEvents();
    }

    bindEvents() {
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.currentTarget;
                if (targetBtn.id === 'btn-pickup-action') return;

                this.tabBtns.forEach(b => b.classList.remove('active'));
                if (targetBtn.classList.contains('tab-item')) {
                    targetBtn.classList.add('active');
                }

                const targetId = targetBtn.getAttribute('data-target');
                this.views.forEach(v => {
                    v.classList.remove('active');
                    if (v.id === targetId) v.classList.add('active');
                });

                // Dispatch custom event if map is shown to resize leaflet
                if (targetId === 'view-map') {
                    window.dispatchEvent(new Event('mapResized'));
                }
            });
        });

        // Gamification
        this.btnChangeFace.addEventListener('click', () => {
            if (this.currentMode !== 'NORMAL') {
                this.showToast("Can only change face in NORMAL mode", "warning");
                return;
            }

            const faces = ['happy', 'cool', 'love', 'default'];
            this.currentFaceIndex = (this.currentFaceIndex + 1) % faces.length;
            this.updateRobotFace(faces[this.currentFaceIndex]);
            this.showToast("Robot personality updated! ✨");
        });

        this.btnWave.addEventListener('click', () => {
            this.showToast("Robot waves back! 👋");
            this.robotoAvatarWrapper.style.transform = 'translateY(-20px) rotate(15deg)';
            setTimeout(() => {
                this.robotoAvatarWrapper.style.transform = '';
            }, 500);
        });

        this.btnDraw.addEventListener('click', () => {
            if (this.currentMode !== 'NORMAL') {
                this.showToast("Can only draw in NORMAL mode", "warning");
                return;
            }
            // Reset canvas if there is no custom face currently
            if (!this.isCustomFaceActive) {
                this.ctx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
            }
            this.drawModal.classList.add('visible');
        });

        this.drawModalBackdrop.addEventListener('click', () => {
            this.drawModal.classList.remove('visible');
        });

        this.btnDrawClear.addEventListener('click', () => {
            this.ctx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
        });

        this.btnDrawApply.addEventListener('click', () => {
            this.customFaceDataUrl = this.drawCanvas.toDataURL('image/png');
            this.isCustomFaceActive = true;
            this.updateRobotFace('custom');
            this.drawModal.classList.remove('visible');
            this.showToast("Custom face applied! 🎨", "success");
        });

        this.colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                this.colorSwatches.forEach(s => s.classList.remove('active'));
                e.target.classList.add('active');
                this.ctx.strokeStyle = e.target.getAttribute('data-color');
            });
        });

        // Action Button
        this.btnPickupAction.addEventListener('click', () => {
            this.modal.classList.add('visible');
        });

        // Modal
        this.btnModalCancel.addEventListener('click', () => {
            this.modal.classList.remove('visible');
        });

        this.btnModalConfirm.addEventListener('click', () => {
            const inputs = document.querySelectorAll('.pin-box');
            let pin = Array.from(inputs).map(i => i.value).join('');
            if (pin.length === 4) {
                this.modal.classList.remove('visible');
                this.showToast("Hatch unlocked! Enjoy your order. 🎉", "success");
                this.robotStatusTitle.textContent = "Delivery Complete";
                this.robotStatusDesc.textContent = "Thank you for using DropBot.";
                this.updateRobotFace('love');
                this.btnPickupAction.disabled = true;
            } else {
                this.showToast("Please enter a 4-digit PIN", "warning");
            }
        });

        // PIN auto advance
        const pinBoxes = document.querySelectorAll('.pin-box');
        pinBoxes.forEach((box, idx) => {
            box.addEventListener('input', () => {
                if (box.value && idx < pinBoxes.length - 1) {
                    pinBoxes[idx + 1].focus();
                }
            });
        });
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';

        // Icon based on type
        let iconSvg = '';
        if (type === 'warning') {
            iconSvg = `<svg class="toast-icon text-accent-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        } else if (type === 'success') {
            iconSvg = `<svg class="toast-icon text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        } else {
            iconSvg = `<svg class="toast-icon text-accent-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        toast.innerHTML = `${iconSvg} <span>${message}</span>`;
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            if (this.toastContainer.contains(toast)) {
                toast.remove();
            }
        }, 4500);
    }

    initDrawCanvas() {
        this.ctx = this.drawCanvas.getContext('2d');
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = '#8b5cf6'; // Default color matches UI

        this.isDrawing = false;

        const getCoords = (e) => {
            const rect = this.drawCanvas.getBoundingClientRect();
            // Scale coords to handle CSS scaling if any
            const scaleX = this.drawCanvas.width / rect.width;
            const scaleY = this.drawCanvas.height / rect.height;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const startDrawing = (e) => {
            this.isDrawing = true;
            const { x, y } = getCoords(e);
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            if (e.touches) e.preventDefault();
        };

        const draw = (e) => {
            if (!this.isDrawing) return;
            const { x, y } = getCoords(e);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            if (e.touches) e.preventDefault();
        };

        const stopDrawing = () => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            this.ctx.closePath();
        };

        // Mouse
        this.drawCanvas.addEventListener('mousedown', startDrawing);
        this.drawCanvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', stopDrawing);

        // Touch
        this.drawCanvas.addEventListener('touchstart', startDrawing, { passive: false });
        this.drawCanvas.addEventListener('touchmove', draw, { passive: false });
        window.addEventListener('touchend', stopDrawing);
    }

    update(state, totalProgress) {
        // Basic Telemetry
        this.mapEtaLarge.innerHTML = state.eta > 0 ? `${state.eta}<span>MIN</span>` : `0<span>MIN</span>`;
        this.robotEta.textContent = state.eta > 0 ? `${state.eta} min` : 'Arrived';
        this.robotBattery.textContent = `${state.battery}%`;
        this.robotTemp.textContent = `${state.foodTemp}°C`;

        // Progress bar
        this.mapProgressBar.style.width = `${totalProgress}%`;

        // Battery coloring
        if (state.battery < 20) {
            this.batteryIcon.className = 'tel-icon text-accent-red';
        } else if (state.battery < 50) {
            this.batteryIcon.className = 'tel-icon text-accent-orange';
        } else {
            this.batteryIcon.className = 'tel-icon text-accent-green';
        }

        // Handle Mode changes
        if (this.currentMode !== state.mode) {
            this.currentMode = state.mode;
            this.handleModeChange(state.mode);
        }
    }

    handleModeChange(mode) {
        // Reset indicator classes
        this.statusIndicator.className = 'status-indicator';

        // Remove any previous custom animation classes
        this.robotoAvatarWrapper.classList.remove('shocked');

        switch (mode) {
            case 'NORMAL':
                this.mapStatusText.textContent = "On the Way";
                this.robotStatusTitle.textContent = "Heading to you!";
                this.robotStatusDesc.textContent = "Cruising smoothly with your order.";
                this.updateRobotFace('happy');
                break;

            case 'HOT_FOOD':
                this.mapStatusText.textContent = "Speeding Up";
                this.robotStatusTitle.textContent = "Keeping it Hot!";
                this.robotStatusDesc.textContent = "Accelerating to maintain food temperature.";
                this.statusIndicator.classList.add('warning');
                this.updateRobotFace('cool');
                this.showToast("Food temp dropping. Robot increased speed! 🚀");
                break;

            case 'OBSTACLE':
                this.mapStatusText.textContent = "Rerouting";
                this.robotStatusTitle.textContent = "Obstacle Detected";
                this.robotStatusDesc.textContent = "Calculating alternative path safely.";
                this.statusIndicator.classList.add('danger');
                this.updateRobotFace('shocked');
                this.robotoAvatarWrapper.classList.add('shocked');
                this.showToast("Obstacle encountered! Rerouting temporarily.", "warning");
                break;

            case 'BATTERY_LOW':
                this.mapStatusText.textContent = "Low Battery";
                this.robotStatusTitle.textContent = "Power Saving Mode";
                this.robotStatusDesc.textContent = "Battery is low but sufficient to arrive.";
                this.statusIndicator.classList.add('danger');
                this.updateRobotFace('sad');
                this.showToast("Battery below 20%. Entered power saving mode.", "warning");
                break;

            case 'ARRIVED':
                this.mapStatusText.textContent = "Arrived";
                this.robotStatusTitle.textContent = "Outside your Building!";
                this.robotStatusDesc.textContent = "Please pick up your food.";
                this.updateRobotFace('love');
                this.showToast("Robot has arrived! Unlock the hatch.", "success");

                // Enable central button and pulse it
                this.btnPickupAction.disabled = false;
                this.btnPickupAction.style.animation = 'pulse 2s infinite';

                // Show modal automatically
                setTimeout(() => this.modal.classList.add('visible'), 1000);
                break;
        }
    }

    // Generates premium SVG faces based on expression
    updateRobotFace(expression) {
        const baseColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-purple').trim() || '#9f67ff';
        const glowColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-purple-glow').trim() || 'rgba(159, 103, 255, 0.5)';

        document.documentElement.style.setProperty('--accent-purple-glow', expression === 'shocked' ? 'rgba(239, 68, 68, 0.5)' :
            expression === 'sad' ? 'rgba(245, 158, 11, 0.5)' : glowColor);

        const strokeColor = expression === 'shocked' ? '#ef4444' : expression === 'sad' ? '#f59e0b' : baseColor;

        const baseSVGStart = `<svg viewBox="0 0 200 200" width="100%" height="100%">
      <!-- Robot Base Setup -->
      <defs>
        <radialGradient id="screenGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#2a2a35" />
          <stop offset="100%" stop-color="#18181b" />
        </radialGradient>
      </defs>
      <!-- Housing -->
      <rect x="20" y="30" width="160" height="130" rx="40" fill="#27272a" stroke="#3f3f46" stroke-width="4"/>
      <!-- Inner Screen -->
      <rect x="35" y="45" width="130" height="100" rx="30" fill="url(#screenGlow)" />
      <!-- Expression Elements -->
      <g id="robot-face-elements" stroke="${strokeColor}" fill="${strokeColor}">
    `;

        let faceSVG = '';

        if (this.isCustomFaceActive && expression === 'custom') {
            faceSVG = `<image href="${this.customFaceDataUrl}" x="35" y="45" width="130" height="100" preserveAspectRatio="none" />`;
        } else {
            switch (expression) {
                case 'happy':
                    faceSVG = `
              <!-- Eyes -->
              <circle cx="70" cy="80" r="12" />
              <circle cx="130" cy="80" r="12" />
              <!-- Smile -->
              <path d="M 70 110 Q 100 135 130 110" fill="none" stroke-width="8" stroke-linecap="round" />
            `;
                    break;
                case 'cool':
                    faceSVG = `
              <!-- Sunglasses -->
              <rect x="55" y="70" width="40" height="15" rx="4" />
              <rect x="105" y="70" width="40" height="15" rx="4" />
              <line x1="95" y1="75" x2="105" y2="75" stroke-width="6" />
              <!-- Smirk -->
              <path d="M 80 120 L 120 115" fill="none" stroke-width="8" stroke-linecap="round" />
            `;
                    break;
                case 'shocked':
                    faceSVG = `
              <!-- Wide Eyes -->
              <circle cx="70" cy="75" r="14" fill="none" stroke-width="6" />
              <circle cx="130" cy="75" r="14" fill="none" stroke-width="6" />
              <circle cx="70" cy="75" r="4" />
              <circle cx="130" cy="75" r="4" />
              <!-- O mouth -->
              <circle cx="100" cy="115" r="10" fill="none" stroke-width="6" />
            `;
                    break;
                case 'sad':
                    faceSVG = `
              <!-- Droopy eyes -->
              <path d="M 55 85 Q 70 70 85 85" fill="none" stroke-width="8" stroke-linecap="round" />
              <path d="M 115 85 Q 130 70 145 85" fill="none" stroke-width="8" stroke-linecap="round" />
              <!-- Frown -->
              <path d="M 75 125 Q 100 110 125 125" fill="none" stroke-width="8" stroke-linecap="round" />
            `;
                    break;
                case 'love':
                    faceSVG = `
              <!-- Heart eyes -->
              <path d="M 70 90 A 8 8 0 0 1 86 90 A 8 8 0 0 1 102 90 Q 102 105 86 115 Q 70 105 70 90" transform="translate(-25, -20) scale(1.2)"/>
              <path d="M 70 90 A 8 8 0 0 1 86 90 A 8 8 0 0 1 102 90 Q 102 105 86 115 Q 70 105 70 90" transform="translate(35, -20) scale(1.2)"/>
              <!-- Happy mouth -->
              <path d="M 75 110 Q 100 130 125 110" fill="none" stroke-width="8" stroke-linecap="round" />
            `;
                    break;
                default:
                    if (this.isCustomFaceActive) {
                        faceSVG = `<image href="${this.customFaceDataUrl}" x="35" y="45" width="130" height="100" preserveAspectRatio="none" />`;
                    } else {
                        faceSVG = `
                  <line x1="60" y1="80" x2="80" y2="80" stroke-width="10" stroke-linecap="round" />
                  <line x1="120" y1="80" x2="140" y2="80" stroke-width="10" stroke-linecap="round" />
                  <line x1="80" y1="120" x2="120" y2="120" stroke-width="8" stroke-linecap="round" />
                `;
                    }
                    break;
            }
        }

        const baseSVGEnd = `</g></svg>`;
        this.robotoAvatarWrapper.innerHTML = baseSVGStart + faceSVG + baseSVGEnd;
    }
}
