import {
  hasTheme,
  getTheme,
  getThemeNames,
  getThemes,
  registerTheme,
  reinitTheme,
} from 'handsontable/themes/registry';
import { staticRegister } from 'handsontable/utils/staticRegister';
import mainIcons from 'handsontable/themes/static/variables/icons/main';
import mainColors from 'handsontable/themes/static/variables/colors/main';
import mainTokens from 'handsontable/themes/static/variables/tokens/main';
import type { BaseTheme } from 'handsontable/themes/types';

describe('Theme Registry', () => {
  const createValidConfig = (name = 'test-theme'): BaseTheme => ({
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
      const config: BaseTheme = {
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
      const config: BaseTheme = {
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
      expect(() => registerTheme('invalid', null as unknown as BaseTheme))
        .toThrow();
      expect(() => registerTheme(null as unknown as BaseTheme))
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

  describe('reinitTheme', () => {
    it('should reinitialize an existing theme with name and config', () => {
      const originalConfig = createValidConfig('reinit-theme');

      registerTheme(originalConfig);

      const reinitConfig: BaseTheme = {
        ...createValidConfig('reinit-theme'),
        colors: {
          ...mainColors,
          primary: '#ff0000',
        },
      };

      const reinitializedTheme = reinitTheme('reinit-theme', reinitConfig);

      expect(reinitializedTheme).toBeDefined();
      expect(hasTheme('reinit-theme')).toBe(true);
      expect(reinitializedTheme!.getThemeConfig().colors.primary).toBe('#ff0000');
    });

    it('should reinitialize an existing theme with config object containing name', () => {
      const originalConfig = createValidConfig('reinit-config-theme');

      registerTheme(originalConfig);

      const reinitConfig = createValidConfig('reinit-config-theme');

      reinitConfig.colors = {
        ...mainColors,
        primary: '#00ff00',
      };

      const reinitializedTheme = reinitTheme(reinitConfig);

      expect(reinitializedTheme).toBeDefined();
      expect(hasTheme('reinit-config-theme')).toBe(true);
      expect(reinitializedTheme!.getThemeConfig().colors.primary).toBe('#00ff00');
    });

    it('should return undefined and warn when reinitializing non-existing theme', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = reinitTheme('non-existing-theme', createValidConfig('non-existing-theme'));

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Theme "non-existing-theme" is not registered. Cannot reinitialize a non-existent theme.'
        )
      );

      consoleSpy.mockRestore();
    });

    it('should replace the existing theme instance', () => {
      const originalTheme = registerTheme(createValidConfig('replace-theme'));
      const reinitializedTheme = reinitTheme('replace-theme', createValidConfig('replace-theme'));

      expect(reinitializedTheme).not.toBe(originalTheme);
      expect(getTheme('replace-theme')).toBe(reinitializedTheme);
      expect(getTheme('replace-theme')).not.toBe(originalTheme);
    });

    it('should return a ThemeBuilder instance', () => {
      registerTheme(createValidConfig('builder-theme'));
      const reinitializedTheme = reinitTheme('builder-theme', createValidConfig('builder-theme'));

      expect(typeof reinitializedTheme!.getThemeConfig).toBe('function');
      expect(typeof reinitializedTheme!.params).toBe('function');
      expect(typeof reinitializedTheme!.setColorScheme).toBe('function');
      expect(typeof reinitializedTheme!.setDensityType).toBe('function');
    });
  });

  describe('deep clone behavior', () => {
    it('should deep clone config to prevent mutation', () => {
      const config = createValidConfig('clone-test');
      const originalPrimary = (config.colors as Record<string, unknown>).primary;

      registerTheme(config);

      // Mutate original config
      (config.colors as Record<string, unknown>).primary = '#fff';

      const theme = getTheme('clone-test');

      // The registered theme should still have the original value, not the mutated one
      expect(theme!.getThemeConfig().colors.primary).toEqual(originalPrimary);
      expect(theme!.getThemeConfig().colors.primary).not.toBe('#fff');
    });
  });
});
