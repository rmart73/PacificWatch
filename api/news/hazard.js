/* /api/news/hazard — the hazard-filtered representation.
 *
 * A thin entrypoint only. It adds no feed list, parser, user agent, timeout, deduplication or
 * response construction of its own: all of that is the shared serve() in ../news.js, which the
 * contract requires so the two representations cannot drift apart.
 *
 * Hazard filtering runs over the COMPLETE merged pool before the 30-item cap, which is why this
 * cannot be replaced by the browser filtering the capped all-headlines response — that would
 * silently drop qualifying items that fell outside the mixed cap.
 */
const { serve } = require('../news.js');

module.exports = (req, res) => serve(req, res, true);
