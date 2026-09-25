import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { iconStyles as runtimeIconStyles } from '../utils/helpers/iconStyles.mjs';
import mainIcons from '../icons/main.mjs';
import horizonIcons from '../icons/horizon.mjs';

const here = dirname(fileURLToPath(import.meta.url));

test('emits one variable and one glyph rule per icon, scoped to the given selector', () => {
  const css = runtimeIconStyles({ arrowRight: 'data:a', caretHiddenUp: 'data:b' }, '[class*=ht-theme-main]');

  // eslint-disable-next-line max-len -- exact expected CSS shape, kept on one line for readability.
  assert.match(css, /^\[class\*=ht-theme-main\] \{\n {2}--ht-icon-arrow-right: url\("data:a"\);\n {2}--ht-icon-caret-hidden-up: url\("data:b"\);\n\}\n/);
  // eslint-disable-next-line max-len -- exact expected CSS shape, kept on one line for readability.
  assert.match(css, /\.ht-icon-arrow-right \{\n {2}-webkit-mask-image: var\(--ht-icon-arrow-right\);\n {2}mask-image: var\(--ht-icon-arrow-right\);/);
  assert.match(css, /background-color: currentColor;\n\}/);
  assert.equal((css.match(/\.ht-icon-[a-z-]+ \{/g) || []).length, 2);
});

test('escapes double quotes inside a glyph URL', () => {
  const css = runtimeIconStyles({ a: 'data:x"y' }, ':root');

  assert.match(css, /--ht-icon-a: url\("data:x%22y"\);/);
});

test('runtime iconStyles and the typed template produce identical CSS', async() => {
  let src = readFileSync(resolve(here, '../templates/iconStyles.ts'), 'utf8');

  src = src
    .replace(/^\/\* eslint-disable[^\n]*\n/, '')
    .replace(/: Record<string, string>/g, '')
    .replace(/: string\b/g, '')
    .replace(/export const/g, 'const')
    .concat('\nexport { iconStyles };');

  const blob = `data:text/javascript;base64,${Buffer.from(src).toString('base64')}`;
  const { iconStyles: templateIconStyles } = await import(blob);

  assert.equal(
    templateIconStyles(mainIcons, '[class*=ht-theme-main]'),
    runtimeIconStyles(mainIcons, '[class*=ht-theme-main]')
  );
});

test('main and horizon icon sets expose the same keys', () => {
  assert.deepEqual(Object.keys(mainIcons).sort(), Object.keys(horizonIcons).sort());
});
