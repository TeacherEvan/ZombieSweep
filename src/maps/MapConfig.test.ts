import { describe, expect, it } from "vitest";
import { DensityLevel, MapName, MAPS } from "./MapConfig";

describe("Map configs", () => {
  it("defines three maps", () => {
    expect(Object.keys(MAPS)).toHaveLength(3);
  });

  describe("MapleGrove", () => {
    it("has suburban theme", () => {
      expect(MAPS[MapName.MapleGrove].theme).toBe("suburban");
    });

    it("has low zombie density", () => {
      expect(MAPS[MapName.MapleGrove].zombieDensity).toBe("low");
    });

    it("has low hazard density", () => {
      expect(MAPS[MapName.MapleGrove].hazardDensity).toBe("low");
    });

    it("has wide streets", () => {
      expect(MAPS[MapName.MapleGrove].streetWidth).toBeGreaterThanOrEqual(6);
    });
  });

  describe("DowntownDeadwood", () => {
    it("has urban theme", () => {
      expect(MAPS[MapName.DowntownDeadwood].theme).toBe("urban");
    });

    it("has medium zombie density", () => {
      expect(MAPS[MapName.DowntownDeadwood].zombieDensity).toBe("medium");
    });

    it("has narrower streets than MapleGrove", () => {
      expect(MAPS[MapName.DowntownDeadwood].streetWidth).toBeLessThan(
        MAPS[MapName.MapleGrove].streetWidth,
      );
    });
  });

  describe("RustCreek", () => {
    it("has industrial theme", () => {
      expect(MAPS[MapName.RustCreek].theme).toBe("industrial");
    });

    it("has high zombie density", () => {
      expect(MAPS[MapName.RustCreek].zombieDensity).toBe("high");
    });

    it("has high hazard density", () => {
      expect(MAPS[MapName.RustCreek].hazardDensity).toBe("high");
    });
  });

  describe("map progression balance", () => {
    it("DowntownDeadwood has the narrowest streets", () => {
      expect(MAPS[MapName.DowntownDeadwood].streetWidth).toBeLessThanOrEqual(
        MAPS[MapName.MapleGrove].streetWidth,
      );
      expect(MAPS[MapName.DowntownDeadwood].streetWidth).toBeLessThanOrEqual(
        MAPS[MapName.RustCreek].streetWidth,
      );
    });

    it("zombie density escalates across maps", () => {
      const densityRank: Record<DensityLevel, number> = { low: 1, medium: 2, high: 3 };
      const mg = densityRank[MAPS[MapName.MapleGrove].zombieDensity];
      const dd = densityRank[MAPS[MapName.DowntownDeadwood].zombieDensity];
      const rc = densityRank[MAPS[MapName.RustCreek].zombieDensity];
      expect(mg).toBeLessThan(dd);
      expect(dd).toBeLessThan(rc);
    });

    it("all maps have a human-readable name", () => {
      for (const key of Object.keys(MAPS)) {
        expect(MAPS[key as MapName].name).toBeDefined();
        expect(MAPS[key as MapName].name.length).toBeGreaterThan(0);
      }
    });
  });
});
