import { shortcutsEditorContext } from './editor';
import { shortcutsGridContext } from './grid';
import { HotInstance } from '../core.types';

export * from './constants';

/**
 * Register all shortcut contexts.
 *
 * @param {HotInstance} hotInstance The Handsontable instance.
 */
export function registerAllShortcutContexts(hotInstance: HotInstance): void {
  [
    shortcutsGridContext,
    shortcutsEditorContext,
  ].forEach(context => context(hotInstance));
}
