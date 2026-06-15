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
  this: unknown,
  hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
  prop: string | number, value: unknown, _cellProperties?: CellProperties): void {
  // The `html` cell type renders raw HTML on purpose, so pass `false` to write it directly without
  // emitting the missing-sanitizer warning. Sanitization for this cell type is the user's responsibility.
  fastInnerHTML(TD, value === null || value === undefined ? '' : value as string, false);
}

htmlRenderer.RENDERER_TYPE = RENDERER_TYPE;
