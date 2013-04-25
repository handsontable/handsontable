/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('ParentNodeInterface', function() {

  test('childElementCount', function() {
    var div = document.createElement('div');
    div.innerHTML = 'a<b></b>c';
    assert.equal(div.childElementCount, 1);
    div.appendChild(document.createElement('d'));
    assert.equal(div.childElementCount, 2);
    div.appendChild(document.createTextNode('e'));
    assert.equal(div.childElementCount, 2);

    var sr = div.createShadowRoot();
    sr.innerHTML = 'f<content></content>g';

    div.offsetHeight;  // trigger rendering

    assert.equal(sr.childElementCount, 1);
    assert.equal(div.childElementCount, 2);
  });

  test('children', function() {
    var div = document.createElement('div');
    div.innerHTML = 'a<b></b>c';
    var b = div.firstChild.nextSibling;

    assertArrayEqual(div.children, [b]);
    var d = div.appendChild(document.createElement('d'));
    assertArrayEqual(div.children, [b, d]);
    div.appendChild(document.createTextNode('e'));
    assertArrayEqual(div.children, [b, d]);

    var sr = div.createShadowRoot();
    sr.innerHTML = 'f<content></content>g';
    var content = sr.firstChild.nextSibling;

    div.offsetHeight;  // trigger rendering

    assertArrayEqual(sr.children, [content]);
    assertArrayEqual(div.children, [b, d]);
  });

  test('firstElementChild', function() {
    var div = document.createElement('div');
    div.innerHTML = 'a<b></b>c';
    var b = div.firstChild.nextSibling;

    assert.equal(div.firstElementChild, b);

    var sr = div.createShadowRoot();
    sr.innerHTML = 'f<content></content>g';
    var content = sr.firstChild.nextSibling;

    div.offsetHeight;  // trigger rendering

    assert.equal(sr.firstElementChild, content);
    assert.equal(div.firstElementChild, b);
  });

  test('lastElementChild', function() {
    var div = document.createElement('div');
    div.innerHTML = 'a<b></b>c';
    var b = div.firstChild.nextSibling;

    assert.equal(div.lastElementChild, b);

    var sr = div.createShadowRoot();
    sr.innerHTML = 'f<content></content>g';
    var content = sr.firstChild.nextSibling;

    div.offsetHeight;  // trigger rendering

    assert.equal(sr.lastElementChild, content);
    assert.equal(div.lastElementChild, b);
  });

});
