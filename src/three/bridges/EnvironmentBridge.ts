import * as THREE from 'three';
import { SyncBridge, type BridgeUpdateArgs } from './SyncBridge';
import { createHouseMesh, HOUSE_FOOTPRINT, type HouseMeshOptions } from './HouseMeshFactory';
import type { HouseType } from '../../entities/House';
import { worldToThree, type CameraView, type OrthoConfig } from '../projection';
import { depthRenderOrder, depthZOffset } from '../depthBand';
import { createHazardMeshForType } from './HazardMeshFactory';
import { disposeGroup } from './disposeGroup';
import type { HazardType } from '../../entities/Hazard';

/** A keyed SyncBridge that also exposes its live (item, mesh) pairs. */
interface HazardSyncBridge extends SyncBridge<THREE.Group, THREE.Scene> {
  getHazardPairs(): Array<[unknown, THREE.Group]>;
}

/** A single house source item: the 2D House plus its live sprite transform. */
export interface HouseSourceItem {
  house: { type: HouseType };
  sprite: {
    x: number;
    y: number;
    visible: boolean;
    setVisible(v: boolean): void;
  };
}

export interface HazardSourceItem {
  hazardType: HazardType;
  sprite: {
    x: number;
    y: number;
    visible: boolean;
    setVisible(v: boolean): void;
  };
}

/** Per-frame source for the environment bridge. */
export interface EnvironmentBridgeSource {
  houses: HouseSourceItem[];
  /** Route scroll position (GameScene.worldY) driving ground scroll. */
  worldY: number;
  hazards?: HazardSourceItem[];
}

export interface EnvironmentBridgeUpdate extends BridgeUpdateArgs<THREE.Scene> {
  source: EnvironmentBridgeSource[];
  cam: CameraView;
}

const GROUND_WIDTH = 1000;
const GROUND_DEPTH = 6000;
const GROUND_SCROLL_WRAP = 540; // one viewport of vertical scroll

/**
 * Environment bridge: houses (instanced boxes) + scrolling ground + lighting
 * rig + fog. Reads only public 2D transform data; reprojects into the matched
 * ortho Three camera via `worldToThree`. Houses render on the ground plane
 * (y=0 base). When disabled, 2D sprites are re-shown and all meshes cleared.
 */
export class EnvironmentBridge extends SyncBridge<THREE.Group, THREE.Scene> {
  private ground: THREE.Mesh | null = null;
  private built = false;
  private cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };
  private readonly cfg: OrthoConfig;
  /** Keyed reconcile of hazard meshes, so a mid-list hazard removal cannot
   *  re-bind a mesh to the wrong entity (the same keyed contract the other
   *  bridges use). Keyed on the stable Phaser sprite object. */
  private readonly hazardBridge: HazardSyncBridge;

  constructor(
    private readonly scene: THREE.Scene,
    cfg: OrthoConfig,
    private readonly reducedMotion = false
  ) {
    super({
      // Houses are rebuilt each frame from getChildren(); key by the per-house
      // `sprite` object (stable across frames for a given house).
      getKey: (item: unknown) => (item as HouseSourceItem).sprite,
    });
    this.cfg = cfg;
    this.hazardBridge = new (class extends SyncBridge<THREE.Group, THREE.Scene> {
      protected createMesh(item: unknown): THREE.Group {
        return createHazardMeshForType((item as HazardSourceItem).hazardType);
      }
      protected onAddToHost(mesh: THREE.Group, host: THREE.Scene): void {
        host.add(mesh);
      }
      protected onRemoveFromHost(mesh: THREE.Group, host: THREE.Scene): void {
        host.remove(mesh);
        disposeGroup(mesh);
      }
      protected syncMeshes(): void {
        /* hazards are positioned by the outer bridge's syncHazards */
      }
      /** Public view of the keyed (mesh, item) pairs for the outer bridge. */
      getHazardPairs(): Array<[unknown, THREE.Group]> {
        return this.getSyncedPairs();
      }
    })();
    this.hazardBridge.setEnabled(true);
  }

  /** Inject lighting rig + fog + ground plane into the scene. Idempotent. */
  create(): void {
    if (this.built) return;
    const ambient = new THREE.AmbientLight(0x404654, 0.7);
    const dir = new THREE.DirectionalLight(0xfff0d0, 1.1);
    dir.position.set(-0.5, 1, 0.8);
    const hemi = new THREE.HemisphereLight(0x78909c, 0x3e2723, 0.5); // cool sky blue to warm earth brown
    const rim = new THREE.DirectionalLight(0xa0c0ff, 0.6); // cool back/rim light
    rim.position.set(0.5, 0.5, -1);

    // Reduced-motion / low-power: no shadow casting (no shadow maps to render).
    if (!this.reducedMotion) {
      dir.castShadow = false;
    }
    this.scene.add(ambient);
    this.scene.add(dir);
    this.scene.add(hemi);
    this.scene.add(rim);

    // Apocalypse mood fog — skipped in reduced-motion mode.
    if (!this.reducedMotion) {
      this.scene.fog = new THREE.Fog(0x2a2a2a, 300, 1400);
    }

    const groundGeom = new THREE.PlaneGeometry(GROUND_WIDTH, GROUND_DEPTH);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 1,
      metalness: 0,
    });
    this.ground = new THREE.Mesh(groundGeom, groundMat);
    this.ground.rotation.x = -Math.PI / 2; // lay flat (XZ plane)

    // Add detailed road markings, sidewalks, and curb lines in local space of ground.
    const roadMarkings = new THREE.Group();

    // Sidewalks
    const leftSidewalkGeom = new THREE.PlaneGeometry(120, GROUND_DEPTH);
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x666660, roughness: 0.9 });
    const leftSidewalk = new THREE.Mesh(leftSidewalkGeom, sidewalkMat);
    leftSidewalk.position.set(-400, 0, 0.01); // slightly above ground to prevent z-fighting
    roadMarkings.add(leftSidewalk);

    const rightSidewalk = new THREE.Mesh(leftSidewalkGeom, sidewalkMat);
    rightSidewalk.position.set(400, 0, 0.01);
    roadMarkings.add(rightSidewalk);

    // Grass Edges
    const edgeGeom = new THREE.PlaneGeometry(40, GROUND_DEPTH);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x2d4a2d, roughness: 1.0 });
    const leftEdge = new THREE.Mesh(edgeGeom, edgeMat);
    leftEdge.position.set(-480, 0, 0.02);
    roadMarkings.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeGeom, edgeMat);
    rightEdge.position.set(480, 0, 0.02);
    roadMarkings.add(rightEdge);

    // Lane dashed lines
    const dashGeom = new THREE.PlaneGeometry(6, 24);
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x5a5a3a, roughness: 0.9 });
    for (let y = -GROUND_DEPTH / 2; y < GROUND_DEPTH / 2; y += 40) {
      const dash = new THREE.Mesh(dashGeom, dashMat);
      dash.position.set(-3, y, 0.01);
      roadMarkings.add(dash);
    }

    this.ground.add(roadMarkings);

    // Back-most depth band: ground never occludes gameplay meshes.
    this.ground.renderOrder = depthRenderOrder('ground');
    this.ground.position.z = depthZOffset('ground');
    this.scene.add(this.ground);
    this.built = true;
  }

  getGround(): THREE.Mesh | null {
    return this.ground;
  }

  /** Reconcile houses to the first source's placements; scroll ground. */
  update(args: EnvironmentBridgeUpdate): void {
    const src = args.source[0];
    if (!src) return;
    this.cam = args.cam;
    this.create(); // ensure environment exists (robust if create() skipped)

    // House group reconciliation (base SyncBridge contract).
    super.update({ source: src.houses, host: args.host });

    const hazards = src.hazards ?? [];

    if (!this.isEnabled()) {
      hazards.forEach(h => h.sprite.setVisible(true));
      this.hazardBridge.teardown(this.scene);
      return;
    }

    // Keyed reconcile of hazard meshes (stable sprite key). Mid-list removal
    // no longer re-binds a mesh to the wrong entity.
    this.hazardBridge.update({ source: hazards, host: this.scene });

    // Sync hazards (position each live hazard mesh from its source item).
    const pairs = this.hazardBridge.getHazardPairs();
    for (let i = 0; i < pairs.length; i++) {
      const [rawItem, hGroup] = pairs[i] as [HazardSourceItem, THREE.Group];
      const hItem = rawItem;
      hItem.sprite.setVisible(false);
      const pos = worldToThree(hItem.sprite.x, hItem.sprite.y, this.cam, this.cfg);
      hGroup.position.set(pos.x, 0, pos.z);
      hGroup.renderOrder = depthRenderOrder('house');
    }

    // Dynamic flickering of window materials
    const time = performance.now();
    for (let i = 0; i < this.liveMeshes.length; i++) {
      const house = this.liveMeshes[i];
      const offset = i * 23.5;
      const baseIntensity = 1.4;
      const flicker = Math.sin(time * 0.002 + offset) * 0.15;
      const noise = (Math.sin(time * 0.047 + offset) + Math.cos(time * 0.071 + offset)) * 0.05;
      const intensity = Math.max(0.6, baseIntensity + flicker + noise);

      house.traverse(child => {
        if (child.name === 'window' && child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat && mat.isMeshStandardMaterial) {
            mat.emissiveIntensity = intensity;
          }
        }
      });
    }

    // Ground scroll from worldY (wrapped so the plane appears infinite).
    if (this.ground) {
      const scroll = ((src.worldY % GROUND_SCROLL_WRAP) + GROUND_SCROLL_WRAP) % GROUND_SCROLL_WRAP;
      this.ground.position.z = this.cfg.unitsPerPixel * scroll;
    }
  }

  protected createMesh(item: unknown): THREE.Group {
    const houseItem = item as HouseSourceItem;
    const opts: HouseMeshOptions = { type: houseItem.house.type };
    const group = createHouseMesh(opts);
    // Mid-back depth band: houses sit in front of ground, behind projectiles.
    group.renderOrder = depthRenderOrder('house');
    return group;
  }

  protected onAddToHost(mesh: THREE.Group, host: THREE.Scene): void {
    host.add(mesh);
  }

  protected onRemoveFromHost(mesh: THREE.Group, host: THREE.Scene): void {
    host.remove(mesh);
    disposeGroup(mesh);
  }

  /** Restore the 2D house sprites when the bridge is disabled. */
  protected onDisabled(source: unknown[]): void {
    for (const item of source as HouseSourceItem[]) {
      item.sprite.setVisible(true);
    }
  }

  protected syncMeshes(_source: unknown[], host: THREE.Scene): void {
    void host;
    const pairs = this.getSyncedPairs();
    for (let i = 0; i < pairs.length; i++) {
      const [rawItem, group] = pairs[i] as [HouseSourceItem, THREE.Group];
      const item = rawItem;
      const sprite = item.sprite;
      // Hide the 2D sprite (body stays active — collisions preserved).
      sprite.setVisible(false);
      const p = worldToThree(sprite.x, sprite.y, this.cam, this.cfg);
      group.position.x = p.x;
      group.position.z = p.z;
      group.position.y = 0;
    }
  }

  /** Tear down: clear houses, remove ground + fog. Safe to call when inactive. */
  override teardown(): void {
    super.teardown(this.scene);
    this.hazardBridge.teardown(this.scene);
    if (this.ground) {
      this.scene.remove(this.ground);
      this.ground.geometry.dispose();
      (this.ground.material as THREE.Material).dispose();
      this.ground = null;
    }
    this.scene.fog = null;
    this.built = false;
  }
}

export function createEnvironmentBridge(
  scene: THREE.Scene,
  cfg: OrthoConfig,
  reducedMotion = false
): EnvironmentBridge {
  return new EnvironmentBridge(scene, cfg, reducedMotion);
}

// Re-export so callers can size footprints if needed.
export { HOUSE_FOOTPRINT };
