export interface CoopTargetable {
  id: number;
  x: number;
  y: number;
}

function sortTargets(targets: CoopTargetable[]): CoopTargetable[] {
  return [...targets].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.x !== b.x) return a.x - b.x;
    return a.id - b.id;
  });
}

export function resolveTargetId(
  targets: CoopTargetable[],
  currentTargetId: number | null,
): number | null {
  if (targets.length === 0) return null;
  if (currentTargetId !== null && targets.some((target) => target.id === currentTargetId)) {
    return currentTargetId;
  }

  return sortTargets(targets)[0]?.id ?? null;
}

export function cycleTargetId(
  targets: CoopTargetable[],
  currentTargetId: number | null,
  direction: "next" | "previous",
): number | null {
  if (targets.length === 0) return null;

  const orderedTargets = sortTargets(targets);
  const currentIndex = orderedTargets.findIndex(
    (target) => target.id === currentTargetId,
  );

  if (currentIndex === -1) {
    return direction === "next"
      ? orderedTargets[0]?.id ?? null
      : orderedTargets[orderedTargets.length - 1]?.id ?? null;
  }

  const delta = direction === "next" ? 1 : -1;
  const nextIndex =
    (currentIndex + delta + orderedTargets.length) % orderedTargets.length;
  return orderedTargets[nextIndex]?.id ?? null;
}
