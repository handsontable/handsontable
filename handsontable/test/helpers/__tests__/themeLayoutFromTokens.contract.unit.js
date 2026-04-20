import { mainTheme, classicTheme, horizonTheme } from '../../../src/themes/theme';
import density from '../../../src/themes/static/variables/density';
import sizing from '../../../src/themes/static/variables/sizing';
import { createThemeLayoutCore, E2E_REGISTERED_THEME_KEYS } from '../themeLayoutFromTokens';
import WalkontableSettings from '../../../src/3rdparty/walkontable/src/settings';

describe('themeLayoutFromTokens entry point is src/themes/theme', () => {
  it('registers theme modules exported from src/themes/theme/index.js', () => {
    expect(E2E_REGISTERED_THEME_KEYS).toEqual(
      expect.arrayContaining([classicTheme.name, mainTheme.name, horizonTheme.name])
    );
    expect(E2E_REGISTERED_THEME_KEYS.length).toBeGreaterThanOrEqual(3);
  });

  it('reads densityLevel from the theme module, not a hardcoded map', () => {
    expect(createThemeLayoutCore(mainTheme.name).densityLevel).toBe(mainTheme.density);
    expect(createThemeLayoutCore(classicTheme.name).densityLevel).toBe(classicTheme.density);
    expect(createThemeLayoutCore(horizonTheme.name).densityLevel).toBe(horizonTheme.density);
  });

  it('resolves cellVerticalPadding from density[theme.density].cellVertical', () => {
    const sizingKey = density[mainTheme.density].cellVertical.replace('sizing.', '');

    expect(createThemeLayoutCore(mainTheme.name).cellVerticalPadding)
      .toBe(parseInt(sizing[sizingKey], 10));
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
    // Build a minimal settings object. We use Object.create to access the defaults
    // without triggering required-field validation (facade, table, data, etc.).
    const proto = WalkontableSettings.prototype;
    // getDefaults uses `this.getSetting` for dynamic defaults (overlays); stub it.
    const stubSelf = { getSetting: () => 0 };
    const walkoDefaults = proto.getDefaults.call(stubSelf);

    const coreLayout = createThemeLayoutCore(mainTheme.name);

    expect(coreLayout.defaultColumnWidth).toBe(walkoDefaults.defaultColumnWidth);
    expect(coreLayout.defaultRowHeaderWidth).toBe(walkoDefaults.defaultColumnWidth);
  });
});
