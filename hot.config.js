const moment = require('moment');
const packageBody = require('./package.json');

module.exports = {
  HOT_FILENAME: 'handsontable',
  HOT_VERSION: packageBody.version,
  HOT_BASE_VERSION: packageBody.dependencies.handsontable,
  HOT_PACKAGE_TYPE: 'pro',
  HOT_PACKAGE_NAME: packageBody.name,
  HOT_BUILD_DATE: moment().format('DD/MM/YYYY HH:mm:ss'),
  HOT_RELEASE_DATE: '17/10/2018',
};
