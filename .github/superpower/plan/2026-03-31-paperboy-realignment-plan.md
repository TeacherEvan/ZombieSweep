# Paperboy Realignment — Detailed Recovery Plan

**Goal:** Re-center ZombieSweep around a readable, Paperboy-inspired delivery loop while preserving the zombie theme as secondary pressure rather than the primary gameplay identity.

**Prompt source:** Follow-up to the gameplay audit identifying three requested planning tracks.

1. Mechanics rollback plan
2. File-by-file refactor strategy
3. Minimum viable code-change path

**Current diagnosis:** The project still preserves Paperboy-style meta progression (subscribers, days, route summaries, perfect day bonuses), but the live route loop is now dominated by combat verbs, wave pressure, ammo, and survival-reactive tuning. The route exists, but the player’s moment-to-moment attention is pulled toward fighting, not delivering.

**Primary files involved:**

- `src/scenes/GameScene.ts`
- `src/scenes/arcade-rules.ts`
- `src/maps/MapGenerator.ts`
- `src/entities/House.ts`
- `src/entities/Citizen.ts`
- `src/entities/Zombie.ts`
- `src/entities/Newspaper.ts`
- `src/config/vehicles.ts`
- `src/weapons/Weapon.ts`
- `src/systems/ScoreManager.ts`
- `src/ui/HUD.ts`
- `src/scenes/VehicleSelectScene.ts`
- `src/scenes/TrainingScene.ts`
- `src/scenes/ScoreSummaryScene.ts`
- `README.md`

---

## Part 1 — Mechanics Rollback / Realignment Plan

### North star

Restore these Paperboy-like priorities in order:

1. **Route readability** — the player should understand where to ride, where to throw, and what is coming next.
2. **Delivery precision** — success should come from timing and placement, not mainly combat survival.
3. **Neighborhood consequence** — subscribers, property, and public reaction should matter more than kill chains.
4. **Thematic zombie pressure** — zombies should complicate the route, not replace it.

### Non-negotiable design rules

- Delivery is the primary scoring engine.
- Combat is optional, situational, or defensive — not the main source of mastery.
- Route speed should create pressure, but not panic stacking.
- Citizens should reinforce neighborhood texture and consequences, not add chaotic punishment loops.
- Vehicles should feel like courier styles first, combat classes second.

### Phase A — Freeze the combat-first drift

**Purpose:** Stop reinforcing the wrong player behavior before adding any new delivery detail.

#### Phase A actions

- Reduce zombie kill score relevance dramatically.
- Remove or heavily downweight combo-based combat scoring during route play.
- Prevent route success from depending on frequent melee/ranged use.
- Reduce live zombie pressure from continuous waves to sparse interruptions or fixed encounters.
- Remove any positive reward loop that can come from harming citizens.
- Stop delivery success from accelerating the route so strongly that good play becomes overwhelming.

#### Phase A intended effect

The player should no longer feel that the optimal route strategy is to maintain combat control and farm kills while surviving auto-scroll escalation.

#### Phase A acceptance criteria

- The player can finish a route mainly by steering, throwing, and avoiding danger.
- A strong route performance is possible without using melee or ranged combat frequently.
- The emotional rhythm shifts from “survive the swarm” to “keep the route together.”

### Phase B — Restore the route as the core game space

**Purpose:** Make the route itself carry the gameplay again.

#### Phase B actions

- Rework route pacing so houses, hazards, and citizens form recognizable patterns.
- Re-center player movement around forward route commitment and lateral correction.
- Keep auto-scroll steady and readable rather than aggressively compounding with success.
- Space houses and hazards to create timing problems, not ambient clutter.
- Make subscriber vs. non-subscriber reads faster and more visually legible.

#### Phase B intended effect

The player should feel like they are riding through a neighborhood with escalating delivery challenges, not drifting around an action arena with scenery.

#### Phase B acceptance criteria

- Houses create visible delivery decisions before the player reaches them.
- The route can be learned, read, and improved through replay.
- Misses feel like timing/accuracy failures, not random chaos losses.

### Phase C — Make delivery targets concrete

**Purpose:** Turn “mailbox” and “porch” from abstract scoring labels into recognizable spatial targets.

#### Phase C actions

- Add explicit mailbox/porch target offsets or delivery zones to house data.
- Different house types should create different delivery windows.
- Telegraph hard deliveries visually through layout or house affordances.
- Add clearer feedback for near-miss, porch hit, mailbox hit, and property damage.

#### Phase C intended effect

A player should be able to say, “I hit the mailbox,” because they actually read and aimed for a specific spot.

#### Phase C acceptance criteria

- Delivery outcome is explainable from the playfield, not only hidden threshold math.
- Harder houses create tighter but fairer aiming windows.
- Subscriber delivery success depends more on route line and timing than combat cleanup.

### Phase D — Simplify NPC and citizen pressure

**Purpose:** Keep neighborhood life without making civilians another frantic punishment channel.

#### Phase D actions

- Recast citizens as ambient blockers, witnesses, or light-reactive route texture.
- Remove pickup rewards from hitting citizens.
- Reduce direct citizen collision/throw penalties if they create unavoidable punishment spirals.
- Reserve retaliatory or threatening human behavior for authored moments, not constant route clutter.

#### Phase D intended effect

Citizens should help the world feel alive and judgmental, not become an awkward side-loot and penalty minigame.

#### Phase D acceptance criteria

- Citizens make delivery lines more interesting, not more arbitrary.
- Harming civilians is clearly bad and never secretly beneficial.
- Civilian presence reinforces neighborhood stakes instead of action-game noise.

### Phase E — Reframe vehicles and tools

**Purpose:** Make vehicle identity about delivery feel and route style.

#### Phase E actions

- Prioritize speed, control, stability, throw comfort, and hazard recovery over weapon fantasy.
- Keep emergency self-defense only if it supports the route rather than replacing it.
- Reframe skateboard, bicycle, and rollerblades around courier archetypes, not combat classes.
- Demote or hide ammo if it no longer belongs in the player’s primary mental model.

#### Phase E intended effect

Vehicle selection becomes a delivery style choice:

- safe and steady
- fast but risky
- agile and technical

#### Phase E acceptance criteria

- Players choose vehicles for route feel first.
- Vehicle differences produce different delivery lines and hazard responses.
- Combat loadout is no longer the main differentiator on the select screen.

### Phase F — Reintroduce zombies as thematic pressure

**Purpose:** Preserve the zombie identity without letting it dominate the route.

#### Phase F actions

- Replace constant wave pressure with a smaller number of route-specific zombie interruptions.
- Use zombies to block lines, threaten houses, or force timing decisions.
- Favor “avoid / outmaneuver / quickly clear” over “fight for 30 seconds.”
- Reserve large threat spikes for late-week or authored set-piece moments.

#### Phase F intended effect

Zombies become the thing that makes newspaper delivery terrifying and funny — not the thing that turns the game into a horde-combat route shooter.

#### Phase F acceptance criteria

- Zombie encounters are memorable and legible.
- Routes remain readable even when zombies appear.
- The best player stories are still about saves, throws, and route recovery.

---

## Part 2 — File-by-File Refactor Strategy

This section maps the recovery to specific files and their responsibilities.

### `src/scenes/GameScene.ts`

**Current issue:** This file currently contains the full identity collision: movement, auto-scroll, deliveries, waves, melee, ranged attacks, kill combos, citizens, hazards, pickups, and route progression all compete inside one loop.

**Refactor strategy:**

- Make delivery the dominant loop.
- Reduce active combat responsibilities during route play.
- Split internal responsibilities conceptually into:
  - route pacing
  - delivery resolution
  - light obstacle interactions
  - limited zombie encounters
- Remove or demote features that constantly ask for combat attention.
- Keep the scene as the live orchestrator, but make it consume simpler rules from helper modules.

**Expected result:** `GameScene` becomes a delivery scene with zombie complications, not a survival-combat scene with delivery side objectives.

### `src/scenes/arcade-rules.ts`

**Current issue:** This helper centralizes compounding scroll pressure, wave pressure, and vehicle response in a way that reinforces the action-survival loop.

**Refactor strategy:**

- Keep delivery classification helpers.
- Rebalance route speed toward stable readability.
- Replace wave escalation logic with sparse encounter pacing or optional route threat rules.
- Add courier-centric helper logic such as:
  - route speed tiers
  - throw/readability tolerances
  - delivery assist windows
  - hazard recovery tuning

**Expected result:** This module becomes the “Paperboy feel” tuning surface instead of the “survival escalation” tuning surface.

### `src/maps/MapGenerator.ts`

**Current issue:** The route is too generic and formulaic to carry strong delivery identity.

**Refactor strategy:**

- Generate more readable route rhythms.
- Bias house spacing and hazard placement into intentional sequences.
- Introduce lane-like beats, safe gaps, and challenge clusters.
- Eventually support explicit delivery target metadata per house.

**Expected result:** The route itself teaches timing and becomes memorable.

### `src/entities/House.ts`

**Current issue:** Houses know difficulty and breakables, but not enough about physical delivery targets.

**Refactor strategy:**

- Add mailbox / porch target metadata.
- Add clearer delivery-affordance fields if needed.
- Keep house types differentiated through target shape and timing windows.

**Expected result:** Delivery classification becomes more physical and less abstract.

### `src/entities/Newspaper.ts`

**Current issue:** Newspapers are mostly projectiles with simple left/right travel logic.

**Refactor strategy:**

- Keep the data model light.
- If needed, add fields for arc profile, target intent, or delivery assist classification.
- Ensure newspaper behavior supports precision throws rather than combat projectile identity.

**Expected result:** Papers feel like delivery tools first.

### `src/entities/Citizen.ts`

**Current issue:** Citizens currently act as score penalties and in one case a pickup reward source when hit.

**Refactor strategy:**

- Remove any reward for harming citizens.
- Recast citizens into ambient or reactive neighborhood roles.
- Use citizen types to affect route texture, subscriber atmosphere, or public consequence.

**Expected result:** Citizens become neighborhood context rather than punishment-loot oddities.

### `src/entities/Zombie.ts`

**Current issue:** Zombie archetypes are simple and effective, but their route role is too dominant because of the live spawning model in `GameScene`.

**Refactor strategy:**

- Keep the archetypes.
- Rebalance their route usage through spawn/orchestration logic rather than entity complexity.
- Use them as blockers, threats to houses, or sudden route disruptions instead of default swarm pressure.

**Expected result:** Zombies remain flavorful while no longer owning the loop.

### `src/config/vehicles.ts`

**Current issue:** Vehicle identity is heavily tied to melee/ranged weapon loadouts.

**Refactor strategy:**

- Reframe values around courier handling and throw comfort.
- If combat tools remain, demote them to secondary stats.
- Consider adding courier-facing data fields later, such as throw stability or hazard recovery.

**Expected result:** Vehicles feel like route styles, not combat classes.

### `src/weapons/Weapon.ts`

**Current issue:** Cleanly implemented, but currently supports the wrong gameplay emphasis.

**Refactor strategy:**

- Keep the module if emergency defense remains in the game.
- If route combat is minimized, keep weapons simple and situational.
- Avoid expanding this system until the delivery loop is back in control.

**Expected result:** The weapon system stops growing into the core of the game.

### `src/systems/ScoreManager.ts`

**Current issue:** Delivery still matters, but combat and combo incentives are now meaningfully reinforced.

**Refactor strategy:**

- Make deliveries, subscriber retention, perfect days, and clean routes overwhelmingly dominant in the score economy.
- Reduce kill scoring to light flavor or emergency reward only.
- Ensure score logic does not encourage combat farming.

**Expected result:** The optimal score strategy returns to skilled delivery.

### `src/ui/HUD.ts`

**Current issue:** The HUD currently gives ammo a first-class presence, reinforcing combat attention.

**Refactor strategy:**

- Prioritize route progress, paper count, subscribers, score, and day.
- Demote or hide ammo unless a vehicle/tool truly needs it.
- Surface route urgency and delivery quality more than combat resources.

**Expected result:** The HUD tells the player what matters most.

### `src/scenes/VehicleSelectScene.ts`

**Current issue:** Vehicle choice is presented as a combat loadout decision.

**Refactor strategy:**

- Replace weapon-forward messaging with courier-forward messaging.
- Surface route feel, recovery, speed, and delivery style.
- Leave thematic flavor intact without making weapons the headline.

**Expected result:** Vehicle select sets the right expectation before play starts.

### `src/scenes/TrainingScene.ts`

**Current issue:** It functions as a good bonus phase, but currently remains close to target/ramp score-chasing rather than delivery mastery.

**Refactor strategy:**

- Shift it toward throw timing, obstacle reading, and precision delivery drills.
- Keep the arcade break feel, but train the route skills that actually matter.

**Expected result:** Bonus/training scenes reinforce the correct mastery loop.

### `src/scenes/ScoreSummaryScene.ts`

**Current issue:** This scene is one of the healthier Paperboy-aligned parts already.

**Refactor strategy:**

- Preserve the subscriber loss/gain logic.
- Expand delivery accuracy reporting if needed.
- Keep perfect-day celebration as a major emotional beat.

**Expected result:** Summary remains a strong anchor for the restored design.

### `src/config/constants.ts` and `src/config/difficulty.ts`

**Current issue:** These files still support the classic loop, but they now coexist with combat-heavy values.

**Refactor strategy:**

- Rebalance point values so delivery overwhelmingly matters.
- Reduce difficulty scaling that intensifies chaos faster than readability.
- Keep week progression but tune for clarity and fairness.

**Expected result:** The constants stop pushing the game toward overload.

### Tests to update or expand

- `src/scenes/arcade-rules.test.ts`
- `src/weapons/Weapon.test.ts`
- `src/maps/MapGenerator.test.ts`
- `src/systems/ScoreManager.test.ts`
- `src/entities/House.test.ts`
- `src/entities/Citizen.test.ts`

**Test focus:**

- delivery remains dominant
- route speed stays readable
- combat rewards are secondary
- citizens no longer create contradictory incentives
- route generation stays deterministic while becoming more authored in feel

---

## Part 3 — Minimum Viable Code-Change Path

This is the lowest-risk path to restore a stronger Paperboy feel **without** deleting the zombie theme or rewriting the whole game immediately.

### Step 0 — Re-establish a clean baseline

**Files:**

- `src/weapons/Weapon.test.ts`
- `src/config/vehicles.ts`

**Actions:**

- Resolve the current ranged-weapon expectation drift so tests match current config or config matches intended balance.
- Do not proceed with large feel changes on top of a known failing test suite.

**Why first:**

The current failing test is a small but concrete sign that combat tuning is drifting without a stable contract.

### Step 1 — Stop combat from being the highest-value loop

**Files:**

- `src/scenes/GameScene.ts`
- `src/systems/ScoreManager.ts`
- `src/config/constants.ts`

**Actions:**

- Remove or heavily reduce combo scoring for zombie kills during route play.
- Reduce kill points so deliveries and perfect days dwarf combat score.
- Avoid rewarding the player for lingering in combat-heavy situations.

**Minimal implementation target:**

- Keep zombies.
- Keep emergency self-defense.
- Stop telling the player that kill chaining is the smart way to play.

### Step 2 — Flatten the route pressure curve

**Files:**

- `src/scenes/arcade-rules.ts`
- `src/scenes/GameScene.ts`

**Actions:**

- Remove or sharply reduce delivery-based route speed acceleration.
- Lower live route speed variance between early and late route states.
- Replace recurring zombie wave logic with a much sparser encounter cadence.

**Minimal implementation target:**

- The player should feel steady forward pressure, not compounding panic.

### Step 3 — Demote route combat inputs without deleting them yet

**Files:**

- `src/scenes/GameScene.ts`
- `src/ui/HUD.ts`

**Actions:**

- Either disable ranged attack in the route temporarily or make it rare, low-impact, and clearly secondary.
- Keep melee as an emergency “clear space” action only if needed.
- Reduce HUD emphasis on ammo so the route mental model is papers + subscribers + hazards.

**Minimal implementation target:**

- The player still can defend themselves in a pinch.
- They are no longer invited to play the route like a shooter.

### Step 4 — Remove contradictory citizen incentives

**Files:**

- `src/entities/Citizen.ts`
- `src/scenes/GameScene.ts`
- `src/systems/ScoreManager.ts`

**Actions:**

- Remove the newspaper pickup reward from hitting friendly citizens.
- Simplify citizen reactions to “bad outcome” or “ambient disruption” only.
- Ensure citizens are not a profitable target in any circumstance.

**Minimal implementation target:**

- Hitting civilians is always bad or at least clearly undesirable.

### Step 5 — Reframe the vehicle fantasy in UI before rewriting the data model deeply

**Files:**

- `src/scenes/VehicleSelectScene.ts`
- optionally `src/config/vehicles.ts`

**Actions:**

- Keep current vehicle stats if needed for now.
- Change presentation so the player reads vehicle identity as courier feel rather than weapons loadout.
- Emphasize speed / control / stability / route style before weapons.

**Minimal implementation target:**

- Even before deeper refactors, the game stops introducing itself as a combat class selector.

### Step 6 — Make houses the real targets again

**Files:**

- `src/entities/House.ts`
- `src/scenes/arcade-rules.ts`
- `src/scenes/GameScene.ts`

**Actions:**

- Add explicit or semi-explicit mailbox/porch offsets.
- Keep existing difficulty bands, but anchor them in visible layout.
- Improve feedback for mailbox vs porch vs miss vs property damage.

**Minimal implementation target:**

- Delivery outcomes feel spatial and intentional, not merely threshold-based around a house center.

### Step 7 — Improve route readability before adding more content

**Files:**

- `src/maps/MapGenerator.ts`
- `src/scenes/GameScene.ts`

**Actions:**

- Use cleaner house spacing patterns.
- Create safer gaps between challenge clusters.
- Reduce clutter overlap between hazards, citizens, pickups, and zombie interruptions.

**Minimal implementation target:**

- The route becomes legible enough that skill improvement comes from reading it better.

### Step 8 — Rebuild training around actual route mastery

**Files:**

- `src/scenes/TrainingScene.ts`

**Actions:**

- Keep the short bonus-course energy.
- Shift target/ramp practice toward delivery timing and route-related skills.

**Minimal implementation target:**

- The bonus/training scene reinforces the route game the player is actually supposed to master.

---

## Execution Order Recommendation

If this plan is implemented, execute in this order:

1. Stabilize test baseline.
2. Reduce combat scoring and wave pressure.
3. Flatten route speed escalation.
4. Simplify citizens and remove contradictory incentives.
5. Reframe UI/HUD/vehicle messaging.
6. Improve delivery target clarity.
7. Improve route generation readability.
8. Re-tune training and polish summaries.

This order gives the fastest return toward a Paperboy feel without requiring a full rewrite up front.

---

## Verification Criteria

The realignment is successful when these statements are true:

- Most route decisions are about line choice, timing, and throw accuracy.
- Deliveries are the main source of score and success.
- Missing subscribers hurts more than skipping fights.
- Zombies create interruptions, not the dominant gameplay loop.
- The HUD and vehicle select screens teach the correct priorities.
- A player can explain failure in delivery terms, not only survival terms.

---

## Recommended First Milestone

**Milestone name:** `Paperboy Feel Recovery — Route First`

**Scope:**

- fix the current failing combat-balance test
- lower combat score priority
- flatten scroll pressure
- reduce zombie wave frequency/intensity
- remove citizen reward-on-hit behavior
- demote ammo/weapon emphasis in route-facing UI

This milestone should be small enough to ship safely and large enough to make the route feel materially different.

---

## Handoff

After approval, this plan can be turned into either:

- a step-by-step execution plan for implementation
- a smaller milestone plan focused only on the minimum viable code-change path
- a file-by-file work queue for incremental commits
