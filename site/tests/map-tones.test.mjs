import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { checkMapTones, contrastRatio, parseThemeTokens, resolveToken, toneDistance } from '../scripts/map-tones.mjs';
import { HATCH, INSUFFICIENT_DOTS, STATUS_COLORS, TREND_COLORS } from '../src/map/indicator-layer.ts';

const themes = parseThemeTokens(readFileSync(new URL('../src/shared/theme.css', import.meta.url), 'utf8'));

// The tables of the visual foundations decision (docs/ui-contract.md, section Fundamentos visuais).
const DECISION = {
  light: {
    improving: '#0f6e6b', worsening: '#d68f10', stable: '#9aa0a9', no_clear_direction: '#d9dde2', insufficient: '#f3f2ec',
    reached: '#54278f', near: '#9e9ac8', far: '#dadaeb',
    dots: '#8a9099', hatch: 'rgba(31, 41, 51, .55)', background: '#f6f7f9', outline: '#fff',
    page: '#f5f5f5', surface: '#fff', soft: '#efefef', border: '#d4d4d4', text: '#171717', muted: '#525252',
    link: '#1a56b0', focus: '#1a56b0', noticeBg: '#171717', noticeText: '#fafafa', selection: '#000',
  },
  dark: {
    improving: '#35bdb6', worsening: '#e3a42c', stable: '#79818c', no_clear_direction: '#38414b', insufficient: '#1e242b',
    reached: '#b9a3f2', near: '#7a68b4', far: '#3d3760',
    dots: '#8a9099', hatch: 'rgba(230, 237, 243, .42)', background: '#12171d', outline: '#12171d',
    page: '#0a0a0a', surface: '#1a1a1a', soft: '#2a2a2a', border: '#333', text: '#f5f5f5', muted: '#a3a3a3',
    link: '#8ab4f8', focus: '#8ab4f8', noticeBg: '#f5f5f5', noticeText: '#171717', selection: '#fff',
  },
};

for (const theme of ['light', 'dark']) {
  const tone = value => resolveToken(value, themes[theme]);
  const expected = DECISION[theme];

  test(`trend, status and textures follow the decision in the ${theme} theme`, () => {
    for (const state of ['improving', 'worsening', 'stable', 'no_clear_direction', 'insufficient']) {
      assert.equal(tone(TREND_COLORS[state]), expected[state], state);
    }
    for (const state of ['reached', 'near', 'far']) assert.equal(tone(STATUS_COLORS[state]), expected[state], state);
    assert.equal(tone(STATUS_COLORS.insufficient), expected.insufficient);
    assert.equal(tone(INSUFFICIENT_DOTS.color), expected.dots);
    assert.equal(tone(HATCH.color), expected.hatch);
  });

  test(`surfaces and map base follow the decision in the ${theme} theme`, () => {
    const tokens = themes[theme];
    const actual = {
      page: tokens['--page'], surface: tokens['--surface'], soft: tokens['--soft'], border: tokens['--border'],
      text: tokens['--text'], muted: tokens['--muted'], link: tokens['--link'], focus: tokens['--focus'],
      noticeBg: tokens['--notice-bg'], noticeText: tokens['--notice-text'], selection: tokens['--selection'],
      background: tokens['--mesh'], outline: tokens['--mesh-border'],
    };
    for (const [name, value] of Object.entries(actual)) assert.equal(value, expected[name], name);
  });

  test(`the ${theme} palette meets the distances of the decision`, () => {
    assert.deepEqual(checkMapTones(themes[theme]), []);
  });
}

test('the dark theme by system preference equals the explicit dark theme', () => {
  assert.deepEqual(themes.systemDark, themes.dark);
});

test('color distance reproduces the figures recorded in the decision', () => {
  // Previous palette, then the two current ones: improving against stable with protanopia.
  assert.equal(toneDistance('#1d8a87', '#80868f', 'protanopia').toFixed(1), '1.5');
  assert.equal(toneDistance('#0f6e6b', '#9aa0a9', 'protanopia').toFixed(1), '19.1');
  assert.equal(toneDistance('#35bdb6', '#79818c', 'protanopia').toFixed(1), '16.3');
});

test('contrast reproduces the costs accepted in the decision', () => {
  const { background } = DECISION.light;
  assert.equal(contrastRatio(DECISION.light.no_clear_direction, background).toFixed(1), '1.3');
  assert.equal(contrastRatio(DECISION.light.insufficient, background).toFixed(2), '1.05');
  assert.equal(contrastRatio(DECISION.light.worsening, background).toFixed(1), '2.5');
});

test('a palette that loses a distance is reported', () => {
  const tokens = { ...themes.light, '--trend-stable': themes.light['--trend-improving'] };
  const failures = checkMapTones(tokens);
  assert.ok(failures.some(failure => failure.includes('improving') && failure.includes('stable')), failures.join('\n'));
});
