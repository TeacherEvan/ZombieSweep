import { describe, expect, it } from "vitest";
import { CITIZEN_PENALTY } from "../config/constants";
import {
  CitizenType,
  createArmedSurvivalist,
  createFriendlyNeighbor,
  createPanickedRunner,
} from "./Citizen";

describe("Citizen entities", () => {
  describe("FriendlyNeighbor", () => {
    it("has correct type and penalty", () => {
      const c = createFriendlyNeighbor(0, 0);
      expect(c.type).toBe(CitizenType.FriendlyNeighbor);
      expect(c.hitPenalty).toBe(CITIZEN_PENALTY.FRIENDLY_NEIGHBOR);
    });

    it("dropsPickup is true", () => {
      const c = createFriendlyNeighbor(0, 0);
      expect(c.dropsPickup).toBe(true);
    });

    it("isStationary is true", () => {
      const c = createFriendlyNeighbor(0, 0);
      expect(c.isStationary).toBe(true);
    });
  });

  describe("PanickedRunner", () => {
    it("has correct type and penalty", () => {
      const c = createPanickedRunner(0, 0);
      expect(c.type).toBe(CitizenType.PanickedRunner);
      expect(c.hitPenalty).toBe(CITIZEN_PENALTY.PANICKED_RUNNER);
    });

    it("isStationary is false (runs around)", () => {
      const c = createPanickedRunner(0, 0);
      expect(c.isStationary).toBe(false);
    });
  });

  describe("ArmedSurvivalist", () => {
    it("has correct type and penalty", () => {
      const c = createArmedSurvivalist(0, 0);
      expect(c.type).toBe(CitizenType.ArmedSurvivalist);
      expect(c.hitPenalty).toBe(CITIZEN_PENALTY.ARMED_SURVIVALIST);
    });

    it("retaliates when hit", () => {
      const c = createArmedSurvivalist(0, 0);
      expect(c.retaliates).toBe(true);
    });
  });

  describe("cross-citizen behavior rules", () => {
    it("only survivalist retaliates — other citizens are passive", () => {
      expect(createFriendlyNeighbor(0, 0).retaliates).toBe(false);
      expect(createPanickedRunner(0, 0).retaliates).toBe(false);
      expect(createArmedSurvivalist(0, 0).retaliates).toBe(true);
    });

    it("panicked runner has the harshest score penalty", () => {
      const penalties = [
        createFriendlyNeighbor(0, 0).hitPenalty,
        createPanickedRunner(0, 0).hitPenalty,
        createArmedSurvivalist(0, 0).hitPenalty,
      ];
      const harshest = Math.min(...penalties); // most negative
      expect(createPanickedRunner(0, 0).hitPenalty).toBe(harshest);
    });

    it("only friendly neighbor drops a pickup (reward for not hurting them)", () => {
      expect(createFriendlyNeighbor(0, 0).dropsPickup).toBe(true);
      expect(createPanickedRunner(0, 0).dropsPickup).toBe(false);
      expect(createArmedSurvivalist(0, 0).dropsPickup).toBe(false);
    });

    it("citizens retain spawn position", () => {
      const c = createFriendlyNeighbor(200, 400);
      expect(c.x).toBe(200);
      expect(c.y).toBe(400);
    });
  });
});
