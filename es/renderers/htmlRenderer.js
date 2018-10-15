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
function htmlRenderer(instance, TD, row, col, prop, value) {
  for (var _len = arguments.length, args = Array(_len > 6 ? _len - 6 : 0), _key = 6; _key < _len; _key++) {
    args[_key - 6] = arguments[_key];
  }

  getRenderer('base').apply(this, [instance, TD, row, col, prop, value].concat(args));

  fastInnerHTML(TD, value === null || value === void 0 ? '' : value);
}

export default htmlRenderer;