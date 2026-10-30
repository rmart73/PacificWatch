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
  /* Hawai'i places the authored list did not contain, each found in a real five-feed capture. */
  'papahanaumokuakea',
  /* From the 2026-10-29 capture: "Evacuation warning issued for Kipahulu District of Haleakala
     National Park" was a real Maui evacuation warning that passed both other gates and failed
     locality. Pre-existing H04 gap, not a regression -- the prior classifier dropped it too. */
  'haleakala', 'kipahulu',
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
/* 'after', 'despite' and 'amid' are ZERO-WIDTH breaks: the preposition stays at the head of the
   clause it introduces, so "Power outage after severe weather still affects Hilo residents" splits
   into a claim and a continuation OF that claim rather than into two unrelated pieces. The
   conjunctions above it introduce independent clauses and are consumed. */
const CLAUSE_BREAK_RE = /(?<!\b[a-z])[.!?;:]+(?=\s|$)|\s(?:but|while|however|although|though|as|and|meanwhile)\s|(?=\s(?:after|despite|amid)\s)/;

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
  'dormant volcano', 'extinct volcano',
  /* A SEASON is a background condition in exactly the way a floodplain is. From the capture:
     "Team Rubicon focuses on Maui mitigation work amid hurricane season" qualified because
     `hurricane season continues` read as a hazard that continues. */
  'hurricane season', 'wildfire season', 'fire season', 'storm season', 'surf season',
  'rainy season', 'dry season'
];

/* Explicit negation — H20. SCOPED: a marker cancels only an assertion that follows it within a
   few tokens of the same clause. Applied record-wide it would delete required positive 5, where
   "No tsunami threat" sits beside a flash flood warning that is still in effect. */
const NEGATION = [
  'no', 'not', 'none', 'never', 'nor', 'without', 'unlikely', 'no threat', 'not expected',
  'ruled out', 'denies', 'denied', 'dismissed',
  /* Contractions survive normalization as single tokens, so they have to be listed or a negation
     written the way people write it does not count. `no longer` is deliberately absent: it is a
     RESOLUTION marker, and treating it as a denial would also strip that clause's anchor. */
  "don't", "doesn't", "didn't", "won't", "isn't", "aren't", "wasn't", "weren't",
  "can't", 'cannot'
];

/* Resolved states — H20. Same scoping, and PERSISTENCE below overrides them inside one clause. */
const RESOLUTION = [
  'cancelled', 'canceled', 'cancels', 'lifted', 'lifts', 'expired', 'expires', 'ended', 'ends',
  'called off', 'contained', 'extinguished', 'under control', 'all clear', 'downgraded',
  'rescinded', 'resolved', 'restored', 'reopened', 'reopens', 'no longer', 'has passed',
  'have passed', 'passed', 'passes', 'subsided', 'receded', 'cleared', 'stood down'
];

/* There is no general PERSISTENCE group, and its absence is deliberate. It existed to revive a
   resolved clause, and a clause-wide revival is unsound: in "Tsunami advisory cancelled, active
   investigation continues in Hawaii" the persistence belongs to the investigation and revived the
   advisory. Resolution is scoped to the claim it modifies instead.

   The one narrow revival that survives is ALERT_IN_FORCE together with a DIFFERENT locality, which
   is the only thing separating "lifted for Lahaina, remains in effect for Olowalu" from "lifted
   for Lahaina, is no longer in effect". */

/* Group A — onset, approach, forecast, observation, continuation or escalation of the hazard
   itself. Tense is not the test: "lava erupted from the Kilauea vent" is an observation of an
   event, which is why H19 says past-tense grammar cannot decide the label by itself. */
const EVENT_ONSET = [
  'approaches', 'approaching', 'nears', 'nearing', 'heads', 'heading', 'moves', 'moving',
  'tracks', 'tracking', 'forecast', 'forecasts', 'forecasted', 'expected', 'anticipated',
  'predicted', 'continues', 'continuing', 'ongoing', 'underway', 'in progress',
  /* From the live capture, where their absence dropped two real hazard records: a flash flood
     forecast headlined "Flash flooding possible for Maui County" and an open-shelter story whose
     only event language was "the islands brace for flash flooding". `likely` is deliberately NOT
     here -- it reclassified an opinion letter about climate policy, whose text reads "what is
     likely behind the increased incidence", as an active hazard. */
  'possible', 'potential', 'risk', 'imminent', 'brace', 'braces', 'bracing',
  'warned', 'arrives', 'arriving', 'impacted', 'impacts', 'impacting',
  'intensifies', 'intensifying', 'strengthens', 'strengthening', 'escalates', 'escalating',
  'grows', 'growing', 'spreads', 'spreading', 'develops', 'developing', 'forms', 'forming',
  'erupts', 'erupted', 'erupting', 'eruption', 'eruptions',
  'sends', 'sent', 'hits', 'hit', 'hitting', 'strikes', 'struck', 'striking',
  'batters', 'battered', 'threatens', 'threatening', 'threat', 'threatened',
  'prompts', 'prompted', 'triggers', 'triggered', 'sparks', 'sparked',
  'rises', 'rising', 'overflows', 'overflowing', 'burns', 'burning',
  /* §4 makes OBSERVATION of a physical hazard qualifying, so these stay. They were briefly deleted
     to reject research reporting and that was wrong: it made "Earthquake detected near Hilo" and
     "Lava observed at Kilauea" false, which are exactly the observations the contract admits.
     The research family is discriminated by its OBJECT instead -- see RESEARCH_OBJECT. */
  'observed', 'detected', 'recorded', 'reported'
];

/* §4 research aftermath, by the object rather than the verb. The verb in "lava observed at
   Kilauea" and in "researchers reported lava chemistry changes" is the same kind of word; what
   differs is whether what is observed is the hazard or a finding about it.

   A `research` stop-word was tried and rejected: it also deletes "HVO researchers report lava
   continues at Kilauea", a real volcano update the contract requires. Words that could name real
   forecast products -- `data`, `models`, `trends` -- are deliberately absent, because radar data
   detecting rotation is an observation, not a paper. */
const RESEARCH_OBJECT = [
  'findings', 'finding', 'chemistry', 'composition', 'analysis', 'samples', 'sample',
  'study', 'studies', 'paper', 'journal', 'peer reviewed', 'measurements', 'isotopes'
];

/* The fixed phrases that say an alert is STILL IN FORCE. Narrow on purpose: these can only
   predicate an alert, unlike bare `active` or `continues`, which is what let "active
   investigation continues" revive a cancelled advisory. */
const ALERT_IN_FORCE = [
  'in effect', 'remains in effect', 'still in effect', 'remains active', 'still active',
  'remains in force', 'in force'
];

/* Group B — a protective action. A warning, advisory, evacuation order or shelter named in a
   hazard clause is in effect unless that clause resolves or negates it, which is what makes
   "High surf warning for north shores of Kauai" qualify with no verb at all. */
/* The NOUNS that name a protective action. Split out from the issuance verbs because gate 1 needs
   to name them: a clause mentioning a warning, an evacuation order or an open shelter is about the
   same event as the hazard clause beside it, which is how "O'ahu shelters open" lends its anchor
   to "the islands brace for flash flooding". A council meeting does not. */
const PROTECTIVE_SUBJECT = [
  'warning', 'warnings', 'watch', 'watches', 'advisory', 'advisories',
  'evacuation', 'evacuations', 'evacuation order', 'evacuation orders',
  'evacuees', 'evacuee', 'order', 'orders',
  'shelter', 'shelters', 'emergency shelter', 'emergency shelters',
  'declaration', 'proclamation', 'curfew', 'curfews',
  'boil water notice', 'boil water order', 'siren', 'sirens'
];
/* The verbs and markers that put one in force. */
const PROTECTIVE_ISSUANCE = [
  'evacuate', 'evacuated', 'ordered', 'mandatory',
  'declared', 'declares', 'signs', 'issued', 'issues', 'activated',
  'opens', 'opened', 'urged', 'urges', 'advised', 'advises'
];
const PROTECTIVE_ACTION = PROTECTIVE_SUBJECT.concat(PROTECTIVE_ISSUANCE);

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
  /* The contract names long-term recovery as an indirect family and the capture supplied the
     case: mitigation work still underway months after a storm is recovery reporting, not an
     active hazard. The residual risk is recorded in the handoff -- an active search-and-recovery
     operation would also carry `recovery`, and no capture item exercised that. */
  'mitigation', 'mitigation work', 'recovery', 'recovery work', 'long term recovery', 'rebuilding',
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

/* How far an association reaches, in tokens, inside one clause. Negation, resolution and the
   hazard evidence itself are associated with the assertion they modify by this window rather than
   by presence anywhere in the clause. Clause-scoped was not enough: review found both failures it
   produces. "Tsunami advisory cancelled, active investigation continues in Hawaii" revived a
   cancelled advisory, because persistence anywhere overrode resolution anywhere. */
const CLAIM_REACH = 4;

/* Start positions of every occurrence of every phrase, in token space. */
function phrasePositions(tokens, phrases) {
  const at = [];
  for (const phrase of phrases) {
    const parts = phrase.split(' ');
    for (let i = 0; i + parts.length <= tokens.length; i++) {
      let hit = true;
      for (let k = 0; k < parts.length; k++) {
        if (tokens[i + k] !== parts[k]) { hit = false; break; }
      }
      if (hit) at.push(i);
    }
  }
  return at;
}

/* Every token position COVERED by one of the phrases, not just the position it starts at. Used to
   ask whether a hazard word is part of a standing feature: in "lava field" the word `lava` is
   still hazard vocabulary, and position 0 is covered by the feature. */
function coveredPositions(tokens, phrases) {
  const covered = [];
  for (const phrase of phrases) {
    const parts = phrase.split(' ');
    for (const i of phrasePositions(tokens, [phrase])) {
      for (let k = 0; k < parts.length; k++) covered.push(i + k);
    }
  }
  return covered;
}

/* Distance from i to the closest listed position, or -1 when there is none. `before` restricts the
   search to positions ahead of i, which is what negation needs: "no tsunami threat" cancels the
   threat, while "threat ... no injuries" does not. */
function closestDistance(positions, i, before) {
  let best = -1;
  for (const p of positions) {
    if (before && p >= i) continue;
    const d = Math.abs(p - i);
    if (best === -1 || d < best) best = d;
  }
  return best;
}
function reaches(positions, i, before) {
  const d = closestDistance(positions, i, before);
  return d !== -1 && d <= CLAIM_REACH;
}

/* The first anchor at or after i, which is the locality a claim is about. "lifted for Lahaina"
   and "remains in effect for Olowalu" are two claims with two localities, and that is the only
   thing separating them. Falls back to the nearest anchor before i, then to ''. */
function claimLocality(tokens, anchorsAt, i) {
  let after = -1;
  for (const p of anchorsAt) if (p >= i && (after === -1 || p < after)) after = p;
  if (after !== -1) return tokens[after];
  let before = -1;
  for (const p of anchorsAt) if (p < i && p > before) before = p;
  return before === -1 ? '' : tokens[before];
}

/* One row of the decision table is satisfied when its context requirement is met. `allOf` is a
   conjunction of groups and `context` the single-group form; a row declares one or the other.

   This is shared, and that matters: the position list and the boolean each had their own copy of
   this test, and a mutation loosening the conjunction changed only one of them. Two copies of a
   decision cannot be shown to be load-bearing. */
function rowSatisfied(norm, g) {
  if (g.allOf) return g.allOf.every(group => hasAny(norm, group));
  return hasAny(norm, g.context);
}

/* WHERE the hazard vocabulary sits, which is also WHETHER there is any -- gate 2 and the proximity
   test are one authority rather than two. Only idioms are subtracted here, because an idiom is not
   hazard language at all. A PERMANENT FEATURE is: `lava` in "lava field" remains hazard
   vocabulary, so the record still reaches the event gate and is rejected there, which is what the
   contract requires of all nine amendment negatives. */
function hazardEvidencePositions(clause) {
  const text = stripPhrases(clause, HAZARD_IDIOMS);
  const tokens = clause.split(' ');
  let at = phrasePositions(tokens, HAZARD_DIRECT);
  for (const g of HAZARD_CONTEXT) {
    if (rowSatisfied(text, g)) at = at.concat(phrasePositions(tokens, g.terms));
  }
  return at.filter(p => hasPhrase(text, tokens[p]));
}

/* Gate 2 for one clause. Named so the suite can assert on the SAME expression the gate uses rather
   than on a copy of it: the idiom subtraction empties a clause of evidence, and through the label
   alone that is indistinguishable from "no event asserted". */
function clauseHazardEvidence(clause) {
  return hazardEvidencePositions(clause).length > 0;
}

/* The hazard positions that can support an EVENT -- gate 2's positions minus the ones sitting
   inside a standing feature. A lava field, a floodplain and a hurricane season are all hazard
   vocabulary and none of them is something happening. */
function eventEvidencePositions(clause) {
  const tokens = clause.split(' ');
  const standing = coveredPositions(tokens, PERMANENT_FEATURES);
  return hazardEvidencePositions(clause).filter(p => standing.indexOf(p) === -1);
}

/* The one place the third gate is decided, for one clause. Returns the group that qualified, or
   '' -- a named result rather than a bare boolean so the ledgers can say WHICH group fired. */
function clauseEventState(clause) {
  const tokens = clause.split(' ');
  /* Gate 2's hazard words, minus standing features, are the positions assertions must sit near. */
  const evidence = eventEvidencePositions(clause);
  if (!evidence.length) return '';
  const negation = phrasePositions(tokens, NEGATION);
  const resolution = phrasePositions(tokens, RESOLUTION);
  const research = phrasePositions(tokens, RESEARCH_OBJECT);
  const anchorsAt = phrasePositions(tokens, HAWAII_ANCHORS);
  const framed = hasAny(clause, HISTORICAL_FRAME) || hasAny(clause, EXERCISE_FRAME);
  const indirect = hasAny(clause, INDIRECT_FRAME);

  /* A protective action whose clause carries a resolution is normally resolved by it. The one
     exception the contract requires: a resolution and a continuation that name DIFFERENT places
     are different claims -- "the evacuation order, lifted for Lahaina, remains in effect for
     Olowalu" is a live order for Olowalu. "...is no longer in effect" names no second place, so it
     stays resolved. */
  const inForceElsewhere = () => {
    for (const i of phrasePositions(tokens, ALERT_IN_FORCE)) {
      const here = claimLocality(tokens, anchorsAt, i);
      if (!here) continue;
      for (const r of resolution) {
        if (claimLocality(tokens, anchorsAt, r) !== here) return true;
      }
    }
    return false;
  };

  /* One occurrence is live when a hazard sits within reach of it and nothing within reach negates
     or resolves it. `namesTheAction` is true for a protective action, because a warning or an
     evacuation order IS the subject of its clause, so a resolution anywhere in that clause
     resolves it. A hazard verb or a consequence belongs to whatever sits beside it, so both are
     scoped by reach. */
  const live = (phrases, namesTheAction) => {
    for (const i of phrasePositions(tokens, phrases)) {
      if (!reaches(evidence, i, false)) continue;
      if (reaches(negation, i, true)) continue;
      /* §4 research: observation of a hazard qualifies, reporting a FINDING about one does not.
         The verb is the same, so the object decides -- "lava observed at Kilauea" against
         "researchers reported lava chemistry changes". */
      if (reaches(research, i, false)) continue;
      if (namesTheAction) {
        if (resolution.length > 0 && !inForceElsewhere()) continue;
      } else if (reaches(resolution, i, false)) continue;
      return true;
    }
    return false;
  };

  /* H21: history, preparedness and indirect aftermath disqualify a hazard assertion and a
     protective action, but NOT a direct consequence that remains active. The contract is explicit
     that an active public-safety consequence still qualifies: "On the anniversary of the Maui
     wildfire, Honoapiilani Highway remains closed by flood damage" is an open closure whatever
     framed the sentence. The consequence still needs a hazard beside it, which is what keeps an
     anniversary piece about a harbour closed for repairs out. */
  if (!framed && !indirect && live(EVENT_ONSET, false)) return 'onset';
  if (!framed && !indirect && live(PROTECTIVE_ACTION, true)) return 'protective';
  if (live(ACTIVE_CONSEQUENCE, false)) return 'consequence';
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

/* REMOTE LOCALITY — H06. A bounded, named list, seeded the same way the Hawaii vocabulary was:
   the contract's own negatives plus real capture text. It is deliberately not a world gazetteer,
   and the residual is recorded in the handoff rather than implied to be closed. */
const REMOTE_LOCALITY = [
  /* the contract's H06 negatives */
  'california', 'texas',
  /* every remote origin the 2026-10-29 five-feed capture actually carried */
  'japan', 'bonin islands', 'vanuatu', 'melanesia', 'russia', 'ukraine',
  'pacific coast highway',
  /* the other mainland and Pacific origins these feeds carry wire copy from */
  'florida', 'louisiana', 'carolina', 'oregon', 'alaska', 'arizona', 'nevada',
  'los angeles', 'san francisco', 'new york', 'mexico', 'puerto rico',
  'philippines', 'taiwan', 'guam', 'indonesia', 'new zealand', 'australia', 'chile',
  'mainland'
];

/* A clause that OPENS with a preposition continues the one before it rather than making its own
   claim. This is what separates required positive 11, "Flood warning issued" / "for Maui through
   tonight", from unrelated local prose: "Maui council meets today" opens with its own subject. */
const CONTINUATION_OPENERS = [
  'for', 'in', 'on', 'at', 'near', 'across', 'through', 'over', 'along', 'from', 'to', 'of',
  'by', 'after', 'before', 'despite', 'amid', 'during', 'due', 'until', 'with', 'including',
  'between', 'around', 'off', 'up'
];
function isContinuation(clause) {
  return CONTINUATION_OPENERS.indexOf(clause.split(' ')[0]) !== -1;
}

/* Gate 1, scoped to the assertion it has to support — H06, H07, H22.

   An anchor inside the qualifying clause is always enough. Beyond that, borrowing is restricted
   three ways, because an anchor anywhere in the record let unrelated local prose localize a remote
   hazard:
     - a qualifying clause that names a remote place must carry its own anchor;
     - the lending clause has to be ABOUT the claim: it carries hazard vocabulary of its own, names
       a protective action, or is a prepositional continuation of the clause before it; and
     - a denial never lends.
   The residual is recorded in the handoff: a hazard clause naming no place at all can still
   borrow, because the only rule that would close that drops required positive 11. */
function hasLocalAnchor(clauses, qualifying) {
  if (qualifying.some(clause => hasHawaiiAnchor(clause))) return true;
  if (qualifying.length > 0 &&
      qualifying.every(clause => hasAny(clause, REMOTE_LOCALITY))) return false;
  for (const clause of clauses) {
    if (isDenialClause(clause)) continue;
    if (!hasHawaiiAnchor(clause)) continue;
    if (clauseHazardEvidence(clause) || hasAny(clause, PROTECTIVE_SUBJECT) ||
        isContinuation(clause)) return true;
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
     active operational consequence. Computed ONCE and handed to gate 3, because gate 3 has to
     scope locality to these same clauses -- deriving them twice left two copies of the event
     gate and no mutation could show either was load-bearing. */
  const qualifying = clauses.filter(clause => clauseEventState(clause));
  if (!qualifying.length) return false;
  /* Gate 3: locality that supports one of those assertions. */
  return hasLocalAnchor(clauses, qualifying);
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
