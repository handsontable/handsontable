import { GRID_GROUP } from '../../shortcutContexts';
import { installFocusDetector } from './focusDetector';
import { Core } from '../../plugins/types';
import { CellCoords } from '../../3rdparty/walkontable/src/cell/coords';

interface RowWrapState {
  wrapped: boolean;
  flipped: boolean;
}

interface ShortcutOptions {
  keys: string[][];
  preventDefault: boolean;
  stopPropagation: boolean;
  relativeToGroup: string;
  group: string;
  callback?: () => void;
  position?: 'before' | 'after';
}

/**
 * Installs a focus catcher module. The module observes when the table is focused and depending on
 * from the which side it was focused on it selects a specified cell or releases the TAB navigation
 * to the browser.
 *
 * @param {Core} hot The Handsontable instance.
 */
export function installFocusCatcher(hot: Core): void {
  const clampCoordsIfNeeded = normalizeCoordsIfNeeded(hot);
  let recentlyAddedFocusCoords: CellCoords | null = null;

  const { activate, deactivate } = installFocusDetector(hot, {
    onFocusFromTop() {
      const mostTopStartCoords = clampCoordsIfNeeded(recentlyAddedFocusCoords) ?? getMostTopStartPosition(hot);

      if (mostTopStartCoords) {
        hot.runHooks('modifyFocusOnTabNavigation', 'from_above', mostTopStartCoords);
        hot.selectCell(mostTopStartCoords.row, mostTopStartCoords.col);
      }

      hot.listen();
    },
    onFocusFromBottom() {
      const mostBottomEndCoords = clampCoordsIfNeeded(recentlyAddedFocusCoords) ?? getMostBottomEndPosition(hot);

      if (mostBottomEndCoords) {
        hot.runHooks('modifyFocusOnTabNavigation', 'from_below', mostBottomEndCoords);
        hot.selectCell(mostBottomEndCoords.row, mostBottomEndCoords.col);
      }

      hot.listen();
    },
  });

  const rowWrapState: RowWrapState = {
    wrapped: false,
    flipped: false,
  };
  let isSavingCoordsEnabled = true;
  let isTabOrShiftTabPressed = false;
  let preventViewportScroll = false;

  hot.addHook('afterListen', () => deactivate());
  hot.addHook('afterUnlisten', () => activate());
  hot.addHook('afterSelection', (row: number, column: number, row2: number, column2: number, preventScrolling: { value: boolean }) => {
    if (isTabOrShiftTabPressed && (rowWrapState.wrapped && rowWrapState.flipped || preventViewportScroll)) {
      preventViewportScroll = false;
      preventScrolling.value = true;
    }

    if (isSavingCoordsEnabled) {
      recentlyAddedFocusCoords = hot.getSelectedRangeLast()?.highlight ?? null;
    }
  });
  hot.addHook('beforeRowWrap', (interruptedByAutoInsertMode: boolean, newCoords: CellCoords, isFlipped: boolean) => {
    rowWrapState.wrapped = true;
    rowWrapState.flipped = isFlipped;
  });

  /**
   * Unselects the cell and deactivates the table.
   */
  function deactivateTable(): void {
    rowWrapState.wrapped = false;
    rowWrapState.flipped = false;
    hot.deselectCell();
    hot.unlisten();
  }

  const shortcutOptions: ShortcutOptions = {
    keys: [['Tab'], ['Shift', 'Tab']],
    preventDefault: false,
    stopPropagation: false,
    relativeToGroup: GRID_GROUP,
    group: 'focusCatcher',
  };

  hot.getShortcutManager()
    .getContext('grid')
    .addShortcuts([
      {
        ...shortcutOptions,
        callback: () => {
          const { tabNavigation } = hot.getSettings();

          isTabOrShiftTabPressed = true;

          if (hot.getSelectedRangeLast() && !tabNavigation) {
            isSavingCoordsEnabled = false;
          }

          if (!tabNavigation) {
            preventViewportScroll = true;
          }
        },
        position: 'before',
      },
      {
        ...shortcutOptions,
        callback: (event: KeyboardEvent) => {
          const { tabNavigation, autoWrapRow } = hot.getSettings();

          isTabOrShiftTabPressed = false;
          isSavingCoordsEnabled = true;

          if (
            !tabNavigation ||
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
        position: 'after',
      }
    ]);
}

/**
 * Gets the coordinates of the most top-start cell or header (depends on the table settings and its size).
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {CellCoords|null}
 */
function getMostTopStartPosition(hot: Core): CellCoords | null {
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
function getMostBottomEndPosition(hot: Core): CellCoords | null {
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

/**
 * Normalizes the coordinates (clamps to nearest visible cell position within dataset range).
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {function(Coords | undefined): Coords | null}
 */
function normalizeCoordsIfNeeded(hot: Core): (coords: CellCoords | null) => CellCoords | null {
  return (coords: CellCoords | null): CellCoords | null => {
    if (!coords) {
      return null;
    }

    const mostTopStartCoords = getMostTopStartPosition(hot);
    const mostBottomEndCoords = getMostBottomEndPosition(hot);

    if (!mostTopStartCoords || !mostBottomEndCoords) {
      return null;
    }

    if (coords.col < mostTopStartCoords.col) {
      coords.col = mostTopStartCoords.col;
    }
    if (coords.col > mostBottomEndCoords.col) {
      coords.col = mostBottomEndCoords.col;
    }

    if (coords.row < mostTopStartCoords.row) {
      coords.row = mostTopStartCoords.row;
    }
    if (coords.row > mostBottomEndCoords.row) {
      coords.row = mostBottomEndCoords.row;
    }

    return coords;
  };
}
