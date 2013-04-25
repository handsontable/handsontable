/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('register', function() {
  var assert = chai.assert;
  
  var work;
  
  setup(function() {
    work = document.createElement('div');
    wrap(document.body).appendChild(work);
  });

  teardown(function() {
    wrap(document.body).removeChild(work);
  });

  test('register', function() {
    work.innerHTML = '<element name="x-foo">' +
      '<script>' +
        'Toolkit.register(this, {' +
          'ready: function() {' +
            'this.message = "foo";' +
          '},' +
          'sayHello: function() {' +
            'this.message = "hello";' +
          '}' +
        '});' +
      '</script>' +
      '</element>';
    var test = new HTMLElementElement(work.querySelector('element'));
    var foo = document.createElement('x-foo');
    // test ready
    assert.equal(foo.message, 'foo');
    // test sayHello
    foo.sayHello();
    assert.equal(foo.message, 'hello');
  });
});