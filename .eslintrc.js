module.exports = {
  extends: ['airbnb-base'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    babelOptions: {
      plugins: [
        '@babel/plugin-syntax-import-assertions',
      ],
    },
  },
  plugins: [
    '@babel',
    'jsdoc',
  ],
  env: {
    browser: true,
    commonjs: true,
    jasmine: true,
    jest: true,
    es6: true,
  },
  rules: {
    'arrow-parens': [
      'error',
      'as-needed',
      { requireForBlockBody: true }
    ],
    'arrow-body-style': 'off',
    'class-methods-use-this': 'off',
    'comma-dangle': 'off',
    'consistent-return': 'off',
    curly: ['error', 'all'],
    'func-names': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
        FunctionDeclaration: { parameters: 'first' },
        FunctionExpression: { parameters: 'first' }
      }
    ],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreComments: true,
        ignorePattern: '^\\s*x?it\\s*\\(', // Ignore long test names (e.q: `it("something long")`).
      }
    ],
    'newline-per-chained-call': 'off',
    'no-constant-condition': [
      'error',
      { checkLoops: false }
    ],
    'no-eq-null': 'error',
    'no-mixed-operators': [
      'error',
      { groups: [['+', '-', '*', '/', '%', '**']] }
    ],
    'no-multiple-empty-lines': [
      'error',
      { max: 1 }
    ],
    'no-param-reassign': 'off',
    'no-plusplus': [
      'error',
      { allowForLoopAfterthoughts: true }
    ],
    'no-restricted-globals': [
      'error',
      'Handsontable',
      'window',
      'document',
      {
        name: 'console',
        message: [
          'Using the `console` object is not allowed within Handsontable.',
          'Please use one of the helpers from the `src/helpers/console.js` file instead.'
        ].join(''),
      },
    ],
    'no-underscore-dangle': 'off',
    'no-use-before-define': [
      'error',
      {
        functions: false,
        classes: false
      }
    ],
    'no-void': 'off',
    'padded-blocks': 'off',
    quotes: ['error', 'single'],
    'space-before-function-paren': ['error', 'never'],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'return' },
      { blankLine: 'always', prev: '*', next: ['if', 'for', 'switch', 'while'] },
      { blankLine: 'any', prev: 'block-like', next: ['if', 'for', 'switch', 'while'] },
      { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
      { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] }
    ],
    'jsdoc/check-access': 'error',
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-examples': 'off',
    'jsdoc/check-indentation': 'off',
    'jsdoc/check-param-names': 'error',
    'jsdoc/check-property-names': 'error',
    'jsdoc/check-syntax': 'error',
    'jsdoc/check-tag-names': [
      'error',
      {
        definedTags: [
          'plugin',
          'util',
          'experimental',
          'deprecated',
          'preserve',
          'core',
          'TODO',
          'category',
          'package',
          'template',
        ]
      }
    ],
    'jsdoc/check-types': 'error',
    'jsdoc/check-values': 'error',
    'jsdoc/empty-tags': 'error',
    'jsdoc/implements-on-classes': 'error',
    'jsdoc/match-description': 'off',
    'jsdoc/newline-after-description': 'error',
    'jsdoc/no-bad-blocks': 'off',
    'jsdoc/no-defaults': 'off',
    'jsdoc/no-types': 'off',
    'jsdoc/no-undefined-types': 'off',
    'jsdoc/require-description-complete-sentence': 'error',
    'jsdoc/require-description': 'off',
    'jsdoc/require-example': 'off',
    'jsdoc/require-file-overview': 'off',
    'jsdoc/require-hyphen-before-param-description': 'off',
    'jsdoc/require-jsdoc': 'error',
    'jsdoc/require-param-description': 'error',
    'jsdoc/require-param-name': 'error',
    'jsdoc/require-param-type': 'error',
    'jsdoc/require-param': 'error',
    'jsdoc/require-property-description': 'error',
    'jsdoc/require-property-name': 'error',
    'jsdoc/require-property-type': 'error',
    'jsdoc/require-property': 'error',
    'jsdoc/require-returns-check': 'error',
    'jsdoc/require-returns-description': 'off',
    'jsdoc/require-returns-type': 'error',
    'jsdoc/require-returns': 'error',
    'jsdoc/valid-types': 'error',
    // TODO: To be reviewed:
    'operator-linebreak': 'off',
    'object-curly-newline': 'off',
    'prefer-destructuring': 'off',
    'implicit-arrow-linebreak': 'off',
    'function-paren-newline': 'off',
    'max-classes-per-file': 'off',
    'import/no-useless-path-segments': 'off',
    'lines-between-class-members': 'off',
    'semi-style': 'off',
    'no-else-return': 'off',
    'import/no-cycle': 'off',
    'no-lone-blocks': 'off',
    'getter-return': 'off',
    'switch-colon-spacing': 'off',
    'operator-assignment': 'off',
  },
  overrides: [
    {
      files: [
        'scripts/**/*.mjs',
        'scripts/**/*.js',
      ],
      rules: {
        'import/extensions': [
          'error',
          'never',
          {
            js: ['error', 'always'],
            mjs: ['error', 'always'],
            json: ['error', 'always'],
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
        ]
      }
    },
  ],
};
