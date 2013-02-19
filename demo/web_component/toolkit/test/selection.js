/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('g-selection', function() {
  var selection;
  var item = {index: 1, title: 'google'};
  
  setup(function() {
    selection = document.createElement('g-selection');
  });
  
  test('getSelection', function() {
    selection.select(item);
    expect(selection.getSelection()).to.be(item);
  });
  
  test('isSelected', function() {
    selection.select(item);
    expect(selection.isSelected(item)).to.be(true);
  });
  
  test('deselectItem', function() {
    selection.select(item);
    selection.setItemSelected(item, false);
    expect(selection.isSelected(item)).to.be(false);
  });
  
  test('clear', function() {
    selection.select(item);
    selection.clear();
    expect(selection.isSelected(item)).to.be(false);
  });
  
  test('toggle', function() {
    selection.toggle(item);
    expect(selection.isSelected(item)).to.be(true);
    selection.toggle(item);
    expect(selection.isSelected(item)).to.be(false);
  });
  
  suite('attributes', function() {
    test('multi', function() {
      selection.multi = true;
      selection.select('foo');
      selection.select('bar');
      expect(selection.getSelection()).to.have.length(2);
      expect(selection.getSelection()).to.contain('foo');
      expect(selection.getSelection()).to.contain('bar');
    });
  });
  
  suite('events', function() {
    test('select', function(done) {
      var selected = null;
      selection.addEventListener('select', function(e) {
        if (e.detail.isSelected) {
          selected = e.detail.item;
        }
      });
      selection.select(item);
      async(function() {
        expect(selected).to.be(item);
        done();
      });
    });
    
    test('deselect', function(done) {
      var deselected = null;
      selection.addEventListener('select', function(e) {
        if (!e.detail.isSelected) {
          deselected = e.detail.item;
        }
      });
      selection.select(item);
      selection.setItemSelected(item, false);
      async(function() {
        expect(deselected).to.be(item);
        done();
      });
    });
  });
});
