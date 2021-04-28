const chalk = require('chalk');

/* eslint-disable no-console, no-restricted-globals */
module.exports = {
  logger: {
    log: (message, ...args) => console.log(chalk.white(message), ...args),
    info: (message, ...args) => console.log(chalk.blue(message), ...args),
    success: (message, ...args) => console.log(chalk.green(message), ...args),
    warn: (message, ...args) => console.warn(chalk.yellow(message), ...args),
    error: (message, ...args) => console.error(chalk.red(message), ...args),
  }
};
/* eslint-enable no-console, no-restricted-globals */
