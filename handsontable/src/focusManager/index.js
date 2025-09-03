import { FocusScopeManager } from './scopeManager';
import { GridFocusManager } from './grid';

export * from './scopes';

/**
 * Creates a focus scope manager instance for a Handsontable instance.
 *
 * @param {Core} hotInstance The Handsontable instance
 * @returns {FocusScopeManager}
 */
export function createFocusScopeManager(hotInstance) {
  return new FocusScopeManager(hotInstance);
}

export { GridFocusManager };
