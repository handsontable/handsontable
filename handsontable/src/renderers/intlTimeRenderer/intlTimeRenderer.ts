import { textRenderer } from '../textRenderer';
import { isEmpty } from '../../helpers/mixed';
import { isObject } from '../../helpers/object';
import { BAD_VALUE_TEXT } from '../../helpers/constants';
import { parseToLocalTime } from '../../helpers/dateTime';

export const RENDERER_TYPE = 'intl-time';

const DEFAULT_INTL_FORMAT: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
};

type CellProperties = Record<string, unknown> & {
  timeFormat?: Intl.DateTimeFormatOptions; locale?: string; allowEmpty?: boolean;
};

/**
 *
 */
export function valueFormatter(value: unknown, cellProperties: CellProperties): unknown {
  const { timeFormat, locale, allowEmpty } = cellProperties;

  if (isEmpty(value)) {
    return allowEmpty ? value : BAD_VALUE_TEXT;
  }

  const time = parseToLocalTime(value);

  if (time === null) {
    return BAD_VALUE_TEXT;
  }

  const intlFormat = isObject(timeFormat) ? timeFormat as Intl.DateTimeFormatOptions : DEFAULT_INTL_FORMAT;

  return new Intl.DateTimeFormat(locale, intlFormat).format(time);
}

type HotInstance = Record<string, unknown>;

export interface IntlTimeRendererFn {
  (this: unknown, hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
    prop: string | number, value: unknown, cellProperties: CellProperties): void;
  RENDERER_TYPE: string;
}

/**
 *
 */
function _intlTimeRenderer(
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
  TD.dir = 'ltr';
}

(_intlTimeRenderer as IntlTimeRendererFn).RENDERER_TYPE = RENDERER_TYPE;

export const intlTimeRenderer = _intlTimeRenderer as IntlTimeRendererFn;
