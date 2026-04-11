import { beforeEach, describe, expect, it } from "vitest";
import { Difficulty } from "../config/difficulty";
import { VehicleType } from "../config/vehicles";
import { GameState, getOrCreateGameState } from "./GameState";

describe("GameState", () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
  });

  describe("initialization", () => {
    it("starts on day 1", () => {
      expect(state.day).toBe(1);
    });

    it("starts with 3 lives", () => {
      expect(state.lives).toBe(3);
    });

    it("starts with score 0", () => {
      expect(state.score).toBe(0);
    });

    it("starts with 10 subscribers", () => {
      expect(state.subscribers).toBe(10);
    });

    it("defaults to Easy Street difficulty", () => {
      expect(state.difficulty).toBe(Difficulty.EasyStreet);
    });

    it("defaults to Bicycle vehicle", () => {
      expect(state.vehicle).toBe(VehicleType.Bicycle);
    });
  });

  describe("configure()", () => {
    it("sets difficulty", () => {
      state.configure(Difficulty.HardWay, VehicleType.Skateboard);
      expect(state.difficulty).toBe(Difficulty.HardWay);
    });

    it("sets vehicle", () => {
      state.configure(Difficulty.MiddleRoad, VehicleType.RollerBlades);
      expect(state.vehicle).toBe(VehicleType.RollerBlades);
    });
  });

  describe("addScore()", () => {
    it("adds points with Easy Street 1x multiplier", () => {
      state.configure(Difficulty.EasyStreet, VehicleType.Bicycle);
      state.addScore(100);
      expect(state.score).toBe(100);
    });

    it("adds points with Middle Road 2x multiplier", () => {
      state.configure(Difficulty.MiddleRoad, VehicleType.Bicycle);
      state.addScore(100);
      expect(state.score).toBe(200);
    });

    it("adds points with Hard Way 3x multiplier", () => {
      state.configure(Difficulty.HardWay, VehicleType.Bicycle);
      state.addScore(100);
      expect(state.score).toBe(300);
    });

    it("accumulates score across multiple calls", () => {
      state.addScore(50);
      state.addScore(30);
      expect(state.score).toBe(80);
    });
  });

  describe("addRawScore()", () => {
    it("adds unmodified points (no multiplier)", () => {
      state.configure(Difficulty.HardWay, VehicleType.Bicycle);
      state.addRawScore(100);
      expect(state.score).toBe(100);
    });
  });

  describe("loseLife()", () => {
    it("decrements lives by 1", () => {
      state.loseLife();
      expect(state.lives).toBe(2);
    });

    it("does not go below 0", () => {
      state.loseLife();
      state.loseLife();
      state.loseLife();
      state.loseLife();
      expect(state.lives).toBe(0);
    });
  });

  describe("gainLife()", () => {
    it("restores a lost life", () => {
      state.loseLife();
      state.gainLife();
      expect(state.lives).toBe(3);
    });

    it("does not exceed the starting life cap", () => {
      state.gainLife();
      expect(state.lives).toBe(3);
    });
  });

  describe("subscribers", () => {
    it("cancelSubscription() decrements subscribers", () => {
      state.cancelSubscription();
      expect(state.subscribers).toBe(9);
    });

    it("cancelSubscription() does not go below 0", () => {
      for (let i = 0; i < 15; i++) state.cancelSubscription();
      expect(state.subscribers).toBe(0);
    });

    it("gainSubscriber() increments subscribers", () => {
      state.cancelSubscription();
      state.gainSubscriber();
      expect(state.subscribers).toBe(10);
    });

    it("gainSubscriber() does not exceed max (10)", () => {
      state.gainSubscriber();
      expect(state.subscribers).toBe(10);
    });
  });

  describe("advanceDay()", () => {
    it("increments day", () => {
      state.advanceDay();
      expect(state.day).toBe(2);
    });

    it("can advance to day 7", () => {
      for (let i = 0; i < 6; i++) state.advanceDay();
      expect(state.day).toBe(7);
    });
  });

  describe("isGameOver()", () => {
    it("returns false when lives > 0 and subscribers > 0 and day <= 7", () => {
      expect(state.isGameOver()).toBe(false);
    });

    it("returns true when lives = 0", () => {
      state.loseLife();
      state.loseLife();
      state.loseLife();
      expect(state.isGameOver()).toBe(true);
    });

    it("returns true when subscribers = 0", () => {
      for (let i = 0; i < 10; i++) state.cancelSubscription();
      expect(state.isGameOver()).toBe(true);
    });

    it("returns true when all days completed (day > 7)", () => {
      for (let i = 0; i < 7; i++) state.advanceDay();
      expect(state.isGameOver()).toBe(true);
    });
  });

  describe("getGameOverReason()", () => {
    it("returns null when game is not over", () => {
      expect(state.getGameOverReason()).toBeNull();
    });

    it('returns "lives" when lives = 0', () => {
      for (let i = 0; i < 3; i++) state.loseLife();
      expect(state.getGameOverReason()).toBe("lives");
    });

    it('returns "subscriptions" when subscribers = 0', () => {
      for (let i = 0; i < 10; i++) state.cancelSubscription();
      expect(state.getGameOverReason()).toBe("subscriptions");
    });

    it('returns "completed" when day > 7', () => {
      for (let i = 0; i < 7; i++) state.advanceDay();
      expect(state.getGameOverReason()).toBe("completed");
    });

    it("lives takes priority over subscriptions when both are 0", () => {
      for (let i = 0; i < 3; i++) state.loseLife();
      for (let i = 0; i < 10; i++) state.cancelSubscription();
      expect(state.getGameOverReason()).toBe("lives");
    });
  });

  describe("realistic gameplay scenario", () => {
    it("simulates a full easy day with deliveries and zombie kills", () => {
      state.configure(Difficulty.EasyStreet, VehicleType.Bicycle);
      // Deliver a few papers (250 pts each with 1x multiplier)
      state.addScore(250);
      state.addScore(250);
      state.addScore(500); // mailbox delivery
      // Kill some zombies
      state.addScore(10); // shambler
      state.addScore(25); // runner
      expect(state.score).toBe(1035);
      expect(state.isGameOver()).toBe(false);
    });

    it("simulates losing all lives across multiple days", () => {
      state.configure(Difficulty.HardWay, VehicleType.Skateboard);
      state.advanceDay(); // day 2
      state.loseLife(); // hit by zombie
      state.advanceDay(); // day 3
      state.loseLife(); // hit by hazard
      expect(state.lives).toBe(1);
      expect(state.isGameOver()).toBe(false);
      state.loseLife(); // final hit
      expect(state.isGameOver()).toBe(true);
      expect(state.getGameOverReason()).toBe("lives");
    });

    it("subscriber loss from missed deliveries ends the game", () => {
      // Simulate missing deliveries every day causing cancellations
      for (let day = 0; day < 5; day++) {
        state.cancelSubscription();
        state.cancelSubscription();
      }
      expect(state.subscribers).toBe(0);
      expect(state.isGameOver()).toBe(true);
      expect(state.getGameOverReason()).toBe("subscriptions");
    });
  });

  describe("reset()", () => {
    it("resets all state to initial values", () => {
      state.configure(Difficulty.HardWay, VehicleType.Skateboard);
      state.addScore(500);
      state.loseLife();
      state.advanceDay();
      state.cancelSubscription();

      state.reset();

      expect(state.day).toBe(1);
      expect(state.lives).toBe(3);
      expect(state.score).toBe(0);
      expect(state.subscribers).toBe(10);
      expect(state.difficulty).toBe(Difficulty.EasyStreet);
      expect(state.vehicle).toBe(VehicleType.Bicycle);
    });
  });

  describe("getOrCreateGameState()", () => {
    it("returns existing GameState from registry", () => {
      const existing = new GameState();
      existing.addRawScore(999);
      const registry = {
        get: (_key: string) => existing,
        set: (_key: string, _value: unknown) => {},
      };
      const result = getOrCreateGameState(registry);
      expect(result).toBe(existing);
      expect(result.score).toBe(999);
    });

    it("creates and registers a fresh GameState when registry has none", () => {
      let stored: unknown = undefined;
      const registry = {
        get: (_key: string) => stored,
        set: (_key: string, value: unknown) => {
          stored = value;
        },
      };
      const result = getOrCreateGameState(registry);
      expect(result).toBeInstanceOf(GameState);
      expect(result.day).toBe(1);
      expect(stored).toBe(result);
    });

    it("creates fresh GameState when registry returns wrong type", () => {
      let stored: unknown = "not-a-gamestate";
      const registry = {
        get: (_key: string) => stored,
        set: (_key: string, value: unknown) => {
          stored = value;
        },
      };
      const result = getOrCreateGameState(registry);
      expect(result).toBeInstanceOf(GameState);
      expect(stored).toBe(result);
    });
  });
});
