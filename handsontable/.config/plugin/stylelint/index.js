/* eslint-disable global-require */
/**
 * Custom stylelint plugin for Handsontable's SCSS/CSS sources. The SCSS analog of the
 * `eslint-plugin-handsontable` package — SCSS is linted by stylelint (ESLint cannot parse it), so
 * house rules for stylesheets live here. Wired as a pnpm `file:` dependency and registered in
 * `stylelint.config.js`; after editing a rule run `pnpm install` (the dep is copied, not symlinked).
 */
module.exports = [
  require('./rules/no-has-selector'),
];
