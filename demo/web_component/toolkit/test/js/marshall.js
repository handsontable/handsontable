/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('marshall', function() {
  var assert = chai.assert;
  
  test('node references self', function() {
    var foo = document.createElement('x-foo');
    foo.innerHTML = '<div id="bar">barContent</div><div id="zot">zotContent</div>';
    Toolkit.marshalNodeReferences.call(foo, foo);
    assert.equal(foo.$.bar.textContent, 'barContent');
    assert.equal(foo.$.zot.textContent, 'zotContent');
  });

  test('node references shadow root', function() {
    var foo = document.createElement('x-foo');
    var sr = foo.webkitCreateShadowRoot();
    sr.innerHTML = '<div id="bar">barContent</div><div id="zot">zotContent</div>';
    Toolkit.marshalNodeReferences.call(foo, sr);
    assert.equal(foo.$.bar.textContent, 'barContent');
    assert.equal(foo.$.zot.textContent, 'zotContent');
  });
});