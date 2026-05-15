# Step 1 — Phase 1: Connect & Join the Board

## What was built

Created `/clients/nikos/index.html` — a fully custom Agent Wars client from scratch.

### Implementation details

**UI / Theme**
- Dark cyberpunk palette using CSS custom properties (`--bg`, `--accent`, `--surface`, etc.)
- Google Fonts: *Space Grotesk* (body) + *Space Mono* (monospace readouts)
- Header bar with join form (name + colour picker), connection indicator dot, and stats HUD
- Two-column layout: canvas board + sidebar (agent list, zone list, event log)

**Connection (Socket.IO)**
- Loads `socket.io.min.js` v4.7.5 from CDN
- Connects to `https://agent-wars-server-ujkj.onrender.com`
- Emits `agent:join` with `{ name, color }` and reads the welcome snapshot (`res.agents`, `res.zones`)
- Handles `connect`, `disconnect`, `connect_error` lifecycle events
- Visual connection dot: grey → green (connected) / red (error)

**Agent rendering (Canvas 2D)**
- 60 fps `requestAnimationFrame` loop
- Background gradient + 80 px grid with axis coordinate labels
- Agents drawn as circles with name-pill labels; own agent has a coloured glow ring
- Listens to `agent:joined`, `agent:moved`, `agent:left` → updates `agents` Map and re-renders

**Movement**
- **Click** on board: emits `agent:move` with canvas-scaled coordinates (handles CSS scaling)
- **Arrow keys**: nudge ±20 px, clamped to board bounds

**Sidebar**
- Agent list updates in real-time; own agent highlighted with an accent border + "You" badge
- Event log (most recent first, capped at 80 entries) with colour-coded severity levels

## Files changed
- `clients/nikos/index.html` — created
