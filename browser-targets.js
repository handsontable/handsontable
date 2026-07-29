/**
 * The browsers Handsontable supports, as a Browserslist query.
 *
 * The list itself lives in the root `package.json` under `browserslist` — the standard location every
 * Browserslist-aware tool reads on its own (Babel, swc, Autoprefixer, and static analyzers such as
 * SonarJS, which otherwise assumes the latest ECMAScript version and recommends APIs our targets lack).
 * This module re-exports it so the build configs can keep passing `targets` explicitly, and so there is
 * exactly one place to change a floor.
 *
 * Consumers: `babel.config.js`, `handsontable/.config/*.js` (swc + Lightning CSS), and
 * `handsontable/.eslintrc.js` (`eslint-plugin-compat`, plus the `no-restricted-syntax` group that bans
 * JavaScript methods newer than these floors).
 */
exports.BROWSERS_LIST = require('./package.json').browserslist;
