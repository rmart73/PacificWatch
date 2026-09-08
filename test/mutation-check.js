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
  contrast: path.join(__dirname, 'contrast.test.js')
};
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/\r\n/g, '\n');

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
    from: '    renderWeather(data.properties, stationLabel(sta), false);',
    to:   '    renderWeather(data.properties, sta.label, false);',
    expect: ['statewide discloses it too'] },

  /* Both sides of a cached label have to carry the qualifier. Fixing the weather path and
     leaving the tide path was the actual defect, so each is mutated separately. */
  { name: 'the tide cache stores the unqualified station name',
    from: "    sourceOk('noaaTides', { ft: ft, name: tideLabel(sta) }, token);",
    to:   "    sourceOk('noaaTides', { ft: ft, name: sta.name }, token);",
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
    expect: ['light: five states, five distinct colours'], suite: 'contrast' }
];

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-mutation-'));
let missed = 0;

mutations.forEach((m, i) => {
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
  const file = path.join(dir, 'mutant' + i + '.html');
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
