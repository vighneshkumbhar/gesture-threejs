import * as THREE from 'three';
import { ParticleSystemConfig, GestureName } from '../core/types.js';
import { ForceField } from './ForceField.js';
export interface ParticleSystemOptions extends Partial<ParticleSystemConfig> {
    distribution?: 'sphere' | 'disk' | 'cube' | 'galaxy' | 'custom';
    customPositions?: (count: number) => Float32Array;
    colorScheme?: 'gradient' | 'random' | 'velocity' | 'custom';
    customColors?: (positions: Float32Array, count: number) => Float32Array;
}
export declare class ParticleSystem {
    geometry: THREE.BufferGeometry;
    material: THREE.PointsMaterial;
    points: THREE.Points;
    particleCount: number;
    private positions;
    private originalPositions;
    private velocities;
    private colors;
    private sizes;
    private config;
    private forceFields;
    private clock;
    private activeGesture;
    private gestureForceField;
    constructor(options?: ParticleSystemOptions);
    private initializeGeometry;
    private generatePositions;
    private generateColors;
    private initializeMaterial;
    addForceField(forceField: ForceField): void;
    removeForceField(forceField: ForceField): void;
    setGesture(gesture: GestureName, handPosition?: THREE.Vector3): void;
    private createGestureForceField;
    animate(delta: number): void;
    reset(): void;
    setParticleCount(count: number): void;
    getObject(): THREE.Points;
    dispose(): void;
}
//# sourceMappingURL=ParticleSystem.d.ts.map