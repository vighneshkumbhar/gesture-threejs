import { ParticleSystemConfig } from '../core/types.js';
export declare const DEFAULT_PHYSICS_CONFIG: {
    particleSystem: ParticleSystemConfig;
    forceFields: {
        defaultStrength: number;
        defaultRadius: number;
        maxForceFields: number;
        gravityConstant: number;
    };
    simulation: {
        fixedTimeStep: number;
        maxSubSteps: number;
        damping: number;
        globalGravity: any;
    };
};
export declare function createPhysicsConfig(overrides?: Partial<typeof DEFAULT_PHYSICS_CONFIG>): {
    particleSystem: {
        particleCount: number;
        textureSize: number;
        blending: THREE.Blending;
        depthWrite: boolean;
        transparent: boolean;
        opacity: number;
        sizeAttenuation: boolean;
    };
    forceFields: {
        defaultStrength: number;
        defaultRadius: number;
        maxForceFields: number;
        gravityConstant: number;
    };
    simulation: {
        fixedTimeStep: number;
        maxSubSteps: number;
        damping: number;
        globalGravity: any;
    };
};
export interface PhysicsConfig {
    particleSystem: ParticleSystemConfig;
    forceFields: {
        defaultStrength: number;
        defaultRadius: number;
        maxForceFields: number;
        gravityConstant: number;
    };
    simulation: {
        fixedTimeStep: number;
        maxSubSteps: number;
        damping: number;
        globalGravity: any;
    };
}
//# sourceMappingURL=PhysicsConfig.d.ts.map