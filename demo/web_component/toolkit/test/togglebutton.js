/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('g-togglebutton', function() {
  var togglebutton;
  
  setup(function() {
    togglebutton = document.createElement('g-togglebutton');
    work.appendChild(togglebutton);
  });
  
  teardown(function() {
    work.textContent = '';
  });
  
  test('initial value', function() {
    expect(togglebutton.value).to.not.be.ok();
  });
  
  test('toggle', function() {
    var t = shadowQuery(togglebutton, '.toggle');
    togglebutton.toggle();
    dirtyCheck();
    expect(t.classList.contains('on')).to.be(true);
    togglebutton.toggle();
    dirtyCheck();
    expect(t.classList.contains('on')).to.be(false);
  });
  
  suite('attributes', function() {
    test('value', function() {
      var t = shadowQuery(togglebutton, '.toggle');
      togglebutton.value = true;
      dirtyCheck();
      expect(t.classList.contains('on')).to.be(true);
      togglebutton.value = false;
      dirtyCheck();
      expect(t.classList.contains('on')).to.be(false);
    });
  });
});
