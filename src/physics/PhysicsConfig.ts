// PhysicsConfig - Configuration for particle physics simulation

import { ParticleSystemConfig, ForceFieldConfig } from '../core/types.js';
import * as THREE from 'three';

export const DEFAULT_PHYSICS_CONFIG = {
  particleSystem: {
    particleCount: 10000,
    textureSize: 32,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    distribution: 'sphere' as const,
    colorScheme: 'gradient' as const
  } as ParticleSystemConfig,
  
  forceFields: {
    defaultStrength: 1.0,
    defaultRadius: 30,
    maxForceFields: 10,
    gravityConstant: 0.01
  },

  simulation: {
    fixedTimeStep: 1/60,
    maxSubSteps: 3,
    damping: 0.98,
    globalGravity: new THREE.Vector3(0, -0.1, 0)
  }
};

export function createPhysicsConfig(overrides: Partial<typeof DEFAULT_PHYSICS_CONFIG> = {}) {
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
    globalGravity: THREE.Vector3;
  };
}