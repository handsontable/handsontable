/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Pointer Capture', function() {
  var falseneg = function() {
    throw new Error('did not check pointerId validity correctly');
  };

  var falsepos = function() {
    throw new Error('threw InvalidPointerId incorrectly');
  };

  var prepare = function(name, callback, el) {
    if (!el) {
      el = host;
    }
    if (!callback) {
      throw new Error('callback not given');
    }
    var f = function(){
      host.removeEventListener(name, f);
      callback.args = Array.prototype.slice.call(arguments);
      callback();
    };
    host.addEventListener(name, f);
  };

  test('Element has setPointerCapture and releasePointerCapture', function() {
    expect(host).to.have.property('setPointerCapture');
    expect(host).to.have.property('releasePointerCapture');
  });

  test('{set,release}PointerCapture throw exceptions when the pointerId is not on screen', function() {
    try {
      host.setPointerCapture(1);
      falseneg();
    } catch(e) {}

    try {
      host.releasePointerCapture(1);
      falseneg();
    } catch(e) {}
  });

  suite('pointercapture events', function() {
    test('Element.setPointerCapture fires a gotpointercapture event', function(done) {
      prepare('gotpointercapture', done);
      em.fire('down');
      host.setPointerCapture(1);
      em.fire('up');
    });

    test('Element.releasePointerCapture fires a lostpointercapture event', function(done) {
      prepare('lostpointercapture', done);
      em.fire('down');
      host.setPointerCapture(1);
      host.releasePointerCapture(1);
      em.fire('up');
    });

    test('pointerup fires a lostpointercapture event for the element capturing that pointerId', function(done) {
      prepare('lostpointercapture', done);
      em.fire('down');
      host.setPointerCapture(1);
      em.fire('up');
    });

    test('setPointerCapture will release an already captured pointer, firing events', function(done) {
      var issued = 0;
      var wait = function() {
        issued++;
        return function(e) {
          issued--;
          if (e) {
            throw e;
          }
          if (issued == 0) {
            done();
          }
        }
      };
      prepare('lostpointercapture', wait());
      prepare('gotpointercapture', wait(), inner);
      em.fire('down');
      host.setPointerCapture(1);
      inner.setPointerCapture(1);
      em.fire('up');
    });
  });
});
