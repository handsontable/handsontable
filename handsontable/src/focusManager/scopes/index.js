import { focusGridScope } from './grid';

/**
 * Register all focus scopes.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 */
export function registerAllFocusScopes(hotInstance) {
  [
    focusGridScope,
  ].forEach(scope => scope(hotInstance));
}
