// TextureLoader - NASA texture fetching with caching and fallback
// Handles loading planetary textures from multiple sources

import * as THREE from 'three';

export class TextureLoader {
  private loader: THREE.TextureLoader;
  private cache: Map<string, THREE.Texture> = new Map();
  private loadingPromises: Map<string, Promise<THREE.Texture>> = new Map();
  
  // Texture sources with fallbacks
  private sources: string[] = [
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/',
    'https://planetarymaps.usgs.gov/mosaic/',
    'https://eoimages.gsfc.nasa.gov/images/imagerecords/'
  ];

  constructor() {
    this.loader = new THREE.TextureLoader();
    this.loader.setCrossOrigin('anonymous');
  }

  // Load texture with caching
  async load(url: string): Promise<THREE.Texture> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Load with fallback chain
    const promise = this.loadWithFallback(url);
    this.loadingPromises.set(url, promise);
    
    try {
      const texture = await promise;
      this.cache.set(url, texture);
      this.loadingPromises.delete(url);
      return texture;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  // Load with multiple fallback sources
  private async loadWithFallback(originalUrl: string): Promise<THREE.Texture> {
    const filename = originalUrl.split('/').pop() || '';
    const urls = this.sources.map(base => base + filename);
    urls.unshift(originalUrl); // Try original first

    let lastError: Error | null = null;

    for (const url of urls) {
      try {
        const texture = await this.loader.loadAsync(url);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      } catch (error) {
        lastError = error as Error;
        continue;
      }
    }

    throw lastError || new Error(`Failed to load texture: ${originalUrl}`);
  }

  // Synchronous load (returns immediately, texture loads async)
  loadSync(url: string): THREE.Texture {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    const texture = this.loader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(url, texture);
    return texture;
  }

  // Load multiple textures
  async loadAll(urls: string[]): Promise<THREE.Texture[]> {
    return Promise.all(urls.map(url => this.load(url)));
  }

  // Create procedural texture (for when network fails)
  createProceduralTexture(type: 'planet' | 'star' | 'gas-giant' | 'rocky', color?: THREE.Color): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const baseColor = color || new THREE.Color(0x888888);
    const r = Math.floor(baseColor.r * 255);
    const g = Math.floor(baseColor.g * 255);
    const b = Math.floor(baseColor.b * 255);

    switch (type) {
      case 'planet':
        this.drawPlanetTexture(ctx, r, g, b);
        break;
      case 'star':
        this.drawStarTexture(ctx, r, g, b);
        break;
      case 'gas-giant':
        this.drawGasGiantTexture(ctx, r, g, b);
        break;
      case 'rocky':
        this.drawRockyTexture(ctx, r, g, b);
        break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private drawPlanetTexture(ctx: CanvasRenderingContext2D, r: number, g: number, b: number): void {
    // Base color
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, 512, 256);

    // Add bands (gas giant style)
    for (let y = 0; y < 256; y += 4) {
      const variation = Math.sin(y * 0.1) * 20;
      ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r + variation))}, ${Math.max(0, Math.min(255, g + variation))}, ${Math.max(0, Math.min(255, b + variation))})`;
      ctx.fillRect(0, y, 512, 4);
    }

    // Add spots/storms
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const radius = Math.random() * 30 + 10;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${r + 50},${g + 50},${b + 50},0.5)`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawStarTexture(ctx: CanvasRenderingContext2D, r: number, g: number, b: number): void {
    // Gradient from center to edge
    const gradient = ctx.createRadialGradient(256, 128, 0, 256, 128, 256);
    gradient.addColorStop(0, `rgb(${Math.min(255, r + 50)},${Math.min(255, g + 50)},${Math.min(255, b + 50)})`);
    gradient.addColorStop(0.5, `rgb(${r},${g},${b})`);
    gradient.addColorStop(1, `rgb(${Math.max(0, r - 50)},${Math.max(0, g - 50)},${Math.max(0, b - 50)})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);

    // Granulation
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const radius = Math.random() * 3 + 1;
      const brightness = Math.random() * 0.5 + 0.5;
      ctx.fillStyle = `rgba(${Math.min(255, r * brightness)},${Math.min(255, g * brightness)},${Math.min(255, b * brightness)},${0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGasGiantTexture(ctx: CanvasRenderingContext2D, r: number, g: number, b: number): void {
    // Strong horizontal bands
    for (let y = 0; y < 256; y++) {
      const band = Math.sin(y * 0.05) * 0.5 + Math.sin(y * 0.02) * 0.3;
      const br = Math.max(0, Math.min(255, r + band * 60));
      const bg = Math.max(0, Math.min(255, g + band * 60));
      const bb = Math.max(0, Math.min(255, b + band * 60));
      ctx.fillStyle = `rgb(${br},${bg},${bb})`;
      ctx.fillRect(0, y, 512, 1);
    }

    // Great spot
    const gradient = ctx.createRadialGradient(380, 100, 0, 380, 100, 60);
    gradient.addColorStop(0, `rgba(${Math.min(255, r + 80)},${Math.max(0, g - 40)},${Math.max(0, b - 40)},0.8)`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(380, 100, 80, 40, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawRockyTexture(ctx: CanvasRenderingContext2D, r: number, g: number, b: number): void {
    // Base
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, 512, 256);

    // Craters
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const radius = Math.random() * 20 + 2;
      const depth = Math.random() * 0.5 + 0.2;

      // Crater rim
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${Math.min(255, r + 30)},${Math.min(255, g + 30)},${Math.min(255, b + 30)},${depth})`);
      gradient.addColorStop(0.7, `rgba(${Math.max(0, r - 20)},${Math.max(0, g - 20)},${Math.max(0, b - 20)},${depth * 0.5})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Noise
    const imageData = ctx.getImageData(0, 0, 512, 256);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 20;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // Get cached texture
  getCached(url: string): THREE.Texture | undefined {
    return this.cache.get(url);
  }

  // Clear cache
  clearCache(): void {
    this.cache.forEach(texture => texture.dispose());
    this.cache.clear();
    this.loadingPromises.clear();
  }

  // Dispose
  dispose(): void {
    this.clearCache();
  }
}