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
function passwordRenderer(instance, TD, row, col, prop, value, cellProperties, ...args) {
  getRenderer('text').apply(this, [instance, TD, row, col, prop, value, cellProperties, ...args]);

  const hashLength = cellProperties.hashLength || TD.innerHTML.length;
  const hashSymbol = cellProperties.hashSymbol || '*';

  let hash = '';

  rangeEach(hashLength - 1, () => {
    hash += hashSymbol;
  });
  fastInnerHTML(TD, hash);
}

export default passwordRenderer;
