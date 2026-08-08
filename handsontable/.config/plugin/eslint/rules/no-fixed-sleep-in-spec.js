module.exports = {
  meta: {
    type: 'suggestion',

    docs: {
      description: 'Disallows fixed `sleep()` delays in spec files — wait for a condition instead',
      category: 'Custom',
      recommended: false,
      fixable: false,
    },

    messages: {
      noSleep: 'Do not use a fixed sleep() delay. Wait for the condition — a hook, a DOM state, or a '
        + 'web-first assertion. See handsontable/.ai/TESTING.md.',
    },
  },

  create(context) {
    return {
      /**
       * Flag any direct `sleep(...)` call.
       *
       * @param {object} node The CallExpression node.
       * @returns {void}
       */
      CallExpression(node) {
        if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'sleep') {
          context.report({ node, messageId: 'noSleep' });
        }
      },
    };
  },
};
