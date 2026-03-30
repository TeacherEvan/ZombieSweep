import { describe, expect, it } from "vitest";
import { VEHICLE_STATS, VehicleType, WeaponSlot } from "./vehicles";

describe("vehicle config", () => {
  it("should define three vehicles", () => {
    expect(Object.keys(VEHICLE_STATS)).toHaveLength(3);
  });

  it("Bicycle has medium speed and high stability", () => {
    const bike = VEHICLE_STATS[VehicleType.Bicycle];
    expect(bike.speed).toBe(5);
    expect(bike.stability).toBe(3);
    expect(bike.handling).toBe(2);
  });

  it("RollerBlades has fast speed and low stability", () => {
    const blades = VEHICLE_STATS[VehicleType.RollerBlades];
    expect(blades.speed).toBe(7);
    expect(blades.stability).toBe(1);
    expect(blades.handling).toBe(1);
  });

  it("Skateboard has variable speed and medium stability", () => {
    const board = VEHICLE_STATS[VehicleType.Skateboard];
    expect(board.speed).toBe(4);
    expect(board.stability).toBe(2);
    expect(board.handling).toBe(3);
  });

  it("each vehicle has a melee and ranged weapon", () => {
    for (const type of Object.values(VehicleType)) {
      const stats = VEHICLE_STATS[type];
      expect(stats.weapons[WeaponSlot.Melee]).toBeDefined();
      expect(stats.weapons[WeaponSlot.Ranged]).toBeDefined();
    }
  });

  it("Bicycle has Baseball Bat and Slingshot", () => {
    const bike = VEHICLE_STATS[VehicleType.Bicycle];
    expect(bike.weapons[WeaponSlot.Melee].name).toBe("Baseball Bat");
    expect(bike.weapons[WeaponSlot.Ranged].name).toBe("Slingshot");
  });

  it("RollerBlades has Hockey Stick and Crossbow", () => {
    const blades = VEHICLE_STATS[VehicleType.RollerBlades];
    expect(blades.weapons[WeaponSlot.Melee].name).toBe("Hockey Stick");
    expect(blades.weapons[WeaponSlot.Ranged].name).toBe("Crossbow");
  });

  it("Skateboard has Machete and Shotgun", () => {
    const board = VEHICLE_STATS[VehicleType.Skateboard];
    expect(board.weapons[WeaponSlot.Melee].name).toBe("Machete");
    expect(board.weapons[WeaponSlot.Ranged].name).toBe("Shotgun");
  });

  it("only Skateboard can ollie over hazards", () => {
    expect(VEHICLE_STATS[VehicleType.Skateboard].canOllie).toBe(true);
    expect(VEHICLE_STATS[VehicleType.Bicycle].canOllie).toBe(false);
    expect(VEHICLE_STATS[VehicleType.RollerBlades].canOllie).toBe(false);
  });

  it("melee weapons have 0 ammoPerPickup (unlimited use)", () => {
    for (const type of Object.values(VehicleType)) {
      const melee = VEHICLE_STATS[type].weapons[WeaponSlot.Melee];
      expect(melee.ammoPerPickup).toBe(0);
    }
  });

  it("ranged weapons have positive ammo capacity", () => {
    for (const type of Object.values(VehicleType)) {
      const ranged = VEHICLE_STATS[type].weapons[WeaponSlot.Ranged];
      expect(ranged.ammoPerPickup).toBeGreaterThan(0);
    }
  });

  it("Crossbow is the only piercing weapon", () => {
    const crossbow =
      VEHICLE_STATS[VehicleType.RollerBlades].weapons[WeaponSlot.Ranged];
    const slingshot =
      VEHICLE_STATS[VehicleType.Bicycle].weapons[WeaponSlot.Ranged];
    const shotgun =
      VEHICLE_STATS[VehicleType.Skateboard].weapons[WeaponSlot.Ranged];
    expect(crossbow.piercing).toBe(true);
    expect(slingshot.piercing).toBe(false);
    expect(shotgun.piercing).toBe(false);
  });

  it("Shotgun is the only spread weapon", () => {
    const shotgun =
      VEHICLE_STATS[VehicleType.Skateboard].weapons[WeaponSlot.Ranged];
    const crossbow =
      VEHICLE_STATS[VehicleType.RollerBlades].weapons[WeaponSlot.Ranged];
    expect(shotgun.spread).toBe(true);
    expect(crossbow.spread).toBe(false);
  });

  it("Shotgun has highest damage but lowest ammo of ranged weapons", () => {
    const shotgun =
      VEHICLE_STATS[VehicleType.Skateboard].weapons[WeaponSlot.Ranged];
    const slingshot =
      VEHICLE_STATS[VehicleType.Bicycle].weapons[WeaponSlot.Ranged];
    const crossbow =
      VEHICLE_STATS[VehicleType.RollerBlades].weapons[WeaponSlot.Ranged];
    expect(shotgun.damage).toBeGreaterThan(crossbow.damage);
    expect(shotgun.damage).toBeGreaterThan(slingshot.damage);
    expect(shotgun.ammoPerPickup).toBeLessThan(slingshot.ammoPerPickup);
    expect(shotgun.ammoPerPickup).toBeLessThan(crossbow.ammoPerPickup);
  });
});
