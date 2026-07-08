import * as THREE from 'three';
import { SyncBridge, type BridgeUpdateArgs } from './SyncBridge';
import { ZombieType } from '../../entities/Zombie';
import { worldToThree, type CameraView, type OrthoConfig } from '../projection';
import { depthRenderOrder, depthZOffset } from '../depthBand';
import { createZombieMeshForType } from './ZombieMeshFactory';
import { animateZombieWalk } from './AnimationRig';

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
    const group = createZombieMeshForType(zombieItem.type, zombieItem.elite);
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

      animateZombieWalk(group, this.elapsed + i * 150, item.type);
    }
  }

  override teardown(): void {
    super.teardown(this.scene);
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
