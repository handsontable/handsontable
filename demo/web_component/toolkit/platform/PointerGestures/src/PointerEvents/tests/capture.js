/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Pointer Capture', function() {
  var set = function() {
    host.setPointerCapture(1);
  };
  var release = function() {
    host.releasePointerCapture(1);
  };

  test('Element has setPointerCapture and releasePointerCapture', function() {
    expect(host).to.have.property('setPointerCapture');
    expect(host).to.have.property('releasePointerCapture');
  });

  test('{set,release}PointerCapture throw exceptions when the pointerId is not on screen', function() {
    expect(set).to.throw(/InvalidPointerId/);
    expect(release).to.throw(/InvalidPointerId/);
  });

  suite('pointercapture events', function() {
    test('Element.setPointerCapture fires a gotpointercapture event', function(done) {
      prep('gotpointercapture', host, done);
      fire('down', host);
      host.setPointerCapture(1);
      fire('up', host);
    });

    test('Element.releasePointerCapture fires a lostpointercapture event', function(done) {
      prep('lostpointercapture', host, done);
      fire('down', host);
      host.setPointerCapture(1);
      host.releasePointerCapture(1);
      fire('up', host);
    });

    test('pointerup fires a lostpointercapture event for the element capturing that pointerId', function(done) {
      prep('lostpointercapture', host, done);
      host.addEventListener('lostpointercapture', done);
      fire('down', host);
      host.setPointerCapture(1);
      fire('up', host);
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
      prep('gotpointercapture', inner, wait());
      prep('lostpointercapture', host, wait());
      fire('down', host);
      host.setPointerCapture(1);
      inner.setPointerCapture(1);
      fire('up', host);
    });
  });
});
