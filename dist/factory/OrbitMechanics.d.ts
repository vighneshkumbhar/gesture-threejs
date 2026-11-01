import * as THREE from 'three';
import { OrbitMechanicsConfig } from '../core/types.js';
export interface OrbitalElements {
    a: number;
    e: number;
    i: number;
    omega: number;
    w: number;
    M0: number;
    epoch: number;
}
export interface BodyState {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
}
export declare class OrbitMechanics {
    private config;
    private G;
    private centralMass;
    constructor(config?: OrbitMechanicsConfig);
    elementsToState(elements: OrbitalElements, time: number): BodyState;
    stateToElements(state: BodyState, time: number): OrbitalElements;
    calculateCircularPosition(radius: number, angularSpeed: number, startAngle: number, time: number): THREE.Vector3;
    getOrbitalPeriod(a: number): number;
    getCircularSpeed(radius: number): number;
    getEscapeVelocity(radius: number): number;
    calculateHohmannTransfer(r1: number, r2: number): {
        dv1: number;
        dv2: number;
        transferTime: number;
    };
    setCentralMass(mass: number): void;
    setGravitationalConstant(G: number): void;
}
export declare const SOLAR_SYSTEM_ELEMENTS: Record<string, OrbitalElements>;
//# sourceMappingURL=OrbitMechanics.d.ts.map