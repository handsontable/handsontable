import type { HotInstance } from '../../../core/types';
import { canNavigateGrid } from '../../guards';

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
          // Nowhere to move the selection to - every column hidden, or an overlay covering the body.
          // Claiming the chord here would swallow `Tab` and leave the user no way out of that overlay,
          // so release it and drop the selection, the same way a wrap off the end of the grid does.
          !canNavigateGrid(hot) ||
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
