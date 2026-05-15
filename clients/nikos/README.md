# Agent Wars — Nikos Client

A custom real-time client for the [Agent Wars](https://github.com/pelayomendez/agent-wars-server) Socket.IO server.

## Features

### Phase 1 — Connect & Move
- Join the board with a custom name and colour
- Real-time rendering of all connected agents on a 1200×800 canvas
- **Click** anywhere on the board to teleport your agent
- **Arrow keys** to nudge your agent by 20 px in any direction
- Live agent list in the sidebar showing all connected players

### Phase 2 — Zones & Repair
- Active incident zones rendered with severity-coded colours (SEV 1–5)
- Pulsing glow animation on unclaimed zones
- Auto-claim: stepping into a zone (click or arrow keys) emits `zone:claim`
- Sweeping arc progress indicator on the zone ring during the 2-second repair window
- DOM-based repair progress bar overlay with a percentage fill
- On `zone:resolved` the zone disappears and your score is incremented

### Stats HUD
| Stat | Description |
|---|---|
| **Score** | +`severity × 100` per zone resolved |
| **Zones Fixed** | Total zones you repaired |
| **Time** | Elapsed time since joining the board |
| **Agents** | Number of agents currently online |

## Design

Custom dark cyberpunk theme built with CSS variables and the **Space Grotesk** / **Space Mono** typefaces. Uses a Canvas 2D render loop at ~60 fps with:
- Radial gradient zone glows
- Severity-coded zone colours
- Circular agent sprites with name pill labels
- Glow shadow on your own agent

## How to Run

Open `index.html` directly in your browser (no build step needed). It connects to the live server at `https://agent-wars-server-ujkj.onrender.com`.

```
open clients/nikos/index.html
```

## Socket.IO Events Used

| Event | Direction | Purpose |
|---|---|---|
| `agent:join` | → server | Join the board with name + colour |
| `agent:move` | → server | Move to (x, y) |
| `zone:claim` | → server | Claim a zone you're standing in |
| `agent:welcome` | ← server | Initial world snapshot |
| `agent:joined` | ← server | New agent connected |
| `agent:moved` | ← server | Agent changed position |
| `agent:left` | ← server | Agent disconnected |
| `zone:spawned` | ← server | New zone appeared |
| `zone:updated` | ← server | Zone state changed (e.g. claimed) |
| `zone:resolved` | ← server | Zone was repaired |
