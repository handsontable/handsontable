import { isDefined } from '../helpers/mixed';
import { GRID_GROUP, EDITOR_EDIT_GROUP } from './constants';
import { createKeyboardShortcutCommandsPool } from './commands';

/**
 * The context that defines shortcut list available for selected cell or cells.
 *
 * @param {Handsontable} hot The Handsontable instance.
 */
export function shortcutsGridContext(hot) {
  const context = hot.getShortcutManager().addContext('grid');
  const commandsPool = createKeyboardShortcutCommandsPool(hot);
  const config = {
    runOnlyIf: () => {
      const { navigableHeaders } = hot.getSettings();

      return isDefined(hot.getSelected()) &&
        (navigableHeaders || !navigableHeaders && hot.countRenderedRows() > 0 && hot.countRenderedCols() > 0);
    },
    group: GRID_GROUP,
  };

  context.addShortcuts([{
    keys: [['F2']],
    callback: event => commandsPool.editorFastOpen(event),
  }, {
    keys: [['Enter'], ['Enter', 'Shift']],
    callback: (event, keys) => commandsPool.editorOpen(event, keys),
  }, {
    keys: [['Backspace'], ['Delete']],
    callback: () => commandsPool.emptySelectedCells(),
  }], {
    group: EDITOR_EDIT_GROUP,
    runOnlyIf: () => isDefined(hot.getSelected()),
  });

  context.addShortcuts([{
    keys: [['Control/Meta', 'A']],
    callback: () => commandsPool.selectAllCells(),
    runOnlyIf: () => !hot.getSelectedRangeLast()?.highlight.isHeader(),
  }, {
    keys: [['Control/Meta', 'A']],
    callback: () => {},
    runOnlyIf: () => hot.getSelectedRangeLast()?.highlight.isHeader(),
    preventDefault: true,
  }, {
    keys: [['Control/Meta', 'Shift', 'Space']],
    callback: () => commandsPool.selectAllCellsAndHeaders(),
  }, {
    keys: [['Control/Meta', 'Enter']],
    callback: () => commandsPool.populateSelectedCellsData(),
    runOnlyIf: () => {
      return !hot.getSelectedRangeLast()?.highlight.isHeader() && hot.getSelectedRangeLast()?.getCellsCount() > 1;
    },
  }, {
    keys: [['Control', 'Space']],
    captureCtrl: true,
    callback: () => commandsPool.extendCellsSelectionToColumns(),
  }, {
    keys: [['Shift', 'Space']],
    stopPropagation: true,
    callback: () => commandsPool.extendCellsSelectionToRows(),
  }, {
    keys: [['ArrowUp']],
    callback: () => commandsPool.moveCellSelectionUp(),
  }, {
    keys: [['ArrowUp', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostTop(),
  }, {
    keys: [['ArrowUp', 'Shift']],
    callback: () => commandsPool.extendCellsSelectionUp(),
  }, {
    keys: [['ArrowUp', 'Shift', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.extendCellsSelectionToMostTop(),
    runOnlyIf: () => !(hot.selection.isSelectedByCorner() || hot.selection.isSelectedByColumnHeader()),
  }, {
    keys: [['ArrowDown']],
    callback: () => commandsPool.moveCellSelectionDown(),
  }, {
    keys: [['ArrowDown', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostBottom(),
  }, {
    keys: [['ArrowDown', 'Shift']],
    callback: () => commandsPool.extendCellsSelectionDown(),
  }, {
    keys: [['ArrowDown', 'Shift', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.extendCellsSelectionToMostBottom(),
    runOnlyIf: () => !(hot.selection.isSelectedByCorner() || hot.selection.isSelectedByColumnHeader()),
  }, {
    keys: [['ArrowLeft']],
    callback: () => commandsPool.moveCellSelectionLeft(),
  }, {
    keys: [['ArrowLeft', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostLeft(),
  }, {
    keys: [['ArrowLeft', 'Shift']],
    callback: () => commandsPool.extendCellsSelectionLeft(),
  }, {
    keys: [['ArrowLeft', 'Shift', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.extendCellsSelectionToMostLeft(),
    runOnlyIf: () => !(hot.selection.isSelectedByCorner() || hot.selection.isSelectedByRowHeader()),
  }, {
    keys: [['ArrowRight']],
    callback: () => commandsPool.moveCellSelectionRight(),
  }, {
    keys: [['ArrowRight', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostRight(),
  }, {
    keys: [['ArrowRight', 'Shift']],
    callback: () => commandsPool.extendCellsSelectionRight(),
  }, {
    keys: [['ArrowRight', 'Shift', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.extendCellsSelectionToMostRight(),
    runOnlyIf: () => !(hot.selection.isSelectedByCorner() || hot.selection.isSelectedByRowHeader()),
  }, {
    keys: [['Home']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostInlineStart(),
    runOnlyIf: () => hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [['Home', 'Shift']],
    callback: () => commandsPool.extendCellsSelectionToMostInlineStart(),
  }, {
    keys: [['Home', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostTopInlineStart(),
    runOnlyIf: () => hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [['End']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostInlineEnd(),
    runOnlyIf: () => hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [['End', 'Shift']],
    callback: () => commandsPool.extendCellsSelectionToMostInlineEnd(),
  }, {
    keys: [['End', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostBottomInlineEnd(),
    runOnlyIf: () => hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [['PageUp']],
    callback: () => commandsPool.moveCellSelectionUpByViewportHight(),
  }, {
    keys: [['PageUp', 'Shift']],
    callback: () => commandsPool.extendCellsSelectionUpByViewportHeight(),
  }, {
    keys: [['PageDown']],
    callback: () => commandsPool.moveCellSelectionDownByViewportHeight(),
  }, {
    keys: [['PageDown', 'Shift']],
    callback: () => commandsPool.extendCellsSelectionDownByViewportHeight(),
  }, {
    keys: [['Tab']],
    // The property value is controlled by focusCatcher module (https://github.com/handsontable/handsontable/blob/master/handsontable/src/core/focusCatcher/index.js)
    preventDefault: false,
    callback: event => commandsPool.moveCellSelectionInlineStart(event),
  }, {
    keys: [['Shift', 'Tab']],
    // The property value is controlled by focusCatcher module (https://github.com/handsontable/handsontable/blob/master/handsontable/src/core/focusCatcher/index.js)
    preventDefault: false,
    callback: event => commandsPool.moveCellSelectionInlineEnd(event),
  }, {
    keys: [['Control/Meta', 'Backspace']],
    callback: () => commandsPool.scrollToFocusedCell(),
  }], config);
}
