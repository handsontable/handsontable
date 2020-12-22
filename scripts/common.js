const { spawnSync, fork } = require('child_process');

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


/**
 * Spawn a process synchronously.
 *
 * @param {string} command The command to spawn.
 * @param {boolean} [silent] `true` if there's supposed to be no output to the console.
 * @param {Function} [callback] A callback to be called _before_ a potential end to the process.
 */
function spawnProcess(command, silent = false, callback) {
  const cmdSplit = command.split(' ');
  const mainCmd = cmdSplit[0];
  const spawnOptions = {
    silent
  };

  if (!spawnOptions.silent) {
    spawnOptions.stdio = 'inherit';
  }

  cmdSplit.shift();

  const spawnedProcess = spawnSync(mainCmd, cmdSplit, spawnOptions);

  if (spawnedProcess.status) {
    process.exitCode = 1;
  }

  if (callback) {
    callback(spawnedProcess);
  }

  if (process.exitCode === 1) {
    process.exit();
  }

  return spawnedProcess;
}

module.exports = {
  displayErrorMessage,
  displayConfirmationMessage,
  spawnProcess,
};
