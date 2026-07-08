import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { PlayerBridge, type PlayerSourceItem } from './PlayerBridge';
import { VehicleType } from '../../config/vehicles';
import { defaultOrthoConfig, worldToThree, type CameraView } from '../projection';

const cfg = defaultOrthoConfig(960, 540, 1);

function makeSprite(
  x: number,
  y: number,
  rotation = 0,
  scaleX = 1
): { x: number; y: number; rotation: number; scaleX: number; visible: boolean; setVisible: (v: boolean) => void } {
  return {
    x,
    y,
    rotation,
    scaleX,
    visible: true,
    setVisible: function (v: boolean) {
      this.visible = v;
    },
  };
}

describe('PlayerBridge', () => {
  const cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };

  it('adds a vehicle mesh when enabled and hides the 2D sprite', () => {
    const scene = new THREE.Scene();
    const bridge = new PlayerBridge(scene, cfg);
    bridge.setEnabled(true);

    const source: PlayerSourceItem[] = [
      {
        vehicle: VehicleType.Bicycle,
        sprite: makeSprite(480, 270),
      },
    ];

    bridge.update({ source, host: scene, cam });

    const groups = scene.children.filter(c => c instanceof THREE.Group);
    expect(groups.length).toBe(1);
    expect(source[0].sprite.visible).toBe(false);
  });

  it('reprojects player mesh to parity with the reprojected 2D point, rotation, and scale', () => {
    const scene = new THREE.Scene();
    const bridge = new PlayerBridge(scene, cfg);
    bridge.setEnabled(true);

    const source: PlayerSourceItem[] = [
      {
        vehicle: VehicleType.Skateboard,
        sprite: makeSprite(100, 200, Math.PI / 4, -1),
      },
    ];

    bridge.update({ source, host: scene, cam });

    const group = scene.children[0] as THREE.Group;
    const expected = worldToThree(100, 200, cam, cfg);

    expect(group.position.x).toBeCloseTo(expected.x);
    expect(group.position.z).toBeCloseTo(expected.z);
    expect(group.position.y).toBeCloseTo(0);
    expect(group.rotation.y).toBeCloseTo(-Math.PI / 4);
    expect(group.scale.x).toBe(-1);
  });

  it('re-shows 2D player sprite and removes meshes when disabled', () => {
    const scene = new THREE.Scene();
    const bridge = new PlayerBridge(scene, cfg);
    bridge.setEnabled(true);

    const source: PlayerSourceItem[] = [
      {
        vehicle: VehicleType.RollerBlades,
        sprite: makeSprite(480, 270),
      },
    ];

    bridge.update({ source, host: scene, cam });
    expect(source[0].sprite.visible).toBe(false);

    bridge.setEnabled(false);
    bridge.update({ source, host: scene, cam });

    const groups = scene.children.filter(c => c instanceof THREE.Group);
    expect(groups.length).toBe(0);
    expect(source[0].sprite.visible).toBe(true);
  });
});
