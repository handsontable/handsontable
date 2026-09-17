import type { WalkontableInstance } from '../../types';
import type { BorderInstanceSettings, BorderPositionSettings, CornerDefaultStyle } from './types';

export const getCornerStyle = (wot: WalkontableInstance): CornerDefaultStyle => {
  const stylesHandler = wot.wtSettings.getSetting('stylesHandler');

  const cornerSizeFromVar = stylesHandler.getCSSVariableValue('cell-autofill-size');
  const cornerBorderWidthFromVar = stylesHandler.getCSSVariableValue('cell-autofill-border-width');
  const cornerColorFromVar = stylesHandler.getCSSVariableValue('cell-autofill-border-color') as string;

  return Object.freeze({
    width: cornerSizeFromVar,
    height: cornerSizeFromVar,
    borderWidth: cornerBorderWidthFromVar,
    borderStyle: 'solid',
    borderColor: cornerColorFromVar,
  });
};

/**
 * Reads a per-side border setting, falling back to the shared `border` object when the side omits it.
 * An explicit `0` or empty string is a real setting – only `null` and `undefined` fall through.
 * For `style`, that means `style: ''` stays empty (`Border#createBorders` then takes the solid-fill
 * `else` path) instead of inheriting `settings.border.style`. Keep `??` for every property on this
 * helper; a truthy check would also resurrect the width-0 bug (DEV-1137).
 *
 * @param {object|undefined} sideSettings The per-side settings (`top`, `start`, `bottom`, `end`, or `corner`).
 * @param {string} property The setting name (`width`, `color`, `style`).
 * @param {object|undefined} fallbackBorder The shared `settings.border` object used when the side omits the property.
 * @returns {*} The configured value, or `undefined` when neither source provides it.
 */
export function getBorderSettingsProperty(
  sideSettings: BorderPositionSettings | undefined,
  property: string,
  fallbackBorder: BorderInstanceSettings['border'] | undefined,
): unknown {
  return sideSettings?.[property] ?? fallbackBorder?.[property];
}

/**
 * Translates a selection header coordinate into the Walkontable header level
 * `getRowHeader` and `getColumnHeader` expect.
 *
 * Header coordinates are negative: `-1` is the header closest to the cells, `-N` is the farthest.
 * Levels are the opposite: `0` is the farthest header, `count - 1` is the closest. A non-negative
 * index is a body coordinate and maps to the closest header (`count - 1`), which is what a
 * clamped full-row or full-column selection still needs when the original header corner was not
 * kept.
 *
 * @param {number} headerCount How many header levels that axis renders.
 * @param {number} headerIndex The selection corner on that axis. Negative for a header, otherwise
 *   a body index.
 * @returns {number} The level to pass to `getRowHeader` / `getColumnHeader`.
 */
export const resolveHeaderLevel = (headerCount: number, headerIndex: number): number => {
  if (headerIndex < 0) {
    return headerCount + headerIndex;
  }

  return headerCount - 1;
};

/**
 * Whether this header TH has no layout box, so a selection measured from it would collapse.
 *
 * NestedHeaders stamps `hiddenHeader` on colspan continuations and rowspan-covered cells,
 * but `:first-of-type` continuations stay laid out (`display: none` applies only to
 * `:not(:first-of-type)`; rowspan placeholders also set inline `display: none`). Walkontable
 * therefore keys off size, not that plugin class.
 *
 * @param {HTMLElement|undefined|null} header The TH `getRowHeader` / `getColumnHeader` returned.
 * @param {Function} sizeFn `outerWidth` or `outerHeight` for the axis being measured.
 * @returns {boolean}
 */
export const isHeaderPlaceholder = (
  header: HTMLElement | undefined | null,
  sizeFn: (el: HTMLElement) => number,
): boolean => {
  return !!header && sizeFn(header) === 0;
};

/**
 * Returns the TH to measure a full-row or full-column selection from.
 *
 * Prefers the selected header level so a padded or rowspan header is the box
 * that is measured (DEV-1176). When that cell has no layout box (a collapsed
 * nested-header continuation), falls back to the closest header, which maps 1:1
 * onto the column or row index and is laid out.
 *
 * @param {Function} getHeader `getRowHeader` or `getColumnHeader`.
 * @param {number} index The column or row index to look up.
 * @param {number} preferredLevel The level `resolveHeaderLevel` produced.
 * @param {number} closestLevel The header closest to the cells (`count - 1`).
 * @param {Function} sizeFn `outerWidth` or `outerHeight` for the axis being measured.
 * @returns {HTMLElement|undefined} A laid-out header, or `undefined` to measure from the body.
 */
export const lookupSelectionHeader = (
  getHeader: (index: number, level: number) => HTMLElement | undefined,
  index: number,
  preferredLevel: number,
  closestLevel: number,
  sizeFn: (el: HTMLElement) => number,
): HTMLElement | undefined => {
  const preferred = getHeader(index, preferredLevel);

  if (preferred && !isHeaderPlaceholder(preferred, sizeFn)) {
    return preferred;
  }

  if (preferredLevel === closestLevel) {
    return undefined;
  }

  const closest = getHeader(index, closestLevel);

  if (closest && !isHeaderPlaceholder(closest, sizeFn)) {
    return closest;
  }

  return undefined;
};

/**
 * Container-relative start and size of a full-row or full-column selection measured from header
 * cells (DEV-1176).
 *
 * Row measurements use top/height. Column measurements follow `Border#appear`'s body-cell math so
 * RTL writes `style.right` from the table's inline-end, not from the left edge. Left-edge math
 * on RTL puts the full-column highlight on the wrong side of the cell.
 *
 * @param {string} axis `'rows'` (top/height) or `'columns'` (inline-start/width).
 * @param {number} startEdge The start header's `offset.top` (rows) or `offset.left` (columns).
 * @param {number} endEdge The end header's `offset.top` (rows) or `offset.left` (columns).
 * @param {number} startSize The start header's outerHeight (rows) or outerWidth (columns).
 * @param {number} endSize The end header's outerHeight (rows) or outerWidth (columns).
 * @param {number} containerEdge The table's `offset.top` (rows) or `offset.left` (columns).
 * @param {boolean} isRtl Whether the grid is in RTL. Ignored for rows.
 * @param {number} containerWidth The table's outerWidth. Used only for RTL columns.
 * @returns {Array<number>} `[start, size]`. For RTL columns, `start` is the `right` offset
 *   `appear()` assigns to `style.right`.
 */
export const measureHeaderSelectionBox = (
  axis: 'rows' | 'columns',
  startEdge: number,
  endEdge: number,
  startSize: number,
  endSize: number,
  containerEdge: number,
  isRtl: boolean,
  containerWidth: number,
): [number, number] => {
  if (axis === 'columns' && isRtl) {
    const startInlineEnd = startEdge + startSize;

    return [
      containerEdge + containerWidth - startInlineEnd - 1,
      startInlineEnd - endEdge,
    ];
  }

  return [
    startEdge - containerEdge - 1,
    endEdge + endSize - startEdge,
  ];
};

/**
 * Whether this cell sits in the first body row of a table that renders a head row, which is where
 * the column header owns the gridline above the cell (DEV-2786) instead of the cell drawing it.
 *
 * The mirror of `standsBehindRowHeader` in `Border#appear`, and read from the DOM for the same
 * reason: which row is the band's first `<tr>` moves with the scroll offset, and the tables that
 * render no head row (the bottom overlays, and every table of a grid with no column headers) keep
 * the border on their own first row. It matches the CSS rule that produces this,
 * `thead:not(:empty) + tbody > tr:first-child` in `styles/base/_base.scss`.
 *
 * @param {HTMLElement} cellElement The `td` or `th` the selection's top edge is measured from.
 * @returns {boolean}
 */
export const standsBelowColumnHeader = (cellElement: HTMLElement): boolean => {
  const row = cellElement.parentElement;

  if (!row || row.previousElementSibling) {
    return false;
  }

  const sectionSibling = row.parentElement?.previousElementSibling;

  return sectionSibling?.nodeName === 'THEAD' && sectionSibling.hasChildNodes();
};
