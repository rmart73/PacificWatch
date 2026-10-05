# Pacific Watch — AI Handoff

Current coordination only. Durable rules live in [AGENTS.md](AGENTS.md); the roadmap is
[the v2 product plan](Pacific-Watch-v2-Product-and-UX-Plan.md).
The complete board from main at 36a5a20, before compaction, is preserved in
[the 2026-09-07 archive](docs/archive/AI-HANDOFF-2026-09-07.md).
That archive is historical evidence, not an active claim board.

## Current Work

Updated 2026-10-04. PR state was checked through GitHub. Production observations below are
attributed to the user-relayed Claude report, except the #21 deploy check, the **#26 closeout
verification**, the **#28 production verification**, the **#31 documentation deploy**, the
**#32 documentation deploy**, the **#33 classifier deploy**, the **#34 closeout deploy**, and the
**#35 contract deploy**, **#36 implementation deploy**, **#37 closeout deploy**, and the
**#38 contract deploy**, **#39 workflow deploy**, **#40 closeout deploy**, **#41 C16 deploy** and
**#42 closeout deploy**, the **#43 C09 amendment deploy**, and the **#44 runner-family deploy**, which Codex and Claude verified
independently. The #26 checks were unauthenticated HTTP
against `pacific-watch.vercel.app` — status, item counts, hazard composition and `x-vercel-cache`
per request — not a relayed report. For #28, Codex verified the production HTML byte-for-byte
against the merged Git blob and checked both canonical news endpoints directly.

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
| Security and launch-readiness review | #21 merged in 648db0f after Codex re-review; deploy verified — `index.html`, `api/`, `vercel.json`, `test/` and `package.json` byte-identical across the deploy, and production HTML byte-identical to merged main | Closed as a report; **G1 is no longer a launch blocker — closed by #26** — and one evidence item is open below |
| Board and AGENTS reconciliation | #22 merged in 410777d; documentation-only deploy verified | Closed |
| Observation-truthfulness contract (Q007, Q008) | #23 merged in `a3f9897`; documentation-only deploy verified | Closed; the contract is authoritative and governs the stages |
| Q007/Q008 stage 1 — observation clock | #24 merged in `22686bb`; production HTML byte-identical to merged `main`, independently verified by both agents | Closed; stages 2 and 3 followed in #28 and #30 and are also closed |
| G1 abuse/cost bounding contract | #25 merged in `fcaf55a`; reviewed read-only, three findings addressed; documentation-only deploy verified | Closed; the contract is authoritative at G01–G18 |
| G1 abuse/cost bounding implementation | **#26 merged in `9e2cfec`** and production verified: `/api/news` mixed at 30, the new `/api/news/hazard` hazard-only at 30 where it previously 404'd, legacy query URLs still `200`, and a never-before-requested arbitrary key converging on the canonical cache entry | **Closed. G1 closed at G01–G18**, the WAF rule published by the owner and its enforcement measured and attributed |
| G1 closeout record | #27 merged in `56fa1d5`; documentation-only deploy verified | Closed |
| Q007/Q008 stage 2 — observation clock in the cards | #28 merged in `a2d032e`; production HTML is byte-identical to merged `main`, Stage 2 symbols are live, retired severity-dot CSS is absent, and both canonical news endpoints remain healthy | Closed; T01–T11 and T13–T17 complete. T12 followed in #30, so the contract is closed at T01–T17 |
| Stage 2 production checkpoint | #29 merged in `e39b772`; documentation-only deploy verified, and content equality across the squash confirmed against branch head `ae3a410` | Closed |
| Q007/Q008 stage 3 — earthquake alignment | **#30 merged in `9a83c55`** and production verified: the served HTML is byte-identical to the merged blob, and a 174-minute-old real earthquake renders verified, which is the asymmetry working | **Closed. T12 complete, so T01–T17 are now closed** |
| Stage 3 closeout record | #31 merged in `565f686`; documentation-only deploy independently verified | Closed |
| Hazard-classifier acceptance contract | #32 merged in `1b3c822`; reviewed read-only over three rounds, all findings addressed; documentation-only deploy verified | Closed; authoritative at H01–H18 |
| Hazard-classifier implementation | **#33 merged in `afff98b`** and production verified: HTML byte-identical to the merged blob, both endpoints `200`, 22 hazard items all true, zero feed errors | **Closed. H01–H18 implemented and production verified** |
| Hazard-classifier closeout record | #34 merged in `77ed33c`; documentation-only deploy independently verified | Closed |
| News publication-time acceptance contract | #35 merged in `2875d0f`; reviewed read-only over three rounds, all findings addressed; documentation-only deploy independently verified | Closed; authoritative at N01–N16 |
| News publication-time implementation | **#36 merged in `9348284`** and production verified: deployed HTML byte-identical to merged `main`, all three paths `200`, both News representations healthy, and the N02 server invariant confirmed live | **Closed. N01–N16 implemented and production verified** |
| News publication-time closeout | #37 merged in `0c0bf5d`; documentation-only deploy independently verified | Closed; News publication-time work is complete end to end |
| CI acceptance contract | #38 merged in `1ae1ae0`; reviewed read-only over two rounds, both findings addressed; documentation-only deploy independently verified | Closed; authoritative at C01–C18 |
| CI workflow implementation | #39 merged in `32d732a`; exact workflow blob proven on the PR and on the post-merge `main` run, both attempt 1: 425 pure, 436 DOM and 137 of 137 mutations | **Closed at C01–C18.** The owner promoted all three stable job names under C16 after C15 completed |
| CI workflow closeout | #40 merged in `a545e18`; exact-main CI passed attempt 1 at 425 pure, 436 DOM and 137 of 137 mutations; documentation deploy independently verified | Closed |
| C16 required-check promotion record | #41 merged in `24ef13f`; exact-main CI passed attempt 1 at 425 pure, 436 DOM and 137 of 137 mutations; production and ruleset independently re-verified | Closed; all three jobs required, zero bypass actors |
| C16 closeout | #42 merged in `87ef841`; exact-main CI passed attempt 1 at 425 pure, 436 DOM and 137 of 137 mutations; documentation deploy independently verified | Closed; C01–C18 complete end to end |
| C09 runner-family amendment | #43 merged in `6c2166f`; reviewed read-only with no findings; exact-`main` run passed attempt 1 on image `ubuntu-24.04` version `20260927.320.1` | Closed; the amended C09 is authoritative |
| C09 runner-family workflow correction | #44 merged in `6e5a94e`; exact-`main` run passed attempt 1 at 425 pure, 436 DOM and 137 of 137 mutations on image `ubuntu-24.04` version `20260927.320.1` | Closed; amended C09 implemented, C12 unchanged |
| Remote-branch verification convention | Owner-authorized documentation work claimed on `codex/remote-branch-verification`; no branch deletion authorized | Codex documents the squash-safe evidence ladder; Claude reviews read-only; the owner decides merge |

### Active claims

**Remote-branch verification convention — ChatGPT Codex,
`codex/remote-branch-verification`.** Owner-authorized 2026-10-04 documentation-only claim,
published before editing `AGENTS.md`. Branched from synchronized `main` after #44 merged as
`6e5a94e` and its exact-`main` run passed attempt 1.

Scope:

1. Absorb #44's self-close across the attribution header, Current Work, Active claims, Active
   Branches, Review Queue, stable `main` pointer and in-flight paragraph, plus its Handoff Log entry.
2. Add a durable squash-safe remote-branch verification convention to `AGENTS.md`: capture the
   remote tip before deletion; prove incorporation through a merged PR plus ancestry on both sides
   of the squash boundary, or by exact tree equality with a historical `main` commit; record the
   evidence; otherwise stop and investigate.
3. State the negative rule explicitly: `git branch -r --merged main` is insufficient under squash
   merging, and current-file equality is never accepted as proof in either direction.
4. Preserve the existing rule that omission from Active Branches is not deletion authority.

Files claimed: `AGENTS.md` and `AI-HANDOFF.md` only. No application, API, test, workflow, ruleset,
dependency, configuration or production change. **No remote branch deletion is authorized by this
claim or by the owner's authorization for this documentation.** Claude reviews read-only; the owner
decides merge.

**Closed: G1 abuse/cost bounding contract — ChatGPT Codex,
`codex/g1-abuse-bounding-contract`.** *(Merged as #25 in `fcaf55a`; documentation-only deploy
verified, application, API, configuration, dependencies and tests byte-identical to `22686bb`. The
contract it produced is authoritative and governs this implementation.)* Owner-authorized 2026-09-26
under the approved sequence **G1 → observation Stage 2 → Stage 3**. Documentation and design only.
This claim absorbed the current-board closeout that #24 could not record about its own merge.

Draft governed by [G1-ABUSE-BOUNDING-CONTRACT.md](G1-ABUSE-BOUNDING-CONTRACT.md). Claude holds with
nothing claimed and reviews the contract read-only when the PR opens.

Scope:

1. Close #24 in Current Work, Active Branches and Review Queue; update `main` to `22686bb` and record
   the independently verified production deployment.
2. Write `G1-ABUSE-BOUNDING-CONTRACT.md`: settle canonical cache behaviour, the accepted request
   variants and rejection behaviour, the managed rate-limit design, preserved partial-feed
   behaviour, and testable local/preview/production evidence.
3. Resolve the rate-limit state question explicitly: no in-process counter and no runtime
   dependency exception. The proposed control is Vercel WAF's managed fixed-window rate limiting,
   which official documentation says is available on Hobby. The contract must disclose that its
   counters are per region, Hobby permits one rule, and publishing the rule requires a pricing
   acknowledgement and separate owner authorization during implementation.
4. State explicitly that CORS controls who can read a browser response, not who can invoke the
   route, and earns no G1 acceptance credit.

Out of scope: no edit to `api/news.js`, `index.html`, `vercel.json`, tests, `package.json` or
`AGENTS.md`; no WAF/dashboard mutation; no implementation PR or production traffic test; no Stage 2,
Stage 3 or other launch-readiness remediation. Claude reviews this contract read-only. Only after
the contract is accepted and merged may Claude publish a separate implementation claim.

**Closed: end-of-night pause checkpoint — ChatGPT Codex,
`claude/stage1-observation-metadata`.** Owner-authorized 2026-09-25 documentation-only claim to
record the exact PR #24 pause state, the pending mutation rerun, and tomorrow's resume order.
No implementation, test, contract, or PR-status change was in scope. This used Claude's branch only
because the mutation-anchor correction being recorded was present there; Claude was paused and this
did not transfer ownership of Stage 1. Claim commit `d982878`; checkpoint commit follows it.

**Closed: Q007/Q008 Stage 1 — observation metadata and pure state selection — Claude Code,
`claude/stage1-observation-metadata`.** Claim published 2026-09-26 before editing, in its own commit
ahead of the work, on the owner's explicit authorization. Branched from `main` at `a3f9897`, with
`git log main..HEAD` and content equality verified before starting.

Merged as #24 in `22686bb`; production HTML was verified byte-identical to merged `main`
independently by both agents. The scope and evidence below are retained as the completed record.

Governed by [OBSERVATION-TRUTHFULNESS-CONTRACT.md](OBSERVATION-TRUTHFULNESS-CONTRACT.md), stage 1 of
the three implementation boundaries it defines.

**FINAL SCOPE, as merged-ready.** Logic, tests, and **one narrow render-path change**: the weather
and tide fetch paths now render the reading `sourceOk()` accepted rather than the response that
happened to arrive, so a refused older observation cannot reach the card. Ordinary rendering is
unaffected — live captures produce byte-identical output to `main` on both islands — and the
magnitude-driven dot thresholds are untouched, so no dot behaviour changes in this stage.

**Items 1-4 below are the ORIGINAL SCOPE as claimed before review**, retained so the expansion is
visible rather than smoothed over. Items 5 and 6 were added by review corrections.


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

**Added by review corrections, first round (`89111c7`):** island scoping, loading precedence and
value usability in `combinedObservationState()`; T11 cache ordering in `sourceOk()`, reassigned to
this stage from unassigned; and an explicit-zone requirement on the ISO parser.

**Added by review corrections, second round (`8d57e71`):** the T11 render-boundary fix described
above; real-calendar-date validation in both parsers; and explicit component range checks.

**Functions and regions touched — FINAL**, named per the coordination rule, since this is the first
change to `index.html` in this sequence:

- `index.html` JS: `sourceOk()` (now returns the entry it settled on) and the `S.cache` entry shape;
  `usableCache()`; `sourceState()` (optional injected clock, existing callers unchanged);
  `updateLivePill()` (one line, arity); **`fetchWeather()` and `fetchTides()` at their cache-write
  points *and* at the render call that follows** — the original claim said cache-write points only,
  which stopped being true at `8d57e71`; plus new pure helpers near the source-health registry.
- `test/`: all three suites — `phase1-source-health.test.js` (pure and controlled-time),
  `dom-behavior.test.js` (render-boundary), `mutation-check.js` (cases, plus the health suite
  registered as a mutation target).
- **No CSS and no markup.** `renderWeather()`, `renderTide()` and `renderQuakeCard()` themselves are
  untouched — none of their bodies changed.

**Scope expansion, disclosed: this claim no longer holds "no render-path changes."** The T11
correction in `8d57e71` deliberately changes *what the weather and tide fetch paths pass to* those
renderers. `sourceOk()` now returns the reading it settled on and both callers render from that
return value instead of from the response that happened to arrive, so a refused older observation
cannot reach the card. That is a render-path change and the original wording was false once it
landed.

What remains true, and is the part the "no visual change" promise was protecting: **ordinary
rendering is unaffected and the magnitude-driven dot thresholds are untouched.** In the normal case
the returned entry *is* the response that just arrived, so the same values reach the renderers as
before — verified by rendering live captures against `main` and getting byte-identical output on both
islands, re-checked after this change specifically because it altered what the render calls receive.
The only behavioural difference is in the case the correction exists for: a refused older
observation, which previously reached the card and now does not.

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

**Evidence — FINAL, all Claude-reported** (Codex's shell has no Node or npm, so no suite result here
has been independently reproduced):

- `npm test` **222** (150 + 35 + 37)
- `npm run test:dom` **281**
- `npm run test:mutation` **61 of 61 caught**, with no `MISSED`, `ANCHOR LOST` or `AMBIGUOUS`
- the pure suites pass in an empty directory with nothing installed, so the dependency-free rule
  still holds
- rendering verified byte-identical to `main` on both islands from live captures, re-checked after
  each review round

The figures this claim carried before review — 164 / 267 / 50-of-50 — are superseded; the
intermediate results are preserved in the handoff entries below rather than overwritten.
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

**What is next:** observation stage 1 is merged and production verified in #24. The owner approved
the sequence **G1 → Stage 2 → Stage 3**. The G1 contract merged as #25 in `fcaf55a` and is authoritative
at G01–G18; **G1 implementation merged as #26 in `9e2cfec` and G1 is closed** — the WAF rule was
published by the owner, its enforcement measured at a temporary 5-per-60 setting and attributed to
the rule from the platform's own traffic log, then restored to 100-per-60. **Stage 2 merged as #28
in `a2d032e` and Stage 3 as #30 in `9a83c55`, both production verified — the approved
G1 → Stage 2 → Stage 3 sequence is complete and the observation-truthfulness contract is
implemented at T01–T17.** Each implementation needed its own claim. Q010 is settled as an owner-accepted unverified gap and is
not outstanding.

The merged [Overview contract](V2-OVERVIEW-CONTRACT.md) governs implementation.
Accepted verification adjustments in #13: O06 can manipulate timestamps and count fetches
without a production fake clock, while separately testing the real rendering trigger.
For O14, local rendering plus an explicit unchecked list is acceptable implementation evidence;
Codex/user browser review is still required before the layout merges.
A visible strip change likewise requires a focused browser pass.

## Active Branches

| Agent | Branch | Purpose |
|---|---|---|
| Codex | codex/remote-branch-verification | Documents the squash-safe evidence required before a merged remote branch may be deleted. Documentation only; no deletion authorized. Branched from `main` after #44 merged |

Merged branches are omitted from this active list; this does not imply remote branch deletion.

## Review Queue

| PR / work | Review state | Next action |
|---|---|---|
| Q007/Q008 stage 1 — observation clock | #24 merged in `22686bb`; production verified independently by Codex and Claude | Closed |
| G1 abuse/cost bounding contract | #25 merged in `fcaf55a`; reviewed read-only with three findings addressed; documentation-only deploy verified | Closed; the contract is authoritative at G01–G18 |
| Q007/Q008 stage 2 | #28 merged in `a2d032e`; production HTML byte-identical to merged `main`; implementation review clean; T16 captured against the deployed preview; T15 layout owner-verified; T17 reconciled in `AGENTS.md` | Closed |
| Stage 2 production checkpoint | #29 merged in `e39b772`; documentation-only deploy verified | Closed |
| Q007/Q008 stage 3 | #30 merged in `9a83c55`; production verified, three review rounds closed | Closed; the observation-truthfulness contract is fully implemented at T01–T17 |
| Stage 3 closeout record | #31 merged in `565f686`; documentation-only deploy independently verified | Closed |
| Observation-truthfulness contract (Q007, Q008) | Merged as #23 in `a3f9897`; re-reviewed with all three findings resolved | Closed; the contract is authoritative |
| G1 abuse/cost bounding implementation | **CLOSED.** #26 merged as `9e2cfec` and verified in production; G01–G18 accepted | None. G03 confirmed against production traffic |
| Hazard classifier false positives | **CLOSED.** Contract merged as #32, implementation as #33 in `afff98b`, production verified. The Nolo noise is gone; four aftermath/consequence items are recorded below as a possible future amendment | None. H01–H18 complete |
| Hazard-classifier closeout record | #34 merged in `77ed33c`; documentation-only deploy independently verified | Closed |
| Deleted merged remote branch vs the AGENTS convention | **Claimed, documentation only.** Squash merging makes `git branch -r --merged main` report a false negative for merged branch tips. The convention will require evidence across the squash boundary or exact historical tree equality and will reject current-file equality as proof | Codex documents the convention; Claude reviews read-only; the owner decides merge. **No deletion authorized** |
| News publication-time handling | **CLOSED.** Contract merged as #35 in `2875d0f`; implementation merged as #36 in `9348284`; production HTML byte-identical to merged `main`; N01–N16 accepted | None. The future-value defect is fixed, malformed input remains defense-in-depth, and the server invariant is asserted and mutation-proven |
| CI for independently reproducible suite evidence | **Closed end to end.** Contract #38, implementation #39, closeout #40, C16 record #41, closeout #42, C09 amendment #43 and runner-family correction #44 are merged. The exact-`main` #44 run passed attempt 1 on the explicit `ubuntu-24.04` family | None. C01–C18 and amended C09 are implemented; C12 remains unchanged |
| Hazard classification of aftermath vs active hazard | **Open, unclaimed, possible future contract amendment — not a #33 defect.** Four of the 22 production hazard items are *consequences* of past hazards rather than active ones: Maui wildfire attorney fee caps, pumpkin supply after severe weather, Kauaʻi businesses awaiting aid after Lowell, and tourism spending after major storms. Each passes **both gates correctly** — a real Hawaiʻi place and real hazard language — so the implementation is faithful to H01–H18. What the contract does not distinguish is *"a hazard is occurring"* from *"a hazard occurred and these are the consequences"* | Codex decides whether that distinction is wanted. **This is not authorization to change classification**, and no keyword is to be tuned against it |
| Visual layout refinement | Deferred by the owner; not yet claimed | Needs an agreed design first |
| Closed-claims cleanup | **Open, unclaimed.** Six pre-existing `Closed:` blocks remain under Active claims, weakening that section as a concurrency lock. Their durable content must be verified elsewhere before removal | Separate claimed board-maintenance pass; off the application critical path |

**`main` is merged through #44 and serving production.** Claims and handoffs for
#13–#15 are preserved in the archive, and the completed #14 test correction is recorded below.

**No application or workflow implementation is in flight.** The only active work is the
documentation-only remote-branch verification convention on `codex/remote-branch-verification`.
It changes `AGENTS.md` and this board only. It does not delete a branch or authorize deletion.

**The workflow now names `ubuntu-24.04` explicitly in all three jobs.** #44 merged as `6e5a94e`;
its exact-`main` run passed attempt 1 at 425 pure assertions, 436 DOM assertions and 137 of 137
mutations in 694 seconds on image version `20260927.320.1`. C12 and the ruleset are unchanged.

**C16 is complete.** `Protect main` now requires all three GitHub Actions jobs. Existing deletion,
non-fast-forward and pull-request rules are unchanged, approvals remain zero, and the bypass list
remains empty. The policy is deliberately loose: checks must pass on the PR head, but promotion did
not add a separate requirement to rebase onto the latest `main`. Every PR now waits for mutation;
if its 15-minute ceiling is exceeded, merges stop and C12 requires contract review rather than a
quiet timeout increase.

The CI acceptance contract merged as #38 in `1ae1ae0` and is authoritative at C01–C18.
News publication-time work is complete end to end: the contract merged as #35 in `2875d0f`, its
implementation as #36 in `9348284`, and its closeout as #37 in `0c0bf5d`; N01–N16 are production
verified. The hazard classifier merged as #33 in `afff98b`, its closeout as #34 in `77ed33c`, and
H01–H18 are production verified.
Stage 3 merged in #30 and its closeout in #31; the observation-truthfulness contract is fully
implemented at T01–T17 across stages 1, 2 and 3.

This paragraph was wrong three times and corrected three times — `main` as `22686bb` with G1
a contract only; an implementation in flight as #26; and then "no implementation in flight" carried
into a round where #28 was open, written by a closeout that **claimed to absorb #27's self-close and
did not perform it**. Each was true when written and
neither was updated as the work moved. **The closeout that merged #26 initially repeated the
mistake:** the new entry was written while this section and seven others still described the
pre-merge state, and Codex caught all eight. A line describing "right now" is wrong the moment the
thing it describes moves, and writing a correct entry elsewhere does not update it. This checkpoint
performs #28's expected self-close transition immediately after the merge.

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

### 2026-10-04 — #44 merged; remote-branch verification convention claimed

The C09 runner-family correction merged as **`6e5a94e`**. Codex verified the exact landed state:
the workflow blob is the reviewed three-label change, production HTML is byte-identical to
`main:index.html`, all three public paths return `200`, and the ruleset remains active with the
same three required checks and zero bypass actors.

Post-merge run `37261474302`, attempt 1, `event=push`, passed on the exact merge commit: 425 pure
assertions in 8 seconds, 436 DOM assertions in 17 seconds and 137 of 137 mutations with 137 verdict
lines in 694 seconds. Every job recorded `Image: ubuntu-24.04`, image version `20260927.320.1` and
the matching `Image Release`. The 694-second mutation job used 77% of the unchanged 900-second C12
ceiling. No ruleset or remote-branch change accompanied the merge.

The owner separately authorized Codex to document the remote-branch verification convention, but
**did not authorize deleting any remote branch**. This claim follows #44 so Codex and Claude do not
edit `AI-HANDOFF.md` concurrently. The durable rule will distinguish Git ancestry within a branch,
GitHub's merged-PR record across a squash boundary, and exact historical tree equality. It will
explicitly reject `git branch -r --merged main` and current-file equality as sufficient proof.

### 2026-10-04 — #43 merged; the C09 runner-family correction claimed

The C09 amendment merged as **`6c2166f`** and is authoritative. Codex verified production directly
and Claude reproduced it independently: merge scope exactly `AI-HANDOFF.md` and
`CI-ACCEPTANCE-CONTRACT.md` with zero other files changed, exact-`main` run `37188703604` attempt 1
`event=push` green at 425 / 436 / 137 of 137, production HTML identical to `main:index.html` at
`a42963cd26766d91174edba217be9f4e9a7c571d`, all three paths `200`, and the gate active with three
required jobs and zero bypass actors. **C12 unchanged.**

Every job on that run recorded `Image: ubuntu-24.04` and image `Version: 20260927.320.1`, so the
amended C09 evidence requirement is satisfiable from the existing log with no extra workflow step.

#### What the read-only review found, and what it did not

No findings. Three things in the amendment were better than the escalation that prompted it. It
refuses in its own text to call `ubuntu-24.04` an immutable pin, which corrects an overstatement
Claude made in the escalation rather than leaving the correction in relay traffic. It widened C18
from the original workflow implementation to every later `.github/` change governed by an
amendment, closing a gap that opened the moment any amendment existed. And it rewrote the status
line, which still described the contract as defining a boundary for an implementation that was
already complete — the stale-present-tense class caught twice before, caught pre-emptively here.

The amendment also names a trap worth keeping: the setup log prints **two** `Version:` lines, the
runner agent's first and the image's second, formatted identically. Requiring the image version
specifically is what stops the wrong number entering evidence.

#### Measured, not assumed: the branch-convention method

Claude measured the remote-branch question read-only rather than restating it. `git branch -r
--merged main` reports 2 of 22 branches merged, because squash merging leaves branch tips outside
`main`'s ancestry. Scanning all 47 `main` commits for a tree matching each branch tip proved **21
of 22** merged, each resolving to its expected squash commit with no PR numbers supplied.

The exception has a stronger proof than the one first proposed, and the first proposal was wrong.
Claude suggested a second tier of "every non-coordination file identical to `main`". Codex rejected
it on review, correctly: current-file equality is not generally safe in either direction. Later
legitimate edits can make genuinely merged content differ, and independent work can make unmerged
content coincide. One case where it happened to hold is not a rule.

The measured fact for `codex/phase1-source-health` is ancestry plus the PR record, verified rather
than relayed:

```
4df328f   branch tip, 2026-09-06
  is an ancestor of 02aea73, a true merge commit (parents a43784a + 4df328f)
  is an ancestor of 0983028, which GitHub records as PR #5's head
PR #5     state MERGED, mergeCommit 6750553
6750553   single parent 7c67081 -- a SQUASH commit -- and an ancestor of main
```

**The squash is why no single git test spans it.** `0983028` is not an ancestor of `main`, because
the squash did not preserve it as a parent, so `4df328f` is not reachable from `main` either and
`git branch -r --merged` reports nothing. The chain is git ancestry up to the PR head, GitHub's
merge record across the squash boundary, then git ancestry again from the squash commit into
`main`.

**Disposition:** Codex authors the ordered evidence ladder after #44 merges. Nothing here settles
it, and the weaker file-equality fallback is explicitly withdrawn. **No branch deletion is
authorized.** The owner sequenced the convention after this correction to keep both agents off
`AI-HANDOFF.md` at once.


### 2026-10-04 — #42 merged; C09 runner-family amendment authorized

The owner authorized #42 after Claude's final read-only review found no remaining findings. It was
squash-merged as `87ef841b48dec6f269cc9b754b7853dd72363159`; merge scope was this board alone, and
the complete tree comparison found no unexpected change. Exact-main run `37186546315`, push event,
attempt 1, passed at 425 pure assertions, 436 DOM assertions and 137 of 137 mutations with 137
verdict lines. Mutation completed in 700 seconds. Production HTML stayed byte-identical to
`main:index.html` at `a42963cd26766d91174edba217be9f4e9a7c571d`; `/`, `/api/news` and
`/api/news/hazard` returned `200`. `Protect main` remained active with the same three required jobs
and zero bypass actors.

That run's GitHub setup log reported `Image: ubuntu-24.04`, image version `20260927.320.1` and the
matching `Image Release`. The workflow nevertheless selects it through `runs-on: ubuntu-latest` in
all three jobs. GitHub announced that alias will begin moving to Ubuntu 26.04 on October 19. The
current 700-second mutation run has 200 seconds of room under C12's 900-second ceiling: a 28.6%
slowdown would exhaust it, after which every PR would be blocked by the required check. Recovery is
possible through an owner ruleset edit, but would require weakening the gate to repair the gate.

Claude correctly escalated that C09's purpose — tooling as reviewed inputs — was broader than its
literal Node-and-Action wording. Codex's correction is equally important: `ubuntu-24.04` fixes the
OS family but **does not pin an immutable image**, because GitHub refreshes hosted images under that
label. The owner authorized this documentation-only amendment: require the explicit OS family,
record the concrete image-version string from each proving log, leave C12 unchanged, and reserve
the later `.github/` change for a separately authorized Claude claim after the amendment merges.
The product rename discussion remains parked and outside this work.

### 2026-10-04 — #41 merged; C01–C18 complete under the live required-check gate

The owner authorized #41's merge after Claude's read-only review found no remaining findings. It
was squash-merged as `24ef13fce7810892ce932317cfd00849b2387886`; merge scope was this board alone,
with every workflow, runtime, API, test, dependency, configuration and contract file byte-identical
across the merge.

Post-merge run `37181771627`, push event, attempt 1, checked out the exact squash commit in every job
and passed:

```
pure tests (dependency-free)   425 assertions passed, 0 failed, 4 suites
DOM behaviour                  436 assertions passed, 0 failed
mutation coverage              137 of 137 caught; 137 verdict lines / 137 declared
```

Production HTML and `main:index.html` remained byte-identical at
`a42963cd26766d91174edba217be9f4e9a7c571d`; `/`, `/api/news` and `/api/news/hazard` returned `200`.
Codex and Claude verified the deployment independently, and Claude rechecked the N02 publication
invariant across 46 live records with zero non-canonical values.

The ruleset survived the merge unchanged: active `Protect main`, zero bypass actors,
`current_user_can_bypass=never`, and the exact workflow job-name set required from GitHub Actions —
`pure tests (dependency-free)`, `DOM behaviour` and `mutation coverage`. #41 itself demonstrated
the gate twice: each pushed head was `BLOCKED` after pure and DOM passed while mutation remained in
progress, then became `CLEAN` only after mutation passed. No rerun, override or intervening ruleset
edit produced either transition.

**First operating measurement under the gate.** At promotion, six green mutation runs measured
675–707 seconds, 75–79% of the 15-minute ceiling; the later #41 runs stayed in that same range. This
is a dated measurement, not a permanent bound. Once required, exceeding the ceiling means nothing
can merge. C12 makes that a contract-review event, not permission for a quick timeout increase,
suite split or partial result presented as success.

### 2026-10-04 — #40 merged; C16 promoted all three CI jobs to required checks

The owner authorized #40's merge and then separately authorized C16 promotion. #40 was
squash-merged as `a545e18438e80e93dbb986aa2e15ee0fb17995e2`; merge scope was exactly `AGENTS.md`
and this board. Its exact-commit `main` run `37177983226`, push event, attempt 1, passed at 425 pure,
436 DOM and 137 of 137 mutations with 137 verdict lines for 137 declared. Each job logged a clean
checkout of the squash commit before running. Production HTML remained byte-identical to
`main:index.html` at `a42963cd26766d91174edba217be9f4e9a7c571d`, all three paths returned `200`, and
Codex and Claude verified the documentation deploy independently.

Only after that C15 record existed, Codex performed the owner-authorized ruleset action. API
readback of active ruleset `Protect main` (`22397785`) recorded:

```
target                 branch; ~DEFAULT_BRANCH
required checks        pure tests (dependency-free)
                       DOM behaviour
                       mutation coverage
source                 GitHub Actions, integration_id 15368 for all three
strict/up-to-date      false
enforce on create      true (do_not_enforce_on_create=false)
bypass actors          0; current_user_can_bypass=never
unchanged rules        deletion, non_fast_forward, pull_request
approvals              0
merge methods          merge, squash, rebase
```

The loose policy is deliberate and minimal: each PR head must carry all three passing checks, but
promotion did not add a separate requirement to update the branch after every `main` change. This
does not weaken the checks themselves. It avoids adding a fourth merge condition that C16 did not
authorize and the repository did not previously impose.

**Operational consequence:** mutation now blocks every merge for roughly 11–12 minutes, including
documentation-only PRs. It has used 75–79% of its 15-minute ceiling in the proving series. If growth
crosses that ceiling, all merges stop; C12 requires contract review rather than a quick timeout
increase, suite split or partial run presented as success.

### 2026-10-04 — #39 merged; exact-main CI and production verified

The owner authorized #39's merge. It was squash-merged as `32d732ae477da8bf8dbe24a594f5e0aa3a0c8fbc`.
Merge scope was exactly `.github/workflows/ci.yml` and this board; the workflow blob on `main` is
byte-identical to the one proven on the PR.

**C15 completed on both sides of the merge.** GitHub Actions run `37175421125`, event `push`,
attempt 1, checked out the exact merge SHA independently in all three jobs and reported:

```
pure tests (dependency-free)   success     7s   425 assertions passed, 0 failed, 4 suites
DOM behaviour                  success    16s   436 assertions passed, 0 failed
mutation coverage              success   675s   137 of 137 caught; 137 verdict lines / 137 declared
all three                      verified clean checkout of 32d732ae…, node v24.21.0
```

Mutation used 75% of its 15-minute ceiling on `main`; the five attempt-1 green measurements for
the identical workflow blob were 704, 695, 707, 702 and 675 seconds. The ceiling was not changed.

Production verification was independent by Codex and Claude. Codex measured `/`, `/api/news` and
`/api/news/hazard` at `200`, zero feed errors, a 30-item mixed response and a 16-item all-hazard
response; those item counts are one rotating capture, not a durable ratio. Served HTML and
`main:index.html` both hashed to `a42963cd26766d91174edba217be9f4e9a7c571d`. Claude independently
confirmed the same object identity and all three paths, and rechecked the N02 publication invariant
across 46 live records with zero non-canonical and zero null values.

**At this checkpoint, C16 was not complete.** The active `Protect main` ruleset had no
`required_status_checks` rule. CI was reproducible and visible, but did not prevent a merge when a
job failed. Promotion of the three job names remained a separate owner action and was not performed
by #39 or that closeout.

### 2026-10-04 — CI workflow implemented and proven; #39 open for the owner's decision

`.github/workflows/ci.yml` implements C01–C18. Three separately named jobs on every pull request
and every push to `main`, each taking its own clean checkout and passing nothing to the others.

#### C15 — first-attempt green for the proven workflow blob

Run `37168313095`, **attempt 1**, on commit `f7a7e3338c4212a1beb9d965ca3b2937c1bb0180`. No rerun
replaced a failure.

This entry is itself a documentation-only commit that lands after that run, so it moves the branch
head while carrying the **identical** workflow blob. Recording a head here would be self-refuting
for the same reason a board PR cannot record its own merge, so the PR body — which is editable
without a commit — carries the final-head run, and the blob hash is what ties the two together.

```
pure tests (dependency-free)   success     6s   425 assertions passed, 0 failed, 4 suites
DOM behaviour                  success    20s   436 assertions passed, 0 failed
mutation coverage              success   695s   137 of 137 caught; 137 verdict lines / 137 declared
all three                      verified clean checkout of f7a7e333…, node v24.21.0
```

**Those counts match local Node 18.20.4 runs exactly.** 425, 436 and 137 now reproduce across Node
major lines, from an immutable commit, in an environment neither agent controls. That is the whole
purpose of the contract rather than a pleasant side effect.

#### The four negative witnesses, each failing for its own reason

Every probe lived in `ci.yml` alone. Probe four injects its case at runtime after the gate, so no
test or source file was modified in any commit on the branch, even temporarily.

```
run 37167519748  cd24786   40s, all three jobs failed AT THEIR GATES
  pure      FAIL: node_modules present before any install            C07
  DOM       FAIL: HEAD is not the commit under test                  C03
            expected 0000000000000000000000000000000000000000
            actual   cd24786353d3952fe6e5d5145581e4c334a0fa60
  mutation  FAIL: working tree is not clean                          C03
  zero suite summary lines in the entire run: nothing ran past a gate

run 37167627681  2f745c9   mutation failed after a full pass; pure and DOM passed
  probe step   probe: one ANCHOR LOST case injected                  C13
  harness        ANCHOR LOST  PROBE anchor lost
  harness      137 of 138 mutations caught
  harness      An undetected mutation means an assertion is decorative.
  the post-suite count echo never ran, so pipefail propagated the nonzero
  exit AT THE SUITE rather than reading a high caught-count as success

run 37166826684  1a9ecdf   baseline, green before any probe, same three counts
```

The final head restores the workflow **byte-exactly** to the blob that ran green at the baseline,
`fd10a51177f174295f4e9397d6542ac39e754128`, with zero probe text and zero CR bytes remaining.

#### Measured rather than assumed: the mutation ceiling

Mutation took **695 seconds, 77% of its 15-minute budget**; the baseline took 704. Inside the
ceiling, so no stop condition triggered, but the headroom is modest and the case count only grows.
The timeout was not touched. A future run that exceeds it is a C12 contract-review item, not an
implementation fix.

#### What the board got wrong, and the shape of the error

Codex's review found no fault in the workflow and one in this board: the in-flight paragraph
asserted that an implementation was in flight and, four lines later, that no workflow
implementation was authorized. The cause is worth recording because it is a pattern rather than a
typo — the claim commit **swapped the paragraph's opening sentence** and left the rest describing
the pre-implementation state. A current-state paragraph has to be rewritten as a whole, because the
sentences after the first one are claims too. This paragraph already carried a note that it had
been wrong three times; this was the fourth, and the first by sentence-swap rather than by going
stale.

#### Still pending, and not authorized by this work

The post-merge verification on the exact `main` merge SHA, and **C16 promotion of the three job
names to required checks, which is the owner's separate ruleset action**. Merging #39 changes no
branch protection: between merge and promotion, CI reports without gating.


### 2026-10-03 — #38 merged; CI workflow implementation claimed

The CI acceptance contract merged on the owner's explicit permission, squashed as **`1ae1ae0`**, and
is authoritative at **C01–C18**. Codex verified production directly and Claude reproduced it
independently: merge scope exactly `AI-HANDOFF.md` and `CI-ACCEPTANCE-CONTRACT.md`, zero `.github/`
paths in the tree, and thirteen runtime, test and configuration files byte-identical across the
merge including `package-lock.json`. Production HTML and `main:index.html` both
`a42963cd26766d91174edba217be9f4e9a7c571d`, all three paths `200`, and the N02 server invariant
held across 48 live records with zero non-canonical and zero null values.

The status line needed no post-merge correction, which makes it two contracts running since the
wording changed to "authoritative upon merge".

#### What the read-only review changed

Two findings. First, the contract stated the mutation requirement as three separate conditions,
which invited CI to grep for `MISSED`, `ANCHOR LOST` and `AMBIGUOUS` individually — and a pattern
matching one of those does not match the others, which is the independent-coverage trap recorded in
`AGENTS.md`. Reading `test/mutation-check.js` settled it: all three increment one shared `missed`
counter and the harness exits nonzero for any of them, so the exit code is authoritative and one
negative probe is sufficient. The contract now says so, and forbids CI from rebuilding those
semantics.

Second, two clean-state gates could not fail as specified. A fresh `actions/checkout` is never
dirty and never carries `node_modules`, so `git status --porcelain` and the absence check were
verified only by showing that they ran. Two options were offered — add real negative probes, or
label the gates defense-in-depth as N04 was. Codex took the probes, which is the stronger of the
two: N04 could not be reached by any input the handler could produce, whereas these gates are
reachable by a deliberate probe, so proving beats annotating. The contract now carries four
negative witnesses where it had two.

#### What is deliberately NOT authorized by the contract merge

No workflow exists yet, and **merging the later workflow PR will not gate anything**. C16 keeps
promotion of the three job names to required checks as a separate owner action on the `main`
ruleset. Between those two events CI reports without gating, which is correct by design but reads
easily as protection already in force, so the implementation record states which state applies.


### 2026-10-03 — CI acceptance contract claimed and drafted

Owner-authorized documentation work on `codex/ci-acceptance-contract`, claimed at `4ad3d22`
before the contract was written. [The draft](CI-ACCEPTANCE-CONTRACT.md) turns the evidence failure
that prompted this work — a mutation count first reported from an uncommitted working tree — into
an exact-commit gate rather than relying on a reviewer to distrust the right run.

The contract requires three independent clean-checkout jobs on every pull request and `main` push:
dependency-free pure tests, DOM behaviour after locked dev-dependency installation, and mutation
coverage. Each run verifies and prints its exact SHA beside measured counts. The mutation job runs
on every PR despite its roughly four-minute local duration and, with the other two jobs, becomes a
required check only after a first-attempt green implementation-head run and a green `main` run.
Timeouts, missing summaries, nonzero exits, `MISSED`, `ANCHOR LOST` and `AMBIGUOUS` are failures.
Caches may retrieve dependencies but never source, tests, output or verdicts. Live-feed, Vercel and
visual evidence stays human-triggered and outside deterministic CI.

This branch contains documentation only. It does not create `.github/`, modify the ruleset or
authorize workflow implementation. Claude reviews read-only; implementation requires a later
owner authorization and its own claim after this contract merges.

#### Read-only review, round one

Claude verified the two-file scope, claim ordering and all five #37 carry-forward corrections. Two
findings tightened the proving boundary. First, the mutation harness's existing nonzero exit is now
the single authority for `MISSED`, `ANCHOR LOST` and `AMBIGUOUS`; CI may capture the final count but
must not rebuild those semantics with three log greps. One negative mutation probe is therefore
sufficient. Second, the clean-tree and dependency-free gates now receive real failure witnesses:
an untracked marker must trip the clean-state gate, and a pre-created `node_modules` directory must
stop the pure job before `npm test`. Both probes are removed before the final green head.

The 15-minute mutation ceiling remains unchanged but is named as a hosted-runner assumption the
implementation must measure. If it proves too tight, implementation stops for contract review
rather than silently raising the ceiling or presenting a truncated run as a pass. Claude's optional
concurrency suggestion remains an implementation detail, not an added contract requirement.

### 2026-10-03 — #37 merged; News publication-time closeout complete

Merged on the owner's explicit production authorization, squashed as **`0c0bf5d`**. Codex and
Claude independently verified the documentation-only scope: `AGENTS.md` and `AI-HANDOFF.md` were
the only changed files, while all runtime, API, configuration and test files remained
byte-identical across the merge. Production HTML remained byte-identical to merged `main` at
`a42963cd26766d91174edba217be9f4e9a7c571d`, and `/`, `/api/news` and `/api/news/hazard` all
returned `200` with zero feed errors. The differing item and hazard counts between the two agents'
captures were normal feed rotation and are not retained as fixed figures.

The News publication-time sequence is closed end to end: contract #35, implementation #36 and
closeout #37. The mutation lesson from its review now lives durably in `AGENTS.md`. This merge could
not close its own board entries, so the authorized CI-contract claim absorbed the attribution
header, Current Work row, Active claims block, Active Branches row and `main` pointer before
drafting the next contract.

### 2026-10-03 — #36 merged and production verified; N01–N16 complete

Merged on the owner's explicit permission, squashed as **`9348284`**. Claude performed the merge
and production verification; Codex then reproduced the deployment checks independently.

```
production HTML blob    a42963cd26766d91174edba217be9f4e9a7c571d
main:index.html         a42963cd26766d91174edba217be9f4e9a7c571d   IDENTICAL
/ · /api/news · /api/news/hazard                               all 200
mixed representation    30 items ·  2 hazard · 0 feed errors
hazard representation   17 items · all hazard:true · 0 feed errors
```

Those item counts describe one live capture, not a durable ratio; they move as the feeds rotate.
The durable result is that both representations were healthy and the hazard path contained only
items marked `hazard: true`.

Claude also verified the N02 server invariant live across 47 records from both representations:
every `published` value was canonical by parse and round-trip, with zero null, non-canonical or
beyond-skew values. Deterministic fixtures still own the null, malformed and future cases because
the live capture did not contain them. Against production, the deployed validator passed all six
boundary probes and the rendered News surface contained no `NaNd ago` or `Invalid Date` copy.

#### Final evidence

```
npm test        425  = 175 + 35 + 37 + 178
test:dom        436
test:mutation   137 of 137 · zero MISSED · zero ANCHOR LOST · zero AMBIGUOUS
clean run       425 from an eight-file directory with no node_modules
```

The suite evidence is Claude-reported, reproduced from a pristine detached worktree at the exact
pushed head. Codex's shell has no Node/npm, which is why a separately contracted CI workflow is
under consideration; no CI work is claimed or authorized here.

#### What the reviews added

The implementation review required the API output invariant to be mutation-proven rather than
shape-asserted, completed N03 and N07's rendering matrices, exercised N11 through the real
success → failed refresh → retained stale cache → recovery lifecycle, and corrected the final
four-test-file scope. One earlier mutation result had been produced against an uncommitted working
tree; it was discarded and the final counts above were rerun from the exact pushed commit.

The lasting mutation lesson now lives in shared `AGENTS.md`: a check running first and
short-circuiting does not prove that check is load-bearing. A witness for one check must survive
every other check and fail only the one it is meant to exercise.

`AGENTS.md` remains a shared contract. Codex owns this edit because the owner assigned this
specific closeout to Codex; earlier reservations were task-specific concurrency locks, not
permanent ownership of the file.

### 2026-10-02 — #35 merged; News publication-time implementation claimed

The acceptance contract merged on the owner's explicit permission, squashed as **`2875d0f`**. Codex
verified production directly and Claude reproduced it independently: merge scope exactly the two
documentation files, every runtime and test file byte-identical to `77ed33c`, production HTML and
`main:index.html` both `c01cc1618666d40de1a0ba114eb9b53b3ce06407`, all three paths `200`, zero feed
errors.

#### The contract's status line worked

"Authoritative upon merge" reads correctly now that it is merged, with no post-merge edit. It is
the first of the four contracts not to need a status correction after landing — the three before
it each merged while describing themselves as unmerged.

#### What three read-only review rounds produced

Round one found a reachability overstatement: the contract described two live defects when
`api/news.js` structurally prevents one of them. Round two found that the fixtures named to
distinguish the shape-only mutation distinguished nothing — **my own error**, carried into the
contract from my round-one recommendation. I had read a probe printing `reject shape` as evidence
that the shape check was load-bearing, when it only showed which check ran first and
short-circuited.

Round-trip equality rejects the offset and loose-English forms by itself, so removing the shape
regex changed nothing for them. The structural reason is narrow and worth keeping: for years
0000–9999, `toISOString()` output always matches the four-digit canonical shape, so **round-trip
equality subsumes the shape check for every input except expanded-year forms.** Shape is
independently load-bearing against that one family and nothing else. A past expanded year
(`-000001-01-01T00:00:00.000Z`) round-trips exactly and is not masked by the future guard, which
makes it the only usable witness.

The durable lesson, carried in the implementation claim for later placement in `AGENTS.md`:
**a check that short-circuits first is not necessarily the check doing the work; a fixture proving
a specific check load-bearing must survive every other check and fail only that one.**

#### Live corroboration of the N02 server invariant

Sampled from production before claiming: 51 item records across both representations, every
`published` value canonical ISO — zero non-canonical, zero null, zero beyond the five-minute skew.
Live traffic exercises neither the null path nor the future path today, so deterministic fixtures
own N03, N04 and N06 out of necessity rather than convenience. This corroborates the invariant; it
does not discharge N02's handler assertion, which is the thing that fails if the invariant weakens.


### 2026-10-02 — News publication-time acceptance contract drafted; implementation not started

Codex drafted [the News publication-time contract](NEWS-PUBLICATION-TIME-CONTRACT.md) on
`codex/news-publication-time-contract`, after publishing the claim separately in `3c612e5`.
Documentation and design only: runtime, API, tests, configuration, dependencies and `AGENTS.md`
remain untouched.

#### The existing board statement was too broad

The earlier queue item inherited a Stage 3 observation about what happens when `timeAgo()` is
called directly with invalid values. That is not the same as the live News render path.
`renderNews()` already guards `it.published` by truthiness, so missing, `null`, `undefined` and empty
values omit the age today. The reachable defect and the latent client weakness are narrower:

```
materially future published value      reachable from a valid feed date -> "just now"
truthy malformed published value       API prevents it today; if admitted -> "NaNd ago"
```

The contract records that correction rather than claiming a null-value defect the UI does not
have or a second live defect the API boundary currently prevents.

#### Boundary settled

The later implementation accepts only the canonical UTC ISO form already emitted by
`api/news.js`, verified by shape plus parse/round-trip equality, and protects the server invariant
that output is only `null` or canonical ISO. It tolerates exactly five minutes
of positive clock skew; one millisecond beyond is unusable. Unusable time withholds only the age
and its separator — the article and its other fields stay visible, and no fetch or render timestamp
is substituted.

Publication age remains content metadata, never source health. It cannot change sorting, filtering,
hazard classification, cache behavior or the whole-pool-before-cap rule. The correction is
News-specific: shared `timeAgo()` and the Stage 3 earthquake boundary remain unchanged, and News is
not added to the observation `ageTick()`.

#### Evidence required later

The contract carries N01–N16: controlled-clock boundaries; full `renderNews()` fixtures; separate
mutations for the timestamp shape and round-trip checks, distinguished respectively by a past
expanded-year value and past calendar-rollover values so the future guard cannot mask either;
mutations in both directions with zero `ANCHOR LOST` or `AMBIGUOUS`; dependency-free and full-suite
evidence; and a preview pass showing that valid live ages, links, filters and hazard tags still
render. Truthy malformed input is structurally impossible from the current API output invariant,
so deterministic DOM fixtures own that defense-in-depth case rather than a fabricated preview
claim.

**No implementation is authorized by this draft.** Claude reviews it read-only. After review and
an owner-approved merge, implementation requires a fresh Claude claim ahead of every edit.

### 2026-10-02 — #33 merged and production verified; H01–H18 complete

Merged on the owner's explicit permission, squashed as **`afff98b`**. Codex verified production
directly and Claude reproduced every figure independently.

#### H18 — production verification

```
git blob main:index.html   c01cc1618666d40de1a0ba114eb9b53b3ce06407
production HTML hashed     c01cc1618666d40de1a0ba114eb9b53b3ce06407   IDENTICAL
/ · /api/news · /api/news/hazard                                      all 200
mixed representation       30 items ·  2 hazard · 28 non-hazard · 0 feed errors
hazard representation      22 items · all hazard: true ·              0 feed errors
```

#### H10, live

**The hazard representation returns 22 items while the capped mixed list contains 2.** A browser
filtering the newest thirty for itself — exactly the thing a separate representation exists to
replace — would surface two of the twenty-two.

**The mechanism, stated correctly.** `/api/news` returns the newest thirty items whatever their
labels; the classifier changes which of them carry `hazard: true`, it removes nothing from that
endpoint. `/api/news/hazard` filters the whole deduplicated pool **before** the cap, so it reaches
qualifying items that sit outside the newest thirty. The 22-versus-2 difference is therefore about
where qualifying items fall in the pool, not about anything being removed from the mixed list.

An earlier version of this entry said precision had "removed non-hazard items from the mixed list"
and widened the gap. That was wrong on its face — no item leaves `/api/news` — and the widening
claim compared two different captures besides.

#### Two illustrations from different captures — NOT a controlled comparison

**These are examples, not evidence.** The first set comes from the Nolo-era capture under the old
classifier; the second is the current production hazard representation under the new one. They are
different feeds on different days, so nothing causal may be read from placing them together. **The
controlled same-capture comparison is the H15 ledger**, which ran both classifiers over one
identical 170-item pool.

```
examples, old classifier, Nolo-era capture:
  Trump polling · HI-5 bottle fund · Chinatown stabbing · Bass Pro shooting
  DMV closure · Northeast flooding · New Mexico utility worker

examples, new classifier, current production:
  Flash Flood Warning for Kauaʻi · Kīlauea quake swarm · Kalaupapa power outage
  Olowalu brush fire evacuation · Lahaina school closures · Hawaiian Electric outages
```

#### Ambiguity recorded rather than smoothed — H18 requires it

Codex flagged *"Pumpkin supply depleted after a year of severe weather"* as the most borderline of
the 22. It is not alone, and the honest form of the record is the pattern rather than the one item:
**four of the 22 are consequences of past hazards rather than active ones** — wildfire attorney fee
caps, the pumpkin story, businesses awaiting aid after Lowell, and tourism spending after major
storms.

Each passes both gates **correctly**: a real Hawaiʻi place, real hazard language. The implementation
is faithful to the contract. The contract simply does not distinguish *"a hazard is occurring"* from
*"a hazard occurred and these are the consequences"*. Recorded in the Review Queue as a possible
future amendment, explicitly **not** a defect in #33 and **not** authorization to tune anything.

#### The Nolo evidence-boundary decision stands

*"Tropical Storm Nolo drifts southward"* now classifies **true**, because the refreshed production
summary explicitly names **Papahānaumokuākea** — a durable locality signal that was simply absent
from the earlier capture.

**That vindicates the gate rather than relaxing it.** The earlier capture remains an accepted
historical false negative, and neither storm names nor bare *"islands"* are anchors. An item that
acquires a real anchor passes; one that never had one does not. If a future authoritative basin
signal is wanted, it needs its own amendment.

#### H01–H18 — complete

```
corpus            24 of 24      (measured baseline 13 of 24)
npm test          393           (150 + 35 + 37 + 171)
test:dom          402
test:mutation     126 of 126    zero ANCHOR LOST, zero AMBIGUOUS
H14               393 passing in a clean eight-file directory, no node_modules
H15/H16           170-item capture, 7 publication dates, both ledgers resolved
H17/H18           preview 9 of 9; production verified above
```

#### What three review rounds found, worth keeping

The contract review argued the authored vocabulary was circular — written to match a corpus written
to match it. **That proved true of my implementation three separate times**, and each defect was
found by real feed text rather than by the corpus: a possessive silently broke anchors; `Hawaiian`
was not a variant of `Hawaii` to a whole-token matcher and its absence dropped a hurricane-outage
story; and **macrons were being deleted entirely**, so `Kīhei` — a contract-required anchor from the
Olowalu evidence — failed while the suite reported 24 of 24.

I also rebuilt the defect I was removing, twice: a loose conjunction let `summit` make gunfire
volcanic, and I generalised two proven phrases into bare `hawaiian` after arguing in review that
bare `Ocean View` was unsafe for exactly that reason.

#### Still open and unclaimed

News `timeAgo()` invalid-input handling — the recommended next user-visible item, pending Codex
settling its acceptance boundary. The aftermath/consequence question above. The
deleted-remote-branch convention. The closed-claims cleanup.


### 2026-10-02 — classifier round one: six findings corrected

**Codex ruled on the two H16 blockers: both stay false.** A storm name is not durable proof that a
system is Central Pacific, and bare *"islands"* is not Hawaiʻi-specific — adding either would weaken
the locality gate. They are now recorded as **reviewed, accepted evidence-boundary false
negatives**, not precision wins and no longer blockers. A future authoritative basin signal would
need its own amendment.

#### 1. The context model was looser than the contract

`term AND any one context token` let unrelated tokens vouch for each other, recreating exactly the
cross-context false positives the contract exists to remove. All three reproduced:

```
Fund swells to record high in Hawaii                 true   ('high' alone satisfied swell)
Argument erupted at Honolulu summit                  true   ('summit' alone was volcanic)
Honolulu EMS responds at an animal shelter           true   (emergency and shelter vouched
                                                             for each other across a sentence)
```

`allOf` now expresses the compound rows: swell requires a qualifier **and** ocean context, both
groups. `summit` and `vent` are gone from the volcanic list — a political summit and an air vent are
ordinary English. `shelter` is gone from emergency's context and bare `emergency` from shelter's, in
both directions. Every pair has a fixture for the false positive **and** the true positive that must
survive removing it.

#### 2. Macrons were being destroyed — the serious one

NFKC preserved the macron as a precomposed letter, and the punctuation pass then replaced the whole
letter with a space:

```
Līhuʻe -> l hu'e     Kīhei -> k hei     Waimānalo -> waim nalo     Waikīkī -> waik k
```

**`Kīhei` is a contract-required anchor from the Olowalu evidence**, so a required positive was
failing behind a passing suite. The existing "diacritic spelling" test exercised only the ʻokina,
which survives NFKC — so it passed while the macron case was broken. NFD now decomposes and only
the combining marks are dropped; the ʻokina is a letter modifier and is untouched.

#### 3. Bare `hawaiian` repeated the Ocean View collision

The capture proved two constructions — `Hawaiian Islands` and `Hawaiian Electric` — and I
generalised to the bare adjective, which travels to a Hawaiian-themed mainland resort. Only the
proven phrases remain, with a collision fixture that already satisfies the hazard gate so locality
is the only thing under test.

#### 4. H02's entity evidence was claimed and absent

The heading said "entities" while every assertion handed the classifier already-decoded text.
Nothing proved an encoded anchor travels the real path. A handler-level RSS fixture now carries an
anchor whose **only** form is `&#699;`, so `decode()` must produce it and the classifier must see
it — plus an assertion that the classifier does **not** decode entities itself, because duplicating
that is how the ordering bug `decode()` warns about gets reintroduced.

#### 5 and 6. Board reconciliation, and the two verification items

The whole current-state region is reconciled, not the cited lines: contract closed, #33 row added,
Active Branches, Review Queue, `main` pointer, in-flight paragraph.

```
H11  DOM client-shape suite            402 passed, 0 failed
H14  empty directory, no node_modules  150 + 35 + 37 + 171 = 393 passed, 0 failed
```

H14 was run by copying only `index.html`, `package.json`, `api/` and the four pure suites into a
clean directory — eight files, no `node_modules` — and running each suite directly. "Files
untouched" was not evidence for either, and Codex was right to refuse it.

#### Five anchors lost and repaired — the fourth occurrence

Tightening the vocabularies moved the lines five mutations were anchored on. **Fourth time in this
project**, and the clearest demonstration yet of why the fourth T17 lesson requires zero
`ANCHOR LOST` *alongside* the count: the headline would have read `121 of 126` and looked like five
ordinary misses rather than five guards that had quietly stopped guarding anything.

#### Verification

`npm test` **393** (150 + 35 + 37 + **171**) · `npm run test:dom` **402** · `npm run test:mutation`
**126 of 126 caught**, zero `ANCHOR LOST`, zero `AMBIGUOUS`.


### 2026-10-02 — hazard classifier implemented; H15/H16 ledgers, two items reported not banked

`classifyHazard(title, summary)` is the only producer of the item-level boolean and requires **both**
actionable hazard evidence and an explicit Hawaiʻi anchor. Vocabularies are explicit rather than one
expression, because the contract requires the accepted language to be reviewable against its
decision table — a shorter regex would be harder to audit, not better.

**Contract corpus: 24 of 24**, from a measured baseline of **13 of 24**. Every one of the 11 required
negatives was a false positive beforehand, so none passes trivially.

#### H15 — change ledger, uncapped five-feed capture

```
captured 2026-10-02T07:47Z     170 items, uncapped, five feeds
publication dates spanned      7   (2026-09-26 .. 2026-10-02)   H04 minimum is 3: MET
old classifier hazard          36 of 170
new classifier hazard          25 of 170
labels changed                 11, all true -> false
```

**No item went false → true**, so precision improved with no recall-broadening side effect.

Nine of the eleven removals are plainly correct: a police road closure, an EMS facility
groundbreaking, a water-main settlement, a sea-arch collapse, a restaurant cleanup, a restaurant
health placard, a storm-chaser fraud warning, a tourism recovery bus route, and a disaster-fatigue
wellness piece. None is hazard reporting.

**Two are losses, and they are reported rather than counted as precision.**

```
KHON2   Tropical Storm Nolo drifts southward: What 2 Know
KITV 4  Thursday Evening Forecast - Wetter pattern continues through Friday
```

Both are genuine local Nolo coverage. Both fail the locality gate because their visible evidence
record names only the storm — *"away from the islands"* — and bare `island` is deliberately excluded
by the contract. **This is the 240-character truncation boundary named in the claim before work
started**, now observed rather than predicted: locality may well appear later in the article, but
the classifier correctly sees only what the response returns.

**I did not tune a keyword to recover them.** Adding storm names would make the vocabulary
ephemeral, and relaxing bare `island` would undo the gate. They are a contract question — whether a
named Central Pacific system should itself be locality evidence — and they go back to Codex as
blockers, per H16.

#### H16 — locality-only ledger

Four items carried hazard evidence and no anchor. Resolved individually, as the contract requires:

```
BBB storm-chaser fraud warning       proved non-local  — consumer fraud, not hazard reporting
Disaster-fatigue wellness piece      proved non-local  — seasonal wellness, no place, no event
Tropical Storm Nolo drifts southward BLOCKER — genuine local coverage, no anchor in visible text
Thursday Evening Forecast            BLOCKER — same
```

#### Three defects the real capture found that the authored corpus could not

This is the circularity argument from the contract review, demonstrated on my own work.

1. **A possessive broke anchors.** `Oʻahu's North Shore` tokenizes as `o'ahu's`, and the anchor
   `o'ahu` did not match it — a real Hawaiʻi story failing the locality gate on an apostrophe.
   Trailing possessives are now stripped per token; internal ʻokina are untouched.
2. **`Hawaiian` is not a spelling variant of `Hawaii`** to a whole-token matcher, and the feeds use
   it constantly — *"the Hawaiian Islands"* in NWS forecast copy, *"Hawaiian Electric"* in every
   outage story. Its absence dropped **a hurricane-outage story**, which is close to the worst
   possible false negative for this feed.
3. **`Papahanaumokuakea`** is a Hawaiʻi place the authored vocabulary did not contain.

All three are now regression fixtures with provenance, and two carry mutations.

#### Three errors of my own, recorded because the pattern matters

- **Two mutations came back MISSED.** One was inert: it removed idiom stripping, but bare `flood` is
  not direct evidence, so *"a flood of donations"* was already false and the mutation changed
  nothing. The other targeted a corpus assertion that calls the classifier directly, so mutating
  the **call site** could not affect it — it needed a handler-level expectation. Both retargeted.
- **Chasing the first one exposed a vocabulary gap**: the storm context list had `damage` but not
  `damages`, so the metaphor fixture passed for the wrong reason and the idiom strip *looked*
  load-bearing while being inert.
- **I wrote a decorative assertion** — `check(label, true, true)`, which could never fail — beside a
  label that claimed the opposite of what it asserted. Removed, replaced with two honest
  assertions, and the residual recorded instead of hidden: an outlet whose **name** contains
  "Hawaii" will anchor if that name appears in the text. Measured at implementation time: **0 of 30**
  live items carried a publisher name inside title+summary, so it is latent. Closing it needs a
  publisher-name stop list, which is a contract amendment rather than a silent tweak.

#### Fixture changes, called out because changing an assertion deserves more scrutiny than adding one

The News API fixtures encoded the **single-gate** meaning, where *"Flood warning issued"* with no
locality was hazard. Under two gates it correctly is not. Every ordinary title now also carries an
anchor, so each pair isolates the hazard gate instead of letting locality do the work — the fixtures
are stronger than before, not merely adjusted to agree.

#### Verification

`npm test` **374** (150 + 35 + 37 + **152**, from 84) · `npm run test:mutation` **120 of 120 caught**,
zero `ANCHOR LOST`, zero `AMBIGUOUS`. `index.html`, `vercel.json`, `package.json`, `AGENTS.md`,
`api/news/hazard.js` and the DOM/contrast/severity suites are untouched.

#### H17 — preview, both representations and their G1 cache identity

Deployed preview, 9 of 9 assertions passed. Each arbitrary query key is generated per run, so a
`HIT` on it is convergence rather than a replay.

```
/api/news          MISS then HIT   n=30  hazard=6   nonhazard=24   updated 08:19:26.623Z
  fresh arbitrary variant   HIT, same updated
/api/news/hazard   MISS then HIT   n=26  hazard=26  nonhazard=0    updated 08:19:29.328Z
  fresh arbitrary variant   HIT, same updated
distinctness       different updated, different bodies
```

**That pair is also a live H10 demonstration.** The hazard representation returns **26** items while
the newest-30 mixed list contains only **6** hazard items. Filtering the capped list — which is what
a browser could do for itself — would have yielded six. The difference is the entire justification
for a separate representation, and the stricter classifier makes it larger rather than smaller.

It returns 26 rather than 30, which is the contract working as written: *"prefer a smaller,
defensible local set over filling thirty slots with remote or metaphorical matches."*

#### Outstanding

Codex's decision on the two blockers above. H18 production verification follows an owner-approved
merge.


### 2026-10-01 — hazard-classifier acceptance contract drafted; implementation not started

Owner authorized continuing with the user-visible hazard-classifier false positives next. Codex
branched `codex/hazard-classifier-contract` from `main` at `565f686` and published the claim in
`b6aba6a` before writing the contract. The claim also absorbs #31's self-close across the live board.

[HAZARD-CLASSIFIER-CONTRACT.md](HAZARD-CLASSIFIER-CONTRACT.md) is proposed for Claude's read-only
review. Its central decision is a two-gate classifier: decoded title+summary must carry both
actionable hazard evidence and an explicit Hawaiʻi place, jurisdiction or authoritative local
agency. Word-boundary cleanup alone is insufficient because the Nolo record included two genuine
mainland hazards that still did not belong in a Hawaiʻi hazard representation.

The contract turns the five lexical Nolo failures into required negative fixtures — `erupt` in
gunfire, EMS, a political warning, a fund that swells and a routine DMV closure — alongside the two
non-local weather stories. It also carries independent positive fixtures so precision cannot be
improved by deleting real local hazards. Context-dependent terms are specified separately rather
than hidden in another opaque regular expression.

Acceptance H01-H18 preserves the two canonical News representations and every G1 bound; requires
mutation coverage in both directions; and requires the old and new classifiers to be run over the
same contemporaneous five-feed capture, with every changed label reviewed individually. A live
percentage without its reviewed item list is not evidence. The full feed bodies are not committed.

A read-only production sample was used only as a design sanity check, not as acceptance evidence.
It confirmed why title-only review is insufficient: several locally meaningful items name the
island or agency in the summary rather than the title, while current noise still includes remote
weather, a routine police closure and EMS wording. H15/H16 therefore govern decoded title+summary
and require review of every removal before implementation merges.

Claude's first read-only review found a decisive circularity: the minimum place vocabulary was
sized to a synthetic corpus authored beside it. The recorded Nolo evacuation for Olowalu Village,
whose summary names Honoapiilani Highway and North Kihei, matched none of those anchors and would
have been deleted despite being the most operationally important item in the evidence. The revised
contract makes that real item a required positive, seeds locality from Nolo plus a five-feed capture
spanning at least three publication dates, and makes every hazard-evidence/locality-false item a
separate vocabulary-review record that cannot be banked as improved precision. H14 also now states
the repository's actual condition: runtime `dependencies` remains **absent or empty**, so no one is
invited to add an empty key.

Claude's second read-only review found one unsafe anchor added by that correction: `Ocean View` is a
real Kaʻū community but also generic property and tourism language. With legitimate hazard wording
elsewhere in an article, decorative “ocean view” copy could falsely satisfy the locality gate. The
bare phrase is removed from the minimum set, made a required negative collision, and may return only
with a disambiguating Hawaiʻi qualifier plus positive and negative fixtures. This generalizes to
any future place name that is also common English rather than treating one phrase as an exception.

**No implementation has started.** `api/news.js`, both canonical routes, the client, tests,
configuration, dependencies, WAF and production are untouched. Claude reviews read-only; only an
accepted and merged contract plus a separate owner-authorized claim may start implementation.

### 2026-10-02 — #30 merged and production verified; the contract is complete

Merged on the owner's explicit permission, squashed as **`9a83c55`**.

#### Production verification

Using the object-ID method Codex established on the #28 deploy, which is stronger than comparing
stripped text:

```
git blob main:index.html   c01cc1618666d40de1a0ba114eb9b53b3ce06407
production HTML hashed     c01cc1618666d40de1a0ba114eb9b53b3ce06407   IDENTICAL
quakeEventAge · renderQuakeSurfaces · "Observation time unavailable"   all present
/ · /api/news · /api/news/hazard                                       all 200
```

#### The card against real USGS data in production

```
raw               mag 2.32 · 174 min ago
#stat-quake       M 2.3
#stat-quake-note  9 km SW of Wai‘ōhinu, Hawaii · 3h ago · within 500 km of Hawaii · 10+ in range
#dot-quake        s-dot ok
USGS Earthquakes  checked 0 sec ago · Current        (no obs age — no measurement clock)
```

**A 174-minute-old earthquake showing as verified is the design working, not a bug.** That same age
on the weather card reads stale, because it is past the 75-minute window. Here the query is fresh
and the event's age is content. It is the one place in this app where ageing a reading would be the
wrong behaviour, which is why it carries its own mutation.

#### The contract is complete

```
Stage 1  #24  observation metadata and pure state selection
Stage 2  #28  the clock reaches the weather and tide cards and Source details
Stage 3  #30  earthquake alignment, T12

T01–T17  all closed.
```

What the three stages amount to, stated once in plain terms: the app no longer confuses **when it
last reached a source** with **when the measurement was taken**, and it no longer lets the size of a
reading decide whether that reading was verified. A fresh fetch of an hour-old observation reports
both clocks; a 40 mph wind and a 2 mph wind get the same dot; a value with no usable timestamp is
withheld rather than shown with an invented age.

#### Still open and unclaimed

The hazard-classifier false positives. `timeAgo()` invalid-input handling in News. The
deleted-remote-branch convention question. The closed-claims cleanup. Each needs its own claim; none
is on any critical path.


### 2026-10-01 — Stage 3 round one: four findings corrected

#### 1. The magnitude leaked past an unusable event time — a real contract violation

The card wrote `M 4.0` before consulting `quakeEventAge()`, so an unplaceable time produced the
magnitude, an unknown-time note and an `unknown` dot together. The presentation matrix is stricter
than I implemented: *"Missing/invalid observation time → **withhold point-in-time value**;
'Observation time unavailable'; `unknown` dot."*

The reasoning behind that row is the part worth keeping: **a magnitude is only meaningful as "an
event at a time".** Showing `M 4.0` with no usable timestamp still asserts that an earthquake of
that size happened recently enough to be worth putting on a situational-awareness card, which is a
claim the data cannot support. The value is now withheld and the copy uses the contract's words.
The radius disclosure survives, because the contract requires it.

**My test could not have caught this.** Section 49 asserted the dot and the note text and never
asserted that `M 4.0` had disappeared, so the suite stayed green across a contract violation sitting
in the same four square centimetres it was inspecting. There is now an explicit withheld-value
assertion per case and a mutation that restores the leak.

#### 2. The age tick updated one of two surfaces that promise to agree

`renderQuakeCardFromCache()` re-rendered only `#stat-quake`, while `renderQuakes()` carries an
explicit comment that the card and the Alerts list *"are the same data; updating them together stops
one going stale while the other refreshes."* I added a re-render path that broke that promise.

The consequences land exactly on the boundaries that matter: at the fetch-staleness boundary the
card lost its dot while the list still showed no stale notice, and past retention the card withdrew
while the list kept displaying expired retained events. `renderQuakeSurfaces()` now re-evaluates
both, with a shared unavailable path so the list says *"temporarily unavailable"* rather than
silently keeping stale content. Two mutations guard it: one re-renders only the card, the other
withdraws only the card past retention.

#### 3. The skew boundary was unpinned

`quakeEventAge()` implements `OBS_SKEW_MS` **independently of `observationState()`**, so nothing
else in the suite would notice the comparison drifting between `>` and `>=`. Fixtures at +2 and +90
minutes bracket the boundary without touching it.

The function now takes an injectable clock — earthquake-local, not the shared `timeAgo()` — so the
boundary is exact rather than racing the wall clock: **exactly `OBS_SKEW_MS` is inside the
allowance, one millisecond beyond is not**, with a mutation flipping `>` to `>=`.

#### 4. Two live rows still instructed implementation

Corrected alongside the rest of the current-state region.

#### Four anchors moved, repaired, and the lesson earning itself again

Changing the dot expression, the skew comparison and the list call site disarmed four existing
mutations. **That is the third time in this project**, and the second inside a round that had
already accepted the lesson about it. The repair was routine precisely because the fourth T17 rule
makes the check mandatory rather than optional — a count alone would have read 101 of 101 and said
nothing.

#### Verification

`npm test` **306** · `npm run test:dom` **402** · `npm run test:mutation` **105 of 105 caught**,
zero `ANCHOR LOST`, zero `AMBIGUOUS`.

The live record below predates these corrections. It remains valid for what it shows — the USGS
asymmetry on real data — and none of the four findings touch that behaviour, but it was captured
against the earlier head and is labelled as such rather than re-presented as current.


### 2026-10-01 — Stage 3 implementation complete; handed to Codex

Implementation, tests and a live record are done. `AGENTS.md` untouched; `timeAgo()` byte-identical
to `main`; `renderNews()` not touched.

#### What the earthquake card does now

The dot answers one question — **was a usable, current reading verified** — and the three ways the
answer can be no are each handled.

**A missing magnitude no longer keeps a verified dot.** It is the primary metric; the card showed
`M unknown` and an `ok` dot at the same time. Place and event time still show, because they are
real; the dot does not, because the thing being measured is absent.

**An event time we cannot place is no longer dressed up as one.** `quakeEventAge()` returns `null`
for a non-finite or far-future time and callers render `event time unknown`. What that replaced,
measured before the change:

```
undefined / NaN / "not a time"  ->  "NaNd ago"
null                            ->  "20728d ago"     (the Unix epoch)
now + 90 min                    ->  "just now"
```

The last is the one the contract names: the app *"must not substitute the fetch time as the event
time."* A future event reading **"just now"** is exactly that, and it is the dangerous form, because
it looks like an answer rather than like a bug.

**A successful empty query keeps its dot.** *"No M2.0+ events in range in 30 days"* is information,
not an absence of it.

#### The asymmetry, and why this stage is not "Stage 2 again"

USGS stays **out** of `OBSERVATION_LIMITS`. The contract gives it *"existing fetch-health limits"*
and says an event's age *"remains visible as content age and does not make a successfully refreshed
query stale."* So `combinedObservationState()` returns the fetch state for USGS and ignores
`valueUsable`; magnitude and event-time usability are combined explicitly in the renderer instead.

**A mutation guards that direction specifically** — adding a 75-minute age test to the quake dot is
caught — because it is the one place in this app where ageing a reading would be the wrong
behaviour, and therefore the one place a future reader is most likely to "fix" correctly-working
code.

#### Live record — deployed preview, real USGS endpoint

Captured `2026-10-02T05:11:12Z` from
`pacific-watch-git-claude-observation-stage3-saa-s16.vercel.app`. Expectations computed in the
harness, independently of the app.

```
RAW      10 events · latest mag 2.32 · time 1790910485460 (123 min ago)
         place "9 km SW of Wai‘ōhinu, Hawaii"
EXPECT   magnitude usable · event time placeable · verified, because the QUERY is fresh
ACTUAL   #stat-quake       M 2.3
         #stat-quake-note  9 km SW of Wai‘ōhinu, Hawaii · 2h ago
                           · within 500 km of Hawaii · 10+ in range
         #dot-quake        s-dot ok
SOURCES  USGS Earthquakes   checked 0 sec ago   Current      (no obs age — no measurement clock)
```

**The live data demonstrated the asymmetry better than a fixture could.** The newest real earthquake
was **123 minutes old** — past the 75-minute window that would make a *weather* observation stale —
and it is correctly **verified**, because the query is fresh and the event's age is content. A card
that copied Stage 2 would have been wrong on real data, on the first load.

#### Scope held

`timeAgo()` is **byte-identical to `main`**, verified by diff, and `renderNews()` is untouched. The
shared helper has a third consumer, so the new validation is earthquake-local. **News carries the
same latent defect** — `timeAgo(Date.parse(it.published))` renders `"NaNd ago"` for an unparseable
`published` — and it is recorded in the Review Queue as its own unclaimed item rather than folded
into a PR claimed for T12.

The quake card joins `renderObservationCards()`, since its fetch health ages even without a
measurement clock. Existing query-limit and radius disclosures are unchanged, as the contract
requires.

#### Verification

`npm test` **306** · `npm run test:dom` **384** · `npm run test:mutation` **101 of 101 caught**, zero
`ANCHOR LOST`, zero `AMBIGUOUS`. No anchors were disarmed this round despite rewriting both
earthquake render paths — the post-change revalidation the fourth T17 lesson asks for was run and
came back clean rather than being assumed.


### 2026-10-01 — resumed review found #27's claim still active in #29

Codex resumed from the pause checkpoint read-only. `main` remained clean at `a2d032e`; PR #29 was
open, `MERGEABLE/CLEAN`, Vercel passing and limited to `AI-HANDOFF.md`.

The promised consistency review found one real closeout defect: #29 removed both completed Stage 2
claims but left `claude/g1-closeout` under Active claims. Stage 2 had explicitly claimed #27's
self-close as item 7, so leaving that block in place both broke the concurrency lock and made the
checkpoint's claim of closing Stage 2's absorbed work false. The block is removed here; its scope
and outcome remain preserved in the historical Handoff Log. No application, API, test,
configuration, dependency or unrelated maintenance file changed.

The current-state rows now describe resumed review rather than instructing the agents to remain
paused overnight. Stage 3 remains unclaimed and unstarted until #29 is reviewed and merged with the
owner's permission.

Claude's subsequent read-only review found one remaining stale instruction in the live next-sequence
paragraph: Stage 3 still said it must not start "during this overnight pause." The historical
2026-09-28 sentence remains untouched; the live rule now states the durable gate — a fresh claim
and the owner's authorization before any Stage 3 edit. Claude reported no further finding.

### 2026-09-28 — #28 merged and production verified; overnight pause

The owner explicitly authorized the merge. PR #28 was squash-merged as **`a2d032e`** and the local
and remote `main` branches were synchronized to that commit. The merged content is identical to
the source branch despite the expected squash-history difference.

Codex verified the production deployment directly, not through a relayed report:

- Vercel deployment `6729460746` completed successfully.
- The HTML served by `https://pacific-watch.vercel.app/` is byte-identical to the merged Git blob;
  both have object ID **`9dc45e4c86ae763477bc44e55abf9080f0991f4b`**.
- The served page contains the Stage 2 `observationDot` and `renderObservationCards` paths, and the
  retired `.s-dot.warn` CSS is absent.
- `/api/news` and `/api/news/hazard` both return `200`, so the unrelated G1 routes stayed healthy.

The final suite evidence remains Claude's independently reproduced result at the reviewed code:
`npm test` **306**, `test:dom` **354**, and `test:mutation` **95 of 95**, with zero `ANCHOR LOST`
and zero `AMBIGUOUS`. Codex could not rerun Node in its shell, but verified that the application,
test, API and configuration files were unchanged after that run before merging.

Stage 2 closes **T01–T11 and T13–T17**. T12 remains Stage 3. No application implementation is active
at this pause point. Stage 3 is next in the approved sequence but remains unclaimed and unstarted;
the hazard-classifier finding, deleted-remote-branch convention question and closed-claims cleanup
also remain separate and unclaimed. The six pre-existing `Closed:` blocks under Active claims are
deliberately untouched; their cleanup stays off the critical path and requires its own claim.

Resume order: finish review of this documentation-only checkpoint, merge it only with the owner's
permission, then create a fresh claim before any Stage 3 edit. Nothing is to start overnight.

### 2026-09-28 — Claude documentation review finding corrected; #28 ready for owner decision

Claude found one count mismatch in Codex's reserved `AGENTS.md` change: the theming section still
said **three** accessibility constraints after the reduced-motion rule became a fourth top-level
item. The heading now says **four**. A blank line also separates the WCAG summary from that final
bullet so it renders as the section conclusion rather than part of the reduced-motion constraint.

Claude independently reran the suites at Codex's documentation head: `npm test` **306**,
`test:dom` **354**, and `test:mutation` **95 of 95**, with zero `ANCHOR LOST` and zero `AMBIGUOUS`.
It also verified by object hash that application, test, API and configuration files remained
byte-identical to the reviewed implementation at `5517b09`. No implementation file changed in this
correction. PR #28 returns to the owner for the merge decision after Vercel settles.

### 2026-09-28 — Codex implementation re-review clean; reserved T17 documentation complete

Codex's final read-only implementation re-review found no remaining code or test issue at `5517b09`.
The T15 layout result is owner evidence: Source details passed at 320px, 390px and desktop with no
overlap, clipping or horizontal scroll. T16 remains the deployed-preview raw-versus-rendered record
below. Claude-reported verification at that handoff was `npm test` **306**, `test:dom` **354** and
`test:mutation` **95 of 95**, with zero `ANCHOR LOST` and zero `AMBIGUOUS`; Codex's shell has no
Node/npm, so those counts were reviewed but not independently rerun.

Codex then claimed the reserved documentation sub-scope before editing. `AGENTS.md` now:

1. replaces the obsolete load-bearing triangle row with the two-state observation-dot rule;
2. retires the dot-specific F004 prose while preserving `.hazard-pulse`'s reduced-motion ring;
3. records the setter-line, constant-free extraction and explicit callback-arity lessons; and
4. requires a passing mutation run to have zero `ANCHOR LOST`/`AMBIGUOUS`, with render-path
   mutations revalidated after their target moves.

No application, test, API, configuration or dependency file changed in Codex's sub-scope. Claude
reviews this durable-document diff; the owner retains the merge decision.

### 2026-09-28 — T15 layout verified by the owner; Stage 2 evidence complete

**The owner inspected the preview at 320px, 390px and desktop.** This was the one gate no agent
could close: Claude cannot measure layout, and Codex cannot authenticate to the protected preview.

#### Result — passes at all three widths

```
320px    rows wrap cleanly. Source names break to two lines ("NWS" / "Observations");
         the meta chips wrap so the two ages sit on one line and the state badge below.
         No overlap, no clipping, no horizontal scroll.
390px    same structure, less wrapping. NWS Alerts, USGS, FEMA and News fit on one line.
desktop  every row on a single line, meta right-aligned, footer copy renders in full.
```

The `.src-meta` change made for this round — permitting wrap and compression where three chips
previously refused to shrink — is what produces the clean two-line wrap at 320px rather than an
overflow. **That is now a verification rather than the defensive guess it was when written.**

#### The capture also demonstrated the round-one gap closing, live

`NWS Observations` rendered a hollow dot and **NOT REPORTED** while `checked` read minutes and `obs`
read an hour. That looked wrong enough to check against the source, and it is correct: PHNL was
publishing `null` for `windSpeed`, `windGust` **and** `precipitationLastHour` at the time, verified
directly against `api.weather.gov` while the screenshots were on screen.

**Before this round that row would have read `Current`.** `renderSourceHealth()` passed a hardcoded
`true` for value usability, so good clocks vouched for data that was not there. That gap was found
only because a mutation came back `MISSED` and turned out to be inert — and here it is, firing
correctly against a real station reporting nothing.

It is also a good argument for the dot being about verification rather than magnitude: the station
is reachable, recent and answering, and still has nothing to report. One state could not have said
both.

#### Stage 2 evidence status

```
T01-T11, T13, T14, T17   covered by suites and mutations
T15                      layout verified by the owner at 320/390/desktop   DONE
T16                      raw-vs-rendered record against the deployed preview   DONE
T12                      Stage 3, excluded
```

`npm test` **306** · `npm run test:dom` **354** · `npm run test:mutation` **95 of 95 caught**, zero
`ANCHOR LOST`, zero `AMBIGUOUS`.

**Nothing is outstanding from the owner.** `AGENTS.md` remains untouched and reserved for Codex.


### 2026-09-28 — Stage 2 implementation complete; paused for Codex

**Implementation and tests are done and the branch is handed over.** `AGENTS.md` is untouched, as
reserved. Claude stops here and does not continue into the documentation sub-scope.

#### What the cards do now

`combinedObservationState()` decides what the weather and tide cards present. The dot is a statement
about **verification**, never magnitude — the three magnitude-driven assignments are gone, along with
`.s-dot.warn`, `.s-dot.alert` and the dot half of the reduced-motion rule. `.hazard-pulse` keeps its
static ring substitute: separate consumer, and reduced-motion users still need that second channel.

**Withdrawal is read from the cache rather than passed in.** Both fetch paths already rendered the
reading the cache accepted rather than the response that arrived, so the cache was the only honest
source for the verdict too — and reading it there gave `ageTick()` a render path needing no response
at all. The old shape could not offer that, because the state arrived as a boolean argument from
whichever fetch happened to be running. **The age tick now moves the cards**, so an observation
crossing its boundary while the page sits idle stops claiming to be verified.

#### T16 — raw response versus rendered output, against the deployed preview

Captured `2026-09-29T05:55:47Z` (Sep 28, 07:55 PM HST) from
`pacific-watch-git-claude-observation-stage2-saa-s16.vercel.app`, driving the **deployed** page
against the **real** upstream APIs. Expectations are computed in the harness from constants written
out independently, so a conversion bug in the app cannot also define what correct means.

```
WEATHER   api.weather.gov/stations/PHNL/observations/latest
  raw     windSpeed {unitCode:'wmoUnit:km_h-1', value:18.36}
          windGust {value:null}   precipitationLastHour {unitCode:'wmoUnit:mm', value:null}
          timestamp '2026-09-29T04:53:00+00:00'
  expect  18.36 km/h x 0.621371 = 11 mph · rain Not reported · observed 06:53 PM HST, 63 min
          verified? yes, inside the 75 min window
  actual  #stat-wind       11 mph
          #stat-wind-note  HNL Intl · Honolulu reference for statewide
                           · obs Sep 28, 06:53 PM HST (1 hr ago) · Current
          #dot-wind        s-dot ok
          #stat-rain       —
          #stat-rain-note  Not reported · HNL Intl · … · obs … (1 hr ago) · verified 0 sec ago
          #dot-rain        s-dot unknown

TIDE      tidesandcurrents.noaa.gov … station=1612340, datum=MLLW, time_zone=lst_ldt
  raw     v '0.942'   t '2026-09-28 19:42'   (HST wall time, no zone)
  expect  0.9 ft MLLW · observed 07:42 PM HST, 14 min · verified? yes, inside the 18 min window
  actual  #stat-tide       0.9 ft
          #stat-tide-note  ft MLLW · HNL Harbor · Honolulu reference for statewide
                           · obs Sep 28, 07:42 PM HST (14 min ago) · Current
          #dot-tide        s-dot ok

SOURCE DETAILS — the two clocks, separately
  NWS Alerts          checked 0 sec ago                    Current
  NWS Observations    checked 0 sec ago   obs 1 hr ago     Current
  NOAA Tides          checked 0 sec ago   obs 14 min ago   Current
  USGS Earthquakes    checked 0 sec ago                    Current
  FEMA Declarations   checked 0 sec ago                    Current
```

**The NWS Observations row is the clearest single piece of evidence that Stage 2 works.** Before it,
that row showed `checked 0 sec ago` and nothing else — a fresh fetch of an hour-old measurement
reading as healthy. Both clocks are now on screen and they visibly disagree. Sources with no
measurement clock show only the fetch age; inventing an observation age for them would be the same
false precision in reverse.

NOAA `t` is retained and rendered in HST, which closes the half of T06 that was previously discarded
at the fetch boundary.

#### Two harness artifacts in that capture, neither an application defect

`window.scrollTo` is unimplemented in jsdom, and Node's `fetch` refuses the relative
`/api/news/hazard` URL, so News reads Unavailable in the record. Both are properties of driving a
browser page from Node, and neither touches weather or tide. Stated rather than trimmed out of the
capture.

#### One defect the live capture found that no test had

The rain note read `Not reported · HNL Intl · … · Not reported · verified 0 sec ago` — the card
announced the missing value, and the state map announced it again four fields later in the same
line. Fixed, with an assertion that it is said once and a mutation that makes it stutter again.

**This is the argument for T16 existing.** Every suite was green across that stutter, because no
assertion was looking at the sentence as a reader would.

#### Three disarmed mutations, repaired

The first full run reported three `ANCHOR LOST` — the gust-only label and the two
"renders the response instead of the accepted reading" cases — all pre-existing cases whose targets
Stage 2 moved. Each still describes a real defect, so each was repaired rather than dropped. **This
is the second time in this project that fixing a code path disarmed the mutation guarding it**, and
it is worth treating as a standing post-change check rather than a surprise.

A fourth came back `MISSED` and was the useful one. It mutated the per-card `valueUsable` argument,
but the missing-value branches hardcode `'s-dot unknown'`, so that argument never reached a dot and
the mutation changed nothing. Hunting for where `valueUsable` *is* load-bearing turned up a real
gap: `renderSourceHealth()` passed a hardcoded `true`, so a reading whose every value was missing
would report `Current` on the strength of its clocks alone. `observationValueUsable()` now reports
on the reading, with assertions either side and the mutation retargeted there.

#### Test fixtures changed where Stage 2 changed behaviour

Stated plainly because changing an existing assertion deserves more scrutiny than adding one:

- The tide fixtures pinned `2026-09-25`. Harmless while nothing read the measurement clock, and a
  three-day-old observation the moment Stage 2 did. Now built relative to now.
- The default tide fixture carried **no NOAA `t` at all** — modelling a response CO-OPS does not
  send, while asserting it earned a verified dot. It now carries one, and T07 covers the missing
  case directly.
- Two assertions recomputed `hstStamp()` at assertion time. It has minute resolution, so a minute
  boundary between seeding and asserting made them fail intermittently; they passed earlier **by
  luck**. Pinned, and the suite now runs clean three times consecutively.
- One extraction pattern in the pure suite pinned `relAge`'s exact parameter list, so adding the
  injectable clock broke **extraction** rather than failing an assertion — the suite crashed instead
  of reporting. Made parameter-tolerant. That is the same lesson T17 already records for constants,
  arriving through a different door.

#### Verification

`npm test` **306** · `npm run test:dom` **336** · `npm run test:mutation` **89 of 89 caught**, no
MISSED, no ANCHOR LOST, no AMBIGUOUS.

#### Reserved for Codex on this branch

`AGENTS.md` is untouched. The T17 reconciliation and the three mutation-testing lessons are Codex's
documentation sub-scope, claimed separately. A fourth candidate lesson emerged here and is offered
rather than placed: **a change to a render path can disarm the mutation that guards it, so a
post-change `ANCHOR LOST` check belongs beside the count.**


### 2026-09-28 — #26 MERGED and verified in production; G1 closed

Merged on the owner's explicit permission, squashed as `9e2cfec` per the repository's convention.
Production deployment succeeded and was verified immediately.

#### Production verification

```
/api/news              200   count=30  hazard=13  nonhazard=17   mixed, as required
/api/news/hazard       200   count=30  hazard=30  nonhazard=0    NEW — returned 404 before this
/api/news?limit=30     200   legacy caller still works
/api/news?hazard=1     200   returns the ALL-headlines body, key deleted at the edge
/                      200   site serves

distinct entries       /api/news updated 04:16:05.128Z
                       /api/news/hazard updated 04:16:06.005Z
```

#### G03 is now proven in production, not only on preview

```
canonical      Age: 17   X-Vercel-Cache: HIT
?limit=99      Age: 17   X-Vercel-Cache: HIT
?zzz=30985     Age: 18   X-Vercel-Cache: HIT     <- freshly random, never requested before
?a=1&b=2       Age: 18   X-Vercel-Cache: HIT
```

**A never-before-seen arbitrary key converged on the canonical cache entry rather than forcing an
expensive miss.** That is precisely the vector G1 existed to close, now demonstrated against
production traffic. The matching `Age` values confirm it is one entry rather than four that happen
to be warm.

The `?hazard=1` result also confirms, by measurement rather than prediction, the transient effect
described before the merge: a browser still running the old client sends `?hazard=1`, the edge
deletes the key, and the hazard toggle shows all headlines until the page reloads. `index.html` is
served `no-store`, so the next load fixes it.

#### G1 — closed

```
G01-G10   implementation, tests, preview evidence        accepted
G11       final rule record                              accepted
G12       enforcement observed at 5-per-60 and restored  accepted
G13       per-region caveat stated, no DDoS claim        accepted
G14-G18   contract items covered by the above            accepted
```

What it buys, unchanged from the contract and worth keeping accurate: the demonstrated single-source
arbitrary-key vector is closed, and a single IP is bounded to 100 requests per minute **per region**.
It is not a distributed-attack defence, and no load testing was performed.

#### Carried forward, per Codex's ruling

The hazard-classifier false positives move into the Review Queue below rather than widening #26.
They are pre-existing: `HAZARD_RE` was verified byte-identical to `main` throughout, so #26 neither
introduced nor worsened the behaviour.

### 2026-09-28 — Codex accepts G11/G12/G13; #26 awaits the owner's merge decision

Final review complete. The filtered platform record closed the attribution gap, and Codex confirms
the board correctly distinguishes owner/Claude enforcement evidence from its own independent
steady-state verification. **G11, G12 and G13 accepted. No agent merges without the owner's explicit
permission.**

#### Scope ruling carried forward

**#26 is not to be widened for the hazard-classifier issue.** It is pre-existing — `HAZARD_RE` is
byte-identical to `main` — and goes into the Review Queue through the next properly claimed board
closeout *after* #26 merges. Stage 2 and Stage 3 remain separately claimed work.

#### What merging actually changes in production

Recorded before the decision rather than after it, because this is the first production deploy of
the G1 work:

- `/api/news/hazard` begins to exist. It currently returns `404` in production.
- `/api/news` stops accepting caller-selected parameters at the handler — but **legacy URLs keep
  working**, because the query-delete transform strips every key at the edge before the Function
  sees it. This was measured on preview: `?limit=99` and `?hazard=1` both returned `200` with the
  canonical body.
- One transient effect worth naming: a browser that already has the **old** page open in memory will
  keep requesting `?hazard=1` until it reloads, and since the transform deletes that key, its hazard
  toggle will show all headlines rather than hazard-only. It self-corrects on reload, and
  `index.html` is served `no-store`, so the next load gets the new client.
- The existing 100-per-60 WAF rule covers both paths already, since it is path-keyed with no
  hostname condition. `/api/news/hazard` falls under it the moment it exists.

#### Verification owed immediately after any merge

```
production /api/news          200, count 30, hazard and non-hazard both present
production /api/news/hazard   200, count 30, hazard only          (currently 404)
production /api/news?limit=30 200, canonical body                 (legacy caller)
production site              loads, news card populates
```

### 2026-09-28 — rule attribution captured; G11 and G12 evidence complete

The historical Firewall traffic view closes the last gap. **Filtered to the custom rule by selecting
it from the rule drop-down** — confirmed by the owner, so this is a rule filter and not a free-text
search — scoped to the minute containing the burst:

```
filter          Final Rule   (selected from the rule drop-down)
window          5:15pm - 5:16pm HST, 2026-09-28

Allowed         -            Denied  -     Challenged  -     Logged  -
Rate Limited    20

Top Request Paths
  /api/news            15
  /api/news/hazard      8

Custom Rules    1 active
```

IP column redacted; it carries the owner's residential address and this board is public.

#### Why this settles more than attribution

Codex asked for the rate-limited requests tied to the rule. The `Top Request Paths` panel does that
**and** independently confirms G11's scope requirement: under the rule filter, **only the two
canonical paths appear.** No third path matched. That is the same property the improvised root-path
probe established live, now corroborated from the platform's own log rather than from Claude's
measurements.

The earlier aggregate is superseded. `Rate Limited 6` over *Past Day* was captured seconds after the
burst, before events had aggregated; the filtered view reports 20 in a single minute. **The later
figure is the trustworthy one, and the discrepancy is dashboard lag rather than a contradiction.**

A smaller arithmetic note, recorded rather than smoothed: the path panel totals 23 requests against
20 rate-limited in the same window. The likely reading is that the path panel counts every request
matching the rule while the legend counts only refusals, but that is an inference about the
dashboard rather than something measured, and nothing in G11 or G12 turns on the difference.

#### Provenance, stated for the record

Every item below is **owner and Claude evidence.** Codex observed none of the enforcement firsthand
— see the correction entry — and independently verified only the steady state afterwards. The
attribution capture comes from the platform's log rather than from either agent, which is what makes
it usable despite that.

#### G11 and G12 — complete

```
G11  final rule record, captured before the edit and again after       DONE
     covers only the two representations, IP key, 60s, 100, 429
     corroborated by Top Request Paths showing no third path

G12  enforcement observed at 5-per-60 on the preview hostname          DONE
     both canonical paths refused; hazard path gave 5 x 200 then 429
     cache=STALE requests consumed the limit; 429s carry no cache header
     attributed to the named rule via the platform log
     restored to and recorded at 100-per-60                            DONE
     recovery 14 of 14, protection restored and confirmed 302          DONE

G13  per-region counting stated, no distributed-attack claim           DONE
```

**Nothing further is owed by the owner.** The merge decision for #26 is Codex's.

### 2026-09-28 — correction: Codex did not observe the 429s firsthand

**The G12 response record is owner/Claude evidence, not Codex-independent evidence.** Codex flagged
this and is right.

#### What actually happened, stated plainly

During the run Claude wrote *"Signalling it to start"* and *"All three of Codex's preconditions now
hold"* — **but there is no channel by which Claude signals Codex.** The only relay is the owner
pasting messages between the two agents, and during a fast-moving live window with dashboard work in
hand, that did not happen. Codex received the messages afterwards.

So the whole point of opening Deployment Protection — that the reviewer would see the `429`s
directly, removing Claude from the evidence chain on the one item Codex could not verify — **was not
achieved.** The preview was opened for a benefit that the design could not actually deliver, because
the design assumed a live signal that does not exist.

**This was Claude describing a coordination step as done when it had not been done.** Not a
measurement error this time — a claim about process, made in the present tense, that the
architecture never supported.

#### What Codex did verify independently, and it is worth crediting

Steady state after the run, from its own browser: production `/api/news` `200` five of five; both
preview API paths `302`; #26 `MERGEABLE/CLEAN` with Vercel checks passing; head `1cfdd94` clean and
synchronized; application, configuration and test files byte-identical to `54e9248`. That is genuine
independent verification of the **final state** — just not of the enforcement event.

#### The attribution gap Codex will not waive

`Rate Limited 6` and `Custom Rules: 1 active` are aggregates. They show that rate limiting occurred
and that one custom rule existed; they do not tie the specific `429`s to that specific rule. The
reasoning *"it is the only rate-limit rule, therefore it produced them"* is an inference, and the
evidence standard here has been measurement over inference throughout.

**Needed:** the historical Firewall traffic view filtered to the exact custom rule, showing the rule
name or ID alongside the rate-limited requests with paths and timestamps. The log is historical, so
no rerun is required.

#### The test window, for locating it in the log

Derived from the `x-vercel-id` values captured on both sides — all six landmarks fall inside 108
seconds:

```
2026-09-28 17:15:05 HST   owner browser, /api/news, 429
2026-09-28 17:15:44 HST   Claude burst, /api/news, 8 x 429
2026-09-28 17:15:45 HST   owner browser, /api/news/hazard, 429
2026-09-28 17:16:52 HST   Claude burst, /api/news/hazard, 5 x 200 then 3 x 429

window  17:15:05 -> 17:16:53 HST   (03:15:05 -> 03:16:53 UTC, 2026-09-29)
```

**Redact the IP column before that capture leaves the dashboard** — it carries the owner's
residential address and this board is public.

#### Lesson for the working agreement

A coordination plan that depends on a live signal between agents **cannot be relied upon**: the relay
is a human pasting messages, and it is slowest exactly when the window is live and the owner is
busiest. Future evidence designs should either be asynchronous — the reviewer works from a durable
log after the fact, as it now must — or the owner should be told explicitly that a relay is required
at a specific moment, before the window opens rather than during it.

### 2026-09-28 — G11 and G12 EVIDENCE: the rerun completed, all phases passed

The full sequence ran end to end in one sitting and every gate passed. **Production was never
throttled at any point, verified twice during the run rather than assumed.** Deployment Protection
is restored and confirmed; the final 100-per-60 rule is live.

#### G11 — the final rule, as restored and published

```
Name          Final Rule
Rule ID       rule_final_rule_XfLFC2
Description   Rate limit API news endpoints to 100 requests per minute per IP
If            Request Path  Is any of  2 Request Paths: /api/news, /api/news/hazard
AND
Rate Limit    Fixed Window | 60 seconds | 100 requests | 1 Keys: IP Address
Then          Too Many Requests (429)
```

Covers only the two news representations, no hostname condition, so it applies wherever they are
served. This is the Phase 0 baseline restored exactly, captured from the dashboard before the edit
and again after — **not** the provisional transcription recorded on the 27th, which this supersedes.

#### G12 — the temporary rule, as published for the test

```
If            Hostname      Equals     pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app
And           Request Path  Is any of  2 Request Paths: /api/news, /api/news/hazard
AND
Rate Limit    Fixed Window | 60 seconds | 5 requests | 1 Keys: IP Address
Then          Too Many Requests (429)
```

#### G12 — controlled response record

All traffic unauthenticated, **no bypass header anywhere**, as revision 5 requires. Every request
served from region `pdx1`, so no off-by-one below has a regional explanation available or needs one.

**This record is owner and Claude evidence. Codex did not observe these `429`s** — see the correction
entry above. Rule attribution is pending the historical Firewall capture.

**Production gate — 7 of 7 `200`, run twice** (once against the malformed first attempt, once
against the correct rule). Production was never matched.

**Scope check — preview root `/`, 8 of 8 `200`.** Against the first published attempt the same probe
returned `429` at request 3. That before/after pair is what distinguishes *the rule fires* from *the
rule fires on the right things*.

**Burst, `/api/news/hazard` — the textbook result:**

```
req 1   200  cache=STALE   pdx1::iad1::vx4jf-1790651812072-af0cc71f55e6
req 2   200  cache=STALE   pdx1::iad1::ssgkf-1790651812381-78d357242795
req 3   200  cache=STALE   pdx1::iad1::688qk-1790651812656-11ee5a69b39d
req 4   200  cache=STALE   pdx1::iad1::gd8b7-1790651812919-7b7d793a6913
req 5   200  cache=STALE   pdx1::iad1::ll47f-1790651813169-b193eab86c18
req 6   429  cache=-       pdx1::d5vs2-1790651813450-b1c695f67acb
req 7   429  cache=-       pdx1::lcwhv-1790651813722-988b62a52034
req 8   429  cache=-       pdx1::shrpr-1790651813985-a12d0c177783
```

Exactly five, then refusal.

**Burst, `/api/news` — 8 of 8 `429` from request 1**, because the shared-IP allowance had already
been consumed. See the correction below; the path is still demonstrated as enforced.

**Owner's browser, both paths** — Vercel's *"This site is rate limited / 429 TOO MANY REQUESTS"*
page, with `pdx1::mr1hk-1790651705670-69263f80af8b` on `/api/news` and
`pdx1::vbdg2-1790651745607-0ec3b5e3bab3` on `/api/news/hazard`.

**Firewall traffic panel:** `Rate Limited 6`, `Custom Rules: 1 active`. Top IPs showed one
Charter-ASN address accounting for 24 requests — **address redacted here deliberately: it is the
owner's residential IP and this board is a public repository** — plus two Amazon-ASN addresses with
one request each.

**Recovery — 14 of 14 `200`** (seven preview, seven production) after a full 65-second wait.
Requests 6 and 7 on the preview would have been `429` under the 5-per-60 rule, so this confirms the
restore is published and live rather than merely between windows.

**Protection restored — `302` on both preview paths**, then production `5 of 5` `200`.

#### What the run settled that no agent had measured

**The firewall counts requests at the edge, not Function invocations.** Requests 1-5 on the hazard
path were served `cache=STALE` — from the CDN, without the Function running — and **still consumed
the limit**. The `429`s carry no cache header at all.

This was the open question flagged before the evidence was gathered, with the explicit warning not
to assume the favourable outcome. It came back favourable on a clean, correctly-scoped run, and it
is the result G1 needs: the demonstrated vector was cheap cache-missing traffic, and a defence that
only counted Function invocations would not have bounded it. It also matches Vercel's documented
[request pipeline](https://vercel.com/docs/how-vercel-cdn-works) — *"Blocked requests never reach
the routing or caching layers."*

#### Two corrections owed

**1. "Three independent budgets" was wrong.** The procedure claimed the owner, Codex and Claude each
held a separate 5-per-60 allowance because the limit is IP-keyed. Codex does. **The owner and Claude
do not** — Claude Code runs on the owner's machine, so both leave from one public IP. The run proved
it: the owner's browser burst consumed the allowance and Claude's `/api/news` burst was over the
limit from request 1, with the traffic panel showing a single address at 24 requests. Corrected in
the procedure, with the instruction to take one path each or separate the bursts.

**2. The root-path probe is now a required step.** It was improvised mid-run and turned out to be
the only check that distinguishes a correctly scoped rule from one matching the whole hostname.
Added to the procedure as the Phase 1 scope check, ahead of the production gate.

#### Three rule attempts, recorded because the failures are instructive

1. **Hostname OR path** — Vercel ORs sibling condition *groups*. Published and measured: preview `/`
   returned `429` at request 3, so the rule matched the entire preview hostname. Production
   unaffected, verified at the time.
2. **`Equals` with a comma-joined string** `/api/news,/api/news/hazard` — no request path is ever
   literally that, so the condition could never match. Combined with the `OR` above, the rule
   reduced to "hostname = preview" alone.
3. **`Is any of` with two entries, AND-ed with the hostname in one group** — correct, and the shape
   Vercel's own rule builder produces. The owner could not flip the `OR` because it separates
   groups, not conditions; rebuilding through the rule builder was what fixed it.

**The lesson is the same one this board keeps paying for:** a rule that looks right in a screenshot
is not a rule that behaves right, and the only thing that told them apart was a probe against a path
the rule was supposed to ignore.

#### Outstanding

The Firewall live-traffic capture filtered to the custom rule — the log is historical, so the owner
can capture it at leisure. **Redact the IP column before it leaves the dashboard.**

### 2026-09-28 — revision 5 cleared; waiting on the owner's uninterrupted window

Codex's static safety review of revision 5 passed with no remaining procedure findings. **G12 is
ready to execute and has not been executed.** Final 100-per-60 rule live, Deployment Protection on,
#26 unmerged — all three re-verified by measurement after the correction, not assumed.

#### The gate is now the owner's availability, not the documentation

Phases 0b through 4b must run in one sitting, because between them the preview is public **and**
production is unprotected by the rate limit. That is roughly 15-20 minutes and should not be started
and walked away from. Nothing else blocks G12.

#### Codex will not act until all three preconditions are confirmed

1. unauthenticated preview returns `200`;
2. the correctly scoped preview-only 5-per-60 rule is published;
3. the owner is present and ready to complete restoration and protection closure in the same sitting.

#### Claude's side is staged in advance

A harness is prepared so the exposure window stays short: discrete steps for the precondition check,
the production gate, the two-path burst, the recovery check and the protection-closed check, each
exiting non-zero on failure so a bad result cannot be read as a good one in the moment.

**It carries no bypass header anywhere, deliberately.** Revision 5 removed that fallback: during this
run the preview is open, so an authentication response means Phase 0b failed and the test stops.
Reaching for a bypass header would manufacture exactly the second-hand evidence the arrangement
exists to eliminate.

Validated against current state before use, which is the point of running it early: the
precondition check **correctly failed** while protection is still on, the protection-closed check
passed, and the production gate passed seven of seven. A check that cannot fail is not a check.

Every request in that validation was served from `pdx1`. Single-region traffic means an off-by-one
in the changeover is unlikely to have a regional explanation available — which is a reason to record
`x-vercel-id` per request, not a reason to expect one.

### 2026-09-28 — revision 5: two execution-order defects, both mine, caught before execution

Codex blocked execution of revision 4 and was right to. **Nothing was run, no dashboard change was
made, and neither piece of external state was touched.** Verified after the correction: the preview
still returns `302` unauthenticated and production still returns seven `200`s.

#### Defect 1 — stale cross-references

Inserting Phase 0b and Phase 3b shifted the phase numbering and I did not update the references
pointing at them. Three lines still said "restore per Phase 4" and "verify recovery per Phase 5"
when they meant Phase 3 and Phase 4. Confirmed against the file at the exact lines Codex cited.

#### Defect 2 — an impossible order, and the worse half underneath it

Revision 4 placed **Phase 3b (restore protection, verify unauthenticated `302`)** immediately before
**Phase 4 (seven unauthenticated preview requests returning `200`)**. Those cannot both hold. I
appended a phase without re-reading what followed it.

The more serious half is what Codex saw underneath: **every failure path restored only the rate
limit.** Each `stop and report` branch would have left Deployment Protection off and the preview
publicly readable — turning one failed acceptance item into an open deployment.

That is the same class of error as the original incident: a step correct in isolation, wrong in
composition, and reviewed by its own author without tracing what it touched. Twice now the guard
rail has been the second reader rather than the writer.

#### Revision 5

Phase order is now **0 → 0b → 1 → 2 → 3 → 4 → 4b → 5**, with protection restored *after* the
recovery check that requires the preview to be open.

A single **Restoration** block is now cited by every failure path and runs in one order: restore the
rule (Phase 3), verify recovery (Phase 4, protection still off), restore protection (Phase 4b,
confirm `302`). Only then stop and report. Both the Phase 1 gate failure and the fail-closed branch
point at it.

The Phase 2 fallback offering a bypass header or an authenticated browser is **removed**. Under this
revision an authentication response means Phase 0b failed, not that a workaround is wanted — and a
run that needs a bypass header or the owner login produces exactly the second-hand evidence this
arrangement exists to avoid.

Added: **Phase 0b through 4b run in one sitting.** Between those points the preview is public *and*
production is unprotected by the rate limit. Neither state should outlive the session that created
it.

The hand-back list was also reordered to chronological — it listed the protection restore before the
recovery check, the same reversal in miniature.

#### Signal conditions

Codex is signalled only when all three hold: unauthenticated preview access confirmed `200`; the
correctly scoped 5-per-60 rule published; and the owner ready to complete test, restore, recovery and
protection closure in one sitting. Until then the final rule stays live and protection stays on.

### 2026-09-28 — resumed; preview-access decision taken, procedure at revision 4

State verified against the pause record before anything else, because an overnight gap is exactly
when a "right now" line goes stale: head `0230824` local and remote, clean tree, #26
`MERGEABLE/CLEAN`, production `7 of 7` `200`, both preview representations correct and distinct
(`count=30` with 11 hazard / 19 non-hazard; `count=30` with 30 / 0), preview still `302` without the
bypass header. Nothing drifted.

The preview alias now serves `dpl_Aix7ndnseeXMAb7hX2DHF1znKWwL` rather than the deployment smoked on
the 27th — the documentation-only commits triggered rebuilds. Code files remain byte-identical, so
behaviour is unchanged, and the **current** deployment id will be recorded with the G12 evidence
rather than the stale one.

#### Decision: Deployment Protection comes off for the test window

The owner chose to open the preview so **Codex observes the `429`s first-hand**. This is the right
trade: the preview `429` is the single item Codex cannot verify for itself, and the whole reason G12
exists is that a rule which is configured but not enforcing looks identical to one that works.
Having the reviewer see it directly removes Claude from the evidence chain at precisely the point
where that matters most.

Cost, stated rather than waved past: the preview is publicly readable for those minutes. It serves
Hawaii news headlines and nothing else, and the two API shapes are already visible in the open PR.
**Phase 3b restores protection and is mandatory, with a `302` check to prove it took effect.**

#### A property that makes three observers cheap

The limit is keyed on **IP address**, so the owner, Codex and Claude each hold an independent
5-per-60 budget. Three observers do not compete for one allowance and need no timing coordination
beyond each waiting out their own clean window. Per-region counting still applies, so `x-vercel-id`
is recorded on every request.

#### Revision 4

Phase 0b (open the preview, verify unauthenticated `200`) and Phase 3b (close it again, verify `302`)
are inserted around the existing sequence. Order matters and is deliberate: protection comes off
**before** the rule is edited, because if it cannot be removed there is no reason to touch the rate
limit at all.


### 2026-09-27 — END OF NIGHT PAUSE

Stopping here for the night at the owner's call. **Nothing is mid-flight and nothing is left in a
broken state.** Working tree clean, everything pushed.

#### Exact state

```
branch        claude/g1-abuse-bounding
head          b439870
PR #26        OPEN | MERGEABLE | CLEAN | Vercel checks passing
production    pacific-watch.vercel.app/api/news -> 200, serving normally
WAF           ONE rule live: the final 100-per-60, path-only, IP key, 429 enforcing
              (Hobby allows exactly one rate-limit rule per project)
temp rule     the earlier mis-scoped rule is OFF; a correctly shaped replacement was
              built by Vercel's rule builder but deliberately NOT published, because
              publishing it would be a second rate-limit rule and is impossible on Hobby
suites        npm test 306, test:dom 288, test:mutation 78 of 78, last run at 54e9248;
              every code file byte-identical to 54e9248 since
```

**No dashboard change is pending or half-applied.** The project is in its intended steady state:
final rule live, production protected at 100-per-60, preview unthrottled.

#### Where G1 actually stands

Code, tests and preview smoke are done and Codex's final read-only review returned no findings.
**G11 is credible** on the final-rule record but Codex wants the Phase 0 capture from the rerun as
the authoritative version, because the provisional transcription on the board is my reading of a
screenshot and a misreading of that same UI is what caused the incident.

**G12 is open and is the only thing blocking the merge.** The accidental production observation is
real behavioural evidence and is explicitly *not* accepted as G12: it misses the preview-hostname
condition and proves nothing about the corrected grouping.

#### The one thing to do first on resume

**Do not start by editing the WAF rule.** Start by resolving who gathers the preview evidence,
because it determines the whole shape of the run:

The preview is deployment-protected — both preview API paths return `302` to the Vercel login wall
for anyone without the bypass header, measured rather than assumed. Codex has a browser session and
can therefore verify **production** unaided, but **cannot reach the preview**, which is exactly where
G12 needs the `429`s.

Three options are with the owner, undecided:

1. Leave it: Codex verifies production; preview evidence comes from the owner's browser and Claude's
   bypass-header run.
2. **Recommended.** Temporarily disable Deployment Protection on the preview for the test window so
   Codex observes the `429`s first-hand. Strongest available G12 evidence, since it removes Claude
   from the evidence chain on the item Codex is most skeptical of. Costs a few minutes of publicly
   readable preview — news headlines only — and is a project settings change, so owner-only.
3. A Vercel share link for the protected deployment. Flagged as plausible, **not confirmed** — check
   the dashboard before relying on it.

#### Then, and only then, revision 3

[G1-WAF-PUBLICATION-PROCEDURE.md](G1-WAF-PUBLICATION-PROCEDURE.md) is current and carries Codex's
four safeguards. The sequence in one line each: capture the final rule first; edit that single rule
into the preview-only 5-per-60 using the `Is any of` shape; publish; seven production requests all
`200` or stop; wait 65s untouched; burst both preview paths recording status, `x-vercel-cache` and
`x-vercel-id`; capture the Firewall live-traffic event attributing the `429`s to the rule; restore
the single rule to 100-per-60; publish; capture it; wait 65s; verify fourteen `200`s across both
hostnames.

**Production has no rate limit while the test rule is in place.** Unavoidable on Hobby with one rule.
Keep the window to minutes.

**If no rule-generated `429` appears** after both the bypass run and a browser retry: restore, verify,
stop, and report **G12 failed**. It is not to be downgraded to a platform limitation.

#### Open, not lost

**Hazard classifier false positives — pre-existing, not blocking.** Live preview data during an
active hurricane shows roughly 7 of 30 items in the hazard representation are not Hawaii hazards:
`erupt` matching "gun sale **erupted** in gunfire", `emergency` matching "Honolulu **Emergency**
Medical Services" on a stabbing, `warning` matching "**warning** sign for GOP", `swell` matching
"HI-5 fund **swells**", `closed` matching a DMV closure, plus two mainland weather stories that
matched legitimately.

`HAZARD_RE` at `api/news.js:35` is **byte-identical to `main`** — verified, not assumed — so #26
neither introduced nor worsened this; the old `?hazard=1` behaved the same way. Recorded here rather
than acted on: it would change code Codex has certified clean, and it needs its own claim. Codex was
asked whether to log it in the Review Queue now or raise it after #26 merges; **undecided**.

#### Deliberately not done, and not to be started without a claim

Stage 2 and Stage 3 of Q007/Q008. Any change to `HAZARD_RE`. Any merge of #26. Any WAF or Vercel
settings change by an agent.

#### Resume in this order

1. Owner decides the preview-access question above.
2. Owner runs revision 3 end to end; Claude captures the bypass-header side in parallel if still
   needed; Codex verifies production first-hand at the gate and after the restore.
3. Claude writes the evidence into the board as G11/G12.
4. Codex verifies and presents the merge decision for #26.
5. After merge: decide the hazard-classifier finding, then Stage 2 under a separate claim.

### 2026-09-27 — G12 rerun required; procedure revision 3 and a platform constraint

Codex ruled that the accidental production run **does not satisfy G12**: it misses the explicit
preview-hostname condition and proves nothing about the corrected grouping. The behavioural finding
is kept, G12 stays open, #26 stays unmerged. That is the right call — the evidence was real but it
was not the test the contract asks for.

#### A platform constraint that invalidated the original sequence

**Hobby allows exactly one WAF rate-limit rule per project.** Verified directly against
[Vercel's rate-limiting docs](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
rather than taken on report:

> | Number of rules | **1 per project** | 40 per project | 1000 per project |

with the note that the Hobby figure applies to rate-limit rules specifically, and that Hobby allows
up to three total custom firewall rules.

The final 100-per-60 rule occupies that single slot, so **revision 1's instruction to add a second,
temporary rate-limit rule was impossible on this plan** — and it was already superseded by the
grouping incident before anyone reached that wall.

The rerun therefore **edits the one rule in place** and edits it back. Two consequences recorded
rather than glossed: production has **no rate limit for the duration of the test**, which is
unavoidable here and is why the window must be minutes; and the final rule's configuration must be
captured **before** editing, because the thing being overwritten is both the restore target and the
G11 evidence.

#### The rule shape, settled

Vercel's own rule builder produced the form that removes the ambiguity entirely:

```
If   Hostname      Equals     pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app
And  Request Path  Is any of  /api/news, /api/news/hazard
```

`Is any of` carries both paths in **one** condition row, so there are no OR'd sibling cards and no
grouping question to get wrong. The owner was right to push back on my reading of the card layout —
I was inferring structure from a screenshot. What the measurement established was never the layout,
only that `/api/news` matched production; this shape makes the layout irrelevant.

#### G11 — final rule, transcribed for acceptance

Codex asked for the actual final-rule record rather than a description. As displayed in the
dashboard before any rerun edit:

```
Name          Final Rule
Rule ID       rule_final_rule_XfLFC2
Description   (empty)
If            Request Path   Equals   /api/news
   OR
If            Request Path   Equals   /api/news/hazard
   AND
Rate Limit    Fixed Window | 60 seconds | 100 requests | 1 Keys: IP Address
Then          Too Many Requests (429)
```

**This transcription is read from a screenshot and is the author's reading of it, not an API dump.**
Given that a prior misreading of this same UI is what caused the incident, Codex should treat the
Phase 0 capture in the rerun as the authoritative G11 record and this as provisional.

For reference, the temporary rule as it stood during the incident:

```
Rule ID       rule_temp_test_rule_oYltUL
If            Request Path   Equals   /api/news              <- no hostname row
   OR
If            Request Path   Equals   /api/news/hazard
   And        Hostname       Equals   pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app
   AND
Rate Limit    Fixed Window | 60 seconds | 5 requests | 1 Keys: IP Address
Then          Too Many Requests (429)
```

#### Procedure revision 3 — the four safeguards

1. **Fail closed.** If the preview run produces no rule-generated `429`, the procedure now requires
   restoring the rule, verifying recovery, stopping, and **reporting G12 failed**. It says in terms
   not to write it up as a platform limitation or as "configured correctly but unobservable". A rate
   limit that cannot be seen firing is the exact thing G12 exists to catch.
2. **Clean window and region evidence.** A mandatory 65-second untouched wait before the burst, and
   per-request capture of status, `x-vercel-cache` **and** `x-vercel-id`. An off-by-one in the
   changeover may not be attributed to regions without IDs demonstrating it — which retroactively
   disqualifies the "tripped at request 4" reading from the incident as anything but a partially
   consumed window.
3. **Both paths, plus rule attribution.** At least one `429` on each canonical path, and a captured
   Firewall live-traffic event showing the rate-limited requests grouped under that custom rule.
   A `429` in a response log does not prove which component produced it.
4. **Bypass and platform usability.** A bypass-header run that does not trigger must be retried
   through the authenticated browser before failure is declared. Both loops are now labelled Bash
   and given Windows PowerShell / `curl.exe` equivalents.

#### The no-compute claim now has a citation

Vercel's [request pipeline](https://vercel.com/docs/how-vercel-cdn-works) runs the Firewall layer
ahead of routing, caching and compute, and states plainly: **"Blocked requests never reach the
routing or caching layers."** So a WAF-generated `429` costs no Function invocation and no upstream
fan-out. That was previously an inference from my own measurements; it is now a documented platform
property, and the incident observation — `cache=HIT` responses still consuming the limit, `429`s
carrying no cache header — is consistent with it rather than the sole basis for it.

#### Attribution

The **"no user impact"** finding is the **owner's statement**: Pacific Watch has not been broadcast,
so the only traffic during the incident was the owner's and mine. It is recorded as the owner's
account, not as an independent verification. **The production throttling remains recorded as an
incident regardless.**

#### State

G11 credible, pending the Phase 0 capture for final acceptance. **G12 open.** #26 unmerged. No
dashboard change is to be made until the owner works from revision 3.

### 2026-09-27 — the temp WAF rule matched production; G12 data captured by accident

**The 5-per-60 test rule throttled production `/api/news`.** It was caught within minutes, production
is recovered and verified, and **no user was affected** — the owner confirms Pacific Watch has not
been broadcast, so the only traffic was the owner's and mine. A configuration defect with no user
impact, not an outage. Recorded at full length anyway, because the guard rail that failed is the one
this procedure was built around.

#### What broke

Vercel AND-s conditions **inside** a condition card and OR-s the cards. The rule was built as:

```
(Path = /api/news)                                  <- no hostname row: matches EVERY hostname
   OR
(Path = /api/news/hazard AND Hostname = preview)    <- the guard applied only here
```

So the hostname guard covered the hazard path and left plain `/api/news` matching production. The
correct shape repeats the hostname row inside **both** cards.

#### Whose error this is

**Mine, at the step that was supposed to catch exactly this.** The first version of
[G1-WAF-PUBLICATION-PROCEDURE.md](G1-WAF-PUBLICATION-PROCEDURE.md) led with the warning that a
path-only rule reaches production, and then said to add *a* hostname condition without saying it
must be attached to each path clause. The owner built it, sent a screenshot, and **I read that
screenshot and confirmed it was correct.** It was not. The owner then acted on my confirmation.

Writing the warning and then failing to apply it while reviewing the very artifact it was about is
the part worth keeping. The document was not wrong about the risk; it was useless about the
mechanism, and the review that should have compensated repeated the same assumption.

It also means production was throttled during the **first** test run, not only the second. The
"production healthy, 6 of 6 `200`" check recorded earlier ran *after* the rule had been disabled,
which is precisely why it looked clean.

#### Measured, during and after

```
production /api/news, rule live      req 1-3  200  cache=HIT
                                     req 4-9  429  cache=(empty)
production /api/news, rule off       req 1-7  200        (after a full 60s window reset)
production /                         200                 (the site itself was never affected)
production /api/news/hazard          404                 (correct: #26 is unmerged)
```

The trip at request 4 rather than 6 is the owner's own browser requests already counted against the
same 60-second window.

#### The accident answered the open question

The board asked, before any of this, whether the firewall counts **requests at the edge** or only
Function invocations — `/api/news` is CDN-cached, so most burst traffic never reaches the handler.

**It counts requests.** Requests 1-3 were served `cache=HIT` and still consumed the limit, and the
`429`s carry no cache header at all, meaning they are refused at the edge before cache is consulted.
That is the stronger of the two outcomes and the one G1 needs, since the demonstrated vector was
cheap cache-missing traffic.

**This is a real G12 observation gathered the wrong way.** It is a controlled response record at
5-per-60 with per-request statuses, but against production rather than the preview hostname G12
specifies. It is recorded as evidence of *behaviour* and explicitly not offered as the clean
preview-only run. Codex decides whether it satisfies G12; the recommendation is to re-run it
properly, which also tests the corrected rule shape.

#### Corrections made to the procedure

1. The grouping is now shown as a WRONG/RIGHT block, with the instruction to repeat the hostname row
   **in every card** and to read each card back separately before saving.
2. A **mandatory production check before generating any test traffic**: seven requests to production
   `/api/news`, all of which must be `200`. Seven is above the temporary limit of five, so a
   mis-scoped rule reveals itself there instead of on the preview.
3. Recovery is now verified on **both** hostnames and only after a full 60-second wait, so an
   open rate-limit window is not mistaken for a rule that is still live.
4. The reset step now says why deleting beats disabling, using this incident as the reason.

#### State

Temp rule **off and verified off**. Final 100-per-60 rule is live and correct — both paths, no
hostname condition, IP key, 429 — and production serves normally under it. **G11 evidence stands.**
G12 is pending the owner's decision on a clean re-run.

### 2026-09-27 — code review clean; G11/G12 procedure handed to the owner

Codex's final read-only review of #26 returned **no code, test, documentation or evidence findings**.
It confirmed the complete-log G02 assertions and both new mutations are load-bearing, and accepted
that the `54e9248` smoke applies to `ea6e496` because only `AI-HANDOFF.md` changed afterward. PR #26
is `MERGEABLE/CLEAN` with both Vercel checks passing.

**#26 is not merged and is not to be merged yet.** G11 and G12 are the only outstanding acceptance
items, and they are external actions.

#### What was added

[G1-WAF-PUBLICATION-PROCEDURE.md](G1-WAF-PUBLICATION-PROCEDURE.md) — the owner's step-by-step:
the temporary preview-only 5-per-60 test, the evidence to capture, the reset, and the final
production 100-per-60 rule, each mapped to what G11/G12/G13 actually require.

**No application, configuration or test file changed.** `api/news.js`, `api/news/hazard.js`,
`index.html`, `vercel.json`, `package.json` and everything under `test/` are byte-identical to
`54e9248`, verified by object hash, so Codex's clean review still stands on the code. The two commits
since are the claim and this document.

#### The part of that document most worth reading twice

A rate-limit rule carrying **only path conditions applies to every hostname on the project,
including production.** The 5-per-60 test rule therefore needs a hostname condition AND-ed with the
path group, or it throttles real users to five requests a minute — during hurricane season, on the
card people open the site for. The document leads with that, says not to skip it, and says to stop
rather than save a rule whose shape cannot be confirmed.

The final rule deliberately has **no** hostname condition, because G11 requires it to cover both
representations wherever served.

#### One thing the test will settle that no agent has measured

`/api/news` is CDN-cached, so most burst requests never reach the Function. If `429`s appear anyway,
the firewall counts **requests at the edge** rather than invocations — the stronger result, and the
one G1 needs, since the demonstrated vector was cheap cache-missing traffic. If cached requests
instead sail through, that is a real limitation of this defense.

**The procedure explicitly says not to assume the first outcome** and to record the statuses
actually observed. It would be easy to write this up as a success either way, which is exactly why
it is called out before the evidence is gathered rather than after.

#### Still owner-only

Publishing the rule, accepting the metered-pricing acknowledgement and generating the test traffic.
No agent has touched Vercel project settings and none will.

### 2026-09-27 — PR #26 round two: two corrections and a final-head smoke

Codex re-reviewed `dd2fb75`, closed all five round-one findings, and returned two corrections plus
an evidence request. All three are done. Head is `54e9248`.

#### Correction 1 — the new G02 test could still hide a third path

The section I added to satisfy round one filtered `fetchLog` to URLs already containing
`/api/news` before asserting anything. **That is the exact hole the section exists to close:** a
stray request to `/api/headlines` would be removed by the filter before the shape count could see
it, so the client could be talking to a third endpoint with every assertion passing. It also
counted `>= 4`, which admitted extra requests a second way.

Now asserted against the complete log — exactly four requests, every entry one of the two canonical
paths, both paths present, exactly two distinct shapes. Codex asked for the filtered assertion to be
replaced rather than supplemented, and it was.

**Exact counting is sound here, not merely convenient**, and the reason is worth recording because it
is what makes `=== 4` safe rather than brittle: the log is cleared immediately above,
`setNewsFilter()` issues exactly one fetch through `fetchNews()`, and the shortest polling interval in
the page is 30s against four 60ms settles. Nothing else can enter the log. If that ever stops being
true the test fails loudly, which is the wanted behaviour rather than a hazard.

#### Correction 2 — the tally said 16 and the block held 15

Codex counted correctly and I had overstated by one. There were two ways to fix it and the cheap one
was wrong: the missing case was **real**. The API suite has always asserted the 400 refusal does not
echo the offending input, and **nothing proved that assertion could fail.** A reflection surface on an
endpoint reachable without authentication is a security property, so the case was added rather than
the number quietly reduced.

A second case went in with it. Tightening G02 introduced an exact request count and a whole-log shape
count that no mutation could break — the same decorative-assertion problem the reflection case had
just exposed, reintroduced by my own fix. The new case is the third-endpoint scenario itself, which is
the concrete form of what Codex described.

**The G1 block is now 17 — 15 API, 2 client.** Total 78.

#### Two errors of mine on the way, both caught by running it

- **`expect` is a conjunction.** The harness requires *every* listed label to fail
  (`caught.length === m.expect.length`). I added `'four toggles issued exactly four requests in
  total'` to the parameterized-client case, which that mutation does not break — four toggles still
  issue four requests, they just carry query strings — so a previously caught case reported
  **MISSED**. Scoped back to the two labels it genuinely breaks.
- **A `\n` escape became a real newline** passing through a shell heredoc into a template literal,
  leaving `mutation-check.js` unparseable. Rebuilt with the sequence constructed rather than typed.
  The same edit had also split a comment from the case it documented; both repaired.

#### Final-head preview smoke — deployment `GPo4MMbU7LS39NLquFEkiiz82ch3`, commit `54e9248`

Codex asked for a compact re-smoke against the corrected head rather than continued reliance on
`c2213b2`. Host `pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app`.

**The alias was verified to serve this head before the smoke ran**, because a branch alias pointing at
a stale deployment would invalidate everything below. The served `index.html` differs from
`HEAD:index.html` by exactly one line — Vercel's injected feedback script — and that line carries
`data-deployment-id="dpl_GPo4MMbU7LS39NLquFEkiiz82ch3"`, matching the GitHub deployment status for
`54e9248`.

```
== /api/news ==
warm attempt 1            200 MISS   age=0  n=30 hz=14 nonhz=16  2026-09-27T02:09:22.177Z
warm attempt 2            200 HIT    age=2  n=30 hz=14 nonhz=16  2026-09-27T02:09:22.177Z
fresh arbitrary variant   200 HIT    age=2  n=30 hz=14 nonhz=16  2026-09-27T02:09:22.177Z
== /api/news/hazard ==
warm attempt 1            200 MISS   age=0  n=30 hz=30 nonhz=0   2026-09-27T02:09:25.477Z
warm attempt 2            200 HIT    age=2  n=30 hz=30 nonhz=0   2026-09-27T02:09:25.477Z
fresh arbitrary variant   200 HIT    age=2  n=30 hz=30 nonhz=0   2026-09-27T02:09:25.477Z
== distinctness ==        different updated, different bodies
ALL PASSED (9 assertions)
```

Each variant key was generated per-run and had never been requested before, so a `HIT` on it is
convergence rather than a replay of an earlier probe. **Cache state is printed on every line**, which
is the standing correction to the measurement error recorded further below: a warm `HIT` returns a
stored body without invoking the Function, so a result read without its cache column is not evidence
about the handler.

Round two changed **no production code** — only `test/dom-behavior.test.js` and
`test/mutation-check.js` — so the served artifacts are byte-identical to `dd2fb75`. The smoke is still
reported against `54e9248` because that is the head Codex will merge.

#### Verification

`npm test` **306** (150 + 35 + 37 + 84), `npm run test:dom` **288** (unchanged: seven checks before,
seven after), `npm run test:mutation` **78 of 78 caught** — no MISSED, no ANCHOR LOST, no AMBIGUOUS.

#### Unchanged

G11 and G12 remain open and owner-only. No agent has touched Vercel project settings, published the
WAF rule, or accepted its pricing acknowledgement. **G1 does not close when #26 merges.**

### 2026-09-27 — PR #26 round one: five findings corrected

Codex reviewed the implementation, called the shape sound, and returned five concrete issues. All
five are corrected. **None of them were cosmetic, and two were mine ignoring a working agreement
rather than getting something wrong.**

#### Finding 1 — G02 had no client coverage

The contract requires the browser to emit only the two canonical URLs, and nothing tested it. The
API suite proved the *server* refuses a query string; no assertion proved the *client* never sends
one. Those are different claims, and only the second is G02.

DOM section 29 now toggles the filter four times through `setNewsFilter()` — the live path, which
calls `fetchNews()` — and asserts every News URL is exactly `/api/news` or `/api/news/hazard`, that
no URL carries `?`, `limit` or `hazard=`, that both representations were actually exercised, and
that **exactly two distinct shapes** exist. Repeated toggles because the failure to fear is a shape
that appears on the second switch rather than the first. A trailing slash or a stray parameter fails
the shape count even if every other assertion passes.

#### Finding 2 — the G08 abort path was asserted in a comment, not a test

An 8000 ms per-feed timeout is what stops one hung outlet from holding a Function open and billing
for it. It had no test. Added with controlled timers — `setTimeout`/`clearTimeout`/`fetch` stubbed —
asserting the timer is armed at exactly 8000 ms and that **every armed timer is cleared afterwards**.
Two mutations now cover it: lengthening the timeout, and never clearing it.

#### Finding 3 — a bare trailing `?` was allowed through

The guard exempted `/api/news?` as harmless-and-equivalent. It is not worth the exception: the
public contract says query-free, direct invocation is the surface this layer defends, and an
exception is one more shape a reader has to reason about. Every `?` is now refused — 400, `no-store`,
no echo, zero upstream. Verified: `/api/news?` returns 400.

#### Finding 4 — five documentation statements contradicted the code

Each was true when written and none was updated as the work moved: `main` recorded at `22686bb`,
"no application implementation is currently in flight", #25 shown open, Codex shown still drafting
the contract, and `?limit=30` still advertised in the API header comment. All five are gone,
verified by grep.

**This is the same current-state drift the board keeps re-learning.** A line describing "right now"
is wrong the moment the thing it describes moves, and nothing updates it unless someone looks. The
corrected paragraph now says so in place, rather than reading as though it had always been right.

#### Finding 5 — I reformatted two files I had no business reformatting

`JSON.stringify(…, null, 2)` rewrote `package.json` and `vercel.json` wholesale, burying a one-line
and a four-line change in ~90 lines of churn and **destroying the hand alignment in both**. The
working agreement says not to reformat untouched configuration; I did, and it made the diff Codex
had to review dishonest about its own size.

Restored by hand. Against `main`:

```
package.json   1 line changed   (the new test script)
vercel.json    4 lines added    (the query-delete transform on both paths)
```

The lesson is narrow and worth keeping: **a formatter is not an editing tool.** Reading a config,
mutating an object and writing it back is a whole-file rewrite wearing the costume of a small edit.

#### One defect this round introduced, caught by the harness

Collapsing the guard for finding 3 removed the `qIndex` variable an existing mutation anchored on,
and that case came back **ANCHOR LOST** — counted, but asserting nothing. Repaired to the current
line. Worth recording because a lost anchor is worse than a MISS: a MISS tells you the test is weak,
a lost anchor is silently dead while still inflating the denominator. **Fixing a guard can disarm the
mutation that was guarding it.**

#### Verification

`npm test` **306** (150 + 35 + 37 + 84), `npm run test:dom` **288**, `npm run test:mutation`
**76 of 76 caught** — no MISSED, no ANCHOR LOST, no AMBIGUOUS. *(Round two raised this to 78 of 78;
see the entry above.)* Five mutations were added with the
fixes: parameterized client restored, timeout lengthened, timer never cleared, 405 made cacheable,
bare `?` allowed through again.

No re-measurement on preview was required: every correction is origin-side or test-side, and the
G03/G17 matrix in the entry below was already gathered after the guards landed.

#### Unchanged

G11 and G12 remain open and owner-only. No agent has touched Vercel project settings, published the
WAF rule, or accepted its pricing acknowledgement. **G1 does not close when #26 merges.**

### 2026-09-27 — G1 implementation: code complete, WAF outstanding

Code, tests and preview evidence are done. **G1 is not closed**: G11 and G12 require the WAF rule to
be published from the Vercel dashboard, which only the owner can do.

#### The design changed twice, both times forced by measurement

**Design 1, an edge-selected representation header, was tried and abandoned.** Codex approved it with
a mandatory hardening: the reference states `set` "sets the key and value **if missing**", so a bare
set would leave a caller-supplied header in place and the representation would be forgeable.
Delete-then-set was therefore required. It failed anyway — the sentinel never reached the handler,
on two independent cold-MISS measurements (`af59ebf`, `0497c89`), both returning the all-headlines
body on the hazard path.

Three delivery mechanisms failed in total. **Two of them share one cause, and the third does not —
an earlier version of this entry wrongly attributed all three to it.**

The two QUERY mechanisms, `request.query set` and the `dest` querystring, are explained: the
query-delete transform removes every key, including the one routing had just supplied.

The HEADER failure is not explained by that, and cannot be: a `request.query` transform cannot
remove a request header — they are different transform types — and the configuration used separate
delete and set operations on the header. **What is established is only what was measured:** with
delete-then-set configured, the sentinel did not reach the handler on two cold-MISS measurements.
The precise cause is unresolved, and saying otherwise made a tidy story out of an open question.

**Design 2, a second thin entrypoint, passed both criteria on the first attempt.** The representation
is decided by which file the platform routes to, so there is no internal signal and the anti-forgery
question disappears rather than being solved.

#### The escape hatch Codex caught, measured rather than accepted in principle

The first working transform used `ninc: ["__canonical_none__"]`, which by construction **exempts that
key from deletion**. Measured live before it shipped:

```
?zz9=1                    HIT   updated 23:17:09.600Z   <- ordinary key converges
?__canonical_none__=1     MISS  updated 23:17:09.633Z   <- sentinel survives, own cache identity
```

It ran the Function and took its own entry — worse than the original G1 vector, because it would
have shipped behind evidence showing convergence. Replaced with `pre: ""`, which matches every key
and exempts nothing. The probe commit `c82d543` is retained as superseded history and doubles as a
positive control: a matrix that only ever shows HITs cannot distinguish "converged" from "measuring
nothing".

#### Final preview evidence — deployment `HYs5HoJysDhMuB8CrsXnAJtWH9WV`, commit `c2213b2`

Measured **after** the method and canonical-request guards landed, because those postdated the
earlier run and a query string now returns `400` at the origin where the matrix had recorded a
normalised `HIT`. A guard added to reinforce G03 could have broken it. It did not — the transform
strips the query before the origin sees it, so the canonical check only ever defends direct
invocation.

```
ALL-HEADLINES  /api/news          MISS then HIT, updated 00:36:28.057Z, n=30 hz=12 nonhz=18
  ?__canonical_none__=1           HIT  same updated   <- the closed hole
  duplicate sentinel keys         HIT  same updated
  multiple unrelated keys         HIT  same updated
  duplicate ordinary key          HIT  same updated
  empty key                       HIT  same updated
  percent-encoded key             HIT  same updated
  ?limit=99  (legacy)             HIT  same updated
  ?hazard=1  (legacy)             HIT  same updated   <- does NOT yield a hazard body
HAZARD         /api/news/hazard   MISS then HIT, updated 00:36:43.082Z, n=30 hz=30 nonhz=0
  ?__canonical_none__=1           HIT  same updated
  multiple unrelated keys         HIT  same updated
  ?hazard=0                       HIT  same updated   <- caller cannot override
DISTINCTNESS                      different updated, different bodies
G17 VALIDITY GATE                 VALID — 18 non-hazard items present
```

Both baselines are cold MISSes with fresh, distinct `updated` values, so these are genuine Function
executions rather than cached bodies.

#### A measurement error of mine, struck from the record

An earlier anti-forgery matrix was reported as passing. **It was invalid.** Request headers are not
part of the CDN cache key, so once a path is warm every request returns the stored body without
invoking the Function. I read those bodies as handler output; they were `HIT`s at age ~137s. The
harness had printed cache state on every line throughout — I stopped reading that column once the
convergence numbers looked right.

Codex's proposed remedy, `Pragma: no-cache` to force revalidation, **does not work on this preview**:
every non-baseline case still returned `HIT`. Recorded because it shapes how G12 evidence must be
gathered. It is moot for forgery, since Design 2 has nothing to forge.

#### Verification

`npm test` **290** (150 + 35 + 37 + 68), `npm run test:dom` **281**, `npm run test:mutation`
**71 of 71 caught** with no MISSED, ANCHOR LOST or AMBIGUOUS, and the pure suites pass in an empty
directory with nothing installed.

**Superseded — current numbers are in the round-two entry above: 306 / 288 / 78 of 78.** The figures
in this entry are the ones its own review was conducted against and are left as they stood.

The API suite counts **upstream attempts**, not just status codes: the property G1 cares about is how
much upstream work a caller can cause, and a refusal that still fetched five feeds would pass a
status assertion while defeating the point.

**Three mutation MISSES found defects in the tests, not the code.** The second is the one worth
remembering: fixtures produced ten items against a thirty-item cap, so filtering before or after the
cap was identical — **the single behaviour that most justifies two representations had no fixture
able to exercise it.** A bulk fixture now demonstrates it: sixty items with every hazard item older
than every ordinary one, so the newest thirty contain zero hazard items while the hazard
representation still returns all thirty. That is what a browser filtering a capped list could never
reproduce, and it is now a measurement rather than an argument in a comment.

#### Outstanding — owner only

G11 and G12 need the rule published and the pricing acknowledgement accepted. Claude has not touched
Vercel project settings and will not.

```
paths   exactly /api/news and /api/news/hazard
key     IP
window  fixed, 60 seconds
limit   100        (final, production)
action  429 / rate limit, enforcing, not log-only
test    temporary 5 per 60 seconds, PREVIEW HOSTNAME ONLY, then restored
```

Per-region counting is a documented limitation: this closes the demonstrated single-source
arbitrary-key vector and establishes a per-IP, per-region bound. It is not a distributed-attack
claim.

**For whoever gathers G12 evidence:** preview Deployment Retention is enabled, so the deployment
identifiers above will eventually 404 for anyone re-checking. The inline response records carry the
substance.


### 2026-09-26 — G1 contract review: three findings addressed

Claude reviewed PR #25 read-only and judged the contract sound and acceptable. The review added
three useful guards: the hazard representation must filter the complete merged feed pool before
the 30-item cap rather than filter a capped mixed response in the browser; the new
`/api/news/hazard` path must be proved to reach the Function instead of returning a `404` or the
SPA; and repeated live filter toggles must emit only the two exact canonical URLs.

The cache-normalization finding is resolved without weakening G03. Official Vercel documentation
places routing rules before cache lookup and supports request-query deletion, which makes a
pre-cache transform plausible, but does not explicitly guarantee the resulting cache identity.
The contract therefore distinguishes a request-query transform from an ordinary rewrite and keeps
fresh-preview convergence as the deciding evidence. If convergence fails, implementation returns
for an explicit contract amendment and owner decision. Handler rejection plus a per-IP, per-region
WAF rule would make arbitrary misses cheaper, but would not make the CDN/Function key space finite,
so that fallback is not silently treated as satisfying the original cache-normalization finding.

Acceptance now runs through G18. This remains documentation only; Claude has not claimed or begun
implementation.

### 2026-09-26 — G1 contract claimed; managed rate-limit constraint resolved

The owner approved **G1 → observation Stage 2 → Stage 3**, with Codex writing the G1 acceptance
contract and Claude implementing only after that contract is reviewed, accepted and merged. Codex
claimed `codex/g1-abuse-bounding-contract` from `main` at `22686bb`; no implementation is in flight.

Claude raised the stateful-rate-limit constraint before implementation: an in-process counter is
per instance and cannot prove a bound, while adding KV/Redis/Upstash or an SDK would violate the
dependency-free runtime rule without an explicit owner exception. Current official Vercel
documentation resolves the choice without such an exception: managed WAF rate limiting is
available on Hobby, uses fixed windows with IP or JA4 keys, and runs outside the Function. The
contract selects a fixed 60-second, 100-request, IP-keyed `429` rule covering only the two canonical
News representations.

The limitation is part of the claim, not hidden: Vercel documents counters as per region, Hobby
allows one rate-limit rule, and publishing the rule presents a pricing acknowledgement. The owner
must separately authorize that external dashboard action during implementation. Until enforcement
and canonical-cache convergence are observed on the actual project, G1 remains open.

The contract also removes caller-selected `limit`, reduces the public API to exactly two canonical
representations (all and hazard, both capped at 30), requires unknown/surplus input to converge
before cache selection or perform zero upstream work, and preserves partial-feed results, the full
Star-Advertiser user agent and the five-minute cache window. CORS explicitly earns no G1 acceptance
credit. Claude reviews this document read-only; no code, routing, test or WAF change is authorized
by this contract branch.

### 2026-09-26 — Stage 1, second review round: two findings, one of which does not reproduce

Codex's second read of PR #24 returned two findings. **One is a real defect that my own tests were
structurally unable to catch. The second is half right, and the half that is wrong is stated here
with the evidence rather than quietly fixed as though it had been.**

The first mutation rerun from last night completed at **55 of 55**, which cleared the pause note's
one pending item; the suites have since changed again for the work below.

#### Finding 1 — T11 protected the cache but not the card. Real, and mine to own.

`sourceOk()` correctly refused an older observation, but both callers then rendered the response
that had just arrived rather than the reading the cache accepted:

```
sourceOk('nwsWeather', …)            <- refuses the older observation, keeps the newer
renderWeather(data.properties, …)    <- renders the refused one anyway
```

So the cache held the newer measurement while the card displayed the older one, and the two
disagreed until some later render happened to correct it. On an emergency page that is a wrong
reading presented as current.

`sourceOk()` now returns the entry it settled on — the stored one when it accepts, the retained one
when it refuses — and both callers render from that. In the ordinary case the returned entry holds
the response that just arrived, so nothing changes; in the refused case the card keeps the
measurement that actually won.

**Why my tests missed it, which is the part worth remembering.** The T11 test called `sourceOk()`
directly, so it could only ever certify cache ordering. The defect lived one line later, in the
caller. A unit test aimed at the function cannot see a caller that ignores its result. There are now
render-boundary tests driving the real `fetchWeather()` and `fetchTides()` paths, plus mutation cases
that put the refused reading back on screen and require those tests to fail.

#### Finding 2 — half real, and the real half is worse than reported

**Confirmed, and worse than described: `observedAtFromIso()` accepted impossible calendar dates.**
The regex checked shape and then delegated to `Date.parse`, which does not reject an impossible day
— **it rolls it forward silently.** Measured:

```
2026-02-30T05:53:00Z  ->  2026-03-02   (two days later)
2026-04-31T05:53:00Z  ->  2026-05-01
2026-02-29T05:53:00Z  ->  2026-03-01   (non-leap year)
```

An impossible timestamp became a plausible one up to two days from what the source sent — strictly
worse than a rejection, because nothing on screen would look wrong. Both parsers now range-check
every component and verify the date through a shared `isRealCalendarDate()` round-trip. Real leap
days round-trip and are kept, which is asserted, because a validator that rejects 2024-02-29 would
be worse than none.

**Does not reproduce: the claim that `observedAtFromNoaaLst()` accepts `17:24:60`.** It does not.
An out-of-range second rolls the minute, and the existing round-trip compared minutes, so the value
was already rejected. Tested exhaustively rather than argued: all one hundred two-digit second
values were fed to the parser, and **exactly 00–59 were accepted, with every value 60–99 rejected.**

The fix was still made, for a reason worth stating: seconds were being validated only as a *side
effect* of the minute comparison. That is fragile — reorder or remove the minute check and the
seconds guard vanishes with no test failing. Seconds are now range-checked explicitly, and both
`60` and `99` are asserted directly.

#### Evidence

`npm test` **222** (150 + 35 + 37, up from 191 — 31 further assertions), `npm run test:dom` **281**
(up from 267 — 14 render-boundary assertions across weather and tide), and **61 of 61 mutation cases caught**, up from 55.

The first run of those 61 came back **58 of 61** with three `ANCHOR LOST` — the Honolulu-reference,
tide station-name and ISO-zone cases, every one displaced by this round's own restructuring rather
than by a behaviour change. Re-anchored, and the confirming run is the 61 of 61 above. Per Codex,
`ANCHOR LOST` is a harness failure until re-anchored and rerun even when behaviour is unchanged, so
the intermediate number is recorded rather than replaced.

**Rendering re-verified unchanged after this round**, which mattered more than usual because this
round changed what the render calls receive: the live captures produce output byte-identical to
`main` on both islands.

#### A note on the review asymmetry

Codex's shell has no Node or npm, so it cannot run any suite. Every number in this branch is
Claude's, reproduced in Claude's shell. Codex reviews by reading, which found the two defects above
and four before them — but it means **no suite result here has been independently reproduced**, and
that should be read as a limit on the evidence rather than a gap in Codex's review. Both defects it
found this round were invisible to a green suite, which is the argument for reading the code.

### 2026-09-26 — END OF NIGHT PAUSE (superseded by the entry above)

> **Superseded.** The pending 55-of-55 mutation rerun this entry waits on completed, and a second
> review round has happened since. Retained as the record of where work stopped, not as current
> state.

Work stopped mid-verification on PR #24. The implementation and its correction are committed, but
**one check was still running when work stopped and must be re-run before anything else.** The
end-of-night documentation commits do not clear that check or change the review verdict.

#### Exact state

| | |
|---|---|
| `main` | `a3f9897`, merged through #23 |
| Branch | `claude/stage1-observation-metadata`; Stage 1 implementation tip `80c9897`, followed only by the owner-authorized pause documentation |
| PR | **#24 open. Q007/Q008 stage 1. NOT merged, and not cleared to merge.** |
| Claimed | This branch only, stage 1 scope. Nothing else in flight |

```
80c9897  re-anchor the sourceOk mutation case   <- confirming run still pending
89111c7  the four review corrections
1471bad  first mutation result (50 of 50, before the corrections)
4f36e7a  stage 1 implementation
aa6b7e5  the claim, published ahead of the work
```

#### The one thing to do first on resume

**Re-run `npm run test:mutation` and confirm 55 of 55.** The last completed run was **54 of 55**
with one `ANCHOR LOST` — the T11 restructure moved `observedAt` into a local `const`, displacing
the anchor of an earlier case. `80c9897` re-anchors it, but **that run had not finished when work
stopped, so 55 of 55 is expected and unconfirmed. Do not report it as passing until it has run.**

Claude reports everything else verified: `npm test` **191** (119 + 35 + 37), `npm run test:dom`
**267**, the pure suites green in an empty directory with nothing installed, and rendering
re-checked byte-identical to `main` on both islands *after* the corrections, because `sourceOk()`
sits on a render path. Codex has not independently rerun those suites in its current shell.

#### Where the review stands

Codex returned four findings on #24; all four were real and all are corrected in `89111c7`, each with
a mutation case so the fix is load-bearing rather than asserted. Details are in the corrections entry
below. **Codex has not re-reviewed since.** Next action is Claude re-runs mutation, then Codex
re-reviews, then the owner decides the merge.

#### The finding worth carrying into stage 2

Of the four, the unzoned-ISO one matters most, and it is a lesson about Claude's testing rather than
about the code. `observedAtFromIso()` used bare `Date.parse`, which treats an ISO date-time with no
offset as **local** time — `2026-09-26T05:53:00` resolved to `15:53:00Z` on a Hawaii machine. A silent
ten-hour error on the primary weather source, in the same class as the 3.6x wind defect that produced
the two source-handling rules in the first place.

**58 new assertions did not catch it, because every fixture fed the parser well-formed NWS output.**
That is exactly the "fixtures and code sharing the same wrong premise" failure `AGENTS.md` warns
about, reproduced by the agent who had just written the record about it. Codex found it by reading
the parser instead of the tests.

**For stage 2: fixture the malformed and hostile shapes of every source field, not just the shapes
the source happens to send today.**

#### Also worth a decision, not yet claimed

**Six** mutation anchors were displaced on this branch by ordinary restructuring — the tide
`sourceOk` call, `observedAt` twice, and in the second round the Honolulu-reference, tide
station-name and ISO-zone cases. The harness behaved correctly every time; `ANCHOR LOST` is what it
should report, and Codex's ruling is that it counts as a harness failure until re-anchored and rerun
even when behaviour has not changed.

At six occurrences it is a systematic cost rather than a run of bad luck, and worth a line in the
`AGENTS.md` mutation section: **restructuring a line that a mutation case pins carries an anchor
update with it.** Two mitigations learned here are worth carrying with it — anchor on the line that
*sets* a value rather than the line that renders it, since the setter is more stable; and do not pin
a constant's value in an extraction regex, or mutating that constant breaks extraction instead of
failing an assertion.

The `.map(sourceState)` arity trap is the other candidate, for the load-bearing table: adding even an
optional parameter changes behaviour at every bare-reference callback site.

**Disposition, decided by Codex 2026-09-26:** both are carried into **stage 2 / T17**, which already
has Codex reconciling `AGENTS.md`. **Neither is to be added to PR #24.** Recorded here so the
guidance is not lost between branches.

#### Deliberately not done, and not to be started without a claim

- **Stage 2** — wiring the helpers into the cards and Source details, removing the magnitude-driven
  dot classes, and T17's orphaned-CSS plus `AGENTS.md` reconciliation. Claude's under the split, but
  needs its own claim.
- **Stage 3** — earthquake alignment.
- **G1** — still the unclaimed launch blocker. Cache-key normalisation, a restricted parameter set,
  rate limiting. **Not CORS.**
- **The nonzero mm-to-inches conversion** — still blocked on weather, needs an hour with at least
  0.01" accumulated. Not a gate on stage 1, per Codex's T16 ruling, and must not be described as
  verified.
- **Q010**, the strip at 200% zoom — closed as an owner-accepted unverified gap. Do not re-raise.

#### Resume in this order

1. Re-run `npm run test:mutation`; confirm 55 of 55 and record it.
2. Ask Codex to re-review #24.
3. Owner decides the merge. A merge to `main` is a production deploy, though stage 1 changes no
   rendering.
4. After #24 merges, claim stage 2 separately — and close out #24's own current-board entries in that
   opening claim, since a board PR cannot record its own merge.

### 2026-09-26 — Stage 1 review findings corrected

Codex returned four findings on PR #24. All four were real, all are corrected, and each now has a
mutation case so the correction is proven load-bearing rather than asserted. **No merge.**

**1. Combined state ignored island scope, loading and value usability.**
`combinedObservationState()` read `S.cache[key]` directly, so after an island switch the
**previous island's observation would decide the newly selected island's state** — the same false
attribution the request-scope guard exists to prevent, arriving by a different route.
`usableCache()` could not be reused because it answers only for STALE sources by design, so a new
`observationEntry()` applies the same island guard without the staleness condition. Two further
gaps in the same function: an outstanding first request now reports `checking` instead of
presenting an older reading as verified for a new selection, and `combinedObservationState()` takes
the reading's own usability so a missing or unconvertible value cannot ride a good timestamp to
`current` — it returns `value-unusable`. Omitting the argument still asks only about the clocks.

**2. T11 was unassigned. Stage 1 now owns it.** I had deferred the older-observation ordering rule
to stage 2 and said so, but the contract's stage list never assigned it, so it was floating between
two stages — and stage 1 is where `observedAt` is written, which makes it the only place the guard
can live honestly. `sourceOk()` now refuses to move the measurement clock backwards: an older source
observation cannot replace a newer cached one even when it arrives from the newest HTTP request.
Fetch health is still refreshed, because we did reach the source; equal timestamps refresh health and
leave the measurement untouched; and the comparison is scoped to one island, since another island's
reading is a different measurement rather than an earlier one.

**3. The ISO parser accepted unzoned and loose timestamps — a ten-hour error.** `Date.parse` treats
an ISO date-time with no offset as **local** time, so `2026-09-26T05:53:00` resolved to
`15:53:00Z` on a Hawaii machine: exactly the browser-timezone trap the NOAA parser was written to
avoid, left open on the NWS side. It also accepted loose forms like `Sep 26 2026`. An explicit zone
is now required and anything else is `unusable` rather than guessed, which is what the contract means
by a value without a usable authoritative timestamp.

**4. Three stale current-board statements**, all consequences of #23 merging and #24 opening: the
Current Work row still showed #23 open and awaiting review; the Review Queue said stage 1 was "in
progress" with "Codex reviews when opened"; and "What is next" still gated everything on settling a
contract that had already merged. Corrected, and a Current Work row added for #24.

**Evidence after the corrections:** `npm test` **191** (119 + 35 + 37, up from 164 — 27 further
assertions), `npm run test:dom` **267** unchanged, `npm run test:mutation` **55 cases** including 5
new ones covering these fixes. The T16 record below is unchanged and still accurate: the corrections
touch state selection, cache ordering and timestamp validation, none of which reaches a render path.

**Next:** Codex re-reviews. Still no merge.

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
