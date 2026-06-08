import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import { textRenderer } from '../textRenderer';
import { isNumeric } from '../../helpers/number';
import { warn } from '../../helpers/console';
import { intlFormatter } from './utils';

export const RENDERER_TYPE: 'numeric' = 'numeric';
const unsupportedFormatMessageShown = new WeakSet<object>();

/**
 * Formats the value using the numeric format.
 *
 * @param {*} value Value to be rendered.
 * @param {CellMeta} cellProperties Cell meta object.
 * @returns {*} Returns the formatted value.
 */
export function valueFormatter(value: unknown, cellProperties: CellProperties) {
  if (isNumeric(value)) {
    value = intlFormatter(value, cellProperties);
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
  const numericFormat = cellProperties.numericFormat as Record<string, unknown> | undefined;
  const hasUnsupportedFormat = numericFormat?.pattern !== undefined || numericFormat?.culture !== undefined;

  if (hasUnsupportedFormat) {
    const instance = cellProperties.instance as object;

    if (!unsupportedFormatMessageShown.has(instance)) {
      unsupportedFormatMessageShown.add(instance);
      warn(
        'The numericFormat.pattern and numericFormat.culture options are not supported. ' +
        'Use Intl.NumberFormat options instead (numericFormat: { style, currency, ... }).'
      );
    }
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
