import * as THREE from 'three';
import { CelestialBodyConfig } from '../core/types.js';
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
export declare class CelestialBodyFactory {
    private textureLoader;
    private textureCache;
    private defaultTextureUrl;
    constructor();
    createBody(config: CelestialBodyConfig): CelestialBody;
    createSun(radius?: number, textureUrl?: string): CelestialBody;
    createPlanet(name: string, preset: 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto'): CelestialBody;
    createSolarSystem(): {
        sun: CelestialBody;
        planets: CelestialBody[];
    };
    createAsteroidBelt(innerRadius?: number, outerRadius?: number, count?: number): THREE.Points;
    createStarfield(count?: number, radius?: number): THREE.Points;
    loadTexture(url: string): THREE.Texture;
    preloadTextures(urls: string[]): Promise<void>;
    private getDefaultTexture;
    clearCache(): void;
    dispose(): void;
}
//# sourceMappingURL=CelestialBodyFactory.d.ts.map