/**
 * Eval fixture data — reference tests are written exactly as they would land in
 * their real tier (`handsontable/src/helpers/__tests__/`, `tests/e2e/`), so
 * their imports resolve in that tier, not from this directory. Style rules
 * still apply; only the resolution-dependent rules are off.
 */
module.exports = {
  rules: {
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'off',
  },
};
