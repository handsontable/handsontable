module.exports = {
  extends: [
    '../.eslintrc.js',
    'plugin:import/typescript'
  ],
  rules: {
    // @argos-ci/core is an ESM-only package that uses the `exports` field in package.json.
    // The default eslint-import-resolver-node does not support the `exports` field, so the
    // module cannot be resolved statically even though it is installed correctly.
    'import/no-unresolved': ['error', { ignore: ['@argos-ci/core'] }],
  },
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: {
        'import/extensions': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error'],
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': ['error', {
          functions: false,
          classes: false,
          variables: true,
          typedefs: false
        }]
      }
    }
  ]
};
