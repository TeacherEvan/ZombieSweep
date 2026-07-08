import * as THREE from 'three';
import { HouseType } from '../../entities/House';

/** Base footprint per house type (Three world units, at unitsPerPixel = 1). */
export const HOUSE_FOOTPRINT: Record<HouseType, { width: number; depth: number }> = {
  [HouseType.Ranch]: { width: 64, depth: 48 },
  [HouseType.Colonial]: { width: 72, depth: 56 },
  [HouseType.Victorian]: { width: 80, depth: 64 },
};

/** Apocalypse-muted palette per house type. */
export const HOUSE_COLORS: Record<HouseType, number> = {
  [HouseType.Ranch]: 0x8a7f6d,
  [HouseType.Colonial]: 0x6d7280,
  [HouseType.Victorian]: 0x574b5a,
};

/** Stories per house type when no override is supplied (Ranch < Colonial < Victorian). */
export function defaultStoriesForType(type: HouseType): number {
  switch (type) {
    case HouseType.Ranch:
      return 1;
    case HouseType.Colonial:
      return 2;
    case HouseType.Victorian:
      return 3;
  }
}

export const STORY_HEIGHT = 30;

export interface HouseMeshOptions {
  type: HouseType;
  /** Override the type-default story count. */
  stories?: number;
}

export interface HouseMeshUserData {
  type: HouseType;
  stories: number;
}

/**
 * Create a procedural low-poly house as a `THREE.Group` (box body). The base
 * sits on y=0 so it can be reprojected onto the ground plane. Geometry is
 * shared-free (one box per instance) — pooling happens at the bridge level.
 * Enhanced with windows, doors, and a pitched roof.
 */
export function createHouseMesh(opts: HouseMeshOptions): THREE.Group {
  const stories = opts.stories ?? defaultStoriesForType(opts.type);
  const { width, depth } = HOUSE_FOOTPRINT[opts.type];
  const height = stories * STORY_HEIGHT;

  const geom = new THREE.BoxGeometry(width, height, depth);
  geom.computeBoundingBox();
  const mat = new THREE.MeshStandardMaterial({
    color: HOUSE_COLORS[opts.type],
    roughness: 0.85,
    metalness: 0.05,
  });
  const box = new THREE.Mesh(geom, mat);
  // Sit the base on the ground (y origin at ground), lift by half height.
  box.position.y = height / 2;

  const group = new THREE.Group();
  // CRITICAL: Add box first to preserve group.children[0] test expectations
  group.add(box);

  // 1. Pitched Roof (Pyramid using 4-radial-segment Cone)
  const roofHeight = 15;
  const R = Math.max(width, depth) / Math.sqrt(2);
  const roofGeom = new THREE.ConeGeometry(R, roofHeight, 4);
  roofGeom.rotateY(Math.PI / 4);
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x2b2d30, // dark roof tile color
    roughness: 0.9,
    metalness: 0.1,
  });
  const roof = new THREE.Mesh(roofGeom, roofMat);
  // Scale the circular cone footprint to perfectly fit the rectangular house footprint
  roof.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
  roof.position.set(0, height + roofHeight / 2, 0);
  group.add(roof);

  // 2b. Emissive roofline trim — a thin glowing band that UnrealBloom catches,
  // giving each house a readable "lit" silhouette at night-apocalypse mood.
  const trimGeom = new THREE.BoxGeometry(width * 0.92, 1.5, depth * 0.92);
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    emissive: 0x6fd0ff, // cool cyan accent
    emissiveIntensity: 1.1,
    roughness: 0.3,
    metalness: 0.6,
  });
  const trim = new THREE.Mesh(trimGeom, trimMat);
  trim.position.set(0, height + 1, 0);
  group.add(trim);

  // 2c. Door on Ground Floor (Center)
  const doorWidth = 10;
  const doorHeight = 16;
  const doorDepth = 1.5;
  const doorGeom = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x3d2b1f, // dark wood mahogany
    roughness: 0.8,
  });
  const door = new THREE.Mesh(doorGeom, doorMat);
  door.position.set(0, doorHeight / 2, depth / 2 + doorDepth / 2);
  group.add(door);

  // 3. Glowing Windows (Yellow interior light behind glass)
  const windowWidth = 8;
  const windowHeight = 10;
  const windowDepth = 1;
  const windowGeom = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x1f2d3d,
    emissive: 0xffd56b, // warm amber light
    emissiveIntensity: 1.4, // brighter so UnrealBloom picks it up (design P3)
    roughness: 0.1,
    metalness: 0.9,
  });

  // Distribute windows horizontally and vertically
  const xOffsets = [-width * 0.28, width * 0.28];

  for (let story = 0; story < stories; story++) {
    const y = story * STORY_HEIGHT + STORY_HEIGHT / 2;

    // Front face windows (facing camera/Z+)
    for (const x of xOffsets) {
      // Don't place windows too close to the door on the ground floor
      if (story === 0 && Math.abs(x) < doorWidth + 2) continue;

      const winFront = new THREE.Mesh(windowGeom, windowMat);
      winFront.name = 'window';
      winFront.position.set(x, y, depth / 2 + windowDepth / 2);
      group.add(winFront);
    }

    // Side face windows (facing X+ and X-)
    const sideZOffsets = [-depth * 0.2, depth * 0.2];
    for (const z of sideZOffsets) {
      // Rotated window mesh for sides
      const winLeft = new THREE.Mesh(windowGeom, windowMat);
      winLeft.name = 'window';
      winLeft.rotation.y = Math.PI / 2;
      winLeft.position.set(-width / 2 - windowDepth / 2, y, z);
      group.add(winLeft);

      const winRight = new THREE.Mesh(windowGeom, windowMat);
      winRight.name = 'window';
      winRight.rotation.y = Math.PI / 2;
      winRight.position.set(width / 2 + windowDepth / 2, y, z);
      group.add(winRight);
    }
  }

  const userData: HouseMeshUserData = { type: opts.type, stories };
  group.userData = userData;
  return group;
}
