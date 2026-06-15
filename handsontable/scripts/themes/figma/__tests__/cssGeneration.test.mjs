import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateThemeCss } from '../utils/cssGeneration.mjs';

test('generateThemeCss returns null (no throw) when the theme is missing from colors', () => {
  const themeVariables = {
    sizing: { size_0: '0px' },
    density: { default: {} },
    colors: {}, // 'main' present in tokens but absent here
    tokens: { main: { density: 'default', backgroundColor: 'colors.white' } },
  };

  assert.doesNotThrow(() => generateThemeCss('main', themeVariables));
  assert.equal(generateThemeCss('main', themeVariables), null);
});

test('generateThemeCss returns null (no throw) when the density level is missing', () => {
  const themeVariables = {
    sizing: { size_0: '0px' },
    density: { default: {} },
    colors: { main: { white: '#ffffffff' } },
    tokens: { main: { density: 'nonexistent', backgroundColor: 'colors.white' } },
  };

  assert.doesNotThrow(() => generateThemeCss('main', themeVariables));
  assert.equal(generateThemeCss('main', themeVariables), null);
});

test('generateThemeCss emits CSS for a well-formed theme', () => {
  const themeVariables = {
    sizing: { size_0: '0px' },
    density: { default: { cellVertical: 'sizing.size_0' } },
    colors: { main: { white: '#ffffffff' } },
    tokens: { main: { density: 'default', backgroundColor: ['colors.white', 'colors.white'] } },
  };
  const css = generateThemeCss('main', themeVariables);

  assert.equal(typeof css, 'string');
  assert.match(css, /\.ht-theme-main\b/);
});
