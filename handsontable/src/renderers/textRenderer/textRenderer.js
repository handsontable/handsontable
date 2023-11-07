import { baseRenderer } from '../baseRenderer';
import { empty, fastInnerText } from '../../helpers/dom/element';
import { stringify } from '../../helpers/mixed';

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
 * @param {object} cellProperties The cell meta object ({@see Core#getCellMeta}).
 */
export function textRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  baseRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
  let escaped = value;

  if (!escaped && cellProperties.placeholder) {
    escaped = cellProperties.placeholder;
  }

  escaped = stringify(escaped);

  if (cellProperties.trimWhitespace) {
    escaped = escaped.trim();
  }

  if (cellProperties.rendererTemplate) {
    empty(TD);
    const TEMPLATE = hotInstance.rootDocument.createElement('TEMPLATE');

    TEMPLATE.setAttribute('bind', '{{}}');
    TEMPLATE.innerHTML = cellProperties.rendererTemplate;
    HTMLTemplateElement.decorate(TEMPLATE);
    TEMPLATE.model = hotInstance.getSourceDataAtRow(row);
    TD.appendChild(TEMPLATE);

  } else {
    // this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
    fastInnerText(TD, escaped);
  }
}

textRenderer.RENDERER_TYPE = RENDERER_TYPE;
