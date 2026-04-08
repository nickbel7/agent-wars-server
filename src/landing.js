// ---------------------------------------------------------------------------
// landing.js — HTML landing page served at GET /
// ---------------------------------------------------------------------------

import { getAllAgents, getActiveZones, getAllZones } from './state.js';

export function renderLanding(connectedSockets) {
  const agents = getAllAgents();
  const activeZones = getActiveZones();
  const allZones = getAllZones();
  const resolved = allZones.filter((z) => z.status === 'resolved').length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Agent Wars</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='10' y='10' width='80' height='80' rx='12' fill='%23f87171'/><rect x='25' y='25' width='20' height='20' rx='4' fill='%230e0e10'/><rect x='55' y='25' width='20' height='20' rx='4' fill='%230e0e10'/><rect x='30' y='60' width='40' height='8' rx='4' fill='%230e0e10'/></svg>" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #0a0a0c;
      color: #e0e0e0;
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      overflow-x: hidden;
    }

    /* ---- Animated background grid ---- */
    .bg {
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
    }
    .bg canvas { width: 100%; height: 100%; }

    /* ---- Content layer ---- */
    .content {
      position: relative;
      z-index: 1;
      max-width: 800px;
      margin: 0 auto;
      padding: 60px 24px 40px;
    }

    /* ---- Hero ---- */
    .hero {
      text-align: center;
      margin-bottom: 48px;
    }
    .logo {
      width: 72px;
      height: 72px;
      margin: 0 auto 20px;
      animation: float 4s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    h1 {
      font-size: 40px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    h1 .war { color: #f87171; }
    .tagline {
      font-size: 17px;
      color: #888;
      margin-bottom: 20px;
    }
    .story {
      max-width: 560px;
      margin: 0 auto 28px;
      font-size: 15px;
      color: #666;
      line-height: 1.7;
    }
    .story em { color: #f87171; font-style: normal; }
    .story strong { color: #ccc; font-weight: 500; }

    .phase-strip {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-bottom: 0;
    }
    .phase {
      background: #141418;
      border: 1px solid #1e1e24;
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 12px;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .phase span { display: block; color: #999; font-size: 13px; text-transform: none; letter-spacing: 0; margin-top: 2px; }

    /* ---- Status bar ---- */
    .status-bar {
      display: flex;
      justify-content: center;
      gap: 32px;
      padding: 16px 0;
      margin: 36px 0;
      border-top: 1px solid #1a1a1e;
      border-bottom: 1px solid #1a1a1e;
    }
    .stat {
      text-align: center;
    }
    .stat .num {
      font-size: 28px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .stat .lbl {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
      margin-top: 2px;
    }
    .stat.live .num { color: #4ade80; }
    .stat.danger .num { color: #f87171; }
    .stat.info .num { color: #60a5fa; }
    .stat .num::before {
      content: '';
      display: inline-block;
      width: 6px; height: 6px;
      border-radius: 50%;
      margin-right: 6px;
      vertical-align: middle;
    }
    .stat.live .num::before { background: #4ade80; animation: pulse 2s ease-in-out infinite; }
    .stat.danger .num::before { background: #f87171; }
    .stat.info .num::before { background: #60a5fa; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* ---- Sections ---- */
    section { margin-bottom: 40px; }
    h2 {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #1a1a1e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ---- Agents ---- */
    .agent-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .agent-tag {
      background: #141418;
      border: 1px solid #1e1e24;
      border-radius: 6px;
      padding: 5px 14px;
      font-size: 13px;
      font-family: monospace;
    }
    .agent-dot {
      display: inline-block;
      width: 10px; height: 10px;
      border-radius: 2px;
      margin-right: 6px;
      vertical-align: middle;
    }
    .empty { color: #333; font-size: 13px; font-style: italic; }

    /* ---- CTA ---- */
    .cta-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      padding: 11px 22px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: #f87171;
      color: #fff;
      border-color: #f87171;
    }
    .btn-primary:hover { background: #ef4444; border-color: #ef4444; }
    .btn-secondary {
      background: transparent;
      color: #999;
      border-color: #2a2a2e;
    }
    .btn-secondary:hover { border-color: #444; color: #ccc; }

    /* ---- Code ---- */
    pre {
      background: #111114;
      border: 1px solid #1e1e24;
      border-radius: 10px;
      padding: 18px 20px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.6;
    }
    code { color: #ccc; }
    .kw { color: #c586c0; }
    .str { color: #ce9178; }
    .cmt { color: #444; }
    .fn { color: #dcdcaa; }

    /* ---- Tables ---- */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      text-align: left;
      color: #555;
      font-weight: 500;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 12px;
      border-bottom: 1px solid #1e1e24;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #111114;
      font-family: monospace;
      font-size: 12px;
    }
    td:last-child {
      font-family: system-ui, sans-serif;
      color: #666;
    }
    .arrow { color: #444; font-family: system-ui; }
    .dir-in { color: #f87171; }
    .dir-out { color: #4ade80; }

    /* ---- Footer ---- */
    footer {
      margin-top: 56px;
      padding: 20px 0;
      border-top: 1px solid #141418;
      color: #333;
      font-size: 12px;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Animated background -->
  <div class="bg">
    <canvas id="bgCanvas"></canvas>
  </div>

  <div class="content">

    <!-- Hero -->
    <div class="hero">
      <svg class="logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="84" height="84" rx="16" fill="#f87171" opacity="0.15" stroke="#f87171" stroke-width="1.5"/>
        <rect x="24" y="28" width="18" height="18" rx="5" fill="#f87171"/>
        <rect x="58" y="28" width="18" height="18" rx="5" fill="#f87171"/>
        <rect x="30" y="60" width="40" height="8" rx="4" fill="#f87171" opacity="0.6"/>
        <rect x="36" y="72" width="28" height="6" rx="3" fill="#f87171" opacity="0.3"/>
      </svg>

      <h1>Agent <span class="war">Wars</span></h1>
      <p class="tagline">Realtime multiplayer board &mdash; Socket.IO classroom exercise</p>

      <p class="story">
        The system is unstable. <em>Red incident zones</em> keep appearing across the board
        and someone needs to fix them. In phase one, you'll join the board and <strong>move manually</strong>.
        In phase two, you'll rush into <em>danger zones</em> to repair them before they spread.
        In phase three, you stop playing &mdash; and <strong>your code plays for you</strong>.
        Build an autonomous agent that detects incidents, navigates the board,
        and repairs zones faster than everyone else.
      </p>

      <div class="phase-strip">
        <div class="phase">Phase 1<span>Move</span></div>
        <div class="phase">Phase 2<span>Repair</span></div>
        <div class="phase">Phase 3<span>Automate</span></div>
      </div>
    </div>

    <!-- Live status -->
    <div class="status-bar">
      <div class="stat live">
        <div class="num">${agents.length}</div>
        <div class="lbl">Agents online</div>
      </div>
      <div class="stat danger">
        <div class="num">${activeZones.length}</div>
        <div class="lbl">Active zones</div>
      </div>
      <div class="stat info">
        <div class="num">${resolved}</div>
        <div class="lbl">Resolved</div>
      </div>
      <div class="stat">
        <div class="num" style="color:#888">${connectedSockets}</div>
        <div class="lbl">Sockets</div>
      </div>
    </div>

    <!-- Connected agents -->
    <section>
      <h2>Connected agents</h2>
      ${agents.length > 0
        ? `<div class="agent-list">${agents.map((a) =>
            `<span class="agent-tag"><span class="agent-dot" style="background:${a.color}"></span>${a.name}</span>`
          ).join('')}</div>`
        : '<p class="empty">No agents connected &mdash; be the first</p>'
      }
    </section>

    <!-- Get started -->
    <section>
      <h2>Get started</h2>
      <p style="margin-bottom: 14px; color: #666; font-size: 14px;">
        Download the sample client and double-click to open in your browser. Or build your own from scratch.
      </p>
      <div class="cta-row">
        <a class="btn btn-primary" href="/client.html" download="agent-wars-client.html">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download client
        </a>
        <a class="btn btn-secondary" href="#quick-connect">
          Build from scratch
        </a>
      </div>
    </section>

    <!-- Quick connect -->
    <section id="quick-connect">
      <h2>Quick connect</h2>
<pre><code><span class="cmt">// 1. Add Socket.IO client</span>
&lt;script src=<span class="str">"https://cdn.socket.io/4.7.5/socket.io.min.js"</span>&gt;&lt;/script&gt;

<span class="cmt">// 2. Connect to this server</span>
<span class="kw">const</span> socket = <span class="fn">io</span>(<span class="str">'https://agent-wars-server-ujkj.onrender.com'</span>);

<span class="cmt">// 3. Join the board</span>
socket.<span class="fn">emit</span>(<span class="str">'agent:join'</span>, { name: <span class="str">'YourName'</span> }, (res) =&gt; {
  console.<span class="fn">log</span>(<span class="str">'Joined!'</span>, res.agent);
});

<span class="cmt">// 4. Move your agent</span>
socket.<span class="fn">emit</span>(<span class="str">'agent:move'</span>, { x: <span class="num">400</span>, y: <span class="num">300</span> });

<span class="cmt">// 5. Claim &amp; repair a zone</span>
socket.<span class="fn">emit</span>(<span class="str">'zone:claim'</span>, { zoneId: <span class="str">'zone-id'</span> });</code></pre>
    </section>

    <!-- Protocol -->
    <section>
      <h2>Protocol</h2>
      <table>
        <tr><th>Event</th><th>Direction</th><th>Purpose</th></tr>
        <tr><td>agent:join</td><td class="dir-in">&rarr; server</td><td>Join the board</td></tr>
        <tr><td>agent:move</td><td class="dir-in">&rarr; server</td><td>Update your position</td></tr>
        <tr><td>zone:claim</td><td class="dir-in">&rarr; server</td><td>Start repairing a zone</td></tr>
        <tr><td>agent:welcome</td><td class="dir-out">&larr; server</td><td>Your agent + world snapshot</td></tr>
        <tr><td>agent:joined</td><td class="dir-out">&larr; server</td><td>Another agent connected</td></tr>
        <tr><td>agent:moved</td><td class="dir-out">&larr; server</td><td>An agent changed position</td></tr>
        <tr><td>agent:left</td><td class="dir-out">&larr; server</td><td>An agent disconnected</td></tr>
        <tr><td>zone:spawned</td><td class="dir-out">&larr; server</td><td>New incident zone appeared</td></tr>
        <tr><td>zone:updated</td><td class="dir-out">&larr; server</td><td>Zone state changed</td></tr>
        <tr><td>zone:resolved</td><td class="dir-out">&larr; server</td><td>Zone was repaired</td></tr>
      </table>
    </section>

    <!-- Constants -->
    <section>
      <h2>Board constants</h2>
      <table>
        <tr><th>Parameter</th><th>Value</th></tr>
        <tr><td>Board size</td><td>1200 &times; 800 px</td></tr>
        <tr><td>Agent size</td><td>40 px</td></tr>
        <tr><td>Zone spawn interval</td><td>8 seconds</td></tr>
        <tr><td>Max active zones</td><td>5</td></tr>
        <tr><td>Repair duration</td><td>2 seconds</td></tr>
        <tr><td>Zone radius</td><td>40 &ndash; 80 px</td></tr>
        <tr><td>Zone severity</td><td>1 &ndash; 5</td></tr>
      </table>
    </section>

    <footer>
      Agent Wars &mdash; Elisava classroom exercise
    </footer>

  </div>

  <!-- Background animation: floating grid + drifting red zones -->
  <script>
    (function() {
      const c = document.getElementById('bgCanvas');
      const ctx = c.getContext('2d');
      let w, h;

      function resize() {
        w = c.width = window.innerWidth;
        h = c.height = window.innerHeight;
      }
      resize();
      window.addEventListener('resize', resize);

      // Grid nodes
      const cols = 24;
      const rows = 16;
      const nodes = [];
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          nodes.push({
            baseX: i / cols,
            baseY: j / rows,
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.4,
            amp: 0.002 + Math.random() * 0.003,
          });
        }
      }

      // Floating zones
      const zones = [];
      for (let i = 0; i < 4; i++) {
        zones.push({
          x: Math.random(),
          y: Math.random(),
          r: 30 + Math.random() * 50,
          vx: (Math.random() - 0.5) * 0.0002,
          vy: (Math.random() - 0.5) * 0.0002,
          pulse: Math.random() * Math.PI * 2,
        });
      }

      function draw(t) {
        ctx.clearRect(0, 0, w, h);

        // Draw zones
        for (const z of zones) {
          z.x += z.vx;
          z.y += z.vy;
          if (z.x < 0 || z.x > 1) z.vx *= -1;
          if (z.y < 0 || z.y > 1) z.vy *= -1;
          z.pulse += 0.015;

          const pulse = 0.6 + Math.sin(z.pulse) * 0.4;
          const grd = ctx.createRadialGradient(
            z.x * w, z.y * h, 0,
            z.x * w, z.y * h, z.r * 1.5
          );
          grd.addColorStop(0, 'rgba(248, 113, 113, ' + (0.06 * pulse) + ')');
          grd.addColorStop(1, 'rgba(248, 113, 113, 0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(z.x * w, z.y * h, z.r * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 0.5;
        const getPos = (n, time) => ({
          x: (n.baseX + Math.sin(time * n.speed + n.phase) * n.amp) * w,
          y: (n.baseY + Math.cos(time * n.speed + n.phase * 1.3) * n.amp) * h,
        });

        const perRow = rows + 1;
        const time = t * 0.001;

        // Horizontal
        for (let i = 0; i <= cols; i++) {
          ctx.beginPath();
          for (let j = 0; j <= rows; j++) {
            const p = getPos(nodes[i * perRow + j], time);
            j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }
        // Vertical
        for (let j = 0; j <= rows; j++) {
          ctx.beginPath();
          for (let i = 0; i <= cols; i++) {
            const p = getPos(nodes[i * perRow + j], time);
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }

        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
    })();
  </script>

</body>
</html>`;
}
