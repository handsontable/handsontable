import type { HotInstance } from '../../../../core/types';

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

    if (
      (
        selectedRanges?.some((range: object) =>
          selection.isMultiple(range as import('../../../../3rdparty/walkontable/src/cell/range').default)) ||
        (selectedRanges?.length ?? 0) > 1
      ) &&
      !selectedRange?.isHeader() &&
      hot.countRenderedCols() > 0 &&
      hot.countRenderedRows() > 0
    ) {
      selection.transformFocus(tabMoves?.row ?? 0, tabMoves?.col ?? 0);
    } else {
      selection.transformStart(tabMoves?.row ?? 0, tabMoves?.col ?? 0);
    }

    selection.markEndSource();
  },
};
