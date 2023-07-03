import { GRID_GROUP } from '../../shortcutContexts';
import { installFocusDetector } from './focusDetector';

/**
 * Installs a focus catcher module. The module observes when the table is focused and depending on
 * which side it was focused on it selects a specified cell or releases the TAB navigation to the
 * browser.
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

  hot.addHook('afterListen', () => deactivate());
  hot.addHook('afterUnlisten', () => activate());
  hot.addHook('afterSelection', () => {
    recentlyAddedFocusCoords = hot.getSelectedRangeLast()?.highlight;
  });

  hot.getShortcutManager()
    .getContext('grid')
    .addShortcut({
      keys: [['Tab'], ['Shift', 'Tab']],
      callback: (event) => {
        const { disableTabNavigation } = hot.getSettings();

        if (disableTabNavigation) {
          hot.deselectCell();
          hot.unlisten();

          return false;
        }

        const isSelected = hot.selection.isSelected();
        const highlight = hot.getSelectedRangeLast()?.highlight;
        const mostTopStartCoords = getMostTopStartPosition(hot);
        const mostBottomEndCoords = getMostBottomEndPosition(hot);

        if (event.shiftKey && (!isSelected || highlight.isEqual(mostTopStartCoords)) ||
            !event.shiftKey && (!isSelected || highlight.isEqual(mostBottomEndCoords))) {
          hot.deselectCell();
          hot.unlisten();

          return false;
        }

        return true;
      },
      runOnlyIf: () => !hot.getSettings().minSpareCols,
      preventDefault: false,
      stopPropagation: false,
      position: 'before',
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

  topRow = topRow === 0 ? rowIndexMapper.getVisualFromRenderableIndex(topRow) : topRow;
  startColumn = startColumn === 0 ? columnIndexMapper.getVisualFromRenderableIndex(startColumn) : startColumn;

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
    bottomRow = navigableHeaders && hot.countColHeaders() > 0 ? -1 : null;
  }
  if (endColumn < 0) {
    endColumn = navigableHeaders && hot.countRowHeaders() > 0 ? -1 : null;
  }

  if (bottomRow === null || endColumn === null) {
    return null;
  }

  return hot._createCellCoords(
    rowIndexMapper.getVisualFromRenderableIndex(bottomRow) ?? bottomRow,
    columnIndexMapper.getVisualFromRenderableIndex(endColumn) ?? endColumn,
  );
}
