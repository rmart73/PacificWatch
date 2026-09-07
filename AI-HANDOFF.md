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
| Shared snapshot / NWS strip | Claimed 2026-09-07 on claude/shared-snapshot-nws-strip | Claude implements; Codex reviews against the merged contract |
| Overview layout / navigation | Planned, not yet claimed | Claude implements; Codex reviews against contract |
| Q006 board compaction | #15 merged in b71fb74; archive verified byte-identical to the pre-compaction board | Closed |

### Active claims

**PR 2 — shared snapshot selector and NWS strip. Claude Code, claude/shared-snapshot-nws-strip.**
Claim published 2026-09-07 before editing any implementation file.

In scope:

- One shared selector producing the eligible NWS feature set — render-time expiry handling,
  selected-area matching, then `compareAlerts()` — consumed by the strip, the counts and the
  existing Alerts surfaces, without mutating the shared array while sorting.
- The strip itself: highest-tier state, separate warning/watch/advisory/statement counts,
  selected area, and freshness, across all nine source states in the contract table.
- Island-switch behaviour for the surfaces this PR touches: withdraw old island-scoped
  content and show Checking until a matching response lands, on top of the merged O09 guard.
- A UI-only age tick, at most once per minute, so freshness and expiry re-evaluate with no
  network calls. **Flagged for objection:** the contract lists this under Freshness rather
  than assigning it to a PR. It is here because a strip that shows freshness cannot report it
  honestly without one. Say so before I build it if it belongs in PR 3.

Out of scope, deferred to PR 3: Overview view, navigation, sidebar replacement, mobile
card ordering.

Two contract details I expect to be the awkward ones, recorded now rather than discovered late:
`usableCache()` returns stale entries only, so the shared selector must handle a current
matching cache entry explicitly instead of reading its absence as unavailable; and counts are
per product, not per incident, so overlapping watch/warning areas must not be deduplicated.

Q006 is complete and merged in b71fb74, so the board is no longer exclusively Codex-owned.

### Agreed next sequence

Completed: race guard (#14). Next: finish #15 → shared snapshot selector and NWS strip
→ Overview layout/navigation.
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
| Claude | claude/shared-snapshot-nws-strip | PR 2: shared snapshot selector and NWS strip |

Merged branches are omitted from this active list; this does not imply remote branch deletion.

## Review Queue

| PR / work | Review state | Next action |
|---|---|---|
| PR 2 | Claimed, not yet opened | Claude implements; PR follows on claude/shared-snapshot-nws-strip |

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
- **Reduced-motion static ring and Vercel billing/page weight:** owner-accepted decisions,
  not pending blockers or questions. Preserve AGENTS guidance; do not re-raise.
- **Q001, direct PTWC source:** low-priority redundancy/latency improvement; NWS already
  carries PTWC products. No active claim; not a prerequisite for Overview.
- **Q002–Q005:** resolved. Source-specific freshness thresholds, centralized health with
  separate scoped caches, dependency-free pure tests, and jsdom as a dev dependency are
  established in the implementation and durable documentation.
- **Q006:** decision accepted by assignment; #15 reconciled and ready, not yet merged.

## Handoff Log

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
