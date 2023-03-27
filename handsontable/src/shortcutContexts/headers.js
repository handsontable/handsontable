import { isDefined } from '../helpers/mixed';

const SHORTCUTS_GROUP = 'headersDefault';

/**
 * The context that defines shortcut list available for selected headers.
 *
 * @param {Handsontable} hot The Handsontable instance.
 */
export function shortcutsHeadersContext(hot) {
  const { selection } = hot;
  const hotSettings = hot.getSettings();
  const context = hot.getShortcutManager().addContext('headers');
  const config = {
    runOnlyIf: () => {
      return isDefined(hot.getSelected()) &&
        hot.countRowHeaders() > 0 &&
        hot.countColHeaders() > 0;
    },
    group: SHORTCUTS_GROUP,
  };

  context.addShortcuts([{
    keys: [['Control/Meta', 'A'], ['Control/Meta', 'Shift', 'Space']],
    callback: () => {
      hot.selectAll();
    },
  }, {
    keys: [['ArrowUp']],
    callback: () => {
      selection.transformStart(-1, 0);
    },
  }, {
    keys: [['ArrowDown']],
    callback: () => {
      selection.transformStart(1, 0);
    },
  }, {
    keys: [['ArrowLeft']],
    callback: () => {
      selection.transformStart(0, -1 * hot.getDirectionFactor());
    },
  }, {
    keys: [['ArrowRight']],
    callback: () => {
      selection.transformStart(0, hot.getDirectionFactor());
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
