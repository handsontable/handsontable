/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('g-icon-button', function() {
  var iconButton;
  
  setup(function() {
    iconButton = document.createElement('g-icon-button');
    work.appendChild(iconButton);
  });
  
  teardown(function() {
    work.textContent = '';
  });
  
  suite('attributes', function() {
    test('src', function(done) {
      var src = 'http://foo.com/bar.png';
      iconButton.src = src;
      dirtyCheck();
      async(function() {
        var icon = shadowQuery(iconButton, 'g-icon');
        expect(icon.src).to.be(src);
        done();
      });
    });
    
    test('active', function() {
      iconButton.active = true;
      dirtyCheck();
      expect(iconButton.classList.contains('selected')).to.be(true);
      iconButton.active = false;
      dirtyCheck();
      expect(iconButton.classList.contains('selected')).to.be(false);
    });
  });
});
