module.exports = {
  meta: {
    type: 'suggestion',

    docs: {
      description: 'Flag a test (it/test/fit) whose body contains no assertion — a test that '
        + 'executes code but checks nothing',
      category: 'Custom',
      recommended: false,
      fixable: false,
    },

    messages: {
      noAssertion: 'This test has no assertion — it executes code but proves nothing (hollow coverage). '
        + 'Assert the behavior (e.g. expect(...)). See handsontable/.ai/TESTING.md.',
    },
  },

  create(context) {
    const TEST_FNS = new Set(['it', 'test', 'fit']);
    // A call counts as an assertion if it is expect(...) or a helper whose name
    // reads as one (assert*/verify*/expect*) — covers custom assertion helpers and
    // keeps false positives (WARN-only) low.
    const ASSERTION_RE = /^(expect|assert|verify)/i;
    const stack = [];

    /**
     * Is this CallExpression a test declaration we should require an assertion in?
     *
     * @param {object} node The CallExpression node.
     * @returns {boolean} True for `it(...)` / `test(...)` / `fit(...)` with a callback.
     */
    function isTestCall(node) {
      const callee = node.callee;

      return callee && callee.type === 'Identifier' && TEST_FNS.has(callee.name) && node.arguments.length >= 2;
    }

    return {
      /**
       * Track entering a test, and mark the current test when an assertion is seen.
       *
       * @param {object} node The CallExpression node.
       * @returns {void}
       */
      CallExpression(node) {
        const callee = node.callee;
        const name = callee && callee.type === 'Identifier'
          ? callee.name
          : (callee && callee.type === 'MemberExpression' && callee.object && callee.object.name);

        if (stack.length > 0 && typeof name === 'string' && ASSERTION_RE.test(name)) {
          stack[stack.length - 1].hasAssertion = true;
        }

        if (isTestCall(node)) {
          stack.push({ node, hasAssertion: false });
        }
      },

      /**
       * On leaving a test, report if it never asserted.
       *
       * @param {object} node The CallExpression node.
       * @returns {void}
       */
      'CallExpression:exit': function onExit(node) {
        if (isTestCall(node)) {
          const entry = stack.pop();

          if (entry && !entry.hasAssertion) {
            context.report({ node, messageId: 'noAssertion' });
          }
        }
      },
    };
  },
};
