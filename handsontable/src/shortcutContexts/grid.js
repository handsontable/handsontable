import { isDefined } from '../helpers/mixed';

const SHORTCUTS_GROUP = 'gridDefault';

/**
 * The context that defines shortcut list available for selected cell or cells.
 *
 * @param {Handsontable} hot The Handsontable instance.
 */
export function shortcutsGridContext(hot) {
  const { selection, rowIndexMapper, columnIndexMapper } = hot;
  const hotSettings = hot.getSettings();
  const context = hot.getShortcutManager().addContext('grid');
  const config = {
    runOnlyIf: () => {
      return isDefined(hot.getSelected()) &&
        hot.countRenderedRows() > 0 &&
        hot.countRenderedCols() > 0;
    },
    group: SHORTCUTS_GROUP,
  };

  context.addShortcuts([{
    keys: [['Control/Meta', 'A'], ['Control/Meta', 'Shift', 'Space']],
    callback: () => {
      hot.selectAll();
    },
  }, {
    keys: [['Control/Meta', 'Enter']],
    callback: () => {
      const selectedRange = hot.getSelectedRange();
      const {
        row: highlightRow,
        col: highlightColumn,
      } = selectedRange[selectedRange.length - 1].highlight;
      const valueToPopulate = hot.getDataAtCell(highlightRow, highlightColumn);
      const cellValues = new Map();

      for (let i = 0; i < selectedRange.length; i++) {
        selectedRange[i].forAll((row, column) => {
          if (row >= 0 && column >= 0 && (row !== highlightRow || column !== highlightColumn)) {
            const { readOnly } = hot.getCellMeta(row, column);

            if (!readOnly) {
              cellValues.set(`${row}x${column}`, [row, column, valueToPopulate]);
            }
          }
        });
      }

      hot.setDataAtCell(Array.from(cellValues.values()));
    },
    runOnlyIf: () => hot.getSelectedRangeLast().getCellsCount() > 1,
  }, {
    keys: [['ArrowUp']],
    callback: () => {
      selection.transformStart(-1, 0);
    },
  }, {
    keys: [['ArrowUp', 'Control/Meta']],
    captureCtrl: true,
    callback: () => {
      selection.setRangeStart(hot._createCellCoords(
        rowIndexMapper.getNearestNotHiddenIndex(0, 1),
        hot.getSelectedRangeLast().highlight.col,
      ));
    },
  }, {
    keys: [
      ['ArrowUp', 'Shift'],
    ],
    callback: () => {
      selection.transformEnd(-1, 0);
    },
  }, {
    keys: [
      ['ArrowUp', 'Shift', 'Control/Meta'],
    ],
    captureCtrl: true,
    callback: () => {
      const { from, to } = hot.getSelectedRangeLast();
      const row = rowIndexMapper.getNearestNotHiddenIndex(0, 1);

      selection.setRangeStart(from.clone());
      selection.setRangeEnd(hot._createCellCoords(row, to.col));
    },
    runOnlyIf: () => !(hot.selection.isSelectedByCorner() || hot.selection.isSelectedByColumnHeader()),
  }, {
    keys: [['ArrowDown']],
    callback: () => {
      selection.transformStart(1, 0);
    },
  }, {
    keys: [['ArrowDown', 'Control/Meta']],
    captureCtrl: true,
    callback: () => {
      selection.setRangeStart(hot._createCellCoords(
        rowIndexMapper.getNearestNotHiddenIndex(hot.countRows() - 1, -1),
        hot.getSelectedRangeLast().highlight.col,
      ));
    },
  }, {
    keys: [
      ['ArrowDown', 'Shift'],
    ],
    callback: () => {
      selection.transformEnd(1, 0);
    },
  }, {
    keys: [
      ['ArrowDown', 'Shift', 'Control/Meta'],
    ],
    captureCtrl: true,
    callback: () => {
      const { from, to } = hot.getSelectedRangeLast();
      const row = rowIndexMapper.getNearestNotHiddenIndex(hot.countRows() - 1, -1);

      selection.setRangeStart(from.clone());
      selection.setRangeEnd(hot._createCellCoords(row, to.col));
    },
    runOnlyIf: () => !(hot.selection.isSelectedByCorner() || hot.selection.isSelectedByColumnHeader()),
  }, {
    keys: [['ArrowLeft']],
    callback: () => {
      selection.transformStart(0, -1 * hot.getDirectionFactor());
    },
  }, {
    keys: [['ArrowLeft', 'Control/Meta']],
    captureCtrl: true,
    callback: () => {
      const row = hot.getSelectedRangeLast().highlight.row;
      const column = columnIndexMapper.getNearestNotHiddenIndex(
        ...(hot.isRtl() ? [hot.countCols() - 1, -1] : [0, 1])
      );

      selection.setRangeStart(hot._createCellCoords(row, column));
    },
  }, {
    keys: [
      ['ArrowLeft', 'Shift'],
    ],
    callback: () => {
      selection.transformEnd(0, -1 * hot.getDirectionFactor());
    },
  }, {
    keys: [
      ['ArrowLeft', 'Shift', 'Control/Meta'],
    ],
    captureCtrl: true,
    callback: () => {
      const { from, to } = hot.getSelectedRangeLast();
      const column = columnIndexMapper.getNearestNotHiddenIndex(
        ...(hot.isRtl() ? [hot.countCols() - 1, -1] : [0, 1])
      );

      selection.setRangeStart(from.clone());
      selection.setRangeEnd(hot._createCellCoords(to.row, column));
    },
    runOnlyIf: () => !(hot.selection.isSelectedByCorner() || hot.selection.isSelectedByRowHeader()),
  }, {
    keys: [['ArrowRight']],
    callback: () => {
      selection.transformStart(0, hot.getDirectionFactor());
    },
  }, {
    keys: [['ArrowRight', 'Control/Meta']],
    captureCtrl: true,
    callback: () => {
      const row = hot.getSelectedRangeLast().highlight.row;
      const column = columnIndexMapper.getNearestNotHiddenIndex(
        ...(hot.isRtl() ? [0, 1] : [hot.countCols() - 1, -1])
      );

      selection.setRangeStart(hot._createCellCoords(row, column));
    },
  }, {
    keys: [
      ['ArrowRight', 'Shift'],
    ],
    callback: () => {
      selection.transformEnd(0, hot.getDirectionFactor());
    },
  }, {
    keys: [
      ['ArrowRight', 'Shift', 'Control/Meta'],
    ],
    captureCtrl: true,
    callback: () => {
      const { from, to } = hot.getSelectedRangeLast();
      const column = columnIndexMapper.getNearestNotHiddenIndex(
        ...(hot.isRtl() ? [0, 1] : [hot.countCols() - 1, -1])
      );

      selection.setRangeStart(from.clone());
      selection.setRangeEnd(hot._createCellCoords(to.row, column));
    },
    runOnlyIf: () => !(hot.selection.isSelectedByCorner() || hot.selection.isSelectedByRowHeader()),
  }, {
    keys: [['Home']],
    captureCtrl: true,
    callback: () => {
      const fixedColumns = parseInt(hot.getSettings().fixedColumnsStart, 10);
      const row = hot.getSelectedRangeLast().highlight.row;
      const column = columnIndexMapper.getNearestNotHiddenIndex(fixedColumns, 1);

      selection.setRangeStart(hot._createCellCoords(row, column));
    },
    runOnlyIf: () => hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [['Home', 'Shift']],
    callback: () => {
      selection.setRangeEnd(hot._createCellCoords(
        selection.selectedRange.current().from.row,
        columnIndexMapper.getNearestNotHiddenIndex(0, 1),
      ));
    },
  }, {
    keys: [['Home', 'Control/Meta']],
    captureCtrl: true,
    callback: () => {
      const fixedRows = parseInt(hot.getSettings().fixedRowsTop, 10);
      const fixedColumns = parseInt(hot.getSettings().fixedColumnsStart, 10);
      const row = rowIndexMapper.getNearestNotHiddenIndex(fixedRows, 1);
      const column = columnIndexMapper.getNearestNotHiddenIndex(fixedColumns, 1);

      selection.setRangeStart(hot._createCellCoords(row, column));
    },
    runOnlyIf: () => hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [['End']],
    captureCtrl: true,
    callback: () => {
      selection.setRangeStart(hot._createCellCoords(
        hot.getSelectedRangeLast().highlight.row,
        columnIndexMapper.getNearestNotHiddenIndex(hot.countCols() - 1, -1),
      ));
    },
    runOnlyIf: () => hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [['End', 'Shift']],
    callback: () => {
      selection.setRangeEnd(hot._createCellCoords(
        selection.selectedRange.current().from.row,
        columnIndexMapper.getNearestNotHiddenIndex(hot.countCols() - 1, -1),
      ));
    },
  }, {
    keys: [['End', 'Control/Meta']],
    captureCtrl: true,
    callback: () => {
      const fixedRows = parseInt(hot.getSettings().fixedRowsBottom, 10);
      const row = rowIndexMapper.getNearestNotHiddenIndex(hot.countRows() - fixedRows - 1, -1);
      const column = columnIndexMapper.getNearestNotHiddenIndex(hot.countCols() - 1, -1);

      selection.setRangeStart(hot._createCellCoords(row, column));
    },
    runOnlyIf: () => hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [
      ['PageUp'],
    ],
    callback: () => {
      selection.transformStart(-hot.countVisibleRows(), 0);
    },
  }, {
    keys: [
      ['PageUp', 'Shift']
    ],
    callback: () => {
      const { to } = hot.getSelectedRangeLast();
      const nextRowIndexToSelect = Math.max(to.row - hot.countVisibleRows(), 0);
      const row = rowIndexMapper.getNearestNotHiddenIndex(nextRowIndexToSelect, 1);

      if (row !== null) {
        const coords = hot._createCellCoords(row, to.col);
        const scrollPadding = to.row - hot.view.getFirstFullyVisibleRow();
        const nextVerticalScroll = Math.max(coords.row - scrollPadding, 0);

        selection.setRangeEnd(coords);
        hot.scrollViewportTo(nextVerticalScroll);
      }
    },
  }, {
    keys: [
      ['PageDown'],
    ],
    callback: () => {
      selection.transformStart(hot.countVisibleRows(), 0);
    },
  }, {
    keys: [
      ['PageDown', 'Shift']
    ],
    callback: () => {
      const { to } = hot.getSelectedRangeLast();
      const nextRowIndexToSelect = Math.min(to.row + hot.countVisibleRows(), hot.countRows() - 1);
      const row = rowIndexMapper.getNearestNotHiddenIndex(nextRowIndexToSelect, -1);

      if (row !== null) {
        const coords = hot._createCellCoords(row, to.col);
        const scrollPadding = to.row - hot.view.getFirstFullyVisibleRow();
        const nextVerticalScroll = Math.min(coords.row - scrollPadding, hot.countRows() - 1);

        selection.setRangeEnd(coords);
        hot.scrollViewportTo(nextVerticalScroll);
      }
    },
  }, {
    keys: [['Tab']],
    callback: (event) => {
      const tabMoves = typeof hotSettings.tabMoves === 'function'
        ? hotSettings.tabMoves(event)
        : hotSettings.tabMoves;

      selection.transformStart(tabMoves.row, tabMoves.col, true);
    },
  }, {
    keys: [['Shift', 'Tab']],
    callback: (event) => {
      const tabMoves = typeof hotSettings.tabMoves === 'function'
        ? hotSettings.tabMoves(event)
        : hotSettings.tabMoves;

      selection.transformStart(-tabMoves.row, -tabMoves.col);
    },
  }], config);
}
