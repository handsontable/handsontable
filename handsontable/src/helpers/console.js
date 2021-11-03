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
