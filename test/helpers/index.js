/* eslint-disable import/no-unresolved */
import window from 'window';
import './../bootstrap';
import * as mouseEvents from './mouseEvents';
import * as keyboardEvents from './keyboardEvents';
import * as common from './common';

const exportToWindow = (helpersHolder) => {
  Object.keys(helpersHolder).forEach((key) => {
    if (key === '__esModule') {
      return;
    }

    if (window[key] !== void 0) {
      throw Error(`Cannot export "${key}" helper because this name is already assigned.`);
    }

    window[key] = helpersHolder[key];
  });
};

// Export all helpers to the window.
exportToWindow(mouseEvents);
exportToWindow(keyboardEvents);
exportToWindow(common);

// Include all js files within the "helper/" folder for all plugins. That files can export some additional
// functions, helpers which provides a different dataset for different test cases.
[
  require.context('./../../src/plugins', true, /^\.\/.*\/helpers\/.*\.js$/),
].forEach((req) => {
  req.keys().forEach((key) => {
    const helpers = req(key);

    exportToWindow(helpers);
  });
});
