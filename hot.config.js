const moment = require('moment');
const package = require('./package.json');

module.exports = {
  HOT_FILENAME: 'handsontable',
  HOT_VERSION: package.version,
  HOT_BASE_VERSION: '',
  HOT_PACKAGE_TYPE: 'ce',
  HOT_PACKAGE_NAME: package.name,
  HOT_BUILD_DATE: moment().format('DD/MM/YYYY HH:mm:ss'),
  HOT_RELEASE_DATE: '30/08/2017',
}
