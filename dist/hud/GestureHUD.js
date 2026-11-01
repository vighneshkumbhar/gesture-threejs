// GestureHUD - Real-time gesture overlay with landmarks and performance metrics
// Canvas-based overlay for Three.js applications
export class GestureHUD {
    canvas;
    ctx;
    config;
    currentGesture = 'Neutral';
    currentLandmarks = [];
    gestureIcon = '✋';
    gestureConfidence = 0;
    fps = 0;
    frameCount = 0;
    lastFpsTime = 0;
    particleCount = 0;
    targetName = 'None';
    viewMode = 'Orbit';
    timeSpeed = 1.0;
    constructor(config = {}) {
        this.config = {
            showLandmarks: config.showLandmarks ?? true,
            showGestureName: config.showGestureName ?? true,
            showPerformance: config.showPerformance ?? true,
            position: config.position ?? 'top-left'
        };
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '100';
        this.setPosition(this.config.position);
        const ctx = this.canvas.getContext('2d');
        if (!ctx)
            throw new Error('Failed to get canvas context');
        this.ctx = ctx;
        // Initialize size
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    setPosition(position) {
        const style = this.canvas.style;
        style.top = style.bottom = style.left = style.right = 'auto';
        switch (position) {
            case 'top-left':
                style.top = '20px';
                style.left = '20px';
                break;
            case 'top-right':
                style.top = '20px';
                style.right = '20px';
                break;
            case 'bottom-left':
                style.bottom = '20px';
                style.left = '20px';
                break;
            case 'bottom-right':
                style.bottom = '20px';
                style.right = '20px';
                break;
        }
    }
    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = 300 * dpr;
        this.canvas.height = 200 * dpr;
        this.canvas.style.width = '300px';
        this.canvas.style.height = '200px';
        this.ctx.scale(dpr, dpr);
    }
    // Attach to DOM
    attachTo(parent = document.body) {
        parent.appendChild(this.canvas);
    }
    // Detach from DOM
    detach() {
        if (this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
    }
    // Update from GestureController event
    updateFromGestureEvent(event) {
        this.currentGesture = event.name;
        this.currentLandmarks = event.landmarks;
        this.gestureConfidence = event.confidence;
        this.gestureIcon = this.getGestureIcon(event.name);
    }
    // Update gesture manually
    setGesture(gesture, icon) {
        this.currentGesture = gesture;
        this.gestureIcon = icon || this.getGestureIcon(gesture);
    }
    // Update landmarks
    setLandmarks(landmarks) {
        this.currentLandmarks = landmarks;
    }
    // Update performance metrics
    updatePerformance(fps, particleCount) {
        this.fps = fps;
        this.particleCount = particleCount;
    }
    // Update app state
    setAppState(targetName, viewMode, timeSpeed) {
        this.targetName = targetName;
        this.viewMode = viewMode;
        this.timeSpeed = timeSpeed;
    }
    // Get gesture icon
    getGestureIcon(gesture) {
        const icons = {
            Open: '🖐️', Fist: '✊', Point: '☝️', Pinch: '🤏',
            Peace: '✌️', Stop: '🛑', ThumbsUp: '👍', Rock: '🤘',
            Shaka: '🤙', Vulcan: '🖖', Neutral: '✋'
        };
        return icons[gesture] || '✋';
    }
    // Main render loop
    render() {
        const ctx = this.ctx;
        const width = 300;
        const height = 200;
        // Clear
        ctx.clearRect(0, 0, width, height);
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);
        // Border accent
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        let y = 15;
        const lineHeight = 22;
        // Title
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText('Gesture Solar System', 10, y);
        y += lineHeight;
        // Gesture display
        if (this.config.showGestureName) {
            ctx.font = '28px "Segoe UI Emoji", sans-serif';
            ctx.fillStyle = '#00d2ff';
            ctx.fillText(this.gestureIcon, 10, y + 5);
            ctx.font = 'bold 14px "Segoe UI", sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText(this.currentGesture, 50, y + 10);
            // Confidence bar
            const barWidth = 100;
            const barHeight = 6;
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(50, y + 15, barWidth, barHeight);
            ctx.fillStyle = this.gestureConfidence > 0.7 ? '#00ff88' : '#ffaa00';
            ctx.fillRect(50, y + 15, barWidth * this.gestureConfidence, barHeight);
            y += lineHeight * 2;
        }
        // App state
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(`Target: ${this.targetName}`, 10, y);
        y += lineHeight;
        ctx.fillText(`View: ${this.viewMode}`, 10, y);
        y += lineHeight;
        ctx.fillText(`Time: ${this.timeSpeed.toFixed(1)}x`, 10, y);
        y += lineHeight * 1.5;
        // Performance
        if (this.config.showPerformance) {
            ctx.font = 'bold 11px "Segoe UI", sans-serif';
            ctx.fillStyle = '#00ff88';
            ctx.fillText('PERFORMANCE', 10, y);
            y += lineHeight;
            ctx.font = '11px "Segoe UI", sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText(`FPS: ${this.fps}`, 10, y);
            y += lineHeight;
            ctx.fillText(`Particles: ${this.particleCount.toLocaleString()}`, 10, y);
            y += lineHeight;
            ctx.fillText(`Landmarks: ${this.currentLandmarks.length}`, 10, y);
            y += lineHeight * 1.5;
        }
        // Gesture guide
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.fillStyle = '#00d2ff';
        ctx.fillText('GESTURES', 10, y);
        y += lineHeight;
        ctx.font = '10px "Segoe UI Emoji", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        const gestures = [
            '🖐️ Open: Orbit View',
            '✊ Fist: Zoom Target',
            '☝️ Point: Next',
            '🤏 Pinch: Previous',
            '✌️ Peace: Time 10x',
            '🛑 Stop: Pause'
        ];
        for (const g of gestures) {
            ctx.fillText(g, 10, y);
            y += 16;
        }
        // Draw hand landmarks if available
        if (this.config.showLandmarks && this.currentLandmarks.length > 0) {
            this.drawLandmarks();
        }
    }
    // Draw hand landmarks on canvas (mini preview)
    drawLandmarks() {
        const ctx = this.ctx;
        const landmarks = this.currentLandmarks;
        if (landmarks.length < 21)
            return;
        // Draw in bottom right of HUD
        const cx = 260;
        const cy = 160;
        const scale = 30;
        // Connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // index
            [5, 9], [9, 10], [10, 11], [11, 12], // middle
            [9, 13], [13, 14], [14, 15], [15, 16], // ring
            [13, 17], [17, 18], [18, 19], [19, 20], // pinky
            [0, 5], [5, 9], [9, 13], [13, 17] // palm
        ];
        ctx.strokeStyle = 'rgba(0,210,255,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (const [a, b] of connections) {
            if (landmarks[a] && landmarks[b]) {
                const x1 = cx + landmarks[a].x * scale;
                const y1 = cy - landmarks[a].y * scale;
                const x2 = cx + landmarks[b].x * scale;
                const y2 = cy - landmarks[b].y * scale;
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
        }
        ctx.stroke();
        // Landmark points
        ctx.fillStyle = '#ff0055';
        for (let i = 0; i < landmarks.length; i++) {
            const lm = landmarks[i];
            const x = cx + lm.x * scale;
            const y = cy - lm.y * scale;
            ctx.beginPath();
            ctx.arc(x, y, i === 0 ? 4 : 2, 0, Math.PI * 2);
            ctx.fill();
        }
        // Wrist label
        ctx.font = '8px "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('HAND', cx - 10, cy + 35);
    }
    // Update config
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        if (config.position)
            this.setPosition(config.position);
    }
    // Get canvas for custom rendering
    getCanvas() {
        return this.canvas;
    }
    // Get context for custom rendering
    getContext() {
        return this.ctx;
    }
    // Dispose
    dispose() {
        this.detach();
        window.removeEventListener('resize', () => this.resize());
    }
}
//# sourceMappingURL=GestureHUD.js.map