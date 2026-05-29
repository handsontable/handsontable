import type { HotInstance } from '../../../core/types';

export const command = {
  name: 'tabNavigation',
  callback(hot: HotInstance) {
    const rowWrapState = {
      wrapped: false,
      flipped: false,
    };
    let isTabOrShiftTabPressed = false;
    let preventViewportScroll = false;

    hot.addHook('afterSelection', (
      row: number, column: number, row2: number, column2: number, preventScrolling: { value: boolean }) => {
      if (isTabOrShiftTabPressed && (rowWrapState.wrapped && rowWrapState.flipped || preventViewportScroll)) {
        preventViewportScroll = false;
        preventScrolling.value = true;
      }
    });
    hot.addHook('beforeRowWrap', (interruptedByAutoInsertMode: boolean, newCoords: object, isFlipped: boolean) => {
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
      after(event: KeyboardEvent) {
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
