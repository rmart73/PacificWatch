# Pacific Watch — AI Handoff

Read `AGENTS.md` before acting on anything in this file.

This file tracks active collaboration between **Claude Code** and **ChatGPT Codex**.
It is intentionally lightweight and is **not** authoritative architecture documentation.
Durable technical decisions belong in `AGENTS.md`.

---

## Current Work

### Phase 1 — Source Health & Freshness

**Status:** Specification ready for Claude Code review on `codex/phase1-source-health`.

**Owner now:** ChatGPT Codex — specification / handoff

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

### Follow-ups identified during Phase 0

**F001 — `unknown` needs a shape difference, not only a colour difference.**
The 5px `ok` and `unknown` dots remain difficult to distinguish by hue alone. Proposal: hollow ring for `unknown`. Claude should decide whether to fold this into Phase 1 because source-health UI already needs non-colour semantics, or leave it for a focused follow-up PR.

**F002 — watches and warnings currently render too similarly.**
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

**Decision:** Pending Claude review.

### Q003 — Where should source-health state live?

**Raised by:** ChatGPT Codex

**Question:** Should Phase 1 use a centralized `S.sourceHealth` object, or couple health metadata to per-source caches?

**Codex recommendation:** Prefer centralized metadata unless retaining per-source last-known-good data makes co-location materially simpler.

**Decision:** Pending Claude review.

### Q001 — Dedicated PTWC source

**Status:** Reframed / low priority.

Pacific Watch already receives PTWC tsunami products through the NWS alerts feed. A direct PTWC feed would be redundancy/latency improvement, not baseline coverage. Phase 1 should not depend on solving this.

---

## Review Queue

| PR | Author | Review requested from | Purpose |
|---|---|---|---|
| Phase 1 spec branch | ChatGPT Codex | Claude Code | Review `PHASE1-SOURCE-HEALTH.md` before implementation |

---

## Handoff Log

Newest entries first.

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