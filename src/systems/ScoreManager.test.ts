import { beforeEach, describe, expect, it } from "vitest";
import { Difficulty } from "../config/difficulty";
import { VehicleType } from "../config/vehicles";
import { GameState } from "./GameState";
import { ScoreManager } from "./ScoreManager";

describe("ScoreManager", () => {
  let gameState: GameState;
  let scoreManager: ScoreManager;

  beforeEach(() => {
    gameState = new GameState();
    scoreManager = new ScoreManager(gameState);
  });

  describe("delivery scoring", () => {
    it("porchDelivery() awards 250 base points", () => {
      scoreManager.porchDelivery();
      expect(gameState.score).toBe(250);
    });

    it("mailboxDelivery() awards 500 base points", () => {
      scoreManager.mailboxDelivery();
      expect(gameState.score).toBe(500);
    });

    it("delivery points scale with difficulty multiplier", () => {
      gameState.configure(Difficulty.HardWay, VehicleType.Bicycle);
      scoreManager.porchDelivery();
      expect(gameState.score).toBe(750); // 250 * 3
    });
  });

  describe("zombie kill scoring", () => {
    it("shamblerKill() awards 10 base points", () => {
      scoreManager.shamblerKill();
      expect(gameState.score).toBe(10);
    });

    it("runnerKill() awards 25 base points", () => {
      scoreManager.runnerKill();
      expect(gameState.score).toBe(25);
    });

    it("spitterKill() awards 40 base points", () => {
      scoreManager.spitterKill();
      expect(gameState.score).toBe(40);
    });

    it("zombie kill points scale with difficulty", () => {
      gameState.configure(Difficulty.MiddleRoad, VehicleType.Bicycle);
      scoreManager.shamblerKill();
      expect(gameState.score).toBe(20); // 10 * 2
    });
  });

  describe("combo scoring", () => {
    it("comboBonus() adds raw score without difficulty scaling", () => {
      gameState.configure(Difficulty.HardWay, VehicleType.Bicycle);
      scoreManager.comboBonus(30);
      expect(gameState.score).toBe(30);
    });
  });

  describe("non-subscriber damage scoring", () => {
    it("windowBreak() awards 25 base points", () => {
      scoreManager.windowBreak();
      expect(gameState.score).toBe(25);
    });

    it("tombstoneKnock() awards 15 base points", () => {
      scoreManager.tombstoneKnock();
      expect(gameState.score).toBe(15);
    });
  });

  describe("training scoring", () => {
    it("trainingTarget() awards 50 base points", () => {
      scoreManager.trainingTarget();
      expect(gameState.score).toBe(50);
    });

    it("trainingRamp() awards 100 base points", () => {
      scoreManager.trainingRamp();
      expect(gameState.score).toBe(100);
    });
  });

  describe("bonus scoring", () => {
    it("perfectDayBonus() awards 1000 base points", () => {
      scoreManager.perfectDayBonus();
      expect(gameState.score).toBe(1000);
    });

    it("remainingLifeBonus() awards 5000 per life (raw, no multiplier)", () => {
      gameState.configure(Difficulty.HardWay, VehicleType.Bicycle);
      scoreManager.remainingLifeBonus(2);
      expect(gameState.score).toBe(10000); // 5000 * 2, no multiplier
    });
  });

  describe("citizen penalty", () => {
    it("hitFriendlyNeighbor() subtracts 50 points", () => {
      gameState.addRawScore(200);
      scoreManager.hitFriendlyNeighbor();
      expect(gameState.score).toBe(150);
    });

    it("hitPanickedRunner() subtracts 100 points", () => {
      gameState.addRawScore(200);
      scoreManager.hitPanickedRunner();
      expect(gameState.score).toBe(100);
    });

    it("hitArmedSurvivalist() subtracts 25 points", () => {
      gameState.addRawScore(200);
      scoreManager.hitArmedSurvivalist();
      expect(gameState.score).toBe(175);
    });

    it("score does not go below 0 from penalties", () => {
      scoreManager.hitPanickedRunner();
      expect(gameState.score).toBe(0);
    });

    it("multiple citizen hits in a row drain score to floor", () => {
      gameState.addRawScore(100);
      scoreManager.hitFriendlyNeighbor(); // -50 → 50
      scoreManager.hitArmedSurvivalist(); // -25 → 25
      scoreManager.hitPanickedRunner(); // -100 → clamped to 0
      expect(gameState.score).toBe(0);
    });
  });

  describe("full day scoring scenario", () => {
    it("simulates a Hard Way day with deliveries, kills, and penalties", () => {
      gameState.configure(Difficulty.HardWay, VehicleType.Skateboard);
      // 2 porch deliveries → 250 × 3 = 750 each
      scoreManager.porchDelivery();
      scoreManager.porchDelivery();
      // 1 mailbox delivery → 500 × 3 = 1500
      scoreManager.mailboxDelivery();
      // Kill a runner → 25 × 3 = 75
      scoreManager.runnerKill();
      // Accidentally hit a panicked runner → -100
      scoreManager.hitPanickedRunner();
      // Expected: 750 + 750 + 1500 + 75 - 100 = 2975
      expect(gameState.score).toBe(2975);
    });

    it("training scoring accumulates correctly", () => {
      scoreManager.trainingTarget(); // 50
      scoreManager.trainingTarget(); // 50
      scoreManager.trainingRamp(); // 100
      expect(gameState.score).toBe(200);
    });

    it("remaining life bonus at end game (3 lives, Hard Way)", () => {
      gameState.configure(Difficulty.HardWay, VehicleType.Bicycle);
      scoreManager.porchDelivery(); // 750
      scoreManager.remainingLifeBonus(3); // 15000 raw
      expect(gameState.score).toBe(15750);
    });
  });
});
