# Pacific Watch — Observation Truthfulness Contract

Status: **proposed for review**. This document settles Q007 and Q008 before implementation.
It governs the four Overview observation cards: wind, rain, tide and latest earthquake.

## Purpose

The interface currently mixes two different claims:

- whether Pacific Watch successfully reached a source; and
- whether the measurement displayed by that source is recent enough to rely on.

A successful fetch can return an old observation. Re-fetching that old observation every five
minutes must not make it look newly observed. This contract separates the clocks, defines the dot,
and makes missing or old measurements explicit without inventing local hazard tiers.

## Decisions

1. **An observation-card dot communicates verification and usability, not hazard severity.**
   `ok` means the displayed claim was successfully obtained, is usable and is inside its
   source-specific observation-age window. `unknown` means at least one of those conditions is not
   met. Observation dots do not use `warn` or `alert`.
2. **Magnitude remains visible as data, not as an advisory.** Wind, gust, rainfall, tide height and
   earthquake magnitude remain explicit. Existing earthquake magnitude badges may remain because
   they label the magnitude shown; they do not turn the verification dot into a hazard tier.
3. **Fetch health and observation age are separate clocks.** `lastAttempt` and `lastSuccess` keep
   their present network-verification meaning. Point-in-time measurements additionally carry
   `observedAt`. Neither clock may overwrite or masquerade as the other.
4. **Weather and tide use measurement-age rules.** Earthquake results use query-verification age;
   an old event is a legitimate result of the 30-day query, not a stale sensor reading. NWS alerts,
   FEMA and News continue using their existing fetch-health rules.
5. **A value without a usable authoritative timestamp is not a usable point-in-time reading.** It
   is withheld with an `unknown` dot. The app does not substitute fetch time, render time or the
   client clock for a missing or invalid source timestamp.

## The two clocks

| Clock | Meaning | Stored as | May be refreshed by |
|---|---|---|---|
| Fetch verification | Pacific Watch successfully received and validated a response | Existing `lastSuccess` | A successful fetch only |
| Observation time | The source says this measurement was observed at this instant | `observedAt` beside the cached source data | A newer valid source observation only |

`ageTick()`, navigation, rendering and island changes may recompute presentation from these clocks.
They must never advance either clock. A successful response containing the same source observation
may advance `lastSuccess`; it must retain the source's unchanged `observedAt`.

## Observation-age policy

The boundary rule matches existing source-health behavior: age **greater than** a limit crosses the
boundary. Exact equality remains in the younger state.

Allow at most five minutes of positive clock skew between a source timestamp and the client clock.
Within that tolerance, measurement age is treated as zero; farther into the future is invalid and
the point-in-time value is withheld. This tolerance handles ordinary clock disagreement without
letting a malformed future timestamp look current indefinitely.

| Reading | Current through | Retain as stale through | Basis |
|---|---:|---:|---|
| NWS weather observation (wind and rain) | 75 minutes | 180 minutes | NWS describes METAR as hourly and valid for one hour; its retrieval guidance allows 10–15 minutes for processing. The 180-minute retention limit is a project safety margin covering two additional missed hourly cycles, not an NWS hazard threshold. |
| NOAA CO-OPS water level | 18 minutes | 60 minutes | `water_level` is a 6-minute product and `date=latest` is defined as the last point available within 18 minutes. The 60-minute retention limit is a project safety margin, not a NOAA validity statement. |
| USGS earthquake query | Existing fetch-health limits | Existing 60-minute cache retention | Event time describes when the earthquake occurred inside the 30-day query window. It remains visible as content age and does not make a successfully refreshed query stale. |

The source bases are the official [NWS METAR explanation](https://www.weather.gov/asos/METAR.html),
[NWS retrieval guidance](https://www.weather.gov/tg/datahelp), and
[NOAA CO-OPS Data API documentation](https://api.tidesandcurrents.noaa.gov/api/dev).

These limits govern whether a measurement can carry an `ok` dot. They do not create a weather
advisory, change NWS alert tiers or imply safety.

## Card contract

### Wind and rain

- Both fields inherit the NWS response `properties.timestamp` as `observedAt`.
- A valid timestamp is parsed from the source's ISO timestamp and rendered in HST as the observation
  time. Fetch verification is separately available as “checked” or “last verified” copy.
- Wind and rain are evaluated independently for missing values. A valid wind must not make missing
  precipitation look measured, and measured rain must not repair missing wind.
- A measured zero is a valid value. `null`, an unrecognised unit or a failed conversion is
  “Not reported,” never zero.
- Sustained wind remains primary when present; gust stays explicit. A gust-only reading remains
  labelled “Gust, sustained N/A.” The same usable observation gets the same dot regardless of
  whether sustained wind, gust or both are present.
- `>20`, `>35`, `>0` and `>0.5` must not control observation dots. Raw measurements do not
  manufacture watches, warnings or advisories.

### Tide

- Preserve both `latest.v` and NOAA's `latest.t` in the cache. The rendered card includes the
  observation time as well as `ft MLLW` and the qualified station label.
- Normalize `latest.t` deterministically. The current request asks for `time_zone=lst_ldt`; every
  configured station is in Hawaii, so the implementation must interpret that timestamp as HST
  rather than as the browser's local timezone. Changing the request to an explicitly zoned form is
  acceptable if the raw NOAA `t` value and normalized instant remain traceable in tests.
- A missing, invalid or future-skewed timestamp makes the tide reading unusable. Do not show the
  height with fetch time presented as its observation time.
- Retained stale tide keeps the value, datum, station limitation and observation time together.

### Earthquake

- A successful empty query is a verified scoped statement: no returned M2.0+ events inside the
  configured radius and 30-day query window. It may carry an `ok` dot while current.
- A returned event renders its own USGS event time. Its age is content, not source-health age.
- A missing magnitude remains “M unknown.” Because the primary metric is unavailable, the card dot
  is `unknown` even though place and event time may still be shown.
- Fetch failure, expired retained results or an unusable event time produces `unknown`; the app
  must not substitute the fetch time as the event time.
- Existing query-limit and radius disclosures remain unchanged.

## Presentation matrix

| Fetch state | Measurement state | Required card presentation |
|---|---|---|
| Initial/checking | None | Withdraw prior island value; “Checking [area]…”; `unknown` dot |
| Current | Current usable measurement | Show value, source/station and observation time; `ok` dot |
| Current | Missing/invalid value | “Not reported”; `unknown` dot |
| Current | Missing/invalid observation time | Withhold point-in-time value; “Observation time unavailable”; `unknown` dot |
| Current | Observation older than current limit but inside retention | Keep value; label “Observation stale” with observation age/time; `unknown` dot |
| Current | Observation past retention | Withdraw value; “Latest observation too old”; `unknown` dot |
| Stale fetch with retained measurement still inside measurement retention | Retained | Keep value; show observation time and “Last verified …”; `unknown` dot |
| Unavailable fetch or either retention limit exceeded | Unusable | Withdraw value; source-specific unavailable copy; `unknown` dot |
| Recovery | Recomputed | Use the new response's fetch and observation clocks; remove obsolete stale copy |

For retained data, the effective retention limit is the earlier of the fetch-health limit and the
measurement-age limit. A fresh network response never revives an observation already past its
measurement retention limit.

## Source-details contract

The existing source-health registry remains the network-health authority; do not globally redefine
`sourceState()` around observation timestamps. For NWS Observations and NOAA Tides, Source details
must additionally expose the measurement state so “Current” cannot stand alone beside an old
reading. Acceptable wording includes:

- `Feed current · latest observation 12 min ago`
- `Feed current · observation stale (82 min old)`
- `Feed current · latest observation time unavailable`
- `Feed stale · last verified 14 min ago · observation 20 min old`

The row's visible dot/state must use the combined presentation state. For NWS Observations it is
`ok` only when the fetch and observation timestamp are current and at least one configured weather
field is usable; a missing sibling field remains explicit on its own card rather than declaring the
whole feed unavailable. For NOAA Tides, the timestamp and height must both be usable. Text must
preserve both clocks rather than collapsing them into a single ambiguous “age.”

## State and cache requirements

- Store normalized `observedAt` with the island-scoped cached weather and tide data. Retained data
  must keep the timestamp captured with that exact reading.
- Preserve the request-generation and island-scope guards. A late response cannot update cache,
  fetch health, `observedAt` or rendered content for the newly selected island.
- A response older than the cached observation must not replace the newer cached reading, even if
  it arrived from the newest HTTP request. Equal observation timestamps may refresh fetch health
  without changing the measurement clock.
- No synthetic timestamp may be created with `Date.now()` for a source observation.
- Rendering external timestamps and labels follows the existing escaping rules; timestamp parsing
  must reject invalid values rather than echoing raw markup.

## Accessibility and wording

- Shape remains the non-color channel: `ok` is the filled steel-blue circle and `unknown` is the
  hollow ring. Observation cards no longer use the warning/alert triangles.
- Every state is also stated in text. The 6px dot is supplementary, never the only disclosure.
- Use “observation” for source measurement time and “checked” or “verified” for fetch time.
- Do not use “safe,” “normal,” “all clear,” “warning” or “advisory” based on raw observation values.
- Preserve station, island-reference, datum, radius, gust-only and query-limit disclosures.

## Implementation boundaries

Implementation may be staged only along these reviewable boundaries:

1. **Observation metadata and pure state selection:** add `observedAt`, parsing and combined-state
   helpers with controlled-time tests; no visual threshold behavior remains.
2. **Weather and tide rendering:** wire the helpers into cards and Source details, retain NOAA `t`,
   and remove magnitude-driven observation-dot classes.
3. **Earthquake alignment and full regression:** enforce the missing-magnitude/time rules and run
   the cross-source, island-race, age-tick and browser checks.

One PR is also acceptable. No stage may temporarily label old or untimestamped data `ok`. Each
implementation PR requires its own claim and must name the functions and markup regions touched.

## Acceptance criteria

| ID | Scenario and required result | Evidence |
|---|---|---|
| T01 | Current 0, 22 and 40 mph wind fixtures all use `ok`; magnitude never changes the observation dot | DOM fixture + mutation removing the old thresholds |
| T02 | Sustained+gust and gust-only forms retain explicit labels and identical verification semantics | DOM fixtures |
| T03 | Current 0, 0.01 and 1.00 inch rain fixtures all use `ok`; null and unknown units read “Not reported” with `unknown` | DOM fixtures + independent conversion expectations |
| T04 | A successful fetch returning a 76-minute weather observation is visibly stale despite a seconds-old `lastSuccess`; 75 minutes remains current | Controlled clock |
| T05 | Weather older than 180 minutes is withdrawn even when the endpoint fetch succeeds | Controlled clock |
| T06 | Tide retains and renders NOAA `t` in HST; 18 minutes remains current, 19 is stale, and over 60 is withdrawn | Raw NOAA-shaped fixtures + controlled clock |
| T07 | Missing, invalid and future-skewed weather/tide timestamps never borrow fetch or render time and never carry `ok` | DOM fixtures |
| T08 | A failed refresh keeps retained data only while both fetch and measurement retention permit; copy shows both observation and verification ages | Controlled network/time |
| T09 | `ageTick()` crosses measurement boundaries and re-renders without fetching or changing `lastSuccess`/`observedAt` | Timer invocation + fetch counter |
| T10 | Island A resolves after island B: A cannot change B's cache, health, `observedAt` or cards | Deferred-response test |
| T11 | An older source observation arriving from a newer request cannot replace a newer cached observation | Deferred-response test |
| T12 | Empty USGS query is verified; a returned event with missing magnitude has `unknown`; event age is not confused with query freshness | DOM fixtures |
| T13 | Source details separately state fetch and measurement age; combined dots never call an old/missing measurement current | DOM fixtures |
| T14 | NWS alerts, FEMA and News retain existing fetch-health behavior; no global `lastSuccess` semantic change | Existing suites + focused regression |
| T15 | Every observation state has text, dot shapes remain distinguishable, and no raw value generates warning/advisory language | DOM + browser review |
| T16 | A timestamped raw-response-versus-rendered-output record covers weather and tide, including source fields, units, observation time, independently established expectation and actual display | Handoff evidence required before merge |

Boundary tests must exercise both sides and exact equality. Test expectations for conversions and
timestamps must be independently established under the two durable source-handling rules in
`AGENTS.md`; calling the app's own helper to calculate an expected result is not evidence.

## Non-goals

- Defining local wind, rain, tide or earthquake hazard thresholds.
- Changing authoritative NWS alert tiering or alert-surface behavior.
- Changing the five-minute network refresh interval.
- Adding a new data source, runtime dependency or serverless route.
- G1 abuse/cost remediation, layout refinement or the owner-accepted strip zoom gap.
