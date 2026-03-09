module.exports = {
  meta: {
    type: 'suggestion',

    docs: {
      description: 'Disallows native Error throws and enforces using throwWithCause helper for Handsontable errors',
      category: 'Custom',
      recommended: false,
      fixable: false,
    },

    messages: {
      useThrowWithCause: 'Use throwWithCause(message) instead of throw new Error() or throw Error(). ' +
        'Import throwWithCause from "utils/errors" to make Handsontable errors recognizable.',
    },

    schema: [
      {
        type: 'object',
        properties: {
          excludeFiles: {
            type: 'array',
            items: { type: 'string' },
            description: 'Glob patterns to exclude from this rule (e.g. **/utils/errors.js)',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const excludePatterns = options.excludeFiles || [
      '**/utils/errors.js',
      '**/jquery.min.js',
    ];
    const filename = context.getFilename();

    const isExcluded = () => {
      const normalizedPath = filename.replace(/\\/g, '/');

      return excludePatterns.some((pattern) => {
        const globToRegex = (glob) => {
          const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*\*/g, '<<STAR>>')
            .replace(/\*/g, '[^/]*')
            .replace(/<<STAR>>/g, '.*');

          return new RegExp(escaped);
        };

        return globToRegex(pattern).test(normalizedPath);
      });
    };

    const isNativeErrorThrow = (node) => {
      if (!node) {
        return false;
      }

      // throw new Error(...)
      if (node.type === 'NewExpression' && node.callee.name === 'Error') {
        return true;
      }

      // throw Error(...) - CallExpression without new
      if (node.type === 'CallExpression' && node.callee.name === 'Error') {
        return true;
      }

      return false;
    };

    if (isExcluded()) {
      return {};
    }

    return {
      ThrowStatement(node) {
        if (isNativeErrorThrow(node.argument)) {
          context.report({
            node: node.argument,
            messageId: 'useThrowWithCause',
          });
        }
      },
    };
  },
};
