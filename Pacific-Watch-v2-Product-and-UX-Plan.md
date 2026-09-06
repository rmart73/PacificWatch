# Pacific Watch v2 — Product, UX, and Implementation Plan

> **Status as of 2026-09-06.** This document is the original product intent and is kept
> unedited below. Some of it has shipped, and two parts shipped *differently* from what is
> proposed here — where the plan and the code disagree, the code and `AGENTS.md` are correct.
>
> | Plan item | State |
> |---|---|
> | 3 — Alert Severity System | **Shipped, but not as specified.** See the deviation note below. |
> | 7 — Data Freshness | **Shipped.** Per-source ages, `LIVE`/`STALE`/`DEGRADED` header pill. |
> | 8 — Source Health Monitor | **Shipped** as Settings → Data Sources. |
> | 13 — News as Operational Intelligence | **Partial.** Hazard flagging and per-outlet filtering exist; AI classification does not. |
> | 4 — Remove user API-key requirement | Not started. Constraints recorded in `AGENTS.md`. |
> | 1, 2, 5, 6, 9-12, 14-16 | Not started. |
>
> **Deviation 1 — severity.** Item 3 maps CAP severity levels to colours. That does not work:
> NWS returns `severity: Severe` for both a Tropical Storm Warning and a Flood Watch, verified
> live. Alerts are tiered on **NWS product type** instead, with severity kept only as a
> safety-biased override. See the Alert severity model section of `AGENTS.md`.
>
> **Deviation 2 — green.** Item 3 and the SITREP examples use 🟢 for NORMAL. The palette has no
> green, and "all clear" is steel blue so the alert/advisory/clear triad stays readable with
> red-green colour blindness. Do not introduce green from these examples.
>
> **The plan was right about one thing worth calling out:** "Never use color as the only
> severity indicator". That is now enforced — every status state differs in shape as well as
> hue, after a user confirmed the colours were not readable at a glance at 6px.

---

## Product Vision

**Pacific Watch** should evolve from a useful collection of Hawaiʻi situational-awareness feeds into a civilian **Common Operating Picture (COP)** for Hawaiʻi and the broader Pacific.

### Positioning

> **Pacific Watch**  
> Hawaiʻi's real-time situational awareness dashboard.  
> Weather · Hazards · Earthquakes · Volcanoes · Infrastructure · Pacific Threats

The goal is not to become another weather site, news portal, or emergency-management website. The goal is to provide a single, fast, trustworthy operational view that answers:

> **What is happening in Hawaiʻi right now, what matters most, and what should I pay attention to next?**

---

## Product Principles

1. **Situation first, data second** — summarize conditions before exposing raw feeds.
2. **Official sources remain authoritative** — AI assists interpretation but never replaces source agencies.
3. **Severity must be obvious** — important information should never visually compete with low-priority content.
4. **Freshness must be visible** — users should know how recent every feed is.
5. **Island context matters** — Statewide and island-level views should drive the entire experience.
6. **Mobile-first during incidents** — the site should remain easy to use from a phone under stress.
7. **Fast and resilient** — prioritize cached official data, graceful degradation, and source-health awareness.

---

# Phase 1 — High-Impact Product Improvements

## 1. Operational Overview Dashboard

Replace the current top-of-page experience with a clear situational summary.

### Proposed Header

```text
PACIFIC WATCH
Hawaiʻi Situational Awareness

● NORMAL OPERATIONS                     Updated 3:47 PM HST

┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ ACTIVE ALERTS   │ WEATHER         │ EARTHQUAKES     │ POWER           │
│       3         │ Moderate        │ 0 significant   │ 1,247 outages   │
│ 1 Warning       │ Oʻahu 82°F      │ Last: M2.1      │ Statewide       │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

⚠ Flood Advisory — Hawaiʻi Island
Puna District · Until 5:15 PM

[ View Situation ] [ Map ] [ Situation Brief ]
```

### Operational Status Levels

- **NORMAL**
- **ADVISORY**
- **WATCH**
- **WARNING**
- **EMERGENCY**

The status should be calculated from verified source data instead of manually assigned whenever practical.

---

## 2. Unified Hawaiʻi Operational Map

Add a first-class map inside Pacific Watch instead of relying primarily on external mapping portals.

### Initial Layers

- NWS Alerts
- Earthquakes
- Power Outages
- Rainfall
- Radar
- Tsunami Zones
- Flood Zones
- Shelters
- Wildfires
- Volcanoes
- NOAA Buoys
- Traffic / Road Closures

### Suggested Interaction

```text
LAYERS

☑ NWS Alerts
☑ Earthquakes
☑ Power Outages
☐ Rainfall
☐ Radar
☐ Tsunami Zones
☐ Flood Zones
☐ Shelters
☐ Wildfires
☐ Volcanoes
☐ Buoys
☐ Traffic
```

Selecting a map feature should open a compact incident card with severity, location, validity period, source, and official-link action.

---

## 3. Alert Severity System

Use a consistent visual model across every alert source.

| Severity | UI Treatment |
|---|---|
| Extreme | 🔴 EXTREME |
| Severe | 🟠 SEVERE |
| Moderate | 🟡 ADVISORY |
| Minor | 🔵 INFORMATION |
| None | 🟢 NORMAL |

### Alert Card Example

```text
🔴 FLASH FLOOD WARNING

Puna District · Hawaiʻi Island
Until 5:15 PM HST

Heavy rainfall capable of producing flash flooding
is occurring in the warning area.

Affected areas
Pāhoa · Keaʻau · Volcano

[View Map]  [Official NWS Alert]
```

---

## 4. Remove User API-Key Requirement

Do not require visitors to provide an Anthropic or other AI API key.

### Recommended Architecture

```text
Browser
   ↓
Pacific Watch
   ↓
Vercel Serverless Function
   ↓
AI Provider API
```

Store credentials in Vercel environment variables.

### Cost Control

Recommended approaches:

- Cache a statewide brief for 5–10 minutes.
- Generate new briefs only when source data materially changes.
- Use a per-IP rate limit for manual refreshes.
- Generate island-specific briefs on demand and cache them.

---

## 5. Replace “AI Situation Digest” with “Situation Brief”

AI should act like an analyst, not the product itself.

### Recommended Label

**Situation Brief**  
_AI-assisted summary of official sources_

### Example Output

```text
PACIFIC WATCH SITREP
September 5, 2026 · 1545 HST

OVERALL STATUS
🟢 NORMAL

WEATHER
Trade winds 15–25 mph statewide. Scattered windward showers are affecting Oʻahu and Maui.

ACTIVE WARNINGS
No significant NWS warnings currently active.

SEISMIC
Two minor earthquakes recorded in the past 24 hours. No tsunami threat identified by official sources.

VOLCANIC
Kīlauea activity remains confined to the summit region.

INFRASTRUCTURE
No significant statewide power disruptions reported.

MARINE
Small Craft Advisory currently active for selected waters.

WATCH ITEMS
• Increasing surf on north-facing shores
• Rainfall expected over windward Hawaiʻi Island tonight

Sources: NWS · NOAA · USGS · HIEMA
```

Always include a safety statement such as:

> Always follow instructions from official emergency-management and public-safety authorities.

---

# Phase 2 — Context and Trust

## 6. Persistent Island Selector

Use a global selector that changes the entire dashboard context.

Suggested options:

- Statewide
- Oʻahu
- Maui
- Hawaiʻi Island
- Kauaʻi
- Molokaʻi

The selected island should drive:

- Alerts
- Weather
- Tides
- Earthquakes
- Outages
- Radar
- Webcams
- News
- Emergency resources
- Situation Brief

Persist the user's selection locally.

---

## 7. Data Freshness

Display the age of every important feed.

### Global Example

```text
● LIVE
Updated 42 seconds ago
```

### Per-Source Example

```text
NWS       ● 37 sec ago
USGS      ● 2 min ago
NOAA      ● 4 min ago
Outages   ● 1 min ago
```

### Health States

- 🟢 Current
- 🟡 Delayed
- 🔴 Unavailable

---

## 8. Source Health Monitor

Add a compact **System Status** view.

```text
DATA SOURCES

NWS Alerts              ● Operational
NWS Weather             ● Operational
NOAA Tides              ● Operational
USGS Earthquakes        ● Operational
USGS Volcano            ● Operational
HIEMA                    ● Operational
Power Outages            ● Operational
News Feed                ● Operational

Last API refresh: 15:44:16 HST
```

This improves transparency and trust during incidents.

---

## 9. Earthquake Context

Upgrade the earthquake section from a feed into actionable context.

### Example

```text
RECENT EARTHQUAKES

M 2.8
18 mi SW of Volcano
Hawaiʻi Island
12 minutes ago
Depth 19 km

M 1.9
8 mi S of Pāhala
Hawaiʻi Island
47 minutes ago
Depth 31 km
```

For larger events, prominently show official tsunami-status information when available.

---

## 10. Volcano Status Tiles

Volcano status should be visible directly on the dashboard.

### Example

```text
KĪLAUEA

USGS Alert Level
WATCH

Aviation Color
ORANGE

Last update
1h 17m ago

[HVO Update] [Cameras]
```

```text
MAUNA LOA

USGS Alert Level
NORMAL

Aviation Color
GREEN
```

---

# Phase 3 — Pacific Regional Awareness

## 11. Pacific Threats Module

Expand the product beyond local Hawaiʻi monitoring while keeping Hawaiʻi as the operational center.

### Suggested Modules

```text
PACIFIC WATCH

TROPICAL SYSTEMS
No systems threatening Hawaiʻi

TSUNAMI
No Pacific tsunami threat

WEST PACIFIC
Typhoon 19W
2,890 mi W of Honolulu

EARTHQUAKES M6+
M6.4 · Vanuatu · 2h ago

VOLCANOES
Kīlauea · WATCH
```

Potential data sources may include NOAA, PTWC, USGS, GDACS, PDC, and other official/public feeds.

---

## 12. Rework Reference & Resources

Move external links lower in the hierarchy.

### Recommended Navigation

- Overview
- Map
- Alerts
- Weather
- Pacific
- News
- Resources

Resources should contain external portals such as:

- HIEMA
- FEMA
- GDACS
- RSOE
- PDC
- NOAA
- NWS
- USGS

---

## 13. News as Operational Intelligence

Aggregate and classify news by incident relevance.

### Example

```text
LATEST

⚠ WEATHER
Flash flood watch issued for Big Island
NWS · 14m

⚡ INFRASTRUCTURE
3,200 HECO customers lose power
Hawaii News Now · 27m

🌋 VOLCANO
Kīlauea summit activity increases
USGS · 43m

🏛 CIVIL
State opens shelters ahead of storm
HIEMA · 1h
```

AI can assist with classification, deduplication, and summarization while preserving source attribution.

---

## 14. Event Timeline

Add incident chronology to show how conditions are changing.

```text
EVENT TIMELINE

15:42  NWS updates Flash Flood Warning
15:31  Outages rise to 2,341
15:18  Road closure reported
15:04  Rain gauge reaches 2.4 in/hr
14:57  Flash Flood Warning issued
14:31  Flood Advisory issued
```

This transforms Pacific Watch from a snapshot into an evolving operational picture.

---

# Phase 4 — Retention and Resilience

## 15. Progressive Web App (PWA)

Pacific Watch is well suited for PWA installation.

Recommended features:

- Add to Home Screen
- App icon and splash screen
- Full-screen mode
- Cached emergency-resource pages
- Cached most-recent alerts
- Persisted island preference
- Offline-friendly status messaging
- Future push notifications

---

## 16. User Notifications

Allow users to choose the alerts that matter to them.

### Example

```text
MY ALERTS

Island
☑ Oʻahu

Notify me for:

☑ Tsunami Warning
☑ Flash Flood Warning
☑ Hurricane Warning
☑ Tropical Storm Warning
☑ Severe Thunderstorm
☑ Earthquake ≥ M4
☑ Major Power Outage
☐ High Surf Advisory
☐ Small Craft Advisory
```

This creates a reason for users to install and return to Pacific Watch.

---

# Recommended Desktop Information Architecture

```text
PACIFIC WATCH
Overview | Map | Alerts | Pacific | News | Resources | Settings
```

## Desktop Overview Layout

```text
┌──────────────────────────────────────────────────────────────────────┐
│ PACIFIC WATCH                          ● NORMAL     Updated 3:47 HST │
│ Hawaiʻi Situational Awareness                                  ⚙    │
├──────────────────────────────────────────────────────────────────────┤
│ Statewide | Oʻahu | Maui | Hawaiʻi | Kauaʻi | Molokaʻi              │
├──────────────────────────────────────────────────────────────────────┤
│ ACTIVE ALERTS │ WEATHER │ EARTHQUAKES │ POWER │ VOLCANO             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                   HAWAIʻI OPERATIONAL MAP                            │
│                                                                      │
├──────────────────────────────────┬───────────────────────────────────┤
│ PRIORITY ALERTS                  │ SITUATION BRIEF                   │
│                                  │                                   │
│ Alert cards                      │ AI-assisted official-source       │
│                                  │ summary                           │
├──────────────────────────────────┴───────────────────────────────────┤
│ PACIFIC THREATS                                                      │
├──────────────────────────────────┬───────────────────────────────────┤
│ EVENT TIMELINE                   │ LATEST OPERATIONAL NEWS           │
├──────────────────────────────────┴───────────────────────────────────┤
│ SOURCE HEALTH                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

# Recommended Mobile Information Architecture

### Bottom Navigation

```text
⌂ Home     ◉ Map     ⚠ Alerts     ◈ Pacific     ••• More
```

## Mobile Home Layout

```text
PACIFIC WATCH                         ● NORMAL
Hawaiʻi Situational Awareness
Updated 3:47 PM HST

[ Statewide ▼ ]

┌─────────────────────────────────┐
│ ⚠ ACTIVE ALERTS                 │
│ 3                               │
│ 1 Warning                       │
└─────────────────────────────────┘

┌───────────────┬─────────────────┐
│ Weather       │ Power           │
│ Moderate      │ 1,247 outages   │
├───────────────┼─────────────────┤
│ Earthquakes   │ Volcano         │
│ 0 significant│ Kīlauea WATCH   │
└───────────────┴─────────────────┘

PRIORITY ALERT
[Flash Flood Warning card]

[ Open Live Map ]

SITUATION BRIEF
[condensed SITREP]

PACIFIC THREATS
[compact regional status]

LATEST
[3–5 operational items]
```

---

# Suggested Visual Design Direction

## Tone

- Professional
- Calm
- Operational
- Pacific/Hawaiʻi identity without becoming decorative or tourist-oriented
- High contrast for emergency states

## Visual Language

- Dark navy / charcoal operational base
- Ocean blue secondary accents
- Neutral white/light text
- Severity colors reserved for status and alerts
- Clear spacing and large tap targets
- Rounded cards used sparingly
- Avoid excessive gradients or dashboard clutter

## Typography

Use a highly legible sans-serif UI font with clear numerical rendering. Prioritize readability over branding.

## Data Visualization

- Small sparklines for rainfall, wind, tides, outages
- Minimal charts on the main screen
- Larger analytical charts on drill-down pages
- Never use color as the only severity indicator

---

# Recommended Build Priority

This is the broad v2 priority order, not the active work queue. Before expanding the overview,
complete the news-source control corrections and Reference Maps & Portals audit so the new
interface inherits truthful controls and relevant destinations. Preserve the existing alert-tier,
accessibility and source-health foundations rather than rebuilding them as unstarted features.
Current ownership, PR/merge status and the immediate sequence live in `AI-HANDOFF.md`.

1. Operational overview redesign
2. Unified Hawaiʻi map
3. Real alert severity model
4. Remove user AI API-key requirement
5. Situation Brief / SITREP
6. Persistent island-specific context
7. Data freshness and source health
8. Earthquake and volcano status
9. Pacific regional threats
10. Event timeline
11. PWA installation
12. User notifications

---

# Product Success Criteria

Pacific Watch v2 should allow a user to answer the following within roughly 10 seconds of opening the site:

1. Is anything serious happening right now?
2. Which island or area is affected?
3. What is the highest-priority alert?
4. Is the underlying data current?
5. What changed recently?
6. What should I monitor next?
7. Where can I verify the information with an official source?

If the product consistently answers those questions, it is functioning as a true situational-awareness platform rather than a collection of feeds.

---

# Next UX Deliverables

The next design step should produce screen-level mockups for:

1. Desktop Overview
2. Mobile Overview
3. Full-screen Operational Map
4. Alert Detail
5. Situation Brief
6. Pacific Threats
7. News / Intelligence Feed
8. System Status
9. Settings / Alert Preferences
10. PWA / Notification onboarding

