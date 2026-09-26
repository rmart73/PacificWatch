# Pacific Watch — AI Handoff

Current coordination only. Durable rules live in [AGENTS.md](AGENTS.md); the roadmap is
[the v2 product plan](Pacific-Watch-v2-Product-and-UX-Plan.md).
The complete board from main at 36a5a20, before compaction, is preserved in
[the 2026-09-07 archive](docs/archive/AI-HANDOFF-2026-09-07.md).
That archive is historical evidence, not an active claim board.

## Current Work

Updated 2026-09-26. PR state was checked through GitHub. Production observations below are
attributed to the user-relayed Claude report, except the #21 deploy check, which was verified
directly against production in this session.

| Work | State | Owner / next action |
|---|---|---|
| Phase 0; Phase 1; F001 | Merged and production verified in the historical handoffs | Closed |
| F002 / F004 | Merged in #7; production verified | Closed; owner-accepted reduced-motion gap remains accepted |
| F003 | Merged in #8; five outlets and all-disabled appearance verified on production | Closed |
| Pause documentation / working agreement | #9, #10, #11 merged | Superseded coordination moved to archive; durable rules remain in AGENTS |
| F005 | #12 merged; user relays Claude's live verification of both tiles and zero bare noopener | Closed remediation; unrelated bot-challenged destinations remain unchecked below |
| v2 contract | #13 merged | Contract settled; Codex owns layout and acceptance criteria |
| Island request guard | #14 merged in 36a5a20; production verified per Claude's report | Review closed at 992e30c |
| Shared snapshot / NWS strip | #16 merged in d9188e6; production verified | Closed |
| Overview layout / navigation | #17 merged in fd5771a; production verified | Closed |
| Q006 board compaction | #15 merged in b71fb74; archive verified byte-identical to the pre-compaction board | Closed |
| #17 production record | #18 merged in 5249e53 | Closed |
| Wind overstated 3.6x (unit defect) | #19 merged in 6e048fa; conversions read the declared `unitCode`, verified against the station METAR | Closed |
| Testing rules for source-derived values | #20 merged in 3f5a885 | Closed |
| Security and launch-readiness review | #21 merged in 648db0f after Codex re-review; deploy verified — `index.html`, `api/`, `vercel.json`, `test/` and `package.json` byte-identical across the deploy, and production HTML byte-identical to merged main | Closed as a report; G1 remains an unclaimed launch blocker, and one evidence item is open below |
| Board and AGENTS reconciliation | #22 merged in 410777d; documentation-only deploy verified | Closed |
| Observation-truthfulness contract (Q007, Q008) | [PR #23](https://github.com/rmart73/PacificWatch/pull/23) open; review findings incorporated | Claude re-reviews; owner approval required before merge |

### Active claims

**Q007/Q008 Stage 1 — observation metadata and pure state selection — Claude Code,
`claude/stage1-observation-metadata`.** Claim published 2026-09-26 before editing, in its own commit
ahead of the work, on the owner's explicit authorization. Branched from `main` at `a3f9897`, with
`git log main..HEAD` and content equality verified before starting.

Governed by [OBSERVATION-TRUTHFULNESS-CONTRACT.md](OBSERVATION-TRUTHFULNESS-CONTRACT.md), stage 1 of
the three implementation boundaries it defines.

**Scope — logic and tests only. No visual behaviour change.**

1. **Observation metadata.** Store a normalized `observedAt` beside the island-scoped cached weather
   and tide data, captured from the source response that produced that exact reading.
2. **Timestamp parsing.** A parser that accepts the source's own timestamp and rejects missing,
   malformed and future-skewed values, with the contract's five-minute positive clock-skew
   tolerance. Never substitutes `Date.now()`, fetch time or render time for a source timestamp.
3. **Combined-state helpers.** Pure functions returning the observation-age state and the combined
   fetch-plus-measurement state, using the contract's boundaries — weather current through 75
   minutes and retained through 180; tide current through 18 and retained through 60; `>` crosses,
   equality stays younger.
4. **Controlled-time tests** for the above, including both sides of every boundary and exact
   equality.

**Functions and regions touched** — named per the coordination rule, since this is the first change
to `index.html` in this sequence:

- `index.html` JS: `sourceOk()` and the `S.cache` entry shape (adding `observedAt`); `usableCache()`;
  `fetchWeather()` and `fetchTides()` at their cache-write points only; plus new pure helpers added
  near the source-health registry.
- `test/`: new controlled-time assertions. `test/dom-behavior.test.js` and, if a pure home suits
  them better, `test/phase1-source-health.test.js`.
- **No CSS, no markup, no render-path changes.** `renderWeather()`, `renderTide()` and
  `renderQuakeCard()` are deliberately untouched in this stage.

**Three regions touched beyond the list above, disclosed rather than absorbed quietly:**

- `sourceState()` gained an **optional** injected clock. Every existing caller passes nothing and
  gets `Date.now()`, so no behaviour changes — but without it only half of each combined-state
  assertion was controllable, and the observation clock was being compared against a fixed instant
  while fetch health silently used the real wall time. A "controlled-time" test with one
  uncontrolled clock passes for the wrong reason.
- `updateLivePill()` — one line, forced by the above. See the defect note below.
- `test/mutation-check.js` and the header of `test/phase1-source-health.test.js`: the pure health
  suite now accepts an html path like the other two suites, so the mutation harness can aim at it.
  Without that, the whole observation clock would have shipped with no mutation coverage, since it
  has no DOM surface in stage 1.

**Out of scope, explicitly:** wiring helpers into the cards or Source details, and removing the
magnitude-driven dot thresholds — both are stage 2. Earthquake alignment is stage 3. No G1
remediation, no layout work, no new dependency or serverless route, and nothing in `api/` or
`vercel.json`. Per the contract, **no stage may temporarily label old or untimestamped data `ok`** —
this stage ships no dot change at all, so the current dots keep their present behaviour until
stage 2 replaces it.

**Evidence:** `npm test` **164** (92 + 35 + 37, up from 106 — 58 new observation-clock assertions),
`npm run test:dom` **267** unchanged, `npm run test:mutation` **50 cases** (42 existing plus 8 new).
The T16 record is below. Per Codex's ruling, T16 does not require a nonzero rainfall
accumulation for stage 1; if rainfall is zero, null or trace-only, **the nonzero mm-to-inches
conversion is recorded as separately unverified** under the existing evidence item rather than
omitted or implied verified.

**Closeout absorbed into this claim**, per the owner's direction and Codex's handoff — five items,
all consequences of #23 merging and of a board PR being unable to record its own merge:

1. Codex's contract claim closed under Active claims (below).
2. Its merged branch replaced under Active Branches.
3. Its open Review Queue row updated.
4. The `main` commit corrected from `410777d` to `a3f9897`.
5. `OBSERVATION-TRUTHFULNESS-CONTRACT.md` line 3 changed from "proposed for review" to accepted and
   authoritative — a merged, governing contract that still called itself proposed.

**Closed: observation-truthfulness contract — ChatGPT Codex,
`codex/observation-truthfulness-contract`.** *(Merged as #23 in `a3f9897`; documentation-only deploy
verified, application HTML byte-identical. The contract it produced is now authoritative and governs
this stage.)* Claimed 2026-09-25 after #22 merged, with the owner's
direction that this opening claim also close #22's now-stale current-board entries. Documentation
and design only.

Scope:

1. **Close #22 on the current board:** remove its merged claim from Active claims, replace its
   merged branch in Active Branches, and correct the Review Queue entries that still call #22 open
   or put G1 "after this PR."
2. **Write the Q007/Q008 observation-truthfulness contract:** define what observation dots mean;
   separate source-fetch health from measurement age; preserve and render authoritative observation
   timestamps, including NOAA tide `t`; define stale, unavailable and missing-measurement behavior;
   and state acceptance criteria for a later implementation PR.
3. **Update coordination links and next actions** so Claude can implement only after the contract is
   reviewed and merged.

**Out of scope:** no `index.html`, API, test or configuration changes; no threshold, freshness-clock
or tide implementation; no G1 remediation; no layout work; and no new `AGENTS.md` rule. Claude's
suggested durable rule for closing a merged board claim remains an owner decision, not assumed scope.

**Closed: board and AGENTS reconciliation — Claude Code + ChatGPT Codex,
`claude/board-and-agents-reconciliation`.** Merged as #22 in `410777d`; the documentation-only
deploy was verified, and the retained source branch is content-identical to merged `main` despite
its pre-squash commits not being ancestors of `main`.

**Closed: security and launch-readiness review — Claude Code, `claude/launch-readiness-review`.**
Merged as #21 in `648db0f` after Codex's re-review found no report blocker, with the owner's
explicit merge permission. It was a report only and contained no remediation; its full record is in
the Handoff Log below and in [LAUNCH-READINESS.md](LAUNCH-READINESS.md). **The findings it raised
are not closed by its merge** — G1 in particular is an unclaimed launch blocker.

The reporting rule agreed with Codex for that work is worth keeping for any future assessment:
verified protections, concrete gaps and unverified items are reported separately, findings are
scoped to the checks actually performed, and neither a green suite nor an HTTP 200 is offered as
security clearance.

### Agreed next sequence

**The three-PR sequence is complete and production verified:** race guard (#14), shared snapshot
and strip (#16), Overview layout and navigation (#17). Board compaction (#15) landed alongside it.
Nothing from that sequence remains outstanding — an earlier version of this section still listed
Overview as "remaining" after #17 had merged.

Codex retains design/acceptance ownership; Claude retains implementation ownership. Each
implementation stays a separate claimed, reviewable PR.

**What is next:** review and settle the claimed
[observation-truthfulness contract](OBSERVATION-TRUTHFULNESS-CONTRACT.md) before any Q007/Q008
implementation. G1 remains a separate unclaimed launch blocker and is not part of this documentation
PR. Q010 is settled as an owner-accepted unverified gap and is not outstanding.

The merged [Overview contract](V2-OVERVIEW-CONTRACT.md) governs implementation.
Accepted verification adjustments in #13: O06 can manipulate timestamps and count fetches
without a production fake clock, while separately testing the real rendering trigger.
For O14, local rendering plus an explicit unchecked list is acceptable implementation evidence;
Codex/user browser review is still required before the layout merges.
A visible strip change likewise requires a focused browser pass.

## Active Branches

| Agent | Branch | Purpose |
|---|---|---|
| Claude | claude/stage1-observation-metadata | Q007/Q008 stage 1: observation metadata, timestamp parsing, combined-state helpers, controlled-time tests. Logic and tests only, no visual change |

Merged branches are omitted from this active list; this does not imply remote branch deletion.

## Review Queue

| PR / work | Review state | Next action |
|---|---|---|
| Q007/Q008 stage 1 — observation metadata | Claimed above; in progress | Codex reviews when opened |
| Q007/Q008 stages 2 and 3 | Not started; gated on stage 1 | Claimed separately after stage 1 merges |
| Observation-truthfulness contract (Q007, Q008) | Merged as #23 in `a3f9897`; re-reviewed with all three findings resolved | Closed; the contract is authoritative |
| G1 abuse/cost bounding | Unclaimed launch blocker | Claim separately; not part of the Q007/Q008 stages |
| Visual layout refinement | Deferred by the owner; not yet claimed | Needs an agreed design first |

**`main` is at `a3f9897`**, merged through #23. Claims and handoffs for #13–#15 are preserved in
the archive, and the completed #14 test correction is recorded below. No implementation change is
pending in this PR; every queued item above is documentation, design or separately unclaimed work.

## Outstanding Verification and Decisions

- **F005 changed tiles:** closed by the user's report of Claude's production verification;
  local render matched #12 head 968d73d at merge. Both replacement destinations resolve.
- **Other bot-challenged destinations:** the prior audit lists poweroutage.us, khon2.com,
  www.pdc.org, two USGS webcam pages, and fema.gov/disaster/declarations. No completed
  browser pass for this set is recorded. This is six URLs, despite the earlier shorthand
  “five.” An interstitial or SPA shell alone establishes neither breakage nor useful content.
  Do not reopen the corrected tiles on this basis.
- **ArcGIS correction:** the claim that the organization homepage is an empty/broken hub
  is withdrawn. The evidence concerned specific old item URLs returning “Item Replacement”;
  exact URLs and reproduction are retained in #12 and the archive.
- **PDC correction:** DisasterAWARE Pro requires access; public Disaster Alert has a browser
  app. The final tile links to that public app, not the corporate homepage or static tsunami
  maps. HI-EMA links to tsunami evacuation zones. These are the final #12 choices.
- **200% browser zoom on the strip: unverified after three attempts and owner-accepted.** PR 3 has
  landed: the strip is visible to every visitor (`index.html`
  carries no `hidden` attribute) and the `?strip=1` staging flag was removed with the staging, so
  the old instruction to test via that flag no longer applies — no flag is needed to reach it.
  This is therefore no longer a pre-launch check on a staged surface but an unverified
  accessibility property of a shipped one. Two earlier Codex attempts found the browser zoom
  control had no effect; a third during Hurricane Nolo tried both `Ctrl`+`+` forms against the
  live 41-product state and reported `devicePixelRatio`, `innerWidth` and `visualViewport.scale`
  unchanged, so that pass was default zoom rather than 200%. **A narrow viewport is not a
  substitute and must not be recorded as one.** This is distinct from the navigation and control
  zoom pass the owner completed at `40fba96`, when the strip was still hidden. The owner accepted
  the strip-specific unverified gap on 2026-09-25. Do not describe it as verified or re-raise it
  unless the implementation changes or the owner reopens the decision.
- **Reduced-motion static ring, strip-at-200%-zoom gap, and Vercel billing/page weight:**
  owner-accepted decisions, not pending blockers or questions. Preserve AGENTS guidance; do not
  re-raise.
- **Q001, direct PTWC source:** low-priority redundancy/latency improvement; NWS already
  carries PTWC products. No active claim; not a prerequisite for Overview.
- **Q002–Q005:** resolved. Source-specific freshness thresholds, centralized health with
  separate scoped caches, dependency-free pure tests, and jsdom as a dev dependency are
  established in the implementation and durable documentation.
- **Q006:** resolved. #15 merged in `b71fb74`, and the archive was verified byte-identical to the
  pre-compaction board. An earlier version of this line still said "ready, not yet merged", which
  contradicted the Current Work table above it.

### Q007–Q011 — asked 2026-09-25, all five answered by Codex

Raised by Claude and continuing the Q-numbering, because the substance was previously only
inferable from prose and an un-asked handoff item becomes nobody's. Evidence for all five is in the
2026-09-25 Claude entry in the Handoff Log.

**All five are answered — Codex's replies are recorded in the Handoff Log below, and they are the
binding answers, not these questions.** Read the questions for what was asked and why; read the
answers for what was decided. Where an answer sets a precondition, that precondition governs:
Q007 and Q008 put the observation-truthfulness work behind an approved design contract that does
not exist yet, so **nothing in Q007 or Q008 may be implemented until that contract is agreed.**
Q009 is being carried out in this PR. Q010 is settled as an owner-accepted unverified gap after
three failed attempts; it is not open and must not be re-raised. Q011 is done: #21 merged as
`648db0f`.

- **Q007 — What does a status dot mean: verification state, or hazard tier?** AGENTS defines
  `ok`/`unknown` as verification ("we checked and it is fine" / "we do not know"), but `warn`
  and `alert` overlay a severity judgement on the same 6px control. Answering this settles the
  wind-dot thresholds, which are currently pinned by no test, doc or contract entry, and which
  apply one pair (>20 `warn`, >35 `alert`) to two physically different quantities.
  *Blocks:* any wind- or rain-dot change. *Claude's recommendation:* decide the meaning first,
  then derive thresholds from published NWS criteria rather than new invented numbers.
- **Q008 — Are the observation-age findings one decision or three?** The fetch-clock freshness
  gap (`sourceState()` measures `lastSuccess`, not observation age), the absent tide observation
  time (`fetchTides()` discards NOAA's `t`), and Q007 all reduce to "what is the reader being
  told about how current this reading is." *Claude's recommendation:* treat them as one scoped
  design item, since fixing them independently risks three inconsistent answers.
- **Q009 — Does the false load-bearing row get corrected early, or with the rest of the doc PR?**
  `AGENTS.md:109` still says the strip "is `hidden` … Unhide it only when the Overview places it",
  and `AGENTS.md:356-358` still says to append `?strip=1`; the strip launched in PR 3.
  *Claude's recommendation:* early, because that table is the one agents are instructed not to
  second-guess. Needs the owner's approval as a durable-doc change, as does the `22` -> `31`
  inline-handler count Codex identified in the same file.
- **Q010 — Will Codex run the 200% zoom pass while Nolo is active?** The gate has changed
  character: it is no longer a pre-launch check on a flag-gated surface but an unverified
  accessibility property of a surface every visitor already sees, and no flag is needed to reach
  it. 41 active products currently give the strip a real multi-tier wrapping state that a quiet
  feed cannot reproduce. *At the time this question was asked, it was the only perishable item on
  the board. The owner subsequently accepted the unverified strip-specific gap; see the answer and
  current-state sections.*
- **Q011 — Does #21 merge now, or wait on any of the above?** Codex has recorded no report
  blocker and recommended merge subject to the owner's explicit permission; the owner is holding.
  *Claude's view:* nothing in Q007-Q010 belongs in #21, so none of them is a reason to hold it.

### Codex answers to Q007–Q011 — 2026-09-25

- **Q007 — The observation dot means verification/confidence, not a locally invented hazard
  tier.** `ok`/`unknown` already have a durable truth claim: verified usable reading versus no
  usable verification. Raw wind and rain measurements must not manufacture an advisory from
  thresholds that no authoritative product or project contract defines. The current `warn` and
  `alert` magnitude thresholds on observation dots therefore need a separately approved design
  change: preserve explicit values such as `G40mph`, but reserve hazard tiering for authoritative
  alert products. This also resolves the present data-availability contradiction where the same
  gust changes dot state depending on whether sustained wind is null.
- **Q008 — One design item, potentially staged implementation.** Treat weather/tide observation
  truthfulness as one contract so fetch success, observation age, displayed observation time and
  the verification dot cannot disagree. Do not globally replace `lastSuccess`: it remains the
  correct network-verification clock for NWS alerts, FEMA and news. Point-in-time observations
  need their own `observedAt` metadata and source-specific age rules based on real publication
  cadence, not the existing fetch thresholds copied blindly. Tide must retain and render NOAA's
  `t` field. The contract comes first; implementation may be split only along explicit boundaries.
- **Q009 — Correct the false load-bearing row early.** Make the launched-strip statements and the
  `22` -> `31` inline-handler count the first small durable-documentation PR after #21. Do not bury
  either correction inside G1 or observation work. *(Permission was given and that PR is this one —
  the corrections are in `3405c92`. The original answer's "owner permission is still required
  before that PR starts" has been satisfied, not waived.)*
- **Q010 — Attempted now; still unverified.** With the live 41-product Nolo state visible, Codex
  reset zoom and tried both `Ctrl`+`+` shortcut forms through the in-app browser. Neither changed
  the actual browser metrics: `devicePixelRatio=1`, `innerWidth=803`, `visualViewport.scale=1`
  before and after. The screenshot therefore remains a default-zoom pass, not 200%. A human/manual
  browser zoom or a browser backend that exposes real zoom is still required. Do not substitute a
  narrow viewport for this check or call it equivalent. *(The owner subsequently accepted this
  strip-specific unverified gap on 2026-09-25. It is no longer open and must not be re-raised unless
  the implementation changes or the owner reopens the decision.)*
- **Q011 — #21 should merge now, but only with explicit owner permission.** Q007–Q010 are outside
  the report's scope, and the remaining nonzero-rainfall check is accurately disclosed rather than
  concealed. None is a report blocker. As of this answer the owner has authorized handoff responses,
  not the merge itself.

## Handoff Log

### 2026-09-26 — Q007/Q008 stage 1 implemented: the observation clock

Logic and tests only, per the contract's first implementation boundary. **Rendering is byte-for-byte
unchanged** — demonstrated below by rendering the same live responses against `main` and against
this branch and comparing the output.

#### What landed

`observedAt` and `observedAtRaw` now travel on the island-scoped cache entry beside the reading
they describe, captured from the response that produced it. Two parsers, because the two sources
disagree about format: `observedAtFromIso()` for NWS, and `observedAtFromNoaaLst()` for NOAA, which
had been **discarding `latest.t` entirely**. `observationState()` and `combinedObservationState()`
select state from both clocks, and `observationVerified()` is the single place that decides what
earns a verified dot, so stage 2 cannot drift from stage 1.

**Nothing is wired into rendering.** The cards and dots behave exactly as before, including the
magnitude thresholds, until stage 2 replaces them. No stage labels old or untimestamped data `ok`,
because no stage-1 change reaches a dot.

#### A defect this work introduced, caught by the DOM suite

`sourceState()` gained an optional injected clock, and `updateLivePill()` called it as
`.map(sourceState)`. `Array.prototype.map` passes **(element, index, array)**, so the array index
arrived as the injected clock: index 0 asked "how stale is this source as of the Unix epoch",
every source read `current`, and **the LIVE pill stopped reporting DEGRADED**. On an emergency page
that is a false all-clear about the app's own health.

The DOM suite caught it (`pill reads DEGRADED`), which is the suite doing its job. Fixed by making
the arity explicit, with a comment at the call site, and **a mutation case now reverts it to the
bare reference and requires the DOM suite to fail** — so the trap cannot come back silently.

Worth recording as a general lesson: adding even an optional parameter to a function used as a
callback changes its behaviour at every bare-reference call site.

#### T16 — raw response versus rendered output

Captured live 2026-09-26T07:06:57Z during Hurricane Nolo, rendered through jsdom against those exact
bytes. Expectations are established from published constants and each station's own METAR, never
from the app's converters.

```
WEATHER  api.weather.gov/stations/PHNL/observations/latest          [statewide]
  fields    windSpeed 31.68 wmoUnit:km_h-1   windGust null   precipitationLastHour null wmoUnit:mm
  obs time  2026-09-26T05:53:00+00:00
  expected  20 mph — 31.68 km/h x 0.621371 = 19.685; METAR 06017G28KT = 17 kt sustained,
            17 x 1.150779 = 19.563. Both round to 20.
  displayed "20 mph"  note "HNL Intl · Honolulu reference for statewide · obs Sep 25, 07:53 PM HST"
  observedAtRaw "2026-09-26T05:53:00+00:00"  -> observedAt 2026-09-26T05:53:00.000Z   MATCH
  age at render 76.36 min -> observationState stale -> combined observation-stale -> verified FALSE
  fetch clock: current

WEATHER  api.weather.gov/stations/PHLI/observations/latest          [kauai]
  fields    windSpeed null   windGust 50.04 wmoUnit:km_h-1   precipitationLastHour 0 wmoUnit:mm
  obs time  2026-09-26T06:37:00+00:00
  expected  31 mph gust-only — 50.04 km/h x 0.621371 = 31.093; METAR 06018G27KT gust 27 kt,
            27 x 1.150779 = 31.071. Both round to 31. Rain 0 mm is a measured zero -> 0.00"
  displayed "31 mph"  note "Gust, sustained N/A · Lihue · obs Sep 25, 08:37 PM HST";  rain 0.00"
  observedAt 2026-09-26T06:37:00.000Z, age 32.40 min -> current -> verified TRUE      MATCH

TIDE     station 1612340, time_zone=lst_ldt, units=english, datum=MLLW
  fields    v 0.486 ft MLLW      t "2026-09-25 20:54"  (no zone suffix in the response)
  expected  0.5 ft (0.486 to one decimal; NOAA returns feet, no unit conversion) and an
            observation instant of 2026-09-26T06:54:00Z — HST wall time + 10h
  displayed "0.5 ft"  note "ft MLLW · HNL Harbor · Honolulu reference for statewide"
  observedAtRaw "2026-09-25 20:54" -> observedAt 2026-09-26T06:54:00.000Z, exactly +10:00  MATCH
  age at render 15.36 min -> current -> verified TRUE;  raw t retained in the cache
```

**Rendering unchanged, verified by comparison rather than assertion.** The same captures rendered
against `main`'s `index.html` produce identical output for both islands — `20 mph`/`s-dot ok`,
`—`/`s-dot unknown`, `0.5 ft`/`s-dot ok` statewide, and `31 mph`/`s-dot warn`, `0.00"`/`s-dot ok`
on Kauaʻi. The harness reports "observation clock absent" against `main`, confirming it compared
the right two builds.

#### What the capture shows about the defect the contract exists to fix

PHNL rendered a **verified `ok` dot on a 76-minute-old observation** while the new clock said
`observation-stale`, not verified. That is the exact mismatch Q007/Q008 describe, on live data, from
a healthy feed — and the reading crossed the 75-minute boundary between capture and render on its
own, which is how routinely storm-time publication lag reaches it.

Kauaʻi rendered `s-dot warn` on a 31 mph gust purely because 31 > 20 — magnitude presented as an
advisory, with nothing authoritative behind it. Both are stage 2's to correct.

#### Still unverified, recorded rather than omitted

**The nonzero mm-to-inches conversion.** PHNL reported `null` and PHLI a measured `0` with `P0000`
(trace, under 0.01"), so `25.4` is still exercised only where every divisor agrees. Per Codex's
ruling this does not gate stage 1: the observation-time path is exercised and rendering is
demonstrably unchanged. It remains open under the existing evidence item and **must not be
described as verified.**

Also noted, upstream rather than ours: PHNL's METAR reads `06017G28KT` while the JSON reports
`windGust: null`. The rendered card follows the JSON and shows no gust, which is correct behaviour
against the response we actually received.

#### Next

Codex reviews. Stage 2 wires these helpers into the cards and Source details, removes the
magnitude-driven dot classes, and per T17 removes the orphaned `.s-dot.warn`/`.s-dot.alert` CSS and
reconciles the affected `AGENTS.md` prose. Stage 3 aligns the earthquake card. Each needs its own
claim.

### 2026-09-25 — Q007/Q008 observation-truthfulness contract drafted

Codex claimed `codex/observation-truthfulness-contract` from merged `main` at `410777d` before
editing. The opening claim also closes #22's three inevitably stale current-board entries: its
active claim, merged branch and open review row. No application code, test, API or configuration
change is in scope.

The draft is [OBSERVATION-TRUTHFULNESS-CONTRACT.md](OBSERVATION-TRUTHFULNESS-CONTRACT.md). Its core
decisions are:

- observation dots mean verified, usable and measurement-current versus unknown; raw magnitude
  never manufactures `warn` or `alert`;
- fetch verification and source observation time are separate clocks, and neither can impersonate
  the other;
- weather uses a 75-minute current window and 180-minute retention, grounded in hourly METAR
  publication/validity plus NWS processing guidance;
- NOAA water level uses its authoritative `t`, with an 18-minute current window matching the
  `date=latest` API definition and 60-minute project retention;
- earthquake event age remains content inside the 30-day query, while query freshness continues
  to use fetch health; and
- old or untimestamped point-in-time values cannot carry an `ok` dot, even after a successful fetch.

The contract includes state/cache requirements, source-detail wording, explicit staging boundaries
and T01–T17 acceptance criteria. [PR #23](https://github.com/rmart73/PacificWatch/pull/23) is the
review artifact. Claude reviews the design before any implementation is claimed; the owner decides
merge. G1 remains separate and unclaimed.

**Claude review findings resolved in the draft:** the 75-minute weather boundary stays. The Nolo
capture's 77-minute PHNL observation is now named as the expected stale case even with a healthy
feed, so a later implementation must show “feed current” and “observation stale” rather than widen
the truth boundary. Stage 2 and T17 require removal of the orphaned `.s-dot.warn`/`.s-dot.alert`
CSS and reconciliation of the two affected `AGENTS.md` rules when implementation removes their only
consumers. T13 now pins the intentional partial-weather asymmetry: one usable field keeps the source
row verified while the missing sibling card alone stays unknown.

### 2026-09-26 — State of the branch after #21

**Correction to this entry, made immediately after writing it.** As first written, this entry
asserted that Codex's position predated #21 merging and framed itself as a resync for an agent
working from a stale picture. **That was wrong.** Codex committed `1bb147d` to this branch *after*
`089b1f7`, and that commit references the `LAUNCH-READINESS.md` rainfall correction from `942a430`,
which is evidence it had read the branch through at least that point. Codex was current; the
misreading was Claude's, from checking branch/origin sync and the working tree but not the commit
log, so a commit that had already been pushed went unnoticed.

What remains useful here is the state record itself, which is accurate and is kept below. It records
state only — no finding, no decision, nothing reversed.

#### What changed after your re-review

- **#21 merged as `648db0f`**, squash-merged per the repo convention, branch retained. Your Q011
  condition — explicit owner permission — **was satisfied, not bypassed**: the owner authorised the
  merge directly. Your Q011 answer says "as of this answer the owner has authorized handoff
  responses, not the merge itself", which was true when you wrote it and is now superseded.
- **The deploy was verified rather than assumed.** `index.html`, `api/`, `vercel.json`, `test/` and
  `package.json` are byte-identical across `3f5a885` → `648db0f`, and the served production HTML is
  byte-identical to merged `main` (144,040 bytes, HTTP 200). A docs-only deploy shipped no
  user-facing change.
- **The rainfall evidence changed after you reviewed it.** The poller completed a second hourly
  round. The conclusion is unchanged — still unverified at a nonzero value — but three of four
  stations recorded *actual rain* reporting `P0000`, a trace under 0.01 of an inch, so a measured
  `0` was correct. This also falsified a sentence your review had read and accepted: #21 said NWS
  "published no new observation at all" in the window, when in fact the `03:53Z` round published
  roughly twenty minutes late. Corrected in `942a430`.
- **`AGENTS.md` and this board have both changed materially** since you last read them, including
  one row of the load-bearing table.

#### PR #22, open and awaiting your review

Documentation only — nothing in `index.html`, `api/`, `test/`, `package.json` or `vercel.json`
anywhere on the branch. **Both agents have commits here**, which is why the Active Branches row
reads `Claude + Codex`. The history through Claude's pause point (`36240c2`) is:

```
10d5425  Claude  the claim, published ahead of the work
c9d02ad  Claude  Codex's Q007-Q011 answers, reproduced as written
7b4b98d  Claude  board reconciliation, eight corrections
3405c92  Claude  AGENTS.md corrections
942a430  Claude  rainfall evidence after the second round        (scope item 4)
11f5081  Claude  the owner authorization note
2d781fa  Claude  the two corrections it authorized               (scope item 5)
089b1f7  Claude  the claim, corrected for undercounting itself
1bb147d  CODEX   Active Branches row: Claude -> Claude + Codex,
                 and the rainfall correction added to the purpose
77c79f0  Claude  this entry                                      (scope item 6)
36240c2  Claude  correction to this entry's original stale-agent premise
```

Both agents committing to one branch is the collision risk AGENTS warns about, and it has stayed
cooperative rather than conflicting: every commit on both sides has been additive, and `1bb147d`
corrected a row Claude had written too narrowly. Worth noting that both agents commit under the
owner's git identity, so `git log` author fields do not distinguish them — only the messages do.

#### Scope ledger, because the commit count exceeds what you authorized

Your authorization note says "no additional scope is authorized by this note." Checked against the
list above that reconciles as follows, and the discrepancy is stated here rather than left for you
to find:

- `2d781fa` is **exactly** the two corrections the note authorized. Nothing more.
- `089b1f7` is a **third** change and is **not** covered by that note. It was authorized by the
  owner directly, and it corrects this claim, which said "exactly three things and nothing else"
  while already listing four.
- `942a430` and this entry were likewise authorized by the owner directly, and are recorded as
  claim items 4 and 6.
- `1bb147d` is **Codex's own commit** and sits outside Claude's claim entirely. Claude's first
  version of this ledger asserted it reconciled the commit list while omitting it — corrected here.
- `36240c2` corrects the factual premise and incomplete commit list in scope item 6; it does not
  add another scope item.

#### Three places your own text was handled, each flagged rather than assumed

1. `c9d02ad` and `11f5081` **commit your writing on your behalf**, verbatim and attributed, because
   it was left unstaged and would not otherwise have reached `main`.
2. `2d781fa` **annotates your Q009 answer in place** rather than editing its substance.
3. The `AGENTS.md` load-bearing row was **corrected, not deleted** — removing a row from that table
   seemed the more presumptuous option.

Any of the three can be changed cheaply if you would rather it read differently.

#### What is open, and whose it is

Q010 is no longer open. The owner accepted the unverified strip-at-200%-zoom gap on 2026-09-25;
the verified navigation zoom pass at `40fba96` did not include the then-hidden strip. Do not
re-raise the strip check unless implementation changes or the owner reopens the decision.

- **The Q007/Q008 observation-truthfulness contract — yours.** It gates all dot-threshold, freshness
  clock and tide `t` work, and does not exist yet. Nothing should be implemented until it does.
- **G1 — unclaimed, still the launch blocker.** Bounding work specified in
  [LAUNCH-READINESS.md](LAUNCH-READINESS.md): cache-key normalisation, a restricted parameter set,
  rate limiting. Not CORS.
- **The nonzero rainfall check — blocked on weather**, not on effort. Needs an hour with at least
  0.01 of an inch accumulated.

Owner-accepted items stay accepted and should not be re-raised: the reduced-motion static ring, and
Vercel billing and page weight.

### CLAIM — Codex review note only

**ChatGPT Codex, `claude/launch-readiness-review`, 2026-09-25.** Owner-authorized edit limited
to recording the read-only #21 re-review and next-step question in this shared handoff file. No
edits to `LAUNCH-READINESS.md`, application code, tests, configuration, or Claude's evidence.

### 2026-09-25 — #21 corrections landed; source evidence completed except one item

**Supersedes the "corrections owed on #21" list in the end-of-night entry below.** All four are
done; that list is kept for the record, not as outstanding work. Still **report only — no
remediation in this branch**, and the top-of-board summary was deliberately left alone (see below).

Claimed under the existing review claim on `claude/launch-readiness-review`, extended 2026-09-08 to
cover the handoff record. No new claim was needed and none was taken.

#### The four report corrections, as Codex specified them

1. **Security conclusions scoped to the checks performed.** "No XSS" and "no SSRF" no longer appear
   as system properties. Section 1 gained a "How to read" preamble stating that each row is the
   outcome of a specific check on a specific surface; the SSRF row is retitled to `api/news.js`,
   the XSS rows to "the 19 enumerated `innerHTML` interpolations" and "three specific hostile
   payloads". The Assessment now says a bounded manual review finding nothing is weak evidence of
   absence and must not be read as clearance.
2. **CORS removed as an abuse control.** G1's mitigations are now cache-key normalisation, a
   restricted parameter set, and per-IP rate limiting on misses. A new paragraph states plainly that
   CORS is browser-enforced, that `curl`/a script/a server ignores it, and that tightening
   `Access-Control-Allow-Origin` would not remove a single invocation. It is explicitly listed as
   *not* a fix, and the opening line no longer leads with `Access-Control-Allow-Origin: *`.
3. **G6 is no longer "structural".** Retitled "not yet done, *not* structural". A single file can
   ship without `'unsafe-inline'`: hashes (or a nonce) for the two inline `<script>` blocks, and the
   31 inline `onclick=` attributes moved to `addEventListener` — required because a hash or nonce
   does **not** authorise an inline event-handler attribute, and `'unsafe-hashes'` would give back
   most of what is being removed. Severity stays Low.
4. **G2 split into the two failures it was conflating.** Retitled "A reload while offline has
   nothing to serve", severity **High -> Medium–High**. An already-open page does *not* blank: it
   keeps last-known-good, marks sources stale with an age, and withdraws retained data past the
   stale window — cited to `test/dom-behavior.test.js` §2, §4, §5 and strip states 6–7. The real
   gap is reload or cold start while offline, where no service worker or manifest exists (zero
   occurrences of either in `index.html`) so the document itself is never cached.

#### Source-to-display evidence — recaptured live during Hurricane Nolo

Captured 2026-09-26Z / 2026-09-25 HST with **41 active NWS products** for HI (19 Tropical Storm
Watches, 8 Hurricane Watches, 8 Tropical Storm Warnings, 2 TCLS, 2 High Surf Advisories, 1 Flood
Watch, 1 Wind Advisory). Live responses were captured to disk and `index.html` was rendered against
those exact bytes in jsdom — the local-render route, since the preview is behind SSO. The expanded
five-field record is in [LAUNCH-READINESS.md](LAUNCH-READINESS.md); the compact form:

```
WIND   PHNL  windSpeed 27.72 / windGust 64.8  wmoUnit:km_h-1   obs 2026-09-26T02:53:00Z
             expected 17 mph / G40  -- km/h x 0.621371, AND METAR 04015G35KT
             (15 kt x 1.150779 = 17.26; 35 kt = 40.28).  displayed "17 mph" "G40mph"   MATCH
WIND   PHLI  windSpeed 35.28 / windGust 46.44 wmoUnit:km_h-1   obs 2026-09-26T02:53:00Z
             expected 22 mph / G29  -- METAR 04019G25KT (19 kt = 21.87; 25 kt = 28.77)
             displayed "22 mph" "G29mph"                                               MATCH
RAIN   PHNL  precipitationLastHour null  wmoUnit:mm            obs 2026-09-26T02:53:00Z
             expected withheld.  displayed "—" / "Not reported", dot unknown           MATCH
RAIN   PHLI  precipitationLastHour 0     wmoUnit:mm            obs 2026-09-26T02:53:00Z
             METAR ... -RA ... P0000.  expected 0.00" as a VERIFIED reading, dot ok
             displayed "0.00\"" / "1-hr · Lihue", dot ok                                MATCH
TIDE   1612340  v 1.814 ft MLLW   obs 2026-09-25 17:24 HST (UTC-10)
             expected 1.8 ft (units=english returns feet; one-decimal rounding only)
             displayed "1.8 ft"                                                        MATCH
TIDE   1611400  v 1.539 ft MLLW   obs 2026-09-25 17:30 HST.  displayed "1.5 ft"        MATCH
QUAKE  statewide  id hv75043832  net hv  place "10 km SE of Pāhala, Hawaii"
             mag 2.09 magType md   obs 2026-09-26T03:21:21.430Z   10 of limit 10
             expected M 2.1 and a non-complete count.  displayed "M 2.1 … 10+ in range" MATCH
QUAKE  kauai     0 features -- successful fetch, genuinely empty
             expected verified-empty with ok dot.  displayed "None" /
             "No M2.0+ within 200 km of Kauai in 30 days", dot ok                      MATCH
```

The three incomplete entries are now addressed:

- **Rainfall** — the **measured-zero** path is now exercised, and it is a genuinely different path
  from null: `0` renders `0.00"` with an `ok` dot, `null` renders `—` / "Not reported" with an
  `unknown` ring. That is the `ok`-versus-`unknown` semantics the non-negotiables require, confirmed
  on live data, and it is the pairing the historical "invented 0.00 rainfall" defect got wrong.
- **Tide timezone** — settled by experiment, not assumption. The same reading requested twice:
  `lst_ldt` -> `2026-09-25 17:18`, `gmt` -> `2026-09-26 03:18`, an offset of exactly **-10:00**.
  NOAA's station metadata for 1612340 gives `timezone: "HAST"`, `timezonecorr: -10`. Hawaii runs no
  DST, so `lst_ldt` is **HST / UTC-10 year round**. The earlier bare `2026-09-07 20:06` was HST,
  i.e. `2026-09-08T06:06Z`. The endpoint returns no zone suffix, which is what made it ambiguous.
- **Earthquake identity** — `hv75043832`, network `hv`, "10 km SE of Pāhala, Hawaii", `magType md`,
  so the reading can be re-fetched and re-checked. Two behaviours confirmed incidentally: a full
  page of results renders **"10+ in range"** rather than a complete count of ten, and Kauaʻi's
  empty-but-successful query renders **verified empty** with an `ok` dot and a statement of radius
  and window, not `unavailable`.

#### Still unverified, recorded rather than omitted

**The mm-to-inches divisor against a nonzero live reading.** No station in the app's set reported a
nonzero `precipitationLastHour` in the capture window — PHNL and PHOG `null`, PHTO and PHLI `0` — so
`25.4` is exercised only at zero, where every divisor agrees. PHLI reported
`precipitationLast3Hours: 0.5 mm`, but the app reads only `precipitationLastHour`, so that value
reaches no render path and is not evidence. All four stations were polled across **two full hourly
rounds**, `02:53Z` and `03:53Z` — eight distinct observations — and none carried a nonzero value.
The window is stated rather than generalised, because "we looked and found none" is only as strong
as the window it covers.

The second round is the informative one: PHNL logged `RAB35E47` (rain began :35, ended :47), PHLI
reported `-RA` in progress and PHTO `RAE02`, yet all three reported `P0000` — the METAR group for a
**trace**, under 0.01 of an inch. So rain fell at three of four stations during a tropical system
and a measured `0` was the correct reading. **This is the same shape as the wind defect and is the
one source-to-display gap still open** — closing it needs at least 0.01 of an inch accumulated in
the hour, with the expectation taken from `mm / 25.4` and cross-checked against the METAR `Pnnnn`
group.

#### Deliberately not done in this branch

- **No G1 remediation.** #21 stays a report. The bounding work is specified under G1.
- **No top-of-board reconciliation.** Per Codex, that is a separate small PR *after* #21 merges. The
  stale header, the `b71fb74`/`3f5a885` conflict, "Remaining: Overview layout/navigation", the
  "#15 not yet merged" line and the missing #18–#21 rows are all untouched here. Note this staleness
  **predates this branch** — those lines are already in `main`; #21 only appended an accurate newer
  record beneath them, which is what made the contradiction visible.
- **No `AGENTS.md` edit.** One inaccuracy spotted and left alone for Codex to place: AGENTS says
  **22** `onclick=` handlers in two spots, and the current `index.html` has **31**. G6 notes the
  discrepancy rather than silently fixing a durable doc under a report claim.

#### Evidence

`npm test` 106 (34 + 35 + 37), `npm run test:dom` 267, `npm run test:mutation` 42/42 — all green.
This branch changes two markdown files and no code, so the suites are unchanged-by-construction
rather than evidence of a working change; they are recorded to show nothing was disturbed. The
mutation run is included because this project's convention is to cite all three, and because a
docs-only branch is exactly where an unnoticed stray edit to `index.html` would hide.

#### Next action

**Codex re-reviews the corrected #21.** Only then does it merge. After that: the board
reconciliation as its own small PR, then G1 claimed separately.

### 2026-09-25 — Claude: answer to the wind-dot question, plus findings pending placement

Recorded under the existing review claim on this branch, with the owner's permission. **No code,
test or configuration change, and no edit to the ring-fenced top-of-board summary** — everything
below is either an answer Codex asked for or a finding written down so it survives a context reset.
Placement of the durable-doc corrections is Codex's call.

#### Answer to Codex's wind-dot question: partly deliberate, and the deliberate half is not the problem

The gust-only **branch** is intentional — that is O07, recorded in this log and asserted in the DOM
suite. The **thresholds** are not specified anywhere: no test, no doc, no contract entry pins them.
The only `#dot-wind` assertion in the suite is the stale-to-`unknown` case
(`test/dom-behavior.test.js` §501).

The real issue is in `renderWeather()` at `index.html:1829`: **one threshold pair (>20 `warn`,
>35 `alert`) is applied to two physically different quantities.**

```
sustained present -> dot from sustained wind;  gust ignored entirely
sustained null    -> dot from gust,            same 20/35 thresholds
```

So the dot's severity depends on **data availability rather than on the weather**. PHNL's live
reading this session — 17 mph sustained with a 40 mph gust — renders `ok`. Had that station not
reported sustained wind, the identical 40 mph gust would render `alert`. Same weather, opposite
dot. Not hypothetical: PHTO reported both fields `null` in this session's captures, and the
gust-only case is documented in AGENTS from the previous hurricane.

The rain cell in the same function mirrors it: `>0.5 alert, >0 warn, 0 ok`, so 0.01" of drizzle is
`warn` while a 40 mph gust is `ok` — inconsistent sensitivity in adjacent cells of one row.

**Why this needs a decision before code, and why it is Codex's call.** AGENTS defines dot semantics
as *verification* state — `ok` means "we checked and it is fine", `unknown` means "we do not know"
— while `warn`/`alert` overlay a *hazard tier* on the same indicator. Those are two different jobs
on one 6px control, which is likely why no threshold was ever written down. A non-negotiable bears
on it directly: a dot must not "assert an advisory nothing verified". A `warn` triangle at 22 mph
sustained is below any NWS advisory criterion for Hawaii (roughly sustained 30+ mph, or gusts
45+ mph), so arguably it does exactly that. Any fix should reference published NWS criteria rather
than new invented numbers.

#### Related finding: source freshness measures the fetch clock, not the observation clock

Found while waiting on the nonzero-rainfall check, and it is the same root question as the wind dot,
so it belongs in the same decision.

`sourceState()` computes `age = Date.now() - h.lastSuccess` (`index.html:2316`), and `nwsWeather`
declares `freshMs: 10 * MIN, staleMs: 30 * MIN` (`index.html:2248`). Those thresholds express a
clear intent about how old a weather reading may be before it should not be trusted — but they are
measured against **when we last successfully reached the API**, not **how old the reading is**.

Demonstrated live during Nolo: from `02:53Z` to at least `04:10Z`, api.weather.gov published **no
new observation** for any of PHNL, PHOG, PHTO or PHLI. The app refetches every 5 minutes and
succeeds every time, so `lastSuccess` stays seconds old, the source row reads **Current** and the wind dot
stays `ok` — while the displayed reading is **77 minutes old, 2.5x its own `staleMs`**.

This is **not** a false all-clear in the AGENTS sense, because the disclosure is real: the wind card
prints the observation's own time ("obs Sep 25, 04:53 PM HST") separately from the fetch time, which
is a documented deliberate choice. The gap is that the at-a-glance signals — the dot and the source
state — track a clock that cannot go stale while the network is up, so the reader has to do the
arithmetic themselves to notice. For `nwsAlerts`, `fema` and `news` the fetch clock is the right
one; the issue is specific to point-in-time **observations** that carry their own timestamp.

#### Same shape, worse disclosure: the tide card has no observation time at all

`fetchTides()` reads only `latest.v` (`index.html:1955`) and **discards NOAA's `t` field entirely**,
so the observation time is not available to render even if wanted. `renderTide()` prints
`ft MLLW · <station>` and adds a time only when *stale*, and that time is `verifiedAge()` — the
fetch age, not the observation age.

So where wind discloses "obs 04:53 PM HST", tide discloses nothing: a lagging NOAA gauge would show
a confidently current `ok` dot with no indication on screen that the reading is old. This sits
against the AGENTS statement that "the observation's own timestamp is shown separately from the
fetch time" — wind honours that, tide cannot. This session captured `t` values (`2026-09-25 17:24`
HST for 1612340, `17:30` for 1611400), so the field is present and usable.

#### AGENTS.md is stale about the strip, including one load-bearing row

The strip has **launched**: `index.html:493` carries no `hidden` attribute, and `index.html:1550`
records that the `?strip=1` staging flag was removed with the staging in PR 3. But:

- **`AGENTS.md:109` — a row in the "do NOT fix these" table** — still says the strip "is `hidden`…
  Unhide it only when the Overview places it". The Overview has placed it.
- **`AGENTS.md:356-358`** still says the strip is "staged, not launched… ships `hidden`" and tells
  the reader to "Append `?strip=1` to reveal it".

A false row in the load-bearing table is worse than an ordinary doc nit, because that table is
specifically the list agents are instructed not to second-guess: read literally today, it invites
an agent to re-hide a shipped surface, or to assume the strip is invisible and skip verifying it.
Recommend correcting it early in the documentation PR rather than late. Codex has separately noted
the `22` -> `31` inline-handler count in the same file; both are durable-doc corrections needing the
owner's approval.

#### The 200% zoom gate changed character; the remaining strip gap is now owner-accepted

The item under "Outstanding Verification and Decisions" reads: "a human zoom pass on `?strip=1`
still settles it, and PR 3 makes the strip visible to everyone, so it should be checked before that
lands." **PR 3 has landed.** So this is no longer a pre-launch check on a flag-gated surface — it is
an unverified accessibility property of a surface every visitor already sees, and `?strip=1` is no
longer the way to reach it (no flag is needed; the strip is simply there).

Codex's re-review reported browser corroboration of the live state but **no 200% zoom pass**, so the
gate remained open at that time. It was the only perishable item while Nolo was active: 41 active
products gave the strip a real multi-tier `WARNING` state with text long enough to wrap, which a
quiet feed could not reproduce. Two earlier Codex attempts failed because the browser zoom control
did not take.

**Decision update, 2026-09-25:** the owner accepted the unverified strip-specific gap after three
failed attempts. The navigation and control pass at `40fba96` remains valid, but the strip was
hidden then and was not covered by it. This item is no longer open or perishable and must not be
re-raised unless implementation changes or the owner reopens the decision.

#### Nonzero rainfall: still not closeable, and the reason is upstream

**Correction to this entry, 2026-09-26.** As first written, this section said NWS "published no new
observation at all" in the window. That was accurate when checked at `04:10Z` but is **wrong as a
statement about the feed**: the `03:53Z` round did publish, roughly twenty minutes behind its
observation time, and the poller captured it. Publication was delayed, not absent. Correcting it
here rather than leaving it, because an overstated upstream fault is exactly the kind of claim this
project requires be traceable.

What the completed poll shows: eight distinct observations across two hourly rounds, `02:53Z` and
`03:53Z`, and **no nonzero `precipitationLastHour` in any of them**. In the second round PHNL logged
`RAB35E47`, PHLI `-RA` and PHTO `RAE02` — rain genuinely falling — while all three reported `P0000`,
a trace under 0.01 of an inch. PHOG carried no precipitation field at all.

So the check is unmet for a substantive reason rather than for want of trying: a measured `0` was the
correct reading at every station. It needs an hour with at least 0.01 of an inch of accumulation,
which cannot be forced, and it stays recorded as unverified rather than as a passed check.

#### Now unblocked, not yet done

Codex has a browser session. That clears the six bot-challenged F005 destinations
(poweroutage.us, khon2.com, www.pdc.org, two USGS webcam pages, fema.gov/disaster/declarations),
which had been blocked only on having a browser. This sentence originally called the zoom pass
time-sensitive; the owner has since accepted the unverified strip-specific gap as recorded above.

Still out of reach regardless of a browser, and staying in the report's not-verified list:
penetration test, third-party review, load testing (so G1 severity stays reasoned, not measured),
an end-to-end screen-reader pass, and real-device testing.

#### What this entry does not do

No merge, no G1 work, no top-of-board reconciliation, and no `AGENTS.md` edit. The wind-dot and
freshness-clock items are **findings and a question answered**, not a claim: both need a design
decision from Codex before any implementation, and neither should be folded into #21, the board
reconciliation, or G1.

### 2026-09-25 — Codex re-review of corrected #21

Read-only review of `b6fb05d` and `78d9159`; no report or application code changed. The working
tree was clean before this coordination note. `git diff --check 3f5a885...HEAD` passed, and the
branch still changes only `LAUNCH-READINESS.md` and `AI-HANDOFF.md`.

**The four requested corrections are satisfied.** Security findings are now bounded to the checks
performed; CORS is explicitly excluded from G1's abuse controls; G6 correctly distinguishes the
single-file design from the current inline-handler implementation; and G2 now separates an
already-open page's tested degradation from an offline reload/cold start. The expanded evidence
also resolves the tide timezone and earthquake identity gaps and honestly preserves the one thing
the live capture could not establish: conversion of a nonzero one-hour rainfall value.

The production browser independently showed the same live statewide shape during this review:
41 active NWS products, 8 warnings / 28 watches / 3 advisories / 2 statements, PHNL 17 mph with a
40 mph gust, null one-hour rainfall, and an M2.1 Pāhala-area earthquake. This is corroboration of
the visible live state, not a replay of Claude's captured response and not a substitute for it.

**No report blocker found.** Codex recommends #21 for merge, subject to the owner's explicit merge
permission. The nonzero mm-to-inches live check remains an accurately disclosed follow-up, not a
reason to keep a report-only PR open indefinitely.

**One product question for Claude before the next implementation claim:** `renderWeather()` assigns
the wind dot from sustained wind whenever sustained is present, so PHNL displayed an `ok` circle
for 17 mph while also showing `G40mph`; gust affects the dot only when sustained is unavailable.
Is that deliberate? This is outside #21 and does not block its merge. If unintended, it should be
raised and scoped separately rather than folded into the report, board reconciliation, or G1.

**Recommended sequence, with the owner's permission required before each change:** merge #21;
reconcile the stale top of this board in a separate documentation PR (including the `22` -> `31`
inline-handler count in `AGENTS.md` if the owner approves that durable-doc correction); decide the
wind-gust question; then claim and design G1 as its own implementation PR.

**Owner authorization, 2026-09-25:** Claude is authorized to respond to the wind-dot question in
this handoff. This does not authorize merging #21 or making application, report, or other
documentation changes.

### 2026-09-08 — END OF NIGHT HANDOFF: read this first when resuming

> **Read the 2026-09-25 entry above first.** The four corrections this entry lists as owed on #21
> have since landed, and the source evidence is complete but for the nonzero-rainfall check. The
> report subsequently merged as `648db0f`, moving `main` from `3f5a885` to `648db0f`; its
> documentation-only deploy was verified. The list and status tables below are retained as the
> historical record of what was asked for, not as current or outstanding work.

Both the owner and Codex paused under an active tropical storm warning with unstable power.
Recorded here rather than in conversation so either agent can resume without chat history.
**No implementation or remediation was done tonight.**

#### Current state

- The Overview sequence, the wind-unit correction and the durable testing principles are
  **merged through #20**. `main` is `3f5a885`, deployed and serving.
- The app is **publicly reachable, but broader public-launch clearance has not been given.**
- **#21 is open: launch-readiness report only.** Codex reviewed it and **requested corrections;
  it is not cleared to merge.** Until those land, treat the report as a draft with known errors,
  listed below.
- **No G1 remediation has been claimed.** Nothing is in flight.

#### Corrections owed on #21, from Codex's review

These are defects in the report itself, not in the product. They are written out so the work
does not depend on remembering the review.

1. **Qualify the security conclusions to the checks actually performed.** The report states "no
   XSS" and "no SSRF" as properties of the system. They are findings from a specific manual
   review of specific surfaces, and must be scoped that way.
2. **CORS is not an abuse control, and the report treats it as one.** Restricting
   `Access-Control-Allow-Origin` constrains browser callers only; a script, curl or server
   ignores it entirely. It does not bound G1 and must not be listed as a fix for it.
3. **The claim that the single-file architecture requires `script-src 'unsafe-inline'` is
   wrong.** CSP hashes or a nonce for the inline script would keep the single file and drop
   `unsafe-inline`. G6 should say the current build has not done that work, not that the design
   forbids it.
4. **G2 conflates two different failures.** Losing connectivity in an already-open page does not
   blank it — the app keeps last-known-good and marks sources stale or unavailable, which is
   tested. The real gap is a **reload while offline**, which has nothing to serve. The severity
   claim must be rewritten around that distinction.

#### Source evidence still to complete

The source-to-display record in the report covers four cards but three entries are incomplete:

- **Rainfall was null** at capture time, so only the withhold path was exercised. A **non-null**
  reading is still needed to verify the mm-to-inches conversion against live data.
- **The tide timestamp has no timezone.** It was recorded as `2026-09-07 20:06`; NOAA was queried
  with `time_zone=lst_ldt`, so the record must state which zone that is.
- **The earthquake entry lacks event identity.** Magnitude alone is not traceable; record the
  USGS event id, place and network so the reading can be re-checked later.

#### Resume in this order

1. **Correct #21** using the four items above, then complete the source evidence.
2. **Codex reviews the corrected report**, and only then is it merged.
3. **Claim G1 separately** and bound news-endpoint abuse and upstream fetching, with controlled
   verification. Note that the fix must actually bound invocations — cache-key normalisation,
   a restricted parameter set, and rate limiting — not CORS.
4. **Monitoring follows G1.** Hosting capacity, optional AI key handling and failure behaviour,
   critical links, accessibility and mobile checks, and tsunami-path verification remain
   public-launch decisions or checks, not tonight's work.

#### Deferred, unclaimed

Offline support, layout refinement and page-weight work. **Layout requires an agreed design
before any implementation**, and must preserve the verified navigation, full-alert access,
source disclosures and 200% zoom usability.

#### Unverified stays unverified

No penetration test, no third-party review, no load testing, no end-to-end screen reader pass,
one browser on one machine, the six F005 reference URLs, Anthropic failure and cost behaviour,
and the tsunami path end to end. None of these has been checked; none should be described as
passing.

#### Branch and PR status

| | |
|---|---|
| `main` | `3f5a885` — merged through #20, deployed, serving |
| `claude/launch-readiness-review` | PR **#21**, open, report only, **corrections owed** |
| Other branches | none |
| Claimed work | this branch only, report scope; nothing else |
| In flight | nothing |

### 2026-09-08 — Earlier pause note (SUPERSEDED by the entry above)

Paused during an active tropical storm warning with uncertain power. Everything below is
pushed; nothing of value exists only on a local machine.

**State:** main is 3f5a885, deployed and serving. Working tree clean. One PR open: **#21**, the
security and launch-readiness review — report only, awaiting Codex. Nothing else is in flight.

**Where the product stands.** The v2 three-PR sequence is complete and verified in production:
the island race guard, the shared NWS snapshot and strip, and the Overview with five views.
Today also fixed a live data defect: wind was being displayed 3.6x too high because the code
assumed metres per second while api.weather.gov reports km/h. The owner found it by reading the
raw API beside the rendered card. It is fixed, verified against the station METAR, and the
lesson is written into AGENTS.md as two testing rules.

**To resume, in order:**

1. Read [LAUNCH-READINESS.md](LAUNCH-READINESS.md). It separates verified protections from
   concrete gaps from things nobody checked.
2. Agree with Codex which gaps gate a public launch. Claude's view: **G1 alone is a blocker**,
   with G2 and G4 close behind. That is a product call, not only a technical one.
3. Claim any remediation separately. #21 deliberately contains no fixes.

**G1 in one line, because it is the thing to fix first:** /api/news is CORS-open with no rate
limiting, and any unrecognised query parameter busts the edge cache, so the invocation space is
unbounded and each miss fans out to five upstream fetches. Demonstrated against production. The
risk is the app being unavailable during exactly the event it exists for.

**Still deferred and unclaimed:** visual layout refinement, pending an agreed design; the six
bot-challenged reference URLs from F005; Q001, a direct PTWC source; and page weight.

### 2026-09-08 — Security and launch-readiness review (report only)

Bounded review at 3f5a885 across the seven areas Codex set. Written up in
[LAUNCH-READINESS.md](LAUNCH-READINESS.md), separated into verified protections, concrete gaps
and items not verified. **It is not a clearance**, and neither the suites nor an HTTP 200 is
offered as one. No remediation is in this branch.

**Verified:** no SSRF — the news route fetches a hardcoded allowlist and no user input reaches
fetch(); no XSS — all 19 innerHTML interpolations are escaped or numeric, decode-before-strip
ordering is correct, and live payloads are inert; strong headers including HSTS preload,
frame-ancestors none and a connect-src restricted to the six known hosts; no secrets across 52
commits; zero runtime dependencies; three localStorage keys of which only the user's own API
key is sensitive; and all four observation cards trace to source with a timestamped record,
wind cross-checked against the station METAR.

**Gaps, worst first:**

- **G1, high, launch blocker.** /api/news is CORS-open with no rate limiting, and arbitrary
  query parameters bust the edge cache — demonstrated against production, including params the
  route does not recognise. Each miss fans out to five upstream fetches, so the invocation space
  is unbounded. Risks taking the app down on a Hobby plan and getting the outlets to block us.
- **G2, high for this product.** No service worker or manifest: a dropped connection gives a
  blank page, on the day connectivity is most likely to fail.
- **G3, medium.** The news route does not scheme-validate feed links; only the client's
  safeUrl() prevents javascript: URLs, and the route is CORS-open to other consumers.
- **G4-G8:** no error monitoring; Hobby plan with no SLA; script-src unsafe-inline as a
  structural consequence of the single-file design; upstream error strings echoed to callers;
  and page weight now 144 KB against 113 KB when it was deferred.

**Not verified, stated rather than omitted:** no penetration test or third-party review; no
load testing, so G1 severity is reasoned not measured; no end-to-end screen reader pass; one
browser on one machine, no mobile devices; the six F005 reference URLs; Anthropic failure and
cost behaviour; and the tsunami path end to end, which depends on the NWS relay (Q001).

**Assessment:** security is not the blocker. Resilience and operability are — G1, G2 and G4.
G1 is demonstrated, cheap to fix, and its consequence is unavailability during exactly the
event the app exists for.

**Next action:** Codex reviews the report and we agree which gaps gate a public launch. Any
remediation is claimed separately.

### 2026-09-08 — Testing principles recorded; no work claimed

Two rules now live in the AGENTS Testing section, ahead of the mutation and contrast notes:
expected results for source-derived values must be independently established rather than
computed with the app's own transformation, and a change to source handling requires a
timestamped raw-response versus rendered-output check that is recorded as unverified if it
cannot be completed. The narrow storage/identity exception is documented so the cache/race
assertion's use of `toMph()` cannot be misread as a violation.

The section leads with the pre-fix counts — 255 DOM assertions, 37 contrast assertions, 38
mutation cases and a browser pass — because quoting the post-fix figures would use the fix as
evidence against itself. That was Codex's correction to the retrospective and it is the same
error the rules exist to prevent.

The claim was published in its own commit ahead of the change, and the change touched
`AGENTS.md` alone. The retrospective entry is unchanged.

**Nothing is claimed as of this entry.** Open and deferred: visual layout refinement, which
needs an agreed design before implementation and must preserve the verified navigation,
full-alert access, disclosures and 200% usability; six bot-challenged reference URLs unverified
since F005; Q001, a direct PTWC source, low priority; and page weight, now roughly 144 KB
against 113 KB when it was deferred.

### 2026-09-08 — Wind was overstated 3.6x on production (owner found)

**The owner spotted it from the raw API against the rendered card: 51.84 km/h is not
116 mph.** api.weather.gov reports wind as wmoUnit:km_h-1 and renderWeather applied 2.237,
the metres-per-second factor. Every wind and gust reading has been 3.6x too high, on
production, during an active hurricane. Precipitation was correct by luck — its unit is mm
and the code divided by 25.4.

Conversions now read the declared unitCode: km/h, m/s, knots and mph for wind; mm, cm, m and
inches for precipitation. **An unrecognised unit renders "Not reported" rather than a guess.**
A missing reading is recoverable; a hurricane wind speed wrong by a factor of three is not.

**Why every test passed.** The fixtures carried bare values with no unitCode and were written
in m/s to match the code, so the suite verified the conversion against its own assumption
rather than against the API. Fixtures now carry the unitCode the real API sends and are
written in mph through a named helper. One assertion had hardcoded 2.237 itself — a second
copy of the same defect — and now converts through the page's own toMph.

**Verified against the live station and its own raw text:** windGust 66.6 km/h renders as
41 mph, and the station METAR reads 11023G36KT — a 36 knot gust, 41 mph. Exact match. The
old code would have shown 149 mph for that reading.

**Evidence:** npm test 106, test:dom 267, test:mutation 42/42, including reverting to the m/s
factor and ignoring unitCode entirely.

This is the fourth time a displayed number turned out not to trace to the source data, after
the fabricated tsunami all-clear, the invented 0.00" rainfall and the miscategorised Flood
Watch. It was not caught by review or by the suite; it was caught by an owner reading the API
response beside the rendered card.

**Next action:** review and merge urgently — production is showing wrong wind speeds now.
### 2026-09-08 — #17 merged and production verified

Merged as fd5771a after Codex confirmed 4f78b53 was board-only. That condition was checked
rather than asserted: index.html, all five test files, package.json and AGENTS.md are
byte-identical between 40fba96 and 4f78b53, so the merged implementation is exactly the one
that was tested and browser-verified.

**Production verification.** Deployed HTML is byte-identical to merged main. Both suites run
against the fetched production file pass: 255 DOM assertions and 37 contrast assertions.

**Smoke checks against the LIVE NWS feed**, rendered from the production HTML:

- 25 active products in the feed; strip reads "WARNING — Hawaii · 19 warnings · 2 watches ·
  1 advisory · 3 statements"
- the route promises "View all 25" and the Alerts view lists exactly 25 — the defect-1 fix
  confirmed against real data rather than a fixture
- the route moves focus to nws-alerts-heading
- wind reads "116 mph · Gust, sustained N/A · HNL Intl · Honolulu reference for statewide ·
  obs Sep 7, 05:53 PM HST" — gust-only labelling, station disclosure and separate observation
  time all correct on live hurricane data
- tide reads "ft MLLW · HNL Harbor · Honolulu reference for statewide"
- navigation, cross-view actions and exactly-one-view-active all pass on the production file

**The three-PR sequence is complete:** race guard (#14), shared snapshot and strip (#16),
Overview layout and navigation (#17).

**Next:** visual layout refinement, deferred by the owner and unclaimed. Spacing, density and
polish only — the functional and accessibility gates are closed.

### 2026-09-08 — Browser verification passed at 40fba96 (owner)

The owner ran the pass on the preview at this exact head and reported all checks passing.
Screenshot evidence at 200% zoom shows the page scrolled past the priority cards with all
five view tabs still visible and clickable directly beneath the header — the specific
failure mode the measured-offset fix addresses. The bottom of the page reaches Shelter and
Outages with nothing covering them, and navigation survives resizing at zoom.

Confirmed in the browser: full-alert access through View all N, Recent earthquakes, Source
details, Open Maps and Open News.

Incidental live confirmation of O07: during the active hurricane HNL reported a 116 mph gust
with no sustained value, and the card reads "116 mph · Gust, sustained N/A" rather than
presenting a gust as sustained wind. That path had only ever been exercised by fixtures.

This closes the 200% zoom gate, which had been open since #16 and was carried forward
deliberately rather than waived.

**Next action:** Codex confirms merge clearance for #17.

### 2026-09-08 — Functional acceptance: zoom obstruction, O10, O12, O13, O16

Owner direction: finish functionality, defer layout refinement. Codex agreed and asked that
functional obstruction at zoom be treated as a blocker while spacing and polish follow later.

**The zoom blocker was real and was not about spacing.** `.desktop-tabs` stuck at a hardcoded
`top:160px`, matching the header only at default zoom. At 200% the header is roughly twice
that, so the view tabs slid underneath it and could not be clicked while scrolled — the
navigation became unreachable. `.content-spacer` had the same defect against the fixed bottom
nav, hiding the last control behind it. Both now position against measured
`--hdr-h`/`--nav-h`, refreshed on resize and via ResizeObserver.

**O10** — the source aggregate showed the newest success across six sources, which reads as a
completed refresh while five are still checking. It now states the count outstanding.

**O13** — hostile feed content is now covered by fixtures rather than assumed: an
`onerror` payload in an event name and a `<script>` in an area name produce no elements and
run nothing, a `javascript:` news link is neutralised, and every new-tab link carries both
rel values. The rel fixture initially could not fail because no priority card had a product
URL, so no outbound link existed to check; it now carries one.

**O16** — an unkeyed visitor gets the strip, priority cards and observations, the digest panel
stays hidden, and the fetch log shows nothing requested from the model API or any host outside
the declared sources.

**O12** — Open Maps and Open News are asserted to switch views without fetching.

**O07** — gust-only wind is asserted to be labelled rather than presented as sustained wind.

**Evidence:** npm test 106, test:dom 255, test:mutation 38/38. Six new mutation cases,
including restoring the hardcoded sticky offset and dropping noreferrer.

**Still open:** the layout recheck and a usability pass at 200% zoom. The owner has confirmed
the zoom setting itself; what remains is whether content and controls stay usable there.

### 2026-09-08 — Two observation fixes on PR 3

**Tide fallback lost the Honolulu disclosure.** fetchTides cached sta.name while rendering
tideLabel(sta), so a failed refresh dropped the caveat precisely when the reading was stale
and most needed it. This is the same defect as the weather path, on the other side; fixing
one and not the other is what let it through. The cache now holds the qualified label, and
the failure path is tested for statewide and Molokaʻi.

**Populated earthquake cards omitted the query radius.** Only the empty card and the Alerts
list carried it, so a magnitude read as "the latest earthquake" rather than "the latest
inside this query" — a claim about everywhere else that the data does not support. The
populated card now reads "Kauai fixture · 1m ago · within 200 km of Kauai".

Worth recording: the test covering that second case asserted **false** — it pinned the missing
scope in place as expected behaviour instead of reporting it. A test that documents a defect
as correct is worse than no test, and it is why the mutation harness now has a case for it.

**Evidence:** npm test 106, test:dom 226, test:mutation 32/32.

**Still open:** the full layout recheck and 200% browser zoom, the agreed merge gate,
unverified by anyone. #17 stays open.

### 2026-09-08 — PR 3 review defects fixed

All three confirmed and fixed; two of them were things the DOM tests could not see.

**1. View all N reached only 12.** renderAlerts capped its output, so Overview could offer
"View all 20" and land the reader on a truncated list with nothing saying so. The cap is now
the eligibility filter only. Section 23 asserts the destination contents, not the label.

**2. The earthquake card survived an island switch.** Its USGS query is a radius centred on
the selected island, so it is island-scoped like wind, rain and tide and is now withdrawn
with them. Section 14 holds a Kauai M4.2 first, matching the reviewer fixture.

**3. Ordering was wrong at both ends.** At 1280px the observation wrapper defaulted to
order:0 and jumped ahead of the first priority card; the wrapper is gone and 1024px+ places
items on an explicit grid. More importantly, CSS order never changed the sequence a screen
reader announces, so the 390px reading order the contract specifies was not being met at all.
**The markup is now written in that reading order** and wider breakpoints rearrange it
visually. Below 768px nothing is reordered, so seen and read agree.

**Contract details (O07/O08/O11/O12):** Statewide and Molokaʻi disclose the Honolulu station
substitution on both weather and tide; tide carries ft MLLW; the observation timestamp is
shown separately from the fetch time; the earthquake card names its query radius; a full page
of USGS results says the ten-result limit was reached rather than reading as a complete count;
a missing magnitude stays unknown; and Recent earthquakes is a real action that focuses the
earthquake heading without fetching.

Two further defects surfaced while writing the tests. fetchWeather cached the qualified
station label but rendered the bare one, so the Honolulu disclosure appeared only once the
reading went stale. And the mutation check reported the new earthquake-withdrawal assertion
MISSED: the card read "None" at that point, so checking that it no longer contained a
magnitude passed either way. The fixture now puts a real magnitude on screen first.

**Evidence:** npm test 106, test:dom 222, test:mutation 30/30. Nine new mutation cases, one
per fixed defect.

**Still open:** 200% zoom, unverified by anyone and still the agreed merge gate. The ticker is
retained; full-product access through the strip and Alerts view is now correct, so the
coverage judgement can be made against this head.

**Next action:** Codex re-reviews and runs the browser list, including the zoom gate.

### 2026-09-08 — PR 3 implemented: Overview, five views, sidebar replaced

Five real views with Overview initial; the pinned desktop Alerts sidebar is gone and Alerts
is a full view. Both breakpoints are a single column where .view/.view.active alone decide
visibility — there is no rule forcing a view visible, and a test asserts both that no live
rule of that shape exists and that exactly one view is active after every switch.

Overview carries up to three priority products with the full count and a route to the rest,
the four observation readings moved out of the always-visible stat bar, and routes to Maps,
News and Source details. Reading order comes from CSS order on one copy of the markup: there
is exactly one #stat-wind in the document, asserted. The strip is one element in shared
chrome; its route is hidden only on Alerts. The ticker is retained pending the coverage
judgement Codex asked for.

**Evidence:** npm test 106, test:dom 197, test:mutation 23/23. New DOM sections 17-22 cover
the five views, priority cards and counts, cross-view focus with a fetch counter, the strip
across every view, breakpoint ordering, and the moved observations. Seven new mutation cases
cover the PR 3 behaviours; all 23 are caught.

**Browser check list — none of this is verified by Claude:**

1. **200% zoom** — the agreed gate. Essential text, controls and access to alerts preserved.
2. `#obs-row{display:contents}` below 1024px and flex above it. This is the least certain
   piece: if display:contents misbehaves, the observation cards stop reordering on mobile.
3. Strip at 320/390px — scope, state, counts, freshness and route all present, none clipped.
4. Priority cards with long event names and long area lists; areas must wrap, not truncate.
5. Exactly one view visible at each breakpoint — tests assert the DOM, not what is painted.
6. Five bottom-nav buttons at 320px: labels legible, safe-area inset respected.
7. Focus visibility after All NWS alerts and Source details; the headings take tabindex=-1.
8. Light, dark and system across the new Overview surfaces.

index.html grew 123,743 to 135,287 bytes.

**Next action:** Codex reviews against the merged contract and runs the list above.

### 2026-09-08 — #16 merged and production verified; PR 3 claimed

Merged as d9188e6. Production verified: deployed HTML is byte-identical to main, and both
suites run against the fetched production file pass — 138 DOM assertions and 37 contrast
assertions, including all nine strip states and the check-time regression. The strip is live
in production and correctly still hidden.

200% zoom stays open below. It was an accepted exception for #16 because the strip was
hidden; PR 3 makes it visible, so it becomes a real gate on that PR.

**Next action:** Claude implements PR 3 on claude/overview-layout. Codex reviews against the
merged contract and performs the browser pass, which this time must include 200% zoom.

### 2026-09-07 — PR 2 review cleared at 84aca80

Codex completed the review with no remaining blockers. Independently: 106 pure assertions
pass; local browser fixtures at this exact head confirm all five strip colours match the
tested tokens in both themes over opaque backgrounds; wrapping passes at 320/390/768/1280 px
with no clipped counts or freshness text.

Codex did not rerun the DOM or mutation suites; the 138 and 17/17 figures remain
Claude-reported evidence and are labelled as such.

**200% browser zoom is unverified and is being merged that way, deliberately.** The browser
control had no effect on the zoom shortcut across two separate attempts by Codex. This is
recorded under the O14 evidence-handoff exception rather than being implied as checked or
left to block the merge indefinitely. It stays open below until someone confirms it by hand.

**Next action:** merge #16, verify production, then Claude claims PR 3 (Overview layout,
navigation, sidebar replacement). Codex reviews against the merged contract.

### 2026-09-07 — Contrast method hardened while Codex was rate-limited

Codex re-reviewed c724b49 as far as its limit allowed: all 94 pure assertions passed
independently and the lastSuccess timestamps were confirmed on all three surfaces. It was
checking rendered colours against the tested tokens when it ran out of budget.

Claude narrowed that gap without a browser. The ratios are computed from tokens, which is
the method WCAG defines, but it is only sound if foreground and background are really what
the tokens say. The three ways that could silently fail are now asserted rather than
assumed: the strip paints its own opaque --card background and is not translucent, --card
is an opaque hex in both themes, and nothing overrides the strip text colour (no !important
colour rule exists anywhere, and each severity rule follows the base rule with higher
specificity). The base rule that shows through if a tone is ever missing is checked too.

**The mutation harness had a defect of its own.** String.replace rewrites the first match,
so a case whose anchor was not unique silently mutated unrelated code — one CSS anchor was
shared with .sec-head, and the case that appeared to pass was mutating the wrong rule. The
harness now refuses an ambiguous anchor, which immediately exposed a second case that had
been reporting CAUGHT by luck. Both are fixed and the guard stays.

**Evidence:** npm test 106, npm run test:dom 138, npm run test:mutation 17/17.

**Still unverified by anyone:** actual rendered pixels and 200% browser zoom. What remains
for a browser is layout and reflow, not the contrast arithmetic.

### 2026-09-07 — PR 2 review findings fixed

Both findings confirmed before fixing, and both reproduce on the reviewed head d330678.

**Verified-empty timestamps.** The strip, banner and empty rail formatted `new Date()`, so an
age tick or a navigation advanced the check time the page claimed without any fetch behind it.
They now format `snap.checkedAt`, taken from `lastSuccess`; with nothing verified they say
"not yet verified" rather than borrowing the clock. Section 16 pins all three surfaces, proves
ticks and navigation cannot advance the claimed time, and asserts the two times differ so the
section cannot pass on a coincidence.

**Contrast.** Codex's three numbers reproduced exactly (light warn 2.57:1, light unknown
2.54:1, dark unknown 3.90:1) and a fourth was found: light `--ok` at 4.33:1, the verified-empty
state. Fixed with separate `--strip-*` text tokens at the same hues; the display palette is
untouched because those tokens carry dots and badges where the text rule does not apply.

`test/contrast.test.js` is new and runs in `npm test`: 4.5:1 for every strip text colour in
both themes, the two dark blocks checked for drift, and five severities still five colours so
flattening to near-black is not a way to pass. Against d330678 it fails on exactly the four
colours above.

**Evidence:** `npm test` 94, `npm run test:dom` 138, `npm run test:mutation` 15/15 across both
suites. Still no browser pass by Claude; 200% zoom remains unchecked by anyone.

**Next action:** Codex re-reviews the new head and runs the browser pass on `?strip=1`.

### 2026-09-07 — PR 2 implemented: shared snapshot, staged strip, age tick

`nwsSnapshot()` is now the single read of alert state; the banner, rail, ticker and strip all
render through `renderAlertSurfaces()`. This fixed a live inconsistency found while wiring it:
the rail and banner filtered by selected island and the ticker never did, so an island view
could scroll a product it refused to list.

Codex's two flagged details are handled explicitly and tested: the current-source case reads
`S.cache.nwsAlerts` directly because `usableCache()` answers null for anything not stale, and
counts are per product with no area deduplication (23 products from the 18/2/2/1 fixture).

**The strip ships staged**, per the contract's "no duplicate summary" rule: it renders on every
update and is asserted in all nine source states, but is `hidden`. `?strip=1` reveals it for the
browser pass. It reports every tier; the banner still drops statements to keep its headline
short, and both behaviours are pinned so neither drifts into the other's job.

The age tick withdraws expired products from every surface with no network call and without
touching `lastSuccess`. Its wiring is tested separately from a manual call, so a missing timer
cannot hide behind a renderer that works when invoked by hand.

**Evidence:** `npm test` 69, `npm run test:dom` 124, `npm run test:mutation` 9/9. The mutation
check is new and answers the #14 finding directly — it breaks one behaviour at a time and
requires the intended assertion to fail, so a decorative assertion is reported rather than
counted. index.html grew 113,093 → 122,625 bytes.

**Not verified by Claude:** appearance. No browser pass was run; the strip's revealed layout,
contrast and wrapping are unchecked, as is its behaviour at 320/390/768/1280 px and 200% zoom.

**Next action:** Codex reviews and runs the focused browser pass on `?strip=1`; PR 3 then places
the strip and drops the flag.

### 2026-09-07 — #15 merged; PR 2 claimed

Claude reviewed #15 against its own claims rather than accepting them. The archive is
byte-identical to `AI-HANDOFF.md` at 36a5a20 (1,152 lines both sides, compared after CRLF
normalisation); the compacted board is 144 lines with exactly one Current Work, Active
Branches and Review Queue heading; the diff touches only the board and the archive; and all
four internal links resolve to files that exist in the branch. Merged as b71fb74.

Codex’s correction of the bot-challenged destination count is confirmed against the archive:
it is six URLs — poweroutage.us, khon2.com, www.pdc.org, two USGS webcam pages and
fema.gov/disaster/declarations. Claude’s earlier shorthand of “five” was wrong.

PR 2 is claimed above on claude/shared-snapshot-nws-strip, board-only in this commit.
One scope question is raised in the claim rather than resolved unilaterally: whether the
once-per-minute UI age tick belongs to this PR or to PR 3.

**Next action:** Codex confirms or moves the age tick; Claude implements the selector and
strip, then opens PR 2 for review against the merged contract.

### 2026-09-07 — #13/#14 merged; #14 review closed

GitHub confirms both merges; main is 36a5a20. The Overview contract is now available
in the repository, with the accepted strip semantics and verification deviations intact.

Codex closed the #14 finding at 992e30c: §10b now holds a 40 mph response, lets a
newer 55 mph response land, and asserts both display and cache retain 55 after the
older response arrives. It also checks that the generation counter exists. The
correction changed the test file only; the reviewed production implementation was unchanged.
Claude supplied a failing run against unguarded main and a passing branch run.

Codex previously ran 58 pure assertions and 12 independent fetch assertions covering
same-island overtaking and superseded failures across weather, tides and earthquakes.
Removing the generation check failed the independent same-island case as expected.
Codex could not rerun jsdom locally because the dependency was unavailable and registry
access was denied; no independent DOM run is claimed.

**Production evidence, user-relayed Claude report:** deployed HTML is byte-identical
to main; the DOM suite against fetched production HTML passes 69/69 including §10b;
npm test passes 58. This closes the race-guard work.

### 2026-09-07 — Q006 reconciled after #13/#14

Claim originally published before editing in 0a3d47a on codex/q006-handoff-compaction.
Claude confirmed exclusive Codex board ownership until #15 lands.
The original draft preceded #13/#14; this revision uses main 36a5a20 and preserves
its complete post-merge board in the archive, including both newly merged handoffs.

One Current Work, Active Branches and Review Queue section remains. Completed claims
are archived, the race-guard review finding is closed, and PR 2 is explicitly unclaimed.
Only this board and the archive change; AGENTS, the product plan, the merged contract,
production code and tests are unchanged. #15 is ready for review; no merge is claimed.

**Next action:** after #15 lands, Claude publishes the shared snapshot/NWS strip claim
on this compacted board, then implements it. Codex reviews against the merged contract.

### 2026-09-07 — #12 merged and verified (user-relayed Claude report)

Dead ArcGIS item removed; both changed tiles resolve; production has zero bare noopener
links. Local browser render matched 968d73d at merge. F005 remediation is closed.
The broader bot-challenge verification list is retained separately.

## How to use this file

Read AGENTS and inspect main/open PRs before starting. Publish a named branch/scope claim
here before editing, including docs. Keep one current section of each kind.
Record what changed, evidence, unresolved work and the next owner action.
Move completed historical detail to the dated archive; retain active claims and decisions.
