import { columnHeaderScrollStrategy } from './scrollStrategies/columnHeaderScroll';
import { cornerHeaderScrollStrategy } from './scrollStrategies/cornerHeaderScroll';
import { multipleScrollStrategy } from './scrollStrategies/multipleScroll';
import { rowHeaderScrollStrategy } from './scrollStrategies/rowHeaderScroll';
import { singleScrollStrategy } from './scrollStrategies/singleScroll';

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
        scrollStrategy = cornerHeaderScrollStrategy(hot);

      } else if (selection.isSelectedByRowHeader()) {
        scrollStrategy = rowHeaderScrollStrategy(hot);

      } else if (selection.isSelectedByColumnHeader()) {
        scrollStrategy = columnHeaderScrollStrategy(hot);

      } else if (selection.isSelected() && selection.isMultiple()) {
        scrollStrategy = multipleScrollStrategy(hot);

      } else if (selection.isSelected()) {
        scrollStrategy = singleScrollStrategy(hot);
      }

      scrollStrategy?.(cellCoords);
    },
  };
}
