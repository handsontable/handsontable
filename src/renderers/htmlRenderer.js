import {fastInnerHTML} from './../helpers/dom/element';
import {getRenderer} from './index';

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
function htmlRenderer(instance, TD, row, col, prop, value, cellProperties) {
  getRenderer('base').apply(this, arguments);

  if (value === null || value === void 0) {
    value = '';
  }

  fastInnerHTML(TD, value);
}

export default htmlRenderer;
