/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/**
 * This event is fired when a pointer is held down for 200ms.
 *
 * @for Events
 * @event hold
 * @param {Number} holdTime Milliseconds pointer has been held down.
 * @param {String} pointerType Type of pointer that made the holding event.
 */
/**
 * This event is fired every 200ms while a pointer is held down.
 *
 * @for Events
 * @event holdpulse
 * @param {Number} holdTime Milliseconds pointer has been held down.
 * @param {String} pointerType Type of pointer that made the holding event.
 */
/**
 * This event is fired when a held pointer is released or moved.
 *
 * @for Events
 * @event released
 * @param {String} pointerType Type of pointer that made the holding event.
 */

(function(scope) {
  var dispatcher = scope.dispatcher;
  var hold = {
    // wait at least HOLD_DELAY ms between hold and pulse events
    HOLD_DELAY: 200,
    // pointer can move WIGGLE_THRESHOLD pixels before not counting as a hold
    WIGGLE_THRESHOLD: 16,
    events: [
      'pointerdown',
      'pointermove',
      'pointerup',
      'pointercancel'
    ],
    heldPointer: null,
    holdJob: null,
    pulse: function() {
      var hold = Date.now() - this.heldPointer.timeStamp;
      var type = this.held ? 'holdpulse' : 'hold';
      this.fireHold(type, hold);
      this.held = true;
    },
    cancel: function() {
      clearInterval(this.holdJob);
      if (this.held) {
        this.fireHold('release');
      }
      this.held = false;
      this.heldPointer = null;
      this.target = null;
      this.holdJob = null;
    },
    pointerdown: function(inEvent) {
      if (inEvent.isPrimary && !this.heldPointer) {
        this.heldPointer = inEvent;
        this.target = inEvent.target;
        this.holdJob = setInterval(this.pulse.bind(this), this.HOLD_DELAY);
      }
    },
    pointerup: function(inEvent) {
      if (this.heldPointer && this.heldPointer.pointerId === inEvent.pointerId) {
        this.cancel();
      }
    },
    pointercancel: function(inEvent) {
      this.cancel();
    },
    pointermove: function(inEvent) {
      if (this.heldPointer && this.heldPointer.pointerId === inEvent.pointerId) {
        var x = inEvent.clientX - this.heldPointer.clientX;
        var y = inEvent.clientY - this.heldPointer.clientY;
        if ((x * x + y * y) > this.WIGGLE_THRESHOLD) {
          this.cancel();
        }
      }
    },
    fireHold: function(inType, inHoldTime) {
      var p = {
        pointerType: this.heldPointer.pointerType
      };
      if (inHoldTime) {
        p.holdTime = inHoldTime;
      }
      var e = dispatcher.makeEvent(inType, p);
      dispatcher.dispatchEvent(e, this.target);
      if (e.tapPrevented) {
        dispatcher.preventTap(this.heldPointer.pointerId);
      }
    }
  };
  dispatcher.registerRecognizer('hold', hold);
})(window.PointerGestures);
