import { textRenderer } from '../textRenderer';
import { parseToLocalDate } from '../../helpers/dateTime';
import { isEmpty } from '../../helpers/mixed';
import { isObject } from '../../helpers/object';
import { BAD_VALUE_TEXT } from '../../helpers/constants';

export const RENDERER_TYPE = 'intl-date';

const DEFAULT_INTL_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
};

type CellProperties = Record<string, unknown> & { dateFormat?: Intl.DateTimeFormatOptions; locale?: string; allowEmpty?: boolean };

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

export function intlDateRenderer(
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

(intlDateRenderer as unknown as Record<string, unknown>).valueFormatter = valueFormatter;
(intlDateRenderer as unknown as Record<string, unknown>).RENDERER_TYPE = RENDERER_TYPE;
