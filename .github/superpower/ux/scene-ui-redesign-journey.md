# User Journey: Scene UI Broadcast Redesign

## User Persona

- **Who**: Casual web gamer, 18–35, discovers ZombieSweep via link share or Vercel deploy
- **Goal**: Play a fun arcade game in the browser, enjoy the retro zombie fiction
- **Context**: Desktop browser, 10–30 min sessions, keyboard controls
- **Success Metric**: Player feels immersed from load to game over; remembers the game's aesthetic

## Journey Stages

### Stage 1: First Load (Loading Overlay → Welcome)

- **Doing**: Watches WZMB 13 loading screen, reads disclaimer, waits for game
- **Thinking**: "This is cool — it looks like an actual emergency broadcast"
- **Feeling**: Intrigued, entertained by the fiction
- **Current pain**: Loading overlay is great, but Welcome scene feels like a different app
- **Opportunity**: Welcome scene should feel like the broadcast "going live" — a breaking news cold open that continues the WZMB 13 fiction seamlessly

#### Design Direction — WelcomeScene as "Breaking News Intro"

The loading overlay dissolves and we're LIVE. The Welcome scene should read as:

> "This is WZMB 13 with a breaking report. The zombie threat has reached critical levels. A courier has been dispatched."

**Visual framing:**

- **Lower third chyron** with the game title styled as a news story slug: `ZOMBIESWEEP: COURIER DISPATCH OPERATION`
- **Anchor desk-style layout** — title text left-aligned, not centered. Asymmetric composition.
- **"Signal static" texture** behind menu area, not a generic dark background
- **Menu items styled as broadcast options**: not floating rectangles, but text rows with left accent bars, like a teleprompter list
- **Font**: Barlow Condensed throughout (matching the wrapper). No Impact, no Courier New.
- **Zombie silhouettes** at bottom are good — keep but overlay a "LIVE FIELD CAM" label

### Stage 2: Vehicle Selection

- **Doing**: Choosing between Bicycle, Roller Blades, Skateboard
- **Thinking**: "What's the difference? Which one should I pick?"
- **Feeling**: Excited to customize, wants to compare quickly
- **Current pain**: Three centered cards with colored stripes — functional but generic
- **Opportunity**: Frame as a **field equipment briefing** or fleet dispatch report

#### Design Direction — VehicleSelectScene as "Fleet Dispatch"

The broadcast framing: a field correspondent reports on available vehicles.

**Visual framing:**

- **Screen title as chyron**: `FLEET STATUS: AVAILABLE UNITS` in a lower-third style bar
- **Vehicle cards** reimagined as **dossier panels** — left-aligned info blocks, not centered cards
- **Stat bars** become broadcast-style data bars (think election results / polling graphics)
- **Selected vehicle** gets a "SELECTED" stamp or highlight bar, not just scale-up
- **Weapon info** shown as equipment manifest lines, not emoji-prefixed text
- **Left sidebar accent** with vehicle color, not a top stripe
- **Transition**: when confirmed, a brief "DISPATCHING UNIT" flash before scene change

### Stage 3: Difficulty Selection

- **Doing**: Choosing Easy Street / Middle Road / Hard Way
- **Thinking**: "How hard do I want this? What's the reward?"
- **Feeling**: Weighing risk vs reward, slight tension
- **Current pain**: Three horizontal rows with skull icons — ok but doesn't leverage the broadcast
- **Opportunity**: Frame as a **WZMB 13 Threat Level Advisory**

#### Design Direction — DifficultySelectScene as "Threat Advisory"

The broadcast framing: WZMB 13 issues a zombie threat level advisory.

**Visual framing:**

- **Title**: `ZOMBIE THREAT ADVISORY` in chyron style
- **Difficulty options** styled as threat levels with broadcast color-coding:
  - Green (LOW) / Amber (ELEVATED) / Red (SEVERE)
- **Full-width bars** that feel like a government alert system, not cards
- **Left-side threat level indicator** — colored vertical bar + level label
- **Right-side details** — point multiplier and density info
- **Selected level gets a pulsing border** and "CONFIRMED" treatment
- **Broadcast tone**: serious advisory, like a weather warning

### Stage 4: Gameplay (HUD)

- **Doing**: Playing the game — delivering papers, fighting zombies
- **Thinking**: "How many papers do I have? Score? Lives?"
- **Feeling**: Focused, adrenaline, quick-glance info needs
- **Current pain**: Small dark panel in corner with labels + values — functional but disconnected from broadcast
- **Opportunity**: Style HUD as a **live broadcast data overlay**

#### Design Direction — HUD as "Live Broadcast Overlay"

**Visual framing:**

- **Lower-third style** data strip instead of a corner box
- Or a **top-bar style** info strip matching the WZMB 13 top bar aesthetic
- **Left accent bar** (red, matching station branding)
- **Data in pairs**: label small/dim, value large/bright — like sports score overlays
- **Score changes** flash briefly (the way sports scores pulse on broadcast)
- **Lives as dots** (like the LIVE indicator dot), not emoji hearts
- **Font**: Barlow Condensed — consistent with wrapper

### Stage 5: Score Summary (End of Day)

- **Doing**: Reviewing delivery stats, subscription changes, score
- **Thinking**: "How did I do? Did I gain or lose subscribers?"
- **Feeling**: Anticipation (good day?), satisfaction or frustration
- **Current pain**: Gold-themed stats list, centered layout, functional but reads like a spreadsheet
- **Opportunity**: Frame as an **end-of-day news recap** / anchor desk report

#### Design Direction — ScoreSummaryScene as "News Recap"

The broadcast framing: the WZMB 13 evening recap.

**Visual framing:**

- **Title chyron**: `DAY [N] REPORT — ROUTE STATUS` in lower-third bar
- **Delivery stats** shown as a broadcast results graphic (left labels, right values, horizontal rules between rows)
- **Subscription changes** announced with urgency — gains are `BREAKING: +1 NEW SUBSCRIBER`, losses are `ALERT: -2 SUBSCRIBERS CANCELLED`
- **Perfect day** treated as a special report banner
- **Score** shown in a large broadcast-style number box
- **"Continue" prompt** styled as `NEXT BROADCAST IN...` or `PRESS ENTER TO CONTINUE COVERAGE`

### Stage 6: Game Over / Victory

- **Doing**: Seeing final results, deciding whether to play again
- **Thinking**: Victory — "Nice, I survived the week!" / Defeat — "I want to try again"
- **Feeling**: Victory — satisfaction, accomplishment. Defeat — frustration, determination
- **Current pain**: Standard game over screen with score count-up and play again buttons
- **Opportunity**: Two distinct broadcast endings

#### Design Direction — GameOverScene as "Broadcast Finale"

**Victory path: "Mission Accomplished" broadcast**

- Station wraps up with a victory report
- `WZMB 13 SPECIAL REPORT: COURIER SURVIVES FULL WEEK`
- Triumphant gold accent, stats presented as an "End of Operation" summary
- Score count-up with broadcast-style number animation

**Defeat path: "Signal Lost"**

- Screen goes to static / noise
- `SIGNAL LOST` or `WE'VE LOST CONTACT WITH THE COURIER`
- Brief moment of broadcast failure aesthetic — then results fade in
- Reason shown as a news crawl: `COURIER DOWN: OUT OF LIVES` or `ALL SUBSCRIBERS CANCELLED`
- Restart option: `ATTEMPT TO RE-ESTABLISH CONTACT`

### Stage 7: Pause Menu

- **Doing**: Pausing mid-game
- **Thinking**: "I need a break" or "How do I quit?"
- **Feeling**: Neutral, wants quick access to resume/quit
- **Current pain**: Dark overlay with centered panel — standard pause menu
- **Opportunity**: **"Technical Difficulties"** or **"Standby"** screen

#### Design Direction — PauseMenu as "Technical Difficulties"

- `PLEASE STAND BY — TECHNICAL DIFFICULTIES`
- Classic broadcast test pattern or color bars aesthetic (subtle, background)
- Resume and Quit options styled as broadcast controls
- Simple, fast, doesn't break immersion
