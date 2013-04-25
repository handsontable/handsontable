/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('Text', function() {

  test('instanceof', function() {
    var div = document.createElement('div');
    div.textContent = 'abc';
    assert.instanceOf(div.firstChild, Text);
  });

});
