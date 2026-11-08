# Mola transport

The board keeps its existing task commit and locking behavior. Transport adds a
toolbar-relative home, seeking and return legs. The existing directional atlas
rows drive walking, preserving the rainbow artwork. A single RAF owns the timeline.
Walking poses advance every 100 ms; position updates on every animation frame.
The sprite floor stays anchored while the card follows its calibrated top coil.

Transport states are exposed in `data-state`: IDLE, SEEKING_TASK, PICKING_TASK,
CARRYING_TASK, DELIVERING_TASK and RETURNING. Legacy phase names remain available
for existing consumers. Delivery is committed after the delivery phase, once.
Cancellation clears RAF without committing; missing DOM uses the board's existing
completion fallback. Reduced motion skips transport, including preference changes.

Run `node --experimental-strip-types scripts/test-mola-transport.mjs` on Node 22.13+.
Tests cover phase continuity, pose timing independent of travel, complete lifecycle,
cancellation, missing elements and reduced motion without extra dependencies.

Unloaded motion uses `slinky.ts` to deform narrow strips of the existing idle
atlas, preserving its face, palette and pixel texture. The leading support lifts
first, then the trailing support follows. A separate continuous jump envelope
adds anticipation, a 62 atlas-pixel airborne arc, landing compression and settling.
The hero has gentler repeating hops; seeking and returning have full hops.
Carrying uses the original directional walking sprites at 10 FPS. Collection
switches to the atlas; delivery switches back to the elastic movement.
The canvas uses the existing animation loops and adds no timers or dependencies.

Validation: TypeScript and lint on the changed animation modules pass. The
transport tests also cover alternating supports, jump phase continuity, visible
flight and landing. Chrome browser checks passed for desktop, mobile and reduced
motion, with no page errors; seeking/returning used Slinky and carrying used walk.
