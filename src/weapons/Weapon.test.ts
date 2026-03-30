import { describe, expect, it } from "vitest";
import { VEHICLE_STATS, VehicleType, WeaponSlot } from "../config/vehicles";
import { createMeleeWeapon, createRangedWeapon } from "./Weapon";

describe("Weapon system", () => {
  describe("createMeleeWeapon()", () => {
    it("creates a melee weapon from config", () => {
      const config =
        VEHICLE_STATS[VehicleType.Bicycle].weapons[WeaponSlot.Melee];
      const weapon = createMeleeWeapon(config);
      expect(weapon.name).toBe("Baseball Bat");
      expect(weapon.damage).toBe(3);
      expect(weapon.type).toBe("melee");
    });

    it("Machete has high damage and fast speed", () => {
      const config =
        VEHICLE_STATS[VehicleType.Skateboard].weapons[WeaponSlot.Melee];
      const weapon = createMeleeWeapon(config);
      expect(weapon.name).toBe("Machete");
      expect(weapon.damage).toBe(5);
      expect(weapon.speed).toBe(4);
    });
  });

  describe("createRangedWeapon()", () => {
    it("creates a ranged weapon from config with ammo", () => {
      const config =
        VEHICLE_STATS[VehicleType.Bicycle].weapons[WeaponSlot.Ranged];
      const weapon = createRangedWeapon(config);
      expect(weapon.name).toBe("Slingshot");
      expect(weapon.type).toBe("ranged");
      expect(weapon.ammo).toBe(config.ammoPerPickup);
    });

    it("Crossbow has piercing enabled", () => {
      const config =
        VEHICLE_STATS[VehicleType.RollerBlades].weapons[WeaponSlot.Ranged];
      const weapon = createRangedWeapon(config);
      expect(weapon.name).toBe("Crossbow");
      expect(weapon.piercing).toBe(true);
    });

    it("Shotgun has spread enabled", () => {
      const config =
        VEHICLE_STATS[VehicleType.Skateboard].weapons[WeaponSlot.Ranged];
      const weapon = createRangedWeapon(config);
      expect(weapon.name).toBe("Shotgun");
      expect(weapon.spread).toBe(true);
    });
  });

  describe("MeleeWeapon.attack()", () => {
    it("returns damage value on attack", () => {
      const config =
        VEHICLE_STATS[VehicleType.Bicycle].weapons[WeaponSlot.Melee];
      const weapon = createMeleeWeapon(config);
      expect(weapon.attack()).toBe(3);
    });
  });

  describe("RangedWeapon.fire()", () => {
    it("returns damage and decrements ammo", () => {
      const config =
        VEHICLE_STATS[VehicleType.Bicycle].weapons[WeaponSlot.Ranged];
      const weapon = createRangedWeapon(config);
      const startAmmo = weapon.ammo;
      const damage = weapon.fire();
      expect(damage).toBe(1);
      expect(weapon.ammo).toBe(startAmmo - 1);
    });

    it("returns 0 damage when out of ammo", () => {
      const config =
        VEHICLE_STATS[VehicleType.Skateboard].weapons[WeaponSlot.Ranged];
      const weapon = createRangedWeapon(config);
      // Drain all ammo
      for (let i = 0; i < config.ammoPerPickup; i++) weapon.fire();
      expect(weapon.fire()).toBe(0);
      expect(weapon.ammo).toBe(0);
    });

    it("addAmmo() replenishes ammo", () => {
      const config =
        VEHICLE_STATS[VehicleType.Bicycle].weapons[WeaponSlot.Ranged];
      const weapon = createRangedWeapon(config);
      weapon.fire();
      weapon.fire();
      weapon.addAmmo(5);
      expect(weapon.ammo).toBe(config.ammoPerPickup - 2 + 5);
    });

    it("addAmmo() recovers a drained weapon", () => {
      const config =
        VEHICLE_STATS[VehicleType.Bicycle].weapons[WeaponSlot.Ranged];
      const weapon = createRangedWeapon(config);
      // Drain all ammo
      for (let i = 0; i < config.ammoPerPickup; i++) weapon.fire();
      expect(weapon.ammo).toBe(0);
      weapon.addAmmo(3);
      expect(weapon.fire()).toBe(config.damage);
      expect(weapon.ammo).toBe(2);
    });
  });

  describe("combat scenario: melee vs ranged tradeoff", () => {
    it("melee never runs out but ranged eventually does", () => {
      const meleeConfig =
        VEHICLE_STATS[VehicleType.Bicycle].weapons[WeaponSlot.Melee];
      const rangedConfig =
        VEHICLE_STATS[VehicleType.Bicycle].weapons[WeaponSlot.Ranged];
      const melee = createMeleeWeapon(meleeConfig);
      const ranged = createRangedWeapon(rangedConfig);

      // Fire ranged until empty, melee always works
      for (let i = 0; i < rangedConfig.ammoPerPickup + 5; i++) {
        expect(melee.attack()).toBeGreaterThan(0);
      }
      // Ranged is now empty
      for (let i = 0; i < rangedConfig.ammoPerPickup; i++) ranged.fire();
      expect(ranged.fire()).toBe(0);
    });

    it("all three vehicle melee weapons deal positive damage", () => {
      for (const vehicleType of Object.values(VehicleType)) {
        const config = VEHICLE_STATS[vehicleType].weapons[WeaponSlot.Melee];
        const weapon = createMeleeWeapon(config);
        expect(weapon.attack()).toBeGreaterThan(0);
      }
    });
  });
});
