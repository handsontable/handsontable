import { Core, ScrollStrategy } from '../types';
import { CellCoords } from '../../../3rdparty/walkontable/src/cell/coords';

/**
 * Scroll strategy for non-contiguous selections.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function noncontiguousScrollStrategy(hot: Core): ScrollStrategy {
  return (cellCoords: CellCoords): void => {
    hot.scrollViewportTo(cellCoords.toObject());
  };
}
