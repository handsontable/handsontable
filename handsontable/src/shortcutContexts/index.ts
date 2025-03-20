import { shortcutsEditorContext } from './editor';
import { shortcutsGridContext } from './grid';
import { HotInstance } from './types';

export * from './constants';

/**
 * Register all shortcut contexts.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 */
export function registerAllShortcutContexts(hotInstance: HotInstance): void {
  [
    shortcutsGridContext,
    shortcutsEditorContext,
  ].forEach(context => context(hotInstance));
}
