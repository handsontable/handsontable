/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/**
 * This module produces tracking events from pointerup and pointerdown
 * Events fired:
 *  - tackstart: primary pointer is added
 *  - track: primary pointer is moving
 *  - trackend: primary pointer is removed
 *    - Additional Properties:
 *      - dx: movement in the x direction since tktrackstart
 *      - dy: movement in the y direction since tktrackstart
 *      - ddx: movement in the x direction since the last tktrack
 *      - ddy: movement in the y direction since the last tktrack
 *      - xDirection: The last x axis movement direction of the pointer
 *      - yDirection: The last y axis movement direction of the pointer
 *      - trackInfo: A shared object between all tracking events
 *      - pointerType: The type of pointer that created this gesture
 */

(function(scope) {
  var dispatcher = scope.dispatcher;
  var pointermap = new PointerMap;
  var track = {
    events: [
      'pointerdown',
      'pointermove',
      'pointerup',
      'pointercancel'
    ],
    WIGGLE_THRESHOLD: 4,
    clampDir: function(inDelta) {
      return inDelta > 0 ? 1 : -1;
    },
    calcPositionDelta: function(inA, inB) {
      var x = 0, y = 0;
      if (inA && inB) {
        x = inB.clientX - inA.clientX;
        y = inB.clientY - inA.clientY;
      }
      return {x: x, y: y};
    },
    fireTrack: function(inType, inEvent, inTrackingData) {
      var t = inTrackingData;
      var d = this.calcPositionDelta(t.downEvent, inEvent);
      var dd = this.calcPositionDelta(t.lastMoveEvent, inEvent);
      if (dd.x) {
        t.xDirection = this.clampDir(dd.x);
      }
      if (dd.y) {
        t.yDirection = this.clampDir(dd.y);
      }
      var e = dispatcher.makeEvent(inType, {
        dx: d.x,
        dy: d.y,
        ddx: dd.x,
        ddy: dd.y,
        xDirection: t.xDirection,
        yDirection: t.yDirection,
        trackInfo: t.trackInfo,
        pointerType: inEvent.pointerType
      });
      t.lastMoveEvent = inEvent;
      dispatcher.dispatchEvent(e, t.downTarget);
    },
    pointerdown: function(inEvent) {
      if (inEvent.isPrimary) {
        var p = {
          downEvent: inEvent,
          downTarget: inEvent.target,
          trackInfo: {},
          lastMoveEvent: null,
          xDirection: 0,
          yDirection: 0,
          tracking: false
        };
        pointermap.set(inEvent.pointerId, p);
      }
    },
    pointermove: function(inEvent) {
      var p = pointermap.get(inEvent.pointerId);
      if (p) {
        if (!p.tracking) {
          var d = this.calcPositionDelta(p.downEvent, inEvent);
          var move = d.x * d.x + d.y * d.y;
          // start tracking only if finger moves more than WIGGLE_THRESHOLD
          if (move > this.WIGGLE_THRESHOLD) {
            p.tracking = true;
            this.fireTrack('trackstart', p.downEvent, p);
            this.fireTrack('track', inEvent, p);
          }
        } else {
          this.fireTrack('track', inEvent, p);
        }
      }
    },
    pointerup: function(inEvent) {
      var p = pointermap.get(inEvent.pointerId);
      if (p) {
        if (p.tracking) {
          this.fireTrack('trackend', inEvent, p);
        }
        pointermap.delete(inEvent.pointerId);
      }
    },
    pointercancel: function(inEvent) {
      this.pointerup(inEvent);
    }
  };
  dispatcher.registerRecognizer(track);
})(window.__PointerGestureShim__);
