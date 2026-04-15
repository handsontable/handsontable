import { mainTheme, classicTheme, horizonTheme } from '../../../src/themes/theme';
import density from '../../../src/themes/static/variables/density';
import { createThemeLayoutCore, E2E_REGISTERED_THEME_KEYS } from '../themeLayoutCore';

describe('themeLayoutCore entry point is src/themes/theme', () => {
  it('registers exactly the theme modules exported from src/themes/theme/index.js', () => {
    expect(E2E_REGISTERED_THEME_KEYS).toEqual(
      [classicTheme.name, mainTheme.name, horizonTheme.name]
    );
  });

  it('reads densityLevel from the theme module, not a hardcoded map', () => {
    expect(createThemeLayoutCore(mainTheme.name).densityLevel).toBe(mainTheme.density);
    expect(createThemeLayoutCore(classicTheme.name).densityLevel).toBe(classicTheme.density);
    expect(createThemeLayoutCore(horizonTheme.name).densityLevel).toBe(horizonTheme.density);
  });

  it('resolves cellVerticalPadding from density[theme.density].cellVertical', () => {
    const sizingKey = density[mainTheme.density].cellVertical.replace('sizing.', '');
    const sizing = require('../../../src/themes/static/variables/sizing').default;

    expect(createThemeLayoutCore(mainTheme.name).cellVerticalPadding)
      .toBe(parseInt(sizing[sizingKey], 10));
  });

  it('exposes no pickByDensity (density triplets are not a supported API)', () => {
    expect(createThemeLayoutCore(mainTheme.name).pickByDensity).toBeUndefined();
  });
});
