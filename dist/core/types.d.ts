export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}
export interface GestureEvent {
    name: GestureName;
    timestamp: number;
    confidence: number;
    landmarks: Landmark[];
    handIndex: number;
}
export type GestureName = 'Open' | 'Fist' | 'Point' | 'Pinch' | 'Peace' | 'Stop' | 'ThumbsUp' | 'Rock' | 'Shaka' | 'Vulcan' | 'Neutral';
export interface GestureVocabularyConfig {
    customGestures?: Record<string, (landmarks: Landmark[]) => boolean>;
    debounceMs?: number;
    minConfidence?: number;
}
export interface ParticleSystemConfig {
    particleCount: number;
    textureSize: number;
    blending: THREE.Blending;
    depthWrite: boolean;
    transparent: boolean;
    opacity: number;
    sizeAttenuation: boolean;
}
export interface ForceFieldConfig {
    type: 'attract' | 'repel' | 'twist' | 'implode' | 'explode' | 'gravity' | 'turbulence' | 'split' | 'flatten' | 'colorShift';
    strength: number;
    radius: number;
    center: THREE.Vector3;
    gesture: GestureName;
}
export interface CelestialBodyConfig {
    name: string;
    radius: number;
    distance: number;
    orbitalSpeed: number;
    textureUrl?: string;
    emissive?: boolean;
    color?: THREE.ColorRepresentation;
}
export interface OrbitMechanicsConfig {
    centralBodyMass: number;
    gravitationalConstant: number;
}
export interface GestureOrbitControlsConfig {
    enableGestureFallback: boolean;
    gestureDebounceMs: number;
    smoothFactor: number;
}
export interface GestureHUDConfig {
    showLandmarks: boolean;
    showGestureName: boolean;
    showPerformance: boolean;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
declare global {
    namespace THREE {
        interface Vector3 {
            x: number;
            y: number;
            z: number;
        }
        interface Color {
            r: number;
            g: number;
            b: number;
        }
        interface BufferGeometry {
        }
        interface BufferAttribute {
        }
        interface PointsMaterial {
        }
        interface Points {
        }
        interface Scene {
        }
        interface Camera {
        }
        interface WebGLRenderer {
        }
        interface TextureLoader {
        }
        interface Clock {
        }
        type Blending = number;
        const AdditiveBlending: Blending;
        const NormalBlending: Blending;
        const MeshBasicMaterial: any;
        const MeshPhongMaterial: any;
        const SphereGeometry: any;
        const BufferGeometry: any;
        const Float32BufferAttribute: any;
        const PointsMaterial: any;
        const Points: any;
        const Vector3: any;
        const Color: any;
        const TextureLoader: any;
        const CanvasTexture: any;
        const FogExp2: any;
        const PerspectiveCamera: any;
        const WebGLRenderer: any;
        const Clock: any;
        const MathUtils: {
            randFloatSpread: (range: number) => number;
        };
    }
}
//# sourceMappingURL=types.d.ts.map