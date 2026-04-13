import { E2E_REGISTERED_THEME_KEYS } from '../themeLayoutCore';
import { themeLayoutFromTokens } from '../themeLayoutFromTokens';

describe('E2E_REGISTERED_THEME_KEYS', () => {
  it('matches THEME_TOKENS registration order (E2E styles/ht-theme-{key}.css)', () => {
    expect(E2E_REGISTERED_THEME_KEYS).toEqual(['classic', 'main', 'horizon']);
  });
});

describe('e2ePickForDensity', () => {
  it('matches pickByDensity for classic, main, and horizon', () => {
    const triplet = { compact: 1, default: 2, comfortable: 3 };

    expect(themeLayoutFromTokens('classic').e2ePickForDensity(triplet)).toBe(1);
    expect(themeLayoutFromTokens('main').e2ePickForDensity(triplet)).toBe(2);
    expect(themeLayoutFromTokens('horizon').e2ePickForDensity(triplet)).toBe(3);
  });
});

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

    it('should resolve cellHorizontalPadding from compact density', () => {
      expect(layout.cellHorizontalPadding).toBe(6);
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

    it('should return defaultRowHeaderWidth as 50 (Walkontable row-header col width)', () => {
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

    it('should resolve cellHorizontalPadding from default density', () => {
      expect(layout.cellHorizontalPadding).toBe(8);
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

    it('should return defaultRowHeaderWidth as 50 (same for all themes)', () => {
      expect(layout.defaultRowHeaderWidth).toBe(50);
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

    it('should resolve cellHorizontalPadding from comfortable density', () => {
      expect(layout.cellHorizontalPadding).toBe(12);
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

    it('should return defaultRowHeaderWidth as 50 (same for all themes)', () => {
      expect(layout.defaultRowHeaderWidth).toBe(50);
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

  describe('E2E regression helpers (density-based, no theme name in specs)', () => {
    it('e2eRowHeaderSelectionScrollTopAfterSelectLastToFirst', () => {
      expect(themeLayoutFromTokens('classic').e2eRowHeaderSelectionScrollTopAfterSelectLastToFirst()).toBe(226);
      expect(themeLayoutFromTokens('main').e2eRowHeaderSelectionScrollTopAfterSelectLastToFirst()).toBe(250);
      expect(themeLayoutFromTokens('horizon').e2eRowHeaderSelectionScrollTopAfterSelectLastToFirst()).toBe(314);
    });

    it('e2ePasswordEditorAutoresizeWidthTrimPx', () => {
      expect(themeLayoutFromTokens('classic').e2ePasswordEditorAutoresizeWidthTrimPx()).toBe(5);
      expect(themeLayoutFromTokens('main').e2ePasswordEditorAutoresizeWidthTrimPx()).toBe(1);
      expect(themeLayoutFromTokens('horizon').e2ePasswordEditorAutoresizeWidthTrimPx()).toBe(9);
    });

    it('e2eCommentsShortcutVerticalScrollSubtract', () => {
      expect(themeLayoutFromTokens('classic').e2eCommentsShortcutVerticalScrollSubtract()).toBe(231);
      expect(themeLayoutFromTokens('main').e2eCommentsShortcutVerticalScrollSubtract()).toBe(225);
      expect(themeLayoutFromTokens('horizon').e2eCommentsShortcutVerticalScrollSubtract()).toBe(209);
    });

    it('e2eWindowScrollYContextMenuFirstSelectableItem', () => {
      expect(themeLayoutFromTokens('classic').e2eWindowScrollYContextMenuFirstSelectableItem()).toBe(9);
      expect(themeLayoutFromTokens('main').e2eWindowScrollYContextMenuFirstSelectableItem()).toBe(9);
      expect(themeLayoutFromTokens('horizon').e2eWindowScrollYContextMenuFirstSelectableItem()).toBe(13);
    });

    it('e2eWindowScrollYDropdownMenuFirstSelectableItem', () => {
      expect(themeLayoutFromTokens('classic').e2eWindowScrollYDropdownMenuFirstSelectableItem()).toBe(31);
      expect(themeLayoutFromTokens('main').e2eWindowScrollYDropdownMenuFirstSelectableItem()).toBe(35);
      expect(themeLayoutFromTokens('horizon').e2eWindowScrollYDropdownMenuFirstSelectableItem()).toBe(43);
    });

    it('e2eFiltersConditionalSubmenuDocumentYSubtract', () => {
      expect(themeLayoutFromTokens('classic').e2eFiltersConditionalSubmenuDocumentYSubtract()).toBe(419);
      expect(themeLayoutFromTokens('main').e2eFiltersConditionalSubmenuDocumentYSubtract()).toBe(486);
      expect(themeLayoutFromTokens('horizon').e2eFiltersConditionalSubmenuDocumentYSubtract()).toBe(584);
    });

    it('e2eNoncontiguousBottomEdgeScrollTop', () => {
      expect(themeLayoutFromTokens('classic').e2eNoncontiguousBottomEdgeScrollTop(5)).toBe(5);
      expect(themeLayoutFromTokens('main').e2eNoncontiguousBottomEdgeScrollTop(5)).toBe(36);
      expect(themeLayoutFromTokens('horizon').e2eNoncontiguousBottomEdgeScrollTop(5)).toBe(124);
    });

    it('e2eMultipleSelectionRowHeadersShiftArrowDownPartialBottom', () => {
      expect(themeLayoutFromTokens('classic').e2eMultipleSelectionRowHeadersShiftArrowDownPartialBottom(5)).toBe(29);
      expect(themeLayoutFromTokens('main').e2eMultipleSelectionRowHeadersShiftArrowDownPartialBottom(5)).toBe(65);
      expect(themeLayoutFromTokens('horizon').e2eMultipleSelectionRowHeadersShiftArrowDownPartialBottom(5)).toBe(161);
    });

    it('e2eViewportScrollAfterRectangularAdjacentDataRows', () => {
      expect(themeLayoutFromTokens('classic').e2eViewportScrollAfterRectangularAdjacentDataRows(5)).toBe(55);
      expect(themeLayoutFromTokens('main').e2eViewportScrollAfterRectangularAdjacentDataRows(5)).toBe(94);
      expect(themeLayoutFromTokens('horizon').e2eViewportScrollAfterRectangularAdjacentDataRows(5)).toBe(198);
    });

    it('e2eDensity_f464e90e18 (two default data row outer heights)', () => {
      expect(themeLayoutFromTokens('classic').e2eDensity_f464e90e18()).toBe(52);
      expect(themeLayoutFromTokens('main').e2eDensity_f464e90e18()).toBe(58);
      expect(themeLayoutFromTokens('horizon').e2eDensity_f464e90e18()).toBe(74);
    });

    it('e2eDensity_9639197594 (two rows + 1px border)', () => {
      expect(themeLayoutFromTokens('classic').e2eDensity_9639197594()).toBe(53);
      expect(themeLayoutFromTokens('main').e2eDensity_9639197594()).toBe(59);
      expect(themeLayoutFromTokens('horizon').e2eDensity_9639197594()).toBe(75);
    });

    it('e2eGcr two-row helpers use the same pair height as e2eDensity_9639197594', () => {
      ['classic', 'main', 'horizon'].forEach((theme) => {
        const layout = themeLayoutFromTokens(theme);
        const pair = layout.e2eDensity_9639197594();
        const adjacent = (2 * layout.defaultDataRowHeight) + (2 * layout.cellBorderWidth);

        expect(layout.e2eGcr_e9a5ab9a7a().maxHeight).toBe(pair);
        expect(layout.e2eGcr_660b0bbbb1().maxHeight).toBe(pair);
        expect(layout.e2eGcr_4ef37f8511(300, 500).top).toBe(500 - pair);
        expect(layout.e2eGcr_4ef37f8511(300, 500).maxHeight).toBe(pair + 15);
        expect(layout.e2eGcr_5ac91379aa(300, { scrollLeft: 0, offsetHeight: 500 }).top).toBe(500 - adjacent);
      });
    });

    it('e2eDensity_9a971c3cfe (3-row overlay outer height)', () => {
      expect(themeLayoutFromTokens('classic').e2eDensity_9a971c3cfe()).toBe(79);
      expect(themeLayoutFromTokens('main').e2eDensity_9a971c3cfe()).toBe(88);
      expect(themeLayoutFromTokens('horizon').e2eDensity_9a971c3cfe()).toBe(112);
    });

    it('e2eDensity_0051ca7391 (3-row overlay + 2 line heights)', () => {
      expect(themeLayoutFromTokens('classic').e2eDensity_0051ca7391()).toBe(121);
      expect(themeLayoutFromTokens('main').e2eDensity_0051ca7391()).toBe(128);
      expect(themeLayoutFromTokens('horizon').e2eDensity_0051ca7391()).toBe(152);
    });

    it('e2eDensity_8992c845e6 (5-row overlay outer height)', () => {
      expect(themeLayoutFromTokens('classic').e2eDensity_8992c845e6()).toBe(131);
      expect(themeLayoutFromTokens('main').e2eDensity_8992c845e6()).toBe(146);
      expect(themeLayoutFromTokens('horizon').e2eDensity_8992c845e6()).toBe(186);
    });

    it('pickByDensity', () => {
      expect(themeLayoutFromTokens('classic').pickByDensity({
        compact: 'a',
        default: 'b',
        comfortable: 'c',
      })).toBe('a');
      expect(themeLayoutFromTokens('main').pickByDensity({
        compact: 'a',
        default: 'b',
        comfortable: 'c',
      })).toBe('b');
      expect(themeLayoutFromTokens('horizon').pickByDensity({
        compact: 'a',
        default: 'b',
        comfortable: 'c',
      })).toBe('c');
    });

    it('e2ePaginationScrollTopAfterScrollViewportToRow10Col10', () => {
      expect(themeLayoutFromTokens('classic').e2ePaginationScrollTopAfterScrollViewportToRow10Col10())
        .toBe(101);
      expect(themeLayoutFromTokens('main').e2ePaginationScrollTopAfterScrollViewportToRow10Col10())
        .toBe(134);
      expect(themeLayoutFromTokens('horizon').e2ePaginationScrollTopAfterScrollViewportToRow10Col10())
        .toBe(222);
    });

    it('e2ePaginationInlineStartScrollAfterScrollViewportToRow10Col10', () => {
      expect(themeLayoutFromTokens('classic').e2ePaginationInlineStartScrollAfterScrollViewportToRow10Col10())
        .toBe(65);
      expect(themeLayoutFromTokens('main').e2ePaginationInlineStartScrollAfterScrollViewportToRow10Col10())
        .toBe(65);
      expect(themeLayoutFromTokens('horizon').e2ePaginationInlineStartScrollAfterScrollViewportToRow10Col10())
        .toBe(79);
    });

    it('e2eStretchColumnsIndexOrderStretchedWidth', () => {
      expect(themeLayoutFromTokens('classic').e2eStretchColumnsIndexOrderStretchedWidth()).toBe(79);
      expect(themeLayoutFromTokens('main').e2eStretchColumnsIndexOrderStretchedWidth()).toBe(79);
      expect(themeLayoutFromTokens('horizon').e2eStretchColumnsIndexOrderStretchedWidth()).toBe(74);
    });

    it('e2eManualRowResizerPositionFixedTopMasterFourthRow', () => {
      expect(themeLayoutFromTokens('classic').e2eManualRowResizerPositionFixedTopMasterFourthRow())
        .toEqual({ top: 125, left: 0 });
      expect(themeLayoutFromTokens('main').e2eManualRowResizerPositionFixedTopMasterFourthRow())
        .toEqual({ top: 140, left: 0 });
      expect(themeLayoutFromTokens('horizon').e2eManualRowResizerPositionFixedTopMasterFourthRow())
        .toEqual({ top: 180, left: 0 });
    });

    it('e2eManualRowResizerPositionFixedTopOverlaySecondRow', () => {
      expect(themeLayoutFromTokens('classic').e2eManualRowResizerPositionFixedTopOverlaySecondRow())
        .toEqual({ top: 73, left: 0 });
      expect(themeLayoutFromTokens('main').e2eManualRowResizerPositionFixedTopOverlaySecondRow())
        .toEqual({ top: 82, left: 0 });
      expect(themeLayoutFromTokens('horizon').e2eManualRowResizerPositionFixedTopOverlaySecondRow())
        .toEqual({ top: 106, left: 0 });
    });

    it('e2eManualRowResizerPositionFixedBottomOverlayFirstRow', () => {
      expect(themeLayoutFromTokens('classic').e2eManualRowResizerPositionFixedBottomOverlayFirstRow())
        .toEqual({ top: 21, left: 0 });
      expect(themeLayoutFromTokens('main').e2eManualRowResizerPositionFixedBottomOverlayFirstRow())
        .toEqual({ top: 24, left: 0 });
      expect(themeLayoutFromTokens('horizon').e2eManualRowResizerPositionFixedBottomOverlayFirstRow())
        .toEqual({ top: 32, left: 0 });
    });

    it('e2eManualRowResizeRowHeaderHeightAfterDoubleClickAutoSize', () => {
      expect(themeLayoutFromTokens('classic').e2eManualRowResizeRowHeaderHeightAfterDoubleClickAutoSize())
        .toBe(46);
      expect(themeLayoutFromTokens('main').e2eManualRowResizeRowHeaderHeightAfterDoubleClickAutoSize())
        .toBe(48);
      expect(themeLayoutFromTokens('horizon').e2eManualRowResizeRowHeaderHeightAfterDoubleClickAutoSize())
        .toBe(56);
    });

    it('e2eManualRowResizeAutosizeHeightAfterDoubleClickFrom300', () => {
      expect(themeLayoutFromTokens('classic').e2eManualRowResizeAutosizeHeightAfterDoubleClickFrom300())
        .toBe(23);
      expect(themeLayoutFromTokens('main').e2eManualRowResizeAutosizeHeightAfterDoubleClickFrom300())
        .toBe(29);
      expect(themeLayoutFromTokens('horizon').e2eManualRowResizeAutosizeHeightAfterDoubleClickFrom300())
        .toBe(37);
    });

    it('e2eManualColumnResizeResizerPositionTopCloneLeft194', () => {
      expect(themeLayoutFromTokens('classic').e2eManualColumnResizeResizerPositionTopCloneLeft194())
        .toEqual({ top: 0, left: 194 });
      expect(themeLayoutFromTokens('main').e2eManualColumnResizeResizerPositionTopCloneLeft194())
        .toEqual({ top: 0, left: 194 });
      expect(themeLayoutFromTokens('horizon').e2eManualColumnResizeResizerPositionTopCloneLeft194())
        .toEqual({ top: 0, left: 198 });
    });

    it('e2eManualColumnResizeResizerPositionTopCloneLeft94', () => {
      expect(themeLayoutFromTokens('classic').e2eManualColumnResizeResizerPositionTopCloneLeft94())
        .toEqual({ top: 0, left: 94 });
      expect(themeLayoutFromTokens('main').e2eManualColumnResizeResizerPositionTopCloneLeft94())
        .toEqual({ top: 0, left: 94 });
      expect(themeLayoutFromTokens('horizon').e2eManualColumnResizeResizerPositionTopCloneLeft94())
        .toEqual({ top: 0, left: 95 });
    });

    it('exposes densityLevel for debugging', () => {
      expect(themeLayoutFromTokens('classic').densityLevel).toBe('compact');
      expect(themeLayoutFromTokens('main').densityLevel).toBe('default');
      expect(themeLayoutFromTokens('horizon').densityLevel).toBe('comfortable');
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
