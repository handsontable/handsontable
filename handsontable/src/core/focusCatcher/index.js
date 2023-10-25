import { GRID_GROUP } from '../../shortcutContexts';
import { installFocusDetector } from './focusDetector';

/**
 * Installs a focus catcher module. The module observes when the table is focused and depending on
 * from the which side it was focused on it selects a specified cell or releases the TAB navigation
 * to the browser.
 *
 * @param {Core} hot The Handsontable instance.
 */
export function installFocusCatcher(hot) {
  let recentlyAddedFocusCoords;

  const { activate, deactivate } = installFocusDetector(hot, {
    onFocusFromTop() {
      const mostTopStartCoords = recentlyAddedFocusCoords ?? getMostTopStartPosition(hot);

      if (mostTopStartCoords) {
        hot.runHooks('modifyFocusOnTabNavigation', 'from_above', mostTopStartCoords);
        hot.selectCell(mostTopStartCoords.row, mostTopStartCoords.col);
      }

      hot.listen();
    },
    onFocusFromBottom() {
      const mostBottomEndCoords = recentlyAddedFocusCoords ?? getMostBottomEndPosition(hot);

      if (mostBottomEndCoords) {
        hot.runHooks('modifyFocusOnTabNavigation', 'from_below', mostBottomEndCoords);
        hot.selectCell(mostBottomEndCoords.row, mostBottomEndCoords.col);
      }

      hot.listen();
    },
  });

  const rowWrapState = {
    wrapped: false,
    flipped: false,
  };

  hot.addHook('afterListen', () => deactivate());
  hot.addHook('afterUnlisten', () => activate());
  hot.addHook('afterSelection', () => {
    recentlyAddedFocusCoords = hot.getSelectedRangeLast()?.highlight;
  });
  hot.addHook('beforeRowWrap', (isWrappingEnabled, newCoords, rowFlipped) => {
    rowWrapState.wrapped = true;
    rowWrapState.flipped = rowFlipped;
  });

  /**
   * Unselects the cell and deactivates the table.
   */
  function deactivateTable() {
    rowWrapState.wrapped = false;
    rowWrapState.flipped = false;
    hot.deselectCell();
    hot.unlisten();
  }

  hot.getShortcutManager()
    .getContext('grid')
    .addShortcut({
      keys: [['Tab'], ['Shift', 'Tab']],
      callback: (event) => {
        const { disableTabNavigation, autoWrapRow } = hot.getSettings();

        if (
          disableTabNavigation ||
          !hot.selection.isSelected() ||
          autoWrapRow && rowWrapState.wrapped && rowWrapState.flipped ||
          !autoWrapRow && rowWrapState.wrapped
        ) {
          if (autoWrapRow && rowWrapState.wrapped && rowWrapState.flipped) {
            recentlyAddedFocusCoords = event.shiftKey
              ? getMostTopStartPosition(hot) : getMostBottomEndPosition(hot);
          }

          deactivateTable();

          return false;
        }

        // if the selection is still within the table's range then prevent default action
        event.preventDefault();
      },
      runOnlyIf: () => !hot.getSettings().minSpareCols,
      preventDefault: false,
      stopPropagation: false,
      position: 'after',
      relativeToGroup: GRID_GROUP,
      group: 'focusCatcher',
    });
}

/**
 * Gets the coordinates of the most top-start cell or header (depends on the table settings and its size).
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {CellCoords|null}
 */
function getMostTopStartPosition(hot) {
  const { rowIndexMapper, columnIndexMapper } = hot;
  const { navigableHeaders } = hot.getSettings();
  let topRow = navigableHeaders && hot.countColHeaders() > 0 ? -hot.countColHeaders() : 0;
  let startColumn = navigableHeaders && hot.countRowHeaders() > 0 ? -hot.countRowHeaders() : 0;

  if (topRow === 0) {
    topRow = rowIndexMapper.getVisualFromRenderableIndex(topRow);
  }

  if (startColumn === 0) {
    startColumn = columnIndexMapper.getVisualFromRenderableIndex(startColumn);
  }

  if (topRow === null || startColumn === null) {
    return null;
  }

  return hot._createCellCoords(topRow, startColumn);
}

/**
 * Gets the coordinates of the most bottom-end cell or header (depends on the table settings and its size).
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {CellCoords|null}
 */
function getMostBottomEndPosition(hot) {
  const { rowIndexMapper, columnIndexMapper } = hot;
  const { navigableHeaders } = hot.getSettings();
  let bottomRow = rowIndexMapper.getRenderableIndexesLength() - 1;
  let endColumn = columnIndexMapper.getRenderableIndexesLength() - 1;

  if (bottomRow < 0) {
    if (!navigableHeaders || hot.countColHeaders() === 0) {
      return null;
    }

    bottomRow = -1;
  }

  if (endColumn < 0) {
    if (!navigableHeaders || hot.countColHeaders() === 0) {
      return null;
    }

    endColumn = -1;
  }

  return hot._createCellCoords(
    rowIndexMapper.getVisualFromRenderableIndex(bottomRow) ?? bottomRow,
    columnIndexMapper.getVisualFromRenderableIndex(endColumn) ?? endColumn,
  );
}
