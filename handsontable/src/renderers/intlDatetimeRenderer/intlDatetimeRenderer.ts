import { datetimeRenderer, valueFormatter } from '../datetimeRenderer/datetimeRenderer';

export const RENDERER_TYPE = 'intl-datetime';

export { valueFormatter };

type HotInstance = Record<string, unknown>;

type CellProperties = Record<string, unknown> & {
  dateTimeFormat?: Intl.DateTimeFormatOptions; locale?: string; allowEmpty?: boolean;
};

/**
 * The intl-datetime renderer function interface.
 */
export interface IntlDatetimeRendererFn {
  (this: unknown, hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
    prop: string | number, value: unknown, cellProperties: CellProperties): void;
  RENDERER_TYPE: string;
  valueFormatter: typeof valueFormatter;
}

/**
 * Intl-based date-time renderer.
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
function _intlDatetimeRenderer(
  this: unknown,
  hotInstance: HotInstance,
  TD: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: unknown,
  cellProperties: CellProperties
): void {
  (datetimeRenderer as (...args: unknown[]) => void)
    .apply(this, [hotInstance, TD, row, col, prop, value, cellProperties]);
}

(_intlDatetimeRenderer as IntlDatetimeRendererFn).valueFormatter = valueFormatter;
(_intlDatetimeRenderer as IntlDatetimeRendererFn).RENDERER_TYPE = RENDERER_TYPE;

export const intlDatetimeRenderer = _intlDatetimeRenderer as IntlDatetimeRendererFn;
