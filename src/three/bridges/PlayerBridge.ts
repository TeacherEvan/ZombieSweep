import * as THREE from 'three';
import { SyncBridge, type BridgeUpdateArgs } from './SyncBridge';
import { VehicleType } from '../../config/vehicles';
import { worldToThree, type CameraView, type OrthoConfig } from '../projection';
import { depthRenderOrder, depthZOffset } from '../depthBand';

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
}

export class PlayerBridge extends SyncBridge<THREE.Group, THREE.Scene> {
  private cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };
  private readonly cfg: OrthoConfig;

  constructor(
    private readonly scene: THREE.Scene,
    cfg: OrthoConfig
  ) {
    super();
    this.cfg = cfg;
  }

  update(args: PlayerBridgeUpdate): void {
    const src = args.source;
    if (!src) return;
    this.cam = args.cam;
    super.update({ source: src, host: args.host });
  }

  protected createMesh(item: unknown): THREE.Group {
    const playerItem = item as PlayerSourceItem;
    const group = createPlayerVehicleMesh(playerItem.vehicle);
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

  protected syncMeshes(source: unknown[]): void {
    const items = source as PlayerSourceItem[];
    const live = this.liveMeshes;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const sprite = item.sprite;
      sprite.setVisible(false);

      const p = worldToThree(sprite.x, sprite.y, this.cam, this.cfg);
      const group = live[i];
      group.position.x = p.x;
      group.position.z = p.z;
      group.position.y = 0;

      // Mirror Phaser rotation on Y axis
      group.rotation.y = -sprite.rotation;
      group.scale.set(sprite.scaleX, 1, 1);
    }
  }

  override teardown(): void {
    super.teardown(this.scene);
  }
}

export function createPlayerVehicleMesh(type: VehicleType): THREE.Group {
  const group = new THREE.Group();

  if (type === VehicleType.Bicycle) {
    // Frame
    const frameGeom = new THREE.BoxGeometry(2, 6, 16);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xd93838, roughness: 0.5 });
    const frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.y = 8;
    group.add(frame);

    // Handlebars
    const barGeom = new THREE.BoxGeometry(12, 1, 2);
    const barMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
    const bar = new THREE.Mesh(barGeom, barMat);
    bar.position.set(0, 12, 6);
    group.add(bar);

    // Front Wheel
    const wheelGeom = new THREE.CylinderGeometry(5, 5, 1.5, 8);
    wheelGeom.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.9 });
    const frontWheel = new THREE.Mesh(wheelGeom, wheelMat);
    frontWheel.position.set(0, 5, 8);
    group.add(frontWheel);

    // Back Wheel
    const backWheel = new THREE.Mesh(wheelGeom, wheelMat);
    backWheel.position.set(0, 5, -8);
    group.add(backWheel);
  } else if (type === VehicleType.Skateboard) {
    // Deck
    const deckGeom = new THREE.BoxGeometry(8, 1.5, 20);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.6 });
    const deck = new THREE.Mesh(deckGeom, deckMat);
    deck.position.y = 3;
    group.add(deck);

    // Wheels
    const wheelGeom = new THREE.CylinderGeometry(1.5, 1.5, 1, 8);
    wheelGeom.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 });

    const wheelPositions = [
      [-3, 1.5, 6],
      [3, 1.5, 6],
      [-3, 1.5, -6],
      [3, 1.5, -6],
    ];
    for (const pos of wheelPositions) {
      const w = new THREE.Mesh(wheelGeom, wheelMat);
      w.position.set(pos[0], pos[1], pos[2]);
      group.add(w);
    }
  } else {
    // RollerBlades
    const bootGeom = new THREE.BoxGeometry(3, 8, 8);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 });

    const leftBoot = new THREE.Mesh(bootGeom, bootMat);
    leftBoot.position.set(-3, 5, 0);
    group.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeom, bootMat);
    rightBoot.position.set(3, 5, 0);
    group.add(rightBoot);

    const wheelGeom = new THREE.SphereGeometry(1, 8, 8);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });

    const wheelZOffsets = [-3, -1, 1, 3];
    for (const z of wheelZOffsets) {
      const wL = new THREE.Mesh(wheelGeom, wheelMat);
      wL.position.set(-3, 1, z);
      group.add(wL);

      const wR = new THREE.Mesh(wheelGeom, wheelMat);
      wR.position.set(3, 1, z);
      group.add(wR);
    }
  }

  // Torso / Head human rider box model
  const baseHeight = type === VehicleType.Bicycle ? 8 : type === VehicleType.Skateboard ? 3 : 5;
  const torsoGeom = new THREE.BoxGeometry(6, 10, 4);
  const torsoMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.7 });
  const torso = new THREE.Mesh(torsoGeom, torsoMat);
  torso.position.set(0, baseHeight + 5, 0);
  group.add(torso);

  const headGeom = new THREE.SphereGeometry(3, 8, 8);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.set(0, baseHeight + 12, 0);
  group.add(head);

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
