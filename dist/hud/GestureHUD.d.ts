import { GestureHUDConfig, GestureName, Landmark, GestureEvent } from '../core/types.js';
export declare class GestureHUD {
    private canvas;
    private ctx;
    private config;
    private currentGesture;
    private currentLandmarks;
    private gestureIcon;
    private gestureConfidence;
    private fps;
    private frameCount;
    private lastFpsTime;
    private particleCount;
    private targetName;
    private viewMode;
    private timeSpeed;
    constructor(config?: GestureHUDConfig);
    private setPosition;
    private resize;
    attachTo(parent?: HTMLElement): void;
    detach(): void;
    updateFromGestureEvent(event: GestureEvent): void;
    setGesture(gesture: GestureName, icon?: string): void;
    setLandmarks(landmarks: Landmark[]): void;
    updatePerformance(fps: number, particleCount: number): void;
    setAppState(targetName: string, viewMode: string, timeSpeed: number): void;
    private getGestureIcon;
    render(): void;
    private drawLandmarks;
    updateConfig(config: Partial<GestureHUDConfig>): void;
    getCanvas(): HTMLCanvasElement;
    getContext(): CanvasRenderingContext2D;
    dispose(): void;
}
//# sourceMappingURL=GestureHUD.d.ts.map