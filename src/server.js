// ---------------------------------------------------------------------------
// server.js — Entry point: Node http + Socket.IO realtime classroom server
// ---------------------------------------------------------------------------

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

import { C2S, S2C } from './protocol.js';
import {
  addAgent,
  removeAgent,
  moveAgent,
  getAllAgents,
  getActiveZones,
  claimZone,
} from './state.js';
import { startGameLoop } from './gameLoop.js';
import { renderLanding } from './landing.js';

const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---- HTTP server -----------------------------------------------------------

const httpServer = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    const html = renderLanding(io.engine.clientsCount);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (req.method === 'GET' && req.url === '/client.html') {
    try {
      const file = await readFile(join(ROOT, 'client.html'), 'utf-8');
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'attachment; filename="agent-wars-client.html"',
      });
      res.end(file);
    } catch {
      res.writeHead(404);
      res.end('client.html not found');
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/api/status') {
    const data = {
      status: 'ok',
      agents: getAllAgents().length,
      activeZones: getActiveZones().length,
      sockets: io.engine.clientsCount,
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// ---- Socket.IO -------------------------------------------------------------

const io = new Server(httpServer, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  console.log(`+ socket connected: ${socket.id}`);

  // ---- agent:join ----------------------------------------------------------
  socket.on(C2S.JOIN, (payload, ack) => {
    if (!payload || typeof payload.name !== 'string') {
      return typeof ack === 'function' && ack({ error: 'name is required' });
    }

    const agent = addAgent(socket.id, payload);

    const welcome = {
      agent,
      agents: getAllAgents(),
      zones: getActiveZones(),
    };

    if (typeof ack === 'function') {
      ack(welcome);
    }
    socket.emit(S2C.WELCOME, welcome);

    socket.broadcast.emit(S2C.AGENT_JOINED, agent);
    console.log(`  agent joined: ${agent.name} (${agent.id})`);
  });

  // ---- agent:move ----------------------------------------------------------
  socket.on(C2S.MOVE, ({ x, y } = {}) => {
    if (typeof x !== 'number' || typeof y !== 'number') return;
    const agent = moveAgent(socket.id, x, y);
    if (agent) {
      socket.broadcast.emit(S2C.AGENT_MOVED, { id: agent.id, x: agent.x, y: agent.y });
    }
  });

  // ---- zone:claim ----------------------------------------------------------
  socket.on(C2S.CLAIM_ZONE, ({ zoneId } = {}, ack) => {
    if (typeof zoneId !== 'string') return;
    const zone = claimZone(zoneId, socket.id);
    if (zone) {
      io.emit(S2C.ZONE_UPDATED, zone);
    }
    if (typeof ack === 'function') {
      ack(zone ? { ok: true, zone } : { ok: false });
    }
  });

  // ---- disconnect ----------------------------------------------------------
  socket.on('disconnect', () => {
    const agent = removeAgent(socket.id);
    if (agent) {
      io.emit(S2C.AGENT_LEFT, { id: agent.id });
      console.log(`  agent left: ${agent.name} (${agent.id})`);
    }
    console.log(`- socket disconnected: ${socket.id}`);
  });
});

// ---- Start -----------------------------------------------------------------

startGameLoop(io);

httpServer.listen(PORT, () => {
  console.log(`Realtime classroom server listening on http://localhost:${PORT}`);
});
