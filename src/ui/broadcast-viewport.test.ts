import { describe, expect, it } from "vitest";
import { resolveBroadcastViewportContext } from "./broadcast-viewport";

describe("resolveBroadcastViewportContext", () => {
  it("keeps the full chrome on wide desktop screens", () => {
    const context = resolveBroadcastViewportContext(1440, 900, false);

    expect(context.mode).toBe("desktop");
    expect(context.isCompact).toBe(false);
    expect(context.showBreakingBlock).toBe(true);
    expect(context.showDatetime).toBe(true);
    expect(context.uiScale).toBe(1);
  });

  it("collapses into compact mode for narrow screens", () => {
    const context = resolveBroadcastViewportContext(820, 680, false);

    expect(context.mode).toBe("compact");
    expect(context.isCompact).toBe(true);
    expect(context.showBreakingBlock).toBe(false);
    expect(context.showDatetime).toBe(false);
    expect(context.uiScale).toBeGreaterThan(1);
  });

  it("uses portrait mode for touch-first phones", () => {
    const context = resolveBroadcastViewportContext(390, 844, true);

    expect(context.mode).toBe("portrait");
    expect(context.isPortrait).toBe(true);
    expect(context.touchPrimary).toBe(true);
    expect(context.showFullscreenButton).toBe(false);
  });
});
