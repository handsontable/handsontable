/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

function nop() {};

// Old versions of iOS do not have bind.
if (!Function.prototype.bind) {
  Function.prototype.bind = function(scope) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);
    return function() {
      var args2 = args.slice();
      args2.push.apply(args2, arguments);
      return self.apply(scope, args2);
    };
  };
}

// missing DOM/JS API

var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);

function $(inElement, inSelector) {
  if (arguments.length == 1) {
    inSelector = inElement;
    inElement = document;
  }
  return inElement.querySelector(inSelector);
}

function $$(inElement, inSelector) {
  var nodes = inElement.querySelectorAll(inSelector);
  nodes.forEach = Array.prototype.forEach;
  return nodes;
}

function createDOM(inTagOrNode, inHTML, inAttrs) {
  var dom = typeof inTagOrNode == 'string' ?
      document.createElement(inTagOrNode) : inTagOrNode.cloneNode(true);
  dom.innerHTML = inHTML;
  if (inAttrs) {
    for (var n in inAttrs) {
      dom.setAttribute(n, inAttrs[n]);
    }
  }
  return dom;
}
