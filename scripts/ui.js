/**
 * Display an error message in the console.
 *
 * @param {string} message The message to be displayed.
 */
function displayErrorMessage(message) {
  console.log('\x1b[31m%s\x1b[0m', `ERROR: ${message}`);
}

/**
 * Display a confirmation message in the console.
 *
 * @param {string} message The message to be displayed.
 */
function displayConfirmationMessage(message) {
  console.log('\x1b[32m%s\x1b[0m', `${message}`);
}

module.exports = {
  displayErrorMessage,
  displayConfirmationMessage,
};
