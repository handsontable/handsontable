import numbro from 'numbro';
import { textRenderer } from '../textRenderer';
import { isNumeric } from '../../helpers/number';

export const RENDERER_TYPE = 'numeric';

/**
 * Get the rendered value.
 *
 * @param {*} value Value to be rendered.
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {*} Returns the rendered value.
 */
export function getRenderedValue(value, cellProperties) {
  if (isNumeric(value)) {
    const numericFormat = cellProperties.numericFormat;
    const cellCulture = numericFormat && numericFormat.culture || '-';
    const cellFormatPattern = numericFormat && numericFormat.pattern;

    if (typeof cellCulture !== 'undefined' && !numbro.languages()[cellCulture]) {
      const shortTag = cellCulture.replace('-', '');
      const langData = numbro.allLanguages ? numbro.allLanguages[cellCulture] : numbro[shortTag];

      if (langData) {
        numbro.registerLanguage(langData);
      }
    }

    numbro.setLanguage(cellCulture);

    value = numbro(value).format(cellFormatPattern || '0');
  }

  return value;
}

/**
 * Numeric cell renderer.
 *
 * @private
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
 */
export function numericRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  let newValue = value;

  if (isNumeric(newValue)) {
    let classArr = [];

    if (Array.isArray(cellProperties.className)) {
      classArr = cellProperties.className;

    } else {
      const className = cellProperties.className ?? '';

      if (className.length) {
        classArr = className.split(' ');
      }
    }

    newValue = getRenderedValue(newValue, cellProperties);

    if (classArr.indexOf('htLeft') < 0 && classArr.indexOf('htCenter') < 0 &&
      classArr.indexOf('htRight') < 0 && classArr.indexOf('htJustify') < 0) {
      classArr.push('htRight');
    }

    if (classArr.indexOf('htNumeric') < 0) {
      classArr.push('htNumeric');
    }

    cellProperties.className = classArr.join(' ');

    TD.dir = 'ltr';
  }

  textRenderer(hotInstance, TD, row, col, prop, newValue, cellProperties);
}

numericRenderer.RENDERER_TYPE = RENDERER_TYPE;
