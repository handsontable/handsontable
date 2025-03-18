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
    shortcutsGridContext,
    shortcutsEditorContext,
  ].forEach(context => context(hotInstance));
}
