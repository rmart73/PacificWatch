/* Contrast check for the NWS strip. Pure arithmetic on the tokens in index.html — no DOM,
   no dependencies, so it runs in `npm test`.

   Why: review of PR #16 found strip text at 12px failing WCAG AA — light watch 2.57:1,
   light unknown 2.54:1, dark unknown 3.90:1. Severity colours chosen for dots and badges
   do not automatically work as small text, and nothing in a DOM test notices.

   This asserts every strip text colour against --card in BOTH themes. It reads the real
   token values and the real CSS rules, so renaming a token or repointing a rule at a
   display colour fails here rather than in someone's eyes. */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\r\n/g, '\n');

/* --- WCAG 2.1 relative luminance and contrast ratio --- */
function channels(hex) {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  return [0, 2, 4].map(i => parseInt(full.substr(i, 2), 16));
}
function luminance(hex) {
  const v = channels(hex).map(x => x / 255)
    .map(x => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
function contrast(a, b) {
  const l1 = luminance(a), l2 = luminance(b);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/* --- read the token blocks out of the stylesheet --- */
function tokensAfter(marker, label) {
  const i = src.indexOf(marker);
  if (i < 0) throw new Error('could not find token block: ' + label);
  const block = src.slice(i + marker.length, src.indexOf('}', i));
  const out = {};
  for (const m of block.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})/g)) out[m[1]] = m[2].toLowerCase();
  if (!Object.keys(out).length) throw new Error('no tokens parsed from: ' + label);
  return out;
}
const light = tokensAfter(':root {', 'light :root');
const darkMedia = tokensAfter(':root:not([data-theme="light"]){', 'dark via prefers-color-scheme');
const darkForced = tokensAfter(':root[data-theme="dark"]{', 'dark via [data-theme]');

/* --- read which token each strip rule actually uses --- */
function ruleToken(selector) {
  const re = new RegExp(selector.replace(/[.[\]()]/g, '\\$&') + '\\{([^}]*)\\}');
  const m = src.match(re);
  if (!m) throw new Error('could not find CSS rule: ' + selector);
  const c = m[1].match(/(?:^|;)\s*color\s*:\s*var\(--([a-z0-9-]+)\)/);
  if (!c) throw new Error('rule sets no var() colour: ' + selector);
  return c[1];
}

let pass = 0, fail = 0;
function check(label, actual, expected) {
  if (actual === expected) { pass++; console.log('  PASS  ' + label); }
  else { fail++; console.log('  FAIL  ' + label + '  (got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected) + ')'); }
}
const AA = 4.5;
function meets(themeName, tokens, tokenName, label) {
  const fg = tokens[tokenName], bg = tokens['card'];
  if (!fg) { fail++; console.log('  FAIL  ' + label + ' — token --' + tokenName + ' is not defined in ' + themeName); return; }
  const r = contrast(fg, bg);
  const ok = r >= AA;
  if (ok) { pass++; console.log('  PASS  ' + label + '  ' + fg + ' on ' + bg + ' = ' + r.toFixed(2) + ':1'); }
  else { fail++; console.log('  FAIL  ' + label + '  ' + fg + ' on ' + bg + ' = ' + r.toFixed(2) + ':1, below ' + AA); }
}

console.log('The ratio maths agrees with the published WCAG examples:');
check('black on white is 21:1', Math.round(contrast('#000000', '#ffffff')), 21);
check('white on white is 1:1', Math.round(contrast('#ffffff', '#ffffff')), 1);
check('#767676 on white is the AA borderline', contrast('#767676', '#ffffff').toFixed(2), '4.54');

console.log('\nStrip state colours — each severity, both themes, against --card:');
const states = ['alert', 'warn', 'info', 'ok', 'unknown'];
states.forEach(st => {
  const token = ruleToken('.nws-strip.is-' + st + ' .strip-state');
  meets('light', light, token, 'light ' + st.padEnd(7) + ' (--' + token + ')');
  meets('dark', darkMedia, token, 'dark  ' + st.padEnd(7) + ' (--' + token + ')');
});

console.log('\nSupporting strip text — counts and freshness are the same size:');
[['.nws-strip .strip-counts', 'counts'], ['.nws-strip .strip-meta', 'meta']].forEach(pair => {
  const token = ruleToken(pair[0]);
  meets('light', light, token, 'light ' + pair[1].padEnd(7) + ' (--' + token + ')');
  meets('dark', darkMedia, token, 'dark  ' + pair[1].padEnd(7) + ' (--' + token + ')');
});

console.log('\nThe two dark blocks must not drift apart:');
/* An explicit [data-theme="dark"] choice and a system dark preference render the same page.
   If only one block is updated, one set of users silently keeps the failing colours. */
states.concat(['card']).forEach(st => {
  const token = st === 'card' ? 'card' : ruleToken('.nws-strip.is-' + st + ' .strip-state');
  check('--' + token + ' matches in both dark blocks', darkMedia[token], darkForced[token]);
});

console.log('\nSeverity stays distinguishable after the accessibility fix:');
/* Meeting 4.5:1 by flattening everything to near-black would pass the checks above and
   destroy the severity signal, so the distinct-hue requirement is asserted too. */
[['light', light], ['dark', darkMedia]].forEach(pair => {
  const seen = states.map(st => pair[1][ruleToken('.nws-strip.is-' + st + ' .strip-state')]);
  check(pair[0] + ': five states, five distinct colours', new Set(seen).size, 5);
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
