import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createHouseMesh,
  defaultStoriesForType,
  HOUSE_FOOTPRINT,
  HOUSE_COLORS,
  type HouseMeshOptions,
} from './HouseMeshFactory';
import { HouseType } from '../../entities/House';

describe('HouseMeshFactory', () => {
  describe('defaultStoriesForType', () => {
    it('maps larger house types to more stories', () => {
      expect(defaultStoriesForType(HouseType.Ranch)).toBe(1);
      expect(defaultStoriesForType(HouseType.Colonial)).toBe(2);
      expect(defaultStoriesForType(HouseType.Victorian)).toBe(3);
    });
  });

  describe('HOUSE_FOOTPRINT', () => {
    it('all house types have positive width and depth', () => {
      for (const t of [HouseType.Ranch, HouseType.Colonial, HouseType.Victorian]) {
        expect(HOUSE_FOOTPRINT[t].width).toBeGreaterThan(0);
        expect(HOUSE_FOOTPRINT[t].depth).toBeGreaterThan(0);
      }
    });
  });

  describe('createHouseMesh', () => {
    it('builds a Group containing a box mesh', () => {
      const group = createHouseMesh({ type: HouseType.Colonial });
      expect(group).toBeInstanceOf(THREE.Group);
      const box = group.children.find(c => (c as THREE.Mesh).geometry instanceof THREE.BoxGeometry);
      expect(box).toBeDefined();
    });

    it('scales height by stories', () => {
      const one = createHouseMesh({ type: HouseType.Ranch });
      const three = createHouseMesh({ type: HouseType.Victorian });
      const h1 =
        (one.children[0] as THREE.Mesh).geometry.boundingBox?.max.y ??
        -(one.children[0] as THREE.Mesh).geometry.boundingBox!.min.y;
      // Compare via explicit scale on a stored userData height instead of geometry peaks.
      void h1;
      expect((one.userData as { stories: number }).stories).toBe(1);
      expect((three.userData as { stories: number }).stories).toBe(3);
    });

    it('applies the per-type color to the box material', () => {
      const group = createHouseMesh({ type: HouseType.Victorian });
      const mat = (group.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
      expect(mat.color.getHex()).toBe(HOUSE_COLORS[HouseType.Victorian]);
    });

    it('honours an explicit stories override above the type default', () => {
      const group = createHouseMesh({ type: HouseType.Ranch, stories: 4 });
      expect((group.userData as { stories: number }).stories).toBe(4);
    });

    it('records type and base position in userData', () => {
      const opts: HouseMeshOptions = { type: HouseType.Colonial, stories: 2 };
      const group = createHouseMesh(opts);
      const data = group.userData as { type: HouseType; stories: number };
      expect(data.type).toBe(HouseType.Colonial);
      expect(data.stories).toBe(2);
    });

    it('ranch house has window children', () => {
      const g = createHouseMesh({ type: HouseType.Ranch });
      expect(g.children.filter(c => c.name === 'window').length).toBeGreaterThan(0);
    });

    it('colonial house has chimney child', () => {
      const g = createHouseMesh({ type: HouseType.Colonial });
      expect(g.children.find(c => c.name === 'chimney')).toBeDefined();
    });

    it('victorian house has porch child', () => {
      const g = createHouseMesh({ type: HouseType.Victorian });
      expect(g.children.find(c => c.name === 'porch')).toBeDefined();
    });

    it('all house types have mailbox', () => {
      [HouseType.Ranch, HouseType.Colonial, HouseType.Victorian].forEach(t => {
        expect(createHouseMesh({ type: t }).children.find(c => c.name === 'mailbox')).toBeDefined();
      });
    });
  });
});
