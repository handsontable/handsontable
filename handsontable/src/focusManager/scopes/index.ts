import type { HotInstance } from '../../core/types';
import { focusGridScope } from './grid';

/**
 * Register all focus scopes.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 */
export function registerAllFocusScopes(hotInstance: HotInstance) {
  [
    focusGridScope,
  ].forEach(scope => scope(hotInstance));
}
