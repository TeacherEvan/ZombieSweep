import type * as THREE from 'three';
import { SyncBridge, type BridgeUpdateArgs } from './SyncBridge';
import { ZombieType } from '../../entities/Zombie';
import { worldToThree, type CameraView, type OrthoConfig } from '../projection';
import { depthRenderOrder, depthZOffset } from '../depthBand';
import { createZombieMeshForType } from './ZombieMeshFactory';
import { animateZombieWalk } from './AnimationRig';
import { disposeGroup } from './disposeGroup';

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
    super({
      // Key by the source item object itself. GameScene rebuilds the zombie
      // source array each frame from getChildren(), but the per-sprite `sprite`
      // object reference is stable across frames for a given zombie, so it is a
      // reliable key. (If ZombieSourceItem were re-created each frame, this
      // would need to key on the zombie's stable numeric id instead.)
      getKey: (item: unknown) => (item as ZombieSourceItem).sprite,
    });
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

  protected syncMeshes(_source: unknown[]): void {
    const pairs = this.getSyncedPairs();
    for (let i = 0; i < pairs.length; i++) {
      const [rawItem, group] = pairs[i] as [ZombieSourceItem, THREE.Group];
      const item = rawItem;
      const sprite = item.sprite;
      sprite.setVisible(false);

      const p = worldToThree(sprite.x, sprite.y, this.cam, this.cfg);
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
