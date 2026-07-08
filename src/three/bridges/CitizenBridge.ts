import * as THREE from 'three';
import { SyncBridge, type BridgeUpdateArgs } from './SyncBridge';
import type { CitizenType } from '../../entities/Citizen';
import { createCitizenMeshForType } from './CitizenMeshFactory';
import { worldToThree, type CameraView, type OrthoConfig } from '../projection';
import { depthRenderOrder, depthZOffset } from '../depthBand';
import { animateCitizenPanic } from './AnimationRig';

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
    super();
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
    mesh.traverse(o => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const m = o.material;
        if (Array.isArray(m)) {
          m.forEach(x => x.dispose());
        } else {
          m.dispose();
        }
      }
    });
  }

  protected onDisabled(source: unknown[]): void {
    (source as CitizenSourceItem[]).forEach(i => i.sprite.setVisible(true));
  }

  protected syncMeshes(source: unknown[]): void {
    const items = source as CitizenSourceItem[];
    for (let i = 0; i < items.length; i++) {
      const { sprite } = items[i];
      sprite.setVisible(false);
      const p = worldToThree(sprite.x, sprite.y, this.cam, this.cfg);
      const group = this.liveMeshes[i];
      group.position.set(p.x, 0, p.z);
      group.rotation.y = -sprite.rotation;
      animateCitizenPanic(group, this.elapsed + i * 200);
    }
  }

  override teardown(): void {
    super.teardown(this.scene);
  }
}
