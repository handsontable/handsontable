import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { textRenderer } from '../textRenderer';
import { isNumeric } from '../../helpers/number';
import { deprecatedWarn } from '../../helpers/console';
import { isNumbroScheme, numbroFormatter, intlFormatter } from './utils';

export const RENDERER_TYPE: 'numeric' = 'numeric';
const deprecatedMessageShown = new WeakMap();

/**
 * Formats the value using the numeric format.
 *
 * @param {*} value Value to be rendered.
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {*} Returns the formatted value.
 */
export function valueFormatter(value: unknown, cellProperties: CellProperties) {
  if (isNumeric(value)) {
    if (isNumbroScheme(cellProperties)) {
      value = numbroFormatter(value, cellProperties);
    } else {
      value = intlFormatter(value, cellProperties);
    }
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
export function numericRenderer(
  this: unknown,
  hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
  prop: string | number, value: unknown, cellProperties: CellProperties): void {
  const isNumbroFormat = isNumbroScheme(cellProperties);

  if (isNumbroFormat && !deprecatedMessageShown.has(cellProperties.instance as object)) {
    deprecatedMessageShown.set(cellProperties.instance as object, true);
    deprecatedWarn(
      'The `numericFormat.pattern` and `numericFormat.culture` options are deprecated ' +
      'and will be removed in the next major release. Pass `Intl.NumberFormat` options ' +
      'directly to `numericFormat` and use the `locale` cell property instead of `culture`.\n\n' +
      'Migration guide: https://handsontable.com/docs/migration-from-16.2-to-17.0/\n' +
      '`numericFormat` documentation: https://handsontable.com/docs/api/options/#numericformat\n' +
      '`locale` documentation: https://handsontable.com/docs/api/options/#locale'
    );
  }

  if (isNumeric(hotInstance.getDataAtCell(row, col))) {
    let classArr: string[] = [];

    if (Array.isArray(cellProperties.className)) {
      classArr = cellProperties.className as string[];

    } else {
      const className = (cellProperties.className ?? '') as string;

      if (className.length) {
        classArr = className.split(' ');
      }
    }

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

  textRenderer.apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
}

numericRenderer.valueFormatter = valueFormatter;
numericRenderer.RENDERER_TYPE = RENDERER_TYPE;
