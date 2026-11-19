import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMapCamera } from '../../src/map/camera.ts';

/** A renderer that records what the camera asked of it; `visible` stands for a map that takes up space. */
function fakeRenderer({ visible = true } = {}) {
  const calls = [];
  return {
    calls,
    visible,
    isVisible() { return this.visible; },
    frameCountry() { calls.push(['frameCountry']); },
    resetCountry() { calls.push(['resetCountry']); },
    focusMunicipality(code, options) { calls.push(['focus', code, options]); },
    highlightMunicipality(code) { calls.push(['highlight', code]); },
    clearMunicipality() { calls.push(['clear']); },
  };
}

const FRAME = { preserveCamera: false, revealOutside: false };
const PRESERVE = { preserveCamera: true, revealOutside: false };

test('the first layer frames the country once, and a second layer does not frame it again', () => {
  const camera = createMapCamera();
  const renderer = fakeRenderer();
  camera.attach(renderer);
  renderer.calls.length = 0;
  camera.layerShown(true);
  camera.layerShown(false);
  camera.layerShown(true);
  assert.deepEqual(renderer.calls, [['frameCountry']]);
});

test('the country waits for a visible map with no municipality selected', () => {
  const camera = createMapCamera();
  const renderer = fakeRenderer({ visible: false });
  camera.layerShown(true);
  camera.attach(renderer);
  renderer.calls.length = 0;
  camera.mapResized();
  assert.deepEqual(renderer.calls, [], 'the list view hides the map');
  renderer.visible = true;
  camera.mapResized();
  assert.deepEqual(renderer.calls, [['frameCountry']], 'the map that shows again frames the country');

  const selected = createMapCamera();
  const other = fakeRenderer();
  selected.attach(other);
  selected.select('261160');
  other.calls.length = 0;
  selected.layerShown(true);
  selected.mapResized();
  assert.deepEqual(other.calls, [], 'a selected municipality replaces the country');
});

test('a selection made before the map exists frames the municipality once it is attached', () => {
  const camera = createMapCamera();
  camera.layerShown(true);
  camera.select('261160');
  const renderer = fakeRenderer();
  camera.attach(renderer);
  camera.layerShown(true);
  assert.deepEqual(renderer.calls, [['focus', '261160', FRAME]]);
});

test('a gesture before the map exists leaves the camera alone once it is attached', () => {
  const camera = createMapCamera();
  camera.layerShown(true);
  camera.select('261160');
  camera.userTookOver();
  const renderer = fakeRenderer();
  camera.attach(renderer);
  camera.layerShown(true);
  camera.mapResized();
  assert.deepEqual(renderer.calls, [['highlight', '261160']]);
});

test('a gesture with an arrival pending cancels it, and selecting another municipality arrives again', () => {
  const camera = createMapCamera();
  camera.select('261160');
  camera.userTookOver();
  camera.select('240810');
  const renderer = fakeRenderer();
  camera.attach(renderer);
  assert.deepEqual(renderer.calls, [['focus', '240810', FRAME]]);

  const late = createMapCamera();
  late.select('261160');
  late.userTookOver();
  late.select('261160');
  const lateRenderer = fakeRenderer();
  late.attach(lateRenderer);
  assert.deepEqual(lateRenderer.calls, [['highlight', '261160']], 'the same municipality keeps the gesture');
});

test('the logo frames the country again even with an arrival pending, and the old arrival never happens (#48)', () => {
  const camera = createMapCamera();
  camera.layerShown(true);
  camera.select('261160');
  camera.userTookOver();
  camera.clear();
  camera.resetCountry();
  const renderer = fakeRenderer();
  camera.attach(renderer);
  assert.deepEqual(renderer.calls, [['clear'], ['frameCountry']], 'the reset restores the arrival of the country');

  const hidden = fakeRenderer({ visible: false });
  const attached = createMapCamera();
  attached.attach(hidden);
  attached.layerShown(true);
  attached.select('261160');
  hidden.calls.length = 0;
  attached.clear();
  attached.resetCountry();
  hidden.visible = true;
  attached.mapResized();
  attached.mapResized();
  assert.deepEqual(hidden.calls, [['clear'], ['resetCountry'], ['resetCountry']], 'the hidden selection is not framed afterwards');
});

test('a selection that preserves the camera only reveals the municipality', () => {
  const camera = createMapCamera();
  const renderer = fakeRenderer();
  camera.attach(renderer);
  renderer.calls.length = 0;
  camera.select('261160', { preserveCamera: true });
  assert.deepEqual(renderer.calls, [['focus', '261160', PRESERVE]]);
});

test('a selection on a hidden map is framed when the map shows again', () => {
  const camera = createMapCamera();
  const renderer = fakeRenderer({ visible: false });
  camera.attach(renderer);
  camera.layerShown(true);
  renderer.calls.length = 0;
  camera.select('261160');
  camera.mapResized();
  renderer.visible = true;
  camera.mapResized();
  camera.mapResized();
  assert.deepEqual(renderer.calls, [
    ['focus', '261160', FRAME],
    ['focus', '261160', { preserveCamera: false, revealOutside: true }],
  ]);
});

test('a layout change reveals the selected municipality preserving the camera, unless the sheet covers the map', () => {
  const camera = createMapCamera();
  const renderer = fakeRenderer();
  camera.layoutChanged({ sheetOpen: false });
  camera.attach(renderer);
  camera.layoutChanged({ sheetOpen: false });
  camera.select('261160');
  renderer.calls.length = 0;
  camera.layoutChanged({ sheetOpen: true });
  renderer.visible = false;
  camera.layoutChanged({ sheetOpen: false });
  renderer.visible = true;
  camera.layoutChanged({ sheetOpen: false });
  assert.deepEqual(renderer.calls, [['focus', '261160', PRESERVE]]);
});

test('clearing the selection removes the outline without moving the camera', () => {
  const camera = createMapCamera();
  const renderer = fakeRenderer();
  camera.attach(renderer);
  camera.layerShown(true);
  camera.select('261160');
  renderer.calls.length = 0;
  camera.clear();
  camera.layerShown(true);
  camera.mapResized();
  camera.layoutChanged({ sheetOpen: false });
  assert.deepEqual(renderer.calls, [['clear']]);
});

test('a second renderer after a failure receives the current state without reopening a cancelled arrival (#49)', () => {
  const camera = createMapCamera();
  camera.layerShown(true);
  camera.attach(fakeRenderer());
  camera.select('261160');
  camera.userTookOver();
  const second = fakeRenderer();
  camera.attach(second);
  camera.layerShown(true);
  camera.mapResized();
  assert.deepEqual(second.calls, [['highlight', '261160']]);

  const fresh = createMapCamera();
  fresh.layerShown(true);
  fresh.attach(fakeRenderer());
  fresh.select('261160', { preserveCamera: true });
  const next = fakeRenderer();
  fresh.attach(next);
  assert.deepEqual(next.calls, [['focus', '261160', PRESERVE]], 'an arrival still allowed reaches the new map');
});

test('the logo frames the country even while a municipality is still selected', () => {
  const camera = createMapCamera();
  const renderer = fakeRenderer();
  camera.attach(renderer);
  camera.layerShown(true);
  camera.select('261160');
  renderer.calls.length = 0;
  camera.resetCountry();
  camera.mapResized();
  camera.layerShown(true);
  assert.deepEqual(renderer.calls, [['resetCountry']], 'the selected municipality is not framed again after the reset');
});
