import {
  validateParams,
  validateColorScheme,
  validateDensityType,
  VALID_ICON_KEYS,
} from '../utils/validation';

describe('Theme validation utilities', () => {
  describe('validateColorScheme', () => {
    it('should return valid color scheme values', () => {
      expect(validateColorScheme('light')).toBe('light');
      expect(validateColorScheme('dark')).toBe('dark');
      expect(validateColorScheme('auto')).toBe('auto');
    });

    it('should throw error for invalid color scheme', () => {
      expect(() => validateColorScheme('invalid'))
        .toThrow('[ThemeBuilder] Invalid color scheme: "invalid". Must be one of: light, dark, auto.');
      expect(() => validateColorScheme(''))
        .toThrow('[ThemeBuilder] Invalid color scheme: "". Must be one of: light, dark, auto.');
      expect(() => validateColorScheme(null))
        .toThrow('[ThemeBuilder] Invalid color scheme: "null". Must be one of: light, dark, auto.');
    });
  });

  describe('validateDensityType', () => {
    it('should return valid density type values', () => {
      expect(validateDensityType('default')).toBe('default');
      expect(validateDensityType('compact')).toBe('compact');
      expect(validateDensityType('comfortable')).toBe('comfortable');
    });

    it('should throw error for invalid density type', () => {
      expect(() => validateDensityType('invalid'))
        .toThrow('[ThemeBuilder] Invalid density: "invalid". Must be one of: default, compact, comfortable.');
      expect(() => validateDensityType(''))
        .toThrow('[ThemeBuilder] Invalid density: "". Must be one of: default, compact, comfortable.');
      expect(() => validateDensityType(null))
        .toThrow('[ThemeBuilder] Invalid density: "null". Must be one of: default, compact, comfortable.');
    });
  });

  describe('validateParams', () => {
    describe('basic validation', () => {
      it('should throw error when params is not an object', () => {
        expect(() => validateParams(null, 'test'))
          .toThrow('[ThemeBuilder] test must be an object.');
        expect(() => validateParams(undefined, 'test'))
          .toThrow('[ThemeBuilder] test must be an object.');
        expect(() => validateParams('string', 'test'))
          .toThrow('[ThemeBuilder] test must be an object.');
        expect(() => validateParams(123, 'test'))
          .toThrow('[ThemeBuilder] test must be an object.');
      });

      it('should pass validation for empty object', () => {
        expect(() => validateParams({}, 'test')).not.toThrow();
      });
    });

    describe('required fields', () => {
      it('should throw error when required field is missing', () => {
        expect(() => validateParams({}, 'test', { requiredFields: ['name'] }))
          .toThrow('[ThemeBuilder] test.name is required.');
        expect(() => validateParams({ icons: {} }, 'test', { requiredFields: ['name', 'colors'] }))
          .toThrow('[ThemeBuilder] test.name is required.');
      });

      it('should pass when all required fields are present', () => {
        expect(() => validateParams(
          { name: 'test-theme', icons: {}, colors: {} },
          'test',
          { requiredFields: ['name', 'icons', 'colors'] }
        )).not.toThrow();
      });
    });

    describe('name validation', () => {
      it('should throw error for invalid name', () => {
        expect(() => validateParams({ name: '' }, 'test'))
          .toThrow('[ThemeBuilder] test.name must be a non-empty string.');
        expect(() => validateParams({ name: '   ' }, 'test'))
          .toThrow('[ThemeBuilder] test.name must be a non-empty string.');
        expect(() => validateParams({ name: 123 }, 'test'))
          .toThrow('[ThemeBuilder] test.name must be a non-empty string.');
      });

      it('should pass validation for valid name', () => {
        expect(() => validateParams({ name: 'my-theme' }, 'test')).not.toThrow();
      });
    });

    describe('sizing validation', () => {
      it('should throw error when sizing is not an object', () => {
        expect(() => validateParams({ sizing: 'invalid' }, 'test'))
          .toThrow('[ThemeBuilder] test.sizing must be an object.');
        expect(() => validateParams({ sizing: 123 }, 'test'))
          .toThrow('[ThemeBuilder] test.sizing must be an object.');
      });

      it('should pass validation for valid sizing object', () => {
        expect(() => validateParams({ sizing: { base: 8 } }, 'test')).not.toThrow();
      });
    });

    describe('density validation', () => {
      it('should throw error when density is neither string nor object', () => {
        expect(() => validateParams({ density: 123 }, 'test'))
          .toThrow('[ThemeBuilder] test.density must be a string or an object.');
        expect(() => validateParams({ density: [] }, 'test'))
          .toThrow('[ThemeBuilder] test.density must be a string or an object.');
      });

      it('should validate density as string', () => {
        expect(() => validateParams({ density: 'default' }, 'test')).not.toThrow();
        expect(() => validateParams({ density: 'compact' }, 'test')).not.toThrow();
        expect(() => validateParams({ density: 'comfortable' }, 'test')).not.toThrow();
      });

      it('should throw error for invalid density string', () => {
        expect(() => validateParams({ density: 'invalid' }, 'test'))
          .toThrow('[ThemeBuilder] Invalid density: "invalid". Must be one of: default, compact, comfortable.');
      });

      it('should validate density as object', () => {
        const validDensity = {
          type: 'compact',
          sizes: {
            compact: { cellPadding: 4 },
          },
        };

        expect(() => validateParams({ density: validDensity }, 'test')).not.toThrow();
      });

      it('should throw error for density object without type or sizes', () => {
        expect(() => validateParams({ density: { type: 'compact' } }, 'test'))
          .toThrow('[ThemeBuilder] test.density must be a string or an object with a \'type\' and \'sizes\' property.');
        expect(() => validateParams({ density: { sizes: {} } }, 'test'))
          .toThrow('[ThemeBuilder] test.density must be a string or an object with a \'type\' and \'sizes\' property.');
      });
    });

    describe('icons validation', () => {
      it('should throw error when icons is not an object', () => {
        expect(() => validateParams({ icons: 'invalid' }, 'test'))
          .toThrow('[ThemeBuilder] test.icons must be an object.');
        expect(() => validateParams({ icons: 123 }, 'test'))
          .toThrow('[ThemeBuilder] test.icons must be an object.');
      });

      it('should pass validation for valid icon keys', () => {
        const validIcons = {
          arrowRight: '<svg></svg>',
          arrowLeft: '<svg></svg>',
          menu: '<svg></svg>',
        };

        expect(() => validateParams({ icons: validIcons }, 'test')).not.toThrow();
      });

      it('should contain expected valid icon keys', () => {
        expect(VALID_ICON_KEYS.has('arrowRight')).toBe(true);
        expect(VALID_ICON_KEYS.has('arrowLeft')).toBe(true);
        expect(VALID_ICON_KEYS.has('arrowDown')).toBe(true);
        expect(VALID_ICON_KEYS.has('menu')).toBe(true);
        expect(VALID_ICON_KEYS.has('selectArrow')).toBe(true);
        expect(VALID_ICON_KEYS.has('check')).toBe(true);
        expect(VALID_ICON_KEYS.has('checkbox')).toBe(true);
        expect(VALID_ICON_KEYS.has('radio')).toBe(true);
      });
    });

    describe('colors validation', () => {
      it('should throw error when colors is not an object', () => {
        expect(() => validateParams({ colors: 'invalid' }, 'test'))
          .toThrow('[ThemeBuilder] test.colors must be an object.');
        expect(() => validateParams({ colors: 123 }, 'test'))
          .toThrow('[ThemeBuilder] test.colors must be an object.');
      });

      it('should pass validation for valid colors', () => {
        const validColors = {
          primary: '#000000',
          secondary: '#ffffff',
          nested: {
            background: '#f0f0f0',
          },
        };

        expect(() => validateParams({ colors: validColors }, 'test')).not.toThrow();
      });

      it('should throw error for invalid color structure', () => {
        expect(() => validateParams({ colors: { primary: 123 } }, 'test'))
          .toThrow('[ThemeBuilder] test.colors.primary must be a string or an object.');
        expect(() => validateParams({ colors: { nested: { bad: [] } } }, 'test'))
          .toThrow('[ThemeBuilder] test.colors.nested.bad must be a string or an object.');
      });
    });

    describe('tokens validation', () => {
      it('should throw error when tokens is not an object', () => {
        expect(() => validateParams({ tokens: 'invalid' }, 'test'))
          .toThrow('[ThemeBuilder] test.tokens must be an object.');
        expect(() => validateParams({ tokens: 123 }, 'test'))
          .toThrow('[ThemeBuilder] test.tokens must be an object.');
      });

      it('should pass validation for valid tokens', () => {
        const validTokens = {
          fontSize: '14px',
          lineHeight: '1.5',
          borderColor: '#ccc',
        };

        expect(() => validateParams({ tokens: validTokens }, 'test')).not.toThrow();
      });
    });

    describe('colorScheme validation', () => {
      it('should pass validation for valid color schemes', () => {
        expect(() => validateParams({ colorScheme: 'light' }, 'test')).not.toThrow();
        expect(() => validateParams({ colorScheme: 'dark' }, 'test')).not.toThrow();
        expect(() => validateParams({ colorScheme: 'auto' }, 'test')).not.toThrow();
      });

      it('should throw error for invalid color scheme', () => {
        expect(() => validateParams({ colorScheme: 'invalid' }, 'test'))
          .toThrow('[ThemeBuilder] Invalid color scheme: "invalid". Must be one of: light, dark, auto.');
      });
    });
  });
});
