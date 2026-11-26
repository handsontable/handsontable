import type { HotInstance } from '../../../core/types';
import { canNavigateGrid } from '../../guards';
import { createTabWrapState } from './tabWrapState';

export const command = {
  name: 'tabNavigation',
  callback(hot: HotInstance) {
    const wrapState = createTabWrapState(hot);
    let isTabOrShiftTabPressed = false;
    let preventViewportScroll = false;

    hot.addHook('afterSelection', (
      row: number, column: number, row2: number, column2: number, preventScrolling: { value: boolean }) => {
      if (isTabOrShiftTabPressed && (wrapState.isFlippedOffGrid() || preventViewportScroll)) {
        preventViewportScroll = false;
        preventScrolling.value = true;
      }
    });

    return {
      before() {
        const { tabNavigation } = hot.getSettings();

        isTabOrShiftTabPressed = true;
        wrapState.start();

        if (!tabNavigation) {
          preventViewportScroll = true;
        }
      },
      after(event: KeyboardEvent) {
        const { tabNavigation } = hot.getSettings();

        isTabOrShiftTabPressed = false;

        if (
          !tabNavigation ||
          // Nowhere to move the selection to - every column hidden, or an overlay covering the body.
          // Claiming the chord here would swallow `Tab` and leave the user no way out of that overlay,
          // so release it and drop the selection, the same way a wrap off the end of the grid does.
          !canNavigateGrid(hot) ||
          !hot.selection.isSelected() ||
          wrapState.leavesGrid()
        ) {
          wrapState.reset();
          hot.deselectCell();

          return false;
        }

        // if the selection is still within the table's range then prevent default action
        event.preventDefault();
      }
    };
  },
};
