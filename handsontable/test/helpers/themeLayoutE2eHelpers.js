/**
 * E2E regression layout helpers built on `themeLayoutCore.js` (token primitives only).
 * Hashed `e2eGcr_*` / `e2eDensity_*` expectations live here.
 */

/**
 * @param {object} core Return value of {@link createThemeLayoutCore} from `./themeLayoutCore.js`.
 * @returns {object} Methods merged into the public theme layout API.
 */
export function buildThemeLayoutE2eHelpers(core) {
  const {
    lineHeight,
    cellVerticalPadding,
    cellHorizontalPadding,
    cellBorderWidth,
    cellContentHeight,
    defaultDataRowHeight,
    defaultColumnHeaderHeight,
    firstRenderedRowDefaultHeight,
    defaultColumnWidth,
    defaultRowHeaderWidth,
    pickByDensity,
    overlayHeight,
  } = core;

  const densityLevel = core.densityLevel;
  const isDensity = level => densityLevel === level;
  const isCompactDensity = densityLevel === 'compact';

  const gcrEditedCellOuterHeight = cellContentHeight + (2 * cellBorderWidth);
  const gcrTwoAdjacentDataRowsOuterHeight = (2 * defaultDataRowHeight) + (2 * cellBorderWidth);
  const gcrTwoDataRowsPairOuterHeight = (2 * defaultDataRowHeight) + cellBorderWidth;
  const gcrTwoDataRowsPairClipMaxHeight = gcrTwoDataRowsPairOuterHeight + 15;

  /**
   * `topOverlay().getScrollPosition()` after rectangular API selection `[[11, 0, 10, 0]]` with
   * prior vertical scroll (multipleSelection E2E partial bottom edge). Same base scroll as
   * `e2eNoncontiguousBottomEdgeScrollTop` before the non-contiguous stride subtraction.
   *
   * @param {number} initialScroll Prior vertical scroll offset.
   * @returns {number}
   */
  function e2eViewportScrollAfterRectangularAdjacentDataRows(initialScroll) {
    if (isDensity('compact')) {
      return initialScroll + (2 * cellContentHeight);
    }

    if (isDensity('default')) {
      return initialScroll + (3 * defaultDataRowHeight) + (2 * cellBorderWidth);
    }

    return initialScroll + (5 * defaultDataRowHeight) + cellVerticalPadding;
  }

  return {
    /**
     * TD outer height in getEditedCellRect E2E rects when it matches the live edited cell.
     * `cellContentHeight + 2 * cellBorderWidth` (top and bottom table cell borders).
     *
     * @returns {number}
     */
    e2eGcrEditedCellOuterHeight() {
      return gcrEditedCellOuterHeight;
    },

    /**
     * Master column client width in GCR rects (50 / 50 / 51 across densities).
     *
     * @returns {number}
     */
    e2eGcrDefaultMasterColumnClientWidth() {
      return defaultColumnWidth + (isDensity('comfortable') ? 1 : 0);
    },

    /**
     * Default data column outer width in GCR rects (51 / 51 / 52).
     *
     * @returns {number}
     */
    e2eGcrDefaultDataColumnOuterWidth() {
      return defaultColumnWidth + cellBorderWidth + (isDensity('comfortable') ? 1 : 0);
    },

    /**
     * Vertical scroll position after row-header selection from last row to first with prior
     * scroll of six default rows (rowHeaderSelection E2E).
     *
     * @returns {number}
     */
    e2eRowHeaderSelectionScrollTopAfterSelectLastToFirst() {
      // TODO(PRO-858): Replace 4/3 fudge with a sizing token once row-header scroll snap is traced.
      const alignment = lineHeight + cellBorderWidth - (isDensity('compact') ? 4 : 3);

      return (8 * defaultDataRowHeight) + alignment;
    },

    /**
     * Trim subtracted from `defaultColumnWidth + 2 * defaultDataRowHeight` for password editor
     * autoresize width (passwordEditor E2E).
     *
     * @returns {number}
     */
    e2ePasswordEditorAutoresizeWidthTrimPx() {
      if (isDensity('comfortable')) {
        return cellBorderWidth + cellVerticalPadding;
      }

      if (isDensity('compact')) {
        return cellBorderWidth + (2 * cellVerticalPadding);
      }

      return cellBorderWidth;
    },

    /**
     * Pick a theme-dependent literal by density (classic → compact, main → default,
     * horizon → comfortable). Use this in specs instead of `it.forTheme` triplets. ESLint forbids
     * calling {@link pickByDensity} from `*.spec.js`.
     *
     * @template T
     * @param {{ compact: T, default: T, comfortable: T }} values Expectations per density bucket.
     * @returns {T}
     */
    e2ePickForDensity(values) {
      return pickByDensity(values);
    },

    /**
     * Subtracted from `verticalScrollForRow(rowIndex)` when snapping the viewport for a far row
     * after scroll-to-corner (comments Ctrl+Alt+M E2E).
     *
     * @returns {number}
     */
    e2eCommentsShortcutVerticalScrollSubtract() {
      if (isDensity('compact')) {
        return (9 * defaultColumnHeaderHeight) + (6 * cellBorderWidth);
      }

      if (isDensity('default')) {
        return (8 * defaultColumnHeaderHeight) + cellBorderWidth;
      }

      // TODO(PRO-858): `- 8` is viewport snap fudge; tie to a token once comments shortcut scroll is traced.
      return (5 * defaultColumnHeaderHeight) + defaultDataRowHeight - 8;
    },

    /**
     * `window.scrollY` after scrolling the page then moving context menu selection to the first
     * item (context menu keyboard E2E).
     *
     * @returns {number}
     */
    e2eWindowScrollYContextMenuFirstSelectableItem() {
      const snap = firstRenderedRowDefaultHeight - defaultDataRowHeight;
      let extra;

      // TODO(PRO-858): Context menu window.scrollY snap uses padding/border mixes; confirm against menu chrome tokens.
      if (isDensity('comfortable')) {
        extra = cellVerticalPadding + (4 * cellBorderWidth);
      } else if (isDensity('compact')) {
        extra = 4 * cellVerticalPadding;
      } else {
        extra = 2 * cellVerticalPadding;
      }

      return snap + extra;
    },

    /**
     * `window.scrollY` after scrolling the page then moving dropdown menu selection to the first
     * item (dropdown menu keyboard E2E).
     *
     * @returns {number}
     */
    e2eWindowScrollYDropdownMenuFirstSelectableItem() {
      let sub;

      // TODO(PRO-858): `+ 2` / `+ 10` are dropdown menu scroll fudge; map to theme menu metrics.
      if (isDensity('compact')) {
        sub = lineHeight;
      } else if (isDensity('default')) {
        sub = lineHeight + cellBorderWidth + 2;
      } else {
        sub = lineHeight + cellBorderWidth + 10;
      }

      return defaultColumnHeaderHeight + firstRenderedRowDefaultHeight - sub;
    },

    /**
     * Subtracted from `marginTop + 6 * defaultDataRowHeight + defaultColumnHeaderHeight` for
     * document-space Y of the filters conditional submenu (filters conditional E2E).
     *
     * @returns {number}
     */
    e2eFiltersConditionalSubmenuDocumentYSubtract() {
      if (isDensity('compact')) {
        return (16 * defaultDataRowHeight) + (3 * cellBorderWidth);
      }

      // TODO(PRO-858): `22` and `- 8` are document Y fudge for filters conditional submenu; replace with layout tokens.
      if (isDensity('default')) {
        return (16 * defaultDataRowHeight) + 22;
      }

      return (16 * defaultDataRowHeight) - 8;
    },

    /**
     * `topOverlay().getScrollPosition()` after non-contiguous selection on the bottom edge
     * (noncontiguousSelection E2E). `initialScroll` matches `scrollViewportVertically` argument.
     *
     * @param {number} initialScroll Prior vertical scroll offset.
     * @returns {number}
     */
    e2eNoncontiguousBottomEdgeScrollTop(initialScroll) {
      const stride = isCompactDensity ? cellContentHeight : defaultDataRowHeight;
      const scrollAfterRectangularRowPair = e2eViewportScrollAfterRectangularAdjacentDataRows(
        initialScroll
      );

      return scrollAfterRectangularRowPair - (2 * stride);
    },

    /**
     * `topOverlay().getScrollPosition()` after row-header partial visibility + Shift+ArrowDown
     * (multipleSelection E2E: navigable row headers, prior `scrollViewportVertically`).
     *
     * @param {number} initialScroll Prior vertical scroll offset.
     * @returns {number}
     */
    e2eMultipleSelectionRowHeadersShiftArrowDownPartialBottom(initialScroll) {
      if (isDensity('compact')) {
        return initialScroll + defaultDataRowHeight - (2 * cellBorderWidth);
      }

      if (isDensity('default')) {
        return initialScroll + (2 * defaultDataRowHeight) + (2 * cellBorderWidth);
      }

      return initialScroll + (4 * defaultDataRowHeight) + cellVerticalPadding;
    },

    e2eViewportScrollAfterRectangularAdjacentDataRows,

    /**
     * `topOverlay().getScrollPosition()` after `scrollViewportTo({ row: 10, col: 10 })` with
     * pagination enabled (pagination E2E page change).
     *
     * @returns {number}
     */
    e2ePaginationScrollTopAfterScrollViewportToRow10Col10() {
      return pickByDensity({
        compact: 101,
        default: 134,
        comfortable: 222,
      });
    },

    /**
     * `inlineStartOverlay().getScrollPosition()` after `scrollViewportTo({ row: 10, col: 10 })`
     * with pagination (pagination E2E).
     *
     * @returns {number}
     */
    e2ePaginationInlineStartScrollAfterScrollViewportToRow10Col10() {
      return pickByDensity({
        compact: 65,
        default: 65,
        comfortable: 79,
      });
    },

    /**
     * Stretched column width (three equal stretch columns) in stretchColumns indexOrder E2E
     * (`width: 320`, `rowHeaders: true`, one column forced to 33px).
     *
     * @returns {number}
     */
    e2eStretchColumnsIndexOrderStretchedWidth() {
      return pickByDensity({
        compact: 79,
        default: 79,
        comfortable: 74,
      });
    },

    /**
     * `manualRowResizer` jQuery `.position()` when hovering master clone row under `fixedRowsTop: 2`
     * before moving to the top overlay row (manualRowResize E2E).
     *
     * @returns {{ top: number, left: number }}
     */
    e2eManualRowResizerPositionFixedTopMasterFourthRow() {
      const top = defaultColumnHeaderHeight + (4 * cellContentHeight);

      return { top, left: 0 };
    },

    /**
     * `manualRowResizer` position after moving hover to top overlay second fixed row
     * (manualRowResize E2E, `fixedRowsTop: 2`).
     *
     * @returns {{ top: number, left: number }}
     */
    e2eManualRowResizerPositionFixedTopOverlaySecondRow() {
      return pickByDensity({
        compact: { top: 73, left: 0 },
        default: { top: 82, left: 0 },
        comfortable: { top: 106, left: 0 },
      });
    },

    /**
     * `manualRowResizer` position when hovering bottom overlay first row with `fixedRowsBottom: 2`
     * (manualRowResize E2E).
     *
     * @returns {{ top: number, left: number }}
     */
    e2eManualRowResizerPositionFixedBottomOverlayFirstRow() {
      return { top: defaultDataRowHeight - 5, left: 0 };
    },

    /**
     * Row-header TH height after double-click auto-size with mixed row heights (manualRowResize E2E).
     *
     * @returns {number}
     */
    e2eManualRowResizeRowHeaderHeightAfterDoubleClickAutoSize() {
      return defaultDataRowHeight + (isDensity('compact') ? 20 : 19);
    },

    /**
     * `rowHeight` after double-click autosize on a row previously stretched to 300px with no
     * initial `rowHeights` (manualRowResize E2E).
     *
     * @returns {number}
     */
    e2eManualRowResizeAutosizeHeightAfterDoubleClickFrom300() {
      if (isDensity('compact')) {
        return cellContentHeight - 2;
      }

      return defaultDataRowHeight;
    },

    // --- Stretch columns E2E (width / viewport-specific; literals from regression specs) ---

    e2eStretchColumnsAlter320InsertEnd1() {
      return pickByDensity({
        compact: 90,
        default: 90,
        comfortable: 85,
      });
    },

    e2eStretchColumnsAlter320InsertStartVisible() {
      return pickByDensity({
        compact: 68,
        default: 68,
        comfortable: 64,
      });
    },

    e2eStretchColumnsAlter320InsertStartTrailing() {
      return pickByDensity({
        compact: 66,
        default: 66,
        comfortable: 63,
      });
    },

    e2eStretchColumnsAlter320SixColsStretched() {
      return pickByDensity({
        compact: 54,
        default: 54,
        comfortable: 51,
      });
    },

    e2eStretchColumnsWidth200StretchAllFirstTwo() {
      return pickByDensity({
        compact: 67,
        default: 67,
        comfortable: 62,
      });
    },

    e2eStretchColumnsWidth200StretchAllLast() {
      return pickByDensity({
        compact: 66,
        default: 66,
        comfortable: 61,
      });
    },

    e2eStretchColumnsWidth200StretchLast() {
      return pickByDensity({
        compact: 100,
        default: 100,
        comfortable: 85,
      });
    },

    e2eStretchColumnsWidth500ThreeCols() {
      return pickByDensity({
        compact: 150,
        default: 150,
        comfortable: 145,
      });
    },

    e2eStretchColumnsMultilineWidth500Col0() {
      return pickByDensity({
        compact: 412,
        default: 418,
        comfortable: 420,
      });
    },

    e2eStretchColumnsMultilineWidth500Col1() {
      return pickByDensity({
        compact: 88,
        default: 82,
        comfortable: 80,
      });
    },

    e2eStretchColumnsLongTextWidth400Col4() {
      return pickByDensity({
        compact: 286,
        default: 311,
        comfortable: 319,
      });
    },

    // --- Nested headers keyboard navigation / selection E2E ---

    e2eNestedHeadersSelectionInlineScroll50() {
      return pickByDensity({
        compact: 50,
        default: 50,
        comfortable: 51,
      });
    },

    e2eNestedHeadersSelectionInlineScroll265() {
      return pickByDensity({
        compact: 265,
        default: 265,
        comfortable: 278,
      });
    },

    e2eNestedHeadersSelectionInlineScroll65() {
      return pickByDensity({
        compact: 65,
        default: 65,
        comfortable: 72,
      });
    },

    e2eNestedHeadersSelectionInlineScroll250() {
      return pickByDensity({
        compact: 250,
        default: 250,
        comfortable: 257,
      });
    },

    e2eNestedHeadersNavInlineScrollAfterD() {
      return pickByDensity({
        compact: 66,
        default: 66,
        comfortable: 74,
      });
    },

    e2eNestedHeadersNavInlineScrollAfterE() {
      return pickByDensity({
        compact: 266,
        default: 266,
        comfortable: 279,
      });
    },

    e2eNestedHeadersNavInlineScrollAfterF() {
      return pickByDensity({
        compact: 516,
        default: 516,
        comfortable: 539,
      });
    },

    e2eNestedHeadersNavInlineScrollAfterG() {
      return pickByDensity({
        compact: 866,
        default: 866,
        comfortable: 900,
      });
    },

    e2eNestedHeadersNavInlineScrollAfterH() {
      return pickByDensity({
        compact: 1266,
        default: 1280,
        comfortable: 1354,
      });
    },

    e2eNestedHeadersNavInlineScrollAfterI() {
      return pickByDensity({
        compact: 1316,
        default: 1333,
        comfortable: 1415,
      });
    },

    /**
     * `colWidth` for column 1 after dragging nested-header column resize by 50px
     * (nestedHeaders + manualColumnResize E2E).
     *
     * @returns {number}
     */
    e2eNestedHeadersManualColumnResizeCol1AfterDrag50() {
      return pickByDensity({
        compact: 27,
        default: 36,
        comfortable: 44,
      });
    },

    // --- Manual column resize E2E (literals from manualColumnResize.spec.js) ---

    e2eManualColumnResizeResizerPositionTopCloneLeft194() {
      return pickByDensity({
        compact: { top: 0, left: 194 },
        default: { top: 0, left: 194 },
        comfortable: { top: 0, left: 198 },
      });
    },

    e2eManualColumnResizeResizerPositionTopCloneLeft94() {
      return pickByDensity({
        compact: { top: 0, left: 94 },
        default: { top: 0, left: 94 },
        comfortable: { top: 0, left: 95 },
      });
    },

    e2eManualColumnResizeWidth155155156() {
      return pickByDensity({
        compact: 155,
        default: 155,
        comfortable: 156,
      });
    },

    e2eManualColumnResizeWidth222735() {
      return pickByDensity({
        compact: 22,
        default: 27,
        comfortable: 35,
      });
    },

    e2eManualColumnResizeWidth220218216() {
      return pickByDensity({
        compact: 220,
        default: 218,
        comfortable: 216,
      });
    },

    e2eManualColumnResizeWidth220219217() {
      return pickByDensity({
        compact: 220,
        default: 219,
        comfortable: 217,
      });
    },

    e2eManualColumnResizeWidth221220218() {
      return pickByDensity({
        compact: 221,
        default: 220,
        comfortable: 218,
      });
    },

    e2eManualColumnResizeWidth293543() {
      return pickByDensity({
        compact: 29,
        default: 35,
        comfortable: 43,
      });
    },

    e2eManualColumnResizeWidth293544() {
      return pickByDensity({
        compact: 29,
        default: 35,
        comfortable: 44,
      });
    },

    e2eManualColumnResizeWidth303644() {
      return pickByDensity({
        compact: 30,
        default: 36,
        comfortable: 44,
      });
    },

    e2eManualColumnResizeWidth313644() {
      return pickByDensity({
        compact: 31,
        default: 36,
        comfortable: 44,
      });
    },

    e2eManualColumnResizeWidth343435() {
      return pickByDensity({
        compact: 34,
        default: 34,
        comfortable: 35,
      });
    },

    e2eManualColumnResizeWidth505051() {
      return pickByDensity({
        compact: 50,
        default: 50,
        comfortable: 51,
      });
    },

    e2eManualColumnResizeWidth505052() {
      return pickByDensity({
        compact: 50,
        default: 50,
        comfortable: 52,
      });
    },

    e2eManualColumnResizeWidth505053() {
      return pickByDensity({
        compact: 50,
        default: 50,
        comfortable: 53,
      });
    },

    e2eManualColumnResizeWidth736730723() {
      return pickByDensity({
        compact: 736,
        default: 730,
        comfortable: 723,
      });
    },

    e2eManualColumnResizeWidth788795() {
      return pickByDensity({
        compact: 78,
        default: 87,
        comfortable: 95,
      });
    },

    e2eManualColumnResizeWidth797981() {
      return pickByDensity({
        compact: 79,
        default: 79,
        comfortable: 81,
      });
    },

    e2eManualColumnResizeWidth808081() {
      return pickByDensity({
        compact: 80,
        default: 80,
        comfortable: 81,
      });
    },

    e2eManualColumnResizeWidth808082() {
      return pickByDensity({
        compact: 80,
        default: 80,
        comfortable: 82,
      });
    },

    /**
     * `outerWidth()` of stretched column headers in RTL manual column resize E2E.
     *
     * @returns {number}
     */
    e2eManualColumnResizeRtlStretchedHeaderOuterWidth() {
      return pickByDensity({
        compact: 196,
        default: 196,
        comfortable: 198,
      });
    },

    // --- Auto column size E2E (from autoColumnSize.spec.js) ---

    e2eAutoColumnSize_104_115_123() {
      return pickByDensity({
        compact: 104,
        default: 115,
        comfortable: 123,
      });
    },

    e2eAutoColumnSize_123_135_143() {
      return pickByDensity({
        compact: 123,
        default: 135,
        comfortable: 143,
      });
    },

    e2eAutoColumnSize_127_139_147() {
      return pickByDensity({
        compact: 127,
        default: 139,
        comfortable: 147,
      });
    },

    e2eAutoColumnSize_129_138_146() {
      return pickByDensity({
        compact: 129,
        default: 138,
        comfortable: 146,
      });
    },

    e2eAutoColumnSize_133_146_154() {
      return pickByDensity({
        compact: 133,
        default: 146,
        comfortable: 154,
      });
    },

    e2eAutoColumnSize_133_151_161() {
      return pickByDensity({
        compact: 133,
        default: 151,
        comfortable: 161,
      });
    },

    e2eAutoColumnSize_143_157_165() {
      return pickByDensity({
        compact: 143,
        default: 157,
        comfortable: 165,
      });
    },

    e2eAutoColumnSize_155_170_178() {
      return pickByDensity({
        compact: 155,
        default: 170,
        comfortable: 178,
      });
    },

    e2eAutoColumnSize_162_177_185() {
      return pickByDensity({
        compact: 162,
        default: 177,
        comfortable: 185,
      });
    },

    e2eAutoColumnSize_192_210_218() {
      return pickByDensity({
        compact: 192,
        default: 210,
        comfortable: 218,
      });
    },

    e2eAutoColumnSize_198_216_224() {
      return pickByDensity({
        compact: 198,
        default: 216,
        comfortable: 224,
      });
    },

    e2eAutoColumnSize_207_225_233() {
      return pickByDensity({
        compact: 207,
        default: 225,
        comfortable: 233,
      });
    },

    e2eAutoColumnSize_2235_2322_2575() {
      return pickByDensity({
        compact: 2235,
        default: 2322,
        comfortable: 2575,
      });
    },

    e2eAutoColumnSize_50_50_58() {
      return pickByDensity({
        compact: 50,
        default: 50,
        comfortable: 58,
      });
    },

    e2eAutoColumnSize_50_52_60() {
      return pickByDensity({
        compact: 50,
        default: 52,
        comfortable: 60,
      });
    },

    e2eAutoColumnSize_55_62_70() {
      return pickByDensity({
        compact: 55,
        default: 62,
        comfortable: 70,
      });
    },

    e2eAutoColumnSize_58_65_73() {
      return pickByDensity({
        compact: 58,
        default: 65,
        comfortable: 73,
      });
    },

    e2eAutoColumnSize_64_72_80() {
      return pickByDensity({
        compact: 64,
        default: 72,
        comfortable: 80,
      });
    },

    e2eAutoColumnSize_65_67_75() {
      return pickByDensity({
        compact: 65,
        default: 67,
        comfortable: 75,
      });
    },

    e2eAutoColumnSize_67_75_83() {
      return pickByDensity({
        compact: 67,
        default: 75,
        comfortable: 83,
      });
    },

    e2eAutoColumnSize_82_91_99() {
      return pickByDensity({
        compact: 82,
        default: 91,
        comfortable: 99,
      });
    },

    e2eAutoColumnSize_95_95_100() {
      return pickByDensity({
        compact: 95,
        default: 95,
        comfortable: 100,
      });
    },

    // --- Nested headers ghost table E2E (from ghostTable.spec.js) ---

    e2eNestedHeadersGhostTable_100_110_117() {
      return pickByDensity({
        compact: 100,
        default: 110,
        comfortable: 117,
      });
    },

    e2eNestedHeadersGhostTable_102_111_114() {
      return pickByDensity({
        compact: 102,
        default: 111,
        comfortable: 114,
      });
    },

    e2eNestedHeadersGhostTable_135_150_158() {
      return pickByDensity({
        compact: 135,
        default: 150,
        comfortable: 158,
      });
    },

    e2eNestedHeadersGhostTable_201_219_227() {
      return pickByDensity({
        compact: 201,
        default: 219,
        comfortable: 227,
      });
    },

    e2eNestedHeadersGhostTable_21_26_33() {
      return pickByDensity({
        compact: 21,
        default: 26,
        comfortable: 33,
      });
    },

    e2eNestedHeadersGhostTable_21_26_34() {
      return pickByDensity({
        compact: 21,
        default: 26,
        comfortable: 34,
      });
    },

    e2eNestedHeadersGhostTable_22_26_34() {
      return pickByDensity({
        compact: 22,
        default: 26,
        comfortable: 34,
      });
    },

    e2eNestedHeadersGhostTable_22_26_35() {
      return pickByDensity({
        compact: 22,
        default: 26,
        comfortable: 35,
      });
    },

    e2eNestedHeadersGhostTable_22_27_35() {
      return pickByDensity({
        compact: 22,
        default: 27,
        comfortable: 35,
      });
    },

    e2eNestedHeadersGhostTable_23_27_36() {
      return pickByDensity({
        compact: 23,
        default: 27,
        comfortable: 36,
      });
    },

    e2eNestedHeadersGhostTable_23_28_36() {
      return pickByDensity({
        compact: 23,
        default: 28,
        comfortable: 36,
      });
    },

    e2eNestedHeadersGhostTable_24_28_36() {
      return pickByDensity({
        compact: 24,
        default: 28,
        comfortable: 36,
      });
    },

    e2eNestedHeadersGhostTable_25_30_38() {
      return pickByDensity({
        compact: 25,
        default: 30,
        comfortable: 38,
      });
    },

    e2eNestedHeadersGhostTable_79_88_96() {
      return pickByDensity({
        compact: 79,
        default: 88,
        comfortable: 96,
      });
    },

    e2eNestedHeadersGhostTable_98_108_112() {
      return pickByDensity({
        compact: 98,
        default: 108,
        comfortable: 112,
      });
    },

    e2eNestedHeadersGhostTable_99_110_118() {
      return pickByDensity({
        compact: 99,
        default: 110,
        comfortable: 118,
      });
    },

    /**
     * Dropdown / column-header menu vertical anchor: bottom of header cell minus density trim.
     *
     * @param {number} offsetTop jQuery .offset().top of the TH.
     * @param {number} clientHeight TH clientHeight.
     * @returns {number}
     */
    e2eColumnHeaderMenuAnchorTop(offsetTop, clientHeight) {
      const trim = pickByDensity({
        compact: 2,
        default: 1,
        comfortable: 5,
      });

      return offsetTop + clientHeight - trim;
    },

    /**
     * Tick icon inline-start offset inside dropdown or context menu root (read-only item).
     *
     * @param {number} rootOffsetLeft Menu root jQuery .offset().left.
     * @returns {number}
     */
    e2eMenuTickItemInlineStartFromRootLeft(rootOffsetLeft) {
      const add = pickByDensity({
        compact: 1,
        default: 1,
        comfortable: 0,
      });

      return rootOffsetLeft + add;
    },

    /**
     * Text editor TEXTAREA height for a single data line (matches first rendered row outer height).
     *
     * @returns {string}
     */
    e2eTextEditorTextareaHeightSingleLinePx() {
      return `${firstRenderedRowDefaultHeight}px`;
    },

    /**
     * TEXTAREA parent top for first data row under a column title row (outer row height).
     *
     * @returns {string}
     */
    e2eTextEditorTextareaParentTopPx() {
      return `${defaultDataRowHeight}px`;
    },

    /**
     * Text editor TEXTAREA height for three lines of text.
     *
     * @returns {string}
     */
    e2eTextEditorTextareaHeightThreeLinesPx() {
      const px = (3 * lineHeight) + (2 * cellVerticalPadding) + (2 * cellBorderWidth);

      return `${px}px`;
    },

    /**
     * Checkbox label inner width when the label stretches to the cell (non-separated layout).
     * Trim matches 2 * horizontal padding + border for each density (see checkboxRenderer E2E).
     *
     * @param {number} cellOuterWidth TD offsetWidth.
     * @returns {number}
     */
    e2eCheckboxRendererMergedLabelInnerWidth(cellOuterWidth) {
      const trim = pickByDensity({
        compact: 13,
        default: 17,
        comfortable: 25,
      });

      return cellOuterWidth - trim;
    },

    /**
     * Border-top position after scroll in merge-cells selection (adds one default data row).
     *
     * @param {number} topPositionBefore jQuery .position().top before scroll.
     * @returns {number}
     */
    e2eMergeCellsBorderTopAfterScroll(topPositionBefore) {
      return topPositionBefore + defaultDataRowHeight;
    },

    /**
     * TEXTAREA parent offset for wide merged cell after horizontal scroll (two data rows below header).
     *
     * @returns {{ top: number, left: number }}
     */
    e2eMergeCellsOpenEditorWideMergeTextareaParentOffset() {
      return {
        top: 2 * defaultDataRowHeight,
        left: defaultRowHeaderWidth,
      };
    },

    /**
     * TEXTAREA parent offset for tall merged cell after vertical scroll.
     *
     * @returns {{ top: number, left: number }}
     */
    e2eMergeCellsOpenEditorTallMergeTextareaParentOffset() {
      return {
        top: firstRenderedRowDefaultHeight,
        left: pickByDensity({
          compact: 99,
          default: 100,
          comfortable: 108,
        }),
      };
    },

    /**
     * Comment editor style.width / style.height after programmatic resize (padding + border on both axes).
     *
     * @param {number} width Requested editor width (pixels).
     * @param {number} height Requested editor height (pixels).
     * @returns {{ width: number, height: number }}
     */
    e2eCommentTextareaStyleWithSize(width, height) {
      return {
        width: width + (2 * cellHorizontalPadding) + (2 * cellBorderWidth),
        height: height + (2 * cellVerticalPadding) + (2 * cellBorderWidth),
      };
    },

    e2eDensity_516fd776f5() {
      return pickByDensity({
        compact: 'A13',
        default: 'A11',
        comfortable: 'A9',
      });
    },

    e2eDensity_e18c9a767b() {
      return pickByDensity({
        compact: 'A19',
        default: 'A18',
        comfortable: 'A6',
      });
    },

    e2eDensity_05e899e868() {
      return pickByDensity({
        compact: 'A21',
        default: 'A18',
        comfortable: 'A14',
      });
    },

    e2eDensity_763d67703a() {
      return pickByDensity({
        compact: 'A25',
        default: 'A22',
        comfortable: 'A17',
      });
    },

    e2eDensity_6f54af4a25() {
      return pickByDensity({
        compact: 'A27',
        default: 'A23',
        comfortable: 'A7',
      });
    },

    e2eDensity_d7aa2fd7d8() {
      return pickByDensity({
        compact: 'A5',
        default: 'A4',
        comfortable: 'A3',
      });
    },

    e2eDensity_837d6451b8() {
      return pickByDensity({
        compact: 'A8',
        default: 'A7',
        comfortable: 'A5',
      });
    },

    e2eDensity_d684162341() {
      return pickByDensity({
        compact: 'A9',
        default: 'A8',
        comfortable: 'A6',
      });
    },

    e2eDensity_dcb53105f5() {
      return pickByDensity({
        compact: -71,
        default: -62,
        comfortable: -38,
      });
    },

    e2eDensity_7d7cc669b9() {
      return pickByDensity({
        compact: 100,
        default: 100,
        comfortable: 170,
      });
    },

    e2eDensity_d97740ab8b() {
      return pickByDensity({
        compact: 10142,
        default: 11345,
        comfortable: 14553,
      });
    },

    e2eDensity_21de631a3d() {
      return pickByDensity({
        compact: 104,
        default: 94,
        comfortable: 61,
      });
    },

    e2eDensity_1369f821b5() {
      return pickByDensity({
        compact: 110,
        default: 109,
        comfortable: 117,
      });
    },

    /* MergeCells: top overlay height after multiline edit in a 3-row merged block (3-row overlay + 2 lines). */
    e2eDensity_0051ca7391() {
      return overlayHeight({ rows: 3 }) + (2 * lineHeight);
    },

    e2eDensity_d199d17b67() {
      return pickByDensity({
        compact: 130,
        default: 130,
        comfortable: 160,
      });
    },

    e2eDensity_6fb44e9a25() {
      return pickByDensity({
        compact: 130,
        default: 185,
        comfortable: 235,
      });
    },

    e2eDensity_5e8f2219da() {
      return pickByDensity({
        compact: 131,
        default: 129,
        comfortable: 137,
      });
    },

    /* MergeCells: fixed-column clone `.htCore` height for a 3-row merge (5 logical overlay rows). */
    e2eDensity_8992c845e6() {
      return overlayHeight({ rows: 5 });
    },

    e2eDensity_95d19e5e71() {
      return pickByDensity({
        compact: 134,
        default: 170,
        comfortable: 260,
      });
    },

    e2eDensity_86a4cac668() {
      return pickByDensity({
        compact: 139,
        default: 155,
        comfortable: 194,
      });
    },

    e2eDensity_73a19e226c() {
      return pickByDensity({
        compact: 140,
        default: 185,
        comfortable: 240,
      });
    },

    e2eDensity_0bf6b512ac() {
      return pickByDensity({
        compact: 149,
        default: 163,
        comfortable: 171,
      });
    },

    e2eDensity_e9b95cfc26() {
      return pickByDensity({
        compact: 150,
        default: 150,
        comfortable: 155,
      });
    },

    e2eDensity_d347abe8d6() {
      return pickByDensity({
        compact: 1819,
        default: 1961,
        comfortable: 2284,
      });
    },

    e2eDensity_dc11ccdb89() {
      return pickByDensity({
        compact: 192,
        default: 210,
        comfortable: 218,
      });
    },

    e2eDensity_3bcf74979c() {
      return pickByDensity({
        compact: 207,
        default: 225,
        comfortable: 233,
      });
    },

    e2eDensity_012c64941a() {
      return pickByDensity({
        compact: 215,
        default: 216,
        comfortable: 264,
      });
    },

    e2eDensity_db9abac9c8() {
      return pickByDensity({
        compact: 217,
        default: 217,
        comfortable: 215,
      });
    },

    e2eDensity_2d086a6135() {
      return pickByDensity({
        compact: 222,
        default: 246,
        comfortable: 313,
      });
    },

    e2eDensity_9d03a9eba0() {
      return pickByDensity({
        compact: 243,
        default: 241,
        comfortable: 241,
      });
    },

    e2eDensity_0308b1f949() {
      return pickByDensity({
        compact: 246,
        default: 268,
        comfortable: 276,
      });
    },

    e2eDensity_a57d724d44() {
      return pickByDensity({
        compact: 26,
        default: 49,
        comfortable: 57,
      });
    },

    e2eDensity_f2d3fe1fc0() {
      return pickByDensity({
        compact: 27 + (4 * 26),
        default: 30 + (4 * 29),
        comfortable: 38 + (4 * 37),
      });
    },

    e2eDensity_9d8bccd1c7() {
      return pickByDensity({
        compact: 30,
        default: 34,
        comfortable: 42,
      });
    },

    e2eDensity_315eed5b06() {
      return pickByDensity({
        compact: 31,
        default: 35,
        comfortable: 43,
      });
    },

    e2eDensity_9ece902862() {
      return pickByDensity({
        compact: 35,
        default: 35,
        comfortable: 36,
      });
    },

    e2eDensity_a4793c32d9() {
      return pickByDensity({
        compact: 367,
        default: 356,
        comfortable: 352,
      });
    },

    e2eDensity_129ed1d57c() {
      return pickByDensity({
        compact: 38,
        default: 43,
        comfortable: 51,
      });
    },

    e2eDensity_ed183d57c9() {
      return pickByDensity({
        compact: 47,
        default: 49,
        comfortable: 57,
      });
    },

    e2eDensity_682da48dd2() {
      return pickByDensity({
        compact: 48,
        default: 50,
        comfortable: 58,
      });
    },

    e2eDensity_d35d5683ec() {
      return pickByDensity({
        compact: 50,
        default: 50,
        comfortable: 51,
      });
    },

    e2eDensity_429cac7b61() {
      return pickByDensity({
        compact: 50,
        default: 50,
        comfortable: 52,
      });
    },

    e2eDensity_a2f2c0beda() {
      return pickByDensity({
        compact: 50,
        default: 50,
        comfortable: 85,
      });
    },

    /* Two default data rows (outer height), e.g. merge backlight / manual row move indicator. */
    e2eDensity_f464e90e18() {
      return 2 * defaultDataRowHeight;
    },

    /* Two default data rows plus 1px (border seam), e.g. adjacent merged pair outer height. */
    e2eDensity_9639197594() {
      return (2 * defaultDataRowHeight) + cellBorderWidth;
    },

    e2eDensity_7c3646ff31() {
      return pickByDensity({
        compact: 53,
        default: 60,
        comfortable: 68,
      });
    },

    e2eDensity_e145a29131() {
      return pickByDensity({
        compact: 57,
        default: 61,
        comfortable: 69,
      });
    },

    e2eDensity_cefdabf33b() {
      return pickByDensity({
        compact: 61,
        default: 68,
        comfortable: 76,
      });
    },

    e2eDensity_c1a868f9c9() {
      return pickByDensity({
        compact: 68,
        default: 69,
        comfortable: 77,
      });
    },

    e2eDensity_73e2af5849() {
      return pickByDensity({
        compact: 68,
        default: 89,
        comfortable: 97,
      });
    },

    e2eDensity_9efbb642b5() {
      return pickByDensity({
        compact: 70,
        default: 71,
        comfortable: 79,
      });
    },

    e2eDensity_a24230f0bc() {
      return pickByDensity({
        compact: 74,
        default: 79,
        comfortable: 95,
      });
    },

    e2eDensity_a738aa613c() {
      return pickByDensity({
        compact: 75,
        default: 84,
        comfortable: 92,
      });
    },

    e2eDensity_10071d8a47() {
      return pickByDensity({
        compact: 77,
        default: 81,
        comfortable: 89,
      });
    },

    e2eDensity_f0a5ff56db() {
      return pickByDensity({
        compact: 78,
        default: 87,
        comfortable: 111,
      });
    },

    /* MergeCells: outer height for a 3-row merged cell / matching top overlay (first row +1px compensation). */
    e2eDensity_9a971c3cfe() {
      return overlayHeight({ rows: 3 });
    },

    e2eDensity_ff544a9b2b() {
      return pickByDensity({
        compact: 86,
        default: 93,
        comfortable: 101,
      });
    },

    e2eDensity_25c4d95d1f() {
      return pickByDensity({
        compact: 87,
        default: 91,
        comfortable: 99,
      });
    },

    e2eDensity_9b92431d49() {
      return pickByDensity({
        compact: 88,
        default: 88,
        comfortable: 96,
      });
    },

    e2eDensity_5bbc262bb3() {
      return pickByDensity({
        compact: 90,
        default: 99,
        comfortable: 107,
      });
    },

    e2eDensity_0077155d83() {
      return pickByDensity({
        compact: 984,
        default: 1135,
        comfortable: 1543,
      });
    },

    e2eDensity_066cd3067e() {
      return pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 1 of 45',
          '|< < Page 1 of 4 [>] [>|]',
        ],
        default: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 1 of 45',
          '|< < Page 1 of 5 [>] [>|]',
        ],
        comfortable: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 1 of 45',
          '|< < Page 1 of 6 [>] [>|]',
        ],
      });
    },

    e2eDensity_14926c8296() {
      return pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 13 of 100',
          '|< < Page 1 of 8 [>] [>|]',
        ],
        default: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 11 of 100',
          '|< < Page 1 of 10 [>] [>|]',
        ],
        comfortable: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 9 of 100',
          '|< < Page 1 of 12 [>] [>|]',
        ],
      });
    },

    e2eDensity_55a74b203e() {
      return pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 21 of 100',
          '|< < Page 1 of 5 [>] [>|]',
        ],
        default: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 18 of 100',
          '|< < Page 1 of 6 [>] [>|]',
        ],
        comfortable: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 14 of 100',
          '|< < Page 1 of 8 [>] [>|]',
        ],
      });
    },

    e2eDensity_72a0e755a3() {
      return pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 25 of 100',
          '|< < Page 1 of 4 [>] [>|]',
        ],
        default: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 22 of 100',
          '|< < Page 1 of 5 [>] [>|]',
        ],
        comfortable: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 17 of 100',
          '|< < Page 1 of 6 [>] [>|]',
        ],
      });
    },

    e2eDensity_974019229c() {
      return pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 5 of 100',
          '|< < Page 1 of 20 [>] [>|]',
        ],
        default: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 4 of 100',
          '|< < Page 1 of 25 [>] [>|]',
        ],
        comfortable: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 3 of 100',
          '|< < Page 1 of 34 [>] [>|]',
        ],
      });
    },

    e2eDensity_51b5ff37ca() {
      return pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '2 - 8 of 45',
          '[|<] [<] Page 2 of 4 [>] [>|]',
        ],
        default: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '2 - 7 of 45',
          '[|<] [<] Page 2 of 5 [>] [>|]',
        ],
        comfortable: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '2 - 5 of 45',
          '[|<] [<] Page 2 of 6 [>] [>|]',
        ],
      });
    },

    e2eDensity_be99672953() {
      return pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '9 - 19 of 45',
          '[|<] [<] Page 3 of 5 [>] [>|]',
        ],
        default: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '8 - 18 of 45',
          '[|<] [<] Page 3 of 5 [>] [>|]',
        ],
        comfortable: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '6 - 6 of 45',
          '[|<] [<] Page 3 of 7 [>] [>|]',
        ],
      });
    },

    e2eDensity_eca9596399() {
      return pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '9 - 27 of 45',
          '[|<] [<] Page 3 of 4 [>] [>|]',
        ],
        default: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '8 - 23 of 45',
          '[|<] [<] Page 3 of 5 [>] [>|]',
        ],
        comfortable: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '6 - 7 of 45',
          '[|<] [<] Page 3 of 6 [>] [>|]',
        ],
      });
    },

    /*
     * getEditedCellRect E2E expected partials (`e2eGcr_*`). Some branches omit `maxWidth` / `maxHeight`
     * where values are wrong under RTL or pending fix (GitHub #9206). Assertions use
     * `jasmine.objectContaining` in `expectGetEditedCellRectFromPartial` so extra rect fields are allowed.
     * Helpers that need document scroll or layout viewport height take `docViewport` from
     * `getE2eDocumentViewport()` in the spec (no `document.documentElement` reads here).
     *
     * Common pieces: `gcrEditedCellOuterHeight` (= `cellContentHeight + 2 * cellBorderWidth`),
     * `gcrTwoDataRowsPairOuterHeight` (same as `e2eDensity_9639197594`, 53 / 59 / 75),
     * `gcrTwoAdjacentDataRowsOuterHeight` (54 / 60 / 76 for stacked row snaps),
     * `gcrTwoDataRowsPairClipMaxHeight` (pair + 15px slack, TODO PRO-858 for the +15),
     * master column client width `defaultColumnWidth + (comfortable ? 1 : 0)`,
     * data column outer width `defaultColumnWidth + cellBorderWidth + (comfortable ? 1 : 0)`.
     */
    e2eGcr_9fd0838eca() {
      return {
        start: 0,
        top: 0,
        width: defaultColumnWidth + (isDensity('comfortable') ? 1 : 0),
        maxWidth: 285,
        height: gcrEditedCellOuterHeight,
        maxHeight: 185,
      };
    },

    e2eGcr_0c1f70547f(maxWidth, maxHeight) {
      return {
        start: 0,
        top: 0,
        width: pickByDensity({
          compact: defaultColumnWidth,
          default: defaultColumnWidth + cellBorderWidth,
          // TODO(PRO-858): comfortable width 59; derive from column / overlay metrics.
          comfortable: 59,
        }),
        maxWidth,
        height: gcrEditedCellOuterHeight,
        maxHeight,
      };
    },

    e2eGcr_654f08c592() {
      const colOuter = defaultColumnWidth + cellBorderWidth;

      return {
        start: 234,
        top: defaultDataRowHeight,
        width: colOuter,
        maxWidth: colOuter,
        height: gcrEditedCellOuterHeight,
        maxHeight: pickByDensity({
          compact: 159,
          default: 156,
          comfortable: 148,
        }),
      };
    },

    // TODO(PRO-858): First-cell outer widths 55 / 62 / 70 are not yet expressed with column/row-header tokens.
    e2eGcr_394b62538f(maxWidth, maxHeight, docViewport) {
      const { scrollLeft, offsetHeight } = docViewport;

      return pickByDensity({
        compact: {
          start: scrollLeft + maxWidth - 55, // 55 - the width of the first cell
          top: offsetHeight - maxHeight + defaultDataRowHeight,
          width: 55,
          maxWidth: 55,
          height: gcrEditedCellOuterHeight,
          maxHeight: maxHeight - defaultDataRowHeight,
        },
        default: {
          start: scrollLeft + maxWidth - 62,
          top: offsetHeight - maxHeight + defaultDataRowHeight,
          width: 62,
          maxWidth: 62,
          height: gcrEditedCellOuterHeight,
          maxHeight: maxHeight - defaultDataRowHeight,
        },
        comfortable: {
          start: scrollLeft + maxWidth - 70,
          top: offsetHeight - maxHeight + defaultDataRowHeight,
          width: 70,
          maxWidth: 70,
          height: gcrEditedCellOuterHeight,
          maxHeight: maxHeight - defaultDataRowHeight,
        },
      });
    },

    e2eGcr_1812746652() {
      const dataColOuter = defaultColumnWidth + cellBorderWidth + (isDensity('comfortable') ? 1 : 0);

      return {
        start: isDensity('comfortable') ? defaultRowHeaderWidth : defaultRowHeaderWidth - cellBorderWidth,
        top: defaultDataRowHeight,
        width: dataColOuter,
        maxWidth: isDensity('comfortable') ? 235 : 236,
        height: gcrEditedCellOuterHeight,
        maxHeight: pickByDensity({
          compact: 159,
          default: 156,
          comfortable: 148,
        }),
      };
    },

    e2eGcr_59a39f83a8(maxWidth, maxHeight, docViewport) {
      const { scrollLeft, offsetHeight } = docViewport;

      return pickByDensity({
        compact: {
          start: scrollLeft + 49, // 49 - the width of the first cell
          top: offsetHeight - maxHeight + defaultDataRowHeight,
          width: 51,
          maxWidth: maxWidth - 49,
          height: gcrEditedCellOuterHeight,
          maxHeight: maxHeight - defaultDataRowHeight,
        },
        default: {
          start: scrollLeft + 50,
          top: offsetHeight - maxHeight + defaultDataRowHeight,
          width: 52,
          maxWidth: maxWidth - 50,
          height: gcrEditedCellOuterHeight,
          maxHeight: maxHeight - defaultDataRowHeight,
        },
        comfortable: {
          start: scrollLeft + 58,
          top: offsetHeight - maxHeight + defaultDataRowHeight,
          width: 60,
          maxWidth: maxWidth - 58,
          height: gcrEditedCellOuterHeight,
          maxHeight: maxHeight - defaultDataRowHeight,
        },
      });
    },

    e2eGcr_63d4e50227() {
      const colOuter = defaultColumnWidth + cellBorderWidth + (isDensity('comfortable') ? 1 : 0);
      const top = pickByDensity({
        compact: (6 * defaultDataRowHeight) + (2 * cellBorderWidth),
        // TODO(PRO-858): +10 offset not traced to tokens (expected 5 * defaultDataRowHeight + slack).
        default: (5 * defaultDataRowHeight) + 10,
        comfortable: (4 * defaultDataRowHeight) - cellBorderWidth,
      });
      const start = isDensity('comfortable') ? defaultRowHeaderWidth : defaultRowHeaderWidth - cellBorderWidth;

      return {
        start,
        top,
        width: colOuter,
        maxWidth: isDensity('comfortable') ? 235 : 236,
        height: gcrEditedCellOuterHeight,
        maxHeight: gcrEditedCellOuterHeight,
      };
    },

    e2eGcr_f1418f56a2(maxWidth, docViewport) {
      const { scrollLeft, offsetHeight } = docViewport;
      const colOuter = defaultColumnWidth + cellBorderWidth;
      const colOuterDefault = defaultColumnWidth + (2 * cellBorderWidth);

      return pickByDensity({
        compact: {
          start: scrollLeft + defaultRowHeaderWidth - cellBorderWidth,
          top: offsetHeight - gcrEditedCellOuterHeight,
          width: colOuter,
          maxWidth: maxWidth - (defaultRowHeaderWidth - cellBorderWidth),
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrEditedCellOuterHeight,
        },
        default: {
          start: scrollLeft + defaultRowHeaderWidth,
          top: offsetHeight - gcrEditedCellOuterHeight,
          width: colOuterDefault,
          maxWidth: maxWidth - defaultRowHeaderWidth,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrEditedCellOuterHeight,
        },
        comfortable: {
          // TODO(PRO-858): Comfortable row-header / first-column client width (58 / 60) not mapped to tokens.
          start: scrollLeft + 58,
          top: offsetHeight - gcrEditedCellOuterHeight,
          width: 60,
          maxWidth: maxWidth - 58,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrEditedCellOuterHeight,
        },
      });
    },

    e2eGcr_e9a5ab9a7a() {
      const w = defaultColumnWidth + (isDensity('comfortable') ? 1 : 0);

      // TODO(PRO-858): Tops 132 / 126 / 110 are fixture-specific; tie to row/header stack if possible.
      return pickByDensity({
        compact: {
          start: 0,
          top: 132,
          width: w,
          maxWidth: 285,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairOuterHeight,
        },
        default: {
          start: 0,
          top: 126,
          width: w,
          maxWidth: 285,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairOuterHeight,
        },
        comfortable: {
          start: 0,
          top: 110,
          width: w,
          maxWidth: 285,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairOuterHeight,
        },
      });
    },

    e2eGcr_4ef37f8511(maxWidth, maxHeight) {
      return pickByDensity({
        compact: {
          start: 0,
          top: maxHeight - gcrTwoDataRowsPairOuterHeight,
          width: 50,
          maxWidth,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairClipMaxHeight,
        },
        default: {
          start: 0,
          top: maxHeight - gcrTwoDataRowsPairOuterHeight,
          width: 51,
          maxWidth,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairClipMaxHeight,
        },
        comfortable: {
          start: 0,
          top: maxHeight - gcrTwoDataRowsPairOuterHeight,
          width: 59, // TODO(PRO-858): 59 vs defaultColumnWidth + 9; map to row-header / padding tokens.
          maxWidth,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairClipMaxHeight,
        },
      });
    },

    e2eGcr_5ac91379aa(maxWidth, docViewport) {
      const { scrollLeft, offsetHeight } = docViewport;

      return pickByDensity({
        compact: {
          start: scrollLeft,
          top: offsetHeight - gcrTwoAdjacentDataRowsOuterHeight,
          width: 50,
          maxWidth,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairClipMaxHeight,
        },
        default: {
          start: scrollLeft,
          top: offsetHeight - gcrTwoAdjacentDataRowsOuterHeight,
          width: 51,
          maxWidth,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairClipMaxHeight,
        },
        comfortable: {
          start: scrollLeft,
          top: offsetHeight - gcrTwoAdjacentDataRowsOuterHeight,
          width: 59, // TODO(PRO-858): comfortable first data column width; see e2eGcr_4ef37f8511.
          maxWidth,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairClipMaxHeight,
        },
      });
    },

    e2eGcr_660b0bbbb1() {
      const w = defaultColumnWidth + (isDensity('comfortable') ? 1 : 0);

      // TODO(PRO-858): Tops 132 / 126 / 110 are fixture-specific; tie to row/header stack if possible.
      return pickByDensity({
        compact: {
          start: 0,
          top: 132,
          width: w, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
          maxWidth: 285,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairOuterHeight,
        },
        default: {
          start: 0,
          top: 126,
          width: w, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
          maxWidth: 285,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairOuterHeight,
        },
        comfortable: {
          start: 0,
          top: 110,
          width: w, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
          maxWidth: 285,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairOuterHeight,
        },
      });
    },

    e2eGcr_578ee2338a(maxWidth, maxHeight) {
      return pickByDensity({
        compact: {
          start: 0,
          top: maxHeight - gcrTwoDataRowsPairOuterHeight,
          width: 50,
          maxWidth,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairClipMaxHeight,
        },
        default: {
          start: 0,
          top: maxHeight - gcrTwoDataRowsPairOuterHeight,
          width: 51,
          maxWidth,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairClipMaxHeight,
        },
        comfortable: {
          start: 0,
          top: maxHeight - gcrTwoDataRowsPairOuterHeight,
          width: 59, // TODO(PRO-858): comfortable first data column width; see e2eGcr_4ef37f8511.
          maxWidth,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrTwoDataRowsPairClipMaxHeight,
        },
      });
    },

    e2eGcr_be63e8af58() {
      const colOuter = defaultColumnWidth + cellBorderWidth;
      const top = pickByDensity({
        compact: (6 * defaultDataRowHeight) + (2 * cellBorderWidth),
        // TODO(PRO-858): +10 offset not traced to tokens (expected 5 * defaultDataRowHeight + slack).
        default: (5 * defaultDataRowHeight) + 10,
        comfortable: (4 * defaultDataRowHeight) - cellBorderWidth,
      });

      return {
        start: 234,
        top,
        width: colOuter,
        maxWidth: colOuter,
        height: gcrEditedCellOuterHeight,
        maxHeight: gcrEditedCellOuterHeight,
      };
    },

    // TODO(PRO-858): maxHeight 42 / 45 / 53 not yet mapped to row stack tokens (differs from single-cell outer height).
    e2eGcr_1e686ee3a6(docViewport) {
      const { offsetHeight } = docViewport;
      const topSnapPad = defaultDataRowHeight + (2 * cellBorderWidth);
      const colOuter = defaultColumnWidth + cellBorderWidth;

      return pickByDensity({
        compact: {
          start: 4949,
          top: offsetHeight - topSnapPad,
          width: colOuter,
          maxWidth: colOuter,
          height: gcrEditedCellOuterHeight,
          maxHeight: 42,
        },
        default: {
          start: 4949,
          top: offsetHeight - topSnapPad,
          width: colOuter,
          maxWidth: colOuter,
          height: gcrEditedCellOuterHeight,
          maxHeight: 45,
        },
        comfortable: {
          start: 4949,
          top: offsetHeight - topSnapPad,
          width: colOuter,
          maxWidth: colOuter,
          height: gcrEditedCellOuterHeight,
          maxHeight: 53,
        },
      });
    },

    e2eGcr_8b522d5d5b() {
      const colOuter = defaultColumnWidth + cellBorderWidth;

      return {
        start: 234,
        top: defaultDataRowHeight,
        width: colOuter,
        maxWidth: colOuter,
        height: gcrEditedCellOuterHeight,
      };
    },

    // TODO(PRO-858): Duplicate of 394b62538f first-cell widths 55 / 62 / 70; unify when tokenized.
    e2eGcr_e5142224f2(maxWidth, maxHeight, docViewport) {
      const { scrollLeft, offsetHeight } = docViewport;
      const scrollLeftAbs = Math.abs(scrollLeft);

      return pickByDensity({
        compact: {
          start: scrollLeftAbs + maxWidth - 55, // 55 - the width of the first cell
          top: offsetHeight - maxHeight + defaultDataRowHeight,
          width: 55,
          maxWidth: 55,
          height: gcrEditedCellOuterHeight,
        },
        default: {
          start: scrollLeftAbs + maxWidth - 62,
          top: offsetHeight - maxHeight + defaultDataRowHeight,
          width: 62,
          maxWidth: 62,
          height: gcrEditedCellOuterHeight,
        },
        comfortable: {
          start: scrollLeftAbs + maxWidth - 70, // 51 - the width of the first cell
          top: offsetHeight - maxHeight + defaultDataRowHeight,
          width: 70,
          maxWidth: 70,
          height: gcrEditedCellOuterHeight,
        },
      });
    },

    e2eGcr_d4ea38684b() {
      return {
        start: isDensity('comfortable') ? defaultRowHeaderWidth : defaultRowHeaderWidth - cellBorderWidth,
        top: defaultDataRowHeight,
        width: defaultColumnWidth + cellBorderWidth + (isDensity('comfortable') ? 1 : 0),
        height: gcrEditedCellOuterHeight,
      };
    },

    e2eGcr_065fabb134(maxWidth, maxHeight, docViewport) {
      const { scrollLeft, offsetHeight } = docViewport;
      const scrollLeftAbs = Math.abs(scrollLeft);

      return pickByDensity({
        compact: {
          start: scrollLeftAbs + 49, // 49 - the width of the first cell
          top: offsetHeight - maxHeight + defaultDataRowHeight,
          width: 51,
          height: gcrEditedCellOuterHeight,
        },
        default: {
          start: scrollLeftAbs + 50,
          top: offsetHeight - maxHeight + defaultDataRowHeight,
          width: 52,
          height: gcrEditedCellOuterHeight,
        },
        comfortable: {
          start: scrollLeftAbs + 58,
          top: offsetHeight - maxHeight + defaultDataRowHeight,
          width: 60,
          height: gcrEditedCellOuterHeight,
        },
      });
    },

    e2eGcr_b03e660972() {
      return pickByDensity({
        compact: {
          start: 49,
          top: 158,
          width: 51,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrEditedCellOuterHeight,
        },
        default: {
          start: 49,
          top: 155,
          width: 51,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrEditedCellOuterHeight,
        },
        comfortable: {
          start: 50,
          top: 147,
          width: 52,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrEditedCellOuterHeight,
        },
      });
    },

    e2eGcr_3acc8a5880(docViewport) {
      const { scrollLeft, offsetHeight } = docViewport;
      const scrollLeftAbs = Math.abs(scrollLeft);

      return pickByDensity({
        compact: {
          start: scrollLeftAbs + 49, // 49 - the width of the first cell
          top: offsetHeight - gcrEditedCellOuterHeight,
          width: 51,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrEditedCellOuterHeight,
        },
        default: {
          start: scrollLeftAbs + 50,
          top: offsetHeight - gcrEditedCellOuterHeight,
          width: 52,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrEditedCellOuterHeight,
        },
        comfortable: {
          start: scrollLeftAbs + 58,
          top: offsetHeight - gcrEditedCellOuterHeight,
          width: 60,
          height: gcrEditedCellOuterHeight,
          maxHeight: gcrEditedCellOuterHeight,
        },
      });
    },

    e2eGcr_62100eec40() {
      const w = defaultColumnWidth + (isDensity('comfortable') ? 1 : 0);

      // TODO(PRO-858): Tops 132 / 126 / 110 are fixture-specific; tie to row/header stack if possible.
      return pickByDensity({
        compact: {
          start: 0,
          top: 132,
          width: w,
          maxWidth: 285,
          height: gcrEditedCellOuterHeight,
        },
        default: {
          start: 0,
          top: 126,
          width: w,
          maxWidth: 285,
          height: gcrEditedCellOuterHeight,
        },
        comfortable: {
          start: 0,
          top: 110,
          width: w,
          maxWidth: 285,
          height: gcrEditedCellOuterHeight,
        },
      });
    },

    e2eGcr_a7dd654d16(maxWidth, maxHeight) {
      return pickByDensity({
        compact: {
          start: 0,
          top: maxHeight - gcrTwoDataRowsPairOuterHeight,
          width: 50,
          maxWidth,
          height: gcrEditedCellOuterHeight,
        },
        default: {
          start: 0,
          top: maxHeight - gcrTwoDataRowsPairOuterHeight,
          width: 51,
          maxWidth,
          height: gcrEditedCellOuterHeight,
        },
        comfortable: {
          start: 0,
          top: maxHeight - gcrTwoDataRowsPairOuterHeight,
          width: 59, // TODO(PRO-858): comfortable first data column width; see e2eGcr_4ef37f8511.
          maxWidth,
          height: gcrEditedCellOuterHeight,
        },
      });
    },

    e2eGcr_3866422adb() {
      const w = defaultColumnWidth + (isDensity('comfortable') ? 1 : 0);

      // TODO(PRO-858): Tops 132 / 126 / 110 are fixture-specific; tie to row/header stack if possible.
      return pickByDensity({
        compact: {
          start: 0,
          top: 132,
          width: w,
          height: gcrEditedCellOuterHeight,
        },
        default: {
          start: 0,
          top: 126,
          width: w,
          height: gcrEditedCellOuterHeight,
        },
        comfortable: {
          start: 0,
          top: 110,
          width: w,
          height: gcrEditedCellOuterHeight,
        },
      });
    },

    e2eGcr_901bb6925b(docViewport) {
      const { scrollLeft, offsetHeight } = docViewport;
      const scrollLeftAbs = Math.abs(scrollLeft);

      return pickByDensity({
        compact: {
          start: scrollLeftAbs,
          top: offsetHeight - gcrTwoAdjacentDataRowsOuterHeight,
          width: 50,
          height: gcrEditedCellOuterHeight,
        },
        default: {
          start: scrollLeftAbs,
          top: offsetHeight - gcrTwoAdjacentDataRowsOuterHeight,
          width: 51,
          height: gcrEditedCellOuterHeight,
        },
        comfortable: {
          start: scrollLeftAbs,
          top: offsetHeight - gcrTwoAdjacentDataRowsOuterHeight,
          width: 59, // TODO(PRO-858): comfortable first data column width; see e2eGcr_4ef37f8511.
          height: gcrEditedCellOuterHeight,
        },
      });
    },

    e2eGcr_69029d1636(maxWidth, maxHeight) {
      return pickByDensity({
        compact: {
          start: 0,
          top: maxHeight - gcrTwoDataRowsPairOuterHeight,
          width: 50,
          maxWidth,
          height: gcrEditedCellOuterHeight,
        },
        default: {
          start: 0,
          top: maxHeight - gcrTwoDataRowsPairOuterHeight,
          width: 51,
          maxWidth,
          height: gcrEditedCellOuterHeight,
        },
        comfortable: {
          start: 0,
          top: maxHeight - gcrTwoDataRowsPairOuterHeight,
          width: 59, // TODO(PRO-858): comfortable first data column width; see e2eGcr_4ef37f8511.
          maxWidth,
          height: gcrEditedCellOuterHeight,
        },
      });
    },

    e2eGcr_230de5a9f7() {
      const colOuter = defaultColumnWidth + cellBorderWidth;
      const top = pickByDensity({
        compact: (6 * defaultDataRowHeight) + (2 * cellBorderWidth),
        // TODO(PRO-858): +10 offset not traced to tokens (expected 5 * defaultDataRowHeight + slack).
        default: (5 * defaultDataRowHeight) + 10,
        comfortable: (4 * defaultDataRowHeight) - cellBorderWidth,
      });

      return {
        start: 234,
        top,
        width: colOuter,
        maxWidth: colOuter,
        height: gcrEditedCellOuterHeight,
      };
    },

    e2eGcr_3dc880f3f2(docViewport) {
      const { offsetHeight } = docViewport;
      const topSnapPad = defaultDataRowHeight + (2 * cellBorderWidth);
      const colOuter = defaultColumnWidth + cellBorderWidth;

      return {
        start: 4949,
        top: offsetHeight - topSnapPad,
        width: colOuter,
        maxWidth: colOuter,
        height: gcrEditedCellOuterHeight,
      };
    },

    e2eDensity_fe455d5781() {
      return pickByDensity({
        compact: defaultColumnWidth,
        default: defaultColumnWidth,
        comfortable: defaultColumnWidth + 1,
      });
    },

    e2eDensity_8b9c83b3f3() {
      return pickByDensity({
        compact: defaultColumnWidth,
        default: defaultColumnWidth,
        comfortable: defaultColumnWidth + 2,
      });
    },
  };
}
