'use strict';

exports.__esModule = true;

var _element = require('./../helpers/dom/element');

var _mixed = require('./../helpers/mixed');

var _index = require('./index');

/**
 * Default text renderer
 *
 * @private
 * @renderer TextRenderer
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properties (shared by cell renderer and editor)
 */
function textRenderer(instance, TD, row, col, prop, value, cellProperties) {
  for (var _len = arguments.length, args = Array(_len > 7 ? _len - 7 : 0), _key = 7; _key < _len; _key++) {
    args[_key - 7] = arguments[_key];
  }

  (0, _index.getRenderer)('base').apply(this, [instance, TD, row, col, prop, value, cellProperties].concat(args));
  var escaped = value;

  if (!escaped && cellProperties.placeholder) {
    escaped = cellProperties.placeholder;
  }

  escaped = (0, _mixed.stringify)(escaped);

  if (!instance.getSettings().trimWhitespace) {
    escaped = escaped.replace(/ /g, String.fromCharCode(160));
  }

  if (cellProperties.rendererTemplate) {
    (0, _element.empty)(TD);
    var TEMPLATE = document.createElement('TEMPLATE');
    TEMPLATE.setAttribute('bind', '{{}}');
    TEMPLATE.innerHTML = cellProperties.rendererTemplate;
    HTMLTemplateElement.decorate(TEMPLATE);
    TEMPLATE.model = instance.getSourceDataAtRow(row);
    TD.appendChild(TEMPLATE);
  } else {
    // this is faster than innerHTML. See: https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
    (0, _element.fastInnerText)(TD, escaped);
  }
}

exports.default = textRenderer;