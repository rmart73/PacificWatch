/**
 * GET /api/news
 *
 * Hawaii news headlines, merged from local outlet RSS feeds.
 *
 * This exists because none of the outlet feeds send CORS headers, so index.html
 * cannot fetch them directly from the browser. This function does it server-side
 * and returns JSON with `Access-Control-Allow-Origin: *`.
 *
 * No dependencies — the RSS parsing is deliberately minimal regex extraction so
 * the project stays install-free.
 *
 * Query params:
 *   ?limit=30    max items returned (default 30, max 100)
 *   ?hazard=1    only items matching HAZARD_RE
 */

const FEEDS = [
  { id: 'hnn',  name: 'Hawaii News Now', url: 'https://www.hawaiinewsnow.com/arc/outboundfeeds/rss/?outputType=xml' },
  { id: 'cb',   name: 'Civil Beat',      url: 'https://www.civilbeat.org/feed/' },
  { id: 'sa',   name: 'Star-Advertiser', url: 'https://www.staradvertiser.com/feed/' },
  { id: 'khon', name: 'KHON2',           url: 'https://www.khon2.com/feed/' },
  { id: 'kitv', name: 'KITV 4',          url: 'https://www.kitv.com/search/?f=rss&t=article&c=news&l=50&s=start_time&sd=desc' }
];

/* Star-Advertiser 403s a bare "Mozilla/5.0", so send a realistic UA. */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

/* Outlet feeds carry national wire copy too; this flags the locally actionable ones. */
const HAZARD_RE = /hurricane|tropical storm|tsunami|flood|flash flood|storm|evacuat|wildfire|brush fire|earthquake|erupt|volcan|lava|vog|high surf|swell|shelter|power outage|outage|emergency|warning|advisory|watch|closure|closed|landslide|rockfall/i;

/* Entities are decoded BEFORE tags are stripped, and stripping repeats until
   stable. Decoding last would turn "&lt;img onerror=...&gt;" back into live
   markup after the strip had already run — which is exactly how encoded HTML
   in a feed title used to survive this function. */
function decode(s) {
  let out = String(s == null ? '' : s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  out = decodeEntities(out);
  let prev;
  do { prev = out; out = out.replace(/<[^>]*>/g, ''); } while (out !== prev);
  /* Any angle brackets left after stripping are literal text — neutralize them. */
  return out.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
}

function decodeEntities(s) {
  return s
    .replace(/&#8217;|&#x2019;/g, '’')
    .replace(/&#8216;|&#x2018;/g, '‘')
    .replace(/&#8220;/g, '“').replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)<\\/' + name + '>', 'i'));
  return m ? decode(m[1]) : '';
}

function parseFeed(xml, feed) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const b of blocks) {
    const title = tag(b, 'title');
    const link = tag(b, 'link') || (b.match(/<link[^>]*href="([^"]+)"/i) || [])[1] || '';
    if (!title || !link) continue;
    const pub = tag(b, 'pubDate') || tag(b, 'dc:date') || tag(b, 'published');
    const ts = pub ? Date.parse(pub) : NaN;
    const summary = tag(b, 'description').slice(0, 240);
    items.push({
      title,
      link,
      source: feed.name,
      sourceId: feed.id,
      summary,
      published: Number.isNaN(ts) ? null : new Date(ts).toISOString(),
      ts: Number.isNaN(ts) ? 0 : ts,
      hazard: HAZARD_RE.test(title + ' ' + summary)
    });
  }
  return items;
}

async function fetchFeed(feed) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(feed.url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml, */*' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return parseFeed(await res.text(), feed);
  } finally {
    clearTimeout(timer);
  }
}

/* THE SHARED IMPLEMENTATION.
   The representation is decided by WHICH FILE the platform routed to, not by anything in the
   request. There is no internal header and no query parameter carrying it, so there is nothing
   for a caller to forge — which is why this design needs no anti-forgery gate at all.

   Three earlier attempts to carry the representation through routing all failed on admissible
   evidence: a request.query `set`, a `dest` querystring, and a delete-then-set internal header.
   The cause in each case was that the query-delete transform removes every key, including the
   one routing had just supplied. */
async function serve(req, res, hazardOnly) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  /* Cache at the edge so the outlets aren't hit on every page load. */
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  /* Fixed by the representation, never by the caller. */
  const limit = 30;

  const settled = await Promise.allSettled(FEEDS.map(fetchFeed));

  let items = [];
  const errors = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') items = items.concat(r.value);
    else errors.push({ source: FEEDS[i].name, error: String(r.reason && r.reason.message || r.reason) });
  });

  /* Dedupe by link, then by identical title across outlets (wire copy). */
  const seenLink = new Set(), seenTitle = new Set();
  items = items.filter(it => {
    const t = it.title.toLowerCase();
    if (seenLink.has(it.link) || seenTitle.has(t)) return false;
    seenLink.add(it.link); seenTitle.add(t);
    return true;
  });

  if (hazardOnly) items = items.filter(it => it.hazard);
  items.sort((a, b) => b.ts - a.ts);
  items = items.slice(0, limit).map(({ ts, ...rest }) => rest);

  if (!items.length && errors.length === FEEDS.length) {
    res.status(502).json({ updated: new Date().toISOString(), items: [], errors });
    return;
  }

  res.status(200).json({
    updated: new Date().toISOString(),
    sources: FEEDS.map(f => ({ id: f.id, name: f.name })),
    count: items.length,
    items,
    errors
  });
}

/* Default entrypoint: /api/news — all headlines.
   The hazard entrypoint lives at api/news/hazard.js and calls the same serve(). */
module.exports = (req, res) => serve(req, res, false);
module.exports.serve = serve;
