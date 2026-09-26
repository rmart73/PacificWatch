/* Extracts the Phase 1 health logic from index.html and exercises it against the
   acceptance criteria in PHASE1-SOURCE-HEALTH.md. Pure logic only — no DOM. */
const fs = require('fs');
const path = require('path');
/* Takes an html path like the DOM and contrast suites, so test/mutation-check.js can point it
   at a mutant. Defaults to the real file, resolved from here rather than the cwd. */
const src = fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\r\n/g, '\n');

function grab(re, label) {
  const m = src.match(re);
  if (!m) throw new Error('could not extract ' + label);
  return m[0];
}

const parts = [
  'var S = { island: "statewide" };',
  'function renderSourceHealth() {}',           // stubbed: DOM
  grab(/const MIN = 60 \* 1000, HOUR = 60 \* MIN;/, 'MIN/HOUR'),
  grab(/S\.sourceHealth = \{[\s\S]*?\n\};/, 'registry'),
  grab(/Object\.keys\(S\.sourceHealth\)\.forEach\(k => \{[\s\S]*?\n\}\);/, 'init'),
  grab(/S\.cache = \{\};/, 'cache'),
  grab(/const ISLAND_SCOPED = \{[^}]*\};/, 'ISLAND_SCOPED'),
  grab(/function beginRequest\(key\) \{[\s\S]*?\n\}/, 'beginRequest'),
  grab(/function requestIsCurrent\(token\) \{[\s\S]*?\n\}/, 'requestIsCurrent'),
  grab(/function sourceOk\(key, data, token, observed\) \{[\s\S]*?\n\}/, 'sourceOk'),
  grab(/function sourceFail\(key, err\) \{[\s\S]*?\n\}/, 'sourceFail'),
  grab(/function sourceState\(key, now\) \{[\s\S]*?\n\}/, 'sourceState'),
  grab(/function isStale\(key\) \{[^}]*\}/, 'isStale'),
  grab(/function usableCache\(key\) \{[\s\S]*?\n\}/, 'usableCache'),
  grab(/function relAge\(ts\) \{[\s\S]*?\n\}/, 'relAge'),
  /* Q007/Q008 observation clock — the second, independent clock. */
  grab(/const OBSERVATION_LIMITS = \{[\s\S]*?\n\};/, 'OBSERVATION_LIMITS'),
  grab(/const OBS_SKEW_MS = [^;]+;/, 'OBS_SKEW_MS'),
  grab(/const HST_OFFSET_MS = [^;]+;/, 'HST_OFFSET_MS'),
  grab(/function observedAtFromIso\(raw\) \{[\s\S]*?\n\}/, 'observedAtFromIso'),
  grab(/function observedAtFromNoaaLst\(raw\) \{[\s\S]*?\n\}/, 'observedAtFromNoaaLst'),
  grab(/function observationState\(key, observedAt, now\) \{[\s\S]*?\n\}/, 'observationState'),
  grab(/function combinedObservationState\(key, now\) \{[\s\S]*?\n\}/, 'combinedObservationState'),
  grab(/function observationVerified\(state\) \{[^}]*\}/, 'observationVerified')
].join('\n');

const api = eval(parts + '; ({S:S, sourceOk, sourceFail, sourceState, usableCache, relAge, beginRequest, requestIsCurrent, OBSERVATION_LIMITS, observedAtFromIso, observedAtFromNoaaLst, observationState, combinedObservationState, observationVerified})');
const St = api.S;

/* The expiry predicate, lifted verbatim out of the shared nwsEligible() selector.
   It used to live in renderAlerts; every alert surface now shares this one copy. */
const filterSrc = grab(/\.filter\(f => \{\n\s*const exp = f && f\.properties && f\.properties\.expires;\n\s*return !exp \|\| new Date\(exp\)\.getTime\(\) > now;\n\s*\}\)/, 'expiry filter');
const pickLive = new Function('features', 'now', 'return (features || [])' + filterSrc + ';');

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (ok) { pass++; console.log('  PASS  ' + label); }
  else { fail++; console.log('  FAIL  ' + label + '  (got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected) + ')'); }
}
function setHealth(key, o) { Object.assign(St.sourceHealth[key], o); }
const MIN = 60000, HOUR = 60 * MIN;
const now = () => Date.now();

console.log('State machine — acceptance criteria 1-5:');
check('loading before any attempt', api.sourceState('nwsAlerts'), 'loading');
setHealth('nwsAlerts', { lastAttempt: now(), lastSuccess: null, lastError: 'boom', consecutiveFailures: 1 });
check('attempted, never succeeded -> unavailable', api.sourceState('nwsAlerts'), 'unavailable');
setHealth('nwsAlerts', { lastAttempt: now(), lastSuccess: now(), lastError: null, consecutiveFailures: 0 });
check('successful fetch -> current', api.sourceState('nwsAlerts'), 'current');
setHealth('nwsAlerts', { lastAttempt: now(), lastSuccess: now() - 2 * MIN, lastError: 'timeout', consecutiveFailures: 1 });
check('recent data but last attempt failed -> stale', api.sourceState('nwsAlerts'), 'stale');
setHealth('nwsAlerts', { lastAttempt: now(), lastSuccess: now() - 8 * MIN, lastError: null, consecutiveFailures: 0 });
check('aged past freshMs -> stale', api.sourceState('nwsAlerts'), 'stale');
setHealth('nwsAlerts', { lastAttempt: now(), lastSuccess: now() - 12 * MIN, lastError: 'boom', consecutiveFailures: 3 });
check('aged past staleMs -> unavailable', api.sourceState('nwsAlerts'), 'unavailable');

console.log('\nPer-source thresholds (Q002) — one global number would be wrong here:');
setHealth('nwsAlerts', { lastAttempt: now(), lastSuccess: now() - 12 * MIN, lastError: null });
check('alerts at 12 min -> unavailable', api.sourceState('nwsAlerts'), 'unavailable');
setHealth('fema', { lastAttempt: now(), lastSuccess: now() - 12 * MIN, lastError: null });
check('FEMA at 12 min -> current (declarations change over days)', api.sourceState('fema'), 'current');
setHealth('fema', { lastAttempt: now(), lastSuccess: now() - 12 * HOUR, lastError: null });
check('FEMA at 12 hr -> stale', api.sourceState('fema'), 'stale');
setHealth('fema', { lastAttempt: now(), lastSuccess: now() - 30 * HOUR, lastError: null });
check('FEMA at 30 hr -> unavailable', api.sourceState('fema'), 'unavailable');
check('a single 30-min expiry would have marked FEMA unavailable at 12 min',
      30 * MIN < 12 * HOUR, true);

console.log('\nRetention (criteria 3, 4, 8) and island scoping:');
St.cache.usgsEarthquakes = { island: 'statewide', data: ['quake'] };
setHealth('usgsEarthquakes', { lastAttempt: now(), lastSuccess: now() - 20 * MIN, lastError: 'net' });
check('stale + cache -> data offered', JSON.stringify(api.usableCache('usgsEarthquakes')), '["quake"]');
setHealth('usgsEarthquakes', { lastAttempt: now(), lastSuccess: now(), lastError: null });
check('current -> no retained data needed', api.usableCache('usgsEarthquakes'), null);
setHealth('usgsEarthquakes', { lastAttempt: now(), lastSuccess: now() - 90 * MIN, lastError: 'net' });
check('past stale window -> retained data withdrawn', api.usableCache('usgsEarthquakes'), null);
setHealth('usgsEarthquakes', { lastAttempt: now(), lastSuccess: now() - 20 * MIN, lastError: 'net' });
St.island = 'maui';
check('island-scoped cache not reused across islands', api.usableCache('usgsEarthquakes'), null);
St.island = 'statewide';
St.cache.fema = { island: 'maui', data: ['decl'] };
setHealth('fema', { lastAttempt: now(), lastSuccess: now() - 12 * HOUR, lastError: 'net' });
check('statewide source reused regardless of island', JSON.stringify(api.usableCache('fema')), '["decl"]');

console.log('\nExpired-alert filtering — retained data must not resurrect a lapsed warning:');
const t = Date.now();
const feats = [
  { properties: { event: 'Tropical Storm Warning', expires: new Date(t + 30 * MIN).toISOString() } },
  { properties: { event: 'Flood Watch',            expires: new Date(t - 20 * MIN).toISOString() } },
  { properties: { event: 'Special Statement' } }
];
const live = pickLive(feats, t);
check('future-expiry alert kept',   live.some(f => f.properties.event === 'Tropical Storm Warning'), true);
check('lapsed alert dropped',       live.some(f => f.properties.event === 'Flood Watch'), false);
check('alert with no expiry kept',  live.some(f => f.properties.event === 'Special Statement'), true);
check('two of three survive',       live.length, 2);

console.log('Request-scope guard (contract O09):');
St.island = 'maui';
const mauiToken = api.beginRequest('nwsWeather');
check('token records the island the request started under', mauiToken.island, 'maui');
check('a completion under the same island is current', api.requestIsCurrent(mauiToken), true);
St.island = 'kauai';
check('the same completion is rejected after an island switch', api.requestIsCurrent(mauiToken), false);
St.island = 'maui';
check('and accepted again if the selection returns', api.requestIsCurrent(mauiToken), true);
const newerToken = api.beginRequest('nwsWeather');
check('a newer request supersedes the older token', api.requestIsCurrent(mauiToken), false);
check('while the newest token is current', api.requestIsCurrent(newerToken), true);
St.island = 'oahu';
const newsToken = api.beginRequest('news');
St.island = 'kauai';
check('a non-island-scoped source survives an island change', api.requestIsCurrent(newsToken), true);
check('a null token is treated as current', api.requestIsCurrent(null), true);
St.island = 'statewide';

console.log('\nsourceOk stamps the START island, not the current one:');
St.island = 'maui';
const t2 = api.beginRequest('noaaTides');
St.island = 'kauai';
api.sourceOk('noaaTides', { ft: '1.2', name: 'Kahului, Maui' }, t2);
check('cache is stamped maui despite kauai being selected', St.cache.noaaTides.island, 'maui');
St.island = 'statewide';

console.log('\nrelAge:');
check('45 sec', api.relAge(Date.now() - 45000), '45 sec ago');
check('3 min',  api.relAge(Date.now() - 3 * MIN), '3 min ago');
check('5 hr',   api.relAge(Date.now() - 5 * HOUR), '5 hr ago');
check('2 days', api.relAge(Date.now() - 50 * HOUR), '2 days ago');
check('never',  api.relAge(null), 'never');

/* ==========================================================================================
   Q007/Q008 Stage 1 — the observation clock.

   Every expectation below is a literal or is derived from a published constant, never from the
   app's own helper, per the two source-handling rules in AGENTS.md. The HST offset is checked
   against an independently established fact: the same NOAA reading requested as time_zone=gmt
   returned 03:18Z for an lst_ldt value of 17:18, exactly -10:00, and NOAA's station metadata
   for 1612340 reports timezone HAST with tzcorr -10.
   ========================================================================================== */

console.log('\nObservation clock — NWS ISO timestamps:');
check('parses an ISO instant with offset',
  api.observedAtFromIso('2026-09-26T02:53:00+00:00'), Date.UTC(2026, 8, 26, 2, 53, 0));
check('parses a Z-suffixed instant',
  api.observedAtFromIso('2026-09-26T02:53:00Z'), Date.UTC(2026, 8, 26, 2, 53, 0));
check('null for a missing timestamp', api.observedAtFromIso(null), null);
check('null for an empty string', api.observedAtFromIso('   '), null);
check('null for unparseable text', api.observedAtFromIso('not a time'), null);
check('null for a non-string', api.observedAtFromIso(1758855180000), null);

console.log('\nObservation clock — NOAA lst_ldt is HST, not the browser zone:');
/* 17:24 HST is 03:24Z the following day. Written as a UTC literal so the assertion does not
   depend on the machine running it. */
check('normalizes lst_ldt as UTC-10',
  api.observedAtFromNoaaLst('2026-09-25 17:24'), Date.UTC(2026, 8, 26, 3, 24, 0));
check('accepts optional seconds',
  api.observedAtFromNoaaLst('2026-09-25 17:24:30'), Date.UTC(2026, 8, 26, 3, 24, 30));
check('accepts a T separator',
  api.observedAtFromNoaaLst('2026-09-25T17:24'), Date.UTC(2026, 8, 26, 3, 24, 0));
/* The whole point of the dedicated parser: new Date() on this string would apply the browser's
   zone. Asserting the two disagree proves the parser is not just delegating. */
check('does not agree with browser-local parsing outside HST',
  api.observedAtFromNoaaLst('2026-09-25 17:24') === new Date('2026-09-25 17:24').getTime(),
  new Date('2026-09-25 17:24').getTimezoneOffset() === 600);
check('null for a missing timestamp', api.observedAtFromNoaaLst(undefined), null);
check('null for a malformed timestamp', api.observedAtFromNoaaLst('2026/09/25 17:24'), null);
check('null for an out-of-range month', api.observedAtFromNoaaLst('2026-13-25 17:24'), null);
check('null for an out-of-range day', api.observedAtFromNoaaLst('2026-09-32 17:24'), null);
check('null for an out-of-range hour', api.observedAtFromNoaaLst('2026-09-25 25:24'), null);

console.log('\nObservation age — weather boundaries, 75 current / 180 retained:');
const T0 = Date.UTC(2026, 8, 26, 12, 0, 0);
const wAt = m => api.observationState('nwsWeather', T0 - m * MIN, T0);
check('0 minutes old is current', wAt(0), 'current');
check('74 minutes is current', wAt(74), 'current');
check('75 minutes is current — equality stays younger', wAt(75), 'current');
check('76 minutes is stale — the Nolo case', wAt(76), 'stale');
check('77 minutes is stale', wAt(77), 'stale');
check('179 minutes is stale', wAt(179), 'stale');
check('180 minutes is stale — equality stays younger', wAt(180), 'stale');
check('181 minutes is expired', wAt(181), 'expired');

console.log('\nObservation age — tide boundaries, 18 current / 60 retained:');
const tAt = m => api.observationState('noaaTides', T0 - m * MIN, T0);
check('17 minutes is current', tAt(17), 'current');
check('18 minutes is current — equality stays younger', tAt(18), 'current');
check('19 minutes is stale', tAt(19), 'stale');
check('59 minutes is stale', tAt(59), 'stale');
check('60 minutes is stale — equality stays younger', tAt(60), 'stale');
check('61 minutes is expired', tAt(61), 'expired');

console.log('\nObservation age — unusable timestamps never look current:');
check('null observedAt is unusable', api.observationState('nwsWeather', null, T0), 'unusable');
check('NaN observedAt is unusable', api.observationState('nwsWeather', NaN, T0), 'unusable');
/* Positive skew: inside tolerance counts as age zero, beyond it is unusable rather than
   permanently current. */
check('4 minutes into the future is current', wAt(-4), 'current');
check('5 minutes into the future is current — equality stays inside tolerance', wAt(-5), 'current');
check('6 minutes into the future is unusable', wAt(-6), 'unusable');
check('a source with no measurement clock is not-applicable',
  api.observationState('usgsEarthquakes', T0 - 999 * MIN, T0), 'not-applicable');
check('alerts have no measurement clock either',
  api.observationState('nwsAlerts', T0, T0), 'not-applicable');
check('only weather and tide carry limits',
  Object.keys(api.OBSERVATION_LIMITS).sort().join(','), 'noaaTides,nwsWeather');

console.log('\nCombined state — both clocks, and only one state earns a verified dot:');
function setObs(key, health, observedAt) {
  setHealth(key, health);
  St.cache[key] = { island: 'statewide', data: {}, observedAt: observedAt, observedAtRaw: null };
}
/* Fetch current + observation current is the only verified combination. */
setObs('nwsWeather', { lastAttempt: T0, lastSuccess: T0, lastError: null, consecutiveFailures: 0 }, T0 - 5 * MIN);
check('fetch current + observation current -> current', api.combinedObservationState('nwsWeather', T0), 'current');
check('and that is verified', api.observationVerified(api.combinedObservationState('nwsWeather', T0)), true);

/* The defect this contract exists to prevent: a seconds-old lastSuccess must not make a
   77-minute-old observation look verified. */
setObs('nwsWeather', { lastAttempt: T0, lastSuccess: T0, lastError: null, consecutiveFailures: 0 }, T0 - 77 * MIN);
check('fetch current + 77-minute observation -> observation-stale',
  api.combinedObservationState('nwsWeather', T0), 'observation-stale');
check('and that is NOT verified', api.observationVerified(api.combinedObservationState('nwsWeather', T0)), false);

setObs('nwsWeather', { lastAttempt: T0, lastSuccess: T0, lastError: null, consecutiveFailures: 0 }, T0 - 181 * MIN);
check('fetch current + past retention -> observation-expired',
  api.combinedObservationState('nwsWeather', T0), 'observation-expired');

setObs('nwsWeather', { lastAttempt: T0, lastSuccess: T0, lastError: null, consecutiveFailures: 0 }, null);
check('fetch current + no usable timestamp -> observation-unusable',
  api.combinedObservationState('nwsWeather', T0), 'observation-unusable');

/* A stale fetch with a still-usable measurement reports the network problem. */
setObs('nwsWeather', { lastAttempt: T0, lastSuccess: T0 - 20 * MIN, lastError: 'boom', consecutiveFailures: 1 }, T0 - 20 * MIN);
check('fetch stale + observation current -> fetch-stale',
  api.combinedObservationState('nwsWeather', T0), 'fetch-stale');

/* A fresh response never revives a measurement already past retention: the measurement verdict
   is read before the network one. */
setObs('nwsWeather', { lastAttempt: T0, lastSuccess: T0 - 20 * MIN, lastError: 'boom', consecutiveFailures: 1 }, T0 - 181 * MIN);
check('expired measurement outranks a merely stale fetch',
  api.combinedObservationState('nwsWeather', T0), 'observation-expired');

setObs('nwsWeather', { lastAttempt: T0, lastSuccess: null, lastError: 'boom', consecutiveFailures: 3 }, T0);
check('unavailable fetch -> unavailable', api.combinedObservationState('nwsWeather', T0), 'unavailable');

delete St.cache.nwsWeather;
setHealth('nwsWeather', { lastAttempt: null, lastSuccess: null, lastError: null, consecutiveFailures: 0 });
check('no cache yet while loading -> checking', api.combinedObservationState('nwsWeather', T0), 'checking');

/* Sources without a measurement clock fall through to fetch health unchanged — the guarantee
   that this change does not redefine lastSuccess semantics globally (T14). Both clocks are
   driven from T0: sourceState takes the same injected instant, so neither assertion can pass
   because one clock quietly fell back to the real wall time. */
setHealth('nwsAlerts', { lastAttempt: T0, lastSuccess: T0, lastError: null, consecutiveFailures: 0 });
check('alerts still report plain fetch health', api.combinedObservationState('nwsAlerts', T0), 'current');
setHealth('news', { lastAttempt: T0, lastSuccess: T0 - 90 * MIN, lastError: null, consecutiveFailures: 0 });
check('news past its 60-minute limit still reports plain fetch health',
  api.combinedObservationState('news', T0), 'unavailable');
setHealth('news', { lastAttempt: T0, lastSuccess: T0 - 30 * MIN, lastError: null, consecutiveFailures: 0 });
check('news inside retention reports stale, from the injected clock',
  api.combinedObservationState('news', T0), 'stale');

/* The injected clock must reach sourceState itself, or half of every combined assertion above
   would silently be measured against the real wall time instead of T0. Anchored to the real
   clock here on purpose, because that is the fallback under test. */
const realNow = Date.now();
setHealth('news', { lastAttempt: realNow, lastSuccess: realNow - 90 * MIN, lastError: null, consecutiveFailures: 0 });
check('omitting the clock falls back to Date.now()',
  api.sourceState('news'), 'unavailable');
check('injecting an earlier instant is honoured over Date.now()',
  api.sourceState('news', realNow - 80 * MIN), 'current');

console.log('\nsourceOk stores the measurement clock beside the reading:');
St.cache = {};
const tok = api.beginRequest('noaaTides');
api.sourceOk('noaaTides', { ft: '1.8', name: 'HNL Harbor', t: '2026-09-25 17:24' }, tok,
             { at: Date.UTC(2026, 8, 26, 3, 24, 0), raw: '2026-09-25 17:24' });
check('observedAt stored on the cache entry',
  St.cache.noaaTides.observedAt, Date.UTC(2026, 8, 26, 3, 24, 0));
check('raw source value retained for traceability',
  St.cache.noaaTides.observedAtRaw, '2026-09-25 17:24');
check('the reading itself is untouched', St.cache.noaaTides.data.ft, '1.8');
check('NOAA t is retained in the cached data', St.cache.noaaTides.data.t, '2026-09-25 17:24');
const tok2 = api.beginRequest('fema');
api.sourceOk('fema', [], tok2);
check('a source passing no clock stores null', St.cache.fema.observedAt, null);
check('and null raw', St.cache.fema.observedAtRaw, null);


console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
