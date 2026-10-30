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
/* 'after' is NOT a clause boundary, in any form. It was one, then a zero-width one, and both were
   wrong: §4 names "the road remains closed after the flood" as qualifying, and breaking there puts
   the consequence in one clause and its hazard in the other, so neither qualifies. A preposition
   joins a claim to its cause; only the conjunctions below start a new claim. */
/* The conjunction is CAPTURED, so the splitter can say which breaks were sentence punctuation and
   which joined two clauses into one assertion chain. Review's H22 ruling makes that distinction
   load-bearing: an explicit conjunction may establish composition, a sentence boundary may not. */
const CLAUSE_BREAK_RE = /(?<!\b[a-z])[.!?;:]+(?=\s|$)|\s(but|while|however|although|though|as|and|meanwhile)\s/;

/* Clauses WITH the two things gate 1 needs about them: which field they came from, and whether an
   explicit conjunction joined them to the clause before. One authority -- splitClauses() below is
   defined in terms of this, so the two can never disagree about where a clause ends. */
function clauseRecords(title, summary) {
  const out = [];
  const fields = [[title, 'title'], [summary, 'summary']];
  for (const pair of fields) {
    const parts = String(pair[0] == null ? '' : pair[0]).toLowerCase().split(CLAUSE_BREAK_RE);
    let joined = false;
    for (let i = 0; i < parts.length; i += 2) {
      const text = hazardNormalize(parts[i]);
      if (text) out.push({ text: text, field: pair[1], joined: joined });
      /* An odd slot holds the captured conjunction, or undefined for sentence punctuation. */
      joined = parts[i + 1] !== undefined;
    }
  }
  return out;
}

function splitClauses(text) {
  return clauseRecords(text, '').map(c => c.text);
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
  /* Bare 'expire' from the live capture: NWS headlines are written in the present tense, as in
     'Flash Flood Warnings Expire for East Maui'. Without it an expired warning read as in force. */
  'expire',
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
     The research family is discriminated by observesHazard() instead, which asks whether the
     hazard HEADS the noun phrase the verb takes. An object vocabulary was tried first and was
     open-ended in both directions. */
  'observed', 'detected', 'recorded', 'reported'
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
  /* bare 'open' is how a shelter notice is actually written -- "O'ahu shelters open". It no longer
     carries a lending residual: protective-action lending was removed, so naming an open shelter
     cannot localize anything by itself. */
  'open', 'opens', 'opened', 'urged', 'urges', 'advised', 'advises'
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
   by presence anywhere in the clause. */
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

/* One row of the decision table is satisfied when its context requirement is met. `allOf` is a
   conjunction of groups and `context` the single-group form; a row declares one or the other.
   Shared by the position list and everything built on it, so no two expressions can disagree. */
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

/* WHICH PLACE a claim is about: the nearest anchor at or after it, falling back to the nearest one
   before it. A locality attaches to the phrase that introduces it, and `for Lahaina` follows the
   claim it modifies.

   This used to STOP the scan at the next claim-bearing token, so that in "Evacuation order for
   Lahaina lifted, remains in effect for Olowalu" the word `lifted` was not handed the distant
   Olowalu. That became dead weight once a protective SUBJECT consults its own locality: all six
   two-locality records decide the same way without it, and no mutation could show the stop list
   was load-bearing. It is gone rather than kept as a decision nothing can prove. */
function claimLocality(tokens, i, width) {
  const anchors = hawaiiAnchorPositions(tokens);
  for (let p = i + width; p < tokens.length; p++) {
    if (anchors.indexOf(p) !== -1) return tokens[p];
  }
  for (let p = i - 1; p >= 0; p--) {
    if (anchors.indexOf(p) !== -1) return tokens[p];
  }
  return '';
}

/* The verbs that report an observation. §4 makes observation of a physical hazard qualifying, so
   these are onset verbs -- but only when the hazard is WHAT WAS OBSERVED rather than the subject a
   finding is about. Two mechanisms were tried and both were wrong:

     a list of research objects   open-ended both ways: `evidence` missing, `measurements` rejecting
                                  a real observation
     hazard before/after the verb English permits both orders for both families:
                                  "USGS detected an earthquake near Hilo"      is an observation
                                  "Kilauea lava chemistry findings reported"   is a report

   What separates them is whether the hazard HEADS the verb's noun phrase. "detected an earthquake
   near Hilo" ends the phrase right after the hazard; "reported lava chemistry changes" carries two
   more nouns, so `lava` is a modifier of `changes`. */
const REPORT_VERBS = ['observed', 'detected', 'recorded', 'reported'];

/* Tokens that CLOSE a noun phrase. The phrase the verb takes runs to the nearest one of these. */
const PHRASE_ENDERS = [
  'near', 'in', 'on', 'at', 'across', 'off', 'along', 'from', 'to', 'of', 'by', 'for',
  'over', 'around', 'between', 'under', 'about', 'with', 'through', 'during',
  'after', 'before', 'and', 'or', 'that', 'which',
  'was', 'were', 'is', 'are', 'has', 'have', 'had', 'as', 'while'
];
/* Hazard-phenomenon compounds whose HEAD is not itself hazard vocabulary. `earthquake swarm` is
   the USGS term and its head is `swarm`, so the head test below would otherwise read a real
   detection as a non-hazard head. Used ONLY by the head test, deliberately not by gate 2, so
   adding a compound here cannot widen what counts as hazard evidence.

   This is a positive vocabulary with the same discipline as the locality list, and it has the same
   kind of residual: a compound head that is not listed reads as a non-hazard head and the
   observation is rejected. That is a recall gap and it is recorded in the handoff. */
const HAZARD_COMPOUNDS = [
  'earthquake swarm', 'earthquake swarms', 'quake swarm', 'quake swarms',
  'lava flow', 'lava flows', 'lava fountain', 'lava fountains',
  'ash plume', 'ash plumes', 'flood waters', 'floodwaters'
];

/* Which token positions a hazard phrase COVERS, as opposed to where one starts. The head test
   needs coverage, because the head of "earthquake swarm" is its second token. */
function hazardCoverage(clause) {
  const text = stripPhrases(clause, HAZARD_IDIOMS);
  const tokens = clause.split(' ');
  let cov = coveredPositions(tokens, HAZARD_DIRECT.concat(HAZARD_COMPOUNDS));
  for (const g of HAZARD_CONTEXT) {
    if (rowSatisfied(text, g)) cov = cov.concat(coveredPositions(tokens, g.terms));
  }
  return cov.filter(pos => hasPhrase(text, tokens[pos]));
}

/* §4: an observation asserts the physical event when the hazard HEADS the noun phrase the verb
   takes -- its subject when that phrase precedes the verb, its object when it follows. The head is
   the phrase's last token, and the phrase runs to the nearest phrase-ender.

   This is the fourth mechanism tried for one contract sentence, and the first that asks about the
   phrase rather than about distance. An object vocabulary was open-ended; word order was wrong in
   both directions; a token window recognized only noun phrases shaped like its own examples, so
   "a magnitude 4 earthquake" failed because `magnitude` was not an authored determiner. */
function observesHazard(tokens, coverage, i) {
  let start = i - 1;
  while (start >= 0 && PHRASE_ENDERS.indexOf(tokens[start]) === -1) start--;
  if (i - 1 > start && coverage.indexOf(i - 1) !== -1) return true;
  let end = i + 1;
  while (end < tokens.length && PHRASE_ENDERS.indexOf(tokens[end]) === -1) end++;
  if (end > i + 1 && coverage.indexOf(end - 1) !== -1) return true;
  return false;
}

/* History, preparedness and indirect aftermath all disqualify the same two groups and never the
   third, so they are ONE named predicate rather than two locals used identically. It is also what
   gate 1 needs: a clause the event gate would throw out must not be allowed to lend its locality
   to a clause it has nothing to do with. */
function clauseDisqualified(clause) {
  return hasAny(clause, HISTORICAL_FRAME) || hasAny(clause, EXERCISE_FRAME) ||
         hasAny(clause, INDIRECT_FRAME);
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
  const reportVerbs = phrasePositions(tokens, REPORT_VERBS);
  const coverage = reportVerbs.length ? hazardCoverage(clause) : [];


  /* A resolution and a claim that name DIFFERENT places are different claims. Both must NAME a
     place: an unnamed resolution is not a different locality, it is no locality, and without that
     "cancelled, no longer in effect for Hawaii" would rescue itself.

     `resolvedElsewhere` asks it of one position. The live capture is what forced it to apply to
     the protective SUBJECT and not only to an in-force phrase: "Flash flood warning for Hawaii
     Island, warning canceled for East Maui" is a warning in force for Hawaii Island, and scoping
     the cancellation only through `in effect` phrases deleted it. */
  const resolvedElsewhere = (i, width) => {
    const here = claimLocality(tokens, i, width);
    if (!here) return false;
    for (const r of resolution) {
      const there = claimLocality(tokens, r, 1);
      if (there && there !== here) return true;
    }
    return false;
  };
  const inForceElsewhere = () => {
    for (const i of phrasePositions(tokens, ALERT_IN_FORCE)) {
      if (resolvedElsewhere(i, 1)) return true;
    }
    return false;
  };

  const live = (phrases, namesTheAction) => {
    for (const i of phrasePositions(tokens, phrases)) {
      if (!reaches(evidence, i, false)) continue;
      if (reaches(negation, i, true)) continue;
      /* An observation qualifies on what it observed, so the hazard has to come FIRST. */
      if (reportVerbs.indexOf(i) !== -1 && !observesHazard(tokens, coverage, i)) continue;
      if (namesTheAction) {
        /* The action survives a resolution elsewhere in its clause when the resolution names a
           different place than it does, or when an in-force phrase does. */
        if (resolution.length > 0 && !resolvedElsewhere(i, 1) && !inForceElsewhere()) continue;
      } else if (reaches(resolution, i, false)) continue;
      return true;
    }
    return false;
  };

  /* H21: history, preparedness and indirect aftermath disqualify a hazard assertion and a
     protective action, but NOT a direct consequence that remains active. */
  if (!clauseDisqualified(clause) && live(EVENT_ONSET, false)) return 'onset';
  if (!clauseDisqualified(clause) && live(PROTECTIVE_ACTION, true)) return 'protective';
  if (live(ACTIVE_CONSEQUENCE, false)) return 'consequence';
  return '';
}

/* Does this clause carry an anchor that can localize a claim OUTSIDE a hazard denial? An anchor
   inside "no tsunami threat to Hawaii" cannot localize a Japan earthquake mentioned after it, but
   an anchor inside "no injuries in the Maui brush fire evacuation" is not denied at all -- what is
   denied there is injuries, not a hazard. So the test is whether the negation covering the anchor
   also covers hazard vocabulary. */
function anchorSupports(clause) {
  const tokens = clause.split(' ');
  const anchors = hawaiiAnchorPositions(tokens);
  if (!anchors.length) return false;
  const negation = phrasePositions(tokens, NEGATION);
  const evidence = hazardEvidencePositions(clause);
  for (const a of anchors) {
    let denied = false;
    for (const n of negation) {
      if (n >= a || a - n > CLAIM_REACH) continue;
      if (evidence.some(e => e >= n && e - n <= CLAIM_REACH)) { denied = true; break; }
    }
    if (!denied) return true;
  }
  return false;
}

/* The words a bare locality fragment may contain, as a CLOSED list. "for Maui through tonight" is
   required positive 11's complementary summary and has no claim of its own; "In Maui, the council
   meets today" opens with a preposition and then makes one. Testing for a leading preposition
   could not tell them apart, which is what let unrelated local prose lend its anchor. */
const FRAGMENT_TOKENS = [
  'for', 'in', 'on', 'at', 'near', 'across', 'through', 'over', 'along', 'from', 'to', 'of',
  'by', 'around', 'between', 'off', 'up', 'and', 'or',
  'the', 'a', 'an', 'its', 'this', 'that', 'these', 'those', 'all', 'parts', 'part',
  'north', 'south', 'east', 'west', 'windward', 'leeward', 'shore', 'shores', 'coast',
  /* 'mauka' and 'makai' are how local forecasts name inland and seaward areas, and the capture
     put a real Maui flooding threat behind 'mauka areas of Maui'. */
  'mauka', 'makai',
  'county', 'counties', 'island', 'islands', 'district', 'districts', 'side', 'sides',
  'area', 'areas', 'region', 'regions', 'town', 'towns', 'valley',
  'tonight', 'today', 'tomorrow', 'morning', 'afternoon', 'evening', 'overnight', 'now',
  'hour', 'hours', 'day', 'days', 'week', 'weekend', 'month', 'until', 'late', 'early',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'am', 'pm', 'noon', 'midnight'
];
function isLocalityFragment(clause) {
  const tokens = clause.split(' ');
  const anchorTokens = coveredPositions(tokens, HAWAII_ANCHORS);
  for (let i = 0; i < tokens.length; i++) {
    if (anchorTokens.indexOf(i) !== -1) continue;
    if (/^[0-9]+$/.test(tokens[i])) continue;
    if (FRAGMENT_TOKENS.indexOf(tokens[i]) === -1) return false;
  }
  return true;
}

/* The hazard SUBJECTS a clause names, whether or not its context row is satisfied there. A clause
   that says `swell` and a clause that says `swell` are about the same hazard; a clause that says
   `wildfire` and one that says `shelter` are not. Row satisfaction is deliberately NOT required,
   because the whole point is a clause that carries locality and a partial hazard mention while the
   evidence that satisfies the row sits in the other field. */
/* The SUBJECTS a clause names -- hazards and protective actions both. Composition is established
   by a shared subject, so an advisory and an advisory compose, and a wildfire and a shelter do
   not. */
function claimSubjects(clause) {
  const subjects = hazardTerms(clause);
  for (const t of PROTECTIVE_SUBJECT) if (hasPhrase(clause, t)) subjects.push(t);
  return subjects;
}

function hazardTerms(clause) {
  const text = stripPhrases(clause, HAZARD_IDIOMS);
  const found = [];
  for (const phrase of HAZARD_DIRECT) if (hasPhrase(text, phrase)) found.push(phrase);
  for (const g of HAZARD_CONTEXT) {
    for (const t of g.terms) if (hasPhrase(text, t)) found.push(t);
  }
  return found;
}

/* The clauses reachable from j by captured conjunctions, inside one field. "Here is what to know
   about shelters AND public transportation AS the islands brace for flash flooding" is one
   assertion chain of three clauses; a sentence boundary starts a new one.

   This is what makes a witness mean something. Sharing a FIELD with the assertion was not enough:
   "Shelters receive donations. California wildfire threatens homes." puts a shelter witness and a
   wildfire claim in one summary with nothing connecting them. */
function conjunctionChain(clauses, j) {
  const chain = [j];
  for (let k = j; k > 0; k--) {
    if (!clauses[k].joined || clauses[k].field !== clauses[k - 1].field) break;
    chain.push(k - 1);
  }
  for (let k = j + 1; k < clauses.length; k++) {
    if (!clauses[k].joined || clauses[k].field !== clauses[k - 1].field) break;
    chain.push(k);
  }
  return chain;
}

/* Gate 1, scoped to the assertion it has to support — H06, H07, H22.

   An anchor inside the qualifying clause is always enough. Borrowing needs a relationship that
   connects the lender TO THE QUALIFYING ASSERTION, not merely to something else in the record.
   Review's two findings were the same defect twice: the implementation had two edges and never
   proved they formed one claim. So each branch below names both ends.

     (1) a bare locality fragment IMMEDIATELY BESIDE the assertion -- required positive 11's
         "Flood warning issued" / "for Maui through tonight", where the fragment continues the
         clause that carries the assertion and nothing else;
     (2) a HAZARD-bearing clause joined to the assertion by a captured conjunction inside one
         field, where the assertion is a protective action or a consequence -- required positive
         2's "Maui brush fire is contained, BUT the evacuation order remains in effect", which is
         a hazard and the protective action it caused, explicitly joined. A conjunction alone is
         not the relationship: "Maui council meets today, while California wildfire threatens
         homes" joins two unrelated claims, and the lender there carries no hazard at all;
     (3) a subject shared with a clause in the assertion's own conjunction chain -- the live
         Need2Know record, where `shelters` is in the title and again in the summary clause that
         chains into the flood claim through `and` and `as`.

   Category alone may not compose, which is review's ruling, and nor may a clause the event gate
   disqualifies as history, preparedness or indirect aftermath. A RESOLVED clause may still lend,
   because required positive 2 depends on it. */
function hasLocalAnchor(qualified, clauses) {
  if (qualified.some(q => anchorSupports(q.text))) return true;
  for (let i = 0; i < clauses.length; i++) {
    const lender = clauses[i];
    if (!anchorSupports(lender.text)) continue;
    if (clauseDisqualified(lender.text)) continue;
    const subjects = claimSubjects(lender.text);
    const lenderHazards = hazardTerms(lender.text);
    for (const q of qualified) {
      const j = clauses.indexOf(q);
      /* (1) */
      if (Math.abs(i - j) === 1 && isLocalityFragment(lender.text)) return true;
      /* (2) */
      if (lenderHazards.length && lender.field === q.field && Math.abs(i - j) === 1 &&
          (i < j ? q.joined : lender.joined) &&
          (q.state === 'protective' || q.state === 'consequence')) return true;
      /* (3) */
      if (subjects.length) {
        for (const k of conjunctionChain(clauses, j)) {
          if (clauses[k] === lender) continue;
          if (subjects.some(t => hasPhrase(clauses[k].text, t))) return true;
        }
      }
    }
  }
  return false;
}
/* WHERE the Hawaii anchors are. One authority: the gate needs positions and the suite needs a
   boolean, and building the boolean on the positions is what stops the two from disagreeing. */
function hawaiiAnchorPositions(tokens) {
  return phrasePositions(tokens, HAWAII_ANCHORS);
}
function hasHawaiiAnchor(norm) {
  return hawaiiAnchorPositions(String(norm == null ? '' : norm).split(' ')).length > 0;
}

/* The ONE producer of the item-level hazard boolean -- H01. Pure: same input, same answer, no
   clock, no network, no outlet identity, and H19 adds that publication time cannot reach it
   either. Publisher name is not part of the evidence record, so a Hawai'i outlet carrying
   national wire copy cannot pass the locality gate on its masthead.

   All three gates are answered INSIDE the clause that makes the claim. There is no record-wide
   evidence test any more: a clause-scoped one implies it, and keeping both would have left two
   redundant checks where neither could be shown to be load-bearing. */
function classifyHazard(title, summary) {
  const clauses = clauseRecords(title, summary);
  /* Gates 1 and 2, per clause: hazard evidence plus an asserted event, protective action or
     active operational consequence. Computed ONCE and handed to gate 3, which needs the GROUP
     each clause qualified under -- what may lend locality depends on what is being localized. */
  const qualified = [];
  for (const clause of clauses) {
    const state = clauseEventState(clause.text);
    if (state) { clause.state = state; qualified.push(clause); }
  }
  if (!qualified.length) return false;
  /* Gate 3: locality that supports one of those assertions. */
  return hasLocalAnchor(qualified, clauses);
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
