// GestureController - MediaPipe Hands wrapper with gesture classification
// Event-based API for real-time gesture detection

import { GestureName, Landmark, GestureEvent, GestureVocabularyConfig } from './types.js';
import { GestureVocabulary } from './GestureVocabulary.js';

export interface GestureControllerConfig {
  // MediaPipe Hands options
  maxNumHands?: number;
  modelComplexity?: 0 | 1;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  // Gesture vocabulary config
  vocabulary?: GestureVocabularyConfig;
  // Callbacks
  onGesture?: (event: GestureEvent) => void;
  onHandLost?: (handIndex: number) => void;
  onError?: (error: Error) => void;
}

export class GestureController {
  private hands: any = null;
  private camera: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private vocabulary: GestureVocabulary;
  private config: Required<GestureControllerConfig>;
  private isRunning: boolean = false;
  private lastGestures: Map<number, GestureName> = new Map();
  private gestureDebounce: Map<number, number> = new Map();

  constructor(config: GestureControllerConfig = {}) {
    this.config = {
      maxNumHands: config.maxNumHands ?? 1,
      modelComplexity: config.modelComplexity ?? 1,
      minDetectionConfidence: config.minDetectionConfidence ?? 0.7,
      minTrackingConfidence: config.minTrackingConfidence ?? 0.7,
      vocabulary: config.vocabulary ?? {},
      onGesture: config.onGesture ?? (() => {}),
      onHandLost: config.onHandLost ?? (() => {}),
      onError: config.onError ?? ((e) => console.error('[GestureController]', e))
    };
    this.vocabulary = new GestureVocabulary(this.config.vocabulary);
  }

  // Initialize with video element
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    await this.loadMediaPipe();
    this.setupHands();
    this.setupCamera();
  }

  // Load MediaPipe Hands from CDN
  private async loadMediaPipe(): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).Hands) {
      return; // Already loaded
    }

    // Load scripts dynamically
    await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
    await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js');
    await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
  }

  private loadScript(src: string): Promise<void> {
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

  private setupHands(): void {
    const Hands = (window as any).Hands;
    if (!Hands) throw new Error('MediaPipe Hands not loaded');

    this.hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    this.hands.setOptions({
      maxNumHands: this.config.maxNumHands,
      modelComplexity: this.config.modelComplexity,
      minDetectionConfidence: this.config.minDetectionConfidence,
      minTrackingConfidence: this.config.minTrackingConfidence
    });

    this.hands.onResults((results: any) => this.handleResults(results));
  }

  private setupCamera(): void {
    if (!this.videoElement) throw new Error('Video element not set');
    const Camera = (window as any).Camera;
    if (!Camera) throw new Error('MediaPipe Camera utils not loaded');

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

  private handleResults(results: any): void {
    const currentHandIndices = new Set<number>();

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      results.multiHandLandmarks.forEach((landmarks: Landmark[], handIndex: number) => {
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

  private processGesture(handIndex: number, gesture: GestureName, landmarks: Landmark[], confidence: number): void {
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
    const event: GestureEvent = {
      name: gesture,
      timestamp: now,
      confidence,
      landmarks,
      handIndex
    };

    this.config.onGesture(event);
  }

  // Start detection
  start(): void {
    if (this.camera) {
      this.isRunning = true;
      this.camera.start();
    }
  }

  // Stop detection
  stop(): void {
    this.isRunning = false;
    if (this.camera) {
      this.camera.stop();
    }
  }

  // Update vocabulary configuration
  updateVocabulary(config: Partial<GestureVocabularyConfig>): void {
    this.vocabulary.updateConfig(config);
  }

  // Add custom gesture
  addCustomGesture(name: string, detector: (landmarks: Landmark[]) => boolean): void {
    this.vocabulary.addCustomGesture(name, detector);
  }

  // Get current gesture for hand
  getCurrentGesture(handIndex: number): GestureName | undefined {
    return this.lastGestures.get(handIndex);
  }

  // Check if running
  get running(): boolean {
    return this.isRunning;
  }

  // Cleanup
  dispose(): void {
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