/*
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
 * @param {String} inType The type of the event to create.
 * @param {Object} [inDict] An optional dictionary of initial event properties.
 * @return {Event} A new PointerEvent of type `inType` and initialized with properties from `inDict`.
 */
(function(scope) {
  // test for DOM Level 4 Events
  var NEW_MOUSEEVENT = false;
  try {
    new MouseEvent('click');
    NEW_MOUSEEVENT = true;
  } catch(e) {
  }

  function PointerEvent(inType, inDict) {
    var inDict = inDict || {};
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
    // This is fixed with DOM Level 4's use of buttons
    var b = inDict.which ? inDict.button : -1;

    var e;
    if (NEW_MOUSEEVENT) {
      e = new MouseEvent(inType, inDict);
    } else {
      e = document.createEvent('MouseEvent');
      // import values from the given dictionary
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
        button: 0,
        buttons: undefined,
        relatedTarget: null
      };

      Object.keys(props).forEach(function(k) {
        if (k in inDict) {
          props[k] = inDict[k];
        }
      });

      // define the properties inherited from MouseEvent
      e.initMouseEvent(
        inType, props.bubbles, props.cancelable, props.view, props.detail,
        props.screenX, props.screenY, props.clientX, props.clientY, props.ctrlKey,
        props.altKey, props.shiftKey, props.metaKey, b, props.relatedTarget
      );
    }

    // Spec requires that pointers without pressure specified use 0.5 for down
    // state and 0 for up state.
    var pressure = 0;
    if (inDict.pressure) {
      pressure = inDict.pressure;
    } else if (inDict.buttons !== undefined) {
      pressure = inDict.buttons ? 0.5 : 0;
    } else {
      pressure = b > -1 ? 0.5 : 0;
    }

    // define the properties of the PointerEvent interface
    Object.defineProperties(e, {
      pointerId: { value: inDict.pointerId || 0, enumerable: true },
      width: { value: inDict.width || 0, enumerable: true },
      height: { value: inDict.height || 0, enumerable: true },
      pressure: { value: pressure, enumerable: true },
      tiltX: { value: inDict.tiltX || 0, enumerable: true },
      tiltY: { value: inDict.tiltY || 0, enumerable: true },
      pointerType: { value: inDict.pointerType || '', enumerable: true },
      hwTimestamp: { value: inDict.hwTimestamp || 0, enumerable: true },
      isPrimary: { value: inDict.isPrimary || false, enumerable: true }
    });
    return e;
  }

  // attach to window
  scope.PointerEvent = PointerEvent;
})(window);
