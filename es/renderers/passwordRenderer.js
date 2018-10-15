import { fastInnerHTML } from './../helpers/dom/element';
import { getRenderer } from './index';
import { rangeEach } from './../helpers/number';

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

  getRenderer('text').apply(this, [instance, TD, row, col, prop, value, cellProperties].concat(args));

  var hashLength = cellProperties.hashLength || TD.innerHTML.length;
  var hashSymbol = cellProperties.hashSymbol || '*';

  var hash = '';

  rangeEach(hashLength - 1, function () {
    hash += hashSymbol;
  });
  fastInnerHTML(TD, hash);
}

export default passwordRenderer;