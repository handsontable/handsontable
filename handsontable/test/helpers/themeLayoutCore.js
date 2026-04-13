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
 * Theme keys registered in {@link THEME_TOKENS}. The E2E bundle serves `styles/ht-theme-{key}.css`
 * for each. Add a key here (and a stylesheet) when introducing a theme; iframe `doc.write` shells
 * use `getE2eThemeStylesheetLinkTagsHtml()` in `test/helpers/common.js`.
 *
 * @type {string[]}
 */
export const E2E_REGISTERED_THEME_KEYS = Object.freeze(Object.keys(THEME_TOKENS));

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
 * Token-backed layout primitives for a theme (no `e2e*` regression helpers).
 * Use {@link themeLayoutFromTokens} from `themeLayoutFromTokens.js` for the merged API.
 *
 * All returned values are **numbers in pixels** unless noted.
 *
 * Box model note: `defaultDataRowHeight` and `firstRenderedRowDefaultHeight` represent the
 * **outer height** as measured by jQuery `.height()` (which returns `offsetHeight` for table
 * rows). `defaultColumnHeaderHeight` and `cellContentHeight` represent the **content height**
 * (equivalent to `clientHeight` on a TD, excluding the 1px bottom border).
 *
 * @param {string} themeName Theme key registered in THEME_TOKENS and THEME_DENSITY.
 * @returns {object} Core layout metrics and `pickByDensity` / `overlayHeight` helpers.
 */
export function createThemeLayoutCore(themeName) {
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

  const lineHeight = parsePx(tokens.lineHeight);
  const cellVerticalPadding = resolveSizingRef(densityConfig.cellVertical);
  const cellHorizontalPadding = resolveSizingRef(densityConfig.cellHorizontal);
  const cellBorderWidth = parsePx(sizing.size_0_25); // 1px

  const cellContentHeight = lineHeight + (2 * cellVerticalPadding);
  const defaultDataRowHeight = cellContentHeight + cellBorderWidth;
  const defaultColumnHeaderHeight = cellContentHeight;
  const firstRenderedRowDefaultHeight = defaultDataRowHeight + cellBorderWidth;
  const defaultColumnWidth = WALKONTABLE_DEFAULT_COLUMN_WIDTH;
  const defaultRowHeaderWidth = WALKONTABLE_DEFAULT_COLUMN_WIDTH;

  /**
   * @param {'compact'|'default'|'comfortable'} level Density bucket to compare.
   * @returns {boolean}
   */
  const isDensity = level => densityLevel === level;

  return {
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
     * Density preset for this theme (from THEME_DENSITY).
     *
     * @returns {'compact'|'default'|'comfortable'}
     */
    densityLevel,

    /**
     * Pick a theme-dependent value by density bucket (classic → compact, main → default,
     * horizon → comfortable).
     *
     * @template T
     * @param {{ compact: T, default: T, comfortable: T }} values Expectations per density.
     * @returns {T}
     */
    pickByDensity(values) {
      if (isDensity('compact')) {
        return values.compact;
      }

      if (isDensity('default')) {
        return values.default;
      }

      return values.comfortable;
    },
  };
}
