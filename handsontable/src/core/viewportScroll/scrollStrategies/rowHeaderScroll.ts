import { Core, ScrollStrategy } from '../types';
import { CellCoords } from '../../../3rdparty/walkontable/src/cell/coords';

/**
 * Scroll strategy for row header selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function rowHeaderScrollStrategy(hot: Core): ScrollStrategy {
  return ({ row }: CellCoords): void => {
    hot.scrollViewportTo({ row });
  };
}
