export {
  RENDERER_TYPE,
  baseRenderer,
} from './baseRenderer';

/**
 * Type representing a Handsontable renderer function signature.
 */
export type BaseRenderer = (
  instance: any,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: any,
  cellProperties: Record<string, unknown>
) => void;
