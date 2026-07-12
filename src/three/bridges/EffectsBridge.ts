import * as THREE from 'three';
import { SyncBridge, type BridgeUpdateArgs } from './SyncBridge';
import { worldToThree, type CameraView, type OrthoConfig } from '../projection';
import { depthRenderOrder, depthZOffset } from '../depthBand';
import { createProjectileMeshForVehicle } from './WeaponMeshFactory';
import type { VehicleType } from '../../config/vehicles';
import { ParticlePool, spawnGoreBurst, spawnAcidSplash } from './ParticleFactory';
import { disposeObject3D, markShared } from './disposeObject3D';

/** Hard cap on simultaneously-live gore particles (design P3.4). */
export const PARTICLE_POOL_CAP = 200;

/** Reduced cap used when the user prefers reduced motion / low-power mode. */
const REDUCED_PARTICLE_POOL_CAP = 60;

/** A live flying projectile read from the 2D layer. */
export interface ProjectileSourceItem {
  x: number;
  y: number;
  /** Heading in radians (sprite.angle). */
  angle: number;
}

/** A zombie-kill event that triggers a death burst. */
export interface KillEvent {
  x: number;
  y: number;
  /** Burst size multiplier (elite kills > 1). */
  intensity: number;
}

/** A Spitter death event — its acid sac bursts (separate green particle pool). */
export interface AcidEvent {
  x: number;
  y: number;
}

/** Per-frame source for the effects bridge. */
export interface EffectsBridgeSource {
  projectiles: ProjectileSourceItem[];
  killEvents: KillEvent[];
  /** Spitter acid-sac bursts (separate green pool). */
  acidEvents?: AcidEvent[];
  /** Current combo tier from `comboTracker` (0 = no combo). */
  comboTier: number;
  vehicleType?: VehicleType;
}

export interface EffectsBridgeUpdate extends BridgeUpdateArgs<THREE.Scene> {
  source: EffectsBridgeSource[];
  cam: CameraView;
  /** Frame delta in ms (drives particle lifetime). Defaults to 16. */
  dt?: number;
}

const PROJECTILE_HEIGHT = 4;

// Shared fallback projectile geometry/material — reused by every fallback mesh
// instance (only when no vehicleType is set). Marked shared so per-mesh
// disposal (disposeObject3D) never frees them.
const PARTICLE_GEOM = markShared(new THREE.SphereGeometry(2, 6, 6));
const PARTICLE_MAT = markShared(new THREE.MeshBasicMaterial({ color: 0xaa2222 }));

/** Pure mapping: combo tier → point-light intensity, capped at 2. */
export function comboLightIntensity(tier: number): number {
  if (tier <= 0) return 0;
  return Math.min(0.4 + tier * 0.25, 2);
}

/**
 * Effects bridge: projectiles (P3.1) + death-burst particle pool (P3.2) +
 * combo light pulse (P3.3). All particle counts are hard-capped (P3.4) and
 * pooled (no per-frame allocation). Reads only public 2D transform data and
 * reprojects into the matched ortho camera. When disabled, every mesh/particle
 * is released and the combo light is dark — the 2D layer is untouched.
 */
export class EffectsBridge extends SyncBridge<THREE.Object3D, THREE.Scene> {
  private readonly scene: THREE.Scene;
  private readonly cfg: OrthoConfig;
  private readonly reducedMotion: boolean;
  private readonly particlePoolCap: number;
  private cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };
  private _vehicleType?: VehicleType;

  // Projectiles are reconciled by the base SyncBridge against `source`.
  // Particles are event-spawned + time-expired (not count-reconciled) so they
  // get a dedicated pooled lifecycle with a hard cap.
  private readonly particlePool: ParticlePool;
  private comboLight: THREE.PointLight;

  constructor(scene: THREE.Scene, cfg: OrthoConfig, reducedMotion = false) {
    super({
      // Projectiles are rebuilt each frame from the 2D sprite group; key by the
      // projectile object reference. (A more robust key would be the sprite's
      // stable id, but projectiles are short-lived and the count reconciles.)
      getKey: (item: unknown) => item as ProjectileSourceItem,
    });
    this.scene = scene;
    this.cfg = cfg;
    this.reducedMotion = reducedMotion;
    this.particlePoolCap = reducedMotion ? REDUCED_PARTICLE_POOL_CAP : PARTICLE_POOL_CAP;
    this.particlePool = new ParticlePool(this.particlePoolCap);
    this.comboLight = new THREE.PointLight(0xffcc66, 0, 400);
    this.comboLight.position.set(0, 120, 0);
  }

  /** Add the combo light to the scene (dark until a combo is active). */
  create(): void {
    if (!this.scene.children.includes(this.comboLight)) {
      this.scene.add(this.comboLight);
    }
  }

  getComboLight(): THREE.PointLight {
    return this.comboLight;
  }

  /** Live projectile meshes (reconciled by the base). */
  getProjectileCount(): number {
    return this.liveMeshes.length;
  }

  getProjectileMeshes(): readonly THREE.Object3D[] {
    return this.liveMeshes;
  }

  /** Currently-flying gore particles. */
  getActiveParticleCount(): number {
    return this.particlePool.liveCount;
  }

  /** Reconcile projectiles, spawn bursts, advance particles, drive combo light. */
  update(args: EffectsBridgeUpdate): void {
    const src = args.source[0];
    if (!src) return;
    this.cam = args.cam;
    this._vehicleType = src.vehicleType;

    // Projectile reconciliation (base contract).
    super.update({ source: src.projectiles, host: args.host });

    if (!this.isEnabled()) {
      this.clearParticles();
      this.comboLight.intensity = 0;
      return;
    }

    this.spawnBursts(src.killEvents);
    this.spawnAcid(src.acidEvents ?? []);
    this.particlePool.tick(this.scene, args.dt ?? 16);
    const lit = comboLightIntensity(src.comboTier);
    // Reduced-motion: keep the combo pulse but dim it for low-power comfort.
    this.comboLight.intensity = this.reducedMotion ? lit * 0.5 : lit;
  }

  protected createMesh(item: unknown): THREE.Object3D {
    const p = item as ProjectileSourceItem;
    void p;
    let obj: THREE.Object3D;
    if (this._vehicleType !== undefined) {
      obj = createProjectileMeshForVehicle(this._vehicleType);
    } else {
      obj = new THREE.Mesh(PARTICLE_GEOM, PARTICLE_MAT);
    }
    obj.userData = { kind: 'projectile' };
    obj.renderOrder = depthRenderOrder('projectile');
    return obj;
  }

  protected onAddToHost(mesh: THREE.Object3D, host: THREE.Scene): void {
    host.add(mesh);
  }

  protected onRemoveFromHost(mesh: THREE.Object3D, host: THREE.Scene): void {
    host.remove(mesh);
    disposeObject3D(mesh);
  }

  protected syncMeshes(_source: unknown[]): void {
    const pairs = this.getSyncedPairs();
    for (let i = 0; i < pairs.length; i++) {
      const [rawItem, mesh] = pairs[i] as [ProjectileSourceItem, THREE.Object3D];
      const p = rawItem;
      const pos = worldToThree(p.x, p.y, this.cam, this.cfg);
      mesh.position.set(pos.x, PROJECTILE_HEIGHT, pos.z + depthZOffset('projectile'));
      mesh.rotation.y = p.angle;
    }
  }

  // --- Particle pool -------------------------------------------------------

  private spawnBursts(events: KillEvent[]): void {
    // Reduced-motion: skip heavy gore/particle effects entirely (plan Global
    // Constraint). The combo light still pulses (dimmed) for feedback.
    if (this.reducedMotion) return;
    for (const ev of events) {
      // Reproject to 3D world coordinate
      const pos = worldToThree(ev.x, ev.y, this.cam, this.cfg);
      spawnGoreBurst(this.scene, this.particlePool, pos.x, 6, ev.intensity);
    }
  }

  private spawnAcid(events: AcidEvent[]): void {
    // Same reduced-motion guard as gore: skip heavy particle effects.
    if (this.reducedMotion) return;
    for (const ev of events) {
      const pos = worldToThree(ev.x, ev.y, this.cam, this.cfg);
      spawnAcidSplash(this.scene, this.particlePool, pos.x, 6);
    }
  }

  private clearParticles(): void {
    this.particlePool.clear(this.scene);
  }

  /** Tear down: clear projectiles, particles, combo light. Safe when inactive. */
  override teardown(): void {
    super.teardown(this.scene);
    this.clearParticles();
    this.comboLight.intensity = 0;
    this.scene.remove(this.comboLight);
  }
}

export function createEffectsBridge(
  scene: THREE.Scene,
  cfg: OrthoConfig,
  reducedMotion = false
): EffectsBridge {
  return new EffectsBridge(scene, cfg, reducedMotion);
}
