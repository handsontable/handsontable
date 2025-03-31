import { EDITOR_EDIT_GROUP } from './constants';
import { createKeyboardShortcutCommandsPool } from './commands';
import { ShortcutConfig } from './types';
import { HotInstance } from '../core.types';

/**
 * The context that defines a base shortcut list available for cells editors.
 *
 * @param {HotInstance} hot The Handsontable instance.
 */
export function shortcutsEditorContext(hot: HotInstance): void {
  const context = hot.getShortcutManager().addContext('editor');
  const commandsPool = createKeyboardShortcutCommandsPool(hot);
  const config: ShortcutConfig = { group: EDITOR_EDIT_GROUP };

  context.addShortcuts([{
    keys: [['Enter'], ['Enter', 'Shift']],
    callback: (event?: KeyboardEvent, keys?: string[]) => commandsPool.editorCloseAndSaveByEnter(event, keys),
  }, {
    keys: [['Enter', 'Control/Meta'], ['Enter', 'Control/Meta', 'Shift']],
    captureCtrl: true,
    callback: (event?: KeyboardEvent, keys?: string[]) => commandsPool.editorCloseAndSaveByEnter(event, keys),
  }, {
    keys: [['Tab'], ['Tab', 'Shift'], ['PageDown'], ['PageUp']],
    forwardToContext: hot.getShortcutManager().getContext('grid'),
    callback: (event?: KeyboardEvent, keys?: string[]) => commandsPool.editorCloseAndSave(event, keys),
  }, {
    keys: [['ArrowDown'], ['ArrowUp'], ['ArrowLeft'], ['ArrowRight']],
    preventDefault: false,
    callback: (event?: KeyboardEvent, keys?: string[]) => commandsPool.editorCloseAndSaveByArrowKeys(event, keys),
  }, {
    keys: [['Escape'], ['Escape', 'Control/Meta']],
    callback: () => commandsPool.editorCloseWithoutSaving(),
  }], config);
}
