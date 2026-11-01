// GestureController - MediaPipe Hands wrapper with gesture classification
// Event-based API for real-time gesture detection
import { GestureVocabulary } from './GestureVocabulary.js';
export class GestureController {
    hands = null;
    camera = null;
    videoElement = null;
    vocabulary;
    config;
    isRunning = false;
    lastGestures = new Map();
    gestureDebounce = new Map();
    constructor(config = {}) {
        this.config = {
            maxNumHands: config.maxNumHands ?? 1,
            modelComplexity: config.modelComplexity ?? 1,
            minDetectionConfidence: config.minDetectionConfidence ?? 0.7,
            minTrackingConfidence: config.minTrackingConfidence ?? 0.7,
            vocabulary: config.vocabulary ?? {},
            onGesture: config.onGesture ?? (() => { }),
            onHandLost: config.onHandLost ?? (() => { }),
            onError: config.onError ?? ((e) => console.error('[GestureController]', e))
        };
        this.vocabulary = new GestureVocabulary(this.config.vocabulary);
    }
    // Initialize with video element
    async initialize(videoElement) {
        this.videoElement = videoElement;
        await this.loadMediaPipe();
        this.setupHands();
        this.setupCamera();
    }
    // Load MediaPipe Hands from CDN
    async loadMediaPipe() {
        if (typeof window !== 'undefined' && window.Hands) {
            return; // Already loaded
        }
        // Load scripts dynamically
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
    }
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }
    setupHands() {
        const Hands = window.Hands;
        if (!Hands)
            throw new Error('MediaPipe Hands not loaded');
        this.hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        this.hands.setOptions({
            maxNumHands: this.config.maxNumHands,
            modelComplexity: this.config.modelComplexity,
            minDetectionConfidence: this.config.minDetectionConfidence,
            minTrackingConfidence: this.config.minTrackingConfidence
        });
        this.hands.onResults((results) => this.handleResults(results));
    }
    setupCamera() {
        if (!this.videoElement)
            throw new Error('Video element not set');
        const Camera = window.Camera;
        if (!Camera)
            throw new Error('MediaPipe Camera utils not loaded');
        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                if (this.hands && this.isRunning) {
                    await this.hands.send({ image: this.videoElement });
                }
            },
            width: 320,
            height: 240
        });
    }
    handleResults(results) {
        const currentHandIndices = new Set();
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            results.multiHandLandmarks.forEach((landmarks, handIndex) => {
                currentHandIndices.add(handIndex);
                const gesture = this.vocabulary.detect(landmarks);
                this.processGesture(handIndex, gesture, landmarks, 1.0); // MediaPipe doesn't provide confidence directly
            });
        }
        // Detect lost hands
        this.lastGestures.forEach((_, handIndex) => {
            if (!currentHandIndices.has(handIndex)) {
                this.config.onHandLost(handIndex);
                this.lastGestures.delete(handIndex);
                this.gestureDebounce.delete(handIndex);
            }
        });
    }
    processGesture(handIndex, gesture, landmarks, confidence) {
        const now = Date.now();
        const lastGesture = this.lastGestures.get(handIndex);
        const lastTime = this.gestureDebounce.get(handIndex) || 0;
        // Debounce: only emit on change or after debounce period
        const debounceMs = this.config.vocabulary.debounceMs ?? 300;
        if (gesture === lastGesture && now - lastTime < debounceMs) {
            return;
        }
        // Update tracking
        this.lastGestures.set(handIndex, gesture);
        this.gestureDebounce.set(handIndex, now);
        // Emit event
        const event = {
            name: gesture,
            timestamp: now,
            confidence,
            landmarks,
            handIndex
        };
        this.config.onGesture(event);
    }
    // Start detection
    start() {
        if (this.camera) {
            this.isRunning = true;
            this.camera.start();
        }
    }
    // Stop detection
    stop() {
        this.isRunning = false;
        if (this.camera) {
            this.camera.stop();
        }
    }
    // Update vocabulary configuration
    updateVocabulary(config) {
        this.vocabulary.updateConfig(config);
    }
    // Add custom gesture
    addCustomGesture(name, detector) {
        this.vocabulary.addCustomGesture(name, detector);
    }
    // Get current gesture for hand
    getCurrentGesture(handIndex) {
        return this.lastGestures.get(handIndex);
    }
    // Check if running
    get running() {
        return this.isRunning;
    }
    // Cleanup
    dispose() {
        this.stop();
        if (this.hands) {
            this.hands.close();
            this.hands = null;
        }
        this.camera = null;
        this.videoElement = null;
        this.lastGestures.clear();
        this.gestureDebounce.clear();
    }
}
//# sourceMappingURL=GestureController.js.map