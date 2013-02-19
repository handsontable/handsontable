var $ = document.querySelector.bind(document);

var c$ = [];

var Component = function(inElement, inDefinition) {
  var elt = inElement;
  // track Components for debugging
  c$.push(elt);
  // make ShadowDOM
  for (var i=0, root, olderSubtree, b; (b=inDefinition.bases[i]); i++) {
    root = new ShadowRoot(elt, b);
    root.olderSubtree = olderSubtree;
    Component.upgradeAll(root);
    olderSubtree = root;
  }
  // mark it upgraded
  elt.is = inDefinition.name;
  elt.setAttribute("is", inDefinition.name);
  // splice in custom prototype
  elt.__proto__ = inDefinition.proto;
  // distribute nodes from light dom into shadow dom
  ShadowDOM.distribute(elt);
  // call initializer
  elt.created();
  // the element is the Component
  return elt;
};

Component.prototype = {
  __proto__: HTMLUnknownElement.prototype,
  events: {
  },
  created: function() {
    for (var n in this.events) {
      var fn = this[this.events[n]];
      if (fn) {
        this.addEventListener(n, fn.bind(this));
      }
    }
  }
};

Component.reset = function() {
  Component.registry = [];
  c$ = [];
};

Component.registry = [];
Component.register = function(inName, inBases, inProto) {
  // our default prototype
  var proto = Component.prototype;
  // optionally chained
  if (inProto) {
    inProto.__proto__ = proto;
    proto = inProto;
  }
  // store definition
  Component.registry.push({
    name: inName,
    proto: proto,
    bases: inBases
  });
};

Component.upgradeAll = function(inNode) {
  var node = (inNode && inNode.baby) || inNode || $("#work") || document.body;
  Component.registry.forEach(function(d) {
    Component.upgradeName(node, d);
  });
};

Component.upgradeName = function(inNode, inDefinition) {
  var nodes = inNode.querySelectorAll(inDefinition.name);
  Array.prototype.forEach.call(nodes, function(n) {
    n = n.baby || n;
    if (!n.is) {
      new Component(n, inDefinition);
    }
  });
};

