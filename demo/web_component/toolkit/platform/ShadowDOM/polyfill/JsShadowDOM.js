(function(scope) {

scope.JsShadowDOM = {
  ShadowRoot: function(inElement) {
    var root = inElement.jsCreateShadowRoot();
    root.olderSubtree = inElement.shadow;
    inElement.shadow = root;
    root.host = inElement;
    root.applyAuthorStyles = true;
    return root;
  },
  distribute: function(inNode) {
    //render(inNode);
  },
  localQuery: function(inElement, inSlctr) {
    return inElement.querySelector(inSlctr);
  },
  localQueryAll: function(inElement, inSlctr) {
    return inElement.querySelectorAll(inSlctr);
  }
};

})(window.__exported_components_polyfill_scope__);
