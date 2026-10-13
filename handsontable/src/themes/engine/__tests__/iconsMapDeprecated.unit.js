import { iconsMap } from '../../static/variables/helpers/iconsMap';
import { iconStyles } from '../../static/variables/helpers/iconStyles';
import { _resetDeprecationWarnings } from '../../../helpers/console';

// `handsontable/themes/static/variables/helpers/iconsMap` is a published import path
// (`package.json` exports `./themes/static/variables/**/*`), so it stays as a deprecated shim
// until 20.0.0.
describe('iconsMap (deprecated)', () => {
  const icons = { arrowRight: 'data:image/svg+xml,%3Csvg%3E', menu: '/icons/menu.svg' };

  beforeEach(() => {
    _resetDeprecationWarnings();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('still generates the icon stylesheet, scoped to the theme class it is given', () => {
    const css = iconsMap(icons, 'ht-theme-main');

    expect(css).toBe(iconStyles(icons, '[class*=ht-theme-main]'));
    expect(css).toContain('--ht-icon-arrow-right: url("data:image/svg+xml,%3Csvg%3E");');
    expect(css).toContain('.ht-icon-menu {');
  });

  it('declares the variables on `:root` without a theme prefix', () => {
    expect(iconsMap(icons)).toBe(iconStyles(icons, ':root'));
  });

  it('prints its deprecation warning once', () => {
    iconsMap(icons, 'ht-theme-main');
    iconsMap(icons, 'ht-theme-horizon');

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn.mock.calls[0][0]).toMatch(/^Deprecated: The `iconsMap\(\)` helper/);
  });
});
