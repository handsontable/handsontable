import { fastInnerHTML } from './../helpers/dom/element';
import { getRenderer } from './index';

/**
 * @private
 * @renderer HtmlRenderer
 * @param instance
 * @param TD
 * @param row
 * @param col
 * @param prop
 * @param value
 * @param cellProperties
 */
function htmlRenderer(instance, TD, row, col, prop, value, ...args) {
  getRenderer('base').apply(this, [instance, TD, row, col, prop, value, ...args]);

  fastInnerHTML(TD, value === null || value === void 0 ? '' : value);
}

export default htmlRenderer;
