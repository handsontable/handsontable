/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
 (function() {
    // $class
    
    function $class(inExtends, inProperties) {
      // support optional inExtends (rare exception: allow two signatures)
      if (arguments.length == 1) {
        inProperties = inExtends;
        inExtends = null;
      }
      // make sure we have a `constructor` property one way or another
      // it's important to name the method for `super` to work 
      // the default constructor calls `super`
      if (!inProperties || !inProperties.hasOwnProperty('constructor')) {
        inProperties.constructor = function() {
          this.super();
        }
      }
      // use the supplied constructor or a stock version
      var ctor = inProperties.constructor;
      // base prototype is either supplied or stock
      var basePrototype = inExtends && inExtends.prototype 
        || Object.prototype;
      // use `extend` primitive to build new prototype
      ctor.prototype = extend(basePrototype, inProperties);
      // install `super` functionality if needed
      if (!('super' in ctor.prototype)) {
        ctor.prototype.super = $super;
      }
      // return newly minted constructor
      return ctor;
    };
    
    // extend
    
    // return a prototype containing inProperties chained to inBasePrototype
    function extend(inBasePrototype, inProperties) {
      return Object.create(inBasePrototype, 
          getPropertyDescriptors(inProperties));
    }
    
    // copy property inName from inSource object to inTarget object
    function getPropertyDescriptors(inObject) {
      var descriptors = {};
      for (var n in inObject) {
        descriptors[n] = getPropertyDescriptor(inObject, n);
      }
      return descriptors;
    }
    
    function getPropertyDescriptor(inObject, inName) {
      return inObject && 
          Object.getOwnPropertyDescriptor(inObject, inName) || 
              getPropertyDescriptor(Object.getPrototypeOf(inObject), inName);
    }

    // super
    
    // TODO(sjmiles):
    //    $super must be installed on an instance or prototype chain
    //    as `super`, and invoked via `this`, e.g.
    //      `this.super();`
     
    //    will not work if function objects are not unique, for example,
    //    when using mixins.
    //    The memoization strategy assumes each function exists on only one 
    //    prototype chain i.e. we use the function object for memoizing)
    //    perhaps we can bookkeep on the prototype itself instead
    function $super(inArgs) {
      // since we are thunking a method call, performance is important here: 
      // memoize all lookups, once memoized the fast path calls no other 
      // functions
      //
      // find the caller (cannot be `strict` because of 'caller')
      var caller = $super.caller;
      // memoization for 'name of method' 
      var nom = caller._nom;
      if (!nom) {
        // once per call chain
        nom = caller._nom = nameInThis.call(this, caller);
        if (!nom) {
          console.warn('called super() on a method not in "this"');
          return;
        }
      }
      // super prototype is either cached or we have to find it
      // by searching __proto__ (at the 'top')
      if (!('_super' in caller)) {
        memoizeSuper(caller, nom, Object.getPrototypeOf(this));
      }
      // memoized next implementation prototype
      var _super = caller._super;
      if (!_super) {
        // if _super is falsey, there is no super implementation
        //console.warn('called $super(' + nom + ') where there is no super implementation');
      } else {
        // our super function
        var fn = _super[nom];
        // memoize information so 'fn' can call 'super'
        if (!('_super' in fn)) {
          memoizeSuper(fn, nom, _super);
        }
        // invoke the inherited method
        // if 'fn' is not function valued, this will throw
        return fn.apply(this, inArgs || []);
      }
    };

    function nextSuper(inProto, inName, inCaller) {
      // look for an inherited prototype that implements inName
      var proto = inProto;
      while (proto &&
          (!proto.hasOwnProperty(inName) || proto[inName] == inCaller)) {
        proto = Object.getPrototypeOf(proto);
      }
      return proto;
    };

    function memoizeSuper(inMethod, inName, inProto) {
      // find and cache next prototype containing inName
      // we need the prototype so we can another lookup
      // from here
      inMethod._super = nextSuper(inProto, inName, inMethod);
      if (inMethod._super) {
        // _super is a prototype, the actual method is _super[inName]
        // tag super method with it's name for further lookups
        inMethod._super[inName]._nom = inName;
      }
    };

    function nameInThis(inValue) {
      for (var n in this) {
        var d = getPropertyDescriptor(this, n);
        if (d.value == inValue) {
          return n;
        }
      }
    }
    
    // mixin
    
    function mixin(inObj/*, inProps, inMoreProps, ...*/) {
      var obj = inObj || {};
      for (var i=1; i<arguments.length; i++) {
        var p = arguments[i];
        // TODO(sjmiles): (IE): trap here instead of copyProperty so we can 
        // abort copying altogether when we hit a bad property 
        try {
          for (var n in p) {
            copyProperty(n, p, obj);
          }
        } catch(x) {
          //console.log(x);
        }
      }
      return obj;
    }
    
    // copy property inName from inSource object to inTarget object
    function copyProperty(inName, inSource, inTarget) {
      Object.defineProperty(inTarget, inName, 
        getPropertyDescriptor(inSource, inName));
    }

    // exports
    
    // `class` is a reserved word
    window.$class = $class;
    window.extend = extend;
    // `super` is a reserved word
    window.$super = $super;
    
  })();
