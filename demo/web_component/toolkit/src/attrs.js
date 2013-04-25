/* 
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function() {
  
  // imports
  
  var bindPattern = Toolkit.bindPattern;
  
  // constants
  
  var published$ = '__published';
  var attributes$ = 'attributes';
  var attrProps$ = 'publish'; 
  //var attrProps$ = 'attributeDefaults';

  var publishAttributes = function(inElement, inPrototype) {
    var published = {};
    // merge attribute names from 'attributes' attribute
    var attributes = inElement.getAttribute(attributes$);
    if (attributes) {
      // attributes='a b c' or attributes='a,b,c'
      var names = attributes.split(attributes.indexOf(',') >= 0 ? ',' : ' ');
      // record each name for publishing
      names.forEach(function(p) {
        published[p.trim()] = null;
      });
    }
    // our suffix prototype chain (inPrototype is 'own')
    var inherited = inElement.options.prototype;
    // install 'attributes' properties on the prototype, unless they
    // are already defaulted
    Object.keys(published).forEach(function(p) {
      if (!(p in inPrototype) && !(p in inherited)) {
        inPrototype[p] = published[p];
      }
    });
    // acquire properties published imperatively
    var imperative = inPrototype[attrProps$];
    if (imperative) {
      // install imperative properties, overriding defaults
      Object.keys(imperative).forEach(function(p) {
        inPrototype[p] = imperative[p];
      });
      // combine declaratively and imperatively published properties
      published = mixin(published, imperative);
    }
    // combine with inherited published properties
    inPrototype[published$] = mixin(
      {},
      inherited[published$],
      published
    );
  };

  function takeAttributes() {
    // for each attribute
    forEach(this.attributes, function(a) {
      // try to match this attribute to a property (attributess are
      // all lower-case, so this is case-insensitive search)
      var name = propertyForAttribute.call(this, a.name);
      if (name) {
        // filter out 'mustached' values, these are to be
        // replaced with bound-data and are not yet values
        // themselves
        if (a.value.search(bindPattern) >= 0) {
          return;
        }
        // get original value
        var defaultValue = this[name];
        // deserialize Boolean or Number values from attribute
        var value = deserializeValue(a.value, defaultValue);
        //console.log('takeAttributes: ', a.name, a.value);
        // only act if the value has changed
        if (value !== defaultValue) {
          // install new value (has side-effects)
          this[name] = value;
        }
      }
    }, this);
  };

  var lowerCase = String.prototype.toLowerCase.call.bind(
      String.prototype.toLowerCase);
      
  // return the published property matching name, or undefined
  function propertyForAttribute(name) {
    // matchable properties must be published
    var properties = Object.keys(this[published$]);
    // search for a matchable property
    return properties[properties.map(lowerCase).indexOf(name)];
  };
  
  /*
  // find the public property identified by inAttributeName
  function propertyForAttribute(inAttributeName) {
    // specifically search the __proto__ (as opposed to getPrototypeOf) 
    // __proto__ is simulated on platforms which don't support it naturally 
    // TODO(sjmiles): I'm reluctant to search the entire namespace
    // but this set is too small. Perhaps in 'full public' mode, one
    // must declare 'attributable properties'.
    var properties = Object.keys(this.__proto__);
    //var properties = Object.keys(Object.getPrototypeOf(this));
    for (var i=0, n; (n=properties[i]); i++) {
      if (n.toLowerCase() == inAttributeName) {
        return n;
      }
    }
  };
  */
 
  function deserializeValue(inValue, inDefaultValue) {
    var inferredType = typeof inDefaultValue;
    switch (inValue) {
      case '':
      case 'true':
        return inferredType == 'boolean' ? true : inValue;
      case 'false':
        return inferredType == 'boolean' ? false : inValue;
      }
      return isNaN(inValue) ? inValue : parseFloat(inValue);
  }

  // exports
  
  Toolkit.takeAttributes = takeAttributes;
  Toolkit.publishAttributes = publishAttributes;
  Toolkit.propertyForAttribute = propertyForAttribute;
  
})();