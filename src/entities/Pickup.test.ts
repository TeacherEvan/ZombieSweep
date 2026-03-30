import { describe, expect, it } from "vitest";
import { createPickup, PickupType } from "./Pickup";

describe("Pickup entity", () => {
  describe("newspaper bundle", () => {
    it("has correct type", () => {
      const p = createPickup(0, 0, PickupType.NewspaperBundle);
      expect(p.type).toBe(PickupType.NewspaperBundle);
    });

    it("has a quantity > 0", () => {
      const p = createPickup(0, 0, PickupType.NewspaperBundle);
      expect(p.quantity).toBeGreaterThan(0);
    });
  });

  describe("ammo pickup", () => {
    it("has correct type", () => {
      const p = createPickup(0, 0, PickupType.AmmoCrate);
      expect(p.type).toBe(PickupType.AmmoCrate);
    });

    it("has a quantity > 0", () => {
      const p = createPickup(0, 0, PickupType.AmmoCrate);
      expect(p.quantity).toBeGreaterThan(0);
    });
  });

  describe("health pickup", () => {
    it("has correct type", () => {
      const p = createPickup(0, 0, PickupType.HealthKit);
      expect(p.type).toBe(PickupType.HealthKit);
    });
  });

  describe("collected state", () => {
    it("starts uncollected", () => {
      const p = createPickup(0, 0, PickupType.NewspaperBundle);
      expect(p.collected).toBe(false);
    });

    it("collect() marks as collected", () => {
      const p = createPickup(0, 0, PickupType.NewspaperBundle);
      p.collect();
      expect(p.collected).toBe(true);
    });

    it("double-collecting stays collected (idempotent)", () => {
      const p = createPickup(0, 0, PickupType.AmmoCrate);
      p.collect();
      p.collect();
      expect(p.collected).toBe(true);
    });
  });

  describe("pickup type coverage", () => {
    it("all pickup types are creatable", () => {
      const types = [
        PickupType.NewspaperBundle,
        PickupType.AmmoCrate,
        PickupType.HealthKit,
      ];
      for (const t of types) {
        const p = createPickup(0, 0, t);
        expect(p.type).toBe(t);
      }
    });

    it("pickups retain spawn position", () => {
      const p = createPickup(50, 75, PickupType.NewspaperBundle);
      expect(p.x).toBe(50);
      expect(p.y).toBe(75);
    });
  });
});
