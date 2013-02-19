/*!
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {
  scope = scope || {};
  // Function bind is required for dispatcher
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(inScope) {
      var args = scope.toArray(arguments, 1);
      var self = this;
      return function() {
        var newArgs = scope.toArray(arguments, 0);
        return self.apply(inScope, args.concat(newArgs));
      };
    };
  }
  // not bound because scope.toArray is used in scope.bind
  scope.toArray = function(inArgs, inStart) {
    return Array.prototype.slice.call(inArgs, inStart || 0);
  };
  window.__PointerEventShim__ = scope;
})(window.__PointerEventShim__);
