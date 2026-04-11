import { describe, expect, it } from "vitest";

import { Difficulty } from "../config/difficulty";
import { createRanchHouse, createVictorianHouse } from "../entities/House";
import { VehicleType } from "../config/vehicles";
import {
  classifyDelivery,
  getDeliveryThresholds,
  getHouseTextureKey,
  getRouteScrollSpeed,
  getVehicleControlProfile,
  getZombieWaveSettings,
} from "./arcade-rules";

describe("arcade-rules", () => {
  describe("house texture keys", () => {
    it("maps subscriber and non-subscriber houses to the right texture key", () => {
      expect(getHouseTextureKey(createRanchHouse(true))).toBe("ranch-sub");
      expect(getHouseTextureKey(createVictorianHouse(false))).toBe(
        "victorian-nonsub",
      );
    });
  });

  describe("delivery thresholds", () => {
    it("tightens the delivery zone for harder houses", () => {
      const easy = getDeliveryThresholds(createRanchHouse(true));
      const hard = getDeliveryThresholds(createVictorianHouse(true));

      expect(easy.porch).toBeGreaterThan(hard.porch);
      expect(easy.mailbox).toBeGreaterThanOrEqual(hard.mailbox);
    });

    it("classifies mailbox, porch, and miss bands", () => {
      const house = createRanchHouse(true);
      expect(classifyDelivery(house, 8, 20)).toBe("mailbox");
      expect(classifyDelivery(house, 24, 20)).toBe("porch");
      expect(classifyDelivery(house, 80, 20)).toBe("miss");
    });
  });

  describe("route scroll speed", () => {
    it("ramps as the week and delivery count progress", () => {
      const early = getRouteScrollSpeed(1, 0, Difficulty.EasyStreet);
      const late = getRouteScrollSpeed(7, 8, Difficulty.HardWay);

      expect(late).toBeGreaterThan(early);
    });
  });

  describe("vehicle control profile", () => {
    it("uses handling and stability to shape responsiveness", () => {
      const bicycle = getVehicleControlProfile(VehicleType.Bicycle);
      const skateboard = getVehicleControlProfile(VehicleType.Skateboard);

      expect(skateboard.inputResponsiveness).toBeGreaterThan(
        bicycle.inputResponsiveness,
      );
      expect(bicycle.coastResponsiveness).toBeGreaterThan(
        skateboard.coastResponsiveness,
      );
      expect(bicycle.maxSpeed).toBeGreaterThan(0);
    });
  });

  describe("zombie wave settings", () => {
    it("increases pressure later in the week", () => {
      const early = getZombieWaveSettings(1, Difficulty.EasyStreet);
      const late = getZombieWaveSettings(7, Difficulty.HardWay, 8, 18);

      expect(late.count).toBeGreaterThan(early.count);
      expect(late.interval).toBeLessThan(early.interval);
      expect(late.eliteChance).toBeGreaterThan(early.eliteChance);
      expect(late.pickupDropChance).toBeGreaterThan(early.pickupDropChance);
      expect(late.surgeThreshold).toBeLessThanOrEqual(early.surgeThreshold);
    });
  });
});
