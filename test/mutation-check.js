/* Mutation check for the DOM suite. Opt-in like test:dom, since it needs jsdom.

   Why this exists: review of PR #14 found a regression test that could not fail — both
   fixtures in the section carried the same reading, so the bug it was written to catch
   would have passed. Assertions that cannot fail are not evidence, and nothing in a green
   test run distinguishes them from ones that can.

   This breaks one behaviour at a time in a copy of index.html, runs the real DOM suite
   against the mutant, and requires the intended assertion to fail. Production files are
   never modified: every mutant is written to a temporary directory and deleted after.

   Add a case here whenever you add a behaviour worth trusting. If a mutation is reported
   MISSED, the assertion covering it is decorative and should be tightened. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
/* Cases name the suite that is supposed to catch them. Both suites take an html path. */
const SUITES = {
  dom: path.join(__dirname, 'dom-behavior.test.js'),
  contrast: path.join(__dirname, 'contrast.test.js'),
  /* The pure health suite owns the Q007/Q008 observation clock, which has no DOM surface in
     stage 1 — its assertions would be unmutated otherwise. */
  health: path.join(__dirname, 'phase1-source-health.test.js'),
  /* The News API suite owns G1. Its subject is api/news.js, not index.html, which is why cases
     naming it must also set target: 'api'. */
  news: path.join(__dirname, 'news-api.test.js')
};
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
/* G1 mutations act on the serverless handler rather than the page. A case selects its subject
   with target: 'api'; everything else defaults to the page as before. */
const apiSrc = fs.readFileSync(path.join(ROOT, 'api', 'news.js'), 'utf8').replace(/\r\n/g, '\n');
const SUBJECT = { html: { src: src, ext: '.html' }, api: { src: apiSrc, ext: '.js' } };

const mutations = [
  { name: 'island filter dropped from nwsEligible',
    from: '    .filter(f => alertMatchesIsland(f, S.island))',
    to:   '    .filter(f => true)',
    expect: ['rail omits the Kauai product under Maui', 'ticker omits it too'] },

  { name: 'age tick issues a network fetch',
    from: 'function ageTick() {\n  renderAlertSurfaces();',
    to:   "function ageTick() {\n  fetch('https://api.weather.gov/alerts/active?area=HI');\n  renderAlertSurfaces();",
    expect: ['the tick issued no network requests'] },

  { name: 'age tick never started',
    from: '\nstartAgeTick();',
    to:   '\n/* startAgeTick(); */',
    expect: ['a timer exists after load'] },

  { name: 'age tick refreshes the verification timestamp',
    from: 'function ageTick() {\n  renderAlertSurfaces();',
    to:   'function ageTick() {\n  S.sourceHealth.nwsAlerts.lastSuccess = Date.now();\n  renderAlertSurfaces();',
    expect: ['did not touch the verification timestamp'] },

  { name: 'island-scoped cards not withdrawn on switch',
    from: '    renderIslandScopedChecking();\n    renderAlertSurfaces();',
    to:   '    renderAlertSurfaces();',
    expect: ['the old reading is withdrawn immediately', 'card says it is checking the new area'] },

  { name: 'strip suppresses statements the way the banner does',
    from: "  ['warning', 'watch', 'advisory', 'statement'].forEach(t => {\n    if (snap.counts[t]) parts.push(tierCountLabel(t, snap.counts[t]));\n  });",
    to:   "  ['warning', 'watch', 'advisory'].forEach(t => {\n    if (snap.counts[t]) parts.push(tierCountLabel(t, snap.counts[t]));\n  });",
    expect: ['exact counts, every tier reported'] },

  /* PR 3: the Overview, its priority cards and the cross-view actions. */
  { name: 'more than three priority cards rendered',
    from: '  const items = snap.features.slice(0, PRIORITY_MAX);',
    to:   '  const items = snap.features.slice(0, 5);',
    expect: ['three shown in total'] },

  { name: 'the route reports the shown count instead of the real total',
    from: "    ? 'Showing ' + items.length + ' of ' + snap.total + ' active NWS products'",
    to:   "    ? 'Showing ' + items.length + ' of ' + items.length + ' active NWS products'",
    expect: ['the full count is stated, not the shown count'] },

  { name: 'a missing expiry is invented rather than stated',
    from: "  const expiry = isNaN(expMs) ? 'Expiry not provided' : 'Expires ' + fmtTime(new Date(expMs));",
    to:   "  const expiry = 'Expires ' + fmtTime(new Date(isNaN(expMs) ? Date.now() : expMs));",
    expect: ['missing expiry is stated, not invented'] },

  { name: 'switching views leaves the previous one active too',
    from: "  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));",
    to:   "  /* mutation: previous view left active */",
    expect: ['exactly one view active'] },

  { name: 'a cross-view action navigates without moving focus',
    from: "function goToAlerts() {\n  switchView('alerts');\n  focusTarget('nws-alerts-heading');",
    to:   "function goToAlerts() {\n  switchView('alerts');",
    expect: ['and focuses its NWS heading'] },

  { name: 'the strip offers a route to the view already open',
    from: "  if (routeEl) routeEl.hidden = (S.view === 'alerts');",
    to:   "  if (routeEl) routeEl.hidden = false;",
    expect: ['on Alerts the route is not offered'] },

  /* Reading order is the DOM order, so the mutation is a markup move rather than a CSS
     value. Screen readers follow the document, which is what the 390px rule is about. */
  { name: 'the remaining priority cards moved ahead of the observations in the DOM',
    from: '    <div class="stat-bar" id="obs-primary">',
    to:   '    <div id="priority-rest"></div>\n    <div class="stat-bar" id="obs-primary">',
    expect: ['an observation precedes the remaining cards'] },

  /* PR 3 review defects. Each mutation restores the defect that was reported. */
  { name: 'the Alerts list caps at twelve products again',
    from: '  container.innerHTML = note + filtered.map(f => {',
    to:   '  container.innerHTML = note + filtered.slice(0,12).map(f => {',
    expect: ['the Alerts view lists all twenty'] },

  { name: 'the earthquake card survives an island switch',
    from: "   ['stat-tide', 'stat-tide-note', 'dot-tide'],\n   ['stat-quake', 'stat-quake-note', 'dot-quake']].forEach(ids => {",
    to:   "   ['stat-tide', 'stat-tide-note', 'dot-tide']].forEach(ids => {",
    expect: ['the earthquake card is withdrawn too'] },

  { name: 'desktop reorders the DOM instead of placing by grid',
    from: '  #priority-first{grid-column:1/-1;grid-row:1}',
    to:   '  #priority-first{order:1}',
    expect: ['desktop places by grid rather than reordering the DOM'], suite: 'dom' },

  { name: 'the Honolulu reference substitution is hidden again',
    from: "    const kept = sourceOk('nwsWeather', { p: data.properties, label: stationLabel(sta) }, token,",
    to:   "    const kept = sourceOk('nwsWeather', { p: data.properties, label: sta.label }, token,",
    expect: ['statewide discloses it too'] },

  /* Both sides of a cached label have to carry the qualifier. Fixing the weather path and
     leaving the tide path was the actual defect, so each is mutated separately. */
  { name: 'the tide cache stores the unqualified station name',
    from: "    const kept = sourceOk('noaaTides', { ft: ft, name: tideLabel(sta), t: typeof latest.t === 'string' ? latest.t : null }, token,",
    to:   "    const kept = sourceOk('noaaTides', { ft: ft, name: sta.name, t: typeof latest.t === 'string' ? latest.t : null }, token,",
    expect: ['and still does after a failed refresh'] },

  { name: 'the populated earthquake card drops its query scope',
    from: "    + ' \\u00b7 ' + quakeRadiusLabel() + capped + suffix;",
    to:   "    + capped + suffix;",
    expect: ['the populated earthquake card states its query radius'] },

  /* Functional acceptance: hostile content, unkeyed visitors, truthful loading, zoom. */
  { name: 'the priority card stops escaping the event name',
    from: "    + '<span class=\"pri-event\">' + esc(p.event || 'Alert') + '</span></div>'",
    to:   "    + '<span class=\"pri-event\">' + (p.event || 'Alert') + '</span></div>'",
    expect: ['no injected element was created in the priority card'] },

  { name: 'a new-tab link drops noreferrer',
    from: '<a class="pri-link" href="\' + url + \'" target="_blank" rel="noopener noreferrer">',
    to:   '<a class="pri-link" href="\' + url + \'" target="_blank" rel="noopener">',
    expect: ['every one carries noopener AND noreferrer'] },

  { name: 'the loading aggregate claims a refresh while sources are still checking',
    from: "    const checking = keys.filter(k => sourceState(k) === 'loading').length;",
    to:   "    const checking = 0;",
    expect: ['a first load says how many sources are still checking'] },

  { name: 'gust-only wind is presented as sustained wind',
    from: "      if (windNote) windNote.textContent = `Gust, sustained N/A \u00b7 ${label}${windSuffix}`;",
    to:   "      if (windNote) windNote.textContent = `${label}${windSuffix}`;",
    expect: ['a gust-only observation is labelled as such'] },

  { name: 'the view tabs go back to a hardcoded sticky offset',
    from: 'position:sticky;top:var(--hdr-h);z-index:50;flex-wrap:wrap}',
    to:   'position:sticky;top:160px;z-index:50;flex-wrap:wrap}',
    expect: ['the view tabs stick to the measured header height'] },

  { name: 'the bottom-nav spacer goes back to a fixed height',
    from: '.content-spacer{height:calc(var(--nav-h) + 12px)}',
    to:   '.content-spacer{height:72px}',
    expect: ['the bottom-nav spacer follows the measured nav'] },

  /* The unit defect that shipped to production: km/h data converted with the m/s factor,
     overstating every wind reading by 3.6x during a hurricane. */
  { name: 'wind converted with the metres-per-second factor again',
    from: "  'wmounit:km_h-1': 0.621371,",
    to:   "  'wmounit:km_h-1': 2.236936,",
    expect: ['the production case: 51.84 km/h reads as 32 mph'] },

  { name: 'an unrecognised unit is converted with a guessed factor',
    from: "  if (factor === undefined) {",
    to:   "  if (false) {",
    expect: ['an unknown unit is withheld, not guessed'] },

  { name: 'the declared unitCode is ignored and one factor is assumed',
    from: "  const factor = table[code];",
    to:   "  const factor = table['wmounit:m_s-1'];",
    expect: ['the production case: 51.84 km/h reads as 32 mph'] },

  { name: 'precipitation loses its unit handling',
    from: "  'wmounit:mm': 0.0393701,",
    to:   "  'wmounit:mm': 1,",
    expect: ['25.4 mm is one inch'] },

  { name: 'the tide reading drops its datum',
    from: "  if (tideNote) tideNote.textContent = 'ft MLLW · ' + name",
    to:   "  if (tideNote) tideNote.textContent = '' + name",
    expect: ['the tide reading carries its datum'] },

  { name: 'a truncated earthquake list reads as a complete count',
    from: '  const limitNote = quakes.length >= USGS_LIMIT',
    to:   '  const limitNote = false',
    expect: ['at the query limit the list says so'] },

  { name: 'a missing magnitude is rendered as a number',
    from: "    const mag = p.mag != null ? p.mag.toFixed(1) : 'unknown';",
    to:   "    const mag = (p.mag || 0).toFixed(1);",
    expect: ['a missing magnitude stays unknown, never a number'] },

  /* Breaks the page at section 1 rather than at the snapshot sections: with a current
     source reporting no data, every surface empties immediately. */
  { name: 'snapshot treats a current source as having no data',
    from: "  if (state === 'current') raw = entry ? entry.data : null;",
    to:   "  if (state === 'current') raw = usableCache('nwsAlerts');",
    expect: ['alerts rail shows the warning'] },

  { name: 'stale-with-all-expired reported as verified empty',
    from: "  if (!snap.total) snap.presentation = snap.stale ? 'stale-empty' : 'empty';",
    to:   "  if (!snap.total) snap.presentation = 'empty';",
    expect: ['7. all retained products expired'] },

  /* Review of PR #16, finding 1: a claimed check time must come from the fetch. */
  { name: 'strip check time taken from the render clock',
    from: "    meta = 'NWS Honolulu \\u00b7 Checked ' + checkedTime(snap);",
    to:   "    meta = 'NWS Honolulu \\u00b7 Checked ' + fmtTime(new Date());",
    expect: ['strip does not report the render time'] },

  { name: 'banner check time taken from the render clock',
    from: "    subtext = 'No active NWS alerts \\u00b7 updated ' + checkedTime(snap);",
    to:   "    subtext = 'No active NWS alerts \\u00b7 updated ' + fmtTime(new Date());",
    expect: ['banner does not report the render time'] },

  { name: 'checkedTime falls back to the clock when nothing was verified',
    from: "  return snap && snap.checkedAt ? fmtTime(new Date(snap.checkedAt)) : 'not yet verified';",
    to:   "  return fmtTime(new Date(snap && snap.checkedAt ? snap.checkedAt : Date.now()));",
    expect: ['with nothing verified, no time is invented'] },

  /* Review of PR #16, finding 2: strip text must clear 4.5:1 in both themes. */
  { name: 'strip watch text reverted to the display token',
    from: '.nws-strip.is-warn .strip-state{color:var(--strip-warn)}',
    to:   '.nws-strip.is-warn .strip-state{color:var(--warn)}',
    expect: ['light warn'], suite: 'contrast' },

  /* Reverts the [data-theme="dark"] block only, leaving the prefers-color-scheme block
     correct. Anchored with a newline and two spaces so it cannot match the four-space
     copy inside the media query. This is the drift a single-block edit would cause. */
  { name: 'dark unknown reverted in the [data-theme] block only',
    from: '\n  --strip-alert:#e14e2c; --strip-warn:#ea8a2e; --strip-ok:#4e9bb5; --strip-info:#2e92cc; --strip-unknown:#6a8497;',
    to:   '\n  --strip-alert:#e14e2c; --strip-warn:#ea8a2e; --strip-ok:#4e9bb5; --strip-info:#2e92cc; --strip-unknown:#5f7788;',
    expect: ['--strip-unknown matches in both dark blocks'], suite: 'contrast' },

  /* The ratios are computed from tokens, so the ways a rendered colour could differ from the
     measured one are themselves asserted. These prove those assertions bite. */
  { name: 'strip made translucent over the body background',
    from: '.nws-strip{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 14px;padding:10px 16px;border-bottom:1px solid var(--rule);background:var(--card)}',
    to:   '.nws-strip{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 14px;padding:10px 16px;border-bottom:1px solid var(--rule);background:var(--card);opacity:.8}',
    expect: ['does not make itself translucent'], suite: 'contrast' },

  { name: 'a later !important rule overrides strip text',
    from: '.nws-strip.is-unknown .strip-state{color:var(--strip-unknown)}',
    to:   '.nws-strip.is-unknown .strip-state{color:var(--strip-unknown)}\n.strip-state{color:var(--unknown)!important}',
    expect: ['no !important colour rule exists anywhere'], suite: 'contrast' },

  /* Passing contrast by flattening every severity to one colour must not be a way through. */
  { name: 'severity flattened to a single accessible colour',
    from: '  --strip-alert:#cc3110; --strip-warn:#b05f12; --strip-ok:#3b7d94; --strip-info:#1b7bb5; --strip-unknown:#637886;',
    to:   '  --strip-alert:#0a0507; --strip-warn:#0a0507; --strip-ok:#0a0507; --strip-info:#0a0507; --strip-unknown:#0a0507;',
    expect: ['light: five states, five distinct colours'], suite: 'contrast' },

  /* ---- Q007/Q008 stage 1: the observation clock ---- */

  /* The trap that actually bit during implementation. .map(sourceState) hands the array index
     to the injected-clock parameter, so index 0 asks for staleness as of the Unix epoch and
     every source reads current — the pill silently stops reporting DEGRADED. */
  { name: 'sourceState passed bare to .map, so the index becomes its clock',
    from: '  const states = Object.keys(S.sourceHealth).map(k => sourceState(k));',
    to:   '  const states = Object.keys(S.sourceHealth).map(sourceState);',
    expect: ['pill reads DEGRADED'], suite: 'dom' },

  /* A successful fetch must not make an old observation look current. Widening the weather
     window past the observed Nolo lag is exactly the "fix" the contract warns against. */
  { name: 'weather observation window widened past the Nolo case',
    from: '  nwsWeather: { currentMs: 75 * MIN, retainMs: 180 * MIN },',
    to:   '  nwsWeather: { currentMs: 95 * MIN, retainMs: 180 * MIN },',
    expect: ['76 minutes is stale', '77 minutes is stale'], suite: 'health' },

  /* Retention past which a fresh response may not revive a reading. */
  { name: 'weather retention removed, so nothing is ever withdrawn',
    from: '  nwsWeather: { currentMs: 75 * MIN, retainMs: 180 * MIN },',
    to:   '  nwsWeather: { currentMs: 75 * MIN, retainMs: 1800 * MIN },',
    expect: ['181 minutes is expired'], suite: 'health' },

  /* NOAA lst_ldt is HST. Treating it as UTC shifts every tide observation by ten hours. */
  { name: 'NOAA lst_ldt treated as UTC instead of HST',
    from: 'const HST_OFFSET_MS = 10 * HOUR;',
    to:   'const HST_OFFSET_MS = 0 * HOUR;',
    expect: ['normalizes lst_ldt as UTC-10'], suite: 'health' },

  /* A malformed future timestamp must not read as permanently current. */
  { name: 'future-skew guard dropped',
    from: "  if (signed < -OBS_SKEW_MS) return 'unusable';",
    to:   "  if (false) return 'unusable';",
    expect: ['6 minutes into the future is unusable'], suite: 'health' },

  /* Boundary direction: greater-than crosses, equality stays younger. */
  { name: 'observation boundary uses >= so equality crosses early',
    from: '  if (age > lim.currentMs) return \'stale\';',
    to:   '  if (age >= lim.currentMs) return \'stale\';',
    expect: ['75 minutes is current'], suite: 'health' },

  /* The measurement clock must travel with the reading it describes. */
  { name: 'sourceOk drops the observation clock',
    from: "      observedAt: at,",
    to:   "      observedAt: null,",
    expect: ['observedAt stored on the cache entry'], suite: 'health' },

  /* An expired measurement outranks a merely stale fetch, or a reconnect revives dead data. */
  { name: 'network state allowed to outrank an expired measurement',
    from: "  if (obs === 'expired') return 'observation-expired';",
    to:   "  if (false) return 'observation-expired';",
    expect: ['fetch current + past retention -> observation-expired'], suite: 'health' },

  /* ---- Review findings on stage 1 ---- */

  /* The island guard: without it the previous island's observation decides the newly selected
     island's state, which is the false attribution the request-scope guard exists to prevent. */
  { name: 'observation cache read without the island guard',
    from: "  if (ISLAND_SCOPED[key] && e.island !== S.island) return null;\n  return e;\n}",
    to:   "  return e;\n}",
    expect: ["another island's entry is not read"], suite: 'health' },

  /* An outstanding first request must not present an older reading as verified for a new
     selection. */
  { name: 'loading no longer outranks an existing reading',
    from: "  if (fetchState === 'loading') return 'checking';\n  const obs = observationState(key, entry.observedAt, now);",
    to:   "  const obs = observationState(key, entry.observedAt, now);",
    expect: ['an outstanding first request reports checking, not the older reading'], suite: 'health' },

  /* A missing or unconvertible value must not ride a good timestamp to 'current'. */
  { name: 'value usability ignored by the combined state',
    from: "  if (valueUsable === false) return 'value-unusable';",
    to:   "  if (false) return 'value-unusable';",
    expect: ['an unusable value outranks good clocks'], suite: 'health' },

  /* Unzoned ISO is parsed as LOCAL time by Date.parse, so dropping the shape check silently
     shifts every NWS observation by the reader's UTC offset. */
  { name: 'ISO timestamps accepted without an explicit zone',
    from: "(Z|[+-]\\d{2}:?\\d{2})$/;",
    to:   "(Z|[+-]\\d{2}:?\\d{2})?$/;",
    expect: ['rejects an unzoned ISO date-time'], suite: 'health' },

  /* T11: the measurement clock must never move backwards. */
  { name: 'older observation allowed to replace a newer cached one',
    from: "    if (prev && prev.island === island && prev.observedAt != null && at != null && at < prev.observedAt) {",
    to:   "    if (false) {",
    expect: ['an older observation does not replace it'], suite: 'health' },

  /* ---- Second review round ---- */

  /* The cache guard is only half of T11. These two put the refused reading back on screen, which
     is what the code did before: cache and card disagreed until some later render corrected it. */
  { name: 'fetchWeather renders the response instead of the accepted reading',
    from: "    if (kept) renderWeatherCard();",
    to:   "    renderWeather(data.properties, stationLabel(sta));",
    expect: ['the older observation does not reach the card'], suite: 'dom' },

  { name: 'fetchTides renders the response instead of the accepted reading',
    from: "    if (kept) renderTideCard();",
    to:   "    renderTide(ft, tideLabel(sta));",
    expect: ['the older tide observation does not reach the card'], suite: 'dom' },

  /* If sourceOk stops reporting what it kept, the callers have nothing truthful to render. */
  { name: 'sourceOk stops reporting the kept entry when it refuses one',
    from: "      return prev;",
    to:   "      return null;",
    expect: ['returns the KEPT entry when it refuses an older observation'], suite: 'health' },

  /* Date.parse rolls an impossible day forward rather than refusing it, so without this check
     2026-02-30 silently becomes March 2 — an impossible timestamp made plausible. */
  { name: 'impossible calendar dates accepted and rolled forward',
    from: "  if (!isRealCalendarDate(y, mo, d)) return null;\n  const ms = Date.parse(raw.trim());",
    to:   "  const ms = Date.parse(raw.trim());",
    expect: ['ISO: Feb 30 is rejected, not rolled to Mar 2'], suite: 'health' },

  /* The same rollover through the NOAA path. */
  { name: 'NOAA component ranges no longer checked',
    from: "  if (mo < 1 || mo > 12 || d < 1 || h > 23 || mi > 59 || se > 59) return null;\n  if (!isRealCalendarDate(y, mo, d)) return null;\n  const wall = Date.UTC(y, mo - 1, d, h, mi, se);",
    to:   "  const wall = Date.UTC(y, mo - 1, d, h, mi, se);",
    expect: ['NOAA: second 60 is rejected'], suite: 'health' },

  /* A validator that rejects the real leap day would be worse than none, so prove the assertion
     protecting it can fail too. */
  { name: 'calendar validation made too strict, rejecting real leap days',
    from: "  const back = new Date(Date.UTC(y, mo - 1, d));\n  return back.getUTCFullYear() === y && back.getUTCMonth() === mo - 1 && back.getUTCDate() === d;",
    to:   "  return mo === 2 ? d <= 28 : true;",
    expect: ['isRealCalendarDate: 2024-02-29 does'], suite: 'health' },

  /* ---- G1 abuse and cost bounding. Subject is api/news.js, so each case sets target: 'api'. ---- */

  /* The whole point of G1: surplus input must not reach fan-out. Removing the canonical check
     lets any query string through to five upstream fetches, restoring the unbounded vector. */
  { name: 'non-canonical input allowed to reach upstream fan-out',
    from: "  if (String(req.url || '').indexOf('?') !== -1) {",
    to:   "  if (false) {",
    expect: ['refused ?zzz=1 with 400', 'and attempted no upstream request'],
    suite: 'news', target: 'api' },

  /* A refusal that is cacheable re-creates the unbounded key space it exists to close. */
  { name: 'refusals made cacheable',
    from: "    res.setHeader('Cache-Control', 'no-store');\n    res.status(400).json({ error: 'this endpoint takes no query parameters' });",
    to:   "    res.status(400).json({ error: 'this endpoint takes no query parameters' });",
    expect: ['and is not cacheable'], suite: 'news', target: 'api' },

  /* Caller-selected item counts were part of the original unbounded key space. */
  /* The previous version of this case mutated the limit source, which the canonical-request
     guard already makes unobservable -- it reported MISSED, correctly. The cap VALUE is the
     behaviour worth trusting, and the bulk fixture overflows it. */
  { name: 'the 30-item cap widened',
    from: "  const limit = 30;",
    to:   "  const limit = 100;",
    expect: ['all-headlines caps at exactly 30 of the 60 available'], suite: 'news', target: 'api' },

  /* Without the method guard, a POST does five upstream fetches. */
  { name: 'method guard removed',
    from: "  if (req.method !== 'GET') {",
    to:   "  if (false) {",
    expect: ['POST is refused 405'], suite: 'news', target: 'api' },

  /* The Allow header is what makes a 405 actionable rather than a wall. */
  { name: 'Allow header dropped from 405',
    from: "    res.setHeader('Allow', 'GET, OPTIONS');",
    to:   "    res.setHeader('X-Nothing', 'GET, OPTIONS');",
    expect: ['with an Allow header'], suite: 'news', target: 'api' },

  /* Representation selection: the hazard path must filter, and must filter the whole pool. */
  { name: 'hazard selection bypassed, so both paths return all headlines',
    from: "  if (hazardOnly) items = items.filter(it => it.hazard);",
    to:   "  if (false) items = items.filter(it => it.hazard);",
    expect: ['hazard returns only hazard items', 'no non-hazard item leaks into the hazard representation'],
    suite: 'news', target: 'api' },

  /* Filtering AFTER the cap would silently drop qualifying items that fell outside the mixed
     cap -- the reason the two representations are not redundant. */
  { name: 'hazard filtered after the cap instead of over the whole pool',
    from: "  if (hazardOnly) items = items.filter(it => it.hazard);\n  items.sort((a, b) => b.ts - a.ts);\n  items = items.slice(0, limit)",
    to:   "  items.sort((a, b) => b.ts - a.ts);\n  items = items.slice(0, limit);\n  if (hazardOnly) items = items.filter(it => it.hazard);\n  items = items.slice(0, limit)",
    expect: ['hazard still finds all 30 of its items despite them being outside the newest 30'],
    suite: 'news', target: 'api' },

  /* Partial-feed honesty: one failing outlet must not fail the whole response. The previous
     version of this case replaced allSettled with a construction that THREW, and a crash prints
     no FAIL line, so the harness recorded MISSED. Mutating the failure threshold instead is
     observable: one failure becomes a 502. */
  { name: 'a single failing feed made fatal',
    from: "  if (!items.length && errors.length === FEEDS.length) {",
    to:   "  if (errors.length > 0) {",
    expect: ['and the response is still 200', 'one failure does not become a 502'],
    suite: 'news', target: 'api' },

  /* Star-Advertiser 403s a bare UA. Trimming it silently removes one outlet. */
  { name: 'browser user agent trimmed to a bare Mozilla/5.0',
    from: "const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';",
    to:   "const UA = 'Mozilla/5.0';",
    expect: ['every upstream request carries the complete browser UA'], suite: 'news', target: 'api' },

  /* The origin cache policy is what makes one miss serve everyone for five minutes. */
  { name: 'origin edge caching weakened',
    from: "  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');",
    to:   "  res.setHeader('Cache-Control', 'public');",
    expect: ['origin declares 300s fresh and 900s stale-while-revalidate'],
    suite: 'news', target: 'api' },

  /* ---- Hazard classifier, H01-H18 ---- */

  /* H03: the locality gate is the half that makes this a LOCAL hazard feed rather than a keyword
     search. Removing it restores the predecessor's behaviour on the two mainland stories. */
  { name: 'the locality gate removed',
    from: "  return hasHazardEvidence(evidenceText) && hasHawaiiAnchor(norm);",
    to:   "  return hasHazardEvidence(evidenceText);",
    expect: ['false: California wildfire forces thousands to evacuate.'],
    suite: 'news', target: 'api' },

  /* The converse: evidence alone must not be droppable either, or every local story qualifies. */
  { name: 'the hazard-evidence gate removed',
    from: "  return hasHazardEvidence(evidenceText) && hasHawaiiAnchor(norm);",
    to:   "  return hasHawaiiAnchor(norm);",
    expect: ['false: Honolulu DMV closed for holiday.'],
    suite: 'news', target: 'api' },

  /* H02: whole-token matching is what stops "vog" matching inside "vogue". Loosening it to bare
     containment is precisely the predecessor's defect. */
  { name: 'word boundaries loosened to substring containment',
    from: "  return (' ' + norm + ' ').indexOf(' ' + phrase + ' ') !== -1;",
    to:   "  return norm.indexOf(phrase) !== -1;",
    expect: ['vog does not match inside vogue'],
    suite: 'news', target: 'api' },

  /* H05, one per context-dependent family: each must require its context, not just its term. */
  { name: 'erupt qualifies without volcanic context',
    from: "    context: ['volcano', 'volcanic', 'volcanoes', 'lava', 'kilauea', 'mauna loa', 'hvo',",
    to:   "    context: ['argument', 'volcano', 'volcanic', 'volcanoes', 'lava', 'kilauea', 'mauna loa', 'hvo',",
    expect: ['erupt WITHOUT volcanic context'],
    suite: 'news', target: 'api' },

  { name: 'swell qualifies without ocean context',
    from: "            ['ocean', 'surf', 'shore', 'shores', 'waves', 'coastal', 'sea', 'beaches']] },",
    to:   "            ['ocean', 'surf', 'shore', 'shores', 'waves', 'coastal', 'sea', 'beaches', 'record']] },",
    expect: ['swell needs a qualifier AND ocean context, not either'],
    suite: 'news', target: 'api' },

  { name: 'emergency qualifies without declaration context',
    from: "    context: ['declaration', 'declared', 'proclamation', 'disaster', 'evacuation', 'evacuate',",
    to:   "    context: ['services', 'declaration', 'declared', 'proclamation', 'disaster', 'evacuation', 'evacuate',",
    expect: ['emergency WITHOUT declaration context'],
    suite: 'news', target: 'api' },

  { name: 'warning qualifies without a named hazard',
    from: "    context: ['hurricane', 'tropical storm', 'tsunami', 'flood', 'flooding', 'flash flood',",
    to:   "    context: ['economic', 'hurricane', 'tropical storm', 'tsunami', 'flood', 'flooding', 'flash flood',",
    expect: ['warning WITHOUT a named hazard'],
    suite: 'news', target: 'api' },

  { name: 'shelter qualifies without emergency context',
    from: "    context: ['evacuation', 'evacuate', 'evacuee', 'evacuees', 'disaster',",
    to:   "    context: ['animal', 'evacuation', 'evacuate', 'evacuee', 'evacuees', 'disaster',",
    expect: ['shelter WITHOUT emergency context'],
    suite: 'news', target: 'api' },

  { name: 'outage qualifies without utility context',
    from: "  { terms: ['outage', 'outages'],\n    context: ['power', 'electric', 'electrical', 'utility', 'water', 'communications',\n              'cellular', 'cell', 'phone', 'internet', 'grid'] },",
    to:   "  { terms: ['outage', 'outages'],\n    context: ['service', 'at', 'a', 'power'] },",
    expect: ['outage WITHOUT utility context'],
    suite: 'news', target: 'api' },

  /* The idiom strip is what separates "a flood of donations" from a flood. */
  { name: 'idiom stripping removed',
    from: "  for (const idiom of HAZARD_IDIOMS) {",
    to:   "  for (const idiom of []) {",
    expect: ['political storm with damage context is still a metaphor'],
    suite: 'news', target: 'api' },

  /* "closed" must never be independent evidence. Adding it back to the direct list is the
     single-word change that would resurrect the DMV false positive. */
  { name: 'closed restored as direct hazard evidence',
    from: "const HAZARD_DIRECT = [\n  'hurricane',",
    to:   "const HAZARD_DIRECT = [\n  'closed', 'closure',\n  'hurricane',",
    expect: ['false: Honolulu DMV closed for holiday.'],
    suite: 'news', target: 'api' },

  /* H04: the vocabulary gap that the Olowalu evacuation exposed. Removing those anchors deletes
     a real evacuation order, which is the failure this whole contract exists to prevent. */
  { name: 'the Olowalu-era anchors dropped from the vocabulary',
    from: "  'olowalu', \"honoapi'ilani\", 'honoapiilani', 'kihei', 'waiawa', 'waimanalo', 'kailua',",
    to:   "",
    expect: ['true:  Evacuation order issued for Olowalu Village due t'],
    suite: 'news', target: 'api' },

  /* Found by the real capture, not the authored corpus: a possessive produced the token
     "o'ahu's", which the anchor "o'ahu" could not match. */
  { name: 'possessive suffixes break anchors again',
    from: "    .map(t => t.replace(/'s$/, ''))",
    to:   "    .map(t => t)",
    expect: ['a possessive does not break an anchor'],
    suite: 'news', target: 'api' },

  /* "Hawaiian" is not a spelling variant of "Hawaii" to a whole-token matcher. Dropping it
     deleted a hurricane-outage story from the capture. */
  { name: 'the Hawaiian anchors dropped',
    from: "  'hawaiian islands', 'hawaiian electric',",
    to:   "",
    expect: ['"the Hawaiian Islands" anchors'],
    suite: 'news', target: 'api' },

  /* Finding 2: the macron fold. Without it the punctuation pass eats the whole letter. */
  { name: 'macron folding removed',
    from: "    .replace(/[\\u0300-\\u036f]/g, '')",
    to:   "",
    expect: ['K\u012Bhei with a macron anchors'],
    suite: 'news', target: 'api' },

  /* Finding 1: each half of the compound conjunction, and the two tightened rows. */
  { name: 'compound context collapses back to a single list',
    from: "    if (g.allOf) { if (g.allOf.every(group => hasAny(norm, group))) return true; }",
    to:   "    if (g.allOf) { if (g.allOf.some(group => hasAny(norm, group))) return true; }",
    expect: ['swell needs a qualifier AND ocean context, not either'],
    suite: 'news', target: 'api' },

  { name: 'summit restored as volcanic context',
    from: "              'hawaiian volcano observatory', 'caldera', 'fissure', 'magma'] },",
    to:   "              'hawaiian volcano observatory', 'caldera', 'fissure', 'magma', 'summit'] },",
    expect: ['erupt is not volcanic because a summit is mentioned'],
    suite: 'news', target: 'api' },

  { name: 'shelter restored as emergency context',
    from: "    context: ['declaration', 'declared', 'proclamation', 'disaster', 'evacuation', 'evacuate',\n              'evacuee', 'evacuees', 'hiema', 'civil defense'] },",
    to:   "    context: ['declaration', 'declared', 'proclamation', 'disaster', 'evacuation', 'evacuate',\n              'evacuee', 'evacuees', 'hiema', 'civil defense', 'shelter'] },",
    expect: ['an EMS story and an animal shelter do not vouch for each other'],
    suite: 'news', target: 'api' },

  /* Finding 3: bare hawaiian travels to a mainland resort. */
  { name: 'bare hawaiian restored as an anchor',
    from: "  'hawaiian islands', 'hawaiian electric',",
    to:   "  'hawaiian', 'hawaiian islands', 'hawaiian electric',",
    expect: ['a Hawaiian-themed mainland resort does not anchor'],
    suite: 'news', target: 'api' },

  /* Finding 4: the encoded anchor must survive the real path. */
  { name: 'entity decoding dropped from the feed path',
    from: "  out = decodeEntities(out);",
    to:   "",
    expect: ['and the decoded anchor reached the classifier'],
    suite: 'news', target: 'api' },

  /* H01: one producer. Bypassing the helper at the call site is the divergence to catch. */
  { name: 'the call site bypasses the classifier',
    from: "      hazard: classifyHazard(title, summary)",
    to:   "      hazard: /flood|hurricane|storm/i.test(title + ' ' + summary)",
    expect: ['the hazard items are exactly the ones a reader would pick'],
    suite: 'news', target: 'api' },

  /* ---- Q007/Q008 Stage 3 / T12: the earthquake card ---- */

  /* The defect T12 names first: a missing magnitude is the PRIMARY metric missing, so the dot
     cannot stay verified however healthy the query was. */
  { name: 'a missing magnitude earns a verified dot again',
    from: "  if (dot) dot.className = (queryVerified && magUsable) ? 's-dot ok' : 's-dot unknown';",
    to:   "  if (dot) dot.className = queryVerified ? 's-dot ok' : 's-dot unknown';",
    expect: ['and the dot is NOT verified'], suite: 'dom' },

  /* The asymmetry guard, in the opposite direction from every other card in the app: treating an
     event's age as freshness would unverify a correct answer to a query that just succeeded. */
  { name: 'event age treated as query freshness',
    from: "  if (dot) dot.className = (queryVerified && magUsable) ? 's-dot ok' : 's-dot unknown';",
    to:   "  if (dot) dot.className = (queryVerified && magUsable && (Date.now() - p.time) < 75 * MIN) ? 's-dot ok' : 's-dot unknown';",
    expect: ['a 20-day-old event still carries a verified dot'], suite: 'dom' },

  /* An unplaceable time rendered as a number is the whole reason this helper exists. */
  { name: 'unusable event times accepted again',
    from: "  if (typeof ms !== 'number' || !isFinite(ms)) return null;",
    to:   "  if (false) return null;",
    expect: ['undefined event time is not verified'], suite: 'dom' },

  /* The deceptive case: a future event rendered as "just now" is the fetch clock wearing the
     event's clothes. */
  { name: 'future event times accepted again',
    from: "  if (ms - base > OBS_SKEW_MS) return null;",
    to:   "",
    expect: ['a future event time is not verified'], suite: 'dom' },

  /* A successful empty query is information, not an absence of it. */
  { name: 'an empty query treated as unverified',
    from: "    if (dot) dot.className = observationDot(state);",
    to:   "    if (dot) dot.className = 's-dot unknown';",
    expect: ['an empty result is verified, not treated as missing data'], suite: 'dom' },

  /* ---- News publication time, N14 -------------------------------------------------------

     The shape check and the round-trip check are mutated SEPARATELY and on purpose. During the
     #35 contract review the fixtures first proposed for the shape mutation distinguished
     nothing, because round-trip equality rejects the offset and loose-date forms by itself; a
     probe showing 'rejected by shape' only revealed which check ran FIRST and short-circuited.
     Evaluation order is not load-bearingness. A fixture proving one check load-bearing has to
     survive every other check and fail only that one. */
  { name: 'the News publication-time validator bypassed entirely',
    from: "      const pubMs = newsPublishedAt(it.published);\n      const when = pubMs === null ? '' : timeAgo(pubMs);",
    to:   "      const when = it.published ? timeAgo(Date.parse(it.published)) : '';",
    expect: ['N04/N08 a malformed value shows no age AND no dangling separator',
             'N04 no NaNd ago anywhere in the feed',
             'N06 a materially future item shows no age, and keeps its HAZARD tag',
             'N06 nothing claims to be just now'],
    suite: 'dom' },

  /* Only the four-digit-year shape test is removed. Round-trip equality still rejects offsets,
     loose dates and rolled calendar values, so the ONLY witness is a past expanded year, which
     round-trips exactly and sits before the clock so the future guard cannot mask it. */
  { name: 'only the canonical-shape check removed',
    from: "  if (typeof raw !== 'string' || !NEWS_PUB_ISO_RE.test(raw)) return null;",
    to:   "  if (typeof raw !== 'string') return null;",
    expect: ['past expanded year rejected'],
    suite: 'health' },

  /* Only round-trip equality is removed. The shape test still rejects offsets and loose dates,
     so the witnesses must be values that MATCH the canonical shape yet mean something else: an
     impossible calendar day and an ISO-legal 24:00 that rolls into the next day. */
  { name: 'only the round-trip equality check removed',
    from: "  if (new Date(ms).toISOString() !== raw) return null;",
    to:   "  if (false) return null;",
    expect: ['impossible day rejected', 'ISO-legal 24:00 rejected'],
    suite: 'health' },

  /* The finite check must stay ahead of the round-trip comparison: an impossible month matches
     the shape, parses to NaN, and new Date(NaN).toISOString() throws RangeError. */
  { name: 'the finite-parse check removed, so an impossible month throws',
    from: '  if (!isFinite(ms)) return null;',
    to:   '  if (false) return null;',
    expect: ['impossible month rejected and does not throw'],
    suite: 'health' },

  /* Exactly the allowance is INSIDE it. A > that became >= would move the boundary by one
     millisecond and no wall-clock test would notice. */
  { name: 'the skew boundary tightened from > to >=',
    from: '  if (ms - base > NEWS_PUB_SKEW_MS) return null;',
    to:   '  if (ms - base >= NEWS_PUB_SKEW_MS) return null;',
    expect: ['exactly now + the allowance is usable'],
    suite: 'health' },

  /* Each case runs ONE suite, so expectations never mix a pure label with a DOM label. The
     future guard therefore gets two cases: the boundary in the pure suite, the rendered
     consequence in the DOM suite. */
  { name: 'the future guard removed, so a future value becomes usable again',
    from: '  if (ms - base > NEWS_PUB_SKEW_MS) return null;',
    to:   '  if (false) return null;',
    expect: ['ninety minutes into the future is not'],
    suite: 'health' },

  { name: 'the future guard removed, so a future item dates itself just now again',
    from: '  if (ms - base > NEWS_PUB_SKEW_MS) return null;',
    to:   '  if (false) return null;',
    expect: ['N06 a materially future item shows no age, and keeps its HAZARD tag',
             'N06 nothing claims to be just now'],
    suite: 'dom' },

  /* News must not silently become an observation clock by borrowing a different allowance. 90
     minutes is still rejected at 45, so the VALUE assertion is the only witness here. */
  { name: 'the News allowance widened away from five minutes',
    from: 'const NEWS_PUB_SKEW_MS = 5 * 60 * 1000;',
    to:   'const NEWS_PUB_SKEW_MS = 45 * 60 * 1000;',
    expect: ['the allowance is exactly five minutes'],
    suite: 'health' },

  /* A validator that returned the age instead of null would reinstate the invented copy. */
  { name: 'the call site falls back to the raw parse when validation fails',
    from: "      const when = pubMs === null ? '' : timeAgo(pubMs);",
    to:   "      const when = pubMs === null ? timeAgo(Date.parse(it.published)) : timeAgo(pubMs);",
    expect: ['N04 no NaNd ago anywhere in the feed',
             'N04/N08 a malformed value shows no age AND no dangling separator'],
    suite: 'dom' },

  /* The Alerts list and the card are the same data and must not disagree about it. */
  { name: 'the Alerts list dates an unplaceable event again',
    from: "    const when = quakeEventAge(p.time, now);",
    to:   "    const when = timeAgo(p.time);",
    expect: ['the Alerts list refuses it too'], suite: 'dom' },

  /* Codex's finding: the dot and copy assertions passed while "M 4.0" was still on screen beside
     an unknown-time note. The presentation matrix requires the value WITHHELD, so the mutation
     that restores the leak has to be caught. */
  { name: 'an unusable event time leaks the magnitude again',
    from: "  if (age == null) {",
    to:   "  if (false) {",
    expect: ['and the magnitude is WITHHELD, not merely un-dotted'], suite: 'dom' },

  /* The card and the Alerts list are the same data; renderQuakes() says so. Re-rendering only the
     card let them disagree at exactly the boundaries that matter. */
  { name: 'the tick re-renders only the card, leaving the Alerts list behind',
    from: "  renderQuakes(entry.data, now);",
    to:   "  renderQuakeCard(entry.data, now);",
    expect: ['and the Alerts list, which it used to leave behind'], suite: 'dom' },

  { name: 'past retention the Alerts list is left showing expired events',
    from: "  if (state === 'unavailable') { renderQuakeSurfacesUnavailable(); return; }",
    to:   "  if (state === 'unavailable') { renderQuakeCardUnavailable(); return; }",
    expect: ['and the list is withdrawn with it'], suite: 'dom' },

  /* quakeEventAge implements OBS_SKEW_MS independently of observationState, so only an explicit
     boundary case can notice the comparison drifting. */
  { name: 'the skew boundary excludes exact equality',
    from: "  if (ms - base > OBS_SKEW_MS) return null;",
    to:   "  if (ms - base >= OBS_SKEW_MS) return null;",
    expect: ['exactly +5 minutes is INSIDE the allowance'], suite: 'dom' },

  /* ---- Q007/Q008 Stage 2: the observation clock reaching the cards ---- */

  /* The defect Stage 2 exists to remove: magnitude deciding a dot that means verification. */
  { name: 'wind magnitude thresholds restored on the dot',
    from: "      if (dotWind) dotWind.className = observationDot(windState);\n    } else if (gustMph != null) {",
    to:   "      if (dotWind) dotWind.className = 's-dot ' + (windMph>35?'alert':windMph>20?'warn':'ok');\n    } else if (gustMph != null) {",
    expect: ['40 mph reads verified, not escalated'], suite: 'dom' },

  { name: 'rain magnitude thresholds restored on the dot',
    from: "      if (dotRain) dotRain.className = observationDot(rainState);",
    to:   "      if (dotRain) dotRain.className = 's-dot ' + (parseFloat(rainIn)>0.5?'alert':parseFloat(rainIn)>0?'warn':'ok');",
    expect: ['25.4 mm reads verified'], suite: 'dom' },

  /* The dot must follow the COMBINED verdict. Reverting it to the fetch clock is the exact
     defect the contract was written about: a fresh fetch of an old measurement reading as
     verified. */
  { name: 'the dot reverts to the fetch clock',
    from: "function observationDot(state) { return 's-dot ' + (observationVerified(state) ? 'ok' : 'unknown'); }",
    to:   "function observationDot(state) { return 's-dot ' + (state === 'unavailable' ? 'unknown' : 'ok'); }",
    expect: ['past it the reading is visibly stale'], suite: 'dom' },

  { name: 'tide dot reverts to the fetch clock',
    from: "  const state = combinedObservationState('noaaTides', now, ft != null && isFinite(parseFloat(ft)));",
    to:   "  const state = sourceState('noaaTides', now) === 'current' ? 'current' : 'unavailable';",
    expect: ['past it the tide reading is stale'], suite: 'dom' },

  /* T05/T06 withdrawal: a reading past measurement retention is gone, not merely undotted. */
  { name: 'expired weather observations no longer withdrawn',
    from: "  if (state === 'observation-expired' || state === 'unavailable') { renderWeatherUnavailable(); return; }",
    to:   "  if (state === 'unavailable') { renderWeatherUnavailable(); return; }",
    expect: ['the value is gone, not merely dimmed'], suite: 'dom' },

  { name: 'expired tide observations no longer withdrawn',
    from: "  if (state === 'observation-expired' || state === 'unavailable') { renderTideUnavailable(); return; }",
    to:   "  if (state === 'unavailable') { renderTideUnavailable(); return; }",
    expect: ['past 60 minutes the tide reading is withdrawn'], suite: 'dom' },

  /* T09: without this the cards freeze at whatever the last fetch decided. */
  { name: 'the age tick stops re-rendering the cards',
    from: "  renderObservationCards();\n}\nfunction startAgeTick() {",
    to:   "}\nfunction startAgeTick() {",
    expect: ['the tick re-rendered the card from cache'], suite: 'dom' },

  /* T13: one shared verdict for both cards lets a missing field unverify a good reading, or
     worse, lets a good reading verify a missing one. */
  { name: 'the missing-value note stutters again',
    from: "  const named = state === 'value-unusable' ? '' : ' · ' + obsStateText(state);",
    to:   "  const named = ' · ' + obsStateText(state);",
    expect: ['and says it once, not twice'], suite: 'dom' },

  { name: 'navigation stops re-rendering the observation cards',
    from: "  if (typeof renderObservationCards === 'function') renderObservationCards();",
    to:   "",
    expect: ['navigating re-rendered the observation cards'], suite: 'dom' },

  { name: 'an in-flight island switch reads as unavailable again',
    from: "  if (!entry) return (fetchState === 'loading' || requestPending(key)) ? 'checking' : 'unavailable';",
    to:   "  if (!entry) return fetchState === 'loading' ? 'checking' : 'unavailable';",
    expect: ['a tick mid-switch does not overwrite it with unavailable'], suite: 'dom' },

  { name: 'a future observation renders a negative age again',
    from: "  const secs = Math.max(0, Math.round(((now == null ? Date.now() : now) - ts) / 1000));",
    to:   "  const secs = Math.round(((now == null ? Date.now() : now) - ts) / 1000);",
    expect: ['and renders no negative age'], suite: 'dom' },

  /* Codex's finding: the expired-observation mutation covered only half of the withdrawal. */
  { name: 'the fetch-retention withdrawal branch removed',
    from: "  if (state === 'observation-expired' || state === 'unavailable') { renderWeatherUnavailable(); return; }",
    to:   "  if (state === 'observation-expired') { renderWeatherUnavailable(); return; }",
    expect: ['fetch retention expired, measurement still young: withdrawn'], suite: 'dom' },

  { name: 'the source row dates an undatable reading again',
    from: "      const obsAge = !measured || st === 'observation-unusable' ? ''",
    to:   "      const obsAge = !measured ? ''",
    expect: ['and Source details offers no age for it either'], suite: 'dom' },

  /* Guards the assertion Codex caught: it must fail when the clock actually moves. */
  { name: 'a failed refresh moves the measurement clock',
    from: "  h.lastAttempt = Date.now();\n  h.pendingGeneration = null;   /* settled, unsuccessfully */",
    to:   "  h.lastAttempt = Date.now();\n  h.pendingGeneration = null;\n  if (S.cache[key]) S.cache[key].observedAt = Date.now();",
    expect: ['and the measurement clock is exactly where it was'], suite: 'dom' },

  { name: 'the source row vouches for data that is not there',
    from: "      const st = combinedObservationState(k, null, observationValueUsable(k));",
    to:   "      const st = combinedObservationState(k, null, true);",
    expect: ['a reading with every value missing does not report Current'], suite: 'dom' },

  /* T08: both ages, because one has repeatedly been mistaken for the other. */
  { name: 'the verification age dropped from the card copy',
    from: "  const verified = state === 'current' ? '' : ' · verified ' + verifiedAge(key, now);",
    to:   "  const verified = '';",
    expect: ['and the copy carries the verification age as well as the observation'], suite: 'dom' },

  /* Source details must separate the clocks; a single state is what hid the problem. */
  { name: 'Source details drops the observation age',
    from: "      const obsAge = !measured || st === 'observation-unusable' ? ''",
    to:   "      const obsAge = true ? '' : !measured ? ''",
    expect: ['and the observation age separately'], suite: 'dom' },

  /* G02: the client must emit only the two canonical URLs. Restoring the parameterized request
     puts a caller-selected limit back on the wire, which was part of the unbounded key space. */
  { name: 'parameterized client request restored',
    from: "    const path = S.newsFilter === 'hazard' ? '/api/news/hazard' : '/api/news';\n    const res = await fetch(path);",
    to:   "    const q = S.newsFilter === 'hazard' ? '?limit=30&hazard=1' : '?limit=30';\n    const res = await fetch('/api/news' + q);",
    expect: ['no request carries a query string', 'every request in the whole log is one of the two canonical paths'],
    suite: 'dom' },

  /* Codex's finding 1 in concrete form: a request to an unrelated endpoint. The old filtered
     assertions could not see this at all -- the filter dropped it before anything counted --
     which is why the section now asserts against the complete log. */
  { name: 'client issues an extra request to a third endpoint',
    from: "    const path = S.newsFilter === 'hazard' ? '/api/news/hazard' : '/api/news';\n    const res = await fetch(path);",
    to:   "    const path = S.newsFilter === 'hazard' ? '/api/news/hazard' : '/api/news';\n    await fetch('/api/headlines');\n    const res = await fetch(path);",
    expect: ['four toggles issued exactly four requests in total',
             'every request in the whole log is one of the two canonical paths',
             'the whole log contains exactly two distinct shapes'],
    suite: 'dom' },

  /* G08: the per-feed abort is what stops one hung outlet from holding a Function open. */
  { name: 'per-feed abort timeout lengthened',
    from: "  const timer = setTimeout(() => ctrl.abort(), 8000);",
    to:   "  const timer = setTimeout(() => ctrl.abort(), 30000);",
    expect: ['each feed arms a timer of exactly 8000 ms'], suite: 'news', target: 'api' },

  /* G08: and the timer must be cleared, or a completed request leaves one pending. */
  { name: 'abort timer never cleared',
    from: "  } finally {\n    clearTimeout(timer);\n  }",
    to:   "  } finally {\n  }",
    expect: ['and every timer was cleared afterwards'], suite: 'news', target: 'api' },

  /* A cacheable 405 occupies a cache entry of its own, which is the shape G1 closes. */
  { name: '405 made cacheable',
    from: "    res.setHeader('Allow', 'GET, OPTIONS');\n    res.setHeader('Cache-Control', 'no-store');",
    to:   "    res.setHeader('Allow', 'GET, OPTIONS');",
    expect: ['and is not cacheable'], suite: 'news', target: 'api' },

  /* Finding 3: a bare '?' is no longer an accepted shape. */
  { name: 'bare trailing ? allowed through again',
    from: "  if (String(req.url || '').indexOf('?') !== -1) {",
    to:   "  if (String(req.url || '').indexOf('?') !== -1 && String(req.url).indexOf('?') !== String(req.url).length - 1) {",
    expect: ['refused ? with 400'], suite: 'news', target: 'api' },

  /* The refusal is deliberately opaque. Echoing the offending input hands a caller a
     reflection surface on an endpoint reachable without authentication, and the suite has
     always asserted it does not — but nothing proved that assertion could fail, which is
     how a decorative test survives review. It is load-bearing as of this case. */
  { name: 'refusal echoes the offending input back to the caller',
    from: "    res.status(400).json({ error: 'this endpoint takes no query parameters' });",
    to:   "    res.status(400).json({ error: 'this endpoint takes no query parameters', url: req.url });",
    expect: ['the refusal does not echo the offending input'],
    suite: 'news', target: 'api' }
];

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-mutation-'));
let missed = 0;

mutations.forEach((m, i) => {
  const subject = SUBJECT[m.target || 'html'];
  const src = subject.src;                 /* shadows the page source for this case only */
  if (!src.includes(m.from)) {
    console.log('  ANCHOR LOST  ' + m.name + '\n               the code it mutates has moved; update this case');
    missed++;
    return;
  }
  /* String.replace rewrites the FIRST match. A case whose anchor appears more than once can
     silently mutate unrelated code, and then CAUGHT and MISSED both mean nothing — that
     happened here with a CSS anchor shared by .sec-head and .nws-strip. */
  if (src.indexOf(m.from) !== src.lastIndexOf(m.from)) {
    console.log('  AMBIGUOUS  ' + m.name + '\n             its anchor appears more than once; make it unique');
    missed++;
    return;
  }
  const file = path.join(dir, 'mutant' + i + subject.ext);
  fs.writeFileSync(file, src.replace(m.from, m.to));
  const suite = SUITES[m.suite || 'dom'];
  let out = '';
  try { out = execFileSync('node', [suite, file], { encoding: 'utf8' }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  fs.unlinkSync(file);

  const failed = out.split('\n').filter(l => l.trim().startsWith('FAIL')).map(l => l.trim());
  const caught = m.expect.filter(x => failed.some(l => l.includes(x)));
  if (caught.length === m.expect.length) {
    console.log('  CAUGHT  ' + m.name + '  [' + (m.suite || 'dom') + ']  (' + failed.length + ' assertion(s) failed)');
  } else {
    missed++;
    console.log('  MISSED  ' + m.name + '\n          nothing asserted this behaviour; ' + failed.length + ' unrelated failure(s)');
    failed.slice(0, 5).forEach(l => console.log('          > ' + l));
  }
});

fs.rmSync(dir, { recursive: true, force: true });
console.log('\n' + (mutations.length - missed) + ' of ' + mutations.length + ' mutations caught');
if (missed) { console.log('An undetected mutation means an assertion is decorative.'); process.exit(1); }
