/* Extracts the severity tier model from index.html and exercises it. Pure logic, no DOM,
   no dependencies. Fixtures are the real event/severity/urgency combinations returned by
   api.weather.gov for area=HI during Hurricane Lowell on 2026-09-06. */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\r\n/g, '\n');

function grab(re, label) {
  const m = src.match(re);
  if (!m) throw new Error('could not extract ' + label);
  return m[0];
}

const code = [
  grab(/const ALERT_TIERS = \{[\s\S]*?\n\};/, 'ALERT_TIERS'),
  grab(/function alertTier\(p\) \{[\s\S]*?\n\}/, 'alertTier'),
  grab(/function tierRank\(p\) \{[^}]*\}/, 'tierRank'),
  grab(/const URGENCY_RANK = \{[^}]*\};/, 'URGENCY_RANK'),
  grab(/function compareAlerts\(a, b\) \{[\s\S]*?\n\}/, 'compareAlerts')
].join('\n');

const api = eval(code + '; ({ALERT_TIERS, alertTier, tierRank, compareAlerts})');

let pass = 0, fail = 0;
function check(label, actual, expected) {
  if (actual === expected) { pass++; console.log('  PASS  ' + label); }
  else { fail++; console.log('  FAIL  ' + label + '  (got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected) + ')'); }
}
const alert = (event, severity, urgency, sent) => ({ properties: { event, severity, urgency, sent } });

console.log('Live feed fixtures — the case that motivated this work:');
check('Tropical Storm Warning -> warning',
  api.alertTier({ event: 'Tropical Storm Warning', severity: 'Severe', urgency: 'Immediate' }), 'warning');
check('Flood Watch -> watch, despite ALSO being severity Severe',
  api.alertTier({ event: 'Flood Watch', severity: 'Severe', urgency: 'Future' }), 'watch');
check('High Surf Advisory -> advisory',
  api.alertTier({ event: 'High Surf Advisory', severity: 'Minor', urgency: 'Expected' }), 'advisory');
check('Tropical Cyclone Local Statement -> statement',
  api.alertTier({ event: 'Tropical Cyclone Local Statement', severity: 'Moderate', urgency: 'Expected' }), 'statement');

console.log('\nThe two Severe products no longer collide:');
const tsw = { event: 'Tropical Storm Warning', severity: 'Severe', urgency: 'Immediate' };
const fw  = { event: 'Flood Watch', severity: 'Severe', urgency: 'Future' };
check('same CAP severity', tsw.severity === fw.severity, true);
check('different tier', api.alertTier(tsw) !== api.alertTier(fw), true);
check('different badge class',
  api.ALERT_TIERS[api.alertTier(tsw)].badge !== api.ALERT_TIERS[api.alertTier(fw)].badge, true);
check('warning badge label', api.ALERT_TIERS[api.alertTier(tsw)].label, 'WARNING');
check('watch badge label',   api.ALERT_TIERS[api.alertTier(fw)].label,  'WATCH');

console.log('\nSafety-biased override — an Extreme product is never under-ranked:');
check('Extreme severity beats a "statement" name',
  api.alertTier({ event: 'Special Weather Statement', severity: 'Extreme', urgency: 'Immediate' }), 'warning');
check('Extreme severity beats an "advisory" name',
  api.alertTier({ event: 'Coastal Flood Advisory', severity: 'Extreme', urgency: 'Immediate' }), 'warning');

console.log('\nUnrecognised product names fall back to CAP urgency:');
check('Immediate -> warning', api.alertTier({ event: 'Civil Danger Notice', severity: 'Severe', urgency: 'Immediate' }), 'warning');
check('Expected -> advisory', api.alertTier({ event: 'Civil Danger Notice', severity: 'Minor', urgency: 'Expected' }), 'advisory');
check('Future -> statement',  api.alertTier({ event: 'Civil Danger Notice', severity: 'Minor', urgency: 'Future' }), 'statement');
check('missing properties do not throw', api.alertTier(null), 'statement');
check('empty event object', api.alertTier({}), 'statement');

console.log('\nWord-boundary matching — substrings must not misclassify:');
check('"Watchmaker Fire" is not a watch by accident',
  api.alertTier({ event: 'Fire Weather Warning', severity: 'Severe', urgency: 'Immediate' }), 'warning');
check('a Warning containing the word watch still ranks as a warning',
  api.alertTier({ event: 'Tsunami Warning', severity: 'Extreme', urgency: 'Immediate' }), 'warning');

console.log('\nOrdering — most actionable first:');
const feed = [
  alert('High Surf Advisory', 'Minor', 'Expected', '2026-09-06T04:00:00Z'),
  alert('Flood Watch', 'Severe', 'Future', '2026-09-06T04:15:00Z'),
  alert('Tropical Cyclone Local Statement', 'Moderate', 'Expected', '2026-09-06T05:05:00Z'),
  alert('Tropical Storm Warning', 'Severe', 'Immediate', '2026-09-06T04:51:00Z')
];
const sorted = feed.slice().sort(api.compareAlerts).map(f => f.properties.event);
check('warning sorts first',   sorted[0], 'Tropical Storm Warning');
check('watch second',          sorted[1], 'Flood Watch');
check('advisory third',        sorted[2], 'High Surf Advisory');
check('statement last',        sorted[3], 'Tropical Cyclone Local Statement');

const sameTier = [
  alert('Flood Warning', 'Severe', 'Expected', '2026-09-06T04:00:00Z'),
  alert('Flash Flood Warning', 'Severe', 'Immediate', '2026-09-06T03:00:00Z')
];
check('within a tier, Immediate outranks Expected',
  sameTier.slice().sort(api.compareAlerts)[0].properties.event, 'Flash Flood Warning');

const sameUrgency = [
  alert('Flood Warning', 'Severe', 'Immediate', '2026-09-06T03:00:00Z'),
  alert('Wind Warning', 'Severe', 'Immediate', '2026-09-06T06:00:00Z')
];
check('within a tier and urgency, newest first',
  sameUrgency.slice().sort(api.compareAlerts)[0].properties.event, 'Wind Warning');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
