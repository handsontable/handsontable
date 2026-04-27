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
 * Calculate overlay height for a section with the given row counts.
 * The first rendered row in any overlay section gets +1px border compensation.
 *
 * @param {object} primitives Token primitives (`defaultDataRowHeight`, `firstRenderedRowDefaultHeight`).
 * @param {object} options Options.
 * @param {number} [options.rows=0] Total rows (headers + data) in the overlay.
 * @param {boolean} [options.includeFirstRowCompensation=true] Whether the first row gets +1px.
 * @returns {number} Height in pixels.
 */
function overlayHeight(primitives, { rows = 0, includeFirstRowCompensation = true } = {}) {
  if (rows === 0) {
    return 0;
  }

  if (includeFirstRowCompensation) {
    return primitives.firstRenderedRowDefaultHeight + ((rows - 1) * primitives.defaultDataRowHeight);
  }

  return rows * primitives.defaultDataRowHeight;
}

/**
 * Token-backed layout primitives for a theme. All values are numbers in pixels
 * unless noted. Density is read from the theme module -- changing `density` in
 * `src/themes/theme/<name>.js` propagates here automatically.
 *
 * Box model note: `defaultDataRowHeight` and `firstRenderedRowDefaultHeight` represent the
 * **outer height** as measured by jQuery `.height()` (which returns `offsetHeight` for table
 * rows). `defaultColumnHeaderHeight` and `cellContentHeight` represent the **content height**
 * (equivalent to `clientHeight` on a TD, excluding the 1px bottom border).
 *
 * @param {string} themeName Theme key discovered from `src/themes/theme/index.js`.
 * @returns {object} Core layout metrics and `overlayHeight` / `verticalScrollForRow` helpers.
 */
export function createThemeLayoutCore(themeName) {
  const resolvedName = themeName || 'main';
  const themeModule = THEMES[resolvedName];

  if (!themeModule) {
    throw new Error(
      `themeLayoutFromTokens: unknown theme "${themeName}". ` +
      `Supported (from src/themes/theme/index.js): ${Object.keys(THEMES).join(', ')}`
    );
  }

  const densityLevel = themeModule.density;
  const densityConfig = density[densityLevel];

  if (!densityConfig) {
    throw new Error(
      `themeLayoutFromTokens: theme "${resolvedName}" declares density "${densityLevel}" ` +
      'but density module has no such entry'
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
  // Walkontable defaults row-header column width to the same constant as data columns
  // (rendering engine convention -- see src/3rdparty/walkontable/src/settings.js).
  const defaultColumnWidth = WALKONTABLE_DEFAULT_COLUMN_WIDTH;
  const defaultRowHeaderWidth = WALKONTABLE_DEFAULT_COLUMN_WIDTH;

  const primitives = {
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
  };

  return {
    ...primitives,

    /**
     * Calculate overlay height for a section with the given row counts.
     *
     * @param {object} options See module-level `overlayHeight`.
     * @returns {number} Height in pixels.
     */
    overlayHeight(options) {
      return overlayHeight(primitives, options);
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

/**
 * Build the non-scenario-specific E2E layout helpers that remain on the theme layout object.
 * Scenario-specific helpers (one-shot formulas tied to a single spec) live next to their
 * specs in `src/plugins/<name>/__tests__/helpers/` or `src/editors/<name>/__tests__/helpers/`.
 *
 * All return values are pure arithmetic expressions over the primitives from
 * `createThemeLayoutCore`. Baked per-density numeric triplets are not permitted -- derive
 * from tokens or measure from the live DOM instead.
 *
 * @param {object} core Return value of `createThemeLayoutCore`.
 * @returns {object} Methods merged into the public theme layout API.
 */
function buildThemeLayoutE2eHelpers(core) {
  const {
    lineHeight,
    cellVerticalPadding,
    cellHorizontalPadding,
    cellBorderWidth,
    cellContentHeight,
    defaultDataRowHeight,
    defaultColumnHeaderHeight,
    firstRenderedRowDefaultHeight,
    defaultRowHeaderWidth,
  } = core;

  return {
    /**
     * TD outer height in getEditedCellRect E2E rects when it matches the live edited cell.
     * `cellContentHeight + 2 * cellBorderWidth` (top and bottom table cell borders).
     *
     * @returns {number}
     */
    e2eGcrEditedCellOuterHeight() {
      return cellContentHeight + (2 * cellBorderWidth);
    },

    /**
     * `manualRowResizer` jQuery `.position()` when hovering master clone row under `fixedRowsTop: 2`
     * before moving to the top overlay row (manualRowResize E2E).
     *
     * @returns {{ top: number, left: number }}
     */
    e2eManualRowResizerPositionFixedTopMasterFourthRow() {
      return { top: defaultColumnHeaderHeight + (4 * cellContentHeight), left: 0 };
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
      return `${(3 * lineHeight) + (2 * cellVerticalPadding) + (2 * cellBorderWidth)}px`;
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

    /**
     * `manualRowResizer` position after moving hover to top overlay second fixed row
     * (manualRowResize E2E, `fixedRowsTop: 2`).
     *
     * @returns {{ top: number, left: number }}
     */
    e2eManualRowResizerPositionFixedTopOverlaySecondRow() {
      return { top: (3 * defaultDataRowHeight) - 5, left: 0 };
    },

    /**
     * Row-header TH height after double-click auto-size with mixed row heights (manualRowResize E2E).
     *
     * @returns {number}
     */
    e2eManualRowResizeRowHeaderHeightAfterDoubleClickAutoSize() {
      return lineHeight + cellContentHeight;
    },

    /**
     * Checkbox label inner width when the label stretches to the cell (non-separated layout).
     *
     * @param {number} cellOuterWidth TD offsetWidth.
     * @returns {number}
     */
    e2eCheckboxRendererMergedLabelInnerWidth(cellOuterWidth) {
      return cellOuterWidth - ((2 * cellHorizontalPadding) + cellBorderWidth);
    },
  };
}

/**
 * Compute layout metrics for a given theme by resolving the same static token,
 * sizing and density modules that production themes use.
 *
 * Returns a merged object combining:
 *  - token primitives from `createThemeLayoutCore` (lineHeight, cellVerticalPadding,
 *    defaultDataRowHeight, etc.) and the `overlayHeight` / `verticalScrollForRow` helpers,
 *  - scenario-specific E2E regression helpers (`e2e*` methods) whose JSDoc blocks
 *    name the spec scenarios they represent.
 *
 * @param {string} themeName Theme key (`classic`, `main`, `horizon`, ...).
 * @returns {object} Merged layout API for tests.
 */
export function themeLayoutFromTokens(themeName) {
  const core = createThemeLayoutCore(themeName);

  return {
    ...core,
    ...buildThemeLayoutE2eHelpers(core),
  };
}
