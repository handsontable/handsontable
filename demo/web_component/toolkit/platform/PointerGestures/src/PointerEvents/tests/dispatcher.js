/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Event Generation and Dispatching', function() {

  // down -> mousedown && pointerdown
  test('MouseEvents are a source', function() {
    expect(__PointerEventShim__.dispatcher.eventSources).to.have.property('mouse');
  });

  test('TouchEvents are a source in touch environments', function() {
    if ('ontouchstart' in window) {
      expect(__PointerEventShim__.dispatcher.eventSources).to.have.property('touch');
    }
  });

  test('MSPointerEvents are a source in MSPointerEvent environments', function() {
    if (window.navigator.msPointerEnabled) {
      expect(__PointerEventShim__.dispatcher.eventSources).to.have.property('ms');
    }
  });

  test('MouseEvent makes a PointerEvent', function() {
    em.fire('move', function(e){
      expect(e.type).to.be('pointermove');
    });
  });

  test('Mouse generated PointerEvents have pointerId 1', function() {
    em.fire('move', function(e) {
      expect(e.pointerId).to.be(1);
    });
  });

  test('Multiple downs from same pointerId should be ignored', function() {
    // called
    em.fire('down');
    // ignored
    em.fire('down', null, null, true);
    // reset
    em.fire('up');
  });

  test('Event targets correctly with touch-action: none', function() {
    var handler = function(e) {
      em.correctTarget(e.target, inner);
      em.correctTarget(e.currentTarget, host);
    };
    host.addEventListener('pointermove', handler);
    em.fire('move', null, inner);
    host.removeEventListener('pointermove', handler);
  });

  test('PointerEvents only fire on touch-action: none areas', function() {
    // move always fires
    em.fire('down', null, container, true);
    em.fire('up', null, container, true);
    em.fire('over', null, container, true);
    em.fire('out', null, container, true);
  });

  test('PointerEvents will fire anywhere after a down in a touch-action: none area', function() {
    em.fire('down');
    em.fire('over', null, container);
    em.fire('up');
    em.fire('over', null, container, true);
  });
});
