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
let quakeFeatures = null;   // when set, overrides the default USGS payload
let windOverrideMph = null; // when set, every observation answers with this reading
let gustOnly = false;       // when true, the observation reports a gust but no sustained wind
let rawObs = null;          // when set, used verbatim as the observation properties
/* NOAA CO-OPS sends local station time, no zone, which the app reads as HST. Fixtures build it
   relative to now so they cannot rot: a hardcoded date was harmless while no render path read the
   measurement clock, and became a days-old observation the moment Stage 2 wired it in. */
function hstStamp(minutesAgo) {
  const HST = 10 * 60 * 60 * 1000;
  return new Date(Date.now() - minutesAgo * 60000 - HST).toISOString().slice(0, 16).replace('T', ' ');
}
let rawTide = null;         // when set, used verbatim as the CO-OPS data row (v and t)

/* NWS reports wind in km/h and precipitation in mm, each with its unitCode. Fixtures are
   written in the units a reader thinks in and converted here, so an expected "40 mph" in a
   test is visibly the same 40 the assertion checks. */
const KMH_PER_MPH = 1.609344;
const wind = mph => ({ unitCode: 'wmoUnit:km_h-1', value: mph == null ? null : mph * KMH_PER_MPH });
const rain = mm => ({ unitCode: 'wmoUnit:mm', value: mm });
function body(url) {
  const u = String(url);
  if (u.includes('/alerts/active')) return { features: alertFeatures || [
    { properties: { event: 'Tropical Storm Warning', severity: 'Severe', areaDesc: 'Kauai South',
                    sent: new Date().toISOString(), expires: future } },
    { properties: { event: 'Flood Watch', severity: 'Moderate', areaDesc: 'Oahu',
                    sent: new Date().toISOString(), expires: future } }
  ] };
  if (u.includes('/observations/latest')) {
    if (rawObs) return { properties: rawObs };
    /* mph values chosen to be unmistakable per station: PHOG 10, PHLI 40, default 18.
       windOverrideMph wins when set, so two responses for the SAME station can differ.

       Fixtures carry the unitCode api.weather.gov actually sends. They used to omit it and
       hold raw m/s numbers, which is how a conversion using the m/s factor against km/h data
       passed every test while overstating wind by 3.6x on production. */
    if (gustOnly) return { properties: { windSpeed: wind(null), windGust: wind(20), precipitationLastHour: rain(null),
                           timestamp: new Date(Date.now() - 4 * MIN).toISOString() } };
    if (windOverrideMph !== null) return { properties: { windSpeed: wind(windOverrideMph), windGust: wind(null), precipitationLastHour: rain(null),
                           timestamp: new Date(Date.now() - 4 * MIN).toISOString() } };
    if (u.includes('PHOG')) return { properties: { windSpeed: wind(10), windGust: wind(null), precipitationLastHour: rain(null),
                           timestamp: new Date(Date.now() - 4 * MIN).toISOString() } };
    if (u.includes('PHLI')) return { properties: { windSpeed: wind(40), windGust: wind(null), precipitationLastHour: rain(null),
                           timestamp: new Date(Date.now() - 4 * MIN).toISOString() } };
    return { properties: { windSpeed: wind(18), windGust: wind(null), precipitationLastHour: rain(2.5),
                           timestamp: new Date(Date.now() - 4 * MIN).toISOString() } };
  }
  if (u.includes('tidesandcurrents')) return { data: [rawTide || { v: '1.7', t: hstStamp(3) }] };
  if (u.includes('earthquake.usgs.gov')) return { features: quakeFeatures || [] };
  if (u.includes('fema.gov')) return { DisasterDeclarationsSummaries: [] };
  if (u.includes('/api/news')) return { items: newsItems || [], errors: [] };
  return {};
}
let holdPattern = null, releaseHeld = null;   // lets one response be resolved out of order
let fetchCount = 0;                           // proves the age tick issues no requests
const fetchLog = [];                          // every URL requested, for O16
function makeFetch(failPattern) {
  return (url) => {
    const u = String(url);
    fetchCount++;
    fetchLog.push(u);
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
  /* Same island on both requests, so only the generation counter can separate them — an
     island-only check would let the older one through. The two responses therefore carry
     DIFFERENT readings; with equal readings this section cannot fail and proves nothing. */
  windOverrideMph = 40;
  holdPattern = 'PHLI';
  const firstKauai = w.fetchWeather();   // held, having captured the 40 mph payload
  await settle();
  holdPattern = null;
  windOverrideMph = 55;
  await w.fetchWeather();                // newer request, same island, answers 55 and lands first
  await settle();
  const genAfter = w.eval('S.sourceHealth.nwsWeather.generation');
  /* undefined === undefined would pass on a build with no counter at all. */
  check('generation is actually tracked', typeof genAfter, 'number');
  check('newer 55 mph response is displayed', txt('#stat-wind'), '55 mph');

  releaseHeld();
  await firstKauai.catch(() => {});
  await settle();
  check('the older 40 mph response does not overwrite the display', txt('#stat-wind'), '55 mph');
  /* Converted through the page's own toMph rather than a factor written here. A literal
     2.237 in this assertion was a second copy of the very bug being fixed. */
  check('and the cache retains the newer reading',
    w.eval('toMph(S.cache.nwsWeather.data.p.windSpeed)'), 55);
  check('generation did not regress', w.eval('S.sourceHealth.nwsWeather.generation'), genAfter);
  windOverrideMph = null;

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

  console.log('\n11. Shared snapshot — every alert surface reads one eligibility pass:');
  /* The rail and banner filtered by selected island; the ticker never did. A Kauai-only
     warning therefore scrolled past in a Maui view. All four surfaces now read nwsSnapshot(). */
  w.fetch = makeFetch(null);
  alertFeatures = [
    { properties: { event: 'Flash Flood Warning', severity: 'Severe', urgency: 'Immediate',
                    areaDesc: 'Kauai North', sent: new Date().toISOString(), expires: future } }
  ];
  await w.fetchAlerts();
  await settle();
  w.eval("S.island='maui'");
  w.renderAlertSurfaces();
  has('rail omits the Kauai product under Maui', '#nws-alerts-container', 'Flash Flood Warning', false);
  has('ticker omits it too, as the rail does', '#ticker-track', 'Flash Flood Warning', false);
  has('banner does not count it', '#hazard-headline', 'warning', false);
  w.eval("S.island='kauai'");
  w.renderAlertSurfaces();
  has('and all three show it again under Kauai', '#nws-alerts-container', 'Flash Flood Warning', true);
  has('ticker agrees', '#ticker-track', 'Flash Flood Warning', true);
  check('banner agrees', txt('#hazard-headline'), '1 warning \u2014 Kauai');
  w.eval("S.island='statewide'");

  console.log('\n12. The nine contract source states, read off the staged strip:');
  const strip = () => ({ state: txt('#strip-state'), counts: txt('#strip-counts'), meta: txt('#strip-meta'),
                         tone: $('#nws-strip').className });
  const feed = async (features) => { alertFeatures = features; w.fetch = makeFetch(null);
                                     await w.fetchAlerts(); await settle(); };
  /* Pass NO_EXPIRY to mean "this product has none". A plain null used to fall through to
     the default, which quietly made the missing-expiry case untestable. */
  const NO_EXPIRY = '__none__';
  /* NWS returns the canonical product URL as the feature id; alertUrl() reads it from there. */
  const mkUrl = (event, id) => { const f = mk(event, 'Severe', 'Immediate', 'Oahu'); f.id = id; return f; };
  const mk = (event, severity, urgency, area, expires) => ({ properties: { event, severity, urgency,
                    areaDesc: area || 'Hawaii', sent: new Date().toISOString(),
                    expires: expires === NO_EXPIRY ? null : (expires || future) } });

  /* (1) first load, nothing verified */
  w.eval('S.sourceHealth.nwsAlerts.lastAttempt = null; S.sourceHealth.nwsAlerts.lastSuccess = null;');
  w.renderAlertSurfaces();
  check('1. checking', strip().state, 'Checking NWS alerts');
  check('   no count is asserted before anything is verified', strip().counts, '');

  /* (2) current with warnings — the O02 fixture: 18 warnings, 2 watches, 2 advisories, 1 statement */
  const many = [];
  for (let i = 0; i < 18; i++) many.push(mk('Flood Warning', 'Severe', 'Immediate', 'Zone ' + i));
  many.push(mk('Flood Watch', 'Severe', 'Future'), mk('High Wind Watch', 'Severe', 'Future'));
  many.push(mk('High Surf Advisory', 'Minor', 'Expected'), mk('Small Craft Advisory', 'Minor', 'Expected'));
  many.push(mk('Tropical Cyclone Local Statement', 'Moderate', 'Expected'));
  await feed(many);
  check('2. warnings present -> highest tier leads', strip().state, 'WARNING \u2014 Hawaii');
  check('   exact counts, every tier reported (O02)', strip().counts,
    '18 warnings \u00b7 2 watches \u00b7 2 advisories \u00b7 1 statement');
  check('   counted per product, not per incident', w.eval('nwsSnapshot().total'), 23);
  check('   strip carries the alert tone', strip().tone, 'nws-strip is-alert');
  /* The banner deliberately drops statements to stay short; the strip is where the full set
     stays discoverable. Both are asserted so neither can drift into the other's job. */
  check('   banner stays short and omits the statement', txt('#hazard-headline'),
    '18 warnings \u00b7 2 watches \u00b7 2 advisories \u2014 Hawaii');

  /* (3) current, watches and advisories only */
  await feed([mk('Flood Watch', 'Severe', 'Future'), mk('High Surf Advisory', 'Minor', 'Expected')]);
  check('3. watch/advisory only', strip().state, 'WATCH \u2014 Hawaii');
  check('   both tiers counted', strip().counts, '1 watch \u00b7 1 advisory');
  check('   amber tone, not alert', strip().tone, 'nws-strip is-warn');

  /* (4) current, statements only */
  await feed([mk('Tropical Cyclone Local Statement', 'Moderate', 'Expected'),
              mk('Special Weather Statement', 'Moderate', 'Expected')]);
  check('4. statements only stay informational', strip().state, 'STATEMENT \u2014 Hawaii');
  check('   and are counted, not hidden', strip().counts, '2 statements');
  check('   informational tone, never ok', strip().tone, 'nws-strip is-info');

  /* (5) current, verified empty */
  await feed([]);
  check('5. verified empty is scoped to the area', strip().state, 'No active NWS alerts for Hawaii');
  check('   no counts to show', strip().counts, '');
  check('   and never says Normal operations', strip().state.indexOf('Normal operations'), -1);

  /* (6) stale with retained active products */
  await feed([mk('Tropical Storm Warning', 'Severe', 'Immediate')]);
  w.fetch = makeFetch('/alerts/active');
  await w.fetchAlerts();
  await settle();
  check('6. stale retains the product and its severity', strip().state, 'WARNING \u2014 Hawaii');
  check('   with the verification age beside it', strip().meta.indexOf('Last verified') === 0, true);
  has('   and the rail still shows it', '#nws-alerts-container', 'Tropical Storm Warning', true);

  /* (7) stale where every retained product has expired */
  w.fetch = makeFetch(null);
  await feed([mk('Flood Warning', 'Severe', 'Immediate', 'Hawaii', new Date(Date.now() - 60000).toISOString())]);
  w.eval("S.sourceHealth.nwsAlerts.lastError = 'forced';");
  w.renderAlertSurfaces();
  check('7. all retained products expired -> stale, not empty', strip().state, 'Alert data stale');
  check('   which is not an all-clear', strip().state.indexOf('No active'), -1);
  check('   nor a current-looking zero', strip().counts, '');

  /* (8) past the retention window */
  w.eval('S.sourceHealth.nwsAlerts.lastSuccess = Date.now() - 45*60*1000;');
  w.fetch = makeFetch('/alerts/active');
  await w.fetchAlerts();
  await settle();
  check('8. unavailable', strip().state, 'Alert status unavailable');
  check('   unusable content is withdrawn', strip().counts, '');

  /* (9) recovery recomputes every surface */
  w.fetch = makeFetch(null);
  await feed([mk('Tropical Storm Warning', 'Severe', 'Immediate')]);
  check('9. recovery restores the current state', strip().state, 'WARNING \u2014 Hawaii');
  check('   stale treatment is gone', strip().meta.indexOf('Last verified'), -1);
  has('   and the rail is coherent again', '#nws-alerts-container', 'Tropical Storm Warning', true);

  console.log('\n13. UI age tick — withdraws expired products with no network calls:');
  await feed([mk('Flash Flood Warning', 'Severe', 'Immediate', 'Hawaii',
                 new Date(Date.now() + 30000).toISOString())]);
  check('before expiry the warning is shown', strip().state, 'WARNING \u2014 Hawaii');
  has('and is on the rail', '#nws-alerts-container', 'Flash Flood Warning', true);
  has('and in the ticker', '#ticker-track', 'Flash Flood Warning', true);
  const fetchesBefore = fetchCount;
  const verifiedBefore = w.eval('S.sourceHealth.nwsAlerts.lastSuccess');
  /* Cross the expiry boundary by ageing the retained product, which is what real time does. */
  w.eval("S.cache.nwsAlerts.data[0].properties.expires = new Date(Date.now() - 1000).toISOString();");
  w.ageTick();
  await settle();
  check('after expiry the strip withdraws it', strip().state, 'No active NWS alerts for Hawaii');
  has('the rail withdraws it', '#nws-alerts-container', 'Flash Flood Warning', false);
  has('the ticker withdraws it', '#ticker-track', 'Flash Flood Warning', false);
  has('the banner withdraws it', '#hazard-headline', 'warning', false);
  check('the tick issued no network requests', fetchCount, fetchesBefore);
  check('and did not touch the verification timestamp',
    w.eval('S.sourceHealth.nwsAlerts.lastSuccess'), verifiedBefore);

  console.log('\n13b. The tick is actually wired, not merely callable:');
  /* A manually invoked renderer would pass 13 even with no timer installed. */
  check('a timer exists after load', w.eval('ageTickTimer !== null'), true);
  const timerId = w.eval('String(ageTickTimer)');
  w.startAgeTick();
  check('calling startAgeTick again does not create a second timer',
    w.eval('String(ageTickTimer)'), timerId);
  /* Returning to a visible document must re-evaluate without a manual call. */
  await feed([mk('High Wind Warning', 'Severe', 'Immediate', 'Hawaii',
                 new Date(Date.now() + 30000).toISOString())]);
  check('warning shown before the visibility event', strip().state, 'WARNING \u2014 Hawaii');
  const fetchesBeforeVis = fetchCount;
  w.eval("S.cache.nwsAlerts.data[0].properties.expires = new Date(Date.now() - 1000).toISOString();");
  d.dispatchEvent(new w.Event('visibilitychange'));
  await settle();
  check('the visibilitychange listener withdrew it', strip().state, 'No active NWS alerts for Hawaii');
  check('and fetched nothing', fetchCount, fetchesBeforeVis);

  console.log('\n14. Island switch withdraws the previous area before the new one lands:');
  w.fetch = makeFetch(null);
  w.eval("S.island='kauai'");
  quakeFeatures = [{ properties: { mag: 4.2, place: 'Kauai fixture', time: Date.now() - 120000 } }];
  await w.fetchWeather();
  await w.fetchEarthquakes();
  await settle();
  check('Kauai reading on screen', txt('#stat-wind'), '40 mph');
  /* Without a magnitude on screen first, the withdrawal assertion below cannot fail. */
  check('and a Kauai earthquake on screen', txt('#stat-quake'), 'M 4.2');
  const mauiTab = d.querySelector('.island-tab[data-island="maui"]');
  check('the Maui tab exists to click', !!mauiTab, true);
  holdPattern = '/observations/';
  mauiTab.click();
  /* Review of PR 3: the earthquake card kept the previous island's event on screen while wind
     correctly read "Checking". Its query radius is centred on the selected island, so it is
     island-scoped like the rest. Withdrawal is synchronous with the switch and is asserted
     before any response resolves — the earthquake request is not held, so a moment later its
     own answer legitimately arrives. */
  check('the earthquake card is withdrawn too', txt('#stat-quake').indexOf('M '), -1);
  has('and says it is checking the new area', '#stat-quake-note', 'Checking Maui', true);
  check('its dot drops the verified state', $('#dot-quake').className, 's-dot unknown');
  await settle();
  check('the old reading is withdrawn immediately', txt('#stat-wind').indexOf('40'), -1);
  has('and the card says it is checking the new area', '#stat-wind-note', 'Checking Maui', true);
  check('the dot no longer claims a verified value', $('#dot-wind').className, 's-dot unknown');
  holdPattern = null;
  releaseHeld();
  await settle();
  check('then the Maui reading fills in', txt('#stat-wind'), '10 mph');
  quakeFeatures = null;
  w.eval("S.island='statewide'");

  console.log('\n15. The strip is now placed, not staged (PR 3):');
  w.renderAlertSurfaces();   /* section 14 changed the island by eval, which renders nothing */
  check('it is visible', $('#nws-strip').hasAttribute('hidden'), false);
  check('the ?strip=1 staging flag is gone', /URLSearchParams[\s\S]{0,120}strip/.test(HTML), false);
  check('it names the area it is scoped to', txt('#strip-scope').indexOf('Hawaii') !== -1, true);
  console.log('\n16. A claimed check time comes from the fetch, never from the render:');
  /* Review of PR #16: the verified-empty surfaces formatted new Date(), so every age tick and
     every navigation advanced the time the page claimed to have checked NWS — a page left
     open overnight kept reporting a fresh check it had never made. */
  w.fetch = makeFetch(null);
  await feed([]);
  /* Move the verification 3 minutes into the past. freshMs for alerts is 6 minutes, so the
     source stays current and the surfaces keep their verified-empty wording. */
  w.eval('S.sourceHealth.nwsAlerts.lastSuccess = Date.now() - 3*60*1000;');
  w.renderAlertSurfaces();
  const verifiedStr = w.eval('fmtTime(new Date(S.sourceHealth.nwsAlerts.lastSuccess))');
  const renderStr = w.eval('fmtTime(new Date())');
  /* Without this the section could pass on two identical strings and prove nothing. */
  check('the verified time and the render time are actually different',
    verifiedStr !== renderStr, true);
  check('strip reports the verified time', strip().meta.indexOf(verifiedStr) !== -1, true);
  check('strip does not report the render time', strip().meta.indexOf(renderStr), -1);
  has('banner reports the verified time', '#hazard-sub', verifiedStr, true);
  has('banner does not report the render time', '#hazard-sub', renderStr, false);
  has('empty rail reports the verified time', '#nws-alerts-container', verifiedStr, true);
  has('empty rail does not report the render time', '#nws-alerts-container', renderStr, false);

  const stampBefore = w.eval('S.sourceHealth.nwsAlerts.lastSuccess');
  const fetchesBeforeStamp = fetchCount;
  w.ageTick();
  w.switchView('alerts');
  await settle();
  check('an age tick does not advance the claimed check time',
    strip().meta.indexOf(verifiedStr) !== -1, true);
  check('navigation does not advance it either', strip().meta.indexOf(renderStr), -1);
  has('nor on the banner', '#hazard-sub', verifiedStr, true);
  has('nor on the rail', '#nws-alerts-container', verifiedStr, true);
  check('and lastSuccess itself was never rewritten',
    w.eval('S.sourceHealth.nwsAlerts.lastSuccess'), stampBefore);
  check('none of it fetched anything', fetchCount, fetchesBeforeStamp);

  /* A surface with no successful fetch behind it must say so rather than borrow the clock. */
  w.eval('S.sourceHealth.nwsAlerts.lastSuccess = null; S.sourceHealth.nwsAlerts.lastAttempt = null;');
  check('with nothing verified, no time is invented',
    w.eval("checkedTime(nwsSnapshot())"), 'not yet verified');
  console.log('\n17. Five real views, exactly one visible (PR 3):');
  const VIEWS = ['overview', 'alerts', 'maps', 'news', 'settings'];
  check('all five exist', VIEWS.every(v => !!$('#view-' + v)), true);
  check('Overview is a real view, not a relabelled Alerts', !!$('#view-overview') && !!$('#view-alerts'), true);
  /* The pinned desktop sidebar is gone. The rule that forced it visible would now stack
     every view at once, so its absence is asserted rather than assumed. */
  check('the desktop sidebar element is gone', !!$('.desktop-sidebar'), false);
  /* Comments in the stylesheet quote the old rule to explain why it went, so the check is
     made against the stylesheet with comments stripped rather than the raw source. */
  const cssNoComments = HTML.replace(/\/\*[\s\S]*?\*\//g, '');
  check('and no live rule forces a view visible',
    /\.view\s*\{[^}]*display\s*:\s*block\s*!important/.test(cssNoComments), false);
  VIEWS.forEach(v => {
    w.switchView(v);
    const active = d.querySelectorAll('.view.active');
    check('  ' + v + ': exactly one view active', active.length, 1);
    check('  ' + v + ': and it is the one asked for', active[0].id, 'view-' + v);
  });
  check('every nav destination has a view behind it',
    [...d.querySelectorAll('.nav-item')].every(b => !!$('#view-' + b.dataset.view)), true);
  check('desktop tabs cover the same five', d.querySelectorAll('.dtab').length, 5);
  check('mobile nav covers the same five', d.querySelectorAll('.nav-item').length, 5);

  console.log('\n18. Priority alerts — at most three, never hiding the count:');
  w.switchView('overview');
  const many18 = [];
  for (let i = 0; i < 18; i++) many18.push(mk('Flood Warning', 'Severe', 'Immediate', 'Zone ' + i));
  many18.push(mk('Flood Watch', 'Severe', 'Future'), mk('High Surf Advisory', 'Minor', 'Expected'));
  await feed(many18);
  check('one card leads', $('#priority-first').querySelectorAll('.pri-card').length, 1);
  check('two more follow', $('#priority-rest').querySelectorAll('.pri-card').length, 2);
  check('three shown in total', d.querySelectorAll('.pri-card').length, 3);
  has('the full count is stated, not the shown count', '#priority-viewall', 'Showing 3 of 20', true);
  has('and there is a route to all of them', '#priority-viewall', 'View all 20', true);
  has('the leading card is the warning, not an advisory', '#priority-first', 'Flood Warning', true);
  has('cards carry their expiry', '#priority-first', 'Expires', true);
  /* A product with no valid expiry says so rather than being given one. */
  await feed([mk('Flood Warning', 'Severe', 'Immediate', 'Oahu', NO_EXPIRY)]);
  has('missing expiry is stated, not invented', '#priority-first', 'Expiry not provided', true);
  check('and no dead link is rendered', $('#priority-first').querySelectorAll('a.pri-link').length, 0);
  await feed([]);
  has('an empty verified feed says so on Overview', '#priority-first', 'No active NWS alerts', true);
  check('with no cards and no route', d.querySelectorAll('.pri-card').length, 0);

  console.log('\n19. Cross-view actions move focus and fetch nothing:');
  await feed([mk('Tropical Storm Warning', 'Severe', 'Immediate')]);
  w.switchView('overview');
  const fetchesBeforeNav = fetchCount;
  w.goToAlerts();
  check('All NWS alerts opens the Alerts view', $('.view.active').id, 'view-alerts');
  check('and focuses its NWS heading', d.activeElement.id, 'nws-alerts-heading');
  w.goToSourceDetails();
  check('Source details opens Settings', $('.view.active').id, 'view-settings');
  check('and focuses Data Sources', d.activeElement.id, 'source-health-heading');
  w.switchView('maps'); w.switchView('news'); w.switchView('overview');
  await settle();
  check('navigation issued no network requests', fetchCount, fetchesBeforeNav);

  console.log('\n20. The strip follows the reader across every view:');
  await feed([mk('Tropical Storm Warning', 'Severe', 'Immediate'), mk('Flood Watch', 'Severe', 'Future')]);
  ['overview', 'maps', 'news', 'settings'].forEach(v => {
    w.switchView(v);
    check('  ' + v + ': strip still shows the state', txt('#strip-state'), 'WARNING \u2014 Hawaii');
    check('  ' + v + ': with both tier counts', txt('#strip-counts'), '1 warning \u00b7 1 watch');
    check('  ' + v + ': and a route to Alerts', $('#strip-route').hidden, false);
  });
  w.switchView('alerts');
  check('on Alerts the route is not offered', $('#strip-route').hidden, true);
  check('but the state still is', txt('#strip-state'), 'WARNING \u2014 Hawaii');
  /* The strip must not degrade into a bare link now that the pinned rail is gone. */
  check('the strip is never reduced to just a link',
    txt('#strip-counts').length > 0 && txt('#strip-state').length > 0, true);
  w.switchView('overview');

  console.log('\n21. Reading order is set by CSS, not duplicated markup:');
  /* jsdom does not resolve media queries, so the rules are read from the stylesheet. The
     document order below is what both breakpoints reorder, and it is asserted directly. */
  const kids = [...$('#view-overview').children].map(e => e.id || e.className).filter(Boolean);
  check('markup order is source-of-truth and appears once',
    kids.indexOf('priority-first') < kids.indexOf('priority-rest'), true);
  check('there is exactly one wind reading in the document',
    d.querySelectorAll('#stat-wind').length, 1);
  check('and exactly one rain reading', d.querySelectorAll('#stat-rain').length, 1);
  /* PR 3 review: CSS `order` moves boxes on screen but leaves the sequence a screen reader
     announces untouched, so the contract's 390px READING order has to be the DOM order. It
     is asserted here directly; wider breakpoints re-lay-out the same markup and are a visual
     concern only. */
  const seq = [...$('#view-overview').children].map(e => e.id).filter(Boolean);
  const at = id => seq.indexOf(id);
  check('the first priority card is announced first', at('priority-first'), 0);
  check('then the route to all products', at('priority-viewall'), 1);
  check('an observation precedes the remaining cards, as the 390px contract requires',
    at('obs-primary') < at('priority-rest'), true);
  check('and the remaining cards precede tide/earthquake',
    at('priority-rest') < at('obs-secondary'), true);
  check('references come last', at('overview-refs'), seq.length - 1);
  /* The wrapper that broke desktop order is gone: it defaulted to order:0 and jumped ahead
     of the first priority card at 1280px. */
  check('no obs-row wrapper remains', !!$('#obs-row'), false);
  check('desktop places by grid rather than reordering the DOM',
    /#priority-first\{grid-column:1\/-1;grid-row:1\}/.test(HTML), true);
  console.log('\n22. Observations moved to Overview rather than being shown twice:');
  check('the earthquake card exists', !!$('#stat-quake'), true);
  check('shelter and outage references survived the move',
    HTML.indexOf('poweroutage.us') !== -1 && HTML.indexOf('dod.hawaii.gov/hiema') !== -1, true);
  check('the ticker is retained for now', !!$('#ticker-track'), true);
  console.log('\n23. "View all N" reaches all N (PR 3 review defect 1):');
  /* The button said 20 and the destination listed 12: renderAlerts capped its output. The
     assertion is on the destination's contents, not on the label that promised them. */
  w.fetch = makeFetch(null);
  const twenty = [];
  for (let i = 0; i < 20; i++) twenty.push(mk('Flood Warning', 'Severe', 'Immediate', 'Zone ' + i));
  await feed(twenty);
  w.switchView('overview');
  has('Overview offers all twenty', '#priority-viewall', 'View all 20', true);
  w.goToAlerts();
  await settle();
  const listed = [...d.querySelectorAll('#nws-alerts-container .alert-item')]
    .filter(e => e.textContent.indexOf('Flood Warning') !== -1);
  check('and the Alerts view lists all twenty', listed.length, 20);
  check('every zone is reachable, not just the first twelve',
    listed.some(e => e.textContent.indexOf('Zone 19') !== -1), true);
  /* Guards the specific number the cap used to be, so a reintroduced slice(0,12) fails here. */
  check('the list is not truncated at twelve', listed.length > 12, true);
  w.switchView('overview');

  console.log('\n24. Coverage and units are stated, not implied (O07/O08/O11):');
  w.eval("S.island='molokai'");
  await w.fetchWeather();
  await w.fetchTides();
  await settle();
  /* Molokaʻi has no station of its own and borrows Honolulu's. Presenting that as a Molokaʻi
     reading would be the false attribution the island guard exists to prevent. */
  has('Molokai discloses the Honolulu reference', '#stat-wind-note', 'no Molokaʻi station', true);
  has('and the tide card does too', '#stat-tide-note', 'no Molokaʻi station', true);
  has('the tide reading carries its datum', '#stat-tide-note', 'ft MLLW', true);
  w.eval("S.island='statewide'");
  await w.fetchWeather();
  await settle();
  has('statewide discloses it too', '#stat-wind-note', 'Honolulu reference', true);
  /* The disclosure must survive a failed refresh: it went missing exactly when the reading
     became stale, because the cache held the unqualified station name. */
  await w.fetchTides();
  await settle();
  has('statewide tide discloses the reference', '#stat-tide-note', 'Honolulu reference', true);
  w.fetch = makeFetch('tidesandcurrents');
  await w.fetchTides();
  await settle();
  has('and still does after a failed refresh', '#stat-tide-note', 'Honolulu reference', true);
  has('while showing it is no longer verified', '#stat-tide-note', 'verified', true);
  w.eval("S.island='molokai'");
  w.fetch = makeFetch(null);
  await w.fetchTides();
  await settle();
  w.fetch = makeFetch('tidesandcurrents');
  await w.fetchTides();
  await settle();
  has('Molokai keeps its disclosure on the failure path too', '#stat-tide-note', 'no Molokaʻi station', true);
  w.eval("S.island='statewide'");
  w.fetch = makeFetch(null);
  has('the observation time is separate from the fetch time', '#stat-wind-note', 'obs ', true);

  quakeFeatures = [{ properties: { mag: 3.4, place: '14 km SW of Volcano', time: Date.now() - 3600000 } }];
  await w.fetchEarthquakes();
  await settle();
  has('the populated earthquake card states its query radius', '#stat-quake-note', 'within 500 km of Hawaii', true);
  has('and the Alerts list states it as well', '#earthquakes-container', 'within 500 km', true);
  /* Ten results is the query limit. Reporting it as a plain count would present a truncated
     list as a complete one. */
  quakeFeatures = [];
  for (let i = 0; i < 10; i++) quakeFeatures.push({ properties: { mag: 2.5, place: 'Place ' + i, time: Date.now() - i * 60000 } });
  await w.fetchEarthquakes();
  await settle();
  has('at the query limit the list says so', '#earthquakes-container', 'query limit was reached', true);
  has('and the card flags there may be more', '#stat-quake-note', '10+ in range', true);
  quakeFeatures = [{ properties: { mag: null, place: 'Unmeasured event', time: Date.now() - 60000 } }];
  await w.fetchEarthquakes();
  await settle();
  has('a missing magnitude stays unknown, never a number', '#earthquakes-container', 'unknown', true);
  check('and is not rendered as zero', txt('#earthquakes-container').indexOf('M 0.0'), -1);
  quakeFeatures = null;

  console.log('\n25. Recent earthquakes is a real action (O12):');
  w.switchView('overview');
  const fetchesBeforeQuakeNav = fetchCount;
  w.goToEarthquakes();
  check('it opens the Alerts view', $('.view.active').id, 'view-alerts');
  check('and focuses the earthquake heading', d.activeElement.id, 'earthquakes-heading');
  check('without fetching', fetchCount, fetchesBeforeQuakeNav);
  w.switchView('overview');
  console.log('\n26. Hostile feed content stays inert (O13):');
  /* Alert text is third-party. These are the shapes that have actually been used against
     feed readers: a tag that fires on load, and a scheme that executes on click. */
  w.fetch = makeFetch(null);
  await feed([mk('<img src=x onerror="window.__pwned=1">Flood Warning', 'Severe', 'Immediate',
                 '<script>window.__pwned2=1<\/script>Kauai')]);
  w.switchView('overview');
  check('no injected element was created in the priority card',
    $('#priority-first').querySelectorAll('img, script').length, 0);
  w.goToAlerts();
  check('nor in the Alerts list', $('#nws-alerts-container').querySelectorAll('img, script').length, 0);
  check('and no injected script ran', w.eval('typeof window.__pwned + "/" + typeof window.__pwned2'),
    'undefined/undefined');
  has('the hostile text is shown as text', '#nws-alerts-container', '<img src=x', true);

  /* A feed link with an executable scheme must not become a live href. */
  newsItems = [{ source: 'KHON2', title: 'Malicious link', link: 'javascript:window.__pwned3=1',
                 published: new Date().toISOString(), hazard: true }];
  await w.fetchNews();
  await settle();
  const newsLinks = [...d.querySelectorAll('#news-headlines a')];
  check('an unsafe scheme is neutralised, not rendered',
    newsLinks.every(a => a.getAttribute('href').indexOf('javascript:') === -1), true);
  newsItems = null;

  /* Both rel values are required: noopener alone still leaks the referrer, and noreferrer
     alone does not stop window.opener in older engines. The fixture carries a real product
     URL so the priority card's own outbound link is among the links checked — without one
     this section passed no matter what the card rendered. */
  w.switchView('overview');
  await feed([mkUrl('Tropical Storm Warning', 'https://api.weather.gov/alerts/urn:oid:2.49.0.1')]);
  check('the priority card rendered its outbound link',
    $('#priority-first').querySelectorAll('a.pri-link[target="_blank"]').length, 1);
  const blanks = [...d.querySelectorAll('a[target="_blank"]')];
  check('there are new-tab links to check', blanks.length > 0, true);
  check('every one carries noopener AND noreferrer',
    blanks.every(a => (a.rel || '').indexOf('noopener') !== -1 && (a.rel || '').indexOf('noreferrer') !== -1), true);

  console.log('\n27. A visitor with no API key gets the whole product (O16):');
  check('no key is set in this run', w.eval('!!S.apiKey'), false);
  await feed([mk('Tropical Storm Warning', 'Severe', 'Immediate')]);
  w.switchView('overview');
  check('the strip still reports the state', txt('#strip-state'), 'WARNING \u2014 Hawaii');
  check('priority cards still render', d.querySelectorAll('.pri-card').length, 1);
  has('observations still render', '#stat-wind-note', 'HNL', true);
  /* The AI digest is the only keyed feature and must not be offered as if it worked. */
  const digest = $('#digest-panel-alerts');
  check('the digest panel is hidden without a key', digest ? digest.hasAttribute('hidden') : true, true);
  check('and nothing was ever requested from the model API',
    fetchLog.some(u => u.indexOf('anthropic') !== -1), false);
  check('nor from any host outside the declared sources',
    fetchLog.every(u => /weather\.gov|tidesandcurrents|earthquake\.usgs\.gov|fema\.gov|\/api\/news/.test(u)), true);

  console.log('\n28. The remaining Overview routes work (O12):');
  w.switchView('overview');
  const fetchesBeforeRefs = fetchCount;
  const refButtons = [...d.querySelectorAll('#overview-refs .ref-btn')];
  check('three reference routes are offered', refButtons.length, 3);
  refButtons[0].click();
  check('Open Maps opens the Maps view', $('.view.active').id, 'view-maps');
  w.switchView('overview');
  refButtons[1].click();
  check('Open News opens the News view', $('.view.active').id, 'view-news');
  w.switchView('overview');
  check('none of the routes fetched anything', fetchCount, fetchesBeforeRefs);

  console.log('\n29. Truthful loading and gust-only readings (O07/O10):');
  /* A newest-success timestamp alone reads as a completed refresh. While anything is still
     checking, the count is stated instead. */
  w.eval('Object.keys(S.sourceHealth).forEach(k => { S.sourceHealth[k].lastAttempt = null; S.sourceHealth[k].lastSuccess = null; });');
  w.renderSourceHealth();
  has('a first load says how many sources are still checking', '#src-last-refresh', 'Checking all 6 sources', true);
  has('and does not claim a refresh happened', '#src-last-refresh', 'Last refresh', false);
  w.eval('S.sourceHealth.nwsAlerts.lastAttempt = Date.now(); S.sourceHealth.nwsAlerts.lastSuccess = Date.now();');
  w.renderSourceHealth();
  has('a partial load counts the ones still outstanding', '#src-last-refresh', 'Checking 5 of 6 sources', true);
  has('still without claiming completion', '#src-last-refresh', 'Last refresh', false);

  /* Gust-only wind must say so rather than presenting a gust as sustained wind. */
  windOverrideMph = null;
  gustOnly = true;
  w.fetch = makeFetch(null);
  await w.fetchWeather();
  await settle();
  has('a gust-only observation is labelled as such', '#stat-wind-note', 'Gust, sustained N/A', true);
  check('and the gust value itself is converted correctly', txt('#stat-wind'), '20 mph');
  gustOnly = false;

  console.log('\n30. Sticky chrome offsets are measured, not hardcoded (zoom):');
  /* A fixed 160px matched the header only at default zoom; at 200% the view tabs slid under
     it and could not be clicked. The offset now follows the measured chrome. */
  check('the view tabs stick to the measured header height',
    /\.desktop-tabs\{[^}]*top:var\(--hdr-h\)/.test(HTML), true);
  check('and no hardcoded 160px offset remains', /top:160px/.test(HTML), false);
  check('the bottom-nav spacer follows the measured nav',
    /\.content-spacer\{height:calc\(var\(--nav-h\)/.test(HTML), true);
  check('both have a fallback for before the first measurement',
    /--hdr-h:160px; --nav-h:72px;/.test(HTML), true);
  /* offsetHeight is 0 in jsdom, so this also proves the measurement cannot collapse the
     offsets to zero when it cannot measure. */
  w.syncChromeOffsets();
  check('measuring in a non-rendering DOM leaves the fallback intact',
    w.eval("document.documentElement.style.getPropertyValue('--hdr-h')"), '');
  console.log('\n31. Units come from the API, never from an assumption:');
  /* This is the defect that shipped: api.weather.gov reports wind as wmoUnit:km_h-1 and the
     code applied the metres-per-second factor, so every reading was 3.6x too high. On
     production, during an active hurricane, a 51.84 km/h gust rendered as 116 mph. The
     station's own METAR read 11017G28KT — 28 knots, 32 mph. */
  w.fetch = makeFetch(null);
  const obsWith = (m) => { rawObs = m; return w.fetchWeather().then(settle); };

  await obsWith({ windSpeed: { unitCode: 'wmoUnit:km_h-1', value: 51.84 } });
  check('the production case: 51.84 km/h reads as 32 mph', txt('#stat-wind'), '32 mph');
  check('and specifically NOT the 116 mph it used to show', txt('#stat-wind') === '116 mph', false);

  /* The same number in m/s IS 116 mph. Both conversions are exercised so the fix cannot be
     a second hardcoded factor that happens to suit one case. */
  await obsWith({ windSpeed: { unitCode: 'wmoUnit:m_s-1', value: 51.84 } });
  check('the same value in m/s is a different speed', txt('#stat-wind'), '116 mph');

  await obsWith({ windSpeed: { unitCode: 'wmoUnit:kt', value: 28 } });
  check('knots convert too, matching the METAR', txt('#stat-wind'), '32 mph');
  await obsWith({ windSpeed: { unitCode: 'wmoUnit:mi_h-1', value: 32 } });
  check('mph passes through unchanged', txt('#stat-wind'), '32 mph');

  /* A unit nobody has taught it must not be guessed at. A missing reading is recoverable; a
     hurricane wind speed wrong by a factor of three is not. */
  await obsWith({ windSpeed: { unitCode: 'wmoUnit:furlong_fortnight-1', value: 51.84 } });
  has('an unknown unit is withheld, not guessed', '#stat-wind-note', 'Not reported', true);
  check('and no number is shown for it', txt('#stat-wind').indexOf('mph'), -1);
  await obsWith({ windSpeed: { value: 51.84 } });
  has('a missing unitCode is withheld too', '#stat-wind-note', 'Not reported', true);

  /* Precipitation was already correct, but it is now unit-driven and must stay right. */
  await obsWith({ windSpeed: wind(null), precipitationLastHour: { unitCode: 'wmoUnit:mm', value: 25.4 } });
  check('25.4 mm is one inch', txt('#stat-rain'), '1.00"');
  await obsWith({ windSpeed: wind(null), precipitationLastHour: { unitCode: 'wmoUnit:m', value: 0.0254 } });
  check('the same depth in metres is also one inch', txt('#stat-rain'), '1.00"');
  await obsWith({ windSpeed: wind(null), precipitationLastHour: { unitCode: 'wmoUnit:parsec', value: 1 } });
  has('an unknown precipitation unit is withheld', '#stat-rain-note', 'Not reported', true);
  rawObs = null;
    /* ======================================================================================
     T11 at the RENDER boundary, not just in the cache.

     sourceOk() refuses an older observation, but until the callers rendered what it returned
     they rendered the response that had just arrived — so the refused, older reading went on
     screen while the cache held the newer one, and the two disagreed until some later render
     happened to correct it. The earlier T11 test called sourceOk() directly and so could only
     certify cache ordering; these drive the real fetch path.
     ====================================================================================== */
  console.log('\n27. T11 at the render boundary — a refused older observation must not be shown:');
  w.fetch = makeFetch(null);
  w.eval("S.island='statewide'");
  w.eval('S.cache = {}');

  /* A 10-minute-old observation at 30 mph, sustained, with an explicitly zoned timestamp. */
  const tenMinAgo = new Date(Date.now() - 10 * MIN).toISOString();
  rawObs = { windSpeed: wind(30), windGust: wind(null), precipitationLastHour: rain(null),
             timestamp: tenMinAgo };
  await w.fetchWeather();
  await settle();
  check('the newer reading renders', txt('#stat-wind').indexOf('30') !== -1, true);
  check('and is cached with its own observation time',
    w.eval('S.cache.nwsWeather.observedAtRaw'), tenMinAgo);

  /* Now the newest HTTP request returns a 40-minute-old observation at a different speed.
     requestIsCurrent passes; only the measurement clock can separate them. */
  const fortyMinAgo = new Date(Date.now() - 40 * MIN).toISOString();
  rawObs = { windSpeed: wind(5), windGust: wind(null), precipitationLastHour: rain(null),
             timestamp: fortyMinAgo };
  await w.fetchWeather();
  await settle();
  check('the older observation does not reach the card',
    txt('#stat-wind').indexOf('5 mph') !== -1, false);
  check('the newer reading is still displayed', txt('#stat-wind').indexOf('30') !== -1, true);
  check('the cache still holds the newer observation',
    w.eval('S.cache.nwsWeather.observedAtRaw'), tenMinAgo);
  check('so card and cache agree on which measurement won',
    txt('#stat-wind').indexOf('30') !== -1
      && w.eval('S.cache.nwsWeather.observedAtRaw') === tenMinAgo, true);

  /* A genuinely newer observation must still get through. */
  const oneMinAgo = new Date(Date.now() - 1 * MIN).toISOString();
  rawObs = { windSpeed: wind(12), windGust: wind(null), precipitationLastHour: rain(null),
             timestamp: oneMinAgo };
  await w.fetchWeather();
  await settle();
  check('a newer observation still replaces the card',
    txt('#stat-wind').indexOf('12') !== -1, true);
  check('and the cache moves forward with it',
    w.eval('S.cache.nwsWeather.observedAtRaw'), oneMinAgo);
  rawObs = null;

  console.log('\n28. The same guard on the tide card:');
  w.eval('S.cache = {}');
  /* Two readings in HST wall time, the later one fetched first. Relative to now so the guard is
     what is being tested rather than the age: a fixed date would be withdrawn as expired and the
     card would be empty for reasons that have nothing to do with T11. */
  const tideT1 = hstStamp(5);
  rawTide = { v: '1.800', t: tideT1 };
  await w.fetchTides();
  await settle();
  check('the first tide reading renders', txt('#stat-tide').indexOf('1.8') !== -1, true);
  check('and its NOAA observation time is retained',
    w.eval('S.cache.noaaTides.data.t'), tideT1);

  rawTide = { v: '0.300', t: hstStamp(35) };   /* thirty minutes EARLIER */
  await w.fetchTides();
  await settle();
  check('the older tide observation does not reach the card',
    txt('#stat-tide').indexOf('0.3') !== -1, false);
  check('the newer tide height is still displayed',
    txt('#stat-tide').indexOf('1.8') !== -1, true);
  check('and the cache kept the newer observation time',
    w.eval('S.cache.noaaTides.data.t'), tideT1);

  rawTide = { v: '2.100', t: hstStamp(2) };   /* genuinely later */
  await w.fetchTides();
  await settle();
  check('a newer tide observation still replaces the card',
    txt('#stat-tide').indexOf('2.1') !== -1, true);
  rawTide = null;

  /* ======================================================================================
     G02 — the browser emits ONLY the two canonical URLs.

     A caller-selected item count was part of the unbounded cache key space G1 closed, so the
     client must send no query string at all. Toggling is the live path: setNewsFilter() calls
     fetchNews(), so a stray parameter would reappear on a real user action rather than on load.
     Repeated toggles are used because the failure mode to fear is a shape that appears on the
     SECOND switch, not the first.
     ====================================================================================== */
  console.log('\n29. G02 — the client uses only the two canonical, query-free News URLs:');
  w.fetch = makeFetch(null);
  fetchLog.length = 0;

  await w.setNewsFilter('all');      await settle();
  await w.setNewsFilter('hazard');   await settle();
  await w.setNewsFilter('all');      await settle();
  await w.setNewsFilter('hazard');   await settle();

  /* Asserted against the COMPLETE log, never a '/api/news'-filtered view of it.
     Filtering first defeats the assertion: a stray request to '/api/headlines' would be
     removed by the filter before the shape count ever saw it, so the client could be talking
     to a third endpoint while every check below passed. The earlier version of this section
     filtered, and counted '>= 4', which admitted extra requests twice over.

     Exact counting is sound here, not merely convenient: the log is cleared immediately above,
     setNewsFilter() issues exactly one fetch through fetchNews(), and the shortest polling
     interval in the page is 30s against four 60ms settles — so nothing else can enter the log.
     If that ever stops being true this fails loudly, which is the point. */
  check('four toggles issued exactly four requests in total', fetchLog.length, 4);
  check('every request in the whole log is one of the two canonical paths',
    fetchLog.every(u => u === '/api/news' || u === '/api/news/hazard'), true);
  check('no request carries a query string',
    fetchLog.some(u => u.indexOf('?') !== -1), false);
  check('no caller-selected limit is ever sent',
    fetchLog.some(u => u.indexOf('limit') !== -1), false);
  check('hazard selection travels in the path, not a parameter',
    fetchLog.some(u => u.indexOf('hazard=') !== -1), false);
  check('both representations were actually exercised',
    fetchLog.indexOf('/api/news') !== -1 && fetchLog.indexOf('/api/news/hazard') !== -1, true);
  /* A trailing slash, a bare '?', a stray parameter, or another endpoint entirely. */
  check('the whole log contains exactly two distinct shapes',
    Array.from(new Set(fetchLog)).length, 2);

  /* ======================================================================================
     STAGE 2 — the observation clock reaches the cards.

     Stage 1 built the helpers and deliberately wired none of them. Everything below asserts the
     wiring: what the dot means, when a reading is withdrawn, and that the two clocks are reported
     separately. The clock is injected rather than faked globally, so each case states the exact
     instant it is asking about.
     ====================================================================================== */
  const isoAgo = min => new Date(Date.now() - min * MIN).toISOString();
  const dotOf  = sel => ($(sel) || {}).className;
  const seedWeather = async (props) => {
    w.eval('delete S.cache.nwsWeather');
    rawObs = props; await w.fetchWeather(); await settle();
  };
  const seedTide = async (row) => {
    w.eval('delete S.cache.noaaTides');
    rawTide = row; await w.fetchTides(); await settle();
  };

  console.log('\n30. T01 — wind magnitude never changes the observation dot:');
  for (const mph of [0, 22, 40]) {
    await seedWeather({ windSpeed: wind(mph), windGust: wind(null),
                        precipitationLastHour: rain(2.5), timestamp: isoAgo(4) });
    check('  ' + mph + ' mph reads verified, not escalated', dotOf('#dot-wind'), 's-dot ok');
  }
  /* The removed thresholds were 20 and 35 mph. A 40 mph reading is the case that used to pulse. */
  check('no observation dot carries the retired warn/alert classes',
    /s-dot (warn|alert)/.test(d.querySelector('.stat-grid') ? d.querySelector('.stat-grid').innerHTML : d.body.innerHTML), false);

  console.log('\n31. T02 — the gust-only form keeps its label and the same semantics:');
  await seedWeather({ windSpeed: wind(null), windGust: wind(40),
                      precipitationLastHour: rain(2.5), timestamp: isoAgo(4) });
  check('gust-only still states that sustained is unavailable',
    txt('#stat-wind-note').indexOf('Gust, sustained N/A') !== -1, true);
  check('and is verified on the same terms as a sustained reading', dotOf('#dot-wind'), 's-dot ok');

  console.log('\n32. T03 — rain magnitude never changes the dot; missing rain is not zero:');
  for (const mm of [0, 0.254, 25.4]) {
    await seedWeather({ windSpeed: wind(12), windGust: wind(null),
                        precipitationLastHour: rain(mm), timestamp: isoAgo(4) });
    check('  ' + mm + ' mm reads verified', dotOf('#dot-rain'), 's-dot ok');
  }
  await seedWeather({ windSpeed: wind(12), windGust: wind(null),
                      precipitationLastHour: rain(null), timestamp: isoAgo(4) });
  check('null rain reads Not reported', txt('#stat-rain-note').indexOf('Not reported') !== -1, true);
  check('and is not verified', dotOf('#dot-rain'), 's-dot unknown');
  /* Caught in the live T16 capture: the card said "Not reported" and the state map said it
     again, four fields apart in the same line. */
  check('  and says it once, not twice',
    txt('#stat-rain-note').split('Not reported').length - 1, 1);
  check('  while still carrying the observation time and verification age',
    /obs .*HST.*verified/.test(txt('#stat-rain-note')), true);

  console.log('\n33. T13 — one missing field does not unverify the other:');
  check('usable wind stays verified while rain is missing', dotOf('#dot-wind'), 's-dot ok');
  await seedWeather({ windSpeed: wind(null), windGust: wind(null),
                      precipitationLastHour: rain(2.5), timestamp: isoAgo(4) });
  check('and the inverse is symmetric: rain verified', dotOf('#dot-rain'), 's-dot ok');
  check('  with wind reading Not reported', txt('#stat-wind-note').indexOf('Not reported') !== -1, true);
  check('  and wind not verified', dotOf('#dot-wind'), 's-dot unknown');

  console.log('\n34. T04 — a fresh fetch of an old measurement is not a fresh measurement:');
  await seedWeather({ windSpeed: wind(18), windGust: wind(null),
                      precipitationLastHour: rain(2.5), timestamp: isoAgo(74) });
  check('inside the 75-minute window it is current', dotOf('#dot-wind'), 's-dot ok');
  await seedWeather({ windSpeed: wind(18), windGust: wind(null),
                      precipitationLastHour: rain(2.5), timestamp: isoAgo(77) });
  check('past it the reading is visibly stale', dotOf('#dot-wind'), 's-dot unknown');
  check('  despite a seconds-old successful fetch',
    w.eval('sourceState("nwsWeather")'), 'current');
  check('  and the card says so in words', txt('#stat-wind-note').indexOf('Observation stale') !== -1, true);

  console.log('\n35. T05 — past retention the reading is withdrawn, fetch success notwithstanding:');
  await seedWeather({ windSpeed: wind(18), windGust: wind(null),
                      precipitationLastHour: rain(2.5), timestamp: isoAgo(181) });
  check('the value is gone, not merely dimmed', txt('#stat-wind').indexOf('18') !== -1, false);
  check('  while the fetch itself still reports current',
    w.eval('sourceState("nwsWeather")'), 'current');

  console.log('\n36. T07 — a timestamp that cannot be placed in time never earns a dot:');
  await seedWeather({ windSpeed: wind(18), windGust: wind(null),
                      precipitationLastHour: rain(2.5), timestamp: null });
  check('missing observation time is not verified', dotOf('#dot-wind'), 's-dot unknown');
  check('  and never borrows the fetch clock',
    txt('#stat-wind-note').indexOf('obs time unknown') !== -1, true);
  await seedWeather({ windSpeed: wind(18), windGust: wind(null),
                      precipitationLastHour: rain(2.5), timestamp: 'not a timestamp' });
  check('unparseable observation time is not verified', dotOf('#dot-wind'), 's-dot unknown');
  /* Beyond the five-minute skew allowance: a reading we cannot place is not a reading. */
  await seedWeather({ windSpeed: wind(18), windGust: wind(null),
                      precipitationLastHour: rain(2.5),
                      timestamp: new Date(Date.now() + 20 * MIN).toISOString() });
  check('future-skewed observation is not verified', dotOf('#dot-wind'), 's-dot unknown');

  console.log('\n37. T06 — tide retains NOAA t, renders it in HST, and ages on its own clock:');
  const tideFresh = hstStamp(17);
  await seedTide({ v: '1.700', t: tideFresh });
  check('inside the 18-minute window it is current', dotOf('#dot-tide'), 's-dot ok');
  check('  and the observation time is rendered in HST',
    /obs .*HST/.test(txt('#stat-tide-note')), true);
  check('  with the raw NOAA stamp retained', w.eval('S.cache.noaaTides.data.t'), tideFresh);
  await seedTide({ v: '1.700', t: hstStamp(20) });
  check('past it the tide reading is stale', dotOf('#dot-tide'), 's-dot unknown');
  await seedTide({ v: '1.700', t: hstStamp(61) });
  check('past 60 minutes the tide reading is withdrawn',
    txt('#stat-tide').indexOf('1.7') !== -1, false);

  console.log('\n38. T08 — retained data is held only while BOTH retentions permit:');
  await seedWeather({ windSpeed: wind(23), windGust: wind(null),
                      precipitationLastHour: rain(2.5), timestamp: isoAgo(4) });
  const keptObserved = w.eval('S.cache.nwsWeather.observedAt');
  w.fetch = makeFetch('observations');            /* refresh now fails */
  await w.fetchWeather(); await settle();
  check('the retained value is still shown', txt('#stat-wind').indexOf('23') !== -1, true);
  check('  the measurement clock did not move to the failed attempt',
    w.eval('S.cache.nwsWeather.observedAt'), keptObserved);
  check('  and the copy carries the verification age as well as the observation',
    txt('#stat-wind-note').indexOf('verified') !== -1, true);
  w.fetch = makeFetch(null);

  console.log('\n39. T09 — the age tick moves the cards without fetching:');
  await seedWeather({ windSpeed: wind(18), windGust: wind(null),
                      precipitationLastHour: rain(2.5), timestamp: isoAgo(4) });
  const beforeSuccess  = w.eval('S.sourceHealth.nwsWeather.lastSuccess');
  const beforeObserved = w.eval('S.cache.nwsWeather.observedAt');
  const beforeFetches  = fetchCount;
  /* Corrupt the rendered dot, then let the tick repair it from cache alone. */
  $('#dot-wind').className = 's-dot ok-CORRUPTED';
  w.ageTick();
  await settle();
  check('the tick re-rendered the card from cache', dotOf('#dot-wind'), 's-dot ok');
  check('  issuing no request', fetchCount, beforeFetches);
  check('  leaving lastSuccess untouched',
    w.eval('S.sourceHealth.nwsWeather.lastSuccess'), beforeSuccess);
  check('  and leaving the measurement clock untouched',
    w.eval('S.cache.nwsWeather.observedAt'), beforeObserved);
  /* The boundary itself: the same cached reading, read at a later instant. */
  w.renderWeatherCard(Date.now() + 80 * MIN);
  check('crossing the staleness boundary withdraws the dot', dotOf('#dot-wind'), 's-dot unknown');
  w.renderWeatherCard();

  console.log('\n40. T15 / T17 — words for every state, and no retired classes anywhere:');
  check('the source rows report a state in words',
    /Current|Checking|Stale|Unavailable|Not reported|Observation/.test(txt('#source-health-list')), true);
  check('Source details shows the fetch age separately',
    txt('#source-health-list').indexOf('checked') !== -1, true);
  check('  and the observation age separately',
    txt('#source-health-list').indexOf('obs ') !== -1, true);
  check('no rendered dot uses the retired warn class',
    d.body.innerHTML.indexOf('s-dot warn') !== -1, false);
  check('no rendered dot uses the retired alert class',
    d.body.innerHTML.indexOf('s-dot alert') !== -1, false);
  /* A plain measurement must never generate advisory language; that is NWS's authority. */
  check('a 40 mph reading produces no warning language in the card',
    /warning|advisory|severe/i.test(txt('#stat-wind-note')), false);

  console.log('\n41. T13 — good clocks do not vouch for data that is not there:');
  await seedWeather({ windSpeed: wind(null), windGust: wind(null),
                      precipitationLastHour: rain(null), timestamp: isoAgo(2) });
  check('a reading with every value missing does not report Current',
    txt('#source-health-list').indexOf('Not reported') !== -1, true);
  await seedWeather({ windSpeed: wind(14), windGust: wind(null),
                      precipitationLastHour: rain(null), timestamp: isoAgo(2) });
  check('  while one usable value is enough to report Current',
    txt('#source-health-list').indexOf('Not reported') !== -1, false);
  rawObs = null; rawTide = null;

  console.log('\n42. Navigation re-evaluates the cards, not only the alert surfaces:');
  await seedWeather({ windSpeed: wind(18), windGust: wind(null),
                      precipitationLastHour: rain(2.5), timestamp: isoAgo(4) });
  check('the card is verified before navigating', dotOf('#dot-wind'), 's-dot ok');
  /* Corrupt the rendered dot, then navigate. A view opened after sitting on another one must
     re-evaluate from memory rather than wait up to a minute for the age tick. */
  $('#dot-wind').className = 's-dot NAVIGATION-DID-NOT-RERENDER';
  w.switchView('alerts');
  await settle();
  w.switchView('overview');
  await settle();
  check('navigating re-rendered the observation cards', dotOf('#dot-wind'), 's-dot ok');

  console.log('\n43. An island switch in flight reads as Checking, never Unavailable:');
  w.eval('S.cache = {}');
  await seedWeather({ windSpeed: wind(18), windGust: wind(null),
                      precipitationLastHour: rain(2.5), timestamp: isoAgo(4) });
  /* Hold the next observation response so the switch is genuinely mid-flight. */
  holdPattern = 'observations';
  w.eval('S.island = "maui"');
  w.renderIslandScopedChecking();
  w.fetchWeather();
  await settle();
  check('the card says Checking after the switch',
    txt('#stat-wind-note').indexOf('Checking') !== -1 || txt('#stat-wind').indexOf('Checking') !== -1
      || txt('#stat-wind-note').indexOf('heck') !== -1, true);
  /* THE REGRESSION: a tick here previously found no island-matching entry but healthy fetch
     metadata from the PREVIOUS island, concluded unavailable, and overwrote Checking. */
  w.ageTick();
  await settle();
  check('a tick mid-switch does not overwrite it with unavailable',
    txt('#stat-wind-note').indexOf('unavailable') !== -1, false);
  check('  and the previous island\'s reading is not shown under the new one',
    txt('#stat-wind').indexOf('18') !== -1, false);
  if (releaseHeld) releaseHeld();
  holdPattern = null;
  await settle();
  w.eval('S.island = "statewide"');

  console.log('\n44. A future observation never renders a negative age:');
  w.eval('S.cache = {}');
  /* Inside the five-minute skew allowance: ordinary clock disagreement, treated as age zero. */
  await seedWeather({ windSpeed: wind(18), windGust: wind(null), precipitationLastHour: rain(2.5),
                      timestamp: new Date(Date.now() + 2 * MIN).toISOString() });
  check('a slightly-ahead source clock is still verified', dotOf('#dot-wind'), 's-dot ok');
  check('  and renders no negative age', /-\d+ (sec|min|hr)/.test(txt('#stat-wind-note')), false);
  /* Beyond the allowance: undatable, and no age is offered at all. */
  w.eval('S.cache = {}');
  await seedWeather({ windSpeed: wind(18), windGust: wind(null), precipitationLastHour: rain(2.5),
                      timestamp: new Date(Date.now() + 90 * MIN).toISOString() });
  check('a far-future observation is not verified', dotOf('#dot-wind'), 's-dot unknown');
  check('  says the time is unusable',
    txt('#stat-wind-note').indexOf('Observation time unusable') !== -1, true);
  check('  and offers no age beside it', /-\d+ (sec|min|hr)/.test(txt('#stat-wind-note')), false);
  check('  nor a confident zero',
    txt('#stat-wind-note').indexOf('(0 sec ago)') !== -1, false);
  /* The card suppressed the age and Source details did not, so the same reading was undatable
     in one place and "0 sec ago" in the other, four inches apart on the same screen. */
  check('  and Source details offers no age for it either',
    /obs 0 sec ago/.test(txt('#source-health-list')), false);
  check('  while still naming the state there',
    txt('#source-health-list').indexOf('Observation time unusable') !== -1, true);
  /* A datable reading must still show its age in the row, or the fix above would be a deletion. */
  w.eval('S.cache = {}');
  await seedWeather({ windSpeed: wind(18), windGust: wind(null),
                      precipitationLastHour: rain(2.5), timestamp: isoAgo(30) });
  check('  and a datable reading still shows its observation age in the row',
    /obs \d+ min ago/.test(txt('#source-health-list')), true);

  console.log('\n45. T08 — BOTH retentions, each expiring independently:');
  w.eval('S.cache = {}');
  await seedWeather({ windSpeed: wind(23), windGust: wind(null),
                      precipitationLastHour: rain(2.5), timestamp: isoAgo(4) });
  const t08At = w.eval('S.cache.nwsWeather.observedAt');
  /* Measurement is young; the FETCH retention (30 min) is what lapses here. */
  w.renderWeatherCard(Date.now() + 31 * MIN);
  check('fetch retention expired, measurement still young: withdrawn',
    txt('#stat-wind').indexOf('23') !== -1, false);
  w.renderWeatherCard();
  check('  and the same reading returns when read at the present instant',
    txt('#stat-wind').indexOf('23') !== -1, true);
  /* The converse: a failed refresh, with the measurement past ITS retention. */
  w.eval('S.cache = {}');
  await seedWeather({ windSpeed: wind(23), windGust: wind(null),
                      precipitationLastHour: rain(2.5), timestamp: isoAgo(181) });
  /* Captured from THIS fixture, immediately before the failed refresh. An earlier version of
     this assertion compared against a value from the previous, unrelated fixture and passed
     because the two differed — which proves nothing about whether the clock moved. */
  const expiredAt = w.eval('S.cache.nwsWeather.observedAt');
  w.fetch = makeFetch('observations');
  await w.fetchWeather(); await settle();
  check('failed refresh with the measurement expired: withdrawn',
    txt('#stat-wind').indexOf('23') !== -1, false);
  w.fetch = makeFetch(null);
  check('  and the measurement clock is exactly where it was',
    w.eval('S.cache.nwsWeather.observedAt'), expiredAt);

  /* ======================================================================================
     STAGE 3 / T12 — the earthquake card.

     The asymmetry matters here: USGS has no measurement clock. An event's age is CONTENT, not
     freshness, so a month-old quake inside the 30-day window is a correct answer to a query that
     ran seconds ago. What must not be verified is a missing magnitude or an unplaceable time.
     ====================================================================================== */
  const seedQuakes = async (features) => {
    w.eval('delete S.cache.usgsEarthquakes');
    quakeFeatures = features;
    await w.fetchEarthquakes();
    await settle();
  };

  console.log('\n46. T12 — a successful empty query is a verified scoped statement:');
  await seedQuakes([]);
  check('an empty result is verified, not treated as missing data', dotOf('#dot-quake'), 's-dot ok');
  check('  and says what was searched', txt('#stat-quake-note').indexOf('No M2.0+') !== -1, true);
  check('  scoped to 30 days', txt('#stat-quake-note').indexOf('30 days') !== -1, true);
  check('  the Alerts list agrees', txt('#earthquakes-container').indexOf('NO EVENTS') !== -1, true);

  console.log('\n47. T12 — event age is content, not freshness:');
  /* Twenty days old, inside the 30-day query window, fetched seconds ago. */
  await seedQuakes([{ properties: { mag: 3.1, place: 'Old but real', time: Date.now() - 20 * 24 * 60 * MIN } }]);
  check('a 20-day-old event still carries a verified dot', dotOf('#dot-quake'), 's-dot ok');
  check('  because the QUERY is what was verified',
    w.eval("sourceState('usgsEarthquakes')"), 'current');
  check('  and the event age is shown as content', txt('#stat-quake-note').indexOf('20d ago') !== -1, true);

  console.log('\n48. T12 — a missing magnitude is the primary metric missing:');
  await seedQuakes([{ properties: { mag: null, place: 'Somewhere real', time: Date.now() - 5 * MIN } }]);
  check('the value reads M unknown', txt('#stat-quake').indexOf('M unknown') !== -1, true);
  check('  and the dot is NOT verified', dotOf('#dot-quake'), 's-dot unknown');
  check('  while place is still shown', txt('#stat-quake-note').indexOf('Somewhere real') !== -1, true);
  check('  and the event time is still shown', txt('#stat-quake-note').indexOf('5m ago') !== -1, true);

  console.log('\n49. T12 — an event time we cannot place is never dressed up as one:');
  /* Each of these rendered a plausible-looking string before Stage 3. */
  const badTimes = [
    ['undefined', undefined, 'NaNd ago'],
    ['null',      null,      '20728d ago'],
    ['NaN',       NaN,       'NaNd ago'],
    ['a string',  'not a time', 'NaNd ago']
  ];
  for (const [label, t, oldOutput] of badTimes) {
    await seedQuakes([{ properties: { mag: 4.0, place: 'Place', time: t } }]);
    check('  ' + label + ' event time is not verified', dotOf('#dot-quake'), 's-dot unknown');
    check('    and the card says so in the contract\'s words',
      txt('#stat-quake-note').indexOf('Observation time unavailable') !== -1, true);
    /* The presentation matrix requires the point-in-time VALUE to be withheld, not merely
       un-dotted. An earlier version showed "M 4.0" beside the unknown-time note, which still
       asserts an earthquake of that size happened recently enough to be worth showing. The dot
       and copy assertions alone passed across that defect, which is why this one exists. */
    check('    and the magnitude is WITHHELD, not merely un-dotted',
      txt('#stat-quake').indexOf('4.0') !== -1, false);
    check('    rather than ' + JSON.stringify(oldOutput),
      txt('#stat-quake-note').indexOf(oldOutput) !== -1, false);
    /* The radius disclosure survives withdrawal; the contract requires it to stay. */
    check('    while the query scope is still disclosed',
      txt('#stat-quake-note').indexOf('within 500 km') !== -1, true);
  }
  /* The worst of them: a future event rendered as "just now" is the fetch clock wearing the
     event's clothes, which is precisely what the contract forbids. */
  await seedQuakes([{ properties: { mag: 4.0, place: 'Place', time: Date.now() + 90 * MIN } }]);
  check('  a future event time is not verified', dotOf('#dot-quake'), 's-dot unknown');
  check('    and is never rendered as "just now"',
    txt('#stat-quake-note').indexOf('just now') !== -1, false);
  check('    its magnitude is withheld too', txt('#stat-quake').indexOf('4.0') !== -1, false);
  check('    the Alerts list refuses it too',
    txt('#earthquakes-container').indexOf('event time unknown') !== -1, true);
  /* Inside the five-minute skew allowance is ordinary clock disagreement, not an unusable time. */
  await seedQuakes([{ properties: { mag: 4.0, place: 'Place', time: Date.now() + 2 * MIN } }]);
  check('  a slightly-ahead event clock is still verified', dotOf('#dot-quake'), 's-dot ok');

  console.log('\n50. T12 — query failure withdraws the dot without inventing an event time:');
  await seedQuakes([{ properties: { mag: 3.3, place: 'Before the failure', time: Date.now() - 10 * MIN } }]);
  check('verified while the query is healthy', dotOf('#dot-quake'), 's-dot ok');
  w.fetch = makeFetch('earthquake.usgs.gov');
  await w.fetchEarthquakes(); await settle();
  check('  a failed refresh drops the verified dot', dotOf('#dot-quake'), 's-dot unknown');
  check('  and never substitutes the fetch time as the event time',
    txt('#stat-quake-note').indexOf('just now') !== -1, false);
  w.fetch = makeFetch(null);
  quakeFeatures = null;

  console.log('\n51. T12 — the five-minute skew boundary, pinned on both sides:');
  /* quakeEventAge() implements OBS_SKEW_MS independently of observationState(), so nothing else
     in the suite would notice the comparison drifting between > and >=. The clock is injected so
     the boundary is exact rather than racing the wall clock. */
  const skewBase = 1800000000000;
  const SKEW = 5 * MIN;
  check('exactly +5 minutes is INSIDE the allowance',
    w.quakeEventAge(skewBase + SKEW, skewBase) != null, true);
  check('  one millisecond beyond is not',
    w.quakeEventAge(skewBase + SKEW + 1, skewBase) == null, true);
  check('  and a past event is unaffected',
    w.quakeEventAge(skewBase - 60000, skewBase) != null, true);

  console.log('\n52. T12 — the tick re-evaluates BOTH earthquake surfaces:');
  w.eval('S.cache = {}');
  await seedQuakes([{ properties: { mag: 3.9, place: 'Shared surface', time: Date.now() - 10 * MIN } }]);
  check('card and list both show the event', txt('#stat-quake').indexOf('3.9') !== -1
    && txt('#earthquakes-container').indexOf('Shared surface') !== -1, true);
  /* Corrupt BOTH surfaces, then let one tick repair them from cache. */
  $('#dot-quake').className = 's-dot TICK-DID-NOT-RUN';
  $('#earthquakes-container').innerHTML = '<div>LIST NOT RE-RENDERED</div>';
  w.ageTick();
  await settle();
  check('the tick repaired the card', dotOf('#dot-quake'), 's-dot ok');
  check('  and the Alerts list, which it used to leave behind',
    txt('#earthquakes-container').indexOf('Shared surface') !== -1, true);
  /* Past the fetch retention the two must withdraw TOGETHER, or the list keeps showing expired
     retained events under a card that has already given up on them. */
  w.renderQuakeSurfaces(Date.now() + 61 * MIN);
  check('past retention the card is withdrawn', txt('#stat-quake').indexOf('3.9') !== -1, false);
  check('  and the list is withdrawn with it',
    txt('#earthquakes-container').indexOf('Shared surface') !== -1, false);
  check('  the list says so rather than going blank',
    txt('#earthquakes-container').indexOf('temporarily unavailable') !== -1, true);
  w.renderQuakeSurfaces();
  quakeFeatures = null;

  console.log('\nNews publication time (N03, N04, N06-N11) — an unusable time withholds only the age:');
  /* Deterministic fixtures own these cases because production cannot produce most of them:
     api/news.js emits only null or canonical ISO, and live traffic currently carries neither a
     null nor a future value. A preview pass can show valid ages rendering; it cannot show these. */
  /* N07's four wording classes, each from an independently chosen offset rather than from
     timeAgo(): under 1 minute rounds to 'just now', 5 minutes to '5m ago', 3 hours to '3h ago',
     2 days to '2d ago'. The earthquake suite exercises the same formatter but not this
     validation path, so it cannot stand in for these. */
  const SEC = 1000;
  newsItems = [
    { source: 'KHON2', title: 'Just now item',   link: 'https://example.com/j',
      published: new Date(Date.now() - 10 * SEC).toISOString(), hazard: false },
    { source: 'KHON2', title: 'Minutes item',    link: 'https://example.com/5',
      published: new Date(Date.now() - 5 * MIN).toISOString(), hazard: false },
    { source: 'KHON2', title: 'Valid past item', link: 'https://example.com/v',
      published: new Date(Date.now() - 3 * 60 * MIN).toISOString(), hazard: false },
    { source: 'KHON2', title: 'Days item',       link: 'https://example.com/d',
      published: new Date(Date.now() - 2 * 24 * 60 * MIN).toISOString(), hazard: false },
    { source: 'KHON2', title: 'Malformed item',  link: 'https://example.com/m',
      published: 'not a date', summary: 'Body text retained', hazard: false },
    { source: 'KHON2', title: 'Null item',       link: 'https://example.com/z',
      published: null, hazard: false },
    { source: 'KHON2', title: 'Empty item',      link: 'https://example.com/e',
      published: '', hazard: false },
    { source: 'KHON2', title: 'Undefined item',  link: 'https://example.com/u',
      published: undefined, hazard: false },
    /* N03's fourth case: the property is ABSENT, not merely undefined. */
    { source: 'KHON2', title: 'Missing item',    link: 'https://example.com/o', hazard: false },
    { source: 'KHON2', title: 'Future item',     link: 'https://example.com/f',
      published: new Date(Date.now() + 90 * MIN).toISOString(), hazard: true },
    { source: 'KHON2', title: 'Impossible month',link: 'https://example.com/i',
      published: '2026-13-01T00:00:00.000Z', hazard: false },
    { source: 'KHON2', title: 'Rolled midnight', link: 'https://example.com/r',
      published: '2026-01-15T24:00:00.000Z', hazard: false },
    { source: 'KHON2', title: 'Expanded year',   link: 'https://example.com/x',
      published: '-000001-01-01T00:00:00.000Z', hazard: false }
  ];
  w.fetch = makeFetch(null);
  await w.fetchNews();
  await settle();

  /* Reads the COMPLETE source-tag text, so a dangling separator cannot hide beside a correct
     age-or-nothing assertion. That is N08's whole point. */
  const itemsOf = () => Array.from(d.querySelectorAll('#news-headlines .news-item'));
  const nodeOf = title => itemsOf().find(n => {
    const h = n.querySelector('.news-headline');
    return h && h.textContent.trim() === title;
  });
  const tagOf = title => {
    const el = nodeOf(title);
    return el ? el.querySelector('.news-source-tag').textContent : '<missing>';
  };
  const hrefOf = title => { const el = nodeOf(title); return el ? el.getAttribute('href') : '<missing>'; };
  const aged = () => itemsOf().filter(n => {
    const t = n.querySelector('.news-source-tag');
    return t && t.textContent.indexOf('\u00b7') !== -1;
  }).length;

  check('N09 every article is retained, none dropped for a bad time', itemsOf().length, 13);

  console.log('  N07 — the four wording classes, through the real validation path:');
  check('N07 under a minute reads just now', tagOf('Just now item'), 'KHON2 \u00b7 just now');
  check('N07 minutes',                       tagOf('Minutes item'),  'KHON2 \u00b7 5m ago');
  check('N07 hours',                         tagOf('Valid past item'), 'KHON2 \u00b7 3h ago');
  check('N07 days',                          tagOf('Days item'),     'KHON2 \u00b7 2d ago');

  console.log('  N03/N04/N06 — everything unusable withholds the age and its separator:');
  check('N04/N08 a malformed value shows no age AND no dangling separator',
    tagOf('Malformed item'), 'KHON2');
  check('N03 null shows no age',        tagOf('Null item'), 'KHON2');
  check('N03 empty shows no age',       tagOf('Empty item'), 'KHON2');
  check('N03 undefined shows no age',   tagOf('Undefined item'), 'KHON2');
  check('N03 an absent property shows no age', tagOf('Missing item'), 'KHON2');
  check('N02 an impossible month shows no age and does not throw',
    tagOf('Impossible month'), 'KHON2');
  check('N02 an ISO-legal 24:00 that rolls a day shows no age',
    tagOf('Rolled midnight'), 'KHON2');
  check('N02 a past expanded year shows no age', tagOf('Expanded year'), 'KHON2');
  check('N06 a materially future item shows no age, and keeps its HAZARD tag',
    tagOf('Future item'), 'KHON2HAZARD');
  /* The aggregate: exactly the four valid items carry an age. A guard that leaked one extra
     age would move this count even if its own per-item assertion were somehow satisfied. */
  check('N06/N03/N04 exactly the four valid items carry an age', aged(), 4);
  has('N04 no NaNd ago anywhere in the feed', '#news-headlines', 'NaNd', false);
  has('N04 no Invalid Date anywhere either',  '#news-headlines', 'Invalid Date', false);
  has('N09 the summary survives an unusable time',
    '#news-headlines', 'Body text retained', true);
  check('N13 the link still passes through safeUrl unchanged',
    hrefOf('Malformed item'), 'https://example.com/m');
  check('N10 order is as served; publication time did not reorder anything',
    itemsOf()[0].querySelector('.news-headline').textContent.trim(), 'Just now item');

  console.log('  N11 — publication age is not fetch health, under BOTH fetch states:');
  check('N11 unusable article times do not make the News SOURCE unhealthy',
    w.sourceState('news'), 'current');
  check('N11 and do not make the fetch stale', w.isStale('news'), false);
  has('N11 the stamp reports the FETCH clock, not any article age',
    '#news-updated', '13 headlines \u00b7 updated', true);
  /* Drive the stale state through the REAL failure path. Codex's finding: renderNews(..., true)
     only proves the renderer obeys its own argument, which is not what N11 asks. Nor is poking
     S.sourceHealth, which is not reachable from the test anyway -- S is a const, not a global.

     A successful fetch followed by a FAILED refresh is exactly how News goes stale in
     production: fetchNews() catches, calls sourceFail('news', ...), and re-renders the CACHED
     payload with staleness derived from the fetch lifecycle. Nothing below is hand-supplied. */
  w.fetch = makeFetch('/api/news');
  await w.fetchNews();
  await settle();
  check('N11 a failed refresh makes News genuinely stale', w.sourceState('news'), 'stale');
  check('N11   and isStale() agrees, so the render argument is derived', w.isStale('news'), true);
  has('N11 the stale note reaches the list through the real state',
    '#news-headlines', 'Showing data last verified', true);
  has('N11 the stamp switches to last verified',
    '#news-updated', '13 headlines \u00b7 last verified', true);
  check('N11 every article is still retained from cache', itemsOf().length, 13);
  check('N11 an old article age is unchanged by the fetch state',
    tagOf('Days item'), 'KHON2 \u00b7 2d ago');
  check('N11 an unusable time still withholds under a stale fetch',
    tagOf('Malformed item'), 'KHON2');
  check('N11 exactly four ages under a stale fetch too', aged(), 4);
  check('N11 rendering did not alter the stale health state', w.sourceState('news'), 'stale');
  /* Restore through the real path too: a successful refresh returns News to current, so
     nothing after this inherits a stale source. */
  w.fetch = makeFetch(null);
  await w.fetchNews();
  await settle();
  check('N11 a successful refresh restores current', w.sourceState('news'), 'current');
  has('N11   and the stale note is gone again',
    '#news-headlines', 'Showing data last verified', false);
  newsItems = null;

console.log('\n' + pass + ' passed, ' + fail + ' failed');
  w.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('harness error:', e); process.exit(2); });
