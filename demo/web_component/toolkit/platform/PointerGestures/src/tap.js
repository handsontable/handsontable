/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {
  var dispatcher = scope.dispatcher;
  var pointermap = new PointerMap;
  var tap = {
    events: [
      'pointerdown',
      'pointermove',
      'pointerup',
      'pointercancel'
    ],
    pointerdown: function(inEvent) {
      if (inEvent.isPrimary && !inEvent.tapPrevented) {
        pointermap.set(inEvent.pointerId, {
          target: inEvent.target,
          x: inEvent.clientX,
          y: inEvent.clientY
        });
      }
    },
    pointermove: function(inEvent) {
      if (inEvent.isPrimary) {
        var start = pointermap.get(inEvent.pointerId);
        if (start) {
          if (inEvent.tapPrevented) {
            pointermap.delete(inEvent.pointerId);
          }
        }
      }
    },
    pointerup: function(inEvent) {
      var start = pointermap.get(inEvent.pointerId);
      if (start && !inEvent.tapPrevented) {
        var t = scope.findLCA(start.target, inEvent.target);
        if (t) {
          var e = dispatcher.makeEvent('tap', {
            clientX: inEvent.clientX,
            clientY: inEvent.clientY,
            pointerType: inEvent.pointerType
          });
          dispatcher.asyncDispatchEvent(e, t);
        }
      }
      pointermap.delete(inEvent.pointerId);
    },
    pointercancel: function(inEvent) {
      pointermap.delete(inEvent.pointerId);
    }
  };
  dispatcher.registerRecognizer(tap);

  // make tap preventable by pointer events
  PointerEvent.prototype.preventTap = function() {
    this.tapPrevented = true;
  };
})(window.__PointerGestureShim__);
