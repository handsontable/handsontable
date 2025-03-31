import { shortcutsEditorContext } from './editor';
import { shortcutsGridContext } from './grid';
import { Handsontable } from '../core.types';

export * from './constants';

/**
 * Register all shortcut contexts.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 */
export function registerAllShortcutContexts(hotInstance: Handsontable): void {
  [
    shortcutsGridContext,
    shortcutsEditorContext,
  ].forEach(context => context(hotInstance));
}
