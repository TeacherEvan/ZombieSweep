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
  group.add(box);
  const userData: HouseMeshUserData = { type: opts.type, stories };
  group.userData = userData;
  return group;
}
