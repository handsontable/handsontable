import type { HotInstance } from '../../core/types';
import {
  normalizeCoordsIfNeeded,
  getMostTopStartPosition,
  getMostBottomEndPosition,
} from '../utils/utils';
import { GRID_SCOPE, GRID_GROUP, GRID_TAB_NAVIGATION_GROUP } from '../../shortcuts/contexts';

/**
 * @param {Handsontable} hot The Handsontable instance.
 */
export function focusGridScope(hot: HotInstance) {
  const clampCoordsIfNeeded = normalizeCoordsIfNeeded(hot);

  const rowWrapState = {
    wrapped: false,
    flipped: false,
  };
  let recentlyAddedFocusCoords: Record<string, number> | undefined;
  let isSavingCoordsEnabled = true;
  let isEmptyDataStateActive = false;

  hot.addHook('afterSelection', () => {
    if (isSavingCoordsEnabled) {
      recentlyAddedFocusCoords =
        hot.getSelectedRangeActive()?.highlight as unknown as Record<string, number> | undefined;
    }
  });
  hot.addHook('beforeRowWrap', (
    interruptedByAutoInsertMode: boolean, newCoords: Record<string, number>, isFlipped: boolean) => {
    rowWrapState.wrapped = true;
    rowWrapState.flipped = isFlipped;
  });
  hot.addHook('beforeEmptyDataStateShow', () => {
    isEmptyDataStateActive = true;
  });
  hot.addHook('beforeEmptyDataStateHide', () => {
    isEmptyDataStateActive = false;
  });

  const context = hot.getShortcutManager().getContext(GRID_SCOPE);

  context?.addShortcuts([{
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
    callback(event: KeyboardEvent) {
      const { tabNavigation, autoWrapRow } = hot.getSettings();

      isSavingCoordsEnabled = true;

      if (
        !tabNavigation ||
        !hot.selection.isSelected() ||
        autoWrapRow && rowWrapState.wrapped && rowWrapState.flipped ||
        !autoWrapRow && rowWrapState.wrapped
      ) {
        if (autoWrapRow && rowWrapState.wrapped && rowWrapState.flipped) {
          const newCoords = event.shiftKey
            ? getMostTopStartPosition(hot) : getMostBottomEndPosition(hot);

          recentlyAddedFocusCoords = newCoords as unknown as Record<string, number> | undefined;
        }

        rowWrapState.wrapped = false;
        rowWrapState.flipped = false;
      }
    },
    position: 'after',
  }]);

  const container = hot.rootGridElement ?? hot.rootElement;

  hot.getFocusScopeManager().registerScope('grid', container, {
    contains: (target: HTMLElement) => {
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
        (isEmptyDataStateActive || !navigableHeaders) &&
        hot.countRenderedRows() === 0 && hot.countRenderedCols() === 0 &&
        hot.countRowHeaders() > 0 && hot.countColHeaders() > 0
      ) {
        // When the corner is only rendered, and the EmptyDataState is active, deactivate the scope.
        return false;
      }

      return !!(
        (!navigableHeaders && (hot.countRenderedRows() > 0 && hot.countRenderedCols() > 0)) ||
        (navigableHeaders && (hot.countRowHeaders() > 0 || hot.countColHeaders() > 0))
      );
    },
    onActivate: (focusSource: string) => {
      if (focusSource === 'tab_from_above') {
        const mostTopStartCoords = clampCoordsIfNeeded(recentlyAddedFocusCoords) ?? getMostTopStartPosition(hot);

        if (mostTopStartCoords) {
          const result = hot.runHooks('modifyFocusOnTabNavigation', 'from_above', mostTopStartCoords);
          const { row: topRow, col: topCol } = mostTopStartCoords;

          if (result !== false && topRow !== null && topCol !== null) {
            hot.selectCell(topRow, topCol);
            hot.getFocusManager().focusOnHighlightedCell();
          }
        }
      } else if (focusSource === 'tab_from_below') {
        const mostBottomEndCoords = clampCoordsIfNeeded(recentlyAddedFocusCoords) ?? getMostBottomEndPosition(hot);

        if (mostBottomEndCoords) {
          const result = hot.runHooks('modifyFocusOnTabNavigation', 'from_below', mostBottomEndCoords);
          const { row: bottomRow, col: bottomCol } = mostBottomEndCoords;

          if (result !== false && bottomRow !== null && bottomCol !== null) {
            hot.selectCell(bottomRow, bottomCol);
          }
        }
      }
    },
  });
}
