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
function body(url) {
  const u = String(url);
  if (u.includes('/alerts/active')) return { features: alertFeatures || [
    { properties: { event: 'Tropical Storm Warning', severity: 'Severe', areaDesc: 'Kauai South',
                    sent: new Date().toISOString(), expires: future } },
    { properties: { event: 'Flood Watch', severity: 'Moderate', areaDesc: 'Oahu',
                    sent: new Date().toISOString(), expires: future } }
  ] };
  if (u.includes('/observations/latest')) {
    /* mph values chosen to be unmistakable per station: PHOG 10, PHLI 40, default 18.
       windOverrideMph wins when set, so two responses for the SAME station can differ. */
    if (windOverrideMph !== null) return { properties: { windSpeed: { value: windOverrideMph * 0.44704 }, windGust: { value: null }, precipitationLastHour: { value: null } } };
    if (u.includes('PHOG')) return { properties: { windSpeed: { value: 4.4704 }, windGust: { value: null }, precipitationLastHour: { value: null } } };
    if (u.includes('PHLI')) return { properties: { windSpeed: { value: 17.8816 }, windGust: { value: null }, precipitationLastHour: { value: null } } };
    return { properties: { windSpeed: { value: 8 }, windGust: { value: null }, precipitationLastHour: { value: 2.5 },
                           timestamp: new Date(Date.now() - 4 * MIN).toISOString() } };
  }
  if (u.includes('tidesandcurrents')) return { data: [{ v: '1.7' }] };
  if (u.includes('earthquake.usgs.gov')) return { features: quakeFeatures || [] };
  if (u.includes('fema.gov')) return { DisasterDeclarationsSummaries: [] };
  if (u.includes('/api/news')) return { items: newsItems || [], errors: [] };
  return {};
}
let holdPattern = null, releaseHeld = null;   // lets one response be resolved out of order
let fetchCount = 0;                           // proves the age tick issues no requests
function makeFetch(failPattern) {
  return (url) => {
    const u = String(url);
    fetchCount++;
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
  check('and the cache retains the newer reading',
    Math.round(w.eval('S.cache.nwsWeather.data.p.windSpeed.value') * 2.237), 55);
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
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  w.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('harness error:', e); process.exit(2); });
