# Pacific Watch — G1 Abuse and Cost Bounding Contract

Status: **proposed for review**. Owner-authorized 2026-09-26 under the sequence
**G1 → observation Stage 2 → Stage 3**. This document settles G1 before implementation.

## Purpose

`/api/news` exists because five outlet RSS feeds do not permit direct browser access. A cache miss
therefore invokes one Vercel Function and fans out to five upstream requests. The launch-readiness
review demonstrated that arbitrary query strings create distinct CDN keys: recognised values such
as `?limit=41`, `?limit=42` and `?limit=43`, and ignored values such as `?zzz=1`, `?zzz=2` and
`?zzz=3`, were all misses. One caller can consequently multiply function invocations and upstream
traffic without bound by changing a meaningless parameter.

G1 is closed only when the **expensive request space** is finite and ordinary request rate is
bounded before application compute. The implementation uses three layers together:

1. two canonical public representations, with no caller-selected item count;
2. routing and handler validation that prevent surplus input from creating upstream fan-out; and
3. managed Vercel WAF rate limiting before the Function.

No single layer is offered as the whole fix. In particular, handler validation alone still permits
unbounded Function invocations, while rate limiting alone leaves every permitted request able to
fan out upstream.

## Decisions

### 1. The public request space has exactly two representations

The application has exactly two public News URLs:

- `/api/news` — all headlines, capped at **30**; and
- `/api/news/hazard` — hazard-filtered headlines, capped at **30**.

Both are query-free. The current free-form `limit` and `hazard` parameters are removed from the
public contract. No caller can select 31, 41, 100 or another item count, and hazard selection is a
path with one meaning rather than an arbitrary string. Internal routing may map both paths to shared
code, but the browser-visible URLs and CDN identities remain exactly these two representations.

The implementation PR must name the final two URLs and update `index.html` to use them. It must not
add another independent RSS implementation: both representations share the existing feed list,
parser, user agent, timeout, deduplication and response construction.

### 2. Surplus input is normalized before cache lookup or rejected before fan-out

The preferred design uses Vercel routing/query transforms or an equivalent pre-Function mechanism
to remove irrelevant query data before the CDN chooses a key. Official Vercel configuration supports
request-query transforms, and Vercel documents CDN keys as including the URL path and query
parameters. This contract does not assume that a proposed transform works merely because it builds:
preview evidence below must demonstrate convergence to the canonical cache entry.

Defence in depth remains in the handler. If any unknown key, duplicate key, invalid value or
non-canonical request reaches application code, it must be rejected or redirected **before**
`FEEDS.map(fetchFeed)`. It must not perform even one upstream request. Rejections carry `no-store`
and a bounded JSON error; they do not echo raw input.

If preview evidence shows that the chosen routing method does not normalize the cache identity,
implementation stops and returns for a contract amendment. A `400` produced only after an
arbitrary cache miss is useful upstream protection, but it does not satisfy canonical cache
behaviour by itself.

### 3. Managed WAF rate limiting supplies shared state

No in-process counter is accepted. Serverless instances are not a shared, durable enforcement
point, so such a counter can raise an attacker's cost but cannot establish the claimed bound.

No Vercel KV, Redis, Upstash, SDK or runtime dependency is added. The project's dependency-free
runtime rule remains intact.

The rate limiter is a Vercel WAF custom rule with this final policy:

- request path matches exactly `/api/news` and `/api/news/hazard`, and no unrelated route;
- fixed window: **60 seconds**;
- limit: **100 requests**;
- counting key: **IP**;
- enforcement action: **429 / rate limit**, not log-only;
- applies to production, with preview verification where the project rule permits it.

This threshold is intentionally far above normal application behaviour: a page fetches News on
load or filter change and on the five-minute refresh cycle, while even a shared network receives a
hundred requests per minute before enforcement. The code-level finite-key and no-fan-out rules do
the expensive-work bounding; WAF bounds repeated Function access from one source.

Official Vercel documentation currently states that WAF rate limiting is available on Hobby, with
one rate-limit rule per project, IP and JA4 counting keys, fixed windows from 10 seconds to 10
minutes, and 1,000,000 included allowed requests. It also states that counters are **per region**,
so traffic reaching multiple regions can exceed a single configured limit. The acceptance claim is
therefore precise: this closes the demonstrated single-source arbitrary-key vector and establishes
a per-IP, per-region bound. It is not a claim of global DDoS immunity.

Publishing the WAF rule is external project state, takes effect independently of a Git deploy, and
requires accepting Vercel's rate-limiting pricing acknowledgement. The owner must explicitly
authorize that action during the implementation phase. If the feature is unavailable on the
actual project or the owner declines the pricing acknowledgement, G1 remains open; neither an
in-process substitute nor a dependency exception may be introduced silently.

### 4. CORS earns no G1 acceptance credit

CORS is enforced by browsers when JavaScript tries to read a cross-origin response. It does not
stop `curl`, a script, a server or another non-browser client from invoking the route. Tightening
`Access-Control-Allow-Origin` would not remove a Function invocation or an upstream fetch and is
not part of the G1 bound. Any later CORS change belongs to G3 defence-in-depth work and must be
reviewed on that basis.

## Behaviour that must remain intact

- The Star-Advertiser request keeps the full browser-like user agent; a bare `Mozilla/5.0` is known
  to receive a 403.
- One failed or timed-out feed does not fail the whole response. Successful feeds still return and
  the failed source is represented in `errors[]`.
- All five feeds failing returns the existing bounded failure response and does not claim current
  headlines.
- Each feed retains its eight-second abort timeout.
- Entity decoding, tag stripping, output shape, deduplication, chronological sort and the hazard
  keyword model remain unchanged unless the implementation claim explicitly names and justifies a
  necessary adjustment.
- Successful canonical responses retain edge caching with a five-minute fresh period and the
  existing stale-while-revalidate window. Rejections and method errors are not cached.
- `OPTIONS` performs no upstream work. Unsupported methods return `405` with an `Allow` header and
  perform no upstream work.
- Production remains dependency-free. `package.json` gains no runtime dependency, and the pure
  suites still run with nothing installed.

## Verification model

### Local, deterministic tests

Tests stub `fetch` and count upstream calls. Expected values are written independently rather than
computed through production helpers.

- Each canonical representation makes at most five upstream attempts on a miss.
- The all-headlines representation returns at most 30 items.
- The hazard representation returns at most 30 items and every returned fixture matches the
  independently defined hazard expectation.
- Unknown keys, duplicate keys, invalid values and legacy `limit` variants perform **zero**
  upstream attempts when they reach the handler.
- `OPTIONS` and every unsupported method perform zero upstream attempts.
- One feed failure still returns the other feeds and identifies the failed source.
- Five feed failures retain the existing failure semantics.
- The Star-Advertiser fixture asserts the complete required user agent, not merely that some user
  agent exists.
- Mutations that restore caller-controlled limits, permit an unknown parameter to reach fan-out,
  bypass canonical selection, remove the method guard, or weaken partial-feed behaviour are caught.

### Preview: prove the CDN identity, not only the handler

On a fresh preview deployment, capture status, `x-vercel-cache`, response body `updated`, canonical
URL and request URL for both representations.

For each representation:

1. request the canonical URL and establish its cache entry;
2. request at least three variants carrying distinct random unknown parameters;
3. request duplicate, reordered and legacy `limit` parameters; and
4. request the canonical URL again.

The variants must not create new expensive cache identities. Evidence must show that they converge
to the canonical response before Function fan-out—for example, the canonical warm response remains
a cache hit with the same `updated` value and the variants do not produce independent misses. The
all-headlines and hazard representations must remain distinct from each other.

An HTTP 200 alone is not evidence. If `x-vercel-cache` or the response record is ambiguous, use
Vercel request/function logs to establish whether the Function ran. If the result still cannot be
proved, record it as unverified and do not merge the implementation.

### Managed rate-limit verification

The implementation PR records the intended WAF rule exactly, but publishing it requires the
owner's separate authorization because it changes external project state and presents a pricing
acknowledgement.

After authorization, verify with a controlled test that avoids 101 production requests:

1. scope the rule to the unique preview hostname and both news paths, then publish it temporarily at
   **5 requests per 60 seconds**; never apply the five-request test threshold to production;
2. from one source and region, confirm permitted responses through the fifth request and `429` on
   the sixth, with no upstream fan-out after enforcement;
3. wait for the window to reset;
4. change the condition from the preview hostname to the production project paths and the limit to
   the final **100 requests per 60 seconds**, then publish;
5. capture the final dashboard rule and one permitted request; and
6. record the official per-region limitation beside the result.

If the Hobby rule builder cannot isolate the preview hostname, stop and obtain a revised test plan
and explicit owner approval; do not test a five-request threshold against production. The temporary
setting must not be left active. A screenshot alone proves configuration, not enforcement; response
evidence and the final rule record are both required.

### Production smoke check

After merge and final WAF publication:

- both canonical representations return the expected bounded shapes;
- a random surplus query cannot trigger an independent expensive cache identity;
- partial-feed behaviour remains honest if a source is failing at the time;
- the final WAF rule is active at 100 requests per 60 seconds per IP;
- the deployed `api/news` implementation and configuration are content-identical to merged `main`;
  and
- no load test, penetration test or global/distributed-rate claim is inferred from this smoke check.

## Acceptance criteria

| ID | Required result | Evidence |
|---|---|---|
| G01 | The public News API has exactly two canonical representations: all and hazard, each fixed at 30 items | Source inspection + handler tests |
| G02 | The browser calls only the two canonical representations and sends no caller-selected limit | `index.html` source assertion + DOM fetch capture |
| G03 | Random unknown query strings converge to the appropriate canonical CDN identity rather than creating independent expensive misses | Fresh-preview header/body record + Function logs if needed |
| G04 | Unknown, duplicate, invalid and legacy parameter shapes that reach the handler perform zero upstream attempts | Fetch-counter tests |
| G05 | A canonical miss performs no more than five upstream attempts | Fetch-counter tests |
| G06 | `OPTIONS` and unsupported methods perform zero upstream attempts; unsupported methods return `405` with `Allow` | Handler tests |
| G07 | One upstream failure preserves successful feeds and reports the failed source; five failures retain honest failure semantics | Independent mixed/all-failure fixtures |
| G08 | Star-Advertiser retains the full browser-like user agent and every feed retains the eight-second abort path | Header/timer assertions + mutation cases |
| G09 | Successful canonical responses keep 300-second edge freshness and 900-second stale-while-revalidate; rejected requests are `no-store` | Header assertions + preview headers |
| G10 | No runtime dependency, datastore or in-process limiter is added | `package.json` diff + source search |
| G11 | A Vercel WAF rule covers only both news representations, uses IP, fixed 60 seconds, final limit 100 and enforcing `429` | Final dashboard rule record |
| G12 | The WAF enforcement path is observed at a temporary 5-per-60 setting, then restored to and recorded at 100-per-60 | Controlled response record + final rule record |
| G13 | Evidence states that WAF counters are per region and does not generalize the result to distributed attacks | PR/handoff evidence review |
| G14 | CORS is not changed or cited as an abuse control | Diff + PR description |
| G15 | Preview and production evidence distinguish deploy, cache, Function execution and WAF enforcement rather than treating HTTP 200 as proof of all four | Evidence review |
| G16 | The implementation claim names every changed route, function, test and external WAF action before work begins | `AI-HANDOFF.md` claim review |

## Implementation boundary and ownership

This contract PR changes documentation only. It does not modify the Function, client, routing,
tests, dependencies or Vercel project settings.

After this contract is reviewed, accepted and merged:

1. Claude claims G1 implementation on a fresh branch from updated `main`, naming `api/news.js`,
   the chosen canonical routing/configuration, the one client fetch site, test files and the planned
   WAF action.
2. Code and preview evidence land before any production merge.
3. The owner separately authorizes publishing the WAF rule and accepting its pricing dialogue.
4. Codex reviews code and evidence; the owner decides the production merge.
5. G1 is closed only after production and the final WAF state are verified.

If canonical cache convergence or managed enforcement cannot be demonstrated on the actual Hobby
project, implementation pauses and the contract is amended. Stage 2 does not begin while G1 remains
the declared launch blocker.

## Primary platform sources checked 2026-09-26

- [Vercel WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
- [Vercel CDN cache](https://vercel.com/docs/caching/cdn-cache)
- [Vercel Cache-Control headers](https://vercel.com/docs/caching/cache-control-headers)
- [Vercel project configuration and request transforms](https://vercel.com/docs/project-configuration/vercel-json)
