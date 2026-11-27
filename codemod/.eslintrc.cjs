// ESLint config for the codemod package. It extends the root config and applies the same relaxations the
// root config gives `scripts/**/*.mjs`: this package is Node-side ESM, so a relative import carries its
// extension, `console` is the CLI's output channel, and a sequential `await` in a loop is intended.
// CommonJS (.cjs) because the package is "type": "module" and ESLint's legacy config loader needs CJS.
module.exports = {
  extends: ['../.eslintrc.js'],
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': [
      'error',
      'never',
      {
        pattern: {
          js: 'always',
          mjs: 'always',
          json: 'always',
        },
        ignorePackages: true,
      }
    ],
    'no-restricted-globals': 'off',
    'no-console': 'off',
    'no-await-in-loop': 'off',
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
  },
};
