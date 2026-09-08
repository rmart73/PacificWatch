# Pacific Watch — Hawaii Situational Awareness

Single-file web app for real-time Hawaii emergency and weather situational awareness.
Hosted on Vercel. Worked on by two agents — Claude Code and ChatGPT Codex — see the working agreement below.


---

# Working agreement — two agents share this repo

**Claude Code** and **ChatGPT Codex** both work on Pacific Watch. This file is the shared contract;
read it before your first edit in a session. `CLAUDE.md` is a pointer to this file, not a second copy —
if you learn something durable about the project, record it **here** so both agents get it.

## Branch and PR flow

`main` auto-deploys to Vercel. **A merge to `main` is a production deploy**, so `main` is protected
and nothing lands without a pull request.

- **Claim the work in `AI-HANDOFF.md` before editing anything — including documentation.**
  Docs are not exempt. `AGENTS.md` and `AI-HANDOFF.md` are the two files both agents edit most,
  so they collide more readily than code, not less. This has now caused two near-collisions:
  Phase 1, where both agents began the same feature; and the pause-point documentation pass,
  where Codex claimed correctly and Claude edited without claiming. The claim names the agent,
  the branch, and the scope. **The claim is the concurrency lock; the PR is the review
  artifact.** Checking open PRs is not sufficient — in Phase 1 both agents began work on the
  same item at the same time and neither had opened a PR yet, so there was nothing to see.
  If the board already shows a claim overlapping your scope, coordinate in the handoff log
  instead of starting.
- **Agreed split for the v2 overview (2026-09-07):** ChatGPT Codex owns layout and acceptance
  criteria; Claude Code owns implementation; Codex reviews. This mirrors Phase 1, where the
  spec-then-implement split produced the strongest work in the project once the two stopped
  racing. Each side still records a claim before starting.
- Branch from up-to-date `main`. Prefix by agent so ownership is visible at a glance:
  `claude/<topic>` · `codex/<topic>`
- **Never commit directly to `main`.**
- Before opening a PR, search the docs for claims the change makes false. Keep durable
  constraints here and current owners, verification gaps, PR status and next actions in
  `AI-HANDOFF.md`. Implementation, merge and production verification are distinct states.
- Rebase on `main` before opening the PR; resolve conflicts on your branch, not in the merge.
- Vercel builds a **preview deployment for every PR**. Open it and confirm the change actually
  renders before requesting a merge for UI changes. There is no build step; `npm test`
  verifies pure logic and `npm run test:dom` verifies behavior, but neither proves appearance.
  For documentation-only changes, verify the diff and consistency with main and open PRs.
- Check open PRs before starting work. If another agent has an open PR touching the same region
  of `index.html`, say so in your PR description rather than racing it.

### How `main` is actually protected

A GitHub **ruleset** ("Protect main") enforces this server-side on the default branch:

- changes must go through a pull request (0 approvals required — you can merge your own)
- no force-pushes, no branch deletion
- **no bypass actors, including admins** (`can_bypass: never`)

The bypass list is deliberately empty. An admin bypass would be inherited by any agent
authenticating through the owner's account, which would make the gate meaningless for exactly
the actor it exists to constrain.

**Emergency hotfix procedure.** There is no push-to-`main` escape hatch by design. To ship fast:
open a PR and merge it immediately — with 0 required approvals that takes seconds and you still
get a preview build. If the PR flow itself is broken, disable the ruleset in
Settings → Rules, push, then re-enable it.

This repo is **public**, which is what makes rulesets free on this plan. Never commit a secret —
a server-side key belongs in a Vercel environment variable, never in the repo.

A local `pre-push` hook in this clone also blocks direct pushes to `main` with a helpful message,
so you fail fast instead of at the remote. It is not committed (`.git/hooks` never is), so it
protects only clones where it has been installed — the ruleset is the real gate.

## Coordinating edits to `index.html`

The entire front end is one ~1,930-line file, so two agents editing "different features" routinely
means editing the same file within a few dozen lines of each other. Git will merge cleanly and the
page will still be broken.

- State in the PR description **which region you touched** — CSS tokens, markup, or which JS
  functions by name.
- Prefer whole-function replacements over scattered one-line edits; they conflict more visibly
  instead of silently interleaving.
- Do not reformat, re-indent, or reorder code you aren't changing. A whitespace pass turns every
  future merge into a conflict.
- If a task genuinely needs sweeping changes across the file, open it as its own PR and land it
  alone rather than in parallel with other work.

## Load-bearing decisions — do NOT "fix" these

Each of these looks like a bug or an oversight and has been reverted or nearly reverted before.
Every one is deliberate, and the reasoning is in the section named after it.

| Looks wrong | Actually | Section |
|---|---|---|
| Key inputs are `type="text"` | `type="password"` makes browsers offer to save an Anthropic key as a site login | AI Digest |
| `decode()` runs before tag-stripping | Stripping first turns `&lt;img onerror=...&gt;` back into live markup | Security rule 4 |
| `esc(text)` then the `**bold**` transform | Reversing the order lets model output emit live HTML | Security rule 3 |
| "All clear" is steel blue, not green | The palette has no green; red/blue keeps the triad readable with red-green color blindness | Theming |
| Amber hazard banner uses ink text, not white | White on `--warn` is 2.6:1 and fails WCAG AA | Theming |
| There is no rule forcing any `.view` visible, and no `.desktop-sidebar` | The pinned Alerts rail was replaced by a full Alerts view in PR 3. Re-adding `.view{display:block!important}` in any form stacks all five views at once with no way to switch — the bug this codebase already shipped once. Exactly one view is visible at every breakpoint, and a test asserts it | Architecture |
| Star-Advertiser gets a long browser UA string | It 403s a bare `Mozilla/5.0` | News headlines |
| `.hazard-banner.is-unknown` looks like a duplicate of `.is-ok` | Merging them makes a failed NWS fetch render as an all-clear | Status semantics |
| `.hazard-banner.is-info` looks like a third duplicate of `.is-ok` | It means "active but nothing at hazard tier". Collapsing it into `is-ok` makes a live Tropical Cyclone Local Statement read as an all-clear | Architecture |
| `.s-dot.unknown` uses `box-shadow:inset` on a transparent background rather than a `background` colour | It is a hollow ring on purpose. Collapsing it to a fill reverts verification state to colour-only encoding, which is the thing F001 was raised to fix — the grey and steel-blue dots are not reliably distinguishable at 6px | Theming |
| `alertTier()` ignores CAP `severity` except for `Extreme` | Severity is `Severe` for both a Tropical Storm Warning and a Flood Watch, so a severity-first test renders a watch as a warning. That was a real defect, not a hypothetical | Alert severity model |
| `.s-dot.warn` and `.s-dot.alert` use `clip-path` triangles rather than plain circles | Shape is the distinguishing channel; hue alone is not readable at this size. Reverting to circles restores colour-only encoding | Theming |
| `NEWS_SOURCES` duplicates outlet names that also live in `api/news.js` | They are compared directly, so they must match exactly. Before this was wired up, the Settings card listed NWS/NOAA, HIEMA and GDACS/RSOE/PDC — none of which produce headlines — so three of seven toggles could never have controlled anything | News headlines |
| Island-scoped fetches call `beginRequest()` and check `requestIsCurrent()` before using their own response | A response can arrive after the user switches islands. Without the guard, `sourceOk()` stamped the cache with `S.island` at completion, filing one island's reading under another — a slow Maui observation rendered and cached as Kauaʻi's. Removing the check restores that bug silently | Architecture |
| Every alert surface renders from `nwsSnapshot()` instead of filtering its own copy | The rail and banner filtered by selected island and the ticker did not, so an island view could scroll a product it refused to list. Reintroducing a local filter re-opens that drift | Architecture |
| The staged `#nws-strip` is `hidden` and reports tiers the hazard banner omits | It is not dead markup and not a duplicate banner. It ships hidden so PR 2 adds no second visible summary; it reports every tier because the banner deliberately drops statements to keep its headline short. Unhide it only when the Overview places it | Architecture |
| `ageTick()` re-renders but never writes `lastSuccess` | Freshness is relative to that timestamp. A tick that refreshed it would make a dead source look permanently current — the page would age into confidence instead of out of it | Architecture |
| The Overview markup is in **mobile** order, and wider screens rearrange it | CSS `order` and grid placement move boxes on screen but leave the sequence a screen reader announces untouched, so the reading order the contract specifies for 390px has to be the DOM order. Reordering the markup to suit desktop would silently break it. Duplicating the cards instead would give two copies of every reading to drift apart, and both would be announced — there is exactly one `#stat-wind` in the document, and a test asserts it | Architecture |
| Unit conversion reads `unitCode` from each measurement instead of applying a fixed factor | api.weather.gov declares the unit per field and has changed it. Wind is `wmoUnit:km_h-1`; this code applied the metres-per-second factor 2.237, overstating every reading by 3.6x. On production during an active hurricane a 51.84 km/h gust rendered as **116 mph** when the station's own METAR said 28 knots — 32 mph. An unrecognised unit renders **Not reported** rather than a guess: a missing reading is recoverable, a hurricane wind speed wrong by a factor of three is not | Architecture |
| Sticky and fixed offsets use `var(--hdr-h)`/`var(--nav-h)`, never pixel literals | `.desktop-tabs` stuck at a hardcoded `top:160px`, which matched the header only at default zoom. At 200% the header is roughly twice that, so the view tabs slid underneath it (z-index 50 against the header's 100) and could not be clicked while scrolled — navigation became unreachable, not merely cramped. The same applied to `.content-spacer` against the fixed bottom nav. `syncChromeOffsets()` measures the real chrome; the CSS literals are fallbacks for before the first measurement | Architecture |
| `src-last-refresh` states a checking count instead of a time while any source is loading | The newest success across six sources reads as a completed refresh even when five have not answered. During initial load it says how many are still checking | Status semantics |
| The Alerts list renders every eligible product with no display cap | It capped at 12 while Overview offered "View all 20", so the route landed the reader on a truncated list with nothing saying so. The only cap is the eligibility filter | Architecture |
| The earthquake card is withdrawn on an island switch alongside wind, rain and tide | Its USGS query is a radius centred on the selected island, so it is island-scoped like the rest. It was missed once and showed one island's event under another's heading | Architecture |
| The strip has its own `--strip-*` colour tokens instead of reusing `--alert`/`--warn`/`--unknown` | Those are display colours for dots and badges, where the 4.5:1 text rule does not apply. As 12px text they failed WCAG AA — light watch 2.57:1, light unknown 2.54:1, dark unknown 3.90:1. The strip tokens are the same hues darkened only as far as compliance needs, so severity stays distinguishable. Repointing a strip rule at a display token fails `test/contrast.test.js` | Theming |
| Verified-empty surfaces format `snap.checkedAt`, never `new Date()` | Rendering is triggered by age ticks and navigation, not only by fetches. Formatting the current time let a page left open keep advancing the check time it claimed — reporting a fresh verification it had never made | Architecture |
| The theme script sits inline in `<head>` | Moving it lower flashes the wrong theme before first paint | Theming |

If you believe one of these is genuinely wrong, raise it in the PR description and leave the code
alone. Do not silently change it.

## Non-negotiables for new work

- **`ok` means "we checked and it is fine" — never "we do not know".** A failed fetch, a null
  observation, or a feed with no data source wired up must render as `unknown`
  (`--unknown`, `.s-dot.unknown`, `.badge-unknown`, `.hazard-banner.is-unknown`), which is
  visually distinct from `ok` and carries no checkmark. Never display a hazard all-clear that
  was not read from a source you actually queried — this is an emergency app, and a false
  all-clear is the worst output it can produce. An "all clear" is only legitimate when the
  authoritative fetch succeeded and genuinely returned nothing.
  Equally, do not over-correct into a second falsehood: a disclaimer that implies a hazard is
  unmonitored when the feed does in fact carry it is its own kind of wrong.
- **A status indicator no code updates is a bug in whichever state it is stuck in.** Every dot
  must be written by the fetch that owns it — `ok` on success, `unknown` on failure — not
  hardcoded in markup. The Shelter and Outages cells are the deliberate exceptions: both are
  link-outs with no data source in the app, so they stay `unknown` until one is wired up.
  Neither may show `ok` or `warn` — a hardcoded amber dot asserts an advisory nothing verified.
- **Production and runtime stay dependency-free.** `index.html` and `api/news.js` must keep
  running with nothing installed — that is the property that makes this app cheap to host,
  fast to load, and impossible to break with a bad transitive update, which matters more than
  usual for something people open during an emergency. `devDependencies` are permitted for
  **verification only** (currently jsdom, for `npm run test:dom`). Two hard lines: `npm test`
  must keep working with nothing installed, and a runtime `dependencies` entry is never added.
  Anything a visitor loads is written by hand or fetched from a documented source.
- **Escaping is not optional.** Everything rendered comes from an external feed and lands in
  `innerHTML`, on an origin that holds the user's Anthropic key in `localStorage`. Every
  interpolated external value goes through `esc()`; every `href` from external data goes through
  `safeUrl()`. Every new render path you add is a new XSS surface — see the Security section.
- **New data source?** Run the CORS check documented in "Live data sources" *before* designing
  around it, and add the origin to `connect-src` in `vercel.json` or the fetch fails silently.
- **Serverless functions only when CORS genuinely blocks the direct call.** `api/news.js` exists
  for that reason and is currently the only one.
- **If you build `api/digest.js`:** it must fetch NWS and build the prompt **server-side**. Never
  accept a client-supplied prompt — that turns the endpoint into a free Claude API billed to the
  owner's key. See the AI Digest section for the full constraint set.

## Roadmap

**UI promises must match behavior.** Audit controls and navigation as well as status indicators.
A filter must identify hidden results rather than imply the source has no data. A source
control must correspond to a real source and actually affect the displayed results.

**Reference links must fulfill their captions.** Prefer stable deep links to the promised
map, data or tool. If only a landing page is available, describe it as an agency portal.
Verify relevance, authority, currency and public access in a browser; HTTP success alone
does not establish usefulness, and a bot-challenge 403 alone does not establish breakage.
Link-outs remain unmonitored unless the app actually fetches a machine-readable source.

`Pacific-Watch-v2-Product-and-UX-Plan.md` holds the v2 product direction. Treat it as intent, not
as settled spec — several items in it assume data feeds that do not exist in fetchable form, and
a few contradict decisions in the table above. Confirm sourcing before building against it.

---

## What this is

`index.html` is the entire front end — one self-contained HTML file with all CSS and JS inline.
No build step, no dependencies, no npm packages required to run it.

`api/news.js` is the **one** server-side piece: a dependency-free Vercel serverless function that
fetches local news RSS feeds. It exists only because those feeds send no CORS headers, so the
browser cannot fetch them directly. Everything else still goes straight from the browser to the
source API. Keep it that way — only add a function when CORS genuinely blocks the direct call.

## Live data sources (all free, no API keys, CORS-enabled)

| Source | Endpoint | What it provides |
|--------|----------|-----------------|
| NWS Alerts | `https://api.weather.gov/alerts/active?area=HI` | Active watches, warnings, advisories |
| NWS Observations | `https://api.weather.gov/stations/{STATION_ID}/observations/latest` | Rain, wind, temperature per island |
| NOAA CO-OPS | `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?...&datum=MLLW` | Tide gauge readings (datum param required) |
| USGS Earthquakes | `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=..&longitude=..&maxradiuskm=..` | Recent M2.0+ quakes per island |
| FEMA Declarations | `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=state eq 'HI'` | Federal disaster declarations, statewide (not island-scoped) |
| USGS HVO Webcams | `https://volcanoes.usgs.gov/observatories/hvo/cams/{CAM_ID}/images/M.jpg` | Live volcano webcam stills, refreshed client-side every 2 min |
| Ventusky | `https://embed.ventusky.com/?p={lat};{lon};{zoom}&l={layer}` | Embedded radar iframe, statewide view. Params: `p` position, `l` layer (`radar`, `gust`, `rain-3h`, `temperature-2m`, `wind-10m`), `t` time, `w` wind animation. Units/language follow the browser and can't be set. |
| HIEMA | Static link to `dod.hawaii.gov/hiema` | Emergency management info |
| poweroutage.us | Static link | Outage data |

Everything in this table is called **directly from the browser** — no backend. News headlines are the
one exception and go through `/api/news` (see below), because the outlet RSS feeds send no CORS
headers. Same reason `protect.genasys.com` (the evacuation-zone alert system HI counties actually
use) is a link-out only rather than a live feed — it returns HTML with no CORS.

Before adding a source, `curl -H "Origin: https://pacific-watch.vercel.app" <url> -D -` and check for
`Access-Control-Allow-Origin`. If it's there, fetch it from the browser and add the origin to the CSP
`connect-src`. If it isn't, it needs a serverless function.

## Island station mappings

```js
const WEATHER_STATIONS = {
  statewide: { id: 'PHNL', label: 'HNL Intl' },
  oahu:      { id: 'PHNL', label: 'HNL Intl' },
  maui:      { id: 'PHOG', label: 'Kahului' },
  hawaii:    { id: 'PHTO', label: 'Hilo Intl' },
  kauai:     { id: 'PHLI', label: 'Lihue' },
  molokai:   { id: 'PHNL', label: 'HNL Intl' },
};

const TIDE_STATIONS = {
  statewide: { id: '1612340', name: 'HNL Harbor' },
  oahu:      { id: '1612340', name: 'HNL Harbor' },
  maui:      { id: '1615680', name: 'Kahului, Maui' },
  hawaii:    { id: '1617760', name: 'Hilo, Hawaii' },
  kauai:     { id: '1611400', name: 'Nawiliwili, Kauai' },
  molokai:   { id: '1612340', name: 'HNL Harbor' },
};
```

## AI Digest feature

The Generate and Summarize buttons call the Claude API directly from the browser, using a key the
user supplies. Model: `claude-haiku-4-5-20251001` · max tokens 600 · key in
`localStorage.getItem('pw_api_key')`.

- **Both digest panels are hidden entirely unless a key is set** (`updateApiLabel()` toggles
  `#digest-panel-alerts` / `#digest-panel-news`). They default to `hidden` in the markup so an
  unkeyed visitor never sees them flash. Settings → Claude API is the only way to add a key, since
  hiding the panel also hides its inline Setup link.
- **The key inputs are `type="text"` with `-webkit-text-security` masking, not `type="password"`.**
  Don't "fix" this back: `type="password"` makes browsers offer to save an Anthropic key as a login
  for this origin, duplicating a third-party secret into the user's password manager.
  `autocomplete="off"` does not suppress that — browsers ignore it on password fields.

**Planned direction:** eventually the digests should work for all visitors, which means a server-side
key. That would be `api/digest.js` reading `ANTHROPIC_API_KEY` from a Vercel env var. Two constraints
if you build it: the function must **fetch NWS itself and build the prompt server-side** (never accept
a client-supplied prompt, or the endpoint becomes a free Claude API on the owner's key), and it should
**cache per island+type at the edge** — the digest isn't personalized, so one generation serves every
visitor in the window, which is what keeps the cost bounded. Add a per-IP rate limit for cache misses.

## Architecture

All state is in one object `S`:
```js
const S = {
  apiKey:      '',          // Claude API key from localStorage
  theme:       'system',    // system | light | dark  (localStorage pw_theme)
  island:      'statewide', // active island tab
  newsFilter:  'hazard',    // hazard | all — Latest Headlines filter, defaults to hazard
  newsSources: Set,         // enabled outlets (localStorage pw_news_sources)
  alertsCache: [],          // last fetched NWS alert features
};
```

Views: `overview`, `alerts`, `maps`, `news`, `settings`, with **Overview initial**. Both the mobile
bottom nav and `.desktop-tabs` switch all five, and `switchView()` syncs both bars and records the
current view in `S.view`.

**The pinned desktop Alerts sidebar was deliberately removed in PR 3** and Alerts became a full view.
It was previously always visible beside the tabbed column; keeping it would have left a second,
competing summary next to Overview. Both breakpoints are now a single column where `.view` and
`.view.active` alone decide visibility, and **exactly one view is visible and keyboard-reachable**.

There is deliberately no rule forcing a view visible any more. The old
`.desktop-sidebar .view{display:block!important}` existed only because the rail sat outside the tab
set — it is not a pattern to reintroduce, and a bare `.view{display:block!important}` would stack all
five views at once with no way to switch, which is what this codebase did before it was scoped. A test
asserts that no live rule of that shape exists and that exactly one view is active after every switch.

Overview holds up to three priority NWS products, the four observation readings that used to sit in
the always-visible stat bar, and routes to Maps, News, Source details and Recent earthquakes.

**The markup is written in the 390px reading order** — first priority card, route to all products,
wind/rain, remaining cards, tide/earthquake, references — because CSS `order` and grid placement
rearrange boxes visually without changing the sequence a screen reader announces. Below 768px nothing
is reordered at all, so what is seen and what is read match. 768–1023px uses `order` to regroup the
priority cards ahead of the observations, and 1024px and up uses explicit grid placement to put the
four observation cards on one line. An earlier attempt wrapped the observations in a flex container
for that last case; the wrapper defaulted to `order:0` and jumped ahead of the first priority card,
which is why placement is now per-item and the wrapper is gone.

Coverage is stated on the cards rather than implied: Statewide and Molokaʻi borrow Honolulu's weather
and tide stations and say so, tide carries `ft MLLW`, the observation's own timestamp is shown
separately from the fetch time, and the earthquake card names its query radius. The USGS query has a
ten-result limit, so a full page of results says the limit was reached instead of reading as a
complete count, and a missing magnitude stays `unknown`.

The strip is one element in shared chrome rather than a copy per view, so no two surfaces can
disagree; its route to Alerts is hidden only on Alerts itself. The scrolling ticker is **retained for
now** — the contract permits retiring it only once the strip and the full Alerts view demonstrably
cover its active-alert access, which is a judgement to make against the built layout.

**Island-scoped requests carry a scope token.** `fetchWeather()`, `fetchTides()` and
`fetchEarthquakes()` call `beginRequest(key)` before fetching and `requestIsCurrent(token)`
before using the result, on both the success and failure paths. A completion is used only if
it is the newest request for that source *and* was started under the island still selected.
`sourceOk()` stamps the cache with the island the request **started** under. Sources not in
`ISLAND_SCOPED` are never rejected for an island change — dropping news on an island switch
would be the obvious over-reach, and is covered by a test.

Data refreshes every 5 minutes via `setInterval(refreshAll, 5 * 60 * 1000)`; volcano webcams refresh
on their own 2-minute timer.

The Alerts rail leads with `#hazard-banner`, driven by `updateHazardBanner()` off the island-filtered
NWS results. Five states, in precedence order:

| State | When | Look |
|---|---|---|
| `is-alert` | any warning tier active | red |
| `is-warn` | watch or advisory active | amber, ink text |
| `is-info` | something active, none of it warning/watch/advisory | neutral, azure icon |
| `is-unknown` | the fetch failed — we could not check | neutral, grey ring icon |
| `is-ok` | verified fetch returned nothing | neutral, check icon |

`is-info` and `is-ok` look similar but mean opposite things, and `is-unknown` means a third
thing again: *active but not hazardous*, *verified empty*, and *not checked*. Do not collapse them.
 HIEMA, FEMA and
Global Hazards sit in a collapsed "Reference & Resources" section so reference material doesn't
compete with live feeds.

### Shared NWS snapshot, staged strip and the age tick

`nwsSnapshot()` is the single read of alert state. It returns the eligible product set —
render-time expiry, then selected-area match, then `compareAlerts()` on a copy — along with
per-tier counts, the highest tier, the selected area, the verification age and a
`presentation` value. Every alert surface renders from it through `renderAlertSurfaces()`,
so no caller can refresh three surfaces and forget the fourth.

Two details are easy to get wrong:

- **`usableCache()` returns retained data for STALE sources only.** Asking it about a current
  source answers `null`. Treating that as "no data" withdraws alerts at the moment they are
  successfully verified, so `nwsSnapshot()` reads `S.cache.nwsAlerts` directly in the current
  case and uses `usableCache()` only when stale.
- **Counts are per product, not per incident.** A watch and a warning covering the same area
  are two products and are counted twice on purpose. Nothing is deduplicated by area.

`presentation` is one of `checking`, `warning`, `watch`, `statement`, `empty`, `stale-empty`
or `unavailable`, with `.stale` separating retained active products from current ones. That
covers the source states in the v2 overview contract; recovery is not a state but the result
of recomputing after a successful fetch.

The strip (`#nws-strip`) is **staged, not launched**. It renders on every update so its states
are testable, but ships `hidden`: showing it now would place a second summary beside the hazard
banner, which the contract rules out until the Overview lands. Append `?strip=1` to reveal it
for a browser pass. PR 3 places it and drops the flag.

**Chrome offsets are measured, not assumed.** `syncChromeOffsets()` publishes the real header
and bottom-nav heights as `--hdr-h` and `--nav-h`, refreshed on resize and through a
`ResizeObserver` on both elements, because zoom does not reliably fire resize and the header
grows a line when the ticker or island tabs rewrap. Anything sticky or fixed must position
against those tokens; a pixel literal is a zoom bug waiting to happen.

`ageTick()` re-evaluates freshness and expiry from memory once a minute, and on
`visibilitychange` and navigation. It issues no network request and must never touch
verification timestamps. `startAgeTick()` is idempotent — one timer and one listener however
often it is called — because a duplicated tick would multiply renders on every navigation.

On island switch, `renderIslandScopedChecking()` withdraws the previous area's wind, rain,
tide and earthquake cards immediately. Leaving Maui's wind under a Kauaʻi heading is the same
false attribution the request-generation guard fixed inside the cache.

## Color tokens

Source palette (8 swatches): ink `#0a0507` · azure `#1b7bb5` · navy `#153a63` · steel `#7bb0c6` ·
ice `#d6e7ec` · maroon `#571a0e` · vermilion `#cc3110` · orange `#ea8a2e`

```css
--navy, --navy2, --navy3   /* near-black + deep navy backgrounds (header, digest panel) */
--sky, --sky2, --sky3      /* azure accents; --sky2 is the primary action color */
--ice, --ice2              /* pale tint backgrounds */
--alert  #cc3110           /* vermilion — active warnings */
--warn   #ea8a2e           /* orange — watches/advisories */
--ok     #3d8299           /* steel blue — all clear (palette has no green; see note) */
--info   #1b7bb5           /* azure — informational */
--ink, --ink2, --ink3, --ink4  /* text hierarchy */
--rule, --surf, --card     /* borders, page bg, card bg */
--b-*-bg / --b-*-fg        /* badge tints (alert/warn/ok/info/global), theme-aware */
```
Badge colors are tokenized (`--b-*`) so they invert correctly in dark mode.

## Security (read before touching any render code)

Everything this app displays comes from an external source — NWS, USGS, FEMA, five third-party
news RSS feeds, and the Claude API — and it all lands in `innerHTML`. An injected script would run
on our origin and could read the user's Anthropic key out of `localStorage`, so escaping is not
cosmetic here.

**Rules:**
1. **Every interpolated external value goes through `esc()`.** No exceptions, including fields that
   "look safe" like `severity` or a formatted date.
2. **Every `href` built from external data goes through `safeUrl()`**, which allows only `http(s)`
   and returns `#` otherwise. RSS `<link>` values are attacker-controlled; `javascript:` in an href
   is a live XSS.
3. **Escape model output before adding markup.** `callClaude()` does `esc(text)` *then* applies the
   `**bold**` → `<strong>` transform, so HTML the model emits stays inert. Never reverse that order.
4. **In `api/news.js`, `decode()` decodes entities BEFORE stripping tags**, loops until stable, and
   removes leftover angle brackets. The original version stripped first and decoded second, which
   turned `&lt;img onerror=...&gt;` in a feed title back into live markup after the strip had run.
5. `target="_blank"` always carries `rel="noopener noreferrer"`.

**CSP** is set in `vercel.json`. `script-src` still needs `'unsafe-inline'` because the app uses
inline `<script>` blocks and 22 `onclick=` attributes, so CSP is not a complete XSS backstop — the
escaping above is the real defense. What CSP *does* buy: `connect-src` is limited to the known APIs,
so injected script cannot exfiltrate the key to an arbitrary host, plus `object-src`/`base-uri`/
`form-action`/`frame-ancestors` are locked to `none`. If you add a data source, add its origin to
`connect-src` or the fetch will fail silently in the browser console.

To close the `'unsafe-inline'` gap properly you'd move the remaining 22 `onclick=` handlers to
`addEventListener` and give the two inline scripts nonces/hashes. Worth doing before this gets
significant public traffic.

## Alert severity model

Alerts are tiered on the **NWS product type parsed from `event`**, never on CAP `severity`.

This is not a style preference. Verified against the live feed on 2026-09-06, during
Hurricane Lowell:

| event | severity | urgency | certainty |
|---|---|---|---|
| Tropical Storm Warning | Severe | Immediate | Likely |
| Flood Watch | **Severe** | Future | Possible |
| High Surf Advisory | Minor | Expected | Likely |
| Tropical Cyclone Local Statement | Moderate | Expected | Likely |

`severity: Severe` covers **both** a Tropical Storm Warning and a Flood Watch, so severity
cannot separate act-now from be-prepared. The previous `getBadgeClass()` tested
`severity === 'Severe'` first and rendered a Flood Watch with the same red badge and the
same literal text `SEVERE` as a Tropical Storm Warning — flattening the single distinction
NWS most wants a reader to make.

```js
const ALERT_TIERS = {
  warning:   { rank: 0, badge: 'badge-alert',   label: 'WARNING'   },
  watch:     { rank: 1, badge: 'badge-warn',    label: 'WATCH'     },
  advisory:  { rank: 2, badge: 'badge-info',    label: 'ADVISORY'  },
  statement: { rank: 3, badge: 'badge-unknown', label: 'STATEMENT' }
};
```

`alertTier()` resolves in this order:

1. **`severity === 'Extreme'` → `warning`.** A safety-biased override so an Extreme product is
   never under-ranked because of what it happens to be called.
2. **Word-boundary match on the event name** — warning/emergency, watch, advisory, statement.
   `\b` boundaries matter: a substring match would misclassify.
3. **CAP `urgency` fallback** for product names that follow no convention. Immediate →
   warning, Expected → advisory, otherwise statement.

The badge displays the **tier label**, not `severity`. Ordering is `compareAlerts()`: tier,
then urgency, then most recent — the alerts rail, the ticker and the hazard-banner subtitle
all use it, so the most actionable item is always first.

The hazard banner counts each tier separately ("6 warnings · 2 watches — Hawaii") rather
than summing them. Calling two Flood Watches "warnings" overstates them; omitting them
understates the situation.

Covered by `test/severity-model.test.js` (24 assertions), using the live fixtures above.

**`updateHazardBanner()` must never fall through to an all-clear while anything is active.**
It previously used a single `filtered.length` catch-all; tiering replaced that with enumerated
branches, and the first version omitted `statement`, so a feed carrying only a Tropical Cyclone
Local Statement rendered "All clear". Caught in review. There is now an exhaustiveness guard —
if anything is active and no tier branch described it, the banner reports the raw count rather
than asserting safety. **When you replace a catch-all with enumerated cases, prove the
enumeration is exhaustive or keep a fallback.** Covered by `test/dom-behavior.test.js` §6-8.

## Theming

Three states, stored in `localStorage.getItem('pw_theme')` as `system` | `light` | `dark`:

| State | `<html>` attribute | Resolves via |
|-------|--------------------|--------------|
| `system` (default) | none | `@media(prefers-color-scheme:dark)` → `:root:not([data-theme="light"])` |
| `light` | `data-theme="light"` | bare `:root`; the `:not()` guard excludes the media block |
| `dark` | `data-theme="dark"` | `:root[data-theme="dark"]` |

Controls: an icon button in the header (`toggleTheme()` — flips light/dark) and a three-way
segmented control in Settings → Appearance (`applyTheme(mode)`). Both stay in sync via
`updateThemeUI()`, which also rewrites the `theme-color` meta so mobile browser chrome matches.

A small script in `<head>` applies the saved theme *before first paint* — don't move it to the
bottom or the page will flash the wrong theme on load. When adding new colors, define them as
tokens in all three blocks rather than hardcoding hex in component CSS.

**Three accessibility constraints to preserve when editing colors:**
- White text on `--warn` orange is only 2.6:1 — the amber hazard-banner state uses ink `#0a0507`
  text instead (7.9:1). Don't revert it to white.
- "All clear" is steel blue, not green: the palette has no green. This also keeps the
  alert/advisory/clear triad distinguishable for red-green color blindness.
- **Verification state is never carried by colour alone.** `--ok` steel blue and `--unknown`
  grey are too close to separate reliably at 6px, so `.s-dot.unknown` is a hollow ring and
  `.src-state-unavailable` is outlined rather than filled — shape carries the distinction and
  hue only reinforces it. Any new status indicator must differ in more than colour.
  Every dot state now differs in shape: `ok` is a circle, `unknown` a hollow ring, `warn` a
  triangle, `alert` a larger triangle. `prefers-reduced-motion` is honoured, and because the
  pulse is a real second channel for `alert`, a static ring substitutes for it rather than
  the distinction simply disappearing (F004, closed).
  **Accepted unverified, 2026-09-07:** the reduced-motion substitute has never been seen
  rendered — it needs an OS setting change while an `alert` dot is on screen. The project
  owner has accepted that gap rather than hold work for it. Do not re-raise it in review;
  check it opportunistically if both conditions ever coincide during other work.
All text pairings currently pass WCAG AA (4.5:1) in both light and dark mode.

## Typography

- Display/UI: **Syne** (Google Fonts) — headers, labels, buttons
- Body/prose: **Source Serif 4** (Google Fonts) — alert text, digest output

## Common tasks

**Add a new island tab**
1. Add an entry to `WEATHER_STATIONS` and `TIDE_STATIONS`
2. Add a `.island-tab` button in the island tabs HTML with `data-island="<key>"`
3. Update `alertMatchesIsland()` if the island needs specific zone filtering

**Change the data refresh interval**
Find `setInterval(refreshAll, 5 * 60 * 1000)` and adjust the ms value.

**Add a new stat cell**
Copy a `.stat-cell` block in the stat bar HTML. Give it a unique `id` for the value
element and note element. Update `fetchWeather()` or `fetchTides()` to populate it.

**Change how alerts are ranked or badged**
Alerts are tiered on the **NWS product type**, not on CAP `severity`. Edit `ALERT_TIERS` and
`alertTier()`. Do not reintroduce a severity-first test — see the severity model section.
Ordering lives in `compareAlerts()`: tier, then CAP urgency, then most recent.

## News headlines (`/api/news`)

**Settings → News Sources filters which of these outlets is displayed.** The names in
`NEWS_SOURCES` must match the `source` field `api/news.js` emits, character for character —
the filter compares them directly, so a rename on either side silently hides an outlet.
Enabled outlets persist in `localStorage.pw_news_sources`; a saved list is intersected with
`NEWS_SOURCES` on load so a retired name cannot resurrect itself or hide everything.
Filtering is display-only — every feed is still fetched, and toggling re-renders from cache
rather than refetching, so flipping a switch does not hit five outlets.

Merges RSS from Hawaii News Now, Civil Beat, Star-Advertiser, KHON2 and KITV, deduped by link and
by identical title (outlets carry the same wire copy), sorted newest first.

- `?limit=30` (max 100) · `?hazard=1` returns only items matching the hazard keyword regex.
- Items are flagged `hazard: true` when the title/summary matches storm/flood/evacuation/etc.
  The outlet feeds carry national wire stories, so this is what ties the tab to the app's purpose.
- Cached at Vercel's edge for 5 min (`s-maxage=300`) so the outlets aren't hit per page load.
- A feed that fails is reported in `errors[]` and the rest still return — never all-or-nothing.
- **Star-Advertiser 403s a bare `Mozilla/5.0` UA**, so the function sends a full browser UA. Don't
  trim it.
- `vercel.json` rewrites `/((?!api/).*)` to `index.html` — the `api/` exclusion keeps the SPA
  rewrite from swallowing the function.

## Local dev

```bash
npm run dev        # static only — fast, but /api/news 404s (UI shows a "local dev" note)
npm run dev:api    # vercel dev — needed to test headlines locally
```

Then open http://localhost:3000. All NWS/NOAA/USGS/FEMA fetches work on plain `npm run dev`;
only the news headlines need `dev:api`.

## Testing

```bash
npm test             # pure logic, no dependencies, no runner
npm run test:dom      # behaviour in a headless DOM — needs `npm i` for jsdom
npm run test:mutation # checks that the DOM and contrast assertions can actually fail
```

| Suite | Covers |
|---|---|
| `test/phase1-source-health.test.js` | health state machine, per-source thresholds, retention, stale-window withdrawal, island-scoped cache invalidation |
| `test/severity-model.test.js` | alert tiering, the Extreme override, urgency fallback, word-boundary matching, ordering |
| `test/dom-behavior.test.js` | the degraded states, the critical-source rule, statement-only banner, news source filtering, the shared snapshot, the nine strip states, the age tick and its wiring, island-switch withdrawal, and check times derived from `lastSuccess` |
| `test/contrast.test.js` | strip text at 4.5:1 in both themes, drift between the two dark blocks, severity still distinguishable, and the preconditions that make token arithmetic valid |
| `test/mutation-check.js` | whether the assertions in the other two suites can fail at all |

The first two **extract the functions straight out of `index.html`** with regexes rather than
importing them — there is no module system to import from. That means a rename can break
extraction, and the tests fail loudly rather than silently passing. That is deliberate.

`npm test` must keep working with **nothing installed**; jsdom is a devDependency used only by
`test:dom`. Verify by copying `test/`, `package.json` and `index.html` to an empty directory
and running it there.

**What the tests cannot do is look at the page.** Every visual property — whether the hollow
ring reads at 6px, whether the triangles are distinguishable, whether an icon draws at all —
needs eyes. The DOM suite asserts that a class is applied, which a malformed SVG path would
pass while rendering nothing. `test/contrast.test.js` narrows this for colour by pinning the
values that reach the renderer, but it still says nothing about layout, wrapping or zoom.

Plan for a visual pass on anything that changes appearance. The Vercel preview is behind SSO,
so Claude cannot reach it; Codex has done these passes by **rendering the exact head locally**,
which is the route to use. Browser zoom at 200% has repeatedly resisted automation and has
been left unverified more than once — say so explicitly rather than implying it was checked.

### Mutation check (`npm run test:mutation`)

Review of PR #14 found a regression test that could not fail: both fixtures in the section
carried the same reading, so the bug it was written to catch would have passed. A green run
does not distinguish an assertion that works from one that is decorative.

`test/mutation-check.js` breaks one behaviour at a time in a copy of `index.html`, runs a
suite against the mutant and requires the intended assertion to fail. Each case names the
suite that should catch it — `dom` by default, or `contrast` for a CSS or token change — so
both suites take an HTML path as `argv[2]`. Production files are never modified; mutants are
written to a temp directory and deleted.

Add a case when you add a behaviour worth trusting. Three results mean something is wrong
with the case rather than the code:

- **`MISSED`** — the assertion covering that behaviour is decorative and should be tightened.
- **`ANCHOR LOST`** — the code the case mutates has moved; update the case.
- **`AMBIGUOUS`** — the anchor appears more than once. `String.replace` rewrites only the
  first match, so a case like this silently mutates unrelated code and its result means
  nothing either way. This is not hypothetical: a CSS anchor shared with `.sec-head` made a
  translucency case mutate the wrong rule, and the guard added afterwards immediately caught
  a second case that had been reporting `CAUGHT` while mutating the wrong theme block.

The harness checks whether assertions can fail, so it has to hold itself to the same standard.

### Contrast check (`test/contrast.test.js`, part of `npm test`)

Pure arithmetic over the tokens and CSS rules in `index.html` — no DOM, no dependencies. It
asserts every strip text colour against `--card` in both themes at 4.5:1, checks the two dark
blocks (`prefers-color-scheme` and `[data-theme="dark"]`) have not drifted apart, and checks
the five severities are still five distinct colours, so meeting AA by flattening everything
to near-black is not a way through.

It reads the real rules, so renaming a token or repointing a rule at a display colour fails
here rather than in someone's eyes.

Ratios are computed from tokens rather than sampled from pixels. That is the method WCAG
defines, but it is only sound if the foreground and background are really what the tokens
say, so the file also asserts its own preconditions: the strip paints its own opaque
`--card` background with no `opacity`/`mix-blend`/`backdrop-filter`, `--card` is an opaque
hex in both themes, no `!important` colour rule exists anywhere, and each severity rule
follows the base rule with higher specificity. The base rule that shows through if a tone is
ever missing is checked too. **Do not delete those assertions to quiet a failure** — they are
what makes the arithmetic mean anything.

What it cannot do is verify rendering. Layout, wrapping and browser zoom still need eyes.

It only covers the strip; the rest of the palette is unaudited, and light `--ok` is 4.33:1
as body text if anyone reuses it that way.

## Deploy / hosting

**`git push` is the deploy.** The GitHub repo (`rmart73/PacificWatch`) is connected to Vercel and
auto-deploys `main` — verified live. `npm run deploy` (`vercel --prod`) is only needed to ship
something without committing it.

Vercel *is* the web host — static files on their CDN plus the serverless function. Nothing else is
required to be public. GitHub is source control only.

**Free-tier caveats worth knowing before this gets real traffic** (Hobby plan, 2026):
- **No commercial use.** Vercel defines that broadly — ads, affiliate links, payments, *and asking
  for donations* all count, as does being paid to build it. A "support this project" button would
  put the site in violation. Pro is $20/seat/mo.
- **~100 GB data transfer, 1M edge requests, 1M function invocations per month**, and there is **no
  overage billing** — deployments pause when you hit the cap.
- **Deferred by the project owner, 2026-09-06:** page weight and the Hobby-tier ceiling are a
  known, accepted risk for now — the priority is a product that works before one that scales.
  Do not re-raise this in reviews. Revisit before any public promotion of the site, or if a
  single change adds page weight out of proportion to what it delivers.
- That last point matters more here than for a normal side project: **an emergency app's traffic
  spikes precisely during an emergency**. A hurricane that puts the site in front of a lot of people
  is exactly when hitting the cap would take it offline. At ~108 KB per page load the ceiling is
  roughly a million views/month, which is generous — but if this ever gets shared widely during a
  storm, upgrading to Pro beforehand is cheap insurance.
- A custom domain (e.g. `pacificwatch.org`) works on the free plan; you only pay the registrar.

## File structure

```
pacific-watch/
├── AGENTS.md       ← you are here (shared contract)
├── CLAUDE.md       ← pointer to AGENTS.md
├── AI-HANDOFF.md   ← transient coordination board; claims go here before editing
├── Pacific-Watch-v2-Product-and-UX-Plan.md   ← v2 roadmap (intent, not settled spec)
├── V2-OVERVIEW-CONTRACT.md   ← merged layout and acceptance contract for the Overview
├── PHASE1-SOURCE-HEALTH.md   ← the Phase 1 source-health contract
├── docs/
│   └── archive/    ← dated snapshots of the handoff board (history, not active claims)
├── index.html      ← the entire front end
├── api/
│   └── news.js     ← serverless RSS merge (only because feeds lack CORS)
├── vercel.json     ← cache headers + routing (excludes /api from the SPA rewrite)
├── package.json    ← dev server, deploy and test scripts (no runtime dependencies)
├── package-lock.json ← locks the jsdom devDependency only
├── test/
│   ├── phase1-source-health.test.js  ← pure logic, no dependencies (`npm test`)
│   ├── severity-model.test.js        ← alert tiering and ordering (`npm test`)
│   ├── contrast.test.js              ← strip text contrast, pure arithmetic (`npm test`)
│   ├── dom-behavior.test.js          ← degraded-state behaviour in jsdom (`npm run test:dom`)
│   └── mutation-check.js             ← proves those assertions can fail (`npm run test:mutation`)
└── .gitignore
```
