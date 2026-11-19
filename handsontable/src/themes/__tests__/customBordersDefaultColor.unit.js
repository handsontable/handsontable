import fs from 'fs';
import path from 'path';
import mainTokens from 'handsontable/themes/static/variables/tokens/main';
import classicTokens from 'handsontable/themes/static/variables/tokens/classic';
import horizonTokens from 'handsontable/themes/static/variables/tokens/horizon';

// The color a border added from the context menu takes. The light branch must stay pure black, so a
// light-scheme grid looks as it did before the token existed; the dark branch is the theme's dark
// foreground step, so the border stays visible on a dark background.
const DARK_PALETTE_STEP = {
  main: '200',
  classic: '300',
  horizon: '200',
};
const TOKENS = {
  main: mainTokens,
  classic: classicTokens,
  horizon: horizonTokens,
};

describe('customBordersDefaultColor theme token', () => {
  it.each(Object.keys(TOKENS))('should be black in light and the dark foreground step in dark (%s tokens)', (theme) => {
    expect(TOKENS[theme].customBordersDefaultColor).toEqual([
      'colors.black',
      `colors.palette.${DARK_PALETTE_STEP[theme]}`,
    ]);
    // The dark branch follows the theme's foreground color, which the cells' text uses.
    expect(TOKENS[theme].foregroundColor[1]).toBe(`colors.palette.${DARK_PALETTE_STEP[theme]}`);
  });

  it.each(Object.keys(TOKENS).flatMap(theme => [
    [theme, `ht-theme-${theme}.css`],
    [theme, `ht-theme-${theme}-no-icons.css`],
  ]))('should declare --ht-custom-borders-default-color in the %s static CSS (%s)', (theme, fileName) => {
    const cssContent = fs.readFileSync(path.join(__dirname, '../static/css/theme', fileName), 'utf8');

    expect(cssContent).toContain(
      '--ht-custom-borders-default-color: light-dark(var(--ht-colors-black), ' +
      `var(--ht-colors-palette-${DARK_PALETTE_STEP[theme]}));`
    );
  });
});
