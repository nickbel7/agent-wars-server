# Step 03 — Phase 3: Autonomous Agent

## Overview

Phase 3 adds a fully autonomous AI-driven agent that navigates the board, picks optimal zones, and triggers repairs without any user input. It activates via keyboard shortcut or a dedicated button.

## Features Implemented

### `pickTarget()`
Evaluates every active zone and assigns a weighted score:

```
score = severity × W_SEV  +  distance × W_DIST  +  contested × W_CONT
```

| Constant  | Value  | Rationale |
|-----------|--------|-----------|
| `W_SEV`   |  220   | Prioritise high-severity zones |
| `W_DIST`  | -0.45  | Slight preference for closer zones |
| `W_CONT`  | -1200  | Heavily penalise zones already being repaired by another agent |

Zones that are already `claimed` by a **different** agent are skipped entirely to avoid contested repairs.

### `stepToward(me, target)`
Computes the next position by moving at most `AUTO_SPEED = 14` canvas-pixels per tick in the direction of the target. Returns the target position itself once within one step.

### `autoTick()` — 10 fps loop
Runs every `100 ms` (`1000 / AUTO_HZ`):
1. Calls `pickTarget()` to pick the best zone.
2. If the agent is already inside the zone radius → emit `zone:claim`.
3. Otherwise → compute `stepToward()` and emit `agent:move`, immediately updating the local position for smooth rendering.

### `setAutoMode(on)` — toggle
- Starts/stops the `setInterval` loop.
- Updates the `#auto-btn` styling (`.active` class → orange glow).
- Updates the `#stat-mode` HUD label (`ON` / `OFF`).
- Clears `currentTarget` when turning off.
- Disables manual click / arrow-key movement while active.

### Controls
| Input           | Action                   |
|-----------------|--------------------------|
| Click **AUTO** button | Toggle autonomous mode |
| Press <kbd>A</kbd>    | Toggle autonomous mode |

### Target Highlighting
- A dashed orange line is drawn on the canvas from the agent to the current target.
- The target zone ring turns orange and its label changes to **TARGET**.
- The sidebar zone list item receives the `.target` CSS class (orange border + background tint).
- The mini-map shows an extra orange ring around the target zone.

## Code Location

`clients/nikos/index.html` — functions `pickTarget`, `stepToward`, `autoTick`, `setAutoMode`; event listener on `#auto-btn` and `keydown` for <kbd>A</kbd>.
