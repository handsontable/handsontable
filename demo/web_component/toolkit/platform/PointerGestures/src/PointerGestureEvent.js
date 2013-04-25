/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/**
 * PointerGestureEvent is the constructor for all PointerGesture events.
 *
 * @class PointerGestureEvent
 * @extends UIEvent
 * @constructor
 * @param {String} inType Event type
 * @param {Object} [inDict] Dictionary of properties to initialize on the event
 */

function PointerGestureEvent(inType, inDict) {
  var dict = inDict || {};
  var e = document.createEvent('Event');
  var props = {
    bubbles: true,
    cancelable: true,
  };
  Object.keys(props).forEach(function(k) {
    if (k in dict) {
      props[k] = dict[k];
    }
  });

  e.initEvent(inType, props.bubbles, props.cancelable);

  Object.keys(dict).forEach(function(k) {
    e[k] = inDict[k];
  });

  e.preventTap = this.preventTap;

  return e;
}

/**
 * Allows for any gesture to prevent the tap gesture.
 *
 * @method preventTap
 */
PointerGestureEvent.prototype.preventTap = function() {
  this.tapPrevented = true;
};

