import fs from 'fs';
import path from 'path';
import mainTokens from 'handsontable/themes/static/variables/tokens/main';
import classicTokens from 'handsontable/themes/static/variables/tokens/classic';
import horizonTokens from 'handsontable/themes/static/variables/tokens/horizon';

// The AsyncValues plugin paints its pending and error states with three tokens. Each one aliases an
// existing token in every theme (the Figma variables `component/async-values/*` do the same), so a
// theme customized before the tokens existed still paints both states in its own colors.
const ALIASES = {
  asyncIndicatorColor: ['tokens.accentColor', '--ht-accent-color'],
  asyncErrorBackgroundColor: ['tokens.cellErrorBackgroundColor', '--ht-cell-error-background-color'],
  asyncErrorMarkerColor: ['tokens.notificationErrorAccent', '--ht-notification-error-accent'],
};
const TOKENS = {
  main: mainTokens,
  classic: classicTokens,
  horizon: horizonTokens,
};

/**
 * Converts a camelCase token key to its CSS variable name.
 *
 * @param {string} key The token key.
 * @returns {string} The CSS variable name.
 */
function toCssVariable(key) {
  return `--ht-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
}

describe('asyncValues theme tokens', () => {
  it.each(Object.keys(TOKENS))('should alias the existing tokens (%s tokens)', (theme) => {
    Object.entries(ALIASES).forEach(([key, [alias]]) => {
      expect(TOKENS[theme][key]).toBe(alias);
    });
  });

  it.each(Object.keys(TOKENS).flatMap(theme => [
    [`ht-theme-${theme}.css`],
    [`ht-theme-${theme}-no-icons.css`],
  ]))('should declare the async variables as aliases in %s', (fileName) => {
    const cssContent = fs.readFileSync(path.join(__dirname, '../static/css/theme', fileName), 'utf8');

    Object.entries(ALIASES).forEach(([key, [, cssAlias]]) => {
      expect(cssContent).toContain(`${toCssVariable(key)}: var(${cssAlias});`);
    });
  });
});
