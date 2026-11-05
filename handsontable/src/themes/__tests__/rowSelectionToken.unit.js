import fs from 'fs';
import path from 'path';
import mainTokens from 'handsontable/themes/static/variables/tokens/main';
import classicTokens from 'handsontable/themes/static/variables/tokens/classic';
import horizonTokens from 'handsontable/themes/static/variables/tokens/horizon';

// Figma stores `<theme>/custom/row-selection` as raw semi-transparent RGBA literals, not as references
// to the `colors` palette. The theme generator once dropped such a `mode` token, which deleted the
// public `--ht-row-selection-background-color` from every theme on regeneration.
const ROW_SELECTION = {
  main: ['#1a42e81a', '#4669f633'],
  classic: ['#5292f71a', '#7aadff33'],
  horizon: ['#37bc6c1a', '#f1b93e33'],
};
const TOKENS = {
  main: mainTokens,
  classic: classicTokens,
  horizon: horizonTokens,
};

describe('row selection theme token', () => {
  it.each(Object.keys(TOKENS))('should hold the light and dark tints (%s tokens)', (theme) => {
    expect(TOKENS[theme].rowSelectionBackgroundColor).toEqual(ROW_SELECTION[theme]);
  });

  it.each(Object.keys(TOKENS).flatMap(theme => [
    [theme, `ht-theme-${theme}.css`],
    [theme, `ht-theme-${theme}-no-icons.css`],
  ]))('should declare the variable with light-dark() (%s, %s)', (theme, fileName) => {
    const cssContent = fs.readFileSync(path.join(__dirname, '../static/css/theme', fileName), 'utf8');
    const [light, dark] = ROW_SELECTION[theme];

    expect(cssContent).toContain(`--ht-row-selection-background-color: light-dark(${light}, ${dark});`);
  });
});
