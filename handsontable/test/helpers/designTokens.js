/**
 * Design token resolver for E2E tests.
 *
 * Reads the auto-generated token files and resolves all references so that
 * tests can calculate expected dimensions from design tokens instead of
 * using hardcoded magic numbers.
 *
 * Token resolution chain:
 *   tokens.cellVerticalPadding → density.cellVertical → sizing.size_1 → 4 (px)
 *
 * Many `calcE2e*` helpers express Chromium measurements as [[calcRowHeight]], [[calcColHeaderHeight]],
 * or [[getTokenValue]] plus a small per-theme **fixture delta** (layout/browser, not in Figma tokens).
 */
import sizing from '../../src/themes/static/variables/sizing';
import density from '../../src/themes/static/variables/density';
import mainTokens from '../../src/themes/static/variables/tokens/main';
import classicTokens from '../../src/themes/static/variables/tokens/classic';
import horizonTokens from '../../src/themes/static/variables/tokens/horizon';
import { getLoadedTheme } from './common';

// ── Raw token data per theme ────────────────────────────────────────────────

const THEME_TOKENS = {
  main: mainTokens,
  classic: classicTokens,
  horizon: horizonTokens,
};

const THEME_DENSITY = {
  main: 'default',
  classic: 'compact',
  horizon: 'comfortable',
};

// ── Reference resolution ────────────────────────────────────────────────────

/**
 * Parse a pixel string like '14px' to a number. Returns the input if it's
 * already a number or can't be parsed.
 *
 * @param {string|number} value The value to parse.
 * @returns {number} The numeric value.
 */
function parsePx(value) {
  if (typeof value === 'number') { return value; }
  if (typeof value === 'string' && value.endsWith('px')) {
    return Number(value.slice(0, -2));
  }

  return Number(value);
}

/**
 * Resolve a sizing reference like 'sizing.size_1' to its numeric px value.
 *
 * @param {string} ref The sizing reference.
 * @returns {number} The resolved pixel value.
 */
function resolveSizing(ref) {
  const key = ref.replace('sizing.', '');

  return parsePx(sizing[key]);
}

/**
 * Resolve a density reference like 'density.cellVertical' for a given
 * density level (default, compact, comfortable).
 *
 * @param {string} ref The density reference.
 * @param {string} level The density level.
 * @returns {number} The resolved pixel value.
 */
function resolveDensity(ref, level) {
  const key = ref.replace('density.', '');
  const rawValue = density[level][key];

  if (typeof rawValue === 'string' && rawValue.startsWith('sizing.')) {
    return resolveSizing(rawValue);
  }

  return parsePx(rawValue);
}

/**
 * Resolve any token reference to a numeric pixel value for a given theme.
 *
 * Handles chained references: tokens.X → density.Y → sizing.Z → Npx.
 *
 * @param {string} ref The reference string (e.g. 'sizing.size_1', 'density.cellVertical', 'tokens.cellVerticalPadding').
 * @param {string} themeName The theme name (main, classic, horizon).
 * @returns {number} The resolved pixel value.
 */
function resolveRef(ref, themeName) {
  if (typeof ref === 'number') { return ref; }
  if (typeof ref !== 'string') { return NaN; }

  if (ref.startsWith('sizing.')) {
    return resolveSizing(ref);
  }

  if (ref.startsWith('density.')) {
    return resolveDensity(ref, THEME_DENSITY[themeName]);
  }

  if (ref.startsWith('tokens.')) {
    const key = ref.replace('tokens.', '');

    return resolveToken(key, themeName);
  }

  return parsePx(ref);
}

/**
 * Resolve a single token key to a numeric value for a given theme.
 *
 * @param {string} key The token key (e.g. 'cellVerticalPadding').
 * @param {string} themeName The theme name.
 * @returns {number} The resolved pixel value.
 */
function resolveToken(key, themeName) {
  const tokens = THEME_TOKENS[themeName];
  const value = tokens[key];

  if (value === undefined) { return NaN; }

  // Array values are [light, dark] — use light for dimension calculations.
  if (Array.isArray(value)) {
    return resolveRef(value[0], themeName);
  }

  return resolveRef(value, themeName);
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Get a resolved numeric token value for a specific theme.
 *
 * @param {string} key Token key (e.g. 'lineHeight', 'cellVerticalPadding').
 * @param {string} themeName Theme name (main, classic, horizon).
 * @returns {number} Resolved pixel value.
 */
export function getTokenValue(key, themeName) {
  return resolveToken(key, themeName);
}

/**
 * Get a resolved numeric token value for the currently loaded theme.
 *
 * @param {string} key Token key (e.g. 'lineHeight', 'fontSize').
 * @returns {number} Resolved pixel value.
 */
export function token(key) {
  return resolveToken(key, getLoadedTheme());
}

/**
 * Get resolved token values for all three themes at once.
 * Useful with `.forThemes()`.
 *
 * @param {string} key Token key.
 * @returns {{ classic: number, main: number, horizon: number }}
 */
export function tokenForThemes(key) {
  return {
    classic: resolveToken(key, 'classic'),
    main: resolveToken(key, 'main'),
    horizon: resolveToken(key, 'horizon'),
  };
}

/**
 * Calculate the default row height for a theme from design tokens.
 *
 * Formula: lineHeight + (cellVerticalPadding * 2) + 1px border
 *
 * @param {string} [themeName] Theme name. Defaults to the loaded theme.
 * @returns {number} Row height in pixels.
 */
export function calcRowHeight(themeName) {
  const theme = themeName || getLoadedTheme();
  const lineHeight = resolveToken('lineHeight', theme);
  const cellVertical = resolveToken('cellVerticalPadding', theme);

  return lineHeight + (cellVertical * 2) + 1; // +1 for bottom border
}

/**
 * Calculate the default column header height for a theme from design tokens.
 *
 * Formula: lineHeight + (cellVerticalPadding * 2)
 *
 * @param {string} [themeName] Theme name. Defaults to the loaded theme.
 * @returns {number} Column header height in pixels.
 */
export function calcColHeaderHeight(themeName) {
  const theme = themeName || getLoadedTheme();
  const lineHeight = resolveToken('lineHeight', theme);
  const cellVertical = resolveToken('cellVerticalPadding', theme);

  return lineHeight + (cellVertical * 2);
}

/**
 * Calculate values for all themes. Returns an object with classic/main/horizon
 * keys, each holding the result of the callback.
 *
 * @param {Function} fn A function that receives (themeName) and returns a number.
 * @returns {{ classic: number, main: number, horizon: number }}
 */
export function forAllThemes(fn) {
  return {
    classic: fn('classic'),
    main: fn('main'),
    horizon: fn('horizon'),
  };
}

/**
 * Vertical scrollbar reserve used in E2E scroll math (Walkontable subtracts native scrollbar
 * height from the scrollable viewport). Matches the value used across scroll tests (`18`).
 */
export const E2E_NATIVE_SCROLLBAR_WIDTH = 18;

/**
 * Default outer width (px) of the row-header column in Chromium E2E when `rowHeaders: true`
 * and no explicit `rowHeaderWidth` — used in horizontal scroll snap tests with fixed
 * `colWidths` (see `scrollViewportTo` specs). Not theme-specific in those scenarios.
 */
export const E2E_DEFAULT_ROW_HEADER_OUTER_WIDTH = 66;

/**
 * Horizontal scroll position for "start" snap at column index `colIndex` when all columns
 * share `colWidthPx`.
 *
 * @param {number} colIndex Zero-based column index.
 * @param {number} colWidthPx Column width in pixels.
 * @returns {number} Scroll offset in pixels.
 */
export function calcHorizontalScrollStartSnap(colIndex, colWidthPx) {
  return colIndex * colWidthPx;
}

/**
 * Horizontal scroll position for "end" snap at column index `colIndex` when all columns
 * share `colWidthPx`, viewport width is `viewportWidthPx`, and row headers occupy
 * `rowHeaderOuterPx` (see {@link E2E_DEFAULT_ROW_HEADER_OUTER_WIDTH}).
 *
 * @param {number} colIndex Zero-based column index.
 * @param {number} colWidthPx Column width in pixels.
 * @param {number} viewportWidthPx Viewport width in pixels.
 * @param {number} [rowHeaderOuterPx=E2E_DEFAULT_ROW_HEADER_OUTER_WIDTH] Row header width.
 * @returns {number} Scroll offset in pixels.
 */
export function calcHorizontalScrollEndSnap(
  colIndex,
  colWidthPx,
  viewportWidthPx,
  rowHeaderOuterPx = E2E_DEFAULT_ROW_HEADER_OUTER_WIDTH,
) {
  return ((colIndex + 1) * colWidthPx) - (viewportWidthPx - rowHeaderOuterPx);
}

/**
 * Vertical scroll for bottom-edge snap: row `targetPhysicalRow` aligned to the bottom of
 * the viewport (same structure as `scrollViewportTo` / `scrollToFocusedCell` E2E tests).
 *
 * @param {number} targetPhysicalRow Target physical row index.
 * @param {number} viewportHeightPx Viewport height in pixels.
 * @param {string} themeName Theme name.
 * @param {number} [firstVisiblePhysicalRow=0] First physical row index that is visible (use when
 *   leading rows are hidden so scroll math uses `targetPhysicalRow - firstVisiblePhysicalRow`).
 * @returns {number} Top overlay scroll position in pixels.
 */
export function calcTopOverlayBottomSnapScroll(
  targetPhysicalRow,
  viewportHeightPx,
  themeName,
  firstVisiblePhysicalRow = 0,
) {
  const rh = calcRowHeight(themeName);
  const ch = calcColHeaderHeight(themeName);
  const effectiveRow = targetPhysicalRow - firstVisiblePhysicalRow;

  return (effectiveRow * rh) - (viewportHeightPx - ch - E2E_NATIVE_SCROLLBAR_WIDTH - rh);
}

/**
 * Client height for a cell in an overlay when `modifyRowHeightByOverlayName` forces `hookPx`
 * and the DOM uses `max(hookPx, calcRowHeight) - 2` (top / top-corner overlays).
 *
 * @param {number} hookPx Height from the hook in pixels.
 * @param {string} themeName Theme name.
 * @returns {number} Expected clientHeight in pixels.
 */
export function calcModifyRowHeightHookOverlayClientHeight(hookPx, themeName) {
  return Math.max(hookPx, calcRowHeight(themeName)) - 2;
}

/**
 * Client height when the hook sets a height larger than `calcRowHeight` (bottom overlays).
 *
 * @param {number} hookPx Height from the hook in pixels.
 * @returns {number} Expected clientHeight in pixels.
 */
export function calcModifyRowHeightHookFixedClientHeight(hookPx) {
  return hookPx - 2;
}

/**
 * Outer height (px) of a merged cell spanning `rowspan` default-sized data rows. Each row uses
 * [[calcRowHeight]]; the `+1` matches the bottom border on the merged TD in E2E/DOM measurements.
 *
 * @param {number} rowspan Number of spanned rows.
 * @param {string} themeName Theme name.
 * @returns {number} Merged cell offset height in pixels.
 */
export function calcMergedCellBlockHeight(rowspan, themeName) {
  return (rowspan * calcRowHeight(themeName)) + 1;
}

/**
 * Total height (px) of `rowCount` default-sized data rows in the master `.htCore` (sum of row
 * heights plus one pixel for the table bottom edge in the same tests).
 *
 * @param {number} rowCount Number of data rows.
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcTotalDataRowsHeight(rowCount, themeName) {
  return (rowCount * calcRowHeight(themeName)) + 1;
}

/**
 * First body row outer height in E2E/DOM (`getRowHeight(0)`) — default row token height plus 1px
 * (table / first-row edge), matching `autoRowSize` merge specs.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcFirstBodyRowHeight(themeName) {
  return calcRowHeight(themeName) + 1;
}

/**
 * Second autofill-merge in the same spec (row index &gt; 0): DOM omits the extra bottom pixel
 * compared to [[calcMergedCellBlockHeight]] for rowspan 2.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcAutofillMergedRowspan2SecondaryHeight(themeName) {
  return calcMergedCellBlockHeight(2, themeName) - 1;
}

// ── E2E AutoColumnSize / AutoRowSize / manual resize fixtures (Chromium measurements) ──

/**
 * Default column width (px) when `colWidths` is unset — matches [[metaSchema]] (`50`).
 */
const HANDSONTABLE_DEFAULT_COLUMN_WIDTH_PX = 50;

/**
 * E2E outer dimension: [[calcColHeaderHeight]] plus per-theme Chromium margin (not a raw token).
 *
 * @param {string} themeName Theme name.
 * @param {{ classic: number, main: number, horizon: number }} deltaPx Delta per theme.
 * @returns {number} Pixels.
 */
function e2eColHeaderOuterPlus(themeName, deltaPx) {
  return calcColHeaderHeight(themeName) + deltaPx[themeName];
}

/**
 * E2E outer dimension: [[calcRowHeight]] plus per-theme Chromium margin.
 *
 * @param {string} themeName Theme name.
 * @param {{ classic: number, main: number, horizon: number }} deltaPx Delta per theme.
 * @returns {number} Pixels.
 */
function e2eRowOuterPlus(themeName, deltaPx) {
  return calcRowHeight(themeName) + deltaPx[themeName];
}

/**
 * Minimum master cell outer width (px) in `colWidth()` E2E when autoColumnSize hits theme minimum.
 * Base is [[HANDSONTABLE_DEFAULT_COLUMN_WIDTH_PX]]; delta uses horizontal cell padding vs classic plus a Horizon-only E2E adjustment.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Outer width in pixels.
 */
export function calcE2eMinMasterCellOuterWidth(themeName) {
  const pad = getTokenValue('cellHorizontalPadding', themeName);
  const padClassic = getTokenValue('cellHorizontalPadding', 'classic');
  const horizonExtraPx = themeName === 'horizon' ? 4 : 0;

  return HANDSONTABLE_DEFAULT_COLUMN_WIDTH_PX + (pad - padClassic) + horizonExtraPx;
}

/**
 * `arrayOfObjects` fixture — "name" column outer width after autoColumnSize.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Outer width in pixels.
 */
export function calcE2eAutoColumnArrayOfObjectsNameOuterWidth(themeName) {
  return { classic: 104, main: 115, horizon: 123 }[themeName];
}

/**
 * `arrayOfObjects` fixture — "lastName" column outer width after autoColumnSize.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Outer width in pixels.
 */
export function calcE2eAutoColumnArrayOfObjectsLastNameOuterWidth(themeName) {
  return { classic: 192, main: 210, horizon: 218 }[themeName];
}

/**
 * Long "Identifier…" header — column 0 outer width (autoColumnSize with colHeaders).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Outer width in pixels.
 */
export function calcE2eAutoColumnLongIdentifierHeaderOuterWidth(themeName) {
  return { classic: 133, main: 146, horizon: 154 }[themeName];
}

/**
 * "Short" / "Longer" middle column outer width (insert column + header labels fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Outer width in pixels.
 */
export function calcE2eAutoColumnInsertShortHeaderOuterWidth(themeName) {
  return { classic: 55, main: 62, horizon: 70 }[themeName];
}

/**
 * "The longest header" column outer width (insert column fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Outer width in pixels.
 */
export function calcE2eAutoColumnInsertLongestHeaderOuterWidth(themeName) {
  return { classic: 127, main: 139, horizon: 147 }[themeName];
}

/**
 * Top clone hider width (autoColumnSize + samples fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eAutoColumnCloneTopHiderOuterWidth(themeName) {
  return { classic: 129, main: 138, horizon: 146 }[themeName];
}

/**
 * HyperFormula checkbox column outer width after boolean cell (autoColumnSize fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Outer width in pixels.
 */
export function calcE2eAutoColumnHyperFormulaCheckboxColOuterWidth(themeName) {
  return { classic: 133, main: 151, horizon: 161 }[themeName];
}

/**
 * `units` sampling column outer width (same-length cell values fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Outer width in pixels.
 */
export function calcE2eAutoColumnUnitsSamplingOuterWidth(themeName) {
  return { classic: 82, main: 91, horizon: 99 }[themeName];
}

/**
 * Column 0 outer width after long cell value update (`foo bar…` fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Outer width in pixels.
 */
export function calcE2eAutoColumnAfterLongIdCellUpdateOuterWidth(themeName) {
  return { classic: 143, main: 157, horizon: 165 }[themeName];
}

/**
 * Column 0 outer width after `columns.title` update to longer text.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Outer width in pixels.
 */
export function calcE2eAutoColumnTitleLongTextOuterWidth(themeName) {
  return { classic: 155, main: 170, horizon: 178 }[themeName];
}

/**
 * Horizontal scroll after `scrollViewportTo(0, 49)` with autoColumnSize (#dev-1888).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Scroll position in pixels.
 */
export function calcE2eAutoColumnSizeDev1888InlineStartScroll(themeName) {
  return { classic: 2235, main: 2322, horizon: 2575 }[themeName];
}

/**
 * Vertical scroll after `scrollViewportTo(49, 0)` with autoRowSize (#dev-1888).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Scroll position in pixels.
 */
export function calcE2eAutoRowSizeDev1888TopOverlayScroll(themeName) {
  return { classic: 984, main: 1135, horizon: 1543 }[themeName];
}

/**
 * Inline start / master overlay `scrollTop` after editing (#7102 sync fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Scroll position in pixels.
 */
export function calcE2eAutoRowSize7102OverlayScrollTop(themeName) {
  return { classic: 215, main: 216, horizon: 264 }[themeName];
}

/**
 * Checkbox column autoRowSize — first data row outer height (#dev-1926).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eCheckboxAutoRowSizeFirstDataRowOuterHeight(themeName) {
  return e2eColHeaderOuterPlus(themeName, { classic: 6, main: 7, horizon: 7 });
}

/**
 * Checkbox column autoRowSize — following data row outer height (#dev-1926).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eCheckboxAutoRowSizeFollowingDataRowOuterHeight(themeName) {
  return e2eColHeaderOuterPlus(themeName, { classic: 5, main: 6, horizon: 6 });
}

/**
 * Row header `.height()` with multi-line label (manualRowResize fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eManualRowResizeMultilineRowHeaderLabelHeight(themeName) {
  return { classic: 46, main: 48, horizon: 56 }[themeName];
}

/**
 * Default resized row header outer height in inline start clone (manualRowResize drag fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eManualRowResizeResizedRowHeaderOuterHeight(themeName) {
  return calcRowHeight(themeName) + 29;
}

/**
 * Inline start clone — first row header height after multi-row selection resize (manualRowResize).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eManualRowResizeMergedRowHeaderFirstOuterHeight(themeName) {
  return calcRowHeight(themeName) + 28;
}

/**
 * Inline start clone row-header `.height()` after narrowing multi-selected rows (manualRowResize
 * contiguous selection test). The spec uses a fixed `+ 35` in `mousemove` for all themes; Horizon
 * still reports `36`px on the row header in Chromium E2E.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eManualRowResizeMultiSelectNarrowedRowHeaderHeight(themeName) {
  return { classic: 35, main: 35, horizon: 36 }[themeName];
}

/**
 * `arrayOfObjects` fixture — row 1 outer height (multiline "Somewhat long").
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eAutoRowSizeArrayOfObjectsRow1OuterHeight(themeName) {
  return { classic: 47, main: 49, horizon: 57 }[themeName];
}

/**
 * Utils GhostTable `getHeights` — row with multiline sample `Foo\\nBar\\nsqw` (`ghostTable.spec.js`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eUtilsGhostTableMultilineFooBarSqwRowHeight(themeName) {
  return { classic: 68, main: 69, horizon: 77 }[themeName];
}

/**
 * `arrayOfObjects` fixture — row 2 outer height (long multiline cell).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eAutoRowSizeArrayOfObjectsRow2OuterHeight(themeName) {
  return { classic: 131, main: 129, horizon: 137 }[themeName];
}

/**
 * Inline start clone hider height (`Tomek` / multiline cell count height fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eAutoRowSizeTomekCloneLeftHiderHeight(themeName) {
  return { classic: 74, main: 79, horizon: 95 }[themeName];
}

/**
 * Manual column resize — default column header label width (first header cell, narrow fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeHeaderLabelOuterWidth(themeName) {
  return e2eColHeaderOuterPlus(themeName, { classic: 4, main: 7, horizon: 7 });
}

/**
 * Manual column resize — merged / wide header cell width (`118` px fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeMergedHeaderOuterWidth(themeName) {
  return { classic: 118, main: 118, horizon: 118 }[themeName];
}

/**
 * Manual column resize — RTL wide header cell width fixture.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeRtlHeaderOuterWidth(themeName) {
  return { classic: 78, main: 87, horizon: 95 }[themeName];
}

/**
 * Manual column resize — `beforeColumnResize` / `afterColumnResize` column width (index 0 fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeCallbackCol0OuterWidth(themeName) {
  return e2eColHeaderOuterPlus(themeName, { classic: 5, main: 8, horizon: 8 });
}

/**
 * Manual column resize — neighbor column width after resize (index 1 / 3 fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeCallbackNeighborOuterWidth(themeName) {
  return e2eRowOuterPlus(themeName, { classic: 5, main: 7, horizon: 7 });
}

/**
 * Manual column resize — top clone `th` width (hidden columns fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeTopCloneThOuterWidth(themeName) {
  return { classic: 79, main: 79, horizon: 81 }[themeName];
}

/**
 * Manual column resize — triple-click header cell width (`34` / `35` px fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeTripleClickHeaderWidth(themeName) {
  return { classic: 34, main: 34, horizon: 35 }[themeName];
}

/**
 * Manual column resize — stretched header width after triple-click (`155` / `156` px fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeStretchedHeaderWidth(themeName) {
  return { classic: 155, main: 155, horizon: 156 }[themeName];
}

/**
 * Top overlay scroll after `scrollViewportVertically(6 * defaultRowHeight)` and `selectRows(19, 0)` (row header selection).
 * Matches `8 * calcRowHeight + E2E_NATIVE_SCROLLBAR_WIDTH` in Chromium E2E.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Scroll position in pixels.
 */
export function calcE2eRowHeaderSelectionLastToFirstScrollTop(themeName) {
  return (8 * calcRowHeight(themeName)) + E2E_NATIVE_SCROLLBAR_WIDTH;
}

/**
 * Row header outer height when `rowHeights` is fixed to 70px for all rows (autoRowSize + colWidths fixture).
 *
 * @returns {number} Height in pixels.
 */
export function calcE2eAutoRowSizeFixedRowHeaderOuterHeightPx() {
  return 70;
}

/**
 * Row 1 cell height after renderer applies `padding: 100px` (autoRowSize conditional renderer fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eAutoRowSizeRendererPaddingRow1OuterHeight(themeName) {
  return { classic: 243, main: 241, horizon: 241 }[themeName];
}

/**
 * Row 2 row-header height after column resize to 90px (autoRowSize + manualColumnResize fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eAutoRowSizeAfterResize90Row2HeaderOuterHeight(themeName) {
  return { classic: 68, main: 89, horizon: 97 }[themeName];
}

/**
 * Row 0 row-header height before `manualColumnMove` (narrow column 250/50 fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eAutoRowSizeColumnMoveInitialRow0HeaderOuterHeight(themeName) {
  return { classic: 48, main: 50, horizon: 58 }[themeName];
}

/**
 * Row 1 row-header height — narrow column move fixture, or multiline text in row 1 (`A\\nB\\n…`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eAutoRowSizeColumnMoveInitialRow1HeaderOuterHeight(themeName) {
  return { classic: 110, main: 109, horizon: 117 }[themeName];
}

/**
 * Configured manual row height for middle row (`manualRowResize: [23, 50]` fixture) on row header.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eManualRowResizeConfiguredMiddleRowHeaderOuterHeight(themeName) {
  return { classic: 50, main: 50, horizon: 50 }[themeName];
}

/**
 * Hidden column 0 width with `hiddenColumns` + autoColumnSize (`arrayOfObjects` fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eAutoColumnHiddenColumnsCol0OuterWidth(themeName) {
  return { classic: 65, main: 67, horizon: 75 }[themeName];
}

/**
 * Hidden column 1 width (visible `lastName` column) with `hiddenColumns` + autoColumnSize.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eAutoColumnHiddenColumnsCol1OuterWidth(themeName) {
  return { classic: 207, main: 225, horizon: 233 }[themeName];
}

/**
 * Column 0 width with `modifyAutoColumnSizeSeed` (language code seed fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eAutoColumnModifySeedOuterWidth(themeName) {
  return { classic: 162, main: 177, horizon: 185 }[themeName];
}

/**
 * Numeric formula column width — short result (`=A*500` fixture, initial data).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eAutoColumnFormulaShortNumericColWidth(themeName) {
  return { classic: 50, main: 50, horizon: 58 }[themeName];
}

/**
 * Numeric formula column width — long result (`999999999999` cell fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eAutoColumnFormulaLongNumericColWidth(themeName) {
  return { classic: 123, main: 135, horizon: 143 }[themeName];
}

/**
 * Numeric formula column width — medium cell value (`999` fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eAutoColumnFormulaMediumNumericColWidth(themeName) {
  return { classic: 58, main: 65, horizon: 73 }[themeName];
}

/**
 * Numeric formula column width — error cell (`not a number` fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eAutoColumnFormulaErrorColWidth(themeName) {
  return { classic: 67, main: 75, horizon: 83 }[themeName];
}

/**
 * Manual column resize + nested headers — wide header cells after double-click autosize (stretchH `all` fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeNestedHeadersStretchAllCol0OuterWidth(themeName) {
  return { classic: 220, main: 219, horizon: 217 }[themeName];
}

/**
 * Manual column resize + nested headers — narrow header cell after autosize (column index 1).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeNestedHeadersStretchAllCol1OuterWidth(themeName) {
  return { classic: 22, main: 27, horizon: 35 }[themeName];
}

/**
 * Manual column resize + nested headers — wide header cells (column index 2 or 3).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeNestedHeadersStretchWideColOuterWidth(themeName) {
  return { classic: 221, main: 220, horizon: 218 }[themeName];
}

/**
 * Manual column resize + nested headers — last wide column (index 4).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeNestedHeadersStretchAllCol4OuterWidth(themeName) {
  return { classic: 220, main: 218, horizon: 216 }[themeName];
}

/**
 * Manual column resize + `stretchH: 'last'` — uniform header cell width (`48` / `49` px fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeStretchLastUniformHeaderWidth(themeName) {
  return { classic: 48, main: 48, horizon: 48 }[themeName];
}

/**
 * Manual column resize + `stretchH: 'last'` — slightly wider header cell (`49` px fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeStretchLastWideHeaderWidth(themeName) {
  return { classic: 49, main: 49, horizon: 49 }[themeName];
}

/**
 * Contiguous column selection resize — default column outer width.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeContiguousDefaultColOuterWidth(themeName) {
  return { classic: 50, main: 50, horizon: 52 }[themeName];
}

/**
 * Contiguous column selection resize — stretched column outer width.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeContiguousStretchedColOuterWidth(themeName) {
  return { classic: 80, main: 80, horizon: 82 }[themeName];
}

/**
 * Contiguous column selection resize — horizon theme edge column outer width.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeContiguousHorizonEdgeColOuterWidth(themeName) {
  return { classic: 50, main: 50, horizon: 53 }[themeName];
}

/**
 * Non-contiguous column selection resize — stretched column outer width.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeNonContiguousStretchedColOuterWidth(themeName) {
  return { classic: 80, main: 80, horizon: 81 }[themeName];
}

/**
 * Non-contiguous column selection resize — narrow horizon column outer width.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeNonContiguousNarrowHorizonColOuterWidth(themeName) {
  return { classic: 50, main: 50, horizon: 51 }[themeName];
}

/**
 * Nested headers + manual column resize — column width after mousemove resize (nestedHeaders resizingColumns fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eNestedHeadersColumnResizeCol1OuterWidth(themeName) {
  return e2eColHeaderOuterPlus(themeName, { classic: 1, main: 7, horizon: 7 });
}

/**
 * NestedHeaders GhostTable `widthsMap` — repeated "Very Long Title" header, columns 0–1 (`width: 300` fixture).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Expected center width for `toBeAroundValue` in Chromium E2E.
 */
export function calcE2eNestedHeadersGhostTableVeryLongTitleWidthCol01(themeName) {
  return { classic: 100, main: 110, horizon: 117 }[themeName];
}

/**
 * NestedHeaders GhostTable `widthsMap` — same fixture, columns 2–6 (classic/horizon differ by 1px from columns 0–1).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Expected center width for `toBeAroundValue` in Chromium E2E.
 */
export function calcE2eNestedHeadersGhostTableVeryLongTitleWidthColRest(themeName) {
  return { classic: 99, main: 110, horizon: 118 }[themeName];
}

/**
 * Dropdown editor embedded Handsontable list — base client width before vertical scrollbar reserve
 * (`colWidths: 120`, long `source` / `visibleRows` fixtures). Width with scrollbar is this value plus
 * `Handsontable.dom.getScrollbarWidth()`.
 *
 * @returns {number} Width in pixels.
 */
export function calcE2eDropdownEditorEmbeddedListBaseClientWidth() {
  return 118;
}

/**
 * Dropdown editor `htContainer` client width when the list has no scrollbar (`visibleRows: 5`, short source).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eDropdownEditorNoScrollbarContainerClientWidth(themeName) {
  return { classic: 118, main: 118, horizon: 133 }[themeName];
}

/**
 * Dropdown editor `htContainer` client height when the list has no scrollbar (`visibleRows: 5`, short source).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eDropdownEditorNoScrollbarContainerClientHeight(themeName) {
  return { classic: 131, main: 146, horizon: 148 }[themeName];
}

/**
 * Dropdown editor `htContainer` client height when the list shows a vertical scrollbar (`visibleRows: 3`, long source).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eDropdownEditorScrollbarListContainerClientHeight(themeName) {
  return { classic: 79, main: 88, horizon: 112 }[themeName];
}

/**
 * Dropdown editor `htContainer` client height when both the list and the host table scroll
 * (`height: 100`, `visibleRows: 3`, long source).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eDropdownEditorScrollbarListAndHostTableContainerClientHeight(themeName) {
  return { classic: 52, main: 58, horizon: 37 }[themeName];
}

/**
 * Handsontable editor embedded instance `htContainer` client size (`colWidths: 120`, manufacturer data, `autoColumnSize: true`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eHandsontableEditorEmbeddedContainerClientWidth(themeName) {
  return { classic: 324, main: 357, horizon: 381 }[themeName];
}

/**
 * Handsontable editor embedded instance `htContainer` client height (same fixture as
 * [[calcE2eHandsontableEditorEmbeddedContainerClientWidth]]).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Height in pixels.
 */
export function calcE2eHandsontableEditorEmbeddedContainerClientHeight(themeName) {
  return { classic: 188, main: 213, horizon: 273 }[themeName];
}

/**
 * StretchColumns — `width: 320`, `stretchH: 'all'`, after `insert_col_end` (three equal stretched columns).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Column width in pixels.
 */
export function calcE2eStretchColumnsWidth320InsertEndThreeColsStretchAll(themeName) {
  return { classic: 90, main: 90, horizon: 85 }[themeName];
}

/**
 * StretchColumns — `width: 320`, `stretchH: 'all'`, after `insert_col_start` (body columns, not last).
 * The same Chromium widths apply to stretched visible columns in `hiddenColumns.spec.js`.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Column width in pixels.
 */
export function calcE2eStretchColumnsWidth320InsertStartFourColsStretchBody(themeName) {
  return { classic: 68, main: 68, horizon: 64 }[themeName];
}

/**
 * StretchColumns — `width: 320`, `stretchH: 'all'`, after `insert_col_start` (last stretched column).
 * The same Chromium widths apply to the last stretched visible column in `hiddenColumns.spec.js`.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Column width in pixels.
 */
export function calcE2eStretchColumnsWidth320InsertStartFourColsStretchLast(themeName) {
  return { classic: 66, main: 66, horizon: 63 }[themeName];
}

/**
 * StretchColumns — `width: 320`, `stretchH: 'all'`, five equal stretched columns (after remove/insert altering).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Column width in pixels.
 */
export function calcE2eStretchColumnsWidth320FiveEqualStretch(themeName) {
  return { classic: 54, main: 54, horizon: 51 }[themeName];
}

/**
 * StretchColumns — `width: 320`, `stretchH: 'all'`, column reorder + `beforeStretchingColumnWidth` (`indexOrder.spec.js`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Column width in pixels.
 */
export function calcE2eStretchColumnsWidth320IndexReorderStretch(themeName) {
  return { classic: 79, main: 79, horizon: 74 }[themeName];
}

/**
 * StretchColumns — `width: 200`, `stretchH: 'all'`, three columns (body / body / last).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Column width in pixels.
 */
export function calcE2eStretchColumnsWidth200StretchAllBody(themeName) {
  return { classic: 67, main: 67, horizon: 62 }[themeName];
}

/**
 * StretchColumns — `width: 200`, `stretchH: 'all'`, last stretched column (three columns).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Column width in pixels.
 */
export function calcE2eStretchColumnsWidth200StretchAllLast(themeName) {
  return { classic: 66, main: 66, horizon: 61 }[themeName];
}

/**
 * StretchColumns — `width: 200`, `stretchH: 'last'`, stretched column.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Column width in pixels.
 */
export function calcE2eStretchColumnsWidth200StretchLast(themeName) {
  return { classic: 100, main: 100, horizon: 85 }[themeName];
}

/**
 * StretchColumns — `width: 500` (after `updateSettings`), `stretchH: 'all'`, three columns.
 *
 * @param {string} themeName Theme name.
 * @returns {number} Column width in pixels.
 */
export function calcE2eStretchColumnsWidth500StretchAllThreeCols(themeName) {
  return { classic: 150, main: 150, horizon: 145 }[themeName];
}

/**
 * StretchColumns — multiline rows, `width: 500`, wide column (`stretchColumns.spec.js`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Column width in pixels.
 */
export function calcE2eStretchColumnsWidth500MultilineWideCol(themeName) {
  return { classic: 412, main: 418, horizon: 420 }[themeName];
}

/**
 * StretchColumns — multiline rows, `width: 500`, narrow column (`stretchColumns.spec.js`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Column width in pixels.
 */
export function calcE2eStretchColumnsWidth500MultilineNarrowCol(themeName) {
  return { classic: 88, main: 82, horizon: 80 }[themeName];
}

/**
 * StretchColumns — `#dev-1727`, `width: 400`, long text in last column (`stretchColumns.spec.js`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Column width in pixels.
 */
export function calcE2eStretchColumnsWidth400Dev1727LongTextCol(themeName) {
  return { classic: 286, main: 311, horizon: 319 }[themeName];
}

/**
 * Utils GhostTable `getWidths` — first column sample (`Foo` / `Foo.....Bar`, `ghostTable.spec.js`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eUtilsGhostTableWidthsSpyCol0(themeName) {
  return { classic: 75, main: 84, horizon: 92 }[themeName];
}

/**
 * Utils GhostTable `getWidths` — second column (multiline `Foo\\nBar\\nsqw`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eUtilsGhostTableWidthsSpyCol1(themeName) {
  return { classic: 38, main: 43, horizon: 51 }[themeName];
}

/**
 * Utils GhostTable `getWidths` — third column (`Foo` / `Foo Bar`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eUtilsGhostTableWidthsSpyCol2(themeName) {
  return { classic: 61, main: 68, horizon: 76 }[themeName];
}

/**
 * HiddenColumns + manual column resize — column width after `+ 30` drag on header (`hiddenColumns` / `manualColumnResize.spec.js`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eHiddenColumnsManualResizeAfterDragColWidth(themeName) {
  return { classic: 86, main: 93, horizon: 101 }[themeName];
}

/**
 * Manual column resize (RTL) — narrowed multi-selected header `outerWidth()` (`rtl/manualColumnResize.spec.js`).
 *
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeRtlNarrowSelectedHeaderOuterWidth() {
  return 20;
}

/**
 * Manual column resize (RTL) — expanded multi-selected header `outerWidth()` (`rtl/manualColumnResize.spec.js`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Width in pixels.
 */
export function calcE2eManualColumnResizeRtlExpandedSelectedHeaderOuterWidth(themeName) {
  return { classic: 196, main: 196, horizon: 198 }[themeName];
}

/**
 * Manual row move scrolling — `scrollTop` lower bound after `scrollViewportTo` bottom snap, before moving above table (`scrolling.spec.js`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Scroll position in pixels.
 */
export function calcE2eManualRowMoveScrollAboveTableBeforeScrollTopGt(themeName) {
  return { classic: 130, main: 185, horizon: 235 }[themeName];
}

/**
 * Manual row move scrolling — `scrollTop` upper bound after moving above table (`scrolling.spec.js`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Scroll position in pixels.
 */
export function calcE2eManualRowMoveScrollAboveTableAfterScrollTopLt(themeName) {
  return { classic: 140, main: 185, horizon: 240 }[themeName];
}

/**
 * Manual row move scrolling — `scrollTop` bound with top overlay rows (`fixedRowsTop: 2`, `scrolling.spec.js`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Scroll position in pixels.
 */
export function calcE2eManualRowMoveScrollTopOverlayCompareBound(themeName) {
  return { classic: 100, main: 100, horizon: 170 }[themeName];
}

/**
 * Manual row move scrolling — `scrollTop` lower bound with top overlay + hidden rows (`scrolling.spec.js`).
 *
 * @param {string} themeName Theme name.
 * @returns {number} Scroll position in pixels.
 */
export function calcE2eManualRowMoveScrollTopOverlayHiddenBeforeScrollTopGt(themeName) {
  return { classic: 50, main: 50, horizon: 85 }[themeName];
}

/**
 * Manual row move — `scrollTop` strict lower bound when viewport should not move (`scrolling.spec.js`).
 *
 * @returns {number} Scroll position in pixels.
 */
export function calcE2eManualRowMoveNoMoveMinScrollTop() {
  return 100;
}
