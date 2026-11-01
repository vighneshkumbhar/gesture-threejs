// ForceField - Physics force fields for gesture-controlled particle effects
// Supports attract, repel, twist, implode, explode, gravity, turbulence, split, flatten, colorShift

import * as THREE from 'three';
import { ForceFieldConfig, GestureName } from '../core/types.js';

export class ForceField {
  public type: ForceFieldConfig['type'];
  public strength: number;
  public radius: number;
  public center: THREE.Vector3;
  public gesture: GestureName;
  public enabled: boolean = true;

  constructor(config: ForceFieldConfig) {
    this.type = config.type;
    this.strength = config.strength;
    this.radius = config.radius;
    this.center = config.center.clone();
    this.gesture = config.gesture;
  }

  // Calculate force vector at a point
  calculateForce(x: number, y: number, z: number, delta: number): THREE.Vector3 {
    if (!this.enabled) return new THREE.Vector3(0, 0, 0);

    const dx = this.center.x - x;
    const dy = this.center.y - y;
    const dz = this.center.z - z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance > this.radius) return new THREE.Vector3(0, 0, 0);
    if (distance === 0) return new THREE.Vector3(0, 0, 0);

    const normalizedX = dx / distance;
    const normalizedY = dy / distance;
    const normalizedZ = dz / distance;
    const falloff = 1 - (distance / this.radius); // Linear falloff
    const forceMagnitude = this.strength * falloff * delta * 60; // Normalize to 60fps

    switch (this.type) {
      case 'attract':
        return new THREE.Vector3(
          normalizedX * forceMagnitude,
          normalizedY * forceMagnitude,
          normalizedZ * forceMagnitude
        );

      case 'repel':
        return new THREE.Vector3(
          -normalizedX * forceMagnitude,
          -normalizedY * forceMagnitude,
          -normalizedZ * forceMagnitude
        );

      case 'twist':
        // Tangential force for swirling
        const twistX = -normalizedZ * forceMagnitude;
        const twistZ = normalizedX * forceMagnitude;
        return new THREE.Vector3(twistX, 0, twistZ);

      case 'implode':
        // Strong attract to center
        return new THREE.Vector3(
          normalizedX * forceMagnitude * 2,
          normalizedY * forceMagnitude * 2,
          normalizedZ * forceMagnitude * 2
        );

      case 'explode':
        // Strong repel from center
        return new THREE.Vector3(
          -normalizedX * forceMagnitude * 2,
          -normalizedY * forceMagnitude * 2,
          -normalizedZ * forceMagnitude * 2
        );

      case 'gravity':
        // Planetary gravity (inverse square)
        const gravityForce = forceMagnitude / (distance * distance + 1);
        return new THREE.Vector3(
          normalizedX * gravityForce,
          normalizedY * gravityForce,
          normalizedZ * gravityForce
        );

      case 'turbulence':
        // Random noise force
        return new THREE.Vector3(
          (Math.random() - 0.5) * forceMagnitude,
          (Math.random() - 0.5) * forceMagnitude,
          (Math.random() - 0.5) * forceMagnitude
        );

      case 'split':
        // Split along X axis based on particle index (handled externally)
        // Here we just provide radial force
        return new THREE.Vector3(
          normalizedX * forceMagnitude,
          0,
          normalizedZ * forceMagnitude
        );

      case 'flatten':
        // Force Y toward center Y
        const flattenForce = (this.center.y - y) * this.strength * delta * 60;
        return new THREE.Vector3(0, flattenForce, 0);

      case 'colorShift':
        // No positional force - color handled in particle system
        return new THREE.Vector3(0, 0, 0);

      default:
        return new THREE.Vector3(0, 0, 0);
    }
  }

  // Update center position (e.g., for following hand)
  setCenter(center: THREE.Vector3): void {
    this.center.copy(center);
  }

  // Update strength
  setStrength(strength: number): void {
    this.strength = strength;
  }

  // Enable/disable
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Create force field from gesture type and hand position
  static fromGesture(gesture: GestureName, handPosition: THREE.Vector3, strength?: number): ForceField {
    const configs: Record<GestureName, { type: ForceFieldConfig['type']; strength: number; radius: number }> = {
      Open: { type: 'explode', strength: 2.0, radius: 50 },
      Fist: { type: 'implode', strength: 3.0, radius: 50 },
      Point: { type: 'gravity', strength: 1.5, radius: 30 },
      Pinch: { type: 'colorShift', strength: 0.5, radius: 100 },
      Peace: { type: 'split', strength: 2.0, radius: 40 },
      Stop: { type: 'flatten', strength: 5.0, radius: 30 },
      ThumbsUp: { type: 'turbulence', strength: 1.0, radius: 50 },
      Rock: { type: 'turbulence', strength: 2.0, radius: 40 },
      Shaka: { type: 'twist', strength: 5.0, radius: 50 },
      Vulcan: { type: 'colorShift', strength: 1.0, radius: 100 },
      Neutral: { type: 'attract', strength: 0.5, radius: 50 }
    };

    const config = configs[gesture] || configs.Neutral;
    return new ForceField({
      type: config.type,
      strength: strength ?? config.strength,
      radius: config.radius,
      center: handPosition.clone(),
      gesture
    });
  }
}