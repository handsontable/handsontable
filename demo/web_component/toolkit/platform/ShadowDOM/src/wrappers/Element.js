// Copyright 2013 The Toolkitchen Authors. All rights reserved.
// Use of this source code is goverened by a BSD-style
// license that can be found in the LICENSE file.

(function(scope) {
  'use strict';

  var ChildNodeInterface = scope.ChildNodeInterface;
  var Node = scope.wrappers.Node;
  var ParentNodeInterface = scope.ParentNodeInterface;
  var SelectorsInterface = scope.SelectorsInterface;
  var addWrapNodeListMethod = scope.addWrapNodeListMethod;
  var mixin = scope.mixin;
  var registerWrapper = scope.registerWrapper;
  var wrappers = scope.wrappers;

  var shadowRootTable = new SideTable();
  var OriginalElement = window.Element;

  function Element(node) {
    Node.call(this, node);
  }
  Element.prototype = Object.create(Node.prototype);
  mixin(Element.prototype, {
    createShadowRoot: function() {
      var newShadowRoot = new wrappers.ShadowRoot(this);
      shadowRootTable.set(this, newShadowRoot);

      var renderer = new scope.ShadowRenderer(this);

      this.invalidateShadowRenderer();

      return newShadowRoot;
    },

    get shadowRoot() {
      return shadowRootTable.get(this) || null;
    },

    setAttribute: function(name, value) {
      this.impl.setAttribute(name, value);
      // This is a bit agressive. We need to invalidate if it affects
      // the rendering content[select] or if it effects the value of a content
      // select.
      this.invalidateShadowRenderer();
    }
  });

  mixin(Element.prototype, ChildNodeInterface);
  mixin(Element.prototype, ParentNodeInterface);
  mixin(Element.prototype, SelectorsInterface);

  [
    'getElementsByTagName',
    'getElementsByTagNameNS',
    'getElementsByClassName'
  ].forEach(function(name) {
    addWrapNodeListMethod(Element, name);
  });

  registerWrapper(OriginalElement, Element);

  scope.wrappers.Element = Element;
})(this.ShadowDOMPolyfill);
