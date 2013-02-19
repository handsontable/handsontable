/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

// NOTE: uses 'window' and 'document' globals

scope = scope || {};
scope.flags = scope.flags || {};

var log = scope.flags.logparser;

// imports

var loader = scope.ComponentDocuments.loader.componentLoader;

// TODO(sjmiles): move CSS path fixup implementation here

var parser = {
  //  parse a document
  //    evaluate external scripts
  //    parse linked component documents (recursively)
  //    parse document elements
  // parsing must be done in-order, so inOnElement callback
  // is made available for synchronous element construction
  // all resources must already be in the loader cache
  // script resources are loaded via XHR so SOP applies    
  parse: function(inDocument, inOnElement) {
    parser.onElement = inOnElement;
    parser.parseDocument(inDocument);
  },
  // dedup cache
  parsed: {},
  parseDocument: function(inDocument) {
    var id = inDocument.name || inDocument.URL;
    if (this.parsed[id]) {
      log && console.warn("ignoring duplicate document: ", id)
    } else {
      log && console.group(id);
      this.parsed[id] = true;
      this.parseExternalScripts(inDocument);
      // TODO(sjmiles): it's improper to simply parse linked documents
      // ahead of parsing elements; one may depend on the other
      // and the order in the document should have importance
      this.parseLinkedDocuments(inDocument);
      this.parseElements(inDocument);
      log && console.groupEnd();
    }
  },
  parseLinkedDocuments: function(inDocument) {
    this.parseDocuments(this.fetchDocuments($$(inDocument,
      'link[rel=components]')));
  },
  fetchDocuments: function(inLinks) {
    var docs = [];
    forEach(inLinks, function(link) {
      docs.push(loader.fetch(link));
    }, this);
    return docs;
  },
  parseDocuments: function(inDocs) {
    forEach(inDocs, this.parseDocument, this);
  },
  parseExternalScripts: function(inDocument) {
    if (inDocument != document) {
      $$(inDocument, 'script[src]').forEach(this.injectScriptElement, this);
    }
  },
  injectScriptElement: function(inScriptElement) {
    this.injectScript(loader.fetch(inScriptElement));
  },
  injectScript: function(inScript) {
    if (scope.flags.eval) {
      eval(inScript);
    } else {
      var ss = document.createElement("script");
      ss.textContent = inScript;
      document.body.previousElementSibling.appendChild(ss);
    }
  },
  parseElements: function(inDocument) {
    if (this.onElement) {
      $$(inDocument, 'element').forEach(function(element) {
        this.onElement(element, inDocument);
      }, this);
      }
  },
  parseElement: function(inElement) {
    this.onElement(inElement, inDocument);
  }
};

// exports

scope.ComponentDocuments.parser = parser;

})(window.__exported_components_polyfill_scope__);