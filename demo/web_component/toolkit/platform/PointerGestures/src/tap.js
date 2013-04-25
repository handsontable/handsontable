/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/**
 * This event is fired when a pointer quickly goes down and up, and is used to
 * denote activation.
 *
 * Any gesture event can prevent the tap event from being created by calling
 * `event.preventTap`.
 *
 * Any pointer event can prevent the tap by setting the `tapPrevented` property
 * on itself.
 *
 * @for Events
 * @event tap
 * @param {Number} x X axis position of the tap.
 * @param {Number} y Y axis position of the tap.
 * @param {String} pointerType Type of the pointer that made the tap.
 */
(function(scope) {
  var dispatcher = scope.dispatcher;
  var pointermap = new scope.PointerMap;
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
            x: inEvent.clientX,
            y: inEvent.clientY,
            pointerType: inEvent.pointerType
          });
          dispatcher.dispatchEvent(e, t);
        }
      }
      pointermap.delete(inEvent.pointerId);
    },
    pointercancel: function(inEvent) {
      pointermap.delete(inEvent.pointerId);
    },
    preventTap: function(inPointerId) {
      pointermap.delete(inPointerId);
    },
  };
  dispatcher.registerRecognizer('tap', tap);
})(window.PointerGestures);
