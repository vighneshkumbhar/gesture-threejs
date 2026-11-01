import { GestureName, Landmark, GestureVocabularyConfig } from './types.js';
export declare const GESTURE_VOCABULARY: Record<GestureName, {
    icon: string;
    description: string;
    aliases: string[];
}>;
export declare class GestureVocabulary {
    private config;
    private customDetectors;
    constructor(config?: GestureVocabularyConfig);
    detect(landmarks: Landmark[]): GestureName;
    private detectStandardGestures;
    getGestureInfo(name: GestureName): {
        icon: string;
        description: string;
        aliases: string[];
    };
    getAllGestures(): GestureName[];
    addCustomGesture(name: string, detector: (landmarks: Landmark[]) => boolean): void;
    removeCustomGesture(name: string): void;
    updateConfig(config: Partial<GestureVocabularyConfig>): void;
    getConfig(): Required<GestureVocabularyConfig>;
}
export declare const defaultVocabulary: GestureVocabulary;
//# sourceMappingURL=GestureVocabulary.d.ts.map