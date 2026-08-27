import { substitute } from './templateString';
/* eslint-disable no-console */
/* eslint-disable no-restricted-globals */

/**
 * "In Internet Explorer 9 (and 8), the console object is only exposed when the developer tools are opened
 * for a particular tab.".
 *
 * Source: https://stackoverflow.com/a/5473193.
 */

import { isDefined } from './mixed';

/**
 * Logs message to the console if the `console` object is exposed.
 *
 * @param {...*} args Values which will be logged.
 */
export function log(...args: unknown[]): void {
  if (isDefined(console)) {
    console.log(...args);
  }
}

/**
 * Logs warn to the console if the `console` object is exposed.
 *
 * @param {...*} args Values which will be logged.
 */
export function warn(...args: unknown[]): void {
  if (isDefined(console)) {
    console.warn(...args);
  }
}

/**
 * Tracks which `key`s have already been warned about, grouped by a scope object.
 * A `WeakMap` lets the entries be garbage-collected together with their scope
 * (for example, when a Handsontable instance is destroyed), so the "warn once"
 * state resets per instance without any manual cleanup.
 */
const warnedScopes = new WeakMap<object, Set<string>>();

/**
 * Logs a warning to the console only once per `scope` and `key` pair.
 *
 * Pass a stable per-instance object (for example, `hot.rootGridElement`) as the
 * `scope` so each Handsontable instance warns at most once for a given `key`.
 * Reuse the same `key` across unrelated modules to collapse their warnings into
 * a single message per instance.
 *
 * @param {object} scope The object the "warn once" state is bound to (for example, the grid root element).
 * @param {string} key A stable identifier for the warning category.
 * @param {...*} args Values which will be logged.
 */
export function warnOnce(scope: object, key: string, ...args: unknown[]): void {
  let warnedKeys = warnedScopes.get(scope);

  if (warnedKeys === undefined) {
    warnedKeys = new Set();
    warnedScopes.set(scope, warnedKeys);
  }

  if (warnedKeys.has(key)) {
    return;
  }

  warnedKeys.add(key);
  warn(...args);
}

/**
 * Keys of deprecation and removal warnings that were already printed. Module-level on purpose:
 * a deprecated or removed API is reported once per page, regardless of how many grid instances
 * touch it, which is what the deprecation policy promises.
 */
const printedDeprecations = new Set<string>();

/**
 * Logs `message` to the console only once per `key` if the `console` object is exposed.
 * Shared by the deprecation and removal warnings, so both draw from one record and one reset.
 *
 * @param {string} key A stable identifier of the reported API.
 * @param {string} message The final message to log.
 */
function warnOncePerKey(key: string, message: string): void {
  if (printedDeprecations.has(key)) {
    return;
  }

  // Record the key only when the message can actually be printed. Otherwise the first call made
  // while `console` is missing would burn the key for the whole page and silence every later one.
  if (!isDefined(console)) {
    return;
  }

  printedDeprecations.add(key);
  console.warn(message);
}

/**
 * Logs a deprecation warning to the console only once per `key` if the `console`
 * object is exposed. Use it for every deprecated public API so the warning does
 * not flood the console on repeated calls.
 *
 * @param {string} key A stable identifier of the deprecated API (for example, the method name).
 * @param {string} message The message to log.
 */
export function deprecatedWarnOnce(key: string, message: string): void {
  warnOncePerKey(key, `Deprecated: ${message}`);
}

/**
 * Logs a removal warning to the console only once per `key` if the `console` object is exposed.
 * Use it when a caller configures an API that no longer exists. Unlike `deprecatedWarnOnce`, the
 * message carries no `Deprecated:` prefix: a removed API is not deprecated, it is gone, and the
 * message itself has to say so (the same way the removed-hook warning in `core/hooks` does).
 *
 * @param {string} key A stable identifier of the removed API (for example, the option name).
 * @param {string} message The message to log.
 */
export function removedWarnOnce(key: string, message: string): void {
  warnOncePerKey(key, message);
}

/**
 * Clears the record of already-printed deprecation and removal warnings.
 *
 * Test-only. `printedDeprecations` is module-global and never reset in production, so without this
 * every spec that asserts on one of these warnings would depend on the order the specs run in.
 *
 * @private
 */
export function _resetDeprecationWarnings(): void {
  printedDeprecations.clear();
}

/**
 * Logs info to the console if the `console` object is exposed.
 *
 * @param {...*} args Values which will be logged.
 */
export function info(...args: unknown[]): void {
  if (isDefined(console)) {
    console.info(...args);
  }
}

/**
 * Logs error to the console if the `console` object is exposed.
 *
 * @param {...*} args Values which will be logged.
 */
export function error(...args: unknown[]): void {
  if (isDefined(console)) {
    console.error(...args);
  }
}

export interface LogAggregatedItemsOptions {
  logFunction?: (...args: unknown[]) => void;
  message?: string;
  items?: unknown[];
  maxSample?: number;
  itemFormatter?: (item: unknown) => string;
}

/**
 * Logs an aggregated log message with a sample list of items.
 *
 * @param {object} options Log options.
 * @param {Function} [options.logFunction] Function to log the message.
 * @param {string} options.message Message template.
 * @param {Array} options.items List of items to aggregate.
 * @param {number} [options.maxSample=5] Maximum number of items to list.
 * @param {Function} [options.itemFormatter] Formatter for each item.
 */
export function logAggregatedItems({
  logFunction = log,
  message = '',
  items = [],
  maxSample = 5,
  itemFormatter = (item: unknown) => `${item}`,
}: LogAggregatedItemsOptions = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  const count = items.length;
  const formattedItems = items
    .slice(0, maxSample)
    .map((item: unknown) => `  - ${itemFormatter(item)}`);
  const more = count > maxSample ? `  - ...and ${count - maxSample} more` : '';
  const affectedLines = [
    'Affected cells:',
    ...formattedItems,
    ...(more ? [more] : []),
  ].join('\n');

  logFunction(substitute(message, {
    itemsCount: `${count} cell${count > 1 ? 's' : ''}`,
    affectedCells: affectedLines,
  }));
}
