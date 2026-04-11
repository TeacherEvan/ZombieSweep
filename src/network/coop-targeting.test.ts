import { describe, expect, it } from "vitest";

import { cycleTargetId, resolveTargetId } from "./coop-targeting";

describe("coop-targeting", () => {
  const targets = [
    { id: 3, x: 500, y: 300 },
    { id: 1, x: 200, y: 180 },
    { id: 2, x: 700, y: 180 },
  ];

  it("chooses the top-most stable target when nothing is selected", () => {
    expect(resolveTargetId(targets, null)).toBe(1);
  });

  it("keeps the current target when it still exists", () => {
    expect(resolveTargetId(targets, 2)).toBe(2);
  });

  it("falls back when the current target disappears", () => {
    expect(resolveTargetId(targets, 999)).toBe(1);
  });

  it("cycles forward through targets with wraparound", () => {
    expect(cycleTargetId(targets, 1, "next")).toBe(2);
    expect(cycleTargetId(targets, 2, "next")).toBe(3);
    expect(cycleTargetId(targets, 3, "next")).toBe(1);
  });

  it("cycles backward through targets with wraparound", () => {
    expect(cycleTargetId(targets, 1, "previous")).toBe(3);
    expect(cycleTargetId(targets, 3, "previous")).toBe(2);
  });

  it("returns null when there are no targets", () => {
    expect(resolveTargetId([], null)).toBeNull();
    expect(cycleTargetId([], null, "next")).toBeNull();
  });
});
