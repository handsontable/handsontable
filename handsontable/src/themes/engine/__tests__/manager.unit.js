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
        // block must carry the DARK branch outright: against a stylesheet built below the
        // `light-dark()` floor, a bare `color-scheme` flip would leave the light colors in place.
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

      it('should warn and ignore an unsupported colorScheme value instead of throwing', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig({ colorScheme: 'light' }));
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        let manager;

        // Throwing here would abort `updateSettings()` half way through and leave the bad value in
        // the grid meta, which then breaks every later theme change.
        expect(() => {
          manager = new ThemeManager({
            hot: mockHot,
            themeObject,
            overrides: { colorScheme: 'sepia' },
          });
        }).not.toThrow();

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Ignoring the `colorScheme` option')
        );
        expect(manager.getOverrides().colorScheme).toBeUndefined();
        expect(manager.getColorScheme()).toBe('light');

        warnSpy.mockRestore();
      });

      it('should warn and ignore an unsupported density value instead of throwing', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        let manager;

        expect(() => {
          manager = new ThemeManager({
            hot: mockHot,
            themeObject,
            overrides: { density: 'roomy' },
          });
        }).not.toThrow();

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Ignoring the `density` option')
        );
        expect(manager.getOverrides().density).toBeUndefined();

        warnSpy.mockRestore();
      });

      it('should keep the applied value when a later update is unsupported', () => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig());
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'dark' },
        });

        expect(manager.setOverrides({ colorScheme: 'sepia' })).toBe(false);
        expect(manager.getOverrides().colorScheme).toBe('dark');

        warnSpy.mockRestore();
      });

      it.each([[null], [false], ['']])('should treat %p as clearing the override', (emptyValue) => {
        const mockHot = createMockHot();
        const themeObject = createTheme(createValidThemeConfig({ colorScheme: 'light' }));
        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { colorScheme: 'dark' },
        });

        expect(manager.setOverrides({ colorScheme: emptyValue })).toBe(true);
        expect(manager.getOverrides().colorScheme).toBeUndefined();
        expect(manager.getColorScheme()).toBe('light');
      });

      it('should warn when the theme has no sizes for the requested density', () => {
        const mockHot = createMockHot();
        // `createTheme()` backfills every built-in density preset, so a theme that genuinely lacks
        // one can only arrive as a custom object exposing `getThemeConfig()`. That is the path core
        // takes for any `theme` option that already looks like a builder.
        const themeObject = {
          getThemeConfig: () => ({
            name: 'partial-theme',
            colorScheme: 'light',
            density: { type: 'default', sizes: { default: { cellVertical: 'sizing.size_1' } } },
            colors: {},
            tokens: {},
            icons: {},
          }),
        };
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const manager = new ThemeManager({
          hot: mockHot,
          themeObject,
          overrides: { density: 'comfortable' },
        });

        // Without the warning the option looks applied while nothing changes on screen. No scoped
        // rule is emitted at all here, since density was the only override requested.
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('has no "comfortable" density sizes')
        );
        expect(manager.themeStyles.textContent).not.toContain(manager.scopeClassName);
        expect(manager.getDensityType()).toBe('comfortable');

        warnSpy.mockRestore();
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

    describe('icons', () => {
      const hot = () => createMockHot();

      it('emits a CSS variable per glyph icon and a glyph rule', () => {
        const mockHot = hot();
        const manager = createThemeManager({
          hot: mockHot,
          themeObject: createTheme(createValidThemeConfig({
            icons: { arrowRight: 'data:image/svg+xml,%3Csvg%3E' },
          })),
        });

        const css = manager.themeStyles.textContent;

        expect(css).toContain('--ht-icon-arrow-right: url("data:image/svg+xml,%3Csvg%3E");');
        expect(css).toContain('.ht-icon-arrow-right {');
      });

      it('encodes raw SVG markup as a data URI', () => {
        const mockHot = hot();
        const manager = createThemeManager({
          hot: mockHot,
          themeObject: createTheme(createValidThemeConfig({ icons: { check: '<svg viewBox="0 0 1 1"/>' } })),
        });
        const expectedUri = encodeURIComponent('<svg viewBox="0 0 1 1"/>');

        expect(manager.themeStyles.textContent)
          .toContain(`--ht-icon-check: url("data:image/svg+xml;charset=utf-8,${expectedUri}");`);
      });

      it('does not emit variables for class-list or renderer icons', () => {
        const mockHot = hot();
        const manager = createThemeManager({
          hot: mockHot,
          themeObject: createTheme(createValidThemeConfig({
            icons: { arrowRight: 'ti ti-chevron-right', check: () => {} },
          })),
        });

        expect(manager.themeStyles.textContent).not.toContain('--ht-icon-arrow-right');
        expect(manager.themeStyles.textContent).not.toContain('--ht-icon-check');
      });

      it('does not corrupt the injected stylesheet when an icon is mapped to a renderer ' +
        'callback (DEV-3003 task 21)', () => {
        // `#resolveIcons()` splits the theme's icon config into a glyph-only map before ANY of
        // it reaches CSS text (`iconStyles(glyphs, ...)`, the only remaining serializer since
        // DEV-3003 task 22 deleted the legacy `iconsMap()` pseudo-element generator, which used
        // to receive the RAW, unsplit config and broke the whole `:where()` rule's parsing when
        // a callback's own source text was stringified into it). This proves the split, not a
        // since-deleted call site: a renderer-callback icon contributes no glyph variable or
        // rule of its own, while the rest of the stylesheet - sizing and every OTHER icon's
        // glyph variable - stays intact.
        const mockHot = hot();
        const manager = createThemeManager({
          hot: mockHot,
          themeObject: createTheme(createValidThemeConfig({
            icons: {
              ...mainIcons,
              check: (element) => {
                element.textContent = 'check_circle';
              },
            },
          })),
        });

        const css = manager.themeStyles.textContent;

        // A glyph left unmapped by the callback still gets its own variable and rule - proof the
        // rest of the stylesheet is intact, not merely that this one call did not throw.
        expect(css).toContain('--ht-icon-arrow-right:');
        expect(css).toContain('.ht-icon-arrow-right {');
        expect(css).toContain('--ht-sizing-size-1:');
        expect(css).not.toContain('--ht-icon-check:');
        expect(css).not.toContain('.ht-icon-check {');
        expect(css).not.toContain('element.textContent');
      });

      it('creates a plain glyph element', () => {
        const manager = createThemeManager({ hot: hot(), themeObject: createTheme(createValidThemeConfig()) });
        const el = manager.createIcon('arrowRight', { flipInRtl: true, className: 'slot' });

        expect(el.tagName).toBe('I');
        expect(el.getAttribute('aria-hidden')).toBe('true');
        expect(el.className).toBe('ht-icon ht-icon-arrow-right ht-icon--flip-rtl slot');
        expect(el.textContent).toBe('');
      });

      it('applies a class list for an external icon', () => {
        const manager = createThemeManager({
          hot: hot(),
          themeObject: createTheme(createValidThemeConfig({ icons: { arrowRight: 'ti ti-chevron-right' } })),
        });
        const el = manager.createIcon('arrowRight');

        expect(el.className).toBe('ht-icon ht-icon-arrow-right ht-icon--external ti ti-chevron-right');
      });

      it('calls a renderer for a callback icon', () => {
        const renderer = jest.fn((el, name) => { el.textContent = name; });
        const manager = createThemeManager({
          hot: hot(),
          themeObject: createTheme(createValidThemeConfig({ icons: { check: renderer } })),
        });
        const el = manager.createIcon('check');

        expect(renderer).toHaveBeenCalledWith(el, 'check');
        expect(el.className).toBe('ht-icon ht-icon-check ht-icon--external');
        expect(el.textContent).toBe('check');
      });

      it('re-resolves icons when the theme config changes', () => {
        const theme = createTheme(createValidThemeConfig());
        const manager = createThemeManager({ hot: hot(), themeObject: theme });

        expect(manager.createIcon('arrowRight').className).toBe('ht-icon ht-icon-arrow-right');

        theme.params({ icons: { arrowRight: 'ti ti-x' } });

        expect(manager.createIcon('arrowRight').className)
          .toBe('ht-icon ht-icon-arrow-right ht-icon--external ti ti-x');
      });

      describe('getIconsRevision (DEV-3003)', () => {
        it('bumps the revision on every path that re-resolves icons, so `syncIcon()`\'s ' +
          'keep-path guard can never be bypassed by a re-resolve it does not know about', () => {
          // This is deliberately NOT a comment enumerating call sites - it drives every KNOWN
          // path that reaches `#resolveIcons()` and asserts the one thing `syncIcon()` actually
          // reads (`getIconsRevision()`) moves every time, through the public API only.
          const mockHot = hot();
          const theme = createTheme(createValidThemeConfig({ name: 'revision-theme' }));
          const manager = createThemeManager({ hot: mockHot, themeObject: theme });

          const afterConstruction = manager.getIconsRevision();

          expect(afterConstruction).toEqual(expect.any(Number));

          // Path 1: `update()` with a brand new theme object (e.g. `useTheme()` at runtime) whose
          // icons DIFFER. A theme that maps the same icons leaves every kept element correct, so it
          // must not bump (asserted further down).
          manager.update(createTheme(createValidThemeConfig({
            name: 'revision-theme-2',
            icons: { arrowRight: 'url(other.svg)' },
          })));
          const afterUpdate = manager.getIconsRevision();

          expect(afterUpdate).toBeGreaterThan(afterConstruction);

          // Path 2: the SUBSCRIBED theme notifying a config change (`theme.params()`), the path
          // this whole guard exists for.
          const subscribedTheme = createTheme(createValidThemeConfig({ name: 'revision-theme-3' }));

          manager.update(subscribedTheme);
          const afterSubscribedUpdate = manager.getIconsRevision();

          subscribedTheme.params({ icons: { arrowRight: 'ti ti-x' } });
          const afterThemeParamsChange = manager.getIconsRevision();

          expect(afterThemeParamsChange).toBeGreaterThan(afterSubscribedUpdate);

          // Path 3: `setOverrides()` (color scheme / density) re-injects the theme styles, which
          // re-resolves the icons - but nothing about them changed, so the revision must hold, or
          // every kept icon on the grid is re-applied for a density switch (PR #13639 review).
          manager.setOverrides({ colorScheme: 'dark' });
          manager.setOverrides({ density: 'compact' });

          expect(manager.getIconsRevision()).toBe(afterThemeParamsChange);

          // A `params()` call that re-states the SAME mapping is not a change either.
          subscribedTheme.params({ icons: { arrowRight: 'ti ti-x' } });

          expect(manager.getIconsRevision()).toBe(afterThemeParamsChange);

          // Changing a value bumps; a renderer callback counts by identity, so a new function is a
          // change and the same function is not.
          const renderer = () => {};

          subscribedTheme.params({ icons: { arrowRight: renderer } });
          const afterRenderer = manager.getIconsRevision();

          expect(afterRenderer).toBeGreaterThan(afterThemeParamsChange);

          subscribedTheme.params({ icons: { arrowRight: renderer } });

          expect(manager.getIconsRevision()).toBe(afterRenderer);
        });
      });
    });
  });
});
