import { GRID_GROUP } from '../../shortcutContexts';
import { installFocusDetector } from '../../utils/focusDetector';
import { normalizeCoordsIfNeeded } from './utils';
import { getMostTopStartPosition, getMostBottomEndPosition } from '../../helpers/mixed';

/**
 * Installs a focus catcher module. The module observes when the table is focused and depending on
 * from the which side it was focused on it selects a specified cell or releases the TAB navigation
 * to the browser.
 *
 * @param {Core} hot The Handsontable instance.
 */
export function installFocusCatcher(hot) {
  const clampCoordsIfNeeded = normalizeCoordsIfNeeded(hot);
  let recentlyAddedFocusCoords;

  const { activate, deactivate } = installFocusDetector(hot, hot.rootGridElement, {
    onFocus(from) {
      if (from === 'from_above') {
        const mostTopStartCoords = clampCoordsIfNeeded(recentlyAddedFocusCoords) ?? getMostTopStartPosition(hot);

        if (mostTopStartCoords) {
          const result = hot.runHooks('modifyFocusOnTabNavigation', 'from_above', mostTopStartCoords);

          if (result !== false) {
            hot.selectCell(mostTopStartCoords.row, mostTopStartCoords.col);
          }
        }

      } else {
        const mostBottomEndCoords = clampCoordsIfNeeded(recentlyAddedFocusCoords) ?? getMostBottomEndPosition(hot);

        if (mostBottomEndCoords) {
          const result = hot.runHooks('modifyFocusOnTabNavigation', 'from_below', mostBottomEndCoords);

          if (result !== false) {
            hot.selectCell(mostBottomEndCoords.row, mostBottomEndCoords.col);
          }
        }
      }

      hot.listen();
    },
  });

  const rowWrapState = {
    wrapped: false,
    flipped: false,
  };
  let isSavingCoordsEnabled = true;
  let isTabOrShiftTabPressed = false;
  let preventViewportScroll = false;

  hot.addHook('afterListen', () => {
    const activeContextName = hot.getShortcutManager().getActiveContextName();
    const activeContext = hot.getShortcutManager().getContext(activeContextName);

    if (activeContext?.scope === 'table') {
      deactivate();
    }
  });
  hot.addHook('afterUnlisten', () => {
    const activeContextName = hot.getShortcutManager().getActiveContextName();
    const activeContext = hot.getShortcutManager().getContext(activeContextName);

    if (activeContext?.scope === 'table') {
      activate();
    }
  });
  hot.addHook('afterSelection', (row, column, row2, column2, preventScrolling) => {
    if (isTabOrShiftTabPressed && (rowWrapState.wrapped && rowWrapState.flipped || preventViewportScroll)) {
      preventViewportScroll = false;
      preventScrolling.value = true;
    }

    if (isSavingCoordsEnabled) {
      recentlyAddedFocusCoords = hot.getSelectedRangeActive()?.highlight;
    }
  });
  hot.addHook('beforeRowWrap', (interruptedByAutoInsertMode, newCoords, isFlipped) => {
    rowWrapState.wrapped = true;
    rowWrapState.flipped = isFlipped;
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

  const shortcutOptions = {
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

          if (hot.getSelectedRangeActive() && !tabNavigation) {
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
        callback: (event) => {
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
