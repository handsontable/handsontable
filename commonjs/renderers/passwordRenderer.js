'use strict';

exports.__esModule = true;

var _element = require('./../helpers/dom/element');

var _index = require('./index');

var _number = require('./../helpers/number');

/**
 * @private
 * @renderer PasswordRenderer
 * @param instance
 * @param TD
 * @param row
 * @param col
 * @param prop
 * @param value
 * @param cellProperties
 */
function passwordRenderer(instance, TD, row, col, prop, value, cellProperties) {
  for (var _len = arguments.length, args = Array(_len > 7 ? _len - 7 : 0), _key = 7; _key < _len; _key++) {
    args[_key - 7] = arguments[_key];
  }

  (0, _index.getRenderer)('text').apply(this, [instance, TD, row, col, prop, value, cellProperties].concat(args));

  var hashLength = cellProperties.hashLength || TD.innerHTML.length;
  var hashSymbol = cellProperties.hashSymbol || '*';

  var hash = '';

  (0, _number.rangeEach)(hashLength - 1, function () {
    hash += hashSymbol;
  });
  (0, _element.fastInnerHTML)(TD, hash);
}

exports.default = passwordRenderer;