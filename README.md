# Realtime Classroom Server

A shared 2D board where many students connect in real time. Built for a 3-phase classroom exercise on realtime frontend agents.

## Phases

1. **Presence & movement** — students join, see each other, and move their shape around.
2. **Red incident zones** — the server spawns red zones; students manually move into them to repair.
3. **Autonomous agents** — students program client-side agents that detect zones and repair them automatically.

## Quick start

```bash
npm install
npm start          # production
npm run dev        # auto-restart on file changes (Node 18+)
```

The server runs on `http://localhost:3000` (override with `PORT` env var).

## Project structure

```
src/
  server.js      — Express + Socket.IO entry point
  state.js       — In-memory world state (agents, zones)
  gameLoop.js    — Periodic zone spawning and repair ticks
  protocol.js    — Event names and constants
docs/
  protocol.md    — Full Socket.IO protocol reference
  client-quickstart.md — Minimal client example
```

## Protocol overview

All communication uses Socket.IO named events. See [docs/protocol.md](docs/protocol.md) for the full reference and [docs/client-quickstart.md](docs/client-quickstart.md) for a copy-paste starter client.

### Client → Server

| Event | Purpose |
|---|---|
| `agent:join` | Join the board with a name |
| `agent:move` | Send new position |
| `zone:claim` | Start repairing a zone |

### Server → Client

| Event | Purpose |
|---|---|
| `agent:welcome` | Your agent + world snapshot |
| `agent:joined` | Another agent joined |
| `agent:moved` | Another agent moved |
| `agent:left` | An agent disconnected |
| `zone:spawned` | New red zone appeared |
| `zone:updated` | Zone state changed (claimed) |
| `zone:resolved` | Zone was repaired |

## Board

- **Size:** 1200 × 800
- **Max active zones:** 5
- **Zone spawn interval:** 8 s
- **Repair duration:** 2 s
