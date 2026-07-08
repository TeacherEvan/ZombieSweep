import * as THREE from 'three';
import { SyncBridge, type BridgeUpdateArgs } from './SyncBridge';
import { ZombieType } from '../../entities/Zombie';
import { worldToThree, type CameraView, type OrthoConfig } from '../projection';
import { depthRenderOrder, depthZOffset } from '../depthBand';

export interface ZombieSourceItem {
  type: ZombieType;
  elite: boolean;
  sprite: {
    x: number;
    y: number;
    rotation: number;
    visible: boolean;
    setVisible(v: boolean): void;
  };
}

export interface ZombieBridgeUpdate extends BridgeUpdateArgs<THREE.Scene> {
  source: ZombieSourceItem[];
  cam: CameraView;
  dt: number;
}

export class ZombieBridge extends SyncBridge<THREE.Group, THREE.Scene> {
  private cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };
  private readonly cfg: OrthoConfig;
  private elapsed = 0;

  constructor(
    private readonly scene: THREE.Scene,
    cfg: OrthoConfig
  ) {
    super();
    this.cfg = cfg;
  }

  update(args: ZombieBridgeUpdate): void {
    const src = args.source;
    if (!src) return;
    this.cam = args.cam;
    this.elapsed += args.dt;
    super.update({ source: src, host: args.host });
  }

  protected createMesh(item: unknown): THREE.Group {
    const zombieItem = item as ZombieSourceItem;
    const group = createZombieMesh(zombieItem.type, zombieItem.elite);
    group.renderOrder = depthRenderOrder('actor');
    group.position.z = depthZOffset('actor');
    return group;
  }

  protected onAddToHost(mesh: THREE.Group, host: THREE.Scene): void {
    host.add(mesh);
  }

  protected onRemoveFromHost(mesh: THREE.Group, host: THREE.Scene): void {
    host.remove(mesh);
    disposeGroup(mesh);
  }

  protected onDisabled(source: unknown[]): void {
    for (const item of source as ZombieSourceItem[]) {
      item.sprite.setVisible(true);
    }
  }

  protected syncMeshes(source: unknown[]): void {
    const items = source as ZombieSourceItem[];
    const live = this.liveMeshes;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const sprite = item.sprite;
      sprite.setVisible(false);

      const p = worldToThree(sprite.x, sprite.y, this.cam, this.cfg);
      const group = live[i];
      group.position.x = p.x;
      group.position.z = p.z;

      // Dynamic Bobbing
      const speed = item.type === ZombieType.Runner ? 12 : 6;
      const height = item.type === ZombieType.Runner ? 2.5 : 1.5;
      const bob = Math.abs(Math.sin(this.elapsed * 0.001 * speed + i)) * height;
      group.position.y = bob;

      group.rotation.y = -sprite.rotation;
    }
  }

  override teardown(): void {
    super.teardown(this.scene);
  }
}

export function createZombieMesh(type: ZombieType, elite: boolean): THREE.Group {
  const group = new THREE.Group();

  let color = 0x4caf50; // Shamble green
  if (type === ZombieType.Runner) {
    color = 0xd32f2f; // Runner red
  } else if (type === ZombieType.Spitter) {
    color = 0x827717; // Spitter olive
  }

  // Torso
  const bodyGeom = new THREE.BoxGeometry(6, 12, 4);
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = 6;
  group.add(body);

  // Head
  const headGeom = new THREE.SphereGeometry(3.5, 8, 8);
  const headMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
  });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.set(0, 15.5, 0);
  group.add(head);

  // Arms reaching out forward (Z+)
  const armGeom = new THREE.BoxGeometry(1.5, 1.5, 8);
  const armMat = new THREE.MeshStandardMaterial({ color });

  const leftArm = new THREE.Mesh(armGeom, armMat);
  leftArm.position.set(-3.5, 10, 3);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, armMat);
  rightArm.position.set(3.5, 10, 3);
  group.add(rightArm);

  // Elite emissive glow + size scale
  if (elite) {
    const glowGeom = new THREE.BoxGeometry(4, 1, 1);
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff3333,
      emissiveIntensity: 3.0, // brighter so UnrealBloom picks up the elite glow (P3)
    });
    const visor = new THREE.Mesh(glowGeom, glowMat);
    visor.position.set(0, 16.5, 2.5); // face
    group.add(visor);
    group.scale.set(1.25, 1.25, 1.25);
  }

  return group;
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
