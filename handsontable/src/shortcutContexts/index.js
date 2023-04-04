import { shortcutsEditorContext } from './editor';
import { shortcutsGridContext } from './grid';
import { shortcutsHeadersContext } from './headers';

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
    shortcutsHeadersContext
  ].forEach(context => context(hotInstance));
}
