/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Document', function() {

  var wrap = ShadowDOMPolyfill.wrap;

  test('Ensure Document has ParentNodeInterface', function() {
    var doc = wrap(document).implementation.createHTMLDocument('');
    assert.equal(doc.firstElementChild.tagName, 'HTML');
    assert.equal(doc.lastElementChild.tagName, 'HTML');
  });

  test('document.documentElement', function() {
    var doc = wrap(document);
    assert.equal(doc.documentElement.ownerDocument, doc);
    assert.equal(doc.documentElement.tagName, 'HTML');
  });

  test('document.body', function() {
    var doc = wrap(document);
    assert.equal(doc.body.ownerDocument, doc);
    assert.equal(doc.body.tagName, 'BODY');
    assert.equal(doc.body.parentNode, doc.documentElement);
  });

  test('document.head', function() {
    var doc = wrap(document);
    assert.equal(doc.head.ownerDocument, doc);
    assert.equal(doc.head.tagName, 'HEAD');
    assert.equal(doc.head.parentNode, doc.documentElement);
  });

  test('getElementsByTagName', function() {
    var elements = document.getElementsByTagName('body');
    assert.isTrue(elements instanceof NodeList);
    assert.equal(elements.length, 1);
    assert.isTrue(elements[0] instanceof HTMLElement);

    var doc = wrap(document);
    assert.equal(doc.body, elements[0]);
    assert.equal(doc.body, elements.item(0));

    var elements2 = doc.getElementsByTagName('body');
    assert.isTrue(elements2 instanceof NodeList);
    assert.equal(elements2.length, 1);
    assert.isTrue(elements2[0] instanceof HTMLElement);
    assert.equal(doc.body, elements2[0]);
    assert.equal(doc.body, elements2.item(0));
  });

  test('querySelectorAll', function() {
    var elements = document.querySelectorAll('body');
    assert.isTrue(elements instanceof NodeList);
    assert.equal(elements.length, 1);
    assert.isTrue(elements[0] instanceof HTMLElement);

    var doc = wrap(document);
    assert.equal(doc.body, elements[0]);

    var elements2 = doc.querySelectorAll('body');
    assert.isTrue(elements2 instanceof NodeList);
    assert.equal(elements2.length, 1);
    assert.isTrue(elements2[0] instanceof HTMLElement);
    assert.equal(doc.body, elements2[0]);
  });

  test('addEventListener', function() {
    var calls = 0;
    var doc = wrap(document);
    document.addEventListener('click', function f(e) {
      calls++;
      assert.equal(this, doc);
      assert.equal(e.target, doc.body);
      assert.equal(e.currentTarget, this);
      document.removeEventListener('click', f);
    });
    doc.addEventListener('click', function f(e) {
      calls++;
      assert.equal(this, doc);
      assert.equal(e.target, doc.body);
      assert.equal(e.currentTarget, this);
      doc.removeEventListener('click', f);
    });

    document.body.click();
    assert.equal(2, calls);

    document.body.click();
    assert.equal(2, calls);
  });

  test('adoptNode', function() {
    var doc = wrap(document);
    var doc2 = doc.implementation.createHTMLDocument('');
    var div = doc2.createElement('div');
    assert.equal(div.ownerDocument, doc2);

    var div2 = document.adoptNode(div);
    assert.equal(div, div2);
    assert.equal(div.ownerDocument, doc);

    var div3 = doc2.adoptNode(div);
    assert.equal(div, div3);
    assert.equal(div.ownerDocument, doc2);
  });
});
