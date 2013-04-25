/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

// install sample DOM for event dispatching
container = document.createElement('div');
container.innerHTML = '<div id="host" touch-action="none"><div id="inner"></div></div>';
host = container.firstChild;
inner = host.firstChild;
document.body.appendChild(container);

chai.Assertion.includeStack = true;
expect = chai.expect;

function correctTarget(expected, actual) {
  if (expected !== actual) {
    console.log(expected, actual);
    throw new Error('target is incorrect');
  }
}

function fire(shortType, target, callback) {
  if (target) {
    if (callback) {
      prep('pointer' + shortType, target, callback);
    }
    var e, type;
    if (navigator.msPointerEnabled) {
      var cap = shortType.slice(0, 1).toUpperCase() + shortType.slice(1);
      type = 'MSPointer' + cap;
      e = document.createEvent('MSPointerEvent');
      e.initPointerEvent(
        type, true, true, null, null, 0, 0, 0, 0, false, false, false, false, 0,
        null, 0, 0, 0, 0, 0, 0, 0, 0, 1, e.MSPOINTER_TYPE_MOUSE, 0, true
      );
    } else {
      type = 'mouse' + shortType;
      var e = document.createEvent('MouseEvent');
      e.initMouseEvent(
        type, true, true, null, null, 0, 0, 0, 0, false, false,
        false, false, 0, null
      );
    }
    target.dispatchEvent(e);
  }
}

function eventSetup(shortType, target, callback) {
  if (Array.isArray(shortType)) {
    for (var i = 0; i < shortType.length; i++) {
      eventSetup(shortType[i], target, callback);
    }
    return;
  }
  var type = 'pointer' + shortType;
  target.addEventListener(type, callback);
}

function eventRemove(shortType, target, callback) {
  if (Array.isArray(shortType)) {
    for (var i = 0; i < shortType.length; i++) {
      eventRemove(shortType[i], target, callback);
    }
    return;
  }
  var type = 'pointer' + shortType;
  target.removeEventListener(type, callback);
}

function prep(event, target, callback) {

  var fn = function() {
    callback();
    target.removeEventListener(event, fn);
  };
  target.addEventListener(event, fn);
}

mocha.setup('tdd');
