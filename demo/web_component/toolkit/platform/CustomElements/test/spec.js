/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('custom-elements-spec', function() {
  var XFoo;
  var work;
  var assert = chai.assert;

  setup(function() {
    // register a custom element
    XFoo = document.register('x-foo', {
      prototype: Object.create(HTMLElement.prototype, {
        isXFoo: {
          value: true,
          enumerable: true
        }
      })
    });
    work = document.createElement('div');
    document.body.appendChild(work);
  });

  teardown(function() {
    document.body.removeChild(work);
  });

  test('4: changing "is" attribute after instantiation does not change localName', function() {
    // create an instance
    var xfoo = new XFoo();
    // test localName
    assert.equal(xfoo.localName, 'x-foo');
    var localName = xfoo.localName;
    // change 'is' attribute
    xfoo.setAttribute('is', 'x-bar');
    // localName should not change
    assert.equal(xfoo.localName, localName);
  });

  test('4: custom tag wins over type extension if both are provided', function() {
    // create an element via innerHTML to set attributes
    work.innerHTML = '<x-foo is="x-bar">';
    var xfoo = work.childNodes[0];
    // localName should be x-foo
    assert.equal(xfoo.localName, 'x-foo');
  });

  test('4: createElement has an optional typeExtension argument', function() {
    var xfoo = document.createElement('div', 'x-foo');
    // "is" attr set to type extension if it is not the same as localName
    assert.equal(xfoo.getAttribute('is'), 'x-foo');
  });

  test('9.1: registering a custom element with the same name and type and/or prototype as an existing custom element is not supported.', function() {
    // register another custom element named x-foo
    document.register('x-foo');
    var error = false;
    try {
      // register another one of these.
      document.register('x-foo');
    } catch (e) {
      error = true;
    }
    assert.isTrue(error);
  });

  test('9.1: elements in DOM are upgraded at the end of document.register', function() {
    var xbar = document.createElement('x-bar');
    work.appendChild(xbar);
    // register the x-bar custom element
    document.register('x-bar', {
      prototype: Object.create(HTMLElement.prototype, {
        isXBar: {
          value: true,
          enumerable: true
        }
      })
    });
    // xbar is upgraded
    assert.isTrue(xbar.isXBar);
  });

  test('9.1: elements that were created imperatively and not inserted into the document are not upgraded', function() {
    var xbaz = document.createElement('x-baz');
    // register the x-baz custom element
    document.register('x-baz', {
      prototype: Object.create(HTMLElement.prototype, {
        isXBaz: {
          value: true,
          enumerable: true
        }
      })
    });
    // xbaz is not upgraded
    assert.isUndefined(xbaz.isXBaz);
  });
});
