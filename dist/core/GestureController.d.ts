import { GestureName, Landmark, GestureEvent, GestureVocabularyConfig } from './types.js';
export interface GestureControllerConfig {
    maxNumHands?: number;
    modelComplexity?: 0 | 1;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
    vocabulary?: GestureVocabularyConfig;
    onGesture?: (event: GestureEvent) => void;
    onHandLost?: (handIndex: number) => void;
    onError?: (error: Error) => void;
}
export declare class GestureController {
    private hands;
    private camera;
    private videoElement;
    private vocabulary;
    private config;
    private isRunning;
    private lastGestures;
    private gestureDebounce;
    constructor(config?: GestureControllerConfig);
    initialize(videoElement: HTMLVideoElement): Promise<void>;
    private loadMediaPipe;
    private loadScript;
    private setupHands;
    private setupCamera;
    private handleResults;
    private processGesture;
    start(): void;
    stop(): void;
    updateVocabulary(config: Partial<GestureVocabularyConfig>): void;
    addCustomGesture(name: string, detector: (landmarks: Landmark[]) => boolean): void;
    getCurrentGesture(handIndex: number): GestureName | undefined;
    get running(): boolean;
    dispose(): void;
}
//# sourceMappingURL=GestureController.d.ts.map