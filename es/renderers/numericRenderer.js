import numbro from 'numbro';
import { getRenderer } from './index';
import { isNumeric } from './../helpers/number';

/**
 * Numeric cell renderer
 *
 * @private
 * @renderer NumericRenderer
 * @dependencies numbro
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properties (shared by cell renderer and editor)
 */
function numericRenderer(instance, TD, row, col, prop, value, cellProperties) {
  var newValue = value;

  if (isNumeric(newValue)) {
    var numericFormat = cellProperties.numericFormat;
    var cellCulture = numericFormat && numericFormat.culture || '-';
    var cellFormatPattern = numericFormat && numericFormat.pattern;
    var className = cellProperties.className || '';
    var classArr = className.length ? className.split(' ') : [];

    if (typeof cellCulture !== 'undefined' && !numbro.languages()[cellCulture]) {
      var shortTag = cellCulture.replace('-', '');
      var langData = numbro.allLanguages ? numbro.allLanguages[cellCulture] : numbro[shortTag];

      if (langData) {
        numbro.registerLanguage(langData);
      }
    }

    numbro.setLanguage(cellCulture);

    newValue = numbro(newValue).format(cellFormatPattern || '0');

    if (classArr.indexOf('htLeft') < 0 && classArr.indexOf('htCenter') < 0 && classArr.indexOf('htRight') < 0 && classArr.indexOf('htJustify') < 0) {
      classArr.push('htRight');
    }

    if (classArr.indexOf('htNumeric') < 0) {
      classArr.push('htNumeric');
    }

    cellProperties.className = classArr.join(' ');
  }

  getRenderer('text')(instance, TD, row, col, prop, newValue, cellProperties);
}

export default numericRenderer;