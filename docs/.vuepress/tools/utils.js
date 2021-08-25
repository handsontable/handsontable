const chalk = require('chalk');
const execa = require('execa');

/* eslint-disable no-console, no-restricted-globals */
module.exports = {
  logger: {
    log: (message, ...args) => console.log(chalk.white(message), ...args),
    info: (message, ...args) => console.log(chalk.blue(message), ...args),
    success: (message, ...args) => console.log(chalk.green(message), ...args),
    warn: (message, ...args) => console.warn(chalk.yellow(message), ...args),
    error: (message, ...args) => console.error(chalk.red(message), ...args),
  },
  spawnProcess: (command, options = {}, sync = false) => {
    const cmdSplit = command.split(' ');
    const mainCmd = cmdSplit[0];

    cmdSplit.shift();

    if (!options.silent) {
      options.stdin = options.stdin ?? 'inherit';
      options.stdout = options.stdout ?? 'inherit';
      options.stderr = options.stderr ?? 'inherit';
    }

    if (sync) {
      return execa.sync(mainCmd, cmdSplit, options);
    } else {
      return execa(mainCmd, cmdSplit, options);
    }
  }
};
/* eslint-enable no-console, no-restricted-globals */

