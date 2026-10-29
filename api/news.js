/**
 * GET /api/news
 *
 * Hawaii news headlines, merged from local outlet RSS feeds.
 *
 * This exists because none of the outlet feeds send CORS headers, so index.html
 * cannot fetch them directly from the browser. This function does it server-side
 * and returns JSON with `Access-Control-Allow-Origin: *`.
 *
 * No dependencies — the RSS parsing is deliberately minimal regex extraction so
 * the project stays install-free.
 *
 * Two canonical, QUERY-FREE representations:
 *   /api/news         all headlines, fixed at 30
 *   /api/news/hazard  hazard-only, fixed at 30, filtered over the whole pool before the cap
 *
 * There are no query parameters. The former ?limit and ?hazard were part of an unbounded cache
 * key space: any query string produced a distinct CDN identity, and every miss fanned out to
 * five upstream feeds. Routing now deletes every query key before cache lookup, and this handler
 * refuses any that still arrive. See G1-ABUSE-BOUNDING-CONTRACT.md.
 */

const FEEDS = [
  { id: 'hnn',  name: 'Hawaii News Now', url: 'https://www.hawaiinewsnow.com/arc/outboundfeeds/rss/?outputType=xml' },
  { id: 'cb',   name: 'Civil Beat',      url: 'https://www.civilbeat.org/feed/' },
  { id: 'sa',   name: 'Star-Advertiser', url: 'https://www.staradvertiser.com/feed/' },
  { id: 'khon', name: 'KHON2',           url: 'https://www.khon2.com/feed/' },
  { id: 'kitv', name: 'KITV 4',          url: 'https://www.kitv.com/search/?f=rss&t=article&c=news&l=50&s=start_time&sd=desc' }
];

/* Star-Advertiser 403s a bare "Mozilla/5.0", so send a realistic UA. */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

/* HAZARD CLASSIFICATION — see HAZARD-CLASSIFIER-CONTRACT.md, H01-H24.
 *
 * Three gates, all required: actionable hazard evidence, an asserted event or ongoing operational
 * impact, AND explicit Hawai'i relevance.
 *
 * The predecessor was one broad alternation tested against title+summary. It could not tell
 * "gunfire erupted" from a volcanic eruption, a fund that "swells" from ocean swells, Honolulu
 * Emergency Medical Services from a declared emergency, or a Texas flood warning from a local
 * one. During Hurricane Nolo roughly seven of thirty items in the hazard representation were
 * noise. Measured against the contract corpus it got 11 of 11 required negatives wrong and 0 of
 * 13 required positives wrong: perfect recall, no precision on the hard cases.
 *
 * These are deliberately explicit vocabularies rather than one clever expression, because the
 * contract requires the accepted language to be reviewable against its decision table. A shorter
 * regex would be harder to audit, not better.
 */

/* Matching happens on normalized text, never on the returned text, which is left exactly as the
   response carries it. Runs on decode()'s OUTPUT -- decode() decodes entities before stripping
   tags and repeats until stable, and nothing here may reorder or re-enter that. */
function hazardNormalize(text) {
  return String(text == null ? '' : text)
    .normalize('NFKC')
    /* Decompose, then drop the combining marks only. Without this the macron SURVIVED NFKC as a
       precomposed letter, and the punctuation pass below then replaced the whole letter with a
       space: "Kihei" became "k hei" and stopped matching its own anchor. The 'okina is a letter
       modifier, not a combining mark, so it is untouched here and handled below. */
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    /* 'okina and apostrophe variants collapse to one form so Hawai'i, Hawaii and Hawai`i match. */
    .replace(/[\u02BB\u02BC\u2018\u2019']/g, "'")
    .toLowerCase()
    /* Punctuation and hyphens are separators, so "HI-5" cannot donate a locality token and
       "Kailua-Kona" still yields both. Spaces are collapsed and the string is padded so every
       lookup can test whole tokens. */
    .replace(/[^a-z0-9']+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    /* A possessive is a grammatical suffix, not part of the name. Without this, "O'ahu's North
       Shore" produced the token "o'ahu's" and the anchor "o'ahu" did not match -- a real
       Hawai'i story failing the locality gate on an apostrophe. Internal 'okina are untouched,
       so "hawai'i" survives; only a trailing 's is removed. */
    .split(' ')
    .map(t => t.replace(/'s$/, ''))
    .join(' ');
}

/* Whole-token/phrase containment. Padding both sides means "vog" cannot match inside "vogue"
   and "kona" cannot match inside "konark", without needing a regex per term. */
function hasPhrase(norm, phrase) {
  return (' ' + norm + ' ').indexOf(' ' + phrase + ' ') !== -1;
}
function hasAny(norm, phrases) {
  for (const t of phrases) if (hasPhrase(norm, t)) return true;
  return false;
}

/* LOCALITY VOCABULARY — H04.
 * Seeded from three sources, per the contract: stable jurisdiction and agency names; the recorded
 * Nolo operational cases; and real five-feed capture text. Provenance is recorded in the handoff.
 * A place name that is also ordinary English is NOT safe bare -- "Ocean View" is deliberately
 * absent and may return only as a qualified construction with its own fixtures. */
const HAWAII_ANCHORS = [
  /* state, islands, counties -- stable */
  "hawai'i", 'hawaii', "o'ahu", 'oahu', 'maui', "kaua'i", 'kauai',
  "moloka'i", 'molokai', "lana'i", 'lanai', "ni'ihau", 'niihau', 'big island',
  'honolulu', 'maui county', 'hawaii county', 'kauai county', 'honolulu county',
  /* "Hawaiian" is not a spelling variant of "Hawaii" to a whole-token matcher, and the feeds use
     it constantly: "the Hawaiian Islands" in NWS forecast copy, "Hawaiian Electric" in every
     outage story. Its absence dropped a hurricane-outage story from the capture.

     Only the two PROVEN constructions are anchors. Bare "hawaiian" is an adjective that travels
     anywhere -- a Hawaiian-themed resort on the mainland -- which is the same collision the
     contract names for bare "Ocean View". A further construction needs its own capture evidence
     and its own fixtures. */
  'hawaiian islands', 'hawaiian electric',
  /* A Hawai'i place the authored list did not contain, found in the capture. */
  'papahanaumokuakea',
  /* commonly reported places -- contract plus capture */
  'hilo', 'kona', 'kailua kona', 'puna', 'kilauea', 'mauna loa', 'mauna kea',
  'lahaina', 'kahului', "lihu'e", 'lihue', 'waikiki', "wai'anae", 'waianae',
  "po'ipu", 'poipu', 'pearl city', 'kalaupapa', 'wailuku', 'kaneohe', 'pahoa',
  /* the real feed locations that exposed the original vocabulary gap */
  'olowalu', "honoapi'ilani", 'honoapiilani', 'kihei', 'waiawa', 'waimanalo', 'kailua',
  /* authoritative local agencies */
  'hiema', "hawai'i emergency management", 'hawaii emergency management',
  "hawai'i county civil defense", 'hawaii county civil defense',
  'nws honolulu', 'central pacific hurricane center', 'cphc',
  'usgs hvo', 'hvo', 'hawaiian volcano observatory'
];

/* DIRECT HAZARD EVIDENCE -- qualifies alone. */
const HAZARD_DIRECT = [
  /* Plurals of the direct terms. Without them amendment negative 7, "Tourism spending rebounds
     after hurricanes and major storms in Hawaii", failed the EVIDENCE gate and would have looked
     like a third-gate rejection it never reached. */
  'hurricane', 'hurricanes', 'tropical storm', 'tropical storms', 'tropical depression', 'tsunami',
  'earthquake', 'earthquakes', 'quake', 'quakes',
  'flash flood', 'flash flooding', 'flooding', 'flood warning', 'flood watch',
  'flood advisory', 'flood conditions',
  /* Bare 'flood' stays out -- it is the idiom token. 'flood damage' is a physical construction
     and required positive 3 turns on it: "Honoapi'ilani Highway remains closed by flood damage"
     is an active closure whose only in-clause evidence is those two words. */
  'flood damage',
  'wildfire', 'wildfires', 'brush fire', 'brush fires', 'wildland fire',
  'volcano', 'volcanic', 'lava', 'vog',
  'high surf', 'storm surge', 'landslide', 'mudslide', 'rockfall',
  'evacuation', 'evacuations', 'evacuate', 'evacuated', 'evacuee', 'evacuees'
];

/* CONTEXT-DEPENDENT FAMILIES -- the contract's decision table, one entry per row.
   `context` means "the term AND any one of these". `allOf` means "the term AND at least one
   from EVERY listed group", which is what several contract rows actually require: a loose
   single-list conjunction let unrelated tokens vouch for each other, so "fund swells to record
   high" passed on `high` alone and "argument erupted at a summit" passed on `summit` alone. */
const HAZARD_CONTEXT = [
  /* Volcanic terms only. "summit" and "vent" are gone: a political summit and an air vent are
     ordinary English, and they were the tokens letting gunfire "erupt" volcanically. */
  { terms: ['erupt', 'erupts', 'erupted', 'eruption', 'eruptions'],
    context: ['volcano', 'volcanic', 'volcanoes', 'lava', 'kilauea', 'mauna loa', 'hvo',
              'hawaiian volcano observatory', 'caldera', 'fissure', 'magma'] },
  /* The contract requires a qualifier AND ocean context, not either one. */
  { terms: ['swell', 'swells', 'swelling'],
    allOf: [['high', 'large', 'dangerous', 'damaging'],
            ['ocean', 'surf', 'shore', 'shores', 'waves', 'coastal', 'sea', 'beaches']] },
  /* "shelter" is gone from this list: it let an Emergency Medical Services story and an animal
     shelter vouch for each other across an unrelated sentence. */
  { terms: ['emergency'],
    context: ['declaration', 'declared', 'proclamation', 'disaster', 'evacuation', 'evacuate',
              'evacuee', 'evacuees', 'hiema', 'civil defense'] },
  { terms: ['warning', 'warnings', 'watch', 'watches', 'advisory', 'advisories'],
    context: ['hurricane', 'tropical storm', 'tsunami', 'flood', 'flooding', 'flash flood',
              'high surf', 'surf', 'wind', 'winds', 'storm surge', 'fire', 'wildfire',
              'brush fire', 'volcanic', 'lava', 'ashfall', 'small craft', 'gale'] },
  /* Bare "emergency" is gone from here for the same reason, in the other direction. A shelter
     qualifies on an actual displacement event, or on the fixed phrase. */
  { terms: ['shelter', 'shelters'],
    context: ['evacuation', 'evacuate', 'evacuee', 'evacuees', 'disaster',
              'hurricane', 'tropical storm', 'flood', 'flooding', 'wildfire', 'brush fire',
              'storm', 'storms', 'emergency shelter', 'emergency shelters'] },
  { terms: ['outage', 'outages'],
    context: ['power', 'electric', 'electrical', 'utility', 'water', 'communications',
              'cellular', 'cell', 'phone', 'internet', 'grid'] },
  /* "storm" only in a physical construction. The exclusions below remove the idioms. */
  { terms: ['storm', 'storms'],
    context: ['tropical', 'severe', 'winter', 'thunderstorm', 'thunderstorms', 'surge',
              'damage', 'damages', 'damaged',
              'system', 'warning', 'watch', 'rain', 'wind', 'winds', 'flooding', 'flood',
              'evacuation', 'shelter', 'hurricane', 'approaches', 'approaching', 'passes',
              'passing', 'hit', 'hits', 'battered', 'knocked'] }
];

/* Phrases that must never supply hazard evidence, checked before anything else. These are the
   idioms the predecessor matched: "took the city by storm", "a flood of donations". */
const HAZARD_IDIOMS = [
  'by storm', 'storm of', 'political storm', 'brainstorm', 'brainstorming', 'firestorm',
  'flood of', 'flooded with', 'swept the', 'perfect storm'
];

/* 'closed'/'closure' are never independent EVIDENCE: the contract says the story must carry other
   hazard evidence, so they are deliberately absent from both lists above. A road closed BY a brush
   fire qualifies on the brush fire, which is the point. They appear below in ACTIVE_CONSEQUENCE,
   which is a different question -- not "is this a hazard" but "does this hazard still have an open
   operational consequence" -- and that test still requires the evidence above in the same clause. */

/* EVENT ASSERTION — H19-H24.
 *
 * The first two gates answer "is a hazard subject named, and is it local". Neither answers what
 * the record CLAIMS is happening, which is why H01-H18 labelled a wildfire fee-cap hearing and a
 * tsunami anniversary as hazards. H19 adds a third gate: the text must assert onset, approach,
 * forecast, observation, continuation or escalation of a hazard; a protective action that is
 * issued, open, ordered or still in effect; or a direct operational consequence still active for
 * the public.
 *
 * H23 forbids an age cutoff and a global stop-word list, and the contract's own corpus shows why:
 * five of its six required positives contain resolved or negated language. "Maui brush fire is
 * contained, but the evacuation order remains in effect" must stay TRUE. A record-wide veto on
 * `contained`, `lifted` or `no` would score perfectly on the negatives and delete an evacuation
 * order that is still in force, and a publication-time cutoff would keep that day's anniversary
 * piece while dropping a week-old closure that is still closed.
 *
 * So the decision is made per CLAUSE. Negation and resolution cancel only the claim they reach,
 * and a different clause may still carry an active one.
 */

/* Clause boundaries — H20. Sentence punctuation plus the conjunctions that join a resolved claim
   to an active one. Two deliberate choices:
     - A COMMA IS NOT A BOUNDARY. "The evacuation order, lifted for Lahaina, remains in effect for
       Olowalu" would split the persistence away from the order it governs and lose a live order.
     - A single-letter abbreviation does not end a clause, so "U.S. Coast Guard" stays whole.
   Title and summary are split independently and concatenated: they are separate assertions, and
   joining them first would let a negation in the title reach into the summary. */
const CLAUSE_BREAK_RE = /(?<!\b[a-z])[.!?;:]+(?=\s|$)|\s(?:but|while|however|although|though|as|and|meanwhile|after|despite)\s/;

function splitClauses(text) {
  return String(text == null ? '' : text)
    .toLowerCase()
    .split(CLAUSE_BREAK_RE)
    .map(part => hazardNormalize(part))
    .filter(part => part.length > 0);
}

/* Permanent geography and background conditions — H21. These name a standing feature, not an
   event, so they are removed before a clause is asked whether it carries hazard evidence for its
   own assertion. Without this, "a Hawaii lava field trail remains closed for trail repairs" reads
   as an active hazard closure: `remains closed` is a real consequence construction and `lava`
   would supply the cause. */
const PERMANENT_FEATURES = [
  'lava field', 'lava fields', 'lava rock', 'lava tube', 'lava tubes',
  'volcanoes national park', 'volcano national park',
  'tsunami zone', 'tsunami zones', 'tsunami evacuation zone', 'tsunami evacuation zones',
  'flood zone', 'flood zones', 'floodplain', 'floodplains', 'flood plain',
  'dormant volcano', 'extinct volcano'
];

/* Explicit negation — H20. SCOPED: a marker cancels only an assertion that follows it within a
   few tokens of the same clause. Applied record-wide it would delete required positive 5, where
   "No tsunami threat" sits beside a flash flood warning that is still in effect. */
const NEGATION = [
  'no', 'not', 'none', 'never', 'nor', 'without', 'unlikely', 'no threat', 'not expected',
  'ruled out', 'denies', 'denied', 'dismissed'
];

/* Resolved states — H20. Same scoping, and PERSISTENCE below overrides them inside one clause. */
const RESOLUTION = [
  'cancelled', 'canceled', 'cancels', 'lifted', 'lifts', 'expired', 'expires', 'ended', 'ends',
  'called off', 'contained', 'extinguished', 'under control', 'all clear', 'downgraded',
  'rescinded', 'resolved', 'restored', 'reopened', 'reopens', 'no longer', 'has passed',
  'have passed', 'passed', 'passes', 'subsided', 'receded', 'cleared', 'stood down'
];

/* Persistence — H20/H21. These assert that a state continues, and they override a resolution
   marker in the SAME clause, which is the comma case above: an order lifted for one place and
   still in effect for another is a live order. */
const PERSISTENCE = [
  'remains', 'remain', 'remaining', 'remains in effect', 'still', 'continues', 'continue',
  'continuing', 'ongoing', 'in effect', 'stays', 'stay', 'active', 'persists', 'persist'
];

/* Group A — onset, approach, forecast, observation, continuation or escalation of the hazard
   itself. Tense is not the test: "lava erupted from the Kilauea vent" is an observation of an
   event, which is why H19 says past-tense grammar cannot decide the label by itself. */
const EVENT_ONSET = [
  'approaches', 'approaching', 'nears', 'nearing', 'heads', 'heading', 'moves', 'moving',
  'tracks', 'tracking', 'forecast', 'forecasts', 'forecasted', 'expected', 'anticipated',
  'predicted', 'continues', 'continuing', 'ongoing', 'underway', 'in progress',
  'intensifies', 'intensifying', 'strengthens', 'strengthening', 'escalates', 'escalating',
  'grows', 'growing', 'spreads', 'spreading', 'develops', 'developing', 'forms', 'forming',
  'erupts', 'erupted', 'erupting', 'eruption', 'eruptions',
  'sends', 'sent', 'hits', 'hit', 'hitting', 'strikes', 'struck', 'striking',
  'batters', 'battered', 'threatens', 'threatening', 'threat', 'threatened',
  'prompts', 'prompted', 'triggers', 'triggered', 'sparks', 'sparked',
  'rises', 'rising', 'overflows', 'overflowing', 'burns', 'burning',
  'reported', 'observed', 'recorded', 'detected'
];

/* Group B — a protective action. A warning, advisory, evacuation order or shelter named in a
   hazard clause is in effect unless that clause resolves or negates it, which is what makes
   "High surf warning for north shores of Kauai" qualify with no verb at all. */
const PROTECTIVE_ACTION = [
  'warning', 'warnings', 'watch', 'watches', 'advisory', 'advisories',
  'evacuation', 'evacuations', 'evacuation order', 'evacuation orders',
  'evacuate', 'evacuated', 'evacuees', 'evacuee',
  'order', 'orders', 'ordered', 'mandatory',
  'shelter', 'shelters', 'emergency shelter', 'emergency shelters',
  'declaration', 'proclamation', 'declared', 'declares', 'signs',
  'curfew', 'curfews', 'issued', 'issues', 'activated',
  'opens', 'opened', 'urged', 'urges', 'advised', 'advises',
  'boil water notice', 'boil water order', 'siren', 'sirens'
];

/* Group C — a direct operational consequence still active for the public. `damaged` and
   `destroyed` are deliberately absent: harm already done is not a state that remains active, and
   including them would relabel every rebuilding story. */
const ACTIVE_CONSEQUENCE = [
  'closed', 'closes', 'closure', 'closures', 'shut', 'shut down',
  'blocked', 'blocks', 'impassable', 'inaccessible', 'cut off', 'off limits',
  'outage', 'outages', 'without power', 'lost power', 'no water', 'boil water',
  'unsafe', 'displaced', 'displaces', 'stranded', 'trapped', 'grounded',
  'affects', 'affecting', 'disrupts', 'disrupting'
];

/* History and preparedness — H21. These disqualify a clause outright, including its consequence
   claims: the 1946 tsunami closed the harbor, and that is not an open closure today. */
const HISTORICAL_FRAME = [
  'anniversary', 'anniversaries', 'commemorates', 'commemoration', 'commemorating',
  'remembers', 'remembrance', 'in memory', 'years ago', 'decades ago', 'a decade ago',
  'looks back', 'retrospective', 'historical', 'documentary', 'archive', 'archives',
  'museum', 'exhibit', 'recalls', 'recounts', 'last year'
];
const EXERCISE_FRAME = [
  'preparedness', 'preparedness month', 'awareness week', 'awareness month',
  'drill', 'drills', 'preparedness exercise', 'training exercise', 'emergency exercise',
  'tabletop', 'simulation', 'simulated', 'hypothetical', 'scenario', 'scenarios', 'mock'
];

/* Indirect aftermath — H21. This disqualifies groups A and B but NOT group C, because H21 says
   direct public-safety consequences that remain active still qualify: "Lahaina rebuilding funds
   are delayed and the highway remains closed" is still a closed highway.

   RECORDED OMISSION: the contract names `research` among the indirect families and this list does
   not carry it. USGS and HVO status copy is written in research voice -- "HVO researchers report
   lava continues at Kilauea" -- and a clause-level `researchers` token would delete real volcano
   updates. Research stories that are genuinely indirect carry no group-A verb and fail anyway. */
const INDIRECT_FRAME = [
  'attorney', 'attorneys', 'lawyer', 'lawyers', 'lawsuit', 'lawsuits', 'litigation',
  'settlement', 'settlements', 'fee', 'fees', 'court', 'courts', 'judge', 'jury', 'trial',
  'insurance', 'insurer', 'insurers', 'premiums',
  'aid', 'federal aid', 'relief funds', 'grant', 'grants', 'reimbursement', 'reimbursements',
  'spending', 'tourism', 'tourist', 'tourists', 'visitor arrivals', 'bookings',
  'prices', 'price', 'supply', 'supplies', 'shortage', 'economy', 'economic', 'revenue',
  'profits', 'sales', 'audit', 'rebuilding funds', 'recovery funds', 'recovery plan',
  'legislature', 'lawmakers', 'politics', 'political', 'campaign', 'election', 'ballot',
  'poll', 'polls', 'debated', 'debate'
];

/* Phrase subtraction, shared by the idiom strip and the permanent-feature strip: removing the
   phrase that produced a match leaves any OTHER evidence in the clause intact, so a story
   carrying both an idiom and real hazard language still qualifies on the real language. */
function stripPhrases(norm, phrases) {
  let out = norm;
  for (const phrase of phrases) {
    out = (' ' + out + ' ').split(' ' + phrase + ' ').join(' ').trim();
  }
  return out;
}

/* How far back a negation reaches. Four tokens covers "no tsunami threat" and "not expected to
   bring flooding" without crossing into the next claim; the clause boundary is the hard limit. */
const NEGATION_REACH = 4;

/* True when at least ONE occurrence of some phrase is not preceded by a negation inside its
   reach. Written per-occurrence on purpose: "no tsunami threat; flood warning in effect" has a
   negated and an unnegated assertion in the same record, and only the second decides. */
function hasUnnegated(norm, phrases) {
  const tokens = norm.split(' ');
  for (const phrase of phrases) {
    const parts = phrase.split(' ');
    for (let i = 0; i + parts.length <= tokens.length; i++) {
      let hit = true;
      for (let k = 0; k < parts.length; k++) {
        if (tokens[i + k] !== parts[k]) { hit = false; break; }
      }
      if (!hit) continue;
      const before = tokens.slice(Math.max(0, i - NEGATION_REACH), i).join(' ');
      if (!hasAny(before, NEGATION)) return true;
    }
  }
  return false;
}

/* Gate 2 for one clause: hazard evidence, with idioms and permanent features subtracted first.
   Named and separate so the suite can assert on the SAME expression the gate uses rather than on
   a copy of it -- the two subtractions are only observable here, because a clause they empty out
   asserts nothing afterwards and the boolean alone cannot say which subtraction did it. */
function clauseHazardEvidence(clause) {
  return hasHazardEvidence(stripPhrases(stripPhrases(clause, HAZARD_IDIOMS), PERMANENT_FEATURES));
}

/* The one place the third gate is decided, for one clause. Returns the group that qualified, or
   '' -- a named result rather than a bare boolean so the ledgers can say WHICH group fired. */
function clauseEventState(clause) {
  /* The assertion has to be about a hazard. */
  if (!clauseHazardEvidence(clause)) return '';
  if (hasAny(clause, HISTORICAL_FRAME) || hasAny(clause, EXERCISE_FRAME)) return '';
  /* Resolution is cancelled by persistence in the same clause, never record-wide. */
  if (!hasAny(clause, PERSISTENCE) && hasAny(clause, RESOLUTION)) return '';
  const indirect = hasAny(clause, INDIRECT_FRAME);
  if (!indirect && hasUnnegated(clause, EVENT_ONSET)) return 'onset';
  if (!indirect && hasUnnegated(clause, PROTECTIVE_ACTION)) return 'protective';
  if (hasUnnegated(clause, ACTIVE_CONSEQUENCE)) return 'consequence';
  return '';
}

/* H22: the anchor has to support the qualifying assertion. A clause that carries hazard evidence,
   a negation and no surviving assertion is a DENIAL, and its anchor cannot localize a remote
   event -- "No tsunami threat to Hawaii after a Japan earthquake" is not a Hawaii hazard. A
   RESOLVED clause is different and its anchor still counts, which is what H07 and H22 require of
   "Evacuation lifted for one Maui neighborhood" beside an active order in the summary. */
function isDenialClause(clause) {
  if (!hasAny(clause, NEGATION)) return false;
  if (clauseEventState(clause)) return false;
  return clauseHazardEvidence(clause);
}

function hasLocalAnchor(clauses) {
  for (const clause of clauses) {
    if (isDenialClause(clause)) continue;
    if (hasHawaiiAnchor(clause)) return true;
  }
  return false;
}

function hasHazardEvidence(norm) {
  if (hasAny(norm, HAZARD_DIRECT)) return true;
  for (const g of HAZARD_CONTEXT) {
    if (!hasAny(norm, g.terms)) continue;
    /* allOf is a conjunction of groups: every group must contribute. context is the single-group
       form. A row declares one or the other, never both. */
    if (g.allOf) { if (g.allOf.every(group => hasAny(norm, group))) return true; }
    else if (hasAny(norm, g.context)) return true;
  }
  return false;
}

function hasHawaiiAnchor(norm) {
  return hasAny(norm, HAWAII_ANCHORS);
}

/* The ONE producer of the item-level hazard boolean -- H01. Pure: same input, same answer, no
   clock, no network, no outlet identity, and H19 adds that publication time cannot reach it
   either. Publisher name is not part of the evidence record, so a Hawai'i outlet carrying
   national wire copy cannot pass the locality gate on its masthead.

   All three gates are answered INSIDE the clause that makes the claim. There is no record-wide
   evidence test any more: a clause-scoped one implies it, and keeping both would have left two
   redundant checks where neither could be shown to be load-bearing. */
function classifyHazard(title, summary) {
  const clauses = splitClauses(title).concat(splitClauses(summary));
  /* Gates 1 and 2, per clause: hazard evidence plus an asserted event, protective action or
     active operational consequence. */
  if (!clauses.some(clause => clauseEventState(clause))) return false;
  /* Gate 3: locality, from a clause that does not deny the only local impact. */
  return hasLocalAnchor(clauses);
}

/* Entities are decoded BEFORE tags are stripped, and stripping repeats until
   stable. Decoding last would turn "&lt;img onerror=...&gt;" back into live
   markup after the strip had already run — which is exactly how encoded HTML
   in a feed title used to survive this function. */
function decode(s) {
  let out = String(s == null ? '' : s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  out = decodeEntities(out);
  let prev;
  do { prev = out; out = out.replace(/<[^>]*>/g, ''); } while (out !== prev);
  /* Any angle brackets left after stripping are literal text — neutralize them. */
  return out.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
}

function decodeEntities(s) {
  return s
    .replace(/&#8217;|&#x2019;/g, '’')
    .replace(/&#8216;|&#x2018;/g, '‘')
    .replace(/&#8220;/g, '“').replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)<\\/' + name + '>', 'i'));
  return m ? decode(m[1]) : '';
}

function parseFeed(xml, feed) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const b of blocks) {
    const title = tag(b, 'title');
    const link = tag(b, 'link') || (b.match(/<link[^>]*href="([^"]+)"/i) || [])[1] || '';
    if (!title || !link) continue;
    const pub = tag(b, 'pubDate') || tag(b, 'dc:date') || tag(b, 'published');
    const ts = pub ? Date.parse(pub) : NaN;
    const summary = tag(b, 'description').slice(0, 240);
    items.push({
      title,
      link,
      source: feed.name,
      sourceId: feed.id,
      summary,
      published: Number.isNaN(ts) ? null : new Date(ts).toISOString(),
      ts: Number.isNaN(ts) ? 0 : ts,
      hazard: classifyHazard(title, summary)
    });
  }
  return items;
}

async function fetchFeed(feed) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(feed.url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml, */*' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return parseFeed(await res.text(), feed);
  } finally {
    clearTimeout(timer);
  }
}

/* THE SHARED IMPLEMENTATION.
   The representation is decided by WHICH FILE the platform routed to, not by anything in the
   request. There is no internal header and no query parameter carrying it, so there is nothing
   for a caller to forge — which is why this design needs no anti-forgery gate at all.

   Three earlier attempts to carry the representation through routing failed on admissible
   evidence: a request.query `set`, a `dest` querystring, and a delete-then-set internal header.

   The two QUERY mechanisms are explained: the query-delete transform removes every key, including
   the one routing had just supplied.

   The HEADER failure is NOT explained by that, and an earlier version of this comment wrongly said
   it was. A request.query transform cannot remove a request header — they are different transform
   types — and the configuration deleted and set the header in separate operations. What is
   established is only what was measured: with delete-then-set configured, the sentinel did not
   reach the handler on two cold-MISS measurements. The precise cause is unresolved. */
async function serve(req, res, hazardOnly) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  /* Cache at the edge so the outlets aren't hit on every page load. */
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');

  /* A preflight is not a read. It answers from here and touches no outlet. */
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  /* Anything but GET is refused before any upstream work, and the refusal is not cached.
     Declared with Allow so the refusal is actionable rather than merely a wall. */
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  /* CANONICAL REQUEST CHECK — the second layer of the bound, and the one that survives if the
     edge transform is ever removed or misconfigured.

     The public surface is two query-free paths. Routing strips every query key before the CDN
     chooses a key, so a well-routed request arrives here with none. Anything that still carries
     a query string reached application code by another route, and is refused BEFORE
     FEEDS.map(fetchFeed) so it performs not even one upstream request.

     The refusal is deliberately opaque: a fixed message, no echo of the offending input, and
     no-store so a refusal can never occupy a cache entry of its own. Echoing the input would
     hand an attacker a reflection surface, and caching refusals would re-create the unbounded
     key space this whole change exists to close. */
  /* Every '?' is refused, including a bare trailing one with no key after it. An earlier version
     allowed that case as harmless-and-equivalent; it is not worth the exception. The public
     contract says query-free, direct invocation is precisely the surface this layer defends, and
     an exception is one more shape a reader has to reason about. */
  if (String(req.url || '').indexOf('?') !== -1) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({ error: 'this endpoint takes no query parameters' });
    return;
  }

  /* Fixed by the representation, never by the caller. */
  const limit = 30;

  const settled = await Promise.allSettled(FEEDS.map(fetchFeed));

  let items = [];
  const errors = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') items = items.concat(r.value);
    else errors.push({ source: FEEDS[i].name, error: String(r.reason && r.reason.message || r.reason) });
  });

  /* Dedupe by link, then by identical title across outlets (wire copy). */
  const seenLink = new Set(), seenTitle = new Set();
  items = items.filter(it => {
    const t = it.title.toLowerCase();
    if (seenLink.has(it.link) || seenTitle.has(t)) return false;
    seenLink.add(it.link); seenTitle.add(t);
    return true;
  });

  if (hazardOnly) items = items.filter(it => it.hazard);
  items.sort((a, b) => b.ts - a.ts);
  items = items.slice(0, limit).map(({ ts, ...rest }) => rest);

  if (!items.length && errors.length === FEEDS.length) {
    res.status(502).json({ updated: new Date().toISOString(), items: [], errors });
    return;
  }

  res.status(200).json({
    updated: new Date().toISOString(),
    sources: FEEDS.map(f => ({ id: f.id, name: f.name })),
    count: items.length,
    items,
    errors
  });
}

/* Default entrypoint: /api/news — all headlines.
   The hazard entrypoint lives at api/news/hazard.js and calls the same serve(). */
module.exports = (req, res) => serve(req, res, false);
module.exports.serve = serve;
