import { createTheme } from '../builder';
import mainIcons from '../../static/variables/icons/main';
import mainColors from '../../static/variables/colors/main';
import mainTokens from '../../static/variables/tokens/main';

describe('ThemeBuilder', () => {
  const createValidConfig = (overrides = {}) => ({
    name: 'test-theme',
    icons: mainIcons,
    colors: mainColors,
    tokens: mainTokens,
    ...overrides,
  });

  describe('createTheme', () => {
    it('should create a ThemeBuilder instance', () => {
      const theme = createTheme(createValidConfig());

      expect(theme).toBeDefined();
      expect(typeof theme.getThemeConfig).toBe('function');
      expect(typeof theme.params).toBe('function');
      expect(typeof theme.setColorScheme).toBe('function');
      expect(typeof theme.setDensityType).toBe('function');
      expect(typeof theme.subscribe).toBe('function');
    });

    it('should throw error for missing required fields', () => {
      expect(() => createTheme({}))
        .toThrow('[ThemeBuilder] themeConfig.name is required.');

      expect(() => createTheme({ name: 'test' }))
        .toThrow('[ThemeBuilder] themeConfig.icons is required.');

      expect(() => createTheme({ name: 'test', icons: {} }))
        .toThrow('[ThemeBuilder] themeConfig.colors is required.');

      expect(() => createTheme({ name: 'test', icons: {}, colors: {} }))
        .toThrow('[ThemeBuilder] themeConfig.tokens is required.');
    });

    it('should throw error for non-object config', () => {
      expect(() => createTheme(null))
        .toThrow('[ThemeBuilder] themeConfig must be an object.');
      expect(() => createTheme('string'))
        .toThrow('[ThemeBuilder] themeConfig must be an object.');
    });

    it('should warn for unknown param keys in createTheme', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      createTheme(createValidConfig({
        unknownParam: 'value',
      }));

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeBuilder] Unknown param key: "unknownParam" in themeConfig. ' +
        'This may be a custom param or a typo.'
      );

      consoleSpy.mockRestore();
    });

    it('should warn for unknown icon keys in createTheme', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      createTheme(createValidConfig({
        icons: {
          ...mainIcons,
          unknownIcon: '<svg></svg>',
        },
      }));

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeBuilder] Unknown icon key: "unknownIcon" in themeConfig.icons. ' +
        'This may be a custom icon or a typo.'
      );

      consoleSpy.mockRestore();
    });

    it('should warn for unknown token keys in createTheme', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      createTheme(createValidConfig({
        tokens: {
          ...mainTokens,
          unknownToken: '10px',
        },
      }));

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeBuilder] Unknown token key: "unknownToken" in themeConfig.tokens. ' +
        'This may be a custom token or a typo.'
      );

      consoleSpy.mockRestore();
    });

    it('should not warn for unknown token keys when using built-in tokens in createTheme', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      createTheme(createValidConfig({
        tokens: mainTokens,
      }));

      const unknownTokenWarnings = consoleSpy.mock.calls
        .map(([message]) => message)
        .filter(message => message.startsWith('[ThemeBuilder] Unknown token key:'));

      expect(unknownTokenWarnings).toEqual([]);

      consoleSpy.mockRestore();
    });

    it('should warn for missing icon keys in createTheme', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      createTheme({
        name: 'test-theme',
        icons: { arrowRight: '<svg></svg>' }, // Only one icon, others missing
        colors: mainColors,
        tokens: mainTokens,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[ThemeBuilder\] Missing icon\(s\) in themeConfig\.icons:/)
      );

      consoleSpy.mockRestore();
    });

    it('should warn for missing token keys in createTheme', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      createTheme({
        name: 'test-theme',
        icons: mainIcons,
        colors: mainColors,
        tokens: { fontSize: '14px' }, // Only one token, others missing
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[ThemeBuilder\] Missing token\(s\) in themeConfig\.tokens:/)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getThemeConfig', () => {
    it('should return the theme configuration', () => {
      const config = createValidConfig();
      const theme = createTheme(config);
      const result = theme.getThemeConfig();

      expect(result.name).toBe('test-theme');
      expect(result.icons).toEqual(mainIcons);
      expect(result.colors).toEqual(mainColors);
      expect(result.tokens).toEqual(mainTokens);
    });

    it('should include default values', () => {
      const theme = createTheme(createValidConfig());
      const result = theme.getThemeConfig();

      expect(result.sizing).toBeDefined();
      expect(result.density).toBeDefined();
      expect(result.density.type).toBe('default');
      expect(result.colorScheme).toBe('auto');
    });

    it('should merge user config with defaults', () => {
      const theme = createTheme(createValidConfig({
        colorScheme: 'dark',
        density: 'compact',
      }));
      const result = theme.getThemeConfig();

      expect(result.colorScheme).toBe('dark');
      expect(result.density.type).toBe('compact');
    });
  });

  describe('params', () => {
    it('should update theme parameters', () => {
      const theme = createTheme(createValidConfig());

      theme.params({
        colors: {
          secondary: '#fff',
        },
      });

      const result = theme.getThemeConfig();

      expect(result.colors.primary).toEqual(mainColors.primary);
      expect(result.colors.secondary).toBe('#fff');
    });

    it('should deeply merge nested objects', () => {
      const theme = createTheme(createValidConfig({
        tokens: {
          fontSize: '14px',
          lineHeight: '1.5',
        },
      }));

      theme.params({
        tokens: {
          fontSize: '16px',
          fontWeight: 'bold',
        },
      });

      const result = theme.getThemeConfig();

      expect(result.tokens.fontSize).toBe('16px');
      expect(result.tokens.lineHeight).toBe('1.5');
      expect(result.tokens.fontWeight).toBe('bold');
    });

    it('should return the ThemeBuilder instance for chaining', () => {
      const theme = createTheme(createValidConfig());

      const result = theme.params({ colors: { secondary: '#fff' } });

      expect(result).toBe(theme);
    });

    it('should notify listeners on params change', () => {
      const theme = createTheme(createValidConfig());
      const listener = jest.fn();

      theme.subscribe(listener);
      theme.params({ colors: { secondary: '#fff' } });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        colors: expect.objectContaining({ secondary: '#fff' }),
      }));
    });

    it('should throw error for invalid params', () => {
      const theme = createTheme(createValidConfig());

      expect(() => theme.params(null))
        .toThrow('[ThemeBuilder] params must be an object.');
      expect(() => theme.params('invalid'))
        .toThrow('[ThemeBuilder] params must be an object.');
    });

    it('should warn for unknown param keys in params()', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const theme = createTheme(createValidConfig());

      theme.params({
        unknownParam: 'value',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeBuilder] Unknown param key: "unknownParam" in params. ' +
        'This may be a custom param or a typo.'
      );

      consoleSpy.mockRestore();
    });

    it('should warn for unknown icon keys in params()', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const theme = createTheme(createValidConfig());

      theme.params({
        icons: {
          unknownIcon: '<svg></svg>',
        },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeBuilder] Unknown icon key: "unknownIcon" in params.icons. ' +
        'This may be a custom icon or a typo.'
      );

      consoleSpy.mockRestore();
    });

    it('should warn for unknown token keys in params()', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const theme = createTheme(createValidConfig());

      theme.params({
        tokens: {
          unknownToken: '10px',
        },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeBuilder] Unknown token key: "unknownToken" in params.tokens. ' +
        'This may be a custom token or a typo.'
      );

      consoleSpy.mockRestore();
    });

    it('should warn and not update when trying to change name after initialization', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const theme = createTheme(createValidConfig({ name: 'original-name' }));

      theme.params({ name: 'new-name' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeBuilder] The "name" property can only be set during ' +
        '`registerTheme()` and cannot be updated via `params()`.'
      );
      expect(theme.getThemeConfig().name).toBe('original-name');

      consoleSpy.mockRestore();
    });
  });

  describe('setColorScheme', () => {
    it('should set valid color schemes', () => {
      const theme = createTheme(createValidConfig());

      theme.setColorScheme('light');
      expect(theme.getThemeConfig().colorScheme).toBe('light');

      theme.setColorScheme('dark');
      expect(theme.getThemeConfig().colorScheme).toBe('dark');

      theme.setColorScheme('auto');
      expect(theme.getThemeConfig().colorScheme).toBe('auto');
    });

    it('should return the ThemeBuilder instance for chaining', () => {
      const theme = createTheme(createValidConfig());

      const result = theme.setColorScheme('dark');

      expect(result).toBe(theme);
    });

    it('should notify listeners on color scheme change', () => {
      const theme = createTheme(createValidConfig());
      const listener = jest.fn();

      theme.subscribe(listener);
      theme.setColorScheme('dark');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        colorScheme: 'dark',
      }));
    });

    it('should throw error for invalid color scheme', () => {
      const theme = createTheme(createValidConfig());

      expect(() => theme.setColorScheme('invalid'))
        .toThrow('[ThemeBuilder] Invalid color scheme: "invalid". Must be one of: light, dark, auto.');
    });
  });

  describe('setDensityType', () => {
    it('should set valid density types', () => {
      const theme = createTheme(createValidConfig());

      theme.setDensityType('compact');
      expect(theme.getThemeConfig().density.type).toBe('compact');

      theme.setDensityType('comfortable');
      expect(theme.getThemeConfig().density.type).toBe('comfortable');

      theme.setDensityType('default');
      expect(theme.getThemeConfig().density.type).toBe('default');
    });

    it('should return the ThemeBuilder instance for chaining', () => {
      const theme = createTheme(createValidConfig());

      const result = theme.setDensityType('compact');

      expect(result).toBe(theme);
    });

    it('should notify listeners on density type change', () => {
      const theme = createTheme(createValidConfig());
      const listener = jest.fn();

      theme.subscribe(listener);
      theme.setDensityType('compact');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        density: expect.objectContaining({ type: 'compact' }),
      }));
    });

    it('should throw error for invalid density type', () => {
      const theme = createTheme(createValidConfig());

      expect(() => theme.setDensityType('invalid'))
        .toThrow('[ThemeBuilder] Invalid density: "invalid". Must be one of: default, compact, comfortable.');
    });
  });

  describe('subscribe', () => {
    it('should add a listener and return unsubscribe function', () => {
      const theme = createTheme(createValidConfig());
      const listener = jest.fn();

      const unsubscribe = theme.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call listener when theme changes', () => {
      const theme = createTheme(createValidConfig());
      const listener = jest.fn();

      theme.subscribe(listener);
      theme.setColorScheme('dark');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should not call listener after unsubscribe', () => {
      const theme = createTheme(createValidConfig());
      const listener = jest.fn();

      const unsubscribe = theme.subscribe(listener);

      unsubscribe();
      theme.setColorScheme('dark');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      const theme = createTheme(createValidConfig());
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      theme.subscribe(listener1);
      theme.subscribe(listener2);
      theme.setColorScheme('dark');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should throw error for non-function listener', () => {
      const theme = createTheme(createValidConfig());

      expect(() => theme.subscribe('not a function'))
        .toThrow('[ThemeBuilder] listener must be a function.');
      expect(() => theme.subscribe(null))
        .toThrow('[ThemeBuilder] listener must be a function.');
    });
  });

  describe('chaining', () => {
    it('should support method chaining', () => {
      const theme = createTheme(createValidConfig());

      const result = theme
        .setColorScheme('dark')
        .setDensityType('compact')
        .params({ colors: { secondary: '#fff' } });

      expect(result).toBe(theme);

      const config = theme.getThemeConfig();

      expect(config.colorScheme).toBe('dark');
      expect(config.density.type).toBe('compact');
      expect(config.colors.secondary).toBe('#fff');
    });
  });

  describe('density configuration', () => {
    it('should accept density as string', () => {
      const theme = createTheme(createValidConfig({
        density: 'compact',
      }));

      expect(theme.getThemeConfig().density.type).toBe('compact');
    });

    it('should accept density as object with type and sizes', () => {
      const customSizes = {
        compact: { gap: 4 },
        default: { gap: 8 },
        comfortable: { gap: 12 },
      };

      const theme = createTheme(createValidConfig({
        density: {
          type: 'compact',
          sizes: customSizes,
        },
      }));

      const config = theme.getThemeConfig();

      expect(config.density.type).toBe('compact');
      expect(config.density.sizes.compact.gap).toBe(4);
    });

    it('should update density via params with string value', () => {
      const theme = createTheme(createValidConfig());

      theme.params({ density: 'comfortable' });

      expect(theme.getThemeConfig().density.type).toBe('comfortable');
    });

    it('should update density via params with object value', () => {
      const theme = createTheme(createValidConfig());

      theme.params({
        density: {
          type: 'compact',
          sizes: { compact: { customPadding: 2 } },
        },
      });

      const config = theme.getThemeConfig();

      expect(config.density.type).toBe('compact');
      expect(config.density.sizes.compact.customPadding).toBe(2);
    });

    it('should warn for unknown density size keys', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const theme = createTheme(createValidConfig());

      theme.params({
        density: {
          type: 'compact',
          sizes: { unknownDensity: { padding: 2 } },
        },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeBuilder] Unknown density size key: "unknownDensity" in params.density.sizes.sizes. ' +
        'This may be a custom density size or a typo.'
      );

      consoleSpy.mockRestore();
    });
  });
});
