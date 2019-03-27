global.module = void 0;

define = function() {};
define.amd = {};

/**
 * Minimal mockup to import Handsontable.
 */
global.window = {};
global.document = {
  documentElement: {},
  createTextNode() { return {}; },
  defaultView: {},
};
global.navigator = {};
require('../dist/handsontable.full');

if (global.window.Handsontable === void 0) {
  process.stdout.write('Test AMD: success\n');

} else {
  process.stderr.write('Test AMD: failure\n');
  process.exitCode = 1;
}
