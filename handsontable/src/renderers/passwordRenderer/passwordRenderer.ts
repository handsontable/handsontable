import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { fastInnerHTML } from '../../helpers/dom/element';
import { stringify } from '../../helpers/mixed';
import { getSanitizer } from '../../utils/sanitizer';

export const RENDERER_TYPE: 'password' = 'password';

/**
 * Formats the value using the password format.
 *
 * @param {*} value Value to be formatted.
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {*} Returns the formatted value.
 */
export function valueFormatter(value: unknown, cellProperties: CellProperties) {
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
  // `valueFormatter` above replaces the value with a run of `hashSymbol`, so markup reaches this
  // sink only through a developer-supplied `valueFormatter` or a `hashSymbol` that contains HTML.
  // Both are the developer's own content, but a configured `sanitizer` must still apply, and the
  // `'password'` context is what makes the missing-sanitizer warning name its source.
  fastInnerHTML(TD, value as string, getSanitizer(hotInstance), 'password', hotInstance.rootElement);
}

passwordRenderer.valueFormatter = valueFormatter;
passwordRenderer.RENDERER_TYPE = RENDERER_TYPE;
