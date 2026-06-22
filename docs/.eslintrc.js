module.exports = {
  root: true,
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  ignorePatterns: [
    '**/guides/**/*.js',
    '**/guides/**/*.ts',
    '**/guides/**/*.jsx',
    '**/guides/**/*.tsx',
    '**/public/**/*',
    '**/recipes/**/*.js',
    '**/recipes/**/*.ts',
    '**/recipes/**/*.jsx',
    '**/recipes/**/*.tsx',
    '**/*.astro',
    '**/*.d.ts',
    '**/scripts/**/*.ts',
    '**/components/DocsAssistant/**/*.ts',
    '**/components/VersionComparison/**/*.ts',
    '**/content/config.ts',
    '**/content.config.ts',
    '**/src/config/docsearch.ts',
  ],
  rules: {
    'no-restricted-globals': 'off',
    'import/no-unresolved': 'off',
  },
  overrides: [
    {
      files: ['**/*.mjs'],
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
      },
    },
    {
      files: ['**/*.ts'],
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
      },
    },
  ]
};
