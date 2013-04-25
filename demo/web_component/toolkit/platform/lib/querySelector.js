/*
Copyright 2013 The Toolkitchen Authors. All rights reserved.
Use of this source code is governed by a BSD-style
license that can be found in the LICENSE file.
*/

(function(scope) {
  // spec
  var matches = Element.prototype.matches;
  // impls
  if (!matches) {
    var impls = ['webkit', 'moz', 'ms', 'o'];
    for (var i = 0, p, ms; (p = impls[i]); i++) {
      ms = Element.prototype[p + 'MatchesSelector'];
      if (ms) {
        matches = ms;
        break;
      }
    }
  }
  matches = matches.call.bind(matches);

  // utility
  //
  function isInsertionPoint(inNode) {
    var tn = inNode.tagName;
    return (tn === 'SHADOW' || tn === 'CONTENT');
  };

  function search(inNode, inSelector, inResults, inSingle) {
    var r = inResults, c = inNode.children;
    if (c && inSelector) {
      for (var i = 0, n; (n = c[i]) && !(inSingle && r.length); i++) {
        if (matches(n, inSelector)) {
          r.push(n);
        }
        if (!isInsertionPoint(n)) {
          search(n, inSelector, r, inSingle);
        }
      }
    }
    return r;
  }

  // localQuery and localQueryAll will only match Simple Selectors\
  // Structural Pseudo Classes are not guarenteed to be correct
  // http://www.w3.org/TR/css3-selectors/#simple-selectors
  scope.localQueryAll = function(inNode, inSlctr) {
    return search(inNode, inSlctr, [], false);
  };

  scope.localQuery = function(inNode, inSlctr) {
    return search(inNode, inSlctr, [], true)[0];
  };

})(window);
