import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTsModule, tsConstName } from '../utils/jsGeneration.mjs';

test('tsConstName maps fixed and per-theme categories', () => {
  assert.equal(tsConstName('sizing', null), 'sizing');
  assert.equal(tsConstName('density', null), 'densitySizes');
  assert.equal(tsConstName('tokens', 'main'), 'mainTokens');
  assert.equal(tsConstName('colors', 'horizon'), 'horizonColors');
  assert.equal(tsConstName('icons', 'main'), 'mainIcons');
});

test('buildTsModule emits a typed sizing module', () => {
  const out = buildTsModule({ category: 'sizing', themeName: null, objectLiteral: '{\n  size_0: \'0px\'\n}' });

  assert.match(out, /This file is auto-generated/);
  assert.match(out, /import type \{ ThemeSizingConfig \} from '\.\.\/\.\.\/types';/);
  assert.match(out, /const sizing: ThemeSizingConfig = \{/);
  assert.match(out, /export default sizing;\n$/);
  assert.ok(!out.startsWith('/* eslint-disable'), 'non-icon files have no eslint-disable');
});

test('buildTsModule emits an icons module with eslint-disable and deep import', () => {
  const out = buildTsModule({ category: 'icons', themeName: 'main', objectLiteral: '{\n  arrowRight: "data:..."\n}' });

  assert.ok(out.startsWith('/* eslint-disable max-len, quotes */'));
  assert.match(out, /import type \{ ThemeIconsConfig \} from '\.\.\/\.\.\/\.\.\/types';/);
  assert.match(out, /const mainIcons: ThemeIconsConfig = \{/);
  assert.match(out, /export default mainIcons;\n$/);
});
