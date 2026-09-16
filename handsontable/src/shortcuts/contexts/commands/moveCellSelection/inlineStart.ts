import type { HotInstance } from '../../../../core/types';
import { hasRenderedCells } from '../../../guards';

export const command = {
  name: 'moveCellSelectionInlineStart',
  callback(hot: HotInstance, event: KeyboardEvent) {
    const { selection } = hot;
    const settings = hot.getSettings();
    const selectedRanges = hot.getSelectedRange();
    const selectedRange = hot.getSelectedRangeActive();
    const tabMoves = typeof settings.tabMoves === 'function'
      ? settings.tabMoves(event)
      : settings.tabMoves;

    selection.markSource('keyboard');
    selection.markTabNavigation();

    // `markEndSource()` clears the Tab-navigation flag, so run it from a `finally`: a throw during the
    // transform would otherwise leave the flag set and misclassify the next horizontal arrow move as
    // Tab (mergeCells reads it). The plain `markSource` pattern does not need this because a stale
    // source is not user-visible.
    try {
      if (
        (
          selectedRanges?.some((range: object) =>
            selection.isMultiple(range as import('../../../../3rdparty/walkontable/src/cell/range').default)) ||
          (selectedRanges?.length ?? 0) > 1
        ) &&
        !selectedRange?.isHeader() &&
        hasRenderedCells(hot)
      ) {
        selection.transformFocus(tabMoves?.row ?? 0, tabMoves?.col ?? 0);
      } else {
        selection.transformStart(tabMoves?.row ?? 0, tabMoves?.col ?? 0);
      }
    } finally {
      selection.markEndSource();
    }
  },
};
