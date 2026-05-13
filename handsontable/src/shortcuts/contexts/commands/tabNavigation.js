export const command = {
  name: 'tabNavigation',
  callback(hot) {
    const rowWrapState = {
      wrapped: false,
      flipped: false,
    };
    let isTabOrShiftTabPressed = false;
    let preventViewportScroll = false;

    hot.addHook('afterSelection', (row, column, row2, column2, preventScrolling) => {
      if (isTabOrShiftTabPressed && (rowWrapState.wrapped && rowWrapState.flipped || preventViewportScroll)) {
        preventViewportScroll = false;
        preventScrolling.value = true;
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

        if (!tabNavigation) {
          preventViewportScroll = true;
        }
      },
      after(event) {
        const { tabNavigation, autoWrapRow } = hot.getSettings();

        isTabOrShiftTabPressed = false;

        if (
          !tabNavigation ||
          !hot.selection.isSelected() ||
          autoWrapRow && rowWrapState.wrapped && rowWrapState.flipped ||
          !autoWrapRow && rowWrapState.wrapped
        ) {
          rowWrapState.wrapped = false;
          rowWrapState.flipped = false;
          hot.deselectCell();

          return false;
        }

        // if the selection is still within the table's range then prevent default action
        event.preventDefault();
      }
    };
  },
};
