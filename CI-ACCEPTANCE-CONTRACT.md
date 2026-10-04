# CI acceptance contract

Status: **authoritative upon merge**. The original workflow implementation and required-check
promotion are complete; amendments in a merged version of this document govern any later workflow
correction. Merging an amendment does not change the workflow or branch protection and does not
authorize any `.github/` edit.

## Purpose

Pacific Watch currently relies on one agent to run the Node suites and report their results. The
final News publication-time mutation evidence was valid only after an earlier run against an
uncommitted working tree was discarded and repeated from a pristine checkout of the exact pushed
commit. Review caught that evidence error, but review is not a reproducibility mechanism.

CI must make each suite result attributable to immutable source. It verifies the repository state
that GitHub received, not an agent's working tree, previously generated output or cached verdict.
It does not replace preview or production inspection: those checks answer deployment and visual
questions that deterministic repository tests cannot.

## Decisions

### 1. Every pull request and every push to `main` runs the same three suites

The workflow triggers on `pull_request` and on `push` limited to `main`. It has three separately
named jobs:

1. dependency-free pure tests — `npm test`;
2. DOM behaviour — `npm run test:dom` after the locked dev dependency is installed;
3. mutation coverage — `npm run test:mutation` after the locked dev dependency is installed.

There are no documentation-only or path-based exemptions. The mutation job currently takes about
four minutes locally, but it has repeatedly found displaced anchors and assertions that passed for
the wrong reason. It therefore runs on every pull request, not only after merge. Once the proving
sequence below succeeds and the owner promotes the checks, **all three jobs gate pull-request
merges**. The same jobs run on `main` as post-merge evidence; a failing `main` run is a regression
to investigate, not a reason to rewrite history or conceal the result.

The workflow does not run Vercel deployment, preview capture, production smoke tests or browser
layout review, and none of those live checks becomes a required CI job under this contract.

### 2. A result names and verifies the exact commit it tested

Each job checks out the event commit it intends to test and independently verifies all of the
following before running a suite:

- the expected commit SHA is printed in the job log;
- `git rev-parse HEAD` equals that expected SHA or the job fails;
- `git status --porcelain` is empty;
- no `node_modules` directory or generated verdict from an earlier job is present.

For a pull request, the expected commit is the pull request's head SHA. For a push to `main`, it is
the push event SHA. The workflow does not substitute a local branch tip, a cached workspace or an
uncommitted tree. Each suite's raw output and job summary repeat the tested SHA beside that run's
exact assertion or mutation count. Counts are measured output, not constants in the workflow: they
may legitimately change when tests are added or removed, but a count without its commit SHA is not
accepted as reproducible evidence.

Each job gets its own clean checkout. Jobs do not pass a source tree, generated output or prior
verdict to one another.

### 3. Caches may retrieve dependencies, never evidence

A dependency cache may accelerate retrieval of the package tarballs used by `npm ci`. It must be
keyed from the lockfile through the selected Node setup and must not contain or restore:

- the repository checkout;
- `node_modules`;
- test or mutation source;
- generated mutants or output;
- logs, summaries, counts or pass/fail verdicts.

A cache hit never skips a suite. `npm ci` remains the operation that constructs the installed
development dependency tree from `package-lock.json` in the DOM and mutation jobs.

### 4. The dependency-free promise is tested before installation

The pure job never runs `npm ci`, never restores dependency content and asserts that
`node_modules` is absent before `npm test`. This is the CI proof of the runtime rule that the pure
suites work with nothing installed.

The DOM and mutation jobs start from their own clean checkouts, run `npm ci --ignore-scripts`, and
then run their named suites. Installation is for the existing `jsdom` dev dependency only. A
runtime `dependencies` key remains forbidden, and the workflow does not use globally installed
packages as a substitute for the lockfile.

### 5. Tooling, actions and the runner OS family are reviewed inputs

The implementation selects a supported Node LTS release and pins its full `major.minor.patch`
version. Floating aliases such as `node`, `lts/*`, `latest`, `22` or `22.x` are not accepted. A
Node update is an explicit reviewed diff followed by the full proving sequence.

Every GitHub Action reference is pinned to a full commit SHA, with a nearby comment naming the
human-readable release. Mutable tags alone are not accepted. Dependency installation uses the
committed lockfile and `npm ci`; the workflow does not regenerate or rewrite that lockfile.

Every GitHub-hosted job uses the explicit supported OS-family label `ubuntu-24.04`.
`ubuntu-latest` and other `*-latest` aliases are not accepted: GitHub can move them to a new OS
family without a workflow diff. Changing the explicit family is a reviewed workflow change followed
by the proving run below, just like changing Node.

This is deliberately **not called an immutable image pin**. GitHub's
[runner-image policy](https://github.com/actions/runner-images#image-releases) says hosted images
are normally updated weekly while retaining the same workflow label. The setup log's `Image`,
image `Version` and `Image Release` identify the concrete image that executed a job; proving
evidence records the image-version string for every job so weekly drift is observable and timing
changes can be compared against it. The similarly formatted runner-agent `Version` line is not a
substitute for the image version. Requiring an explicit OS family narrows unreviewed change; it does
not claim to eliminate GitHub-managed patch drift.

The pre-amendment baseline is post-#42 run `37186546315` on `87ef841`: the mutation job used
`Image: ubuntu-24.04`, image version `20260927.320.1`, and completed in 700 seconds against the
unchanged 900-second C12 ceiling. That leaves 200 seconds, or 28.6% relative to the measured run;
the later implementation measures again rather than treating this as permanent headroom.

### 6. Permissions are read-only and untrusted pull requests receive no privileged path

The workflow declares `permissions: contents: read` at workflow level and grants no write
permission to jobs. Checkout does not persist credentials. The implementation uses the ordinary
`pull_request` event, never `pull_request_target`, and it does not expose secrets, deployment
protection bypass values, environment credentials or production tokens.

The test commands need no repository mutation, API write, issue comment, deployment or artifact
publication permission. Adding any such capability requires a later contract amendment and owner
authorization; it is not an implementation detail.

### 7. CI is deterministic and offline except for locked dependency retrieval

The three suites run only against committed files and deterministic fixtures. They do not request
NWS, NOAA, USGS, RSS feeds, Vercel previews, production endpoints or any other live source. The
N16-style jsdom preview capture remains human-triggered evidence and is not part of CI.

Network access used by `npm ci` to retrieve lockfile-addressed development packages is the sole
accepted external dependency. No secret is required. A feed outage, deployment-protection change
or rotating live item count therefore cannot turn a code-identical commit red.

### 8. Timeouts and failure semantics are explicit

Every job has a finite timeout. The implementation may choose tighter values from measured proving
runs, but may not exceed these ceilings without a contract amendment:

- pure tests: 5 minutes;
- DOM behaviour: 10 minutes;
- mutation coverage: 15 minutes.

A timeout, signal, setup failure, nonzero suite exit or missing final summary fails the job. There
is no `continue-on-error`, retry that replaces the first verdict, or shell construction that masks
an earlier failing command.

The mutation job succeeds only when the harness exits zero, prints one verdict per declared case,
prints a final `X of X mutations caught` summary, and reports zero `MISSED`, zero `ANCHOR LOST` and
zero `AMBIGUOUS`. A high caught count does not offset any of those categories. A timeout or
truncated run is a failure, never a partial pass.

The harness exit code is authoritative for mutation semantics. Its existing `missed` counter covers
`MISSED`, `ANCHOR LOST` and `AMBIGUOUS` and exits nonzero for any of them, so the workflow must not
reimplement those three decisions with separate log-grep gates. It may capture the final summary to
report the count and must fail if that summary is absent, but it keeps the complete raw output and
trusts the harness exit status for the verdict. One negative probe in any of the three categories is
therefore sufficient to prove the workflow propagates the harness failure; three category-specific
workflow probes would test redundant parsing that this contract forbids.

### 9. Required-check promotion follows evidence; it is not assumed by workflow creation

The workflow lands before it becomes a required check. Its implementation PR must show all three
jobs passing from clean checkouts at the exact pushed head with no manual rerun, then an
owner-approved merge must produce all three passing again on the exact `main` merge commit. The
record includes job names, SHAs, counts and durations.

Only after those two clean runs may the owner add the three stable job names to the `main` ruleset
as required pull-request checks. That ruleset mutation is an owner action and is not authorized by
merging either this contract or the later workflow PR. A renamed or split job must prove its new
check identity before the ruleset is updated, so branch protection never points at a check that no
longer reports.

## Acceptance criteria

| ID | Required result | Required evidence |
|---|---|---|
| C01 | The workflow triggers for every pull request and every push to `main`, with no path exemption. | Workflow trigger inspection plus a PR run and, after owner-approved merge, the `main` run. |
| C02 | Pure, DOM and mutation suites are three separately named jobs, and each runs on both triggers. | Workflow inspection and three check records on the proving PR and `main`. |
| C03 | Every job prints the expected SHA, verifies `HEAD` equals it and refuses a dirty checkout before testing. | Job logs from the proving PR; temporary implementation-branch probes that supply a wrong expected SHA and create an untracked marker before the clean-state gate must each fail before any suite runs, then be removed before merge. |
| C04 | Every count is reported beside the exact tested SHA; no expected count is hardcoded as the pass condition. | Raw suite output and job summaries from the proving PR. |
| C05 | Each job starts from its own clean checkout; no job receives cached source, generated output or a prior verdict. | Workflow and cache-key inspection; job logs showing checkout and clean-state gates independently. |
| C06 | Caches, if enabled, accelerate dependency retrieval only and cannot restore `node_modules`, checkout files, mutants, output, counts or verdicts; a cache hit still runs the suite. | Workflow inspection plus one miss and one hit when practical; otherwise no cache ships in the first implementation. |
| C07 | `npm test` runs with `node_modules` absent and without any installation step in its job. | Pure-job log showing the absence check immediately before `npm test`, plus a temporary implementation-branch probe that pre-creates `node_modules` and proves the gate fails before `npm test`; remove the probe before merge. |
| C08 | DOM and mutation jobs construct dependencies with `npm ci --ignore-scripts` from the committed lockfile, then run only their named suite. | Workflow inspection and proving logs. |
| C09 | Node is pinned to one full supported-LTS semver, every Action to a full commit SHA with a release comment, and every job to the explicit `ubuntu-24.04` OS-family label; no floating Node alias, mutable Action tag or `*-latest` runner-family alias remains. The hosted image is not represented as immutable. | Exact workflow diff; resolved Node and Action versions; and each job's setup-log `Image`, image `Version` and `Image Release`. |
| C10 | Workflow and jobs have read-only repository permission, checkout credentials are not persisted, and neither secrets nor `pull_request_target` are used. | Workflow inspection and repository permission summary in the run. |
| C11 | CI has no live feed, preview, production, browser-layout or deployment dependency. | Search of workflow and invoked test paths; a proving run with no project secret configured. |
| C12 | Pure, DOM and mutation jobs have ceilings of 5, 10 and 15 minutes respectively; timeout, setup failure, missing summary or nonzero exit fails its job. | Workflow inspection plus the normal proving runs; no intentional production-branch timeout is required. |
| C13 | Mutation passes only when the harness exits zero with one verdict per case, `X of X` caught, and zero `MISSED`, `ANCHOR LOST` and `AMBIGUOUS`. The harness exit code is authoritative; the workflow does not separately grep those categories. | Complete mutation output and one implementation-branch negative probe that makes any one case `ANCHOR LOST`, `AMBIGUOUS` or `MISSED`, proves the job propagates the harness's nonzero exit, and is removed before merge. |
| C14 | No step uses `continue-on-error`, a masking shell pipeline or an automatic retry that replaces the original verdict. | Workflow inspection. |
| C15 | The implementation PR records exact job names, head SHA, counts and durations from a first-attempt green run; after merge, the same record is captured for the exact `main` SHA. | PR evidence and subsequent closeout record. |
| C16 | Required-check promotion occurs only after C15, by a separate owner action; all three stable job names then gate pull-request merges. | Owner-confirmed ruleset record after the successful `main` proving run. This does not gate the workflow PR's merge. |
| C17 | Runtime remains dependency-free: no runtime `dependencies` key is added, and no runtime, API or client file needs CI-specific code. | Package and application diff. |
| C18 | The original workflow implementation and every later `.github/` change governed by an amendment are separately claimed and owner-authorized after the governing contract text merges. | Handoff claim and commit ordering; a contract or amendment PR contains no `.github/` path. |

## Proving sequence

The implementation claim must plan these stages explicitly:

1. create the workflow on a fresh branch from updated `main`, after publishing the claim;
2. run the three jobs on the implementation PR at its exact head;
3. perform and remove the C03 wrong-SHA and dirty-tree probes, the C07 pre-created-`node_modules`
   probe and the C13 mutation-failure probe, preserving their failed check links or logs as
   evidence without leaving a broken workflow in the final head;
4. obtain one first-attempt green run at the final pushed head, with no manual rerun replacing a
   failure;
5. after the owner's merge decision, verify the three jobs again on the exact `main` merge SHA;
6. only then may the owner promote the three stable job names to required checks and record C16.

For the runner-family correction governed by the amended C09, the original four negative probes do
not repeat because no checkout, dependency or mutation-gate logic changes. Its separate,
owner-authorized implementation claim replaces all three `ubuntu-latest` labels with
`ubuntu-24.04`; its final PR head and exact merge commit must each pass all three jobs on attempt 1.
The evidence records every job's image-version string, counts and durations, compares mutation time
with the 700-second baseline above, and confirms the workflow diff contains no other change. C12's
15-minute mutation ceiling remains unchanged; changing it requires a separate evidence-backed
contract amendment.

If the hosted environment exposes an assumption the contract did not settle, implementation stops
for review rather than weakening a criterion in workflow syntax. In particular, the 15-minute
mutation ceiling is an assumption to measure on the hosted runner: exceeding it requires contract
review, not a quiet timeout increase or a partial run presented as evidence.

## Non-goals

This contract does not create a workflow, modify `.github/`, change the `main` ruleset, deploy the
application, upload artifacts, comment on pull requests, run live-source or Vercel checks, replace
human visual review, change production code or tests, add runtime dependencies, decide the remote-
branch deletion convention, distinguish active hazards from aftermath, refine visual layout, rename
the product or clean completed claim blocks from the handoff board. The C09 amendment does not edit
`.github/`, choose a different runner family, freeze GitHub's weekly hosted-image contents or raise
the C12 timeout.
