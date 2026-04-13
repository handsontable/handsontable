module.exports = {
  meta: {
    type: 'problem',

    docs: {
      description: 'Disallow `.pickByDensity()` in E2E spec files; use named `getThemeLayout()` helpers instead.',
      category: 'Custom',
      recommended: false,
      fixable: false,
    },

    schema: [],
  },

  create(context) {
    return {
      CallExpression(node) {
        const { callee } = node;

        if (
          callee.type !== 'MemberExpression' ||
          callee.computed ||
          callee.property.type !== 'Identifier' ||
          callee.property.name !== 'pickByDensity'
        ) {
          return;
        }

        context.report({
          node: callee.property,
          message:
            'Do not call `.pickByDensity()` from E2E specs. Use `getThemeLayout().e2ePickForDensity({...})` '
            + 'or other named helpers on `getThemeLayout()` (e.g. `e2e*()`, `e2eGcr_*()`, or token formulas).',
        });
      },
    };
  },
};
