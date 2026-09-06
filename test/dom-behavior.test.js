/* Behavioural test of the Phase 1 degraded states, run against the real index.html in jsdom.
   Opt-in: needs `npm i` for the jsdom devDependency. `npm test` stays dependency-free.

   Loads the page in jsdom, lets the opening fetches succeed, then forces
   failures to exercise the stale / unavailable paths that cannot be reached without a DOM. */
const fs = require('fs');
const { JSDOM } = require('jsdom');

const path = require('path');
const HTML = fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'index.html'), 'utf8');
const MIN = 60000;
const future = new Date(Date.now() + 45 * MIN).toISOString();

let mode = 'ok';
function body(url) {
  const u = String(url);
  if (u.includes('/alerts/active')) return { features: [
    { properties: { event: 'Tropical Storm Warning', severity: 'Severe', areaDesc: 'Kauai South',
                    sent: new Date().toISOString(), expires: future } },
    { properties: { event: 'Flood Watch', severity: 'Moderate', areaDesc: 'Oahu',
                    sent: new Date().toISOString(), expires: future } }
  ] };
  if (u.includes('/observations/latest')) return { properties: {
    windSpeed: { value: 8 }, windGust: { value: null }, precipitationLastHour: { value: 2.5 } } };
  if (u.includes('tidesandcurrents')) return { data: [{ v: '1.7' }] };
  if (u.includes('earthquake.usgs.gov')) return { features: [] };
  if (u.includes('fema.gov')) return { DisasterDeclarationsSummaries: [] };
  if (u.includes('/api/news')) return { items: [], errors: [] };
  return {};
}
function makeFetch(failPattern) {
  return (url) => {
    if (failPattern && String(url).includes(failPattern)) return Promise.reject(new Error('forced failure'));
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body(url)) });
  };
}

const dom = new JSDOM(HTML, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://preview.test/',
  beforeParse(w) {
    w.fetch = makeFetch(null);
    w.scrollTo = () => {};   // not implemented in jsdom; harmless in a browser
    w.matchMedia = q => ({ matches: false, media: q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} });
  }
});
const w = dom.window, d = w.document;
const settle = () => new Promise(r => setTimeout(r, 60));

const $ = sel => d.querySelector(sel);
const txt = sel => { const e = $(sel); return e ? e.textContent.trim() : '<missing>'; };

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (ok) { pass++; console.log('  PASS  ' + label); }
  else { fail++; console.log('  FAIL  ' + label + '\n          got:      ' + JSON.stringify(actual) + '\n          expected: ' + JSON.stringify(expected)); }
}
function has(label, sel, needle, expected) {
  const e = $(sel);
  const got = e ? e.textContent.includes(needle) : false;
  check(label, got, expected);
}

(async () => {
  await settle(); await settle(); await settle();

  console.log('1. Healthy load — everything succeeded:');
  check('pill reads LIVE', txt('.live-pill'), 'LIVE');
  check('pill has no degraded class', $('.live-pill').className, 'live-pill');
  check('Data Sources card rendered 6 rows', d.querySelectorAll('#source-health-list .src-row').length, 6);
  check('all six report Current', d.querySelectorAll('#source-health-list .src-state-current').length, 6);
  has('alerts rail shows the warning', '#nws-alerts-container', 'Tropical Storm Warning', true);
  has('no stale note when current', '#nws-alerts-container', 'last verified', false);
  check('hazard banner is the alert state', $('#hazard-banner').className, 'hazard-banner is-alert');

  console.log('\n1b. Severity model (F002) — a Severe watch must not read as a warning:');
  has('warning row badged WARNING', '#nws-alerts-container', 'WARNING', true);
  has('watch row badged WATCH', '#nws-alerts-container', 'WATCH', true);
  has('raw CAP severity no longer used as a badge', '#nws-alerts-container', '>SEVERE<', false);
  check('banner counts the tiers separately', txt('#hazard-headline'), '1 warning · 1 watch — Hawaii');
  check('warning renders above the watch',
    d.querySelector('#nws-alerts-container .alert-item .badge').textContent, 'WARNING');

  check('rain rendered its value', txt('#stat-rain').includes('0.10'), true);
  check('tide dot verified', $('#dot-tide').className, 's-dot ok');

  console.log('\n2. NWS alerts fail with retained data — the stale path:');
  w.fetch = makeFetch('/alerts/active');
  await w.fetchAlerts();
  await settle();
  check('pill flips to STALE', txt('.live-pill'), 'STALE');
  check('pill carries the delayed class', $('.live-pill').className, 'live-pill is-delayed');
  has('retained warning still on screen', '#nws-alerts-container', 'Tropical Storm Warning', true);
  has('stale note shown with its age', '#nws-alerts-container', 'Showing data last verified', true);
  has('banner says last verified', '#hazard-sub', 'Last verified', true);
  has('banner did NOT fall back to all-clear', '#hazard-headline', 'All clear', false);
  check('NWS Alerts row now Stale', d.querySelectorAll('#source-health-list .src-state').length && $('#source-health-list .src-row .src-state').textContent, 'Stale');

  console.log('\n3. Recovery:');
  w.fetch = makeFetch(null);
  await w.fetchAlerts();
  await settle();
  check('pill returns to LIVE', txt('.live-pill'), 'LIVE');
  has('stale note cleared', '#nws-alerts-container', 'Showing data last verified', false);

  console.log('\n4. Weather fails with retained data — value kept, dot goes hollow (F001):');
  w.fetch = makeFetch('/observations/');
  await w.fetchWeather();
  await settle();
  check('rain value retained', txt('#stat-rain').includes('0.10'), true);
  check('rain dot is now the unknown ring', $('#dot-rain').className, 's-dot unknown');
  has('note carries the verified age', '#stat-rain-note', 'verified', true);

  console.log('\n5. Past the stale window — retained data must be withdrawn:');
  w.eval("S.sourceHealth.nwsAlerts.lastSuccess = Date.now() - 45*60*1000; S.sourceHealth.nwsAlerts.lastError='gone';");
  w.fetch = makeFetch('/alerts/active');
  await w.fetchAlerts();
  await settle();
  check('pill reads DEGRADED', txt('.live-pill'), 'DEGRADED');
  has('rail shows unavailable, not stale data', '#nws-alerts-container', 'temporarily unavailable', true);
  has('expired retained alerts are gone', '#nws-alerts-container', 'Tropical Storm Warning', false);
  has('banner says status unavailable', '#hazard-headline', 'Alert status unavailable', true);
  has('still no all-clear', '#hazard-headline', 'All clear', false);

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  w.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('harness error:', e); process.exit(2); });
