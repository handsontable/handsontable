/*!
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {
  var dispatcher = scope.dispatcher;
  var n = window.navigator;
  var s, r;
  var isDown = function(inId) {
    if (!dispatcher.pointermap.has(inId)) {
      throw new Error('InvalidPointerId');
    }
    return true;
  };
  if (n.msPointerEnabled) {
    s = Element.prototype.msSetPointerCapture;
    r = Element.prototype.msReleasePointerCapture;
  } else {
    s = function setPointerCapture(inPointerId) {
      if (isDown(inPointerId)) {
        dispatcher.setCapture(inPointerId, this);
      }
    };
    r = function releasePointerCapture(inPointerId) {
      if (isDown(inPointerId)) {
        dispatcher.releaseCapture(inPointerId, this);
      }
    };
  }
  if (!Element.prototype.setPointerCapture) {
    Object.defineProperties(Element.prototype, {
      'setPointerCapture': {
        value: s,
      },
      'releasePointerCapture': {
        value: r,
      }
    });
  }
})(window.__PointerEventShim__);
