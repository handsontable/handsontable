/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('g-menu', function() {
  var menu;
  
  setup(function() {
    menu = document.createElement('g-menu');
    work.appendChild(menu);
  });
  
  teardown(function() {
    work.textContent = '';
  });
  
  function addItems(inNum) {
    for (var i = 0; i < inNum; i++) {
      var item = document.createElement('g-menu-item');
      item.textContent = 'item' + i;
      menu.lightDOM.appendChild(item);
    }
    ShadowDOM.distribute(menu);
  }
  
  test('items', function() {
    addItems(4);
    expect(menu.items).to.have.length(4);
  });
  
  test('item content', function() {
    addItems(4);
    Array.prototype.forEach.call(menu.items, function(item, i) {
      expect(item.textContent).to.be('item' + i);
    });
  });
  
  test('selection', function() {
    addItems(4);
    menu.selected = 2;
    dirtyCheck();
    expect(menu.selection).to.be(menu.items[2]); 
  });
  
  test('click item', function(done) {
    addItems(4);
    // simulate pointerup on item
    // TODO(sjmiles): Mozilla didn't like the initMouseEvent call, but it 
    // accepted the new-fangled CustomEvent version
    //var e = document.createEvent('MouseEvents');
    //e.initMouseEvent('pointerup', true);
    var e = new CustomEvent('pointerup', {bubbles: true});
    //
    menu.items[2].dispatchEvent(e);
    async(function() {
      expect(menu.selected).to.be(2);
      done();
    });
  });
  
  suite('attributes', function() {
    test('selected', function(done) {
      addItems(4);
      menu.selected = 2;
      dirtyCheck();
      async(function() {
        expect(menu.items[2].className).to.be('selected');
        done();
      });
    });
    
    test('multi', function(done) {
      addItems(4);
      menu.multi = true;
      dirtyCheck();
      menu.selected = 0;
      dirtyCheck();
      menu.selected = 1;
      dirtyCheck();
      async(function() {
        expect(menu.items[0].className).to.be('selected');
        expect(menu.items[1].className).to.be('selected');
        done();
      });
    });
  });
});
