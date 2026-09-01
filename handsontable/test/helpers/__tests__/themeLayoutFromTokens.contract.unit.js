import { mainTheme } from '../../../src/themes/theme';
import * as themeModules from '../../../src/themes/theme';
import density from '../../../src/themes/static/variables/density';
import sizing from '../../../src/themes/static/variables/sizing';
import { createThemeLayoutCore, E2E_REGISTERED_THEME_KEYS } from '../themeLayoutFromTokens';
import { getDefaults } from '../../../src/3rdparty/walkontable/src/settings/defaults';

const ALL_THEMES = Object.values(themeModules).filter(m => m && m.name);

describe('themeLayoutFromTokens entry point is src/themes/theme', () => {
  it('registers every theme module exported from src/themes/theme/index.js', () => {
    const expectedNames = ALL_THEMES.map(m => m.name);

    expect(E2E_REGISTERED_THEME_KEYS).toEqual(expect.arrayContaining(expectedNames));
    expect(E2E_REGISTERED_THEME_KEYS.length).toBe(expectedNames.length);
  });

  ALL_THEMES.forEach((theme) => {
    it(`reads densityLevel from the "${theme.name}" theme module, not a hardcoded map`, () => {
      expect(createThemeLayoutCore(theme.name).densityLevel).toBe(theme.density);
    });
  });

  ALL_THEMES.forEach((theme) => {
    it(`resolves cellVerticalPadding from density[${theme.name}.density].cellVertical`, () => {
      const sizingKey = density[theme.density].cellVertical.replace('sizing.', '');

      expect(createThemeLayoutCore(theme.name).cellVerticalPadding)
        .toBe(parseInt(sizing[sizingKey], 10));
    });
  });
});

describe('themeLayoutFromTokens Walkontable constant contract', () => {
  // This test guards against silent divergence between the WALKONTABLE_DEFAULT_COLUMN_WIDTH
  // constant in themeLayoutFromTokens.js and the actual defaultColumnWidth value in
  // src/3rdparty/walkontable/src/settings.js (getDefaults(), line ~194).
  // The constant is not a standalone export, so we read it from a Settings instance.
  //
  // If this test fails after a Walkontable change, update WALKONTABLE_DEFAULT_COLUMN_WIDTH
  // in themeLayoutFromTokens.js to match.
  it('defaultColumnWidth matches walkontable/src/settings.js defaultColumnWidth', () => {
    // `getDefaults` was split out of the Settings class into a standalone function
    // (settings/defaults.ts). It uses `settings.getSetting` for dynamic defaults (overlays); stub it.
    const stubSelf = { getSetting: () => 0 };
    const walkoDefaults = getDefaults(stubSelf);

    const coreLayout = createThemeLayoutCore(mainTheme.name);

    expect(coreLayout.defaultColumnWidth).toBe(walkoDefaults.defaultColumnWidth);
    expect(coreLayout.defaultRowHeaderWidth).toBe(walkoDefaults.defaultColumnWidth);
  });
});
