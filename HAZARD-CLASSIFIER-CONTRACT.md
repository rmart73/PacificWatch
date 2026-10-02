# Pacific Watch — Hazard-classifier acceptance contract

Status: **proposed for review**. This document governs a later implementation only after it is
reviewed and merged. It changes no runtime behavior by itself.

## Purpose

`/api/news/hazard` is a focused representation of locally relevant hazard reporting, not a search
result for words that sometimes occur in hazard stories. During Hurricane Nolo, roughly seven of
its thirty items were noise: ordinary crime, politics, a fund headline, a routine closure, and two
mainland weather stories. The current `HAZARD_RE` classifies a title plus summary with one broad
substring expression, so it cannot distinguish:

- `erupt` in a volcanic eruption from “gunfire erupted”;
- ocean swells from a fund that “swells”;
- a hazard warning from a political “warning sign”;
- a declared emergency from Honolulu Emergency Medical Services;
- a safety closure from a routine DMV closure; or
- a real hazard elsewhere from one that affects Hawaiʻi.

The correction must improve precision without silently deleting real Hawaiʻi hazard reporting. A
green suite is insufficient unless its fixtures can fail in both directions.

## Public meaning

An item earns `hazard: true` only when its decoded title and summary together provide both:

1. **actionable hazard evidence** — a physical hazard or a protective action associated with one;
2. **Hawaiʻi relevance** — an explicit Hawaiʻi place, jurisdiction, or authoritative local agency.

Both gates are required. A Hawaiʻi outlet is not itself locality evidence because the feeds carry
national wire copy. Conversely, a Hawaiʻi place name is not hazard evidence. The operational test
is textual co-occurrence after normalization; this is a deterministic classifier, not a claim of
natural-language understanding.

This representation is supplementary. NWS remains the authoritative alert source. The classifier
must prefer a smaller, defensible local set over filling thirty slots with remote or metaphorical
matches, while the recall fixtures below prevent that preference from becoming indiscriminate
suppression.

## Decision model

### 1. Normalize once

The classifier receives the same decoded title and summary that the response returns. It must:

- treat title and summary as one evidence record without changing their returned text;
- compare case-insensitively;
- normalize Unicode compatibility forms and Hawaiʻi apostrophe variants for matching;
- treat punctuation and hyphens as token separators; and
- match words or declared phrases, never arbitrary substrings inside longer words.

The implementation remains dependency-free. Normalization must not weaken the existing entity
decoding and tag-stripping order or create another HTML interpretation path.

### 2. Require a Hawaiʻi anchor

At least one explicit anchor is required. The initial anchor set must cover:

- the state and principal islands, including diacritic and ASCII spellings: Hawaiʻi/Hawaii,
  Oʻahu/Oahu, Maui, Kauaʻi/Kauai, Molokaʻi/Molokai, Lānaʻi/Lanai, Niʻihau/Niihau, and Big Island;
- the four county names and Honolulu;
- the common local places exercised by the acceptance corpus: Hilo, Kona, Puna, Kīlauea/Kilauea,
  Mauna Loa, Lahaina, Kahului, Līhuʻe/Lihue, Waikīkī/Waikiki, and Waiʻanae/Waianae; and
- authoritative local agencies or offices: HIEMA, Hawaiʻi Emergency Management, Hawaiʻi County
  Civil Defense, NWS Honolulu, Central Pacific Hurricane Center/CPHC, and USGS HVO/Hawaiian Volcano
  Observatory.

The anchor list is an explicit maintained vocabulary, not a substring expression. Bare `HI`, bare
`island`, a publisher name, feed URL, or the fact that an outlet is based in Hawaiʻi does not pass
the gate. A later place may be added with a fixture and rationale; silently broadening locality is
not permitted.

An explicit non-Hawaiʻi location does not cancel genuine Hawaiʻi impact. For example, a Japan
earthquake with a tsunami advisory **for Hawaiʻi** remains local. A California wildfire with no
Hawaiʻi impact does not.

### 3. Require hazard evidence

These are direct hazard concepts when matched as words or declared phrases, including ordinary
plural and inflected forms where listed by the implementation:

- hurricane; tropical storm; tsunami; earthquake or quake;
- flash flood, flooding, flood warning, or flood conditions, but not the idiom `flood of`;
- wildfire or brush fire, not generic `fire`;
- volcano/volcanic, lava, vog, or an eruption term paired with volcanic context;
- high surf, storm surge, or large/dangerous ocean swells;
- landslide, mudslide, or rockfall; and
- evacuation/evacuate when it describes a protective action.

Several old keywords are **context-dependent** and never qualify alone:

| Term | Required context | Must not qualify |
|---|---|---|
| `erupt*` | volcano/volcanic, lava, Kīlauea, Mauna Loa, or HVO context | gunfire or argument “erupted” |
| `swell*` | high/large/dangerous + ocean/surf context | a fund, crowd, or total that “swells” |
| `emergency` | state/declaration/proclamation, evacuation, disaster, or emergency shelter context | Emergency Medical Services or a routine emergency response |
| `warning`, `watch`, `advisory` | paired with a named physical hazard | political, financial, health-trend, or figurative warnings |
| `shelter` | emergency, evacuation, evacuee, disaster, or named physical-hazard context | animal shelter or housing coverage |
| `outage` | power, water, communications, cellular, or utility context | an unspecified product/service outage |
| `closed`, `closure` | never independent; the story must contain other hazard evidence | holiday, maintenance, administrative, or business closure |
| `storm` | a physical storm construction | `storm of`, `by storm`, political storm, brainstorm, or firestorm |

The implementation may express these decisions as small named pattern groups or helpers. It must
not replace the current broad expression with another opaque expression whose accepted language
cannot be reviewed against this table.

## Preserved behavior and boundaries

- `hazard` remains a boolean on every item returned by `/api/news`.
- `/api/news/hazard` uses that same decision and filters the **whole deduplicated pool before** the
  thirty-item cap. It must not independently reclassify and must not filter the already-capped mixed
  representation.
- Feed fetching, partial-feed failure behavior, deduplication, timestamps, sorting, the full
  Star-Advertiser user agent, the eight-second abort, response schema, and cache policy do not
  change.
- The two canonical query-free paths, edge query normalization, zero-fan-out origin rejection, WAF
  rule, and all G01–G18 controls remain intact.
- No runtime dependency, new serverless route, client-side fallback, or diagnostic public endpoint
  is authorized.
- This work does not rank severity, replace NWS alerts, change the News UI, or repair News
  `timeAgo()` invalid-input handling.

## Required deterministic corpus

Expected labels are written directly in the tests. They must not be generated by calling the
classifier or by reusing its pattern tables.

### Required negatives

Every implementation must keep these false, even when the text also contains a Hawaiʻi anchor:

1. “Gun sale erupted in gunfire in Honolulu.”
2. “Honolulu Emergency Medical Services responds to stabbing.”
3. “Warning sign for GOP as Hawaiʻi voters head to polls.”
4. “HI-5 fund swells after strong quarter in Hawaiʻi.”
5. “Honolulu DMV closed for holiday.”
6. “California wildfire forces thousands to evacuate.”
7. “Texas flood warning extended through Friday.”
8. “Maui nonprofit animal shelter expands capacity.”
9. “Candidate takes Oʻahu by storm.”
10. “A flood of donations reaches a Hilo food bank.”

The first seven encode the Nolo evidence: five lexical false positives and two legitimate but
non-local weather stories. The remaining cases guard the rule rather than one observed headline.

### Required positives

Every implementation must keep these true:

1. “Hurricane warning issued for Hawaiʻi County.”
2. “Tropical storm approaches the Big Island.”
3. “Flash flood warning issued for Oʻahu.”
4. “Japan quake prompts tsunami advisory for Hawaiʻi.”
5. “Kīlauea eruption sends vog across Puna.”
6. “Brush fire prompts Maui evacuation.”
7. “High surf warning for north shores of Kauaʻi.”
8. “Power outage affects Hilo residents.”
9. “Rockfall closes an Oʻahu highway.”
10. “Emergency shelter opens on Kauaʻi as storm approaches.”
11. Title “Flood warning issued”; summary “for Maui through tonight.”
12. Title “HVO update”; summary “Kīlauea lava activity continues.”

The corpus must exercise title-only, summary-only, and cross-field evidence; ASCII and diacritic
spellings; case and punctuation variation; entity-decoded text; and at least one locality that would
fail if the implementation used publisher identity instead of the content.

## Acceptance criteria

| ID | Requirement | Evidence required before implementation merge |
|---|---|---|
| H01 | One named, pure classifier is the only producer of the item-level `hazard` boolean. | Source search plus a mutation that bypasses the helper and is caught. |
| H02 | Matching uses normalized decoded title+summary and word/phrase boundaries, without changing returned text. | Controlled fixtures for case, punctuation, hyphens, entities, diacritics, and longer-word collisions. |
| H03 | Hawaiʻi relevance is mandatory and publisher/feed identity alone never satisfies it. | Same hazard wording with and without a Hawaiʻi anchor; a mutation removing the locality gate must fail. |
| H04 | The maintained locality vocabulary meets the minimum set in this contract; bare `HI` and bare `island` fail. | Table-driven positive and negative locality fixtures independent of the implementation list. |
| H05 | Direct and context-dependent hazard language follows the decision table. | Every required positive and negative passes; mutations restoring `erupt`, `swell`, `emergency`, `warning`, `closed`, or bare `outage` as substrings are caught. |
| H06 | A remote hazard remains false unless the text states Hawaiʻi impact; remote origin plus Hawaiʻi impact may pass. | California/Texas negatives and the Japan-quake/Hawaiʻi-tsunami positive. |
| H07 | Title and summary can supply complementary evidence. | Required positive 11, plus the inverse arrangement and summary-only cases. |
| H08 | Missing or empty title/summary cannot gain a label from substituted source, fetch, or current-state data. | Null/empty fixtures; no fallback to outlet name or URL. |
| H09 | `/api/news` still returns every selected item with an explicit boolean; `/api/news/hazard` contains only items classified true by the same helper. | Handler-level assertions on both entrypoints. |
| H10 | Hazard filtering still precedes sorting/capping over the full deduplicated pool. | Existing sixty-item adversarial fixture remains green. |
| H11 | No G1 protection or request-cost bound regresses. | Existing News API, DOM client-shape, and mutation suites all pass; upstream fetch counter remains five at most per canonical miss and zero for refusals. |
| H12 | Partial failures, all-feed failure, timeout cleanup, full user agent, cache policy, and response schema are unchanged. | Existing independent assertions remain green; relevant mutations remain caught. |
| H13 | Every classifier assertion is load-bearing. | Mutation cases cover locality removal, boundary loosening, each context-dependent family, a required true-positive removal, and filter/helper divergence; zero `MISSED`, `ANCHOR LOST`, or `AMBIGUOUS`. |
| H14 | The pure/API suites still run with nothing installed and runtime `dependencies` remains empty. | Empty-directory dependency-free run plus `package.json` diff. |
| H15 | The implementation is reviewed against a contemporaneous raw-feed capture, not only invented prose. | Run old and new classifiers over the same decoded five-feed pool; enumerate every changed label with title, source, old/new result, and contract rationale. Do not commit full copyrighted feed bodies. |
| H16 | Live evidence cannot hide false negatives behind a precision-only tally. | Review every item removed by the new classifier and every new/retained hazard item in the capture; unresolved items are reported individually, not averaged away. |
| H17 | Preview preserves both canonical representations and their G1 cache identity while showing the new labels. | `/api/news` remains mixed, `/api/news/hazard` is a subset by classifier truth, both paths resolve, arbitrary query variants converge, and the representations stay distinct. |
| H18 | Production verification is separate from implementation and merge. | After owner-approved merge: served code equals merged `main`; both endpoints return `200`; capture one mixed and one hazard-only response and record any ambiguous classification honestly. |

## Evidence interpretation

A live feed is perishable and cannot prove the absence of a missed hazard. H15/H16 are required to
show what changed on that feed, while the deterministic corpus and mutations carry the durable
claim. No percentage is accepted without its numerator, denominator, and reviewed item list.

If a live item is genuinely ambiguous, record it as ambiguous and decide whether the contract needs
an amendment; do not tune a keyword solely to make that day's precision number look better. If an
implementation cannot satisfy locality without dropping a required positive, stop for review rather
than weakening the gate silently.

## Implementation boundary

After this contract is accepted and merged, Claude may claim a separate implementation touching
only the classifier and named News tests, plus the coordination record. Any change to feeds,
canonical routing, WAF, response shape, client presentation, `timeAgo()`, or runtime dependencies
requires a separate claim or explicit contract amendment.
