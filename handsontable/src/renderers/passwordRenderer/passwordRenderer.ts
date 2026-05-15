import type { HotInstance } from '../../core/types';
import { fastInnerHTML } from '../../helpers/dom/element';
import { stringify } from '../../helpers/mixed';

export const RENDERER_TYPE: 'password' = 'password';

/**
 * Formats the value using the password format.
 *
 * @param {*} value Value to be formatted.
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {*} Returns the formatted value.
 */
export function valueFormatter(value: unknown, cellProperties: Record<string, unknown>) {
  const hashLength = (cellProperties.hashLength || stringify(value).length) as number;
  const hashSymbol = String(cellProperties.hashSymbol ?? '*');

  let hash = '';

  for (let i = 0; i < hashLength; i++) {
    hash += hashSymbol;
  }

  return hash;
}

/**
 * @private
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 */
export function passwordRenderer(
  hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
  prop: string | number, value: unknown): void {
  fastInnerHTML(TD, value as string);
}

passwordRenderer.valueFormatter = valueFormatter;
passwordRenderer.RENDERER_TYPE = RENDERER_TYPE;
