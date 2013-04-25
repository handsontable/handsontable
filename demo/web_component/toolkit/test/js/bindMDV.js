/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('bindMDV', function() {
  var assert = chai.assert;
  
  test('bindModel bindModel', function() {
    var test = document.createElement('div');
    test.innerHTML = '<div id="a" foo="{{bar}}"></div>';
    var a = test.firstChild;
    Toolkit.bindModel.call(test, test);
    test.bar = 5;
    dirtyCheck();
    assert.equal(a.getAttribute('foo'), 5);
    //
    test.bar = 8;
    dirtyCheck();
    assert.equal(a.getAttribute('foo'), 8);
  });
    
  test('bindModel bind input', function() {
    var test = document.createElement('div');
    test.innerHTML = '<input value="{{bar}}" />';
    var a = test.firstChild;
    Toolkit.bindModel.call(test, test);
    test.bar = 'hello';
    dirtyCheck();
    assert.equal(a.value, 'hello');
  });
});