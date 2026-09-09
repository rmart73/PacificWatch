# Pacific Watch — security and launch-readiness review

**Reviewed:** 2026-09-08 · **Head:** `3f5a885` · **Reviewer:** Claude Code · **Status:** report only, no remediation

Scope set by Codex: API routes; secrets and browser storage; untrusted-content handling;
dependencies; deployment configuration; abuse and cost controls; and source-to-display accuracy
across the observation cards.

**This is not a clearance.** Findings are separated into what was verified, what is a concrete
gap, and what was not checked at all. A passing test suite and a 200 response are evidence about
specific behaviours, not about security posture, and neither is offered here as the latter. No
penetration test was performed and no third party has reviewed this.

The app is **already deployed and publicly reachable**. The question this answers is not whether
to deploy, but whether to invite people to depend on it.

---

## 1. Verified protections

Each was checked against the running code or live production, not recalled from documentation.

| Area | Finding | How it was checked |
|---|---|---|
| **SSRF** | Not present. `api/news.js` fetches only a hardcoded five-feed allowlist. The only user input is `limit` (parsed, clamped to 100) and `hazard` (strict `=== '1'`). No user-controlled value reaches `fetch()` | Read the full function; traced every `fetch()` argument to its source |
| **XSS — rendering** | All 19 `innerHTML` assignments that interpolate data were enumerated. Every string value passes through `esc()` or `safeUrl()`. The five that do not are `Math.round()`, `.toFixed()` or a length subtraction — numbers, not strings | Scripted enumeration of every `${...}` inside an `innerHTML` assignment, then manual trace of each exception to its derivation |
| **XSS — feed decoding** | `decode()` decodes entities **before** stripping tags, repeats stripping until stable, then removes residual angle brackets. Encoded markup cannot be reconstituted after the strip | Read; ordering matches the documented load-bearing rule |
| **XSS — live payloads** | `onerror` in an event name and `<script>` in an area name create no elements and execute nothing; a `javascript:` news link is neutralised | DOM suite §26 with real payloads |
| **Transport / framing** | HSTS `max-age=63072000; includeSubDomains; preload`; `X-Frame-Options: DENY`; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'none'`; `form-action 'none'`; `nosniff` | `curl -I` against production |
| **Network egress** | CSP `connect-src` restricts the browser to the five data APIs plus `api.anthropic.com`. An exfiltration attempt to any other host is blocked by the browser | Read from the live response header |
| **Secrets** | None committed across 52 commits. The `sk-ant-` occurrences are placeholder text and a last-four display | Repo-wide pattern scan over full history |
| **Supply chain** | Zero runtime dependencies. 63 packages in the lockfile are dev-only (jsdom) and none reach the browser | `package.json` + lockfile inspection |
| **Browser storage** | Three keys: `pw_theme`, `pw_news_sources`, `pw_api_key`. Only the key is sensitive; it is the user's own, never sent anywhere but Anthropic, and removable in Settings | Enumerated every `localStorage` call |
| **Upstream isolation** | Per-feed 8s `AbortController` timeout; `Promise.allSettled` so one failing outlet cannot fail the response | Read |
| **Source-to-display** | All four observation cards trace to their source. Recorded below | Live fetch rendered through the production page; expectations from published constants, cross-checked against the station METAR |

### Source-to-display record

Per the rule in `AGENTS.md`. Expectations computed from published constants, never from the
page's own transform.

```
WIND    raw 66.6 wmoUnit:km_h-1   obs 2026-09-08T04:53:00Z
        expected 41 mph  (km/h x 0.621371; sustained null, so gust shown and labelled)
        displayed 41 mph                                            MATCH
        independent cross-check: METAR PHNL 080453Z 11023G36KT -> 36 kt x 1.150779 = 41 mph

RAIN    raw null wmoUnit:mm       obs 2026-09-08T04:53:00Z
        expected withheld (null is missing data, not a measured zero)
        displayed "—" / "Not reported"                              MATCH

TIDE    raw 0.781 ft MLLW         obs 2026-09-07 20:06
        expected 0.8 ft (NOAA returns feet; datum requested explicitly, no conversion)
        displayed 0.8 ft                                            MATCH

QUAKE   raw 2.01 moment magnitude obs 2026-09-08T01:42:03Z
        expected M 2.0 (dimensionless, passes through unconverted)
        displayed M 2.0                                             MATCH
```

---

## 2. Concrete gaps

Ordered by what would matter most on the worst day.

### G1 — Unbounded abuse and cost vector on `/api/news` · **High** · launch blocker

`Access-Control-Allow-Origin: *`, no rate limiting, and **arbitrary query parameters bust the
edge cache**. Each cache miss invokes the function, which fans out to **five upstream RSS
fetches**. Demonstrated against production:

```
?limit=30  MISS      ?limit=30  HIT       (caching works for repeated keys)
?limit=41  MISS      ?limit=42  MISS      ?limit=43  MISS
?zzz=1     MISS      ?zzz=2     MISS      ?zzz=3     MISS   <- unrecognised params too
```

The key space is therefore unbounded, not the 200 combinations the documented parameters imply.
Anyone, from any origin, can drive unlimited origin invocations.

Consequences, in order of seriousness for this product:

1. **Availability.** Vercel Hobby has function limits. Exhausting them takes the app down — an
   emergency tool failing precisely when someone might be attacking or when traffic spikes.
2. **Upstream reputation.** Each invocation hits five news outlets from one IP. Star-Advertiser
   already 403s unfamiliar user agents; sustained volume risks being blocked, which silently
   removes the News feature.
3. **Cost**, on any paid plan.

Not remediated here. Fixes worth considering: ignore unrecognised parameters when building the
cache key or normalise the URL before caching; cap `limit` to a small set of allowed values;
restrict CORS to the app's own origin; and add basic rate limiting.

### G2 — No offline capability · **High** for this product category

No service worker, no manifest. A dropped connection produces a blank page rather than
last-known-good data. Connectivity failure is a defining condition of the emergency this app
exists for, and the app already tracks precisely how stale each source is, so it has the
information needed to serve cached data honestly.

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

### G6 — `script-src 'unsafe-inline'` · **Low**, structural

Required by the single-file inline architecture. It materially weakens what CSP contributes
against XSS, so the escaping discipline is carrying that weight alone. A documented trade-off,
not an oversight; removing it means abandoning the single-file design.

### G7 — Upstream error strings returned to clients · **Low**

`/api/news` returns `r.reason.message` per failed feed. These are fetch-layer messages, but they
are upstream internals echoed to any caller. Low impact; trivially fixable by returning a fixed
string.

### G8 — Page weight · **Low**, rising

144 KB single file, up from 113 KB when weight was deferred. Matters on degraded mobile networks
during a disaster.

---

## 3. Not verified

Stated plainly rather than omitted, because an absent check reads as a passed one.

- **No penetration test and no third-party security review.** Nothing here is an external audit.
- **Behaviour under load.** No concurrency or sustained-traffic testing. G1's practical severity
  is reasoned, not measured against a real limit.
- **End-to-end screen reader pass.** Contrast is verified arithmetically and 200% zoom usability
  was confirmed by the owner in a browser; announcement order and control labelling beyond the
  Overview reading order have not been checked with an actual screen reader.
- **Real-device testing.** One browser on one machine. No iOS or Android verification.
- **The six bot-challenged reference destinations** from F005 remain unchecked.
- **Anthropic API failure modes.** Rate limiting, quota exhaustion and cost behaviour for a user
  supplying their own key are untested.
- **Tsunami path depends on NWS relay.** The app does not poll PTWC directly (Q001). NWS carries
  PTWC products, so coverage exists, but for the highest-stakes hazard in Hawaii that is one
  relay in the chain and it has not been verified end to end against a live tsunami product.
- **Dependency vulnerability scanning.** No `npm audit` in any workflow; low impact given zero
  runtime dependencies, but nothing is watching the dev tree either.

---

## 4. Assessment

**Security is not what is holding back a public launch.** The injection surfaces are genuinely
well handled, the headers are strong, there is no SSRF, there are no runtime dependencies, and
every observation card traces to its source.

What holds it back is **resilience and operability**: an unbounded abuse vector that can take the
service down (G1), no offline behaviour on the day the network fails (G2), and no way to know
when it breaks (G4).

G1 is the one I would treat as a launch blocker. It is demonstrated rather than theoretical, it
is cheap to fix, and its consequence is the app being unavailable during exactly the event it was
built for.
