const path = require('path');
const fs = require('fs');

/**
 * Read the LICENSE.txt file and append version/date metadata.
 *
 * @returns {string} The formatted license text.
 */
function getLicenseBody() {
  let body = fs.readFileSync(path.resolve(__dirname, '../../../LICENSE.txt'), 'utf8');

  body += '\nVersion: ' + process.env.HOT_VERSION;
  body += '\nRelease date: ' + process.env.HOT_RELEASE_DATE + ' (built at ' + process.env.HOT_BUILD_DATE + ')';

  return body;
}

module.exports = { getLicenseBody };
