/* eslint-disable import/no-unresolved */
import window from 'window';
import './../bootstrap';
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
exportToWindow(common);

[
  require.context('./../../src/plugins', true, /^\.\/.*\/helpers\/.*\.js$/),
].forEach((req) => {
  req.keys().forEach((key) => {
    const helpers = req(key);

    exportToWindow(helpers);
  });
});
