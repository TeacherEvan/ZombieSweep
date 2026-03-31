import {
  NpcDefinition,
  NpcDefinitionInput,
  NpcFaction,
  NpcRarity,
  NpcState,
  NpcTimeSlice,
  createNpcDefinition,
} from "../entities/Npc";
import { NPC_ARCHETYPES } from "../entities/NpcCatalog";
import { NpcDecisionContext, resolveNpcState } from "./NpcRules";
import { TownReputation, normalizeTownReputation } from "./TownReputation";

export type NpcCatalogEntry = NpcDefinition | NpcDefinitionInput;

export type NpcSpawnZone =
  | "FrontPorch"
  | "BackPorch"
  | "LeftSidewalk"
  | "SidewalkRight"
  | "CenterStreet"
  | "Yard";

export interface NpcScheduleContext {
  day: number;
  timeSlice: NpcTimeSlice;
  mapTags: string[];
  routeTriggers: string[];
  threatLevel: number;
  reputation: TownReputation;
  isSafeZone?: boolean;
  spawnZones?: string[];
  limit?: number;
}

export interface NpcArchetypeSelection {
  definition: NpcDefinition;
  score: number;
}

export interface NpcSpawnPlan extends NpcArchetypeSelection {
  spawnZone: NpcSpawnZone;
  state: NpcState;
}

const DEFAULT_SPAWN_ZONE: NpcSpawnZone = "FrontPorch";
const VALID_SPAWN_ZONES: NpcSpawnZone[] = [
  "FrontPorch",
  "BackPorch",
  "LeftSidewalk",
  "SidewalkRight",
  "CenterStreet",
  "Yard",
];

const RARITY_BONUS: Record<NpcRarity, number> = {
  [NpcRarity.Common]: 0,
  [NpcRarity.Uncommon]: 6,
  [NpcRarity.Rare]: 12,
  [NpcRarity.Unique]: 20,
};

const TIME_SLICE_BONUS: Record<NpcTimeSlice, number> = {
  [NpcTimeSlice.Morning]: 2,
  [NpcTimeSlice.Daytime]: 4,
  [NpcTimeSlice.Evening]: 6,
  [NpcTimeSlice.Night]: 8,
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeNumber(
  value: unknown,
  fallback: number,
  min = 0,
  max = 100,
): number {
  if (
    typeof value !== "number" ||
    Number.isNaN(value) ||
    !Number.isFinite(value)
  ) {
    return clamp(fallback, min, max);
  }

  return clamp(value, min, max);
}

function normalizeStringArray(
  value: unknown,
  fallback: string[] = [],
): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const cleaned = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const unique = Array.from(new Set(cleaned));
  return unique.length > 0 ? unique : [...fallback];
}

function normalizeScheduleContext(
  context: NpcScheduleContext,
): NpcScheduleContext {
  return {
    ...context,
    day: normalizeNumber(context.day, 1, 1, 7),
    mapTags: normalizeStringArray(context.mapTags),
    routeTriggers: normalizeStringArray(context.routeTriggers),
    threatLevel: normalizeNumber(context.threatLevel, 0),
    reputation: normalizeTownReputation(context.reputation),
    isSafeZone: context.isSafeZone ?? false,
    spawnZones: normalizeStringArray(context.spawnZones),
    limit:
      context.limit === undefined
        ? undefined
        : Math.max(1, Math.trunc(context.limit)),
  };
}

function isDayAllowed(scheduleDays: number[], day: number): boolean {
  return scheduleDays.length === 0 || scheduleDays.includes(day);
}

function isTimeSliceAllowed(
  scheduleTimeSlice: NpcTimeSlice,
  contextTimeSlice: NpcTimeSlice,
): boolean {
  return scheduleTimeSlice === contextTimeSlice;
}

function matchesMapTags(
  scheduleTags: string[],
  contextTags: string[],
): boolean {
  if (scheduleTags.length === 0 || scheduleTags.includes("town")) {
    return true;
  }

  return scheduleTags.some((tag) => contextTags.includes(tag));
}

function scoreListOverlap(items: string[], contextItems: string[]): number {
  return items.reduce(
    (score, item) => (contextItems.includes(item) ? score + 1 : score),
    0,
  );
}

function rarityScore(rarity: NpcRarity): number {
  return RARITY_BONUS[rarity];
}

function factionAffinityScore(
  definition: NpcDefinition,
  context: NpcScheduleContext,
): number {
  const trust = context.reputation.trust;
  const alertness = context.reputation.alertness;
  const threat = context.threatLevel;
  const routeTriggers = context.routeTriggers;
  const isSafeZone = context.isSafeZone ?? false;

  switch (definition.faction) {
    case NpcFaction.Survivor:
      return (
        Math.max(0, 60 - threat) * 0.15 + trust * 0.1 + (isSafeZone ? 6 : 0)
      );
    case NpcFaction.HostileHuman:
      return (
        (100 - trust) * 0.14 +
        threat * 0.12 +
        scoreListOverlap(["blockade", "raid", "ambush"], routeTriggers) * 6
      );
    case NpcFaction.Responder:
      return (
        threat * 0.1 +
        alertness * 0.12 +
        scoreListOverlap(["rescue", "signal", "aid"], routeTriggers) * 6
      );
    case NpcFaction.Trader:
      return (
        trust * 0.16 +
        (isSafeZone ? 10 : -8) +
        Math.max(0, 40 - threat) * 0.08 +
        scoreListOverlap(["market", "supply", "clinic"], routeTriggers) * 7
      );
    case NpcFaction.Infected:
      return (
        threat * 0.18 +
        alertness * 0.08 +
        scoreListOverlap(["alarm", "noise", "panic"], routeTriggers) * 7 +
        (context.timeSlice === NpcTimeSlice.Night ? 8 : 0)
      );
  }
}

function scheduleAffinityScore(
  definition: NpcDefinition,
  context: NpcScheduleContext,
): number {
  const schedule = definition.schedule;
  const mapMatch = matchesMapTags(schedule.mapTags, context.mapTags) ? 6 : -8;
  const triggerMatch =
    scoreListOverlap(schedule.routeTriggers, context.routeTriggers) * 5;
  const dayMatch = isDayAllowed(schedule.days, context.day) ? 6 : -20;
  const timeMatch = isTimeSliceAllowed(schedule.timeSlice, context.timeSlice)
    ? TIME_SLICE_BONUS[schedule.timeSlice]
    : -10;
  const threatMatch =
    context.threatLevel < schedule.minThreatLevel ||
    context.threatLevel > schedule.maxThreatLevel
      ? -30
      : 8;

  return mapMatch + triggerMatch + dayMatch + timeMatch + threatMatch;
}

function stateBonus(state: NpcState): number {
  switch (state) {
    case NpcState.Defend:
    case NpcState.Trade:
      return 6;
    case NpcState.Investigate:
    case NpcState.Travel:
      return 4;
    case NpcState.Interact:
      return 3;
    case NpcState.Flee:
      return 1;
    case NpcState.Idle:
      return 2;
    case NpcState.Infected:
      return 8;
  }
}

function getScriptedEvent(
  context: NpcScheduleContext,
): NpcDecisionContext["scriptedEvent"] {
  const triggers = context.routeTriggers;
  if (triggers.includes("raid")) return "raid";
  if (triggers.includes("blockade")) return "blockade";
  if (triggers.includes("rescue")) return "rescue";
  if (triggers.includes("market")) return "market";
  if (triggers.includes("alarm")) return "alert";
  return "none";
}

function buildDecisionContext(
  definition: NpcDefinition,
  context: NpcScheduleContext,
): NpcDecisionContext {
  return {
    faction: definition.faction,
    role: definition.role,
    reputation: context.reputation,
    dangerLevel: context.threatLevel,
    day: context.day,
    timeSlice: context.timeSlice,
    nearbyZombies: Math.max(0, Math.round(context.threatLevel / 20)),
    playerProximity: context.isSafeZone ? 32 : 12,
    isSafeZone: context.isSafeZone ?? false,
    scriptedEvent: getScriptedEvent(context),
  };
}

function scoreNpcDefinition(
  definition: NpcDefinition,
  context: NpcScheduleContext,
): number {
  if (definition.spawn.requiredFaction !== definition.faction) {
    return Number.NEGATIVE_INFINITY;
  }

  if (definition.spawn.requiresSafeZone && !context.isSafeZone) {
    return Number.NEGATIVE_INFINITY;
  }

  const scheduleScore = scheduleAffinityScore(definition, context);
  if (scheduleScore <= -20) {
    return Number.NEGATIVE_INFINITY;
  }

  const behaviorState = resolveNpcState(
    definition.behavior,
    buildDecisionContext(definition, context),
  );

  return (
    definition.spawn.weight +
    rarityScore(definition.spawn.rarity) +
    scheduleScore +
    factionAffinityScore(definition, context) +
    stateBonus(behaviorState)
  );
}

function getDefaultSpawnZoneList(): NpcSpawnZone[] {
  return [DEFAULT_SPAWN_ZONE];
}

function resolveSpawnZoneList(context: NpcScheduleContext): NpcSpawnZone[] {
  const sanitized = (context.spawnZones ?? [])
    .map((zone) => sanitizeSpawnZone(zone))
    .filter((zone): zone is NpcSpawnZone => zone !== null);

  return sanitized.length > 0 ? sanitized : getDefaultSpawnZoneList();
}

export function sanitizeSpawnZone(zone: unknown): NpcSpawnZone | null {
  if (typeof zone !== "string") {
    return null;
  }

  const normalized = zone.trim();
  return VALID_SPAWN_ZONES.includes(normalized as NpcSpawnZone)
    ? (normalized as NpcSpawnZone)
    : null;
}

export function selectNpcArchetypes(
  context: NpcScheduleContext,
  catalog: ReadonlyArray<NpcCatalogEntry> = NPC_ARCHETYPES,
): NpcArchetypeSelection[] {
  const normalizedContext = normalizeScheduleContext(context);

  return catalog
    .map((entry) => createNpcDefinition(entry))
    .map((definition) => ({
      definition,
      score: scoreNpcDefinition(definition, normalizedContext),
    }))
    .filter((selection) => selection.score !== Number.NEGATIVE_INFINITY)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.definition.id.localeCompare(b.definition.id);
    });
}

export function buildNpcSpawnPlan(
  context: NpcScheduleContext,
  catalog: ReadonlyArray<NpcCatalogEntry> = NPC_ARCHETYPES,
): NpcSpawnPlan[] {
  const normalizedContext = normalizeScheduleContext(context);
  const selected = selectNpcArchetypes(normalizedContext, catalog);
  if (selected.length === 0) {
    return [];
  }

  const spawnZones = resolveSpawnZoneList(normalizedContext);
  const limit = Math.min(
    normalizedContext.limit ?? selected.length,
    selected.length,
  );
  const primaryZone = spawnZones[0] ?? DEFAULT_SPAWN_ZONE;

  return selected.slice(0, limit).map((selection) => ({
    ...selection,
    spawnZone: primaryZone,
    state: resolveNpcState(
      selection.definition.behavior,
      buildDecisionContext(selection.definition, normalizedContext),
    ),
  }));
}
