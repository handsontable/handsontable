import { registerAllEditors } from './editors';
import { registerAllRenderers } from './renderers';
import { registerAllValidators } from './validators';
import { registerAllCellTypes } from './cellTypes';
import { registerAllPlugins } from './plugins';

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
