import {
  normalizeCoordsIfNeeded,
  getMostTopStartPosition,
  getMostBottomEndPosition,
} from '../utils/utils';
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
    contains: (target) => {
      if (container === target || container.contains(target)) {
        return true;
      }

      if (target.closest('.htMenu') !== null) {
        // TODO: Skip switching focus scope to 'grid' for context and dropdown menus since
        // focus management is not implemented for them. Their focus management
        // is handled manually.
        return false;
      }

      return hot.rootPortalElement.contains(target);
    },
    runOnlyIf: () => {
      const { navigableHeaders } = hot.getSettings();

      if (
        hot.countRenderedRows() === 0 && hot.countRenderedCols() === 0 &&
        hot.countRowHeaders() > 0 && hot.countColHeaders() > 0
      ) {
        // when the corner is only rendered, deactivate the scope.
        return false;
      }

      return (
        (!navigableHeaders && (hot.countRenderedRows() > 0 && hot.countRenderedCols() > 0)) ||
        (navigableHeaders && (hot.countRowHeaders() > 0 || hot.countColHeaders() > 0))
      );
    },
    onActivate: (focusSource) => {
      if (focusSource === 'tab_from_above') {
        const mostTopStartCoords = clampCoordsIfNeeded(recentlyAddedFocusCoords) ?? getMostTopStartPosition(hot);

        if (mostTopStartCoords) {
          const result = hot.runHooks('modifyFocusOnTabNavigation', 'from_above', mostTopStartCoords);

          if (result !== false) {
            hot.selectCell(mostTopStartCoords.row, mostTopStartCoords.col);
          }
        }
      } else if (focusSource === 'tab_from_below') {
        const mostBottomEndCoords = clampCoordsIfNeeded(recentlyAddedFocusCoords) ?? getMostBottomEndPosition(hot);

        if (mostBottomEndCoords) {
          const result = hot.runHooks('modifyFocusOnTabNavigation', 'from_below', mostBottomEndCoords);

          if (result !== false) {
            hot.selectCell(mostBottomEndCoords.row, mostBottomEndCoords.col);
          }
        }
      }
    },
  });
}
