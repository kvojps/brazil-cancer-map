import assert from 'node:assert/strict';
import { test } from 'node:test';
import { framingPaddings } from '../src/map/framing.ts';

const MAP = { left: 0, top: 104, right: 880, bottom: 757 };
const LEGEND = { left: 0, top: 557, right: 216, bottom: 757 };
const NOTE = { left: 0, top: 104, right: 288, bottom: 184 };
const NOTHING = [{ top: 24, right: 24, bottom: 24, left: 24 }];

test('a legend in the map corner offers reserving its width or its height', () => {
  assert.deepEqual(framingPaddings(MAP, { legend: LEGEND }, 24), [
    { top: 24, right: 24, bottom: 24, left: 240 },
    { top: 24, right: 24, bottom: 224, left: 24 },
  ]);
});

test('a caveat over the map joins the reservation: the widest of the two, or both heights', () => {
  assert.deepEqual(framingPaddings(MAP, { legend: LEGEND, note: NOTE }, 24), [
    { top: 24, right: 24, bottom: 24, left: 312 },
    { top: 104, right: 24, bottom: 224, left: 24 },
  ]);
});

test('a legend or caveat outside the map, as around it on small screens, reserves nothing', () => {
  const legend = { left: 0, top: 757, right: 320, bottom: 1000 };
  const note = { left: 0, top: 40, right: 320, bottom: 104 };
  assert.deepEqual(framingPaddings(MAP, { legend, note }, 24), NOTHING);
});

test('hidden elements, with no box, reserve nothing', () => {
  const empty = { left: 0, top: 0, right: 0, bottom: 0 };
  assert.deepEqual(framingPaddings(MAP, { legend: empty, note: empty }, 24), NOTHING);
  assert.deepEqual(framingPaddings(MAP, {}, 24), NOTHING);
});
