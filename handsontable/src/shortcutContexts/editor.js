import { EDITOR_EDIT_GROUP } from './constants';
import { createShortcutsCommand } from './commands';

/**
 * The context that defines a base shortcut list available for cells editors.
 *
 * @param {Handsontable} hot The Handsontable instance.
 */
export function shortcutsEditorContext(hot) {
  const context = hot.getShortcutManager().addContext('editor');
  const commandsPool = createShortcutsCommand(hot);
  const config = { group: EDITOR_EDIT_GROUP };

  context.addShortcuts([{
    keys: [['Enter'], ['Enter', 'Shift'], ['Enter', 'Control/Meta'], ['Enter', 'Control/Meta', 'Shift']],
    callback: (event, keys) => commandsPool.editorCloseAndSave(event, keys),
  }, {
    keys: [['Escape'], ['Escape', 'Control/Meta']],
    callback: () => commandsPool.editorCloseWithoutSaving(),
  }], config);
}
