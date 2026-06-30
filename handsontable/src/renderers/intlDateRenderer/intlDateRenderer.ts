import { dateRenderer, valueFormatter } from '../dateRenderer/dateRenderer';

export const RENDERER_TYPE = 'intl-date';

export { valueFormatter };

type HotInstance = Record<string, unknown>;

type CellProperties = Record<string, unknown> & {
  dateFormat?: Intl.DateTimeFormatOptions; locale?: string; allowEmpty?: boolean;
};

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
  (dateRenderer as (...args: unknown[]) => void).apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
}

(_intlDateRenderer as IntlDateRendererFn).valueFormatter = valueFormatter;
(_intlDateRenderer as IntlDateRendererFn).RENDERER_TYPE = RENDERER_TYPE;

export const intlDateRenderer = _intlDateRenderer as IntlDateRendererFn;
