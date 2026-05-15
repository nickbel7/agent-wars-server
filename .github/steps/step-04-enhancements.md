# Step 04 — Enhancements

## Overview

This step adds four cross-cutting enhancements to the client: smooth agent interpolation, a live mini-map, a performance chart, and expanded statistics.

---

## 1. Agent Interpolation (Lerp)

Other agents' server positions are stored in `agentTargets` (a `Map<id, {x,y}>`). Every frame the render loop applies:

```js
a.x += (target.x - a.x) * LERP;
a.y += (target.y - a.y) * LERP;
```

with `LERP = 0.18`. This eliminates the teleport effect when a `agent:moved` event arrives and makes remote agents glide smoothly between positions.

Own agent position is updated immediately (server-authoritative echo), so no interpolation is applied to `myId`.

---

## 2. Mini-map (`#minimap` — 196×131 canvas)

Rendered every animation frame alongside the main board.

Scale factors:
- `MM_SX = 196 / 1200 ≈ 0.163`
- `MM_SY = 131 / 800  ≈ 0.164`

### Drawn elements
| Element       | Rendering |
|---------------|-----------|
| Background    | `#0d1117` fill |
| Active zones  | Filled circle (colour + `33` alpha) + stroked ring, severity-coloured |
| Target zone   | Extra orange ring (`rgba(255,107,0,.9)`, 2 px, only in auto mode) |
| Other agents  | 2 px dot in agent colour |
| Own agent     | 3 px dot + 1 px stroke ring |

Resolved zones are skipped.

---

## 3. Performance Chart (`#chart-canvas` — 196×50 canvas)

Redrawn after every `zone:resolved` event that was repaired by the local agent.

- Stores the last **10** repair durations in `repairHistory[]`.
- Renders as a vertical bar chart; bar height ∝ `duration / maxDuration`.
- Each bar is coloured by the zone's severity (same 5-colour palette as the main board).
- A faint label "fix time (last 10)" is drawn in the top-left corner.
- Bars use the full canvas height minus 12 px for the label row.

---

## 4. Stats & Tracking

### `repairHistory[]`
Each entry: `{ resolvedAt, duration, severity }`.

Used for:
- Chart rendering (last 10 entries).
- Average fix time (`siAvg`): rolling mean over all entries, displayed as seconds.
- **Zones/min** (`#stat-zpm`): count of entries within the last 60 s, recalculated every second.

### Streak counters
- `currentStreak` — incremented on every successful repair by own agent; reset to 0 if another agent resolves a zone first.
- `longestStreak` — high-water mark of `currentStreak`.
- Both displayed in the **Performance** sidebar section.

### HUD additions
| Stat ID       | Content |
|---------------|---------|
| `#stat-zpm`   | Zones fixed in the last 60 s |
| `#stat-mode`  | `ON` (orange) / `OFF` based on auto mode state |

---

## Code Location

`clients/nikos/index.html`:
- `drawMinimap()` — mini-map rendering
- `drawChart()` — bar chart rendering
- `repairHistory`, `currentStreak`, `longestStreak` — stats state
- Lerp in `draw()` animation loop
- `updateTimer()` — zones/min sliding window, called every second
