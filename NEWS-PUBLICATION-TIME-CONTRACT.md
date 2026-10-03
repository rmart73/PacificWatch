# News publication-time acceptance contract

Status: **authoritative upon merge**. This document defines the acceptance boundary for the
subsequent implementation; merging it does not itself change runtime behaviour.

## Purpose

News publication time is content metadata. It tells the reader how old a headline is; it does not
say when Pacific Watch last reached the News API and it does not determine whether a source is
healthy, whether an item is hazardous, or whether an item remains visible.

The current renderer already does the right thing for a missing, `null`, `undefined` or empty
`published` value: its truthiness guard omits the age. Two live defects remain for truthy input:

- an unparseable value reaches `timeAgo(NaN)` and renders `NaNd ago`;
- a materially future value is rounded to a negative age and renders the plausible but false
  `just now`.

This contract fixes those two cases without changing the global `timeAgo()` helper or the
earthquake-specific rules settled in T12. The News API already normalizes valid feed dates with
`Date.prototype.toISOString()` and emits `null` for an invalid date. The client boundary therefore
accepts the API's canonical output rather than guessing at additional date formats.

## Decisions

### 1. Accepted input is canonical UTC ISO output

A usable News publication time is a string in the exact ordinary form emitted by
`Date.prototype.toISOString()`:

```text
YYYY-MM-DDTHH:mm:ss.sssZ
```

The client validates both the shape and a parse/round-trip equality. That rejects missing zones,
offset variants, loose English dates, impossible calendar dates, trailing text and normalization
that silently changes the supplied value. The server remains responsible for converting valid RSS
date formats into this canonical representation.

The validator never substitutes fetch time, render time or the current clock for a missing or bad
publication time.

### 2. Five minutes of positive clock skew is tolerated

News gets its own named five-minute skew allowance. It must not borrow an observation-age limit or
make publication time an observation clock.

- a timestamp at or before `now + 5 minutes` is usable;
- exact equality at `now + 5 minutes` stays usable and formats through the existing relative-time
  copy (currently `just now`);
- one millisecond beyond the allowance is unusable;
- a materially future timestamp has no displayed age. It must never become `just now` by clamping
  or substitution.

Tests inject `now`; elapsed wall time must not decide either boundary assertion.

### 3. Unusable publication time withholds only the age

For missing, empty, non-string, malformed, impossible or too-far-future input, the article remains
visible. Its source, title, optional summary, link and hazard tag are unchanged. The age and its
preceding ` · ` separator are omitted together, so no dangling punctuation or invented fallback is
shown.

The UI does **not** add `Publication time unavailable`. A headline remains useful without an age,
and omission is the existing behavior for absent timestamps. This is different from the earthquake
contract, where a magnitude is withheld when its event time is unusable because those two values
describe one point-in-time event.

### 4. Publication age is not source freshness

The News source-health state continues to derive from the fetch lifecycle and `lastSuccess`. A
headline may be days old in a successfully refreshed response without making the News source stale.
Conversely, a current-looking publication time cannot make a failed or stale fetch healthy.

Publication-time validation must not change:

- source-health dots, stale retention or the `news-updated` fetch stamp;
- item sorting, source filtering, hazard classification, the two canonical representations or the
  30-item cap;
- cache identity, cache headers, WAF behavior or upstream fan-out;
- the existing escaping and safe-link boundary.

### 5. The implementation boundary is News-specific

Implementation adds a pure News-specific validator near the News renderer and calls it before
`timeAgo()`. The shared `timeAgo()` function and the earthquake-local `quakeEventAge()` behavior
remain unchanged. This prevents a narrow News correction from silently changing T12 or any future
caller of the shared formatter.

`ageTick()` does not render News today. This work does not add News to that observation-health tick
or introduce a new timer. Ages update when News renders through its existing fetch, filter and
cached-render paths.

## Presentation matrix

| `published` input | Article | Age text |
|---|---|---|
| canonical past UTC ISO string | retained | existing `just now` / minutes / hours / days copy |
| canonical string at exactly `now + 5 min` | retained | existing formatter output (`just now`) |
| canonical string beyond `now + 5 min` | retained | omitted |
| missing, `null`, `undefined` or empty string | retained | omitted, matching current behavior |
| non-string, malformed, zone-less, offset-form, impossible or non-canonical string | retained | omitted |

## Acceptance criteria

| ID | Required result | Evidence before implementation merge |
|---|---|---|
| N01 | One pure News-specific validator is the only new decision point for publication-time usability. | Source inspection and extraction-based pure tests. |
| N02 | Only exact canonical `YYYY-MM-DDTHH:mm:ss.sssZ` values that parse and round-trip unchanged are accepted. | Fixtures for canonical input plus missing zone, numeric offset, loose date text, impossible date, trailing text and non-string values. |
| N03 | Missing, `null`, `undefined` and empty publication values keep the article and omit the age, preserving existing behavior. | DOM fixtures through the real `renderNews()` path. |
| N04 | Truthy malformed values keep the article and omit the age; `NaNd ago`, `Invalid Date` and equivalent invented copy are absent. | DOM fixtures and a mutation that bypasses validation and restores the current `NaNd ago` defect. |
| N05 | Exact `now + 5 min` is accepted; `now + 5 min + 1 ms` is rejected. | Controlled-clock pure tests whose expected values are independent of the app helper. |
| N06 | A materially future value keeps the article but shows no age and never `just now`. | DOM fixture plus a mutation that removes the future guard. |
| N07 | Valid past values retain the existing relative-time wording and rounding behavior. | Boundary fixtures covering `just now`, minutes, hours and days without deriving expectations from `timeAgo()`. |
| N08 | Withholding an age also withholds its separator; no dangling ` · ` appears beside the source. | DOM assertions against the complete source-tag text. |
| N09 | With an unusable time, source, title, optional summary, safe link and hazard tag remain rendered. | DOM fixture asserting each retained field, including one hazardous item. |
| N10 | Publication time does not affect sorting, source filters, hazard classification, item visibility, the whole-pool-before-cap rule or either canonical API representation. | Existing News/API suites plus focused regression assertions where needed. |
| N11 | Publication time does not affect fetch-health state, stale retention or the `news-updated` fetch stamp. | DOM state assertions using old and unusable article times under current and stale fetch states. |
| N12 | `timeAgo()`, `quakeEventAge()` and the Stage 3 earthquake surfaces keep their existing behavior. | Source diff and the full earthquake DOM suite; no global formatter rewrite. |
| N13 | External title, source, summary and link values retain the existing `esc()` / `safeUrl()` protections. | Source inspection and existing adversarial DOM assertions. |
| N14 | Every new assertion is shown load-bearing by mutation in both directions: invalid input cannot regain an age, and valid input cannot be suppressed silently. | Mutation run with every case caught and zero `ANCHOR LOST` / `AMBIGUOUS`. |
| N15 | Runtime remains dependency-free; `npm test`, `test:dom` and `test:mutation` pass, and pure suites run from the project files without installed runtime packages. | Exact counts, clean-directory run and package diff. |
| N16 | Preview evidence shows live valid publication ages still render and News layout, links, source filters and hazard tags remain usable. Invalid cases are established by deterministic fixtures because the live API cannot be made to emit them safely. | Preview record before merge; production HTML and all three endpoints verified separately after an owner-approved merge. |

## Required mutation lessons

The implementation inherits the durable testing rules already in `AGENTS.md`:

- anchor extraction on the line that sets a value rather than a distant render call;
- do not pin a constant's value inside an extraction regex;
- adding even an optional parameter changes every bare-reference callback site;
- a caught-count is insufficient unless the run also reports zero `ANCHOR LOST` and zero
  `AMBIGUOUS`, especially after changing a render path.

## Non-goals

This contract does not change RSS parsing in `api/news.js`, the global `timeAgo()` formatter,
earthquake time semantics, hazard classification, the distinction between active hazards and their
aftermath, News layout, refresh intervals, canonical routing, caching, WAF configuration or any
other open board-maintenance item.
