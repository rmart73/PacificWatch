# Pacific Watch — Phase 1: Source Health & Freshness

Status: **Proposal for Claude Code implementation review**

This document defines the product and safety contract for Phase 1. It is intentionally implementation-aware but is not a substitute for `AGENTS.md`. If this proposal conflicts with the current codebase, Claude Code should document the conflict and propose the smallest compatible alternative before implementation.

## Goal

Pacific Watch must tell the user not only **what the latest data says**, but also **whether that data is current and when it was last successfully verified**.

A failed refresh must not erase useful last-known-good information, silently leave old data looking current, or turn a previously verified all-clear into an implied current all-clear.

## Scope

Phase 1 applies to machine-readable sources Pacific Watch actually fetches:

- NWS Alerts
- NWS Observations / Weather
- NOAA CO-OPS Tides
- USGS Earthquakes
- FEMA Declarations
- News (`/api/news`)

Phase 1 does **not** assign health to link-outs with no data source:

- Shelter / HIEMA link
- PowerOutage.us link
- Direct PTWC link

Those remain `unknown`/reference semantics from Phase 0.

Ventusky and HVO webcam presentation can be considered separately because iframe/image load behavior is not equivalent to the JSON fetch lifecycle above.

## Core distinction

Phase 0 status semantics remain intact:

- `ok` = a source was successfully checked and the value/condition is normal
- `warn` / `alert` = a successfully checked source reports a notable condition
- `unknown` = no current verified value/condition is available
- `REFERENCE` = authoritative link-out; no live status claim

Phase 1 adds **freshness/health**, which is orthogonal:

- `loading` = first attempt has not completed
- `current` = most recent attempt succeeded
- `stale` = the latest attempt failed, but last-known-good data exists and is still being shown
- `unavailable` = no usable last-known-good data exists, or retained data has aged beyond the allowed stale window

Do not encode freshness by reusing hazard colors. A Severe warning can be stale. A normal tide reading can be current. These are separate dimensions.

## Proposed source-health state

The exact structure may change if Claude finds a cleaner fit, but the minimum information required per source is:

```js
{
  status: 'loading' | 'current' | 'stale' | 'unavailable',
  lastAttempt: null | Number,   // epoch ms
  lastSuccess: null | Number,   // epoch ms
  lastError: null | String,
  consecutiveFailures: 0
}
```

Suggested home:

```js
S.sourceHealth = {
  nwsAlerts:       {...},
  nwsWeather:      {...},
  noaaTides:       {...},
  usgsEarthquakes: {...},
  fema:            {...},
  news:            {...}
};
```

If storing the source data itself beside health metadata is cleaner, that is acceptable. The UI contract below matters more than the exact object shape.

## Transition rules

### Initial load

Before a source's first request completes:

`loading`

Do not render this as `ok`.

### Successful request

On a valid successful response:

- `status = current`
- `lastAttempt = now`
- `lastSuccess = now`
- `lastError = null`
- `consecutiveFailures = 0`
- replace that source's cached data with the new good result

A successful HTTP response with structurally unusable data should count as a failure, not a success.

### Failed request when previous good data exists

On timeout, network failure, HTTP error, parse failure, or invalid response:

- `lastAttempt = now`
- increment `consecutiveFailures`
- preserve `lastSuccess`
- preserve the last-known-good data
- `status = stale` while retained data is within the allowed stale window

The user should see the retained data **and its age**, clearly marked as stale.

### Failed request with no previous good data

If no successful data exists for that source in the current page session/cache:

`status = unavailable`

Do not fabricate placeholder values.

### Stale expiry

Default proposal: **30 minutes after `lastSuccess`**.

After that point, stale retained data should no longer be treated as operationally usable and the source becomes `unavailable`.

This default is intentionally conservative relative to the existing 5-minute refresh interval. Claude should challenge it if a specific source's update cadence makes another value more defensible. If thresholds become source-specific, they must be centralized and documented rather than scattered through fetch functions.

## Critical-source rule: NWS Alerts

NWS Alerts is safety-critical and drives the main hazard banner.

If the current NWS alert refresh fails:

1. **Never show a current `ALL CLEAR` merely because the previous successful fetch returned no alerts.**
2. If cached active alerts exist, keep them visible and mark the alert source stale, including `Last verified X min ago`.
3. If cached data contained no active alerts, replace the all-clear banner with a degraded/freshness message such as:

   `Alert data stale — last verified 7 min ago`

4. If there has been no successful NWS Alerts fetch, show:

   `Alert status unavailable`

5. Once a later refresh succeeds, return immediately to the verified current state.

This rule takes precedence over visual continuity. A stale all-clear is not an all-clear.

## Last-known-good behavior by source

### NWS Alerts

Retain the last successful feature set. On failure, do not clear the alerts rail before deciding whether retained data exists.

### Weather

Retain the last successful rain/wind values independently where practical. If a new observation successfully loads but a field is explicitly null, that field is `unknown` as established in Phase 0; that is different from a stale network failure.

### Tides

Retain the last successful NOAA reading during a transient fetch failure and mark freshness stale. The Phase 0 dot still describes whether a current verified value exists; Phase 1 must not make an old tide reading look newly verified.

### Earthquakes / FEMA / News

Do not replace valid rendered results immediately with `UNAVAILABLE` if the refresh fails and cached results exist. Continue showing the last successful results with stale/freshness treatment.

## UI requirements

Phase 1 should add trust information without doing the full v2 redesign.

### Per-source freshness

Where a source already has metadata/footer space, display one of:

- `Updated just now`
- `Updated 4 min ago`
- `Stale · last verified 12 min ago`
- `Unavailable · last attempt 2 min ago`

Use HST-facing display conventions already used by the app where an absolute timestamp is needed.

### Source health summary

Add one compact source-health affordance that lets a user inspect all tracked machine-readable sources. Exact placement is open to implementation review; suitable options include a small `DATA` / `SOURCE STATUS` control near the LIVE indicator or a compact section in Settings.

It must expose at least:

| Source | State | Last success |
|---|---|---|
| NWS Alerts | Current / Stale / Unavailable | age/time |
| NWS Weather | ... | ... |
| NOAA Tides | ... | ... |
| USGS Earthquakes | ... | ... |
| FEMA | ... | ... |
| News | ... | ... |

Do not label the entire application `LIVE` without any way to discover degraded source state. Phase 1 does not necessarily have to remove the existing LIVE badge, but degraded critical data must be visible enough that the badge cannot mislead.

### Shape/accessibility

Phase 0 follow-up F001 remains relevant: freshness/unknown distinctions must not rely on color alone. If Phase 1 introduces source-health icons, use text and/or shape in addition to hue.

## Error text

User-facing source errors should be calm and factual. Do not expose raw exception strings in the normal UI.

Developer diagnostics may continue to go to `console.warn()`.

Examples:

- `NWS Alerts temporarily unavailable`
- `Showing data last verified 8 min ago`
- `NOAA tide data unavailable`

## Security requirements

All existing `AGENTS.md` rendering rules still apply.

- External values -> `esc()` before interpolation into `innerHTML`
- External URLs -> `safeUrl()`
- Do not weaken CSP
- Do not add a serverless function for browser-CORS-capable sources just to implement health tracking

Health metadata such as timestamps and internal status enums are app-generated, but any source-supplied error/detail shown to users must still be treated as untrusted.

## Performance / hosting constraints

Phase 1 must not increase polling frequency. Keep the existing five-minute refresh unless a source-specific reason is documented.

Source health should be derived from requests Pacific Watch already makes, not from separate health-check requests. A health system that doubles API traffic is a regression.

## Acceptance criteria

Phase 1 is complete when all of the following are true:

1. Every tracked fetch records last attempt and last successful verification.
2. A successful fetch transitions that source to `current`.
3. A failed fetch with retained data transitions to `stale` without discarding last-known-good data.
4. A failed fetch with no retained data transitions to `unavailable`.
5. Retained stale data expires to `unavailable` after a documented threshold.
6. NWS Alerts failure can never leave or create a current-looking `ALL CLEAR`.
7. Cached active alerts remain visible during a transient NWS failure and are explicitly marked stale.
8. Weather, tide, earthquake, FEMA, and news failures do not unnecessarily destroy usable last-known-good displays.
9. Users can see freshness/last-success information for each tracked source.
10. Users can inspect an aggregate source-health view/status.
11. No new polling requests are added solely to determine health.
12. Existing Phase 0 `ok/warn/alert/unknown/reference` semantics remain correct.
13. Light, dark, and system themes remain functional.
14. Inline JavaScript parses cleanly and the Vercel preview is visually checked before merge.

## Suggested implementation sequence

Claude Code should review this ordering against implementation reality:

1. Add centralized source-health state/helpers without changing UI behavior.
2. Instrument NWS Alerts first and validate degraded-banner behavior.
3. Instrument Weather and Tides.
4. Instrument Earthquakes, FEMA, and News.
5. Add last-known-good retention where current code destroys it.
6. Add per-source freshness text.
7. Add compact aggregate source-health UI.
8. Exercise success -> failure -> recovery paths in the Vercel preview where possible.

## Requested Claude Code review

Before implementation, please specifically challenge:

- whether `30 minutes` is a sensible stale expiry for each source;
- whether the proposed health state belongs under `S.sourceHealth` or should be coupled to per-source caches;
- the smallest UI surface that communicates degradation without prematurely implementing the v2 overview;
- any fetch functions where retaining last-known-good data creates a subtle correctness issue;
- whether `F001` (hollow-ring unknown indicator) should be folded into Phase 1 because freshness already needs non-color semantics, or kept as a separate PR.

If the design is sound, Claude Code should implement on a `claude/phase1-source-health` branch and use `AI-HANDOFF.md` to report deviations, discoveries, test results, and the PR for Codex re-review.