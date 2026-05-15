# Step 2 — Phase 2: Detect Zones & Repair

## What was built

Extended `/clients/nikos/index.html` with full zone detection, claiming, and repair mechanics.

### Implementation details

**Zone rendering**
- Zones drawn as radial-gradient circles with severity-coded colours:
  - SEV 1 = green, SEV 2 = yellow, SEV 3 = amber, SEV 4 = orange, SEV 5 = red
- Pulsing `Math.sin()` radius animation on unclaimed active zones
- Sweeping arc progress indicator on the zone ring during the repair window (drawn using the zone's `repairStartedAt` timestamp)
- Resolved zones shown with a dashed green ring + "RESOLVED" label, then auto-removed after 3 s

**Auto-claim logic**
- On every `click` or `keydown` movement, the client checks `Math.hypot(z.x - x, z.y - y) <= z.radius` for all active zones
- If inside a zone → emits `zone:claim { zoneId }` immediately

**Repair progress overlay**
- DOM overlay `<div>` injected absolutely over the canvas using `getBoundingClientRect()` + CSS scale maths
- Contains a progress bar `<div>` whose `width` animates from 0 % → 100 % over `REPAIR_MS = 2000` ms via `requestAnimationFrame`
- Overlay repositioned every render frame so it follows the zone correctly even if the canvas is CSS-scaled
- Removed when `zone:resolved` fires

**Stats tracking**
- `zone:resolved` increments `myZonesFixed` and `myScore` (severity × 100) if we were the claimer
- Stats HUD in header updated live: Score, Zones Fixed, Time (mm:ss), Agents online

**Sidebar zone list**
- Active zones listed with severity badge and status (`active` / `repairing` / `resolved`)
- Colour-coded borders match zone severity

## Files changed
- `clients/nikos/index.html` — extended (zones, repair, stats)
- `clients/nikos/README.md` — created
