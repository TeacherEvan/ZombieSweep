import { describe, expect, it } from "vitest";
import {
  NpcFaction,
  NpcRarity,
  NpcRole,
  NpcState,
  NpcTimeSlice,
  createNpcDefinition,
} from "../entities/Npc";
import { NPC_ARCHETYPES } from "../entities/NpcCatalog";
import {
  NpcArchetypeSelection,
  NpcSpawnPlan,
  buildNpcSpawnPlan,
  sanitizeSpawnZone,
  selectNpcArchetypes,
} from "./NpcScheduler";
import { createTownReputation } from "./TownReputation";

describe("NpcScheduler", () => {
  const traderPocket = {
    day: 2,
    timeSlice: NpcTimeSlice.Daytime,
    mapTags: ["urban"],
    routeTriggers: ["market"],
    threatLevel: 8,
    reputation: createTownReputation({
      trust: 82,
      collateral: 2,
      alertness: 4,
    }),
    isSafeZone: true,
    spawnZones: ["FrontPorch", "bogus-zone", "SidewalkRight"],
    limit: 2,
  };

  const blockadePressure = {
    day: 6,
    timeSlice: NpcTimeSlice.Night,
    mapTags: ["urban"],
    routeTriggers: ["blockade"],
    threatLevel: 88,
    reputation: createTownReputation({
      trust: 12,
      collateral: 30,
      alertness: 88,
    }),
    isSafeZone: false,
    spawnZones: ["LeftShoulder", "FrontPorch"],
    limit: 1,
  };

  it("produces deterministic spawn plans for the same inputs", () => {
    const first = buildNpcSpawnPlan(traderPocket, NPC_ARCHETYPES);
    const second = buildNpcSpawnPlan(traderPocket, NPC_ARCHETYPES);

    expect(first).toEqual(second);
  });

  it("prefers trader archetypes in safe market pockets", () => {
    const plans = buildNpcSpawnPlan(traderPocket, NPC_ARCHETYPES);

    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0].definition.faction).toBe(NpcFaction.Trader);
    expect(plans[0].definition.id).toBe("trader-black-market-mechanic");
    expect(plans[0].state).toBe(NpcState.Trade);
  });

  it("tilts toward hostile humans when blockade pressure spikes", () => {
    const plans = buildNpcSpawnPlan(blockadePressure, NPC_ARCHETYPES);

    expect(plans.length).toBe(1);
    expect(plans[0].definition.faction).toBe(NpcFaction.HostileHuman);
    expect(["hostile-raider", "hostile-paranoid-prepper"]).toContain(
      plans[0].definition.id,
    );
    expect(plans[0].state).toBe(NpcState.Defend);
  });

  it("skips invalid spawn zones safely", () => {
    const plans = buildNpcSpawnPlan(traderPocket, NPC_ARCHETYPES);
    const invalidZone: string = "bogus-zone";

    expect(
      plans.every((plan: NpcSpawnPlan) => plan.spawnZone === "FrontPorch"),
    ).toBe(true);
    expect(
      plans.some((plan: NpcSpawnPlan) => plan.spawnZone === invalidZone),
    ).toBe(false);
    expect(sanitizeSpawnZone(invalidZone)).toBeNull();
    expect(sanitizeSpawnZone("FrontPorch")).toBe("FrontPorch");
  });

  it("falls back to daytime defaults when schedule data is missing", () => {
    const fallbackTrader = {
      id: "fallback-trader",
      name: "Fallback Trader",
      faction: NpcFaction.Trader,
      role: NpcRole.Merchant,
      textureKey: "",
    } as never;

    const plans = buildNpcSpawnPlan(
      {
        day: 3,
        timeSlice: NpcTimeSlice.Daytime,
        mapTags: ["suburban"],
        routeTriggers: [],
        threatLevel: 10,
        reputation: createTownReputation(),
        isSafeZone: true,
        spawnZones: ["FrontPorch"],
        limit: 1,
      },
      [fallbackTrader],
    );

    expect(plans).toHaveLength(1);
    expect(plans[0].definition.id).toBe("fallback-trader");
    expect(plans[0].definition.schedule.timeSlice).toBe(NpcTimeSlice.Daytime);
    expect(plans[0].definition.schedule.days).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("respects rarity when otherwise similar candidates compete", () => {
    const commonTrader = createNpcDefinition({
      id: "trader-common",
      name: "Common Trader",
      faction: NpcFaction.Trader,
      role: NpcRole.Merchant,
      behavior: undefined,
      schedule: {
        days: [1, 2, 3, 4, 5, 6, 7],
        timeSlice: NpcTimeSlice.Daytime,
        mapTags: ["urban"],
        routeTriggers: ["market"],
        minThreatLevel: 0,
        maxThreatLevel: 100,
      },
      spawn: {
        weight: 5,
        rarity: NpcRarity.Common,
        mapTags: ["urban"],
        routeTriggers: ["market"],
        requiresSafeZone: true,
        requiredFaction: NpcFaction.Trader,
      },
      textureKey: "npc-common-trader",
    });

    const rareTrader = createNpcDefinition({
      id: "trader-rare",
      name: "Rare Trader",
      faction: NpcFaction.Trader,
      role: NpcRole.Merchant,
      behavior: undefined,
      schedule: {
        days: [1, 2, 3, 4, 5, 6, 7],
        timeSlice: NpcTimeSlice.Daytime,
        mapTags: ["urban"],
        routeTriggers: ["market"],
        minThreatLevel: 0,
        maxThreatLevel: 100,
      },
      spawn: {
        weight: 5,
        rarity: NpcRarity.Rare,
        mapTags: ["urban"],
        routeTriggers: ["market"],
        requiresSafeZone: true,
        requiredFaction: NpcFaction.Trader,
      },
      textureKey: "npc-rare-trader",
    });

    const plans = buildNpcSpawnPlan(
      {
        day: 4,
        timeSlice: NpcTimeSlice.Daytime,
        mapTags: ["urban"],
        routeTriggers: ["market"],
        threatLevel: 5,
        reputation: createTownReputation({
          trust: 75,
          collateral: 0,
          alertness: 5,
        }),
        isSafeZone: true,
        spawnZones: ["FrontPorch"],
        limit: 1,
      },
      [commonTrader, rareTrader],
    );

    expect(plans).toHaveLength(1);
    expect(plans[0].definition.id).toBe("trader-rare");
  });

  it("selectNpcArchetypes returns a stable ordering for the same inputs", () => {
    const first = selectNpcArchetypes(traderPocket, NPC_ARCHETYPES).map(
      (entry: NpcArchetypeSelection) => entry.definition.id,
    );
    const second = selectNpcArchetypes(traderPocket, NPC_ARCHETYPES).map(
      (entry: NpcArchetypeSelection) => entry.definition.id,
    );

    expect(first).toEqual(second);
  });
});
