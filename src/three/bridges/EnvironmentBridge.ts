import * as THREE from 'three';
import { SyncBridge, type BridgeUpdateArgs } from './SyncBridge';
import { createHouseMesh, HOUSE_FOOTPRINT, type HouseMeshOptions } from './HouseMeshFactory';
import type { HouseType } from '../../entities/House';
import { worldToThree, type CameraView, type OrthoConfig } from '../projection';

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

/** Per-frame source for the environment bridge. */
export interface EnvironmentBridgeSource {
  houses: HouseSourceItem[];
  /** Route scroll position (GameScene.worldY) driving ground scroll. */
  worldY: number;
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

  constructor(
    private readonly scene: THREE.Scene,
    cfg: OrthoConfig
  ) {
    super();
    this.cfg = cfg;
  }

  /** Inject lighting rig + fog + ground plane into the scene. Idempotent. */
  create(): void {
    if (this.built) return;
    const ambient = new THREE.AmbientLight(0x404654, 1.1);
    const dir = new THREE.DirectionalLight(0xfff0d0, 1.4);
    dir.position.set(-0.5, 1, 0.8);
    this.scene.add(ambient);
    this.scene.add(dir);

    // Apocalypse mood fog.
    this.scene.fog = new THREE.Fog(0x2a2a2a, 300, 1400);

    const groundGeom = new THREE.PlaneGeometry(GROUND_WIDTH, GROUND_DEPTH);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 1,
      metalness: 0,
    });
    this.ground = new THREE.Mesh(groundGeom, groundMat);
    this.ground.rotation.x = -Math.PI / 2; // lay flat (XZ plane)
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

    // Ground scroll from worldY (wrapped so the plane appears infinite).
    if (this.ground) {
      const scroll = ((src.worldY % GROUND_SCROLL_WRAP) + GROUND_SCROLL_WRAP) % GROUND_SCROLL_WRAP;
      this.ground.position.z = this.cfg.unitsPerPixel * scroll;
    }
  }

  protected createMesh(item: unknown): THREE.Group {
    const houseItem = item as HouseSourceItem;
    const opts: HouseMeshOptions = { type: houseItem.house.type };
    return createHouseMesh(opts);
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

  protected syncMeshes(source: unknown[], host: THREE.Scene): void {
    void host;
    const items = source as HouseSourceItem[];
    const live = this.liveMeshes;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const sprite = item.sprite;
      // Hide the 2D sprite (body stays active — collisions preserved).
      sprite.setVisible(false);
      const p = worldToThree(sprite.x, sprite.y, this.cam, this.cfg);
      const group = live[i];
      group.position.x = p.x;
      group.position.z = p.z;
      group.position.y = 0;
    }
  }

  /** Tear down: clear houses, remove ground + fog. Safe to call when inactive. */
  override teardown(): void {
    super.teardown(this.scene);
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

function disposeGroup(group: THREE.Group): void {
  group.traverse(obj => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const mat = obj.material;
      if (Array.isArray(mat)) mat.forEach(m => m.dispose());
      else mat.dispose();
    }
  });
}

export function createEnvironmentBridge(scene: THREE.Scene, cfg: OrthoConfig): EnvironmentBridge {
  return new EnvironmentBridge(scene, cfg);
}

// Re-export so callers can size footprints if needed.
export { HOUSE_FOOTPRINT };
