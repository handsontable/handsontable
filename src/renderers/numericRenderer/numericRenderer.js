import numbro from 'numbro';
import { textRenderer } from '../textRenderer';
import { isNumeric } from '../../helpers/number';

export const RENDERER_TYPE = 'numeric';

/**
 * Numeric cell renderer.
 *
 * @private
 * @param {Core} instance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object ({@see Core#getCellMeta}).
 */
export function numericRenderer(instance, TD, row, col, prop, value, cellProperties) {
  let newValue = value;

  if (isNumeric(newValue)) {
    const numericFormat = cellProperties.numericFormat;
    const cellCulture = numericFormat && numericFormat.culture || '-';
    const cellFormatPattern = numericFormat && numericFormat.pattern;
    const className = cellProperties.className || '';
    const classArr = className.length ? className.split(' ') : [];

    if (typeof cellCulture !== 'undefined' && !numbro.languages()[cellCulture]) {
      const shortTag = cellCulture.replace('-', '');
      const langData = numbro.allLanguages ? numbro.allLanguages[cellCulture] : numbro[shortTag];

      if (langData) {
        numbro.registerLanguage(langData);
      }
    }

    numbro.setLanguage(cellCulture);

    newValue = numbro(newValue).format(cellFormatPattern || '0');

    if (classArr.indexOf('htLeft') < 0 && classArr.indexOf('htCenter') < 0 &&
      classArr.indexOf('htRight') < 0 && classArr.indexOf('htJustify') < 0) {
      classArr.push('htRight');
    }

    if (classArr.indexOf('htNumeric') < 0) {
      classArr.push('htNumeric');
    }

    cellProperties.className = classArr.join(' ');
  }

  textRenderer(instance, TD, row, col, prop, newValue, cellProperties);
}

numericRenderer.RENDERER_TYPE = RENDERER_TYPE;
