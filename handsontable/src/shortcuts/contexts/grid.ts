import type { HotInstance } from '../../core/types';
import { isDefined } from '../../helpers/mixed';
import { GRID_GROUP, EDITOR_EDIT_GROUP, GRID_SCOPE, GRID_TAB_NAVIGATION_GROUP } from './constants';
import { createKeyboardShortcutCommandsPool } from './commands';

/**
 * The context that defines shortcut list available for selected cell or cells.
 *
 * @param {Handsontable} hot The Handsontable instance.
 */
export function shortcutsGridContext(hot: HotInstance) {
  const context = hot.getShortcutManager().addContext(GRID_SCOPE);

  type CommandsPool = Record<string, (...args: unknown[]) => boolean | void>;
  const commandsPool = createKeyboardShortcutCommandsPool(hot) as unknown as CommandsPool;
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
    callback: (event: KeyboardEvent) => commandsPool.editorFastOpen(event),
  }, {
    keys: [['Enter'], ['Enter', 'Shift']],
    callback: (event: KeyboardEvent, keys?: string[]) => commandsPool.editorOpen(event, keys),
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
    runOnlyIf: () => isDefined(hot.getSelected()) && !hot.getSelectedRangeActive()?.highlight.isHeader(),
  }, {
    keys: [['Control/Meta', 'A']],
    callback: () => {},
    runOnlyIf: () => !!(isDefined(hot.getSelected()) && hot.getSelectedRangeActive()?.highlight.isHeader()),
    preventDefault: true,
  }, {
    keys: [['Control/Meta', 'Shift', 'Space']],
    callback: () => commandsPool.selectAllCellsAndHeaders(),
  }, {
    keys: [['Control/Meta', 'Enter']],
    callback: () => commandsPool.populateSelectedCellsData(),
    runOnlyIf: () => {
      return isDefined(hot.getSelected()) &&
        !hot.getSelectedRangeActive()?.highlight.isHeader() &&
        (hot.getSelectedRangeActive()?.getCellsCount() ?? 0) > 1;
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
    runOnlyIf: () => isDefined(hot.getSelected()) &&
      !(hot.selection.isSelectedByCorner() || hot.selection.isSelectedByColumnHeader()),
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
    runOnlyIf: () => isDefined(hot.getSelected()) &&
      !(hot.selection.isSelectedByCorner() || hot.selection.isSelectedByColumnHeader()),
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
    runOnlyIf: () => isDefined(hot.getSelected()) &&
      !(hot.selection.isSelectedByCorner() || hot.selection.isSelectedByRowHeader()),
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
    runOnlyIf: () => isDefined(hot.getSelected()) &&
      !(hot.selection.isSelectedByCorner() || hot.selection.isSelectedByRowHeader()),
  }, {
    keys: [['Home']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostInlineStart(),
    runOnlyIf: () => isDefined(hot.getSelected()) && hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [['Home', 'Shift']],
    callback: () => commandsPool.extendCellsSelectionToMostInlineStart(),
  }, {
    keys: [['Home', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostTopInlineStart(),
    runOnlyIf: () => isDefined(hot.getSelected()) && hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [['End']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostInlineEnd(),
    runOnlyIf: () => isDefined(hot.getSelected()) && hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [['End', 'Shift']],
    callback: () => commandsPool.extendCellsSelectionToMostInlineEnd(),
  }, {
    keys: [['End', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostBottomInlineEnd(),
    runOnlyIf: () => isDefined(hot.getSelected()) && hot.view.isMainTableNotFullyCoveredByOverlays(),
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
    preventDefault: false,
    callback: (event: KeyboardEvent) => commandsPool.moveCellSelectionInlineStart(event),
  }, {
    keys: [['Shift', 'Tab']],
    preventDefault: false,
    callback: (event: KeyboardEvent) => commandsPool.moveCellSelectionInlineEnd(event),
  }, {
    keys: [['Control/Meta', 'Backspace']],
    callback: () => commandsPool.scrollToFocusedCell(),
  }], config);

  type TabNavCommand = { before: (event: KeyboardEvent) => void; after: (event: KeyboardEvent) => boolean | void };
  const tabNavigationCommand = commandsPool.tabNavigation() as unknown as TabNavCommand;

  context.addShortcuts([{
    keys: [['Tab'], ['Shift', 'Tab']],
    preventDefault: false,
    stopPropagation: false,
    relativeToGroup: GRID_GROUP,
    group: GRID_TAB_NAVIGATION_GROUP,
    position: 'before',
    callback: (event: KeyboardEvent) => tabNavigationCommand.before(event),
  }, {
    keys: [['Tab'], ['Shift', 'Tab']],
    preventDefault: false,
    stopPropagation: false,
    relativeToGroup: GRID_GROUP,
    group: GRID_TAB_NAVIGATION_GROUP,
    callback: (event: KeyboardEvent) => tabNavigationCommand.after(event),
    position: 'after',
  }]);
}
