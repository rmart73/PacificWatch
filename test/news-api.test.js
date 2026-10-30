/* G1 abuse and cost bounding — deterministic tests for the News API.

   Pure Node, no dependencies, part of `npm test`. Stubs global.fetch and COUNTS upstream
   attempts, because the property under test is not "what does it return" but "how much upstream
   work can a caller cause". A refusal that still fetched five feeds would pass a status-code
   assertion and fail the point of G1 entirely.

   Expectations are written independently: the hazard set is defined here from the fixture text,
   not derived by calling the module's own HAZARD_RE. The user agent is asserted as a complete
   literal rather than as "some UA is present".

   Governed by G1-ABUSE-BOUNDING-CONTRACT.md, G01-G18, and HAZARD-CLASSIFIER-CONTRACT.md,
   H01-H24. */
const path = require('path');
/* Takes an api/news.js path so test/mutation-check.js can aim it at a mutant, exactly as the DOM
   and contrast suites take an html path. Defaults to the real file. */
const API_PATH = process.argv[2] || path.join(__dirname, '..', 'api', 'news.js');
const all = require(API_PATH);
const serve = all.serve;
/* The hazard entrypoint is always read from the repo: it is a three-line wrapper whose only job
   is to delegate, and a mutant copy in a temp directory could not resolve its relative require. */
const HAZARD_PATH = path.join(__dirname, '..', 'api', 'news', 'hazard.js');
const hazardEntry = require(HAZARD_PATH);

/* classifyHazard is module-private, so it is lifted out of the SAME source text the handler is
   loaded from. Requiring the module would not expose it, and re-implementing it here would make
   the corpus agree with a copy rather than with the shipped code. */
const lifted = (() => {
  const src = require('fs').readFileSync(API_PATH, 'utf8').replace(/module\.exports[\s\S]*$/, '');
  return new Function(src + '; return { classifyHazard: classifyHazard, ' +
    'hazardNormalize: hazardNormalize, hasHawaiiAnchor: hasHawaiiAnchor, ' +
    'splitClauses: splitClauses, clauseHazardEvidence: clauseHazardEvidence };')();
})();
const classify = lifted.classifyHazard;
/* H19 is a claim about WHICH gate rejects a record, and that cannot be tested through the boolean
   alone: a negative that failed the hazard or locality gate would pass the amendment corpus while
   proving nothing about the third gate. These two expose the first two gates so each amendment
   negative can be shown to REACH the third one. */
const reachesThirdGate = (text) => {
  const clauses = lifted.splitClauses(text);
  return clauses.some(c => lifted.clauseHazardEvidence(c)) &&
         clauses.some(c => lifted.hasHawaiiAnchor(c));
};

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (ok) { pass++; console.log('  PASS  ' + label); }
  else { fail++; console.log('  FAIL  ' + label + '\n          got:      ' + JSON.stringify(actual) + '\n          expected: ' + JSON.stringify(expected)); }
}

/* ---- fixtures -------------------------------------------------------------------------- */

/* Five outlets, matching the real FEEDS length. Titles are chosen so the hazard split is decided
   by READING them against the contract's two gates, not by running the classifier over them:
     HAZARD:     hazard evidence AND a Hawai'i anchor
     NOT HAZARD: a Hawai'i anchor and NO hazard evidence
   Each feed yields one of each, so 5 feeds -> 10 items, 5 hazard.

   Every ordinary title carries an anchor on purpose. Under the two-gate contract a fixture whose
   negatives lacked locality would pass for the wrong reason -- the locality gate would be doing
   the work and the hazard gate would never be tested. These isolate the hazard gate. */
/* CONTRACT-DRIVEN CORRECTION, not a convenience edit. This fixture used to read "Tsunami advisory
   LIFTED for Hawaii County" and was counted as a hazard item. That is the exact shape of the
   amendment's required negative 2, so under H19/H20 it must now classify FALSE and could no longer
   stand as a hazard fixture. It is restated as an advisory that is in effect, which is what the
   fixture was always for -- five hazard items, one per feed, decided by reading the title. */
const HAZARD_TITLES = ['Flood warning issued for Oahu', 'Hurricane nears Maui',
                       'Tsunami advisory in effect for Hawaii County', 'Evacuation ordered on Kauai',
                       'Storm surge expected on Molokai'];
const PLAIN_TITLES  = ['Bake sale Saturday in Hilo', 'Museum opening in downtown Honolulu',
                       'Jazz festival lineup announced on Maui', 'Library hours change on Kauai',
                       'Farmers market returns to Oahu'];

function feedXml(i) {
  const t = new Date(Date.UTC(2026, 8, 26, 12, i)).toUTCString();
  return '<rss><channel>' +
    '<item><title>' + HAZARD_TITLES[i] + '</title><link>https://example.test/h' + i +
      '</link><description>d</description><pubDate>' + t + '</pubDate></item>' +
    '<item><title>' + PLAIN_TITLES[i] + '</title><link>https://example.test/p' + i +
      '</link><description>d</description><pubDate>' + t + '</pubDate></item>' +
    '</channel></rss>';
}

/* BULK fixture: 60 items across five feeds, with every hazard item older than every ordinary
   one. Filtering over the whole pool yields 30 hazard items; filtering after a newest-30 cap
   would yield none of them. The difference is the entire justification for a separate hazard
   representation, so it must be exercised by a fixture that overflows the cap. */
/* &#699; is the 'okina. The ONLY Hawaii anchor in this fixture is entity-encoded, so the item can
   only be classified if decode() produces it and the classifier then sees the decoded form. */
const ENCODED_TITLE = 'Flood warning for Kaua&#699;i';
let encoded = false;
function encodedFeedXml() {
  const t = new Date(Date.UTC(2026, 9, 2, 12, 0)).toUTCString();
  return '<rss><channel><item><title>' + ENCODED_TITLE +
    '</title><link>https://example.test/enc</link><description>d</description>' +
    '<pubDate>' + t + '</pubDate></item></channel></rss>';
}

/* N02 SERVER INVARIANT fixture. The client validator is defense-in-depth; the reason a truthy
   malformed publication time cannot reach the renderer today is that THIS handler emits only
   null or exact toISOString() output. That is an invariant, not an accident, so it is asserted
   at the boundary that produces it -- if it is ever weakened, this fails here rather than
   silently shifting the burden onto the page. RSS parsing itself is unchanged. */
let pubDates = null;            /* raw pubDate strings, emitted verbatim into the feed */
function pubDateFeedXml(i) {
  if (i !== 0) return '<rss><channel></channel></rss>';
  let out = '<rss><channel>';
  pubDates.forEach(function (raw, k) {
    out += '<item><title>Flood warning for Oahu ' + k + '</title><link>https://example.test/pd' +
           k + '</link><description>d</description><pubDate>' + raw + '</pubDate></item>';
  });
  return out + '</channel></rss>';
}

let bulk = false;
function bulkFeedXml(i) {
  let out = '<rss><channel>';
  for (let k = 0; k < 6; k++) {          /* 6 ordinary, newest */
    const t = new Date(Date.UTC(2026, 8, 26, 20, i * 6 + k)).toUTCString();
    out += '<item><title>Community notice for Hilo ' + i + '-' + k + '</title><link>https://example.test/n' +
           i + k + '</link><description>d</description><pubDate>' + t + '</pubDate></item>';
  }
  for (let k = 0; k < 6; k++) {          /* 6 hazard, oldest */
    const t = new Date(Date.UTC(2026, 8, 26, 2, i * 6 + k)).toUTCString();
    out += '<item><title>Flood warning for Oahu ' + i + '-' + k + '</title><link>https://example.test/f' +
           i + k + '</link><description>d</description><pubDate>' + t + '</pubDate></item>';
  }
  return out + '</channel></rss>';
}

let upstream = 0;          // every attempted upstream request
let lastHeaders = null;    // headers of the most recent upstream request
let failPattern = null;    // substring: matching feeds reject
let failAll = false;

function installFetch() {
  upstream = 0; lastHeaders = null;
  global.fetch = (url, opts) => {
    upstream++;
    lastHeaders = (opts && opts.headers) || {};
    const u = String(url);
    if (failAll) return Promise.reject(new Error('forced failure'));
    if (failPattern && u.includes(failPattern)) return Promise.reject(new Error('forced failure'));
    const idx = Math.max(0, upstream - 1);
    const xml = pubDates ? pubDateFeedXml(idx % 5)
                         : (encoded ? encodedFeedXml() : (bulk ? bulkFeedXml(idx % 5) : feedXml(idx % 5)));
    return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(xml) });
  };
}

function mockRes() {
  const headers = {};
  const out = { code: 0, body: null, ended: false, headers };
  return {
    setHeader(k, v) { headers[k] = v; },
    status(c) { out.code = c; return this; },
    json(b) { out.body = b; return this; },
    end() { out.ended = true; return this; },
    _out: out
  };
}

async function call(url, method, hazardOnly) {
  installFetch();
  const res = mockRes();
  await serve({ url: url, method: method || 'GET', headers: {} }, res, !!hazardOnly);
  return res._out;
}

async function main() {
  console.log('\nG05 — a canonical miss attempts at most five upstream requests:');
  let o = await call('/api/news', 'GET', false);
  check('all-headlines: exactly five upstream attempts', upstream, 5);
  check('all-headlines: 200', o.code, 200);
  o = await call('/api/news/hazard', 'GET', true);
  check('hazard: exactly five upstream attempts', upstream, 5);
  check('hazard: 200', o.code, 200);

  console.log('\nG01 — each representation is fixed at 30 items and selects correctly:');
  o = await call('/api/news', 'GET', false);
  check('all-headlines returns every fixture item (10 < 30 cap)', o.body.items.length, 10);
  /* Independently established: five of the ten fixture titles describe hazards. */
  check('and five of them are hazard-flagged', o.body.items.filter(i => i.hazard).length, 5);
  o = await call('/api/news/hazard', 'GET', true);
  check('hazard returns only hazard items', o.body.items.length, 5);
  check('and every one is hazard-flagged', o.body.items.every(i => i.hazard), true);
  check('no non-hazard item leaks into the hazard representation',
    o.body.items.filter(i => !i.hazard).length, 0);
  /* The independently written hazard set, compared by title rather than by re-running the regex. */
  check('the hazard items are exactly the ones a reader would pick',
    o.body.items.map(i => i.title).sort().join('|'), HAZARD_TITLES.slice().sort().join('|'));

  console.log('\nG01 — the 30-item cap binds, and hazard filters the POOL not the capped list:');
  bulk = true;
  o = await call('/api/news', 'GET', false);
  check('all-headlines caps at exactly 30 of the 60 available', o.body.items.length, 30);
  /* Independently established: the newest 30 of this fixture are all ordinary notices, because
     every hazard item was given an earlier timestamp. */
  check('and the newest 30 contain no hazard items', o.body.items.filter(i => i.hazard).length, 0);
  o = await call('/api/news/hazard', 'GET', true);
  check('hazard still finds all 30 of its items despite them being outside the newest 30',
    o.body.items.length, 30);
  check('and every one is hazard-flagged', o.body.items.every(i => i.hazard), true);
  check('which the browser could NOT derive by filtering the capped all-headlines list',
    0 < o.body.items.length, true);
  bulk = false;

  console.log('\nG04 — non-canonical input reaching the handler does ZERO upstream work:');
  /* A bare '?' with nothing after it is included deliberately: it was allowed as
     harmless-and-equivalent in an earlier version, and the exception is gone. */
  for (const q of ['?zzz=1', '?limit=99', '?hazard=1', '?limit=30&limit=31', '?a=1&b=2', '?%20=1', '?']) {
    o = await call('/api/news' + q, 'GET', false);
    check('refused ' + q + ' with 400', o.code, 400);
    check('  and attempted no upstream request', upstream, 0);
    check('  and is not cacheable', o.headers['Cache-Control'], 'no-store');
  }
  o = await call('/api/news?zzz=1', 'GET', false);
  check('the refusal does not echo the offending input',
    JSON.stringify(o.body).indexOf('zzz'), -1);

  console.log('\nG06 — method handling performs no upstream work:');
  o = await call('/api/news', 'OPTIONS', false);
  check('OPTIONS answers 204', o.code, 204);
  check('  with zero upstream attempts', upstream, 0);
  for (const m of ['POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']) {
    o = await call('/api/news', m, false);
    check(m + ' is refused 405', o.code, 405);
    check('  with an Allow header', o.headers['Allow'], 'GET, OPTIONS');
    check('  and zero upstream attempts', upstream, 0);
    /* A cacheable refusal would occupy a cache entry of its own, which is the shape G1 closes. */
    check('  and is not cacheable', o.headers['Cache-Control'], 'no-store');
  }

  console.log('\nG07 — partial feed failure stays honest:');
  failPattern = 'staradvertiser';
  o = await call('/api/news', 'GET', false);
  failPattern = null;
  check('a single failing outlet still returns the others', o.body.items.length > 0, true);
  check('and the failure is reported', o.body.errors.length, 1);
  check('and names the source', typeof o.body.errors[0].source, 'string');
  check('and the response is still 200', o.code, 200);
  check('one failure does not become a 502', o.code === 502, false);

  failAll = true;
  o = await call('/api/news', 'GET', false);
  failAll = false;
  check('all five failing returns 502 rather than an empty success', o.code, 502);
  check('  with no items', o.body.items.length, 0);
  check('  and all five failures reported', o.body.errors.length, 5);

  console.log('\nG08 — the Star-Advertiser user agent is asserted in full:');
  await call('/api/news', 'GET', false);
  const UA_EXPECTED = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                      '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  check('every upstream request carries the complete browser UA',
    lastHeaders['User-Agent'], UA_EXPECTED);
  check('and it is not a bare Mozilla/5.0, which the outlet 403s',
    lastHeaders['User-Agent'] === 'Mozilla/5.0', false);

  console.log('\nG08 — the eight-second abort path:');
  /* Controlled timers rather than real ones: the point is that each upstream request is armed
     with an abort at exactly 8000 ms, that expiry really aborts an in-flight request, and that
     the timer is cleared afterwards. A test that merely waited would prove none of it. */
  const realSetTimeout = global.setTimeout, realClearTimeout = global.clearTimeout;
  const timers = [];
  let nextTimerId = 1;
  global.setTimeout = (fn, delay) => { const id = nextTimerId++; timers.push({ id, delay, fn, cleared: false }); return id; };
  global.clearTimeout = (id) => { const t = timers.find(x => x.id === id); if (t) t.cleared = true; };

  const signals = [];
  global.fetch = (url, opts) => {
    signals.push(opts && opts.signal);
    /* Never settles on its own: only an abort can end it, which is what makes the timer the
       thing under test. */
    return new Promise((_resolve, reject) => {
      const s = opts.signal;
      s.addEventListener('abort', () => {
        const e = new Error('aborted'); e.name = 'AbortError'; reject(e);
      });
    });
  };

  const abortRes = mockRes();
  const pending = serve({ url: '/api/news', method: 'GET', headers: {} }, abortRes, false);
  check('every upstream request carries an abort signal',
    signals.length === 5 && signals.every(s => s && typeof s.aborted === 'boolean'), true);
  check('none has aborted before the timer fires', signals.every(s => s.aborted === false), true);
  /* 8000 ms is asserted as a literal. The figure is the project's documented per-feed timeout,
     not something derived from the module under test. */
  check('each feed arms a timer of exactly 8000 ms',
    timers.filter(x => x.delay === 8000).length, 5);
  check('and arms exactly one timer per feed', timers.length, 5);

  timers.forEach(x => x.fn());          /* expiry */
  const abortOut = await pending;
  check('expiry actually aborts the in-flight requests', signals.every(s => s.aborted === true), true);
  check('and every feed is reported as failed', abortRes._out.body.errors.length, 5);
  check('and the response is the honest 502, not an empty success', abortRes._out.code, 502);
  check('and every timer was cleared afterwards', timers.every(x => x.cleared), true);

  global.setTimeout = realSetTimeout;
  global.clearTimeout = realClearTimeout;

  console.log('\nG09 — successful responses keep the origin cache policy:');
  o = await call('/api/news', 'GET', false);
  check('origin declares 300s fresh and 900s stale-while-revalidate',
    o.headers['Cache-Control'], 'public, s-maxage=300, stale-while-revalidate=900');

  console.log('\nThe hazard entrypoint is a thin wrapper, not a second implementation:');
  check('api/news/hazard.js exports a function', typeof hazardEntry, 'function');
  check('api/news.js exports the shared serve()', typeof serve, 'function');
  const hazardSrc = require('fs').readFileSync(HAZARD_PATH, 'utf8');
  check('it defines no feed list of its own', /FEEDS\s*=/.test(hazardSrc), false);
  check('it defines no parser of its own', /function parseFeed/.test(hazardSrc), false);
  check('it defines no user agent of its own', /Mozilla/.test(hazardSrc), false);
  check('it delegates to the shared serve', /serve\(req, res, true\)/.test(hazardSrc), true);

    /* ======================================================================================
     HAZARD CLASSIFIER — HAZARD-CLASSIFIER-CONTRACT.md, H01-H18.

     Every expected label below is written here by reading the text against the contract's two
     gates. None is produced by calling the classifier or by reusing its vocabularies, which is
     what makes the corpus capable of failing in BOTH directions rather than agreeing with
     whatever the implementation happens to do.
     ====================================================================================== */
  console.log('\nH02 — an ENCODED anchor must survive decode() and reach the classifier:');
  /* The previous heading claimed "entities" while every assertion handed the classifier text that
     was already decoded. Nothing proved an encoded anchor travels the real path. This drives the
     HANDLER with an RSS body whose only Hawaii anchor is entity-encoded, so decode() has to
     produce it and the classifier has to see it. The classifier itself must NOT become a second
     entity decoder -- that is decode()'s job, and duplicating it is how the XSS ordering bug
     described there got introduced in the first place. */
  encoded = true;
  o = await call('/api/news', 'GET', false);
  encoded = false;
  const encodedItem = o.body.items.filter(i => i.title.indexOf('Flood warning for Kaua') !== -1)[0];
  check('the encoded item is returned', !!encodedItem, true);
  check('  its title is decoded in the response, not left as an entity',
    encodedItem && encodedItem.title.indexOf('&#699;') === -1, true);
  check('  and the decoded anchor reached the classifier',
    encodedItem && encodedItem.hazard, true);
  /* The classifier alone must not decode: handed the raw entity it sees no anchor. */
  check('the classifier does not decode entities itself',
    classify(ENCODED_TITLE, ''), false);

  console.log('\nH05 — the required negatives, each a measured failure of the predecessor:');
  /* All eleven returned TRUE under the old single-gate expression. None is a free pass. */
  const REQUIRED_NEGATIVES = [
    ['Gun sale erupted in gunfire in Honolulu.', ''],
    ['Honolulu Emergency Medical Services responds to stabbing.', ''],
    ['Warning sign for GOP as Hawaii voters head to polls.', ''],
    ['HI-5 fund swells after strong quarter in Hawaii.', ''],
    ['Honolulu DMV closed for holiday.', ''],
    ['California wildfire forces thousands to evacuate.', ''],
    ['Texas flood warning extended through Friday.', ''],
    ['Maui nonprofit animal shelter expands capacity.', ''],
    ['Candidate takes Oahu by storm.', ''],
    ['A flood of donations reaches a Hilo food bank.', ''],
    ['Storm damage repairs begin at an ocean view resort.', '']
  ];
  for (const [t, d] of REQUIRED_NEGATIVES) {
    check('false: ' + t.slice(0, 54), classify(t, d), false);
  }

  console.log('\nH05/H06/H07 — the required positives:');
  const REQUIRED_POSITIVES = [
    ['Hurricane warning issued for Hawaii County.', ''],
    ['Tropical storm approaches the Big Island.', ''],
    ['Flash flood warning issued for Oahu.', ''],
    /* H06: remote ORIGIN with stated Hawaii impact is local. */
    ['Japan quake prompts tsunami advisory for Hawaii.', ''],
    ['Kilauea eruption sends vog across Puna.', ''],
    ['Brush fire prompts Maui evacuation.', ''],
    ['High surf warning for north shores of Kauai.', ''],
    ['Power outage affects Hilo residents.', ''],
    ['Rockfall closes an Oahu highway.', ''],
    ['Emergency shelter opens on Kauai as storm approaches.', ''],
    /* H07: evidence split across the two fields, in both arrangements. */
    ['Flood warning issued', 'for Maui through tonight.'],
    ['HVO update', 'Kilauea lava activity continues.'],
    /* The recorded Nolo evacuation the first contract draft would have deleted. */
    ['Evacuation order issued for Olowalu Village due to brush fire',
     'Honoapiilani Highway is closed from North Kihei to Olowalu General Store.']
  ];
  for (const [t, d] of REQUIRED_POSITIVES) {
    check('true:  ' + (t + ' ' + d).slice(0, 54), classify(t, d), true);
  }

  console.log('\nH03 — locality is mandatory, and publisher identity never supplies it:');
  check('identical hazard wording WITH an anchor', classify('Flood warning issued for Maui', ''), true);
  check('  and WITHOUT one', classify('Flood warning issued', ''), false);
  /* H03. The classifier's signature is (title, summary): it is never handed `source` or
     `sourceId`, so publisher identity as a FIELD cannot satisfy locality. That is the claim H03
     actually makes, and these two assertions test it. */
  check('publisher-shaped text with no Hawaii place does not anchor',
    classify('KHON2 reports a Texas flood warning', ''), false);
  check('  nor does a second outlet name',
    classify('Civil Beat reports a California wildfire evacuation', ''), false);
  /* KNOWN RESIDUAL, recorded rather than asserted away: an outlet whose NAME contains "Hawaii"
     will anchor if that name appears in the title or summary text, because the token is
     indistinguishable from the place. Measured on the live feed at implementation time: 0 of 30
     items carried a publisher name inside title+summary, so this is latent rather than active.
     It is in the locality ledger; closing it needs a publisher-name stop list, which is a
     contract amendment rather than a silent vocabulary tweak. */
  check('the residual is real and asserted honestly: a Hawaii-named outlet DOES anchor',
    classify('Hawaii News Now reports a Texas flood warning', ''), true);

  console.log('\nH04 — locality vocabulary boundaries:');
  check('bare HI does not anchor', classify('HI flood warning issued', ''), false);
  check('bare island does not anchor', classify('Island flood warning issued', ''), false);
  check('HI-5 does not donate a locality token', classify('HI-5 flood warning', ''), false);
  check('the ocean view collision does not anchor',
    classify('Storm damage at an ocean view resort', ''), false);
  check('a real place does anchor', classify('Flood warning for Waimanalo', ''), true);

  console.log('\nH02 — normalization: case, punctuation, diacritics, entities, word boundaries:');
  check('uppercase', classify('FLASH FLOOD WARNING FOR OAHU', ''), true);
  check('diacritic spelling', classify('Flash flood warning for O\u02BBahu', ''), true);
  check('curly apostrophe spelling', classify('Flash flood warning for O\u2018ahu', ''), true);
  check('punctuation as separator', classify('Flash flood warning -- Oahu!', ''), true);
  /* Longer-word collisions the old substring expression would have matched. */
  check('vog does not match inside vogue', classify('Vogue photoshoot in Honolulu', ''), false);
  check('kona does not match inside konared', classify('Konared drink launch flood warning', ''), false);
  check('erupt does not match inside disrupted',
    classify('Disrupted ferry service in Honolulu', ''), false);

  console.log('\nH05 — the context-dependent families, both directions:');
  check('erupt WITHOUT volcanic context', classify('Argument erupted in Hilo', ''), false);
  check('erupt WITH volcanic context', classify('Lava erupted from the Kilauea vent', ''), true);
  check('swell WITHOUT ocean context', classify('Crowd swells in Honolulu', ''), false);
  check('swell WITH ocean context', classify('Dangerous ocean swells hit Oahu shores', ''), true);
  check('emergency WITHOUT declaration context',
    classify('Honolulu Emergency Medical Services responds', ''), false);
  check('emergency WITH declaration context',
    classify('Governor signs emergency proclamation for Maui', ''), true);
  check('warning WITHOUT a named hazard', classify('Economic warning for Hawaii', ''), false);
  check('warning WITH a named hazard', classify('High wind warning for Hawaii', ''), true);
  check('shelter WITHOUT emergency context', classify('Animal shelter opens in Hilo', ''), false);
  check('shelter WITH emergency context', classify('Evacuation shelter opens in Hilo', ''), true);
  check('outage WITHOUT utility context', classify('Service outage at a Maui bank', ''), false);
  check('outage WITH utility context', classify('Power outage across Maui', ''), true);
  check('closed is never independent', classify('Honolulu post office closed today', ''), false);
  /* The idiom strip exists for THIS shape. "storm" alone never qualifies, but "storm" plus
     "damage" is a physical construction and would — so "political storm damages ..." passes both
     halves of the context rule while being a metaphor. The contract's decision table names
     "political storm" explicitly; the first corpus pass tested the idiom with a sentence that was
     already false for other reasons, so the strip looked load-bearing and was not. */
  check('political storm with damage context is still a metaphor',
    classify("Political storm damages the Hawaii governor's standing", ''), false);
  check('  while a real storm with damage context qualifies',
    classify('Storm damage closes roads across Maui', ''), true);
  check('closed rides on other evidence',
    classify('Honoapiilani Highway closed by the Olowalu brush fire', ''), true);

  console.log('\nH04 — three gaps the real five-feed capture found, not the authored corpus:');
  /* Every one of these is a verbatim shape from the uncapped capture, and every one was a real
     Hawai'i hazard story that the authored vocabulary dropped. They are regression fixtures with
     provenance, which is the difference between a corpus that agrees with the implementation and
     one that could have caught it. */
  check('a possessive does not break an anchor: O\u02BBahu\u2019s North Shore',
    classify('Flood warning for O\u02BBahu\u2019s North Shore', ''), true);
  check('  and the bare form still anchors',
    classify('Flood warning for O\u02BBahu North Shore', ''), true);
  check('"the Hawaiian Islands" anchors — NWS forecast copy says this constantly',
    classify('Tropical storm moves away from the Hawaiian Islands', ''), true);
  check('"Hawaiian Electric" anchors — every outage story says this',
    classify('Hawaiian Electric responds to isolated outages as Hurricane Nolo passes', ''), true);
  check('Papahanaumokuakea anchors',
    classify('Tropical Storm Nolo threatens Papahanaumokuakea Marine National Monument', ''), true);
  /* The gates stay independent: these anchors do not make a non-hazard story qualify. */
  check('  an anchor alone still is not hazard evidence',
    classify('Hawaiian Electric announces a new billing portal', ''), false);

  console.log('\nH02 — macron-bearing names, which the okina-only test did not reach:');
  /* NFKC preserved the macron as a precomposed letter and the punctuation pass then replaced the
     whole letter with a space: "Kihei" became "k hei" and stopped matching its own anchor. Kihei
     is a contract-required anchor from the Olowalu evidence, so this was a required positive
     failing behind a passing suite. */
  check('K\u012Bhei with a macron anchors', classify('Flood warning for K\u012Bhei', ''), true);
  check('Waim\u0101nalo with a macron anchors', classify('Evacuation order for Waim\u0101nalo', ''), true);
  check('L\u012Bhu\u02BBe with macron and okina anchors',
    classify('Brush fire evacuation near L\u012Bhu\u02BBe', ''), true);
  check('Waik\u012Bk\u012B with two macrons anchors',
    classify('High surf warning for Waik\u012Bk\u012B', ''), true);
  check('  and the ASCII spellings still anchor', classify('Flood warning for Kihei', ''), true);

  console.log('\nH05 — compound context: ONE token from an unrelated row must not vouch:');
  /* A loose single-list conjunction let unrelated tokens satisfy each other. Each pair below is
     the false positive and the true positive that must survive removing it. */
  check('swell needs a qualifier AND ocean context, not either',
    classify('Fund swells to record high in Hawaii', ''), false);
  check('  while the real construction still qualifies',
    classify('Dangerous ocean swells hit Oahu shores', ''), true);
  check('erupt is not volcanic because a summit is mentioned',
    classify('Argument erupted at Honolulu summit', ''), false);
  check('  while lava at a vent still qualifies',
    classify('Lava erupted from the Kilauea vent', ''), true);
  check('an EMS story and an animal shelter do not vouch for each other',
    classify('Honolulu Emergency Medical Services opens an animal shelter', ''), false);
  check('  while an emergency proclamation qualifies',
    classify('Governor signs emergency proclamation for Maui', ''), true);
  check('  and a shelter opening during a storm qualifies',
    classify('Emergency shelter opens on Kauai as storm approaches', ''), true);

  console.log('\nH04 — bare "hawaiian" is an adjective that travels:');
  check('a Hawaiian-themed mainland resort does not anchor',
    classify('Storm damage closes a Hawaiian-themed resort in Orlando', ''), false);
  check('  while the two proven constructions do: Hawaiian Electric',
    classify('Hawaiian Electric responds to outages as Hurricane Nolo passes', ''), true);
  check('  and the Hawaiian Islands',
    classify('Tropical storm moves away from the Hawaiian Islands', ''), true);

  console.log('\nH08 — missing fields cannot borrow a label from anywhere:');
  check('empty title and summary', classify('', ''), false);
  check('null title and summary', classify(null, null), false);
  check('undefined inputs', classify(undefined, undefined), false);
  check('locality alone is not hazard', classify('Maui', ''), false);
  check('hazard alone is not local', classify('Hurricane', ''), false);


  console.log('\nH19 — hazard language and locality are NOT a label without an asserted event:');
  /* The nine required negatives of the event-assertion amendment. Which GATE rejects each one is
     asserted, not assumed: without that, a negative could be false because of a vocabulary
     accident and the corpus would prove nothing about the third gate.

     Eight of the nine reach the third gate. The lava-field case does not, and that is recorded
     rather than smoothed over. The contract describes all nine as passing "the original
     hazard-language and locality gates", and under the original gate 2 the bare word `lava` was
     hazard evidence. In this implementation the permanent-feature subtraction is PART of gate 2,
     so "a Hawaii lava field" carries no evidence and the record is rejected one gate earlier. The
     label is the same and the reason is still H21, but it is not the third gate doing the work,
     and the third element below says so per case. */
  const EVENT_NEGATIVES = [
    ['No tsunami threat to Hawai\u02BBi after Japan earthquake.', 'negation of the only local impact'],
    ['Tsunami advisory for Hawai\u02BBi has been cancelled.', 'a resolved alert'],
    /* Rejected at gate 2 by the permanent-feature subtraction, not at gate 3 -- see above. */
    ['Fatal shooting investigated in a Hawai\u02BBi lava field.', 'permanent terrain, no event', 2],
    ['Maui wildfire attorney fee caps debated.', 'litigation aftermath'],
    ["Hawai\u02BBi pumpkin supply remains tight after last year's severe storms.", 'supply aftermath'],
    ['Kaua\u02BBi businesses await federal aid after Tropical Storm Lowell.', 'aid administration'],
    ['Tourism spending rebounds after hurricanes and major storms in Hawai\u02BBi.', 'economic aftermath'],
    ['Hilo marks the anniversary of the 1946 tsunami.', 'history, however recently published'],
    ['O\u02BBahu schools hold a hurricane preparedness exercise.', 'preparedness, not an event']
  ];
  for (const [t, why, gate] of EVENT_NEGATIVES) {
    check('false: ' + t.slice(0, 48), classify(t, ''), false);
    if (gate === 2) {
      check('  and gate 2 rejects it, by permanent-feature subtraction (' + why + ')',
        reachesThirdGate(t), false);
    } else {
      check('  and it REACHED the third gate (' + why + ')', reachesThirdGate(t), true);
    }
  }

  console.log('\nH19/H20/H21/H22 — the required positives, so the gate is not blanket suppression:');
  /* Five of these six carry resolved or negated language. A record-wide stop-word veto passes
     every negative above and fails here, which is the whole reason H23 forbids one. */
  const EVENT_POSITIVES = [
    ['K\u012Blauea lava activity continues across the summit region.', '', 'hazard continuation'],
    ['Maui brush fire is contained, but the evacuation order remains in effect.', '',
     'resolved hazard, active protective action'],
    ['Storm has passed Maui; Honoapi\u02BBilani Highway remains closed by flood damage.', '',
     'resolved hazard, active closure'],
    ['Power outage after severe weather still affects Hilo residents.', '', 'active outage'],
    ['No tsunami threat; flash flood warning remains in effect for O\u02BBahu.', '',
     'negated claim beside an independent active one'],
    ['Evacuation lifted for one Maui neighborhood',
     'Brush fire threatens a second neighborhood and its evacuation order remains active.',
     'resolved title, active summary, anchor composes across the two']
  ];
  for (const [t, d, why] of EVENT_POSITIVES) {
    check('true:  ' + why, classify(t, d), true);
  }

  console.log('\nH20 — negation and resolution are scoped to the claim, never record-wide:');
  /* Each pair is the rejection and the active record that must survive it. A mutation that makes
     either marker a record-wide veto fails the right-hand side; one that ignores the marker fails
     the left. */
  check('a negated threat does not qualify',
    classify('No tsunami threat to Hawaii after Japan earthquake.', ''), false);
  check('  while an independently asserted warning in the same record does',
    classify('No tsunami threat to Hawaii; flood warning in effect for Oahu.', ''), true);
  check('a cancelled advisory does not qualify',
    classify('Tsunami advisory for Hawaii has been cancelled.', ''), false);
  check('  while an advisory in effect does',
    classify('Tsunami advisory in effect for Hawaii.', ''), true);
  /* RECORDED RESIDUAL, asserted honestly rather than described. An order resolved for one place
     and still in force for another, spliced into ONE clause by commas, classifies FALSE. This is a
     false negative and it is the price of making resolution claim-scoped.

     Both alternatives were implemented and both were worse. A clause-wide persistence override
     revived a cancelled advisory beside an unrelated active sentence. Splitting on commas fixed
     this record and then classified "The evacuation order, lifted for Lahaina, is no longer in
     effect" as TRUE, which tells a reader an expired order is still in force. The assertion below
     is the residual, and the one after it is the false positive that must not come back. */
  check('a resolution comma-spliced between an order and its persistence is a known false negative',
    classify('The evacuation order, lifted for Lahaina, remains in effect for Olowalu.', ''), false);
  check('  and the expired order it would otherwise have resurrected stays false',
    classify('The evacuation order, lifted for Lahaina, is no longer in effect.', ''), false);

  console.log('\nH21 — permanent terrain, history, preparedness and indirect aftermath:');
  /* Each guard is paired with a record that would qualify WITHOUT it, so removing the guard
     changes an answer here rather than passing silently. */
  check('a lava field is terrain, not an event',
    classify('A Hawaii lava field trail remains closed for trail repairs.', ''), false);
  check('  while lava activity that continues is an event',
    classify('Lava activity continues at Kilauea.', ''), true);
  check('an anniversary is not an event, however recently published',
    classify('Hilo commemorates the 1946 tsunami that struck the harbor.', ''), false);
  check('  while an approaching hurricane is',
    classify('Hurricane approaches Hilo.', ''), true);
  check('a preparedness drill is not an event',
    classify('Oahu hurricane preparedness drill continues this week.', ''), false);
  check('  while a hurricane that continues to batter Oahu is',
    classify('Hurricane continues to batter Oahu.', ''), true);
  check('litigation aftermath is not an event',
    classify('Maui wildfire litigation continues in court.', ''), false);
  check('  while the brush fire itself spreading is',
    classify('Maui brush fire spreads toward Lahaina.', ''), true);
  /* H21 explicitly keeps direct public-safety consequences eligible, so the indirect-aftermath
     guard must NOT suppress an active closure that shares a clause with recovery funding. */
  check('indirect aftermath does not suppress a still-open closure',
    classify('Rebuilding funds for Honoapiilani Highway, still closed by flood damage, are delayed.', ''), true);
  /* RECORDED OMISSION, asserted rather than described: `research` is named as an indirect family
     by the contract and is deliberately absent from the implementation list, because USGS and HVO
     status copy is written in research voice. This is the case that omission protects. */
  check('research voice does not delete a real volcano update',
    classify('HVO researchers report lava continues at Kilauea.', ''), true);

  console.log('\nH22 — the anchor must support the assertion, and a denial cannot localize:');
  check('an anchor inside the denial of the only local impact does not localize a remote quake',
    classify('No tsunami threat to Hawaii after a magnitude 7 earthquake struck Japan.', ''), false);
  check('  while a remote quake with a stated Hawaii advisory does',
    classify('Japan quake prompts tsunami advisory for Hawaii.', ''), true);
  /* H07 composition in both directions, with the resolved half in each field in turn. */
  check('a resolved TITLE anchor composes with an active summary',
    classify('Evacuation lifted for Maui', 'The brush fire evacuation order remains in effect.'), true);
  check('  and a resolved SUMMARY composes with an active title',
    classify('Flood warning remains in effect for Maui', 'The earlier high surf advisory was cancelled.'), true);

  console.log('\nH23 — the idiom strip now also protects the event gate:');
  /* The first corpus pass tested the idiom strip with a sentence that was already false for other
     reasons. This one turns on it in BOTH gates: strip `political storm` and nothing asserts an
     event; keep it and `storm` plus `damage` is evidence and `continues` is an assertion. */
  check('a political storm whose damage continues is still a metaphor',
    classify('Political storm damage continues for the Hawaii governor.', ''), false);
  check('  while real storm damage that closes roads qualifies',
    classify('Storm damage closes roads across Maui.', ''), true);

  console.log('\nH23 — gate 2 inside the clause, where the two subtractions are observable:');
  /* The idiom and permanent-feature subtractions empty a clause of evidence, and a clause with no
     evidence asserts nothing -- so through the boolean alone both look identical to "no event".
     These assert the gate the implementation actually calls, which is why it is a named helper. */
  const clauseEvidence = (text) => lifted.clauseHazardEvidence(lifted.hazardNormalize(text));
  check('an idiom supplies no hazard evidence to the clause gate',
    clauseEvidence("Political storm damages the Hawaii governor's standing"), false);
  check('  while real storm damage in the same construction does',
    clauseEvidence('Storm damage closes roads across Maui'), true);
  check('a permanent feature supplies no hazard evidence to the clause gate',
    clauseEvidence('A Hawaii lava field trail remains closed for trail repairs'), false);
  check('  while lava activity does',
    clauseEvidence('Lava activity continues at Kilauea'), true);

  console.log('\nH05 — gate 2 held open by an asserted event, so the third gate cannot shield it:');
  /* Each of these pairs a gate-2 defect with an ASSERTION, which the original fixtures lacked.
     Without that, every one of these records failed the event gate for an unrelated reason and a
     mutation loosening the vocabulary changed no answer -- the suite was green because the fixture
     had stopped discriminating, not because the vocabulary held. */
  check('vog still does not match inside vogue when the record asserts continuation',
    classify('Vogue photoshoot continues in Honolulu', ''), false);
  check('a swelling fund still needs ocean context when the record is a forecast',
    classify('Fund swelling is expected to reach a record high in Hawaii', ''), false);
  /* The first version of this twin asserted "a reported stabbing". `reported` is no longer an
     onset verb -- review removed it as part of the research family -- so the fixture stopped
     discriminating. An opening is an assertion that survives. */
  check('Emergency Medical Services still is not a declared emergency when an opening is asserted',
    classify('Honolulu Emergency Medical Services opens a new station', ''), false);
  check('a warning sign is still not a hazard warning when it is posted',
    classify('Warning sign posted for Oahu drivers', ''), false);

  console.log('\nH23 — the two clause-scoping decisions, each with the record that discriminates it:');
  /* A COMMA IS NOT a clause boundary. Splitting on one would strand `continues to batter Maui`
     away from the storm it continues, and a live hurricane would classify false. This is the
     record that makes that choice load-bearing rather than a matter of taste. */
  check('a parenthetical comma does not break a storm away from its continuation',
    classify('Hurricane Nolo, now a tropical storm, continues to batter Maui.', ''), true);
  /* A negation reaches a few tokens, not the whole clause. Here the injuries are denied and the
     evacuation is not, so a clause-wide veto would delete a real evacuation. */
  check('a denial of injuries does not cancel the evacuation in the same clause',
    classify('No injuries in the Maui brush fire evacuation.', ''), true);

  console.log('\nH19 — publication time and source identity cannot supply the third gate:');
  /* H01 purity restated for the new gate: the classifier takes two strings and nothing else, so
     there is no clock and no feed identity for it to consult. Same text, same answer, and the
     anniversary stays false no matter how fresh the item is. */
  check('the classifier still takes exactly two arguments', classify.length, 2);
  check('the same text gives the same answer on a repeat call',
    classify('Hilo marks the anniversary of the 1946 tsunami.', ''),
    classify('Hilo marks the anniversary of the 1946 tsunami.', ''));
  check('an empty summary cannot borrow an event from anywhere',
    classify('Maui wildfire attorney fee caps debated.', ''), false);
  check('null fields still cannot gain a label', classify(null, null), false);

  console.log('\nH06/H20/H21/H22 — the three defects read-only review found, each with its pair:');

  /* BLOCKER 1, H06 and H22: locality was taken from ANY non-denial clause, so unrelated local
     prose localized a remote hazard. The anchor now has to sit in the qualifying clause, or in a
     clause about the same hazard when the qualifying clause names a remote place. */
  check('unrelated local prose does not localize a remote hazard',
    classify('California wildfire threatens homes.', 'Maui council meets today.'), false);
  check('  while a remote origin that states a Hawaii advisory still qualifies',
    classify('Japan quake prompts tsunami advisory for Hawaii.', ''), true);
  check('  and a resolved Hawaii clause still composes with an active one',
    classify('Evacuation lifted for Maui', 'The brush fire evacuation order remains in effect.'), true);

  /* BLOCKER 2, H20: clause-scoped was not claim-scoped. Persistence anywhere in a clause revived
     a resolution anywhere in it, and history vetoed a clause before its active consequence was
     considered. Both directions are asserted. */
  check('an unrelated active phrase does not revive a cancelled advisory',
    classify('Tsunami advisory cancelled, active investigation continues in Hawaii.', ''), false);
  check('an anniversary framing does not close an open hazard closure',
    classify('On the anniversary of the Maui wildfire, Honoapiilani Highway remains closed by flood damage.', ''), true);
  /* The consequence still needs a hazard beside it, which is what keeps the framing from
     admitting any closure that happens to share a sentence with a historical hazard. */
  check('  while a closure with no hazard beside it does not qualify on the framing alone',
    classify('On the anniversary of the 1946 tsunami, the Hilo harbor remains closed for repairs.', ''), false);
  /* Negation reaches backwards only. A denial that follows the assertion is a different claim. */
  check('a negation after the assertion does not cancel it',
    classify('Flood warning issued, no injuries reported on Maui.', ''), true);

  /* BLOCKER 3, §4 research: `reported`, `observed`, `recorded` and `detected` asserted that
     somebody reported something, not that a hazard was doing anything. Removing them rejects the
     research family WITHOUT a `research` stop-word, which would have deleted the HVO case. */
  check('research reporting about a hazard is not an asserted hazard',
    classify('UH researchers reported new findings about Kilauea lava chemistry.', ''), false);
  /* The same family with the reporting verb right beside the hazard, which is the shape that
     restoring `reported` to the onset group would resurrect. */
  check('  and a report sitting beside the hazard word is still only a report',
    classify('Researchers reported lava chemistry changes at Kilauea.', ''), false);
  check('  while a volcano update in research voice still qualifies on what the lava does',
    classify('HVO researchers report lava continues at Kilauea.', ''), true);

  console.log('\nH15/H16 — six records from the 2026-10-29 five-feed capture, verbatim shapes:');
  /* These are not invented prose. Each is a real decoded title+summary shape from the capture
     required by H15, kept as a regression fixture because the authored corpus did not contain it.
     Four were defects the capture found and the deterministic corpus did not. */

  /* FALSE NEGATIVE the capture found: a real flash flood forecast. The headline's only event word
     was `possible`, which the first implementation did not carry. */
  check('a flash flood forecast qualifies on "possible"',
    classify('Flash flooding possible for Maui County, O\u02BBahu: Wednesday Forecast',
             'Heavy rain is expected Wednesday afternoon, with the highest probability over Maui County.'), true);
  /* FALSE NEGATIVE the capture found: open shelters, where the only event language was `brace`
     and it sat in a different clause from the anchor. */
  check('open shelters qualify when the islands brace for flash flooding',
    classify('Need2Know: O\u02BBahu shelters open, public transportation services continue for now',
             'Here is what to know about shelters and public transportation as the islands brace for flash flooding.'), true);
  /* FALSE POSITIVE the capture found, in the family the amendment exists for: mitigation work
     months after a storm is long-term recovery, and a SEASON is a background condition. */
  check('mitigation work amid hurricane season is recovery reporting, not a hazard',
    classify('Team Rubicon focuses on Maui mitigation work amid hurricane season',
             'Mitigation work from Hurricane Lala, which impacted the islands in August, is still underway on Maui.'), false);
  check('  a season on its own is background, not an event',
    classify('Hurricane season continues in Hawaii.', ''), false);
  /* The hazard has to be within reach of the assertion, so this fixture keeps them adjacent;
     the first version put five tokens between them and the indirect frame was never reached. */
  check('  and mitigation work underway is not an active hazard',
    classify('Hurricane mitigation work is underway on Maui.', ''), false);
  /* LOCALITY GAP the capture found. This is a real Maui evacuation warning that passed the hazard
     and event gates and failed locality; the PREVIOUS classifier dropped it too, so it is a
     pre-existing H04 gap rather than a regression. */
  check('a Haleakala evacuation warning anchors',
    classify('Evacuation warning issued for Kipahulu District of Haleakala National Park', ''), true);
  check('  while the anchor alone is still not hazard evidence',
    classify('Haleakala summit road repaving finishes this week', ''), false);
  /* The amendment's negation negative, found live and twice in one capture. */
  check('the live no-tsunami-threat wire story does not qualify',
    classify('No tsunami threat to Hawaii after 7.0M earthquake near Bonin Islands, Japan',
             'There is no tsunami threat to Hawaii. A 7.0 magnitude earthquake hit near Bonin Islands in Japan on Saturday afternoon.'), false);
  /* A contraction is how people actually write a negation, and it survives normalization as one
     token. Without it the denial below reads as an asserted hit. */
  check('a contracted negation counts as a negation',
    classify("Storms that don't hit Hawaii directly can still have an impact", ''), false);
  /* An opinion letter. `likely` was left out of the forecast group for exactly this record: its
     text carries real brush-fire and hurricane language and the phrase "what is likely behind". */
  check('an opinion letter about climate policy does not qualify',
    classify('Letter: Are representatives up to climate policy challenge?',
             'As the general election approaches, recent disasters due to hurricanes, heavy Kona low storms and brush fires are on locals\u2019 minds. I wonder what is likely behind the increased severity.'), false);

  console.log('\nN02 — the handler emits publication time as null or canonical ISO, nothing else:');
  const CANON_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  /* Canonicality is parse-AND-round-trip, never regex shape alone. A raw
     '2026-02-30T00:00:00.000Z' satisfies the shape while breaking the toISOString() promise, so
     a handler that passed upstream text straight through would slip past a shape-only check.
     Codex's finding; the fixture below is the one that proves it. */
  const canonical = function (v) {
    return typeof v === 'string' && CANON_ISO.test(v) &&
           new Date(Date.parse(v)).toISOString() === v;
  };
  /* Hostile upstream dates: RFC-822, an offset form, a loose one, an empty element, pure junk,
     and an ISO-shaped impossible calendar day. */
  pubDates = ['Fri, 02 Oct 2026 09:00:00 GMT', '2026-10-02T09:00:00.000+00:00',
              'October 2 2026', '', 'not a date at all', '2026-02-30T00:00:00.000Z'];
  o = await call('/api/news', 'GET', false);
  pubDates = null;
  check('every item still returned', o.body.items.length, 6);
  const pubs = o.body.items.map(i => i.published);
  check('every published value is null or canonical, by round-trip not shape alone',
    pubs.every(v => v === null || canonical(v)), true);
  check('an impossible upstream day is normalised, not passed through',
    pubs.indexOf('2026-03-02T00:00:00.000Z') !== -1, true);
  check('  and its ISO-shaped raw form does not survive',
    pubs.indexOf('2026-02-30T00:00:00.000Z'), -1);
  check('unparseable upstream dates become null, not a guess and not the raw string',
    pubs.filter(v => v === null).length, 2);
  check('no upstream date text survives into the response',
    pubs.some(v => v === 'October 2 2026' || v === 'not a date at all'), false);
  /* The offset form must be NORMALISED, not merely accepted: the client rejects offset shapes,
     so a handler that passed one through would silently lose that item's age. */
  check('an offset-carrying upstream date is normalised to Z form',
    pubs.indexOf('2026-10-02T09:00:00.000Z') !== -1, true);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (fail) process.exit(1);
}

main();
