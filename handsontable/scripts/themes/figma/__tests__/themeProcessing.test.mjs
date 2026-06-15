import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processTokenValue } from '../utils/themeProcessing.mjs';

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

test('processTokenValue does not throw when a mode variant holds a literal instead of a reference', () => {
  const themes = {
    mode: {
      light: { background: { value: '#ffffffff' } }, // plain literal, not a {…} reference
      dark: { background: { value: '{colors.palette.black}' } },
    },
  };

  assert.doesNotThrow(() => processTokenValue('backgroundColor', { value: '{mode.x.background}' }, themes));
  assert.equal(processTokenValue('backgroundColor', { value: '{mode.x.background}' }, themes), null);
});

test('processTokenValue passes plain literals through formatValue', () => {
  assert.equal(processTokenValue('fontSize', { value: 14 }, {}), '14px');
  assert.equal(processTokenValue('fontFamily', { value: 'Inter' }, {}), 'Inter');
});
