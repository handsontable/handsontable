import { shortcutsEditorContext } from './editor';
import { shortcutsGridContext } from './grid';

export * from './constants';

/**
 * Register all shortcut contexts.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 */
export function registerAllShortcutContexts(hotInstance) {
  [
    shortcutsEditorContext,
    shortcutsGridContext,
  ].forEach(context => context(hotInstance));
}
