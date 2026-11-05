import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findUnresolvedTokens, processTokenValue } from '../utils/themeProcessing.mjs';
import { tokensKeys } from '../tokensKeys.mjs';

test('processTokenValue drops an unresolved {mode.*} reference instead of emitting the raw literal', () => {
  // Empty themes → the mode ref resolves to neither variant → processReference returns null.
  const result = processTokenValue('backgroundColor', { value: '{mode.color.background}' }, {});

  assert.equal(result, null);
});

test('processTokenValue resolves a {mode.*} reference that has both light and dark variants', () => {
  const themes = {
    mode: {
      light: { background: { value: '{colors.palette.white}' } },
      dark: { background: { value: '{colors.palette.black}' } },
    },
  };
  const result = processTokenValue('backgroundColor', { value: '{mode.x.background}' }, themes);

  assert.ok(Array.isArray(result));
  assert.equal(result.length, 2);
});

test('processTokenValue keeps a literal mode variant next to a referenced one', () => {
  const themes = {
    mode: {
      light: { background: { value: '#ffffffff' } }, // plain literal, not a {…} reference
      dark: { background: { value: '{colors.dark.main.palette.950}' } },
    },
  };

  assert.deepEqual(
    processTokenValue('backgroundColor', { value: '{mode.x.background}' }, themes),
    ['#ffffffff', 'colors.palette.950'],
  );
});

test('processTokenValue emits a mode token whose light and dark variants are both RGBA literals', () => {
  // The Figma shape of `row-selection-background-color`: the themes variable aliases
  // `<theme>/custom/row-selection` in the `mode` collection, which holds raw semi-transparent colors.
  const themes = {
    mode: {
      light: { main: { custom: { 'row-selection': { type: 'color', value: '#1a42e81a' } } } },
      dark: { main: { custom: { 'row-selection': { type: 'color', value: '#4669f633' } } } },
    },
  };

  assert.deepEqual(
    processTokenValue(
      'row-selection-background-color',
      { value: '{mode.main.main.custom.row-selection}' },
      themes,
    ),
    ['#1a42e81a', '#4669f633'],
  );
});

test('processTokenValue still drops a mode token with a variant missing', () => {
  const themes = {
    mode: {
      light: { background: { value: '#ffffffff' } },
      dark: {},
    },
  };

  assert.equal(processTokenValue('backgroundColor', { value: '{mode.x.background}' }, themes), null);
});

test('processTokenValue returns null for a found node that has no value', () => {
  assert.equal(processTokenValue('backgroundColor', { description: 'no value here' }, {}), null);
  assert.equal(processTokenValue('backgroundColor', { value: undefined }, {}), null);
});

test('processTokenValue passes plain literals through formatValue', () => {
  assert.equal(processTokenValue('fontSize', { value: 14 }, {}), '14px');
  assert.equal(processTokenValue('fontFamily', { value: 'Inter' }, {}), 'Inter');
});

test('findUnresolvedTokens lists, per theme, the tokensKeys entries a stale export did not resolve', () => {
  const complete = Object.fromEntries(tokensKeys.map(key => [key, 'x']));
  const { 'row-selection-background-color': dropped, ...stale } = complete;

  assert.equal(dropped, 'x');
  assert.deepEqual(findUnresolvedTokens({ main: complete, classic: stale }), [
    { theme: 'classic', keys: ['row-selection-background-color'] },
  ]);
});

test('findUnresolvedTokens returns nothing when every theme resolves every key', () => {
  const complete = Object.fromEntries(tokensKeys.map(key => [key, 'x']));

  assert.deepEqual(findUnresolvedTokens({ main: complete, horizon: complete }), []);
});
