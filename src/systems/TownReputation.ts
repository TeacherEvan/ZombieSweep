export interface TownReputation {
  trust: number;
  collateral: number;
  alertness: number;
}

export type TownReputationInput = Partial<TownReputation>;

const DEFAULT_TOWN_REPUTATION: TownReputation = {
  trust: 50,
  collateral: 0,
  alertness: 0,
};

function coerceNumber(value: unknown, fallback: number): number {
  if (
    typeof value !== "number" ||
    Number.isNaN(value) ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return value;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeValue(value: unknown, fallback: number): number {
  return clamp(coerceNumber(value, fallback));
}

function shiftTownReputation(
  reputation: TownReputation,
  trustDelta: number,
  collateralDelta: number,
  alertnessDelta: number,
): TownReputation {
  return normalizeTownReputation({
    trust: reputation.trust + trustDelta,
    collateral: reputation.collateral + collateralDelta,
    alertness: reputation.alertness + alertnessDelta,
  });
}

export function normalizeTownReputation(
  reputation?: TownReputationInput | null,
): TownReputation {
  return {
    trust: normalizeValue(reputation?.trust, DEFAULT_TOWN_REPUTATION.trust),
    collateral: normalizeValue(
      reputation?.collateral,
      DEFAULT_TOWN_REPUTATION.collateral,
    ),
    alertness: normalizeValue(
      reputation?.alertness,
      DEFAULT_TOWN_REPUTATION.alertness,
    ),
  };
}

export function createTownReputation(
  reputation?: TownReputationInput,
): TownReputation {
  return normalizeTownReputation(reputation);
}

export function recordDeliverySuccess(
  reputation: TownReputation,
  amount = 1,
): TownReputation {
  const safeAmount = Math.max(1, Math.trunc(amount));
  return shiftTownReputation(reputation, safeAmount * 8, 0, safeAmount * -4);
}

export function recordCollateralDamage(
  reputation: TownReputation,
  amount = 1,
): TownReputation {
  const safeAmount = Math.max(1, Math.trunc(amount));
  return shiftTownReputation(
    reputation,
    safeAmount * -12,
    safeAmount * 10,
    safeAmount * 8,
  );
}

export function recordThreatSighting(
  reputation: TownReputation,
  amount = 1,
): TownReputation {
  const safeAmount = Math.max(1, Math.trunc(amount));
  return shiftTownReputation(reputation, 0, 0, safeAmount * 10);
}
