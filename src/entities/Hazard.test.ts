import { describe, expect, it } from "vitest";
import { HAZARD } from "../config/constants";
import { createHole, createIcePatch, createLog, HazardType } from "./Hazard";

describe("Hazard entities", () => {
  describe("Hole", () => {
    it("has correct type", () => {
      const h = createHole(0, 0);
      expect(h.type).toBe(HazardType.Hole);
    });

    it("is lethal on collision (costs a life)", () => {
      const h = createHole(0, 0);
      expect(h.isLethal).toBe(true);
    });

    it("canOllieOver is true (skateboard can dodge)", () => {
      const h = createHole(0, 0);
      expect(h.canOllieOver).toBe(true);
    });

    it("has 2x2 tile size", () => {
      const h = createHole(0, 0);
      expect(h.tileWidth).toBe(2);
      expect(h.tileHeight).toBe(2);
    });
  });

  describe("Log", () => {
    it("has correct type", () => {
      const l = createLog(0, 0);
      expect(l.type).toBe(HazardType.Log);
    });

    it("is lethal on collision", () => {
      const l = createLog(0, 0);
      expect(l.isLethal).toBe(true);
    });

    it("cannot be destroyed", () => {
      const l = createLog(0, 0);
      expect(l.destructible).toBe(false);
    });

    it("blocks ~60% of road width", () => {
      const l = createLog(0, 0);
      expect(l.widthPercent).toBe(HAZARD.LOG_WIDTH_PERCENT);
    });
  });

  describe("IcePatch", () => {
    it("has correct type", () => {
      const ice = createIcePatch(0, 0);
      expect(ice.type).toBe(HazardType.IcePatch);
    });

    it("is NOT directly lethal", () => {
      const ice = createIcePatch(0, 0);
      expect(ice.isLethal).toBe(false);
    });

    it("has correct slide duration", () => {
      const ice = createIcePatch(0, 0);
      expect(ice.slideDuration).toBe(HAZARD.ICE_SLIDE_DURATION);
    });

    it("has 3x3 tile size", () => {
      const ice = createIcePatch(0, 0);
      expect(ice.tileWidth).toBe(3);
      expect(ice.tileHeight).toBe(3);
    });
  });

  describe("hazard classification", () => {
    it("hole and log are lethal but ice patch is not", () => {
      expect(createHole(0, 0).isLethal).toBe(true);
      expect(createLog(0, 0).isLethal).toBe(true);
      expect(createIcePatch(0, 0).isLethal).toBe(false);
    });

    it("each hazard type is distinct via discriminated union", () => {
      const types = new Set([
        createHole(0, 0).type,
        createLog(0, 0).type,
        createIcePatch(0, 0).type,
      ]);
      expect(types.size).toBe(3);
    });

    it("hazards retain spawn position", () => {
      const h = createHole(100, 250);
      expect(h.x).toBe(100);
      expect(h.y).toBe(250);
    });

    it("only holes can be ollied over (skateboard advantage)", () => {
      expect(createHole(0, 0).canOllieOver).toBe(true);
      expect("canOllieOver" in createLog(0, 0)).toBeFalsy();
      expect("canOllieOver" in createIcePatch(0, 0)).toBeFalsy();
    });
  });
});
