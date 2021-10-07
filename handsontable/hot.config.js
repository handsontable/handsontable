const moment = require('moment');
const packageBody = require('./package.json');

module.exports = {
  HOT_FILENAME: 'handsontable',
  HOT_VERSION: packageBody.version,
  HOT_PACKAGE_NAME: packageBody.name,
  HOT_BUILD_DATE: moment().format('DD/MM/YYYY HH:mm:ss'),
  HOT_RELEASE_DATE: '29/09/2021',
};
