/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

function PointerGestureEvent(inType, inDict) {
  var e = document.createEvent('UIEvent');
  if (Object.__proto__) {
    e.__proto__ = PointerGestureEvent.prototype;
    e.initGestureEvent(inType, inDict);
  } else {
    PointerGestureEvent.prototype.initGestureEvent.call(e, inType, inDict);
  }
  return e;
}

PointerGestureEvent.prototype.__proto__ = UIEvent.prototype;

PointerGestureEvent.prototype.initGestureEvent = function(inType, inDict) {
  var props = {
    bubbles: true,
    cancelable: true,
    view: null,
    detail: null
  };

  for (var k in inDict) {
    props[k] = inDict[k];
  }

  this.initUIEvent(inType, props.bubbles, props.cancelable, props.view, props.detail);

  for (var k in props) {
    this[k] = props[k];
  }
}
