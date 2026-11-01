// CelestialBodyFactory - Creates planets, stars, asteroids with NASA textures
// Supports procedural generation and real texture loading

import * as THREE from 'three';
import { CelestialBodyConfig } from '../core/types.js';
import { TextureLoader } from './TextureLoader.js';
import { OrbitMechanics } from './OrbitMechanics.js';

export interface CelestialBody {
  mesh: THREE.Mesh;
  config: CelestialBodyConfig;
  orbitLine: THREE.LineLoop | null;
  orbitAngle: number;
  orbitRadius: number;
  orbitalSpeed: number;
  rotationSpeed: number;
  update: (delta: number, timeScale: number) => void;
}

export class CelestialBodyFactory {
  private textureLoader: TextureLoader;
  private textureCache: Map<string, THREE.Texture> = new Map();
  private defaultTextureUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/';

  constructor() {
    this.textureLoader = new TextureLoader();
  }

  // Create a celestial body from config
  createBody(config: CelestialBodyConfig): CelestialBody {
    // Geometry
    const geometry = new THREE.SphereGeometry(config.radius, 32, 32);
    
    // Material
    let material: THREE.Material;
    if (config.emissive) {
      material = new THREE.MeshBasicMaterial({
        map: this.loadTexture(config.textureUrl || this.getDefaultTexture(config.name))
      });
    } else {
      material = new THREE.MeshPhongMaterial({
        map: this.loadTexture(config.textureUrl || this.getDefaultTexture(config.name)),
        shininess: 5,
        color: config.color || 0xffffff
      });
    }

    const mesh = new THREE.Mesh(geometry, material);
    
    // Initial position
    const startAngle = Math.random() * Math.PI * 2;
    mesh.position.x = Math.cos(startAngle) * config.distance;
    mesh.position.z = Math.sin(startAngle) * config.distance;

    // Orbit line
    let orbitLine: THREE.LineLoop | null = null;
    if (config.distance > 0) {
      const orbitGeo = new THREE.BufferGeometry();
      const orbitPoints: number[] = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        orbitPoints.push(Math.cos(a) * config.distance, 0, Math.sin(a) * config.distance);
      }
      orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
      const orbitMat = new THREE.LineBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.1 
      });
      orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
    }

    const body: CelestialBody = {
      mesh,
      config,
      orbitLine,
      orbitAngle: startAngle,
      orbitRadius: config.distance,
      orbitalSpeed: config.orbitalSpeed,
      rotationSpeed: 0.5 / Math.max(config.radius, 0.1),
      
      update: (delta: number, timeScale: number = 1.0) => {
        if (body.config.distance > 0) {
          body.orbitAngle += body.orbitalSpeed * delta * timeScale;
          body.mesh.position.x = Math.cos(body.orbitAngle) * body.orbitRadius;
          body.mesh.position.z = Math.sin(body.orbitAngle) * body.orbitRadius;
        }
        // Rotate on axis
        body.mesh.rotation.y += body.rotationSpeed * delta * timeScale;
      }
    };

    return body;
  }

  // Create Sun (emissive, at center)
  createSun(radius: number = 12, textureUrl?: string): CelestialBody {
    return this.createBody({
      name: 'Sun',
      radius,
      distance: 0,
      speed: 0,
      texture: textureUrl || this.defaultTextureUrl + 'sun.jpg',
      emissive: true
    });
  }

  // Create planet with standard solar system data
  createPlanet(name: string, preset: 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto'): CelestialBody {
    const presets: Record<string, Omit<CelestialBodyConfig, 'name'>> = {
      mercury: { radius: 1, distance: 25, speed: 0.04, texture: this.defaultTextureUrl + 'mercury.jpg' },
      venus: { radius: 2, distance: 35, speed: 0.03, texture: this.defaultTextureUrl + 'venus_atmosphere.jpg' },
      earth: { radius: 2.2, distance: 50, speed: 0.02, texture: this.defaultTextureUrl + 'earth_atmos_2048.jpg' },
      mars: { radius: 1.5, distance: 70, speed: 0.016, texture: this.defaultTextureUrl + 'mars_1k.jpg' },
      jupiter: { radius: 7, distance: 110, speed: 0.008, texture: this.defaultTextureUrl + 'jupiter_2k.jpg' },
      saturn: { radius: 6, distance: 150, speed: 0.006, texture: this.defaultTextureUrl + 'saturn_2k.jpg' },
      uranus: { radius: 4, distance: 190, speed: 0.004, texture: this.defaultTextureUrl + 'uranus_2k.jpg' },
      neptune: { radius: 4, distance: 230, speed: 0.003, texture: this.defaultTextureUrl + 'neptune_2k.jpg' },
      pluto: { radius: 0.5, distance: 260, speed: 0.002, texture: this.defaultTextureUrl + 'pluto_1k.jpg' }
    };

    const config = presets[preset];
    if (!config) throw new Error(`Unknown planet preset: ${preset}`);

    return this.createBody({ name, ...config });
  }

  // Create full solar system
  createSolarSystem(): { sun: CelestialBody; planets: CelestialBody[] } {
    const sun = this.createSun();
    const planets = [
      this.createPlanet('Mercury', 'mercury'),
      this.createPlanet('Venus', 'venus'),
      this.createPlanet('Earth', 'earth'),
      this.createPlanet('Mars', 'mars'),
      this.createPlanet('Jupiter', 'jupiter'),
      this.createPlanet('Saturn', 'saturn'),
      this.createPlanet('Uranus', 'uranus'),
      this.createPlanet('Neptune', 'neptune')
    ];

    return { sun, planets };
  }

  // Create asteroid belt
  createAsteroidBelt(innerRadius: number = 80, outerRadius: number = 100, count: number = 500): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const color = new THREE.Color(0x888888);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = innerRadius + Math.random() * (outerRadius - innerRadius);
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * 0.5; // Flat disk

      positions[i3] = r * Math.cos(theta) * Math.cos(phi);
      positions[i3 + 1] = r * Math.sin(phi);
      positions[i3 + 2] = r * Math.sin(theta) * Math.cos(phi);

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 0.3 + 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return new THREE.Points(geometry, material);
  }

  // Create starfield background
  createStarfield(count: number = 5000, radius: number = 1000): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = THREE.MathUtils.randFloatSpread(radius);
      positions[i3 + 1] = THREE.MathUtils.randFloatSpread(radius);
      positions[i3 + 2] = THREE.MathUtils.randFloatSpread(radius);

      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.1, 0.3, 0.5 + Math.random() * 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = Math.random() * 0.5 + 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    return new THREE.Points(geometry, material);
  }

  // Load texture with caching
  loadTexture(url: string): THREE.Texture {
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url)!;
    }

    const texture = this.textureLoader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textureCache.set(url, texture);
    return texture;
  }

  // Preload multiple textures
  async preloadTextures(urls: string[]): Promise<void> {
    await Promise.all(urls.map(url => this.textureLoader.loadAsync(url)));
  }

  private getDefaultTexture(name: string): string {
    const map: Record<string, string> = {
      'Sun': 'sun.jpg',
      'Mercury': 'mercury.jpg',
      'Venus': 'venus_atmosphere.jpg',
      'Earth': 'earth_atmos_2048.jpg',
      'Mars': 'mars_1k.jpg',
      'Jupiter': 'jupiter_2k.jpg',
      'Saturn': 'saturn_2k.jpg',
      'Uranus': 'uranus_2k.jpg',
      'Neptune': 'neptune_2k.jpg',
      'Pluto': 'pluto_1k.jpg'
    };
    return this.defaultTextureUrl + (map[name] || 'sun.jpg');
  }

  // Clear texture cache
  clearCache(): void {
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
  }

  // Dispose all resources
  dispose(): void {
    this.clearCache();
    this.textureLoader.dispose();
  }
}