/**
 * The `Handsontable` object of the page, for the CDN file (`handsontable.settings-schema.js`). The CDN build
 * declares this module an external (`.config/settings-schema-umd-development.js`), so the UMD wrapper replaces it
 * with the global `Handsontable`, or with the module an AMD or CommonJS loader resolves for `handsontable`. The
 * code below runs only when nothing replaces it, and then it answers `undefined` unless the page has the global.
 */
import type { Hooks } from '../core/hooks';
import type { BasePlugin } from '../plugins/base';

export interface PageRegistries {
  hasCellType: (name: string) => boolean;
  hasEditor: (name: string) => boolean;
  hasRenderer: (name: string) => boolean;
  hasValidator: (name: string) => boolean;
  hasPlugin: (pluginName: string) => boolean;
  getPlugin: (pluginName: string) => typeof BasePlugin | undefined;
  getPluginsNames: () => string[];
}

export interface PageHandsontable {
  hooks: Hooks;
  _registries?: PageRegistries;
}

declare const Handsontable: PageHandsontable | undefined;

const pageHandsontable: PageHandsontable | undefined = typeof Handsontable === 'undefined' ? undefined : Handsontable;

export default pageHandsontable;
