import type { HotInstance } from '../../core/types';
import { EDITOR_EDIT_GROUP, EDITOR_SCOPE, GRID_SCOPE } from './constants';
import { createKeyboardShortcutCommandsPool } from './commands';

/**
 * The context that defines a base shortcut list available for cells editors.
 *
 * @param {Handsontable} hot The Handsontable instance.
 */
export function shortcutsEditorContext(hot: HotInstance) {
  const context = hot.getShortcutManager().addContext(EDITOR_SCOPE);

  type CommandsPool = Record<string, (...args: unknown[]) => boolean | void>;
  const commandsPool = createKeyboardShortcutCommandsPool(hot) as unknown as CommandsPool;
  const config = { group: EDITOR_EDIT_GROUP };

  context.addShortcuts([{
    keys: [['Enter'], ['Enter', 'Shift']],
    callback: (event: KeyboardEvent, keys: string[]) => commandsPool.editorCloseAndSaveByEnter(event, keys),
  }, {
    keys: [['Enter', 'Control/Meta'], ['Enter', 'Control/Meta', 'Shift']],
    captureCtrl: true,
    callback: (event: KeyboardEvent, keys: string[]) => commandsPool.editorCloseAndSaveByEnter(event, keys),
  }, {
    keys: [['Tab'], ['Tab', 'Shift'], ['PageDown'], ['PageUp']],
    forwardToContext: hot.getShortcutManager().getContext(GRID_SCOPE),
    callback: (event: KeyboardEvent, keys: string[]) => commandsPool.editorCloseAndSave(event, keys),
  }, {
    keys: [['ArrowDown'], ['ArrowUp'], ['ArrowLeft'], ['ArrowRight']],
    preventDefault: false,
    callback: (event: KeyboardEvent, keys: string[]) => commandsPool.editorCloseAndSaveByArrowKeys(event, keys),
  }, {
    keys: [['Escape'], ['Escape', 'Control/Meta']],
    callback: () => commandsPool.editorCloseWithoutSaving(),
  }], config);
}
