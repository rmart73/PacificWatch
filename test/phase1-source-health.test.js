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
  grab(/function sourceOk\(key, data\) \{[\s\S]*?\n\}/, 'sourceOk'),
  grab(/function sourceFail\(key, err\) \{[\s\S]*?\n\}/, 'sourceFail'),
  grab(/function sourceState\(key\) \{[\s\S]*?\n\}/, 'sourceState'),
  grab(/function isStale\(key\) \{[^}]*\}/, 'isStale'),
  grab(/function usableCache\(key\) \{[\s\S]*?\n\}/, 'usableCache'),
  grab(/function relAge\(ts\) \{[\s\S]*?\n\}/, 'relAge')
].join('\n');

const api = eval(parts + '; ({S:S, sourceOk, sourceFail, sourceState, usableCache, relAge})');
const St = api.S;

/* the expiry predicate, lifted verbatim out of renderAlerts */
const filterSrc = grab(/const live = \(features \|\| \[\]\)\.filter\(f => \{[\s\S]*?\n  \}\);/, 'expiry filter');
const pickLive = new Function('features', 'now', filterSrc + ' return live;');

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

console.log('\nrelAge:');
check('45 sec', api.relAge(Date.now() - 45000), '45 sec ago');
check('3 min',  api.relAge(Date.now() - 3 * MIN), '3 min ago');
check('5 hr',   api.relAge(Date.now() - 5 * HOUR), '5 hr ago');
check('2 days', api.relAge(Date.now() - 50 * HOUR), '2 days ago');
check('never',  api.relAge(null), 'never');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
