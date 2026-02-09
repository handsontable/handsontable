import type { HotInstance } from '../../common';
import { fastInnerText } from '../../helpers/dom/element';
import { stringify } from '../../helpers/mixed';

export const RENDERER_TYPE: 'text' = 'text';

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
export function textRenderer(hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number, prop: string | number, value: unknown, cellProperties: Record<string, unknown>): void {
  let escaped = value;

  if (!escaped && cellProperties.placeholder) {
    escaped = cellProperties.placeholder;
  }

  const escapedStr = stringify(escaped) as string;
  let finalStr = escapedStr;

  if (cellProperties.trimWhitespace) {
    finalStr = escapedStr.trim();
  }

  // this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
  fastInnerText(TD, finalStr);
}

textRenderer.RENDERER_TYPE = RENDERER_TYPE;
