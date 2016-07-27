import {fastInnerHTML} from './../helpers/dom/element';
import {getRenderer, registerRenderer} from './../renderers';

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
  getRenderer('text').apply(this, arguments);

  value = TD.innerHTML;

  var hash;
  var hashLength = cellProperties.hashLength || value.length;
  var hashSymbol = cellProperties.hashSymbol || '*';

  for (hash = ''; hash.split(hashSymbol).length - 1 < hashLength; hash += hashSymbol) {} // jscs:ignore disallowEmptyBlocks

  fastInnerHTML(TD, hash);
}

export {passwordRenderer};

registerRenderer('password', passwordRenderer);
