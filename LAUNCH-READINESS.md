# Pacific Watch — security and launch-readiness review

**Reviewed:** 2026-09-08 · **Head:** `3f5a885` · **Reviewer:** Claude Code · **Status:** report only, no remediation

**Revised 2026-09-25**, correcting four review findings about this report (CORS as an abuse
control, offline behaviour, CSP as structural, and security conclusions stated more broadly than
the checks support) and completing the source-to-display evidence. The code under review is
unchanged at `3f5a885`; the source evidence was recaptured live on 2026-09-25 during Hurricane
Nolo. **Still report only — no remediation in this branch.**

Scope set by Codex: API routes; secrets and browser storage; untrusted-content handling;
dependencies; deployment configuration; abuse and cost controls; and source-to-display accuracy
across the observation cards.

**This is not a clearance.** Findings are separated into what was verified, what is a concrete
gap, and what was not checked at all. A passing test suite and a 200 response are evidence about
specific behaviours, not about security posture, and neither is offered here as the latter. No
penetration test was performed and no third party has reviewed this.

**How to read Section 1.** Every entry is the outcome of a *specific check on a specific surface*,
named in the right-hand column. None of them is a property of the system as a whole. "No SSRF in
`api/news.js`" means that one route was read and its `fetch()` arguments traced; it does not say
the application has no SSRF. "All enumerated `innerHTML` interpolations are escaped" means the
enumeration found none unescaped at this head; it does not say the app is XSS-free. A manual
review bounded to the surfaces listed cannot establish the absence of a class of vulnerability,
and nothing here should be quoted as doing so.

The app is **already deployed and publicly reachable**. The question this answers is not whether
to deploy, but whether to invite people to depend on it.

---

## 1. Verified protections

Each was checked against the running code or live production, not recalled from documentation.
Findings are scoped to the surface named in the third column — read each as the outcome of that
check, not as a general property of the application.

| Area | Finding (scoped to the check performed) | Surface checked, and how |
|---|---|---|
| **SSRF — `api/news.js`** | No SSRF found *in this route*: it fetches only a hardcoded five-feed allowlist, and the only user input — `limit` (parsed, clamped to 100) and `hazard` (strict `=== '1'`) — never reaches `fetch()`. It is the app's only server-side route, so the route-level surface is covered in full; the finding is still about this route rather than a system property | Read the full function; traced every `fetch()` argument to its source |
| **XSS — the 19 enumerated `innerHTML` interpolations** | No unescaped string interpolation among them: every string value passes through `esc()` or `safeUrl()`, and the five exceptions are `Math.round()`, `.toFixed()` or a length subtraction — numbers, not strings. Scoped to what the enumeration matched at this head; a render path added since, or one the pattern failed to match, is not covered by it | Scripted enumeration of every `${...}` inside an `innerHTML` assignment, then manual trace of each exception to its derivation |
| **XSS — feed decoding** | `decode()` decodes entities **before** stripping tags, repeats stripping until stable, then removes residual angle brackets. Encoded markup cannot be reconstituted after the strip | Read; ordering matches the documented load-bearing rule |
| **XSS — three specific hostile payloads** | `onerror` in an event name and `<script>` in an area name create no elements and execute nothing; a `javascript:` news link is neutralised. Three payloads against three fields — evidence that these paths hold, not that the escaping is complete | DOM suite §26 |
| **Transport / framing** | HSTS `max-age=63072000; includeSubDomains; preload`; `X-Frame-Options: DENY`; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'none'`; `form-action 'none'`; `nosniff` | `curl -I` against production |
| **Network egress** | CSP `connect-src` restricts the browser to the five data APIs plus `api.anthropic.com`. An exfiltration attempt to any other host is blocked by the browser | Read from the live response header |
| **Secrets** | None committed across 52 commits. The `sk-ant-` occurrences are placeholder text and a last-four display | Repo-wide pattern scan over full history |
| **Supply chain** | Zero runtime dependencies. 63 packages in the lockfile are dev-only (jsdom) and none reach the browser | `package.json` + lockfile inspection |
| **Browser storage** | Three keys: `pw_theme`, `pw_news_sources`, `pw_api_key`. Only the key is sensitive; it is the user's own, never sent anywhere but Anthropic, and removable in Settings | Enumerated every `localStorage` call |
| **Upstream isolation** | Per-feed 8s `AbortController` timeout; `Promise.allSettled` so one failing outlet cannot fail the response | Read |
| **Source-to-display — the four observation cards** | Every reading checked traces to its source: two wind stations (each cross-checked against its own METAR), rainfall on both the null and measured-zero paths, two tide stations, and the earthquake on both the limit-reached and verified-empty paths. **One gap remains inside this area:** the mm-to-inches divisor is unverified against a nonzero live reading — see the record below | Live responses captured to disk, then `index.html` rendered against those exact bytes in jsdom; expectations established independently from published constants and the stations' own METAR text |

### Source-to-display record

Per the two rules in `AGENTS.md`. Every expectation below is established **independently** — from a
published conversion constant, or from the station's own METAR text in the same response — and never
by calling the page's own converter. Each entry carries all five required fields: endpoint, the
relevant fields with their declared units, the observation time, the expected result with its basis,
and what the page actually displayed.

**Capture conditions.** Recaptured 2026-09-26 (2026-09-25 HST) during **Hurricane Nolo**, with 41
active NWS products for HI: 19 Tropical Storm Watches, 8 Hurricane Watches, 8 Tropical Storm
Warnings, 2 Tropical Cyclone Local Statements, 2 High Surf Advisories, 1 Flood Watch, 1 Wind
Advisory. The storm is why elevated wind and live rainfall were available to check at all.

**Method.** Each live response was captured to disk, then `index.html` at this head was rendered in
jsdom against those exact bytes, served verbatim with no reshaping. "Displayed" is read from the
rendered DOM. This is the same local-render route `AGENTS.md` prescribes, because the Vercel preview
is behind SSO.

The earlier record in this report covered four cards but three entries were incomplete — rainfall
had only exercised the null path, the tide timestamp carried no timezone, and the earthquake entry
had no event identity. All three are addressed below.

#### Wind — two stations, each cross-checked against its own METAR

```
endpoint   api.weather.gov/stations/PHNL/observations/latest          [statewide]
fields     windSpeed 27.72  wmoUnit:km_h-1    windGust 64.8  wmoUnit:km_h-1
obs time   2026-09-26T02:53:00+00:00   (Sep 25, 04:53 PM HST)
expected   17 mph sustained, 40 mph gust
           basis 1: km/h x 0.621371 -> 17.224 and 40.265
           basis 2: the station's own METAR in the same response --
             PHNL 260253Z 04015G35KT = 15 kt sustained, 35 kt gust
             15 kt x 1.150779 = 17.262 -> 17    35 kt x 1.150779 = 40.277 -> 40
displayed  "17 mph"  note "G40mph · HNL Intl · Honolulu reference for statewide
            · obs Sep 25, 04:53 PM HST"                              MATCH

endpoint   api.weather.gov/stations/PHLI/observations/latest          [kauai]
fields     windSpeed 35.28  wmoUnit:km_h-1    windGust 46.44  wmoUnit:km_h-1
obs time   2026-09-26T02:53:00+00:00   (Sep 25, 04:53 PM HST)
expected   22 mph sustained, 29 mph gust
           basis 1: km/h x 0.621371 -> 21.922 and 28.856
           basis 2: METAR PHLI 260253Z 04019G25KT = 19 kt, gust 25 kt
             19 kt x 1.150779 = 21.865 -> 22    25 kt x 1.150779 = 28.769 -> 29
displayed  "22 mph"  note "G29mph · Lihue · obs Sep 25, 04:53 PM HST"   MATCH
```

Two independent bases agree on both stations, and the km/h path and the knots path land on the same
integer. This is the check the wind-unit defect went undetected by, now run against two stations
during a live storm.

#### Rainfall — the null path and the measured-zero path are different, and both now checked

```
endpoint   api.weather.gov/stations/PHNL/observations/latest          [statewide]
fields     precipitationLastHour  null   wmoUnit:mm
obs time   2026-09-26T02:53:00+00:00
expected   withheld -- null is missing data, not a measured zero
displayed  "—"  note "Not reported · HNL Intl …"  dot .s-dot unknown   MATCH

endpoint   api.weather.gov/stations/PHLI/observations/latest          [kauai]
fields     precipitationLastHour  0   wmoUnit:mm
obs time   2026-09-26T02:53:00+00:00   (Sep 25, 04:53 PM HST)
           METAR: PHLI 260253Z … 10SM -RA … P0000  (light rain, trace accumulation)
expected   0.00" displayed as a verified reading, dot ok -- a measured zero is a
           reading, not missing data.  0 mm / 25.4 = 0.00
displayed  "0.00\""  note "1-hr · Lihue · obs Sep 25, 04:53 PM HST"
           dot .s-dot ok                                              MATCH
```

**This is a distinction the earlier record could not see, because only the null path had been
exercised.** A measured `0` renders `0.00"` with an `ok` dot; `null` renders `—` / "Not reported"
with an `unknown` ring. That is exactly the `ok` versus `unknown` semantics the non-negotiables
require, confirmed against live data rather than a fixture — and it is the pairing that the
"invented 0.00 rainfall" defect in this project's history got wrong.

**Still not verified: the mm-to-inches divisor against a nonzero live reading.** All four stations
were polled across **two full hourly observation rounds** — `02:53Z` and `03:53Z`, eight distinct
observations — and none reported a nonzero `precipitationLastHour`, so the `25.4` divisor is
exercised only at zero, where every divisor gives the same answer.

The second round is the more informative one, because **rain was actually falling and the reading
was still a legitimate `0`:**

```
PHNL 260353Z … RAB35E47 … P0000   rain began :35, ended :47 — trace
PHLI 260353Z … -RA …     P0000   light rain in progress   — trace
PHTO 260353Z … RAE02 …   P0000   rain ended :02           — trace
PHOG 260354Z …                    no precipitation field (null)
```

`P0000` is the METAR group for a **trace**: precipitation occurred but accumulated less than 0.01
of an inch. So three of the four stations recorded rain during a tropical system and correctly
reported a measured zero, which is worth knowing in its own right — a Hawaii airport station
reporting `0` in a storm is not evidence of a broken feed.

PHLI reported `precipitationLast3Hours: 0.5 mm`, but the app reads only `precipitationLastHour`, so
that value never reaches a render path and cannot serve as evidence.

**Recorded as unverified rather than omitted**, per the AGENTS rule. What would close it: one
capture where `precipitationLastHour` is nonzero, with the expectation taken from `mm / 25.4` and
cross-checked against the METAR's own `Pnnnn` group — which needs accumulation of at least 0.01
of an inch in the hour, not merely rain in the hour.

#### Tide — timezone now resolved, and resolved empirically

```
endpoint   api.tidesandcurrents.noaa.gov/api/prod/datagetter
           product=water_level  date=latest  station=1612340
           time_zone=lst_ldt  units=english  datum=MLLW               [statewide]
fields     v 1.814  ft MLLW   (units=english and datum=MLLW are requested explicitly)
obs time   2026-09-25 17:24  HST = UTC-10  (see the timezone note below)
expected   1.8 ft -- NOAA returns feet for units=english, so there is no unit
           conversion; the only transform is rounding to one decimal. 1.814 -> 1.8
displayed  "1.8 ft"  note "ft MLLW · HNL Harbor · Honolulu reference for statewide"  MATCH

endpoint   same, station=1611400                                     [kauai]
fields     v 1.539  ft MLLW
obs time   2026-09-25 17:30  HST
expected   1.5 ft  (1.539 -> one decimal)
displayed  "1.5 ft"  note "ft MLLW · Nawiliwili, Kauai"               MATCH
```

**The timezone `lst_ldt` returns, established by experiment rather than assumption.** The same
reading was requested in both zones:

```
time_zone=lst_ldt  ->  "2026-09-25 17:18"
time_zone=gmt      ->  "2026-09-26 03:18"     same v=1.864, same station
offset                 exactly -10:00
```

Confirmed against NOAA's own station metadata for 1612340: `timezone: "HAST"`,
`timezonecorr: -10`. Hawaii does not observe daylight saving, so `lst_ldt` — "local standard time
/ local daylight time" — resolves to **HST, UTC-10, year round**, with no seasonal shift to
account for. The bare `2026-09-07 20:06` in the earlier record was therefore HST, i.e.
`2026-09-08T06:06Z`. Timestamps from this endpoint are HST and should be labelled so; note that
the API returns them with no zone suffix, which is what made the earlier entry ambiguous.

#### Earthquake — event identity recorded, plus the limit and empty paths

```
endpoint   earthquake.usgs.gov/fdsnws/event/1/query?format=geojson
           latitude=20.5  longitude=-157  maxradiuskm=500
           minmagnitude=2.0  orderby=time  limit=10                  [statewide]
event id   hv75043832        network  hv  (USGS Hawaiian Volcano Observatory)
place      "10 km SE of Pāhala, Hawaii"
fields     mag 2.09   magType md   (duration magnitude, dimensionless)
obs time   2026-09-26T03:21:21.430Z
returned   10 features against limit=10 -- the limit was reached
expected   M 2.1 (dimensionless, no conversion; 2.09 rounded to one decimal),
           and the count must not read as complete
displayed  "M 2.1"  note "10 km SE of Pāhala, Hawaii · 15m ago
            · within 500 km of Hawaii · 10+ in range"                 MATCH

endpoint   same, latitude=22.0964 longitude=-159.5261 maxradiuskm=200 [kauai]
returned   0 features -- a successful fetch that genuinely found nothing
expected   verified-empty, not unavailable: an ok dot and an explicit
           statement of what was searched
displayed  "None"  note "No M2.0+ within 200 km of Kauai in 30 days"
           dot .s-dot ok                                              MATCH
```

The event is now traceable: `hv75043832` can be re-fetched from USGS and re-checked against this
record, which magnitude alone did not allow. Two further behaviours were confirmed incidentally:
the full page of results renders as **"10+ in range"** rather than as a complete count of ten, and
Kauaʻi's empty-but-successful query renders as a **verified empty** with an `ok` dot and a
statement of the radius and window — not as `unavailable`, and not as a bare "None" that a reader
could mistake for an unchecked source.

#### One observation outside this report's scope

On statewide the wind dot rendered `ok` with a 40 mph gust, while on Kauaʻi it rendered `warn` at
22 mph sustained with a 29 mph gust — so the dot's threshold appears to read sustained wind only.
That may well be intended. Flagging it as an observation for Codex rather than a finding: it was
not part of the review scope, it is not obviously wrong, and this branch changes no behaviour.

---

## 2. Concrete gaps

Ordered by what would matter most on the worst day.

### G1 — Unbounded abuse and cost vector on `/api/news` · **High** · launch blocker

No rate limiting, and **arbitrary query parameters bust the edge cache**. Each cache miss invokes
the function, which fans out to **five upstream RSS fetches**. Demonstrated against production:

```
?limit=30  MISS      ?limit=30  HIT       (caching works for repeated keys)
?limit=41  MISS      ?limit=42  MISS      ?limit=43  MISS
?zzz=1     MISS      ?zzz=2     MISS      ?zzz=3     MISS   <- unrecognised params too
```

The key space is therefore unbounded, not the 200 combinations the documented parameters imply.
Anyone can drive unlimited origin invocations.

**On CORS, which an earlier draft of this report mis-stated.** The route does send
`Access-Control-Allow-Origin: *`, but that is **not** what makes this gap exploitable, and
restricting it is **not** a fix. CORS is a browser-enforced policy governing whether *browser*
JavaScript on another origin may read a response. `curl`, a script, a server or any non-browser
client ignores it entirely: the request still reaches the function and still fans out upstream.
The invocation space is bounded only by the cache key and by the request rate. Tightening
`Access-Control-Allow-Origin` would narrow which web pages may *read* the JSON; it would not
remove a single invocation. It appears under G3 as a defence-in-depth consideration and is
deliberately absent from the mitigations below.

Consequences, in order of seriousness for this product:

1. **Availability.** Vercel Hobby has function limits. Exhausting them takes the app down — an
   emergency tool failing precisely when someone might be attacking or when traffic spikes.
2. **Upstream reputation.** Each invocation hits five news outlets from one IP. Star-Advertiser
   already 403s unfamiliar user agents; sustained volume risks being blocked, which silently
   removes the News feature.
3. **Cost**, on any paid plan.

Not remediated here. Any fix has to **bound the number of invocations**, which means acting on the
cache key and on the request rate:

1. **Normalise the cache key** — build it from the recognised parameters only, so unknown or
   surplus query parameters cannot multiply it.
2. **Restrict the parameter set** — accept `limit` from a small allowlist of values rather than any
   integer up to 100, and reject anything unrecognised.
3. **Rate-limit cache misses** per IP, since a miss is what costs an origin invocation and five
   upstream fetches.

**CORS is deliberately not on that list** — see the paragraph above. A fix that only tightened
`Access-Control-Allow-Origin` would leave this gap fully open.

### G2 — A reload while offline has nothing to serve · **Medium–High** for this product category

An earlier draft of this report claimed a dropped connection produces a blank page. That conflated
two different failures, and only one of them is real.

**Not a failure: losing connectivity in an already-open page.** The app keeps last-known-good data
and degrades honestly. Fetches fail, retained readings stay on screen with a hollow verification
dot, the alert rail keeps the retained product and adds “Showing data last verified …” with its
age, and past the stale window retained data is *withdrawn* — the surface reports “temporarily
unavailable” instead of continuing to assert a reading. This is covered by
`test/dom-behavior.test.js` §2 (retained warning plus stale note), §4 (retained reading, hollow
dot) and §5 (withdrawal past the stale window), plus strip states 6 and 7. An open page riding out
a connectivity drop is one of the better-behaved parts of this app.

**The real gap: a reload, or a first visit, while offline.** There is no service worker and no
manifest — zero occurrences of either in `index.html` — so the document itself is never cached.
Reload the tab with no connectivity and the browser has nothing to serve: the reader gets the
browser’s own offline error page. None of the graceful degradation above applies, because none of
the app’s code runs at all.

Why this still matters for this product: during a storm people close tabs, restart phones and lose
power, and reloading is exactly what a worried person does when a page looks stale. The fix is a
service worker that cache-first serves the single HTML file — which would also make the existing
stale-marking reachable in the offline case rather than unreachable.

Severity is **Medium–High** rather than High: the loss is confined to reload and cold start while
offline, not to the whole offline experience as the earlier draft implied.

### G3 — API returns link values without scheme validation · **Medium**

`api/news.js` strips tags and angle brackets from feed links but does not require `http(s)`. A
hostile or compromised feed returning `javascript:` is caught **only** by the client's
`safeUrl()`. That client protection is real and tested, so this is defence-in-depth rather than a
live hole — but the API is CORS-open and any other consumer would be unprotected, and the guard
sits in a different file from the risk.

### G4 — No error monitoring · **Medium**

Zero handlers, no reporting. A production break is discovered only if someone happens to look.
For a tool people are told to rely on, silent failure is the failure mode that matters.

### G5 — Hobby plan, no SLA · **Medium**

Deliberately deferred by the owner. Recorded here because G1 makes it load-bearing rather than
merely a cost question.

### G6 — `script-src 'unsafe-inline'` · **Low** · not yet done, *not* structural

An earlier draft called this a structural consequence of the single-file design and said removing
it means abandoning that design. **That is wrong, and it is the correction that matters most in
this section** — describing a fixable gap as an architectural necessity is how it stops being
revisited.

A single self-contained HTML file can ship without `'unsafe-inline'`. The inline code stays inline;
CSP simply has to authorise it explicitly. Two pieces of work, both compatible with one file and
no build step:

1. **The two inline `<script>` blocks** take a `'sha256-…'` hash in the CSP, or a per-response
   nonce. Hashes suit this app better: the file is static, so the digests are stable and need no
   request-time header generation.
2. **The 31 inline `onclick=` attributes** move to `addEventListener`. This is the larger half and
   it is unavoidable — a hash or a nonce does **not** authorise an inline event-handler attribute.
   Only `'unsafe-hashes'` would, and that reintroduces much of what is being removed, so the
   handlers have to move.

The accurate statement is therefore: **this build has not done that work**, not that the design
forbids it. Until it is done, `'unsafe-inline'` means CSP is not a meaningful second line of
defence against injected script and the escaping discipline carries that weight alone — which is
why the Section 1 escaping findings matter more here than they would in an app with a strict CSP.

Severity stays **Low**: no known injection path reaches it, so the cost is the absence of
defence-in-depth rather than a live hole. `AGENTS.md` already describes this fix and is worth
following — though note it still says 22 `onclick` handlers where the current file has 31.

### G7 — Upstream error strings returned to clients · **Low**

`/api/news` returns `r.reason.message` per failed feed. These are fetch-layer messages, but they
are upstream internals echoed to any caller. Low impact; trivially fixable by returning a fixed
string.

### G8 — Page weight · **Low**, rising

144 KB single file, up from 113 KB when weight was deferred. Matters on degraded mobile networks
during a disaster.

---

## 3. Not verified

Stated plainly rather than omitted, because an absent check reads as a passed one. This list is
also what bounds Section 1: the checks there were manual and surface-specific, so anything below
is a reason no finding in this report should be generalised into a property of the system.

- **No penetration test and no third-party security review.** Nothing here is an external audit.
- **Behaviour under load.** No concurrency or sustained-traffic testing. G1's practical severity
  is reasoned, not measured against a real limit.
- **End-to-end screen reader pass.** Contrast is verified arithmetically; announcement order and
  control labelling beyond the Overview reading order have not been checked with an actual screen
  reader.
- **The NWS strip at 200% zoom.** The owner confirmed navigation and control usability at 200% on
  `40fba96`, before the strip became visible. The strip's wrapping and reflow at 200% therefore
  remain unverified after three attempts in which the browser zoom did not change. The owner
  accepted this unverified gap on 2026-09-25; do not describe it as verified or re-raise it unless
  the implementation changes or the owner reopens the decision.
- **Real-device testing.** One browser on one machine. No iOS or Android verification.
- **The six bot-challenged reference destinations** from F005 remain unchecked.
- **Anthropic API failure modes.** Rate limiting, quota exhaustion and cost behaviour for a user
  supplying their own key are untested.
- **Tsunami path depends on NWS relay.** The app does not poll PTWC directly (Q001). NWS carries
  PTWC products, so coverage exists, but for the highest-stakes hazard in Hawaii that is one
  relay in the chain and it has not been verified end to end against a live tsunami product.
- **Dependency vulnerability scanning.** No `npm audit` in any workflow; low impact given zero
  runtime dependencies, but nothing is watching the dev tree either.
- **The mm-to-inches rainfall divisor against a nonzero live reading.** Checked at `null` and at a
  measured `0`, both correct, but across two hourly rounds no station reported a nonzero
  `precipitationLastHour`, so `25.4` is exercised only where every divisor agrees. Rain fell at
  three of the four stations in the second round and still measured `0`, because it was a trace
  (`P0000`) — closing this needs at least 0.01 of an inch of accumulation in the hour, not just
  rain in the hour. This is the one source-to-display gap still open and it is the same shape as
  the wind defect, so it is worth closing on the next such event rather than assumed.

---

## 4. Assessment

**On the evidence gathered here, security is not what is holding back a public launch.** That is a
judgement from the checks in Section 1, not a clean bill of health — the surfaces reviewed were
well handled, the headers are strong, the one server-side route showed no SSRF, there are no
runtime dependencies, and the four observation cards traced to source. What Section 3 lists as
unchecked is the reason this cannot be stated more strongly: no penetration test, no third-party
review, and no load testing. **A bounded manual review finding nothing is weak evidence of absence
and should not be read as clearance.**

What holds a launch back is **resilience and operability**: an unbounded abuse vector that can take
the service down (G1), a reload while offline having nothing to serve (G2), and no way to know when
the app breaks (G4).

G1 is the one I would treat as a launch blocker. It is demonstrated rather than theoretical, it is
cheap to fix, and its consequence is the app being unavailable during exactly the event it was
built for. G2 sits behind it, and lower than the earlier draft put it, because an already-open page
degrades honestly — the loss is confined to reload and cold start. G4 matters because every gap
above is discovered by someone happening to look.

**One deliberate omission:** no fix for any of this is in this branch. #21 is a report. G1
remediation is claimed and reviewed separately, and the bounding work it needs is listed under G1
itself — cache-key normalisation, a restricted parameter set and rate limiting, not CORS.
