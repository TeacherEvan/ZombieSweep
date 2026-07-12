import type * as THREE from 'three';
import { SyncBridge, type BridgeUpdateArgs } from './SyncBridge';
import type { CitizenType } from '../../entities/Citizen';
import { createCitizenMeshForType } from './CitizenMeshFactory';
import { worldToThree, type CameraView, type OrthoConfig } from '../projection';
import { depthRenderOrder, depthZOffset } from '../depthBand';
import { animateCitizenPanic } from './AnimationRig';
import { disposeGroup } from './disposeGroup';

export interface CitizenSourceItem {
  type: CitizenType;
  sprite: {
    x: number;
    y: number;
    rotation: number;
    visible: boolean;
    setVisible(v: boolean): void;
  };
}

export interface CitizenBridgeUpdate extends BridgeUpdateArgs<THREE.Scene> {
  source: CitizenSourceItem[];
  cam: CameraView;
  dt: number;
}

export class CitizenBridge extends SyncBridge<THREE.Group, THREE.Scene> {
  private cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };
  private readonly cfg: OrthoConfig;
  private elapsed = 0;

  constructor(
    private readonly scene: THREE.Scene,
    cfg: OrthoConfig
  ) {
    super({
      // Key by the per-sprite object (stable across frames for a given citizen).
      getKey: (item: unknown) => (item as CitizenSourceItem).sprite,
    });
    this.cfg = cfg;
  }

  update(args: CitizenBridgeUpdate): void {
    if (!args.source) return;
    this.cam = args.cam;
    this.elapsed += args.dt || 16;
    super.update({ source: args.source, host: args.host });
  }

  protected createMesh(item: unknown): THREE.Group {
    const ci = item as CitizenSourceItem;
    const group = createCitizenMeshForType(ci.type);
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
    (source as CitizenSourceItem[]).forEach(i => i.sprite.setVisible(true));
  }

  protected syncMeshes(_source: unknown[]): void {
    const pairs = this.getSyncedPairs();
    for (let i = 0; i < pairs.length; i++) {
      const [rawItem, group] = pairs[i] as [CitizenSourceItem, THREE.Group];
      const item = rawItem;
      const { sprite } = item;
      sprite.setVisible(false);
      const p = worldToThree(sprite.x, sprite.y, this.cam, this.cfg);
      group.position.set(p.x, 0, p.z);
      group.rotation.y = -sprite.rotation;
      animateCitizenPanic(group, this.elapsed + i * 200);
    }
  }

  override teardown(): void {
    super.teardown(this.scene);
  }
}
