import { CITIZEN_PENALTY } from "../config/constants";
import {
  NPC_WEEK_DAYS,
  NpcDefinition,
  NpcFaction,
  NpcRarity,
  NpcRole,
  NpcState,
  NpcTimeSlice,
  createNpcDefinition,
} from "./Npc";

export enum CitizenType {
  FriendlyNeighbor = "FriendlyNeighbor",
  PanickedRunner = "PanickedRunner",
  ArmedSurvivalist = "ArmedSurvivalist",
}

export interface Citizen {
  type: CitizenType;
  x: number;
  y: number;
  hitPenalty: number;
  dropsPickup: boolean;
  isStationary: boolean;
  retaliates: boolean;
}

export function toNpcDefinition(citizen: Citizen): NpcDefinition {
  switch (citizen.type) {
    case CitizenType.FriendlyNeighbor:
      return createNpcDefinition({
        id: "citizen-friendly-neighbor",
        name: "Friendly Neighbor",
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
          days: [...NPC_WEEK_DAYS],
          timeSlice: NpcTimeSlice.Daytime,
          mapTags: ["suburban", "urban"],
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
        textureKey: "citizen-friendly",
      });

    case CitizenType.PanickedRunner:
      return createNpcDefinition({
        id: "citizen-panicked-runner",
        name: "Panicked Runner",
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
          days: [...NPC_WEEK_DAYS],
          timeSlice: NpcTimeSlice.Evening,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["alarm", "panic"],
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
        textureKey: "citizen-panicked",
      });

    case CitizenType.ArmedSurvivalist:
      return createNpcDefinition({
        id: "citizen-armed-survivalist",
        name: "Armed Survivalist",
        faction: NpcFaction.Survivor,
        role: NpcRole.Guard,
        behavior: {
          defaultState: NpcState.Defend,
          fallbackState: NpcState.Flee,
          preferredStates: [
            NpcState.Defend,
            NpcState.Investigate,
            NpcState.Idle,
          ],
          caution: 0.72,
          aggression: 0.6,
          support: 0.4,
        },
        schedule: {
          days: [...NPC_WEEK_DAYS],
          timeSlice: NpcTimeSlice.Night,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["blockade", "raid"],
          minThreatLevel: 10,
          maxThreatLevel: 100,
        },
        spawn: {
          weight: 5,
          rarity: NpcRarity.Uncommon,
          mapTags: ["suburban", "urban"],
          routeTriggers: ["blockade"],
          requiresSafeZone: false,
          requiredFaction: NpcFaction.Survivor,
        },
        textureKey: "citizen-armed",
      });
  }
}

export function createFriendlyNeighbor(x: number, y: number): Citizen {
  return {
    type: CitizenType.FriendlyNeighbor,
    x,
    y,
    hitPenalty: CITIZEN_PENALTY.FRIENDLY_NEIGHBOR,
    dropsPickup: true,
    isStationary: true,
    retaliates: false,
  };
}

export function createPanickedRunner(x: number, y: number): Citizen {
  return {
    type: CitizenType.PanickedRunner,
    x,
    y,
    hitPenalty: CITIZEN_PENALTY.PANICKED_RUNNER,
    dropsPickup: false,
    isStationary: false,
    retaliates: false,
  };
}

export function createArmedSurvivalist(x: number, y: number): Citizen {
  return {
    type: CitizenType.ArmedSurvivalist,
    x,
    y,
    hitPenalty: CITIZEN_PENALTY.ARMED_SURVIVALIST,
    dropsPickup: false,
    isStationary: true,
    retaliates: true,
  };
}
