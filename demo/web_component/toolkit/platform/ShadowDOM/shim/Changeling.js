(function(scope) {
  
var Changeling = function(inNode, inFromShadow) {
  var node = inNode.baby || inNode;
  var elt = document.createElement(node.tagName || "span");
  //elt.innerHTML = inNode.innerHTML;
  elt.textContent = '(changeling for ' + (node.tagName || "TEXT") + ')';
  elt.__proto__ = Changeling.prototype;
  elt.baby = node;
  return elt;
};

Changeling.prototype = {
  /*
  get innerHTML() {
    return this.baby.innerHTML;
  },
  get childNodes() {
    return this.baby.childNodes;
  },
  */
  transplant: function(inNode) {
    return transplantNode(this, inNode);
  }/*,
  remove: function() {
    transplantNode(this.baby, this);
    this.baby.changeling = null;
    this.baby = null;
  }
  */
};
Changeling.prototype.__proto__ = HTMLDivElement.prototype;

var transplantNode = function(upgrade, element) {
  if (element.tagName) {
    copyNodeAttrs(upgrade, element);
  }
  element.parentNode.replaceChild(upgrade, element);
  return upgrade;
};

var copyNodeAttrs = function(upgrade, element) {
  forEach(element.attributes, function(a) {
    upgrade.setAttribute(a.name, a.value);
  });
};

// exports

scope.Changeling = Changeling;

})(window.__exported_components_polyfill_scope__);
