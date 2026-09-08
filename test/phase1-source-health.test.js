/* Extracts the Phase 1 health logic from index.html and exercises it against the
   acceptance criteria in PHASE1-SOURCE-HEALTH.md. Pure logic only — no DOM. */
const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');

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
  grab(/function sourceOk\(key, data, token\) \{[\s\S]*?\n\}/, 'sourceOk'),
  grab(/function sourceFail\(key, err\) \{[\s\S]*?\n\}/, 'sourceFail'),
  grab(/function sourceState\(key\) \{[\s\S]*?\n\}/, 'sourceState'),
  grab(/function isStale\(key\) \{[^}]*\}/, 'isStale'),
  grab(/function usableCache\(key\) \{[\s\S]*?\n\}/, 'usableCache'),
  grab(/function relAge\(ts\) \{[\s\S]*?\n\}/, 'relAge')
].join('\n');

const api = eval(parts + '; ({S:S, sourceOk, sourceFail, sourceState, usableCache, relAge, beginRequest, requestIsCurrent})');
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

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
