import { beforeEach, describe, expect, it } from "vitest";
import { DayManager, DayOfWeek, MapName } from "./DayManager";

describe("DayManager", () => {
  let dayManager: DayManager;

  beforeEach(() => {
    dayManager = new DayManager();
  });

  describe("getDayOfWeek()", () => {
    it("day 1 = Monday", () => {
      expect(dayManager.getDayOfWeek(1)).toBe(DayOfWeek.Monday);
    });

    it("day 2 = Tuesday", () => {
      expect(dayManager.getDayOfWeek(2)).toBe(DayOfWeek.Tuesday);
    });

    it("day 7 = Sunday", () => {
      expect(dayManager.getDayOfWeek(7)).toBe(DayOfWeek.Sunday);
    });
  });

  describe("getMapForDay()", () => {
    it("days 1-2 use Maple Grove (suburban)", () => {
      expect(dayManager.getMapForDay(1)).toBe(MapName.MapleGrove);
      expect(dayManager.getMapForDay(2)).toBe(MapName.MapleGrove);
    });

    it("days 3-5 use Downtown Deadwood (urban)", () => {
      expect(dayManager.getMapForDay(3)).toBe(MapName.DowntownDeadwood);
      expect(dayManager.getMapForDay(4)).toBe(MapName.DowntownDeadwood);
      expect(dayManager.getMapForDay(5)).toBe(MapName.DowntownDeadwood);
    });

    it("days 6-7 use Rust Creek (industrial)", () => {
      expect(dayManager.getMapForDay(6)).toBe(MapName.RustCreek);
      expect(dayManager.getMapForDay(7)).toBe(MapName.RustCreek);
    });
  });

  describe("isSunday()", () => {
    it("returns true for day 7", () => {
      expect(dayManager.isSunday(7)).toBe(true);
    });

    it("returns false for days 1-6", () => {
      for (let d = 1; d <= 6; d++) {
        expect(dayManager.isSunday(d)).toBe(false);
      }
    });
  });

  describe("getSundayThrowSpeedMultiplier()", () => {
    it("returns < 1 on Sunday (heavier papers)", () => {
      expect(dayManager.getThrowSpeedMultiplier(7)).toBeLessThan(1);
    });

    it("returns 1.0 on non-Sunday days", () => {
      for (let d = 1; d <= 6; d++) {
        expect(dayManager.getThrowSpeedMultiplier(d)).toBe(1.0);
      }
    });
  });

  describe("getZombieDensityScale()", () => {
    it("increases with later days", () => {
      const day1 = dayManager.getZombieDensityScale(1);
      const day4 = dayManager.getZombieDensityScale(4);
      const day7 = dayManager.getZombieDensityScale(7);
      expect(day1).toBeLessThan(day4);
      expect(day4).toBeLessThan(day7);
    });

    it("day 1 density is positive (zombies exist from the start)", () => {
      expect(dayManager.getZombieDensityScale(1)).toBeGreaterThan(0);
    });
  });

  describe("map progression follows difficulty curve", () => {
    it("maps unlock in order: suburban → urban → industrial", () => {
      const mapOrder = [1, 2, 3, 4, 5, 6, 7].map((d) =>
        dayManager.getMapForDay(d),
      );
      const firstUrbanIdx = mapOrder.indexOf(MapName.DowntownDeadwood);
      const firstIndustrialIdx = mapOrder.indexOf(MapName.RustCreek);
      expect(firstUrbanIdx).toBeGreaterThan(0);
      expect(firstIndustrialIdx).toBeGreaterThan(firstUrbanIdx);
    });

    it("every day from 1-7 maps to a valid day of the week", () => {
      const allDays = Object.values(DayOfWeek);
      for (let d = 1; d <= 7; d++) {
        expect(allDays).toContain(dayManager.getDayOfWeek(d));
      }
    });

    it("Sunday throw penalty makes day 7 the hardest delivery day", () => {
      const multipliers = [1, 2, 3, 4, 5, 6, 7].map((d) =>
        dayManager.getThrowSpeedMultiplier(d),
      );
      const minMultiplier = Math.min(...multipliers);
      expect(dayManager.getThrowSpeedMultiplier(7)).toBe(minMultiplier);
    });
  });
});
