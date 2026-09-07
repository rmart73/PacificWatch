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
const SUITE = path.join(__dirname, 'dom-behavior.test.js');
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

  { name: 'strip becomes visible instead of staged',
    from: '<div class="nws-strip is-unknown" id="nws-strip" hidden>',
    to:   '<div class="nws-strip is-unknown" id="nws-strip">',
    expect: ['hidden by default so it cannot duplicate the banner'] },

  /* Breaks the page at section 1 rather than at the snapshot sections: with a current
     source reporting no data, every surface empties immediately. */
  { name: 'snapshot treats a current source as having no data',
    from: "  if (state === 'current') raw = entry ? entry.data : null;",
    to:   "  if (state === 'current') raw = usableCache('nwsAlerts');",
    expect: ['alerts rail shows the warning'] },

  { name: 'stale-with-all-expired reported as verified empty',
    from: "  if (!snap.total) snap.presentation = snap.stale ? 'stale-empty' : 'empty';",
    to:   "  if (!snap.total) snap.presentation = 'empty';",
    expect: ['7. all retained products expired'] }
];

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-mutation-'));
let missed = 0;

mutations.forEach((m, i) => {
  if (!src.includes(m.from)) {
    console.log('  ANCHOR LOST  ' + m.name + '\n               the code it mutates has moved; update this case');
    missed++;
    return;
  }
  const file = path.join(dir, 'mutant' + i + '.html');
  fs.writeFileSync(file, src.replace(m.from, m.to));
  let out = '';
  try { out = execFileSync('node', [SUITE, file], { encoding: 'utf8' }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  fs.unlinkSync(file);

  const failed = out.split('\n').filter(l => l.trim().startsWith('FAIL')).map(l => l.trim());
  const caught = m.expect.filter(x => failed.some(l => l.includes(x)));
  if (caught.length === m.expect.length) {
    console.log('  CAUGHT  ' + m.name + '  (' + failed.length + ' assertion(s) failed)');
  } else {
    missed++;
    console.log('  MISSED  ' + m.name + '\n          nothing asserted this behaviour; ' + failed.length + ' unrelated failure(s)');
    failed.slice(0, 5).forEach(l => console.log('          > ' + l));
  }
});

fs.rmSync(dir, { recursive: true, force: true });
console.log('\n' + (mutations.length - missed) + ' of ' + mutations.length + ' mutations caught');
if (missed) { console.log('An undetected mutation means an assertion is decorative.'); process.exit(1); }
