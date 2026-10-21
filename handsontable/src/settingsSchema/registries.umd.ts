/**
 * Replaces `registries.ts` in the CDN file (`handsontable.settings-schema.js`). It reads the registries of the
 * `Handsontable` that the page loaded before this file, through its `hooks` and the private `_registries` bridge
 * (`src/index.ts`), so the file carries no registry of its own.
 */
import { throwWithCause } from '../helpers/errors';
import pageHandsontable from './pageHandsontable';
import type { PageRegistries } from './pageHandsontable';
import type { Hooks } from '../core/hooks';
import type { BasePlugin } from '../plugins/base';

const NOT_FOUND_MESSAGE = 'Load handsontable.js or handsontable.full.js before handsontable.settings-schema.js, ' +
  'and use files of the same version.';

/**
 * Gets the registry bridge of the page's `Handsontable`.
 *
 * @returns {PageRegistries} The bridge.
 */
function getBridge(): PageRegistries {
  if (pageHandsontable?._registries === undefined) {
    throwWithCause(NOT_FOUND_MESSAGE);
  }

  return pageHandsontable._registries;
}

/**
 * Checks whether a cell type is registered on the page.
 *
 * @param {string} name The cell type name.
 * @returns {boolean}
 */
export function hasCellType(name: string): boolean {
  return getBridge().hasCellType(name);
}

/**
 * Checks whether an editor is registered on the page.
 *
 * @param {string} name The editor name.
 * @returns {boolean}
 */
export function hasEditor(name: string): boolean {
  return getBridge().hasEditor(name);
}

/**
 * Checks whether a renderer is registered on the page.
 *
 * @param {string} name The renderer name.
 * @returns {boolean}
 */
export function hasRenderer(name: string): boolean {
  return getBridge().hasRenderer(name);
}

/**
 * Checks whether a validator is registered on the page.
 *
 * @param {string} name The validator name.
 * @returns {boolean}
 */
export function hasValidator(name: string): boolean {
  return getBridge().hasValidator(name);
}

/**
 * Checks whether a plugin is registered on the page.
 *
 * @param {string} pluginName The plugin name.
 * @returns {boolean}
 */
export function hasPlugin(pluginName: string): boolean {
  return getBridge().hasPlugin(pluginName);
}

/**
 * Gets a plugin class registered on the page.
 *
 * @param {string} pluginName The plugin name.
 * @returns {typeof BasePlugin | undefined}
 */
export function getPlugin(pluginName: string): typeof BasePlugin | undefined {
  return getBridge().getPlugin(pluginName);
}

/**
 * Gets the names of the plugins registered on the page.
 *
 * @returns {string[]}
 */
export function getPluginsNames(): string[] {
  return getBridge().getPluginsNames();
}

/**
 * Gets the hook registry of the page.
 *
 * @returns {Hooks} The `Hooks` singleton.
 */
export function getHooks(): Hooks {
  if (pageHandsontable === undefined) {
    throwWithCause(NOT_FOUND_MESSAGE);
  }

  return pageHandsontable.hooks;
}
