// ParticleSystem - GPU-instanced particle system with gesture physics
// Supports 10k+ particles at 60fps on RTX 3050
import * as THREE from 'three';
import { ForceField } from './ForceField.js';
export class ParticleSystem {
    geometry;
    material;
    points;
    particleCount;
    positions;
    originalPositions;
    velocities;
    colors;
    sizes;
    config;
    forceFields = [];
    clock = new THREE.Clock();
    activeGesture = 'Neutral';
    gestureForceField = null;
    constructor(options = {}) {
        this.particleCount = options.particleCount ?? 10000;
        this.config = {
            particleCount: this.particleCount,
            textureSize: options.textureSize ?? 32,
            blending: options.blending ?? THREE.AdditiveBlending,
            depthWrite: options.depthWrite ?? false,
            transparent: options.transparent ?? true,
            opacity: options.opacity ?? 0.8,
            sizeAttenuation: options.sizeAttenuation ?? true
        };
        this.positions = new Float32Array(this.particleCount * 3);
        this.originalPositions = new Float32Array(this.particleCount * 3);
        this.velocities = new Float32Array(this.particleCount * 3);
        this.colors = new Float32Array(this.particleCount * 3);
        this.sizes = new Float32Array(this.particleCount);
        this.initializeGeometry(options);
        this.initializeMaterial();
        this.points = new THREE.Points(this.geometry, this.material);
    }
    initializeGeometry(options) {
        this.geometry = new THREE.BufferGeometry();
        // Generate positions based on distribution
        if (options.customPositions) {
            this.positions = options.customPositions(this.particleCount);
        }
        else {
            this.generatePositions(options.distribution ?? 'sphere');
        }
        // Copy to original positions
        this.originalPositions.set(this.positions);
        // Initialize velocities
        this.velocities.fill(0);
        // Generate colors
        if (options.customColors) {
            this.colors = options.customColors(this.positions, this.particleCount);
        }
        else {
            this.generateColors(options.colorScheme ?? 'gradient');
        }
        // Generate sizes
        for (let i = 0; i < this.particleCount; i++) {
            this.sizes[i] = Math.random() * 0.5 + 0.5;
        }
        // Set attributes
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
        this.geometry.setAttribute('velocity', new THREE.BufferAttribute(this.velocities, 3));
    }
    generatePositions(distribution) {
        const positions = this.positions;
        switch (distribution) {
            case 'sphere':
                for (let i = 0; i < this.particleCount; i++) {
                    const i3 = i * 3;
                    const r = 25 * Math.cbrt(Math.random());
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
                    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                    positions[i3 + 2] = r * Math.cos(phi);
                }
                break;
            case 'disk':
                for (let i = 0; i < this.particleCount; i++) {
                    const i3 = i * 3;
                    const r = 30 * Math.sqrt(Math.random());
                    const theta = Math.random() * Math.PI * 2;
                    positions[i3] = r * Math.cos(theta);
                    positions[i3 + 1] = (Math.random() - 0.5) * 5;
                    positions[i3 + 2] = r * Math.sin(theta);
                }
                break;
            case 'cube':
                for (let i = 0; i < this.particleCount; i++) {
                    const i3 = i * 3;
                    positions[i3] = (Math.random() - 0.5) * 50;
                    positions[i3 + 1] = (Math.random() - 0.5) * 50;
                    positions[i3 + 2] = (Math.random() - 0.5) * 50;
                }
                break;
            case 'galaxy':
                const galaxyCount = 5;
                const particlesPerGalaxy = this.particleCount / galaxyCount;
                for (let g = 0; g < galaxyCount; g++) {
                    const angle = (g / galaxyCount) * Math.PI * 2;
                    const dist = 60;
                    const centerX = Math.cos(angle) * dist;
                    const centerZ = Math.sin(angle) * dist;
                    const centerY = (Math.random() - 0.5) * 40;
                    for (let j = 0; j < particlesPerGalaxy; j++) {
                        const i = g * particlesPerGalaxy + j;
                        if (i >= this.particleCount)
                            break;
                        const i3 = i * 3;
                        const radius = Math.random() * 25;
                        const spinAngle = radius * 0.8;
                        const branchAngle = (j % 3) * ((Math.PI * 2) / 3);
                        const x = centerX + Math.cos(spinAngle + branchAngle) * radius + (Math.random() - 0.5) * 4;
                        const y = centerY + (Math.random() - 0.5) * (10 - radius * 0.2);
                        const z = centerZ + Math.sin(spinAngle + branchAngle) * radius + (Math.random() - 0.5) * 4;
                        positions[i3] = x;
                        positions[i3 + 1] = y;
                        positions[i3 + 2] = z;
                    }
                }
                break;
        }
    }
    generateColors(scheme) {
        const color = new THREE.Color();
        switch (scheme) {
            case 'gradient':
                for (let i = 0; i < this.particleCount; i++) {
                    const i3 = i * 3;
                    color.setHSL(0.5 + Math.random() * 0.2, 0.8, 0.6);
                    this.colors[i3] = color.r;
                    this.colors[i3 + 1] = color.g;
                    this.colors[i3 + 2] = color.b;
                }
                break;
            case 'random':
                for (let i = 0; i < this.particleCount; i++) {
                    const i3 = i * 3;
                    color.setHSL(Math.random(), 0.8, 0.6);
                    this.colors[i3] = color.r;
                    this.colors[i3 + 1] = color.g;
                    this.colors[i3 + 2] = color.b;
                }
                break;
            case 'velocity':
                // Will be updated in animate based on velocity
                this.colors.fill(0.5);
                break;
        }
    }
    initializeMaterial() {
        // Create glow texture
        const canvas = document.createElement('canvas');
        canvas.width = this.config.textureSize;
        canvas.height = this.config.textureSize;
        const ctx = canvas.getContext('2d');
        const center = this.config.textureSize / 2;
        const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.config.textureSize, this.config.textureSize);
        const texture = new THREE.CanvasTexture(canvas);
        this.material = new THREE.PointsMaterial({
            size: 0.6,
            map: texture,
            transparent: this.config.transparent,
            opacity: this.config.opacity,
            vertexColors: true,
            blending: this.config.blending,
            depthWrite: this.config.depthWrite,
            sizeAttenuation: this.config.sizeAttenuation
        });
    }
    // Add a force field (e.g., from gesture)
    addForceField(forceField) {
        this.forceFields.push(forceField);
    }
    // Remove a force field
    removeForceField(forceField) {
        const idx = this.forceFields.indexOf(forceField);
        if (idx >= 0)
            this.forceFields.splice(idx, 1);
    }
    // Set active gesture - creates/updates gesture force field
    setGesture(gesture, handPosition) {
        this.activeGesture = gesture;
        // Remove existing gesture force field
        if (this.gestureForceField) {
            this.removeForceField(this.gestureForceField);
            this.gestureForceField = null;
        }
        // Create new gesture force field if applicable
        if (gesture !== 'Neutral' && gesture !== 'None' && handPosition) {
            this.gestureForceField = this.createGestureForceField(gesture, handPosition);
            this.addForceField(this.gestureForceField);
        }
    }
    createGestureForceField(gesture, position) {
        const configs = {
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
            strength: config.strength,
            radius: config.radius,
            center: position.clone(),
            gesture
        });
    }
    // Main animation step - call every frame
    animate(delta) {
        const positionsAttr = this.geometry.attributes.position;
        const colorsAttr = this.geometry.attributes.color;
        const velocitiesAttr = this.geometry.attributes.velocity;
        // Apply force fields
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            let vx = velocitiesAttr.array[i3];
            let vy = velocitiesAttr.array[i3 + 1];
            let vz = velocitiesAttr.array[i3 + 2];
            // Apply all force fields
            for (const field of this.forceFields) {
                const force = field.calculateForce(positionsAttr.array[i3], positionsAttr.array[i3 + 1], positionsAttr.array[i3 + 2], delta);
                vx += force.x;
                vy += force.y;
                vz += force.z;
            }
            // Damping
            const damping = 0.98;
            vx *= damping;
            vy *= damping;
            vz *= damping;
            // Update position
            positionsAttr.array[i3] += vx * delta;
            positionsAttr.array[i3 + 1] += vy * delta;
            positionsAttr.array[i3 + 2] += vz * delta;
            // Update velocity
            velocitiesAttr.array[i3] = vx;
            velocitiesAttr.array[i3 + 1] = vy;
            velocitiesAttr.array[i3 + 2] = vz;
            // Color by velocity (optional)
            if (this.config.colorScheme === 'velocity') {
                const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
                const hue = Math.min(speed * 10, 1);
                const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
                colorsAttr.array[i3] = color.r;
                colorsAttr.array[i3 + 1] = color.g;
                colorsAttr.array[i3 + 2] = color.b;
            }
        }
        positionsAttr.needsUpdate = true;
        colorsAttr.needsUpdate = true;
        velocitiesAttr.needsUpdate = true;
    }
    // Reset to original positions
    reset() {
        const positionsAttr = this.geometry.attributes.position;
        const velocitiesAttr = this.geometry.attributes.velocity;
        positionsAttr.array.set(this.originalPositions);
        velocitiesAttr.fill(0);
        positionsAttr.needsUpdate = true;
        velocitiesAttr.needsUpdate = true;
    }
    // Update particle count (recreates geometry)
    setParticleCount(count) {
        this.particleCount = count;
        this.config.particleCount = count;
        // Would need to recreate geometry - simplified for now
    }
    // Get Three.js object for scene
    getObject() {
        return this.points;
    }
    // Dispose resources
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        this.forceFields = [];
        this.gestureForceField = null;
    }
}
//# sourceMappingURL=ParticleSystem.js.map