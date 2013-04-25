/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {
  /**
   * This class contains the gesture recognizers that create the PointerGesture
   * events.
   *
   * @class PointerGestures
   * @static
   */
  scope = scope || {};
  scope.utils = {
    LCA: {
      // Determines the lowest node in the ancestor chain of a and b
      find: function(a, b) {
        if (a === b) {
          return a;
        }
        // fast case, a is a direct descendant of b or vice versa
        if (a.compareDocumentPosition) {
          var posmap = a.compareDocumentPosition(b);
          // b contains a
          if (posmap & Node.DOCUMENT_POSITION_CONTAINS) {
            return b;
          }
          // b is contained by a
          if (posmap & Node.DOCUMENT_POSITION_CONTAINED_BY) {
            return a;
          }
        }
        var adepth = this.depth(a);
        var bdepth = this.depth(b);
        var d = adepth - bdepth;
        if (d > 0) {
          a = this.walk(a, d);
        } else {
          b = this.walk(b, -d);
        }
        while(a && b && a !== b) {
          a = this.walk(a, 1);
          b = this.walk(b, 1);
        }
        return a;
      },
      walk: function(n, u) {
        for (var i = 0; i < u; i++) {
          n = n.parentNode;
        }
        return n;
      },
      depth: function(n) {
        var d = 0;
        while(n) {
          d++;
          n = n.parentNode;
        }
        return d;
      }
    }
  };
  scope.findLCA = function(a, b) {
    return scope.utils.LCA.find(a, b);
  }
  window.PointerGestures = scope;
})(window.PointerGestures);
