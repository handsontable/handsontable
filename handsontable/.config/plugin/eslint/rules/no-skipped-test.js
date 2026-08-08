module.exports = {
  meta: {
    type: 'suggestion',

    docs: {
      description: 'Flag skipped tests (.skip, xit, xdescribe) — a skipped test proves nothing; '
        + 'do not add new ones to reach green',
      category: 'Custom',
      recommended: false,
      fixable: false,
    },

    messages: {
      noSkip: 'Skipped test ({{name}}) — it proves nothing. Never add a skip to reach green; fix the '
        + 'test or the code, or remove it. See handsontable/.ai/TESTING.md.',
    },
  },

  create(context) {
    const skippable = new Set(['it', 'test', 'describe', 'context']);

    return {
      /**
       * Flag `xit(...)` / `xdescribe(...)` and `it.skip(...)` / `describe.skip(...)` etc.
       *
       * @param {object} node The CallExpression node.
       * @returns {void}
       */
      CallExpression(node) {
        const callee = node.callee;

        if (callee && callee.type === 'Identifier'
          && (callee.name === 'xit' || callee.name === 'xdescribe' || callee.name === 'xtest')) {
          context.report({ node, messageId: 'noSkip', data: { name: callee.name } });

          return;
        }

        if (callee && callee.type === 'MemberExpression'
          && callee.property && callee.property.name === 'skip'
          && callee.object && skippable.has(callee.object.name)) {
          context.report({ node, messageId: 'noSkip', data: { name: `${callee.object.name}.skip` } });
        }
      },
    };
  },
};
