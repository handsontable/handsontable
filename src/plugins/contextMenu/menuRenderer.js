import {getRenderer} from './../../renderers';
import {addClass, empty, fastInnerHTML} from './../../helpers/dom/element';

/**
 * Menu renderer
 *
 * @private
 * @renderer MenuRenderer
 * @param {Object} hot Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
function menuRenderer(hot, TD, row, col, prop, value, cellProperties) {
  getRenderer('base').apply(this, arguments);
  empty(TD);
  const wrapper = document.createElement('div');
  addClass(wrapper, 'htItemWrapper');
  TD.appendChild(wrapper);
  fastInnerHTML(wrapper, value);
}

export default menuRenderer;
