import { timeRenderer } from '../timeRenderer/timeRenderer';

export const RENDERER_TYPE = 'intl-time';

export { valueFormatter } from '../timeRenderer/timeRenderer';

type HotInstance = Record<string, unknown>;

type CellProperties = Record<string, unknown> & {
  timeFormat?: Intl.DateTimeFormatOptions; locale?: string; allowEmpty?: boolean;
};

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
  (timeRenderer as (...args: unknown[]) => void).apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
}

(_intlTimeRenderer as IntlTimeRendererFn).RENDERER_TYPE = RENDERER_TYPE;

export const intlTimeRenderer = _intlTimeRenderer as IntlTimeRendererFn;
