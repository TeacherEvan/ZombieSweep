export type BroadcastViewportMode =
  | "desktop"
  | "tablet"
  | "compact"
  | "portrait";

export interface BroadcastViewportContext {
  width: number;
  height: number;
  aspectRatio: number;
  mode: BroadcastViewportMode;
  touchPrimary: boolean;
  isPortrait: boolean;
  isCompact: boolean;
  uiScale: number;
  showBreakingBlock: boolean;
  showTicker: boolean;
  showDatetime: boolean;
  showFullscreenButton: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function detectTouchPrimary(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

export function resolveBroadcastViewportContext(
  width: number,
  height: number,
  touchPrimary: boolean,
): BroadcastViewportContext {
  const aspectRatio = width / Math.max(height, 1);
  const isPortrait = height > width;
  const isCompact = touchPrimary || width < 880 || height < 700;
  const isTablet = !isCompact && width < 1180;

  const mode: BroadcastViewportMode =
    touchPrimary && isPortrait
      ? "portrait"
      : isCompact
        ? "compact"
        : isTablet
          ? "tablet"
          : "desktop";

  const uiScale = clamp(
    Math.max(960 / Math.max(width, 1), 540 / Math.max(height, 1)),
    1,
    2,
  );

  return {
    width,
    height,
    aspectRatio,
    mode,
    touchPrimary,
    isPortrait,
    isCompact,
    uiScale,
    showBreakingBlock: mode === "desktop" || mode === "tablet",
    showTicker: true,
    showDatetime: mode === "desktop" || mode === "tablet",
    showFullscreenButton: width >= 420,
  };
}

export function syncBroadcastViewportContext(
  target?: HTMLElement,
): BroadcastViewportContext {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return resolveBroadcastViewportContext(1280, 720, false);
  }

  const root = target ?? document.documentElement;
  const context = resolveBroadcastViewportContext(
    window.innerWidth,
    window.innerHeight,
    detectTouchPrimary(),
  );

  root.dataset.broadcastMode = context.mode;
  root.dataset.broadcastOrientation = context.isPortrait
    ? "portrait"
    : "landscape";
  root.dataset.broadcastTouch = context.touchPrimary ? "touch" : "pointer";
  root.dataset.broadcastCompact = context.isCompact ? "true" : "false";
  root.style.setProperty("--broadcast-ui-scale", `${context.uiScale}`);

  return context;
}
