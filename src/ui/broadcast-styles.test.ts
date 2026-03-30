import { describe, expect, it } from "vitest";
import { BC, BROADCAST_FONT } from "./broadcast-styles";

describe("broadcast-styles", () => {
  describe("BC color palette", () => {
    it("should export hex integers for Phaser fill colors", () => {
      expect(BC.BG).toBe(0x070a10);
      expect(BC.CHROME).toBe(0x0e1118);
      expect(BC.CHROME_LIT).toBe(0x161a24);
      expect(BC.CHROME_EDGE).toBe(0x1e222e);
      expect(BC.RED).toBe(0xcc1100);
      expect(BC.RED_GLOW).toBe(0xff2a10);
      expect(BC.RED_DIM).toBe(0x6b0a00);
      expect(BC.GOLD).toBe(0xd4a828);
      expect(BC.GOLD_DIM).toBe(0x7a6218);
      expect(BC.GREEN).toBe(0x22aa44);
      expect(BC.AMBER).toBe(0xcc8822);
    });

    it("should export CSS color strings for Phaser text colors", () => {
      expect(BC.TEXT).toBe("#d8d0c4");
      expect(BC.TEXT_DIM).toBe("#6a645c");
      expect(BC.TEXT_MUTED).toBe("#3a3630");
    });
  });

  describe("BROADCAST_FONT", () => {
    it("should use Barlow Condensed with fallbacks", () => {
      expect(BROADCAST_FONT).toBe(
        "'Barlow Condensed', 'Arial Narrow', sans-serif",
      );
    });
  });

  describe("BC hex string helpers", () => {
    it("should provide CSS hex strings for fill colors via BC.css", () => {
      expect(BC.css.RED).toBe("#cc1100");
      expect(BC.css.GOLD).toBe("#d4a828");
      expect(BC.css.GREEN).toBe("#22aa44");
      expect(BC.css.AMBER).toBe("#cc8822");
      expect(BC.css.RED_GLOW).toBe("#ff2a10");
      expect(BC.css.RED_DIM).toBe("#6b0a00");
      expect(BC.css.GOLD_DIM).toBe("#7a6218");
      expect(BC.css.GOLD_GLOW).toBe("#ffcc44");
      expect(BC.css.GREEN_BRIGHT).toBe("#22ee66");
    });
  });
});
