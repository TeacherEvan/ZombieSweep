import * as THREE from 'three';
import { SyncBridge, type BridgeUpdateArgs } from './SyncBridge';
import { worldToThree, type CameraView, type OrthoConfig } from '../projection';
import { depthRenderOrder, depthZOffset } from '../depthBand';

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

/** Per-frame source for the effects bridge. */
export interface EffectsBridgeSource {
  projectiles: ProjectileSourceItem[];
  killEvents: KillEvent[];
  /** Current combo tier from `comboTracker` (0 = no combo). */
  comboTier: number;
}

export interface EffectsBridgeUpdate extends BridgeUpdateArgs<THREE.Scene> {
  source: EffectsBridgeSource[];
  cam: CameraView;
  /** Frame delta in ms (drives particle lifetime). Defaults to 16. */
  dt?: number;
}

const PROJECTILE_HEIGHT = 4;

// Shared particle geometry/material — pooled, never disposed per-particle.
const PARTICLE_GEOM = new THREE.SphereGeometry(2, 6, 6);
const PARTICLE_MAT = new THREE.MeshBasicMaterial({ color: 0xaa2222 });

/** Pure mapping: combo tier → point-light intensity, capped at 2. */
export function comboLightIntensity(tier: number): number {
  if (tier <= 0) return 0;
  return Math.min(0.4 + tier * 0.25, 2);
}

interface Particle {
  mesh: THREE.Mesh;
  ttl: number;
  vx: number;
  vy: number;
  vz: number;
}

/**
 * Effects bridge: projectiles (P3.1) + death-burst particle pool (P3.2) +
 * combo light pulse (P3.3). All particle counts are hard-capped (P3.4) and
 * pooled (no per-frame allocation). Reads only public 2D transform data and
 * reprojects into the matched ortho camera. When disabled, every mesh/particle
 * is released and the combo light is dark — the 2D layer is untouched.
 */
export class EffectsBridge extends SyncBridge<THREE.Mesh, THREE.Scene> {
  private readonly scene: THREE.Scene;
  private readonly cfg: OrthoConfig;
  private readonly reducedMotion: boolean;
  private readonly particlePoolCap: number;
  private cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };

  // Projectiles are reconciled by the base SyncBridge against `source`.
  // Particles are event-spawned + time-expired (not count-reconciled) so they
  // get a dedicated pooled lifecycle with a hard cap.
  private freeParticles: THREE.Mesh[] = [];
  private active: Particle[] = [];
  private comboLight: THREE.PointLight;

  constructor(scene: THREE.Scene, cfg: OrthoConfig, reducedMotion = false) {
    super();
    this.scene = scene;
    this.cfg = cfg;
    this.reducedMotion = reducedMotion;
    this.particlePoolCap = reducedMotion ? REDUCED_PARTICLE_POOL_CAP : PARTICLE_POOL_CAP;
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

  getProjectileMeshes(): readonly THREE.Mesh[] {
    return this.liveMeshes;
  }

  /** Currently-flying gore particles. */
  getActiveParticleCount(): number {
    return this.active.length;
  }

  /** Reconcile projectiles, spawn bursts, advance particles, drive combo light. */
  update(args: EffectsBridgeUpdate): void {
    const src = args.source[0];
    if (!src) return;
    this.cam = args.cam;

    // Projectile reconciliation (base contract).
    super.update({ source: src.projectiles, host: args.host });

    if (!this.isEnabled()) {
      this.clearParticles();
      this.comboLight.intensity = 0;
      return;
    }

    this.spawnBursts(src.killEvents);
    this.advanceParticles(args.dt ?? 16);
    const lit = comboLightIntensity(src.comboTier);
    // Reduced-motion: keep the combo pulse but dim it for low-power comfort.
    this.comboLight.intensity = this.reducedMotion ? lit * 0.5 : lit;
  }

  protected createMesh(item: unknown): THREE.Mesh {
    const p = item as ProjectileSourceItem;
    void p;
    const mesh = new THREE.Mesh(PARTICLE_GEOM, PARTICLE_MAT);
    mesh.userData = { kind: 'projectile' };
    mesh.renderOrder = depthRenderOrder('projectile');
    return mesh;
  }

  protected onAddToHost(mesh: THREE.Mesh, host: THREE.Scene): void {
    host.add(mesh);
  }

  protected onRemoveFromHost(mesh: THREE.Mesh, host: THREE.Scene): void {
    host.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  }

  protected syncMeshes(source: unknown[]): void {
    const items = source as ProjectileSourceItem[];
    const live = this.liveMeshes;
    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      const pos = worldToThree(p.x, p.y, this.cam, this.cfg);
      const mesh = live[i];
      mesh.position.set(pos.x, PROJECTILE_HEIGHT, pos.z + depthZOffset('projectile'));
      mesh.rotation.y = p.angle;
    }
  }

  // --- Particle pool -------------------------------------------------------

  private acquireMesh(): THREE.Mesh {
    const reused = this.freeParticles.pop();
    if (reused) {
      this.scene.add(reused);
      return reused;
    }
    const mesh = new THREE.Mesh(PARTICLE_GEOM, PARTICLE_MAT);
    this.scene.add(mesh);
    return mesh;
  }

  private releaseMesh(mesh: THREE.Mesh): void {
    this.scene.remove(mesh);
    this.freeParticles.push(mesh);
  }

  private spawnBursts(events: KillEvent[]): void {
    for (const ev of events) {
      // Reduced-motion: fewer gore particles per kill; always hard-capped.
      const perKill = this.reducedMotion ? 2 : 5;
      const count = Math.round(perKill * ev.intensity);
      for (let i = 0; i < count; i++) {
        if (this.active.length >= this.particlePoolCap) return; // hard cap
        const mesh = this.acquireMesh();
        const pos = worldToThree(ev.x, ev.y, this.cam, this.cfg);
        mesh.renderOrder = depthRenderOrder('particle');
        mesh.position.set(pos.x, 6, pos.z + depthZOffset('particle'));
        this.active.push({
          mesh,
          ttl: 300,
          vx: (Math.random() - 0.5) * 40,
          vy: Math.random() * 30 + 10,
          vz: (Math.random() - 0.5) * 40,
        });
      }
    }
  }

  private advanceParticles(dt: number): void {
    const dtSec = dt / 1000;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const part = this.active[i];
      part.ttl -= dt;
      part.mesh.position.x += part.vx * dtSec;
      part.mesh.position.y += part.vy * dtSec;
      part.mesh.position.z += part.vz * dtSec;
      if (part.ttl <= 0) {
        this.releaseMesh(part.mesh);
        this.active.splice(i, 1);
      }
    }
  }

  private clearParticles(): void {
    for (const part of this.active) {
      this.releaseMesh(part.mesh);
    }
    this.active = [];
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
