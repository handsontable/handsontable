import { columnHeaderSelectionStrategy } from './strategies/columnHeaderSelection';
import { cornerHeaderSelectionStrategy } from './strategies/cornerHeaderSelection';
import { multipleSelectionStrategy } from './strategies/multipleSelection';
import { rowHeaderSelectionStrategy } from './strategies/rowHeaderSelection';
import { singleSelectionStrategy } from './strategies/singleSelection';

/**
 * @typedef ViewportScroller
 * @property {function(): void} skipNextScrollCycle Skip the next scroll cycle.
 * @property {function(CellCoords): void} scrollTo Scroll the viewport to a given cell.
 */
/**
 * Installs a viewport scroller module. The module is responsible for scrolling the viewport to a given cell
 * based on the selection type (single cell selection, multiple cells selection, header selection etc.).
 * It's triggered by the selection module via the `afterSetRangeEnd` hook every time the selection changes.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {ViewportScroller} The viewport scroller module.
 */
export function createViewportScroller(hot) {
  const { selection } = hot;
  let skipNextCall = false;

  return {
    skipNextScrollCycle() {
      skipNextCall = true;
    },
    scrollTo(cellCoords) {
      if (skipNextCall) {
        skipNextCall = false;

        return;
      }

      let scrollStrategy;

      if (selection.isSelectedByCorner()) {
        scrollStrategy = cornerHeaderSelectionStrategy(hot);

      } else if (selection.isSelectedByRowHeader()) {
        scrollStrategy = rowHeaderSelectionStrategy(hot);

      } else if (selection.isSelectedByColumnHeader()) {
        scrollStrategy = columnHeaderSelectionStrategy(hot);

      } else if (selection.isSelected() && selection.isMultiple()) {
        scrollStrategy = multipleSelectionStrategy(hot);

      } else if (selection.isSelected()) {
        scrollStrategy = singleSelectionStrategy(hot);
      }

      const scrollCoords = scrollStrategy?.(cellCoords);

      if (scrollCoords) {
        hot.scrollViewportTo(scrollCoords);
      }
    },
  };
}
