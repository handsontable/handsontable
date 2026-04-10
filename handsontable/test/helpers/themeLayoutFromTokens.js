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

  // Row header width: compact density (classic) uses content-box so the full 50px is content.
  // Default and comfortable densities use border-box so the 1px border reduces content width.
  const isCompactDensity = densityLevel === 'compact';
  const defaultRowHeaderWidth = WALKONTABLE_DEFAULT_COLUMN_WIDTH
    - (isCompactDensity ? 0 : cellBorderWidth);

  /**
   * @param {'compact'|'default'|'comfortable'} level Density bucket to compare.
   * @returns {boolean}
   */
  const isDensity = level => densityLevel === level;

  return {
    // --- Primitives ---
    lineHeight,
    cellVerticalPadding,
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
  };
}
