import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createEnvironmentBridge,
  type EnvironmentBridgeSource,
  type HouseSourceItem,
} from './EnvironmentBridge';
import {
  createEffectsBridge,
  type EffectsBridgeSource,
  type KillEvent,
  type ProjectileSourceItem,
} from './EffectsBridge';
import {
  defaultOrthoConfig,
  worldToScreen,
  worldToThree,
  threeToScreen,
  type CameraView,
} from '../projection';
import { DEPTH_BAND, depthRenderOrder, depthZOffset } from '../depthBand';
import { HouseType } from '../../entities/House';

const cfg = defaultOrthoConfig(960, 540, 1);
const cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };

function makeSprite(x: number, y: number) {
  return {
    x,
    y,
    visible: true,
    setVisible(v: boolean) {
      this.visible = v;
    },
  };
}
function makeHouseSource(positions: Array<[number, number]>): EnvironmentBridgeSource {
  const houses: HouseSourceItem[] = positions.map(([x, y]) => ({
    house: { type: HouseType.Ranch },
    sprite: makeSprite(x, y),
  }));
  return { houses, worldY: 0 };
}
function makeEffectsSource(
  projectiles: ProjectileSourceItem[],
  killEvents: KillEvent[] = []
): EffectsBridgeSource {
  return { projectiles, killEvents, comboTier: 0 };
}

describe('P4.1 — unified depth sort', () => {
  it('assigns houses a lower renderOrder and farther z than projectiles', () => {
    const scene = new THREE.Scene();
    const env = createEnvironmentBridge(scene, cfg);
    env.setEnabled(true);
    env.update({ source: [makeHouseSource([[480, 270]])], host: scene, cam });

    const effects = createEffectsBridge(scene, cfg);
    effects.setEnabled(true);
    const proj: ProjectileSourceItem = { x: 480, y: 270, angle: 0 };
    effects.update({ source: [makeEffectsSource([proj])], host: scene, cam });

    const houseGroup = scene.children.find(
      c => c instanceof THREE.Group && (c as THREE.Group).userData?.type !== undefined
    ) as THREE.Group;
    const projectileMesh = effects.getProjectileMeshes()[0];

    // Explicit depth-band ordering: houses behind projectiles.
    expect(depthRenderOrder('house')).toBeLessThan(depthRenderOrder('projectile'));
    expect(houseGroup.renderOrder).toBe(depthRenderOrder('house'));
    expect(projectileMesh.renderOrder).toBe(depthRenderOrder('projectile'));
    expect(houseGroup.renderOrder).toBeLessThan(projectileMesh.renderOrder);

    // Camera looks toward -z, so a smaller z is farther back.
    expect(houseGroup.position.z).toBeLessThan(projectileMesh.position.z);
  });

  it('parity: a 2D sprite reprojects to the same screen X as its 3D mesh', () => {
    const scene = new THREE.Scene();
    const env = createEnvironmentBridge(scene, cfg);
    env.setEnabled(true);
    const wx = 320;
    const wy = 410;
    env.update({ source: [makeHouseSource([[wx, wy]])], host: scene, cam });

    const houseGroup = scene.children.find(
      c => c instanceof THREE.Group && (c as THREE.Group).userData?.type !== undefined
    ) as THREE.Group;

    // 2D sprite's screen X (canvas pixels) via the projection module.
    const expectedScreen = worldToScreen(wx, wy, cam.scrollX, cam.scrollY, cam.zoom);
    // 3D mesh's resolved screen X via the inverse projection. Houses are
    // grounded at world y=0 by design, so only X parity with the sprite is
    // meaningful here; Y is anchored to the floor, not the sprite top.
    const resolvedScreen = threeToScreen(houseGroup.position.x, houseGroup.position.y, cfg);
    expect(resolvedScreen.x).toBeCloseTo(expectedScreen.x, 5);

    // And the forward projection round-trips consistently to the same point.
    const fwd = worldToThree(wx, wy, cam, cfg);
    const roundTrip = threeToScreen(fwd.x, fwd.y, cfg);
    expect(roundTrip.x).toBeCloseTo(expectedScreen.x, 5);
  });

  it('keeps depth band constants consistent (back < front)', () => {
    expect(DEPTH_BAND.ground).toBeLessThan(DEPTH_BAND.house);
    expect(DEPTH_BAND.house).toBeLessThan(DEPTH_BAND.projectile);
    expect(DEPTH_BAND.projectile).toBeLessThan(DEPTH_BAND.particle);
    expect(depthZOffset('ground')).toBeLessThan(depthZOffset('house'));
    expect(depthZOffset('house')).toBeLessThan(depthZOffset('projectile'));
    expect(depthZOffset('projectile')).toBeLessThan(depthZOffset('particle'));
  });
});
