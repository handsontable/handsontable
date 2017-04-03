module.exports = function() {
  return {
    visitor: {
      CallExpression: {
        enter: function(nodePath, options) {
          var allowedModules = [].concat(options.opts.allowedModules || []);
          var callee = nodePath.get('callee');

          if (callee.isIdentifier() && callee.equals('name', 'require')) {
            var arg = nodePath.get('arguments')[0];

            if (arg && arg.isStringLiteral() && !isMatches(allowedModules, arg.node.value)) {
              throw new Error(`It is not allowed to require "${arg.node.value}" module in this environment.`);
            }
          }
        },
      },

      ImportDeclaration: {
        enter: function(nodePath, options) {
          var allowedModules = [].concat(options.opts.allowedModules || []);

          if (!isMatches(allowedModules, nodePath.node.source.value)) {
            throw new Error(`It is not allowed to import "${nodePath.node.source.value}" module in this environment.`);
          }
        },
      },
    },
  };
}

function isMatches(patterns, valueToCheck) {
  return patterns.some(function(pattern) {
    var globalMode = pattern.indexOf('*') > -1;
    var matches = false;

    if (globalMode) {
      matches = valueToCheck.startsWith(pattern.split('*')[0]);

    } else if (valueToCheck === pattern) {
      matches = true;
    }

    return matches;
  });
}
