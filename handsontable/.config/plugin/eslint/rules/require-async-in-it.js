module.exports = {
  meta: {
    type: 'suggestion',

    docs: {
      description: 'Restricts the use of `it` function (Jasmine) with async/await syntax',
      category: 'Custom',
      recommended: false,
      fixable: false,
    },
  },

  create(context) {
    /**
     * Checks if a CallExpression node is a call to `it`, `it.flaky`, `fit.flaky`,
     * or similar member expressions on `it`/`fit`.
     *
     * @param {object} callee The callee node of the CallExpression.
     * @returns {boolean}
     */
    function isItCall(callee) {
      // Direct `it(...)` call.
      if (callee.name === 'it') {
        return true;
      }

      // Member expression like `it.flaky(...)` or `fit.flaky(...)`.
      if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        (callee.object.name === 'it' || callee.object.name === 'fit')
      ) {
        return true;
      }

      return false;
    }

    return {
      CallExpression(node) {
        if (
          isItCall(node.callee) &&
          node.arguments[1] &&
          (node.arguments[1].type === 'ArrowFunctionExpression' || node.arguments[1].type === 'FunctionExpression') &&
          node.arguments[1].async !== true
        ) {
          context.report({
            node,
            message: 'Test functions in `it` should be async.',
          });
        }
      },
    };
  }
};
