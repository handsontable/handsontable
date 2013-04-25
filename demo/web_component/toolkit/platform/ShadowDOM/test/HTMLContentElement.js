/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('HTMLContentElement', function() {

  test('select', function() {
    var el = document.createElement('content');
    assert.equal(el.select, null);

    el.select = '.xxx';
    assert.equal(el.select, '.xxx');
    assert.isTrue(el.hasAttribute('select'));
    assert.equal(el.getAttribute('select'), '.xxx');

    el.select = '.xxx';
    assert.equal(el.select, '.xxx');
    assert.isTrue(el.hasAttribute('select'));
    assert.equal(el.getAttribute('select'), '.xxx');
  });

  test('getDistributedNodes', function() {
    var host = document.createElement('div');
    host.innerHTML = '<a>a</a><b>b</b>';
    var a = host.firstChild;
    var b = host.lastChild;

    var sr = host.createShadowRoot();
    sr.innerHTML = '<content></content>';
    var content = sr.firstChild;

    assertArrayEqual(content.getDistributedNodes(), [a, b]);

    content.select = 'a';
    assertArrayEqual(content.getDistributedNodes(), [a]);

    content.select = 'b';
    assertArrayEqual(content.getDistributedNodes(), [b]);
  });

});