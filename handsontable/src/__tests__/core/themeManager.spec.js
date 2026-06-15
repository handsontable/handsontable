import mainIcons from '../../themes/static/variables/icons/main';
import mainColors from '../../themes/static/variables/colors/main';
import mainTokens from '../../themes/static/variables/tokens/main';

describe('Core.themeManager', () => {
  const id = 'testContainer';

  /**
   * Creates a valid theme config object with required fields.
   *
   * @param {object} overrides - The overrides to apply to the theme config.
   * @returns {object} The theme config object.
   */
  function createValidThemeConfig(overrides = {}) {
    return {
      name: 'test-theme',
      icons: mainIcons,
      colors: mainColors,
      tokens: mainTokens,
      ...overrides,
    };
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('initialization', () => {
    it('should initialize themeManager when a theme object is passed', async() => {
      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig());

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme,
      }, true);

      expect(hot.themeManager).not.toBeNull();
      expect(hot.themeManager).toBeDefined();
    });

    it('should initialize themeManager when a plain theme config object is passed (without prior registerTheme)', async() => {
      const plainThemeConfig = createValidThemeConfig({ name: 'plain-config-theme' });

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: plainThemeConfig,
      }, true);

      expect(hot.themeManager).not.toBeNull();
      expect(hot.themeManager).toBeDefined();
      expect(hot.themeManager.getClassName()).toBe('ht-theme-plain-config-theme');
    });

    it('should not warn for unknown token keys on initialization', async() => {
      // eslint-disable-next-line no-console
      spyOn(console, 'warn');

      handsontable({
        data: createSpreadsheetData(5, 5),
        theme: createValidThemeConfig({ name: 'plain-hit-area-theme' }),
      }, true);

      // eslint-disable-next-line no-console
      const unknownTokenWarnings = console.warn.calls.allArgs()
        .map(([message]) => message)
        .filter(message => message.startsWith('[ThemeBuilder] Unknown token key:'));

      expect(unknownTokenWarnings).toEqual([]);
    });

    it('should set the correct theme class when passing a plain theme config object', async() => {
      const plainThemeConfig = createValidThemeConfig({ name: 'plain-class-theme' });

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: plainThemeConfig,
      }, true);

      expect(hot.themeManager.getClassName()).toBe('ht-theme-plain-class-theme');
      expect(getCurrentThemeName()).toBe('ht-theme-plain-class-theme');
      expect($(hot.rootWrapperElement).hasClass('ht-theme-plain-class-theme')).toBe(true);
    });

    it('should inject theme styles when passing a plain theme config object', async() => {
      const plainThemeConfig = createValidThemeConfig({ name: 'plain-styles-theme' });

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: plainThemeConfig,
      }, true);

      const styleElement = hot.rootWrapperElement.querySelector('style');

      expect(styleElement).not.toBeNull();
      expect(styleElement.textContent).toContain('.ht-theme-plain-styles-theme');
    });

    it('should set the correct theme class name based on the theme config', async() => {
      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'my-custom-theme',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme,
      }, true);

      expect(hot.themeManager.getClassName()).toBe('ht-theme-my-custom-theme');
      expect(getCurrentThemeName()).toBe('ht-theme-my-custom-theme');
    });

    it('should apply the theme class to the root wrapper and portal element', async() => {
      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'wrapper-test-theme',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme,
      }, true);

      expect($(hot.rootWrapperElement).hasClass('ht-theme-wrapper-test-theme')).toBe(true);
      expect($(hot.rootPortalElement).hasClass('ht-theme-wrapper-test-theme')).toBe(true);
    });

    it('should inject theme styles into the DOM', async() => {
      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'styles-test-theme',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme,
      }, true);

      const styleElement = hot.rootWrapperElement.querySelector('style');

      expect(styleElement).not.toBeNull();
      expect(styleElement.textContent).toContain('.ht-theme-styles-test-theme');
      expect(styleElement.textContent).toContain('color-scheme:');
    });

    it('should fire afterSetTheme hook on initialization with initial flag set to true', async() => {
      const afterSetThemeSpy = jasmine.createSpy('afterSetTheme');
      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'hook-test-theme',
      }));

      handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme,
        afterSetTheme: afterSetThemeSpy,
      }, true);

      expect(afterSetThemeSpy).toHaveBeenCalledWith('ht-theme-hook-test-theme', true);
    });

    it('should not initialize themeManager when no theme object is passed', async() => {
      simulateModernThemeStylesheet(spec().$container);

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        themeName: 'ht-theme-sth',
      }, true);

      expect(hot.themeManager).toBeNull();
    });

    it('should not initialize themeManager when theme is passed as string', async() => {
      simulateModernThemeStylesheet(spec().$container);

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: 'ht-theme-sth',
      }, true);

      expect(hot.themeManager).toBeNull();
    });
  });

  describe('update', () => {
    it('should initialize themeManager when theme object is passed via updateSettings', async() => {
      const hot = handsontable({
        themeName: 'ht-theme-sth',
        data: createSpreadsheetData(5, 5),
      }, true);

      expect(getCurrentThemeName()).toBe('ht-theme-sth');
      expect(hot.themeManager).toBeNull();

      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'update-init-theme',
      }));

      await updateSettings({
        theme: testTheme,
      });

      expect(hot.themeManager).not.toBeNull();
      expect(hot.themeManager.getClassName()).toBe('ht-theme-update-init-theme');
    });

    it('should initialize themeManager when plain theme config object is passed via updateSettings', async() => {
      simulateModernThemeStylesheet(spec().$container);

      const hot = handsontable({
        themeName: 'ht-theme-sth',
        data: createSpreadsheetData(5, 5),
      }, true);

      expect(hot.themeManager).toBeNull();

      const plainThemeConfig = createValidThemeConfig({ name: 'update-plain-config-theme' });

      await updateSettings({
        theme: plainThemeConfig,
      });

      expect(hot.themeManager).not.toBeNull();
      expect(hot.themeManager.getClassName()).toBe('ht-theme-update-plain-config-theme');
      expect(getCurrentThemeName()).toBe('ht-theme-update-plain-config-theme');
    });

    it('should update existing themeManager when new theme object is passed', async() => {
      const testTheme1 = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'update-theme-1',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme1,
      }, true);

      expect(hot.themeManager.getClassName()).toBe('ht-theme-update-theme-1');

      const testTheme2 = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'update-theme-2',
      }));

      await updateSettings({
        theme: testTheme2,
      });

      expect(hot.themeManager.getClassName()).toBe('ht-theme-update-theme-2');
      expect(getCurrentThemeName()).toBe('ht-theme-update-theme-2');
      expect($(hot.rootWrapperElement).hasClass('ht-theme-update-theme-1')).toBe(false);
      expect($(hot.rootPortalElement).hasClass('ht-theme-update-theme-1')).toBe(false);
      expect($(hot.rootWrapperElement).hasClass('ht-theme-update-theme-2')).toBe(true);
      expect($(hot.rootPortalElement).hasClass('ht-theme-update-theme-2')).toBe(true);
    });

    it('should update existing themeManager with plain theme config (no getThemeConfig) via updateSettings', async() => {
      const testTheme1 = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'update-registered-first',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme1,
      }, true);

      expect(hot.themeManager.getClassName()).toBe('ht-theme-update-registered-first');

      const plainThemeConfig = createValidThemeConfig({ name: 'update-plain-when-manager-exists' });

      await updateSettings({
        theme: plainThemeConfig,
      });

      expect(hot.themeManager.getClassName()).toBe('ht-theme-update-plain-when-manager-exists');
      expect(getCurrentThemeName()).toBe('ht-theme-update-plain-when-manager-exists');
      expect($(hot.rootWrapperElement).hasClass('ht-theme-update-plain-when-manager-exists')).toBe(true);
    });

    it('should use theme object directly when it has getThemeConfig (registered theme) on update', async() => {
      const testTheme1 = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'getThemeConfig-theme-1',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme1,
      }, true);

      const testTheme2 = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'getThemeConfig-theme-2',
      }));

      expect(typeof testTheme2.getThemeConfig).toBe('function');

      await updateSettings({
        theme: testTheme2,
      });

      expect(hot.themeManager.getClassName()).toBe('ht-theme-getThemeConfig-theme-2');
      expect(getCurrentThemeName()).toBe('ht-theme-getThemeConfig-theme-2');
    });

    it('should fire afterSetTheme hook on theme update with initial flag set to false', async() => {
      const afterSetThemeSpy = jasmine.createSpy('afterSetTheme');
      const testTheme1 = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'hook-update-1',
      }));

      handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme1,
        afterSetTheme: afterSetThemeSpy,
      }, true);

      // Reset the spy after initialization call
      afterSetThemeSpy.calls.reset();

      const testTheme2 = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'hook-update-2',
      }));

      await updateSettings({
        theme: testTheme2,
      });

      expect(afterSetThemeSpy).toHaveBeenCalledWith('ht-theme-hook-update-2', true);
    });

    it('should update theme styles in the DOM after theme update', async() => {
      const testTheme1 = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'styles-update-1',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme1,
      }, true);

      expect(hot.rootWrapperElement.querySelector('style').textContent)
        .toContain('.ht-theme-styles-update-1');

      const testTheme2 = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'styles-update-2',
      }));

      await updateSettings({
        theme: testTheme2,
      });

      const styleContent = hot.rootWrapperElement.querySelector('style').textContent;

      expect(styleContent).toContain('.ht-theme-styles-update-2');
    });

    it('should unmount themeManager when switching from theme object to theme string', async() => {
      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'unmount-test-theme',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme,
      }, true);

      expect(hot.themeManager).not.toBeNull();

      const themeStyles = hot.rootWrapperElement.querySelector('style');

      expect(themeStyles).not.toBeNull();

      simulateModernThemeStylesheet(spec().$container);

      await updateSettings({
        theme: 'ht-theme-another',
      });

      // Theme styles should be removed when switching to string theme
      expect(themeStyles.parentNode).toBeNull();
    });

    it('should re-render when theme params are changed via ThemeBuilder subscription', async() => {
      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'subscription-test',
        colorScheme: 'light',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme,
      }, true);

      const renderSpy = spyOn(hot, 'render');

      // Update theme params which should trigger re-render via subscription
      testTheme.setColorScheme('dark');

      expect(renderSpy).toHaveBeenCalled();
    });

    it('should refresh selection border handle styles when theme is changed', async() => {
      const testTheme1 = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'border-handles-theme-1',
      }));
      const testTheme2 = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'border-handles-theme-2',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme1,
      }, true);

      expect(hot.view).toBeDefined();
      expect(hot.view._wt.selectionManager).toBeDefined();

      const refreshSpy = spyOn(hot.view._wt.selectionManager, 'refreshAllBorderHandleStyles');

      await updateSettings({
        theme: testTheme2,
      });

      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should destroy themeManager when Handsontable instance is destroyed', async() => {
      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'destroy-test-theme',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme,
      }, true);

      expect(hot.themeManager).not.toBeNull();

      destroy();

      expect(hot.themeManager).toBeNull();
    });

    it('should remove theme styles from DOM when Handsontable instance is destroyed', async() => {
      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'destroy-styles-theme',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme,
      }, true);

      const themeStyles = hot.rootWrapperElement.querySelector('style');

      expect(themeStyles).not.toBeNull();

      destroy();

      // After destroy, the style element should be detached
      expect(themeStyles.parentNode).toBeNull();
    });
  });

  describe('integration', () => {
    it('should maintain themeManager reference during multiple updateSettings calls', async() => {
      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'integration-theme',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme,
      }, true);

      const originalThemeManager = hot.themeManager;

      // Update unrelated settings
      await updateSettings({ colHeaders: true });
      await updateSettings({ rowHeaders: true });
      await updateSettings({ data: createSpreadsheetData(3, 3) });

      // themeManager should remain the same instance
      expect(hot.themeManager).toBe(originalThemeManager);
    });

    it('should properly handle theme switching between object and string themes', async() => {
      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'switch-test-theme',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme,
      }, true);

      expect(hot.themeManager).not.toBeNull();
      expect(getCurrentThemeName()).toBe('ht-theme-switch-test-theme');

      simulateModernThemeStylesheet(spec().$container);

      // Switch to string theme
      await updateSettings({ theme: 'ht-theme-string-theme' });

      expect(getCurrentThemeName()).toBe('ht-theme-string-theme');

      // Switch back to object theme
      const testTheme2 = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'switch-back-theme',
      }));

      await updateSettings({ theme: testTheme2 });

      expect(hot.themeManager).not.toBeNull();
      expect(getCurrentThemeName()).toBe('ht-theme-switch-back-theme');
    });

    it('should apply correct color scheme from theme config', async() => {
      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'colorscheme-theme',
        colorScheme: 'dark',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme,
      }, true);

      const styleContent = hot.rootWrapperElement.querySelector('style').textContent;

      expect(styleContent).toContain('color-scheme: dark');
    });

    it('should apply auto color scheme correctly', async() => {
      const testTheme = Handsontable.themes.registerTheme(createValidThemeConfig({
        name: 'auto-colorscheme-theme',
        colorScheme: 'auto',
      }));

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        theme: testTheme,
      }, true);

      const styleContent = hot.rootWrapperElement.querySelector('style').textContent;

      expect(styleContent).toContain('color-scheme: light dark');
    });
  });
});
