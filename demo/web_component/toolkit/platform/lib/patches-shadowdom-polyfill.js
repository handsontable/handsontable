/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function() {

  // convenient global
  window.wrap = function(n) {
    return n.impl ? n : ShadowDOMPolyfill.wrap(n);
  }
  window.unwrap = function(n){
    return n.impl ? ShadowDOMPolyfill.unwrap(n) : n;
  }

  // users may want to customize other types
  // TODO(sjmiles): 'button' is now supported by ShadowDOMPolyfill, but
  // I've left this code here in case we need to temporarily patch another
  // type
  /*
  (function() {
    var elts = {HTMLButtonElement: 'button'};
    for (var c in elts) {
      window[c] = function() { throw 'Patched Constructor'; };
      window[c].prototype = Object.getPrototypeOf(
          document.createElement(elts[c]));
    }
  })();
  */

  // patch in custom querySelector
  var queryPropDefs = {
    querySelector: {
      value: function(inSlctr) {
        return localQuery(this, inSlctr);
      }
    },
    querySelectorAll: {
      value: function(inSlctr) {
        return localQueryAll(this, inSlctr);
      }
    }
  };
  // install custom querySelector(All) on wrappers.Element
  Object.defineProperties(HTMLElement.prototype, queryPropDefs);

  // install custom querySelector(All) on wrappers.Document
  Object.defineProperties(ShadowDOMPolyfill.wrappers.Document.prototype,
    queryPropDefs);

  // install custom querySelector(All) on wrappers.ShadowRoot
  Object.defineProperties(ShadowDOMPolyfill.wrappers.ShadowRoot.prototype,
      queryPropDefs);

  // patch in prefixed name
  Object.defineProperties(HTMLElement.prototype, {
    //TODO(sjmiles): review accessor alias with Arv
    webkitShadowRoot: {
      get: function() {
        return this.shadowRoot;
      }
    }
  });

  //TODO(sjmiles): review method alias with Arv
  HTMLElement.prototype.webkitCreateShadowRoot =
      HTMLElement.prototype.createShadowRoot;
})();
