/*!
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/**
 * This is the constructor for new PointerEvents.
 *
 * New Pointer Events must be given a type, and an optional dictionary of
 * initialization properties.
 *
 * Due to certain platform requirements, events returned from the constructor
 * identify as MouseEvents.
 *
 * @constructor
 * @param {string} inType The type of the event to create.
 * @param {Object?} inDict An optional dictionary of initial event properties.
 * @return {Event} A new PointerEvent of type `inType` and with properties from `inDict`.
 */
function PointerEvent(inType, inDict) {
  // We dance a merry jig, and insert a new MouseEvent into the prototype chain.
  //
  // This keeps the PointerEvent prototype around, and lets the event maintain
  // the necessary MouseEvent instance wrapper, and prototype.
  //
  // Step 1, this a PointerEvent instance
  // {this}->{PointerEvent}->{MouseEvent}->{UIEvent}..
  //
  // Step 2, we make a MouseEvent instance e
  // {e}->{MouseEvent}->{UIEvent}...
  //
  // Step 3, chain the MouseEvent instance to the PointerEvent prototype;
  //
  // {e}->{PointerEvent}->{MouseEvent}->{UIEvent}...
  var e = document.createEvent('MouseEvent');
  if (Object.__proto__) {
    e.__proto__ = PointerEvent.prototype;
    e.initPointerEvent(inType, inDict);
  } else {
    PointerEvent.prototype.initPointerEvent.call(e, inType, inDict);
  }
  return e;
};

// chain to the MouseEvent prototype
PointerEvent.prototype.__proto__ = MouseEvent.prototype;

/**
 * Initialize a PointerEvent
 * @param {string} inType The type of the event to create.
 * @param {Object?} inDict An optional dictionary of initial event properties.
 */
PointerEvent.prototype.initPointerEvent = function(inType, inDict) {
  // defaults for all the necessary properties
  var props = {
    bubbles: false,
    cancelable: false,
    view: null,
    detail: null,
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    button: -1,
    buttons: null,
    which: 0,
    relatedTarget: null,
    pointerId: -1,
    width: 0,
    height: 0,
    pressure: 0,
    tiltX: 0,
    tiltY: 0,
    pointerType: 'unavailable',
    hwTimestamp: 0,
    isPrimary: false
  };

  // import values from the given dictionary
  for (var p in inDict) {
    if (p in props) {
      props[p] = inDict[p];
    }
  }

  // According to the w3c spec,
  // http://www.w3.org/TR/DOM-Level-3-Events/#events-MouseEvent-button
  // MouseEvent.button == 0 can mean either no mouse button depressed, or the
  // left mouse button depressed.
  //
  // As of now, the only way to distinguish between the two states of
  // MouseEvent.button is by using the deprecated MouseEvent.which property, as
  // this maps mouse buttons to positive integers > 0, and uses 0 to mean that
  // no mouse button is held.
  //
  // MouseEvent.which is derived from MouseEvent.button at MouseEvent creation,
  // but initMouseEvent does not expose an argument with which to set
  // MouseEvent.which. Calling initMouseEvent with a buttonArg of 0 will set
  // MouseEvent.button == 0 and MouseEvent.which == 1, breaking the expectations
  // of app developers.
  //
  // The only way to propagate the correct state of MouseEvent.which and
  // MouseEvent.button to a new MouseEvent.button == 0 and MouseEvent.which == 0
  // is to call initMouseEvent with a buttonArg value of -1.
  //
  // For user agents implementing DOM Level 3 events, Event.buttons has to be
  // used instead, which is a bitmap of depressed buttons.
  var b;
  if (props.buttons !== null) {
    b = props.buttons ? props.button : -1;
  } else {
    b = props.which ? props.button : -1;
  }

  var pressure = props.pressure || (b ? 0.5 : 0);

  // define the properties of the PointerEvent interface
  Object.defineProperties(this, {
    pointerId: { value: props.pointerId, enumerable: true },
    width: { value: props.width, enumerable: true },
    height: { value: props.height, enumerable: true },
    pressure: { value: pressure, enumerable: true },
    tiltX: { value: props.tiltX, enumerable: true },
    tiltY: { value: props.tiltY, enumerable: true },
    pointerType: { value: props.pointerType, enumerable: true },
    hwTimestamp: { value: props.hwTimestamp, enumerable: true },
    isPrimary: { value: props.isPrimary, enumerable: true },
  });

  // define the properties inherited from MouseEvent
  this.initMouseEvent(inType, props.bubbles, props.cancelable, props.view,
                      props.detail, props.screenX, props.screenY, props.clientX,
                      props.clientY, props.ctrlKey, props.altKey,
                      props.shiftKey, props.metaKey, b, props.relatedTarget);
};
