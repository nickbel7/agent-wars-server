// ---------------------------------------------------------------------------
// server.js — Entry point: Node http + Socket.IO realtime classroom server
// ---------------------------------------------------------------------------

import { createServer } from 'node:http';
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

const PORT = process.env.PORT || 3000;

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
});

const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// ---- Socket.IO handler -----------------------------------------------------

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
