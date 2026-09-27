# G1 — WAF publication procedure (owner-only)

This is the step-by-step for **G11** and **G12**, the last two acceptance items in
[G1-ABUSE-BOUNDING-CONTRACT.md](G1-ABUSE-BOUNDING-CONTRACT.md). Everything else in G1 is code
complete, reviewed clean, and waiting on this.

**Every action in this document is the owner's.** Publishing a firewall rule, accepting the
metered-pricing acknowledgement, and generating the test traffic are external actions with billing
consequences. No agent performs them, and no agent has touched Vercel project settings.

Written by Claude Code at Codex's request. Codex verifies the evidence afterward and then presents
the merge decision for PR #26.

---

## What the contract requires

| ID | Requirement | Evidence |
|---|---|---|
| **G11** | One rule covering **only** the two news representations, keyed on **IP**, **fixed 60-second** window, final limit **100**, action enforcing **429** | Final dashboard rule record |
| **G12** | Enforcement actually observed at a temporary **5-per-60** setting, then restored to and recorded at **100-per-60** | Controlled response record + final rule record |
| **G13** | Evidence states counters are **per region** and does not generalize to distributed attacks | Already written into the PR and board |

Two rules get built over the course of this: a **temporary test rule** scoped to the preview
hostname, and the **final production rule**. G12 exists because a rule that is configured but not
enforcing looks identical to one that works, right up to the moment it is needed.

---

## Before you start

**A note on the dashboard labels below.** I cannot see your dashboard, so treat the label text as
approximate and the *meaning* as exact. Vercel renames these controls periodically. Each step says
what the setting must do, so if a label reads differently, match the meaning and note the difference
in your record — that is useful information, not a deviation.

- Vercel → your project → **Firewall** tab. Custom rules live here.
- Rate limiting is **metered**. The first rate-limit rule you save will ask you to accept pricing.
  You have already read it and approved this step; accepting it is still yours to click.
- Have somewhere to paste terminal output and save screenshots as you go.

**Do not put the deployment protection bypass secret into anything you save or paste.** If you test
with `curl` and a bypass header, capture the *response* lines only, never the request headers. Using
a normal logged-in browser avoids the question entirely.

---

## Phase 1 — the temporary test rule (preview only)

The point is to see a `429` with your own eyes at a limit low enough to trigger by hand.

> ### ⚠ The one mistake that would reach production
>
> A rate-limit rule with **only** path conditions applies to **every hostname on the project,
> including production**. A 5-per-60 rule like that would throttle real users at five requests a
> minute during a hurricane.
>
> **The hostname condition in step 3 is what keeps this off production. Do not skip it, and confirm
> it is present before saving.**

1. **Firewall → Custom Rules → add a new rule.** Name it something obviously temporary:
   `TEMP G12 test — DELETE ME`.

2. **Path conditions.** Add a condition on the **request path**, `equals`, value `/api/news`. Add a
   second condition for `/api/news/hazard`. These two must be **OR**'d — any-of, not all-of. A rule
   requiring both paths at once matches nothing, which would look exactly like a rate limit that
   never triggers.

3. **Hostname condition — the guard rail.** Add a condition on the **hostname**, `equals`:

   ```
   pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app
   ```

   This must be **AND**'d with the path group: *(hostname is the preview) AND (path is one of the
   two)*. If the editor only offers one flat list of conditions, use whatever grouping or nesting it
   provides to get that shape, and if it genuinely cannot express it, **stop and tell me** rather
   than saving a rule that could match production.

4. **Action: rate limit.** Configure it to mean:

   | Setting | Value |
   |---|---|
   | Requests | **5** |
   | Window | **60 seconds**, fixed |
   | Key / group by | **IP address** |
   | Action when exceeded | **Deny / 429**, enforcing |

   If there is a **log-only**, **observe**, or **dry-run** toggle, it must be **off**. A log-only
   rule produces no `429` and G12 cannot be satisfied by it.

5. **Save, then publish.** Firewall changes usually need a second, explicit publish or deploy action
   after saving — a "Review changes" / "Publish" button. The rule is not live until that completes.
   Accept the metered-pricing acknowledgement when prompted.

6. **Screenshot the saved rule**, showing the conditions, the 5/60 values, the IP key, and the
   enforcing action. This is evidence item 1.

---

## Phase 2 — observe enforcement

Run the burst from a browser or a terminal, from one machine, so all requests share one source IP.

### Browser method

Open the preview URL and hold **Cmd/Ctrl-R** to reload roughly eight times in under a minute:

```
https://pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app/api/news
```

The first few loads return JSON. Once the limit trips you should get an error page or a plain
`429`. Screenshot it, and capture the status in the Network tab.

### Terminal method (cleaner evidence)

```bash
for i in $(seq 1 8); do
  curl -s -o /dev/null \
    -w "req $i -> HTTP %{http_code}  cache=%header{x-vercel-cache}\n" \
    "https://pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app/api/news"
done
```

Preview deployments are protection-gated, so unauthenticated `curl` may return `401` on every line.
If that happens, use the browser method — or add your bypass header and **capture only this output,
not the command**.

### What to expect, and what to record either way

Roughly the first five requests `200`, the rest `429`. The exact changeover can land a request
early or late — the counter is per region and your requests may not all land in the same one.
**Record what you actually saw**, including a changeover at 4 or 6. G12 asks for the enforcement
path to be observed, not for a precise off-by-one.

**One thing worth watching, and worth recording whichever way it goes:** `/api/news` is
CDN-cached, so most of these requests are served from cache without the Function running. If the
`429`s appear anyway, the firewall is counting **requests at the edge** rather than Function
invocations — which is the stronger result and exactly what G1 needs, since the abuse vector was
cheap cache-missing traffic. If instead cached requests sail through and never trip the limit, that
is a real limitation of this defense and needs to go in the record plainly. **Do not assume the
first outcome.** Report the statuses you saw.

Then confirm the second representation is covered too:

```
https://pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app/api/news/hazard
```

A few reloads should `429` on the same counter or its own — either is fine; note which.

**Capture for evidence item 2:** the request-by-request status list (or screenshots), which paths
you exercised, and the approximate wall-clock time. Wait 60+ seconds and confirm a request returns
`200` again — that shows the window resets rather than the endpoint being permanently broken.

---

## Phase 3 — reset

Do this immediately after capturing the evidence. A forgotten 5-per-60 rule is worse than no rule.

1. **Delete the `TEMP G12 test — DELETE ME` rule.** Disabling it also works, but deleting removes
   the chance of it being re-enabled by accident later.
2. **Publish** the change, the same second step as before.
3. **Confirm recovery:** reload the preview `/api/news` six or more times quickly. Every request
   should return `200` now. Capture this — it is what proves the temporary rule is gone.

---

## Phase 4 — the final production rule

Now the rule the contract actually specifies. Note two differences from the test rule: the limit is
**100**, and there is **no hostname condition** — G11 requires it to cover both representations
wherever they are served.

1. **Firewall → Custom Rules → add a new rule.** Name it for what it does, something a future
   reader understands without this document: `News API rate limit — 100/60 per IP`.

2. **Path conditions only.** Request path `equals` `/api/news`, **OR** request path `equals`
   `/api/news/hazard`. **No hostname condition this time.** No other paths — G11 says the rule
   covers *only* these two representations, so a broader pattern such as `/api/*` fails it.

3. **Action: rate limit.**

   | Setting | Value |
   |---|---|
   | Requests | **100** |
   | Window | **60 seconds**, fixed |
   | Key / group by | **IP address** |
   | Action when exceeded | **Deny / 429**, enforcing |

   Log-only **off**, again.

4. **Save and publish.**

5. **Confirm normal traffic is unaffected:** load the production site and the news card should
   populate as usual. One person browsing is nowhere near 100 requests a minute.

6. **Screenshot the final saved rule.** This is evidence item 3, and it is the record G11 is
   accepted against.

---

## Phase 5 — hand back

Give me, or paste into the board yourself:

1. **Screenshot of the temporary 5/60 rule** as configured (Phase 1, step 6).
2. **The observed response record** — statuses per request, both paths, plus the post-window `200`
   (Phase 2). Include whether cached requests counted toward the limit.
3. **Screenshot of the final 100/60 rule** (Phase 4, step 6).
4. **Confirmation the temporary rule is deleted** (Phase 3, step 3).
5. **Any label or behaviour that differed from this document** — that is worth recording, both for
   the evidence and because it means this procedure needs correcting.

I will write it into the board as G11/G12 evidence. Codex then verifies it and presents the merge
decision for PR #26.

---

## What this does and does not buy

Stated here because the evidence should not be read as more than it is, and G13 requires it.

**Does:** closes the demonstrated single-source vector, where one client could generate unlimited
distinct cache keys against `/api/news` and force an expensive miss on each. Combined with the
query-delete transform and the origin guards, a single IP is now bounded to 100 requests per minute
per region.

**Does not:** defend against a distributed attack. Vercel's counters are **per region**, so an
attacker spread across regions gets that allowance in each one, and one spread across many IPs is
not bounded by an IP-keyed rule at all. No load testing was performed, so the severity reduction is
reasoned rather than measured.

That is a real and useful bound on the vector that was actually demonstrated. It is not a claim of
general DDoS protection, and the evidence should not be written up as one.
