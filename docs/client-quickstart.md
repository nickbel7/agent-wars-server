# Client Quickstart

A minimal browser client that connects, joins the board, and renders agents and zones.

## 1. HTML skeleton

Create an `index.html` file and open it in a browser.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Realtime Board</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #111; display: flex; justify-content: center; align-items: center; height: 100vh; }
    canvas { border: 1px solid #333; }
  </style>
</head>
<body>
  <canvas id="board" width="1200" height="800"></canvas>

  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <script type="module">
    const socket = io('http://localhost:3000');
    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');

    // ---- State -------------------------------------------------------------
    let myId = null;
    const agents = new Map();
    const zones = new Map();

    // ---- Join --------------------------------------------------------------
    socket.emit('agent:join', { name: 'Student' }, (res) => {
      if (res.error) return console.error(res.error);
      myId = res.agent.id;
      for (const a of res.agents) agents.set(a.id, a);
      for (const z of res.zones) zones.set(z.id, z);
    });

    // ---- Listen for events -------------------------------------------------
    socket.on('agent:joined', (a) => agents.set(a.id, a));
    socket.on('agent:moved', ({ id, x, y }) => {
      const a = agents.get(id);
      if (a) { a.x = x; a.y = y; }
    });
    socket.on('agent:left', ({ id }) => agents.delete(id));

    socket.on('zone:spawned', (z) => zones.set(z.id, z));
    socket.on('zone:updated', (z) => zones.set(z.id, z));
    socket.on('zone:resolved', (z) => zones.set(z.id, z));

    // ---- Movement (click to move) ------------------------------------------
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      socket.emit('agent:move', { x, y });

      // Update local state immediately for responsiveness
      const me = agents.get(myId);
      if (me) { me.x = x; me.y = y; }
    });

    // ---- Render loop -------------------------------------------------------
    function draw() {
      ctx.clearRect(0, 0, 1200, 800);

      // Draw zones
      for (const z of zones.values()) {
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
        if (z.status === 'resolved') {
          ctx.fillStyle = 'rgba(0, 200, 0, 0.15)';
          ctx.strokeStyle = '#0a0';
        } else {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
          ctx.strokeStyle = '#f00';
        }
        ctx.fill();
        ctx.stroke();
      }

      // Draw agents
      for (const a of agents.values()) {
        const half = a.size / 2;
        ctx.fillStyle = a.id === myId ? '#fff' : (a.color || '#4A90D9');
        ctx.fillRect(a.x - half, a.y - half, a.size, a.size);

        ctx.fillStyle = '#ccc';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(a.name, a.x, a.y - half - 6);
      }

      requestAnimationFrame(draw);
    }
    draw();
  </script>
</body>
</html>
```

## 2. Phase 1 — Manual movement

Open the HTML in a browser. Click anywhere on the canvas to move your agent. Open a second tab to see two agents at once.

## 3. Phase 2 — Repairing zones

Red circles appear every 8 seconds. To repair one:

1. Click inside the red zone to move your agent there.
2. Send a claim event:

```js
socket.emit('zone:claim', { zoneId: zone.id }, (res) => {
  console.log(res.ok ? 'Repairing...' : 'Failed to claim');
});
```

3. Stay inside the zone for 2 seconds. The server resolves it automatically.

## 4. Phase 3 — Autonomous agent

Replace click-based movement with an autonomous loop:

```js
function findNearestActiveZone(myAgent) {
  let nearest = null;
  let bestDist = Infinity;
  for (const z of zones.values()) {
    if (z.status !== 'active') continue;
    const dist = Math.hypot(z.x - myAgent.x, z.y - myAgent.y);
    if (dist < bestDist) {
      bestDist = dist;
      nearest = z;
    }
  }
  return nearest;
}

setInterval(() => {
  const me = agents.get(myId);
  if (!me) return;

  const target = findNearestActiveZone(me);
  if (!target) return;

  // Move toward the target zone center
  const dx = target.x - me.x;
  const dy = target.y - me.y;
  const dist = Math.hypot(dx, dy);
  const speed = 5;

  if (dist > speed) {
    const nx = me.x + (dx / dist) * speed;
    const ny = me.y + (dy / dist) * speed;
    socket.emit('agent:move', { x: nx, y: ny });
    me.x = nx;
    me.y = ny;
  } else {
    // We're inside — claim it
    socket.emit('zone:claim', { zoneId: target.id });
  }
}, 50);
```

This moves your agent toward the nearest red zone at ~100 px/s and claims it on arrival. The server handles the rest.
