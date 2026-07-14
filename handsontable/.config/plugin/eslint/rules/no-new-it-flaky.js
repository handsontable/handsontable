module.exports = {
  meta: {
    type: 'suggestion',

    docs: {
      description: 'Disallows new it.flaky()/fit.flaky() — fix the flake at its root or migrate the spec to Playwright',
      category: 'Custom',
      recommended: false,
      fixable: false,
    },

    messages: {
      noFlaky: 'Do not add it.flaky()/fit.flaky(). Fix the flake at its source, or migrate the spec '
        + 'to Playwright (tests/e2e). See handsontable/.ai/TESTING.md.',
    },
  },

  create(context) {
    return {
      /**
       * Flag `it.flaky(...)` and `fit.flaky(...)` member calls.
       *
       * @param {object} node The CallExpression node.
       * @returns {void}
       */
      CallExpression(node) {
        const callee = node.callee;

        if (callee && callee.type === 'MemberExpression'
          && callee.property && callee.property.name === 'flaky'
          && callee.object && (callee.object.name === 'it' || callee.object.name === 'fit')) {
          context.report({ node, messageId: 'noFlaky' });
        }
      },
    };
  },
};
