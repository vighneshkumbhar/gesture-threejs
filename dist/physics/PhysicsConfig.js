// PhysicsConfig - Configuration for particle physics simulation
export const DEFAULT_PHYSICS_CONFIG = {
    particleSystem: {
        particleCount: 10000,
        textureSize: 32,
        blending: 'AdditiveBlending',
        depthWrite: false,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        distribution: 'sphere',
        colorScheme: 'gradient'
    },
    forceFields: {
        defaultStrength: 1.0,
        defaultRadius: 30,
        maxForceFields: 10,
        gravityConstant: 0.01
    },
    simulation: {
        fixedTimeStep: 1 / 60,
        maxSubSteps: 3,
        damping: 0.98,
        globalGravity: new (require('three')).Vector3(0, -0.1, 0)
    }
};
export function createPhysicsConfig(overrides = {}) {
    return {
        ...DEFAULT_PHYSICS_CONFIG,
        ...overrides,
        particleSystem: {
            ...DEFAULT_PHYSICS_CONFIG.particleSystem,
            ...overrides.particleSystem
        },
        forceFields: {
            ...DEFAULT_PHYSICS_CONFIG.forceFields,
            ...overrides.forceFields
        },
        simulation: {
            ...DEFAULT_PHYSICS_CONFIG.simulation,
            ...overrides.simulation
        }
    };
}
//# sourceMappingURL=PhysicsConfig.js.map