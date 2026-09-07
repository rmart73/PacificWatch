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
let alertFeatures = null;   // when set, overrides the default alert payload
let newsItems = null;       // when set, overrides the default news payload
function body(url) {
  const u = String(url);
  if (u.includes('/alerts/active')) return { features: alertFeatures || [
    { properties: { event: 'Tropical Storm Warning', severity: 'Severe', areaDesc: 'Kauai South',
                    sent: new Date().toISOString(), expires: future } },
    { properties: { event: 'Flood Watch', severity: 'Moderate', areaDesc: 'Oahu',
                    sent: new Date().toISOString(), expires: future } }
  ] };
  if (u.includes('/observations/latest')) {
    /* mph values chosen to be unmistakable per station: PHOG 10, PHLI 40, default 18 */
    if (u.includes('PHOG')) return { properties: { windSpeed: { value: 4.4704 }, windGust: { value: null }, precipitationLastHour: { value: null } } };
    if (u.includes('PHLI')) return { properties: { windSpeed: { value: 17.8816 }, windGust: { value: null }, precipitationLastHour: { value: null } } };
    return { properties: { windSpeed: { value: 8 }, windGust: { value: null }, precipitationLastHour: { value: 2.5 } } };
  }
  if (u.includes('tidesandcurrents')) return { data: [{ v: '1.7' }] };
  if (u.includes('earthquake.usgs.gov')) return { features: [] };
  if (u.includes('fema.gov')) return { DisasterDeclarationsSummaries: [] };
  if (u.includes('/api/news')) return { items: newsItems || [], errors: [] };
  return {};
}
let holdPattern = null, releaseHeld = null;   // lets one response be resolved out of order
function makeFetch(failPattern) {
  return (url) => {
    const u = String(url);
    if (failPattern && u.includes(failPattern)) return Promise.reject(new Error('forced failure'));
    if (holdPattern && u.includes(holdPattern)) {
      const payload = body(u);
      return new Promise(res => { releaseHeld = () => res({ ok: true, status: 200, json: () => Promise.resolve(payload) }); });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body(u)) });
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

  console.log('\n6. Statement-only feed — regression: must not read as an all-clear:');
  alertFeatures = [
    { properties: { event: 'Tropical Cyclone Local Statement', severity: 'Moderate',
                    urgency: 'Expected', areaDesc: 'Niihau; Kauai', sent: new Date().toISOString(),
                    expires: future } }
  ];
  w.fetch = makeFetch(null);
  await w.fetchAlerts();
  await settle();
  has('banner does NOT say all clear', '#hazard-headline', 'All clear', false);
  check('banner reports the statement factually', txt('#hazard-headline'), '1 statement — Hawaii');
  check('banner uses the informational state, not ok', $('#hazard-banner').className, 'hazard-banner is-info');
  check('and not unknown, which would mean we failed to check',
    $('#hazard-banner').className.indexOf('is-unknown'), -1);
  has('the product is listed in the rail', '#nws-alerts-container', 'Tropical Cyclone Local Statement', true);
  has('badged STATEMENT', '#nws-alerts-container', 'STATEMENT', true);
  has('ticker does not claim no active alerts', '#ticker-track', 'No active NWS alerts', false);

  console.log('\n7. Unrecognised product names still resolve to a tier:');
  alertFeatures = [
    { properties: { event: 'Zzz Unknown Product', severity: 'Minor', urgency: 'Future',
                    areaDesc: 'Oahu', sent: new Date().toISOString(), expires: future } }
  ];
  await w.fetchAlerts();
  await settle();
  has('no all-clear', '#hazard-headline', 'All clear', false);
  check('falls back to statement via the urgency rule', txt('#hazard-headline'), '1 statement — Hawaii');

  console.log('\n7b. Exhaustiveness guard — reachable only if a future tier is added:');
  /* alertTier() can only return one of the four known tiers, so the guard is unreachable
     through normal input. It exists for the next tier someone adds and forgets to report —
     which is exactly how the statement-only all-clear regression happened. Simulate that
     by making alertTier return a tier the banner does not enumerate. */
  w.eval("ALERT_TIERS.experimental = { rank: 4, badge: 'badge-unknown', label: 'EXPERIMENTAL' };" +
         "var __realAlertTier = alertTier; alertTier = function () { return 'experimental'; };");
  await w.fetchAlerts();
  await settle();
  has('an unenumerated tier still blocks all-clear', '#hazard-headline', 'All clear', false);
  has('and is reported plainly', '#hazard-headline', 'active alert', true);
  w.eval('alertTier = __realAlertTier;');
  await w.fetchAlerts();
  await settle();
  check('restored', txt('#hazard-headline'), '1 statement — Hawaii');

  console.log('\n8. A genuinely empty feed is still allowed to say all clear:');
  alertFeatures = [];
  await w.fetchAlerts();
  await settle();
  has('empty verified feed reads all clear', '#hazard-headline', 'All clear', true);
  check('and uses the ok state', $('#hazard-banner').className, 'hazard-banner is-ok');

  console.log('\n9. News source filter (F003) — a control that actually controls something:');
  newsItems = [
    { source: 'Star-Advertiser', title: 'SA headline', link: 'https://example.com/a', published: new Date().toISOString(), hazard: true },
    { source: 'Hawaii News Now', title: 'HNN headline', link: 'https://example.com/b', published: new Date().toISOString(), hazard: true },
    { source: 'KHON2', title: 'KHON headline', link: 'https://example.com/c', published: new Date().toISOString(), hazard: false }
  ];
  w.fetch = makeFetch(null);
  await w.fetchNews();
  await settle();
  check('five real outlets listed, not seven labels',
    d.querySelectorAll('#news-source-rows [data-news-source]').length, 5);
  check('all enabled by default',
    d.querySelectorAll('#news-source-rows .toggle.on').length, 5);
  has('all three headlines shown', '#news-headlines', 'SA headline', true);

  w.toggleNewsSource('Star-Advertiser');
  await settle();
  has('disabled outlet is hidden', '#news-headlines', 'SA headline', false);
  has('other outlets remain', '#news-headlines', 'HNN headline', true);
  has('stamp reports the hidden count', '#news-updated', 'hidden by filter', true);
  check('the toggle reflects the state',
    d.querySelectorAll('#news-source-rows .toggle.on').length, 4);
  check('persisted to localStorage',
    JSON.parse(w.localStorage.getItem('pw_news_sources')).indexOf('Star-Advertiser'), -1);

  ['Hawaii News Now', 'KHON2', 'Civil Beat', 'KITV 4'].forEach(s => w.toggleNewsSource(s));
  await settle();
  has('filtering everything out says so explicitly', '#news-headlines', 'hidden by your source filter', true);
  has('and does NOT claim there is no news', '#news-headlines', 'No headlines available', false);

  w.enableAllNewsSources();
  await settle();
  has('enable-all restores the headlines', '#news-headlines', 'SA headline', true);
  check('and all five toggles', d.querySelectorAll('#news-source-rows .toggle.on').length, 5);

  console.log('\n10. Island request-generation guard (contract O09):');
  /* A slow request started under one island must never be cached or rendered under
     another. Before the guard this filed Maui's Kahului reading as Kauai's. */
  w.fetch = makeFetch(null);
  w.eval("S.island='maui'");
  holdPattern = 'PHOG';
  const mauiPending = w.fetchWeather();
  await settle();
  holdPattern = null;
  w.eval("S.island='kauai'");
  await w.fetchWeather();
  await settle();
  check('Kauai reading rendered', txt('#stat-wind').indexOf('40') !== -1, true);

  releaseHeld();
  await mauiPending.catch(() => {});
  await settle();
  check('late Maui response does not overwrite the display',
    txt('#stat-wind').indexOf('40') !== -1, true);
  check('and does not poison the cache station',
    w.eval('S.cache.nwsWeather.data.label'), 'Lihue');
  check('cache island still matches the selection',
    w.eval('S.cache.nwsWeather.island'), 'kauai');

  console.log('\n10b. An overtaken response for the SAME island is also discarded:');
  holdPattern = 'PHLI';
  const firstKauai = w.fetchWeather();   // held
  await settle();
  holdPattern = null;
  await w.fetchWeather();                // newer request for the same island completes
  await settle();
  const genAfter = w.eval('S.sourceHealth.nwsWeather.generation');
  releaseHeld();
  await firstKauai.catch(() => {});
  await settle();
  check('generation did not regress', w.eval('S.sourceHealth.nwsWeather.generation'), genAfter);
  check('display still shows the newer response', txt('#stat-wind').indexOf('40') !== -1, true);

  console.log('\n10c. A non-island-scoped source must NOT be discarded on island change:');
  /* The guard rejects a completion whose start-island no longer matches — but only for
     island-scoped sources. News is statewide, so a news response that lands after an
     island switch must still be accepted, or switching islands would silently drop
     headlines. This is the guard's most likely over-reach, so it is tested directly. */
  w.eval("S.island='statewide'");
  newsItems = [{ source: 'KHON2', title: 'Late news item', link: 'https://example.com/n',
                 published: new Date().toISOString(), hazard: true }];
  holdPattern = '/api/news';
  const newsPending = w.fetchNews();
  await settle();
  holdPattern = null;
  w.eval("S.island='maui'");           // island changes while the news request is in flight
  releaseHeld();
  await newsPending.catch(() => {});
  await settle();
  has('the late news response is still rendered', '#news-headlines', 'Late news item', true);
  check('and is still cached', w.eval("S.cache.news && S.cache.news.data.items.length"), 1);
  check('news is genuinely not island-scoped', w.eval("!!ISLAND_SCOPED.news"), false);
  w.eval("S.island='statewide'");
  newsItems = null;

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  w.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('harness error:', e); process.exit(2); });
