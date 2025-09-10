import { createFocusScopeManager } from './scopeManager';
import { GridFocusManager } from './grid';

export * from './scopes';

/**
 * @typedef {object} FocusScopeManager
 * @property {function(string, HTMLElement, object): void} registerScope Registers a new focus scope.
 * @property {function(string): void} unregisterScope Unregisters a scope completely.
 * @property {function(string): void} activateScope Activates a focus scope by its ID.
 * @property {function(string): void} deactivateScope Deactivates a scope by its ID.
 * @property {function(): void} destroy Destroys the focus scope manager.
 */
/**
 * Creates a focus scope manager instance for a Handsontable instance.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @returns {FocusScopeManager} Focus scope manager object.
 */
export { createFocusScopeManager };
export { GridFocusManager };
