import type { HotInstance } from '../../../core/types';
import { collectSelectionFillChanges } from '../../../selection/fillSelection';

export const command = {
  name: 'populateSelectedCellsData',
  callback(hot: HotInstance) {
    const selectedRanges = hot.getSelectedRange();

    if (!selectedRanges?.length) {
      return;
    }

    // The value comes from the cell holding the focus, which is not always the newest layer: the
    // focus rotates between layers with Tab and Enter, and reading `ranges[length - 1]` took the
    // value from whichever layer was added last instead. An open editor fills from the focused cell
    // too, so both paths now answer the keystroke with the same value.
    const normalizedHighlight = (hot.getSelectedRangeActive() ?? selectedRanges[selectedRanges.length - 1])
      .highlight.normalize();
    const highlightRow = normalizedHighlight.row ?? 0;
    const highlightColumn = normalizedHighlight.col ?? 0;
    const changes = collectSelectionFillChanges(
      hot,
      hot.getDataAtCell(highlightRow, highlightColumn),
      selectedRanges,
      highlightRow,
      highlightColumn,
    );

    if (changes.length > 0) {
      hot.setDataAtCell(changes);
    }
  },
};
