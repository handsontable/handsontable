
import * as dom from './../dom.js';
import {getRenderer, registerRenderer} from './../renderers.js';

export {htmlRenderer};

registerRenderer('html', htmlRenderer);

/**
 * @private
 * @renderer
 * @component HtmlRenderer
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
  dom.fastInnerHTML(TD, value);
}
