import {
  NpcBehaviorProfile,
  NpcFaction,
  NpcRole,
  NpcState,
  NpcTimeSlice,
} from "../entities/Npc";
import { TownReputation, normalizeTownReputation } from "./TownReputation";

export type NpcScriptedEvent =
  | "none"
  | "alert"
  | "rescue"
  | "market"
  | "raid"
  | "blockade";

export interface NpcDecisionContext {
  faction: NpcFaction;
  role: NpcRole;
  reputation: TownReputation;
  dangerLevel: number;
  day: number;
  timeSlice: NpcTimeSlice;
  nearbyZombies?: number;
  playerProximity?: number;
  isSafeZone?: boolean;
  scriptedEvent?: NpcScriptedEvent;
}

const DAY_PRESSURE_BONUS = 5;
const NIGHT_PRESSURE_BONUS = 10;

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeNumber(value: unknown, fallback: number): number {
  if (
    typeof value !== "number" ||
    Number.isNaN(value) ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return value;
}

function normalizeContext(context: NpcDecisionContext): NpcDecisionContext {
  return {
    ...context,
    dangerLevel: clamp(sanitizeNumber(context.dangerLevel, 0)),
    day: clamp(sanitizeNumber(context.day, 1), 1, 7),
    nearbyZombies: clamp(sanitizeNumber(context.nearbyZombies ?? 0, 0)),
    playerProximity: clamp(sanitizeNumber(context.playerProximity ?? 100, 100)),
    isSafeZone: context.isSafeZone ?? false,
    scriptedEvent: context.scriptedEvent ?? "none",
    reputation: normalizeTownReputation(context.reputation),
  };
}

function getRoleBias(role: NpcRole): number {
  switch (role) {
    case NpcRole.Civilian:
      return 12;
    case NpcRole.Guard:
      return -6;
    case NpcRole.Merchant:
      return 4;
    case NpcRole.Scavenger:
      return 0;
    case NpcRole.Medic:
      return -3;
    case NpcRole.Raider:
      return 8;
    case NpcRole.Shambler:
    case NpcRole.Runner:
    case NpcRole.Spitter:
      return 0;
  }
}

function getScriptedEventBias(event: NpcScriptedEvent): number {
  switch (event) {
    case "raid":
      return 20;
    case "blockade":
      return 16;
    case "alert":
      return 10;
    case "rescue":
      return -8;
    case "market":
      return -10;
    case "none":
    default:
      return 0;
  }
}

export function calculateNpcPressure(context: NpcDecisionContext): number {
  const safeContext = normalizeContext(context);
  const nearbyZombies = safeContext.nearbyZombies ?? 0;
  const playerProximity = safeContext.playerProximity ?? 100;
  const isSafeZone = safeContext.isSafeZone ?? false;
  const scriptedEvent = safeContext.scriptedEvent ?? "none";
  const timeSliceBias =
    safeContext.timeSlice === NpcTimeSlice.Night
      ? NIGHT_PRESSURE_BONUS
      : safeContext.timeSlice === NpcTimeSlice.Evening
        ? DAY_PRESSURE_BONUS
        : 0;
  const dayBias = safeContext.day >= 6 ? 6 : safeContext.day >= 4 ? 3 : 0;
  const zombieBias = nearbyZombies * 12;
  const trustBias = Math.max(0, 60 - safeContext.reputation.trust) * 0.5;
  const alertBias = safeContext.reputation.alertness * 0.5;
  const proximityBias = playerProximity <= 24 ? 8 : 0;
  const safeZoneBias = isSafeZone ? -12 : 0;
  const roleBias = getRoleBias(safeContext.role);
  const eventBias = getScriptedEventBias(scriptedEvent);

  return clamp(
    safeContext.dangerLevel +
      timeSliceBias +
      dayBias +
      zombieBias +
      trustBias +
      alertBias +
      proximityBias +
      safeZoneBias +
      roleBias +
      eventBias,
  );
}

function choosePreferredState(
  behavior: Partial<NpcBehaviorProfile> | undefined,
  candidates: NpcState[],
  fallback: NpcState,
): NpcState {
  if (!behavior) {
    return fallback;
  }

  const preferredStates = Array.isArray(behavior.preferredStates)
    ? behavior.preferredStates.filter((state): state is NpcState =>
        Object.values(NpcState).includes(state),
      )
    : [];

  for (const candidate of candidates) {
    if (preferredStates.includes(candidate)) {
      return candidate;
    }
  }

  return fallback;
}

export function resolveNpcState(
  behavior: Partial<NpcBehaviorProfile> | undefined,
  context: NpcDecisionContext,
): NpcState {
  const safeContext = normalizeContext(context);
  const nearbyZombies = safeContext.nearbyZombies ?? 0;
  const playerProximity = safeContext.playerProximity ?? 100;
  const isSafeZone = safeContext.isSafeZone ?? false;
  const scriptedEvent = safeContext.scriptedEvent ?? "none";
  const pressure = calculateNpcPressure(safeContext);

  if (safeContext.faction === NpcFaction.Infected) {
    if (behavior?.defaultState === NpcState.Infected) {
      return NpcState.Infected;
    }

    return NpcState.Infected;
  }

  if (!behavior) {
    return pressure >= 55 ? NpcState.Flee : NpcState.Idle;
  }

  if (safeContext.faction === NpcFaction.Survivor) {
    if (pressure >= 70) {
      return choosePreferredState(behavior, [NpcState.Flee], NpcState.Flee);
    }

    if (playerProximity <= 20 && safeContext.reputation.trust >= 45) {
      return choosePreferredState(
        behavior,
        [NpcState.Interact, NpcState.Travel],
        NpcState.Idle,
      );
    }

    return choosePreferredState(
      behavior,
      [NpcState.Idle, NpcState.Travel, NpcState.Interact],
      NpcState.Idle,
    );
  }

  if (safeContext.faction === NpcFaction.Trader) {
    if (!isSafeZone || pressure >= 40) {
      return choosePreferredState(behavior, [NpcState.Flee], NpcState.Flee);
    }

    if (safeContext.reputation.trust >= 40 && pressure <= 25) {
      return choosePreferredState(behavior, [NpcState.Trade], NpcState.Trade);
    }

    return choosePreferredState(
      behavior,
      [NpcState.Interact, NpcState.Travel, NpcState.Trade],
      NpcState.Trade,
    );
  }

  if (safeContext.faction === NpcFaction.Responder) {
    if (pressure >= 75) {
      return choosePreferredState(behavior, [NpcState.Flee], NpcState.Flee);
    }

    if (scriptedEvent === "rescue" || nearbyZombies >= 1 || pressure >= 35) {
      return choosePreferredState(
        behavior,
        [NpcState.Investigate, NpcState.Defend],
        NpcState.Travel,
      );
    }

    return choosePreferredState(
      behavior,
      [NpcState.Travel, NpcState.Interact, NpcState.Investigate],
      NpcState.Travel,
    );
  }

  if (safeContext.faction === NpcFaction.HostileHuman) {
    if (
      scriptedEvent === "raid" ||
      scriptedEvent === "blockade" ||
      pressure >= 50
    ) {
      return choosePreferredState(
        behavior,
        [NpcState.Defend, NpcState.Investigate],
        NpcState.Defend,
      );
    }

    if (pressure >= 30 || safeContext.reputation.trust <= 25) {
      return choosePreferredState(
        behavior,
        [NpcState.Investigate, NpcState.Defend],
        NpcState.Investigate,
      );
    }

    return choosePreferredState(
      behavior,
      [NpcState.Travel, NpcState.Investigate],
      NpcState.Investigate,
    );
  }

  return pressure >= 55 ? NpcState.Flee : NpcState.Idle;
}
