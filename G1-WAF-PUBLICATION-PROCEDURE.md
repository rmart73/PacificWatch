# G1 — WAF procedure (owner-only)

Step-by-step for **G11** and **G12**, the last two acceptance items in
[G1-ABUSE-BOUNDING-CONTRACT.md](G1-ABUSE-BOUNDING-CONTRACT.md). Everything else in G1 is code
complete and reviewed clean.

**Every action here is the owner's.** Publishing a firewall rule, accepting the metered-pricing
acknowledgement, and generating test traffic are external actions with billing consequences. No
agent performs them, and no agent has touched Vercel project settings.

**Revision 3.** Revision 1 produced a rule that throttled production — see the incident in
[AI-HANDOFF.md](AI-HANDOFF.md). Revision 2 fixed the grouping guidance. Revision 3 adds the
safeguards from Codex's review and corrects a platform constraint that invalidated the original
sequence.

---

## What the contract requires

| ID | Requirement | Evidence |
|---|---|---|
| **G11** | One rule covering **only** the two news representations, keyed on **IP**, **fixed 60-second** window, final limit **100**, action enforcing **429** | Final dashboard rule record |
| **G12** | Enforcement observed at a temporary **5-per-60** setting **on the preview hostname**, then restored to and recorded at **100-per-60** | Controlled response record + final rule record |
| **G13** | Evidence states counters are **per region** and does not generalize to distributed attacks | Already written into the PR and board |

---

## The constraint that shapes this whole sequence

**Hobby allows exactly one WAF rate-limit rule per project.** From
[Vercel's rate-limiting docs](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting):

> | Number of rules | **1 per project** | 40 per project | 1000 per project |
>
> The Hobby limit above applies to WAF Rate Limiting rules. Hobby projects can have up to 3 total
> custom firewall rules.

The final 100-per-60 rule already occupies that slot. **You cannot add a temporary second
rate-limit rule.** Revision 1 of this document told you to do exactly that, which is wrong on this
plan.

The single rule is therefore **edited in place** into the test configuration and **edited back**
afterward. Two consequences worth stating plainly:

- **Production has no rate limit for the duration of the test.** That is unavoidable on this plan.
  Keep the window short — minutes, not hours — and restore immediately after capture.
- **Capture the final rule's configuration before editing it**, because you are about to overwrite
  the thing you will need to restore, and G11 is accepted against that record.

---

## Rule shape — the part that went wrong before

The rule must match:

```
hostname == "pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app"
  AND ( path == "/api/news" OR path == "/api/news/hazard" )
```

The form Vercel's own rule builder produces, and the one to use:

```
If   Hostname      Equals     pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app
And  Request Path  Is any of  /api/news, /api/news/hazard
```

`Is any of` puts both paths in **one** condition row, so there are no OR'd cards and no grouping
question. That is what makes this shape reliable.

**What failed before:** two separate path conditions OR'd as sibling cards, with the hostname
condition inside only the second one. Vercel ANDs conditions within a card and ORs the cards, so
`/api/news` was left unguarded and matched production.

Check any built rule against this table before publishing:

| Hostname | Path | Must match? |
|---|---|---|
| preview | `/api/news` | ✅ yes |
| preview | `/api/news/hazard` | ✅ yes |
| preview | anything else | ❌ no |
| **`pacific-watch.vercel.app`** | **`/api/news`** | ❌ **no — this is the one that broke** |
| `pacific-watch.vercel.app` | anything | ❌ no |

---

## Phase 0 — capture the current final rule

Before changing anything.

1. Open the existing rate-limit rule and **screenshot it**, or transcribe every field exactly:
   name, rule ID, each condition row, the rate-limit algorithm, window, limit, keys, and the action.
2. This is **G11 evidence** and the restore target. Do not proceed without it.

---

## Phase 1 — edit the single rule into the preview-only test configuration

1. **Edit the existing rule.** Do not create a second one.
2. Set the conditions to the `Is any of` shape above — hostname AND the two-path list.
3. Set the rate limit to:

   | Setting | Value |
   |---|---|
   | Algorithm | **Fixed Window** |
   | Window | **60 seconds** |
   | Limit | **5 requests** |
   | Keys | **IP Address** |
   | Action | **429 Too Many Requests**, enforcing |

   Any **Log** action must be off. Vercel's docs are explicit: *"The Log action will not perform any
   blocks."* A log-only rule cannot satisfy G12.

4. **Save, then Review Changes → Publish.** The rule is not live until Publish completes.
5. **Screenshot the published test rule.** Evidence item 1.

### Phase 1 gate — prove production is untouched

Run this **before generating any preview traffic**. Seven requests, because seven is above the
limit of five: if the rule is matching production at all, requests 6 and 7 return `429` and you have
found it here instead of after the test.

**Bash / Git Bash / macOS / Linux:**

```bash
for i in $(seq 1 7); do
  curl -s -o /dev/null -w "req $i -> HTTP %{http_code}\n" \
    "https://pacific-watch.vercel.app/api/news"
done
```

**Windows PowerShell:**

```powershell
1..7 | ForEach-Object {
  curl.exe -s -o NUL -w ('req ' + $_ + ' -> HTTP %{http_code}\n') `
    "https://pacific-watch.vercel.app/api/news"
}
```

**All seven must be `200`.** If any request returns `429`, **stop**: restore the rule per Phase 4,
verify recovery, and report the grouping is still wrong. Do not continue to the burst.

---

## Phase 2 — observe enforcement

### Clean window first

**Wait at least 65 seconds without touching either preview API path.** The window is fixed at 60
seconds; starting a burst inside a partially consumed window is what produced the earlier
"tripped at request 4" reading, which cannot be cleanly attributed.

### Record every request

For **each** request capture **status**, **`x-vercel-cache`**, and **`x-vercel-id`**. The
`x-vercel-id` prefix is the region, and it is the only thing that can justify an off-by-one in the
changeover. **Do not attribute an early or late trip to regions without IDs that demonstrate it.**

**Bash:**

```bash
for path in /api/news /api/news/hazard; do
  echo "=== $path ==="
  for i in $(seq 1 8); do
    curl -s -o /dev/null \
      -w "req $i -> HTTP %{http_code}  cache=%header{x-vercel-cache}  id=%header{x-vercel-id}\n" \
      "https://pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app$path"
  done
  echo "waiting 65s for a clean window"; sleep 65
done
```

**Windows PowerShell:**

```powershell
foreach ($path in '/api/news', '/api/news/hazard') {
  "=== $path ==="
  1..8 | ForEach-Object {
    curl.exe -s -o NUL `
      -w ('req ' + $_ + ' -> HTTP %{http_code}  cache=%header{x-vercel-cache}  id=%header{x-vercel-id}\n') `
      "https://pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app$path"
  }
  'waiting 65s for a clean window'; Start-Sleep -Seconds 65
}
```

**Required: at least one `429` on _each_ of the two canonical paths.** One path is not sufficient —
the rule claims to cover both representations.

### If the preview is protection-gated

Preview deployments require authentication. If unauthenticated `curl` returns `401` on every line,
or if a bypass-header run produces **no** `429`, that is **not** a failure yet: retry through the
**authenticated browser** with DevTools open, capturing the status, `x-vercel-cache` and
`x-vercel-id` columns from the Network tab. Only declare failure after the browser run also fails to
trigger.

### Rule attribution — proving the 429 came from the rule

A `429` in a response log does not by itself prove the custom rule produced it. Capture the
**Firewall live-traffic event** for these requests: Firewall overview → select your Custom Rule from
the traffic grouping drop-down → confirm the rate-limited requests appear against **that rule**.
Screenshot it. This is what separates "the rule enforced" from "something returned 429".

**Why this also establishes zero compute.** Vercel's
[request pipeline](https://vercel.com/docs/how-vercel-cdn-works) runs the Firewall layer before
routing, caching and compute, and states: *"Blocked requests never reach the routing or caching
layers."* So a WAF-generated `429` invokes no Function and performs no upstream fan-out. That is a
documented property, not an inference from response timing.

### Fail closed

**If the preview run produces no rule-generated `429`** — after both the bypass and browser
attempts — then:

1. Restore the rule per Phase 4 immediately.
2. Verify recovery per Phase 5.
3. **Stop, and report G12 as failed.**

Do **not** continue, and do **not** write it up as "a limitation of the platform" or "enforcement
could not be observed but the rule is configured correctly." A rate limit that cannot be observed
firing is exactly the thing G12 exists to catch. G12 failing is a valid, reportable outcome; G12
being quietly downgraded to a caveat is not.

---

## Phase 3 — restore immediately

Do this as soon as capture is complete, before writing anything up.

1. **Edit the same rule back** to the final configuration captured in Phase 0:
   - Remove the hostname condition.
   - Conditions: request path `Is any of` `/api/news`, `/api/news/hazard`.
   - Limit **100**, window **60 seconds**, Fixed Window, key **IP Address**, action **429**
     enforcing.
2. **Save → Review Changes → Publish.**
3. **Screenshot the restored active rule.** Evidence item 3, and the record G11 is accepted against.

---

## Phase 4 — verify recovery on both hostnames

**Wait a full 65 seconds first**, so an open rate-limit window is not mistaken for a rule that is
still live.

Then seven quick requests to **preview** `/api/news` and seven to **production**
`https://pacific-watch.vercel.app/api/news`. **All fourteen must return `200`.**

---

## Phase 5 — hand back

1. Final rule configuration from **Phase 0** — screenshot or exact field transcription.
2. Published **test** rule screenshot (Phase 1, step 5).
3. Production gate result — seven `200`s (Phase 1 gate).
4. Per-request records for **both** preview paths: status, `x-vercel-cache`, `x-vercel-id`
   (Phase 2).
5. **Firewall live-traffic screenshot** attributing the `429`s to the custom rule (Phase 2).
6. **Restored** final rule screenshot (Phase 3, step 3).
7. Recovery verification, both hostnames, fourteen `200`s (Phase 4).
8. Any label or behaviour that differed from this document.

I write it into the board as G11/G12 evidence. Codex verifies and presents the merge decision.

---

## What this does and does not buy

Stated here because the evidence should not be read as more than it is, and G13 requires it.

**Does:** closes the demonstrated single-source vector, where one client could generate unlimited
distinct cache keys against `/api/news` and force an expensive miss on each. Combined with the
query-delete transform and the origin guards, a single IP is bounded to 100 requests per minute per
region. Because the firewall runs ahead of routing, cache and compute, a refused request costs no
Function invocation and no upstream fan-out.

**Does not:** defend against a distributed attack. Counters are **per region** — Vercel's own note:
*"traffic matching a given rate limit key in multiple regions can exceed the limit you configure for
any single region"* — so an attacker spread across regions gets the allowance in each, and one
spread across many IPs is not bounded by an IP-keyed rule at all. No load testing was performed, so
the severity reduction is reasoned rather than measured.

That is a real bound on the vector actually demonstrated. It is not general DDoS protection and the
evidence should not be written up as such.
