import type * as THREE from 'three';
import { SyncBridge, type BridgeUpdateArgs } from './SyncBridge';
import { VehicleType } from '../../config/vehicles';
import { worldToThree, type CameraView, type OrthoConfig } from '../projection';
import { depthRenderOrder, depthZOffset } from '../depthBand';
import { createPlayerMeshForVehicle } from './PlayerMeshFactory';
import {
  animateBicycleRider,
  animateSkateboardRider,
  animateRollerbladeRider,
} from './AnimationRig';
import { disposeGroup } from './disposeGroup';

export interface PlayerSourceItem {
  vehicle: VehicleType;
  sprite: {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    visible: boolean;
    setVisible(v: boolean): void;
  };
}

export interface PlayerBridgeUpdate extends BridgeUpdateArgs<THREE.Scene> {
  source: PlayerSourceItem[];
  cam: CameraView;
  dt?: number;
}

export class PlayerBridge extends SyncBridge<THREE.Group, THREE.Scene> {
  private cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };
  private readonly cfg: OrthoConfig;
  private elapsed = 0;

  constructor(
    private readonly scene: THREE.Scene,
    cfg: OrthoConfig
  ) {
    super({
      // Player is a single stable sprite; key by it.
      getKey: (item: unknown) => (item as PlayerSourceItem).sprite,
    });
    this.cfg = cfg;
  }

  update(args: PlayerBridgeUpdate): void {
    const src = args.source;
    if (!src) return;
    this.cam = args.cam;
    this.elapsed += args.dt || 16;
    super.update({ source: src, host: args.host });
  }

  protected createMesh(item: unknown): THREE.Group {
    const playerItem = item as PlayerSourceItem;
    const group = createPlayerMeshForVehicle(playerItem.vehicle);
    group.renderOrder = depthRenderOrder('player');
    // Align z-offset in depthBand.
    const baseZ = depthZOffset('player');
    group.position.z = baseZ;
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
    for (const item of source as PlayerSourceItem[]) {
      item.sprite.setVisible(true);
    }
  }

  protected syncMeshes(_source: unknown[]): void {
    const pairs = this.getSyncedPairs();
    for (let i = 0; i < pairs.length; i++) {
      const [rawItem, group] = pairs[i] as [PlayerSourceItem, THREE.Group];
      const item = rawItem;
      const sprite = item.sprite;
      sprite.setVisible(false);

      const p = worldToThree(sprite.x, sprite.y, this.cam, this.cfg);
      group.position.x = p.x;
      group.position.z = p.z;
      group.position.y = 0;

      // Mirror Phaser rotation on Y axis
      group.rotation.y = -sprite.rotation;
      group.scale.set(sprite.scaleX, 1, 1);

      // Per-vehicle rig (plan Goal: detailed per-vehicle animation).
      switch (item.vehicle) {
        case VehicleType.Bicycle:
          animateBicycleRider(group, this.elapsed, 8);
          break;
        case VehicleType.Skateboard:
          animateSkateboardRider(group, this.elapsed, 8);
          break;
        case VehicleType.RollerBlades:
          animateRollerbladeRider(group, this.elapsed, 8);
          break;
      }
    }
  }

  override teardown(): void {
    super.teardown(this.scene);
  }
}
