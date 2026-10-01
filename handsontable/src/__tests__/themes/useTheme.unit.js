import Handsontable from 'handsontable/base';
import { createTheme } from 'handsontable/themes/engine/builder';
import mainIcons from 'handsontable/themes/static/variables/icons/main';
import mainColors from 'handsontable/themes/static/variables/colors/main';
import mainTokens from 'handsontable/themes/static/variables/tokens/main';

/**
 * `hot.useTheme('<class name>')` on a grid that runs a theme object must tear the theme manager
 * down, the same way `updateSettings({ theme: '<class name>' })` does. Otherwise the abandoned
 * manager keeps its `<style>` node and its subscription to the shared theme object, so a later
 * `theme.params()` re-injects the old styles and fires `afterSetTheme` with the old class name.
 */
describe('Core.useTheme() after a theme object', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a theme object with an external (class-list) icon mapping.
   *
   * @returns {ThemeBuilder}
   */
  function createThemeObject() {
    return createTheme({
      name: 'use-theme-test',
      icons: { ...mainIcons, menu: 'ti ti-menu' },
      colors: mainColors,
      tokens: mainTokens,
    });
  }

  /**
   * Builds a grid with the given theme object.
   *
   * @param {ThemeBuilder} theme The theme object.
   * @returns {Handsontable}
   */
  function createGrid(theme) {
    hot = new Handsontable(container, {
      data: [['a']],
      theme,
      licenseKey: 'non-commercial-and-evaluation',
    });

    return hot;
  }

  it('should destroy the theme manager and remove its injected styles', () => {
    createGrid(createThemeObject());

    expect(hot.themeManager).not.toBeNull();
    expect(hot.rootWrapperElement.querySelector('[data-hot-theme-style]')).not.toBeNull();

    hot.useTheme('ht-theme-classic');

    expect(hot.themeManager).toBeNull();
    expect(hot.rootWrapperElement.querySelector('[data-hot-theme-style]')).toBeNull();
  });

  it('should unsubscribe the old manager from the theme object', () => {
    const theme = createThemeObject();

    createGrid(theme);
    hot.useTheme('ht-theme-classic');

    const afterSetTheme = jest.fn();

    hot.addHook('afterSetTheme', afterSetTheme);
    theme.params({ icons: { menu: 'ti ti-dots' } });

    expect(afterSetTheme).not.toHaveBeenCalled();
    expect(hot.rootWrapperElement.querySelector('[data-hot-theme-style]')).toBeNull();
  });

  it('should destroy the theme manager when called with `null`', () => {
    createGrid(createThemeObject());

    hot.useTheme(null);

    expect(hot.themeManager).toBeNull();
    expect(hot.rootWrapperElement.querySelector('[data-hot-theme-style]')).toBeNull();
  });

  it('should keep the theme manager when called with its own class name', () => {
    const theme = createThemeObject();

    createGrid(theme);

    const manager = hot.themeManager;

    hot.useTheme(manager.getClassName());

    expect(hot.themeManager).toBe(manager);
    expect(hot.rootWrapperElement.querySelector('[data-hot-theme-style]')).not.toBeNull();

    const afterSetTheme = jest.fn();

    hot.addHook('afterSetTheme', afterSetTheme);
    theme.params({ icons: { menu: 'ti ti-dots' } });

    expect(afterSetTheme).toHaveBeenCalledWith('ht-theme-use-theme-test', false);
  });

  it('should keep the theme manager across `updateSettings()` with a theme object', () => {
    const theme = createThemeObject();

    createGrid(theme);

    const manager = hot.themeManager;

    hot.updateSettings({ theme });

    expect(hot.themeManager).toBe(manager);
    expect(hot.rootWrapperElement.querySelector('[data-hot-theme-style]')).not.toBeNull();
  });
});
