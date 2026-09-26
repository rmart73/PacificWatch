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
  grab(/function isRealCalendarDate\(y, mo, d\) \{[\s\S]*?\n\}/, 'isRealCalendarDate'),
  grab(/const ISO_INSTANT_RE = [^;]+;/, 'ISO_INSTANT_RE'),
  grab(/function observedAtFromIso\(raw\) \{[\s\S]*?\n\}/, 'observedAtFromIso'),
  grab(/function observedAtFromNoaaLst\(raw\) \{[\s\S]*?\n\}/, 'observedAtFromNoaaLst'),
  grab(/function observationState\(key, observedAt, now\) \{[\s\S]*?\n\}/, 'observationState'),
  grab(/function observationEntry\(key\) \{[\s\S]*?\n\}/, 'observationEntry'),
  grab(/function combinedObservationState\(key, now, valueUsable\) \{[\s\S]*?\n\}/, 'combinedObservationState'),
  grab(/function observationVerified\(state\) \{[^}]*\}/, 'observationVerified')
].join('\n');

const api = eval(parts + '; ({S:S, sourceOk, sourceFail, sourceState, usableCache, relAge, beginRequest, requestIsCurrent, OBSERVATION_LIMITS, observedAtFromIso, observedAtFromNoaaLst, observationState, combinedObservationState, observationVerified, observationEntry, isRealCalendarDate})');
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

console.log('\nStrict ISO parsing — an unzoned timestamp is not an instant:');
/* Date.parse treats an ISO date-time with no offset as LOCAL time, so accepting one would place
   the reading ten hours from where NWS meant it for a Hawaii reader. Rejected, not guessed. */
check('rejects an unzoned ISO date-time', api.observedAtFromIso('2026-09-26T05:53:00'), null);
check('rejects a date with no time', api.observedAtFromIso('2026-09-26'), null);
check('rejects a loose non-ISO form Date.parse would accept',
  api.observedAtFromIso('Sep 26 2026'), null);
check('rejects a bare time', api.observedAtFromIso('05:53:00Z'), null);
check('accepts an explicit +00:00 offset',
  api.observedAtFromIso('2026-09-26T05:53:00+00:00'), Date.UTC(2026, 8, 26, 5, 53, 0));
check('accepts Z', api.observedAtFromIso('2026-09-26T05:53:00Z'), Date.UTC(2026, 8, 26, 5, 53, 0));
/* -10:00 is HST; the instant is ten hours later than the wall time shown. */
check('accepts a negative offset and applies it',
  api.observedAtFromIso('2026-09-26T05:53:00-10:00'), Date.UTC(2026, 8, 26, 15, 53, 0));
check('accepts fractional seconds',
  api.observedAtFromIso('2026-09-26T05:53:00.500Z'), Date.UTC(2026, 8, 26, 5, 53, 0) + 500);

console.log('\nImpossible calendar dates — a regex checks shape, not existence:');
/* Date.parse and Date.UTC both ROLL an impossible day forward rather than refusing it, turning an
   impossible timestamp into a plausible one up to two days from what the source sent. Expected
   values here are established from the Gregorian calendar, not from the app: February has 28 days
   in 2026 and 29 in 2024; April has 30. */
check('ISO: Feb 30 is rejected, not rolled to Mar 2',
  api.observedAtFromIso('2026-02-30T05:53:00Z'), null);
check('ISO: Apr 31 is rejected, not rolled to May 1',
  api.observedAtFromIso('2026-04-31T05:53:00Z'), null);
check('ISO: Feb 29 in a non-leap year is rejected',
  api.observedAtFromIso('2026-02-29T05:53:00Z'), null);
check('ISO: month 00 is rejected', api.observedAtFromIso('2026-00-10T05:53:00Z'), null);
check('ISO: month 13 is rejected', api.observedAtFromIso('2026-13-01T05:53:00Z'), null);
check('ISO: day 00 is rejected', api.observedAtFromIso('2026-09-00T05:53:00Z'), null);
check('ISO: hour 24 is rejected', api.observedAtFromIso('2026-09-25T24:00:00Z'), null);
check('ISO: minute 60 is rejected', api.observedAtFromIso('2026-09-25T05:60:00Z'), null);
check('ISO: second 60 is rejected', api.observedAtFromIso('2026-09-25T05:53:60Z'), null);
/* The real leap day must survive — a validator that rejects it is worse than none. */
check('ISO: a real leap day is kept',
  api.observedAtFromIso('2024-02-29T05:53:00Z'), Date.UTC(2024, 1, 29, 5, 53, 0));
check('ISO: the last second of the year is kept',
  api.observedAtFromIso('2026-12-31T23:59:59Z'), Date.UTC(2026, 11, 31, 23, 59, 59));

check('NOAA: Feb 30 is rejected', api.observedAtFromNoaaLst('2026-02-30 17:24'), null);
check('NOAA: Feb 29 in a non-leap year is rejected',
  api.observedAtFromNoaaLst('2026-02-29 17:24'), null);
check('NOAA: month 00 is rejected', api.observedAtFromNoaaLst('2026-00-10 17:24'), null);
check('NOAA: hour 24 is rejected', api.observedAtFromNoaaLst('2026-09-25 24:00'), null);
check('NOAA: minute 60 is rejected', api.observedAtFromNoaaLst('2026-09-25 17:60'), null);
/* Seconds are range-checked explicitly now. An out-of-range second also rolls the minute and
   would be caught that way, but relying on that side effect means the guard vanishes silently if
   the minute check is ever reordered. Both 60 and 99 are asserted. */
check('NOAA: second 60 is rejected', api.observedAtFromNoaaLst('2026-09-25 17:24:60'), null);
check('NOAA: second 99 is rejected', api.observedAtFromNoaaLst('2026-09-25 17:24:99'), null);
check('NOAA: second 59 is kept',
  api.observedAtFromNoaaLst('2026-09-25 17:24:59'), Date.UTC(2026, 8, 26, 3, 24, 59));
check('NOAA: a real leap day is kept',
  /* Feb 29 17:24 HST is Mar 1 03:24Z. Written as March 1 rather than as hour 27 on Feb 29,
     since leaning on hour rollover in a test about rejecting rollover invites confusion. */
  api.observedAtFromNoaaLst('2024-02-29 17:24'), Date.UTC(2024, 2, 1, 3, 24, 0));
check('NOAA: optional seconds still omitted cleanly',
  api.observedAtFromNoaaLst('2026-09-25 17:24'), Date.UTC(2026, 8, 26, 3, 24, 0));

/* The shared predicate, asserted directly so its contract is visible. */
check('isRealCalendarDate: 2026-02-28 exists', api.isRealCalendarDate(2026, 2, 28), true);
check('isRealCalendarDate: 2026-02-29 does not', api.isRealCalendarDate(2026, 2, 29), false);
check('isRealCalendarDate: 2024-02-29 does', api.isRealCalendarDate(2024, 2, 29), true);
check('isRealCalendarDate: 2026-04-31 does not', api.isRealCalendarDate(2026, 4, 31), false);
check('isRealCalendarDate: 2026-12-31 exists', api.isRealCalendarDate(2026, 12, 31), true);

console.log('\nsourceOk reports which measurement it settled on:');
/* Finding 1: the cache guard is only half the story. Callers must render what sourceOk KEPT, so
   it has to say so. */
St.cache = {};
St.island = 'statewide';
setHealth('nwsWeather', { lastAttempt: null, lastSuccess: null, lastError: null, consecutiveFailures: 0 });
const rTok = api.beginRequest('nwsWeather');
const firstKept = api.sourceOk('nwsWeather', { p: 'newer' }, rTok, { at: T0 - 10 * MIN, raw: 'newer' });
check('returns the entry it stored', firstKept && firstKept.data.p, 'newer');
const rTok2 = api.beginRequest('nwsWeather');
const secondKept = api.sourceOk('nwsWeather', { p: 'older' }, rTok2, { at: T0 - 40 * MIN, raw: 'older' });
check('returns the KEPT entry when it refuses an older observation',
  secondKept && secondKept.data.p, 'newer');
check('so a caller rendering the return value cannot show the refused reading',
  secondKept.observedAt, T0 - 10 * MIN);
const rTok3 = api.beginRequest('nwsWeather');
const thirdKept = api.sourceOk('nwsWeather', { p: 'newest' }, rTok3, { at: T0 - 1 * MIN, raw: 'newest' });
check('and returns the new entry when it accepts one', thirdKept && thirdKept.data.p, 'newest');
/* A source with no measurement clock still gets its entry back. */
const fTok = api.beginRequest('fema');
check('a clockless source still returns its entry',
  (api.sourceOk('fema', [], fTok) || {}).island !== undefined, true);

console.log('\nCombined state — island scope, loading and value usability:');
/* An entry belonging to another island is not a fallback for the selected one. Reading the cache
   directly would let Maui's observation decide Kauai's state. */
St.island = 'kauai';
setHealth('nwsWeather', { lastAttempt: T0, lastSuccess: T0, lastError: null, consecutiveFailures: 0 });
St.cache.nwsWeather = { island: 'maui', data: {}, observedAt: T0 - 5 * MIN, observedAtRaw: null };
check('another island\'s entry is not read', api.observationEntry('nwsWeather'), null);
check('and the combined state does not present it',
  api.combinedObservationState('nwsWeather', T0), 'unavailable');
St.cache.nwsWeather = { island: 'kauai', data: {}, observedAt: T0 - 5 * MIN, observedAtRaw: null };
check('the selected island\'s entry is read',
  api.observationEntry('nwsWeather') !== null, true);
check('and presents normally', api.combinedObservationState('nwsWeather', T0), 'current');
/* Sources outside ISLAND_SCOPED are never rejected for an island change. */
St.cache.news = { island: 'maui', data: {}, observedAt: null, observedAtRaw: null };
check('a non-island-scoped source ignores the island',
  api.observationEntry('news') !== null, true);

/* A reading exists, but nothing has completed for this selection yet. */
setHealth('nwsWeather', { lastAttempt: null, lastSuccess: null, lastError: null, consecutiveFailures: 0 });
check('an outstanding first request reports checking, not the older reading',
  api.combinedObservationState('nwsWeather', T0), 'checking');

/* A missing or unconvertible value is unusable whatever the clocks say. */
setHealth('nwsWeather', { lastAttempt: T0, lastSuccess: T0, lastError: null, consecutiveFailures: 0 });
check('an unusable value outranks good clocks',
  api.combinedObservationState('nwsWeather', T0, false), 'value-unusable');
check('and is not verified',
  api.observationVerified(api.combinedObservationState('nwsWeather', T0, false)), false);
check('a usable value with good clocks is current',
  api.combinedObservationState('nwsWeather', T0, true), 'current');
check('omitting usability asks only about the clocks',
  api.combinedObservationState('nwsWeather', T0), 'current');
/* An unusable timestamp still outranks the value verdict: both are unknown, and the timestamp
   verdict is the more specific statement. */
St.cache.nwsWeather = { island: 'kauai', data: {}, observedAt: null, observedAtRaw: null };
check('a missing timestamp still reports the timestamp problem',
  api.combinedObservationState('nwsWeather', T0, false), 'observation-unusable');
St.island = 'statewide';
delete St.cache.news;

console.log('\nT11 — an older observation cannot replace a newer cached one:');
St.cache = {};
const oTok = api.beginRequest('nwsWeather');
api.sourceOk('nwsWeather', { p: 'newer' }, oTok, { at: T0 - 10 * MIN, raw: 'newer' });
check('the first reading is cached', St.cache.nwsWeather.observedAtRaw, 'newer');
const oldSuccess = St.sourceHealth.nwsWeather.lastSuccess;
/* A newer HTTP request carrying an OLDER source observation. */
const oTok2 = api.beginRequest('nwsWeather');
api.sourceOk('nwsWeather', { p: 'older' }, oTok2, { at: T0 - 40 * MIN, raw: 'older' });
check('an older observation does not replace it', St.cache.nwsWeather.observedAtRaw, 'newer');
check('and the measurement clock does not move backwards',
  St.cache.nwsWeather.observedAt, T0 - 10 * MIN);
check('but fetch health was still refreshed, because we did reach the source',
  St.sourceHealth.nwsWeather.lastSuccess >= oldSuccess, true);
/* Equal timestamps refresh health and leave the measurement alone. */
const oTok3 = api.beginRequest('nwsWeather');
api.sourceOk('nwsWeather', { p: 'equal' }, oTok3, { at: T0 - 10 * MIN, raw: 'equal' });
check('an equal timestamp may refresh the reading without moving the clock',
  St.cache.nwsWeather.observedAt, T0 - 10 * MIN);
/* A genuinely newer observation does replace it. */
const oTok4 = api.beginRequest('nwsWeather');
api.sourceOk('nwsWeather', { p: 'newest' }, oTok4, { at: T0 - 2 * MIN, raw: 'newest' });
check('a newer observation does replace it', St.cache.nwsWeather.observedAtRaw, 'newest');
check('and moves the clock forward', St.cache.nwsWeather.observedAt, T0 - 2 * MIN);
/* A different island is a different measurement, not an earlier one. */
St.island = 'maui';
const oTok5 = api.beginRequest('nwsWeather');
api.sourceOk('nwsWeather', { p: 'maui' }, oTok5, { at: T0 - 90 * MIN, raw: 'maui' });
check('another island\'s older reading is still stored for that island',
  St.cache.nwsWeather.observedAtRaw, 'maui');
St.island = 'statewide';

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
