// ---------------------------------------------------------------------------
// gameLoop.js — Periodic zone spawning and repair tick
// ---------------------------------------------------------------------------

import { spawnZone, tickZones } from './state.js';
import { ZONE, S2C } from './protocol.js';

let spawnTimer = null;
let tickTimer = null;

/**
 * Start the game loop.
 * @param {import('socket.io').Server} io
 */
export function startGameLoop(io) {
  // Spawn a new zone on a fixed interval
  spawnTimer = setInterval(() => {
    const zone = spawnZone();
    if (zone) {
      io.emit(S2C.ZONE_SPAWNED, zone);
    }
  }, ZONE.SPAWN_INTERVAL_MS);

  // Tick zone repairs every 500 ms
  tickTimer = setInterval(() => {
    const resolved = tickZones();
    for (const zone of resolved) {
      io.emit(S2C.ZONE_RESOLVED, zone);
    }
  }, 500);
}

export function stopGameLoop() {
  clearInterval(spawnTimer);
  clearInterval(tickTimer);
}
