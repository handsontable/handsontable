// Copyright 2013 The Toolkitchen Authors. All rights reserved.
// Use of this source code is goverened by a BSD-style
// license that can be found in the LICENSE file.

(function(scope) {
  'use strict';

  var ParentNodeInterface = scope.ParentNodeInterface;
  var Node = scope.wrappers.Node;
  var defineWrapGetter = scope.defineWrapGetter;
  var mixin = scope.mixin;
  var registerWrapper = scope.registerWrapper;
  var unwrap = scope.unwrap;
  var wrap = scope.wrap;
  var wrapEventTargetMethods = scope.wrapEventTargetMethods;
  var wrapNodeList = scope.wrapNodeList;
  var forwardMethodsToWrapper = scope.forwardMethodsToWrapper;

  var implementationTable = new SideTable();

  var OriginalDocument = window.Document;

  function Document(node) {
    Node.call(this, node);
  }
  Document.prototype = Object.create(Node.prototype);

  defineWrapGetter(Document, 'documentElement');

  // Conceptually both body and head can be in a shadow but suporting that seems
  // overkill at this point.
  defineWrapGetter(Document, 'body');
  defineWrapGetter(Document, 'head');

  // We also override some of the methods on document.body and document.head
  // for convenience.
  forwardMethodsToWrapper([window.HTMLBodyElement, window.HTMLHeadElement],
      [
        'appendChild',
        'insertBefore',
        'replaceChild',
        'removeChild'
      ]);

  mixin(Document.prototype, ParentNodeInterface);

  mixin(Document.prototype, {
    get implementation() {
      var implementation = implementationTable.get(this);
      if (implementation)
        return implementation;
      implementation =
          new DOMImplementation(unwrap(this).implementation);
      implementationTable.set(this, implementation);
      return implementation;
    }
  });
  
  var originalAdoptNode = document.adoptNode;
  Document.prototype.adoptNode = function(node) {
    originalAdoptNode.call(this.impl, unwrap(node));
    return node;
  };
  Object.getPrototypeOf(document).adoptNode = function(node) {
    return wrap(this).adoptNode(node);
  };

  registerWrapper(OriginalDocument, Document,
      document.implementation.createHTMLDocument(''));

  // Both WebKit and Gecko uses HTMLDocument for document. HTML5/DOM only has
  // one Document interface and IE implements the standard correctly.
  if (window.HTMLDocument)
    registerWrapper(window.HTMLDocument, Document);

  function wrapMethod(name) {
    var proto = Object.getPrototypeOf(document);
    var original = proto[name];
    proto[name] = function() {
      return wrap(original.apply(this, arguments));
    };
    Document.prototype[name] = function() {
      return wrap(original.apply(this.impl, arguments));
    };
  }

  // document cannot be overridden so we override a bunch of its methods
  // directly on the instance

  [
    'getElementById',
    'querySelector',
    'createElement',
    'createElementNS',
    'createTextNode',
    'createDocumentFragment',
    'createEvent',
    'createEventNS',
  ].forEach(wrapMethod);

  function wrapNodeListMethod(name) {
    var proto = Object.getPrototypeOf(document);
    var original = proto[name];
    proto[name] = function() {
      return wrapNodeList(original.apply(this, arguments));
    };
    Document.prototype[name] = function() {
      return wrapNodeList(original.apply(this.impl, arguments));
    };
  }

  [
    'getElementsByTagName',
    'getElementsByTagNameNS',
    'getElementsByClassName',
    'querySelectorAll'
  ].forEach(wrapNodeListMethod);

  wrapEventTargetMethods([
    window.HTMLDocument || window.Document,  // Gecko adds these to HTMLDocument
    window.HTMLBodyElement,
    window.HTMLHeadElement
  ]);

  function DOMImplementation(impl) {
    this.impl = impl;
  }

  function wrapImplMethod(constructor, name) {
    constructor.prototype[name] = function() {
      return wrap(this.impl[name].apply(this.impl, arguments));
    };
  }

  function forwardImplMethod(constructor, name) {
    constructor.prototype[name] = function() {
      return this.impl[name].apply(this.impl, arguments);
    };
  }

  wrapImplMethod(DOMImplementation, 'createDocumentType');
  wrapImplMethod(DOMImplementation, 'createDocument');
  wrapImplMethod(DOMImplementation, 'createHTMLDocument');
  forwardImplMethod(DOMImplementation, 'hasFeature');

  scope.wrappers.Document = Document;
  scope.wrappers.DOMImplementation = DOMImplementation;

})(this.ShadowDOMPolyfill);
