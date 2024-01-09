/**
 * @typedef ViewportScroller
 * @property {function(): void} skipNextScrollCycle Skip the next scroll cycle.
 * @property {function(CellCoords): void} scrollTo Scroll the viewport to a given cell.
 */
/**
 * Installs a viewport scroller module. The module is responsible for scrolling the viewport to a given cell.
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

      const currentSelectedRange = selection.selectedRange.current();
      const isSelectedByAnyHeader = selection.isSelectedByAnyHeader();
      const isSelectedByRowHeader = selection.isSelectedByRowHeader();
      const isSelectedByColumnHeader = selection.isSelectedByColumnHeader();

      // console.log(selection.getSelectionSource());

      if (!isSelectedByAnyHeader) {
        if (currentSelectedRange && !selection.isMultiple()) {
          const { row, col } = currentSelectedRange.from;

          if (row < 0 && col >= 0) {
            hot.scrollViewportTo({ col });

          } else if (col < 0 && row >= 0) {
            hot.scrollViewportTo({ row });

          } else {
            // const firstColumn = hot.view.getFirstPartiallyVisibleColumn();
            // const lastColumn = hot.view.getLastPartiallyVisibleColumn();

            // console.log(col, firstColumn, lastColumn);

            // if (lastColumn === null || col === lastColumn + 1) {
            //   return false;
            // }

            hot.scrollViewportTo({ row, col });
          }

        } else {
          hot.scrollViewportTo(cellCoords.toObject());
        }

      } else if (isSelectedByRowHeader) {
        hot.scrollViewportTo({ row: cellCoords.row });

      } else if (isSelectedByColumnHeader) {
        hot.scrollViewportTo({ col: cellCoords.col });
      }
    },
  };
}
