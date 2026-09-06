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

- **Claim the work in `AI-HANDOFF.md` before editing anything.** The claim names the agent,
  the branch, and the scope. **The claim is the concurrency lock; the PR is the review
  artifact.** Checking open PRs is not sufficient — in Phase 1 both agents began work on the
  same item at the same time and neither had opened a PR yet, so there was nothing to see.
  If the board already shows a claim overlapping your scope, coordinate in the handoff log
  instead of starting.
- Branch from up-to-date `main`. Prefix by agent so ownership is visible at a glance:
  `claude/<topic>` · `codex/<topic>`
- **Never commit directly to `main`.**
- Rebase on `main` before opening the PR; resolve conflicts on your branch, not in the merge.
- Vercel builds a **preview deployment for every PR**. Open it and confirm the change actually
  renders before requesting a merge — there is no build step and no test suite, so a preview
  check is the only thing standing between a bad merge and the live site.
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

The entire front end is one ~1,450-line file, so two agents editing "different features" routinely
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
| Desktop view rule is scoped to `.desktop-sidebar .view` | A bare `.view{display:block!important}` stacks all three views at once | Architecture |
| Star-Advertiser gets a long browser UA string | It 403s a bare `Mozilla/5.0` | News headlines |
| `.hazard-banner.is-unknown` looks like a duplicate of `.is-ok` | Merging them makes a failed NWS fetch render as an all-clear | Status semantics |
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
  alertsCache: [],          // last fetched NWS alert features
};
```

Views: `alerts`, `news`, `maps`, `settings`. On mobile the bottom nav switches all four. On desktop
(≥768px) the Alerts rail is pinned as a sidebar and always visible, while `.desktop-tabs` switches
News / Maps / Settings in the main column — `switchView()` syncs both bars. Note the desktop rule is
scoped to `.desktop-sidebar .view`; a bare `.view{display:block!important}` would make all three main
views render stacked at once with no way to switch, which is what it used to do.

Data refreshes every 5 minutes via `setInterval(refreshAll, 5 * 60 * 1000)`; volcano webcams refresh
on their own 2-minute timer.

The Alerts rail leads with `#hazard-banner`, driven by `updateHazardBanner()` off the island-filtered
NWS results: red for warnings, amber for advisories/watches, neutral for all-clear. HIEMA, FEMA and
Global Hazards sit in a collapsed "Reference & Resources" section so reference material doesn't
compete with live feeds.

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
inline `<script>` blocks and ~30 `onclick=` attributes, so CSP is not a complete XSS backstop — the
escaping above is the real defense. What CSP *does* buy: `connect-src` is limited to the known APIs,
so injected script cannot exfiltrate the key to an arbitrary host, plus `object-src`/`base-uri`/
`form-action`/`frame-ancestors` are locked to `none`. If you add a data source, add its origin to
`connect-src` or the fetch will fail silently in the browser console.

To close the `'unsafe-inline'` gap properly you'd move the 30 `onclick=` handlers to
`addEventListener` and give the two inline scripts nonces/hashes. Worth doing before this gets
significant public traffic.

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

**Two accessibility constraints to preserve when editing colors:**
- White text on `--warn` orange is only 2.6:1 — the amber hazard-banner state uses ink `#0a0507`
  text instead (7.9:1). Don't revert it to white.
- "All clear" is steel blue, not green: the palette has no green. This also keeps the
  alert/advisory/clear triad distinguishable for red-green color blindness.
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

**Change alert severity colors**
The `badge` classes in `renderAlerts()` map NWS severity strings to CSS vars:
`Extreme/Severe → --alert`, `Moderate → --warn`, else `--info`.

## News headlines (`/api/news`)

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
- That last point matters more here than for a normal side project: **an emergency app's traffic
  spikes precisely during an emergency**. A hurricane that puts the site in front of a lot of people
  is exactly when hitting the cap would take it offline. At ~85 KB per page load the ceiling is
  roughly a million views/month, which is generous — but if this ever gets shared widely during a
  storm, upgrading to Pro beforehand is cheap insurance.
- A custom domain (e.g. `pacificwatch.org`) works on the free plan; you only pay the registrar.

## File structure

```
pacific-watch/
├── AGENTS.md       ← you are here (shared contract)
├── CLAUDE.md       ← pointer to AGENTS.md
├── Pacific-Watch-v2-Product-and-UX-Plan.md   ← v2 roadmap (intent, not settled spec)
├── index.html      ← the entire front end
├── api/
│   └── news.js     ← serverless RSS merge (only because feeds lack CORS)
├── vercel.json     ← cache headers + routing (excludes /api from the SPA rewrite)
├── package.json    ← dev server + deploy scripts
└── .gitignore
```
