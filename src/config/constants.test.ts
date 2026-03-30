import { describe, expect, it } from "vitest";
import {
  CITIZEN_PENALTY,
  GAME,
  HAZARD,
  HOUSE_DAMAGE_POINTS,
  NEWSPAPER,
  POINTS,
  ZOMBIE_DAMAGE,
  ZOMBIE_HP,
  ZOMBIE_SPEED,
} from "./constants";

describe("game constants", () => {
  describe("POINTS", () => {
    it("porch delivery = 250", () => {
      expect(POINTS.PORCH_DELIVERY).toBe(250);
    });

    it("mailbox delivery = 500", () => {
      expect(POINTS.MAILBOX_DELIVERY).toBe(500);
    });

    it("mailbox is worth more than porch (rewards accuracy)", () => {
      expect(POINTS.MAILBOX_DELIVERY).toBeGreaterThan(POINTS.PORCH_DELIVERY);
    });

    it("shambler kill = 10", () => {
      expect(POINTS.SHAMBLER_KILL).toBe(10);
    });

    it("runner kill = 25", () => {
      expect(POINTS.RUNNER_KILL).toBe(25);
    });

    it("spitter kill = 40", () => {
      expect(POINTS.SPITTER_KILL).toBe(40);
    });

    it("harder zombies are worth more points", () => {
      expect(POINTS.SHAMBLER_KILL).toBeLessThan(POINTS.RUNNER_KILL);
      expect(POINTS.RUNNER_KILL).toBeLessThan(POINTS.SPITTER_KILL);
    });

    it("perfect day bonus = 1000", () => {
      expect(POINTS.PERFECT_DAY_BONUS).toBe(1000);
    });

    it("remaining life bonus = 5000", () => {
      expect(POINTS.REMAINING_LIFE_BONUS).toBe(5000);
    });

    it("training target = 50", () => {
      expect(POINTS.TRAINING_TARGET).toBe(50);
    });

    it("training ramp = 100", () => {
      expect(POINTS.TRAINING_RAMP).toBe(100);
    });

    it("non-subscriber window = 25", () => {
      expect(POINTS.NONSUB_WINDOW).toBe(25);
    });

    it("non-subscriber tombstone = 15", () => {
      expect(POINTS.NONSUB_TOMBSTONE).toBe(15);
    });
  });

  describe("GAME", () => {
    it("starts with 3 lives", () => {
      expect(GAME.STARTING_LIVES).toBe(3);
    });

    it("has 20 houses total", () => {
      expect(GAME.TOTAL_HOUSES).toBe(20);
    });

    it("starts with 10 subscribers", () => {
      expect(GAME.STARTING_SUBSCRIBERS).toBe(10);
    });

    it("max subscribers = 10", () => {
      expect(GAME.MAX_SUBSCRIBERS).toBe(10);
    });

    it("has 7 days", () => {
      expect(GAME.TOTAL_DAYS).toBe(7);
    });

    it("starts with 15 papers per route", () => {
      expect(GAME.STARTING_PAPERS).toBe(15);
    });

    it("starts with 10 ranged ammo", () => {
      expect(GAME.STARTING_AMMO).toBe(10);
    });

    it("starting papers exceed starting subscribers (player has extras)", () => {
      expect(GAME.STARTING_PAPERS).toBeGreaterThan(GAME.STARTING_SUBSCRIBERS);
    });
  });

  describe("NEWSPAPER", () => {
    it("has a base throw speed", () => {
      expect(NEWSPAPER.BASE_THROW_SPEED).toBeGreaterThan(0);
    });

    it("Sunday speed multiplier reduces speed", () => {
      expect(NEWSPAPER.SUNDAY_SPEED_MULTIPLIER).toBeLessThan(1);
    });

    it("Sunday paper speed = base × 0.6", () => {
      const sundaySpeed =
        NEWSPAPER.BASE_THROW_SPEED * NEWSPAPER.SUNDAY_SPEED_MULTIPLIER;
      expect(sundaySpeed).toBeCloseTo(4.8);
    });

    it("stun damage is low", () => {
      expect(NEWSPAPER.STUN_DAMAGE).toBe(1);
    });

    it("stun duration is 500ms", () => {
      expect(NEWSPAPER.STUN_DURATION).toBe(500);
    });
  });

  describe("ZOMBIE_HP", () => {
    it("shambler has lowest HP", () => {
      expect(ZOMBIE_HP.SHAMBLER).toBeLessThan(ZOMBIE_HP.RUNNER);
    });

    it("runner and spitter have same HP", () => {
      expect(ZOMBIE_HP.RUNNER).toBe(ZOMBIE_HP.SPITTER);
    });

    it("shambler can be killed by 2 newspaper stuns", () => {
      expect(ZOMBIE_HP.SHAMBLER).toBe(NEWSPAPER.STUN_DAMAGE * 2);
    });
  });

  describe("ZOMBIE_SPEED", () => {
    it("shambler is slower than runner", () => {
      expect(ZOMBIE_SPEED.SHAMBLER).toBeLessThan(ZOMBIE_SPEED.RUNNER);
    });

    it("spitter is slow (same as shambler)", () => {
      expect(ZOMBIE_SPEED.SPITTER).toBe(ZOMBIE_SPEED.SHAMBLER);
    });
  });

  describe("ZOMBIE_DAMAGE", () => {
    it("shambler deals less damage than runner", () => {
      expect(ZOMBIE_DAMAGE.SHAMBLER).toBeLessThan(ZOMBIE_DAMAGE.RUNNER);
    });

    it("spitter and runner deal the same contact damage", () => {
      expect(ZOMBIE_DAMAGE.SPITTER).toBe(ZOMBIE_DAMAGE.RUNNER);
    });
  });

  describe("HAZARD", () => {
    it("ice slide duration = 1.5 seconds", () => {
      expect(HAZARD.ICE_SLIDE_DURATION).toBe(1500);
    });

    it("log blocks ~60% of road width", () => {
      expect(HAZARD.LOG_WIDTH_PERCENT).toBe(0.6);
    });

    it("spitter puddle lasts 3 seconds", () => {
      expect(HAZARD.SPITTER_PUDDLE_DURATION).toBe(3000);
    });
  });

  describe("CITIZEN_PENALTY", () => {
    it("friendly neighbor penalty = -50", () => {
      expect(CITIZEN_PENALTY.FRIENDLY_NEIGHBOR).toBe(-50);
    });

    it("panicked runner penalty = -100 (highest penalty)", () => {
      expect(CITIZEN_PENALTY.PANICKED_RUNNER).toBe(-100);
    });

    it("armed survivalist penalty = -25 (lowest, because they fight back)", () => {
      expect(CITIZEN_PENALTY.ARMED_SURVIVALIST).toBe(-25);
    });

    it("all penalties are negative numbers", () => {
      expect(CITIZEN_PENALTY.FRIENDLY_NEIGHBOR).toBeLessThan(0);
      expect(CITIZEN_PENALTY.PANICKED_RUNNER).toBeLessThan(0);
      expect(CITIZEN_PENALTY.ARMED_SURVIVALIST).toBeLessThan(0);
    });

    it("panicked runner has the harshest penalty", () => {
      expect(CITIZEN_PENALTY.PANICKED_RUNNER).toBeLessThan(
        CITIZEN_PENALTY.FRIENDLY_NEIGHBOR,
      );
      expect(CITIZEN_PENALTY.PANICKED_RUNNER).toBeLessThan(
        CITIZEN_PENALTY.ARMED_SURVIVALIST,
      );
    });
  });

  describe("HOUSE_DAMAGE_POINTS", () => {
    it("Victorian stained glass is worth the most (5)", () => {
      expect(HOUSE_DAMAGE_POINTS.VICTORIAN_STAINED_GLASS).toBe(5);
    });

    it("Colonial upper window > lower window", () => {
      expect(HOUSE_DAMAGE_POINTS.COLONIAL_UPPER_WINDOW).toBeGreaterThan(
        HOUSE_DAMAGE_POINTS.COLONIAL_LOWER_WINDOW,
      );
    });

    it("all damage point values are positive", () => {
      for (const value of Object.values(HOUSE_DAMAGE_POINTS)) {
        expect(value).toBeGreaterThan(0);
      }
    });
  });
});
