// GestureOrbitControls - Extends OrbitControls with gesture fallback
// Seamless mouse/gesture camera control switching

import * as THREE from 'three';
import { GestureOrbitControlsConfig, GestureName } from '../core/types.js';

export class GestureOrbitControls {
  public object: THREE.Camera;
  public domElement: HTMLElement;
  
  // OrbitControls state
  public enabled: boolean = true;
  public target: THREE.Vector3 = new THREE.Vector3();
  public minDistance: number = 0;
  public maxDistance: number = Infinity;
  public minZoom: number = 0;
  public maxZoom: number = Infinity;
  public minPolarAngle: number = 0;
  public maxPolarAngle: number = Math.PI;
  public minAzimuthAngle: number = -Infinity;
  public maxAzimuthAngle: number = Infinity;
  public enableDamping: boolean = true;
  public dampingFactor: number = 0.05;
  public enableZoom: boolean = true;
  public zoomSpeed: number = 1.0;
  public enableRotate: boolean = true;
  public rotateSpeed: number = 1.0;
  public enablePan: boolean = true;
  public panSpeed: number = 1.0;
  public screenSpacePanning: boolean = true;
  public autoRotate: boolean = false;
  public autoRotateSpeed: number = 2.0;

  // Gesture-specific
  private gestureEnabled: boolean = true;
  private gestureDebounceMs: number = 300;
  private lastGestureTime: number = 0;
  private currentGesture: GestureName = 'Neutral';
  private gestureTarget: THREE.Vector3 = new THREE.Vector3();
  private gestureDistance: number = 50;
  private gesturePolarAngle: number = Math.PI / 3;
  private gestureAzimuthAngle: number = 0;
  private smoothFactor: number = 0.08;

  // Internal state
  private spherical: THREE.Spherical = new THREE.Spherical();
  private sphericalDelta: THREE.Spherical = new THREE.Spherical();
  private scale: number = 1;
  private panOffset: THREE.Vector3 = new THREE.Vector3();
  private rotateStart: THREE.Vector2 = new THREE.Vector2();
  private rotateEnd: THREE.Vector2 = new THREE.Vector2();
  private rotateDelta: THREE.Vector2 = new THREE.Vector2();
  private panStart: THREE.Vector2 = new THREE.Vector2();
  private panEnd: THREE.Vector2 = new THREE.Vector2();
  private panDelta: THREE.Vector2 = new THREE.Vector2();
  private dollyStart: THREE.Vector2 = new THREE.Vector2();
  private dollyEnd: THREE.Vector2 = new THREE.Vector2();
  private dollyDelta: THREE.Vector2 = new THREE.Vector2();

  private state: number = -1;
  private readonly STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_PAN: 4,
    TOUCH_DOLLY_PAN: 5,
    TOUCH_DOLLY_ROTATE: 6
  };

  // Event callbacks
  public onChange: (() => void) | null = null;
  public onGestureChange: ((gesture: GestureName) => void) | null = null;

  constructor(object: THREE.Camera, domElement: HTMLElement, config: GestureOrbitControlsConfig = {}) {
    this.object = object;
    this.domElement = domElement;

    this.gestureEnabled = config.enableGestureFallback ?? true;
    this.gestureDebounceMs = config.gestureDebounceMs ?? 300;
    this.smoothFactor = config.smoothFactor ?? 0.08;

    this.setupEventListeners();
    this.update();
  }

  private setupEventListeners(): void {
    this.domElement.addEventListener('contextmenu', this.onContextMenu);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('pointercancel', this.onPointerCancel);
    this.domElement.addEventListener('wheel', this.onMouseWheel, { passive: false });
    
    // Touch events
    this.domElement.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.domElement.addEventListener('touchend', this.onTouchEnd);
    this.domElement.addEventListener('touchmove', this.onTouchMove, { passive: false });
  }

  // Gesture integration - call from GestureController
  handleGesture(gesture: GestureName, handPosition?: { x: number; y: number }): void {
    if (!this.gestureEnabled) return;

    const now = Date.now();
    if (now - this.lastGestureTime < this.gestureDebounceMs) return;
    
    this.currentGesture = gesture;
    this.lastGestureTime = now;

    // Map gestures to camera actions
    switch (gesture) {
      case 'Open':
        // Orbit view - pull back, center on target
        this.gestureTarget.copy(this.target);
        this.gestureDistance = Math.min(this.gestureDistance * 1.5, this.maxDistance);
        this.gesturePolarAngle = Math.PI / 3; // 60 degrees up
        break;

      case 'Fist':
        // Zoom into target - get closer
        this.gestureDistance = Math.max(this.gestureDistance * 0.7, this.minDistance);
        this.gesturePolarAngle = Math.PI / 4; // 45 degrees
        break;

      case 'Point':
        // Select next target (handled externally, just update camera to look at target)
        if (handPosition) {
          // Map hand position to azimuth
          this.gestureAzimuthAngle = handPosition.x * Math.PI; // -1 to 1 -> -PI to PI
          this.gesturePolarAngle = (1 - handPosition.y) * Math.PI / 2; // -1 to 1 -> 0 to PI
        }
        break;

      case 'Pinch':
        // Zoom in
        this.gestureDistance = Math.max(this.gestureDistance * 0.8, this.minDistance);
        break;

      case 'Peace':
        // Fast time - orbit faster (handled by time scale, not camera)
        break;

      case 'Stop':
        // Pause - hold position
        break;

      case 'ThumbsUp':
        // Time fast
        break;

      case 'Rock':
        // Turbulence - add slight camera shake
        break;

      case 'Shaka':
        // Spin - rotate azimuth
        this.gestureAzimuthAngle += Math.PI / 4;
        break;

      case 'Vulcan':
        // Color shift - no camera action
        break;

      case 'Neutral':
        // Idle - smooth return to normal
        break;
    }

    if (this.onGestureChange) {
      this.onGestureChange(gesture);
    }
  }

  // Mouse/touch event handlers
  private onContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled) return;

    switch (event.button) {
      case 0: // Left click - rotate
        this.state = this.STATE.ROTATE;
        this.rotateStart.set(event.clientX, event.clientY);
        break;
      case 1: // Middle click - pan
      case 2: // Right click - pan
        this.state = this.STATE.PAN;
        this.panStart.set(event.clientX, event.clientY);
        break;
    }

    this.domElement.ownerDocument.addEventListener('pointermove', this.onPointerMove);
    this.domElement.ownerDocument.addEventListener('pointerup', this.onPointerUp);
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.enabled) return;

    switch (this.state) {
      case this.STATE.ROTATE:
        this.rotateEnd.set(event.clientX, event.clientY);
        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);
        this.rotateLeft(2 * Math.PI * this.rotateDelta.x / this.domElement.clientHeight);
        this.rotateUp(2 * Math.PI * this.rotateDelta.y / this.domElement.clientHeight);
        this.rotateStart.copy(this.rotateEnd);
        this.update();
        break;

      case this.STATE.PAN:
        this.panEnd.set(event.clientX, event.clientY);
        this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
        this.pan(this.panDelta.x, this.panDelta.y);
        this.panStart.copy(this.panEnd);
        this.update();
        break;
    }
  };

  private onPointerUp = (): void => {
    this.domElement.ownerDocument.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.ownerDocument.removeEventListener('pointerup', this.onPointerUp);
    this.state = this.STATE.NONE;
  };

  private onPointerCancel = (): void => {
    this.state = this.STATE.NONE;
  };

  private onMouseWheel = (event: WheelEvent): void => {
    if (!this.enabled || !this.enableZoom) return;

    event.preventDefault();

    if (event.deltaY < 0) {
      this.dollyOut(Math.pow(0.95, -event.deltaY * 0.05));
    } else if (event.deltaY > 0) {
      this.dollyIn(Math.pow(0.95, event.deltaY * 0.05));
    }

    this.update();
  };

  private onTouchStart = (event: TouchEvent): void => {
    if (!this.enabled) return;

    switch (event.touches.length) {
      case 1: // One finger - rotate
        this.state = this.STATE.TOUCH_ROTATE;
        this.rotateStart.set(event.touches[0].clientX, event.touches[0].clientY);
        break;
      case 2: // Two fingers - dolly + pan
        this.state = this.STATE.TOUCH_DOLLY_PAN;
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        this.dollyStart.set(0, Math.sqrt(dx * dx + dy * dy));
        const cx = (event.touches[0].clientX + event.touches[1].clientX) * 0.5;
        const cy = (event.touches[0].clientY + event.touches[1].clientY) * 0.5;
        this.panStart.set(cx, cy);
        break;
      case 3: // Three fingers - pan
        this.state = this.STATE.TOUCH_PAN;
        const cx3 = (event.touches[0].clientX + event.touches[1].clientX + event.touches[2].clientX) / 3;
        const cy3 = (event.touches[0].clientY + event.touches[1].clientY + event.touches[2].clientY) / 3;
        this.panStart.set(cx3, cy3);
        break;
    }
  };

  private onTouchMove = (event: TouchEvent): void => {
    if (!this.enabled) return;

    event.preventDefault();

    switch (event.touches.length) {
      case 1:
        if (this.state === this.STATE.TOUCH_ROTATE) {
          this.rotateEnd.set(event.touches[0].clientX, event.touches[0].clientY);
          this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);
          this.rotateLeft(2 * Math.PI * this.rotateDelta.x / this.domElement.clientHeight);
          this.rotateUp(2 * Math.PI * this.rotateDelta.y / this.domElement.clientHeight);
          this.rotateStart.copy(this.rotateEnd);
          this.update();
        }
        break;

      case 2:
        if (this.state === this.STATE.TOUCH_DOLLY_PAN) {
          // Dolly
          const dx = event.touches[0].clientX - event.touches[1].clientX;
          const dy = event.touches[0].clientY - event.touches[1].clientY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          this.dollyEnd.set(0, distance);
          this.dollyDelta.set(0, this.dollyEnd.y - this.dollyStart.y);

          if (this.dollyDelta.y > 0) {
            this.dollyOut(Math.pow(0.95, this.dollyDelta.y * 0.05));
          } else if (this.dollyDelta.y < 0) {
            this.dollyIn(Math.pow(0.95, -this.dollyDelta.y * 0.05));
          }

          this.dollyStart.copy(this.dollyEnd);

          // Pan
          const cx = (event.touches[0].clientX + event.touches[1].clientX) * 0.5;
          const cy = (event.touches[0].clientY + event.touches[1].clientY) * 0.5;
          this.panEnd.set(cx, cy);
          this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
          this.pan(this.panDelta.x, this.panDelta.y);
          this.panStart.copy(this.panEnd);

          this.update();
        }
        break;

      case 3:
        if (this.state === this.STATE.TOUCH_PAN) {
          const cx3 = (event.touches[0].clientX + event.touches[1].clientX + event.touches[2].clientX) / 3;
          const cy3 = (event.touches[0].clientY + event.touches[1].clientY + event.touches[2].clientY) / 3;
          this.panEnd.set(cx3, cy3);
          this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
          this.pan(this.panDelta.x, this.panDelta.y);
          this.panStart.copy(this.panEnd);
          this.update();
        }
        break;
    }
  };

  private onTouchEnd = (): void => {
    this.state = this.STATE.NONE;
  };

  // Camera manipulation methods
  private rotateLeft(angle: number): void {
    this.sphericalDelta.theta -= angle;
  }

  private rotateUp(angle: number): void {
    this.sphericalDelta.phi -= angle;
  }

  private panLeft(distance: number): void {
    const panOffset = new THREE.Vector3();
    const te = this.object.matrixWorld.elements;
    panOffset.set(te[0], te[1], te[2]).multiplyScalar(-distance);
    this.panOffset.add(panOffset);
  }

  private panUp(distance: number): void {
    const panOffset = new THREE.Vector3();
    const te = this.object.matrixWorld.elements;
    panOffset.set(te[4], te[5], te[6]).multiplyScalar(distance);
    this.panOffset.add(panOffset);
  }

  private pan(deltaX: number, deltaY: number): void {
    const element = this.domElement === document ? this.domElement.body : this.domElement;
    
    if (this.object instanceof THREE.PerspectiveCamera) {
      const position = this.object.position;
      const offset = position.clone().sub(this.target);
      const targetDistance = offset.length();
      targetDistance *= Math.tan((this.object.fov / 2) * Math.PI / 180.0);
      
      this.panLeft(2 * deltaX * targetDistance / element.clientHeight);
      this.panUp(2 * deltaY * targetDistance / element.clientHeight);
    } else if (this.object instanceof THREE.OrthographicCamera) {
      this.panLeft(deltaX * (this.object.right - this.object.left) / this.object.zoom / element.clientWidth);
      this.panUp(deltaY * (this.object.top - this.object.bottom) / this.object.zoom / element.clientHeight);
    }
  }

  private dollyIn(dollyScale: number): void {
    if (this.object instanceof THREE.PerspectiveCamera) {
      this.scale /= dollyScale;
    } else if (this.object instanceof THREE.OrthographicCamera) {
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom * dollyScale));
      this.object.updateProjectionMatrix();
    }
  }

  private dollyOut(dollyScale: number): void {
    if (this.object instanceof THREE.PerspectiveCamera) {
      this.scale *= dollyScale;
    } else if (this.object instanceof THREE.OrthographicCamera) {
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / dollyScale));
      this.object.updateProjectionMatrix();
    }
  }

  // Update camera position
  update(): boolean {
    const offset = new THREE.Vector3();
    offset.copy(this.object.position).sub(this.target);

    // Apply gesture-based camera target if gesture active
    if (this.gestureEnabled && this.currentGesture !== 'Neutral' && this.currentGesture !== 'None') {
      // Smoothly interpolate toward gesture target
      this.target.lerp(this.gestureTarget, this.smoothFactor);
      this.spherical.setFromVector3(offset);
      
      // Interpolate spherical coordinates
      this.spherical.radius *= this.scale;
      this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
      
      // Interpolate toward gesture spherical
      const gestureSpherical = new THREE.Spherical(
        this.gestureDistance,
        this.gesturePolarAngle,
        this.gestureAzimuthAngle
      );
      
      this.spherical.radius = THREE.MathUtils.lerp(this.spherical.radius, gestureSpherical.radius, this.smoothFactor);
      this.spherical.phi = THREE.MathUtils.lerp(this.spherical.phi, gestureSpherical.phi, this.smoothFactor);
      this.spherical.theta = THREE.MathUtils.lerp(this.spherical.theta, gestureSpherical.theta, this.smoothFactor);
      
      this.spherical.makeSafe();
      this.spherical.radius *= this.scale;
      this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
      
      this.target.add(this.panOffset);
      offset.setFromSpherical(this.spherical);
      this.object.position.copy(this.target).add(offset);
      this.object.lookAt(this.target);
    } else {
      // Normal OrbitControls update
      this.target.add(this.panOffset);
      offset.setFromSpherical(this.spherical);
      
      offset.multiplyScalar(this.scale);
      offset.clampLength(this.minDistance, this.maxDistance);
      
      this.object.position.copy(this.target).add(offset);
      this.object.lookAt(this.target);
    }

    // Damping
    if (this.enableDamping) {
      this.sphericalDelta.theta *= (1 - this.dampingFactor);
      this.sphericalDelta.phi *= (1 - this.dampingFactor);
      this.panOffset.multiplyScalar(1 - this.dampingFactor);
    }

    this.scale = 1;
    this.panOffset.set(0, 0, 0);

    if (this.onChange) this.onChange();

    return true;
  }

  // Reset to default
  reset(): void {
    this.target.set(0, 0, 0);
    this.object.position.set(0, 20, 100);
    this.object.lookAt(this.target);
    this.update();
  }

  // Save/load state
  saveState(): object {
    return {
      target: this.target.toArray(),
      position: this.object.position.toArray(),
      zoom: this.object.zoom,
      enableDamping: this.enableDamping,
      dampingFactor: this.dampingFactor
    };
  }

  loadState(state: any): void {
    this.target.fromArray(state.target);
    this.object.position.fromArray(state.position);
    this.object.zoom = state.zoom;
    this.enableDamping = state.enableDamping;
    this.dampingFactor = state.dampingFactor;
    this.update();
  }

  // Dispose
  dispose(): void {
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointercancel', this.onPointerCancel);
    this.domElement.removeEventListener('wheel', this.onMouseWheel);
    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.domElement.removeEventListener('touchend', this.onTouchEnd);
    this.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.domElement.ownerDocument.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.ownerDocument.removeEventListener('pointerup', this.onPointerUp);
  }
}