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

  const createMockHot = () => ({
    rootDocument: document,
    rootWrapperElement: document.createElement('div'),
    stylesHandler: {
      clearCache: jest.fn(),
    },
    render: jest.fn(),
    runHooks: jest.fn(),
  });

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
  });
});
