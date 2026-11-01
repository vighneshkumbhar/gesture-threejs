import * as THREE from 'three';
import { ForceFieldConfig, GestureName } from '../core/types.js';
export declare class ForceField {
    type: ForceFieldConfig['type'];
    strength: number;
    radius: number;
    center: THREE.Vector3;
    gesture: GestureName;
    enabled: boolean;
    constructor(config: ForceFieldConfig);
    calculateForce(x: number, y: number, z: number, delta: number): THREE.Vector3;
    setCenter(center: THREE.Vector3): void;
    setStrength(strength: number): void;
    setEnabled(enabled: boolean): void;
    static fromGesture(gesture: GestureName, handPosition: THREE.Vector3, strength?: number): ForceField;
}
//# sourceMappingURL=ForceField.d.ts.map