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
require('../dist/handsontable.full');

if (global.window.Handsontable === void 0) {
  process.stdout.write('Test exports: success\n');

} else {
  process.stderr.write('Test exports: failure\n');
  process.exitCode = 1;
}
