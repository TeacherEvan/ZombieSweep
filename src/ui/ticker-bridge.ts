// ── Ticker Bridge ──
// Pushes "BREAKING NEWS" headlines from the Phaser game to the HTML news ticker.
// The DOM ticker scrolls via CSS animation; we prepend urgent items with a
// brief highlight flash that fades after one scroll cycle.

const URGENT_CLASS = "ticker-urgent";
const TICKER_ID = "ticker-scroll";
const FLASH_DURATION_MS = 4000;

/**
 * Push a breaking headline into the scrolling ticker bar.
 * Appears at the front of the scroll with a brief red-highlight flash.
 */
export function pushHeadline(text: string): void {
  const container = document.getElementById(TICKER_ID);
  if (!container) return;

  // Separator diamond
  const sep = document.createElement("span");
  sep.className = "sep";
  sep.textContent = "\u25C6";

  // Headline span with urgent highlight
  const span = document.createElement("span");
  span.textContent = text.toUpperCase();
  span.classList.add(URGENT_CLASS);

  // Insert at the start of the ticker (after first child or at beginning)
  const first = container.firstChild;
  if (first) {
    container.insertBefore(span, first);
    container.insertBefore(sep, span.nextSibling);
  } else {
    container.appendChild(span);
  }

  // Remove highlight after a few seconds so it blends back in
  setTimeout(() => {
    span.classList.remove(URGENT_CLASS);
  }, FLASH_DURATION_MS);
}

// ── Canned headline pools for game events ──

const DELIVERY_HEADLINES = [
  "NEWSPAPER DELIVERED SUCCESSFULLY — SUBSCRIBER MORALE HOLDING STEADY",
  "PAPER ON THE PORCH — COURIER MAINTAINS PERFECT AIM UNDER PRESSURE",
  "DELIVERY CONFIRMED — INFORMATION STILL REACHES THE LIVING",
  "SUCCESSFUL DROP — RESIDENTS GRATEFUL FOR CONTINUED SERVICE",
];

const ZOMBIE_KILL_HEADLINES = [
  "UNDEAD THREAT NEUTRALIZED — ROUTE SECURED MOMENTARILY",
  "ZOMBIE DOWN — COURIER DEMONSTRATES COMBAT READINESS",
  "HOSTILE ELIMINATED IN RESIDENTIAL ZONE — CLEANUP CREWS NOTIFIED",
  "CONFIRMED KILL — ONE LESS THREAT ON THE STREETS",
];

const LIFE_LOST_HEADLINES = [
  "COURIER SUSTAINS INJURIES — MEDICAL TEAM ON STANDBY",
  "CARRIER DOWN BRIEFLY — BACKUP UNIT DEPLOYED",
  "COURIER HIT — REMAINING CREW BRACING FOR CONTINUED OPERATIONS",
];

const PERFECT_DAY_HEADLINES = [
  "★ PERFECT DELIVERY DAY — EVERY SUBSCRIBER REACHED — OUTSTANDING SERVICE",
  "★ FLAWLESS ROUTE — NOT A SINGLE MISSED DELIVERY — REMARKABLE",
  "★ 100% DELIVERY RATE — TRI-COUNTY RECORD UNDER ZOMBIE CONDITIONS",
];

const GAME_START_HEADLINES = [
  "DISPATCH CONFIRMS: COURIER EN ROUTE — ALL STATIONS MONITOR",
  "NEW CARRIER ENTERING THE FIELD — WZMB 13 TRACKING LIVE",
  "ROUTE ASSIGNMENT ACTIVE — NEWSPAPERS LOADED, WEAPONS READY",
];

const GAME_OVER_HEADLINES = [
  "SIGNAL LOST — COURIER STATUS UNKNOWN — SEARCH TEAMS DISPATCHED",
  "TRANSMISSION ENDED — FINAL SCORE BEING TALLIED",
];

const VICTORY_HEADLINES = [
  "★ COURIER SURVIVES FULL WEEK — OPERATION COMPLETE — EXTRAORDINARY",
  "★ ALL 7 DAYS SURVIVED — TRI-COUNTY SALUTES THIS CARRIER",
];

function pickRandom(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function headlineDelivery(): void {
  pushHeadline(pickRandom(DELIVERY_HEADLINES));
}

export function headlineZombieKill(): void {
  pushHeadline(pickRandom(ZOMBIE_KILL_HEADLINES));
}

export function headlineLifeLost(): void {
  pushHeadline(pickRandom(LIFE_LOST_HEADLINES));
}

export function headlinePerfectDay(): void {
  pushHeadline(pickRandom(PERFECT_DAY_HEADLINES));
}

export function headlineGameStart(): void {
  pushHeadline(pickRandom(GAME_START_HEADLINES));
}

export function headlineGameOver(): void {
  pushHeadline(pickRandom(GAME_OVER_HEADLINES));
}

export function headlineVictory(): void {
  pushHeadline(pickRandom(VICTORY_HEADLINES));
}
