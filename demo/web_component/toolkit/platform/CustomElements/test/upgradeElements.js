/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('upgradeElements', function() {
  var work;
  var assert = chai.assert;

  setup(function() {
    work = document.createElement('div');
    document.body.appendChild(work);
  });

  teardown(function() {
    document.body.removeChild(work);
  });
  
  function registerTestComponent(inName, inValue) {
    var proto = Object.create(HTMLElement.prototype);
    proto.value = inValue || 'value';
    document.register(inName, {
      prototype: proto
    });
  }

  test('document.upgradeElement upgrades custom element syntax', function() {
    registerTestComponent('x-foo', 'foo');
    work.innerHTML = '<x-foo>Foo</x-foo>';
    var xfoo = work.firstChild;
    document.upgradeElement(xfoo);
    assert.equal(xfoo.value, 'foo');
  });
  
  test('document.upgradeElements upgrades custom element syntax', function() {
    registerTestComponent('x-zot', 'zot');
    registerTestComponent('x-zim', 'zim');
    work.innerHTML = '<x-zot><x-zim></x-zim></x-zot>';
    var xzot = work.firstChild, xzim = xzot.firstChild;
    document.upgradeElements(work);
    assert.equal(xzot.value, 'zot');
    assert.equal(xzim.value, 'zim');
  });
  
  test('document.upgradeElement upgrades native extendor', function() {
    var XButtonProto = Object.create(HTMLButtonElement.prototype);
    XButtonProto.test = 'xbutton';
    document.register('x-button', {
      extends: 'button',
      prototype: XButtonProto
    });
    
    work.innerHTML = '<button is="x-button"></button>';
    var xbutton = work.firstChild;
    document.upgradeElement(xbutton);
    assert.equal(xbutton.test, 'xbutton');
  });
  
  
  test('document.upgradeElement upgrades extendor of native extendor', function() {
    var XInputProto = Object.create(HTMLInputElement.prototype);
    XInputProto.xInput = 'xInput';
    var XInput = document.register('x-input', {
      extends: 'input',
      prototype: XInputProto
    });
    var XSpecialInputProto = Object.create(XInput.prototype);
    XSpecialInputProto.xSpecialInput = 'xSpecialInput';
    var XSpecialInput = document.register('x-special-input', {
      extends: 'x-input',
      prototype: XSpecialInputProto
    });
    work.innerHTML = '<input is="x-special-input">';
    var x = work.firstChild;
    document.upgradeElement(x);
    assert.equal(x.xInput, 'xInput');
    assert.equal(x.xSpecialInput, 'xSpecialInput');
  });
  
  
  test('document.upgradeElements upgrades native extendor', function() {
    var YButtonProto = Object.create(HTMLButtonElement.prototype);
    YButtonProto.test = 'ybutton';
    document.register('y-button', {
      extends: 'button',
      prototype: YButtonProto
    });
    
    work.innerHTML = '<button is="y-button">0</button>' +
      '<div><button is="y-button">1</button></div>' +
      '<div><div><button is="y-button">2</button></div></div>';
    document.upgradeElements(work);
    var b$ = work.querySelectorAll('[is=y-button]');
    Array.prototype.forEach.call(b$, function(b, i) {
      assert.equal(b.test, 'ybutton');
      assert.equal(b.textContent, i);
    });
    
    
  });
  
});
