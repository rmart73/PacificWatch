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

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (ok) { pass++; console.log('  PASS  ' + label); }
  else { fail++; console.log('  FAIL  ' + label + '\n          got:      ' + JSON.stringify(actual) + '\n          expected: ' + JSON.stringify(expected)); }
}

/* ---- fixtures -------------------------------------------------------------------------- */

/* Five outlets, matching the real FEEDS length. Titles are chosen so the hazard split is
   decided by reading them, not by running the app's regex over them:
     HAZARD:     flood warning, hurricane, tsunami advisory, evacuation, storm surge
     NOT HAZARD: bake sale, museum opening, jazz festival, library hours, farmers market
   Each feed yields one hazard item and one ordinary item, so 5 feeds -> 10 items, 5 hazard. */
const HAZARD_TITLES = ['Flood warning issued', 'Hurricane nears', 'Tsunami advisory lifted',
                       'Evacuation ordered', 'Storm surge expected'];
const PLAIN_TITLES  = ['Bake sale Saturday', 'Museum opening downtown', 'Jazz festival lineup',
                       'Library hours change', 'Farmers market returns'];

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
let bulk = false;
function bulkFeedXml(i) {
  let out = '<rss><channel>';
  for (let k = 0; k < 6; k++) {          /* 6 ordinary, newest */
    const t = new Date(Date.UTC(2026, 8, 26, 20, i * 6 + k)).toUTCString();
    out += '<item><title>Community notice ' + i + '-' + k + '</title><link>https://example.test/n' +
           i + k + '</link><description>d</description><pubDate>' + t + '</pubDate></item>';
  }
  for (let k = 0; k < 6; k++) {          /* 6 hazard, oldest */
    const t = new Date(Date.UTC(2026, 8, 26, 2, i * 6 + k)).toUTCString();
    out += '<item><title>Flood warning ' + i + '-' + k + '</title><link>https://example.test/f' +
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
    const xml = bulk ? bulkFeedXml(idx % 5) : feedXml(idx % 5);
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

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (fail) process.exit(1);
}

main();
