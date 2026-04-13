import sizing from '../../src/themes/static/variables/sizing';
import density from '../../src/themes/static/variables/density';
import classicTokens from '../../src/themes/static/variables/tokens/classic';
import mainTokens from '../../src/themes/static/variables/tokens/main';
import horizonTokens from '../../src/themes/static/variables/tokens/horizon';

/**
 * Maps theme name to its density level (from src/themes/theme/*.js).
 */
const THEME_DENSITY = {
  classic: 'compact',
  main: 'default',
  horizon: 'comfortable',
};

/**
 * Maps theme name to its token module.
 */
const THEME_TOKENS = {
  classic: classicTokens,
  main: mainTokens,
  horizon: horizonTokens,
};

/**
 * Walkontable's default column width (from src/3rdparty/walkontable/src/settings.js:194).
 * Not exposed as a theme token -- it is a rendering engine constant.
 */
const WALKONTABLE_DEFAULT_COLUMN_WIDTH = 50;

/**
 * Parse a pixel string (e.g. '14px') to a number.
 *
 * @param {string} value CSS pixel string.
 * @returns {number} Numeric pixel value.
 */
function parsePx(value) {
  return parseInt(value, 10);
}

/**
 * Resolve a density reference string (e.g. 'sizing.size_1') to its pixel value.
 *
 * @param {string} ref Reference string in the form 'sizing.<key>'.
 * @returns {number} Resolved pixel value.
 */
function resolveSizingRef(ref) {
  const key = ref.replace('sizing.', '');

  return parsePx(sizing[key]);
}

/**
 * Compute layout metrics for a given theme by resolving the same static token,
 * sizing and density modules that production themes use.
 *
 * All returned values are **numbers in pixels**.
 *
 * Box model note: `defaultDataRowHeight` and `firstRenderedRowDefaultHeight` represent the
 * **outer height** as measured by jQuery `.height()` (which returns `offsetHeight` for table
 * rows). `defaultColumnHeaderHeight` and `cellContentHeight` represent the **content height**
 * (equivalent to `clientHeight` on a TD, excluding the 1px bottom border).
 *
 * @param {string} themeName Theme key registered in THEME_TOKENS and THEME_DENSITY below.
 *   Add new themes there plus a token module; E2E specs use `getThemeLayout()` only.
 * @returns {object} Layout metrics object.
 */
export function themeLayoutFromTokens(themeName) {
  const resolvedName = themeName || 'main';
  const tokens = THEME_TOKENS[resolvedName];

  if (!tokens) {
    throw new Error(
      `themeLayoutFromTokens: unknown theme "${themeName}". ` +
      `Supported: ${Object.keys(THEME_TOKENS).join(', ')}`
    );
  }

  const densityLevel = THEME_DENSITY[resolvedName];
  const densityConfig = density[densityLevel];

  // Core metrics
  const lineHeight = parsePx(tokens.lineHeight);
  const cellVerticalPadding = resolveSizingRef(densityConfig.cellVertical);
  const cellHorizontalPadding = resolveSizingRef(densityConfig.cellHorizontal);
  const cellBorderWidth = parsePx(sizing.size_0_25); // 1px

  // Cell content height = lineHeight + top padding + bottom padding.
  // This equals clientHeight on a TD element (border excluded).
  const cellContentHeight = lineHeight + (2 * cellVerticalPadding);

  // Row outer height includes the 1px bottom border.
  const defaultDataRowHeight = cellContentHeight + cellBorderWidth;

  // Column header content height -- same as cellContentHeight.
  // Matches getDefaultColumnHeaderHeight() in common.js.
  const defaultColumnHeaderHeight = cellContentHeight;

  // First rendered row in a clone gets +1px for border compensation at the top edge.
  const firstRenderedRowDefaultHeight = defaultDataRowHeight + cellBorderWidth;

  // Column width is constant across all themes.
  const defaultColumnWidth = WALKONTABLE_DEFAULT_COLUMN_WIDTH;

  // Same as Walkontable's default row-header `<col>` width (50px) for every theme. E2E specs use
  // `getDefaultRowHeaderWidth() + N * colWidth + …` to size the container; using 50 everywhere
  // keeps the master viewport width identical across themes so horizontal overlay scroll snaps
  // (e.g. focusSelection) do not drift by 1px.
  const isCompactDensity = densityLevel === 'compact';
  const defaultRowHeaderWidth = WALKONTABLE_DEFAULT_COLUMN_WIDTH;

  /**
   * @param {'compact'|'default'|'comfortable'} level Density bucket to compare.
   * @returns {boolean}
   */
  const isDensity = level => densityLevel === level;

  return {
    // --- Primitives ---
    lineHeight,
    cellVerticalPadding,
    cellHorizontalPadding,
    cellBorderWidth,
    cellContentHeight,

    // --- Dimensions used by getDefault* helpers ---
    defaultDataRowHeight,
    defaultColumnHeaderHeight,
    firstRenderedRowDefaultHeight,
    defaultColumnWidth,
    defaultRowHeaderWidth,

    /**
     * Calculate overlay height for a section with the given row counts.
     * The first rendered row in any overlay section gets +1px border compensation.
     *
     * @param {object} options Options.
     * @param {number} [options.rows=0] Total rows (headers + data) in the overlay.
     * @param {boolean} [options.includeFirstRowCompensation=true] Whether the first row gets +1px.
     * @returns {number} Height in pixels.
     */
    overlayHeight({ rows = 0, includeFirstRowCompensation = true } = {}) {
      if (rows === 0) {
        return 0;
      }

      if (includeFirstRowCompensation) {
        return firstRenderedRowDefaultHeight + ((rows - 1) * defaultDataRowHeight);
      }

      return rows * defaultDataRowHeight;
    },

    /**
     * Calculate vertical scroll position for a given row at the top snap.
     *
     * @param {number} rowIndex Zero-based row index.
     * @returns {number} Scroll position in pixels.
     */
    verticalScrollForRow(rowIndex) {
      return rowIndex * defaultDataRowHeight;
    },

    /**
     * Density preset for this theme (from THEME_DENSITY). New themes pick a density; E2E helpers
     * branch on density, not on theme name, so specs stay unchanged when adding a theme.
     *
     * @returns {'compact'|'default'|'comfortable'}
     */
    densityLevel,

    /**
     * Pick a theme-dependent expectation by density bucket (classic → compact, main → default,
     * horizon → comfortable) when values differ by density but do not need a dedicated `e2e*()`
     * helper.
     *
     * @template T
     * @param {{ compact: T, defaultDensity: T, comfortable: T }} values Expectations per density.
     * @returns {T}
     */
    pickByDensity(values) {
      if (isDensity('compact')) {
        return values.compact;
      }

      if (isDensity('default')) {
        return values.defaultDensity;
      }

      return values.comfortable;
    },

    /**
     * Vertical scroll position after row-header selection from last row to first with prior
     * scroll of six default rows (rowHeaderSelection E2E).
     *
     * @returns {number}
     */
    e2eRowHeaderSelectionScrollTopAfterSelectLastToFirst() {
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
      const scrollAfterRectangularRowPair = this.e2eViewportScrollAfterRectangularAdjacentDataRows(
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

    /**
     * `topOverlay().getScrollPosition()` after rectangular API selection `[[11, 0, 10, 0]]` with
     * prior vertical scroll (multipleSelection E2E partial bottom edge). Same base scroll as
     * {@link e2eNoncontiguousBottomEdgeScrollTop} before the non-contiguous stride subtraction.
     *
     * @param {number} initialScroll Prior vertical scroll offset.
     * @returns {number}
     */
    e2eViewportScrollAfterRectangularAdjacentDataRows(initialScroll) {
      if (isDensity('compact')) {
        return initialScroll + (2 * cellContentHeight);
      }

      if (isDensity('default')) {
        return initialScroll + (3 * defaultDataRowHeight) + (2 * cellBorderWidth);
      }

      return initialScroll + (5 * defaultDataRowHeight) + cellVerticalPadding;
    },

    /**
     * `topOverlay().getScrollPosition()` after `scrollViewportTo({ row: 10, col: 10 })` with
     * pagination enabled (pagination E2E page change).
     *
     * @returns {number}
     */
    e2ePaginationScrollTopAfterScrollViewportToRow10Col10() {
      return this.pickByDensity({
        compact: 101,
        defaultDensity: 134,
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
      return this.pickByDensity({
        compact: 65,
        defaultDensity: 65,
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
      return this.pickByDensity({
        compact: 79,
        defaultDensity: 79,
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
      return this.pickByDensity({
        compact: { top: 73, left: 0 },
        defaultDensity: { top: 82, left: 0 },
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
      return this.pickByDensity({
        compact: 90,
        defaultDensity: 90,
        comfortable: 85,
      });
    },

    e2eStretchColumnsAlter320InsertStartVisible() {
      return this.pickByDensity({
        compact: 68,
        defaultDensity: 68,
        comfortable: 64,
      });
    },

    e2eStretchColumnsAlter320InsertStartTrailing() {
      return this.pickByDensity({
        compact: 66,
        defaultDensity: 66,
        comfortable: 63,
      });
    },

    e2eStretchColumnsAlter320SixColsStretched() {
      return this.pickByDensity({
        compact: 54,
        defaultDensity: 54,
        comfortable: 51,
      });
    },

    e2eStretchColumnsWidth200StretchAllFirstTwo() {
      return this.pickByDensity({
        compact: 67,
        defaultDensity: 67,
        comfortable: 62,
      });
    },

    e2eStretchColumnsWidth200StretchAllLast() {
      return this.pickByDensity({
        compact: 66,
        defaultDensity: 66,
        comfortable: 61,
      });
    },

    e2eStretchColumnsWidth200StretchLast() {
      return this.pickByDensity({
        compact: 100,
        defaultDensity: 100,
        comfortable: 85,
      });
    },

    e2eStretchColumnsWidth500ThreeCols() {
      return this.pickByDensity({
        compact: 150,
        defaultDensity: 150,
        comfortable: 145,
      });
    },

    e2eStretchColumnsMultilineWidth500Col0() {
      return this.pickByDensity({
        compact: 412,
        defaultDensity: 418,
        comfortable: 420,
      });
    },

    e2eStretchColumnsMultilineWidth500Col1() {
      return this.pickByDensity({
        compact: 88,
        defaultDensity: 82,
        comfortable: 80,
      });
    },

    e2eStretchColumnsLongTextWidth400Col4() {
      return this.pickByDensity({
        compact: 286,
        defaultDensity: 311,
        comfortable: 319,
      });
    },

    // --- Nested headers keyboard navigation / selection E2E ---

    e2eNestedHeadersSelectionInlineScroll50() {
      return this.pickByDensity({
        compact: 50,
        defaultDensity: 50,
        comfortable: 51,
      });
    },

    e2eNestedHeadersSelectionInlineScroll265() {
      return this.pickByDensity({
        compact: 265,
        defaultDensity: 265,
        comfortable: 278,
      });
    },

    e2eNestedHeadersSelectionInlineScroll65() {
      return this.pickByDensity({
        compact: 65,
        defaultDensity: 65,
        comfortable: 72,
      });
    },

    e2eNestedHeadersSelectionInlineScroll250() {
      return this.pickByDensity({
        compact: 250,
        defaultDensity: 250,
        comfortable: 257,
      });
    },

    e2eNestedHeadersNavInlineScrollAfterD() {
      return this.pickByDensity({
        compact: 66,
        defaultDensity: 66,
        comfortable: 74,
      });
    },

    e2eNestedHeadersNavInlineScrollAfterE() {
      return this.pickByDensity({
        compact: 266,
        defaultDensity: 266,
        comfortable: 279,
      });
    },

    e2eNestedHeadersNavInlineScrollAfterF() {
      return this.pickByDensity({
        compact: 516,
        defaultDensity: 516,
        comfortable: 539,
      });
    },

    e2eNestedHeadersNavInlineScrollAfterG() {
      return this.pickByDensity({
        compact: 866,
        defaultDensity: 866,
        comfortable: 900,
      });
    },

    e2eNestedHeadersNavInlineScrollAfterH() {
      return this.pickByDensity({
        compact: 1266,
        defaultDensity: 1280,
        comfortable: 1354,
      });
    },

    e2eNestedHeadersNavInlineScrollAfterI() {
      return this.pickByDensity({
        compact: 1316,
        defaultDensity: 1333,
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
      return this.pickByDensity({
        compact: 27,
        defaultDensity: 36,
        comfortable: 44,
      });
    },

    // --- Manual column resize E2E (literals from manualColumnResize.spec.js) ---

    e2eManualColumnResizeResizerPositionTopCloneLeft194() {
      return this.pickByDensity({
        compact: { top: 0, left: 194 },
        defaultDensity: { top: 0, left: 194 },
        comfortable: { top: 0, left: 198 },
      });
    },

    e2eManualColumnResizeResizerPositionTopCloneLeft94() {
      return this.pickByDensity({
        compact: { top: 0, left: 94 },
        defaultDensity: { top: 0, left: 94 },
        comfortable: { top: 0, left: 95 },
      });
    },

    e2eManualColumnResizeWidth155155156() {
      return this.pickByDensity({
        compact: 155,
        defaultDensity: 155,
        comfortable: 156,
      });
    },

    e2eManualColumnResizeWidth222735() {
      return this.pickByDensity({
        compact: 22,
        defaultDensity: 27,
        comfortable: 35,
      });
    },

    e2eManualColumnResizeWidth220218216() {
      return this.pickByDensity({
        compact: 220,
        defaultDensity: 218,
        comfortable: 216,
      });
    },

    e2eManualColumnResizeWidth220219217() {
      return this.pickByDensity({
        compact: 220,
        defaultDensity: 219,
        comfortable: 217,
      });
    },

    e2eManualColumnResizeWidth221220218() {
      return this.pickByDensity({
        compact: 221,
        defaultDensity: 220,
        comfortable: 218,
      });
    },

    e2eManualColumnResizeWidth293543() {
      return this.pickByDensity({
        compact: 29,
        defaultDensity: 35,
        comfortable: 43,
      });
    },

    e2eManualColumnResizeWidth293544() {
      return this.pickByDensity({
        compact: 29,
        defaultDensity: 35,
        comfortable: 44,
      });
    },

    e2eManualColumnResizeWidth303644() {
      return this.pickByDensity({
        compact: 30,
        defaultDensity: 36,
        comfortable: 44,
      });
    },

    e2eManualColumnResizeWidth313644() {
      return this.pickByDensity({
        compact: 31,
        defaultDensity: 36,
        comfortable: 44,
      });
    },

    e2eManualColumnResizeWidth343435() {
      return this.pickByDensity({
        compact: 34,
        defaultDensity: 34,
        comfortable: 35,
      });
    },

    e2eManualColumnResizeWidth505051() {
      return this.pickByDensity({
        compact: 50,
        defaultDensity: 50,
        comfortable: 51,
      });
    },

    e2eManualColumnResizeWidth505052() {
      return this.pickByDensity({
        compact: 50,
        defaultDensity: 50,
        comfortable: 52,
      });
    },

    e2eManualColumnResizeWidth505053() {
      return this.pickByDensity({
        compact: 50,
        defaultDensity: 50,
        comfortable: 53,
      });
    },

    e2eManualColumnResizeWidth736730723() {
      return this.pickByDensity({
        compact: 736,
        defaultDensity: 730,
        comfortable: 723,
      });
    },

    e2eManualColumnResizeWidth788795() {
      return this.pickByDensity({
        compact: 78,
        defaultDensity: 87,
        comfortable: 95,
      });
    },

    e2eManualColumnResizeWidth797981() {
      return this.pickByDensity({
        compact: 79,
        defaultDensity: 79,
        comfortable: 81,
      });
    },

    e2eManualColumnResizeWidth808081() {
      return this.pickByDensity({
        compact: 80,
        defaultDensity: 80,
        comfortable: 81,
      });
    },

    e2eManualColumnResizeWidth808082() {
      return this.pickByDensity({
        compact: 80,
        defaultDensity: 80,
        comfortable: 82,
      });
    },

    /**
     * `outerWidth()` of stretched column headers in RTL manual column resize E2E.
     *
     * @returns {number}
     */
    e2eManualColumnResizeRtlStretchedHeaderOuterWidth() {
      return this.pickByDensity({
        compact: 196,
        defaultDensity: 196,
        comfortable: 198,
      });
    },

    // --- Auto column size E2E (from autoColumnSize.spec.js) ---

    e2eAutoColumnSize_104_115_123() {
      return this.pickByDensity({
        compact: 104,
        defaultDensity: 115,
        comfortable: 123,
      });
    },

    e2eAutoColumnSize_123_135_143() {
      return this.pickByDensity({
        compact: 123,
        defaultDensity: 135,
        comfortable: 143,
      });
    },

    e2eAutoColumnSize_127_139_147() {
      return this.pickByDensity({
        compact: 127,
        defaultDensity: 139,
        comfortable: 147,
      });
    },

    e2eAutoColumnSize_129_138_146() {
      return this.pickByDensity({
        compact: 129,
        defaultDensity: 138,
        comfortable: 146,
      });
    },

    e2eAutoColumnSize_133_146_154() {
      return this.pickByDensity({
        compact: 133,
        defaultDensity: 146,
        comfortable: 154,
      });
    },

    e2eAutoColumnSize_133_151_161() {
      return this.pickByDensity({
        compact: 133,
        defaultDensity: 151,
        comfortable: 161,
      });
    },

    e2eAutoColumnSize_143_157_165() {
      return this.pickByDensity({
        compact: 143,
        defaultDensity: 157,
        comfortable: 165,
      });
    },

    e2eAutoColumnSize_155_170_178() {
      return this.pickByDensity({
        compact: 155,
        defaultDensity: 170,
        comfortable: 178,
      });
    },

    e2eAutoColumnSize_162_177_185() {
      return this.pickByDensity({
        compact: 162,
        defaultDensity: 177,
        comfortable: 185,
      });
    },

    e2eAutoColumnSize_192_210_218() {
      return this.pickByDensity({
        compact: 192,
        defaultDensity: 210,
        comfortable: 218,
      });
    },

    e2eAutoColumnSize_198_216_224() {
      return this.pickByDensity({
        compact: 198,
        defaultDensity: 216,
        comfortable: 224,
      });
    },

    e2eAutoColumnSize_207_225_233() {
      return this.pickByDensity({
        compact: 207,
        defaultDensity: 225,
        comfortable: 233,
      });
    },

    e2eAutoColumnSize_2235_2322_2575() {
      return this.pickByDensity({
        compact: 2235,
        defaultDensity: 2322,
        comfortable: 2575,
      });
    },

    e2eAutoColumnSize_50_50_58() {
      return this.pickByDensity({
        compact: 50,
        defaultDensity: 50,
        comfortable: 58,
      });
    },

    e2eAutoColumnSize_50_52_60() {
      return this.pickByDensity({
        compact: 50,
        defaultDensity: 52,
        comfortable: 60,
      });
    },

    e2eAutoColumnSize_55_62_70() {
      return this.pickByDensity({
        compact: 55,
        defaultDensity: 62,
        comfortable: 70,
      });
    },

    e2eAutoColumnSize_58_65_73() {
      return this.pickByDensity({
        compact: 58,
        defaultDensity: 65,
        comfortable: 73,
      });
    },

    e2eAutoColumnSize_64_72_80() {
      return this.pickByDensity({
        compact: 64,
        defaultDensity: 72,
        comfortable: 80,
      });
    },

    e2eAutoColumnSize_65_67_75() {
      return this.pickByDensity({
        compact: 65,
        defaultDensity: 67,
        comfortable: 75,
      });
    },

    e2eAutoColumnSize_67_75_83() {
      return this.pickByDensity({
        compact: 67,
        defaultDensity: 75,
        comfortable: 83,
      });
    },

    e2eAutoColumnSize_82_91_99() {
      return this.pickByDensity({
        compact: 82,
        defaultDensity: 91,
        comfortable: 99,
      });
    },

    e2eAutoColumnSize_95_95_100() {
      return this.pickByDensity({
        compact: 95,
        defaultDensity: 95,
        comfortable: 100,
      });
    },

    // --- Nested headers ghost table E2E (from ghostTable.spec.js) ---

    e2eNestedHeadersGhostTable_100_110_117() {
      return this.pickByDensity({
        compact: 100,
        defaultDensity: 110,
        comfortable: 117,
      });
    },

    e2eNestedHeadersGhostTable_102_111_114() {
      return this.pickByDensity({
        compact: 102,
        defaultDensity: 111,
        comfortable: 114,
      });
    },

    e2eNestedHeadersGhostTable_135_150_158() {
      return this.pickByDensity({
        compact: 135,
        defaultDensity: 150,
        comfortable: 158,
      });
    },

    e2eNestedHeadersGhostTable_201_219_227() {
      return this.pickByDensity({
        compact: 201,
        defaultDensity: 219,
        comfortable: 227,
      });
    },

    e2eNestedHeadersGhostTable_21_26_33() {
      return this.pickByDensity({
        compact: 21,
        defaultDensity: 26,
        comfortable: 33,
      });
    },

    e2eNestedHeadersGhostTable_21_26_34() {
      return this.pickByDensity({
        compact: 21,
        defaultDensity: 26,
        comfortable: 34,
      });
    },

    e2eNestedHeadersGhostTable_22_26_34() {
      return this.pickByDensity({
        compact: 22,
        defaultDensity: 26,
        comfortable: 34,
      });
    },

    e2eNestedHeadersGhostTable_22_26_35() {
      return this.pickByDensity({
        compact: 22,
        defaultDensity: 26,
        comfortable: 35,
      });
    },

    e2eNestedHeadersGhostTable_22_27_35() {
      return this.pickByDensity({
        compact: 22,
        defaultDensity: 27,
        comfortable: 35,
      });
    },

    e2eNestedHeadersGhostTable_23_27_36() {
      return this.pickByDensity({
        compact: 23,
        defaultDensity: 27,
        comfortable: 36,
      });
    },

    e2eNestedHeadersGhostTable_23_28_36() {
      return this.pickByDensity({
        compact: 23,
        defaultDensity: 28,
        comfortable: 36,
      });
    },

    e2eNestedHeadersGhostTable_24_28_36() {
      return this.pickByDensity({
        compact: 24,
        defaultDensity: 28,
        comfortable: 36,
      });
    },

    e2eNestedHeadersGhostTable_25_30_38() {
      return this.pickByDensity({
        compact: 25,
        defaultDensity: 30,
        comfortable: 38,
      });
    },

    e2eNestedHeadersGhostTable_79_88_96() {
      return this.pickByDensity({
        compact: 79,
        defaultDensity: 88,
        comfortable: 96,
      });
    },

    e2eNestedHeadersGhostTable_98_108_112() {
      return this.pickByDensity({
        compact: 98,
        defaultDensity: 108,
        comfortable: 112,
      });
    },

    e2eNestedHeadersGhostTable_99_110_118() {
      return this.pickByDensity({
        compact: 99,
        defaultDensity: 110,
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
      const trim = this.pickByDensity({
        compact: 2,
        defaultDensity: 1,
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
      const add = this.pickByDensity({
        compact: 1,
        defaultDensity: 1,
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
      return `${this.firstRenderedRowDefaultHeight}px`;
    },

    /**
     * TEXTAREA parent top for first data row under a column title row (outer row height).
     *
     * @returns {string}
     */
    e2eTextEditorTextareaParentTopPx() {
      return `${this.defaultDataRowHeight}px`;
    },

    /**
     * Text editor TEXTAREA height for three lines of text.
     *
     * @returns {string}
     */
    e2eTextEditorTextareaHeightThreeLinesPx() {
      const px = (3 * this.lineHeight) + (2 * this.cellVerticalPadding) + (2 * this.cellBorderWidth);

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
      const trim = this.pickByDensity({
        compact: 13,
        defaultDensity: 17,
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
      return topPositionBefore + this.defaultDataRowHeight;
    },

    /**
     * TEXTAREA parent offset for wide merged cell after horizontal scroll (two data rows below header).
     *
     * @returns {{ top: number, left: number }}
     */
    e2eMergeCellsOpenEditorWideMergeTextareaParentOffset() {
      return {
        top: 2 * this.defaultDataRowHeight,
        left: this.defaultRowHeaderWidth,
      };
    },

    /**
     * TEXTAREA parent offset for tall merged cell after vertical scroll.
     *
     * @returns {{ top: number, left: number }}
     */
    e2eMergeCellsOpenEditorTallMergeTextareaParentOffset() {
      return {
        top: this.firstRenderedRowDefaultHeight,
        left: this.pickByDensity({
          compact: 99,
          defaultDensity: 100,
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
        width: width + (2 * this.cellHorizontalPadding) + (2 * this.cellBorderWidth),
        height: height + (2 * this.cellVerticalPadding) + (2 * this.cellBorderWidth),
      };
    },

    e2eDensity_516fd776f5() {
      return this.pickByDensity({
        compact: 'A13',
        defaultDensity: 'A11',
        comfortable: 'A9',
      });
    },

    e2eDensity_e18c9a767b() {
      return this.pickByDensity({
        compact: 'A19',
        defaultDensity: 'A18',
        comfortable: 'A6',
      });
    },

    e2eDensity_05e899e868() {
      return this.pickByDensity({
        compact: 'A21',
        defaultDensity: 'A18',
        comfortable: 'A14',
      });
    },

    e2eDensity_763d67703a() {
      return this.pickByDensity({
        compact: 'A25',
        defaultDensity: 'A22',
        comfortable: 'A17',
      });
    },

    e2eDensity_6f54af4a25() {
      return this.pickByDensity({
        compact: 'A27',
        defaultDensity: 'A23',
        comfortable: 'A7',
      });
    },

    e2eDensity_d7aa2fd7d8() {
      return this.pickByDensity({
        compact: 'A5',
        defaultDensity: 'A4',
        comfortable: 'A3',
      });
    },

    e2eDensity_837d6451b8() {
      return this.pickByDensity({
        compact: 'A8',
        defaultDensity: 'A7',
        comfortable: 'A5',
      });
    },

    e2eDensity_d684162341() {
      return this.pickByDensity({
        compact: 'A9',
        defaultDensity: 'A8',
        comfortable: 'A6',
      });
    },

    e2eDensity_dcb53105f5() {
      return this.pickByDensity({
        compact: -71,
        defaultDensity: -62,
        comfortable: -38,
      });
    },

    e2eDensity_7d7cc669b9() {
      return this.pickByDensity({
        compact: 100,
        defaultDensity: 100,
        comfortable: 170,
      });
    },

    e2eDensity_d97740ab8b() {
      return this.pickByDensity({
        compact: 10142,
        defaultDensity: 11345,
        comfortable: 14553,
      });
    },

    e2eDensity_21de631a3d() {
      return this.pickByDensity({
        compact: 104,
        defaultDensity: 94,
        comfortable: 61,
      });
    },

    e2eDensity_1369f821b5() {
      return this.pickByDensity({
        compact: 110,
        defaultDensity: 109,
        comfortable: 117,
      });
    },

    /* MergeCells: top overlay height after multiline edit in a 3-row merged block (3-row overlay + 2 lines). */
    e2eDensity_0051ca7391() {
      return this.overlayHeight({ rows: 3 }) + (2 * this.lineHeight);
    },

    e2eDensity_d199d17b67() {
      return this.pickByDensity({
        compact: 130,
        defaultDensity: 130,
        comfortable: 160,
      });
    },

    e2eDensity_6fb44e9a25() {
      return this.pickByDensity({
        compact: 130,
        defaultDensity: 185,
        comfortable: 235,
      });
    },

    e2eDensity_5e8f2219da() {
      return this.pickByDensity({
        compact: 131,
        defaultDensity: 129,
        comfortable: 137,
      });
    },

    /* MergeCells: fixed-column clone `.htCore` height for a 3-row merge (5 logical overlay rows). */
    e2eDensity_8992c845e6() {
      return this.overlayHeight({ rows: 5 });
    },

    e2eDensity_95d19e5e71() {
      return this.pickByDensity({
        compact: 134,
        defaultDensity: 170,
        comfortable: 260,
      });
    },

    e2eDensity_86a4cac668() {
      return this.pickByDensity({
        compact: 139,
        defaultDensity: 155,
        comfortable: 194,
      });
    },

    e2eDensity_73a19e226c() {
      return this.pickByDensity({
        compact: 140,
        defaultDensity: 185,
        comfortable: 240,
      });
    },

    e2eDensity_0bf6b512ac() {
      return this.pickByDensity({
        compact: 149,
        defaultDensity: 163,
        comfortable: 171,
      });
    },

    e2eDensity_e9b95cfc26() {
      return this.pickByDensity({
        compact: 150,
        defaultDensity: 150,
        comfortable: 155,
      });
    },

    e2eDensity_d347abe8d6() {
      return this.pickByDensity({
        compact: 1819,
        defaultDensity: 1961,
        comfortable: 2284,
      });
    },

    e2eDensity_dc11ccdb89() {
      return this.pickByDensity({
        compact: 192,
        defaultDensity: 210,
        comfortable: 218,
      });
    },

    e2eDensity_3bcf74979c() {
      return this.pickByDensity({
        compact: 207,
        defaultDensity: 225,
        comfortable: 233,
      });
    },

    e2eDensity_012c64941a() {
      return this.pickByDensity({
        compact: 215,
        defaultDensity: 216,
        comfortable: 264,
      });
    },

    e2eDensity_db9abac9c8() {
      return this.pickByDensity({
        compact: 217,
        defaultDensity: 217,
        comfortable: 215,
      });
    },

    e2eDensity_2d086a6135() {
      return this.pickByDensity({
        compact: 222,
        defaultDensity: 246,
        comfortable: 313,
      });
    },

    e2eDensity_9d03a9eba0() {
      return this.pickByDensity({
        compact: 243,
        defaultDensity: 241,
        comfortable: 241,
      });
    },

    e2eDensity_0308b1f949() {
      return this.pickByDensity({
        compact: 246,
        defaultDensity: 268,
        comfortable: 276,
      });
    },

    e2eDensity_a57d724d44() {
      return this.pickByDensity({
        compact: 26,
        defaultDensity: 49,
        comfortable: 57,
      });
    },

    e2eDensity_f2d3fe1fc0() {
      return this.pickByDensity({
        compact: 27 + (4 * 26),
        defaultDensity: 30 + (4 * 29),
        comfortable: 38 + (4 * 37),
      });
    },

    e2eDensity_9d8bccd1c7() {
      return this.pickByDensity({
        compact: 30,
        defaultDensity: 34,
        comfortable: 42,
      });
    },

    e2eDensity_315eed5b06() {
      return this.pickByDensity({
        compact: 31,
        defaultDensity: 35,
        comfortable: 43,
      });
    },

    e2eDensity_9ece902862() {
      return this.pickByDensity({
        compact: 35,
        defaultDensity: 35,
        comfortable: 36,
      });
    },

    e2eDensity_a4793c32d9() {
      return this.pickByDensity({
        compact: 367,
        defaultDensity: 356,
        comfortable: 352,
      });
    },

    e2eDensity_129ed1d57c() {
      return this.pickByDensity({
        compact: 38,
        defaultDensity: 43,
        comfortable: 51,
      });
    },

    e2eDensity_ed183d57c9() {
      return this.pickByDensity({
        compact: 47,
        defaultDensity: 49,
        comfortable: 57,
      });
    },

    e2eDensity_682da48dd2() {
      return this.pickByDensity({
        compact: 48,
        defaultDensity: 50,
        comfortable: 58,
      });
    },

    e2eDensity_d35d5683ec() {
      return this.pickByDensity({
        compact: 50,
        defaultDensity: 50,
        comfortable: 51,
      });
    },

    e2eDensity_429cac7b61() {
      return this.pickByDensity({
        compact: 50,
        defaultDensity: 50,
        comfortable: 52,
      });
    },

    e2eDensity_a2f2c0beda() {
      return this.pickByDensity({
        compact: 50,
        defaultDensity: 50,
        comfortable: 85,
      });
    },

    /* Two default data rows (outer height), e.g. merge backlight / manual row move indicator. */
    e2eDensity_f464e90e18() {
      return 2 * this.defaultDataRowHeight;
    },

    /* Two default data rows plus 1px (border seam), e.g. adjacent merged pair outer height. */
    e2eDensity_9639197594() {
      return (2 * this.defaultDataRowHeight) + this.cellBorderWidth;
    },

    e2eDensity_7c3646ff31() {
      return this.pickByDensity({
        compact: 53,
        defaultDensity: 60,
        comfortable: 68,
      });
    },

    e2eDensity_e145a29131() {
      return this.pickByDensity({
        compact: 57,
        defaultDensity: 61,
        comfortable: 69,
      });
    },

    e2eDensity_cefdabf33b() {
      return this.pickByDensity({
        compact: 61,
        defaultDensity: 68,
        comfortable: 76,
      });
    },

    e2eDensity_c1a868f9c9() {
      return this.pickByDensity({
        compact: 68,
        defaultDensity: 69,
        comfortable: 77,
      });
    },

    e2eDensity_73e2af5849() {
      return this.pickByDensity({
        compact: 68,
        defaultDensity: 89,
        comfortable: 97,
      });
    },

    e2eDensity_9efbb642b5() {
      return this.pickByDensity({
        compact: 70,
        defaultDensity: 71,
        comfortable: 79,
      });
    },

    e2eDensity_a24230f0bc() {
      return this.pickByDensity({
        compact: 74,
        defaultDensity: 79,
        comfortable: 95,
      });
    },

    e2eDensity_a738aa613c() {
      return this.pickByDensity({
        compact: 75,
        defaultDensity: 84,
        comfortable: 92,
      });
    },

    e2eDensity_10071d8a47() {
      return this.pickByDensity({
        compact: 77,
        defaultDensity: 81,
        comfortable: 89,
      });
    },

    e2eDensity_f0a5ff56db() {
      return this.pickByDensity({
        compact: 78,
        defaultDensity: 87,
        comfortable: 111,
      });
    },

    /* MergeCells: outer height for a 3-row merged cell / matching top overlay (first row +1px compensation). */
    e2eDensity_9a971c3cfe() {
      return this.overlayHeight({ rows: 3 });
    },

    e2eDensity_ff544a9b2b() {
      return this.pickByDensity({
        compact: 86,
        defaultDensity: 93,
        comfortable: 101,
      });
    },

    e2eDensity_25c4d95d1f() {
      return this.pickByDensity({
        compact: 87,
        defaultDensity: 91,
        comfortable: 99,
      });
    },

    e2eDensity_9b92431d49() {
      return this.pickByDensity({
        compact: 88,
        defaultDensity: 88,
        comfortable: 96,
      });
    },

    e2eDensity_5bbc262bb3() {
      return this.pickByDensity({
        compact: 90,
        defaultDensity: 99,
        comfortable: 107,
      });
    },

    e2eDensity_0077155d83() {
      return this.pickByDensity({
        compact: 984,
        defaultDensity: 1135,
        comfortable: 1543,
      });
    },

    e2eDensity_066cd3067e() {
      return this.pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 1 of 45',
          '|< < Page 1 of 4 [>] [>|]',
        ],
        defaultDensity: [
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
      return this.pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 13 of 100',
          '|< < Page 1 of 8 [>] [>|]',
        ],
        defaultDensity: [
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
      return this.pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 21 of 100',
          '|< < Page 1 of 5 [>] [>|]',
        ],
        defaultDensity: [
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
      return this.pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 25 of 100',
          '|< < Page 1 of 4 [>] [>|]',
        ],
        defaultDensity: [
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
      return this.pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '1 - 5 of 100',
          '|< < Page 1 of 20 [>] [>|]',
        ],
        defaultDensity: [
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
      return this.pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '2 - 8 of 45',
          '[|<] [<] Page 2 of 4 [>] [>|]',
        ],
        defaultDensity: [
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
      return this.pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '9 - 19 of 45',
          '[|<] [<] Page 3 of 5 [>] [>|]',
        ],
        defaultDensity: [
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
      return this.pickByDensity({
        compact: [
          'Page size: [[auto], 5, 10, 20, 50, 100]',
          '9 - 27 of 45',
          '[|<] [<] Page 3 of 4 [>] [>|]',
        ],
        defaultDensity: [
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
     */
    e2eGcr_9fd0838eca() {
      return this.pickByDensity({
        compact: {
          start: 0,
          top: 0,
          width: 50,
          maxWidth: 285,
          height: 27,
          maxHeight: 185,
        },
        defaultDensity: {
          start: 0,
          top: 0,
          width: 50,
          maxWidth: 285,
          height: 30,
          maxHeight: 185,
        },
        comfortable: {
          start: 0,
          top: 0,
          width: 51,
          maxWidth: 285,
          height: 38,
          maxHeight: 185,
        },
      });
    },

    e2eGcr_0c1f70547f(maxWidth, maxHeight) {
      return this.pickByDensity({
        compact: {
          start: 0,
          top: 0,
          width: 50,
          maxWidth,
          height: 27,
          maxHeight,
        },
        defaultDensity: {
          start: 0,
          top: 0,
          width: 51,
          maxWidth,
          height: 30,
          maxHeight,
        },
        comfortable: {
          start: 0,
          top: 0,
          width: 59,
          maxWidth,
          height: 38,
          maxHeight,
        },
      });
    },

    e2eGcr_654f08c592() {
      return this.pickByDensity({
        compact: {
          start: 234,
          top: 26,
          width: 51,
          maxWidth: 51,
          height: 27,
          maxHeight: 159,
        },
        defaultDensity: {
          start: 234,
          top: 29,
          width: 51,
          maxWidth: 51,
          height: 30,
          maxHeight: 156,
        },
        comfortable: {
          start: 234,
          top: 37,
          width: 51,
          maxWidth: 51,
          height: 38,
          maxHeight: 148,
        },
      });
    },

    e2eGcr_394b62538f(maxWidth, maxHeight) {
      return this.pickByDensity({
        compact: {
          start: document.documentElement.scrollLeft + maxWidth - 55, // 55 - the width of the first cell
          top: document.documentElement.offsetHeight - maxHeight + 26,
          width: 55,
          maxWidth: 55,
          height: 27,
          maxHeight: maxHeight - 26,
        },
        defaultDensity: {
          start: document.documentElement.scrollLeft + maxWidth - 62,
          top: document.documentElement.offsetHeight - maxHeight + 29,
          width: 62,
          maxWidth: 62,
          height: 30,
          maxHeight: maxHeight - 29,
        },
        comfortable: {
          start: document.documentElement.scrollLeft + maxWidth - 70,
          top: document.documentElement.offsetHeight - maxHeight + 37,
          width: 70,
          maxWidth: 70,
          height: 38,
          maxHeight: maxHeight - 37,
        },
      });
    },

    e2eGcr_1812746652() {
      return this.pickByDensity({
        compact: {
          start: 49,
          top: 26,
          width: 51,
          maxWidth: 236,
          height: 27,
          maxHeight: 159,
        },
        defaultDensity: {
          start: 49,
          top: 29,
          width: 51,
          maxWidth: 236,
          height: 30,
          maxHeight: 156,
        },
        comfortable: {
          start: 50,
          top: 37,
          width: 52,
          maxWidth: 235,
          height: 38,
          maxHeight: 148,
        },
      });
    },

    e2eGcr_59a39f83a8(maxWidth, maxHeight) {
      return this.pickByDensity({
        compact: {
          start: document.documentElement.scrollLeft + 49, // 49 - the width of the first cell
          top: document.documentElement.offsetHeight - maxHeight + 26,
          width: 51,
          maxWidth: maxWidth - 49,
          height: 27,
          maxHeight: maxHeight - 26,
        },
        defaultDensity: {
          start: document.documentElement.scrollLeft + 50,
          top: document.documentElement.offsetHeight - maxHeight + 29,
          width: 52,
          maxWidth: maxWidth - 50,
          height: 30,
          maxHeight: maxHeight - 29,
        },
        comfortable: {
          start: document.documentElement.scrollLeft + 58,
          top: document.documentElement.offsetHeight - maxHeight + 37,
          width: 60,
          maxWidth: maxWidth - 58,
          height: 38,
          maxHeight: maxHeight - 37,
        },
      });
    },

    e2eGcr_63d4e50227() {
      return this.pickByDensity({
        compact: {
          start: 49,
          top: 158,
          width: 51,
          maxWidth: 236,
          height: 27,
          maxHeight: 27,
        },
        defaultDensity: {
          start: 49,
          top: 155,
          width: 51,
          maxWidth: 236,
          height: 30,
          maxHeight: 30,
        },
        comfortable: {
          start: 50,
          top: 147,
          width: 52,
          maxWidth: 235,
          height: 38,
          maxHeight: 38,
        },
      });
    },

    e2eGcr_f1418f56a2(maxWidth) {
      return this.pickByDensity({
        compact: {
          start: document.documentElement.scrollLeft + 49, // 49 - the width of the first cell
          top: document.documentElement.offsetHeight - 27, // 27 - the height of the last cell
          width: 51,
          maxWidth: maxWidth - 49,
          height: 27,
          maxHeight: 27,
        },
        defaultDensity: {
          start: document.documentElement.scrollLeft + 50, // 50 - the width of the first cell
          top: document.documentElement.offsetHeight - 30,
          width: 52,
          maxWidth: maxWidth - 50,
          height: 30,
          maxHeight: 30,
        },
        comfortable: {
          start: document.documentElement.scrollLeft + 58, // 50 - the width of the first cell
          top: document.documentElement.offsetHeight - 38,
          width: 60,
          maxWidth: maxWidth - 58,
          height: 38,
          maxHeight: 38,
        },
      });
    },

    e2eGcr_e9a5ab9a7a() {
      return this.pickByDensity({
        compact: {
          start: 0,
          top: 132,
          width: 50,
          maxWidth: 285,
          height: 27,
          maxHeight: 53,
        },
        defaultDensity: {
          start: 0,
          top: 126,
          width: 50,
          maxWidth: 285,
          height: 30,
          maxHeight: 59,
        },
        comfortable: {
          start: 0,
          top: 110,
          width: 51,
          maxWidth: 285,
          height: 38,
          maxHeight: 75,
        },
      });
    },

    e2eGcr_4ef37f8511(maxWidth, maxHeight) {
      return this.pickByDensity({
        compact: {
          start: 0,
          top: maxHeight - 53, // 53 - height of the 2 last rows,
          width: 50,
          maxWidth,
          height: 27,
          maxHeight: 68,
        },
        defaultDensity: {
          start: 0,
          top: maxHeight - 59,
          width: 51,
          maxWidth,
          height: 30,
          maxHeight: 74,
        },
        comfortable: {
          start: 0,
          top: maxHeight - 75,
          width: 59,
          maxWidth,
          height: 38,
          maxHeight: 90,
        },
      });
    },

    e2eGcr_5ac91379aa(maxWidth) {
      return this.pickByDensity({
        compact: {
          start: document.documentElement.scrollLeft,
          top: document.documentElement.offsetHeight - 54,
          width: 50,
          maxWidth,
          height: 27,
          maxHeight: 68,
        },
        defaultDensity: {
          start: document.documentElement.scrollLeft,
          top: document.documentElement.offsetHeight - 60,
          width: 51,
          maxWidth,
          height: 30,
          maxHeight: 74,
        },
        comfortable: {
          start: document.documentElement.scrollLeft,
          top: document.documentElement.offsetHeight - 76,
          width: 59,
          maxWidth,
          height: 38,
          maxHeight: 90,
        },
      });
    },

    e2eGcr_660b0bbbb1() {
      return this.pickByDensity({
        compact: {
          start: 0,
          top: 132,
          width: 50, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
          maxWidth: 285,
          height: 27,
          maxHeight: 53,
        },
        defaultDensity: {
          start: 0,
          top: 126,
          width: 50, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
          maxWidth: 285,
          height: 30,
          maxHeight: 59,
        },
        comfortable: {
          start: 0,
          top: 110,
          width: 51, // 48px (the default cell width closest to the left side of the table) - 8px (padding)
          maxWidth: 285,
          height: 38,
          maxHeight: 75,
        },
      });
    },

    e2eGcr_578ee2338a(maxWidth, maxHeight) {
      return this.pickByDensity({
        compact: {
          start: 0,
          top: maxHeight - 53, // 53 - height of the 2 last rows
          width: 50,
          maxWidth,
          height: 27,
          maxHeight: 68,
        },
        defaultDensity: {
          start: 0,
          top: maxHeight - 59,
          width: 51,
          maxWidth,
          height: 30,
          maxHeight: 74,
        },
        comfortable: {
          start: 0,
          top: maxHeight - 75,
          width: 59,
          maxWidth,
          height: 38,
          maxHeight: 90,
        },
      });
    },

    e2eGcr_be63e8af58() {
      return this.pickByDensity({
        compact: {
          start: 234,
          top: 158,
          width: 51,
          maxWidth: 51,
          height: 27,
          maxHeight: 27,
        },
        defaultDensity: {
          start: 234,
          top: 155,
          width: 51,
          maxWidth: 51,
          height: 30,
          maxHeight: 30,
        },
        comfortable: {
          start: 234,
          top: 147,
          width: 51,
          maxWidth: 51,
          height: 38,
          maxHeight: 38,
        },
      });
    },

    e2eGcr_1e686ee3a6() {
      return this.pickByDensity({
        compact: {
          start: 4949,
          top: document.documentElement.offsetHeight - 28,
          width: 51,
          maxWidth: 51,
          height: 27,
          maxHeight: 42,
        },
        defaultDensity: {
          start: 4949,
          top: document.documentElement.offsetHeight - 31,
          width: 51,
          maxWidth: 51,
          height: 30,
          maxHeight: 45,
        },
        comfortable: {
          start: 4949,
          top: document.documentElement.offsetHeight - 39,
          width: 51,
          maxWidth: 51,
          height: 38,
          maxHeight: 53,
        },
      });
    },

    e2eGcr_8b522d5d5b() {
      return this.pickByDensity({
        compact: {
          start: 234,
          top: 26,
          width: 51,
          maxWidth: 51,
          height: 27,
        },
        defaultDensity: {
          start: 234,
          top: 29,
          width: 51,
          maxWidth: 51,
          height: 30,
        },
        comfortable: {
          start: 234,
          top: 37,
          width: 51,
          maxWidth: 51,
          height: 38,
        },
      });
    },

    e2eGcr_e5142224f2(maxWidth, maxHeight) {
      return this.pickByDensity({
        compact: {
          start: Math.abs(document.documentElement.scrollLeft) + maxWidth - 55, // 55 - the width of the first cell
          top: document.documentElement.offsetHeight - maxHeight + 26,
          width: 55,
          maxWidth: 55,
          height: 27,
        },
        defaultDensity: {
          start: Math.abs(document.documentElement.scrollLeft) + maxWidth - 62,
          top: document.documentElement.offsetHeight - maxHeight + 29,
          width: 62,
          maxWidth: 62,
          height: 30,
        },
        comfortable: {
          start: Math.abs(document.documentElement.scrollLeft) + maxWidth - 70, // 51 - the width of the first cell
          top: document.documentElement.offsetHeight - maxHeight + 37,
          width: 70,
          maxWidth: 70,
          height: 38,
        },
      });
    },

    e2eGcr_d4ea38684b() {
      return this.pickByDensity({
        compact: {
          start: 49,
          top: 26,
          width: 51,
          height: 27,
        },
        defaultDensity: {
          start: 49,
          top: 29,
          width: 51,
          height: 30,
        },
        comfortable: {
          start: 50,
          top: 37,
          width: 52,
          height: 38,
        },
      });
    },

    e2eGcr_065fabb134(maxWidth, maxHeight) {
      return this.pickByDensity({
        compact: {
          start: Math.abs(document.documentElement.scrollLeft) + 49, // 49 - the width of the first cell
          top: document.documentElement.offsetHeight - maxHeight + 26,
          width: 51,
          height: 27,
        },
        defaultDensity: {
          start: Math.abs(document.documentElement.scrollLeft) + 50,
          top: document.documentElement.offsetHeight - maxHeight + 29,
          width: 52,
          height: 30,
        },
        comfortable: {
          start: Math.abs(document.documentElement.scrollLeft) + 58,
          top: document.documentElement.offsetHeight - maxHeight + 37,
          width: 60,
          height: 38,
        },
      });
    },

    e2eGcr_b03e660972() {
      return this.pickByDensity({
        compact: {
          start: 49,
          top: 158,
          width: 51,
          height: 27,
          maxHeight: 27,
        },
        defaultDensity: {
          start: 49,
          top: 155,
          width: 51,
          height: 30,
          maxHeight: 30,
        },
        comfortable: {
          start: 50,
          top: 147,
          width: 52,
          height: 38,
          maxHeight: 38,
        },
      });
    },

    e2eGcr_3acc8a5880() {
      return this.pickByDensity({
        compact: {
          start: Math.abs(document.documentElement.scrollLeft) + 49, // 49 - the width of the first cell
          top: document.documentElement.offsetHeight - 27, // 27 - the height of the last cell
          width: 51,
          height: 27,
          maxHeight: 27,
        },
        defaultDensity: {
          start: Math.abs(document.documentElement.scrollLeft) + 50,
          top: document.documentElement.offsetHeight - 30,
          width: 52,
          height: 30,
          maxHeight: 30,
        },
        comfortable: {
          start: Math.abs(document.documentElement.scrollLeft) + 58,
          top: document.documentElement.offsetHeight - 38,
          width: 60,
          height: 38,
          maxHeight: 38,
        },
      });
    },

    e2eGcr_62100eec40() {
      return this.pickByDensity({
        compact: {
          start: 0,
          top: 132,
          width: 50,
          maxWidth: 285,
          height: 27,
        },
        defaultDensity: {
          start: 0,
          top: 126,
          width: 50,
          maxWidth: 285,
          height: 30,
        },
        comfortable: {
          start: 0,
          top: 110,
          width: 51,
          maxWidth: 285,
          height: 38,
        },
      });
    },

    e2eGcr_a7dd654d16(maxWidth, maxHeight) {
      return this.pickByDensity({
        compact: {
          start: 0,
          top: maxHeight - 53, // 53 - height of the 2 last rows,
          width: 50,
          maxWidth,
          height: 27,
        },
        defaultDensity: {
          start: 0,
          top: maxHeight - 59,
          width: 51,
          maxWidth,
          height: 30,
        },
        comfortable: {
          start: 0,
          top: maxHeight - 75,
          width: 59,
          maxWidth,
          height: 38,
        },
      });
    },

    e2eGcr_3866422adb() {
      return this.pickByDensity({
        compact: {
          start: 0,
          top: 132,
          width: 50,
          height: 27,
        },
        defaultDensity: {
          start: 0,
          top: 126,
          width: 50,
          height: 30,
        },
        comfortable: {
          start: 0,
          top: 110,
          width: 51,
          height: 38,
        },
      });
    },

    e2eGcr_901bb6925b() {
      return this.pickByDensity({
        compact: {
          start: Math.abs(document.documentElement.scrollLeft),
          top: document.documentElement.offsetHeight - 54,
          width: 50,
          height: 27,
        },
        defaultDensity: {
          start: Math.abs(document.documentElement.scrollLeft),
          top: document.documentElement.offsetHeight - 60,
          width: 51,
          height: 30,
        },
        comfortable: {
          start: Math.abs(document.documentElement.scrollLeft),
          top: document.documentElement.offsetHeight - 76,
          width: 59,
          height: 38,
        },
      });
    },

    e2eGcr_69029d1636(maxWidth, maxHeight) {
      return this.pickByDensity({
        compact: {
          start: 0,
          top: maxHeight - 53, // 53 - height of the 2 last rows
          width: 50,
          maxWidth,
          height: 27,
        },
        defaultDensity: {
          start: 0,
          top: maxHeight - 59,
          width: 51,
          maxWidth,
          height: 30,
        },
        comfortable: {
          start: 0,
          top: maxHeight - 75,
          width: 59,
          maxWidth,
          height: 38,
        },
      });
    },

    e2eGcr_230de5a9f7() {
      return this.pickByDensity({
        compact: {
          start: 234,
          top: 158,
          width: 51,
          maxWidth: 51,
          height: 27,
        },
        defaultDensity: {
          start: 234,
          top: 155,
          width: 51,
          maxWidth: 51,
          height: 30,
        },
        comfortable: {
          start: 234,
          top: 147,
          width: 51,
          maxWidth: 51,
          height: 38,
        },
      });
    },

    e2eGcr_3dc880f3f2() {
      return this.pickByDensity({
        compact: {
          start: 4949,
          top: document.documentElement.offsetHeight - 28,
          width: 51,
          maxWidth: 51,
          height: 27,
        },
        defaultDensity: {
          start: 4949,
          top: document.documentElement.offsetHeight - 31,
          width: 51,
          maxWidth: 51,
          height: 30,
        },
        comfortable: {
          start: 4949,
          top: document.documentElement.offsetHeight - 39,
          width: 51,
          maxWidth: 51,
          height: 38,
        },
      });
    },

    e2eDensity_fe455d5781() {
      return this.pickByDensity({
        compact: defaultColumnWidth,
        defaultDensity: defaultColumnWidth,
        comfortable: defaultColumnWidth + 1,
      });
    },

    e2eDensity_8b9c83b3f3() {
      return this.pickByDensity({
        compact: defaultColumnWidth,
        defaultDensity: defaultColumnWidth,
        comfortable: defaultColumnWidth + 2,
      });
    },

  };
}
