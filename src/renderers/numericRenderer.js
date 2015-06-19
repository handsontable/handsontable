/**
 * Numeric cell renderer
 *
 * @private
 * @renderer NumericRenderer
 * @dependencies numeral
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properties (shared by cell renderer and editor)
 */

import * as dom from './../dom.js';
import * as helper from './../helpers.js';
import numeral from 'numeral';
import {getRenderer, registerRenderer} from './../renderers.js';

export {numericRenderer};

registerRenderer('numeric', numericRenderer);

function numericRenderer(instance, TD, row, col, prop, value, cellProperties) {
  if (helper.isNumeric(value)) {
    if (typeof cellProperties.language !== 'undefined') {
      numeral.language(cellProperties.language);
    }
    value = numeral(value).format(cellProperties.format || '0'); //docs: http://numeraljs.com/
    dom.addClass(TD, 'htNumeric');
  }
  getRenderer('text')(instance, TD, row, col, prop, value, cellProperties);
}
