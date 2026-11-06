// Checks the map tones of src/shared/theme.css against the distances of the visual
// foundations decision (docs/ui-contract.md, section Fundamentos visuais).
// Run with `npm run check:tones`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Target distance between two classes, and the floor when a texture or label also tells them apart:
 * the rule of the approved prototype (commit 0b0ff2c, /prototipo-fundamentos/).
 */
const TARGET_DISTANCE = 8;
const TEXTURED_FLOOR = 6;

const TREND_TOKENS = ['--trend-improving', '--trend-worsening', '--trend-stable', '--trend-no-clear-direction', '--insufficient'];
const STATUS_TOKENS = ['--status-reached', '--status-near', '--status-far', '--insufficient'];
/** Insufficient data always carries its dots, so it may sit on the floor. */
const TEXTURED_TOKEN = '--insufficient';

/** Machado, Oliveira and Fernandes (2009), severity 1, applied to linear RGB. */
const VISION_MATRICES = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
};

function linearRgb(hex) {
  const digits = hex.slice(1);
  const full = digits.length === 3 ? [...digits].map(digit => digit + digit).join('') : digits;
  return [0, 2, 4].map(start => {
    const channel = Number.parseInt(full.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
}

function oklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Oklab distance times 100, under normal vision or a simulated color-vision deficiency. */
export function toneDistance(first, second, vision) {
  const point = hex => {
    const rgb = linearRgb(hex);
    const matrix = VISION_MATRICES[vision];
    return oklab(matrix ? matrix.map(row => Math.max(0, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])) : rgb);
  };
  const [a, b] = [point(first), point(second)];
  return 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** WCAG contrast ratio. */
export function contrastRatio(first, second) {
  const luminance = hex => {
    const [r, g, b] = linearRgb(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [high, low] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

function declarations(block) {
  return Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]));
}

function ruleBody(css, selector) {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`theme.css has no rule for ${selector}`);
  const open = css.indexOf('{', start);
  return css.slice(open + 1, css.indexOf('}', open));
}

/** The tokens of each theme: light, explicit dark and dark by system preference. */
export function parseThemeTokens(css) {
  const light = declarations(ruleBody(css, ':root'));
  return {
    light,
    dark: { ...light, ...declarations(ruleBody(css, ':root[data-theme="dark"]')) },
    systemDark: { ...light, ...declarations(ruleBody(css, ':root:not([data-theme="light"])')) },
  };
}

/** The value behind a `var(--token)`, as the browser would resolve it for that theme. */
export function resolveToken(value, tokens) {
  const name = value.match(/^var\((--[\w-]+)\)$/)?.[1];
  if (!name) return value;
  if (!(name in tokens)) throw new Error(`unknown token ${name}`);
  return tokens[name];
}

/** Every pair of classes shown together that falls short of the decision. Empty when all pass. */
export function checkMapTones(tokens) {
  const failures = [];
  for (const group of [TREND_TOKENS, STATUS_TOKENS]) {
    group.forEach((first, index) => {
      for (const second of group.slice(index + 1)) {
        const minimum = first === TEXTURED_TOKEN || second === TEXTURED_TOKEN ? TEXTURED_FLOOR : TARGET_DISTANCE;
        for (const vision of [undefined, 'protanopia', 'deuteranopia']) {
          const distance = toneDistance(tokens[first], tokens[second], vision);
          if (distance < minimum) {
            failures.push(`${first} × ${second} (${vision ?? 'normal vision'}): ${distance.toFixed(1)} < ${minimum}`);
          }
        }
      }
    });
  }
  return failures;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const themes = parseThemeTokens(readFileSync(new URL('../src/shared/theme.css', import.meta.url), 'utf8'));
  let failed = false;
  for (const theme of ['light', 'dark']) {
    const failures = checkMapTones(themes[theme]);
    console.log(failures.length ? `${theme}: ${failures.length} failure(s)` : `${theme}: all distances met`);
    for (const failure of failures) console.log(`  ${failure}`);
    failed ||= failures.length > 0;
  }
  process.exitCode = failed ? 1 : 0;
}
