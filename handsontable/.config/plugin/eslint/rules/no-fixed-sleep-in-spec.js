/**
 * Is the node a non-zero numeric literal (`100`, `1`, `1e3`)?
 *
 * A fixed duration is the only shape the rule judges statically. A computed
 * delay (`setTimeout(fn, delay)`) or a bare hand-off (`setTimeout(fn)`) is
 * deliberate scheduling the rule cannot tell from a wait, so it stays silent.
 * A literal `0` is a hand-off too: it yields one macrotask (a scheduling
 * barrier) and waits no duration, so it is exempt as well.
 *
 * @param {object} node An AST node, or undefined.
 * @returns {boolean} True for a numeric Literal other than `0`.
 */
function isFixedDuration(node) {
  return Boolean(node) && node.type === 'Literal' && typeof node.value === 'number' && node.value !== 0;
}

/**
 * Whether the callee is the GLOBAL timer: a bare `setTimeout` or one reached through `window` /
 * `globalThis`. A `setTimeout` method on any other object (`hot._registerTimeout`-style wrappers,
 * a fake-timer facade, a test double) is that object's contract, not a fixed wait on the page,
 * so it is deliberately not judged here - the same scope the Playwright tier's ban uses.
 *
 * @param {object} callee The CallExpression callee node.
 * @returns {boolean}
 */
function isGlobalTimerCall(callee) {
  if (!callee) {
    return false;
  }

  if (callee.type === 'Identifier') {
    return callee.name === 'setTimeout';
  }

  return callee.type === 'MemberExpression' && !callee.computed
    && callee.object && callee.object.type === 'Identifier'
    && (callee.object.name === 'window' || callee.object.name === 'globalThis')
    && callee.property && callee.property.type === 'Identifier'
    && callee.property.name === 'setTimeout';
}

module.exports = {
  meta: {
    type: 'suggestion',

    docs: {
      description: 'Disallows fixed delays in spec files — `sleep()`, a `setTimeout` with a non-zero literal '
        + 'duration, and `waitForNextAnimationFrames()` — wait for a condition with `waitUntil()` instead',
      category: 'Custom',
      recommended: false,
      fixable: false,
    },

    messages: {
      noSleep: 'Do not use a fixed sleep() delay. Wait for the condition with waitUntil(() => …) — '
        + 'a hook having fired, a DOM state, a data probe. See handsontable/.ai/TESTING.md.',
      noSetTimeout: 'Do not wait on a setTimeout() with a fixed duration — a timer is not a wait. '
        + 'Poll the condition with waitUntil(() => …) instead. See handsontable/.ai/TESTING.md.',
      noFrameWait: 'Do not wait on waitForNextAnimationFrames() — a frame count is a fixed delay measured in '
        + 'frames, not the state you need. Poll it with waitUntil(() => …) instead. '
        + 'See handsontable/.ai/TESTING.md.',
    },
  },

  create(context) {
    return {
      /**
       * Flag the three fixed-delay shapes: a direct `sleep(...)` call, a global `setTimeout` (bare,
       * `window.setTimeout`, or `globalThis.setTimeout`) whose delay is a non-zero numeric literal, and any
       * `waitForNextAnimationFrames(...)`.
       *
       * @param {object} node The CallExpression node.
       * @returns {void}
       */
      CallExpression(node) {
        const callee = node.callee;

        if (callee && callee.type === 'Identifier' && callee.name === 'sleep') {
          context.report({ node, messageId: 'noSleep' });

          return;
        }

        if (isGlobalTimerCall(callee) && isFixedDuration(node.arguments[1])) {
          context.report({ node, messageId: 'noSetTimeout' });

          return;
        }

        if (callee && callee.type === 'Identifier' && callee.name === 'waitForNextAnimationFrames') {
          context.report({ node, messageId: 'noFrameWait' });
        }
      },
    };
  },
};
