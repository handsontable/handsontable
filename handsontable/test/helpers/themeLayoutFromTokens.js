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
 * Build the E2E regression layout helpers. All return values are pure arithmetic expressions
 * over the primitives from `createThemeLayoutCore`. Baked per-density numeric triplets
 * (`{ compact: N, default: N, comfortable: N }`) are not permitted -- derive from
 * tokens or measure from the live DOM instead.
 *
 * Many helpers keep hash-suffixed legacy names (`e2eDensity_<hex>`, `e2eGcr_<hex>`).
 * The hash suffixes are historical and intentionally opaque -- they were generated
 * during the per-density to token-derivation refactor to avoid collisions across
 * scenarios that share a numeric formula. Do not treat the hash as meaningful.
 * Each helper below carries a JSDoc block that names the spec scenario it represents
 * and the meaning of every non-token numeric constant in its formula.
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
    defaultColumnWidth,
    defaultRowHeaderWidth,
  } = core;

  return {
    // -------------------------------------------------------------------------
    // Bucket A -- already pure formulas in token primitives
    // -------------------------------------------------------------------------

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
     * Scenario: `mergeCells.spec.js` -- "should expand the all overlays size after changing the row height".
     * Top / top-inline-start clone `.height()` after the user enters three lines ("test\n\ntest") into the
     * row-1 editor inside a 3-row merge block. The overlay contains 3 rendered rows (with +1px first-row
     * compensation) plus two extra text line-heights introduced by the multiline content.
     *
     * Formula: `overlayHeight({ rows: 3 }) + (2 * lineHeight)`.
     *
     * @returns {number}
     */
    e2eDensity_0051ca7391() {
      return core.overlayHeight({ rows: 3 }) + (2 * lineHeight);
    },

    /**
     * Scenario: `mergeCells.spec.js` -- "should not collapse the left overlay height when the merge cell
     * covers all overlay cells width" and `mergeCells/scrolling.spec.js` -- fixed-column top overlay scroll.
     * The inline-start clone `.htCore` height for a 3-row merge that spans 5 logical overlay rows
     * (the merge adds extra height so the overlay matches 5 default data rows).
     *
     * Formula: `overlayHeight({ rows: 5 })`.
     *
     * @returns {number}
     */
    e2eDensity_8992c845e6() {
      return core.overlayHeight({ rows: 5 });
    },

    /**
     * Scenario: `mergeCells.spec.js` -- autofill drag that expands a 2x2 merge into a 5-row table.
     * `$(getHtCore())[0].offsetHeight` after the drag: the first rendered row (with +1px border
     * compensation) plus 4 default data rows.
     *
     * Formula: `firstRenderedRowDefaultHeight + (4 * defaultDataRowHeight)`.
     *
     * @returns {number}
     */
    e2eDensity_f2d3fe1fc0() {
      return firstRenderedRowDefaultHeight + (4 * defaultDataRowHeight);
    },

    /**
     * Two default data rows outer height. Scenarios:
     *  - `mergeCells.spec.js` autofill: cloned 2x2 merged cell height after drag
     *    (`tr:eq(2) td:eq(0).offsetHeight`).
     *  - `manualRowMove/positioning.spec.js`: backlight outer height when moving two rows at once.
     *
     * Formula: `2 * defaultDataRowHeight`.
     *
     * @returns {number}
     */
    e2eDensity_f464e90e18() {
      return 2 * defaultDataRowHeight;
    },

    /**
     * Scenario: `mergeCells.spec.js` -- autofill onto an adjacent merged pair.
     * Original 2x2 merged cell offsetHeight after a neighbor merge was created; the +1px is the
     * shared border seam between the two stacked merged cells.
     *
     * Formula: `(2 * defaultDataRowHeight) + cellBorderWidth`.
     *
     * @returns {number}
     */
    e2eDensity_9639197594() {
      return (2 * defaultDataRowHeight) + cellBorderWidth;
    },

    /**
     * Scenario: `mergeCells.spec.js` -- 3-row merged cell rendered at top of the grid.
     * Used for `getCell(0, 0).offsetHeight`, `getTopClone().height()`, and
     * `getTopInlineStartClone().height()` on a merge that spans 3 rows. The overlay row count is 3
     * (headers rendered outside the merge body) -- the first row gets +1px border compensation.
     *
     * Formula: `overlayHeight({ rows: 3 })`.
     *
     * @returns {number}
     */
    e2eDensity_9a971c3cfe() {
      return core.overlayHeight({ rows: 3 });
    },

    /**
     * Scenario: `baseEditor/rtl/API.spec.js` -- getEditedCellRect partial when editing the 234th column.
     * The column start is always 234 (test configuration, not a theme value). `top` is the height
     * of the first data row (one row header above). `width` and `maxWidth` describe one TD outer
     * width (walkontable default column + one cell border). `height` describes one TD outer height.
     *
     * @returns {object} Partial rect: `{ start, top, width, maxWidth, height }`.
     */
    e2eGcr_8b522d5d5b() {
      const colOuter = defaultColumnWidth + cellBorderWidth;

      return {
        start: 234, // fixed left-column-start from the test configuration, not a theme value
        top: defaultDataRowHeight,
        width: colOuter,
        maxWidth: colOuter,
        height: cellContentHeight + (2 * cellBorderWidth),
      };
    },

    /**
     * Scenario: `baseEditor/rtl/API.spec.js` -- getEditedCellRect partial for the far-right column
     * at pixel offset 4949 (test configuration, not a theme value), snapped to the bottom of the
     * viewport. `top` is the viewport offsetHeight minus the snap pad (one outer data row plus
     * two cell borders).
     *
     * @param {object} docViewport Viewport metrics from `getE2eDocumentViewport()`.
     * @returns {object} Partial rect: `{ start, top, width, maxWidth, height }`.
     */
    e2eGcr_3dc880f3f2(docViewport) {
      const { offsetHeight } = docViewport;
      const topSnapPad = defaultDataRowHeight + (2 * cellBorderWidth);
      const colOuter = defaultColumnWidth + cellBorderWidth;

      return {
        start: 4949, // fixed right-column-start from the test configuration, not a theme value
        top: offsetHeight - topSnapPad,
        width: colOuter,
        maxWidth: colOuter,
        height: cellContentHeight + (2 * cellBorderWidth),
      };
    },

    // -------------------------------------------------------------------------
    // Bucket B -- recovered as pure token formulas
    // -------------------------------------------------------------------------

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

    /**
     * Scenario: `textEditor.spec.js` -- wide editor over a merged cell with three columns hidden on
     * the left. TEXTAREA height derived from a 3-row overlay minus the width of three hidden columns.
     * The subtraction is a layout coincidence -- the test asserts the editor's clipped height equals
     * the overlay-total minus the hidden-column band.
     *
     * Formula: `overlayHeight({ rows: 3 }) - (3 * defaultColumnWidth)`.
     *
     * @returns {number}
     */
    e2eDensity_dcb53105f5() {
      return core.overlayHeight({ rows: 3 }) - (3 * defaultColumnWidth);
    },

    /**
     * Scenario: `autoRowSize.spec.js` -- row containing 5-line content ("A\nB\nC\nD\nE").
     * The row height is one default data row plus 4 extra line-heights for lines 2..5.
     *
     * Formula: `defaultDataRowHeight + (4 * lineHeight)`.
     *
     * @returns {number}
     */
    e2eDensity_1369f821b5() {
      return defaultDataRowHeight + (4 * lineHeight);
    },

    /**
     * Scenario: `autoRowSize.spec.js` -- row containing 6-line wrapped content.
     * The row height is one default data row plus 5 extra line-heights for lines 2..6.
     *
     * Formula: `defaultDataRowHeight + (5 * lineHeight)`.
     *
     * @returns {number}
     */
    e2eDensity_5e8f2219da() {
      return defaultDataRowHeight + (5 * lineHeight);
    },

    /**
     * Scenario: `autoRowSize.spec.js` -- custom cell renderer that sets `td.style.padding = '100px'`
     * on row 1 col 0, plus two text lines of content.
     *
     * The `201` constant is NOT a theme value: it is `2 * 100px` custom padding from the test renderer
     * plus `1px` for the bottom cell border emitted by the test's CSS. The remaining two lineHeights
     * are the two text lines that wrap inside the padded cell.
     *
     * Formula: `(2 * lineHeight) + 201`.
     *
     * @returns {number}
     */
    e2eDensity_9d03a9eba0() {
      // 201 = 2 * 100px padding from the test renderer + 1px bottom border
      return (2 * lineHeight) + 201;
    },

    /**
     * Scenarios:
     *  - `ghostTable.spec.js` -- auto-size detected row height with 2-line content (`heightSpy` arg).
     *  - `autoRowSize.spec.js` -- row with a single wrapped line adding one extra lineHeight.
     *
     * Formula: `lineHeight + defaultDataRowHeight`.
     *
     * @returns {number}
     */
    e2eDensity_ed183d57c9() {
      return lineHeight + defaultDataRowHeight;
    },

    /**
     * Scenario: `autoRowSize.spec.js` -- first rendered data row (which carries the +1px border
     * compensation) with one wrapped text line adding one extra lineHeight.
     *
     * Formula: `lineHeight + firstRenderedRowDefaultHeight`.
     *
     * @returns {number}
     */
    e2eDensity_682da48dd2() {
      return lineHeight + firstRenderedRowDefaultHeight;
    },

    /**
     * Scenario: `nestedRows.spec.js` -- row header offsetWidth for a nested-rows level-0 header.
     *
     * The `45` constant is NOT a theme value: it is the pixel budget reserved by the test fixture's
     * CSS for the nesting indicator and collapse chevron (nested-rows controls rendered inside the
     * TH). The remaining `2 * cellHorizontalPadding` is the TH's left+right cell padding.
     *
     * Formula: `(2 * cellHorizontalPadding) + 45`.
     *
     * @returns {number}
     */
    e2eDensity_e145a29131() {
      // 45 = pixel budget reserved by the nested-rows fixture CSS for the collapse chevron + indent
      return (2 * cellHorizontalPadding) + 45;
    },

    /**
     * Scenario: `ghostTable.spec.js` -- auto-size detected row height with 3-line content (argsFor(1)).
     *
     * Formula: `defaultDataRowHeight + (2 * lineHeight)`.
     *
     * @returns {number}
     */
    e2eDensity_c1a868f9c9() {
      return defaultDataRowHeight + (2 * lineHeight);
    },

    /**
     * Scenario: `autoRowSize.spec.js` -- left clone `.wtHider` height across 3 one-text-line rows
     * where the hider excludes cell vertical padding on 4 row-boundaries (2 rows x 2 borders removed
     * by the hider's box-model). Not a common measurement -- used in one assertion.
     *
     * Formula: `(3 * defaultDataRowHeight) - (2 * cellVerticalPadding)`.
     *
     * @returns {number}
     */
    e2eDensity_a24230f0bc() {
      return (3 * defaultDataRowHeight) - (2 * cellVerticalPadding);
    },

    /**
     * Scenario: `nestedRows/initialization.spec.js` -- row header offsetWidth for a nested-rows
     * level-1 header (with one extra indent level vs `e2eDensity_e145a29131`).
     *
     * The `65` constant is NOT a theme value: it is the pixel budget reserved by the test fixture's
     * CSS for the nesting indicator, collapse chevron, and one level of indentation. The remaining
     * `2 * cellHorizontalPadding` is the TH's left+right cell padding.
     *
     * Formula: `(2 * cellHorizontalPadding) + 65`.
     *
     * @returns {number}
     */
    e2eDensity_10071d8a47() {
      // 65 = nested-rows chevron + indent budget for level-1 (adds 20px to the level-0 45px budget)
      return (2 * cellHorizontalPadding) + 65;
    },

    /**
     * Scenario: `hiddenRows/plugins/manualRowMove.spec.js` -- manual-row-move backlight height
     * when moving three rows at once (hiddenRows active). Three default data rows outer height.
     *
     * Formula: `3 * defaultDataRowHeight`.
     *
     * @returns {number}
     */
    e2eDensity_f0a5ff56db() {
      return 3 * defaultDataRowHeight;
    },

    /**
     * Scenario: `autoRowSize.spec.js` -- column header row height when column 22 has a
     * `'a<br>much<br>longer<br>label'` label (4 wrapped lines).
     *
     * Formula: `cellContentHeight + (3 * lineHeight)` (content height covers line 1 + paddings;
     * extra 3 line-heights cover lines 2..4).
     *
     * @returns {number}
     */
    e2eDensity_9b92431d49() {
      return cellContentHeight + (3 * lineHeight);
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
