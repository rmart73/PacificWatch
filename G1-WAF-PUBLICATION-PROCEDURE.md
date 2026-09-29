# G1 — WAF procedure (owner-only)

Step-by-step for **G11** and **G12**, the last two acceptance items in
[G1-ABUSE-BOUNDING-CONTRACT.md](G1-ABUSE-BOUNDING-CONTRACT.md). Everything else in G1 is code
complete and reviewed clean.

**Every action here is the owner's.** Publishing a firewall rule, accepting the metered-pricing
acknowledgement, and generating test traffic are external actions with billing consequences. No
agent performs them, and no agent has touched Vercel project settings.

**Revision 4.** Revision 1 produced a rule that throttled production — see the incident in
[AI-HANDOFF.md](AI-HANDOFF.md). Revision 2 fixed the grouping guidance. Revision 3 added Codex's four
safeguards and corrected a platform constraint that invalidated the original sequence. Revision 4
added the temporary removal of Deployment Protection, so that **Codex observes the `429`s
first-hand** rather than receiving them from Claude — the owner's decision, taken because the
preview evidence is the item Codex has least ability to verify independently.

**Revision 5** fixes two execution-order defects introduced by revision 4. Inserting Phase 0b and
Phase 3b shifted the phases without updating the cross-references that pointed at them, and placed
the restoration of Deployment Protection **before** a recovery check that requires the preview to
still be open. Every restoration path now restores **both** pieces of external state — the rule and
the protection — in an order where each step's precondition actually holds.

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

## Phase 0b — open the preview to Codex

Codex cannot reach the preview: without the bypass header both preview API paths return `302` to the
Vercel login wall, measured rather than assumed. Since the `429` observation is the evidence Codex is
least able to verify independently, Deployment Protection comes off for the duration of the test.

**Do this before editing the rule.** If protection cannot be removed, there is no point changing the
rate limit.

**Run Phase 0b through Phase 4b in one sitting.** Between those points the preview is public *and*
production is unprotected by the rate limit. Neither state should outlive the session that created
it, and neither is safe to leave running while attention moves elsewhere.

1. Project **Settings → Deployment Protection**. Turn off the protection covering preview
   deployments (**Vercel Authentication**, or whichever control currently gates them).
2. Save, and publish if prompted.
3. **Verify it is actually open** — this must return `200` with **no** bypass header and no browser
   login:

   ```bash
   curl -s -o /dev/null -w "preview unauthenticated -> HTTP %{http_code}\n" \
     "https://pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app/api/news"
   ```

   ```powershell
   curl.exe -s -o NUL -w ('preview unauthenticated -> HTTP %{http_code}\n') `
     "https://pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app/api/news"
   ```

   A `302` means protection is still on and Codex is still blocked.

> **While protection is off the preview is publicly readable.** It serves Hawaii news headlines and
> nothing else — no credentials, no personal data, no unreleased content beyond the two API shapes
> already visible in the open PR. The exposure is proportionate, but it is real, so **keep the window
> to minutes** and treat Phase 4b as mandatory rather than tidy-up.

**Budgets are per source IP, which is not the same as per observer.** Claude Code runs **on the
owner's machine**, so the owner's browser and Claude's `curl` leave from one public IP and share a
single 5-per-60 allowance. Codex, running elsewhere, has its own.

An earlier revision claimed three independent budgets. The 2026-09-28 run disproved it: the owner's
browser burst consumed the shared allowance, so Claude's first request to `/api/news` was already
over the limit and returned `429` from request 1. The Firewall traffic panel confirmed it — a single
ASN address accounting for 24 requests.

**So the owner and Claude must not burst the same path at the same time.** Take one path each, or
separate the bursts by a clean window. Per-region counting still applies, so record `x-vercel-id` on
every request.

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

### Phase 1 scope check — prove the rule matches ONLY the two paths

G11 requires the rule to cover *only* the two news representations. A rule that fires is not the same
as a rule that fires on the right things, and the difference is invisible in a burst against the API
paths alone.

Burst the preview **root** path, which the rule must never match:

```bash
for i in $(seq 1 8); do
  curl -s -o /dev/null -w "preview / req $i -> HTTP %{http_code}\n" \
    "https://pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app/"
done
```

**All eight must be `200`.** A `429` here means the rule is over-broad and matching the whole
hostname — which is exactly what happened on the first published attempt on 2026-09-28, where `/`
returned `429` at request 3. Correct the rule before continuing; the burst evidence would otherwise
be attributed to a rule that does not meet G11.

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

**All seven must be `200`.** If any request returns `429`, **stop** and run the full restoration
below. Do not continue to the burst.

> ### Restoration — every failure path runs this, in this order
>
> Two pieces of external state are changed by this procedure, and **both** must be put back. A
> failure path that restores only the rate limit leaves the preview publicly readable.
>
> 1. **Restore the rule** — Phase 3. Final 100-per-60, path-only, published.
> 2. **Verify recovery** — Phase 4, while protection is still off.
> 3. **Restore Deployment Protection** — Phase 4b, and confirm an unauthenticated `302`.
>
> Only then stop and report. The order matters: Phase 4's preview check requires the preview to
> still be open, so protection is restored **after** it, never before.

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

### If the preview asks for authentication

**Stop. That means Phase 0b did not take effect.**

A `302`, `401`, or any login redirect during this phase is not a condition to work around — under
this revision it is a failed precondition. Do **not** reach for the bypass header or an authenticated
browser session: the entire point of opening the preview is that **Codex observes the `429`s
unauthenticated and first-hand**, and a run that needs Claude's bypass header or the owner's login
produces exactly the second-hand evidence this arrangement exists to avoid.

Go back to Phase 0b, make the unauthenticated `200` check pass, and only then run the burst.

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

**If the preview run produces no rule-generated `429`** — with preview access confirmed open and the
rule confirmed published — then:

1. **Restore the rule** — Phase 3. Immediately.
2. **Verify recovery** — Phase 4, while protection is still off.
3. **Restore Deployment Protection** — Phase 4b, and confirm an unauthenticated `302`.
4. **Stop, and report G12 as failed.**

Steps 1 to 3 are not optional on the way to step 4. Reporting a failure while leaving the preview
public would turn one failed acceptance item into an open deployment.

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

**Protection is still off at this point, and must be.** This check requires seven *unauthenticated*
preview requests to succeed, which is impossible once protection is back on. Restoring protection
before this step — as revision 4 mistakenly did — makes the required evidence unobtainable.

**Wait a full 65 seconds first**, so an open rate-limit window is not mistaken for a rule that is
still live.

Then seven quick requests to **preview** `/api/news` and seven to **production**
`https://pacific-watch.vercel.app/api/news`. **All fourteen must return `200`.** Codex can run both
halves unauthenticated and should, since this confirms the throttle is genuinely gone rather than
merely between windows.

---

## Phase 4b — close the preview again

**Mandatory, not tidy-up, and only after Phase 4 has passed.** Restore Deployment Protection to the
setting captured before Phase 0b.

Verify it took effect — this must return `302` again with no bypass header:

```bash
curl -s -o /dev/null -w "preview unauthenticated -> HTTP %{http_code}\n" \
  "https://pacific-watch-git-claude-g1-abuse-bounding-saa-s16.vercel.app/api/news"
```

A `200` here means the preview is still public. Fix it before doing anything else.

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
8. **Protection restored**: the `302` check from Phase 4b.
9. Any label or behaviour that differed from this document.

Codex's own observations are recorded separately as its evidence, not relayed through this list.

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
