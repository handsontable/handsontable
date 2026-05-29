export {
  RENDERER_TYPE,
  baseRenderer,
} from './baseRenderer';

import type { HotInstance } from '../../core/types';

/**
 * Type representing a Handsontable renderer function signature.
 */
export type BaseRenderer = (
  instance: HotInstance,
  td: HTMLTableCellElement,
  row: number,
  col: number,
  prop: string | number,
  value: unknown,
  cellProperties: Record<string, unknown>
) => void;
