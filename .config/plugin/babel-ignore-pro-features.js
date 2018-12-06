module.exports = function() {
  return {
    visitor: {
      ExportAllDeclaration: {
        enter: function enter(nodePath) {
          if (nodePath.node.source && nodePath.node.source.value === './pro-features' ) {
            nodePath.remove();
          }
        }
      }
    }
  };
};
