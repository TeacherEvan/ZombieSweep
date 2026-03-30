import { describe, expect, it } from "vitest";
import { NEWSPAPER } from "../config/constants";
import { createNewspaper, NewspaperState } from "./Newspaper";

describe("Newspaper entity", () => {
  describe("creation", () => {
    it("has base throw speed from constants", () => {
      const np = createNewspaper(0, 0, "left", false);
      expect(np.speed).toBe(NEWSPAPER.BASE_THROW_SPEED);
    });

    it("Sunday paper has reduced speed", () => {
      const np = createNewspaper(0, 0, "left", true);
      expect(np.speed).toBe(
        NEWSPAPER.BASE_THROW_SPEED * NEWSPAPER.SUNDAY_SPEED_MULTIPLIER,
      );
    });

    it("starts in flying state", () => {
      const np = createNewspaper(0, 0, "right", false);
      expect(np.state).toBe(NewspaperState.Flying);
    });

    it("stores throw direction", () => {
      const left = createNewspaper(0, 0, "left", false);
      const right = createNewspaper(0, 0, "right", false);
      expect(left.direction).toBe("left");
      expect(right.direction).toBe("right");
    });
  });

  describe("stun damage", () => {
    it("deals stun damage from constants", () => {
      const np = createNewspaper(0, 0, "left", false);
      expect(np.stunDamage).toBe(NEWSPAPER.STUN_DAMAGE);
    });

    it("Sunday paper has same stun damage (heavier = more stun, but kept simple)", () => {
      const np = createNewspaper(0, 0, "left", true);
      expect(np.stunDamage).toBe(NEWSPAPER.STUN_DAMAGE);
    });
  });

  describe("gameplay scenarios", () => {
    it("Sunday paper is strictly slower than weekday paper", () => {
      const weekday = createNewspaper(0, 0, "left", false);
      const sunday = createNewspaper(0, 0, "left", true);
      expect(sunday.speed).toBeLessThan(weekday.speed);
    });

    it("left and right throws have the same speed", () => {
      const left = createNewspaper(0, 0, "left", false);
      const right = createNewspaper(0, 0, "right", false);
      expect(left.speed).toBe(right.speed);
    });

    it("newspaper retains spawn position", () => {
      const np = createNewspaper(100, 200, "left", false);
      expect(np.x).toBe(100);
      expect(np.y).toBe(200);
    });
  });
});
