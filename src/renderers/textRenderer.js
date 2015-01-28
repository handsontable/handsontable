/**
 * Default text renderer
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
import {getRenderer, registerRenderer} from './../renderers.js';

export {textRenderer};

registerRenderer('text', textRenderer);

function textRenderer(instance, TD, row, col, prop, value, cellProperties) {
  getRenderer('base').apply(this, arguments);

  if (!value && cellProperties.placeholder) {
    value = cellProperties.placeholder;
  }

  var escaped = helper.stringify(value);

  if (cellProperties.rendererTemplate) {
    dom.empty(TD);
    var TEMPLATE = document.createElement('TEMPLATE');
    TEMPLATE.setAttribute('bind', '{{}}');
    TEMPLATE.innerHTML = cellProperties.rendererTemplate;
    HTMLTemplateElement.decorate(TEMPLATE);
    TEMPLATE.model = instance.getSourceDataAtRow(row);
    TD.appendChild(TEMPLATE);
  }
  else {
    dom.fastInnerText(TD, escaped); //this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
  }
}
