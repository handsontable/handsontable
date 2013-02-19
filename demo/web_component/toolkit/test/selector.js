/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('g-selector', function() {
  var selector;
  
  setup(function() {
    selector = document.createElement('g-selector');
    work.appendChild(selector);
  });
  
  teardown(function() {
    //work.textContent = '';
  });
  
  function addItems(inNum) {
    for (var i=0; i<inNum; i++) {
      selector.lightDOM.appendChild(document.createElement('div')).textContent = 'item' + i;
    }
    ShadowDOM.distribute(selector);
  }
  
  test('items', function() {
    addItems(4);
    expect(selector.items).to.have.length(4);
  });
  
  test('item content', function() {
    addItems(4);
    Array.prototype.forEach.call(selector.items, function(item, i) {
      expect(item.textContent).to.be('item' + i);
    });
  });
  
  test('selection', function() {
    addItems(4);
    selector.selected = 2;
    dirtyCheck();
    expect(selector.selection).to.be(selector.items[2]); 
  });
  
  suite('attributes', function() {
    test('selected', function(done) {
      addItems(4);
      selector.selected = 2;
      dirtyCheck();
      async(function() {
        expect(selector.items[2].className).to.be('selected');
        done();
      });
    });
    
    test('multi', function(done) {
      addItems(4);
      selector.multi = true;
      dirtyCheck();
      selector.selected = 0;
      dirtyCheck();
      selector.selected = 1;
      dirtyCheck();
      expect(selector.selection.length).to.be(2);
      async(function() {
        expect(selector.items[0].className).to.be('selected');
        expect(selector.items[1].className).to.be('selected');
        done();
      });
    });
  });
});
