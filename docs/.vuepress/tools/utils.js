const chalk = require('chalk');

/* eslint-disable no-console, no-restricted-globals */
module.exports = {
  logger: {
    log: message => console.log(chalk.white(message)),
    info: message => console.log(chalk.blue(message)),
    success: message => console.log(chalk.green(message)),
    warn: message => console.warn(chalk.yellow(message)),
    error: message => console.error(chalk.red(message)),
  }
};
/* eslint-enable no-console, no-restricted-globals */
