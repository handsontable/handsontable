import { CellCoords } from '../../../3rdparty/walkontable/src/cell/coords';
import { Core, ScrollStrategy } from '../types';

/**
 * Scroll strategy for column header selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function columnHeaderScrollStrategy(hot: Core): ScrollStrategy {
  return ({ col }: CellCoords): void => {
    hot.scrollViewportTo({ col });
  };
}
