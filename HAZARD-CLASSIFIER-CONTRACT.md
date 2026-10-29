# Pacific Watch — Hazard-classifier acceptance contract

Status: **accepted and authoritative at H01–H18**, merged as #32 in `1b3c822` after Claude's
read-only review (three rounds: the circular locality vocabulary, the `dependencies` wording, and
the bare `Ocean View` collision) and the owner's merge decision. H19–H24 are the event-assertion
amendment and govern the next implementation after this amendment is reviewed and merged.

It merged still reading "proposed for review" — the fourth contract in this project to do so — and
was corrected by the first claim that followed it. A status line describing a document's own
lifecycle goes stale at exactly the moment it matters, because merging is not an event that edits
the line saying the document is unmerged.

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

An item earns `hazard: true` only when its decoded title and summary together provide all three:

1. **actionable hazard evidence** — a physical hazard or a protective action associated with one;
2. **Hawaiʻi relevance** — an explicit Hawaiʻi place, jurisdiction, or authoritative local agency;
3. **an asserted event or ongoing operational impact** — the text says that the hazard is
   occurring, expected, newly observed, or still causing a protective action or direct
   public-safety disruption.

All three gates are required. A Hawaiʻi outlet is not itself locality evidence because the feeds
carry national wire copy. Conversely, a Hawaiʻi place name is not hazard evidence, and the
publication time does not make a historical mention current. The operational test is deterministic
textual evidence after normalization; it is not a claim of general natural-language understanding.

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

At least one explicit anchor is required. The initial anchor set is not allowed to be invented from
the acceptance corpus alone. It must be seeded from all three of these sources:

1. the stable jurisdiction, island and agency names below;
2. the recorded Nolo operational cases, including the Olowalu evacuation; and
3. a decoded five-feed capture whose item publication dates span at least three calendar days.
   Use every item available in the captured feeds, not the capped API response. If one capture does
   not span three dates, collect further daily captures until it does.

The implementation evidence records which anchors came from which source. A synthetic fixture may
test an anchor, but it may not be offered as evidence that the vocabulary covers real feed language.

The initial anchor set must cover at minimum:

- the state and principal islands, including diacritic and ASCII spellings: Hawaiʻi/Hawaii,
  Oʻahu/Oahu, Maui, Kauaʻi/Kauai, Molokaʻi/Molokai, Lānaʻi/Lanai, Niʻihau/Niihau, and Big Island;
- the four county names and Honolulu;
- common places already present in the contract and production evidence: Hilo, Kona, Puna,
  Kīlauea/Kilauea, Mauna Loa, Lahaina, Kahului, Līhuʻe/Lihue, Waikīkī/Waikiki,
  Waiʻanae/Waianae, Poʻipū/Poipu, Pearl City and Kalaupapa;
- the real feed locations that exposed the original vocabulary gap: Olowalu, Honoapiʻilani/
  Honoapiilani, Kīhei/Kihei, Waiawa, Waimānalo/Waimanalo and Kailua; and
- authoritative local agencies or offices: HIEMA, Hawaiʻi Emergency Management, Hawaiʻi County
  Civil Defense, NWS Honolulu, Central Pacific Hurricane Center/CPHC, and USGS HVO/Hawaiian Volcano
  Observatory.

The anchor list is an explicit maintained vocabulary, not a substring expression. Bare `HI`, bare
`island`, a publisher name, feed URL, or the fact that an outlet is based in Hawaiʻi does not pass
the gate. A later place may be added with a fixture and rationale; silently broadening locality is
not permitted.

A place name that is also common generic English is not safe as a bare anchor. It requires a
disambiguating Hawaiʻi qualifier in the same record. **Ocean View is intentionally absent from the
minimum set** for this reason: it may mean the Kaʻū community, but it is also routine property and
tourism language. It may be added only as a qualified construction such as `Ocean View, Hawaii`,
`Ocean View subdivision`, or `Ocean View` paired with Kaʻū/Big Island context, with negative
fixtures proving that decorative “ocean view” copy does not pass.

The list remains maintained rather than presumed complete. During implementation, every item with
hazard evidence that fails only the locality gate is a **vocabulary-review item**, not a precision
win. Before merge it must resolve to one of: a proved Hawaiʻi place added with an independent
fixture; a proved non-Hawaiʻi item; or an explicitly unresolved blocker returned for contract
review. “Not in the list” is never accepted as evidence that a place is remote.

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

### 4. Require an asserted event or ongoing operational impact

Hazard vocabulary answers *what subject is mentioned*; it does not answer *what the record claims
is happening*. The third gate is satisfied only when the title and summary assert at least one of:

- onset, approach, forecast, observation, continuation or escalation of a physical hazard;
- an alert, evacuation, emergency declaration, shelter or other protective action that is issued,
  open, ordered or remains in effect; or
- a direct operational consequence that remains active for the public, such as a hazard-caused
  road closure, utility outage, unsafe condition or displacement.

This is an **assertion gate**, not an age calculation. A recent publication timestamp cannot make
an anniversary, retrospective, permanent feature or old event active. Past-tense grammar also
cannot decide the label by itself: “a flood closed the road” does not assert a current closure,
while “the road remains closed after the flood” does. Likewise, “wildfire reshaped insurance law”
is consequence reporting with no current hazard or protective state. The implementation must use
reviewable, named constructions rather than one global tense or recency heuristic.

The following do **not** supply the third gate:

- explicit denial or negation, including `no`, `not`, `without`, `unlikely` or `no threat`, when it
  applies to the only otherwise qualifying hazard claim;
- a cancelled, lifted, expired, ended, contained or otherwise resolved state, unless another clause
  asserts a hazard, protective action or direct operational consequence that remains active;
- a historical reference, anniversary, retrospective, preparedness exercise or hypothetical;
- permanent geography or background conditions such as a lava field, volcano, floodplain or
  tsunami zone when no event or active operational impact is asserted; and
- indirect aftermath or consequence reporting about litigation, aid administration, prices,
  supplies, tourism, politics, research or long-term recovery when no direct public-safety state
  remains active.

Negation and resolution are scoped to the claim they modify, not applied as a record-wide veto. A
record that says “No tsunami threat; flash flood warning remains in effect for Oʻahu” qualifies on
the independently asserted flood warning. Conversely, “No tsunami threat to Hawaiʻi after a Japan
earthquake” does not qualify: the only Hawaiʻi impact is expressly denied, so the remote earthquake
cannot borrow that anchor. Under H07, an anchor in a resolved title may still support a different
active same-locality claim in the summary; an anchor inside a denial of the only local impact may
not. Title and summary may therefore provide complementary parts of the qualifying assertion, but
a denied local impact cannot manufacture locality for an otherwise remote event.

The purpose is not to suppress every story written after landfall. An evacuation still ordered, a
shelter still open, an outage still affecting residents or a hazard-caused road still closed is
current operational information and remains eligible. A legal, economic or commemorative story
that merely names the event is not.

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
11. “Storm damage repairs begin at an ocean view resort.”

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
13. Title “Evacuation order issued for Olowalu Village due to brush fire”; summary
    “Honoapiilani Highway is closed from North Kihei to Olowalu General Store.”

Item 13 is the recorded Nolo evacuation that the first contract draft would have deleted because
none of its three local place names appeared in the authored minimum vocabulary. It is evidence,
not invented prose. The other fixtures exercise declared boundaries; their expected labels remain
written independently from the implementation.

### Event-assertion amendment: required negatives

These cases pass the original hazard-language and locality gates. They must be false because the
record asserts no current hazard event, protective action or direct operational impact:

1. “No tsunami threat to Hawaiʻi after Japan earthquake.”
2. “Tsunami advisory for Hawaiʻi has been cancelled.”
3. “Fatal shooting investigated in a Hawaiʻi lava field.”
4. “Maui wildfire attorney fee caps debated.”
5. “Hawaiʻi pumpkin supply remains tight after last year's severe storms.”
6. “Kauaʻi businesses await federal aid after Tropical Storm Lowell.”
7. “Tourism spending rebounds after hurricanes and major storms in Hawaiʻi.”
8. “Hilo marks the anniversary of the 1946 tsunami.”
9. “Oʻahu schools hold a hurricane preparedness exercise.”

Items 4–7 are the four production consequence families that prompted this amendment. The precise
live headlines are perishable evidence, not a vocabulary to overfit; each fixture states the durable
reason for rejection. Items 1–3 exercise explicit negation, a resolved alert and permanent terrain.
Items 8–9 prove that publication recency cannot turn history or preparedness into an event.

### Event-assertion amendment: required positives

These cases must remain true so the third gate cannot become blanket suppression of aftermath,
past tense or negation:

1. “Kīlauea lava activity continues across the summit region.”
2. “Maui brush fire is contained, but the evacuation order remains in effect.”
3. “Storm has passed Maui; Honoapiʻilani Highway remains closed by flood damage.”
4. “Power outage after severe weather still affects Hilo residents.”
5. “No tsunami threat; flash flood warning remains in effect for Oʻahu.”
6. Title “Evacuation lifted for one Maui neighborhood”; summary “Brush fire threatens a second
   neighborhood and its evacuation order remains active.”

Every positive contains an independently asserted event or current operational state. Items 2–6
also contain resolved or negated language, so a record-wide stop-word veto must fail the corpus.

The corpus must exercise title-only, summary-only, and cross-field evidence; ASCII and diacritic
spellings; case and punctuation variation; entity-decoded text; and at least one locality that would
fail if the implementation used publisher identity instead of the content.

## Acceptance criteria

| ID | Requirement | Evidence required before implementation merge |
|---|---|---|
| H01 | One named, pure classifier is the only producer of the item-level `hazard` boolean. | Source search plus a mutation that bypasses the helper and is caught. |
| H02 | Matching uses normalized decoded title+summary and word/phrase boundaries, without changing returned text. | Controlled fixtures for case, punctuation, hyphens, entities, diacritics, and longer-word collisions. |
| H03 | Hawaiʻi relevance is mandatory and publisher/feed identity alone never satisfies it. | Same hazard wording with and without a Hawaiʻi anchor; a mutation removing the locality gate must fail. |
| H04 | The maintained locality vocabulary meets the minimum set and is seeded from the Nolo evidence plus a real five-feed capture spanning at least three publication dates; bare `HI`, bare `island`, and ambiguous generic place phrases fail. | Provenance ledger for captured anchors plus table-driven positive and negative locality fixtures independent of the implementation list, including the bare `ocean view` collision. |
| H05 | Direct and context-dependent hazard language follows the decision table. | Every required positive and negative passes; mutations restoring `erupt`, `swell`, `emergency`, `warning`, `closed`, or bare `outage` as substrings are caught. |
| H06 | A remote hazard remains false unless the text states Hawaiʻi impact; remote origin plus Hawaiʻi impact may pass. | California/Texas negatives and the Japan-quake/Hawaiʻi-tsunami positive. |
| H07 | Title and summary can supply complementary evidence. | Required positive 11, plus the inverse arrangement and summary-only cases. |
| H08 | Missing or empty title/summary cannot gain a label from substituted source, fetch, or current-state data. | Null/empty fixtures; no fallback to outlet name or URL. |
| H09 | `/api/news` still returns every selected item with an explicit boolean; `/api/news/hazard` contains only items classified true by the same helper. | Handler-level assertions on both entrypoints. |
| H10 | Hazard filtering still precedes sorting/capping over the full deduplicated pool. | Existing sixty-item adversarial fixture remains green. |
| H11 | No G1 protection or request-cost bound regresses. | Existing News API, DOM client-shape, and mutation suites all pass; upstream fetch counter remains five at most per canonical miss and zero for refusals. |
| H12 | Partial failures, all-feed failure, timeout cleanup, full user agent, cache policy, and response schema are unchanged. | Existing independent assertions remain green; relevant mutations remain caught. |
| H13 | Every classifier assertion is load-bearing. | Mutation cases cover locality removal, boundary loosening, each context-dependent family, a required true-positive removal, and filter/helper divergence; zero `MISSED`, `ANCHOR LOST`, or `AMBIGUOUS`. |
| H14 | The pure/API suites still run with nothing installed and runtime `dependencies` remains absent or empty. | Empty-directory dependency-free run plus `package.json` diff; do not add an empty key merely to satisfy this row. |
| H15 | The implementation is reviewed against a contemporaneous raw-feed capture, not only invented prose. | Run old and new classifiers over the same decoded five-feed pool; enumerate every changed label with title, source, old/new result, and contract rationale. Do not commit full copyrighted feed bodies. |
| H16 | Live evidence cannot hide false negatives or vocabulary gaps behind a precision-only tally. | Review every item removed by the new classifier and every new/retained hazard item. Separately enumerate every `hazard evidence = true / locality = false` item and resolve it as a proved local anchor, proved non-Hawaiʻi item, or blocker; unresolved items are never averaged away. |
| H17 | Preview preserves both canonical representations and their G1 cache identity while showing the new labels. | `/api/news` remains mixed, `/api/news/hazard` is a subset by classifier truth, both paths resolve, arbitrary query variants converge, and the representations stay distinct. |
| H18 | Production verification is separate from implementation and merge. | After owner-approved merge: served code equals merged `main`; both endpoints return `200`; capture one mixed and one hazard-only response and record any ambiguous classification honestly. |
| H19 | Hazard language and locality are insufficient without an asserted event or ongoing operational impact. Publication time, source identity and current clock state cannot supply the third gate. | Required amendment negatives and positives, null/empty cases, plus a mutation that removes or unconditionally passes the event gate and is caught. |
| H20 | Negated or resolved hazard claims do not qualify by themselves, while an independent active claim in the same record may qualify. | `No tsunami threat` and cancelled-advisory negatives; mixed tsunami/flood, contained-fire/active-order and lifted/active split-field positives; mutations that make negation a record-wide veto or ignore it are caught. |
| H21 | Permanent/background features and indirect aftermath do not become events merely by co-occurring with hazard vocabulary and a Hawaiʻi anchor. Direct public-safety consequences that remain active still qualify. | Lava-field, anniversary, preparedness and four consequence-family negatives paired with active closure, outage, evacuation and hazard-continuation positives. |
| H22 | The Hawaiʻi anchor supports the qualifying assertion. H07 permits a resolved title's anchor to compose with an active same-locality summary, but a denied Hawaiʻi impact cannot localize an otherwise remote event. | Japan-earthquake/no-Hawaiʻi-threat negative beside the existing Japan-quake/Hawaiʻi-advisory positive, plus title/summary complementary cases in both directions. |
| H23 | The event decision is expressed through named, reviewable groups or helpers, not a single opaque replacement expression, age cutoff or global stop-word list. | Source review; focused mutations for each negative family and each surviving positive family; zero `MISSED`, `ANCHOR LOST` or `AMBIGUOUS`. |
| H24 | Implementation changes only classifier semantics and named News verification. H01–H18, canonical representations, whole-pool filtering, schema, cache/WAF controls and dependency-free runtime remain intact. | Existing pure, API, DOM and mutation suites stay green; contemporaneous H15/H16 ledgers add event-gate results and enumerate every changed label before merge. |

## Evidence interpretation

A live feed is perishable and cannot prove the absence of a missed hazard. H15/H16 are required to
show what changed on that feed, while the evidence-seeded vocabulary, deterministic corpus and
mutations carry the durable claim. No percentage is accepted without its numerator, denominator,
reviewed item list, and separate locality-only rejection list.

If a live item is genuinely ambiguous, record it as ambiguous and decide whether the contract needs
an amendment; do not tune a keyword solely to make that day's precision number look better. If an
implementation cannot satisfy locality without dropping a required positive, stop for review rather
than weakening the gate silently.

## Implementation boundary

After this amendment is reviewed and merged, Claude may claim a separate implementation touching
only the classifier and named News tests, plus the coordination record. The implementation must
preserve H01–H18 while satisfying H19–H24. Any change to feeds, canonical routing, WAF, response
shape, client presentation, `timeAgo()`, or runtime dependencies requires a separate claim or
explicit contract amendment.
