module.exports = {
  meta: {
    type: 'suggestion',

    docs: {
      description: 'Forces to use "await" syntax for specified helper (function) names',
      category: 'Custom',
      recommended: false,
      fixable: false,
    },

    schema: {
      anyOf: [{
        type: 'array',
        items: {
          type: 'string',
        },
        uniqueItems: true
      }]
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        const helperNames = Array.isArray(context.options) ? context.options : [];

        if (helperNames.includes(node.callee.name) && node.parent.type !== 'AwaitExpression') {
          context.report({
            node,
            message: `The "${node.callee.name}" helper should be awaited`,
          });
        }
      },
    };
  }
};
