/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('g-icon', function() {
  var icon;
  
  setup(function() {
    icon = document.createElement('g-icon');
    work.appendChild(icon);
  });
  
  teardown(function() {
    work.textContent = '';
  });
  
  suite('attributes', function() {
    test('src', function(done) {
      var src = 'http://foo.com/bar.png';
      icon.src = src;
      dirtyCheck();
      async(function() {
        var i = shadowQuery(icon, '#icon');
        // Mozilla returns this value as 
        //    url("<path>") 
        // where webkit returns 
        //    url(<path>)
        // so to be less brittle we only try to match the <path> part
        expect(i.style.backgroundImage).to.contain(src);
        done();
      });
    });
  });
});
