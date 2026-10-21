module.exports = {
  meta: {
    type: 'problem',

    docs: {
      description: 'Requires plugins to register hooks through the tracked BasePlugin#addHook inside enablePlugin',
      category: 'Custom',
      recommended: false,
    },

    hasSuggestions: true,

    messages: {
      useTrackedAddHook: 'Use this.addHook() rather than this.hot.addHook() inside enablePlugin(). ' +
        'BasePlugin only removes the hooks it registered itself, so a hook added straight to the ' +
        'instance keeps running after the plugin is disabled — usually against state the plugin ' +
        'has already torn down. Register it in the constructor or init() when it genuinely has to ' +
        'outlive a disable.',
      replaceWithTrackedAddHook: 'Replace this.hot.addHook() with the tracked this.addHook().',
    },

    schema: [],
  },

  create(context) {
    /**
     * Reports whether a node sits inside the body of an `enablePlugin` method.
     *
     * @param {object} node The node to test.
     * @returns {boolean} `true` when an `enablePlugin` method encloses it.
     */
    function isWithinEnablePlugin(node) {
      let current = node.parent;

      while (current) {
        if (current.type === 'MethodDefinition' && current.key && current.key.name === 'enablePlugin') {
          return true;
        }

        current = current.parent;
      }

      return false;
    }

    return {
      CallExpression(node) {
        const { callee } = node;

        if (callee.type !== 'MemberExpression' || callee.property.name !== 'addHook') {
          return;
        }

        const target = callee.object;
        const isInstanceCall = target.type === 'MemberExpression'
          && target.object.type === 'ThisExpression'
          && target.property.name === 'hot';

        if (!isInstanceCall || !isWithinEnablePlugin(node)) {
          return;
        }

        context.report({
          node,
          messageId: 'useTrackedAddHook',
          suggest: [{
            messageId: 'replaceWithTrackedAddHook',
            fix(fixer) {
              return fixer.replaceText(callee.object, 'this');
            },
          }],
        });
      },
    };
  },
};
