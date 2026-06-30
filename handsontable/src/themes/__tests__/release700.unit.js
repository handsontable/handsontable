/**
 * Tests for RELEASE-700 Theme Builder features:
 * - 12 paginationButton* CSS tokens
 * - headerRowBackgroundColor cascade to row headers
 * - Color scheme light/dark/auto support
 * - MultiSelect overflow chip padding tokens
 */
import mainIcons from 'handsontable/themes/static/variables/icons/main';
import mainColors from 'handsontable/themes/static/variables/colors/main';
import mainTokens from 'handsontable/themes/static/variables/tokens/main';
import classicTokens from 'handsontable/themes/static/variables/tokens/classic';
import horizonTokens from 'handsontable/themes/static/variables/tokens/horizon';
import { createTheme } from 'handsontable/themes/engine/builder';

const PAGINATION_BUTTON_TOKENS = [
  'paginationButtonBorderColor',
  'paginationButtonForegroundColor',
  'paginationButtonBackgroundColor',
  'paginationButtonHoverBorderColor',
  'paginationButtonHoverForegroundColor',
  'paginationButtonHoverBackgroundColor',
  'paginationButtonDisabledBorderColor',
  'paginationButtonDisabledForegroundColor',
  'paginationButtonDisabledBackgroundColor',
  'paginationButtonFocusBorderColor',
  'paginationButtonFocusForegroundColor',
  'paginationButtonFocusBackgroundColor',
];

const createValidConfig = (tokens = mainTokens, overrides = {}) => ({
  name: 'test-theme',
  icons: mainIcons,
  colors: mainColors,
  tokens,
  ...overrides,
});

describe('RELEASE-700: Theme Builder', () => {
  describe('Pagination Tokens (#12404, #12317)', () => {
    it('should define exactly 12 paginationButton* tokens in main theme', () => {
      const paginationKeys = Object.keys(mainTokens).filter(k => k.startsWith('paginationButton'));

      expect(paginationKeys).toHaveLength(12);
    });

    it('should define exactly 12 paginationButton* tokens in classic theme', () => {
      const paginationKeys = Object.keys(classicTokens).filter(k => k.startsWith('paginationButton'));

      expect(paginationKeys).toHaveLength(12);
    });

    it('should define exactly 12 paginationButton* tokens in horizon theme', () => {
      const paginationKeys = Object.keys(horizonTokens).filter(k => k.startsWith('paginationButton'));

      expect(paginationKeys).toHaveLength(12);
    });

    it.each(PAGINATION_BUTTON_TOKENS)('should include token "%s" in main tokens', (tokenName) => {
      expect(mainTokens).toHaveProperty(tokenName);
    });

    it.each(PAGINATION_BUTTON_TOKENS)('should include token "%s" in classic tokens', (tokenName) => {
      expect(classicTokens).toHaveProperty(tokenName);
    });

    it.each(PAGINATION_BUTTON_TOKENS)('should include token "%s" in horizon tokens', (tokenName) => {
      expect(horizonTokens).toHaveProperty(tokenName);
    });

    it('should accept all 12 paginationButton* tokens as valid theme params', () => {
      const customTokens = {};

      PAGINATION_BUTTON_TOKENS.forEach((token) => {
        customTokens[token] = '#ff0000';
      });

      expect(() => {
        createTheme(createValidConfig(mainTokens, { tokens: { ...mainTokens, ...customTokens } }));
      }).not.toThrow();
    });

    it('should preserve custom paginationButton token values', () => {
      const theme = createTheme(createValidConfig(mainTokens, {
        tokens: {
          ...mainTokens,
          paginationButtonBackgroundColor: '#abcdef',
          paginationButtonForegroundColor: '#123456',
        },
      }));

      expect(theme.getThemeConfig().tokens.paginationButtonBackgroundColor).toBe('#abcdef');
      expect(theme.getThemeConfig().tokens.paginationButtonForegroundColor).toBe('#123456');
    });

    it('should allow updating paginationButton tokens via params()', () => {
      const theme = createTheme(createValidConfig());

      theme.params({ tokens: { paginationButtonBackgroundColor: '#ff0000' } });

      expect(theme.getThemeConfig().tokens.paginationButtonBackgroundColor).toBe('#ff0000');
    });
  });

  describe('Header Cascade - headerRowBackgroundColor (#12322)', () => {
    it('should define headerRowBackgroundColor in main tokens', () => {
      expect(mainTokens).toHaveProperty('headerRowBackgroundColor');
    });

    it('should define rowHeaderOddBackgroundColor referencing headerRowBackgroundColor in main tokens', () => {
      expect(mainTokens.rowHeaderOddBackgroundColor).toBe('tokens.headerRowBackgroundColor');
    });

    it('should define rowHeaderEvenBackgroundColor referencing headerRowBackgroundColor in main tokens', () => {
      expect(mainTokens.rowHeaderEvenBackgroundColor).toBe('tokens.headerRowBackgroundColor');
    });

    it('should define rowHeaderOddBackgroundColor referencing headerRowBackgroundColor in classic tokens', () => {
      expect(classicTokens.rowHeaderOddBackgroundColor).toBe('tokens.headerRowBackgroundColor');
    });

    it('should define rowHeaderEvenBackgroundColor referencing headerRowBackgroundColor in classic tokens', () => {
      expect(classicTokens.rowHeaderEvenBackgroundColor).toBe('tokens.headerRowBackgroundColor');
    });

    it('should define rowHeaderOddBackgroundColor referencing headerRowBackgroundColor in horizon tokens', () => {
      expect(horizonTokens.rowHeaderOddBackgroundColor).toBe('tokens.headerRowBackgroundColor');
    });

    it('should define rowHeaderEvenBackgroundColor referencing headerRowBackgroundColor in horizon tokens', () => {
      expect(horizonTokens.rowHeaderEvenBackgroundColor).toBe('tokens.headerRowBackgroundColor');
    });

    it('should accept custom headerRowBackgroundColor value', () => {
      const theme = createTheme(createValidConfig(mainTokens, {
        tokens: {
          ...mainTokens,
          headerRowBackgroundColor: '#ff0000',
        },
      }));

      expect(theme.getThemeConfig().tokens.headerRowBackgroundColor).toBe('#ff0000');
    });

    it('should allow updating headerRowBackgroundColor via params()', () => {
      const theme = createTheme(createValidConfig());

      theme.params({ tokens: { headerRowBackgroundColor: '#00ff00' } });

      expect(theme.getThemeConfig().tokens.headerRowBackgroundColor).toBe('#00ff00');
    });
  });

  describe('Color Scheme - Light/Dark Mode (#12412, #12394)', () => {
    it('should default to "auto" color scheme', () => {
      const theme = createTheme(createValidConfig());

      expect(theme.getThemeConfig().colorScheme).toBe('auto');
    });

    it('should set light color scheme via setColorScheme()', () => {
      const theme = createTheme(createValidConfig());

      theme.setColorScheme('light');

      expect(theme.getThemeConfig().colorScheme).toBe('light');
    });

    it('should set dark color scheme via setColorScheme()', () => {
      const theme = createTheme(createValidConfig());

      theme.setColorScheme('dark');

      expect(theme.getThemeConfig().colorScheme).toBe('dark');
    });

    it('should set auto color scheme via setColorScheme()', () => {
      const theme = createTheme(createValidConfig());

      theme.setColorScheme('dark');
      theme.setColorScheme('auto');

      expect(theme.getThemeConfig().colorScheme).toBe('auto');
    });

    it('should initialize with specified color scheme', () => {
      const theme = createTheme(createValidConfig(mainTokens, { colorScheme: 'dark' }));

      expect(theme.getThemeConfig().colorScheme).toBe('dark');
    });

    it('should reject invalid color scheme values', () => {
      const theme = createTheme(createValidConfig());

      expect(() => theme.setColorScheme('invalid')).toThrow();
      expect(() => theme.setColorScheme('system')).toThrow();
    });

    it('should support method chaining after setColorScheme()', () => {
      const theme = createTheme(createValidConfig());

      const result = theme.setColorScheme('dark');

      expect(result).toBe(theme);
    });

    it('should notify subscribers when color scheme changes', () => {
      const theme = createTheme(createValidConfig());
      const listener = jest.fn();

      theme.subscribe(listener);
      theme.setColorScheme('dark');

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ colorScheme: 'dark' }));
    });

    it('should allow switching between all color scheme modes', () => {
      const theme = createTheme(createValidConfig());
      const schemes = ['light', 'dark', 'auto', 'light', 'auto', 'dark'];

      schemes.forEach((scheme) => {
        theme.setColorScheme(scheme);
        expect(theme.getThemeConfig().colorScheme).toBe(scheme);
      });
    });
  });

  describe('MultiSelect - Chip Padding Tokens (#12316)', () => {
    it('should define chipVerticalPadding token in main tokens', () => {
      expect(mainTokens).toHaveProperty('chipVerticalPadding');
    });

    it('should define chipHorizontalPadding token in main tokens', () => {
      expect(mainTokens).toHaveProperty('chipHorizontalPadding');
    });

    it('should define chipVerticalPadding token in classic tokens', () => {
      expect(classicTokens).toHaveProperty('chipVerticalPadding');
    });

    it('should define chipHorizontalPadding token in classic tokens', () => {
      expect(classicTokens).toHaveProperty('chipHorizontalPadding');
    });

    it('should define chipVerticalPadding token in horizon tokens', () => {
      expect(horizonTokens).toHaveProperty('chipVerticalPadding');
    });

    it('should define chipHorizontalPadding token in horizon tokens', () => {
      expect(horizonTokens).toHaveProperty('chipHorizontalPadding');
    });

    it('should accept custom chip padding values', () => {
      const theme = createTheme(createValidConfig(mainTokens, {
        tokens: {
          ...mainTokens,
          chipVerticalPadding: '4px',
          chipHorizontalPadding: '8px',
        },
      }));

      expect(theme.getThemeConfig().tokens.chipVerticalPadding).toBe('4px');
      expect(theme.getThemeConfig().tokens.chipHorizontalPadding).toBe('8px');
    });

    it('should allow updating chip padding tokens via params()', () => {
      const theme = createTheme(createValidConfig());

      theme.params({ tokens: { chipHorizontalPadding: '12px' } });

      expect(theme.getThemeConfig().tokens.chipHorizontalPadding).toBe('12px');
    });

    it('classic and horizon themes should define independent chip padding values', () => {
      expect(classicTokens.chipHorizontalPadding).not.toBeUndefined();
      expect(horizonTokens.chipHorizontalPadding).not.toBeUndefined();
    });
  });
});
