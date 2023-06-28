import { GRID_GROUP } from '../../shortcutContexts';
import { installFocusDetector } from './focusDetector';

/**
 * Installs a focus catcher module. The module observes the cell focus position and depends on the
 * position it releases the TAB navigation to the browser or not.
 *
 * @param {Handsontable} hot The Handsontable instance.
 */
export function installFocusCatcher(hot) {
  const { activate, deactivate } = installFocusDetector(hot, {
    onFocusFromTop() {
      // TODO add correct start coords depends on the user settings
      hot.selectCell(-1, -1);
      hot.listen();
    },
    onFocusFromBottom() {
      // TODO add correct end coords depends on the table size
      hot.selectCell(0, 2);
      hot.listen();
    },
  });

  hot.addHook('afterListen', () => deactivate());
  hot.addHook('afterUnlisten', () => activate());

  hot.getShortcutManager()
    .getContext('grid')
    .addShortcut({
      keys: [['Tab'], ['Shift', 'Tab']],
      callback: (event) => {
        const { row, col } = hot.getSelectedRangeLast().highlight;

        if (event.shiftKey && row === -1 && col === -1 || !event.shiftKey && row === 0 && col === 2) {
          hot.deselectCell();
          hot.unlisten();

          return false;
        }

        return true;
      },
      runOnlyIf: () => hot.selection.isSelected(),
      preventDefault: false,
      stopPropagation: false,
      position: 'before',
      relativeToGroup: GRID_GROUP,
      group: 'focusCatcher',
    });
}
