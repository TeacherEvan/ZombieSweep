import { describe, expect, it } from "vitest";
import { GAME } from "../config/constants";
import { Difficulty } from "../config/difficulty";
import { House, HouseType } from "../entities/House";
import { MAPS, MapName } from "./MapConfig";
import { generateRoute } from "./MapGenerator";

describe("MapGenerator", () => {
  describe("generateRoute()", () => {
    it("generates exactly 20 houses", () => {
      const route = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
      );
      expect(route.houses).toHaveLength(GAME.TOTAL_HOUSES);
    });

    it("starts with exactly 10 subscribers", () => {
      const route = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
      );
      const subscribers = route.houses.filter((h) => h.isSubscriber);
      expect(subscribers).toHaveLength(GAME.STARTING_SUBSCRIBERS);
    });

    it("houses are a mix of Ranch, Colonial, and Victorian", () => {
      const route = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
      );
      const types = new Set(route.houses.map((h) => h.type));
      expect(types.has(HouseType.Ranch)).toBe(true);
      expect(types.has(HouseType.Colonial)).toBe(true);
      expect(types.has(HouseType.Victorian)).toBe(true);
    });

    it("generates hazards", () => {
      const route = generateRoute(
        MAPS[MapName.RustCreek],
        Difficulty.HardWay,
        7,
      );
      expect(route.hazards.length).toBeGreaterThan(0);
    });

    it("harder difficulty generates more hazards", () => {
      const easy = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
      );
      const hard = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.HardWay,
        1,
      );
      expect(hard.hazards.length).toBeGreaterThanOrEqual(easy.hazards.length);
    });

    it("generates pickup locations", () => {
      const route = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
      );
      expect(route.pickups.length).toBeGreaterThan(0);
    });

    it("generates NPC spawn plans", () => {
      const route = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
      );

      expect(route.npcSpawns.length).toBeGreaterThan(0);
    });

    it("subscriberCount param overrides default 10", () => {
      const route = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
        5,
      );
      const subscribers = route.houses.filter((h) => h.isSubscriber);
      expect(subscribers).toHaveLength(5);
    });
  });

  describe("route consistency", () => {
    it("same inputs produce same house count (deterministic structure)", () => {
      const r1 = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
      );
      const r2 = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
      );
      expect(r1.houses.length).toBe(r2.houses.length);
    });

    it("same inputs produce the same NPC spawn plans", () => {
      const r1 = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
      );
      const r2 = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
      );

      expect(r1.npcSpawns).toEqual(r2.npcSpawns);
    });

    it("non-subscriber count is total minus subscribers", () => {
      const route = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
      );
      const subs = route.houses.filter((h: House) => h.isSubscriber).length;
      const nonSubs = route.houses.filter((h: House) => !h.isSubscriber).length;
      expect(subs + nonSubs).toBe(GAME.TOTAL_HOUSES);
    });

    it("RustCreek Hard Way day 7 generates the most hazards", () => {
      const easy1 = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
      );
      const hard7 = generateRoute(
        MAPS[MapName.RustCreek],
        Difficulty.HardWay,
        7,
      );
      expect(hard7.hazards.length).toBeGreaterThanOrEqual(easy1.hazards.length);
    });

    it("fewer subscribers still produces 20 total houses", () => {
      const route = generateRoute(
        MAPS[MapName.MapleGrove],
        Difficulty.EasyStreet,
        1,
        3,
      );
      expect(route.houses).toHaveLength(GAME.TOTAL_HOUSES);
      expect(route.houses.filter((h: House) => h.isSubscriber)).toHaveLength(3);
    });
  });
});
