/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Constructor', function() {
  test('new PointerEvent makes a PointerEvent', function() {
    var p = new PointerEvent;
    expect(p).to.be.a(PointerEvent);
  });

  test('PointerEvent extends MouseEvent', function() {
    var p = new PointerEvent;
    expect(p).to.be.a(MouseEvent);
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
    expect(p).to.have.keys(props);
  });

  test('PointerEvent can be initialized from an object', function() {
    var p = new PointerEvent('foo', {pointerType: 'pen', button: 0});
    expect(p.pointerType).to.be('pen');
    expect(p.button).to.be(0);
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
      expect(p[k]).to.be(v);
    });
  });
});
