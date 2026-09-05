# Pacific Watch — Hawaii Situational Awareness

Single-file web app for real-time Hawaii emergency and weather situational awareness.
Hosted on Vercel. Edited in VS Code with Claude Code.

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

All of the above are called directly from the browser — no backend/proxy. Note: `protect.genasys.com` (the real evacuation-zone alert system used by HI counties) was evaluated but does NOT expose CORS-enabled JSON, so it can't be fetched client-side; only a static link-out is possible without adding a serverless proxy.

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

The Generate and Summarize buttons call the Claude API directly from the browser.
The user enters their Anthropic API key in Settings → it's stored in `localStorage`.
Model: `claude-haiku-4-5-20251001` · Max tokens: 600

The key is stored as `localStorage.getItem('pw_api_key')`.

## Architecture

All state is in one object `S`:
```js
const S = {
  apiKey:      '',         // Claude API key from localStorage
  island:      'statewide', // active island tab
  alertsCache: [],         // last fetched NWS alert features
};
```

Views: `alerts`, `news`, `maps`, `settings` — switched via bottom nav.
Data refreshes every 5 minutes via `setInterval(refreshAll, 5 * 60 * 1000)`.

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

## Deploy to Vercel

```bash
npm run deploy     # vercel --prod
```

Or just `git push` if you connect the repo to Vercel for automatic deploys.

## File structure

```
pacific-watch/
├── CLAUDE.md       ← you are here
├── index.html      ← the entire front end
├── api/
│   └── news.js     ← serverless RSS merge (only because feeds lack CORS)
├── vercel.json     ← cache headers + routing (excludes /api from the SPA rewrite)
├── package.json    ← dev server + deploy scripts
└── .gitignore
```
