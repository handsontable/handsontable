import { themeLayoutFromTokens } from '../themeLayoutFromTokens';

describe('themeLayoutFromTokens', () => {
  describe('classic theme (density: compact)', () => {
    let layout;

    beforeEach(() => {
      layout = themeLayoutFromTokens('classic');
    });

    it('should resolve lineHeight from tokens', () => {
      expect(layout.lineHeight).toBe(21);
    });

    it('should resolve cellVerticalPadding from compact density', () => {
      expect(layout.cellVerticalPadding).toBe(2);
    });

    it('should compute cellContentHeight as lineHeight + 2 * padding', () => {
      expect(layout.cellContentHeight).toBe(25);
    });

    it('should compute defaultDataRowHeight as cellContentHeight + 1px border', () => {
      expect(layout.defaultDataRowHeight).toBe(26);
    });

    it('should compute defaultColumnHeaderHeight as cellContentHeight', () => {
      expect(layout.defaultColumnHeaderHeight).toBe(25);
    });

    it('should compute firstRenderedRowDefaultHeight as rowHeight + 1px', () => {
      expect(layout.firstRenderedRowDefaultHeight).toBe(27);
    });

    it('should return defaultColumnWidth as 50', () => {
      expect(layout.defaultColumnWidth).toBe(50);
    });

    it('should return defaultRowHeaderWidth as 50 (content-box, no border correction)', () => {
      expect(layout.defaultRowHeaderWidth).toBe(50);
    });

    it('should return cellBorderWidth as 1', () => {
      expect(layout.cellBorderWidth).toBe(1);
    });
  });

  describe('main theme (density: default)', () => {
    let layout;

    beforeEach(() => {
      layout = themeLayoutFromTokens('main');
    });

    it('should resolve lineHeight from tokens', () => {
      expect(layout.lineHeight).toBe(20);
    });

    it('should resolve cellVerticalPadding from default density', () => {
      expect(layout.cellVerticalPadding).toBe(4);
    });

    it('should compute cellContentHeight as lineHeight + 2 * padding', () => {
      expect(layout.cellContentHeight).toBe(28);
    });

    it('should compute defaultDataRowHeight as cellContentHeight + 1px border', () => {
      expect(layout.defaultDataRowHeight).toBe(29);
    });

    it('should compute defaultColumnHeaderHeight as cellContentHeight', () => {
      expect(layout.defaultColumnHeaderHeight).toBe(28);
    });

    it('should compute firstRenderedRowDefaultHeight as rowHeight + 1px', () => {
      expect(layout.firstRenderedRowDefaultHeight).toBe(30);
    });

    it('should return defaultRowHeaderWidth as 49 (border-box, 1px border correction)', () => {
      expect(layout.defaultRowHeaderWidth).toBe(49);
    });
  });

  describe('horizon theme (density: comfortable)', () => {
    let layout;

    beforeEach(() => {
      layout = themeLayoutFromTokens('horizon');
    });

    it('should resolve lineHeight from tokens', () => {
      expect(layout.lineHeight).toBe(20);
    });

    it('should resolve cellVerticalPadding from comfortable density', () => {
      expect(layout.cellVerticalPadding).toBe(8);
    });

    it('should compute cellContentHeight as lineHeight + 2 * padding', () => {
      expect(layout.cellContentHeight).toBe(36);
    });

    it('should compute defaultDataRowHeight as cellContentHeight + 1px border', () => {
      expect(layout.defaultDataRowHeight).toBe(37);
    });

    it('should compute defaultColumnHeaderHeight as cellContentHeight', () => {
      expect(layout.defaultColumnHeaderHeight).toBe(36);
    });

    it('should compute firstRenderedRowDefaultHeight as rowHeight + 1px', () => {
      expect(layout.firstRenderedRowDefaultHeight).toBe(38);
    });

    it('should return defaultRowHeaderWidth as 49 (border-box, 1px border correction)', () => {
      expect(layout.defaultRowHeaderWidth).toBe(49);
    });
  });

  describe('overlayHeight()', () => {
    let layout;

    beforeEach(() => {
      layout = themeLayoutFromTokens('classic');
    });

    it('should return 0 for 0 rows', () => {
      expect(layout.overlayHeight({ rows: 0 })).toBe(0);
    });

    it('should return firstRenderedRowDefaultHeight for 1 row', () => {
      expect(layout.overlayHeight({ rows: 1 })).toBe(27);
    });

    it('should return firstRenderedRowDefaultHeight + rowHeight for 2 rows', () => {
      expect(layout.overlayHeight({ rows: 2 })).toBe(53);
    });

    it('should skip compensation when includeFirstRowCompensation is false', () => {
      expect(layout.overlayHeight({ rows: 1, includeFirstRowCompensation: false })).toBe(26);
    });

    it('should compute 3-row overlay height correctly', () => {
      expect(layout.overlayHeight({ rows: 3 })).toBe(79);
    });
  });

  describe('verticalScrollForRow()', () => {
    it('should compute scroll position as rowIndex * defaultDataRowHeight (classic)', () => {
      const layout = themeLayoutFromTokens('classic');

      expect(layout.verticalScrollForRow(250)).toBe(6500);
    });

    it('should compute scroll position as rowIndex * defaultDataRowHeight (main)', () => {
      const layout = themeLayoutFromTokens('main');

      expect(layout.verticalScrollForRow(250)).toBe(7250);
    });

    it('should compute scroll position as rowIndex * defaultDataRowHeight (horizon)', () => {
      const layout = themeLayoutFromTokens('horizon');

      expect(layout.verticalScrollForRow(250)).toBe(9250);
    });
  });

  describe('error handling', () => {
    it('should throw for unknown theme name', () => {
      expect(() => themeLayoutFromTokens('nonexistent')).toThrow();
    });

    it('should default to main when theme name is falsy', () => {
      const layout = themeLayoutFromTokens('');

      expect(layout.defaultDataRowHeight).toBe(29);
    });
  });
});
