/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Custom Element', function() {

  test('Correct Wrapper for Custom Element', function() {

    function MyElement() {};
    MyElement.prototype = Object.create(HTMLElement.prototype);
    MyElement.prototype.customMethod = function() {};
    // make a DOM instance
    var div = document.createElement('div');
    // implement custom API
    if (Object.__proto__) {
      // for browsers that support __proto__
      div.__proto__ = MyElement.prototype;
    } else {
      // for browsers that don't support __proto__
      div.customMethod = MyElement.prototype.customMethod;
      // custom API hint for ShadowDOM polyfill
      div.__proto__ = MyElement.prototype;
    }
    assert.typeOf(div.customMethod, 'function',
                  'plain custom element has custom function');
  });

});