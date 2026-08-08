module.exports = {
  meta: {
    type: 'problem',

    docs: {
      description: 'Disallow focused/exclusive tests (.only, fit, fdescribe) — they silently drop '
        + 'the rest of the suite',
      category: 'Custom',
      recommended: false,
      fixable: false,
    },

    messages: {
      noFocus: 'Do not commit a focused/exclusive test ({{name}}). It silently skips the rest of the '
        + 'suite, so the run is green while most tests never execute. Remove the focus before committing.',
    },
  },

  create(context) {
    const focusable = new Set(['it', 'test', 'describe', 'context']);

    return {
      /**
       * Flag `fit(...)` / `fdescribe(...)` and `it.only(...)` / `describe.only(...)` etc.
       *
       * @param {object} node The CallExpression node.
       * @returns {void}
       */
      CallExpression(node) {
        const callee = node.callee;

        if (callee && callee.type === 'Identifier' && (callee.name === 'fit' || callee.name === 'fdescribe')) {
          context.report({ node, messageId: 'noFocus', data: { name: callee.name } });

          return;
        }

        if (callee && callee.type === 'MemberExpression'
          && callee.property && callee.property.name === 'only'
          && callee.object && focusable.has(callee.object.name)) {
          context.report({ node, messageId: 'noFocus', data: { name: `${callee.object.name}.only` } });
        }
      },
    };
  },
};
