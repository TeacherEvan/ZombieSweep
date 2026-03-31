import { describe, expect, it } from "vitest";
import { NpcFaction, NpcRole, NpcState, NpcTimeSlice } from "../entities/Npc";
import { resolveNpcState } from "./NpcRules";
import { createTownReputation } from "./TownReputation";

function makeBehavior(
  defaultState: NpcState,
  fallbackState: NpcState,
  preferredStates: NpcState[],
) {
  return {
    defaultState,
    fallbackState,
    preferredStates,
    caution: 0.5,
    aggression: 0.5,
    support: 0.5,
  };
}

describe("NpcRules", () => {
  it("falls back to Idle or Flee when behavior data is missing", () => {
    const calmContext = {
      faction: NpcFaction.Survivor,
      role: NpcRole.Civilian,
      reputation: createTownReputation({ trust: 70, alertness: 5 }),
      dangerLevel: 0,
      day: 1,
      timeSlice: NpcTimeSlice.Daytime,
      nearbyZombies: 0,
      playerProximity: 80,
      isSafeZone: true,
      scriptedEvent: "none" as const,
    };

    const dangerContext = {
      ...calmContext,
      dangerLevel: 90,
      reputation: createTownReputation({ trust: 15, alertness: 90 }),
    };

    expect(resolveNpcState(undefined, calmContext)).toBe(NpcState.Idle);
    expect(resolveNpcState(undefined, dangerContext)).toBe(NpcState.Flee);
  });

  it("makes civilians flee under heavy pressure", () => {
    const state = resolveNpcState(
      makeBehavior(NpcState.Idle, NpcState.Flee, [
        NpcState.Idle,
        NpcState.Travel,
        NpcState.Interact,
      ]),
      {
        faction: NpcFaction.Survivor,
        role: NpcRole.Civilian,
        reputation: createTownReputation({ trust: 18, alertness: 72 }),
        dangerLevel: 92,
        day: 4,
        timeSlice: NpcTimeSlice.Evening,
        nearbyZombies: 4,
        playerProximity: 18,
        isSafeZone: false,
        scriptedEvent: "none" as const,
      },
    );

    expect(state).toBe(NpcState.Flee);
  });

  it("makes traders trade in safe pockets", () => {
    const state = resolveNpcState(
      makeBehavior(NpcState.Trade, NpcState.Flee, [
        NpcState.Trade,
        NpcState.Interact,
        NpcState.Travel,
      ]),
      {
        faction: NpcFaction.Trader,
        role: NpcRole.Merchant,
        reputation: createTownReputation({ trust: 70, alertness: 5 }),
        dangerLevel: 10,
        day: 2,
        timeSlice: NpcTimeSlice.Daytime,
        nearbyZombies: 0,
        playerProximity: 12,
        isSafeZone: true,
        scriptedEvent: "market" as const,
      },
    );

    expect(state).toBe(NpcState.Trade);
  });

  it("makes responders investigate route pressure", () => {
    const state = resolveNpcState(
      makeBehavior(NpcState.Travel, NpcState.Flee, [
        NpcState.Travel,
        NpcState.Investigate,
        NpcState.Defend,
      ]),
      {
        faction: NpcFaction.Responder,
        role: NpcRole.Scavenger,
        reputation: createTownReputation({ trust: 62, alertness: 20 }),
        dangerLevel: 40,
        day: 5,
        timeSlice: NpcTimeSlice.Daytime,
        nearbyZombies: 1,
        playerProximity: 42,
        isSafeZone: false,
        scriptedEvent: "rescue" as const,
      },
    );

    expect(state).toBe(NpcState.Investigate);
  });

  it("makes hostile humans defend blockades", () => {
    const state = resolveNpcState(
      makeBehavior(NpcState.Investigate, NpcState.Flee, [
        NpcState.Investigate,
        NpcState.Defend,
        NpcState.Travel,
      ]),
      {
        faction: NpcFaction.HostileHuman,
        role: NpcRole.Raider,
        reputation: createTownReputation({ trust: 22, alertness: 65 }),
        dangerLevel: 58,
        day: 6,
        timeSlice: NpcTimeSlice.Night,
        nearbyZombies: 2,
        playerProximity: 10,
        isSafeZone: false,
        scriptedEvent: "blockade" as const,
      },
    );

    expect(state).toBe(NpcState.Defend);
  });

  it("keeps infected in the infected state", () => {
    const state = resolveNpcState(
      makeBehavior(NpcState.Infected, NpcState.Infected, [
        NpcState.Infected,
        NpcState.Travel,
        NpcState.Investigate,
      ]),
      {
        faction: NpcFaction.Infected,
        role: NpcRole.Shambler,
        reputation: createTownReputation({ trust: 0, alertness: 100 }),
        dangerLevel: 100,
        day: 7,
        timeSlice: NpcTimeSlice.Night,
        nearbyZombies: 5,
        playerProximity: 5,
        isSafeZone: false,
        scriptedEvent: "alert" as const,
      },
    );

    expect(state).toBe(NpcState.Infected);
  });
});
