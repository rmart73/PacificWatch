# Pacific Watch — AI Handoff

Current coordination only. Durable rules live in [AGENTS.md](AGENTS.md); the roadmap is
[the v2 product plan](Pacific-Watch-v2-Product-and-UX-Plan.md).
The complete board from main at 36a5a20, before compaction, is preserved in
[the 2026-09-07 archive](docs/archive/AI-HANDOFF-2026-09-07.md).
That archive is historical evidence, not an active claim board.

## Current Work

Updated 2026-09-07. PR state was checked through GitHub; production observations below
are attributed to the user-relayed Claude report.

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
| Overview layout / navigation | Implemented; PR open | Codex reviews; browser pass including 200% zoom gates the merge |
| Q006 board compaction | #15 merged in b71fb74; archive verified byte-identical to the pre-compaction board | Closed |

### Active claims

**PR 3 — Overview layout, navigation and sidebar replacement. Claude Code, claude/overview-layout.**
Claim published 2026-09-08 before editing any implementation file. This is the last of the
three agreed PRs and the largest; it is landing alone, not in parallel with other work.

In scope:

- Five real views on both breakpoints — Overview, Alerts, Maps, News, Settings — with
  Overview initial, island selection kept in shared chrome, and native buttons carrying an
  accessible current-view state.
- **Replacing the pinned desktop Alerts sidebar with a full Alerts view.** Exactly one main
  view visible and keyboard-reachable at each breakpoint, and explicitly *not* by way of a
  bare `.view{display:block!important}` — that rule is a load-bearing entry in AGENTS.md
  because it stacks every view at once.
- Unhiding the staged strip and dropping the `?strip=1` flag. The strip is required on News,
  Maps and Settings as well as Alerts, carrying highest-tier state, separate tier counts,
  selected area, verification state and a route to Alerts — it must not degrade into a bare
  link once the pinned rail is gone.
- Up to three priority alert cards with the full count and a route to all products; stat-bar
  readings moved into Overview cards rather than shown twice.
- Cross-view actions: All NWS alerts opens Alerts and focuses its NWS heading; Recent
  earthquakes opens the existing earthquake section; Source details opens Settings at Data
  Sources. Navigation issues no network requests, which is asserted with the fetch counter.
- Architecture prose updated to explain the intentional sidebar replacement, per the contract.

Out of scope: retiring the scrolling ticker. The contract permits it only once the strip and
Alerts view fully cover its active-alert access. That is a judgement best made against the
built layout, so it is deferred rather than bundled — say if it should be in this PR.

Two things I expect to be awkward, recorded now rather than discovered late: the mobile order
at 390px puts wind/rain between priority card 1 and cards 2–3, which cuts against the natural
grouping of the three alert cards; and `switchView()` currently calls `renderAlertSurfaces()`,
so per-view strip rendering must not turn navigation into a render storm or duplicate listeners.

**Blocking on this PR, not on the last one:** 200% browser zoom is still unverified. It was
merged as an accepted exception in #16 while the strip was hidden. PR 3 makes it visible to
everyone, so that exception does not carry over — the zoom pass needs a human before this
merges.

### Agreed next sequence

Completed: race guard (#14), board compaction (#15), shared snapshot and strip (#16).
Remaining: Overview layout/navigation, claimed above. This completes the three-PR sequence.
Each implementation is a separate claimed, reviewable PR. The strip carries all nonzero
tier counts and the highest-tier state, plus scope/freshness as defined by the contract.
Codex retains design/acceptance ownership; Claude retains implementation ownership.

The merged [Overview contract](V2-OVERVIEW-CONTRACT.md) governs implementation.
Accepted verification adjustments in #13: O06 can manipulate timestamps and count fetches
without a production fake clock, while separately testing the real rendering trigger.
For O14, local rendering plus an explicit unchecked list is acceptable implementation evidence;
Codex/user browser review is still required before the layout merges.
A visible strip change likewise requires a focused browser pass.

## Active Branches

| Agent | Branch | Purpose |
|---|---|---|
| Claude | claude/overview-layout | PR 3: Overview view, navigation, sidebar replacement |

Merged branches are omitted from this active list; this does not imply remote branch deletion.

## Review Queue

| PR / work | Review state | Next action |
|---|---|---|
| PR 3 | Open for review | Codex reviews and runs the browser check list below |

#13, #14 and #15 are merged; main is at b71fb74. Their claims and handoffs are preserved
in the archive, and the completed #14 test correction is recorded below.
No implementation review is pending.

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
- **200% browser zoom on the staged strip:** unverified. Two Codex attempts found the
  browser control had no effect on the zoom shortcut. Merged under the O14 exception, not
  waived — a human zoom pass on `?strip=1` still settles it, and PR 3 makes the strip visible
  to everyone, so it should be checked before that lands.
- **Reduced-motion static ring and Vercel billing/page weight:** owner-accepted decisions,
  not pending blockers or questions. Preserve AGENTS guidance; do not re-raise.
- **Q001, direct PTWC source:** low-priority redundancy/latency improvement; NWS already
  carries PTWC products. No active claim; not a prerequisite for Overview.
- **Q002–Q005:** resolved. Source-specific freshness thresholds, centralized health with
  separate scoped caches, dependency-free pure tests, and jsdom as a dev dependency are
  established in the implementation and durable documentation.
- **Q006:** decision accepted by assignment; #15 reconciled and ready, not yet merged.

## Handoff Log

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
