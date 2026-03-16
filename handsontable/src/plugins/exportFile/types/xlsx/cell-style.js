import { arrayEach } from '../../../../helpers/array';

// Default ARGB colors applied to read-only cells when no explicit styling is set.
const READ_ONLY_BG_ARGB = 'FFF0F0F0';
const READ_ONLY_TEXT_ARGB = 'FF808080';

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
function rgbComputedToHex(rgbStr) {
  if (!rgbStr) {
    return null;
  }

  const m = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);

  if (!m) {
    return null;
  }

  const alpha = m[4] !== undefined ? parseFloat(m[4]) : 1;

  if (alpha === 0) {
    return null;
  }

  const r = parseInt(m[1], 10).toString(16).padStart(2, '0');
  const g = parseInt(m[2], 10).toString(16).padStart(2, '0');
  const b = parseInt(m[3], 10).toString(16).padStart(2, '0');

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
 * @param {HTMLElement} element The rendered cell element (provides `ownerDocument`).
 * @param {string[]} metaClasses All classes from the cell's `className` meta value.
 * @param {Window} view The element's owner window.
 * @returns {string|null} CSS hex color string, or `null` when no explicit background.
 */
function detectExplicitBackgroundColor(element, metaClasses, view) {
  const doc = element.ownerDocument;

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

  tdFull.className = metaClasses.join(' ');

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

  return bgFull !== bgBase ? rgbComputedToHex(bgFull) : null;
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
 * Returns `null` when no element is provided (e.g. the cell is outside the rendered
 * viewport in a virtualised grid).
 *
 * @param {HTMLElement|null} element The rendered `<td>` element, or `null`.
 * @param {string|undefined} className The cell's `className` meta value.
 * @returns {{ fontBold: boolean, fontItalic: boolean, fontUnderline: boolean,
 *             fontColor: string|null, backgroundColor: string|null }|null}
 */
export function getCssStyleFromElement(element, className) {
  if (!element) {
    return null;
  }

  const view = element.ownerDocument?.defaultView;

  if (!view) {
    return null;
  }

  const style = view.getComputedStyle(element);

  const metaClasses = typeof className === 'string'
    ? className.split(' ').filter(c => c.length > 0)
    : [];

  const hasCustomClass = metaClasses.some(c => !ALIGNMENT_CLASS_NAMES.has(c));

  return {
    fontBold: parseInt(style.fontWeight, 10) >= 700 || style.fontWeight === 'bold',
    fontItalic: style.fontStyle === 'italic',
    fontUnderline: (style.textDecorationLine || style.textDecoration || '').includes('underline'),
    fontColor: hasCustomClass ? rgbComputedToHex(style.color) : null,
    backgroundColor: hasCustomClass
      ? detectExplicitBackgroundColor(element, metaClasses, view)
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
export function cssColorToArgb(color) {
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
export function getAlignmentFromClassName(className) {
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
export function getAlignmentFromMeta(meta) {
  if (!meta?.className) {
    return null;
  }

  const classes = meta.className.split(' ');
  const alignment = {};

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
 * Derives an ExcelJS `border` object from custom border data stored in cell meta.
 *
 * @private
 * @param {object|undefined} meta Cell meta object.
 * @returns {object|null}
 */
export function getBorderFromMeta(meta) {
  if (!meta?.borders) {
    return null;
  }

  const { borders } = meta;
  const excelBorder = {};

  arrayEach(['top', 'bottom', 'left', 'right'], (side) => {
    if (borders[side] && borders[side].width > 0) {
      excelBorder[side] = {
        style: 'thin',
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
export function getFontFromMeta(meta, cssStyle = null) {
  const isReadOnly = meta?.readOnly === true;

  const bold = cssStyle?.fontBold || false;
  const italic = cssStyle?.fontItalic || false;
  const underline = cssStyle?.fontUnderline || false;
  const colorHex = cssStyle?.fontColor ?? null;

  if (!bold && !italic && !underline && !colorHex && !isReadOnly) {
    return null;
  }

  const font = {};

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
export function getFillFromMeta(meta, cssStyle = null) {
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
 * @returns {object|null}
 */
export function getDropdownValidation(meta) {
  if (!meta) {
    return null;
  }

  const isDropdownType = meta.type === 'dropdown' || meta.type === 'autocomplete';

  if (!isDropdownType || !Array.isArray(meta.source)) {
    return null;
  }

  return {
    type: 'list',
    allowBlank: true,
    formulae: [`"${meta.source.join(',')}"`],
  };
}
