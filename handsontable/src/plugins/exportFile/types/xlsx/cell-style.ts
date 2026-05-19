import { isDefined } from '../../../../helpers/mixed';

export interface CssStyle {
  fontBold: boolean;
  fontItalic: boolean;
  fontUnderline: boolean;
  fontColor: string | null;
  backgroundColor: string | null;
}

export interface CellMeta {
  className?: string | string[];
  readOnly?: boolean;
  borders?: Record<string, { width: number; color: string }>;
  type?: string;
  source?: unknown[];
  comment?: { value?: unknown };
  numericFormat?: {
    pattern?: string;
    style?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  } | null;
  locale?: string;
  checkedTemplate?: unknown;
  [key: string]: unknown;
}

// Default ARGB colors applied to read-only cells when no explicit styling is set.
// Values match the Handsontable design-system tokens for dimmed/disabled cell state.
const READ_ONLY_BG_ARGB = 'FFF0F0F0';
const READ_ONLY_TEXT_ARGB = 'FF808080';

/**
 * Normalises a cell `className` meta value to a flat array of non-empty class strings.
 * Accepts a space-separated string, an array of strings, or a nullish value.
 *
 * @param {string|string[]|null|undefined} className The cell's `className` meta value.
 * @returns {string[]}
 */
function normalizeClassNames(className: string | string[] | null | undefined): string[] {
  if (Array.isArray(className)) {
    return className.filter(c => typeof c === 'string' && c.length > 0);
  }

  if (typeof className === 'string') {
    return className.split(' ').filter(c => c.length > 0);
  }

  return [];
}

// Per-export cache for detectExplicitBackgroundColor results.
// Keyed by document (WeakMap — avoids leaking document references) then by the
// joined className string. Cleared at the start of each export so CSS rule
// changes between exports are always picked up.
const backgroundColorByDoc = new WeakMap<Document, Map<string, string | null>>();

// Per-export cache for getCssStyleFromProbe results (used when the real cell element
// is not available — i.e. the cell is outside the render viewport).
const cssStyleProbeByDoc = new WeakMap<Document, Map<string, CssStyle>>();

/**
 * Clears the per-export CSS style caches for the given document.
 *
 * Call this once at the start of each export so that CSS rule changes made
 * between exports are picked up instead of returning stale cached values.
 *
 * @param {Document} doc The owner document whose cache entries should be cleared.
 */
export function clearStyleCaches(doc: Document): void {
  backgroundColorByDoc.delete(doc);
  cssStyleProbeByDoc.delete(doc);
}

// Handsontable alignment class names — cells that carry only these classes have no
// custom CSS color, so reading `color` from them would yield only the inherited default.
const ALIGNMENT_CLASS_NAMES = new Set([
  'htLeft', 'htRight', 'htCenter', 'htJustify', 'htTop', 'htMiddle', 'htBottom',
]);

/**
 * Converts a `getComputedStyle` color string (`rgb(r, g, b)` / `rgba(r, g, b, a)`)
 * to a CSS hex string (`#RRGGBB`), or `null` when the color is fully transparent.
 *
 * @private
 * @param {string} rgbStr Computed color string.
 * @returns {string|null}
 */
function rgbComputedToHex(rgbStr: string): string | null {
  if (!rgbStr) {
    return null;
  }

  const m = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);

  if (!m) {
    return null;
  }

  const alpha = isDefined(m[4]) ? Number.parseFloat(m[4]) : 1;

  if (alpha === 0) {
    return null;
  }

  const r = Number.parseInt(m[1], 10).toString(16).padStart(2, '0');
  const g = Number.parseInt(m[2], 10).toString(16).padStart(2, '0');
  const b = Number.parseInt(m[3], 10).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`.toUpperCase();
}

/**
 * Detects whether any of the provided `metaClasses` explicitly sets a
 * `background-color` by mounting two temporary off-screen `<td>` elements —
 * one with the full class list, one with only alignment classes — inside a
 * `.handsontable` probe div appended to `document.body`. This preserves the
 * same CSS-rule scope as the real table without touching any actual cell in
 * the DOM. The probe is removed immediately after reading.
 *
 * @private
 * @param {Document} doc The owner document of the rendered cell.
 * @param {string[]} metaClasses All classes from the cell's `className` meta value.
 * @param {Window} view The element's owner window.
 * @returns {string|null} CSS hex color string, or `null` when no explicit background.
 */
function detectExplicitBackgroundColor(doc: Document, metaClasses: string[], view: Window): string | null {
  const cacheKey = metaClasses.join(' ');

  let docCache = backgroundColorByDoc.get(doc);

  if (!docCache) {
    docCache = new Map();
    backgroundColorByDoc.set(doc, docCache);
  }

  if (docCache.has(cacheKey)) {
    return docCache.get(cacheKey);
  }

  // Off-screen probe with Handsontable CSS context so scoped rules (e.g.
  // `.handsontable td { … }`) apply to the temporary cells.
  const probe = doc.createElement('div');

  probe.className = 'handsontable';
  probe.style.cssText =
    'position:absolute;top:-99999px;left:-99999px;visibility:hidden;pointer-events:none;';

  const table = doc.createElement('table');
  const tbody = doc.createElement('tbody');
  const tr = doc.createElement('tr');

  // Cell with all meta classes — the candidate background.
  const tdFull = doc.createElement('td');

  tdFull.className = cacheKey;

  // Baseline cell with only alignment classes — the default background.
  const tdBase = doc.createElement('td');

  tdBase.className = metaClasses.filter(c => ALIGNMENT_CLASS_NAMES.has(c)).join(' ');

  tr.appendChild(tdFull);
  tr.appendChild(tdBase);
  tbody.appendChild(tr);
  table.appendChild(tbody);
  probe.appendChild(table);
  doc.body.appendChild(probe);

  const bgFull = view.getComputedStyle(tdFull).backgroundColor;
  const bgBase = view.getComputedStyle(tdBase).backgroundColor;

  doc.body.removeChild(probe);

  const result = bgFull !== bgBase ? rgbComputedToHex(bgFull) : null;

  docCache.set(cacheKey, result);

  return result;
}

/**
 * Derives full CSS style information for a cell that has no rendered DOM element
 * (e.g. a cell outside the virtual-scroll viewport) by mounting a temporary probe
 * `<td>` with the same `metaClasses` inside a `.handsontable` context.
 *
 * Both a "full" cell (with all custom classes) and a "baseline" cell (with only
 * alignment classes) are probed simultaneously so that inherited-default values
 * (color, background) are not incorrectly attributed to the custom class.
 *
 * Results are cached per document + className so subsequent calls for the same
 * className are free.
 *
 * @private
 * @param {Document} doc The document to build the probe in.
 * @param {Window} view The associated window (for `getComputedStyle`).
 * @param {string[]} metaClasses All classes from the cell's `className` meta value.
 * @returns {{ fontBold: boolean, fontItalic: boolean, fontUnderline: boolean,
 *             fontColor: string|null, backgroundColor: string|null }}
 */
function getCssStyleFromProbe(doc: Document, view: Window, metaClasses: string[]): CssStyle {
  const cacheKey = metaClasses.join(' ');
  let docCache = cssStyleProbeByDoc.get(doc);

  if (!docCache) {
    docCache = new Map();
    cssStyleProbeByDoc.set(doc, docCache);
  }

  if (docCache.has(cacheKey)) {
    return docCache.get(cacheKey);
  }

  const probe = doc.createElement('div');

  probe.className = 'handsontable';
  probe.style.cssText =
    'position:absolute;top:-99999px;left:-99999px;visibility:hidden;pointer-events:none;';

  const table = doc.createElement('table');
  const tbody = doc.createElement('tbody');
  const tr = doc.createElement('tr');

  // Cell with all meta classes — resolves the custom styling.
  const tdFull = doc.createElement('td');

  tdFull.className = cacheKey;

  // Baseline cell with only alignment classes — resolves inherited defaults.
  const tdBase = doc.createElement('td');

  tdBase.className = metaClasses.filter(c => ALIGNMENT_CLASS_NAMES.has(c)).join(' ');

  tr.appendChild(tdFull);
  tr.appendChild(tdBase);
  tbody.appendChild(tr);
  table.appendChild(tbody);
  probe.appendChild(table);
  doc.body.appendChild(probe);

  const styleFull = view.getComputedStyle(tdFull);
  const styleBase = view.getComputedStyle(tdBase);

  const bgFull = styleFull.backgroundColor;
  const bgBase = styleBase.backgroundColor;
  const colorFull = styleFull.color;
  const colorBase = styleBase.color;

  doc.body.removeChild(probe);

  const result = {
    fontBold: Number.parseInt(styleFull.fontWeight, 10) >= 700 || styleFull.fontWeight === 'bold',
    fontItalic: styleFull.fontStyle === 'italic',
    fontUnderline: (styleFull.textDecorationLine || styleFull.textDecoration || '').includes('underline'),
    fontColor: colorFull !== colorBase ? rgbComputedToHex(colorFull) : null,
    backgroundColor: bgFull !== bgBase ? rgbComputedToHex(bgFull) : null,
  };

  docCache.set(cacheKey, result);

  return result;
}

/**
 * Reads visual style properties from a rendered Handsontable cell element via
 * `getComputedStyle`.
 *
 * Font color is only read when the cell has at least one CSS class that is not a
 * Handsontable alignment class (`htLeft`, `htRight`, etc.), because alignment-only
 * cells carry only the inherited default text color.
 *
 * Background color is only emitted when a custom meta class actually changes the
 * computed background. Detection is done via a temporary off-screen probe element
 * (see `detectExplicitBackgroundColor`) — the actual table cell is never modified.
 *
 * When `element` is `null` (cell outside the render viewport) but `rootDocument`
 * and `rootWindow` are provided, style information is derived via a temporary probe
 * element (see `getCssStyleFromProbe`). Returns `null` only when no element and no
 * document fallback are available, or when the className has no custom classes.
 *
 * @param {HTMLElement|null} element The rendered `<td>` element, or `null`.
 * @param {string|string[]|undefined} className The cell's `className` meta value.
 * @param {Document|null} [rootDocument] Fallback document used when `element` is `null`.
 * @param {Window|null} [rootWindow] Fallback window used when `element` is `null`.
 * @returns {{ fontBold: boolean, fontItalic: boolean, fontUnderline: boolean,
 *             fontColor: string|null, backgroundColor: string|null }|null}
 */
export function getCssStyleFromElement(
  element: HTMLElement | null,
  className: string | string[] | undefined,
  rootDocument: Document | null = null,
  rootWindow: Window | null = null
): CssStyle | null {
  if (!element) {
    if (!rootDocument || !rootWindow) {
      return null;
    }

    const metaClasses = normalizeClassNames(className);

    if (!metaClasses.some(c => !ALIGNMENT_CLASS_NAMES.has(c))) {
      return null;
    }

    return getCssStyleFromProbe(rootDocument, rootWindow, metaClasses);
  }

  const view = element.ownerDocument?.defaultView;

  if (!view) {
    return null;
  }

  const style = view.getComputedStyle(element);

  const metaClasses = normalizeClassNames(className);
  const hasCustomClass = metaClasses.some(c => !ALIGNMENT_CLASS_NAMES.has(c));

  return {
    fontBold: Number.parseInt(style.fontWeight, 10) >= 700 || style.fontWeight === 'bold',
    fontItalic: style.fontStyle === 'italic',
    fontUnderline: (style.textDecorationLine || style.textDecoration || '').includes('underline'),
    fontColor: hasCustomClass ? rgbComputedToHex(style.color) : null,
    backgroundColor: hasCustomClass
      ? detectExplicitBackgroundColor(element.ownerDocument, metaClasses, view)
      : null,
  };
}

/**
 * Converts a CSS hex color string to an ARGB hex string expected by ExcelJS.
 *
 * @private
 * @param {string} color CSS color string.
 * @returns {string} Eight-character ARGB hex string (e.g. `'FF3366CC'`).
 */
export function cssColorToArgb(color: string): string {
  if (!color || typeof color !== 'string') {
    return 'FF000000';
  }

  const hex = color.startsWith('#') ? color.slice(1) : color;

  if (hex.length === 3) {
    const r = hex[0] + hex[0];
    const g = hex[1] + hex[1];
    const b = hex[2] + hex[2];

    return `FF${r}${g}${b}`.toUpperCase();
  }

  if (hex.length === 6) {
    return `FF${hex}`.toUpperCase();
  }

  if (hex.length === 8) {
    return hex.toUpperCase();
  }

  return 'FF000000';
}

/**
 * Derives an ExcelJS `alignment` object from a CSS className string.
 *
 * @private
 * @param {string|undefined} className CSS class string.
 * @returns {object|null}
 */
export function getAlignmentFromClassName(className: string | undefined): object | null {
  if (!className) {
    return null;
  }

  return getAlignmentFromMeta({ className });
}

/**
 * Derives an ExcelJS `alignment` object from the cell meta `className`.
 *
 * Recognised Handsontable alignment classes:
 * - Horizontal: `htLeft`, `htCenter`, `htRight`, `htJustify`
 * - Vertical: `htTop`, `htMiddle`, `htBottom`
 *
 * @private
 * @param {object|undefined} meta Cell meta object.
 * @returns {object|null}
 */
export function getAlignmentFromMeta(meta: CellMeta | undefined): object | null {
  if (!meta?.className) {
    return null;
  }

  const classes = normalizeClassNames(meta.className);
  const alignment: Record<string, string> = {};

  if (classes.includes('htLeft')) {
    alignment.horizontal = 'left';
  } else if (classes.includes('htCenter')) {
    alignment.horizontal = 'center';
  } else if (classes.includes('htRight')) {
    alignment.horizontal = 'right';
  } else if (classes.includes('htJustify')) {
    alignment.horizontal = 'justify';
  }

  if (classes.includes('htTop')) {
    alignment.vertical = 'top';
  } else if (classes.includes('htMiddle')) {
    alignment.vertical = 'middle';
  } else if (classes.includes('htBottom')) {
    alignment.vertical = 'bottom';
  }

  return Object.keys(alignment).length > 0 ? alignment : null;
}

/**
 * Maps a Handsontable border pixel width to the closest ExcelJS border style string.
 *
 * Excel does not support arbitrary pixel widths; it uses a fixed set of named styles.
 * The mapping used here:
 * - `1` → `'thin'`  (≈ 0.5 pt in Excel)
 * - `2` → `'medium'` (≈ 1.5 pt in Excel)
 * - `3+` → `'thick'` (≈ 2.25 pt in Excel)
 *
 * @private
 * @param {number} width Border width in pixels.
 * @returns {string} ExcelJS border style name.
 */
function borderWidthToExcelStyle(width: number): string {
  if (width >= 3) {
    return 'thick';
  }

  if (width === 2) {
    return 'medium';
  }

  return 'thin';
}

/**
 * Derives an ExcelJS `border` object from custom border data stored in cell meta.
 *
 * Border widths are mapped to the nearest Excel border style:
 * `1` → `'thin'`, `2` → `'medium'`, `3+` → `'thick'`.
 *
 * @private
 * @param {object|undefined} meta Cell meta object.
 * @returns {object|null}
 */
export function getBorderFromMeta(meta: CellMeta | undefined): object | null {
  if (!meta?.borders) {
    return null;
  }

  const { borders } = meta;
  const excelBorder: Record<string, any> = {};

  ['top', 'bottom', 'left', 'right'].forEach((side) => {
    if (borders[side] && borders[side].width > 0) {
      excelBorder[side] = {
        style: borderWidthToExcelStyle(borders[side].width),
        color: { argb: cssColorToArgb(borders[side].color) },
      };
    }
  });

  return Object.keys(excelBorder).length > 0 ? excelBorder : null;
}

/**
 * Derives an ExcelJS `font` object from computed CSS style.
 *
 * All boolean properties (bold, italic, underline) and color are read exclusively
 * from the `cssStyle` object produced by `getCssStyleFromElement`. When `cssStyle`
 * is `null` (e.g. the cell is outside the rendered viewport), no font styling is
 * applied unless `meta.readOnly` is set.
 *
 * When `meta.readOnly` is `true` and no explicit color is found, a default dimmed text
 * color (`READ_ONLY_TEXT_ARGB`) is applied.
 *
 * @param {object|undefined} meta Cell meta object.
 * @param {{ fontBold: boolean, fontItalic: boolean, fontUnderline: boolean,
 *           fontColor: string|null }|null} [cssStyle] Computed CSS style from
 *   `getCssStyleFromElement`, or `null` for non-rendered cells.
 * @returns {object|null}
 */
export function getFontFromMeta(meta: CellMeta | undefined, cssStyle: CssStyle | null = null): object | null {
  const isReadOnly = meta?.readOnly === true;

  const bold = cssStyle?.fontBold || false;
  const italic = cssStyle?.fontItalic || false;
  const underline = cssStyle?.fontUnderline || false;
  const colorHex = cssStyle?.fontColor ?? null;

  if (!bold && !italic && !underline && !colorHex && !isReadOnly) {
    return null;
  }

  const font: Record<string, any> = {};

  if (bold) {
    font.bold = true;
  }

  if (italic) {
    font.italic = true;
  }

  if (underline) {
    font.underline = true;
  }

  if (colorHex) {
    font.color = { argb: cssColorToArgb(colorHex) };
  } else if (isReadOnly) {
    font.color = { argb: READ_ONLY_TEXT_ARGB };
  }

  return Object.keys(font).length > 0 ? font : null;
}

/**
 * Derives an ExcelJS solid `fill` object from the computed CSS background color.
 *
 * Background color is read exclusively from `cssStyle.backgroundColor`.
 * When `meta.readOnly` is `true` and no explicit color is found, a default light gray fill
 * (`READ_ONLY_BG_ARGB`) is applied.
 *
 * @private
 * @param {object|undefined} meta Cell meta object.
 * @param {{ backgroundColor: string|null }|null} [cssStyle] Computed CSS style from
 *   `getCssStyleFromElement`, or `null` for non-rendered cells.
 * @returns {object|null}
 */
export function getFillFromMeta(
  meta: CellMeta | undefined, cssStyle: { backgroundColor: string | null } | null = null
): object | null {
  let bgColor = null;

  if (cssStyle?.backgroundColor) {
    bgColor = cssColorToArgb(cssStyle.backgroundColor);
  } else if (meta?.readOnly === true) {
    bgColor = READ_ONLY_BG_ARGB;
  }

  if (!bgColor) {
    return null;
  }

  return {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: bgColor },
  };
}

/**
 * Returns an ExcelJS data validation object for dropdown and autocomplete cell types.
 *
 * @private
 * @param {object|undefined} meta Cell meta object.
 * @param {string|null} rangeRef Excel range reference to the validation list
 *   (e.g. `'_HotValidation'!$A$1:$A$3`). When `null` or `undefined`, returns `null`.
 * @returns {object|null}
 */
export function getDropdownValidation(meta: CellMeta | undefined, rangeRef: string | null): object | null {
  if (!meta || !rangeRef) {
    return null;
  }

  const isDropdownType = meta.type === 'dropdown' || meta.type === 'autocomplete';

  if (!isDropdownType || !Array.isArray(meta.source)) {
    return null;
  }

  return {
    type: 'list',
    allowBlank: true,
    formulae: [rangeRef],
  };
}
