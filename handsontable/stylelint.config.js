module.exports = {
  rules: {
    'selector-class-pattern': null,
    'color-hex-length': null,
    'value-keyword-case': null,
    'no-descending-specificity': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'comment-empty-line-before': null,
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,
    'shorthand-property-no-redundant-values': null,
    'selector-not-notation': null,
    'font-family-name-quotes': null,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'selector-attribute-quotes': null,
    'function-url-quotes': null,
    'number-max-precision': null,
  },
  overrides: [
    {
      files: ['**/*.scss'],
      extends: ['stylelint-config-standard-scss'],
      rules: {
        'scss/operator-no-newline-after': null,
        'scss/at-mixin-argumentless-call-parentheses': null,
        'scss/double-slash-comment-empty-line-before': null,
      },
    },
    {
      files: ['**/*.css'],
      extends: ['stylelint-config-standard'],
    },
  ],
};
