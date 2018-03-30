/* eslint-disable no-console */

/**
 * "In Internet Explorer 9 (and 8), the console object is only exposed when the developer tools are opened
 * for a particular tab."
 *
 * Source: https://stackoverflow.com/a/5473193
 */

import {isDefined} from './mixed';
import {toSingleLine} from './templateLiteralTag';

isConsoleDefined = () => isDefined(console);

export function logToConsole(message) {
  if (isConsoleDefined()) {
    console.log(toSingleLine`${message}`);
  }
};

export function warnToConsole() {
  if (isConsoleDefined()) {
    console.warn(toSingleLine`${message}`);
  }
};

export function infoToConsole() {
  if (isConsoleDefined()) {
    console.info(toSingleLine`${message}`);
  }
};

export function errorToConsole() {
  if (isConsoleDefined()) {
    console.error(toSingleLine`${message}`);
  }
};
