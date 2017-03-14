var path = require('path');

module.exports = function() {
  function normalizeExt(ext) {
    return ext.charAt(0) === '.' ? ext : ('.' + ext);
  }

  return {
    visitor: {
      ImportDeclaration: {
        enter: function(nodePath, options) {
          var extensionsInput = [].concat(options.opts.extensions || []);

          if (extensionsInput.length === 0) {
            return;
          }
          var extensions = extensionsInput.map(normalizeExt);

          if (extensions.indexOf(path.extname(nodePath.node.source.value)) > -1) {
            var specifiers = nodePath.get('specifiers');

            if (specifiers.length) {
              var specifier = specifiers[specifiers.length - 1];

              if (specifier.isImportDefaultSpecifier()) {
                throw new Error('"' + nodePath.node.source.value + '" should not be imported using default imports.');
              }
              if (specifier.isImportSpecifier()) {
                throw new Error('"' + nodePath.node.source.value + '" should not be imported using named imports.');
              }
              if (specifier.isImportNamespaceSpecifier()) {
                throw new Error('"' + nodePath.node.source.value + '" should not be imported using namespace imports.');
              }
            }

            nodePath.remove();
          }
        }
      }
    }
  };
}
