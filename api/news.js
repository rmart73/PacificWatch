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

/* HAZARD CLASSIFICATION — see HAZARD-CLASSIFIER-CONTRACT.md, H01-H18.
 *
 * Two gates, both required: actionable hazard evidence AND explicit Hawai'i relevance.
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
     outage story. Its absence dropped a hurricane-outage story from the capture. */
  'hawaiian', 'hawaiian islands', 'hawaiian electric',
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
  'hurricane', 'tropical storm', 'tropical depression', 'tsunami',
  'earthquake', 'earthquakes', 'quake', 'quakes',
  'flash flood', 'flash flooding', 'flooding', 'flood warning', 'flood watch',
  'flood advisory', 'flood conditions',
  'wildfire', 'wildfires', 'brush fire', 'brush fires', 'wildland fire',
  'volcano', 'volcanic', 'lava', 'vog',
  'high surf', 'storm surge', 'landslide', 'mudslide', 'rockfall',
  'evacuation', 'evacuations', 'evacuate', 'evacuated', 'evacuee', 'evacuees'
];

/* CONTEXT-DEPENDENT FAMILIES -- the contract's decision table, one entry per row.
   Each needs its own term AND one of its context terms in the same record. */
const HAZARD_CONTEXT = [
  { terms: ['erupt', 'erupts', 'erupted', 'eruption', 'eruptions'],
    context: ['volcano', 'volcanic', 'lava', 'kilauea', 'mauna loa', 'hvo',
              'hawaiian volcano observatory', 'summit', 'caldera', 'vent', 'fissure'] },
  { terms: ['swell', 'swells', 'swelling'],
    context: ['high', 'large', 'dangerous', 'ocean', 'surf', 'shore', 'shores',
              'north shore', 'waves', 'coastal'] },
  { terms: ['emergency'],
    context: ['declaration', 'declared', 'proclamation', 'state of emergency', 'disaster',
              'evacuation', 'evacuate', 'shelter', 'shelters', 'hiema', 'civil defense'] },
  { terms: ['warning', 'warnings', 'watch', 'watches', 'advisory', 'advisories'],
    context: ['hurricane', 'tropical storm', 'tsunami', 'flood', 'flooding', 'flash flood',
              'high surf', 'surf', 'wind', 'winds', 'storm surge', 'fire', 'wildfire',
              'brush fire', 'volcanic', 'lava', 'ashfall', 'small craft', 'gale'] },
  { terms: ['shelter', 'shelters'],
    context: ['emergency', 'evacuation', 'evacuate', 'evacuee', 'evacuees', 'disaster',
              'hurricane', 'tropical storm', 'flood', 'wildfire', 'brush fire', 'storm'] },
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

/* 'closed'/'closure' are never independent: the contract says the story must carry other hazard
   evidence, so they are deliberately absent from both lists above. A road closed BY a brush fire
   qualifies on the brush fire, which is the point. */

function hasHazardEvidence(norm) {
  if (hasAny(norm, HAZARD_DIRECT)) return true;
  for (const g of HAZARD_CONTEXT) {
    if (hasAny(norm, g.terms) && hasAny(norm, g.context)) return true;
  }
  return false;
}

function hasHawaiiAnchor(norm) {
  return hasAny(norm, HAWAII_ANCHORS);
}

/* The ONE producer of the item-level hazard boolean -- H01. Pure: same input, same answer, no
   clock, no network, no outlet identity. Publisher name is not part of the evidence record, so a
   Hawai'i outlet carrying national wire copy cannot pass the locality gate on its masthead. */
function classifyHazard(title, summary) {
  const norm = hazardNormalize(String(title || '') + ' ' + String(summary || ''));
  if (!norm) return false;
  /* An idiom removes the phrase that produced it, so a story carrying BOTH an idiom and real
     hazard language still qualifies on the real language. */
  let evidenceText = norm;
  for (const idiom of HAZARD_IDIOMS) {
    evidenceText = (' ' + evidenceText + ' ').split(' ' + idiom + ' ').join(' ').trim();
  }
  return hasHazardEvidence(evidenceText) && hasHawaiiAnchor(norm);
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
