import type { HotInstance } from '../../core/types';
import { isDefined } from '../../helpers/mixed';
import { GRID_GROUP, EDITOR_EDIT_GROUP, GRID_SCOPE, GRID_TAB_NAVIGATION_GROUP } from './constants';
import { createKeyboardShortcutCommandsPool } from './commands';
import { canAccessCellContent, canNavigateGrid, keepCoveredCellsUnselectable } from '../guards';
import { getSelectedCellLink } from './commands/openCellLink';
import { selectionFillsOtherCells } from '../../selection/fillSelection';

/**
 * The context that defines shortcut list available for selected cell or cells.
 *
 * @param {Handsontable} hot The Handsontable instance.
 */
export function shortcutsGridContext(hot: HotInstance) {
  const context = hot.getShortcutManager().addContext(GRID_SCOPE);

  type CommandsPool = Record<string, (...args: unknown[]) => boolean | void>;
  // Wrapped, not raw: the guards below decide whether a key may RUN, and this decides where its move
  // may land. An overlay that covers the body makes every cell unreachable, so a move that starts on a
  // header - the one start `canNavigateGrid()` still allows there - may not end on one of them.
  const commandsPool = keepCoveredCellsUnselectable(
    hot,
    createKeyboardShortcutCommandsPool(hot) as unknown as CommandsPool,
  ) as CommandsPool;
  /**
   * Whether a shortcut may act on the CONTENT of the selected cells. The predicate lives in
   * `../guards.ts` so every registrar can reach it - `mergeCells` and `checkboxRenderer` add
   * destructive shortcuts to this same context and need the same answer.
   *
   * @returns {boolean}
   */
  const canAccessCells = (): boolean => canAccessCellContent(hot);
  /**
   * Whether a selection-moving shortcut has a selection to move and somewhere to move it. Weaker than
   * `canAccessCells()` on the header half - moving a selection destroys nothing.
   *
   * @returns {boolean}
   */
  const isGridNavigable = (): boolean => isDefined(hot.getSelected()) && canNavigateGrid(hot);
  // A shortcut in this batch that declares its OWN `runOnlyIf` does not get this one - a per-shortcut
  // `runOnlyIf` replaces the group's instead of being ANDed with it. Each such entry therefore starts
  // with `isGridNavigable()` itself: without it `Home`, `End` and `Ctrl`+`Shift`+arrows kept moving a
  // selection hidden under a covering overlay, and `Home`/`End` consumed the key doing it.
  const config = {
    runOnlyIf: isGridNavigable,
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
    runOnlyIf: () => isDefined(hot.getSelected()) && canAccessCells(),
  });

  context.addShortcuts([{
    keys: [['Control/Meta', 'A']],
    callback: () => commandsPool.selectAllCells(),
    // `isGridNavigable()` for the same reason the eight movement keys below carry it: a per-shortcut
    // `runOnlyIf` replaces the group's. Without it select all reached the whole body while an overlay
    // covered it. The overlay's own plugin claims the chord for the case that still needs it - every
    // column hidden, where selecting the data is the way back to a context menu.
    runOnlyIf: () => isGridNavigable() && !hot.getSelectedRangeActive()?.highlight.isHeader(),
  }, {
    keys: [['Control/Meta', 'A']],
    callback: () => {},
    runOnlyIf: () => !!(isGridNavigable() && hot.getSelectedRangeActive()?.highlight.isHeader()),
    preventDefault: true,
  }, {
    keys: [['Control/Meta', 'Shift', 'Space']],
    callback: () => commandsPool.selectAllCellsAndHeaders(),
  }, {
    keys: [['Control/Meta', 'Enter']],
    callback: () => commandsPool.populateSelectedCellsData(),
    // The shortcut claims the chord only when the fill would write something. Counting the ACTIVE
    // layer's cells refused the gesture whenever the focused layer held a single cell, however many
    // other layers were selected - and an open editor answered the same keystroke by filling them
    // all (DEV-103). Asking which cells the fill reaches keeps the two paths in step.
    //
    // `canAccessCells()` stays in front of that question: under an overlay covering the body the
    // cells are still drawn and the fill would still find them, so it would write into cells the
    // user cannot see.
    runOnlyIf: () => {
      const activeHighlight = hot.getSelectedRangeActive()?.highlight;

      if (!isDefined(hot.getSelected()) || !canAccessCells() ||
          activeHighlight === undefined || activeHighlight.isHeader()) {
        return false;
      }

      const { row, col } = activeHighlight.normalize();

      return selectionFillsOtherCells(hot, hot.getDataAtCell(row as number, col as number), row, col);
    },
  }, {
    keys: [['Alt', 'Enter']],
    stopPropagation: true,
    callback: () => commandsPool.openCellLink(),
    // The shortcut prevents the default action and stops propagation whenever `runOnlyIf` passes,
    // so it must claim the chord only for a cell that actually renders a link. Testing just
    // `isCell()` would swallow `Alt`+`Enter` grid-wide and break a host application's own handler.
    //
    // `canAccessCells()` is load-bearing beside that lookup, not decoration: under an overlay that
    // covers the body the cell is still DRAWN and the link is still found, so opening it would send the
    // user somewhere from a cell they cannot see.
    runOnlyIf: () => canAccessCells() && getSelectedCellLink(hot) !== null,
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
    runOnlyIf: () => isGridNavigable() &&
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
    runOnlyIf: () => isGridNavigable() &&
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
    runOnlyIf: () => isGridNavigable() &&
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
    runOnlyIf: () => isGridNavigable() &&
      !(hot.selection.isSelectedByCorner() || hot.selection.isSelectedByRowHeader()),
  }, {
    keys: [['Home']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostInlineStart(),
    runOnlyIf: () => isGridNavigable() && hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [['Home', 'Shift']],
    callback: () => commandsPool.extendCellsSelectionToMostInlineStart(),
  }, {
    keys: [['Home', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostTopInlineStart(),
    runOnlyIf: () => isGridNavigable() && hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [['End']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostInlineEnd(),
    runOnlyIf: () => isGridNavigable() && hot.view.isMainTableNotFullyCoveredByOverlays(),
  }, {
    keys: [['End', 'Shift']],
    callback: () => commandsPool.extendCellsSelectionToMostInlineEnd(),
  }, {
    keys: [['End', 'Control/Meta']],
    captureCtrl: true,
    callback: () => commandsPool.moveCellSelectionToMostBottomInlineEnd(),
    runOnlyIf: () => isGridNavigable() && hot.view.isMainTableNotFullyCoveredByOverlays(),
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

  // This pair is BOOKKEEPING and stays unguarded on purpose: `before()` sets state that `after()` clears,
  // so a guard that can change its answer mid-keystroke - the Tab move itself drops the selection - would
  // run one half and skip the other, leaving the command's flags set for a later, unrelated selection.
  // The one thing that needed gating is the `preventDefault()` inside `after()`, and it is gated there.
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
