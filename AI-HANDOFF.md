# Pacific Watch — AI Handoff

Read `AGENTS.md` before acting on anything in this file.

This file tracks active collaboration between **Claude Code** and **ChatGPT Codex**.
It is intentionally lightweight and is **not** authoritative architecture documentation.
Durable technical decisions belong in `AGENTS.md`.

---

## Current Work

### CLAIM — F002 severity model, with F004 folded in

**Agent:** Claude Code
**Branch:** `claude/f002-severity-model`
**Claimed:** 2026-09-06, before any edit. First use of the claim-before-editing rule.

**Status:** Implemented, in review on PR #7.

**Scope — what I am touching:**
- `getBadgeClass()` → replaced by a product-type tier model
- `renderAlerts()` — badge class, badge text, and ordering
- `updateHazardBanner()` — the `severe` count and headline wording
- `.s-dot.warn` / `.s-dot.alert` CSS and a `prefers-reduced-motion` block (F004)
- `AGENTS.md` severity documentation; a new `test/severity-model.test.js`

**Scope — what I am NOT touching:** the source-health engine, retention, any fetch function, `api/news.js`, the News Sources toggles (F003 stays unclaimed and free).

**Empirical basis, from the live feed during Hurricane Lowell:**

```
event                             severity   urgency    certainty
Tropical Storm Warning            Severe     Immediate  Likely
Flood Watch                       Severe     Future     Possible
High Surf Advisory                Minor      Expected   Likely
Tropical Cyclone Local Statement  Moderate   Expected   Likely
```

**`severity: Severe` covers both a Tropical Storm Warning and a Flood Watch.** Severity alone provably cannot separate act-now from be-prepared — this is not a styling preference, it is the field carrying less information than the UI needs. `getBadgeClass()` tests `severity === 'Severe'` before anything else, so a Flood Watch currently renders with the same `badge-alert` class *and* the same literal `SEVERE` text as a Tropical Storm Warning.

Note that CAP `urgency` does draw the distinction (Immediate vs Future), and the product type in the event name draws it explicitly. The plan is to tier on product type — the classification NWS itself publishes and the public is trained on — with severity retained only as a safety-biased override so an `Extreme` product can never be under-ranked.

---

### Phase 1 — Source Health & Freshness

**Status:** **Complete** — merged in #5 (`6750553`) and verified live on production.

**Owner:** delivered jointly — contract by ChatGPT Codex, implementation by Claude Code, reviewed both ways.

**Requested next owner:** Claude Code — implementation review, then implementation if the contract is sound

**Goal:** Pacific Watch must communicate whether each machine-readable source is current, stale, or unavailable; preserve useful last-known-good data during transient failures; and never allow a failed refresh to leave stale information looking current.

**Specification:** [`PHASE1-SOURCE-HEALTH.md`](PHASE1-SOURCE-HEALTH.md)

Core proposed states:

- `loading` — first request not complete
- `current` — latest request succeeded
- `stale` — latest request failed, but last-known-good data is retained
- `unavailable` — no usable last-known-good data remains

Tracked sources proposed for Phase 1:

- NWS Alerts
- NWS Observations / Weather
- NOAA CO-OPS Tides
- USGS Earthquakes
- FEMA Declarations
- News (`/api/news`)

Link-outs such as Shelter, PowerOutage.us, and direct PTWC reference are excluded from source health because Pacific Watch does not fetch them.

**Safety-critical rule:** an NWS Alerts refresh failure must never leave or create a current-looking `ALL CLEAR`. If retained alerts exist, keep them visible and mark them stale; if the previous verified state contained no alerts, show degraded/stale alert status instead of all-clear until NWS is successfully verified again.

**Codex proposal requiring Claude review:** default stale expiry of 30 minutes, centralized source health under `S.sourceHealth`, no new polling calls, and a compact aggregate source-status UI rather than a full v2 redesign.

---

### Phase 0 — Trust Corrections

**Status:** Complete — merged in #2 (`ccd9a2c`) and visually verified on production.

Durable Phase 0 semantics are now documented in `AGENTS.md`. The key outcome is that `ok` means verified, never unknown; fabricated all-clear/healthy states were removed; and link-outs without machine-readable data no longer claim status.

---

### F003 — seven Settings toggles do nothing

**Status:** Not started. Unclaimed.

**Found by:** the user, while looking for the Data Sources card.

Every toggle under **News Sources** is `onclick="this.classList.toggle('on')"`. It flips a CSS class and nothing reads it — `grep` for any news-source preference returns nothing. Turning off Star-Advertiser does not stop Star-Advertiser headlines appearing.

This is the Phase 0 defect class applied to controls rather than indicators: the UI asserts a capability it does not have. It is arguably worse than a false label, because a user can *act* on it and reasonably believe the setting took effect.

**Two honest options, both defensible:**

1. **Implement it.** `/api/news` already knows each item's source, so it could accept a source filter, or the client could filter the merged list. Persist to `localStorage` alongside `pw_theme`. This is real work but a real feature.
2. **Remove the toggles.** Show the outlet list as information rather than controls.

What is not acceptable is leaving them. Needs a product decision before implementation.

**Already fixed in PR #5:** the *Live Data* card had the same problem and additionally contradicted the new Data Sources card — three hardcoded `Live` labels updated by no code, plus an inert Auto-refresh toggle. Removed, since Data Sources now reports the real state of all six feeds. Note that if the Auto-refresh control is ever wanted back it must actually gate the interval, and it is worth asking whether an emergency dashboard should offer to stop refreshing at all.

---

### Follow-ups identified during Phase 0

**F001 — `unknown` needs a shape difference, not only a colour difference. — IMPLEMENTED in PR #5.**
Folded into Phase 1 rather than kept separate, since the source-health UI needed non-colour semantics anyway and shipping a colour-only version first would have meant touching the same CSS twice. `.s-dot.unknown` is now a hollow ring (`box-shadow:inset 0 0 0 1.5px`, transparent fill) and `.src-state-unavailable` is outlined rather than filled. Dots were also raised from 5px to 6px so the ring has a visible interior. The rule is recorded in `AGENTS.md` as a third accessibility constraint, and the CSS is protected by a load-bearing-decisions row so it is not later "simplified" back to a fill.

**Legibility confirmed by the user on the Vercel preview**, using the stat bar as an A/B: Tide had succeeded (filled `ok`) while Rain and Wind had failed (hollow `unknown`), three dots in one row. Verdict:

> "I can tell the difference between an empty dot and a filled dot, but I have to lean in to see the color."

Shape reads at a glance; hue does not. That is exactly the outcome F001 was aiming for, so **F001 is closed** — and the second half of that sentence is a new finding, raised as F004.

**F004 — `ok` and `warn` dots differ by hue alone; `alert` relies on unguarded motion. — FIXED in PR #7.**

**Found by:** the user, confirming F001 — "I have to lean in to see the color."

That sentence is a defect report for the states F001 did not touch. Current encoding:

| State | Fill | Second channel |
|---|---|---|
| `unknown` | hollow ring | **shape** |
| `ok` | steel blue | none |
| `warn` | amber | none |
| `alert` | vermilion | pulse animation |

`ok` and `warn` are both static filled circles at 6px separated only by hue, which the user has now confirmed is not readable at a glance. This violates the constraint added to `AGENTS.md` during Phase 1 — verification state is never carried by colour alone — by code that predates the rule. Recording that honestly rather than pretending the rule is satisfied.

`alert` does have a second channel, but it is `animation: pulse` and there is **no `prefers-reduced-motion` guard anywhere in the file**. For a user with reduced motion enabled, `alert` becomes a static filled circle too, and all three filled states collapse to hue alone — in the hazard channel, not the freshness one. The same applies to `.hazard-pulse` on the banner.

**Suggested fix, as a focused follow-up rather than more scope on Phase 1:**
- Give `warn` a second channel that is not colour or motion — a ring plus centre dot, or a half-fill.
- Add a `@media (prefers-reduced-motion: reduce)` block that stops the pulse and substitutes a static non-colour treatment, so `alert` keeps a second channel for those users.
- Consider 7-8px dots. The user could resolve shape but not hue at 6px, which suggests the dots are simply below the size where a small hue difference registers peripherally.

Not a Phase 1 blocker: F001 covered verification state, which now works. This is hazard state and belongs with F002 / the severity model, where the warn-vs-alert distinction is the whole subject.

---

**F002 — watches and warnings currently render too similarly. — FIXED in PR #7.**
NWS `severity` alone flattens distinctions such as Flood Watch vs Tropical Storm Warning. This remains queued for the later severity-model work; do not mix it into Phase 1 unless required for source-health correctness.

---

## Active Branches

| Agent | Branch | Work | Status |
|---|---|---|---|
| Claude Code | `claude/multi-agent-setup` | Multi-agent collaboration setup | Merged (#1) |
| Claude Code | `claude/phase0-trust-corrections` | Phase 0 trust corrections | Merged (#2) |
| ChatGPT Codex | `codex/phase1-source-health` | Phase 1 source-health specification | Ready for Claude review |

---

## Open Questions

### Q002 — Phase 1 stale thresholds

**Raised by:** ChatGPT Codex

**Question:** Is a 30-minute stale expiry defensible for all six tracked sources, or should thresholds be source-specific based on expected update cadence and operational meaning?

**Codex recommendation:** Start with 30 minutes as a centralized default because the app refreshes every five minutes, but use source-specific values if Claude identifies a concrete correctness reason. Thresholds must not be scattered through fetch functions.

**Decision:** **Source-specific, declared in the source registry.** A single 30-minute number is wrong in both directions at once.

- **NWS Alerts: 30 minutes is unsafe.** Warnings are issued, extended and cancelled on minute timescales. Presenting a 29-minute-old alert set as usable during a fast-moving event is exactly the misleading case Phase 0 existed to remove. Set to 6 min fresh / 10 min stale.
- **FEMA: 30 minutes is absurdly short.** Declarations change over days, so a 30-minute expiry would mark a perfectly usable source Unavailable within one missed cycle and train users to ignore the indicator. Set to 6 hr fresh / 24 hr stale.

Your "must not be scattered" requirement is met by declaring `freshMs` / `staleMs` as fields **on each source in `S.sourceHealth`**, so they sit beside the source they govern and cannot leak into fetch bodies.

| Source | Fresh | Stale |
|---|---|---|
| NWS Alerts | 6 min | 10 min |
| NWS Observations | 10 min | 30 min |
| NOAA Tides | 15 min | 45 min |
| USGS Earthquakes | 15 min | 60 min |
| FEMA Declarations | 6 hr | 24 hr |
| News | 15 min | 60 min |

Covered by tests: FEMA at 12 minutes is `current` where a global 30-minute rule would already have called it `unavailable`.

### Q003 — Where should source-health state live?

**Raised by:** ChatGPT Codex

**Question:** Should Phase 1 use a centralized `S.sourceHealth` object, or couple health metadata to per-source caches?

**Codex recommendation:** Prefer centralized metadata unless retaining per-source last-known-good data makes co-location materially simpler.

**Decision:** **Centralised health, separate cache, same keys.** `S.sourceHealth[key]` holds only metadata; `S.cache[key]` holds last-known-good.

Co-locating them would force every fetch to understand the health model in order to store its data, which is how the Phase 0 bug spread across six functions in the first place. Keeping them apart means health logic stays uniform and testable while retention stays explicit and greppable.

**One thing the spec did not anticipate:** weather, tides and earthquakes are fetched *per island*, so their retained data is only valid for the island it was captured on. Serving Kauaʻi's retained tide reading while the user is viewing Maui would be a new category of wrong data — arguably worse than showing nothing. Cache entries are therefore stamped with `island` and `usableCache()` refuses a cross-island hit for the three island-scoped sources. Covered by tests.

### Q004 — Should the repo carry automated tests?

**Raised by:** Claude Code

**Context:** Phase 1 has 14 acceptance criteria, most of which are pure logic and cheap to verify automatically. I wrote `test/phase1-source-health.test.js`, which extracts the health functions and the expiry predicate straight out of `index.html` and exercises them — 25 assertions, no dependencies, no runner, `npm test`.

**Question:** Keep it, or is a `test/` directory unwanted structure in a deliberately build-step-free project?

**Claude recommendation:** Keep it. It needs no dependency and no build, so it costs nothing against the project's constraints, and it is currently the only automated check that any of this behaviour is right. It found nothing broken this round, but it is what makes the threshold and retention claims in this PR checkable rather than asserted.

**Decision:** **Accepted by Codex.** A dependency-free `npm test` protecting these safety semantics is worth the small amount of repo structure. Condition attached and honoured: the `package.json` patch adds the `test` script only, with no reformatting of the existing keys.

---

### Q001 — Dedicated PTWC source

**Status:** Reframed / low priority.

Pacific Watch already receives PTWC tsunami products through the NWS alerts feed. A direct PTWC feed would be redundancy/latency improvement, not baseline coverage. Phase 1 should not depend on solving this.

---

## Review Queue

| PR | Author | Review requested from | Purpose |
|---|---|---|---|
| — | — | — | — |

---

## Handoff Log

Newest entries first.

### 2026-09-06 — F002 severity model implemented, F004 folded in

**From:** Claude Code
**To:** ChatGPT Codex

#### The defect, established from data rather than argued
Pulled the live feed before designing anything. During Hurricane Lowell, `api.weather.gov` returned:

| event | severity | urgency | certainty |
|---|---|---|---|
| Tropical Storm Warning | Severe | Immediate | Likely |
| Flood Watch | **Severe** | Future | Possible |
| High Surf Advisory | Minor | Expected | Likely |
| Tropical Cyclone Local Statement | Moderate | Expected | Likely |

`severity: Severe` covers **both** a Tropical Storm Warning and a Flood Watch. Severity provably cannot separate act-now from be-prepared. `getBadgeClass()` tested `severity === 'Severe'` first, so a Flood Watch rendered with the same red badge *and the same literal text `SEVERE`* as a Tropical Storm Warning — flattening the one distinction NWS most wants read, live on production during a hurricane.

#### What changed
- **`ALERT_TIERS` + `alertTier()`** replace `getBadgeClass()`. Tier comes from the NWS product type in `event` — the classification NWS publishes and the public is trained on. Severity survives only as a safety-biased override so an `Extreme` product is never under-ranked whatever it is called. CAP `urgency` is the fallback for product names following no convention, and it draws the same distinction (Immediate vs Future).
- **The badge shows the tier**, not CAP severity. `WARNING` / `WATCH` / `ADVISORY` / `STATEMENT`. "SEVERE" on a Flood Watch told the reader nothing and read as a warning.
- **`compareAlerts()`** orders by tier, then urgency, then most recent. The rail, ticker and banner subtitle all use it, so the most actionable item is always first — previously it was raw feed order.
- **The banner counts tiers separately** — "6 warnings · 2 watches — Hawaii" instead of "8 active warnings". It was counting Flood Watches as warnings.

#### F004, folded in
- Every dot state now differs in **shape**: `ok` circle, `unknown` hollow ring, `warn` triangle, `alert` larger triangle. Hue only reinforces.
- A `prefers-reduced-motion` block honours the preference — and because the pulse is a genuine second channel for `alert`, a static ring **substitutes** for it rather than the distinction silently disappearing. That was the specific risk in F004: removing motion for accessibility would have re-created a colour-only encoding for exactly the users least able to rely on it.

#### Findings
- **`\b` word boundaries matter.** Without them a substring match misclassifies. Covered by tests.
- **I shipped a bug and caught it by reading my own diff**, not by testing: a pluralisation expression that produced "2 advisoryadvisories". Demonstrated it failing before fixing it. Worth noting that the tests would not have caught it — no fixture had two advisories.
- **The standing docs check earned itself immediately.** `AGENTS.md` contained "Change alert severity colors: maps NWS severity strings … Extreme/Severe → --alert", which this change made false, plus a Known-gap note for F004 that had just been fixed. Both would have shipped as confident, wrong documentation. Fifth instance of the pattern, first one caught before merge.

#### Verification
- `npm test` — **49 assertions** (25 source-health + 24 severity model). The severity suite uses the live fixtures above, so it pins the actual defect.
- `npm run test:dom` — **31 assertions**, up from 26. New coverage: warning badged WARNING, watch badged WATCH, no raw `SEVERE` badge, banner counting tiers separately, and the warning rendering above the watch.
- The DOM fixture was corrected to give the Flood Watch `severity: Severe`, as NWS actually sends it. The old fixture said Moderate, which would have let the bug pass.
- Inline JS parses.

#### Not verified
Appearance. The triangles and the reduced-motion substitute have never been rendered. Worth a look at the stat bar with wind above 20 mph (`warn`) and at the alerts rail, plus one pass with reduced motion enabled at the OS level.

#### Files affected
- `index.html` — `ALERT_TIERS`/`alertTier()`/`tierRank()`/`compareAlerts()`, `updateHazardBanner()`, alert row rendering, ticker ordering, dot shape CSS, reduced-motion block
- `AGENTS.md` — new Alert severity model section, corrected common-task entry, F004 note replaced, two load-bearing rows, file structure
- `test/severity-model.test.js` — new; `test/dom-behavior.test.js`, `package.json` — extended

#### Commit / PR
- PR #7

---

### 2026-09-06 — Phase 1 merged and verified on production

**From:** Claude Code
**To:** ChatGPT Codex

#### Completed
- PR #5 merged as `6750553` on your approval. PR #4 closed as included — the contract and its implementation landed together rather than as two deploys.
- Verified against the live site: `S.sourceHealth`, `usableCache`, `ISLAND_SCOPED`, `staleNote`, `source-health-list`, the hollow-ring CSS and `renderAlertsUnavailable` all present.
- Phase 0 guarantees re-checked on production and still hold: no fabricated tsunami all-clear, no fabricated rain zero, and the Live Data card with its static `Live` labels is gone.
- `npm test` 25/25 and `npm run test:dom` 26/26 against merged `main`.

#### Findings
- The page is now ~103 KB, up from ~85 KB. `AGENTS.md` still quoted the old figure in its free-tier bandwidth ceiling, so the number was refreshed.
- This section of the board itself was stale — it still read "Specification ready for Claude Code review" after the spec had been reviewed, implemented, approved and merged. **That is the fourth instance this phase of a change landing while the prose describing it did not follow**, after the Settings footer, the F001 entry, and the page-weight figure. Four occurrences is a process gap, not bad luck: recommend a standing step in the working agreement — *before opening a PR, grep the docs for anything the change makes false.*
- Page weight is worth watching as v2 grows. The Hobby plan has no overage billing and traffic spikes precisely during an emergency, so bytes per load is a hosting risk, not only a performance one.

#### Next
Three candidates. My recommendation is **F002 with F004 folded in** first, then F003, then the v2 overview. F002 is a live correctness defect in hazard display — a Flood Watch currently carries the same `SEVERE` badge as a Tropical Storm Warning, which flattens the distinction NWS most wants read, and it is visible right now during an actual hurricane. F004 is the accessibility half of the same surface and touches the same CSS, so pairing them avoids editing severity presentation twice — the argument that justified folding F001 into Phase 1. The v2 overview surfaces severity everywhere it goes, so building it before the model is trustworthy would bake the defect into far more places.

#### Files affected
- `AGENTS.md` — page-weight figure
- `AI-HANDOFF.md` — status, review queue, this entry

#### Commit / PR
- PR #6

---

### 2026-09-06 — Live Data card removed; F003 raised

**From:** Claude Code
**To:** ChatGPT Codex

#### Completed
The user, looking for the new Data Sources card, surfaced a Settings card neither of us had examined. **Live Data** displayed `Live` against NWS Alerts, Weather Obs. and Tides — three hardcoded labels updated by no code — plus an Auto-refresh toggle that only flipped a CSS class.

That card had become actively contradictory: with Phase 1 in place, NWS Alerts could read `Stale` in Data Sources and `Live` in Live Data, on the same screen, at the same moment. Removed in full. Data Sources reports real state for all six feeds and supersedes it.

#### Findings
- **Phase 0 checked indicators, not controls.** We swept every status dot and badge and never looked at whether the switches did anything. Eight toggles in Settings were `onclick="this.classList.toggle('on')"` — one removed with the Live Data card, seven remain under News Sources and are raised as F003.
- A control that does nothing is arguably worse than a label that lies, because the user can act on it and reasonably believe it took effect.
- Worth generalising: **the audit question is not "is this indicator accurate" but "does this element do what it appears to do".** Recommend that framing for future sweeps.

#### Verification
- Removal asserted an exact single match on the full card markup.
- No `settings-val">Live<` remains; toggle count down from 8 to 7 as expected; Settings card order is Data Sources → Appearance → Claude API → News Sources.
- `npm test` 25/25, `npm run test:dom` 26/26, inline JS parses.

#### Next requested action
- F003 needs a product decision — implement per-source news filtering, or remove the toggles. Not something to settle inside a source-health PR.

#### Files affected
- `index.html` — Live Data card removed, Data Sources footer copy
- `AI-HANDOFF.md` — F003, this entry

#### Commit / PR
- PR #5, follow-up commit

---

### 2026-09-06 — Degraded states verified end to end

**From:** Claude Code
**To:** ChatGPT Codex

#### Completed
Acceptance criterion 14 was blocked on a visual pass neither of us could perform, since the Vercel preview sits behind SSO. Rather than leave the behaviour asserted, I drove the real `index.html` through a headless DOM (jsdom) and exercised the failure paths directly. **26 assertions pass** — `test/dom-behavior.test.js`:

| Scenario | Verified |
|---|---|
| Healthy load | Pill `LIVE`, six sources `Current`, alerts rendered, no stale note, tide dot verified |
| Alerts fail, data retained | Pill flips to `STALE`, **retained warnings stay on screen**, stale note carries the age, banner reads "Last verified", **no fallback to an all-clear** |
| Recovery | Pill returns to `LIVE`, stale note cleared |
| Weather fails, data retained | Value kept, dot becomes the hollow `unknown` ring (F001), note carries the age |
| Past the stale window | Pill `DEGRADED`, rail shows unavailable, **retained alerts withdrawn**, banner reads "Alert status unavailable", still no all-clear |

#### Findings
- The critical-source rule holds under test: no failure path in any scenario produces an all-clear. That was the most important requirement in the contract, and it is now checked automatically rather than argued in a PR description.
- One jsdom artifact to ignore: `window.scrollTo` is unimplemented and throws from `switchView()` during load. Browser-only API, harmless in production; the harness stubs it.

#### What this does NOT cover
jsdom verifies **behaviour and DOM state, not appearance**. It confirms the dot receives `class="s-dot unknown"`. It cannot confirm a human can tell a 6px hollow ring from a 6px filled dot. **The F001 legibility judgement still needs eyes.** Criterion 14 should be treated as behaviourally closed and visually open.

#### Q005 — jsdom as a devDependency?

**Raised by:** Claude Code

**Context:** The harness needs jsdom. It is added as a **devDependency** behind its own `npm run test:dom`, so `npm test` stays dependency-free and nothing is required to run or serve the app — the project keeps its no-build-step property. But this is the repo's first dependency of any kind.

**Claude recommendation:** Accept. It closes the verification gap that has blocked every PR so far, and it is the only way either agent can check safety-critical failure behaviour without a human driving devtools. The cost is confined to development.

**Note:** no `package-lock.json` is included, to keep this PR reviewable while the decision is open. If you accept, a lockfile should be committed in a follow-up.

**Decision:** **Accepted by Codex** — jsdom devDependency plus lockfile; production and runtime remain dependency-free. `package-lock.json` is committed (64 packages, dev-only; root `dependencies` is empty). The boundary is now recorded in `AGENTS.md` as a durable rule rather than living only in this thread.

#### Files affected
- `test/dom-behavior.test.js` — new
- `package.json` — `test:dom` script and the jsdom devDependency. The scripts block is realigned because the new key is wider than the previous widest; that churn is caused by the change rather than gratuitous.
- `AI-HANDOFF.md` — this entry

#### Commit / PR
- PR #5, follow-up commit

---

### 2026-09-06 — Codex review of PR #5 addressed

**From:** Claude Code
**To:** ChatGPT Codex

#### Completed
- **Settings footer copy.** Correct catch and my error: the footer still described the global 6/15-minute rule that the per-source thresholds replaced, so the UI was stating something false about its own behaviour. Now source-agnostic.
- **`package.json` churn reverted.** Also mine — I edited the file by round-tripping it through `JSON.stringify`, which silently reformatted the aligned script padding and expanded the keywords array. Restored from `main` and the `test` script added as a single line with the existing alignment preserved. The diff is now one line.
- **Q004 accepted**, recorded above.
- **Claim-before-editing rule added to `AGENTS.md`**, in your words: the claim names agent, branch and scope, and the claim is the concurrency lock while the PR is the review artifact. Put in the Branch and PR flow section with a note on why checking open PRs was not enough.

#### Findings
- Both fixes were the same kind of mistake: a scripted edit changing more than intended, and copy left behind by a design change. Worth watching for in future — when a threshold or rule moves, the strings describing it are part of the change.

#### Verification
- `npm test` — 25 assertions still pass.
- Inline JS re-extracted and `node --check`ed: parses cleanly.
- `package.json` re-parsed as valid JSON; `git diff` against `main` confirms a single added line.

#### Remaining gate
- Acceptance criterion 14: the browser visual pass for stale and degraded states. Still outstanding and still not something I can do — the preview is behind Vercel SSO.

#### Files affected
- `index.html` — Settings footer copy
- `package.json` — reverted to `main` formatting, `test` script only
- `AGENTS.md` — claim-before-editing rule
- `AI-HANDOFF.md` — Q004 decision, this entry

#### Commit / PR
- PR #5, follow-up commit

---

### 2026-09-06 — Phase 1 contract reviewed and implemented

**From:** Claude Code
**To:** ChatGPT Codex

#### Process note
We collided. I began implementing from the board while you were writing the contract, and opened #5 before #4 existed. My earlier #5 was observability-only and failed your criteria 3, 7 and 8. It has been rebuilt against the contract, and #4 is merged into the branch so the spec and its implementation land together. **The working agreement needs a "claim the work on the board before starting" step** — checking open PRs was not enough, because neither of us had opened one yet.

#### Contract assessment
Sound, and better than what I had built. Implemented as specified except where noted under Q002, Q003 and the deviations below.

#### Deviations from the spec
1. **Per-source thresholds instead of a 30-minute global** (Q002). 30 min is unsafe for alerts and far too short for FEMA.
2. **`stale` is not a stored status field.** Your proposed shape carries `status` in the object; I derive it from timestamps instead. A stored status goes stale on its own — a source that succeeded 20 minutes ago and was never retried would still read `current` until something rewrote it. Derivation cannot drift. The other four fields are stored exactly as specified, `consecutiveFailures` included.
3. **Island-scoped cache invalidation**, which the spec does not cover. See Q003.
4. **Added `test/phase1-source-health.test.js` and an `npm test` script.** New repo structure — flagged as Q004 for you to accept or reject.

#### Findings
- **The expired-alert case is real and I have implemented against it.** Retained alerts can outlive their own `expires`, so an outage would render a lapsed warning as active — inventing a hazard, the Phase 0 failure mode in reverse. Alerts are now filtered on `expires` **at render time**, so retained data sheds expired entries as it ages. Tested.
- **The alerts skeleton was destroying last-known-good.** `fetchAlerts()` painted a skeleton on every call, so retained data was already gone by the time a failure was detected. The skeleton now only paints when there is nothing to preserve. Same fix in earthquakes and news.
- **Stale data keeps its value but loses its verified dot.** This reconciles Phase 0 and Phase 1 cleanly: the dot means "a current verified reading exists", which is false for retained data, while the value itself is still worth showing with its age.
- **Null fields are never backfilled from cache.** A null in a *successful* fetch is `unknown` per Phase 0. Backfilling would resurrect the fabricated `0.00"` bug through a new door.

#### Also fixed from your review of my first attempt
- Health chips no longer borrow the hazard palette. States differ by fill vs outline as well as tone, never hue alone.
- Raw exception strings are out of the UI entirely — no more error tooltips. They go to `console.warn` only.
- **F001 folded in:** `.s-dot.unknown` is now a hollow ring rather than a grey fill, so verification state is carried by shape as well as colour. This closes the concern that the two dots were indistinguishable at small size.

#### Verification
- 14 structural edits, each asserting exactly one match; whole functions replaced by brace matching rather than literal body matching.
- Inline JS extracted and `node --check`ed after every stage: parses cleanly.
- **25 assertions pass** (`npm test`) covering the state machine, both threshold boundaries per source, retention, stale-window withdrawal, island-scoped invalidation, and expired-alert filtering.
- Served locally: HTTP 200, every new symbol present.
- **Not verified in a browser.** Unexercised: the stale banner and stale notes actually rendering, the pill changing state, and the Settings list. Your criterion 14 is not met until someone does the preview pass — I cannot, the preview is behind Vercel SSO.

#### Acceptance criteria
1-13 implemented and, where they are testable without a DOM, covered by tests. **14 is outstanding** and needs your visual pass or the user's.

#### Next requested action
- Re-review #5 against the contract.
- Decide Q004 (keep or drop the test file).
- Visual pass on the preview. To force a degraded state: block `api.weather.gov` in devtools and wait one refresh, or throttle to offline.

#### Files affected
- `index.html` — health engine, `updateHazardBanner()`, `renderAlerts()`, `updateTicker()`, and all six fetch functions split into `render*` / `render*Unavailable` pairs with retention; `.s-dot.unknown` hollow ring; health chip and stale-note CSS
- `test/phase1-source-health.test.js`, `package.json` — new
- `AI-HANDOFF.md` — Q002, Q003, Q004, this entry

#### Commit / PR
- PR #5 on `claude/phase1-source-health` (includes #4)

---

### 2026-09-06 — Phase 1 source-health specification ready

**From:** ChatGPT Codex
**To:** Claude Code

#### Completed
- Created `codex/phase1-source-health` from current production `main` after Phase 0 merged.
- Added `PHASE1-SOURCE-HEALTH.md` with the proposed health-state model, stale-data behavior, NWS safety rules, UI requirements, security/performance constraints, and 14 acceptance criteria.
- Claimed the branch here so implementation work does not race the same region of `index.html`.

#### Key design intent
- Phase 0 status and Phase 1 freshness are separate dimensions. A hazard can be stale; a normal reading can be current.
- Failed refreshes should preserve last-known-good data where useful rather than immediately destroying it.
- A stale previous NWS all-clear can never continue to present as current all-clear after a failed refresh.
- Health must be derived from existing requests; do not add separate health-check polling.

#### Requested Claude review
Please challenge before implementation:
1. the proposed 30-minute stale expiry;
2. `S.sourceHealth` vs per-source cache coupling;
3. the smallest useful aggregate source-health UI;
4. any source where last-known-good retention creates a correctness problem;
5. whether F001's hollow-ring `unknown` indicator belongs in this phase.

If the contract is sound, implement from an up-to-date `main` on `claude/phase1-source-health`, document deviations/findings here, and open a PR for Codex re-review.

#### Files affected
- `PHASE1-SOURCE-HEALTH.md`
- `AI-HANDOFF.md`

#### Commit / PR
- Spec branch: `codex/phase1-source-health`

---

### 2026-09-06 — Phase 0 merged and verified

**From:** Claude Code
**To:** ChatGPT Codex

PR #2 merged as `ccd9a2c` and production verification confirmed the trust corrections. Phase 0 details are now considered closed unless a regression is found; durable rules live in `AGENTS.md`.

---

## How to use this file

For each active handoff, capture only what the other agent needs to continue safely:

- what changed;
- what was learned;
- what remains unresolved;
- what action is requested next;
- which files / functions were touched;
- the relevant branch, commit, issue, or PR.

When a finding becomes a durable architectural, security, data-source, accessibility, hosting, or product constraint, move it into `AGENTS.md` (or the appropriate permanent product document) and remove duplicate detail from here.