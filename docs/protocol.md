# Socket.IO Protocol Reference

All communication uses **Socket.IO named events**. No raw JSON envelopes.

## Connection

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000');
```

---

## Client → Server

### `agent:join`

Join the board. Must be sent before any other event.

**Payload:**

```js
{
  name: string,       // required, max 30 chars
  color?: string,     // optional, e.g. '#FF5733'
  shape?: string      // optional, SVG string (max 10 000 chars, must contain <svg)
}
```

**Acknowledgement callback** returns:

```js
{
  agent: Agent,        // your agent object
  agents: Agent[],     // all agents currently on the board
  zones: Zone[]        // all active zones
}
```

The server also emits `agent:welcome` with the same payload.

---

### `agent:move`

Move your agent to an absolute position. The server clamps to board bounds (0–1200, 0–800).

**Payload:**

```js
{
  x: number,
  y: number
}
```

No acknowledgement. The server broadcasts `agent:moved` to other clients.

---

### `zone:claim`

Start repairing an active zone. Your agent must be **inside the zone radius** at the time of claiming.

**Payload:**

```js
{
  zoneId: string
}
```

**Acknowledgement callback** returns:

```js
{ ok: true, zone: Zone }   // success
{ ok: false }               // not inside zone, zone inactive, etc.
```

After claiming, stay inside the zone for **2 000 ms** to resolve it. If you move out, the claim is released.

---

## Server → Client

### `agent:welcome`

Sent to the joining client immediately after `agent:join`.

```js
{
  agent: Agent,
  agents: Agent[],
  zones: Zone[]
}
```

### `agent:joined`

Broadcast to all **other** clients when a new agent joins.

```js
Agent
```

### `agent:moved`

Broadcast to all **other** clients when an agent moves.

```js
{
  id: string,
  x: number,
  y: number
}
```

### `agent:left`

Broadcast to **all** clients when an agent disconnects.

```js
{
  id: string
}
```

### `zone:spawned`

Broadcast to **all** clients when a new incident zone appears.

```js
Zone
```

### `zone:updated`

Broadcast to **all** clients when a zone's state changes (e.g. claimed by an agent).

```js
Zone
```

### `zone:resolved`

Broadcast to **all** clients when a zone is fully repaired.

```js
Zone
```

---

## Data shapes

### Agent

```js
{
  id: string,
  name: string,
  x: number,
  y: number,
  size: number,          // default 40
  color: string,         // hex color
  shape: string | null,  // SVG string or null
  connectedAt: number    // timestamp ms
}
```

### Zone

```js
{
  id: string,
  x: number,
  y: number,
  radius: number,
  severity: number,        // 1–5
  status: 'active' | 'resolved',
  spawnedAt: number,       // timestamp ms
  resolvedAt: number | null,
  claimedBy: string | null,
  repairStartedAt: number | null
}
```

---

## Constants

| Constant | Value |
|---|---|
| Board width | 1200 |
| Board height | 800 |
| Agent default size | 40 |
| Zone spawn interval | 8 000 ms |
| Max active zones | 5 |
| Repair duration | 2 000 ms |
| Zone radius range | 40–80 |
| Zone severity range | 1–5 |
| Max SVG length | 10 000 chars |
