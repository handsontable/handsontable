/* eslint-disable no-console */
/* eslint-disable no-restricted-globals */

/**
 * "In Internet Explorer 9 (and 8), the console object is only exposed when the developer tools are opened
 * for a particular tab."
 *
 * Source: https://stackoverflow.com/a/5473193
 */

import {isDefined} from './mixed';

/**
 * Logs message to the console if the `console` object is exposed.
 *
 * @param {String} messages Messages which will be logged.
 */
export function log(...messages) {
  if (isDefined(console)) {
    console.log(...messages);
  }
};

/**
 * Logs warn to the console if the `console` object is exposed.
 *
 * @param {String} messages Messages which will be logged.
 */
export function warn(...messages) {
  if (isDefined(console)) {
    console.warn(...messages);
  }
};

/**
 * Logs info to the console if the `console` object is exposed.
 *
 * @param {String} messages Messages which will be logged.
 */
export function info(...messages) {
  if (isDefined(console)) {
    console.info(...messages);
  }
};

/**
 * Logs error to the console if the `console` object is exposed.
 *
 * @param {String} messages Messages which will be logged.
 */
export function error(...messages) {
  if (isDefined(console)) {
    console.error(...messages);
  }
};
