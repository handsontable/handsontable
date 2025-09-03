import { focusGridScope } from './grid';

/**
 * @param {Handsontable} hotInstance The Handsontable instance.
 */
export function registerAllFocusScopes(hotInstance) {
  [
    focusGridScope,
  ].forEach(scope => scope(hotInstance));
}
