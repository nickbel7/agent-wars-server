// ---------------------------------------------------------------------------
// protocol.js — Socket.IO event names and board constants
// ---------------------------------------------------------------------------

// Board dimensions
export const BOARD = {
  WIDTH: 1200,
  HEIGHT: 800,
};

// Agent defaults
export const AGENT_DEFAULTS = {
  SIZE: 40,
  COLOR: '#4A90D9',
};

// Zone settings
export const ZONE = {
  SPAWN_INTERVAL_MS: 8000,
  MAX_ACTIVE: 5,
  REPAIR_DURATION_MS: 2000,
  MIN_RADIUS: 40,
  MAX_RADIUS: 80,
  MIN_SEVERITY: 1,
  MAX_SEVERITY: 5,
};

// SVG validation limits
export const SVG = {
  MAX_LENGTH: 10000,
};

// ---- Client → Server events ------------------------------------------------

export const C2S = {
  JOIN: 'agent:join',
  MOVE: 'agent:move',
  CLAIM_ZONE: 'zone:claim',
  LEAVE: 'disconnect',
};

// ---- Server → Client events ------------------------------------------------

export const S2C = {
  WELCOME: 'agent:welcome',
  AGENT_JOINED: 'agent:joined',
  AGENT_MOVED: 'agent:moved',
  AGENT_LEFT: 'agent:left',
  ZONE_SPAWNED: 'zone:spawned',
  ZONE_UPDATED: 'zone:updated',
  ZONE_RESOLVED: 'zone:resolved',
  SNAPSHOT: 'world:snapshot',
};
