export {
  RENDERER_TYPE,
  baseRenderer,
} from './baseRenderer';

import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';

/**
 * Type representing a Handsontable renderer function signature.
 *
 * Custom renderers must be assignable to this type when passed to `registerRenderer`.
 * The `cellProperties` parameter carries the full cell meta object, including all
 * built-in properties (`readOnly`, `className`, `valid`, etc.) and any user-defined
 * extensions.
 */
export type BaseRenderer = (
  instance: HotInstance,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: unknown,
  cellProperties: CellProperties
) => void;
