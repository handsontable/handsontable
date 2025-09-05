import { createFocusScopeManager } from './scopeManager';
import { GridFocusManager } from './grid';

export * from './scopes';
export * from './constants';
export * from './focusListener';

/**
 * Creates a focus scope manager instance for a Handsontable instance.
 *
 * @param {Core} hotInstance The Handsontable instance
 * @returns {Object} Focus scope manager object
 */
export { createFocusScopeManager };
export { GridFocusManager };
