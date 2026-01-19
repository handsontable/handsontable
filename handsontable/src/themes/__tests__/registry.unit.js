import {
  hasTheme,
  getTheme,
  getThemeNames,
  getThemes,
  registerTheme,
} from '../registry';
import { staticRegister } from '../../utils/staticRegister';
import mainIcons from '../static/variables/icons/main';
import mainColors from '../static/variables/colors/main';
import mainTokens from '../static/variables/tokens/main';

describe('Theme Registry', () => {
  const createValidConfig = (name = 'test-theme') => ({
    name,
    icons: mainIcons,
    colors: mainColors,
    tokens: mainTokens,
  });

  // Clear the themes namespace before each test
  beforeEach(() => {
    const { clear } = staticRegister('themes');

    clear();
  });

  describe('registerTheme', () => {
    it('should register a theme with name and config', () => {
      const config = {
        icons: mainIcons,
        colors: mainColors,
        tokens: mainTokens,
      };

      const theme = registerTheme('my-theme', config);

      expect(theme).toBeDefined();
      expect(hasTheme('my-theme')).toBe(true);
    });

    it('should register a theme with config object containing name', () => {
      const config = createValidConfig('another-theme');

      const theme = registerTheme(config);

      expect(theme).toBeDefined();
      expect(hasTheme('another-theme')).toBe(true);
    });

    it('should return a ThemeBuilder instance', () => {
      const theme = registerTheme(createValidConfig());

      expect(typeof theme.getThemeConfig).toBe('function');
      expect(typeof theme.params).toBe('function');
      expect(typeof theme.setColorScheme).toBe('function');
      expect(typeof theme.setDensityType).toBe('function');
    });

    it('should use first argument as name when both string and config provided', () => {
      const config = {
        icons: {},
        colors: {},
        tokens: {},
      };

      const theme = registerTheme('override-name', config);

      expect(hasTheme('override-name')).toBe(true);
      expect(theme.getThemeConfig().name).toBe('override-name');
    });

    it('should warn and return existing theme when registering duplicate', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const theme1 = registerTheme(createValidConfig('duplicate-theme'));
      const theme2 = registerTheme(createValidConfig('duplicate-theme'));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Theme "duplicate-theme" is already registered')
      );
      expect(theme1).toBe(theme2);

      consoleSpy.mockRestore();
    });

    it('should throw error for invalid config', () => {
      expect(() => registerTheme('invalid', null))
        .toThrow();
      expect(() => registerTheme(null))
        .toThrow();
    });
  });

  describe('hasTheme', () => {
    it('should return true for registered theme', () => {
      registerTheme(createValidConfig('existing-theme'));

      expect(hasTheme('existing-theme')).toBe(true);
    });

    it('should return false for non-existing theme', () => {
      expect(hasTheme('non-existing')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasTheme('')).toBe(false);
    });
  });

  describe('getTheme', () => {
    it('should return registered theme', () => {
      const originalTheme = registerTheme(createValidConfig('my-theme'));
      const retrievedTheme = getTheme('my-theme');

      expect(retrievedTheme).toBe(originalTheme);
    });

    it('should return undefined for non-existing theme', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = getTheme('non-existing');

      expect(result).toBeUndefined();

      consoleSpy.mockRestore();
    });

    it('should warn when theme is not registered', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      getTheme('unregistered-theme');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Theme "unregistered-theme" is not registered')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getThemeNames', () => {
    it('should return array containing registered theme names', () => {
      registerTheme(createValidConfig('theme-names-a'));
      registerTheme(createValidConfig('theme-names-b'));
      registerTheme(createValidConfig('theme-names-c'));

      const names = getThemeNames();

      expect(names).toContain('theme-names-a');
      expect(names).toContain('theme-names-b');
      expect(names).toContain('theme-names-c');
    });
  });

  describe('getThemes', () => {
    it('should return array containing registered themes', () => {
      const theme1 = registerTheme(createValidConfig('themes-1'));
      const theme2 = registerTheme(createValidConfig('themes-2'));

      const themes = getThemes();

      expect(themes).toContain(theme1);
      expect(themes).toContain(theme2);
    });

    it('should return ThemeBuilder instances', () => {
      registerTheme(createValidConfig('themes-instance'));

      const themes = getThemes();

      themes.forEach((theme) => {
        expect(typeof theme.getThemeConfig).toBe('function');
        expect(typeof theme.params).toBe('function');
      });
    });
  });

  describe('deep clone behavior', () => {
    it('should deep clone config to prevent mutation', () => {
      const config = createValidConfig('clone-test');
      const originalPrimary = config.colors.primary;

      registerTheme(config);

      // Mutate original config
      config.colors.primary = '#fff';

      const theme = getTheme('clone-test');

      // The registered theme should still have the original value, not the mutated one
      expect(theme.getThemeConfig().colors.primary).toEqual(originalPrimary);
      expect(theme.getThemeConfig().colors.primary).not.toBe('#fff');
    });
  });
});
