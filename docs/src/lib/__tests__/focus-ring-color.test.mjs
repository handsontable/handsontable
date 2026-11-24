import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, relative } from 'node:path';
import test from 'node:test';
import { stripComments } from '../../../scripts/validate-layer-order.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '../..');
const variablesCss = stripComments(readFileSync(join(srcDir, 'styles/base/variables.css'), 'utf8'));

/**
 * Lists the stylesheets and Astro components under a directory.
 *
 * @param {string} dir The directory to walk.
 * @returns {string[]} The absolute file paths.
 */
function listStyleSources(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);

    if (statSync(path).isDirectory()) {
      return name === '__tests__' ? [] : listStyleSources(path);
    }

    return ['.css', '.astro'].includes(extname(path)) ? [path] : [];
  });
}

/**
 * Reads the CSS of a file: the whole file for a stylesheet, the `<style>` blocks for a component.
 *
 * @param {string} path The file path.
 * @returns {string} The CSS without comments.
 */
function readCss(path) {
  const source = readFileSync(path, 'utf8');

  if (extname(path) === '.css') {
    return stripComments(source);
  }

  return stripComments([...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n'));
}

/**
 * Reads the value of a custom property from the first block of a selector in `variables.css`.
 *
 * @param {string} selector The block's selector, as written.
 * @param {string} name The custom property name.
 * @returns {string | undefined} The value.
 */
function readVariable(selector, name) {
  const start = variablesCss.indexOf(`${selector} {`);
  const block = variablesCss.slice(start, variablesCss.indexOf('}', start));

  return new RegExp(`${name}:\\s*([^;]+);`).exec(block)?.[1].trim();
}

/**
 * Computes the relative luminance of a `#rrggbb` color (WCAG 2.2).
 *
 * @param {string} hex The color.
 * @returns {number} The luminance.
 */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;

    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

/**
 * Computes the contrast ratio of two `#rrggbb` colors.
 *
 * @param {string} first The first color.
 * @param {string} second The second color.
 * @returns {number} The ratio.
 */
function contrast(first, second) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);

  return (light + 0.05) / (dark + 0.05);
}

test('every focus indicator in the docs CSS uses the focus ring color, not the accent', () => {
  const offenders = listStyleSources(srcDir).flatMap((path) => {
    const css = readCss(path);

    return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, selector]) => selector.includes(':focus') && !selector.includes('[aria-current='))
      .filter(([, , body]) => /(outline|box-shadow|border-color)[^;]*var\(--sl-color-accent\)/.test(body))
      .map(([, selector]) => `${relative(srcDir, path)}: ${selector.trim()}`);
  });

  assert.deepEqual(offenders, []);
});

test('the dark focus ring stands 3:1 from the dark backgrounds next to it', () => {
  const ring = readVariable(':root', '--sl-color-focus-ring');

  assert.equal(ring, '#3b82f6');

  for (const background of [readVariable(':root', '--sl-color-block-bg'), '#1c1c1c', '#3b3b3b']) {
    assert.ok(contrast(ring, background) >= 3, `${ring} on ${background}: ${contrast(ring, background).toFixed(2)}:1`);
  }
});

test('the light focus ring is the light accent', () => {
  assert.equal(readVariable(':root[data-theme=\'light\']', '--sl-color-focus-ring'), 'var(--sl-color-accent)');
});
