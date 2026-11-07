// Walks the tour route and fails if the camera clips a wall, door frame or furniture:
//   node scripts/check-tour.mjs
import assert from 'node:assert/strict';
import { CatmullRomCurve3, Vector3 } from 'three';
import { KEYS, STOP_KEYS, OUTER, PARTITIONS, FURNITURE, DOOR, WALL, EYE } from '../src/tour/route.js';

const CLEAR = 0.25; // Camera body plus near plane.
const pos = new CatmullRomCurve3(KEYS.map((k) => new Vector3(k.p[0], EYE, k.p[1])), false, 'centripetal');
const look = new CatmullRomCurve3(KEYS.map((k) => new Vector3(...k.l)), false, 'centripetal');

const SAMPLES = 4000;
for (let i = 0; i <= SAMPLES; i += 1) {
  const t = i / SAMPLES;
  const { x, z } = pos.getPoint(t);
  const at = `t=${t.toFixed(4)} (${x.toFixed(2)}, ${z.toFixed(2)})`;
  assert.ok(Math.abs(x) < OUTER.x - CLEAR && z < OUTER.back - CLEAR && z > OUTER.end + CLEAR, `outer wall ${at}`);
  PARTITIONS.forEach((w) => {
    if (Math.abs(z - w.z) < CLEAR + WALL / 2) assert.ok(Math.abs(x - w.x) < DOOR.w / 2 - CLEAR, `door z=${w.z} ${at}`);
  });
  FURNITURE.forEach(([x1, z1, x2, z2]) => {
    const inside = x > x1 - CLEAR && x < x2 + CLEAR && z > z1 - CLEAR && z < z2 + CLEAR;
    assert.ok(!inside, `furniture ${[x1, z1, x2, z2]} ${at}`);
  });
  assert.ok(look.getPoint(t).distanceTo(pos.getPoint(t)) > 1.5, `look target too close ${at}`);
}

assert.equal(STOP_KEYS.at(-1), KEYS.length - 1, 'the last stop must end the route');
console.log(`Tour route clear: ${SAMPLES} samples, ${KEYS.length} keys, ${STOP_KEYS.length} stops.`);
