/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Element', function() {

  test('querySelectorAll', function() {
    var div = document.createElement('div');
    div.innerHTML = '<a>0</a><a>1</a>';
    var a0 = div.firstChild;
    var a1 = div.lastChild;

    var as = div.querySelectorAll('a');
    assert.equal(as.length, 2);
    assert.equal(as[0], a0);
    assert.equal(as.item(0), a0);
    assert.equal(as[1], a1);
    assert.equal(as.item(1), a1);
  });

  test('getElementsByTagName', function() {
    var div = document.createElement('div');
    div.innerHTML = '<a>0</a><a>1</a>';
    var a0 = div.firstChild;
    var a1 = div.lastChild;

    var as = div.getElementsByTagName('a');
    assert.equal(as.length, 2);
    assert.equal(as[0], a0);
    assert.equal(as.item(0), a0);
    assert.equal(as[1], a1);
    assert.equal(as.item(1), a1);
  });
});
