// const chalk = require('chalk');

/* eslint-disable no-console, no-restricted-globals */
module.exports = {
  logger: {
    log: message => console.log(message),
    success: message => console.log(message),
    warn: message => console.warn(message),
    error: message => console.error(message),
  }
};
/* eslint-enable no-console, no-restricted-globals */
