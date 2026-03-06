import { substitute } from './string';
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
export function log(...args) {
  if (isDefined(console)) {
    console.log(...args);
  }
}

/**
 * Logs warn to the console if the `console` object is exposed.
 *
 * @param {...*} args Values which will be logged.
 */
export function warn(...args) {
  if (isDefined(console)) {
    console.warn(...args);
  }
}

/**
 * Logs deprecated warn to the console if the `console` object is exposed.
 *
 * @param {string} message The message to log.
 */
export function deprecatedWarn(message) {
  if (isDefined(console)) {
    console.warn(`Deprecated: ${message}`);
  }
}

/**
 * Logs info to the console if the `console` object is exposed.
 *
 * @param {...*} args Values which will be logged.
 */
export function info(...args) {
  if (isDefined(console)) {
    console.info(...args);
  }
}

/**
 * Logs error to the console if the `console` object is exposed.
 *
 * @param {...*} args Values which will be logged.
 */
export function error(...args) {
  if (isDefined(console)) {
    console.error(...args);
  }
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
  message,
  items,
  maxSample = 5,
  itemFormatter = item => `${item}`,
} = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  const count = items.length;
  const formattedItems = items
    .slice(0, maxSample)
    .map(item => `  - ${itemFormatter(item)}`);
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
