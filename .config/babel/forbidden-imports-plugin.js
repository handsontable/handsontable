module.exports = function() {
  return {
    visitor: {
      CallExpression: {
        enter: function(nodePath, options) {
          var allowedModules = [].concat(options.opts.allowedModules || []);
          var callee = nodePath.get('callee');

          if (callee.isIdentifier() && callee.equals('name', 'require')) {
            var arg = nodePath.get('arguments')[0];

            if (arg && arg.isStringLiteral() && allowedModules.indexOf(arg.node.value) === -1) {
              throw new Error(`It is not allowed to require "${arg.node.value}" module in this environment.`);
            }
          }
        },
      },

      ImportDeclaration: {
        enter: function(nodePath, options) {
          var allowedModules = [].concat(options.opts.allowedModules || []);

          if (allowedModules.indexOf(nodePath.node.source.value) === -1) {
            throw new Error(`It is not allowed to import "${nodePath.node.source.value}" module in this environment.`);
          }
        },
      },
    },
  };
}
