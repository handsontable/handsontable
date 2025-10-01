import {
  normalizeCoordsIfNeeded,
  getMostTopStartPosition,
  getMostBottomEndPosition,
} from '../../helpers/handsontable';
import { GRID_SCOPE, GRID_GROUP, GRID_TAB_NAVIGATION_GROUP } from '../../shortcutContexts';

/**
 * @param {Handsontable} hot The Handsontable instance.
 */
export function focusGridScope(hot) {
  const clampCoordsIfNeeded = normalizeCoordsIfNeeded(hot);

  const rowWrapState = {
    wrapped: false,
    flipped: false,
  };
  let recentlyAddedFocusCoords;
  let isSavingCoordsEnabled = true;

  hot.addHook('afterSelection', () => {
    if (isSavingCoordsEnabled) {
      recentlyAddedFocusCoords = hot.getSelectedRangeActive()?.highlight;
    }
  });
  hot.addHook('beforeRowWrap', (interruptedByAutoInsertMode, newCoords, isFlipped) => {
    rowWrapState.wrapped = true;
    rowWrapState.flipped = isFlipped;
  });

  const context = hot.getShortcutManager().getContext(GRID_SCOPE);

  context.addShortcuts([{
    keys: [['Tab'], ['Shift', 'Tab']],
    preventDefault: false,
    stopPropagation: false,
    relativeToGroup: GRID_GROUP,
    group: GRID_TAB_NAVIGATION_GROUP,
    position: 'before',
    callback() {
      const { tabNavigation } = hot.getSettings();

      if (hot.getSelectedRangeActive() && !tabNavigation) {
        isSavingCoordsEnabled = false;
      }
    },
  }, {
    keys: [['Tab'], ['Shift', 'Tab']],
    preventDefault: false,
    stopPropagation: false,
    relativeToGroup: GRID_GROUP,
    group: GRID_TAB_NAVIGATION_GROUP,
    callback(event) {
      const { tabNavigation, autoWrapRow } = hot.getSettings();

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

        rowWrapState.wrapped = false;
        rowWrapState.flipped = false;
      }
    },
    position: 'after',
  }]);

  const container = hot.rootGridElement ?? hot.rootElement;

  hot.getFocusScopeManager().registerScope('grid', container, {
    installFocusDetector: !!hot.rootGridElement,
    contains: (target) => {
      return container.contains(target) || hot.rootPortalElement.contains(target);
    },
    callback: (focusSource) => {
      if (focusSource === 'from_above') {
        const mostTopStartCoords = clampCoordsIfNeeded(recentlyAddedFocusCoords) ?? getMostTopStartPosition(hot);

        if (mostTopStartCoords) {
          const result = hot.runHooks('modifyFocusOnTabNavigation', focusSource, mostTopStartCoords);

          if (result !== false) {
            hot.selectCell(mostTopStartCoords.row, mostTopStartCoords.col);
          }
        }
      } else if (focusSource === 'from_below') {
        const mostBottomEndCoords = clampCoordsIfNeeded(recentlyAddedFocusCoords) ?? getMostBottomEndPosition(hot);

        if (mostBottomEndCoords) {
          const result = hot.runHooks('modifyFocusOnTabNavigation', focusSource, mostBottomEndCoords);

          if (result !== false) {
            hot.selectCell(mostBottomEndCoords.row, mostBottomEndCoords.col);
          }
        }
      }
    },
  });
}
