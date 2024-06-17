module.exports = {
  extends: ['../.eslintrc.js'],
  parserOptions: {
    requireConfigFile: false,
  },
  rules: {
    'no-restricted-syntax': 'off',
    'no-restricted-globals': 'off',
    'no-console': 'off',
    'no-await-in-loop': 'off',
    'no-unused-vars': 'off',
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'multiline-block-like' },
      { blankLine: 'always', prev: 'multiline-block-like', next: '*' },

      // { blankLine: "always", prev: "*", next: "multiline-const" },
      { blankLine: 'always', prev: 'multiline-const', next: '*' },

      // { blankLine: "always", prev: "*", next: "multiline-let" },
      { blankLine: 'always', prev: 'multiline-let', next: '*' },

      // { blankLine: "always", prev: "*", next: "multiline-var" },
      { blankLine: 'always', prev: 'multiline-var', next: '*' },

      { blankLine: 'always', prev: ['singleline-const', 'singleline-let', 'singleline-var'], next: '*' },
      { blankLine: 'any', prev: ['singleline-const', 'singleline-let', 'singleline-var'], next: ['const', 'let', 'var'] },

      // { blankLine: "always", prev: "*", next: "multiline-expression" },
      { blankLine: 'always', prev: 'multiline-expression', next: '*' },

      { blankLine: 'always', prev: 'expression', next: '*' },
      { blankLine: 'any', prev: 'expression', next: 'expression' },

      { blankLine: 'always', prev: 'import', next: '*' },
      { blankLine: 'any', prev: 'import', next: 'import' },

      { blankLine: 'always', prev: ['case', 'default'], next: '*' },
      { blankLine: 'any', prev: ['case', 'default'], next: ['case', 'default'] },
    ]
  },
};
