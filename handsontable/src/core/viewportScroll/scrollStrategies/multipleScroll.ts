import { Core, CellCoords, ScrollStrategy } from '../types';

/**
 * Scroll strategy for multiple selections.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function multipleScrollStrategy(hot: Core): ScrollStrategy {
  return (cellCoords: CellCoords): void => {
    hot.scrollViewportTo(cellCoords.toObject());
  };
}
