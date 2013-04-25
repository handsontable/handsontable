/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Wrapper creation', function() {

  var wrap = ShadowDOMPolyfill.wrap;
  var unwrap = ShadowDOMPolyfill.unwrap;
  var rewrap = ShadowDOMPolyfill.rewrap;
  var resetNodePointers = ShadowDOMPolyfill.resetNodePointers;
  var knownElements = ShadowDOMPolyfill.knownElements;

  test('Br element wrapper', function() {
    var br = document.createElement('br');
    assert.isTrue('clear' in br);
    assert.isFalse(br.hasOwnProperty('clear'));
    assert.isTrue(Object.getPrototypeOf(br).hasOwnProperty('clear'));
  });

  Object.keys(knownElements).forEach(function(tagName) {
    test(tagName, function() {
      var constructor = window[knownElements[tagName]];
      if (!constructor)
        return;

      var element = document.createElement(tagName);
      assert.instanceOf(element, constructor);
      assert.equal(Object.getPrototypeOf(element), constructor.prototype);
    });
  });

  test('cloneNode(false)', function() {
    var doc = wrap(document);
    var a = document.createElement('a');
    a.href = 'http://domain.com/';
    a.textContent = 'text';
    var textNode = a.firstChild;

    var aClone = a.cloneNode(false);

    assert.equal(aClone.tagName, 'A');
    assert.equal(aClone.href, 'http://domain.com/');
    expectStructure(aClone, {});
  });

  test('cloneNode(true)', function() {
    var doc = wrap(document);
    var a = document.createElement('a');
    a.href = 'http://domain.com/';
    a.textContent = 'text';
    var textNode = a.firstChild;

    var aClone = a.cloneNode(true);
    var textNodeClone = aClone.firstChild;

    assert.equal(aClone.tagName, 'A');
    assert.equal(aClone.href, 'http://domain.com/');
    expectStructure(aClone, {
      firstChild: textNodeClone,
      lastChild: textNodeClone
    });
    expectStructure(textNodeClone, {
      parentNode: aClone
    });
  });

  test('parentElement', function() {
    var a = document.createElement('a');
    a.textContent = 'text';
    var textNode = a.firstChild;
    assert.equal(textNode.parentElement, a);
    assert.isNull(a.parentElement);

    var doc = wrap(document);
    var body = doc.body;
    var documentElement = doc.documentElement;
    assert.equal(body.parentElement, documentElement);
    assert.isNull(documentElement.parentElement);
  });

  test('contains', function() {
    var div = document.createElement('div');
    assert.isTrue(div.contains(div));

    div.textContent = 'a';
    var textNode = div.firstChild;
    assert.isTrue(textNode.contains(textNode));
    assert.isTrue(div.contains(textNode));
    assert.isFalse(textNode.contains(div));

    var doc = div.ownerDocument;
    assert.isTrue(doc.contains(doc));
    assert.isFalse(doc.contains(div));
    assert.isFalse(doc.contains(textNode));
  });

  test('instanceof', function() {
    var div = document.createElement('div');
    assert.instanceOf(div, HTMLElement);
    assert.instanceOf(div, Element);
    assert.instanceOf(div, EventTarget);
  });

});
