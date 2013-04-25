var $ = document.querySelector.bind(document);

var c$ = [];

var Component = function(inElement, inDefinition) {
  var elt = inElement;
  // track Components for debugging
  c$.push(elt);
  // make ShadowDOM
  for (var i=0, b; (b=inDefinition.bases[i]); i++) {
    var root = elt.webkitCreateShadowRoot();
    root.applyAuthorStyles = true;
    //root.appendChild(SDOM($("template#" + b).content.cloneNode(true)));
    root.appendChild($("template#" + b).content.cloneNode(true));
    Component.upgradeAll(root);
  }
  // mark it upgraded
  elt.is = inDefinition.name;
  elt.setAttribute("is", inDefinition.name);
  // splice in custom prototype
  //elt.node.__proto__ = inDefinition.proto;
  //elt.__proto__.__proto__.__proto__.__proto__ = inDefinition.proto;
  // force distribution
  //elt.distribute();
  // call initializer
  //elt.created();
  // the element is the Component
  return elt;
};

Component.prototype = {
  //__proto__: HTMLElement.prototype,
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

Component.registry = [];
Component.register = function(inName, inBases, inProto) {
  // our default prototype
  var proto = Component.prototype;
  // optionally chained
  if (inProto) {
    //inProto.__proto__ = proto;
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
  var node = inNode || wrap(document.body);
  Component.registry.forEach(function(d) {
    Component.upgradeName(node, d);
  });
};

Component.upgradeName = function(inNode, inDefinition) {
  var nodes = inNode.querySelectorAll(inDefinition.name);
  Array.prototype.forEach.call(nodes, function(n) {
    if (!n.is) {
      new Component(n, inDefinition);
    }
  });
};
