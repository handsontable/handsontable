/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('watchDOM', function() {
  var work;
  var assert = chai.assert;

  setup(function() {
    work = document.createElement('div');
    document.body.appendChild(work);
  });

  teardown(function() {
    document.body.removeChild(work);
  });
  
  function registerTestComponent(inName, inValue) {
    var proto = Object.create(HTMLElement.prototype);
    proto.value = inValue || 'value';
    document.register(inName, {
      prototype: proto
    });
  }
  
  function testElements(node, selector, value) {
    Array.prototype.forEach.call(node.querySelectorAll(selector), function(n) {
      assert.equal(n.value, value);
    });
  }

  test('custom element automatically upgrades', function(done) {
    registerTestComponent('x-auto', 'auto');
    work.innerHTML = '<x-auto></x-auto>';
    var x = work.firstChild;
    assert.isUndefined(x.value);
    setTimeout(function() {
      assert.equal(x.value, 'auto');
      done();
    }, 0);
  });
  
  test('custom element automatically upgrades in subtree', function(done) {
    registerTestComponent('x-auto-sub', 'auto-sub');
    work.innerHTML = '<div></div>';
    var target = work.firstChild;
    setTimeout(function() {
      target.innerHTML = '<x-auto-sub></x-auto-sub>';
      var x = target.firstChild;
      assert.isUndefined(x.value);
      setTimeout(function() {
        assert.equal(x.value, 'auto-sub');
        done();
      }, 0);
    }, 0);
  });
  
  
  test('custom elements automatically upgrade', function(done) {
    registerTestComponent('x-auto1', 'auto1');
    registerTestComponent('x-auto2', 'auto2');
    work.innerHTML = '<div><div><x-auto1></x-auto1><x-auto1></x-auto1>' +
      '</div></div><div><x-auto2><x-auto1></x-auto1></x-auto2>' +
      '<x-auto2><x-auto1></x-auto1></x-auto2></div>';
    setTimeout(function() {
      testElements(work, 'x-auto1', 'auto1');
      testElements(work, 'x-auto2', 'auto2');
      done();
    }, 0);
  });
  
  
  test('custom elements automatically upgrade in subtree', function(done) {
    registerTestComponent('x-auto-sub1', 'auto-sub1');
    registerTestComponent('x-auto-sub2', 'auto-sub2');
    work.innerHTML = '<div></div>';
    var target = work.firstChild;
    setTimeout(function() {
      target.innerHTML = '<div><div><x-auto-sub1></x-auto-sub1><x-auto-sub1></x-auto-sub1>' +
        '</div></div><div><x-auto-sub2><x-auto-sub1></x-auto-sub1></x-auto-sub2>' +
        '<x-auto-sub2><x-auto-sub1></x-auto-sub1></x-auto-sub2></div>';
      setTimeout(function() {
        testElements(target, 'x-auto-sub1', 'auto-sub1');
        testElements(target, 'x-auto-sub2', 'auto-sub2');
        done();
      }, 0);
    }, 0);
    
  });
  
  // test ShadowDOM only in webkit for now...
  if (HTMLElement.prototype.webkitCreateShadowRoot) {
    test('custom element automatically upgrades in ShadowDOM', function(done) {
      registerTestComponent('x-auto-shadow', 'auto-shadow');
      work.innerHTML = '<div></div>';
      var div = work.firstChild;
      var root = div.webkitCreateShadowRoot();
      document.watchDOM(root);
      root.innerHTML = '<x-auto-shadow></x-auto-shadow>';
      var x = root.firstChild;
      assert.isUndefined(x.value);
      setTimeout(function() {
        assert.equal(x.value, 'auto-shadow');
        done();
      }, 0);
    });
  
    test('custom element automatically upgrades in ShadowDOM subtree', function(done) {
      registerTestComponent('x-sub', 'sub');
      work.innerHTML = '<div></div>';
      var div = work.firstChild;
      var root = div.webkitCreateShadowRoot();
      root.innerHTML = '<div></div>';
      document.watchDOM(root);
      var target = root.firstChild;
      target.innerHTML = '<x-sub></x-sub>';
      var x = target.firstChild;
      assert.isUndefined(x.value);
      setTimeout(function() {
        assert.equal(x.value, 'sub');
        done();
      }, 0);
    });
  }
});
