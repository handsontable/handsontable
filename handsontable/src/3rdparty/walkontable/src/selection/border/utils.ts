import type { WalkontableInstance } from '../../types';
import type { CornerDefaultStyle } from './types';
import { hasClass } from '../../../../../helpers/dom/element';

/**
 * Nested headers stamp this class on TH placeholders that sit under a colspan or
 * rowspan. Those cells are not laid out (`display: none`), so a width or height
 * read from them collapses the selection border.
 */
const HEADER_PLACEHOLDER_CLASS = 'hiddenHeader';

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
 * Whether this header TH is a nested-header placeholder rather than a laid-out cell.
 *
 * Colspan continuations and rowspan-covered cells carry `hiddenHeader` and are
 * `display: none`. Measuring a selection from them yields a collapsed box.
 *
 * @param {HTMLElement|undefined|null} header The TH `getRowHeader` / `getColumnHeader` returned.
 * @returns {boolean}
 */
export const isHeaderPlaceholder = (header: HTMLElement | undefined | null): boolean => {
  return !!header && hasClass(header, HEADER_PLACEHOLDER_CLASS);
};

/**
 * Returns the TH to measure a full-row or full-column selection from.
 *
 * Prefers the selected header level so a padded or rowspan header is the box
 * that is measured (DEV-1176). When that cell is a `hiddenHeader` placeholder
 * (the covered columns of a nested colspan), falls back to the closest header,
 * which maps 1:1 onto the column or row index and is laid out.
 *
 * @param {Function} getHeader `getRowHeader` or `getColumnHeader`.
 * @param {number} index The column or row index to look up.
 * @param {number} preferredLevel The level `resolveHeaderLevel` produced.
 * @param {number} closestLevel The header closest to the cells (`count - 1`).
 * @returns {HTMLElement|undefined} A laid-out header, or `undefined` to measure from the body.
 */
export const lookupSelectionHeader = (
  getHeader: (index: number, level: number) => HTMLElement | undefined,
  index: number,
  preferredLevel: number,
  closestLevel: number,
): HTMLElement | undefined => {
  const preferred = getHeader(index, preferredLevel);

  if (preferred && !isHeaderPlaceholder(preferred)) {
    return preferred;
  }

  if (preferredLevel === closestLevel) {
    return undefined;
  }

  const closest = getHeader(index, closestLevel);

  if (closest && !isHeaderPlaceholder(closest)) {
    return closest;
  }

  return undefined;
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
