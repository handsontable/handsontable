import { textRenderer } from '../textRenderer';
import { isEmpty } from '../../helpers/mixed';
import { isObject } from '../../helpers/object';
import { BAD_VALUE_TEXT } from '../../helpers/constants';
import { parseToLocalTime } from '../../helpers/dateTime';
import { warn } from '../../helpers/console';

export const RENDERER_TYPE: 'time' = 'time';

const DEFAULT_INTL_FORMAT: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
};

const stringFormatWarnShown = new WeakSet<object>();

type CellProperties = Record<string, unknown> & {
  timeFormat?: Intl.DateTimeFormatOptions; locale?: string; allowEmpty?: boolean;
  instance?: object;
};

/**
 * Formats a time value using Intl.DateTimeFormat.
 *
 * @param {unknown} value The raw time value (24-hour format string).
 * @param {CellProperties} cellProperties The cell meta object.
 * @returns {unknown} The formatted time string, or a placeholder for empty/invalid values.
 */
export function valueFormatter(value: unknown, cellProperties: CellProperties): unknown {
  const { timeFormat, locale, allowEmpty, instance } = cellProperties;

  if (isEmpty(value)) {
    return allowEmpty ? value : BAD_VALUE_TEXT;
  }

  const time = parseToLocalTime(value);

  if (time === null) {
    return BAD_VALUE_TEXT;
  }

  if (typeof timeFormat === 'string' && instance && !stringFormatWarnShown.has(instance)) {
    stringFormatWarnShown.add(instance);
    warn(
      'The timeFormat option as a string is not supported. Use an Intl.DateTimeFormatOptions object instead.'
    );
  }

  const intlFormat = isObject(timeFormat) ? timeFormat as Intl.DateTimeFormatOptions : DEFAULT_INTL_FORMAT;

  return new Intl.DateTimeFormat(locale, intlFormat).format(time);
}

type HotInstance = Record<string, unknown>;

export interface TimeRendererFn {
  (this: unknown, hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
    prop: string | number, value: unknown, cellProperties: CellProperties): void;
  RENDERER_TYPE: string;
  valueFormatter: typeof valueFormatter;
}

/**
 * Default time renderer.
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
function _timeRenderer(
  hotInstance: HotInstance,
  TD: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: unknown,
  cellProperties: CellProperties
): void {
  (textRenderer as (...args: unknown[]) => void).apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);

  TD.dir = 'ltr';
}

(_timeRenderer as TimeRendererFn).valueFormatter = valueFormatter;
(_timeRenderer as TimeRendererFn).RENDERER_TYPE = RENDERER_TYPE;

export const timeRenderer = _timeRenderer as TimeRendererFn;
