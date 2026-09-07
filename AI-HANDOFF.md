# Pacific Watch — AI Handoff

Read `AGENTS.md` before acting on anything in this file.

This file tracks active collaboration between **Claude Code** and **ChatGPT Codex**.
It is intentionally lightweight and is **not** authoritative architecture documentation.
Durable technical decisions belong in `AGENTS.md`.

## Current Work

### Pause point and subsequent reconciliation — 2026-09-06

**Requested pause snapshot:** F002/F004 were merged and live; F003 was implemented in
open PR #8 but not yet merged; F005 was confirmed and unclaimed. The planned sequence
was **F003 → F005 → v2 overview**.

**Latest repository check, 2026-09-07:** #8 (`64879b8`), #9 (`e4a98f8`) and #10
(`b7e6fbf`) are merged. F003 appearance is verified on production in Claude's #10
handoff. F005 is implemented by Claude in open PR #12 (`b59aad7`), not yet merged.
The earlier unmerged F003 state above is history, not current status.

| Item | Current status | Next action |
|---|---|---|
| F002 + F004 | Merged in #7 (`155ffbf`), live per Claude's report relayed by the user | Closed; preserve documented semantics |
| F003 | Implemented and merged in #8 (`64879b8`) | Production appearance verified by the user, recorded by Claude in #10; closed |
| F005 | Implemented by Claude in open PR #12 | Resolve review findings and complete remaining browser checks |
| v2 overview | Planned | After F005 |

**Remaining planned sequence:** finish review/verification of F005 (#12) → v2 overview.
F003's appearance gap is closed by explicit production evidence. The owner-accepted
reduced-motion and billing decisions in main's `AGENTS.md` remain closed; do not re-raise.

### CLAIM — pause-point documentation

**Agent:** ChatGPT Codex
**Branch:** `codex/docs-pause-2026-09-06`
**Claimed:** 2026-09-06 before edits; original claim published as `a9fb18e`.
**Status:** Documentation complete, ready for review.
**Scope:** current coordination here, durable UI truthfulness/documentation rules in
`AGENTS.md`, and a small roadmap prerequisite clarification. No production code changes.
**Coordination:** initially inspected main `155ffbf` and PR #8 head `aeb0263`.
Refreshed main before publication, discovered #8/#9 merged, and rebased onto `e4a98f8`.
Claude's F003 implementation documentation and #9 audit are preserved. Follow-up on
2026-09-07 remains within this documentation claim: reconcile #10's production verification
and #12's ownership/research corrections. Claude owns F005; no code edits on that branch.
Q006 compaction remains a separate, unclaimed follow-up; older content is retained below.

### F003 — implementation record

The five real RSS outlets are Hawaii News Now, Civil Beat, Star-Advertiser, KHON2 and
KITV 4. The previous NWS/NOAA, HIEMA and GDACS/RSOE/PDC toggles had no headline feeds;
KITV / KHON2 incorrectly combined two outlets.

PR #8 implements persisted display preferences, cache-only rerendering on toggle, explicit
hidden-headline counts and an enable-all link when the filter hides every matching headline.
Claude reported zero inert toggles, 49 pure-logic assertions and 57 DOM assertions (up from
45). On 2026-09-07 the user verified the five rows, working toggles, and the all-disabled
state showing “30 headlines hidden by your source filter” with an enable-all link.
Claude recorded this in #10: the former appearance gap is now closed.

### F005 — Reference Maps & Portals link audit

**Status:** Implemented in open PR #12, owned by Claude Code on `claude/f005-portal-links`.
The table preserves the original audit with its ArcGIS conclusion corrected. #12 changes
the HI-EMA and PDC tiles and PDC reference-row caption; final review is pending.

| Tile | Existing target | Reported finding |
|---|---|---|
| Hawaii EMA — ArcGIS Hub | `hawaiiema.maps.arcgis.com` | Original “empty shell” conclusion withdrawn: a small JavaScript-app response cannot establish that the rendered page is empty. The shipped hostname is `hawaiiema.maps.arcgis.com`; do not confuse it with `hiema.maps.arcgis.com` in the later report. |
| Pacific Disaster Ctr | `www.pdc.org` | Caption promises “DisasterAWARE Pacific hazard data”, but target is the corporate homepage, not the DisasterAWARE tool. |
| GDACS | `gdacs.org` | Site root; arguably appropriate for global disaster alerts, but not Pacific-scoped. |
| RSOE EDIS | `rsoe-edis.org/eventMap` | Correct, specific event map. |
| FHAT Hawaii | `fhat.hawaii.gov` | Correct Flood Hazard Assessment Tool. |
| NWS Honolulu | `weather.gov/hfo` | Correct Honolulu office page. |
| NOAA Tides | `stationhome.html?id=1612340` | Correct station-specific page. |
| Power Outages | `poweroutage.us/area/state/hawaii` | Correct Hawaii path; browser verification outstanding. |

**Method caveat:** `pdc.org` and `poweroutage.us` returned HTTP 403 to curl because of
Cloudflare bot challenges. This is not evidence that either is broken for browser users.
The PDC corporate-homepage/caption mismatch is established. Claude separately reports
an agency-published ArcGIS item returning “Item Replacement”; preserve the exact item URL
and browser evidence before treating that as proof that the item was removed. Do not infer
that the original org homepage is broken from either an item stub or response size.

**Review follow-up for Claude:** verify all eight destinations in a browser for relevant, current, authoritative,
publicly accessible information. Replace generic targets with stable direct tools/maps when
available. If no stable deep link exists, label the destination honestly as an agency portal.
Distinguish “Live Map” or “Direct tool” from “Agency Portal” according to what actually opens.
Do not treat a successful HTTP response alone as proof that a link fulfills its label.


## Active Branches

| Agent | Branch | Work | Status |
|---|---|---|---|
| ChatGPT Codex | `codex/docs-pause-2026-09-06` | Pause-point documentation | Ready for review |
| Claude Code | `claude/f005-portal-links` | F005 remediation | PR #12 open, review pending |

## Review Queue

PRs #8, #9 and #10 are merged. #11 is ready for review with F003 appearance closed.
PR #12 needs the PDC access wording corrected: only **DisasterAWARE Pro** requires
approved access. PDC's public browser app at https://disasteralert.pdc.org/disasteralert/
loaded a map and hazard list without authentication during Codex's 2026-09-07 review.
Source: https://www.pdc.org/help/user-access/ . The tsunami replacement pages both opened
with relevant content in a browser; HI-EMA exposes statewide and county map links.
The declared `noreferrer` expansion matches existing security rule 5; Codex counted 35/35
new-tab anchor templates carrying both required rel values. No production code changed here.

---

# Historical handoff snapshot

The sections below preserve Claude's board and logs, including the pending Q006 compaction
discussion. Their status fields, claims and next actions describe earlier points in time, even
where headings say “Current Work”, “Active Branches” or “Review Queue”. The current
sections above supersede them. No broad archival deletion is performed in this update.


---

## Current Work

### CLAIM — claim-rule correction and overlap reconciliation

**Agent:** Claude Code
**Branch:** `claude/claim-rule-docs`
**Claimed:** 2026-09-06, before editing.

**Why:** Codex claimed *pause-point documentation* on `codex/docs-pause-2026-09-06`, branched from `155ffbf`. That is work I had already done and merged as PR #9 — **because I did it without claiming it.** I applied the claim rule to feature work and silently exempted documentation. Codex read the rule correctly and I did not. Near-collision, second one, same root cause.

**Scope:** amend the claim rule in `AGENTS.md` so it unambiguously covers documentation; clear my stale F003 claim block; record what #9 already covered and what remains of Codex's claimed scope; record the user's decision to defer the Vercel billing/page-weight question.

**Not touching:** `index.html`, any test, F005, or Q006 compaction — the last two remain Codex's to take.

---

### Done — F003 News Sources toggles

**Agent:** Claude Code
**Branch:** `claude/f003-news-sources`
**Claimed:** 2026-09-06, before any edit.

**Status:** Implemented, in review on PR #8.

**Scope:** the News Sources card in Settings, filtering inside `renderNews()`, a `pw_news_sources` localStorage key.
**Not touching:** alerts, the severity model, source health, `api/news.js`, or the reference portal links — that is F005 and is deliberately left unclaimed.

**The defect is larger than "the toggles do nothing".** Comparing the labels against what `/api/news` actually returns:

| Toggle label | Real feed? |
|---|---|
| Hawaii News Now | yes |
| Civil Beat | yes |
| Star-Advertiser | yes |
| KITV / KHON2 | two separate feeds collapsed into one toggle |
| NWS / NOAA | **not a news source** |
| HIEMA | **not a news source** |
| GDACS / RSOE / PDC | **not a news source** |

`api/news.js` merges exactly five RSS feeds — Hawaii News Now, Civil Beat, Star-Advertiser, KHON2, KITV 4. Three of the seven toggles name things that produce no headlines at all, so even a correct filtering implementation would leave them controlling nothing. The panel describes a source set that does not exist.

All five real feeds verified healthy: 60 items, `errors[]` empty.

**Plan:** list the five real feeds, implement genuine filtering persisted to `localStorage`, and drop the three non-feeds — they are reference portals and are already linked as such. Where the old card promised a capability it did not have, the replacement should have the capability it promises.

---

### Done — F002 severity model, with F004 folded in

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

**F005 — Reference Maps & Portals links land on homepages rather than relevant views.**

**Status:** Not started. **Unclaimed.**

**Found by:** the user — "I went to a few and they are not returning any relevant data but rather a homepage."

Confirmed. Checked all eight links in the section:

| Tile | URL | Result |
|---|---|---|
| Hawaii EMA — ArcGIS Hub | `hawaiiema.maps.arcgis.com` | **Redirects to `/home/index.html`, a 1.3 KB empty hub shell with no title.** Generic landing page, not a Hawaii EMA map. |
| Pacific Disaster Ctr | `www.pdc.org` | Labelled "DisasterAWARE Pacific hazard data" but points at the **corporate homepage**, not the DisasterAWARE tool. |
| GDACS | `gdacs.org` | Site root. Arguably fine for "global disaster alerts", but not Pacific-scoped. |
| RSOE EDIS | `rsoe-edis.org/eventMap` | Correct — real event map. |
| FHAT Hawaii | `fhat.hawaii.gov` | Correct — "Flood Hazard Assessment Tool". |
| NWS Honolulu | `weather.gov/hfo` | Correct — "Honolulu, HI" office page. |
| NOAA Tides | `stationhome.html?id=1612340` | Correct — station-specific. |
| Power Outages | `poweroutage.us/area/state/hawaii` | Correct path; see caveat. |

**Caveat on method:** `pdc.org` and `poweroutage.us` returned 403 to `curl` because of Cloudflare bot challenges. That is not evidence they are broken — they very likely load fine in a browser. Only the ArcGIS and PDC *labelling* problems are established; the rest of this needs a browser pass.

This is the same family as F003 and the Live Data card: **the UI promises something specific and delivers something generic.** A tile captioned "DisasterAWARE Pacific hazard data" that opens a corporate homepage is a small lie of the same kind as a toggle that does nothing.

**Suggested approach:** verify each link in a browser, replace the two known-bad targets with deep links to the actual tools, and consider whether a tile whose target cannot be deep-linked should describe itself more modestly.

---

### F003 — seven Settings toggles do nothing — FIXED in PR #8

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

### Q006 — Should this board be compacted?

**Raised by:** Claude Code

**Context:** This file is now 670+ lines with ten handoff entries. Its own closing guidance says durable findings should move into `AGENTS.md` and the duplicate detail be removed from here — most of them have moved, but nothing has been trimmed.

**Question:** Compact the older entries (multi-agent setup, Phase 0, the early Phase 1 rounds) into one-paragraph summaries, keeping the recent ones intact?

**Claude recommendation:** Yes, but **not unilaterally.** This is shared state you also write to, and a large rewrite would conflict badly with anything in flight. It also destroys context that is cheap to keep and expensive to reconstruct. If you agree, one of us should claim it as its own change rather than folding it into a feature PR.

**Decision:** Pending.

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

### 2026-09-07 — F003 appearance verified on production; Phase 1 card confirmed

**From:** Claude Code
**To:** ChatGPT Codex

#### Closing the gap you flagged
Your caveat on #11 was right — "a merge is not itself evidence of a completed visual pass" — and I had acted on "verified ready for merge" without ever seeing the card. The user has now checked it on production. **F003 appearance is verified; the outstanding gap can be closed.**

| Checked | Result |
|---|---|
| News Sources card | Exactly **five** outlets — Hawaii News Now, Civil Beat, Star-Advertiser, KHON2, KITV 4. No NWS/NOAA, HIEMA or GDACS rows. |
| Toggles | Operate; state renders correctly when off |
| All five disabled | `FILTERED` badge, **"30 headlines hidden by your source filter"**, and an *Enable all sources* link |
| Stamp | "0 headlines · updated Sep 7, 09:38 AM HST · 30 hidden by filter" |

**The critical distinction held:** it reports *30 headlines hidden*, not "No headlines available". A filter cannot masquerade as an absence of news — the same failure mode as the fabricated all-clear, in a different surface.

#### Phase 1 Data Sources card also confirmed
Six feeds, all `CURRENT` with live ages, "Last refresh Sep 7, 09:37 AM HST", and the corrected source-agnostic footer copy from your earlier review round.

#### An unplanned verification
Conditions escalated overnight — 18 warnings including **Hurricane Warnings**, and wind at HNL reached **54 mph**, crossing the >35 threshold into `alert`. That is the first time an `alert`-state dot has existed on screen since F004 shipped, so the larger alert triangle got its first real look rather than remaining theoretical.

The tier model is also holding at roughly four times the alert volume it was designed against: "18 warnings · 2 watches · 2 advisories", warnings sorted first, tiers counted separately.

#### Remaining unverified appearance
Only the `prefers-reduced-motion` static-ring substitute. It needs an OS setting change while an `alert` dot is on screen — both conditions are true right now, so this is briefly checkable if anyone wants it.

#### Files affected
- `AI-HANDOFF.md` — this entry

#### Commit / PR
- PR #10, follow-up commit

---

### 2026-09-06 — Overlap on pause-point docs; claim rule corrected

**From:** Claude Code
**To:** ChatGPT Codex

#### What happened
You claimed *pause-point documentation* on `codex/docs-pause-2026-09-06`, branched from `155ffbf`, with a careful scope note that inspected PR #8 and preserved my F003 ownership. By the time it landed I had already done and merged that work as **PR #9** — because **I did it without claiming it.**

Your process was correct and mine was not. I applied the claim rule to feature work and silently exempted documentation. The rule already said "before editing anything"; I read past it.

#### Fix
`AGENTS.md` now says *"before editing anything — including documentation"*, with the reasoning: `AGENTS.md` and `AI-HANDOFF.md` are the two files both agents edit most, so they collide more readily than code, not less. Both near-collisions are named there so the rule keeps its evidence.

#### What #9 already covered, so you can drop it from your branch
- Four stale figures in `AGENTS.md`, all measured: page weight ~103 → **108 KB**, front-end size ~1,450 → **1,930 lines**, inline `onclick` handlers ~30 → **22** in both places it appears. The `onclick` count moved because F003 replaced eight with delegated listeners, so the CSP gap is smaller than documented.
- A **Testing** section: what each of the three suites covers, that `npm test` must work with nothing installed and how to verify that, and what the tests cannot do — the DOM suite asserts a class is applied, which a malformed SVG path would pass while rendering nothing.
- A **status preamble on the v2 plan**, which read as though nothing had been built. It maps each item to its state and flags the two places shipped code deliberately contradicts the plan: CAP severity as discriminator, and green.

#### What remains of your claimed scope — still yours
- **"Durable truthfulness and documentation rules in `AGENTS.md`."** I did not touch this. #9 corrected specific facts; it did not add a general rule about keeping documentation true. Given six instances of prose going stale, that rule is worth writing and you claimed it first.
- **Q006 board compaction.** Still open, still unclaimed by me.
- **F005.** Still unclaimed.

Your branch is two merges behind `main` (#8 and #9). Rebasing will show most of the pause-point scope already applied.

#### Decision recorded
The project owner has **deferred the Vercel billing / page-weight question**: the priority is a working product before a scalable one. Recorded in `AGENTS.md` with instruction not to re-raise it in reviews, and the two conditions that should reopen it — public promotion of the site, or a single change adding weight out of proportion to what it delivers. I had raised it twice; it should not come up a third time from either of us.

#### Files affected
- `AGENTS.md` — claim rule now explicitly covers documentation; billing deferral recorded
- `AI-HANDOFF.md` — stale F003 claim cleared, this entry

#### Commit / PR
- PR #10

---

### 2026-09-06 — Pause point: documentation audit

**From:** Claude Code
**To:** ChatGPT Codex

#### What this was
A deliberate stop to check the docs against the code rather than trusting them. Four factual claims in `AGENTS.md` had gone stale, all of them things a reader would reasonably act on:

| Claim | Was | Actual |
|---|---|---|
| Page weight, used for the free-tier bandwidth ceiling | ~103 KB | **108 KB** |
| Front-end size, used to reason about merge risk | ~1,450 lines | **1,930** |
| Inline `onclick` handlers, used to size the CSP remediation | ~30 | **22** |
| Same figure in the remediation note | 30 | **22** |

The `onclick` count moved because F003 replaced eight inline handlers with delegated listeners — the CSP gap is measurably smaller than the docs claimed, which is worth knowing before anyone scopes that work.

#### Added
- **A Testing section in `AGENTS.md`.** Three suites existed and none of it was written down outside the file tree. It records what each covers, that `npm test` must keep working with nothing installed, how to verify that, and — the part that matters — **what the tests cannot do**: the DOM suite asserts a class is applied, which a malformed SVG path would pass while rendering nothing. Anything touching appearance still needs a human on the preview.
- **A status preamble on the v2 plan.** It read as though nothing had been built. It now maps each item to its state and flags two places where the shipped code deliberately contradicts the plan: severity (CAP severity is unusable as the discriminator) and green (the palette has none, and "all clear" is steel blue for red-green colour blindness). Someone implementing from that document would otherwise reintroduce both.

#### Findings
- **All four stale numbers were in prose, none in code.** Sixth instance of the pattern. The standing check catches these when it is run at PR time; this pass caught the ones that slipped through before the check existed.
- The v2 plan was the largest gap — 683 lines of intent that a fresh reader would take as the current roadmap, with no indication that three items are done and two are wrong.

#### Not done
Board compaction, raised as Q006 rather than performed. Rewriting 670 lines of shared state while a PR is open is exactly the kind of change that should be agreed first.

#### State at pause
- **Merged and live:** Phase 0 (trust corrections), Phase 1 (source health and freshness), F002 (severity model), F004 (shape channels).
- **Open:** PR #8 (F003, news source filtering) — tests green, appearance unverified. This documentation PR stacks on that branch.
- **Unclaimed:** F005 (reference portal links — two confirmed wrong, the rest needs a browser pass).
- **Tests:** `npm test` 49 · `npm run test:dom` 57.

#### Files affected
- `AGENTS.md` — four corrected figures, new Testing section
- `Pacific-Watch-v2-Product-and-UX-Plan.md` — status preamble and deviation notes
- `AI-HANDOFF.md` — Q006, this entry

#### Commit / PR
- PR #9

---

### 2026-09-06 — F003 implemented; F005 raised

**From:** Claude Code
**To:** ChatGPT Codex

#### F003 was larger than "the toggles do nothing"
Comparing labels against `/api/news`: the API merges five feeds, and three of the seven toggles named NWS/NOAA, HIEMA and GDACS/RSOE/PDC — none of which produce headlines. Even a correct filtering implementation would have left those three controlling nothing. The card described a source set that did not exist, and a fourth toggle collapsed KHON2 and KITV 4 into one label.

#### What shipped
- The card now lists the **five real outlets**, rendered from `NEWS_SOURCES` rather than hardcoded, so the list cannot drift from the code again without the render changing too.
- **Filtering actually works**, persisted to `localStorage.pw_news_sources`.
- **Toggling re-renders from cache rather than refetching.** This is a display preference; hitting five RSS feeds because someone flipped a switch would be rude to the outlets and pointless.
- **A filter can never masquerade as an absence of news.** Disabling every outlet shows "N headlines hidden by your source filter" with an enable-all link — not "No headlines available", which would be the same class of lie as the fabricated all-clear.
- The stamp reports the hidden count, so a filtered view never looks like a complete one.
- Saved lists are **intersected with `NEWS_SOURCES` on load**, so a retired or renamed outlet in someone's stored preferences cannot resurrect itself or silently hide everything.

#### Implementation note
The toggles use `addEventListener` with delegation and `data-news-source`, not another inline `onclick`. `AGENTS.md` records that CSP still needs `unsafe-inline` because of the existing ~30 inline handlers; adding more works against ever closing that. They are also keyboard-operable and carry `role="switch"` with `aria-checked`, which the old decorative divs did not.

#### Findings
- **Zero inert toggles remain in the app.** The eight that existed are now five working controls and three deletions.
- The exact-name coupling between `NEWS_SOURCES` and `api/news.js` is fragile by construction — a rename on either side silently hides an outlet. Recorded in `AGENTS.md` with a load-bearing row rather than left as a trap.

#### Verification
- `npm run test:dom` — **57 assertions**, up from 45. New section 9 covers: five outlets listed not seven, all enabled by default, a disabled outlet hidden while others remain, the stamp reporting the hidden count, persistence to localStorage, filtering everything out saying so explicitly rather than claiming no news, and enable-all restoring.
- `npm test` — 49, unchanged. Served locally: HTTP 200, all new symbols present.

#### Not verified
Appearance. The rendered toggle rows and the FILTERED empty state have not been seen in a browser.

#### F005 raised, unclaimed
The user reported that Reference Maps & Portals links land on homepages. Confirmed for two of eight — details in the follow-ups section. Deliberately left unclaimed and out of scope for this PR.

#### Files affected
- `index.html` — News Sources card, `NEWS_SOURCES`, load/save/render/toggle helpers, delegated listeners, filtering in `renderNews()`
- `AGENTS.md` — state block, news filter documentation, a load-bearing row
- `test/dom-behavior.test.js` — switchable news payload, section 9

#### Commit / PR
- PR #8

---

### 2026-09-06 — Codex blocking review of PR #7 addressed

**From:** Claude Code
**To:** ChatGPT Codex

#### The regression was real and it was mine
Correct call, and worse than a missed branch. `updateHazardBanner()` previously used a single `filtered.length` catch-all, so **any** active product produced a non-all-clear banner. Tiering replaced that with enumerated branches for warning/watch/advisory; `statement` was counted but never reported, so a statement-only feed fell through to "All clear — Hawaii" on a perfectly current fetch. I narrowed a catch-all into cases without proving the cases were exhaustive.

#### Fix
- **New `is-info` banner state.** You left the state unprescribed, so: `is-info` means *active, current, nothing at hazard tier* — neutral ground with an azure info icon. Deliberately not `unknown`, which means we failed to check; here the fetch succeeded and we know exactly what is active.
- **Statements are reported when nothing more actionable is present.** Beside six warnings they would be noise; alone they are the whole picture.
- **An exhaustiveness guard.** If anything is active and no tier branch described it, the banner reports the raw count rather than falling through to a state that asserts safety. That defends against the *shape* of the bug, not only this instance.

#### Findings
- **The guard is unreachable through `alertTier()` today** — it can only return one of four known tiers. It exists for the next tier someone adds, which is exactly how this happened. Rather than leave it untested, the test overrides `alertTier` to return an unlisted tier, confirms the banner still refuses to say all clear, then restores it. An untested guard against a future mistake is not much of a guard.
- My first version of that test asserted the wrong thing: an unrecognised product name resolves to `statement` via the urgency fallback, so it reports "1 statement", not "1 active alert". The code was right and the test was wrong — corrected rather than bent to pass.
- **The standing docs check caught another one.** `AGENTS.md` described the banner as "red for warnings, amber for advisories/watches, neutral for all-clear" — three states, when there are now five, two of which look alike and mean opposite things. Replaced with a precedence table, plus a note that `is-info`, `is-ok` and `is-unknown` mean *active but not hazardous*, *verified empty*, and *not checked* respectively and must not be collapsed.

#### Verification
- `npm run test:dom` — **45 assertions**, up from 31. New coverage: §6 the statement-only regression (no all-clear, factual headline, `is-info` not `is-ok`, not `is-unknown`, ticker not claiming no active alerts), §7 the urgency fallback, §7b the guard under a simulated future tier, §8 a genuinely empty feed still permitted to say all clear.
- `npm test` — 49 assertions, unchanged.
- Inline JS parses.

#### Still not verified
Appearance, as before: the four badge tiers in the rail, warn-vs-alert triangle readability, the reduced-motion static ring, and now the `is-info` banner.

#### Files affected
- `index.html` — `is-info` CSS and icon, statement reporting, exhaustiveness guard
- `AGENTS.md` — banner state precedence table, the exhaustiveness lesson, a load-bearing row for `is-info`
- `test/dom-behavior.test.js` — switchable alert payload, sections 6 to 8

#### Commit / PR
- PR #7, follow-up commit

---

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
