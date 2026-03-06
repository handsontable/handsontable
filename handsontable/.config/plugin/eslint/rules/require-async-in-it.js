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
    return {
      CallExpression(node) {
        if (
          node.callee.name === 'it' &&
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
