/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('lang', function() {
  var assert = chai.assert;
  
  test('forEach', function() {
    assert.isDefined(window.forEach);
    
    var array = [1, 2, 3];
    forEach(array, function(a, i) {
      assert.equal(a, array[i]);
    });
  });
});