/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/**
 * This module produces pointerflick events from pointerup and pointerdown
 * Events fired:
 *  - flick: a pointer is placed down, moves rapidly, and is then
 *  removed.
 *    - Additional Properties:
 *      - xVelocity: signed velocity of the flick in the x direction
 *      - yVelocity: signed velocity of the flick in the y direction
 *      - velocity: unsigned total velocity of the flick
 *      - angle: angle of the flick in degress, where 0 is along the positive
 *        x axis
 *      - majorAxis: Axis with the greatest absolute velocity. Denoted with
 *        'x' or 'y'
 */

(function(scope) {
  var dispatcher = scope.dispatcher;
  var flick = {
    // TODO(dfreedman): value should be low enough for low speed flicks, but
    // high enough to remove accidental flicks
    MIN_VELOCITY: 0.5 /* px/ms */,
    MAX_QUEUE: 4,
    moveQueue: [],
    target: null,
    pointerId: null,
    events: [
      'pointerdown',
      'pointermove',
      'pointerup',
      'pointercancel'
    ],
    pointerdown: function(inEvent) {
      if (inEvent.isPrimary && !this.pointerId) {
        this.pointerId = inEvent.pointerId;
        this.target = inEvent.target;
        this.addMove(inEvent);
      }
    },
    pointermove: function(inEvent) {
      if (inEvent.pointerId === this.pointerId) {
        this.addMove(inEvent);
      }
    },
    pointerup: function(inEvent) {
      if (inEvent.pointerId === this.pointerId) {
        this.fireFlick(inEvent);
      }
      this.cleanup();
    },
    pointercancel: function(inEvent) {
      this.cleanup();
    },
    cleanup: function() {
      this.moveQueue = [];
      this.target = null;
      this.pointerId = null;
    },
    addMove: function(inEvent) {
      if (this.moveQueue.length >= this.MAX_QUEUE) {
        this.moveQueue.unshift();
      }
      this.moveQueue.push(inEvent);
    },
    fireFlick: function(inEvent) {
      var e = inEvent;
      var l = this.moveQueue.length;
      var dt, dx, dy, tx, ty, tv, x = 0, y = 0, v = 0;
      // flick based off the fastest segment of movement
      for (var i = 0, m; i < l && (m = this.moveQueue[i]); i++) {
        dt = e.timeStamp - m.timeStamp;
        dx = e.clientX - m.clientX, dy = e.clientY - m.clientY;
        tx = dx / dt, ty = dy / dt, tv = Math.sqrt(tx * tx + ty * ty);
        if (tv > v) {
          x = tx, y = ty, v = tv;
        }
      }
      var ma = Math.abs(x) > Math.abs(y) ? 'x' : 'y';
      var a = this.calcAngle(x, y);
      if (Math.abs(v) >= this.MIN_VELOCITY) {
        var ev = dispatcher.makeEvent('flick', {
          xVelocity: x,
          yVelocity: y,
          velocity: v,
          angle: a,
          majorAxis: ma,
          pointerType: inEvent.pointerType
        });
        dispatcher.asyncDispatchEvent(ev, this.target);
        // prevent a tap if a flick is detected
        inEvent.preventTap();
      }
    },
    calcAngle: function(inX, inY) {
      return (Math.atan2(inY, inX) * 180 / Math.PI);
    }
  };
  dispatcher.registerRecognizer(flick);
})(window.__PointerGestureShim__);
