# Build your realtime agent — Student guide

You will connect to a shared board, move a shape around, and eventually program it to act on its own.

The exercise has 3 phases. Complete them in order.

---

## Server

The shared server is running at:

```
https://agent-wars-server-ujkj.onrender.com
```

All students connect to the same server. You only write the client.

## Setup

You need at least **one file**: an HTML file you open in the browser.

Create a file called `my-agent.html` and paste this skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Agent</title>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
</head>
<body>
  <canvas id="board" width="1200" height="800"></canvas>
  <script>
    const socket = io('https://agent-wars-server-ujkj.onrender.com');

    // Your code goes here

  </script>
</body>
</html>
```

Double-click the file to open it in your browser. Open the browser console (`F12` → Console) to see logs.

---

## The board

The board is **1200 × 800** pixels. All coordinates use this space.

- `(0, 0)` is the top-left corner
- `(1200, 800)` is the bottom-right corner

---

## Phase 1 — Join and move

### 1.1 Join the board

Send `agent:join` with your name. The server replies with your agent and the current world state.

```js
socket.emit('agent:join', { name: 'YourName', color: '#FF5733' }, (response) => {
  console.log('My agent:', response.agent);
  console.log('All agents:', response.agents);
  console.log('Active zones:', response.zones);
});
```

The `color` field is optional. If you skip it, you get a default blue.

### 1.2 Move your agent

Send `agent:move` with absolute `x, y` coordinates. The server clamps them to the board bounds.

```js
socket.emit('agent:move', { x: 400, y: 300 });
```

Try wiring this to a click on the canvas:

```js
const canvas = document.getElementById('board');
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  socket.emit('agent:move', { x, y });
});
```

### 1.3 Listen for other agents

```js
// A new agent joined
socket.on('agent:joined', (agent) => {
  console.log('New agent:', agent.name);
});

// An agent moved
socket.on('agent:moved', ({ id, x, y }) => {
  console.log(`Agent ${id} moved to (${x}, ${y})`);
});

// An agent left
socket.on('agent:left', ({ id }) => {
  console.log(`Agent ${id} disconnected`);
});
```

### 1.4 Render

Use the canvas to draw agents. A minimal render loop:

```js
const ctx = canvas.getContext('2d');
const agents = new Map();

// Keep agents in sync
socket.on('agent:welcome', (data) => {
  for (const a of data.agents) agents.set(a.id, a);
});
socket.on('agent:joined', (a) => agents.set(a.id, a));
socket.on('agent:moved', ({ id, x, y }) => {
  const a = agents.get(id);
  if (a) { a.x = x; a.y = y; }
});
socket.on('agent:left', ({ id }) => agents.delete(id));

function draw() {
  ctx.clearRect(0, 0, 1200, 800);
  for (const a of agents.values()) {
    ctx.fillStyle = a.color || '#4A90D9';
    ctx.fillRect(a.x - 20, a.y - 20, 40, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(a.name, a.x, a.y - 26);
  }
  requestAnimationFrame(draw);
}
draw();
```

**Checkpoint:** you should see your square on the board and be able to click to move it. Open a second tab to see another agent.

---

## Phase 2 — Incident zones

Red zones appear on the board every 8 seconds (max 5 at a time). Each zone is a circle with a position, radius, and severity (1–5).

### 2.1 Listen for zones

```js
const zones = new Map();

socket.on('zone:spawned', (z) => {
  console.log('New zone:', z.id, 'severity:', z.severity);
  zones.set(z.id, z);
});

socket.on('zone:updated', (z) => zones.set(z.id, z));

socket.on('zone:resolved', (z) => {
  console.log('Zone resolved:', z.id);
  zones.set(z.id, z);
});
```

Don't forget to also load zones from the initial `agent:welcome` response:

```js
socket.on('agent:welcome', (data) => {
  for (const z of data.zones) zones.set(z.id, z);
});
```

### 2.2 Draw zones

Add this to your render loop, **before** drawing agents:

```js
for (const z of zones.values()) {
  ctx.beginPath();
  ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
  ctx.fillStyle = z.status === 'resolved'
    ? 'rgba(0, 200, 0, 0.15)'
    : 'rgba(255, 0, 0, 0.15)';
  ctx.fill();
  ctx.strokeStyle = z.status === 'resolved' ? '#0a0' : '#f00';
  ctx.stroke();
}
```

### 2.3 Repair a zone

To repair a zone:

1. Move your agent **inside the zone's radius**
2. Send `zone:claim`
3. **Stay inside** for 2 seconds

```js
socket.emit('zone:claim', { zoneId: 'the-zone-id' }, (res) => {
  if (res.ok) {
    console.log('Repairing! Stay inside for 2 seconds...');
  } else {
    console.log('Claim failed — are you inside the zone?');
  }
});
```

The server checks your position. If you move out before 2 seconds, the claim is released and you have to claim again.

**Checkpoint:** you should see red circles appearing. Click inside one, claim it, wait 2 seconds, and watch it turn green.

---

## Phase 3 — Autonomous agent

Stop clicking. Make your agent think for itself.

### 3.1 The idea

Write a loop that runs every ~50 ms and:

1. Finds the nearest active zone
2. Moves toward it
3. Claims it when close enough
4. Waits for the repair to complete
5. Repeats

### 3.2 Find the nearest zone

```js
function findTarget(myAgent) {
  let best = null;
  let bestDist = Infinity;
  for (const z of zones.values()) {
    if (z.status !== 'active') continue;
    const d = Math.hypot(z.x - myAgent.x, z.y - myAgent.y);
    if (d < bestDist) { bestDist = d; best = z; }
  }
  return best;
}
```

### 3.3 Move toward it

```js
function moveToward(myAgent, target, speed) {
  const dx = target.x - myAgent.x;
  const dy = target.y - myAgent.y;
  const dist = Math.hypot(dx, dy);
  if (dist < speed) return; // close enough

  const nx = myAgent.x + (dx / dist) * speed;
  const ny = myAgent.y + (dy / dist) * speed;
  socket.emit('agent:move', { x: nx, y: ny });
  myAgent.x = nx;
  myAgent.y = ny;
}
```

### 3.4 Put it together

```js
let myId = null;

socket.emit('agent:join', { name: 'AutoBot', color: '#00FF88' }, (res) => {
  myId = res.agent.id;
  for (const a of res.agents) agents.set(a.id, a);
  for (const z of res.zones) zones.set(z.id, z);
});

setInterval(() => {
  const me = agents.get(myId);
  if (!me) return;

  const target = findTarget(me);
  if (!target) return;

  const dist = Math.hypot(target.x - me.x, target.y - me.y);
  if (dist <= target.radius) {
    // Inside the zone — claim it
    socket.emit('zone:claim', { zoneId: target.id });
  } else {
    // Move toward it
    moveToward(me, target, 4);
  }
}, 50);
```

The speed of `4` pixels per tick at 50 ms intervals means ~80 px/s. Adjust to your taste.

**Checkpoint:** your agent should find zones, glide toward them, claim them, and move to the next one — all without you touching anything.

---

## Challenges

Once the basics work, try improving your agent:

- **Prioritize by severity** — repair severity-5 zones before severity-1
- **Avoid competition** — skip zones already claimed by someone else (`z.claimedBy !== null`)
- **Predict spawn areas** — track where zones appear and pre-position
- **Smooth movement** — use easing instead of linear movement
- **Custom shape** — pass an SVG string in `shape` when joining to replace the default square

---

## Quick reference

### Events you send

| Event | Payload | Response |
|---|---|---|
| `agent:join` | `{ name, color?, shape? }` | `{ agent, agents, zones }` |
| `agent:move` | `{ x, y }` | — |
| `zone:claim` | `{ zoneId }` | `{ ok, zone? }` |

### Events you receive

| Event | Payload |
|---|---|
| `agent:welcome` | `{ agent, agents, zones }` |
| `agent:joined` | `{ id, name, x, y, size, color, shape, connectedAt }` |
| `agent:moved` | `{ id, x, y }` |
| `agent:left` | `{ id }` |
| `zone:spawned` | `{ id, x, y, radius, severity, status, ... }` |
| `zone:updated` | same as zone:spawned |
| `zone:resolved` | same as zone:spawned |

### Constants

| | Value |
|---|---|
| Board size | 1200 × 800 |
| Repair time | 2 seconds |
| Max active zones | 5 |
| Zone spawn interval | 8 seconds |
