module.exports = {
  "extends": "airbnb-base",
  "parser": "babel-eslint",
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
    "class-methods-use-this": "off",
    "comma-dangle": "off",
    "consistent-return": "off",
    "func-names": "off",
    "import/extensions": "off",
    "import/no-extraneous-dependencies": "off",
    "import/no-unresolved": [
      "error",
      { "ignore": ["handsontable", "walkontable"] }
    ],
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
  },
  "overrides": [
    {
      "files": ["test/**", "src/3rdparty/walkontable/test/**", "*.unit.js", "*.e2e.js", "src/plugins/**/test/helpers/**"],
      "rules": {
        "no-restricted-globals": "off",
        "no-undef": "off",
      }
    }
  ],
}
