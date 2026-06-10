import { textRenderer } from '../textRenderer';
import { parseToLocalDate } from '../../helpers/dateTime';
import { isEmpty } from '../../helpers/mixed';
import { isObject } from '../../helpers/object';
import { BAD_VALUE_TEXT } from '../../helpers/constants';
import { warn } from '../../helpers/console';

export const RENDERER_TYPE: 'date' = 'date';

const DEFAULT_INTL_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
};

const stringFormatWarnShown = new WeakSet<object>();

type CellProperties = Record<string, unknown> & {
  dateFormat?: Intl.DateTimeFormatOptions; locale?: string; allowEmpty?: boolean;
  instance?: object;
};

/**
 * Formats a date value using Intl.DateTimeFormat.
 *
 * @param {unknown} value The raw date value (ISO 8601 string).
 * @param {CellProperties} cellProperties The cell meta object.
 * @returns {unknown} The formatted date string, or a placeholder for empty/invalid values.
 */
export function valueFormatter(value: unknown, cellProperties: CellProperties): unknown {
  const { dateFormat, locale, allowEmpty, instance } = cellProperties;

  if (isEmpty(value)) {
    return allowEmpty ? value : BAD_VALUE_TEXT;
  }

  if (typeof dateFormat === 'string') {
    if (instance && !stringFormatWarnShown.has(instance)) {
      stringFormatWarnShown.add(instance);
      warn('The dateFormat option as a string is not supported. Use an Intl.DateTimeFormatOptions object instead.');
    }

    return value;
  }

  const date = parseToLocalDate(value);

  if (date === null) {
    return BAD_VALUE_TEXT;
  }

  const intlFormat = isObject(dateFormat) ? dateFormat as Intl.DateTimeFormatOptions : DEFAULT_INTL_FORMAT;

  return new Intl.DateTimeFormat(locale, intlFormat).format(date);
}

type HotInstance = Record<string, unknown>;

export interface DateRendererFn {
  (this: unknown, hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
    prop: string | number, value: unknown, cellProperties: CellProperties): void;
  RENDERER_TYPE: string;
  valueFormatter: typeof valueFormatter;
}

/**
 * Handsontable renderer for date cells.
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
function _dateRenderer(
  this: unknown,
  hotInstance: HotInstance,
  TD: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: unknown,
  cellProperties: CellProperties
): void {
  (textRenderer as (...args: unknown[]) => void).apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
}

(_dateRenderer as DateRendererFn).valueFormatter = valueFormatter;
(_dateRenderer as DateRendererFn).RENDERER_TYPE = RENDERER_TYPE;

export const dateRenderer = _dateRenderer as DateRendererFn;
