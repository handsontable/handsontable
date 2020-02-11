module.exports = {
  "extends": ["airbnb-base"],
  "parser": "babel-eslint",
  "plugins": [
    "babel",
    "jsdoc",
  ],
  "env": {
    "browser": true,
    "commonjs": true,
    "jasmine": true,
    "jest": true,
    "es6": true,
  },
  "rules": {
    "arrow-parens": [
      "error",
      "as-needed",
      { "requireForBlockBody": true }
    ],
    "arrow-body-style": "off",
    "class-methods-use-this": "off",
    "comma-dangle": "off",
    "consistent-return": "off",
    "func-names": "off",
    "import/no-extraneous-dependencies": "off",
    "indent": [
      "error",
      2,
      {
        "SwitchCase": 1,
        "FunctionDeclaration": { "parameters": "first" },
        "FunctionExpression": { "parameters": "first" }
      }
    ],
    "max-len": [
      "error",
      {
        "code": 170,
        "ignoreComments": true
      }
    ],
    "newline-per-chained-call": "off",
    "no-constant-condition": [
      "error",
      { "checkLoops": false }
    ],
    "no-eq-null": "error",
    "no-mixed-operators": [
      "error",
      { "groups": [["+", "-", "*", "/", "%", "**"]] }
    ],
    "no-multiple-empty-lines": [
      "error",
      { "max": 1 }
    ],
    "no-param-reassign": "off",
    "no-plusplus": [
      "error",
      { "allowForLoopAfterthoughts": true }
    ],
    "no-restricted-globals": [
      "error",
      "Handsontable",
      "window",
      "document",
      {
        "name": "console",
        "message": "Using the `console` object is not allowed within Handsontable. Please use one of the helpers from the `console.js` file instead."
      }
    ],
    "no-underscore-dangle": "off",
    "no-use-before-define": [
      "error",
      {
        "functions": false,
        "classes": false
      }
    ],
    "no-void": "off",
    "padded-blocks": "off",
    "quotes": [ "error", "single" ],
    "space-before-function-paren": ["error", "never"],
    'jsdoc/check-access': 'error',
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-examples': 'off',
    'jsdoc/check-indentation': 'off',
    'jsdoc/check-param-names': 'error',
    'jsdoc/check-property-names': 'error',
    'jsdoc/check-syntax': 'error',
    'jsdoc/check-tag-names': [
      "error",
      {
        "definedTags": ["plugin", "util", "experimental", "deprecated", "preserve", "core", "TODO"]
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
  },
  "overrides": [
    {
      "files": ["test/**", "src/3rdparty/walkontable/test/**", "*.unit.js", "*.e2e.js", "src/plugins/**/test/helpers/**"],
      "rules": {
        "import/extensions": "off",
        "import/no-unresolved": [
          "error",
          { "ignore": ["handsontable", "walkontable"] }
        ],
        "no-restricted-globals": "off",
        "no-undef": "off",
      }
    },
    {
      "files": ["*.unit.js", "*.e2e.js", "*.spec.js"],
      "rules": {
        "no-restricted-globals": "off",
        "no-undef": "off",
        "jsdoc/require-description-complete-sentence": "off",
        "jsdoc/require-jsdoc": "off",
        "jsdoc/require-param-description": "off",
        "jsdoc/require-param-type": "off",
        "jsdoc/require-returns": "off",
      }
    }
  ],
}
