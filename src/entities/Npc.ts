export enum NpcFaction {
  Survivor = "Survivor",
  HostileHuman = "HostileHuman",
  Responder = "Responder",
  Trader = "Trader",
  Infected = "Infected",
}

export enum NpcRole {
  Civilian = "Civilian",
  Guard = "Guard",
  Merchant = "Merchant",
  Scavenger = "Scavenger",
  Medic = "Medic",
  Raider = "Raider",
  Shambler = "Shambler",
  Runner = "Runner",
  Spitter = "Spitter",
}

export enum NpcState {
  Idle = "Idle",
  Travel = "Travel",
  Interact = "Interact",
  Flee = "Flee",
  Defend = "Defend",
  Trade = "Trade",
  Investigate = "Investigate",
  Infected = "Infected",
}

export enum NpcTimeSlice {
  Morning = "Morning",
  Daytime = "Daytime",
  Evening = "Evening",
  Night = "Night",
}

export enum NpcRarity {
  Common = "Common",
  Uncommon = "Uncommon",
  Rare = "Rare",
  Unique = "Unique",
}

export interface NpcBehaviorProfile {
  defaultState: NpcState;
  fallbackState: NpcState;
  preferredStates: NpcState[];
  caution: number;
  aggression: number;
  support: number;
}

export interface NpcScheduleProfile {
  days: number[];
  timeSlice: NpcTimeSlice;
  mapTags: string[];
  routeTriggers: string[];
  minThreatLevel: number;
  maxThreatLevel: number;
}

export interface NpcSpawnProfile {
  weight: number;
  rarity: NpcRarity;
  mapTags: string[];
  routeTriggers: string[];
  requiresSafeZone: boolean;
  requiredFaction: NpcFaction;
}

export interface NpcDefinition {
  id: string;
  name: string;
  faction: NpcFaction;
  role: NpcRole;
  behavior: NpcBehaviorProfile;
  schedule: NpcScheduleProfile;
  spawn: NpcSpawnProfile;
  textureKey: string;
}

export interface NpcDefinitionInput {
  id?: string;
  name?: string;
  faction?: NpcFaction;
  role?: NpcRole;
  behavior?: Partial<NpcBehaviorProfile>;
  schedule?: Partial<NpcScheduleProfile>;
  spawn?: Partial<NpcSpawnProfile>;
  textureKey?: string;
}

export const NPC_PLACEHOLDER_TEXTURE_KEY = "npc-placeholder" as const;
export const NPC_WEEK_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

const VALID_FACTIONS = new Set(Object.values(NpcFaction) as NpcFaction[]);
const VALID_ROLES = new Set(Object.values(NpcRole) as NpcRole[]);
const VALID_STATES = new Set(Object.values(NpcState) as NpcState[]);
const VALID_TIME_SLICES = new Set(
  Object.values(NpcTimeSlice) as NpcTimeSlice[],
);
const VALID_RARITIES = new Set(Object.values(NpcRarity) as NpcRarity[]);

const DEFAULT_ROLE_BY_FACTION: Record<NpcFaction, NpcRole> = {
  [NpcFaction.Survivor]: NpcRole.Civilian,
  [NpcFaction.HostileHuman]: NpcRole.Raider,
  [NpcFaction.Responder]: NpcRole.Scavenger,
  [NpcFaction.Trader]: NpcRole.Merchant,
  [NpcFaction.Infected]: NpcRole.Shambler,
};

const ALLOWED_ROLES_BY_FACTION: Record<NpcFaction, readonly NpcRole[]> = {
  [NpcFaction.Survivor]: [NpcRole.Civilian, NpcRole.Guard, NpcRole.Scavenger],
  [NpcFaction.HostileHuman]: [NpcRole.Raider, NpcRole.Scavenger, NpcRole.Guard],
  [NpcFaction.Responder]: [NpcRole.Guard, NpcRole.Scavenger, NpcRole.Medic],
  [NpcFaction.Trader]: [NpcRole.Merchant, NpcRole.Scavenger, NpcRole.Medic],
  [NpcFaction.Infected]: [NpcRole.Shambler, NpcRole.Runner, NpcRole.Spitter],
};

const DEFAULT_BEHAVIOR_BY_FACTION: Record<NpcFaction, NpcBehaviorProfile> = {
  [NpcFaction.Survivor]: {
    defaultState: NpcState.Idle,
    fallbackState: NpcState.Flee,
    preferredStates: [NpcState.Idle, NpcState.Interact, NpcState.Travel],
    caution: 0.8,
    aggression: 0.1,
    support: 0.6,
  },
  [NpcFaction.HostileHuman]: {
    defaultState: NpcState.Investigate,
    fallbackState: NpcState.Flee,
    preferredStates: [NpcState.Investigate, NpcState.Defend, NpcState.Travel],
    caution: 0.4,
    aggression: 0.8,
    support: 0.1,
  },
  [NpcFaction.Responder]: {
    defaultState: NpcState.Travel,
    fallbackState: NpcState.Flee,
    preferredStates: [NpcState.Travel, NpcState.Investigate, NpcState.Defend],
    caution: 0.7,
    aggression: 0.3,
    support: 0.9,
  },
  [NpcFaction.Trader]: {
    defaultState: NpcState.Trade,
    fallbackState: NpcState.Flee,
    preferredStates: [NpcState.Trade, NpcState.Interact, NpcState.Travel],
    caution: 0.6,
    aggression: 0.1,
    support: 0.95,
  },
  [NpcFaction.Infected]: {
    defaultState: NpcState.Infected,
    fallbackState: NpcState.Infected,
    preferredStates: [NpcState.Infected, NpcState.Travel, NpcState.Investigate],
    caution: 0,
    aggression: 1,
    support: 0,
  },
};

const DEFAULT_SCHEDULE: NpcScheduleProfile = {
  days: [...NPC_WEEK_DAYS],
  timeSlice: NpcTimeSlice.Daytime,
  mapTags: ["town"],
  routeTriggers: [],
  minThreatLevel: 0,
  maxThreatLevel: 100,
};

const DEFAULT_SPAWN: NpcSpawnProfile = {
  weight: 1,
  rarity: NpcRarity.Common,
  mapTags: [],
  routeTriggers: [],
  requiresSafeZone: false,
  requiredFaction: NpcFaction.Survivor,
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isValidFaction(value: unknown): value is NpcFaction {
  return isString(value) && VALID_FACTIONS.has(value as NpcFaction);
}

function isValidRole(value: unknown): value is NpcRole {
  return isString(value) && VALID_ROLES.has(value as NpcRole);
}

function isValidState(value: unknown): value is NpcState {
  return isString(value) && VALID_STATES.has(value as NpcState);
}

function isValidTimeSlice(value: unknown): value is NpcTimeSlice {
  return isString(value) && VALID_TIME_SLICES.has(value as NpcTimeSlice);
}

function isValidRarity(value: unknown): value is NpcRarity {
  return isString(value) && VALID_RARITIES.has(value as NpcRarity);
}

function normalizeText(value: unknown, fallback: string): string {
  if (!isString(value)) {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeNumber(
  value: unknown,
  fallback: number,
  min?: number,
): number {
  if (
    typeof value !== "number" ||
    Number.isNaN(value) ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  const nextValue = min === undefined ? value : Math.max(min, value);
  return nextValue;
}

function normalizeStringArray(
  value: unknown,
  fallback: string[] = [],
): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const cleaned = value
    .filter(isString)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const unique = Array.from(new Set(cleaned));
  return unique.length > 0 ? unique : [...fallback];
}

function normalizeDays(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [...NPC_WEEK_DAYS];
  }

  const cleaned = value
    .filter(
      (entry): entry is number =>
        typeof entry === "number" && Number.isInteger(entry),
    )
    .filter((entry) => entry >= 1 && entry <= 7);

  const unique = Array.from(new Set(cleaned)).sort((a, b) => a - b);
  return unique.length > 0 ? unique : [...NPC_WEEK_DAYS];
}

function normalizeFaction(value: unknown): NpcFaction {
  return isValidFaction(value) ? value : NpcFaction.Survivor;
}

function normalizeRole(value: unknown, faction: NpcFaction): NpcRole {
  const fallbackRole = DEFAULT_ROLE_BY_FACTION[faction];
  if (!isValidRole(value)) {
    return fallbackRole;
  }

  const allowedRoles = ALLOWED_ROLES_BY_FACTION[faction];
  return allowedRoles.includes(value) ? value : fallbackRole;
}

function normalizeState(value: unknown, fallback: NpcState): NpcState {
  return isValidState(value) ? value : fallback;
}

function normalizeTimeSlice(value: unknown): NpcTimeSlice {
  return isValidTimeSlice(value) ? value : NpcTimeSlice.Daytime;
}

function normalizeRarity(value: unknown): NpcRarity {
  return isValidRarity(value) ? value : NpcRarity.Common;
}

function cloneBehavior(profile: NpcBehaviorProfile): NpcBehaviorProfile {
  return {
    defaultState: profile.defaultState,
    fallbackState: profile.fallbackState,
    preferredStates: [...profile.preferredStates],
    caution: profile.caution,
    aggression: profile.aggression,
    support: profile.support,
  };
}

function cloneSchedule(profile: NpcScheduleProfile): NpcScheduleProfile {
  return {
    days: [...profile.days],
    timeSlice: profile.timeSlice,
    mapTags: [...profile.mapTags],
    routeTriggers: [...profile.routeTriggers],
    minThreatLevel: profile.minThreatLevel,
    maxThreatLevel: profile.maxThreatLevel,
  };
}

function cloneSpawn(profile: NpcSpawnProfile): NpcSpawnProfile {
  return {
    weight: profile.weight,
    rarity: profile.rarity,
    mapTags: [...profile.mapTags],
    routeTriggers: [...profile.routeTriggers],
    requiresSafeZone: profile.requiresSafeZone,
    requiredFaction: profile.requiredFaction,
  };
}

function normalizeBehavior(
  value: Partial<NpcBehaviorProfile> | undefined,
  faction: NpcFaction,
): NpcBehaviorProfile {
  const defaults = DEFAULT_BEHAVIOR_BY_FACTION[faction];
  if (!value) {
    return cloneBehavior(defaults);
  }

  const preferredStates = normalizeStateArray(
    value.preferredStates,
    defaults.preferredStates,
  );

  return {
    defaultState: normalizeState(value.defaultState, defaults.defaultState),
    fallbackState: normalizeState(value.fallbackState, defaults.fallbackState),
    preferredStates,
    caution: normalizeNumber(value.caution, defaults.caution, 0),
    aggression: normalizeNumber(value.aggression, defaults.aggression, 0),
    support: normalizeNumber(value.support, defaults.support, 0),
  };
}

function normalizeStateArray(value: unknown, fallback: NpcState[]): NpcState[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const cleaned = value.filter(isValidState);
  const unique = Array.from(new Set(cleaned));
  return unique.length > 0 ? unique : [...fallback];
}

function normalizeSchedule(
  value: Partial<NpcScheduleProfile> | undefined,
): NpcScheduleProfile {
  if (!value) {
    return cloneSchedule(DEFAULT_SCHEDULE);
  }

  const days = normalizeDays(value.days);
  const minThreatLevel = normalizeNumber(
    value.minThreatLevel,
    DEFAULT_SCHEDULE.minThreatLevel,
    0,
  );
  const maxThreatLevelRaw = normalizeNumber(
    value.maxThreatLevel,
    DEFAULT_SCHEDULE.maxThreatLevel,
    minThreatLevel,
  );
  const maxThreatLevel = Math.max(minThreatLevel, maxThreatLevelRaw);

  return {
    days,
    timeSlice: normalizeTimeSlice(value.timeSlice),
    mapTags: normalizeStringArray(value.mapTags, DEFAULT_SCHEDULE.mapTags),
    routeTriggers: normalizeStringArray(
      value.routeTriggers,
      DEFAULT_SCHEDULE.routeTriggers,
    ),
    minThreatLevel,
    maxThreatLevel,
  };
}

function normalizeSpawn(
  value: Partial<NpcSpawnProfile> | undefined,
  faction: NpcFaction,
): NpcSpawnProfile {
  if (!value) {
    return {
      ...cloneSpawn(DEFAULT_SPAWN),
      requiredFaction: faction,
    };
  }

  return {
    weight: normalizeNumber(value.weight, DEFAULT_SPAWN.weight, 1),
    rarity: normalizeRarity(value.rarity),
    mapTags: normalizeStringArray(value.mapTags, DEFAULT_SPAWN.mapTags),
    routeTriggers: normalizeStringArray(
      value.routeTriggers,
      DEFAULT_SPAWN.routeTriggers,
    ),
    requiresSafeZone:
      typeof value.requiresSafeZone === "boolean"
        ? value.requiresSafeZone
        : DEFAULT_SPAWN.requiresSafeZone,
    requiredFaction: normalizeFaction(value.requiredFaction),
  };
}

export function createNpcDefinition(
  definition: NpcDefinitionInput,
): NpcDefinition {
  return normalizeNpcDefinition(definition);
}

export function normalizeNpcDefinition(
  definition?: NpcDefinitionInput | null,
): NpcDefinition {
  const faction = normalizeFaction(definition?.faction);
  const role = normalizeRole(definition?.role, faction);
  const fallbackName = role;
  const fallbackId = `npc-${faction.toLowerCase()}-${role.toLowerCase()}`;

  return {
    id: normalizeText(definition?.id, fallbackId),
    name: normalizeText(definition?.name, fallbackName),
    faction,
    role,
    behavior: normalizeBehavior(definition?.behavior, faction),
    schedule: normalizeSchedule(definition?.schedule),
    spawn: normalizeSpawn(definition?.spawn, faction),
    textureKey: normalizeText(
      definition?.textureKey,
      NPC_PLACEHOLDER_TEXTURE_KEY,
    ),
  };
}

export function getFallbackNpcDefinition(): NpcDefinition {
  return normalizeNpcDefinition({
    id: "npc-fallback-civilian",
    name: "Fallback Civilian",
    faction: NpcFaction.Survivor,
    role: NpcRole.Civilian,
    behavior: {
      defaultState: NpcState.Idle,
      fallbackState: NpcState.Flee,
      preferredStates: [NpcState.Idle, NpcState.Flee],
      caution: 0.8,
      aggression: 0.1,
      support: 0.6,
    },
    schedule: {
      days: [...NPC_WEEK_DAYS],
      timeSlice: NpcTimeSlice.Daytime,
      mapTags: ["town"],
      routeTriggers: [],
      minThreatLevel: 0,
      maxThreatLevel: 100,
    },
    spawn: {
      weight: 1,
      rarity: NpcRarity.Common,
      mapTags: [],
      routeTriggers: [],
      requiresSafeZone: true,
      requiredFaction: NpcFaction.Survivor,
    },
    textureKey: NPC_PLACEHOLDER_TEXTURE_KEY,
  });
}
