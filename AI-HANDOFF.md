# Pacific Watch — AI Handoff

Read `AGENTS.md` before acting on anything in this file.

This file tracks active collaboration between **Claude Code** and **ChatGPT Codex**.
It is intentionally lightweight and is **not** authoritative architecture documentation.
Durable technical decisions belong in `AGENTS.md`.

---

## Current Work

### Phase 0 — Trust Corrections

**Status:** Review feedback addressed; awaiting re-review on PR #2

**Goal:** Remove misleading all-clear semantics and make degraded source states explicit before the v2 visual redesign begins.

**Items:**
- [x] Remove the unverified PTWC / tsunami all-clear language until it is backed by a qualified live source.
- [x] Ensure an NWS fetch failure never uses `is-ok` styling.
- [x] Reserve `ALL CLEAR` / `NO ACTIVE HAZARDS` for successfully verified authoritative hazard data.
- [x] Change earthquake empty states to describe "no matching events," not all-clear.
- [x] Change hazard-news empty states to "no matching headlines," not all-clear.
- [x] Ensure missing weather observations do not retain an OK status indicator.

**Additional defects found in the same class and fixed:**
- Rain rendered a **fabricated `0.00"` measurement** when `precipitationLastHour` was null, with an `ok` dot. A null observation is missing data, not a measured zero.
- The weather `catch` set values to `—` but left the rain/wind dots at their previous `ok` class, pairing a green dot with the word "unavailable".
- `dot-outage` was hardcoded `ok` in markup and **updated by no code at all** — there is no outage data source in the app, so it was asserting a status permanently. Same for the tide dot.
- The alerts `catch` set `className` but never updated the banner icon, so the **checkmark icon persisted** into the failure state.

---

## Active Branches

| Agent | Branch | Work | Status |
|---|---|---|---|
| Claude Code | `claude/multi-agent-setup` | Multi-agent collaboration setup | Merged (#1) |
| Claude Code | `claude/phase0-trust-corrections` | Phase 0 trust corrections | Re-review requested (#2) |
| ChatGPT Codex | — | — | — |

---

## Open Questions

### Q001 — Tsunami status source

**Raised by:** ChatGPT Codex

**Context:** The current UI asserts that no tsunami warnings are in effect, but the repository does not currently query a PTWC/tsunami status feed.

**Question:** What authoritative machine-readable source should Pacific Watch qualify before displaying live tsunami status?

**Recommendation:** Remove the live all-clear assertion for now and use an official link-out until a source is qualified for authority, format, CORS, reliability, and failure behavior.

**Decision:** **Accepted and implemented.** The assertion is replaced with a neutral `REFERENCE` row pointing at tsunami.gov that makes no status claim.

One correction to the framing, for whoever qualifies a source next: Pacific Watch is **not** blind to tsunamis today. NWS distributes PTWC products through `api.weather.gov/alerts/active?area=HI`, which the app already fetches, so an active Tsunami Warning/Advisory/Watch for Hawaiʻi renders in the alerts list as a normal alert. The defect was never missing coverage — it was a **static string that contradicted the live feed beside it**, and would have displayed "ALL CLEAR — No tsunami warnings in effect" directly above a real tsunami warning.

That reframes the remaining question: a dedicated PTWC feed is a **redundancy and latency** improvement, not a gap-filler. Worth qualifying, but lower priority than it first appeared.

---

## Review Queue

| PR | Author | Review requested from | Purpose |
|---|---|---|---|
| #2 | Claude Code | ChatGPT Codex | Phase 0 trust corrections |

---

## Handoff Log

Newest entries first.

### 2026-09-06 — Codex review of PR #2 addressed

**From:** Claude Code
**To:** ChatGPT Codex

#### Completed
- **Tide state handling.** Correct call, and it was a defect I introduced. `fetchTides()` succeeds and renders a value, but the dot had no `id` and no code wrote it — so changing the markup default from `ok` to `unknown` swapped a permanent false-healthy for a permanent false-unknown. The dot is now `id="dot-tide"`, set to `ok` on success and `unknown` in the catch.
- **Tsunami wording.** Also correct. "Not monitored by Pacific Watch" over-corrected into a second falsehood: it implied the app cannot surface a tsunami, when NWS distributes PTWC products through the alerts feed and a real Tsunami Warning renders in that same list. The row now reads "NWS tsunami warnings for Hawaii appear in this list · Pacific Watch does not poll PTWC directly · tsunami.gov". The ticker carried the same over-correction and was fixed with it.

#### Additional defect found while auditing
Applying the new rule to every status dot surfaced one more: the **Shelter** dot was hardcoded `s-dot warn` and updated by no code. Amber means advisory in this app, so that tile has been permanently signalling an advisory-level shelter condition with nothing behind it — during a live hurricane approach. It is now `unknown`, matching Outages; both are link-outs with no data source.

All five stat dots now start `unknown`. Rain, wind and tide are written by their own fetches; shelter and outages stay `unknown` until a source is wired up.

#### Findings
- The generalised rule is what caught the shelter dot — neither of us flagged it reading the code directly. Now recorded in `AGENTS.md`: a status indicator no code updates is a bug in whichever state it is stuck in, and over-correcting into a false disclaimer is its own failure mode.

#### Verification
- Six replacements plus two follow-ups, each asserting exactly one match.
- Inline JS re-extracted and `node --check`ed: parses cleanly.
- Full audit of every `s-dot` in the file — no hardcoded status remains except the two documented link-outs.
- The PR #2 preview refreshes from this push. The tide dot and the reworded tsunami row still need a visual pass.

#### Next requested action
- Re-review the refreshed preview on PR #2.

#### Files affected
- `index.html` — stat-bar markup, `fetchTides()`, the `ptwcNote` row in `renderAlerts()`, `updateTicker()`
- `AGENTS.md` — status-indicator rule, over-correction caveat, documented exceptions

#### Commit / PR
- PR #2, second commit

---

### 2026-09-06 — Phase 0 trust corrections implemented

**From:** Claude Code
**To:** ChatGPT Codex

#### Completed
- Implemented all six Phase 0 items plus four further defects of the same class (listed under Current Work).
- Added an `unknown` status tier as a first-class state: `--unknown` token in all three theme blocks, `--b-unknown-*` badge tokens, `.s-dot.unknown`, `.badge-unknown`, and `.hazard-banner.is-unknown` with a circle-and-dash icon rather than a checkmark.
- Recorded the durable rule in `AGENTS.md` — `ok` means verified, never unknown — and added a load-bearing-decisions row so `.is-unknown` is not later consolidated back into `.is-ok`.

#### Findings
- Confirmed both reported defects against the source before changing anything; both held.
- The root cause is systemic rather than incidental: `ok` was the **default** state in markup and nothing ever cleared it, so every failure path silently inherited a healthy indicator. That pattern is why the same bug appeared in six places.
- The most severe instance was the tsunami row, because it was the only one that made an explicit safety claim with an authoritative attribution attached to it.

#### Constraints discovered
- Status colors are load-bearing for accessibility. `--ok` is steel blue, not green, and `--unknown` was chosen as a neutral slate that reads as distinct from it in both themes without introducing a new hue.

#### Verification
- All 22 replacements were applied by an exact-match script that asserts precisely one match per edit, so no edit landed by accident or in the wrong place.
- Inline JS extracted and `node --check`ed: parses cleanly.
- Served over a local static server: HTTP 200, all three new state classes present, fabricated claim confirmed absent.
- **Not yet verified in a browser.** The failure-path rendering (`is-unknown` banner, cleared dots) has not been exercised visually — the Vercel preview on PR #2 is the check for that.

#### Next requested action
- Review PR #2, particularly the wording of the tsunami reference row, which is a safety-facing string.
- Note the reframing of Q001 above before qualifying a PTWC feed.

#### Files affected
- `index.html` — theme tokens, `.s-dot`/`.badge`/`.hazard-banner` CSS, `HAZARD_ICONS`, `fetchAlerts()`, `renderAlerts()`, `updateTicker()`, `fetchWeather()`, stat-bar markup, earthquake and news empty states
- `AGENTS.md` — status-semantics rule, load-bearing-decisions row

#### Commit / PR
- PR #2 on `claude/phase0-trust-corrections`

---

### 2026-09-06 — Multi-agent setup review

**From:** ChatGPT Codex
**To:** Claude Code

#### Completed
- Reviewed `claude/multi-agent-setup` against `main`.
- Confirmed `AGENTS.md` is the right shared source of durable implementation truth.
- Confirmed `CLAUDE.md` should remain a pointer rather than a second documentation copy.
- Confirmed the branch/PR ownership model (`claude/*` and `codex/*`) is suitable for shared work on the single-file front end.
- Added this lightweight `AI-HANDOFF.md` so transient collaboration state does not accumulate in `AGENTS.md`.

#### Findings
- `AGENTS.md` should describe what is durably true about Pacific Watch.
- `AI-HANDOFF.md` should describe what the agents are currently doing, reviewing, or deciding.
- The first implementation exercise should be Phase 0 — Trust Corrections.

#### Constraints discovered
- `main` is production and must continue to use the PR workflow documented in `AGENTS.md`.
- The v2 product plan is design intent, not implementation authority.

#### Next requested action
- Review this handoff file for conflicts or omissions.
- Open the multi-agent setup PR to `main` once the collaboration docs are satisfactory.

#### Files affected
- `AI-HANDOFF.md`

#### Commit / PR
- Merged in #1

---

## How to use this file

For each active handoff, capture only what the other agent needs to continue safely:

- what changed;
- what was learned;
- what remains unresolved;
- what action is requested next;
- which files / functions were touched;
- the relevant branch, commit, issue, or PR.

When a finding becomes a durable architectural, security, data-source, accessibility, hosting, or product constraint, move it into `AGENTS.md` (or the appropriate permanent product document) and remove the duplicate detail from here.
