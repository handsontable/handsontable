/**
 * Minimal mockup to import Handsontable.
 */
global.window = {};
global.document = {
  documentElement: {},
  createTextNode() {
    return {};
  },
  defaultView: {},
};
global.navigator = {};
require('../dist/handsontable.full')(this);

if (this.Handsontable !== void 0) {
  process.stdout.write('Test assign: success\n');

} else {
  process.stderr.write('Test assign: failure\n');
  process.exitCode = 1;
}
