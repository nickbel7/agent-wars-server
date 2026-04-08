# Project Context

## Why

A classroom exercise to learn how realtime systems work by building a frontend agent that connects to a shared board, reacts to live events, and eventually acts autonomously.

## What

A multiplayer 2D board where each student controls a shape. The server spawns red incident zones that need repairing. Students start by moving manually, then write code that moves and repairs on its own. The backend is shared — each student builds only their client.

## Product principles

- Teaching comes first — every design choice should be easy to explain
- Copy-paste friendly — students should be able to get something running in minutes
- Progressive complexity — phase 1 is trivial, phase 3 is open-ended

## Functional domains

- **Presence** — agents joining, leaving, and appearing on the board
- **Movement** — agents changing position in a shared coordinate space
- **Incidents** — red zones spawning, being claimed, and getting repaired
- **Autonomy** — client-side logic that acts without human input

## Functional restrictions

- Server: Node.js, Socket.IO, plain JavaScript ESM, in-memory state only
- Client: plain HTML + JS, loaded from a local file (no build step)
- No database, no authentication, no Docker, no TypeScript
- All communication over Socket.IO named events (no REST for game state)
- One server instance, one board, all students share the same world

## Architecture

```
┌─────────────┐   Socket.IO    ┌──────────────────────┐
│  Student A   │◄──────────────►│                      │
│  (browser)   │                │   Node.js server     │
├─────────────┤                │                      │
│  Student B   │◄──────────────►│  - agents (Map)      │
│  (browser)   │                │  - zones  (Map)      │
├─────────────┤                │  - game loop (timer)  │
│  Student C   │◄──────────────►│                      │
│  (browser)   │                └──────────────────────┘
└─────────────┘
```

Students write only the left side. The right side is provided.

## The three phases

| Phase | Student does | Server does |
|---|---|---|
| 1. Presence & movement | Join, render board, click to move | Store agents, broadcast positions |
| 2. Incident zones | Render zones, click into a zone, claim it | Spawn zones on a timer, check repairs |
| 3. Autonomous agent | Write a loop that finds, moves to, and claims zones | Same as phase 2 — no changes needed |

## World model

**Board:** 1200 × 800 pixels

**Agent** (one per connected student):

| Field | Type | Notes |
|---|---|---|
| `id` | string | Socket ID, assigned by server |
| `name` | string | Chosen by student |
| `x`, `y` | number | Position on the board |
| `size` | number | Default 40 |
| `color` | string | Hex color |
| `shape` | string or null | Optional SVG for custom rendering |
| `connectedAt` | number | Timestamp |

**Zone** (spawned by server):

| Field | Type | Notes |
|---|---|---|
| `id` | string | UUID |
| `x`, `y` | number | Center of the circle |
| `radius` | number | 40–80 px |
| `severity` | number | 1–5 |
| `status` | `active` or `resolved` | |
| `claimedBy` | string or null | Agent ID currently repairing |
| `repairStartedAt` | number or null | When the claim started |
| `resolvedAt` | number or null | When it was fixed |

## Key rules

- A zone is repaired when an agent stays inside its radius for **2 seconds** continuously
- If the agent moves out, the claim is released
- Maximum **5** active zones at once
- A new zone spawns every **8 seconds**
- One agent is enough to repair a zone
- The server clamps all positions to board bounds

## Protocol summary

Students send 3 events and listen for 7. Full reference in [protocol.md](protocol.md).

**Send:**
- `agent:join` → join the board
- `agent:move` → update position
- `zone:claim` → start repairing a zone

**Receive:**
- `agent:welcome` → your agent + world snapshot
- `agent:joined` / `agent:moved` / `agent:left` → other agents
- `zone:spawned` / `zone:updated` / `zone:resolved` → zone lifecycle
