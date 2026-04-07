// ---------------------------------------------------------------------------
// state.js — In-memory world state (agents + zones)
// ---------------------------------------------------------------------------

import { BOARD, AGENT_DEFAULTS, SVG, ZONE } from './protocol.js';
import crypto from 'node:crypto';

// ---- Storage ---------------------------------------------------------------

/** @type {Map<string, object>} socketId → agent */
const agents = new Map();

/** @type {Map<string, object>} zoneId → zone */
const zones = new Map();

// ---- Helpers ---------------------------------------------------------------

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isValidSvg(shape) {
  if (typeof shape !== 'string') return false;
  if (shape.length > SVG.MAX_LENGTH) return false;
  if (!shape.includes('<svg')) return false;
  // Reject obvious script injection attempts
  if (/<script/i.test(shape)) return false;
  if (/on\w+\s*=/i.test(shape)) return false;
  return true;
}

// ---- Agent operations ------------------------------------------------------

export function addAgent(socketId, { name, color, shape }) {
  const agent = {
    id: socketId,
    name: String(name || 'anonymous').slice(0, 30),
    x: randomInRange(50, BOARD.WIDTH - 50),
    y: randomInRange(50, BOARD.HEIGHT - 50),
    size: AGENT_DEFAULTS.SIZE,
    color: typeof color === 'string' ? color.slice(0, 20) : AGENT_DEFAULTS.COLOR,
    shape: isValidSvg(shape) ? shape : null,
    connectedAt: Date.now(),
  };
  agents.set(socketId, agent);
  return agent;
}

export function removeAgent(socketId) {
  const agent = agents.get(socketId);
  agents.delete(socketId);

  // Release any zones claimed by this agent
  for (const zone of zones.values()) {
    if (zone.claimedBy === socketId) {
      zone.claimedBy = null;
      zone.repairStartedAt = null;
    }
  }

  return agent;
}

export function moveAgent(socketId, x, y) {
  const agent = agents.get(socketId);
  if (!agent) return null;
  agent.x = clamp(x, 0, BOARD.WIDTH);
  agent.y = clamp(y, 0, BOARD.HEIGHT);
  return agent;
}

export function getAgent(socketId) {
  return agents.get(socketId);
}

export function getAllAgents() {
  return [...agents.values()];
}

// ---- Zone operations -------------------------------------------------------

export function spawnZone() {
  const activeCount = [...zones.values()].filter((z) => z.status === 'active').length;
  if (activeCount >= ZONE.MAX_ACTIVE) return null;

  const id = crypto.randomUUID();
  const radius = randomInRange(ZONE.MIN_RADIUS, ZONE.MAX_RADIUS);
  const zone = {
    id,
    x: randomInRange(radius, BOARD.WIDTH - radius),
    y: randomInRange(radius, BOARD.HEIGHT - radius),
    radius,
    severity: randomInRange(ZONE.MIN_SEVERITY, ZONE.MAX_SEVERITY),
    status: 'active',
    spawnedAt: Date.now(),
    resolvedAt: null,
    claimedBy: null,
    repairStartedAt: null,
  };
  zones.set(id, zone);
  return zone;
}

export function claimZone(zoneId, socketId) {
  const zone = zones.get(zoneId);
  if (!zone || zone.status !== 'active') return null;

  const agent = agents.get(socketId);
  if (!agent) return null;

  // Check if agent is inside the zone
  const dx = agent.x - zone.x;
  const dy = agent.y - zone.y;
  if (Math.sqrt(dx * dx + dy * dy) > zone.radius) return null;

  zone.claimedBy = socketId;
  zone.repairStartedAt = Date.now();
  return zone;
}

export function tickZones() {
  const resolved = [];
  const now = Date.now();

  for (const zone of zones.values()) {
    if (zone.status !== 'active' || !zone.claimedBy || !zone.repairStartedAt) continue;

    const agent = agents.get(zone.claimedBy);

    // If the claiming agent disconnected or left the zone, release the claim
    if (!agent) {
      zone.claimedBy = null;
      zone.repairStartedAt = null;
      continue;
    }

    const dx = agent.x - zone.x;
    const dy = agent.y - zone.y;
    if (Math.sqrt(dx * dx + dy * dy) > zone.radius) {
      zone.claimedBy = null;
      zone.repairStartedAt = null;
      continue;
    }

    // Check if repair duration has elapsed
    if (now - zone.repairStartedAt >= ZONE.REPAIR_DURATION_MS) {
      zone.status = 'resolved';
      zone.resolvedAt = now;
      resolved.push(zone);
    }
  }

  return resolved;
}

export function getActiveZones() {
  return [...zones.values()].filter((z) => z.status === 'active');
}

export function getAllZones() {
  return [...zones.values()];
}
