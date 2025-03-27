import { Core, ScrollStrategy } from '../types';
import { CellCoords } from '../../../core/types';


/**
 * Scroll strategy for corner header selection.
 *
 * @returns {function(): function(CellCoords): void}
 */
export function cornerHeaderScrollStrategy(hot: Core): ScrollStrategy {
  return (): void => {
    // do not scroll the viewport when the corner is clicked
  };
}
