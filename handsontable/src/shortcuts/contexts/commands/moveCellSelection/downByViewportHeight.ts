import type { HotInstance } from '../../../../core/types';

export const command = {
  name: 'moveCellSelectionDownByViewportHeight',
  callback(hot: HotInstance) {
    const { selection } = hot;
    const { navigableHeaders } = hot.getSettings();
    const columnHeadersCount = (navigableHeaders ? hot.countColHeaders() : 0);
    const row = hot.getSelectedRangeActive()?.highlight.row ?? 0;
    let rowsStep = hot.countVisibleRows() + columnHeadersCount;

    rowsStep = rowsStep === 0 ? 1 : rowsStep;

    // if the last row is currently selected move the focus to the first row (if autoWrap is enabled)
    if (row === hot.countRows() - 1) {
      rowsStep = 1;

    // if the next move would move the focus off the table calculate the delta to move the selection to
    // the last row
    } else if (row + rowsStep > hot.countRows()) {
      rowsStep = hot.countRows() - row - 1;
    }

    selection.markSource('keyboard');
    selection.transformStart(rowsStep, 0);
    selection.markEndSource();

    // When selection lands in the bottom frozen rows area, the normal scroll strategy
    // is blocked by the Walkontable frozen-row guard. Explicitly scroll the master
    // viewport to the bottom so the frozen rows overlay stays aligned.
    const fixedRowsBottom = hot.getSettings().fixedRowsBottom ?? 0;
    const totalRows = hot.countRows();
    const currentRow = hot.getSelectedRangeActive()?.highlight.row ?? 0;

    if (currentRow < 0) {
      hot.scrollViewportTo({ row: 0 });
    } else if (fixedRowsBottom > 0 && currentRow >= totalRows - fixedRowsBottom) {
      hot.scrollViewportTo({ row: totalRows - fixedRowsBottom - 1, verticalSnap: 'bottom' });
    }
  },
};
