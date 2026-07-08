import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { defaultOrthoConfig, type CameraView, type OrthoConfig } from './projection';

/**
 * Probe for WebGL support without constructing a renderer. Returns false in
 * headless/CI or on machines without a GL context, so the 2D game stays
 * fully playable (design P4.3: graceful degrade).
 */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Minimal renderer surface the manager relies on. In production this is a real
 * `THREE.WebGLRenderer`; in tests we pass a stub so sync logic runs without a
 * GPU (design P5.3: headless, no WebGL context in CI).
 */
export interface RendererStub {
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  setSize(width: number, height: number): void;
  dispose(): void;
  domElement: HTMLCanvasElement;
}

/** Where meshes are attached (production = THREE.Scene; tests = a fake). */
export interface SceneHost {
  add(mesh: unknown): void;
  remove(mesh: unknown): void;
  readonly children: unknown[];
}

export interface Render3DManagerOptions {
  /** Override the flag; defaults to `FEATURE_FLAGS.render3d`. */
  enabled?: boolean;
  /** Inject a renderer (tests stub this; production uses WebGLRenderer). */
  rendererFactory?: () => RendererStub;
  /** Host that meshes are added to (tests use a fake; production uses the Scene). */
  host?: SceneHost;
  viewWidth?: number;
  viewHeight?: number;
  unitsPerPixel?: number;
  /** Thread reduced-motion / low-power into the bridges (design P4.5). */
  reducedMotion?: boolean;
  /** DOM element to mount the renderer's canvas into (production only). */
  mount?: HTMLElement | null;
}

/**
 * Owns the 3D layer lifecycle inside `GameScene.create()`/`update()`/`shutdown`.
 *
 * Hard rule (design P0.4/P4.3): when `render3d` is OFF, NO renderer, scene, or
 * camera is ever constructed and `update()` is a no-op. The 2D game renders
 * exactly as today — zero regression.
 */
export class Render3DManager {
  private readonly enabled: boolean;
  private readonly rendererFactory: () => RendererStub;
  private readonly host: SceneHost | null;
  private readonly cfg: OrthoConfig;
  private readonly reducedMotion: boolean;
  private readonly mount: HTMLElement | null;

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private renderer: RendererStub | null = null;
  private composer: EffectComposer | null = null;
  private active = false;
  private bloomPass: UnrealBloomPass | null = null;
  private _bloomStrength = 0.8;

  get _passCount(): number {
    return this.composer?.passes.length ?? 0;
  }

  /** Live camera shake offset (world units), fed from the 2D Phaser shake. */
  private shakeX = 0;
  private shakeY = 0;

  constructor(opts: Render3DManagerOptions = {}) {
    this.enabled = opts.enabled ?? FEATURE_FLAGS.render3d;
    this.rendererFactory = opts.rendererFactory ?? (() => new THREE.WebGLRenderer());
    this.host = opts.host ?? null;
    this.reducedMotion = opts.reducedMotion ?? false;
    this.mount = opts.mount ?? null;
    this.cfg = defaultOrthoConfig(
      opts.viewWidth ?? 960,
      opts.viewHeight ?? 540,
      opts.unitsPerPixel ?? 1
    );
  }

  isActive(): boolean {
    return this.active;
  }

  getConfig(): OrthoConfig {
    return this.cfg;
  }

  /** Reduced-motion / low-power setting (design P4.5). */
  isReducedMotion(): boolean {
    return this.reducedMotion;
  }

  /** The matched orthographic camera (null until create() with the flag on). */
  getCamera(): THREE.OrthographicCamera | null {
    return this.camera;
  }

  /** The THREE.Scene (null until create() with the flag on). */
  getScene(): THREE.Scene | null {
    return this.scene;
  }

  /**
   * Build the optional post-FX composer (bloom + output pass). Called from
   * create() only when active and not reduced-motion. Any failure (e.g. an
   * unsupported pass) leaves `composer` null so the plain renderer is used.
   */
  private setupComposer(): void {
    // Only build post-FX on the real WebGLRenderer (production). The test stub
    // renderer is a plain object and must NOT be wrapped in a composer.
    if (!this.renderer || !this.scene || !this.camera) return;
    if (!(this.renderer instanceof THREE.WebGLRenderer)) return;
    try {
      const composer = new EffectComposer(this.renderer);
      composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(this.cfg.viewWidth, this.cfg.viewHeight),
        this._bloomStrength, // strength
        0.5, // radius
        0.85 // threshold — only bright pixels bloom
      );
      composer.addPass(this.bloomPass);
      composer.addPass(new OutputPass());
      composer.addPass(new FilmPass(0.25));
      composer.setSize(this.cfg.viewWidth, this.cfg.viewHeight);
      this.composer = composer;
    } catch (err) {
      console.warn('[Render3D] Post-FX composer unavailable — using plain renderer.', err);
      this.composer = null;
    }
  }

  /**
   * Build the scene/camera/renderer only when enabled AND WebGL is available.
   * If WebGL is missing or the renderer fails to construct, degrade silently
   * to inactive so the 2D game is untouched (design P4.3).
   */
  create(): void {
    if (!this.enabled) {
      this.active = false;
      return;
    }
    if (typeof window !== 'undefined' && !isWebGLAvailable()) {
      console.warn('[Render3D] WebGL unavailable — falling back to 2D only.');
      this.active = false;
      return;
    }

    this.scene = new THREE.Scene();
    const aspect = this.cfg.viewWidth / this.cfg.viewHeight;
    const halfH = (this.cfg.viewHeight / 2) * this.cfg.unitsPerPixel;
    const halfW = halfH * aspect;
    this.camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, -1000, 1000);

    try {
      this.renderer = this.rendererFactory();
    } catch (err) {
      console.warn('[Render3D] Renderer construction failed — falling back to 2D only.', err);
      this.scene = null;
      this.camera = null;
      this.active = false;
      return;
    }
    this.renderer.setSize(this.cfg.viewWidth, this.cfg.viewHeight);

    // Mount the renderer canvas behind the (transparent) Phaser canvas so the
    // 3D world shows through and the HUD (on the Phaser canvas) paints on top.
    // Tests pass a `host` instead and never touch the DOM (design P0.1/P5.3).
    if (this.mount && this.renderer.domElement) {
      const el = this.renderer.domElement;
      el.classList.add('three-canvas');
      Object.assign(el.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        zIndex: '0',
        pointerEvents: 'none',
      } as Partial<CSSStyleDeclaration>);
      this.mount.appendChild(el);
    } else if (this.host) {
      this.host.add(this.scene);
    }

    // Optional post-FX (bloom + film grade). Skipped in reduced-motion mode
    // and only when a composer can be built (design P3/P4.5).
    if (!this.reducedMotion) {
      this.setupComposer();
    }

    this.active = true;
  }

  /**
   * Feed the live 2D camera shake offset (world units) so the 3D view shakes
   * in sync with the 2D view (design P4.2). Applied each frame in update().
   */
  setCameraShake(x: number, y: number): void {
    this.shakeX = x;
    this.shakeY = y;
  }

  setBloomStrength(strength: number): void {
    this._bloomStrength = Math.max(0, Math.min(3, strength));
    if (this.bloomPass) {
      this.bloomPass.strength = this._bloomStrength;
    }
  }

  /** Per-frame tick. Renders when active; safe no-op otherwise. */
  update(_dt: number): void {
    if (!this.active || !this.renderer || !this.scene || !this.camera) return;
    // Restore to centered then apply the current shake offset so it never
    // accumulates between frames.
    this.camera.position.x = this.shakeX;
    this.camera.position.y = this.shakeY;
    this.camera.position.z = 10;
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /** The matched orthographic camera view, for bridges to reproject against. */
  getCameraView(): CameraView {
    // The 2D camera is the source of truth; bridges supply live scroll/zoom.
    return { scrollX: 0, scrollY: 0, zoom: 1 };
  }

  /** Tear down and dispose everything. Safe to call when inactive. */
  teardown(): void {
    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    if (this.scene && this.host) this.host.remove(this.scene);
    this.scene = null;
    this.camera = null;
    this.active = false;
  }
}
