import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { iconsMap as runtimeIconsMap } from '../utils/helpers/iconsMap.mjs';
import mainIcons from '../icons/main.mjs';

const here = dirname(fileURLToPath(import.meta.url));

test('runtime iconsMap and the typed template produce identical CSS', async() => {
  // Strip TS type annotations from the template so it can be evaluated as plain JS.
  let src = readFileSync(resolve(here, '../templates/iconsMap.ts'), 'utf8');

  src = src
    .replace(/^\/\* eslint-disable[^\n]*\n/, '')
    .replace(/: Record<string, string>/g, '')
    .replace(/\?: string/g, '')
    .replace(/: string/g, '')
    .replace(/export const/g, 'const')
    .concat('\nexport { iconsMap };');

  const blob = `data:text/javascript;base64,${Buffer.from(src).toString('base64')}`;
  const { iconsMap: templateIconsMap } = await import(blob);

  assert.equal(templateIconsMap(mainIcons, 'ht-theme-main'), runtimeIconsMap(mainIcons, 'ht-theme-main'));
});
