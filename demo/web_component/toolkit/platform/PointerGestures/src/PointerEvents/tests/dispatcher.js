/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Event Generation and Dispatching', function() {

  var pepde = PointerEventsPolyfill.dispatcher.eventSources;
  // down -> mousedown && pointerdown
  test('MouseEvents are a source when not in an MSPointerEvent environment', function() {
    if (!navigator.msPointerEnabled) {
      expect(pepde).to.have.property('mouse');
    }
  });

  test('TouchEvents are a source in touch environments', function() {
    if ('ontouchstart' in window) {
      expect(pepde).to.have.property('touch');
    }
  });

  test('MSPointerEvents are a source in MSPointerEvent environments', function() {
    if (window.navigator.msPointerEnabled) {
      expect(pepde).to.have.property('ms');
    }
  });

  test('MouseEvent makes a PointerEvent', function() {
    var cb = function(e){
      expect(e.type).to.equal('pointermove')
    };
    eventSetup('move', container, cb);
    fire('move', container);
    eventRemove('move', container, cb);
  });

  test('Mouse generated PointerEvents have pointerId 1', function() {
    var handler = function (e) {
      expect(e.pointerId).to.equal(1);
    };
    eventSetup('move', host, handler);
    fire('move', host);
    eventRemove('move', host, handler);
  });

  test('Event targets correctly with touch-action: none', function() {
    var handler = function(e) {
      correctTarget(e.target, inner);
      correctTarget(e.currentTarget, host);
    };
    eventSetup('move', host, handler);
    fire('move', inner);
    eventRemove('move', host, handler);
  });

  test('PointerEvents only fire on touch-action: none areas', function() {
    // move always fires
    var cb = chai.spy();
    eventSetup(['down', 'up', 'over', 'out'], container, cb);
    fire('down', container);
    fire('up', container);
    fire('over', container);
    fire('out', container);
    eventRemove(['down', 'up', 'over', 'out'], container, cb);
    expect(cb).not.to.be.called();
  });

  test('PointerEvents will fire anywhere after a down in a touch-action: none area', function() {
    fire('down', host);
    var cb = chai.spy();
    eventSetup('over', container, cb);
    // should be called here
    fire('over', container);
    expect(cb).to.have.been.called();
    fire('up', host);
    // shouldn't be called here
    fire('over', container);
    eventRemove('over', container, cb);
    expect(cb).to.have.been.called.exactly(1);
  });
});
