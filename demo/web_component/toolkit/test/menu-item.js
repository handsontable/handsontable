/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('g-menu-item', function() {
  var item;
  
  setup(function() {
    item = document.createElement('g-menu-item');
    work.appendChild(item);
  });
  
  teardown(function() {
    work.textContent = '';
  });
  
  suite('attributes', function() {
    test('src', function(done) {
      var src = 'http://foo.com/bar.png';
      item.src = src;
      dirtyCheck();
      async(function() {
        var icon = shadowQuery(item, 'g-icon');
        expect(icon.src).to.be(src);
        done();
      });
    });
    
    test('label', function(done) {
      var label = 'mylabel';
      item.label = label;
      dirtyCheck();
      async(function() {
        var span = shadowQuery(item, 'span');
        expect(span.textContent).to.be(label);
        done();
      });
    });
  });
});
