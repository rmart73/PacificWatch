# Pacific Watch — v2 Overview Contract

Status: **Proposal for Claude Code implementation review**
Date: 2026-09-07
Owner: ChatGPT Codex — layout and acceptance criteria; Claude Code — implementation; Codex — review.

This defines the first overview release, not the entire v2 roadmap. Read `AGENTS.md` first.
The existing source-health registry and alert-tier implementation take precedence over the
obsolete severity and freshness proposals in the original product plan and Phase 1 contract.
Record any incompatible requirement and the smallest workable alternative before implementing.

## Goal

Within roughly ten seconds, a visitor should be able to identify the selected area, the most
actionable NWS product, the number of other active products, and whether the underlying data
is current. The overview must also give a direct route to the full alerts, maps and sources.

This release answers **what the current sources report**. It does not claim to calculate
overall safety, predict impacts, or explain what changed since a previous visit.

## Scope and release boundary

Build one default Overview view from existing data and existing request lifecycles:

- NWS status, tier counts, and up to three priority alert summaries.
- Wind, one-hour rain, tide level, and the latest returned earthquake.
- Visible geographic coverage, source freshness, and routes to existing detail views.
- Consistent desktop/mobile navigation and global island context.

Do not add APIs, serverless functions, map libraries, AI calls, notification controls,
background polling, new hazard classification, historical trend storage or credentials.
No outage counts, shelter availability, volcano alert levels, Pacific threat inference,
combined operational status, Situation Brief, or unified operational map in this release.
Those require separate source and product contracts. Keep existing capabilities reachable.

The original roadmap examples showing “NORMAL OPERATIONS”, “0 significant earthquakes”,
power counts and volcano WATCH levels are **not implementable requirements for this slice**.
A successful news fetch or absence of NWS alerts cannot establish those facts.

## Dependencies and coordination

- Start implementation from up-to-date main after F005 PR #12 lands and this contract is
  reviewed. Carry forward its final URLs, captions and `noopener noreferrer` changes.
- F003 appearance is verified on production. The accepted reduced-motion and hosting
  decisions remain accepted; this contract does not reopen them.
- Q006 board compaction is a separate documentation task after #12 lands; it is not a
  technical dependency of the overview and must not collide with an implementation claim.
- This specification changes no production code. Claude must claim the implementation branch
  and name the CSS, markup and functions being changed before editing.

## Information architecture and navigation

Use five real views on both desktop and mobile:
**Overview · Alerts · Maps · News · Settings**. Overview is the initial view.
Keep island selection in shared chrome so the chosen area remains visible on every view.

Desktop: horizontal navigation. Mobile: five labeled bottom-navigation buttons, with room
for safe-area insets. Use native buttons with an accessible current-view state; no inert
destinations, icon-only mystery controls or a “Pacific” tab without implemented content.
Settings still exposes Data Sources, Appearance, Claude API, and News Sources.

The full Alerts view keeps existing NWS detail, earthquakes, FEMA/reference resources and
the optional keyed digest. Maps and News retain their existing content. “All NWS alerts”
from Overview opens Alerts and focuses its NWS heading. “Recent earthquakes” opens the
existing earthquake section. “Source details” opens Settings at Data Sources. Back to
Overview retains island and preferences; navigation does not initiate network requests.

**Deliberate layout change for review:** the existing always-pinned desktop Alerts sidebar
becomes a full Alerts view. Do not leave that sidebar visible beside Overview as a second,
competing summary. This changes the layout behavior protected by the Architecture notes;
it does not authorize a bare `.view { display:block!important }` rule. Exactly one main
view is visible and keyboard-reachable at each breakpoint. Update the architecture prose
with the implementation, explaining the intentional replacement.

Move the current stat-bar readings into Overview's cards rather than showing them twice.
Retire the scrolling ticker only when its active-alert access is fully covered by the
shared NWS strip and full Alerts view; do not remove any source or alert detail with it.
On non-Overview views, retain a compact shared NWS status strip with scope, verification
state and a route to Alerts. Derive it from the same snapshot as Overview, not a second model.

## Layout contract

Desktop, 1024 px and wider; content centered, maximum width about 1280 px:

```text
PACIFIC WATCH                         Source status [Source details]
Hawaiʻi situational awareness        Checked times belong to each source
[Statewide / island selector]        [Overview Alerts Maps News Settings]

NWS ALERTS — SELECTED AREA
[highest-tier state / verification state]   [tier counts] [All NWS alerts]
[Current: checked age | Stale: last verified age | Checking | Unavailable]

PRIORITY NWS ALERTS (up to 3; one column, full width)
[tier | event/headline | affected areas | expiry | Official NWS alert]
[additional cards in established tier order]
[Showing 3 of N active NWS products — View all N]

[ Wind             ][ Rain, past hour ][ Tide level       ][ Latest earthquake ]
[ value + unit     ][ value + unit    ][ value + datum    ][ M + place + age   ]
[ station + health ][ station + health][ station + health ][ query scope/health]

MAPS & REFERENCES
[Open Maps]  [Open News]  [Source details]
Reference destinations and coverage remain explicit; no inferred live status.
```

At 768–1023 px use two columns for observation cards. Below 768 px use this order:

```text
PACIFIC WATCH                  [Source status]
[Selected area ▼]
NWS status + tier counts + verification age
Highest-priority card
Remaining priority cards (up to 3 total)
[View all N active NWS products]
[Wind] [Rain]
[Tide] [Latest earthquake]
[Open Maps] [Open News] [Source details]
Overview | Alerts | Maps | News | Settings
```

At 320 px or with enlarged text, observation cards may collapse to one column. Alert titles,
areas, state labels and expiry wrap; essential text is not ellipsized to fit a fixed height.
Priority alerts appear before weather cards on every breakpoint. During heavy activity,
show at most three summary cards, but never obscure the full count or route to all products.
These are wireframes defining hierarchy, not invented live incident data.

## Data and geographic coverage

| Surface | Existing source / helper | What it may claim |
|---|---|---|
| NWS summary and priority cards | `S.cache.nwsAlerts`, `alertMatchesIsland()`, `alertTier()`, `compareAlerts()` | Products matching the selected area; no synthesized overall safety |
| Wind and rain | `nwsWeather` cache, existing observation conversions | A named station reading, not an island-wide average |
| Tide level | `noaaTides` cache, existing station mapping | Measured water level in feet relative to MLLW, not a forecast or tsunami verdict |
| Latest earthquake | `usgsEarthquakes` cache / `EARTHQUAKE_STATIONS` | Most recent returned event in the existing M2.0+ radius query |
| Source status | `S.sourceHealth`, `sourceState()` | Fetch health, independent of hazard tier |
| Maps / references | Existing views, with F005 changes | External maps and agency resources; not locally monitored feeds |

Statewide weather/tide cards must explicitly say **Honolulu station**, not statewide
conditions. Molokaʻi uses Honolulu fallback stations today: label those as **Honolulu
reference station for Molokaʻi**. Other selections retain actual station names. Earthquake
scope is the existing center/radius query, not an administrative island boundary; display
“near [area]” and expose the radius in card metadata. Reuse current mapping values.

FEMA and News remain statewide; existing radar remains statewide and webcams remain tied
to their named volcanoes. Selecting an island must not silently relabel any of these as
island-filtered. Do not promise global filtering for sources the code does not filter.

Preserve existing island options and default Statewide behavior. Persisting island choice,
geolocation and URL routing are deferred; switching views must retain the in-session choice.

The USGS request returns at most ten events. Do not interpret that length as a complete
24-hour event count or call zero results “no significant earthquakes”. An empty successful
result may say **“No M2.0+ events returned for this area”**, with query scope and check age.
Do not invent a time window that is not explicitly established by the request.
Null magnitude stays “Magnitude not reported”; an earthquake does not imply a tsunami result.

## NWS state and priority contract

Use the same eligible feature set for the shared strip, Overview counts, priority cards and
full Alerts view: first apply existing render-time expiry handling and selected-area matching,
then sort with `compareAlerts()`. Keep `Extreme` override and urgency fallback intact.
Do not mutate the shared feature array while sorting. Count products, not unique incidents;
a watch and warning can cover overlapping areas.

Keep separate counts for warnings, watches, advisories and statements. A compact highest-tier
headline can follow the existing banner convention; the supporting counts must make the full
set discoverable. Never call all products “warnings”. Do not create a new EMERGENCY enum.

| Source state and eligible products | Required presentation |
|---|---|
| First load, no verified response | “Checking NWS alerts”; no zero count or all-clear |
| Current, any warnings | Warning treatment; correct tier counts; warning products first |
| Current, watches/advisories only | Existing amber banner treatment; exact tier labels on cards |
| Current, statements only | Neutral informational state, visible information icon, STATEMENT cards |
| Current, verified empty | “No active NWS alerts for [area]”; scoped statement, never “Normal operations” |
| Stale, retained active products | Retain eligible products and severity; conspicuous “Last verified …” beside status and counts |
| Stale, retained empty or all retained products expired | “Alert data stale”; no current-looking zero/all-clear |
| Unavailable or past stale window | “Alert status unavailable”; withdraw unusable cards/counts and offer existing NWS reference |
| Recovery | Recompute all surfaces from the successful response and remove obsolete stale treatment |

The scoped empty wording intentionally replaces the broad “All clear — [area]” banner copy
in the shared summary. Its neutral steel-blue check treatment may remain for a verified
empty NWS response. It makes no assertion about outages, flooding outside the feed, or safety.

Priority cards show tier label, source event/headline, affected-area text, and valid expiry
in HST when available. Missing/invalid expiry reads “Expiry not provided”; do not fabricate
one. Use existing official-alert URL construction through `safeUrl()`; a missing valid URL
must not create a live-looking dead link. Display the full alert source text in Alerts.
No generated evacuation instructions, action recommendations or AI summarization here.

## Freshness and rendering behavior

Use current registry thresholds, unchanged:

| Source | Fresh window | Retention limit |
|---|---|---|
| NWS Alerts | 6 minutes | 10 minutes |
| NWS Observations | 10 minutes | 30 minutes |
| NOAA Tides | 15 minutes | 45 minutes |
| USGS Earthquakes | 15 minutes | 60 minutes |
| FEMA | 6 hours | 24 hours |
| News | 15 minutes | 60 minutes |

Preserve the existing boundary semantics (age greater than threshold crosses it).
Do not copy the old Phase 1 proposal's blanket 30-minute expiry.

Every card carries Checking, Current, Stale or Unavailable in text. Stale values have
“Last verified …” and lose their verified-value dot, as today. Missing fields in a successful
observation are “Not reported”, never zero and never backfilled. Preserve sustained-wind
versus gust-only labeling and units. Show observation time separately when supplied; fetch
verification time must not be labeled as the observation time.

Keep the existing source-health aggregate rules for settled sources. During initial loading,
never show an unqualified “All data sources current”: disclose how many sources are still
checking. Source details still covers all six machine-readable feeds, including News and FEMA
even though they have no overview metric. A stale News source can coexist with current NWS
alerts; a current weather reading cannot repair unavailable NWS status.

Refreshes, view changes and island changes must render from a coherent source snapshot.
A failed source affects its own cards without destroying other valid readings. Navigation and
card actions must not refetch. The existing refresh action and five-minute network interval
remain; no second fetch path for Overview.

On island switch, immediately withdraw old island-scoped cards and show Checking for the
new area until a matching response arrives. Capture request scope when a request starts;
a late Oʻahu response must not be cached or rendered as Maui because `S.island` changed
while awaiting it. Discard superseded completions or use an equivalent request-generation
guard. The existing `sourceOk()` stamps current `S.island`; merely reusing it is insufficient
for overlapping island requests. This narrow correctness guard belongs in implementation.

A UI-only age tick (at most once per minute) may re-evaluate freshness and expiry without
network calls. Re-evaluate on returning to a visible document and on navigation as well.
All alert surfaces must withdraw expired/unusable items consistently. The tick must not
reset verification timestamps, duplicate timers/listeners or keep a stale card looking current.
Existing `usableCache()` only returns stale entries; any shared selector must handle current
matching cache entries explicitly, not accidentally treat them as unavailable.

## Accessibility, security and presentation

Preserve themes, existing palette, severity shapes, text contrast and theme-before-paint.
Use descriptive headings and native buttons/links with visible focus. Target at least 44 px
touch controls. At 200% zoom and narrow widths, no clipped primary actions, overlapping
navigation, or horizontal page scrolling. Bottom navigation must not cover the last card.
DOM reading order matches visual order; hidden views are not in the tab sequence.

A polite status announcement may report meaningful area/alert-state changes, but must not
announce the whole dashboard on every age tick. Rendering must not steal focus from a user
reading an alert or navigating controls. Existing preference toggles and optional keyed AI
flows remain operable; Overview works completely without an API key.

Escape all external text; validate external URLs; keep `rel="noopener noreferrer"` for
new-tab links. Prefer delegated listeners over new inline handlers. No CSP loosening,
runtime dependencies or new third-party origins. The accepted motion decision is unchanged.

## Acceptance criteria

Claude's implementation PR must identify evidence for each criterion; a test count alone is
not evidence. Use controlled fixtures for behavior and browser screenshots for layout.

| ID | Scenario / required result | Evidence |
|---|---|---|
| O01 | Overview is default; all five views work on desktop/mobile; one main view is visible and focusable | DOM + browser |
| O02 | 18 warnings, 2 watches, 2 advisories and a statement yield exact counts; priority is top 3 by existing order; all products accessible | DOM fixture |
| O03 | Statement-only response stays informational with a visible icon, never all-clear | DOM + browser |
| O04 | Successful empty NWS response uses scoped empty copy; first load never shows verified zero | DOM |
| O05 | Failure after active alerts retains them with age within 10 minutes; failure after empty response never shows all-clear | Controlled time/network |
| O06 | Advancing past retention or product expiry withdraws unusable content from overview, strip and Alerts without extra fetches; recovery restores coherent state | Controlled clock + request count |
| O07 | Rain null differs from measured zero; gust-only wind is labeled; tide carries ft/MLLW; source and observation times are not conflated | DOM fixtures |
| O08 | Statewide and Molokaʻi display the Honolulu reference limitation; other station names and quake radius match configuration | DOM |
| O09 | Switch islands with requests in flight and resolve the old one last: no old values, health success or cache data is assigned to the new area | Deferred-response test |
| O10 | Partial failures affect appropriate cards; all-six source details and Checking counts remain truthful | DOM fixtures |
| O11 | Zero/ten USGS results do not become an unqualified complete count or tsunami assessment; missing magnitude stays unknown | DOM |
| O12 | All alert/detail/source/map/news actions work with correct scope and focus; navigation adds zero network calls | DOM + browser |
| O13 | Malicious headline/area text stays inert; unsafe source URLs cannot execute; new-tab links retain both rel values | Focused security fixtures |
| O14 | Light/dark/system, 320/390/768/1280 px widths and 200% zoom remain readable; long titles and high counts fit; keyboard traverses only active controls | Browser screenshots/checklist |
| O15 | Existing pure-logic and DOM suites pass, inline JS parses, production remains dependency-free; F003 filter behavior and existing detail views still work | Existing suites + smoke pass |
| O16 | Unkeyed visitor gets a complete overview; no requests for new sources, AI, or health-only polling; source interval unchanged | Network inspection |

A browser pass is required for the changed overview, navigation and priority cards before
merge. If preview authentication blocks an agent, record the exact unchecked criteria and
use an accessible local rendering or the user's preview check; do not claim DOM tests prove
appearance. Existing F005 browser gaps remain on their own record, not silently closed here.

## Suggested implementation sequence

1. Review the contract against current main; record accepted changes or alternatives.
2. Claim implementation and establish a shared data selector for existing summary surfaces;
   add controlled island-request and freshness fixtures before changing layout.
3. Add Overview markup and renderers, then replace the pinned-sidebar layout and wire all
   navigation/focus actions. Keep existing detail content and IDs where practical.
4. Add scoped station/earthquake labels and UI-only expiry updates.
5. Run the acceptance scenarios and visual checks; update affected architecture documentation.
6. Open implementation PR for Codex review with named touched regions and evidence by ID.

## Requested Claude review

Please specifically challenge:
- Replacing the pinned desktop rail with a dedicated Alerts view and shared compact strip.
- Whether three priority cards give enough urgency without displacing observations on mobile.
- The smallest safe shared snapshot and request-generation guard given the current cache API.
- A single non-network age tick that keeps all existing alert surfaces consistent.
- Coverage labeling and any action here that the existing data cannot honestly support.

The exact helper names and CSS are implementation choices. Changes to scope, safety semantics,
navigation hierarchy or acceptance requirements belong in the contract review, not silent
implementation deviations. Once reviewed, Claude owns implementation; Codex reviews it.
