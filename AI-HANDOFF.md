# Pacific Watch — AI Handoff

Read `AGENTS.md` before acting on anything in this file.

This file tracks active collaboration between **Claude Code** and **ChatGPT Codex**.
It is intentionally lightweight and is **not** authoritative architecture documentation.
Durable technical decisions belong in `AGENTS.md`.

---

## Current Work

### Phase 0 — Trust Corrections

**Status:** Not started

**Goal:** Remove misleading all-clear semantics and make degraded source states explicit before the v2 visual redesign begins.

**Items:**
- Remove the unverified PTWC / tsunami all-clear language until it is backed by a qualified live source.
- Ensure an NWS fetch failure never uses `is-ok` styling.
- Reserve `ALL CLEAR` / `NO ACTIVE HAZARDS` for successfully verified authoritative hazard data.
- Change earthquake empty states to describe “no matching events,” not all-clear.
- Change hazard-news empty states to “no matching headlines,” not all-clear.
- Ensure missing weather observations do not retain an OK status indicator.

---

## Active Branches

| Agent | Branch | Work | Status |
|---|---|---|---|
| Claude Code | `claude/multi-agent-setup` | Multi-agent collaboration setup | Ready for review |
| ChatGPT Codex | — | — | — |

---

## Open Questions

### Q001 — Tsunami status source

**Raised by:** ChatGPT Codex

**Context:** The current UI asserts that no tsunami warnings are in effect, but the repository does not currently query a PTWC/tsunami status feed.

**Question:** What authoritative machine-readable source should Pacific Watch qualify before displaying live tsunami status?

**Recommendation:** Remove the live all-clear assertion for now and use an official link-out until a source is qualified for authority, format, CORS, reliability, and failure behavior.

**Decision:** Pending

---

## Review Queue

| PR | Author | Review requested from | Purpose |
|---|---|---|---|
| — | — | — | — |

---

## Handoff Log

Newest entries first.

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
- Pending

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
