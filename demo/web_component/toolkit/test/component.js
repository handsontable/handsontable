/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

suite('component', function() {
  var foo;
  
  setup(function() {
    foo = document.createElement('g-foo');
    work.appendChild(foo);
  });
  
  teardown(function() {
    work.textContent = '';
  });
  
  test('string attribute', function() {
    foo.str = 'hello world';
    dirtyCheck();
    expect(foo.$protected._str).to.be('hello world');
    /*foo.setAttribute('str', 'good bye');
    dirtyCheck();
    async(function() {
      expect(foo.$protected._str).to.be('good bye');
      done();
    });*/
  });

  test('boolean attribute', function() {
    foo.bool = true;
    dirtyCheck();
    expect(foo.$protected._bool).to.be(true);
    foo.bool = false;
    dirtyCheck();
    expect(foo.$protected._bool).to.be(false);
    /*foo.setAttribute('bool', true);
    dirtyCheck();
    async(function() {
      expect(foo.$protected._bool).to.be(true);
      done();
    });*/
  });
  
  test('number attribute', function() {
    foo.num = 3;
    dirtyCheck();
    expect(foo.$protected._num).to.be(3);
    /*foo.setAttribute('num', 5);
    dirtyCheck();
    async(function() {
      expect(foo.$protected._num).to.be(5);
      done();
    });*/
  });
  
  test('string property', function() {
    foo.strp = 'hello world';
    dirtyCheck();
    expect(foo.$protected._strp).to.be('hello world');
  });

  test('boolean property', function() {
    foo.boolp = true;
    dirtyCheck();
    expect(foo.$protected._boolp).to.be(true);
    foo.boolp = false;
    dirtyCheck();
    expect(foo.$protected._boolp).to.be(false);
  });
  
  test('number property', function() {
    foo.nump = 3;
    dirtyCheck();
    expect(foo.$protected._nump).to.be(3);
  });
  
  test('node reference', function() {
    var ref = foo.$protected.$.ref1;
    expect(ref.id).to.be('ref1');
    ref = foo.$protected.$.ref2;
    expect(ref.textContent).to.be('hello!!!');
  });
  
  test('handler', function() {
    expect(foo.$protected._click).to.be(undefined);
    // TODO(sjmiles): Mozilla didn't like 'foo.click', seems 'click' is only 
    // defined on specific elements, or at least is not available on 
    // HTMLUnknownElement
    //foo.click();
    foo.dispatchEvent(new CustomEvent('click', {bubbles: true}));
    expect(foo.$protected._click).to.be(true);
  });
  
  test('custom event', function() {
    expect(foo.$protected._ref1click).to.be(undefined);
    foo.$protected.$.ref1.click();
    expect(foo.$protected._ref1click).to.be(true);
  });
  
  test('bind property to DOM', function(done) {
    var s = 'bind property to DOM';
    foo.strp = s;
    dirtyCheck();
    async(function() {
      var ref = foo.$protected.$.ref3;
      expect(ref.textContent).to.be(s);
      done();
    });
  });
  
  // setAttribute doesn't trigger <property>Changed
  /*test('bind attribute to DOM', function(done) {
    var s = 'bind attribute to DOM';
    foo.setAttribute('str', s);
    dirtyCheck();
    async(function() {
      var ref = foo.$protected.$.ref4;
      expect(ref.textContent).to.be(s);
      done();
    });
  });*/
  
  test('ready', function() {
    expect(foo.str).to.be('I am ready');
  });
  
  test('public method', function() {
    var s = 'calling public method';
    foo.publicMethod(s);
    expect(foo.$protected._fooValue).to.be(s);
  });
  
  test('protected method', function() {
    expect(foo.protectedMethod).to.be(undefined);
    var s = 'calling protected method';
    foo.$protected.protectedMethod(s);
    expect(foo.$protected._fooValue).to.be(s);
  });
  
  // TODO(ffu): uncomment this when mdv delegate is supported
  /*test('custom MDV binding (single dependency)', function(done) {
    foo.name = 'John Doe';
    dirtyCheck();
    async(function() {
      var ref = foo.$protected.$.ref5;
      expect(ref.textContent).to.be('Hello, ' + foo.name);
      done();
    });
  });
  
  test('custom MDV binding (multiple dependencies)', function(done) {
    foo.firstName = 'John';
    dirtyCheck();
    foo.lastName = 'Doe';
    dirtyCheck();
    async(function() {
      var ref = foo.$protected.$.ref6;
      expect(ref.textContent).to.be(foo.lastName + ', ' + foo.firstName);
      done();
    });
  });*/
});

