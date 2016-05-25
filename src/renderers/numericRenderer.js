import numeral from 'numeral';
import {getRenderer, registerRenderer} from './../renderers';
import {isNumeric} from './../helpers/number';

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
function numericRenderer(instance, TD, row, col, prop, value, cellProperties) {
  if (isNumeric(value)) {
    if (typeof cellProperties.language !== 'undefined') {
      numeral.language(cellProperties.language);
    }

    value = numeral(value).format(cellProperties.format || '0'); //docs: http://numeraljs.com/

    const className = cellProperties.className || '';

    let classArr = className.length ? className.split(' ') : [];

    if (classArr.indexOf('htLeft') < 0 && classArr.indexOf('htCenter') < 0 &&
        classArr.indexOf('htRight') < 0 && classArr.indexOf('htJustify') < 0) {
      classArr.push('htRight');
    }

    if (classArr.indexOf('htNumeric') < 0) {
      classArr.push('htNumeric');
    }

    cellProperties.className = classArr.join(' ');
  }

  getRenderer('text')(instance, TD, row, col, prop, value, cellProperties);
}

export {numericRenderer};

registerRenderer('numeric', numericRenderer);
