/* eslint-disable import/no-unresolved */
import window from 'window';
import * as common from './common';

// Export all helpers to the window.
Object.keys(common).forEach((key) => {
  window[key] = common[key];
});

// [
//   require.context('./../../src/plugins', true, /^\.\/.*\/helpers\/index\.js$/),
// ].forEach((req) => {
//   req.keys().forEach((key) => {
//     console.log(key);
//     req(key);
//   });
// });
