/* eslint-disable no-console */

/**
 * "In Internet Explorer 9 (and 8), the console object is only exposed when the developer tools are opened
 * for a particular tab."
 *
 * Source: https://stackoverflow.com/a/5473193
 */

import {isDefined} from './mixed';
import {toSingleLine} from './templateLiteralTag';

export function logToConsole(message) {
  if (isDefined(console)) {
    console.log(toSingleLine`${message}`);
  }
};

export function warnToConsole() {
  if (isDefined(console)) {
    console.warn(toSingleLine`${message}`);
  }
};

export function infoToConsole() {
  if (isDefined(console)) {
    console.info(toSingleLine`${message}`);
  }
};

export function errorToConsole() {
  if (isDefined(console)) {
    console.error(toSingleLine`${message}`);
  }
};
