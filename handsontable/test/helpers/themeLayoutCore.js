import sizing from '../../src/themes/static/variables/sizing';
import density from '../../src/themes/static/variables/density';
import * as themeModules from '../../src/themes/theme';

/**
 * Build the theme registry by introspecting the theme modules. Theme identity (name,
 * density, tokens) is owned by `src/themes/theme/*.js`; this helper is a pure consumer.
 */
const THEMES = Object.freeze(
  Object.values(themeModules)
    .filter(mod => mod && typeof mod === 'object' && typeof mod.name === 'string')
    .reduce((acc, mod) => {
      acc[mod.name] = mod;

      return acc;
    }, {})
);

/**
 * Theme keys registered by introspecting `src/themes/theme/*.js`. E2E bundle serves
 * `styles/ht-theme-{key}.css` for each. Add a theme module under `src/themes/theme/`
 * (and a stylesheet) to register a new theme -- no edit to this helper is required.
 *
 * @type {string[]}
 */
export const E2E_REGISTERED_THEME_KEYS = Object.freeze(Object.keys(THEMES));

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
 * Token-backed layout primitives for a theme. All values are numbers in pixels
 * unless noted. Density is read from the theme module -- changing `density` in
 * `src/themes/theme/<name>.js` propagates here automatically.
 *
 * @param {string} themeName Theme key discovered from `src/themes/theme/index.js`.
 * @returns {object} Core layout metrics and `overlayHeight` / `verticalScrollForRow` helpers.
 */
export function createThemeLayoutCore(themeName) {
  const resolvedName = themeName || 'main';
  const themeModule = THEMES[resolvedName];

  if (!themeModule) {
    throw new Error(
      `themeLayoutCore: unknown theme "${themeName}". ` +
      `Supported (from src/themes/theme/index.js): ${Object.keys(THEMES).join(', ')}`
    );
  }

  const densityLevel = themeModule.density;
  const densityConfig = density[densityLevel];

  if (!densityConfig) {
    throw new Error(
      `themeLayoutCore: theme "${resolvedName}" declares density "${densityLevel}" ` +
      `but density module has no such entry`
    );
  }

  const lineHeight = parsePx(themeModule.tokens.lineHeight);
  const cellVerticalPadding = resolveSizingRef(densityConfig.cellVertical);
  const cellHorizontalPadding = resolveSizingRef(densityConfig.cellHorizontal);
  const cellBorderWidth = parsePx(sizing.size_0_25);

  const cellContentHeight = lineHeight + (2 * cellVerticalPadding);
  const defaultDataRowHeight = cellContentHeight + cellBorderWidth;
  const defaultColumnHeaderHeight = cellContentHeight;
  const firstRenderedRowDefaultHeight = defaultDataRowHeight + cellBorderWidth;
  const defaultColumnWidth = WALKONTABLE_DEFAULT_COLUMN_WIDTH;
  const defaultRowHeaderWidth = WALKONTABLE_DEFAULT_COLUMN_WIDTH;

  return {
    themeName: resolvedName,
    densityLevel,

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

    sizing,

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
