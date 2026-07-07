import * as THREE from 'three';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { defaultOrthoConfig, type CameraView, type OrthoConfig } from './projection';

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

  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private renderer: RendererStub | null = null;
  private active = false;

  constructor(opts: Render3DManagerOptions = {}) {
    this.enabled = opts.enabled ?? FEATURE_FLAGS.render3d;
    this.rendererFactory = opts.rendererFactory ?? (() => new THREE.WebGLRenderer());
    this.host = opts.host ?? null;
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

  /** The THREE.Scene (null until create() with the flag on). */
  getScene(): THREE.Scene | null {
    return this.scene;
  }

  /** Build the scene/camera/renderer only when enabled. */
  create(): void {
    if (!this.enabled) {
      this.active = false;
      return;
    }

    this.scene = new THREE.Scene();
    const aspect = this.cfg.viewWidth / this.cfg.viewHeight;
    const halfH = (this.cfg.viewHeight / 2) * this.cfg.unitsPerPixel;
    const halfW = halfH * aspect;
    this.camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, -1000, 1000);
    this.renderer = this.rendererFactory();
    this.renderer.setSize(this.cfg.viewWidth, this.cfg.viewHeight);

    // In production the renderer's canvas is mounted into #game-root between
    // the GameScene and UIScene canvases (design P0.1). Tests use a host object.
    if (this.host) this.host.add(this.scene);
    this.active = true;
  }

  /** Per-frame tick. Renders when active; safe no-op otherwise. */
  update(_dt: number): void {
    if (!this.active || !this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  }

  /** The matched orthographic camera view, for bridges to reproject against. */
  getCameraView(): CameraView {
    // The 2D camera is the source of truth; bridges supply live scroll/zoom.
    return { scrollX: 0, scrollY: 0, zoom: 1 };
  }

  /** Tear down and dispose everything. Safe to call when inactive. */
  teardown(): void {
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
