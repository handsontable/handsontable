import {
  normalizeCoordsIfNeeded,
  getMostTopStartPosition,
  getMostBottomEndPosition,
} from '../../helpers/handsontable';

/**
 * @param {Handsontable} hot The Handsontable instance.
 */
export function focusGridScope(hot) {
  const clampCoordsIfNeeded = normalizeCoordsIfNeeded(hot);

  let recentlyAddedFocusCoords;

  hot.addHook('afterSelection', () => {
    recentlyAddedFocusCoords = hot.getSelectedRangeActive()?.highlight;
  });

  const container = hot.rootGridElement ?? hot.rootElement;

  hot.getFocusScopeManager().registerScope('grid', container, {
    installFocusDetector: hot.rootGridElement ? true : false,
    onActivation: (focusSource) => {
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
