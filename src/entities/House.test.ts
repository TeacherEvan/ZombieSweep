import { describe, expect, it } from "vitest";
import {
  createColonialHouse,
  createRanchHouse,
  createVictorianHouse,
  DeliveryDifficulty,
  HouseType,
} from "./House";

describe("House entities", () => {
  describe("RanchHouse", () => {
    it("has correct type", () => {
      const h = createRanchHouse(true);
      expect(h.type).toBe(HouseType.Ranch);
    });

    it("porch delivery difficulty is easy", () => {
      const h = createRanchHouse(true);
      expect(h.porchDifficulty).toBe(DeliveryDifficulty.Easy);
    });

    it("subscriber flag controls isSubscriber", () => {
      const sub = createRanchHouse(true);
      const nonSub = createRanchHouse(false);
      expect(sub.isSubscriber).toBe(true);
      expect(nonSub.isSubscriber).toBe(false);
    });

    it("has breakable items with point values", () => {
      const h = createRanchHouse(false);
      expect(h.breakables.length).toBeGreaterThan(0);
      expect(h.breakables.some((b) => b.name === "window")).toBe(true);
    });
  });

  describe("ColonialHouse", () => {
    it("has correct type", () => {
      const h = createColonialHouse(true);
      expect(h.type).toBe(HouseType.Colonial);
    });

    it("porch delivery difficulty is medium", () => {
      const h = createColonialHouse(true);
      expect(h.porchDifficulty).toBe(DeliveryDifficulty.Medium);
    });

    it("has upper and lower windows with different points", () => {
      const h = createColonialHouse(false);
      const upper = h.breakables.find((b) => b.name === "upper window");
      const lower = h.breakables.find((b) => b.name === "lower window");
      expect(upper).toBeDefined();
      expect(lower).toBeDefined();
      expect(upper!.points).toBeGreaterThan(lower!.points);
    });
  });

  describe("VictorianHouse", () => {
    it("has correct type", () => {
      const h = createVictorianHouse(true);
      expect(h.type).toBe(HouseType.Victorian);
    });

    it("porch delivery difficulty is hard", () => {
      const h = createVictorianHouse(true);
      expect(h.porchDifficulty).toBe(DeliveryDifficulty.Hard);
    });

    it("stained glass is worth the most points", () => {
      const h = createVictorianHouse(false);
      const stained = h.breakables.find((b) => b.name === "stained glass");
      expect(stained).toBeDefined();
      expect(stained!.points).toBe(5);
    });
  });

  describe("delivery tracking", () => {
    it("starts with delivered = false", () => {
      const h = createRanchHouse(true);
      expect(h.delivered).toBe(false);
    });

    it("markDelivered() sets delivered to true", () => {
      const h = createRanchHouse(true);
      h.markDelivered();
      expect(h.delivered).toBe(true);
    });

    it("damaged flag starts false", () => {
      const h = createRanchHouse(true);
      expect(h.damaged).toBe(false);
    });

    it("markDamaged() sets damaged to true", () => {
      const h = createRanchHouse(true);
      h.markDamaged();
      expect(h.damaged).toBe(true);
    });
  });

  describe("cross-house behavior", () => {
    it("delivery difficulty escalates: Ranch < Colonial < Victorian", () => {
      const difficulties = [
        DeliveryDifficulty.Easy,
        DeliveryDifficulty.Medium,
        DeliveryDifficulty.Hard,
      ];
      const ranch = difficulties.indexOf(
        createRanchHouse(true).porchDifficulty,
      );
      const colonial = difficulties.indexOf(
        createColonialHouse(true).porchDifficulty,
      );
      const victorian = difficulties.indexOf(
        createVictorianHouse(true).porchDifficulty,
      );
      expect(ranch).toBeLessThan(colonial);
      expect(colonial).toBeLessThan(victorian);
    });

    it("all house types have at least one breakable item", () => {
      expect(createRanchHouse(false).breakables.length).toBeGreaterThan(0);
      expect(createColonialHouse(false).breakables.length).toBeGreaterThan(0);
      expect(createVictorianHouse(false).breakables.length).toBeGreaterThan(0);
    });

    it("all breakable items have positive point values", () => {
      const allHouses = [
        createRanchHouse(false),
        createColonialHouse(false),
        createVictorianHouse(false),
      ];
      for (const house of allHouses) {
        for (const b of house.breakables) {
          expect(b.points).toBeGreaterThan(0);
        }
      }
    });

    it("a house can be both delivered and damaged", () => {
      const h = createRanchHouse(true);
      h.markDelivered();
      h.markDamaged();
      expect(h.delivered).toBe(true);
      expect(h.damaged).toBe(true);
    });
  });
});
