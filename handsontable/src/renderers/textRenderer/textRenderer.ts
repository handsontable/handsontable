import { baseRenderer } from '../baseRenderer';
import { fastInnerText } from '../../helpers/dom/element';
import { stringify } from '../../helpers/mixed';
import { TypedRenderer } from '../types';

export const RENDERER_TYPE = 'text';

/**
 * Default text renderer.
 *
 * @private
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
 */
export function textRenderer(
  hotInstance: any, 
  TD: HTMLTableCellElement, 
  row: number, 
  col: number, 
  prop: number | string, 
  value: any, 
  cellProperties: {
    placeholder?: string;
    trimWhitespace?: boolean;
    [key: string]: any;
  }
): void {
  baseRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
  let escaped = value;

  if (!escaped && cellProperties.placeholder) {
    escaped = cellProperties.placeholder;
  }

  escaped = stringify(escaped);

  if (cellProperties.trimWhitespace) {
    escaped = escaped.trim();
  }

  // this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
  fastInnerText(TD, escaped);
}

(textRenderer as TypedRenderer).RENDERER_TYPE = RENDERER_TYPE;
