import { createThemeManager, ThemeManager } from '../manager';
import { createTheme } from '../builder';
import mainIcons from '../../static/variables/icons/main';
import mainColors from '../../static/variables/colors/main';
import mainTokens from '../../static/variables/tokens/main';

describe('ThemeManager', () => {
  const createValidThemeConfig = (overrides = {}) => ({
    name: 'test-theme',
    icons: mainIcons,
    colors: mainColors,
    tokens: mainTokens,
    ...overrides,
  });

  let guidCounter = 0;

  const createMockHot = () => {
    guidCounter += 1;

    return {
      guid: `ht_mock${guidCounter}`,
      rootDocument: document,
      rootWrapperElement: document.createElement('div'),
      rootPortalElement: document.createElement('div'),
      stylesHandler: {
        clearCache: jest.fn(),
      },
      render: jest.fn(),
      runHooks: jest.fn(),
    };
  };

  describe('createThemeManager', () => {
    it('should create a ThemeManager instance', () => {
      const mockHot = createMockHot();
      const themeObject = createTheme(createValidThemeConfig());

      const manager = createThemeManager({
        hot: mockHot,
        themeObject,
      });

      expect(manager).toBeInstanceOf(ThemeManager);
    });

    it('should throw error if theme is not a ThemeBuilder instance', () => {
      const mockHot = createMockHot();

      expect(() => createThemeManager({
        hot: mockHot,
        themeObject: { notATheme: true },
      })).toThrow('[ThemeManager] The "theme" option must be an instance of ThemeBuilder.');
    });
  });

  describe('ThemeManager', () => {
    describe('constructor', () => {
      it('should initialize with theme configuration', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        expect(manager.hot).toBe(mockHot);
        expect(manager.themeConfig).toBeDefined();
        expect(manager.themeClassName).toBe('ht-theme-test-theme');
      });

      it('should call afterSetTheme hook on initialization', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        // eslint-disable-next-line no-unused-vars
        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        expect(mockHot.runHooks).toHaveBeenCalledWith('afterSetTheme', 'ht-theme-test-theme', true);
      });
    });

    describe('getClassName', () => {
      it('should return the theme class name', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig({ name: 'my-custom-theme' }));

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        expect(manager.getClassName()).toBe('ht-theme-my-custom-theme');
      });
    });

    describe('update', () => {
      it('should update theme configuration', () => {
        const mockHot = createMockHot();
        const themeObject1 = createTheme(createValidThemeConfig({ name: 'theme-1' }));
        const themeObject2 = createTheme(createValidThemeConfig({ name: 'theme-2' }));

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject: themeObject1,
        });

        expect(manager.getClassName()).toBe('ht-theme-theme-1');

        manager.update(themeObject2);

        expect(manager.getClassName()).toBe('ht-theme-theme-2');
      });

      it('should throw error if updated theme is not a ThemeBuilder instance', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        expect(() => manager.update({ notATheme: true }))
          .toThrow('[ThemeManager] The "theme" option must be an instance of ThemeBuilder.');
      });

      it('should do nothing if hot is not defined', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        manager.hot = null;

        expect(() => manager.update(themeObject)).not.toThrow();
      });
    });

    describe('theme subscription', () => {
      it('should re-render when theme config changes', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        // eslint-disable-next-line no-unused-vars
        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        // Simulate theme change
        themeObject.setColorScheme('dark');

        expect(mockHot.stylesHandler.clearCache).toHaveBeenCalled();
        expect(mockHot.render).toHaveBeenCalled();
        expect(mockHot.runHooks).toHaveBeenCalledWith('afterSetTheme', 'ht-theme-test-theme', false);
      });
    });

    describe('mount', () => {
      it('should inject theme styles into the DOM', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        manager.mount();

        const styleElement = mockHot.rootWrapperElement.querySelector('style');

        expect(styleElement).toBeTruthy();
        expect(styleElement.textContent).toContain('.ht-theme-test-theme');
        expect(styleElement.textContent).toContain('color-scheme:');
      });

      it('should include sizing CSS variables', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig({
          sizing: { size_1: 8 },
        }));

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        manager.mount();

        const styleElement = mockHot.rootWrapperElement.querySelector('style');

        expect(styleElement.textContent).toContain('--ht-sizing');
      });

      it('should include density CSS variables', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        themeObject.setDensityType('compact');

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        manager.mount();

        const styleElement = mockHot.rootWrapperElement.querySelector('style');

        expect(styleElement.textContent).toContain('--ht-density');
      });

      it('should include colors CSS variables', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        manager.mount();

        const styleElement = mockHot.rootWrapperElement.querySelector('style');

        expect(styleElement.textContent).toContain('--ht-colors-primary');
      });

      it('should handle auto color scheme', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig({
          colorScheme: 'auto',
        }));

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        manager.mount();

        const styleElement = mockHot.rootWrapperElement.querySelector('style');

        expect(styleElement.textContent).toContain('color-scheme: light dark');
      });

      it('should handle light color scheme', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig({
          colorScheme: 'light',
        }));

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        manager.mount();

        const styleElement = mockHot.rootWrapperElement.querySelector('style');

        expect(styleElement.textContent).toContain('color-scheme: light');
      });

      it('should handle dark color scheme', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig({
          colorScheme: 'dark',
        }));

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        manager.mount();

        const styleElement = mockHot.rootWrapperElement.querySelector('style');

        expect(styleElement.textContent).toContain('color-scheme: dark');
      });
    });

    describe('unmount', () => {
      it('should remove theme styles from the DOM', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        manager.mount();

        expect(mockHot.rootWrapperElement.querySelector('style')).toBeTruthy();

        manager.unmount();

        expect(manager.themeStyles.parentNode).toBeNull();
      });

      it('should handle unmount when no styles were mounted', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        manager.themeStyles = null;

        expect(() => manager.unmount()).not.toThrow();
      });
    });

    describe('destroy', () => {
      it('should unmount and clean up references', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        manager.mount();
        manager.destroy();

        expect(mockHot.themeManager).toBeNull();
      });

      it('should unsubscribe from the theme object on destroy (regression: #12568)', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        // eslint-disable-next-line no-unused-vars
        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        manager.destroy();
        mockHot.render.mockClear();
        mockHot.stylesHandler.clearCache.mockClear();

        // Changing the theme after destroy must NOT trigger re-renders — the
        // subscription must have been removed. Before the fix, destroy() did not
        // call the unsubscribe function returned by themeObject.subscribe(), so
        // the listener stayed alive and caused a memory leak.
        themeObject.setColorScheme('dark');

        expect(mockHot.render).not.toHaveBeenCalled();
        expect(mockHot.stylesHandler.clearCache).not.toHaveBeenCalled();
      });

      it('should not accumulate subscriptions across multiple update() calls (regression: #12568)', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        // eslint-disable-next-line no-unused-vars
        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        // Simulate React re-mounting the same themeObject on multiple updateSettings calls.
        // Before the fix, each update() added another listener without removing the previous one.
        manager.update(themeObject);
        manager.update(themeObject);
        manager.update(themeObject);

        mockHot.render.mockClear();

        themeObject.setColorScheme('dark');

        // With the fix, only one listener is active — render called exactly once.
        // Without the fix, render would be called N times (once per accumulated subscription).
        expect(mockHot.render).toHaveBeenCalledTimes(1);
      });
    });

    describe('per-instance overrides (colorScheme and density)', () => {
      it('should apply the colorScheme override to a scoped rule', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'dark' },
        });

        const scopedRule = `.ht-theme-test-theme.${manager.scopeClassName}`;

        expect(manager.themeStyles.textContent)
          .toContain(`${scopedRule} {\ncolor-scheme: dark;\n`);
      });

      it('should pin the theme colors to the override scheme instead of relying on light-dark()', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig({ colorScheme: 'light' }));

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'dark' },
        });

        const scopedBlock = manager.themeStyles.textContent
          .split(`.ht-theme-test-theme.${manager.scopeClassName} {`)[1];

        // `backgroundColor` is ['colors.white', 'colors.palette.950'] in the main theme. The scoped
        // block must carry the DARK branch outright — the minified theme stylesheets do not use
        // light-dark(), so a bare `color-scheme` flip would leave the light colors in place.
        expect(scopedBlock).toContain('--ht-background-color: var(--ht-colors-palette-950);');
        expect(scopedBlock).not.toContain('--ht-background-color: light-dark(');
      });

      it('should pin the light branch and add a media query for the "auto" scheme', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig({ colorScheme: 'light' }));

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'auto' },
        });

        const cssText = manager.themeStyles.textContent;
        const mediaBlock = cssText.split('@media (prefers-color-scheme: dark) {')[1];

        // 'auto' must follow the operating system without light-dark(), the same way the static
        // `-dark-auto` class does: light values by default, dark ones behind the media query.
        expect(cssText).toContain('--ht-background-color: var(--ht-colors-white);');
        expect(mediaBlock).toBeDefined();
        expect(mediaBlock).toContain(`.ht-theme-test-theme.${manager.scopeClassName} {`);
        expect(mediaBlock).toContain('--ht-background-color: var(--ht-colors-palette-950);');
      });

      it('should not repeat variables that are the same in both schemes', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'dark' },
        });

        const scopedBlock = manager.themeStyles.textContent
          .split(`.ht-theme-test-theme.${manager.scopeClassName} {`)[1];

        // `fontSize` carries one value for both schemes, so the override block has no reason to
        // restate it. Only light/dark pairs belong there.
        expect(scopedBlock).not.toContain('--ht-font-size:');
      });

      it('should resolve the "auto" colorScheme override to "light dark"', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig({ colorScheme: 'light' }));

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'auto' },
        });

        expect(manager.themeStyles.textContent)
          .toContain(`.ht-theme-test-theme.${manager.scopeClassName} {\ncolor-scheme: light dark;\n`);
      });

      it('should apply the density override using the sizes of the requested preset', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { density: 'compact' },
        });

        const scopedBlock = manager.themeStyles.textContent
          .split(`.ht-theme-test-theme.${manager.scopeClassName} {`)[1];

        // `compact` maps cellVertical to sizing.size_0_5, while `default` maps it to sizing.size_1.
        expect(scopedBlock).toContain('--ht-density-cell-vertical: var(--ht-sizing-size-0-5);');
      });

      it('should not apply any scoped rule when no override is set', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        expect(manager.themeStyles.textContent).not.toContain(manager.scopeClassName);
      });

      it('should leave the shared theme object untouched so other instances keep their look', () => {
        const themeObject = createTheme(createValidThemeConfig({
          colorScheme: 'light',
          density: 'default',
        }));
        const managerA = new ThemeManager({
          hot: createMockHot(),
          themeObject,
          overrides: { colorScheme: 'dark', density: 'compact' },
        });
        const managerB = new ThemeManager({
          hot: createMockHot(),
          themeObject,
        });

        // The theme object itself must not have been mutated by instance A.
        expect(themeObject.getThemeConfig().colorScheme).toBe('light');
        expect(themeObject.getThemeConfig().density.type).toBe('default');

        // Instance B must not pick up instance A's overrides.
        expect(managerB.getOverrides()).toEqual({});
        expect(managerB.themeStyles.textContent).not.toContain('color-scheme: dark');

        // Every rule carrying instance A's override must be gated behind A's scope class. An
        // unscoped rule would match any element with the theme class, instance B's included.
        const selectorsDeclaring = (manager, declaration) => manager.themeStyles.textContent
          .split('}')
          .filter(block => block.includes(declaration))
          .map(block => block.split('{')[0]);

        const darkSelectors = selectorsDeclaring(managerA, 'color-scheme: dark');
        // `compact` maps cellVertical to sizing.size_0_5, `default` maps it to sizing.size_1.
        const compactSelectors = selectorsDeclaring(
          managerA, '--ht-density-cell-vertical: var(--ht-sizing-size-0-5);'
        );

        expect(darkSelectors).toHaveLength(1);
        expect(compactSelectors).toHaveLength(1);
        [...darkSelectors, ...compactSelectors].forEach((selector) => {
          expect(selector).toContain(managerA.scopeClassName);
        });
      });

      it('should scope the overrides of two instances to different classes', () => {
        const themeObject = createTheme(createValidThemeConfig());
        const managerA = new ThemeManager({
          hot: createMockHot(),
          themeObject,
          overrides: { colorScheme: 'dark' },
        });
        const managerB = new ThemeManager({
          hot: createMockHot(),
          themeObject,
          overrides: { colorScheme: 'light' },
        });

        expect(managerA.scopeClassName).not.toBe(managerB.scopeClassName);
        expect(managerB.themeStyles.textContent).not.toContain(managerA.scopeClassName);
      });

      it('should stamp the scope class on both the wrapper and the portal element', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'dark' },
        });

        expect(mockHot.rootWrapperElement.classList.contains(manager.scopeClassName)).toBe(true);
        expect(mockHot.rootPortalElement.classList.contains(manager.scopeClassName)).toBe(true);
      });

      it('should remove the scope class from both elements on unmount', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'dark' },
        });

        manager.unmount();

        expect(mockHot.rootWrapperElement.classList.contains(manager.scopeClassName)).toBe(false);
        expect(mockHot.rootPortalElement.classList.contains(manager.scopeClassName)).toBe(false);
      });

      it('should report a change and re-inject the styles when setOverrides changes a value', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
        });

        expect(manager.setOverrides({ colorScheme: 'dark' })).toBe(true);
        expect(manager.themeStyles.textContent)
          .toContain(`.ht-theme-test-theme.${manager.scopeClassName} {\ncolor-scheme: dark;\n`);
      });

      it('should report no change when setOverrides is called with the same value', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'dark' },
        });

        expect(manager.setOverrides({ colorScheme: 'dark' })).toBe(false);
      });

      it('should keep an override that is absent from the next setOverrides call', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'dark', density: 'compact' },
        });

        manager.setOverrides({ density: 'comfortable' });

        expect(manager.getOverrides()).toEqual({ colorScheme: 'dark', density: 'comfortable' });
      });

      it('should clear an override that is explicitly set to undefined', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig({ colorScheme: 'light' }));

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'dark' },
        });

        expect(manager.setOverrides({ colorScheme: undefined })).toBe(true);
        expect(manager.getOverrides().colorScheme).toBeUndefined();
        expect(manager.getColorScheme()).toBe('light');
        expect(manager.themeStyles.textContent).not.toContain(manager.scopeClassName);
      });

      it('should report the effective colorScheme and density', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig({
          colorScheme: 'light',
          density: 'default',
        }));

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { density: 'comfortable' },
        });

        expect(manager.getColorScheme()).toBe('light');
        expect(manager.getDensityType()).toBe('comfortable');
      });

      it('should throw on an unsupported colorScheme value', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        expect(() => new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'sepia' },
        })).toThrow('[ThemeBuilder] Invalid color scheme: "sepia".');
      });

      it('should throw on an unsupported density value', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        expect(() => new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { density: 'roomy' },
        })).toThrow('[ThemeBuilder] Invalid density: "roomy".');
      });

      it('should keep the overrides after the theme object is updated', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'dark' },
        });

        manager.update(createTheme(createValidThemeConfig({ name: 'other-theme' })));

        expect(manager.getOverrides().colorScheme).toBe('dark');
        expect(manager.themeStyles.textContent)
          .toContain(`.ht-theme-other-theme.${manager.scopeClassName} {\ncolor-scheme: dark;\n`);
      });
    });
  });
});
