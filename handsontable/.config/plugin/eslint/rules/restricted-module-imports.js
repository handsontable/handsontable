const { dirname, resolve } = require('path');
const minimatch = require('minimatch');

const isLocalModule = moduleName => moduleName.startsWith('.');

module.exports = {
  meta: {
    type: 'suggestion',

    docs: {
      description: 'Allows restricting specified modules from loading via an `import` or a re-export',
      category: 'Custom',
      recommended: false,
      fixable: false,
    },

    messages: {
      path: `The module '{{importSource}}' that you're trying to import (or re-export) is part of
               the public API and cannot be used. Importing the main entry of the module can
               make the "dead" code elimination process more difficult. If you need to use the
               module, use its specific files (e.g. use 'plugins/registry' instead of 'plugin').`,
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
    const restrictedPaths = Array.isArray(context.options) ? context.options : [];

    if (restrictedPaths.length === 0) {
      return {};
    }

    const checkNode = (node) => {
      const { source } = node;
      const { value: moduleName } = source;

      if (!isLocalModule(moduleName)) {
        return;
      }

      const processedFileDirname = dirname(context.getFilename());
      const absoluteModulePath = resolve(processedFileDirname, moduleName);

      restrictedPaths.forEach((restrictedPath) => {
        if (minimatch(absoluteModulePath, restrictedPath)) {
          context.report({
            node,
            messageId: 'path',
            data: {
              importSource: restrictedPath,
            }
          });
        }
      });
    };

    return {
      ImportDeclaration: checkNode,
      ExportNamedDeclaration(node) {
        if (node.source) {
          checkNode(node);
        }
      },
      ExportAllDeclaration: checkNode,
      ExportDefaultDeclaration(node) {
        if (node.source) {
          checkNode(node);
        }
      },
    };
  }
};
