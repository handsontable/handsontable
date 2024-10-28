/* eslint-disable handsontable/restricted-module-imports */
// Since the Handsontable was modularized, importing some submodules is
// restricted. Importing the main entry of the submodule can make the
// "dead" code elimination process more difficult or even impossible.
// The "handsontable/restricted-module-imports" rule is on guard.
// This file exports the functions that allow include packages to
// the Base version of the Handsontable, so that's why the rule is
// disabled here (see more #7506).
import { registerAllEditors } from './editors';
import { registerAllRenderers } from './renderers';
import { registerAllValidators } from './validators';
import { registerAllCellTypes } from './cellTypes';
import { registerAllPlugins } from './plugins';
/* eslint-enable handsontable/restricted-module-imports */

export {
  registerAllEditors,
  registerAllRenderers,
  registerAllValidators,
  registerAllCellTypes,
  registerAllPlugins,
};

/**
 * Registers all available Handsontable modules.
 */
export function registerAllModules() {
  registerAllEditors();
  registerAllRenderers();
  registerAllValidators();
  registerAllCellTypes();
  registerAllPlugins();
}
