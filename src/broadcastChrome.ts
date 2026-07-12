// Broadcast chrome: console easter egg, clock, news ticker, fullscreen, loading messages.
// Loaded as an ES module so it satisfies the strict Content-Security-Policy
// (`script-src 'self'`) instead of requiring `unsafe-inline`.

/* ── Console Easter Egg ── */
console.info(
  '%c WZMB 13 %c TRI-COUNTY EMERGENCY BROADCAST NETWORK ',
  'background: #cc1100; color: #fff; font-weight: 800; font-size: 16px; padding: 4px 8px;',
  'background: #0e1118; color: #d8d0c4; font-weight: 600; font-size: 12px; padding: 4px 8px;'
);
console.info(
  "%cThis broadcast is classified. If you can read this, you're either a developer or a very resourceful survivor.\n\nZombieSweep — github.com\nBuilt with Phaser 3 + TypeScript + Vite\n\n🧟 Stay alert. Deliver papers. Stay alive.",
  'color: #6a645c; font-family: "Barlow Condensed", sans-serif; font-size: 12px; line-height: 1.6;'
);

/* ── Broadcast clock ── */
(function updateClock() {
  const el = document.getElementById('broadcast-time');
  if (!el) return;
  function tick() {
    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    const pad = (n: number) => String(n).padStart(2, '0');
    el!.textContent =
      `${days[now.getDay()]} ${months[now.getMonth()]} ${now.getDate()}` +
      ` • ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }
  tick();
  setInterval(tick, 1000);
})();

/* ── News ticker ── */
(function initTicker() {
  const headlines = [
    'ZOMBIE SIGHTINGS SURGE IN MAPLE GROVE — RESIDENTS URGED TO BARRICADE HOMES AFTER DUSK',
    'NATIONAL GUARD ESTABLISHES PERIMETER AROUND DOWNTOWN DEADWOOD — SUPPLY DROPS SCHEDULED TUESDAY',
    'CDC ADVISORY: BASEBALL BATS AND MACHETES RATED "HIGHLY EFFECTIVE" AGAINST UNDEAD THREATS',
    'LOCAL NEWSPAPER CARRIERS HAILED AS HEROES — "THE PAPERS MUST GO THROUGH" SAYS ROUTE SUPERVISOR',
    'RUST CREEK BRIDGE COLLAPSE TRAPS SURVIVORS — RESCUE OPERATIONS UNDERWAY',
    'SUNDAY EDITION NOW 3X NORMAL WEIGHT — CARRIERS REPORT INCREASED ZOMBIE DETERRENT EFFECTIVENESS',
    'TRI-COUNTY AMATEUR RADIO NETWORK BROADCASTS SAFE ZONE COORDINATES — TUNE TO 145.230 MHZ',
    'SKATEBOARD MILITIA CLEARS ROUTE 7 CORRIDOR — MACHETE SALES UP 400% AT REMAINING HARDWARE STORES',
  ];
  const container = document.getElementById('ticker-scroll');
  if (!container) return;
  // Build ticker using DOM methods (defense-in-depth against injection)
  for (let copy = 0; copy < 2; copy++) {
    headlines.forEach((headline, i) => {
      if (i > 0 || copy > 0) {
        const sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = '◆';
        container.appendChild(sep);
      }
      const span = document.createElement('span');
      span.textContent = headline;
      container.appendChild(span);
    });
  }
})();

/* ── Fullscreen toggle ── */
document.getElementById('fs-btn')?.addEventListener('click', function () {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

/* ── Rotating loading messages ── */
(function rotateLoadMessages() {
  const messages = [
    'ACQUIRING SATELLITE FEED',
    'CALIBRATING ZOMBIE DETECTION ARRAYS',
    'LOADING NEWSPAPER INVENTORY',
    'ESTABLISHING PERIMETER COMMUNICATIONS',
    'TRIANGULATING CARRIER POSITION',
    'SCANNING FOR UNDEAD SIGNATURES',
    'WARMING UP THE PRINTING PRESS',
    'BRIEFING DISPATCH OPERATIONS',
    'TUNING EMERGENCY BROADCAST FREQUENCY',
    'ARMING DELIVERY VEHICLE',
  ];
  const el = document.getElementById('load-message');
  if (!el) return;
  let idx = 0;
  setInterval(function () {
    idx = (idx + 1) % messages.length;
    el.textContent = messages[idx];
  }, 2800);
})();

/* ── Service Worker Registration (PWA) ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
