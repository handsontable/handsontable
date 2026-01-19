import { flattenCssVariables } from '../utils/cssVariables';

describe('CSS Variables utilities', () => {
  describe('flattenCssVariables', () => {
    it('should convert a simple object to CSS variables', () => {
      const input = {
        fontSize: '14px',
        lineHeight: '1.5',
      };

      const result = flattenCssVariables(input, '');

      expect(result).toContain('--ht-font-size: 14px;');
      expect(result).toContain('--ht-line-height: 1.5;');
    });

    it('should handle nested objects', () => {
      const input = {
        colors: {
          primary: '#000',
          secondary: '#fff',
        },
      };

      const result = flattenCssVariables(input, 'theme');

      expect(result).toContain('--ht-theme-colors-primary: #000;');
      expect(result).toContain('--ht-theme-colors-secondary: #fff;');
    });

    it('should handle deeply nested objects', () => {
      const input = {
        level1: {
          level2: {
            level3: 'value',
          },
        },
      };

      const result = flattenCssVariables(input, 'test');

      expect(result).toContain('--ht-test-level1-level2-level3: value;');
    });

    it('should convert camelCase keys to kebab-case', () => {
      const input = {
        backgroundColor: '#fff',
        borderTopWidth: '1px',
        myCustomVariable: 'test',
      };

      const result = flattenCssVariables(input, 'tokens');

      expect(result).toContain('--ht-tokens-background-color: #fff;');
      expect(result).toContain('--ht-tokens-border-top-width: 1px;');
      expect(result).toContain('--ht-tokens-my-custom-variable: test;');
    });

    it('should work without prefix', () => {
      const input = {
        fontSize: '14px',
      };

      const result = flattenCssVariables(input);

      expect(result).toContain('--ht-font-size: 14px;');
    });

    it('should handle array values with light/dark mode', () => {
      const input = {
        backgroundColor: ['#fff', '#000'],
      };

      const result = flattenCssVariables(input, 'colors');

      expect(result).toContain('--ht-colors-background-color: light-dark(#fff, #000);');
    });

    it('should handle variable references', () => {
      const input = {
        cellBackground: 'colors.primary',
      };

      const result = flattenCssVariables(input, 'tokens');

      expect(result).toContain('--ht-tokens-cell-background: var(--ht-colors-primary);');
    });

    it('should handle themes. prefix in variable references', () => {
      const input = {
        cellColor: 'themes.main.foreground',
      };

      const result = flattenCssVariables(input, 'tokens');

      expect(result).toContain('--ht-tokens-cell-color: var(--ht-main-foreground);');
    });

    it('should handle sizing. prefix references', () => {
      const input = {
        padding: 'sizing.base',
      };

      const result = flattenCssVariables(input, 'tokens');

      expect(result).toContain('--ht-tokens-padding: var(--ht-sizing-base);');
    });

    it('should handle density. prefix references', () => {
      const input = {
        cellPadding: 'density.default.padding',
      };

      const result = flattenCssVariables(input, 'tokens');

      expect(result).toContain('--ht-tokens-cell-padding: var(--ht-density-default-padding);');
    });

    it('should handle array with only light value', () => {
      const input = {
        color: ['#fff'],
      };

      const result = flattenCssVariables(input, 'colors');

      expect(result).toContain('--ht-colors-color: #fff;');
      expect(result).not.toContain('light-dark');
    });

    it('should handle array with variable references in light/dark', () => {
      const input = {
        background: ['colors.light', 'colors.dark'],
      };

      const result = flattenCssVariables(input, 'tokens');

      expect(result).toContain('--ht-tokens-background: light-dark(var(--ht-colors-light), var(--ht-colors-dark));');
    });

    it('should return empty string for empty object', () => {
      const result = flattenCssVariables({}, 'test');

      expect(result).toBe('');
    });

    it('should handle mixed values (strings, arrays, nested)', () => {
      const input = {
        simple: 'value',
        nested: {
          deep: 'deepValue',
        },
        array: ['light', 'dark'],
        reference: 'colors.primary',
      };

      const result = flattenCssVariables(input, 'mixed');

      expect(result).toContain('--ht-mixed-simple: value;');
      expect(result).toContain('--ht-mixed-nested-deep: deep-value;');
      expect(result).toContain('--ht-mixed-array: light-dark(light, dark);');
      expect(result).toContain('--ht-mixed-reference: var(--ht-colors-primary);');
    });
  });
});
