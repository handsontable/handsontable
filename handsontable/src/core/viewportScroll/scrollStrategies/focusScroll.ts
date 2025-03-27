import { Core, ScrollStrategy } from '../types';
import { CellCoords } from '../../../core/types';

/**
 * Scroll strategy for changed the focus position of the selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function focusScrollStrategy(hot: Core): ScrollStrategy {
  return (cellCoords: CellCoords): void => {
    hot.scrollViewportTo(cellCoords.toObject());
  };
}
