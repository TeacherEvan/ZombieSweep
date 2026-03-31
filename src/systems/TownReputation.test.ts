import { describe, expect, it } from "vitest";
import {
  createTownReputation,
  normalizeTownReputation,
  recordCollateralDamage,
  recordDeliverySuccess,
  recordThreatSighting,
} from "./TownReputation";

describe("TownReputation", () => {
  it("starts at a calm baseline", () => {
    expect(createTownReputation()).toEqual({
      trust: 50,
      collateral: 0,
      alertness: 0,
    });
  });

  it("delivery success increases trust", () => {
    const before = createTownReputation();
    const after = recordDeliverySuccess(before, 2);

    expect(after.trust).toBeGreaterThan(before.trust);
    expect(after.collateral).toBe(before.collateral);
    expect(after.alertness).toBeLessThanOrEqual(before.alertness);
  });

  it("collateral damage lowers trust and raises collateral", () => {
    const before = createTownReputation();
    const after = recordCollateralDamage(before, 3);

    expect(after.trust).toBeLessThan(before.trust);
    expect(after.collateral).toBeGreaterThan(before.collateral);
    expect(after.alertness).toBeGreaterThanOrEqual(before.alertness);
  });

  it("threat sightings raise alertness", () => {
    const before = createTownReputation();
    const after = recordThreatSighting(before, 4);

    expect(after.alertness).toBeGreaterThan(before.alertness);
  });

  it("normalizes invalid reputation values into safe bounds", () => {
    const rep = normalizeTownReputation({
      trust: 999,
      collateral: -12,
      alertness: Number.NaN,
    });

    expect(rep.trust).toBeLessThanOrEqual(100);
    expect(rep.trust).toBeGreaterThanOrEqual(0);
    expect(rep.collateral).toBeGreaterThanOrEqual(0);
    expect(rep.alertness).toBeGreaterThanOrEqual(0);
  });
});
