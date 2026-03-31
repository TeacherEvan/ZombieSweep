import { describe, expect, it } from "vitest";
import { ZOMBIE_DAMAGE, ZOMBIE_HP, ZOMBIE_SPEED } from "../config/constants";
import { NpcFaction, NpcRole, NpcState } from "./Npc";
import {
  createRunner,
  createShambler,
  createSpitter,
  toNpcDefinition,
  ZombieType,
} from "./Zombie";

describe("Zombie entities", () => {
  describe("Shambler", () => {
    it("has correct type, hp, speed, and damage", () => {
      const z = createShambler(0, 0);
      expect(z.type).toBe(ZombieType.Shambler);
      expect(z.hp).toBe(ZOMBIE_HP.SHAMBLER);
      expect(z.speed).toBe(ZOMBIE_SPEED.SHAMBLER);
      expect(z.damage).toBe(ZOMBIE_DAMAGE.SHAMBLER);
    });

    it("takeDamage() reduces hp", () => {
      const z = createShambler(0, 0);
      z.takeDamage(1);
      expect(z.hp).toBe(ZOMBIE_HP.SHAMBLER - 1);
    });

    it("isDead() returns true when hp <= 0", () => {
      const z = createShambler(0, 0);
      z.takeDamage(ZOMBIE_HP.SHAMBLER);
      expect(z.isDead()).toBe(true);
    });

    it("has basePoints = 10", () => {
      const z = createShambler(0, 0);
      expect(z.basePoints).toBe(10);
    });
  });

  describe("Runner", () => {
    it("has correct type, hp, speed, and damage", () => {
      const z = createRunner(0, 0);
      expect(z.type).toBe(ZombieType.Runner);
      expect(z.hp).toBe(ZOMBIE_HP.RUNNER);
      expect(z.speed).toBe(ZOMBIE_SPEED.RUNNER);
      expect(z.damage).toBe(ZOMBIE_DAMAGE.RUNNER);
    });

    it("has basePoints = 25", () => {
      const z = createRunner(0, 0);
      expect(z.basePoints).toBe(25);
    });
  });

  describe("Spitter", () => {
    it("has correct type, hp, speed, and damage", () => {
      const z = createSpitter(0, 0);
      expect(z.type).toBe(ZombieType.Spitter);
      expect(z.hp).toBe(ZOMBIE_HP.SPITTER);
      expect(z.speed).toBe(ZOMBIE_SPEED.SPITTER);
      expect(z.damage).toBe(ZOMBIE_DAMAGE.SPITTER);
    });

    it("has basePoints = 40", () => {
      const z = createSpitter(0, 0);
      expect(z.basePoints).toBe(40);
    });

    it("isRanged flag is true", () => {
      const z = createSpitter(0, 0);
      expect(z.isRanged).toBe(true);
    });
  });

  describe("combat scenarios", () => {
    it("shambler survives one hit but dies to exact hp damage", () => {
      const z = createShambler(0, 0);
      z.takeDamage(ZOMBIE_HP.SHAMBLER - 1);
      expect(z.isDead()).toBe(false);
      z.takeDamage(1);
      expect(z.isDead()).toBe(true);
    });

    it("overkill damage does not go below 0 hp", () => {
      const z = createRunner(0, 0);
      z.takeDamage(999);
      expect(z.hp).toBe(0);
      expect(z.isDead()).toBe(true);
    });

    it("harder zombies are worth proportionally more points", () => {
      const shambler = createShambler(0, 0);
      const runner = createRunner(0, 0);
      const spitter = createSpitter(0, 0);
      expect(runner.basePoints).toBeGreaterThan(shambler.basePoints);
      expect(spitter.basePoints).toBeGreaterThan(runner.basePoints);
    });

    it("runners are faster than shamblers", () => {
      expect(createRunner(0, 0).speed).toBeGreaterThan(
        createShambler(0, 0).speed,
      );
    });

    it("only spitter is ranged — melee zombies must get close", () => {
      expect(createShambler(0, 0).isRanged).toBe(false);
      expect(createRunner(0, 0).isRanged).toBe(false);
      expect(createSpitter(0, 0).isRanged).toBe(true);
    });

    it("zombies retain spawn position", () => {
      const z = createShambler(150, 300);
      expect(z.x).toBe(150);
      expect(z.y).toBe(300);
    });
  });

  describe("NPC adapter", () => {
    it("maps a shambler to an infected shambler", () => {
      const npc = toNpcDefinition(createShambler(0, 0));

      expect(npc.faction).toBe(NpcFaction.Infected);
      expect(npc.role).toBe(NpcRole.Shambler);
      expect(npc.behavior.defaultState).toBe(NpcState.Infected);
      expect(npc.textureKey).toBe("zombie-shambler");
    });

    it("maps a runner to an infected runner", () => {
      const npc = toNpcDefinition(createRunner(0, 0));

      expect(npc.faction).toBe(NpcFaction.Infected);
      expect(npc.role).toBe(NpcRole.Runner);
      expect(npc.behavior.defaultState).toBe(NpcState.Infected);
      expect(npc.textureKey).toBe("zombie-runner");
    });

    it("maps a spitter to an infected spitter", () => {
      const npc = toNpcDefinition(createSpitter(0, 0));

      expect(npc.faction).toBe(NpcFaction.Infected);
      expect(npc.role).toBe(NpcRole.Spitter);
      expect(npc.behavior.defaultState).toBe(NpcState.Infected);
      expect(npc.textureKey).toBe("zombie-spitter");
    });
  });
});
