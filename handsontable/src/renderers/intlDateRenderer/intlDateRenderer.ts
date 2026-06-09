import { textRenderer } from '../textRenderer';
import { parseToLocalDate } from '../../helpers/dateTime';
import { isEmpty } from '../../helpers/mixed';
import { isObject } from '../../helpers/object';
import { BAD_VALUE_TEXT } from '../../helpers/constants';
import type { CellProperties } from '../../settings';

export const RENDERER_TYPE = 'intl-date';

const DEFAULT_INTL_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
};

/**
 *
 */
export function valueFormatter(value: unknown, cellProperties: CellProperties): unknown {
  const { dateFormat, locale, allowEmpty } = cellProperties;

  if (isEmpty(value)) {
    return allowEmpty ? value : BAD_VALUE_TEXT;
  }

  const date = parseToLocalDate(value);

  if (date === null) {
    return BAD_VALUE_TEXT;
  }

  const intlFormat = isObject(dateFormat) ? dateFormat as Intl.DateTimeFormatOptions : DEFAULT_INTL_FORMAT;

  return new Intl.DateTimeFormat(locale, intlFormat).format(date);
}

type HotInstance = Record<string, unknown>;

export interface IntlDateRendererFn {
  (this: unknown, hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
    prop: string | number, value: unknown, cellProperties: CellProperties): void;
  RENDERER_TYPE: string;
  valueFormatter: typeof valueFormatter;
}

/**
 *
 */
function _intlDateRenderer(
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

(_intlDateRenderer as IntlDateRendererFn).valueFormatter = valueFormatter;
(_intlDateRenderer as IntlDateRendererFn).RENDERER_TYPE = RENDERER_TYPE;

export const intlDateRenderer = _intlDateRenderer as IntlDateRendererFn;
