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

test('what rests on the bottom of a phone map is reserved from its topmost edge, whatever else is on the map', () => {
  const map = { left: 0, top: 80, right: 390, bottom: 844 };
  const sheet = { left: 0, top: 600, right: 390, bottom: 844 };
  const button = { left: 8, top: 548, right: 120, bottom: 592 };
  const controls = { left: 8, top: 140, right: 340, bottom: 184 };
  assert.deepEqual(framingPaddings(map, { floor: [sheet, button] }, 24), [{ top: 24, right: 24, bottom: 320, left: 24 }]);
  assert.deepEqual(framingPaddings(map, { controls, floor: [sheet, button] }, 24), [
    { top: 24, right: 24, bottom: 320, left: 364 },
    { top: 128, right: 24, bottom: 320, left: 24 },
  ]);
});

test('a floor beside the map, as the panel on a desktop, or with no box reserves nothing', () => {
  const beside = { left: 880, top: 104, right: 1280, bottom: 757 };
  assert.deepEqual(framingPaddings(MAP, { floor: [beside, { left: 0, top: 0, right: 0, bottom: 0 }] }, 24), NOTHING);
});

test('hidden elements, with no box, reserve nothing', () => {
  const empty = { left: 0, top: 0, right: 0, bottom: 0 };
  assert.deepEqual(framingPaddings(MAP, { legend: empty, note: empty }, 24), NOTHING);
  assert.deepEqual(framingPaddings(MAP, {}, 24), NOTHING);
});

test('floating controls over the top of the map join the caveat in the reservation', () => {
  const phone = { left: 0, top: 73, right: 390, bottom: 664 };
  const controls = { left: 8, top: 133, right: 300, bottom: 177 };
  const legend = { left: 8, top: 510, right: 150, bottom: 656 };
  assert.deepEqual(framingPaddings(phone, { legend, controls }, 8), [
    { top: 8, right: 8, bottom: 8, left: 308 },
    { top: 112, right: 8, bottom: 162, left: 8 },
  ]);
  const note = { left: 8, top: 185, right: 200, bottom: 225 };
  assert.equal(framingPaddings(phone, { legend, controls, note }, 8)[1].top, 160);
});
