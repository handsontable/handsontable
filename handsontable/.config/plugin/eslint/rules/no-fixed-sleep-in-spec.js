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
 * Resolve the called name of `foo(...)` and `obj.foo(...)` alike.
 *
 * @param {object} callee The CallExpression callee node.
 * @returns {string|null} The identifier or property name, or null for computed shapes.
 */
function calledName(callee) {
  if (!callee) {
    return null;
  }

  if (callee.type === 'Identifier') {
    return callee.name;
  }

  if (callee.type === 'MemberExpression' && !callee.computed && callee.property
    && callee.property.type === 'Identifier') {
    return callee.property.name;
  }

  return null;
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
       * Flag the three fixed-delay shapes: a direct `sleep(...)` call, a `setTimeout` (bare or as
       * `window.setTimeout`) whose delay is a non-zero numeric literal, and any
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

        if (calledName(callee) === 'setTimeout' && isFixedDuration(node.arguments[1])) {
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
