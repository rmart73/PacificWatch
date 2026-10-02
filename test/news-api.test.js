/* G1 abuse and cost bounding — deterministic tests for the News API.

   Pure Node, no dependencies, part of `npm test`. Stubs global.fetch and COUNTS upstream
   attempts, because the property under test is not "what does it return" but "how much upstream
   work can a caller cause". A refusal that still fetched five feeds would pass a status-code
   assertion and fail the point of G1 entirely.

   Expectations are written independently: the hazard set is defined here from the fixture text,
   not derived by calling the module's own HAZARD_RE. The user agent is asserted as a complete
   literal rather than as "some UA is present".

   Governed by G1-ABUSE-BOUNDING-CONTRACT.md, G01-G18. */
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
const classify = (() => {
  const src = require('fs').readFileSync(API_PATH, 'utf8').replace(/module\.exports[\s\S]*$/, '');
  return new Function(src + '; return classifyHazard;')();
})();

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
const HAZARD_TITLES = ['Flood warning issued for Oahu', 'Hurricane nears Maui',
                       'Tsunami advisory lifted for Hawaii County', 'Evacuation ordered on Kauai',
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
    const xml = encoded ? encodedFeedXml() : (bulk ? bulkFeedXml(idx % 5) : feedXml(idx % 5));
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
    classify('Honolulu Emergency Medical Services responds at an animal shelter', ''), false);
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

console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (fail) process.exit(1);
}

main();
