import { describe, expect, it } from "vitest";
import {
  NpcFaction,
  NpcRole,
  NpcState,
  getFallbackNpcDefinition,
  normalizeNpcDefinition,
} from "./Npc";
import { NPC_ARCHETYPES, NPC_FAMILIES } from "./NpcCatalog";

describe("Npc contract", () => {
  it("exposes the shared factions, roles, and states", () => {
    expect(NpcFaction.Survivor).toBe("Survivor");
    expect(NpcFaction.HostileHuman).toBe("HostileHuman");
    expect(NpcFaction.Responder).toBe("Responder");
    expect(NpcFaction.Trader).toBe("Trader");
    expect(NpcFaction.Infected).toBe("Infected");

    expect(NpcRole.Civilian).toBe("Civilian");
    expect(NpcRole.Guard).toBe("Guard");
    expect(NpcRole.Merchant).toBe("Merchant");
    expect(NpcRole.Scavenger).toBe("Scavenger");
    expect(NpcRole.Medic).toBe("Medic");
    expect(NpcRole.Raider).toBe("Raider");

    expect(NpcState.Idle).toBe("Idle");
    expect(NpcState.Travel).toBe("Travel");
    expect(NpcState.Interact).toBe("Interact");
    expect(NpcState.Flee).toBe("Flee");
    expect(NpcState.Defend).toBe("Defend");
    expect(NpcState.Trade).toBe("Trade");
    expect(NpcState.Investigate).toBe("Investigate");
    expect(NpcState.Infected).toBe("Infected");
  });

  it("returns a safe fallback definition", () => {
    const fallback = getFallbackNpcDefinition();

    expect(fallback.faction).toBe(NpcFaction.Survivor);
    expect(fallback.role).toBe(NpcRole.Civilian);
    expect(fallback.behavior.defaultState).toBe(NpcState.Idle);
    expect(fallback.behavior.fallbackState).toBe(NpcState.Flee);
    expect(fallback.schedule.timeSlice).toBe("Daytime");
    expect(fallback.spawn.rarity).toBe("Common");
    expect(fallback.textureKey).toBe("npc-placeholder");
  });

  it("normalizes missing or invalid data to safe defaults", () => {
    const normalized = normalizeNpcDefinition({
      id: "",
      name: "",
      faction: "Bogus" as never,
      role: "Wizard" as never,
      behavior: {
        defaultState: "???" as never,
        fallbackState: undefined as never,
        preferredStates: [] as never,
      } as never,
      schedule: {
        days: [],
        timeSlice: "Noon" as never,
        mapTags: [],
        routeTriggers: [],
      } as never,
      spawn: {
        rarity: "Legendary" as never,
        weight: 0,
        mapTags: [],
        routeTriggers: [],
      } as never,
      textureKey: "",
    });

    expect(normalized.faction).toBe(NpcFaction.Survivor);
    expect(normalized.role).toBe(NpcRole.Civilian);
    expect(normalized.behavior.defaultState).toBe(NpcState.Idle);
    expect(normalized.behavior.fallbackState).toBe(NpcState.Flee);
    expect(normalized.schedule.timeSlice).toBe("Daytime");
    expect(normalized.schedule.days.length).toBeGreaterThan(0);
    expect(normalized.spawn.weight).toBeGreaterThan(0);
    expect(normalized.spawn.rarity).toBe("Common");
    expect(normalized.textureKey).toBe("npc-placeholder");
  });
});

describe("Npc catalog", () => {
  it("exposes five families", () => {
    expect(NPC_FAMILIES).toHaveLength(5);
  });

  it("each family has at least two archetypes", () => {
    for (const family of NPC_FAMILIES) {
      expect(family.archetypes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("includes a flat archetype list for scheduling", () => {
    expect(NPC_ARCHETYPES.length).toBeGreaterThanOrEqual(10);
  });

  it("covers the five core families", () => {
    const familyNames = NPC_FAMILIES.map((family) => family.faction);

    expect(familyNames).toEqual(
      expect.arrayContaining([
        NpcFaction.Survivor,
        NpcFaction.HostileHuman,
        NpcFaction.Responder,
        NpcFaction.Trader,
        NpcFaction.Infected,
      ]),
    );
  });
});
