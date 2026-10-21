/**
 * The only place `handsontable/settingsSchema` reads what is registered on the page. It re-exports the core
 * registries, so the npm entry sees the instance it was imported next to.
 *
 * The CDN file (`handsontable.settings-schema.js`) swaps this module for `registries.umd.ts` at build time,
 * because a bundle that inlined the core registries would read its own empty copy. Read a registry through this
 * module and never import one directly, or the CDN file reports every cell type and plugin as unregistered.
 */
import { Hooks } from '../core/hooks';

export { hasCellType } from '../cellTypes/registry';
export { hasEditor } from '../editors/registry';
export { hasRenderer } from '../renderers/registry';
export { hasValidator } from '../validators/registry';
export { getPlugin, getPluginsNames, hasPlugin } from '../plugins/registry';

/**
 * Gets the hook registry.
 *
 * @returns {Hooks} The `Hooks` singleton.
 */
export function getHooks(): Hooks {
  return Hooks.getSingleton();
}
