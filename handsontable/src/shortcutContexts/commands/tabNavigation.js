import { getMostTopStartPosition, getMostBottomEndPosition } from '../../helpers/handsontable';

export const command = {
  name: 'tabNavigation',
  callback(hot) {
    const rowWrapState = {
      wrapped: false,
      flipped: false,
    };
    let recentlyAddedFocusCoords;
    let isSavingCoordsEnabled = true;
    let isTabOrShiftTabPressed = false;
    let preventViewportScroll = false;

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

    return {
      before() {
        const { tabNavigation } = hot.getSettings();

        isTabOrShiftTabPressed = true;

        if (hot.getSelectedRangeActive() && !tabNavigation) {
          isSavingCoordsEnabled = false;
        }

        if (!tabNavigation) {
          preventViewportScroll = true;
        }
      },
      after(event) {
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

          rowWrapState.wrapped = false;
          rowWrapState.flipped = false;
          hot.deselectCell();

          return false;
        }

        // if the selection is still within the table's range then prevent default action
        event.preventDefault();
      }
    }
  },
};
