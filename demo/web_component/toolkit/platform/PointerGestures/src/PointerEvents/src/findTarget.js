/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {
  var target = {
    shadow: function(inEl) {
      if (inEl) {
        var s = inEl.webkitShadowRoot || inEl.shadowRoot;
        if (s && s.elementFromPoint) {
          return s;
        }
      }
    },
    searchRoot: function(inRoot, x, y) {
      if (inRoot) {
        var t = inRoot.elementFromPoint(x, y);
        var st, sr, os;
        // is element a shadow host?
        sr = this.shadow(t);
        while (sr) {
          // find the the element inside the shadow root
          st = sr.elementFromPoint(x, y);
          if (!st) {
            // check for older shadows
            os = sr.querySelector('shadow');
            // check the older shadow if available
            sr = os && os.olderShadowRoot;
          } else {
            // shadowed element may contain a shadow root
            var ssr = this.shadow(st);
            return this.searchRoot(ssr, x, y) || st;
          }
        }
        // light dom element is the target
        return t;
      }
    },
    findTarget: function(inEvent) {
      var x = inEvent.clientX, y = inEvent.clientY;
      return this.searchRoot(document, x, y);
    }
  };
  scope.targetFinding = target;
  scope.findTarget = target.findTarget.bind(target);
})(window.__PointerEventShim__);
