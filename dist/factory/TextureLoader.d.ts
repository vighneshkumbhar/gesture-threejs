import * as THREE from 'three';
export declare class TextureLoader {
    private loader;
    private cache;
    private loadingPromises;
    private sources;
    constructor();
    load(url: string): Promise<THREE.Texture>;
    private loadWithFallback;
    loadSync(url: string): THREE.Texture;
    loadAll(urls: string[]): Promise<THREE.Texture[]>;
    createProceduralTexture(type: 'planet' | 'star' | 'gas-giant' | 'rocky', color?: THREE.Color): THREE.Texture;
    private drawPlanetTexture;
    private drawStarTexture;
    private drawGasGiantTexture;
    private drawRockyTexture;
    getCached(url: string): THREE.Texture | undefined;
    clearCache(): void;
    dispose(): void;
}
//# sourceMappingURL=TextureLoader.d.ts.map