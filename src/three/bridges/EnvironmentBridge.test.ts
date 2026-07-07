import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createEnvironmentBridge,
  type EnvironmentBridgeSource,
  type HouseSourceItem,
} from './EnvironmentBridge';
import { HouseType } from '../../entities/House';
import { defaultOrthoConfig, worldToThree, type CameraView } from '../projection';

const cfg = defaultOrthoConfig(960, 540, 1);

/** Minimal 2D sprite stub with the public transform fields the bridge reads. */
function makeSprite(
  x: number,
  y: number
): { x: number; y: number; visible: boolean; setVisible: (v: boolean) => void } {
  return {
    x,
    y,
    visible: true,
    setVisible: function (v: boolean) {
      this.visible = v;
    },
  };
}

function makeSource(positions: Array<[number, number, HouseType]>): EnvironmentBridgeSource {
  const houses: HouseSourceItem[] = positions.map(([x, y, type]) => ({
    house: { type },
    sprite: makeSprite(x, y),
  }));
  return { houses, worldY: 0 };
}

describe('EnvironmentBridge', () => {
  const cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };

  it('builds a lighting rig + fog into the scene on create', () => {
    const scene = new THREE.Scene();
    const bridge = createEnvironmentBridge(scene, cfg);
    bridge.create();
    const hasLight = scene.children.some(
      c => c instanceof THREE.DirectionalLight || c instanceof THREE.AmbientLight
    );
    expect(hasLight).toBe(true);
    expect(scene.fog).not.toBeNull();
  });

  it('adds one house mesh per placement when enabled, and hides the 2D sprite', () => {
    const scene = new THREE.Scene();
    const bridge = createEnvironmentBridge(scene, cfg);
    bridge.setEnabled(true);
    const source = makeSource([
      [48, 68, HouseType.Ranch],
      [912, 120, HouseType.Victorian],
    ]);
    bridge.update({ source: [source], host: scene, cam });
    const houseGroups = scene.children.filter(
      c => c instanceof THREE.Group && (c as THREE.Group).userData?.type !== undefined
    );
    expect(houseGroups.length).toBe(2);
    expect(source.houses[0].sprite.visible).toBe(false);
    expect(source.houses[1].sprite.visible).toBe(false);
  });

  it('reprojects house meshes to parity with the reprojected 2D world point', () => {
    const scene = new THREE.Scene();
    const bridge = createEnvironmentBridge(scene, cfg);
    bridge.setEnabled(true);
    const source = makeSource([[480, 270, HouseType.Colonial]]);
    bridge.update({ source: [source], host: scene, cam });
    const group = scene.children.find(
      c => c instanceof THREE.Group && (c as THREE.Group).userData?.type === HouseType.Colonial
    ) as THREE.Group;
    const expected = worldToThree(480, 270, cam, cfg);
    // Group origin should sit at the reprojected base point (x/z parity).
    expect(group.position.x).toBeCloseTo(expected.x);
    expect(group.position.z).toBeCloseTo(expected.z);
    // Footprint sits on the ground (y = 0 at base).
    expect(group.position.y).toBeCloseTo(0);
  });

  it('shrinks house meshes when placement count drops', () => {
    const scene = new THREE.Scene();
    const bridge = createEnvironmentBridge(scene, cfg);
    bridge.setEnabled(true);
    bridge.update({
      source: [
        makeSource([
          [48, 68, HouseType.Ranch],
          [912, 120, HouseType.Victorian],
        ]),
      ],
      host: scene,
      cam,
    });
    bridge.update({ source: [makeSource([[48, 68, HouseType.Ranch]])], host: scene, cam });
    const houseGroups = scene.children.filter(
      c => c instanceof THREE.Group && (c as THREE.Group).userData?.type !== undefined
    );
    expect(houseGroups.length).toBe(1);
  });

  it('re-shows 2D sprites and clears meshes when disabled', () => {
    const scene = new THREE.Scene();
    const bridge = createEnvironmentBridge(scene, cfg);
    bridge.setEnabled(true);
    const source = makeSource([
      [48, 68, HouseType.Ranch],
      [912, 120, HouseType.Victorian],
    ]);
    bridge.update({ source: [source], host: scene, cam });
    bridge.setEnabled(false);
    bridge.update({ source: [source], host: scene, cam });
    const houseGroups = scene.children.filter(
      c => c instanceof THREE.Group && (c as THREE.Group).userData?.type !== undefined
    );
    expect(houseGroups.length).toBe(0);
    expect(source.houses[0].sprite.visible).toBe(true);
    expect(source.houses[1].sprite.visible).toBe(true);
  });

  it('scrolls the ground plane by worldY offset', () => {
    const scene = new THREE.Scene();
    const bridge = createEnvironmentBridge(scene, cfg);
    bridge.setEnabled(true);
    const src0 = makeSource([[48, 68, HouseType.Ranch]]);
    src0.worldY = 0;
    bridge.update({ source: [src0], host: scene, cam });
    const ground0 = bridge.getGround()!;
    const z0 = ground0.position.z;

    const src1 = makeSource([[48, 68, HouseType.Ranch]]);
    src1.worldY = 120;
    bridge.update({ source: [src1], host: scene, cam });
    expect(ground0.position.z).not.toBeCloseTo(z0);
  });

  it('teardown removes lights, fog, houses, and ground from the scene', () => {
    const scene = new THREE.Scene();
    const bridge = createEnvironmentBridge(scene, cfg);
    bridge.setEnabled(true);
    bridge.create();
    bridge.update({ source: [makeSource([[48, 68, HouseType.Ranch]])], host: scene, cam });
    bridge.teardown();
    const houseGroups = scene.children.filter(
      c => c instanceof THREE.Group && (c as THREE.Group).userData?.type !== undefined
    );
    expect(houseGroups.length).toBe(0);
    expect(bridge.isEnabled()).toBe(false);
  });
});
