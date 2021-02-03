import chalk from 'chalk';

/**
 * Display an error message in the console.
 *
 * @param {string} message The message to be displayed.
 */
export function displayErrorMessage(message) {
  // eslint-disable-next-line no-restricted-globals
  console.log(chalk.red(`ERROR: ${message}`));
}

/**
 * Display a warning message in the console.
 *
 * @param {string} message The message to be displayed.
 */
export function displayWarningMessage(message) {
  // eslint-disable-next-line no-restricted-globals
  console.log(chalk.yellow(`WARNING: ${message}`));
}

/**
 * Display a confirmation message in the console.
 *
 * @param {string} message The message to be displayed.
 */
export function displayConfirmationMessage(message) {
  // eslint-disable-next-line no-restricted-globals
  console.log(chalk.green(`${message}`));
}
