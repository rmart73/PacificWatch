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
    from: "      if (windNote) windNote.textContent = `Gust, sustained N/A \u00b7 ${label}${suffix}`;",
    to:   "      if (windNote) windNote.textContent = `${label}${suffix}`;",
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
    from: "    if (kept) renderWeather(kept.data.p, kept.data.label, false);",
    to:   "    renderWeather(data.properties, stationLabel(sta), false);",
    expect: ['the older observation does not reach the card'], suite: 'dom' },

  { name: 'fetchTides renders the response instead of the accepted reading',
    from: "    if (kept) renderTide(kept.data.ft, kept.data.name, false);",
    to:   "    renderTide(ft, tideLabel(sta), false);",
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
    from: "  if (qIndex !== -1 && qIndex !== String(req.url).length - 1) {",
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
