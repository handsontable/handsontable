import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { fastInnerHTML } from '../../helpers/dom/element';

export const RENDERER_TYPE: 'html' = 'html';

/**
 * @private
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 */
export function htmlRenderer(
  hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
  prop: string | number, value: unknown, _cellProperties?: CellProperties): void {
  fastInnerHTML(TD, value === null || value === undefined ? '' : value as string, false);
}

htmlRenderer.RENDERER_TYPE = RENDERER_TYPE;
