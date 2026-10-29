# G1 — WAF verification procedure (owner-authorized)

Controlled re-verification for **G11** and **G12** in
[G1-ABUSE-BOUNDING-CONTRACT.md](G1-ABUSE-BOUNDING-CONTRACT.md). G1 is already accepted; this
procedure does not authorize another run by itself. Use it only when the owner explicitly requests
a fresh WAF verification.

**Dashboard actions are the owner's.** Creating, publishing and removing a firewall rule; changing
Deployment Protection; accepting a pricing acknowledgement; and approving metered test traffic are
external actions with billing or exposure consequences. Codex may make the bounded, read-only HTTP
requests named below only after the owner authorizes that run and confirms its preconditions.

**Revision 6 — Pro-safe rule isolation.** Revision 1 accidentally throttled production. Revisions
2–5 corrected rule grouping, added authorization and evidence safeguards, opened the preview so
Codex could observe `429`s first-hand, and repaired restoration order. Revision 6 preserves those
safeguards but removes the obsolete Hobby assumption behind the remaining hazard: Pro permits
multiple rate-limit rules, so the production rule is never edited. The owner creates a separate,
hostname-scoped preview rule, and removes it after the proof.

The last dashboard verification was **2026-09-28**. That observation is historical, not a claim
about today's configuration. Phase 0 re-derives the current external state before every execution.

---

## What the contract requires

| ID | Requirement | Evidence |
|---|---|---|
| **G11** | A production rule covering **only** the two news representations, keyed on **IP**, fixed **60-second** window, final limit **100**, action enforcing **429** | Current production-rule record |
| **G12** | Enforcement observed at a temporary **5-per-60** setting on one preview hostname, without applying that threshold to production | Controlled response record + temporary-rule record + final state record |
| **G13** | Evidence states counters are **per region** and does not generalize to distributed attacks | Evidence review |

The contract's managed-verification sequence describes the original publication: the test rule was
changed into the final production rule after its preview proof. That is historical acceptance logic,
not a safe instruction to replay after the final production rule already exists. A re-verification
gets the same two kinds of evidence without mutating accepted production state: an isolated
5-per-60 preview rule proves enforcement, and dated before/after records prove the existing
production rule remained at the accepted 100-per-60 policy.

[Vercel's current rate-limiting documentation](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
lists 40 rate-limit rules per Pro project, fixed-window support, IP as an included counting key and
per-region counters. Those public limits were rechecked on **2026-10-29**. Phase 0 still verifies
the actual project plan, capacity and rules because dashboard state can change without a commit.

---

## Non-negotiable safety invariants

1. **Never edit, disable, replace or delete the production rate-limit rule during this procedure.**
2. The test rule is a new rule whose hostname equals one recorded preview hostname and whose paths
   are exactly `/api/news` and `/api/news/hazard`.
3. The owner gives fresh authorization for the specific run before any external state changes.
4. Codex observes the preview `429`s unauthenticated and first-hand. A relayed status list, bypass
   header or authenticated browser session does not substitute for that observation.
5. Every completed exit path removes the temporary rule and restores Deployment Protection.
   Cleanup is part of the procedure, not optional follow-up; a failed cleanup is an active incident,
   not a completed run.
6. If the dashboard differs from the expected production policy, stop. This procedure does not
   authorize repairing, consolidating or deleting an unexpected rule.

---

## Rule shape — the part that failed before

Let `PREVIEW_HOST` mean the exact hostname selected and recorded in Phase 0. The temporary rule
must match:

```text
hostname == PREVIEW_HOST
  AND (path == "/api/news" OR path == "/api/news/hazard")
```

Use the single-condition-list shape produced by Vercel's rule builder:

```text
If   Hostname      Equals     PREVIEW_HOST
And  Request Path  Is any of  /api/news, /api/news/hazard
```

`Is any of` keeps both paths in one condition row. All conditions in the rule must be true.

**What failed in revision 1:** two path conditions were separate OR branches, and the hostname
condition constrained only one branch. `/api/news` therefore matched production. Check the new
rule against this table before publishing:

| Hostname | Path | Temporary rule must match? |
|---|---|---|
| `PREVIEW_HOST` | `/api/news` | yes |
| `PREVIEW_HOST` | `/api/news/hazard` | yes |
| `PREVIEW_HOST` | anything else | no |
| `pacific-watch.vercel.app` | `/api/news` | **no** |
| `pacific-watch.vercel.app` | anything | **no** |

---

## Phase 0 — authorize and derive current state

Do not change a setting in this phase.

1. **Owner authorization.** Record the owner's approval for this specific session: creating and
   publishing one preview-only rate-limit rule at 5-per-60, temporarily removing preview Deployment
   Protection, generating the bounded requests below, removing the temporary rule, and restoring
   protection. If any part is not authorized, stop.
2. **Project and capacity.** In the Vercel dashboard, confirm the project serving OlaPono at
   `pacific-watch.vercel.app` is on Pro. Record the plan and the number of rate-limit rules currently
   present. Confirm there is capacity for one additional rule. If not, stop; do not remove or
   repurpose another rule.
3. **Full rate-limit inventory.** Screenshot or transcribe every current rate-limit rule's name and
   rule ID. For the production News rule, capture every field: conditions, algorithm, window, limit,
   keys and action.
4. **Production precondition.** The captured production rule must cover only request path `Is any
   of` `/api/news`, `/api/news/hazard`; use Fixed Window, 60 seconds, 100 requests, IP Address and an
   enforcing 429 action. There must be no hostname restriction on that final rule. If it is absent,
   duplicated, disabled or different, stop and report the discrepancy. **Do not correct it here.**
5. **No leftover test rule.** Confirm no rule already carries the same preview-host-and-path scope.
   If one exists, stop and investigate; do not assume it is safe to delete.
6. **Select the preview.** Choose the current preview deployment to test. Record its deployment ID,
   source commit or PR, exact hostname and the fact that both canonical News routes belong to that
   deployment. Do not reuse the old `claude-g1-abuse-bounding` hostname merely because it appears in
   historical evidence.
7. **Set the command value.** Replace the example below with the exact hostname just recorded:

   **Bash / Git Bash / macOS / Linux**

   ```bash
   PREVIEW_HOST="replace-with-the-recorded-preview-hostname"
   printf 'PREVIEW_HOST=%s\n' "$PREVIEW_HOST"
   ```

   **Windows PowerShell**

   ```powershell
   $PreviewHost = 'replace-with-the-recorded-preview-hostname'
   "PREVIEW_HOST=$PreviewHost"
   ```

   The printed value belongs in the evidence. A command run with the placeholder is invalid.
8. **Protection restore target and exposure scope.** Capture the current Deployment Protection
   setting, which deployments the control covers, and whether disabling it would expose any other
   sensitive preview. Prove that an unauthenticated request to `https://<PREVIEW_HOST>/api/news` is
   gated (`302` to the login wall in the previously verified configuration). If the selected
   preview is already public, the response differs, or disabling the control would expose something
   the owner has not approved, stop and obtain a new safety decision rather than inventing a restore
   target.
9. Choose a unique temporary rule name that identifies the preview and date, for example
   `G1 preview proof — 2026-10-29`. Record it exactly and confirm no current rule uses it.

Phase 0's inventory is G11 evidence and the final comparison target. It is not permission to mutate
the production rule.

---

## Phase 0b — open the preview to Codex

Codex cannot observe the preview response while Vercel Authentication intercepts it. The owner
temporarily opens the approved Deployment Protection scope so the selected preview's later `429`s
can be observed unauthenticated.

**Run Phase 0b through Phase 4b in one sitting.** During that interval the preview is public. The
production rate-limit rule remains active and unchanged throughout.

1. Project **Settings → Deployment Protection**. Turn off the exact protection control recorded in
   Phase 0 (Vercel Authentication in the previously verified configuration). Do not assume the
   control is scoped to only one deployment; use the exposure scope the owner approved in Phase 0.
2. Save, and publish if prompted.
3. Verify the preview is actually open with no bypass header and no browser login:

   **Bash**

   ```bash
   curl -s -o /dev/null -w "preview unauthenticated -> HTTP %{http_code}\n" \
     "https://$PREVIEW_HOST/api/news"
   ```

   **Windows PowerShell**

   ```powershell
   curl.exe -s -o NUL -w ('preview unauthenticated -> HTTP %{http_code}\n') `
     "https://$PreviewHost/api/news"
   ```

   It must return `200`. A `302` means protection is still on; stop before creating the rule.

While protection is off, every preview covered by that control is publicly readable. Phase 0 must
have established that the approved exposure contains no credentials or personal data. The exposure
is still real: keep it to minutes and treat Phase 4b as mandatory.

### Abort and restore — use on every failure path

Only perform a step whose stated precondition holds; this keeps recovery valid even if the run
stops early.

1. **If the temporary rule was published:** delete it, Review Changes and Publish. Confirm its rule
   name and ID are absent.
2. **Only if removal is confirmed and protection is off:** wait 65 seconds, then verify both preview
   News paths return `200`. This proves the temporary throttle is gone while the routes remain
   observable.
3. **If Deployment Protection was changed:** restore the exact Phase 0 setting and verify the
   unauthenticated preview request is gated again (`302` for the recorded configuration). Do this
   even if temporary-rule removal failed; closing the preview takes priority over the recovery HTTP
   check whose precondition no longer holds.
4. Re-open the rule inventory. Confirm the production rule is field-for-field identical to Phase 0
   and the temporary rule is absent.
5. Stop and report the failed phase. If the temporary rule is still present or protection is not
   restored, label that external state as an active incident and continue owner-led remediation;
   never report the run as restored or complete.

---

## Phase 1 — create a separate preview-only rule

**Create a new rule. Do not open the production rule's editor.** Use the unique name from Phase 0.

1. Add these conditions in one rule:
   - Hostname **Equals** `PREVIEW_HOST`.
   - Request Path **Is any of** `/api/news`, `/api/news/hazard`.
2. Set the rate limit:

   | Setting | Value |
   |---|---|
   | Algorithm | **Fixed Window** |
   | Window | **60 seconds** |
   | Limit | **5 requests** |
   | Keys | **IP Address** |
   | Action | **429 Too Many Requests**, enforcing |

   Any **Log** action must be off; log-only does not block and cannot satisfy G12.
3. Before saving, compare the conditions with the five-row scope table above.
4. Save, then **Review Changes → Publish**. The rule is not live until Publish completes.
5. Screenshot the published temporary rule, including its name, ID, conditions and rate settings.

### Phase 1a — prove the rule excludes unrelated preview paths

Burst the preview root, which must never match the rule:

```bash
for i in $(seq 1 8); do
  curl -s -o /dev/null -w "preview / req $i -> HTTP %{http_code}\n" \
    "https://$PREVIEW_HOST/"
done
```

```powershell
1..8 | ForEach-Object {
  curl.exe -s -o NUL -w ('preview / req ' + $_ + ' -> HTTP %{http_code}\n') `
    "https://$PreviewHost/"
}
```

All eight must be `200`. A `429` means the temporary rule is over-broad: run **Abort and restore**.

### Phase 1b — prove production is untouched

Before any preview API burst, make seven production requests. Seven exceeds the temporary limit of
five and therefore detects a hostname-scope failure without approaching the production limit of
100.

```bash
for i in $(seq 1 7); do
  curl -s -o /dev/null -w "production req $i -> HTTP %{http_code}\n" \
    "https://pacific-watch.vercel.app/api/news"
done
```

```powershell
1..7 | ForEach-Object {
  curl.exe -s -o NUL -w ('production req ' + $_ + ' -> HTTP %{http_code}\n') `
    "https://pacific-watch.vercel.app/api/news"
}
```

All seven must be `200`. Any `429` or other unexpected response fails the gate; run **Abort and
restore**. Do not diagnose or edit the production rule inside this procedure.

---

## Phase 2 — Codex observes enforcement

### Isolate the observer and window

The owner authorizes the burst, then the owner and Claude make no request to either preview News
path until Codex finishes. Claude runs on the owner's machine, so their requests share one public
source IP and one allowance. Codex has a separate source IP, but counters are also per region.

Wait at least 65 seconds without touching either preview API path before each burst. Record status,
`x-vercel-cache` and `x-vercel-id` for every request. The `x-vercel-id` prefix identifies the region;
do not attribute an off-by-one to region movement unless the captured IDs demonstrate it.

**Bash**

```bash
for path in /api/news /api/news/hazard; do
  echo "=== $path ==="
  for i in $(seq 1 8); do
    curl -s -o /dev/null \
      -w "req $i -> HTTP %{http_code}  cache=%header{x-vercel-cache}  id=%header{x-vercel-id}\n" \
      "https://$PREVIEW_HOST$path"
  done
  echo "waiting 65s for a clean window"; sleep 65
done
```

**Windows PowerShell**

```powershell
foreach ($path in '/api/news', '/api/news/hazard') {
  "=== $path ==="
  1..8 | ForEach-Object {
    curl.exe -s -o NUL `
      -w ('req ' + $_ + ' -> HTTP %{http_code}  cache=%header{x-vercel-cache}  id=%header{x-vercel-id}\n') `
      "https://$PreviewHost$path"
  }
  'waiting 65s for a clean window'; Start-Sleep -Seconds 65
}
```

For each canonical path, a clean single-region result permits requests 1–5 and returns rule-created
`429` on request 6 (requests 7–8 may also be `429`). **Codex must observe at least one `429` on each
path first-hand.** If region movement or prior traffic makes the threshold ambiguous, wait for a
clean window and repeat once. If a clean result still cannot be obtained, run **Abort and restore**
and report G12 unverified.

A `302`, `401` or login redirect means Phase 0b failed. Do not use a bypass header or authenticated
session; run **Abort and restore** and start a later session only after the unauthenticated `200`
precondition can be met.

### Attribute the 429 to the temporary rule

The owner opens Firewall live traffic, groups or filters by the temporary rule, and confirms the
captured requests appear as rate-limited by that exact rule. Screenshot the rule name/ID and events.
A response status alone does not prove which control produced it.

Vercel's [request-pipeline documentation](https://vercel.com/docs/how-vercel-cdn-works) states that
blocked WAF requests do not reach routing or caching. The attributed rule event is therefore the
evidence that the refused requests invoked no Function and caused no upstream fan-out; timing is not
accepted as a substitute.

If no request can be attributed to the temporary rule, run **Abort and restore** and report G12 as
failed. Do not downgrade the failure to a platform caveat or leave the rule published.

---

## Phase 3 — remove the temporary rule immediately

Do this as soon as Phase 2 capture finishes, before writing the result.

1. Delete the temporary rule by the exact name and ID captured in Phase 1. **Do not edit the
   production rule.**
2. **Review Changes → Publish.** Removal is not live until Publish completes.
3. Refresh the rule inventory and confirm the temporary name and ID are absent.
4. Screenshot the inventory showing the production rule still present and the temporary rule gone.

If deletion or publication fails, do not continue as though cleanup succeeded. Use **Abort and
restore**: skip the HTTP recovery check whose removal precondition failed, restore Deployment
Protection immediately, and report the preview rule as live until the dashboard proves otherwise.

---

## Phase 4 — verify recovery and unchanged production

Protection is still off and must remain off until this phase finishes.

1. Wait 65 seconds so the removed rule's last fixed window cannot be mistaken for current state.
2. Make seven unauthenticated requests to preview `/api/news` and seven to production `/api/news`.
   All fourteen must return `200`. Codex observes both halves first-hand.
3. Repeat once for preview `/api/news/hazard`; it must return `200`.
4. Compare the production rule field-for-field with the Phase 0 capture. Its name, rule ID,
   conditions, algorithm, window, limit, key and action must be unchanged.
5. Confirm once more that the temporary rule name and ID are absent.

Any failure runs **Abort and restore**. A different production rule is a discrepancy to report, not
permission to edit it.

---

## Phase 4b — restore Deployment Protection

Restore the exact protection setting captured in Phase 0. Save and publish if prompted.

Verify the unauthenticated request is gated again:

```bash
curl -s -o /dev/null -w "preview unauthenticated -> HTTP %{http_code}\n" \
  "https://$PREVIEW_HOST/api/news"
```

```powershell
curl.exe -s -o NUL -w ('preview unauthenticated -> HTTP %{http_code}\n') `
  "https://$PreviewHost/api/news"
```

It must return the Phase 0 result (`302` for the required starting configuration). A `200` means the
preview is still public. Fix that before doing anything else and do not report the run complete.

---

## Phase 5 — evidence hand-back

The owner provides:

1. The explicit authorization record for this run.
2. Phase 0's dated project-plan, rule-count and complete rule inventory.
3. The production rule's exact pre-run fields.
4. The selected preview deployment ID, source revision and exact hostname.
5. Deployment Protection before and after, including the opening `200` and restored `302`.
6. The published temporary rule screenshot with name, ID, hostname/path scope and 5-per-60 policy.
7. The root-path scope check and seven-request production gate.
8. Codex's per-request records for both preview News paths: status, `x-vercel-cache` and
   `x-vercel-id`.
9. The live-traffic screenshot attributing the `429`s to the temporary rule.
10. The published-removal record and final inventory proving that rule is absent.
11. Recovery responses and the field-for-field proof that the production rule never changed.
12. Any dashboard label, response or behaviour that differed from this procedure.

Codex records its own HTTP observations separately rather than accepting a relay. The handoff must
distinguish configuration screenshots, Codex's response evidence and the owner's dashboard
attribution; none substitutes for another.

---

## What this does and does not buy

**Does:** re-demonstrates the managed control against the single-source vector, where one client
could generate unlimited distinct cache keys against `/api/news` and force an expensive miss on
each. Combined with query normalization and origin guards, the accepted final policy bounds one IP
to 100 requests per minute per region. An attributed WAF refusal reaches no Function and causes no
upstream fan-out.

**Does not:** defend against a distributed attack. Counters are **per region**, so traffic for one
key in multiple regions can exceed the configured limit in aggregate; many source IPs also receive
independent allowances. No load or penetration test is performed. The evidence must not be reported
as global DDoS protection.

The procedure verifies a narrow, already accepted bound. It does not authorize changing that bound,
repairing unexpected dashboard state or leaving a temporary public preview or rule behind.
