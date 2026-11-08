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

Browser review still required: forward/backward drag, long task titles, mobile
horizontal scrolling, resize during transport, and the visual quality of the
existing run atlas as Slinky locomotion. No replacement artwork is included.
Full lint, project typecheck and build have not been validated in this checkout.
