import { basename, extname } from 'node:path';
import cssAdapter from './css.mjs';
import jsAdapter from './js.mjs';
import jsonAdapter from './json.mjs';
import templateAdapter from './template.mjs';
import unsupportedStyleAdapter from './unsupported-style.mjs';
import vueAdapter from './vue.mjs';

/**
 * Every adapter, implemented or not.
 *
 * @type {import('../types.mjs').Adapter[]}
 */
export const ADAPTERS = [jsAdapter, cssAdapter, vueAdapter, jsonAdapter, templateAdapter, unsupportedStyleAdapter];

/**
 * Find the adapter for a file by its extension.
 *
 * @param {string} filePath File path.
 * @returns {import('../types.mjs').Adapter|null} The adapter, or `null` for an unsupported extension.
 */
export function adapterFor(filePath) {
  const extension = extname(filePath).toLowerCase();

  return ADAPTERS.find(adapter => adapter.extensions.includes(extension)) ?? null;
}

/**
 * Tell whether discovery should offer a file to the runner. JSON is limited to `package.json`, because no
 * other JSON file has rules.
 *
 * @param {string} filePath File path.
 * @returns {boolean} `true` for a file some adapter can handle.
 */
export function isCandidate(filePath) {
  const adapter = adapterFor(filePath);

  if (!adapter) {
    return false;
  }

  return adapter.fileKind !== 'json' || basename(filePath) === 'package.json';
}
