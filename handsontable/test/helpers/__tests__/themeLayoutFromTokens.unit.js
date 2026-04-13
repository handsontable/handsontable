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
        defaultDensity: 'b',
        comfortable: 'c',
      })).toBe('a');
      expect(themeLayoutFromTokens('main').pickByDensity({
        compact: 'a',
        defaultDensity: 'b',
        comfortable: 'c',
      })).toBe('b');
      expect(themeLayoutFromTokens('horizon').pickByDensity({
        compact: 'a',
        defaultDensity: 'b',
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

    it('stretch columns and nested headers E2E helpers match density triplets', () => {
      const cases = [
        ['e2eStretchColumnsAlter320InsertEnd1', 90, 90, 85],
        ['e2eStretchColumnsAlter320InsertStartVisible', 68, 68, 64],
        ['e2eStretchColumnsAlter320InsertStartTrailing', 66, 66, 63],
        ['e2eStretchColumnsAlter320SixColsStretched', 54, 54, 51],
        ['e2eStretchColumnsWidth200StretchAllFirstTwo', 67, 67, 62],
        ['e2eStretchColumnsWidth200StretchAllLast', 66, 66, 61],
        ['e2eStretchColumnsWidth200StretchLast', 100, 100, 85],
        ['e2eStretchColumnsWidth500ThreeCols', 150, 150, 145],
        ['e2eStretchColumnsMultilineWidth500Col0', 412, 418, 420],
        ['e2eStretchColumnsMultilineWidth500Col1', 88, 82, 80],
        ['e2eStretchColumnsLongTextWidth400Col4', 286, 311, 319],
        ['e2eNestedHeadersSelectionInlineScroll50', 50, 50, 51],
        ['e2eNestedHeadersSelectionInlineScroll265', 265, 265, 278],
        ['e2eNestedHeadersSelectionInlineScroll65', 65, 65, 72],
        ['e2eNestedHeadersSelectionInlineScroll250', 250, 250, 257],
        ['e2eNestedHeadersNavInlineScrollAfterD', 66, 66, 74],
        ['e2eNestedHeadersNavInlineScrollAfterE', 266, 266, 279],
        ['e2eNestedHeadersNavInlineScrollAfterF', 516, 516, 539],
        ['e2eNestedHeadersNavInlineScrollAfterG', 866, 866, 900],
        ['e2eNestedHeadersNavInlineScrollAfterH', 1266, 1280, 1354],
        ['e2eNestedHeadersNavInlineScrollAfterI', 1316, 1333, 1415],
        ['e2eNestedHeadersManualColumnResizeCol1AfterDrag50', 27, 36, 44],
        ['e2eManualColumnResizeWidth155155156', 155, 155, 156],
        ['e2eManualColumnResizeWidth222735', 22, 27, 35],
        ['e2eManualColumnResizeWidth220218216', 220, 218, 216],
        ['e2eManualColumnResizeWidth220219217', 220, 219, 217],
        ['e2eManualColumnResizeWidth221220218', 221, 220, 218],
        ['e2eManualColumnResizeWidth293543', 29, 35, 43],
        ['e2eManualColumnResizeWidth293544', 29, 35, 44],
        ['e2eManualColumnResizeWidth303644', 30, 36, 44],
        ['e2eManualColumnResizeWidth313644', 31, 36, 44],
        ['e2eManualColumnResizeWidth343435', 34, 34, 35],
        ['e2eManualColumnResizeWidth505051', 50, 50, 51],
        ['e2eManualColumnResizeWidth505052', 50, 50, 52],
        ['e2eManualColumnResizeWidth505053', 50, 50, 53],
        ['e2eManualColumnResizeWidth736730723', 736, 730, 723],
        ['e2eManualColumnResizeWidth788795', 78, 87, 95],
        ['e2eManualColumnResizeWidth797981', 79, 79, 81],
        ['e2eManualColumnResizeWidth808081', 80, 80, 81],
        ['e2eManualColumnResizeWidth808082', 80, 80, 82],
        ['e2eManualColumnResizeRtlStretchedHeaderOuterWidth', 196, 196, 198],
        ['e2eAutoColumnSize_104_115_123', 104, 115, 123],
        ['e2eAutoColumnSize_123_135_143', 123, 135, 143],
        ['e2eAutoColumnSize_127_139_147', 127, 139, 147],
        ['e2eAutoColumnSize_129_138_146', 129, 138, 146],
        ['e2eAutoColumnSize_133_146_154', 133, 146, 154],
        ['e2eAutoColumnSize_133_151_161', 133, 151, 161],
        ['e2eAutoColumnSize_143_157_165', 143, 157, 165],
        ['e2eAutoColumnSize_155_170_178', 155, 170, 178],
        ['e2eAutoColumnSize_162_177_185', 162, 177, 185],
        ['e2eAutoColumnSize_192_210_218', 192, 210, 218],
        ['e2eAutoColumnSize_198_216_224', 198, 216, 224],
        ['e2eAutoColumnSize_207_225_233', 207, 225, 233],
        ['e2eAutoColumnSize_2235_2322_2575', 2235, 2322, 2575],
        ['e2eAutoColumnSize_50_50_58', 50, 50, 58],
        ['e2eAutoColumnSize_50_52_60', 50, 52, 60],
        ['e2eAutoColumnSize_55_62_70', 55, 62, 70],
        ['e2eAutoColumnSize_58_65_73', 58, 65, 73],
        ['e2eAutoColumnSize_64_72_80', 64, 72, 80],
        ['e2eAutoColumnSize_65_67_75', 65, 67, 75],
        ['e2eAutoColumnSize_67_75_83', 67, 75, 83],
        ['e2eAutoColumnSize_82_91_99', 82, 91, 99],
        ['e2eAutoColumnSize_95_95_100', 95, 95, 100],
        ['e2eNestedHeadersGhostTable_100_110_117', 100, 110, 117],
        ['e2eNestedHeadersGhostTable_102_111_114', 102, 111, 114],
        ['e2eNestedHeadersGhostTable_135_150_158', 135, 150, 158],
        ['e2eNestedHeadersGhostTable_201_219_227', 201, 219, 227],
        ['e2eNestedHeadersGhostTable_21_26_33', 21, 26, 33],
        ['e2eNestedHeadersGhostTable_21_26_34', 21, 26, 34],
        ['e2eNestedHeadersGhostTable_22_26_34', 22, 26, 34],
        ['e2eNestedHeadersGhostTable_22_26_35', 22, 26, 35],
        ['e2eNestedHeadersGhostTable_22_27_35', 22, 27, 35],
        ['e2eNestedHeadersGhostTable_23_27_36', 23, 27, 36],
        ['e2eNestedHeadersGhostTable_23_28_36', 23, 28, 36],
        ['e2eNestedHeadersGhostTable_24_28_36', 24, 28, 36],
        ['e2eNestedHeadersGhostTable_25_30_38', 25, 30, 38],
        ['e2eNestedHeadersGhostTable_79_88_96', 79, 88, 96],
        ['e2eNestedHeadersGhostTable_98_108_112', 98, 108, 112],
        ['e2eNestedHeadersGhostTable_99_110_118', 99, 110, 118],
      ];

      for (const [name, classicV, mainV, horizonV] of cases) {
        expect(themeLayoutFromTokens('classic')[name]()).toBe(classicV);
        expect(themeLayoutFromTokens('main')[name]()).toBe(mainV);
        expect(themeLayoutFromTokens('horizon')[name]()).toBe(horizonV);
      }
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
