(function(scope) {

var scope = scope || {};

var LightDOM = function(inNode) {
  // store lightDOM as a document fragment
  inNode.lightDOM = document.createDocumentFragment();
  // back-reference host
  inNode.lightDOM.host = inNode;
  // identify this fragment as lightDOM
  inNode.lightDOM.isLightDOM = true;
  // move our children into the fragment
  moveChildren(inNode, inNode.lightDOM);
  // alter inNode's API
  // no bueno on Safari (improper translation of IDL?)
  /*
  inNode.composedNodes = inNode.childNodes;
  Object.defineProperties(inNode, {
    childNodes: {
      get: function() {
        return this.lightDOM.childNodes;
      }
    }
  });
  */
  inNode.appendChild = function(inNode) {
    return this.lightDOM.appendChild(inNode);
  };
  // return the fragment
  return inNode.lightDOM;
};

var moveChildren = function(inElement, inUpgrade) {
  var n$ = inElement.insertions;
  if (n$) {
    // clean up insertions and content rendered from insertions
    inElement.insertions = null;
    inElement.textContent = '';
  } else {
    n$ = [];
    forEach(inElement.childNodes, function(n) {
      n$.push(n);
    });
  }
  forEach(n$, function(n) {
    inUpgrade.appendChild(n);
  });
};

// exports

scope.LightDOM = LightDOM;

})(window.__exported_components_polyfill_scope__);
