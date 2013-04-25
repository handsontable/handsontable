/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Constructor', function() {
  test('PointerEvent extends MouseEvent', function() {
    var p = new PointerEvent;
    expect(p).to.be.an.instanceof(MouseEvent);
  });

  test('PointerEvents have the required properties', function() {
    var props = [
      'bubbles',
      'cancelable',
      'view',
      'detail',
      'screenX',
      'screenY',
      'clientX',
      'clientY',
      'ctrlKey',
      'altKey',
      'shiftKey',
      'metaKey',
      'button',
      'which',
      'relatedTarget',
      'pointerId',
      'width',
      'height',
      'pressure',
      'tiltX',
      'tiltY',
      'pointerType',
      'hwTimestamp',
      'isPrimary'
    ];
    var p = new PointerEvent();
    props.forEach(function(k) {
      expect(p).to.have.property(k);
    });
  });

  test('PointerEvent can be initialized from an object', function() {
    var p = new PointerEvent('foo', {pointerType: 'pen', button: 0, which: 1});
    expect(p.pointerType).to.equal('pen');
    expect(p.button).to.equal(0);
    p = new PointerEvent('bar', {button: 2, which: 3});
    expect(p.button).to.equal(2);
  });

  test('Readonly properties must be readonly', function() {
    var props = [
      'pointerId',
      'width',
      'height',
      'pressure',
      'tiltX',
      'tiltY',
      'pointerType',
      'hwTimestamp',
      'isPrimary'
    ];
    var p = new PointerEvent;
    var v;
    props.forEach(function(k) {
      v = p[k];
      p[k] = NaN;
      expect(p[k]).to.equal(v);
    });
  });
});
