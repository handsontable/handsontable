import { shortcutsGridContext } from './grid';
import { shortcutsHeadersContext } from './headers';

/**
 * Register all shortcut contexts.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 */
export function registerAllShortcutContexts(hotInstance) {
  [
    shortcutsGridContext,
    shortcutsHeadersContext
  ].forEach(context => context(hotInstance));
}
