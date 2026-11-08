// Node >=22.13: node --experimental-strip-types scripts/test-mola-transport.mjs
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Resolve the app's extensionless TS imports without adding a test dependency.
const dir = await mkdtemp(join(tmpdir(), 'mola-test-'));
try {
  for (const name of ['atlas', 'physics', 'transport', 'slinky']) {
    const source = await readFile(new URL(`../components/mola/${name}.ts`, import.meta.url), 'utf8');
    await writeFile(join(dir, `${name}.ts`), source.replace(/from "\.\/(atlas|physics)"/g, 'from "./$1.ts"'));
  }
  const { runTransport, buildWaypoints, samplePath } = await import(pathToFileURL(join(dir, 'transport.ts')));
  const home = { x: 80, y: 80 }, from = { x: 200, y: 180 }, to = { x: 600, y: 150 };
  const wp = buildWaypoints(from, to, home);
  const phases = ['seek', 'compress', 'reach', 'carry', 'deliver', 'celebrate', 'return', 'idle'];
  for (let i = 1; i < phases.length; i++) {
    const a = samplePath(wp, phases[i - 1], 1), b = samplePath(wp, phases[i], 0);
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 1e-9, `continuous ${phases[i]}`);
  }
  const { slinkyOffsets, slinkyHop } = await import(pathToFileURL(join(dir, 'slinky.ts')));
  const pose = cycle => ({ cycle, strength: 1, facing: 1 });
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const a = slinkyOffsets(t, pose(1 - 1e-8)), b = slinkyOffsets(t, pose(0));
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 1e-4, 'seamless Slinky cycle');
    const rest = slinkyOffsets(t, { ...pose(0.3), strength: 0 });
    assert.ok(rest.x === 0 && rest.y === 0, 'reduced motion is static');
  }
  assert.ok(slinkyOffsets(1, pose(0.25)).y < -20, 'front lifts first');
  assert.ok(Math.abs(slinkyOffsets(0, pose(0.25)).y) < 1e-9, 'rear stays planted');
  assert.ok(slinkyOffsets(0, pose(0.75)).y < -20, 'rear follows later');
  assert.ok(Math.abs(slinkyOffsets(1, pose(0.75)).y) < 1e-9, 'front supports second half');
  for (const joint of [0.16, 0.76, 1]) {
    const a = slinkyHop(joint - 1e-8), b = slinkyHop(joint);
    assert.ok(Math.abs(a.lift - b.lift) < 1e-4 && Math.abs(a.stretch - b.stretch) < 1e-4, 'continuous jump phases');
  }
  assert.ok(slinkyHop(0.12).stretch < 0.9, 'anticipation compression');
  assert.ok(slinkyHop(0.46).lift > 60, 'visible airborne phase');
  assert.equal(slinkyHop(0.85).lift, 0, 'landing touches ground');
  let queue = new Map(), serial = 0;
  globalThis.requestAnimationFrame = cb => { queue.set(++serial, cb); return serial; };
  globalThis.cancelAnimationFrame = id => queue.delete(id);
  globalThis.window = { matchMedia: () => ({ matches: false }) };
  let frames = [], completions = [];
  const options = { getHome: () => home, getFrom: () => from, getTo: () => to, onFrame: s => frames.push(s), onComplete: s => completions.push(s) };
  const tick = now => { const pending = [...queue.values()]; queue.clear(); pending.forEach(cb => cb(now)); };
  runTransport(options);
  for (let now = 1000; now < 7000; now += 10) tick(now);
  assert.deepEqual([...new Set(frames.map(s => s.phase))], phases);
  assert.deepEqual(completions, [{ aborted: false }]);
  assert.equal(queue.size, 0);
  const carry = frames.filter(s => s.phase === 'carry');
  const switches = carry.flatMap((s, i) => i && s.clipFrame !== carry[i - 1].clipFrame ? [i] : []);
  for (let i = 1; i < switches.length; i++) assert.equal(switches[i] - switches[i - 1], 10, 'poses every 100ms');
  assert.ok(carry.some((s, i) => i && s.clipFrame === carry[i - 1].clipFrame && s.x !== carry[i - 1].x), 'position advances between poses');
  frames = []; completions = [];
  const cancel = runTransport(options); tick(1000); cancel(); tick(1100);
  assert.equal(queue.size, 0); assert.equal(completions.length, 0);
  runTransport({ ...options, getFrom: () => null });
  assert.deepEqual(completions, [{ aborted: true }]);
  completions = [];
  runTransport({ ...options, reducedMotion: true });
  assert.deepEqual(completions, [{ aborted: false }]); assert.equal(queue.size, 0);
  console.log('PASS: phase continuity, lifecycle, 10 FPS, smooth travel, cancellation, missing DOM, reduced motion');
} finally { await rm(dir, { recursive: true, force: true }); }
