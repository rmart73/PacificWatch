# PACIFIC WATCH — PHASE 1 ENGINEERING IMPLEMENTATION BRIEF

**Project:** Pacific Watch<br>
**Phase:** 1 — UI Improvements, Alert Navigation, and Map Defaults<br>
**Status:** Approved for implementation<br>
**Date:** October 9, 2026<br>
**Target environment:** Existing GitHub repository, Vercel deployment, web and mobile browsers

---

## 1. Objective

Implement five targeted improvements to the existing Pacific Watch application without compromising its established alert ingestion, source-health monitoring, freshness calculations, caching, or last-known-good retention behavior.

This is an incremental improvement phase, not an architectural rewrite.

Inspect the current repository before making modifications. Identify the actual components, data structures, route handlers, styles, and tests responsible for the affected functionality.

Preserve existing interfaces unless changes are required to meet acceptance criteria.

## 2. Product Decisions — Locked

The following decisions govern the broader roadmap.

| Capability | Decision |
|---|---|
| Product name | Retain Pacific Watch for now |
| Existing wave logo | Retain, but animate |
| Trusted source selection | Free feature in a future phase |
| User-submitted custom feeds | Premium feature in a future phase |
| AI features | Premium in a future phase |
| Device push notifications | Premium only |
| Saved locations and personalized alerts | Premium |
| User authentication | Future phase |
| Subscription and payment infrastructure | Future phase |

Do not implement authentication, subscriptions, payment processing, user-specific source ingestion, or location-based notifications in Phase 1.

Do not rename the product or change existing branding assets beyond the specifically requested animation.

## 3. Repository Inspection — Mandatory

Before editing code:

1. Inspect `index.html`, `api/news.js`, `vercel.json`, package configuration, and relevant modules if present.
2. Identify the current alert normalization and rendering pipeline.
3. Locate all code that constructs alert URLs.
4. Identify how navigation between Overview and Alerts works.
5. Identify the ticker's animation and refresh behavior.
6. Locate the Ventusky iframe or integration.
7. Find the SVG or markup for the existing Pacific Watch wave logo.
8. Review the source-health and last-known-good implementation.
9. Inspect the existing test suites and deployment configuration.

Treat the previously discussed filenames and test commands as starting points, not as guarantees of the current repository layout.

Provide a short implementation plan and file-impact list before modifying the application.

Do not perform broad refactoring of unrelated components.

---

# PW-101 — Fix Overview-to-Alerts Navigation

## Current issue

Selecting an alert on the Overview page may send users to a generic API endpoint, such as:

`https://api.weather.gov/alerts/`

This is not useful to a typical end user.

## Required behavior

When a user selects an alert from Overview, navigate to Pacific Watch's internal Alerts section.

The corresponding alert should be selected, visible, and preferably expanded.

Target flow:

Overview alert → Alerts section → Selected alert details → Official external source.

## Implementation requirements

- Introduce or reuse a stable canonical alert identifier.
- Preserve existing source-native IDs through normalization.
- Use a URL-safe representation of the identifier for internal navigation.
- Support direct links to individual alerts.
- Ensure alert deep links survive refresh and browser Back/Forward navigation.
- Avoid fragile matching based only on alert titles.
- Preserve the currently selected alert across normal data refreshes when it still exists.
- Scroll to the selected alert without obscuring it behind a fixed header.
- If the alert no longer exists or is no longer active, display a clear unavailable/expired state rather than selecting a different alert.

Use the application's current navigation model, whether routing, hash navigation, or tab-based navigation.

Do not introduce a new routing framework solely for this feature.

## Acceptance criteria

- AC-101-01: Selecting an Overview alert opens the Alerts section.
- AC-101-02: The correct alert is highlighted or expanded.
- AC-101-03: No Overview alert links directly to a generic API collection.
- AC-101-04: Multiple alerts with identical titles navigate to their correct individual records.
- AC-101-05: Internal navigation works on desktop and iOS Safari.
- AC-101-06: Browser Back and Forward operations behave correctly.
- AC-101-07: A refresh of a supported deep link restores the intended alert.
- AC-101-08: Missing or expired alerts produce an explicit, understandable message.

---

# PW-102 — Correct External Alert Source Links

## Current issue

Alert detail links may point to API endpoints or otherwise unsuitable destinations.

## Required behavior

When a user opens an alert in the Alerts section, provide a link to a human-readable, authoritative publication whenever one is available.

Do not assume every alert has a news article.

## Source link hierarchy

1. Verified official human-readable alert publication.
2. Verified source-specific public detail page.
3. Official source website or hazard-area page, clearly labeled as a general source rather than the exact alert.
4. If none is suitable, display the available alert details internally and omit the external detail link.

Never fabricate URLs.

## Data-model requirements

Review existing alert fields and retain backward compatibility.

Where practical, represent source references with distinct concepts:

- canonical alert ID
- source/provider ID
- machine-readable API URL
- human-readable source URL
- issuing agency
- alert headline
- severity
- affected area
- issued/effective/expires timestamps
- description
- recommended instructions
- source freshness/status

Do not overload a single `url` field with multiple meanings.

If a normalized alert's existing schema cannot support this cleanly, add an optional human-readable URL field and implement a compatibility adapter.

Do not break existing consumers of the alert payload.

## Security requirements

- Validate external URL protocols.
- Reject `javascript:`, `data:`, and similar unsafe destinations.
- Avoid constructing links from untrusted raw HTML.
- Do not automatically assume a data/API URL is browser-friendly.
- Open external sources using appropriate safe link attributes.
- Do not introduce open redirects.

## Acceptance criteria

- AC-102-01: Every rendered external detail link has an intentional destination.
- AC-102-02: Generic API collections are never displayed as human-readable alert detail links.
- AC-102-03: NWS alerts use a verified suitable destination when available.
- AC-102-04: Alerts from other agencies use provider-appropriate links.
- AC-102-05: Alerts without usable external URLs remain fully readable within Pacific Watch.
- AC-102-06: Missing, empty, malformed, or unsafe URLs do not create broken links.
- AC-102-07: External links cannot execute untrusted script URLs.
- AC-102-08: Source-health and freshness metadata remain unchanged by the presentation-layer modification.

---

# PW-103 — Improve Mobile Alerts Ticker

## Current issue

The scrolling alerts ticker moves at an acceptable speed on desktop, but appears substantially slower on iOS mobile devices.

## Required behavior

Maintain the current desktop scrolling experience.

Make the mobile ticker move faster while maintaining readability and smooth performance.

## Implementation strategy

Inspect the existing animation before changing its duration.

Determine whether the perceived speed difference comes from:

- fixed animation duration
- changing content width
- repeated or duplicated ticker content
- CSS transforms or viewport measurement
- responsive breakpoints
- font scaling
- animation resets during alert refresh
- WebKit-specific rendering behavior

Prefer normalized movement speed expressed in pixels per second rather than one fixed duration across all content lengths.

Suggested initial calibration:

- Desktop: preserve measured current behavior.
- Mobile: target approximately 25% faster movement than the existing perceived mobile speed.

Treat the 25% increase as an initial calibration target, not an unconditional CSS multiplier.

## Performance and accessibility

- Prefer GPU-friendly CSS transforms.
- Avoid continuous JavaScript frame loops unless necessary.
- Avoid unnecessary layout measurement.
- Recalculate duration when content width or container size changes.
- Prevent visible jumps during looping.
- Do not repeatedly restart scrolling when alert data has not meaningfully changed.
- Ensure the animation does not consume excessive CPU on mobile.
- Respect `prefers-reduced-motion`.
- For reduced-motion users, provide a non-scrolling readable alternative.
- Ensure ticker information remains accessible to screen readers.
- Do not use intrusive live-region announcements for every animation cycle.

## Acceptance criteria

- AC-103-01: Desktop scrolling speed remains within approximately 5% of its measured baseline.
- AC-103-02: Mobile scrolling is measurably faster than the original mobile baseline.
- AC-103-03: The ticker remains smooth on iOS Safari.
- AC-103-04: Animation duration adapts appropriately to content length.
- AC-103-05: No significant pauses, clipping, or blank gaps occur during looping.
- AC-103-06: Data refreshes do not unnecessarily reset the animation.
- AC-103-07: Reduced-motion users have access to stationary, readable content.
- AC-103-08: Alert text and click targets remain usable on mobile.

---

# PW-104 — Change Ventusky Default to Precipitation

## Current issue

The Ventusky map currently defaults to Radar.

## Required behavior

Change the initial weather layer to Precipitation.

Continue allowing users to select other available weather layers through the supported Ventusky interface.

## Implementation requirements

- Inspect the existing iframe and its query parameters.
- Verify the official Ventusky embed API and supported layer parameter.
- Configure precipitation as the initial layer.
- Preserve the existing Pacific-focused map position and zoom unless adjustment is necessary.
- Preserve iframe dimensions and mobile responsiveness.
- Preserve any existing map controls.
- Do not alter unrelated map integrations.
- Do not introduce a new paid mapping service.
- Do not add a separate map configuration backend for this change.
- Avoid reloading the iframe when unrelated page state changes.

Where the supported embed uses `l=rain-3h`, validate that this corresponds to the intended precipitation presentation.

Satellite should remain an exploratory enhancement if the current embed supports it, not a dependency for Phase 1 completion.

## Acceptance criteria

- AC-104-01: A fresh load defaults to precipitation.
- AC-104-02: Existing map position and zoom are preserved.
- AC-104-03: Other map layers remain available where supported.
- AC-104-04: Map remains responsive on mobile.
- AC-104-05: No unnecessary iframe reload occurs during unrelated UI updates.
- AC-104-06: The application handles an unavailable third-party iframe gracefully.
- AC-104-07: No additional API key or paid mapping dependency is introduced.

---

# PW-105 — Animate the Existing Wave Logo

## Current issue

The existing Pacific Watch icon consists of three wave-shaped horizontal lines:

- Top: lighter line
- Middle: solid white line
- Bottom: lighter line

It is currently static.

## Required behavior

Animate the lines subtly to simulate the continuous movement of ocean waves.

Retain the existing appearance and overall identity.

## Animation requirements

- Preserve the recognizable three-line silhouette.
- Preserve current relative line thicknesses and colors.
- Use a gentle horizontal wave displacement or path deformation.
- Avoid spinning, bouncing, flashing, or aggressive movement.
- Use a seamless repeating animation.
- Avoid visible snapping between loop iterations.
- Keep the logo's surrounding layout stable.
- Prevent animation from affecting text layout or navigation controls.
- Reuse existing markup where possible.
- Prefer lightweight SVG/CSS techniques.
- Avoid external animation libraries unless clearly justified.
- Respect reduced-motion preferences.

The primary animated version should appear wherever the current application header/logo is displayed.

Provide static logo behavior for contexts that do not support reliable SVG animation.

Do not assume browser favicons and iOS Home Screen icons support continuous animation.

## Acceptance criteria

- AC-105-01: Existing three-wave appearance remains recognizable.
- AC-105-02: Animation is smooth and loops seamlessly.
- AC-105-03: The white middle wave remains visually dominant.
- AC-105-04: No unexpected layout shift is introduced.
- AC-105-05: Animation behaves correctly in Chromium, Firefox, and Safari.
- AC-105-06: Reduced-motion preference disables nonessential movement.
- AC-105-07: No additional network dependency is required.
- AC-105-08: Static fallback is available where needed.

---

# PW-106 — Regression Protection and Testing

## Critical architectural constraints

The following functionality has already required substantial engineering work and must remain protected.

### A. Source-health model

Preserve the semantic distinctions between:

- OK
- UNKNOWN
- REFERENCE
- Unavailable or equivalent unhealthy states, where implemented

Do not convert unavailable source data into healthy or empty results.

Do not interpret missing alerts as proof of safety.

### B. Last-known-good retention

Preserve existing source-specific policies for:

- freshness
- expiration
- stale-data presentation
- retained snapshots
- recovery after source failure

Do not create a generic global expiration policy.

Do not reset or extend retained-data validity merely because the UI is refreshed.

### C. Alert lifecycle

Preserve existing logic for:

- active alerts
- expired alerts
- cancelled alerts
- updates and replacements
- deduplication
- source timestamps
- alert severity

### D. Existing architecture

Preserve existing functionality for:

- Overview
- Alerts
- Maps & Live
- News aggregation
- Settings
- source collection
- error handling
- client rendering
- Vercel deployment

Avoid unrelated dependency changes.

## Required automated tests

### Navigation tests

- Selecting Overview Alert A opens Alert A.
- Selecting Alert B does not open Alert A.
- Identical headlines with different identifiers remain distinguishable.
- Direct links restore the selected alert.
- Browser navigation works correctly.
- An expired or removed target produces a clear fallback.

### External link tests

- Valid official HTML source URL is accepted.
- Generic API collection URL is not used as a detail link.
- Absent source URL produces no broken link.
- Malformed URLs are rejected.
- Unsafe schemes are rejected.
- API URL and human-readable URL are not confused.
- Provider-specific source mappings are handled correctly.

### Ticker tests

- Animation duration scales with rendered content width.
- Desktop baseline movement is preserved.
- Mobile movement exceeds its original measured baseline.
- Resize updates duration appropriately.
- Repeated data refreshes do not cause excessive restarts.
- Reduced-motion handling works.
- Empty alert collections do not cause animation errors.

### Map tests

- Initial Ventusky URL requests precipitation.
- Configured map position remains unchanged.
- Map integration remains responsive.
- Unsupported third-party map behavior produces a nonbreaking fallback.

### Logo tests

- Animation exists on the intended logo.
- Static fallback remains available.
- Reduced-motion styling disables animation.
- Logo rendering does not cause layout shifts.

### Source-health regression tests

Include representative fixtures for:

1. Healthy source with active alerts.
2. Healthy source returning no active alerts.
3. Failed source with retained last-known-good data.
4. Failed source whose retained data has exceeded permitted freshness.
5. Expired alert still present in retained source data.
6. Malformed upstream payload.
7. Partial provider failure while other providers remain healthy.
8. Recovery from unavailable to healthy source state.
9. Previously valid alert being updated or cancelled.

Confirm all applicable existing status and freshness policies remain unchanged.

## Browser testing matrix

| Platform | Required validation |
|---|---|
| Windows / Chrome | Full functional and layout test |
| Windows / Edge | Full functional and layout test |
| Firefox desktop | Visual and navigation smoke test |
| iPhone / Safari | Ticker, navigation, links, responsive map |
| iPad / Safari | Responsive layout, navigation, map |
| Mobile Chromium | Ticker and link smoke test |

Use automated browser tests where available.

If a physical iPhone or Safari test environment is unavailable, state that explicitly. Do not report iOS compatibility as verified solely from Chromium emulation.

## Required execution

1. Run existing test suites before making changes.
2. Record baseline results.
3. Implement changes in small, reviewable commits.
4. Add focused tests for each change.
5. Run existing and newly added tests.
6. Run any available lint/build validation.
7. Inspect the final diff for unrelated changes.
8. Review deployment configuration for unintended modifications.
9. Prepare a summary of outcomes and outstanding risks.

Run `npm test` and `npm run test:dom` if those are valid scripts in the current repository. Discover the correct commands rather than assuming they exist.

Avoid replacing real tests with placeholder assertions.

---

# 4. Delivery and Pull Request Strategy

Recommended order:

1. PW-101 and PW-102: Alert navigation and links.
2. PW-103: Mobile ticker.
3. PW-104: Ventusky default.
4. PW-105: Wave animation.
5. PW-106: Consolidated validation.

Prefer separate, focused pull requests or commits with clear acceptance results.

Changes must be suitable for deployment to a Vercel preview environment before production.

Do not automatically deploy to production.

Do not merge to the default branch without explicit approval.

Do not add paid dependencies without approval.

Do not add unrequested telemetry or collect user geolocation.

---

# 5. Required Final Report

After implementation, provide:

### A. Executive summary

What was changed and why.

### B. File modification inventory

For each changed file, describe the modification and purpose.

### C. Acceptance criteria results

Report each AC as:

- PASS
- FAIL
- NOT TESTED
- BLOCKED

Include evidence for each status.

### D. Test execution

Provide the commands executed, test results, and any failures.

### E. Source-health regression verification

Explicitly confirm whether source-health, caching, freshness, and last-known-good behavior were changed.

Identify any regression tests that could not be executed.

### F. Browser compatibility

State what was tested and what remains unverified.

### G. Deployment readiness

Report whether Phase 1 is ready for Vercel preview and whether it is recommended for production.

### H. Outstanding issues

Identify known limitations and recommended follow-up actions.

### I. Future compatibility

Note any technical considerations relevant to eventual:

- trusted-source selection
- premium custom feeds
- account persistence
- AI premium access
- device notifications

Do not implement those future features in this phase.

---

# 6. Definition of Done

Phase 1 is complete only when:

- All five functional improvements have been implemented.
- Existing application features continue working.
- All applicable P0 and P1 acceptance criteria pass.
- Automated regression tests pass.
- The alert data and source-health models remain valid.
- Any browser-test gaps are explicitly documented.
- No unauthorized infrastructure or recurring expense has been added.
- Changes have been reviewed through a Vercel preview.
- The implementation report and pull request are ready for approval.

**Primary engineering directive:** Improve the user's experience without weakening the reliability, provenance, or integrity of the Pacific Watch monitoring system.
