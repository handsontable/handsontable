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
 * @param {string} themeName One of 'classic', 'main', 'horizon'.
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

  // Row header width: modern themes use border-box so the 1px border reduces content width.
  // Classic uses content-box so the full 50px is content.
  const isModernTheme = resolvedName !== 'classic';
  const defaultRowHeaderWidth = WALKONTABLE_DEFAULT_COLUMN_WIDTH
    - (isModernTheme ? cellBorderWidth : 0);

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
  };
}
