/* eslint-disable no-console */

/**
 * "In Internet Explorer 9 (and 8), the console object is only exposed when the developer tools are opened
 * for a particular tab."
 *
 * Source: https://stackoverflow.com/a/5473193
 */

import {isDefined} from './mixed';
import {toSingleLine} from './templateLiteralTag';

/**
 * Logs message to the console if the `console` object is exposed.
 *
 * @param {String} message Message which will be logged.
 * @param {Boolean} [onlyOneLine=true] If `true` transform message to a single line.
 */
export function logToConsole(message, onlyOneLine = true) {
  if (isDefined(console) === false) {
    return;
  }

  if (onlyOneLine) {
    console.log(toSingleLine`${message}`);

  } else {
    console.log(message);
  }
};
/**
 * Logs warn to the console if the `console` object is exposed.
 *
 * @param {String} message Message which will be logged.
 * @param {Boolean} [onlyOneLine=true] If `true` transform message to a single line.
 */
export function warnToConsole(message, onlyOneLine = true) {
  if (isDefined(console) === false) {
    return;
  }

  if (onlyOneLine) {
    console.warn(toSingleLine`${message}`);

  } else {
    console.warn(message);
  }
};

/**
 * Logs info to the console if the `console` object is exposed.
 *
 * @param {String} message Message which will be logged.
 * @param {Boolean} [onlyOneLine=true] If `true` transform message to a single line.
 */
export function infoToConsole(message, onlyOneLine = true) {
  if (isDefined(console) === false) {
    return;
  }

  if (onlyOneLine) {
    console.info(toSingleLine`${message}`);

  } else {
    console.info(message);
  }
};

/**
 * Logs error to the console if the `console` object is exposed.
 *
 * @param {String} message Message which will be logged.
 * @param {Boolean} [onlyOneLine=true] If `true` transform message to a single line.
 */
export function errorToConsole(message, onlyOneLine = true) {
  if (isDefined(console) === false) {
    return;
  }

  if (onlyOneLine) {
    console.error(toSingleLine`${message}`);

  } else {
    console.error(message);
  }
};
