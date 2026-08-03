import { textRenderer } from '../textRenderer';
import { isEmpty } from '../../helpers/mixed';
import { isObject } from '../../helpers/object';
import { BAD_VALUE_TEXT } from '../../helpers/constants';
import { parseToLocalDateTime } from '../../helpers/dateTime';
import { warn } from '../../helpers/console';

export const RENDERER_TYPE: 'datetime' = 'datetime';

const DEFAULT_INTL_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
};

const stringFormatWarnShown = new WeakSet<object>();

type CellProperties = Record<string, unknown> & {
  dateTimeFormat?: Intl.DateTimeFormatOptions; locale?: string; allowEmpty?: boolean;
  instance?: object;
};

/**
 * Formats a date-time value using Intl.DateTimeFormat.
 *
 * @param {unknown} value The raw ISO date-time value.
 * @param {CellProperties} cellProperties The cell meta object.
 * @returns {unknown} The formatted date-time string, or a placeholder for empty/invalid values.
 */
export function valueFormatter(value: unknown, cellProperties: CellProperties): unknown {
  const { dateTimeFormat, locale, allowEmpty, instance } = cellProperties;

  if (isEmpty(value)) {
    return allowEmpty ? value : BAD_VALUE_TEXT;
  }

  const date = parseToLocalDateTime(value);

  if (date === null) {
    return BAD_VALUE_TEXT;
  }

  if (typeof dateTimeFormat === 'string' && instance && !stringFormatWarnShown.has(instance)) {
    stringFormatWarnShown.add(instance);
    warn(
      'The dateTimeFormat option as a string is not supported. Use an Intl.DateTimeFormatOptions object instead.'
    );
  }

  const intlFormat = isObject(dateTimeFormat)
    ? dateTimeFormat as Intl.DateTimeFormatOptions
    : DEFAULT_INTL_FORMAT;

  return new Intl.DateTimeFormat(locale, intlFormat).format(date);
}

type HotInstance = Record<string, unknown>;

/**
 * The datetime renderer function interface.
 */
export interface DatetimeRendererFn {
  (this: unknown, hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
    prop: string | number, value: unknown, cellProperties: CellProperties): void;
  RENDERER_TYPE: string;
  valueFormatter: typeof valueFormatter;
}

/**
 * Default date-time renderer.
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
function _datetimeRenderer(
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

(_datetimeRenderer as DatetimeRendererFn).valueFormatter = valueFormatter;
(_datetimeRenderer as DatetimeRendererFn).RENDERER_TYPE = RENDERER_TYPE;

export const datetimeRenderer = _datetimeRenderer as DatetimeRendererFn;
