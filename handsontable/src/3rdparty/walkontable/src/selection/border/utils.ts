import type { WalkontableInstance } from '../../types';
import type { CornerDefaultStyle } from './types';
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
