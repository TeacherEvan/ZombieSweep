import {
  NpcDefinition,
  NpcDefinitionInput,
  NpcFaction,
  NpcRarity,
  NpcRole,
  NpcState,
  NpcTimeSlice,
  createNpcDefinition,
} from "./Npc";

export interface NpcFamilyDefinition {
  faction: NpcFaction;
  label: string;
  archetypes: NpcDefinition[];
}

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

function buildNpc(definition: NpcDefinitionInput): NpcDefinition {
  return createNpcDefinition(definition);
}

export const NPC_FAMILIES: NpcFamilyDefinition[] = [
  {
    faction: NpcFaction.Survivor,
    label: "Civilians",
    archetypes: [
      buildNpc({
        id: "survivor-porch-watcher",
        name: "Porch Watcher",
        faction: NpcFaction.Survivor,
        role: NpcRole.Civilian,
        behavior: {
          defaultState: NpcState.Idle,
          fallbackState: NpcState.Flee,
          preferredStates: [NpcState.Idle, NpcState.Interact, NpcState.Travel],
          caution: 0.85,
          aggression: 0.05,
          support: 0.7,
        },
        schedule: {
          days: [...ALL_DAYS],
          timeSlice: NpcTimeSlice.Daytime,
          mapTags: ["suburban"],
          routeTriggers: ["porch", "subscriber"],
          minThreatLevel: 0,
          maxThreatLevel: 45,
        },
        spawn: {
          weight: 6,
          rarity: NpcRarity.Common,
          mapTags: ["suburban"],
          routeTriggers: ["porch"],
          requiresSafeZone: true,
          requiredFaction: NpcFaction.Survivor,
        },
        textureKey: "npc-porch-watcher",
      }),
      buildNpc({
        id: "survivor-panicked-evacuee",
        name: "Panicked Evacuee",
        faction: NpcFaction.Survivor,
        role: NpcRole.Civilian,
        behavior: {
          defaultState: NpcState.Flee,
          fallbackState: NpcState.Flee,
          preferredStates: [NpcState.Flee, NpcState.Travel, NpcState.Idle],
          caution: 0.98,
          aggression: 0.02,
          support: 0.25,
        },
        schedule: {
          days: [...ALL_DAYS],
          timeSlice: NpcTimeSlice.Evening,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["alarm", "zombie-pressure"],
          minThreatLevel: 10,
          maxThreatLevel: 80,
        },
        spawn: {
          weight: 4,
          rarity: NpcRarity.Common,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["alarm"],
          requiresSafeZone: false,
          requiredFaction: NpcFaction.Survivor,
        },
        textureKey: "npc-panicked-evacuee",
      }),
      buildNpc({
        id: "survivor-barricade-resident",
        name: "Barricade Resident",
        faction: NpcFaction.Survivor,
        role: NpcRole.Guard,
        behavior: {
          defaultState: NpcState.Defend,
          fallbackState: NpcState.Flee,
          preferredStates: [NpcState.Defend, NpcState.Idle, NpcState.Travel],
          caution: 0.72,
          aggression: 0.35,
          support: 0.6,
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 7],
          timeSlice: NpcTimeSlice.Daytime,
          mapTags: ["suburban"],
          routeTriggers: ["barricade", "checkpoint"],
          minThreatLevel: 0,
          maxThreatLevel: 70,
        },
        spawn: {
          weight: 3,
          rarity: NpcRarity.Uncommon,
          mapTags: ["suburban"],
          routeTriggers: ["barricade"],
          requiresSafeZone: true,
          requiredFaction: NpcFaction.Survivor,
        },
        textureKey: "npc-barricade-resident",
      }),
    ],
  },
  {
    faction: NpcFaction.HostileHuman,
    label: "Hostile Humans",
    archetypes: [
      buildNpc({
        id: "hostile-raider",
        name: "Raider",
        faction: NpcFaction.HostileHuman,
        role: NpcRole.Raider,
        behavior: {
          defaultState: NpcState.Investigate,
          fallbackState: NpcState.Flee,
          preferredStates: [
            NpcState.Investigate,
            NpcState.Defend,
            NpcState.Travel,
          ],
          caution: 0.25,
          aggression: 0.92,
          support: 0.05,
        },
        schedule: {
          days: [...ALL_DAYS],
          timeSlice: NpcTimeSlice.Evening,
          mapTags: ["urban", "industrial"],
          routeTriggers: ["ambush", "crossing"],
          minThreatLevel: 20,
          maxThreatLevel: 100,
        },
        spawn: {
          weight: 5,
          rarity: NpcRarity.Uncommon,
          mapTags: ["urban", "industrial"],
          routeTriggers: ["ambush"],
          requiresSafeZone: false,
          requiredFaction: NpcFaction.HostileHuman,
        },
        textureKey: "npc-raider",
      }),
      buildNpc({
        id: "hostile-paranoid-prepper",
        name: "Paranoid Prepper",
        faction: NpcFaction.HostileHuman,
        role: NpcRole.Guard,
        behavior: {
          defaultState: NpcState.Defend,
          fallbackState: NpcState.Flee,
          preferredStates: [
            NpcState.Defend,
            NpcState.Investigate,
            NpcState.Idle,
          ],
          caution: 0.55,
          aggression: 0.6,
          support: 0.1,
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 7],
          timeSlice: NpcTimeSlice.Night,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["property", "stash"],
          minThreatLevel: 10,
          maxThreatLevel: 100,
        },
        spawn: {
          weight: 3,
          rarity: NpcRarity.Rare,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["property"],
          requiresSafeZone: false,
          requiredFaction: NpcFaction.HostileHuman,
        },
        textureKey: "npc-paranoid-prepper",
      }),
      buildNpc({
        id: "hostile-extortionist",
        name: "Extortionist",
        faction: NpcFaction.HostileHuman,
        role: NpcRole.Scavenger,
        behavior: {
          defaultState: NpcState.Trade,
          fallbackState: NpcState.Flee,
          preferredStates: [
            NpcState.Trade,
            NpcState.Investigate,
            NpcState.Defend,
          ],
          caution: 0.45,
          aggression: 0.85,
          support: 0.05,
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 7],
          timeSlice: NpcTimeSlice.Daytime,
          mapTags: ["urban"],
          routeTriggers: ["toll", "blockade"],
          minThreatLevel: 15,
          maxThreatLevel: 100,
        },
        spawn: {
          weight: 2,
          rarity: NpcRarity.Rare,
          mapTags: ["urban"],
          routeTriggers: ["blockade"],
          requiresSafeZone: false,
          requiredFaction: NpcFaction.HostileHuman,
        },
        textureKey: "npc-extortionist",
      }),
    ],
  },
  {
    faction: NpcFaction.Responder,
    label: "Responders",
    archetypes: [
      buildNpc({
        id: "responder-rescue-scout",
        name: "Rescue Scout",
        faction: NpcFaction.Responder,
        role: NpcRole.Scavenger,
        behavior: {
          defaultState: NpcState.Travel,
          fallbackState: NpcState.Flee,
          preferredStates: [
            NpcState.Travel,
            NpcState.Investigate,
            NpcState.Defend,
          ],
          caution: 0.65,
          aggression: 0.2,
          support: 0.85,
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 7],
          timeSlice: NpcTimeSlice.Daytime,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["distress", "route"],
          minThreatLevel: 0,
          maxThreatLevel: 80,
        },
        spawn: {
          weight: 5,
          rarity: NpcRarity.Uncommon,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["distress"],
          requiresSafeZone: false,
          requiredFaction: NpcFaction.Responder,
        },
        textureKey: "npc-rescue-scout",
      }),
      buildNpc({
        id: "responder-radio-operator",
        name: "Radio Operator",
        faction: NpcFaction.Responder,
        role: NpcRole.Guard,
        behavior: {
          defaultState: NpcState.Investigate,
          fallbackState: NpcState.Flee,
          preferredStates: [
            NpcState.Investigate,
            NpcState.Interact,
            NpcState.Travel,
          ],
          caution: 0.78,
          aggression: 0.15,
          support: 0.95,
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 7],
          timeSlice: NpcTimeSlice.Evening,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["signal", "report"],
          minThreatLevel: 0,
          maxThreatLevel: 90,
        },
        spawn: {
          weight: 3,
          rarity: NpcRarity.Rare,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["report"],
          requiresSafeZone: true,
          requiredFaction: NpcFaction.Responder,
        },
        textureKey: "npc-radio-operator",
      }),
      buildNpc({
        id: "responder-triage-worker",
        name: "Triage Worker",
        faction: NpcFaction.Responder,
        role: NpcRole.Medic,
        behavior: {
          defaultState: NpcState.Interact,
          fallbackState: NpcState.Flee,
          preferredStates: [
            NpcState.Interact,
            NpcState.Travel,
            NpcState.Defend,
          ],
          caution: 0.75,
          aggression: 0.1,
          support: 1,
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 7],
          timeSlice: NpcTimeSlice.Daytime,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["aid", "clinic"],
          minThreatLevel: 0,
          maxThreatLevel: 70,
        },
        spawn: {
          weight: 4,
          rarity: NpcRarity.Uncommon,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["clinic"],
          requiresSafeZone: true,
          requiredFaction: NpcFaction.Responder,
        },
        textureKey: "npc-triage-worker",
      }),
    ],
  },
  {
    faction: NpcFaction.Trader,
    label: "Traders",
    archetypes: [
      buildNpc({
        id: "trader-black-market-mechanic",
        name: "Black-Market Mechanic",
        faction: NpcFaction.Trader,
        role: NpcRole.Merchant,
        behavior: {
          defaultState: NpcState.Trade,
          fallbackState: NpcState.Flee,
          preferredStates: [NpcState.Trade, NpcState.Interact, NpcState.Travel],
          caution: 0.6,
          aggression: 0.05,
          support: 0.92,
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 7],
          timeSlice: NpcTimeSlice.Daytime,
          mapTags: ["urban", "industrial"],
          routeTriggers: ["garage", "market"],
          minThreatLevel: 0,
          maxThreatLevel: 60,
        },
        spawn: {
          weight: 5,
          rarity: NpcRarity.Uncommon,
          mapTags: ["urban", "industrial"],
          routeTriggers: ["garage"],
          requiresSafeZone: true,
          requiredFaction: NpcFaction.Trader,
        },
        textureKey: "npc-black-market-mechanic",
      }),
      buildNpc({
        id: "trader-ammo-runner",
        name: "Ammo Runner",
        faction: NpcFaction.Trader,
        role: NpcRole.Scavenger,
        behavior: {
          defaultState: NpcState.Travel,
          fallbackState: NpcState.Flee,
          preferredStates: [NpcState.Travel, NpcState.Interact, NpcState.Trade],
          caution: 0.68,
          aggression: 0.15,
          support: 0.75,
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 7],
          timeSlice: NpcTimeSlice.Evening,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["supply", "drop"],
          minThreatLevel: 0,
          maxThreatLevel: 75,
        },
        spawn: {
          weight: 4,
          rarity: NpcRarity.Rare,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["supply"],
          requiresSafeZone: true,
          requiredFaction: NpcFaction.Trader,
        },
        textureKey: "npc-ammo-runner",
      }),
      buildNpc({
        id: "trader-field-medic-vendor",
        name: "Field Medic Vendor",
        faction: NpcFaction.Trader,
        role: NpcRole.Medic,
        behavior: {
          defaultState: NpcState.Trade,
          fallbackState: NpcState.Flee,
          preferredStates: [NpcState.Trade, NpcState.Interact, NpcState.Idle],
          caution: 0.7,
          aggression: 0.05,
          support: 0.98,
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 7],
          timeSlice: NpcTimeSlice.Daytime,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["medic", "clinic"],
          minThreatLevel: 0,
          maxThreatLevel: 55,
        },
        spawn: {
          weight: 3,
          rarity: NpcRarity.Uncommon,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["clinic"],
          requiresSafeZone: true,
          requiredFaction: NpcFaction.Trader,
        },
        textureKey: "npc-field-medic-vendor",
      }),
    ],
  },
  {
    faction: NpcFaction.Infected,
    label: "Infected",
    archetypes: [
      buildNpc({
        id: "infected-shambler",
        name: "Shambler",
        faction: NpcFaction.Infected,
        role: NpcRole.Shambler,
        behavior: {
          defaultState: NpcState.Infected,
          fallbackState: NpcState.Infected,
          preferredStates: [
            NpcState.Infected,
            NpcState.Travel,
            NpcState.Investigate,
          ],
          caution: 0,
          aggression: 1,
          support: 0,
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 7],
          timeSlice: NpcTimeSlice.Night,
          mapTags: ["suburban", "urban", "industrial"],
          routeTriggers: ["corpse", "noise"],
          minThreatLevel: 10,
          maxThreatLevel: 100,
        },
        spawn: {
          weight: 6,
          rarity: NpcRarity.Common,
          mapTags: ["suburban", "urban", "industrial"],
          routeTriggers: ["noise"],
          requiresSafeZone: false,
          requiredFaction: NpcFaction.Infected,
        },
        textureKey: "npc-infected-shambler",
      }),
      buildNpc({
        id: "infected-runner",
        name: "Runner",
        faction: NpcFaction.Infected,
        role: NpcRole.Runner,
        behavior: {
          defaultState: NpcState.Infected,
          fallbackState: NpcState.Infected,
          preferredStates: [
            NpcState.Infected,
            NpcState.Travel,
            NpcState.Investigate,
          ],
          caution: 0,
          aggression: 1,
          support: 0,
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 7],
          timeSlice: NpcTimeSlice.Night,
          mapTags: ["suburban", "urban", "industrial"],
          routeTriggers: ["alarm", "panic"],
          minThreatLevel: 20,
          maxThreatLevel: 100,
        },
        spawn: {
          weight: 4,
          rarity: NpcRarity.Uncommon,
          mapTags: ["suburban", "urban", "industrial"],
          routeTriggers: ["alarm"],
          requiresSafeZone: false,
          requiredFaction: NpcFaction.Infected,
        },
        textureKey: "npc-infected-runner",
      }),
      buildNpc({
        id: "infected-spitter",
        name: "Spitter",
        faction: NpcFaction.Infected,
        role: NpcRole.Spitter,
        behavior: {
          defaultState: NpcState.Infected,
          fallbackState: NpcState.Infected,
          preferredStates: [NpcState.Infected, NpcState.Investigate],
          caution: 0,
          aggression: 1,
          support: 0,
        },
        schedule: {
          days: [1, 2, 3, 4, 5, 6, 7],
          timeSlice: NpcTimeSlice.Evening,
          mapTags: ["suburban", "urban", "industrial"],
          routeTriggers: ["scent", "standoff"],
          minThreatLevel: 25,
          maxThreatLevel: 100,
        },
        spawn: {
          weight: 2,
          rarity: NpcRarity.Rare,
          mapTags: ["suburban", "urban", "industrial"],
          routeTriggers: ["standoff"],
          requiresSafeZone: false,
          requiredFaction: NpcFaction.Infected,
        },
        textureKey: "npc-infected-spitter",
      }),
    ],
  },
];

export const NPC_ARCHETYPES: NpcDefinition[] = NPC_FAMILIES.flatMap(
  (family) => family.archetypes,
);

export function getNpcFamilies(): readonly NpcFamilyDefinition[] {
  return NPC_FAMILIES;
}

export function getNpcArchetypes(): readonly NpcDefinition[] {
  return NPC_ARCHETYPES;
}

export function getNpcFamilyByFaction(
  faction: NpcFaction,
): NpcFamilyDefinition | undefined {
  return NPC_FAMILIES.find((family) => family.faction === faction);
}

export function getNpcArchetypeById(id: string): NpcDefinition | undefined {
  return NPC_ARCHETYPES.find((archetype) => archetype.id === id);
}
