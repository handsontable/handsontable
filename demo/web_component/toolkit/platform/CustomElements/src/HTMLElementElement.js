/*
 * Copyright 2013 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(){
  
var HTMLElementElement = function(inElement) {
  inElement.register = HTMLElementElement.prototype.register;
  parseElementElement(inElement);
  return inElement;
};

HTMLElementElement.prototype = {
  register: function(inMore) {
    if (inMore) {
      this.options.lifecycle = inMore.lifecycle;
      if (inMore.prototype) {
        mixin(this.options.prototype, inMore.prototype);
      }
    }
  }
};

function parseElementElement(inElement) {
  // options to glean from inElement attributes
  var options = {
    name: '',
    extends: null
  };
  // glean them
  takeAttributes(inElement, options);
  // default base
  var base = HTMLElement.prototype;
  // optional specified base
  if (options.extends) {
    // build an instance of options.extends
    var archetype = document.createElement(options.extends);
    // acquire the prototype
    // TODO(sjmiles): __proto__ may be hinted by the custom element
    // system on platforms that don't support native __proto__
    // on those platforms the API is mixed into archetype and the
    // effective base is not archetype's real prototype
    base = archetype.__proto__ || Object.getPrototypeOf(archetype);
  }
  // extend base
  options.prototype = Object.create(base);
  // install options
  inElement.options = options;
  // locate user script
  var script = inElement.querySelector('script,scripts');
  if (script) {
    // execute user script in 'inElement' context
    executeComponentScript(script.textContent, inElement, options.name);
  };
  // register our new element
  var ctor = document.register(options.name, options);
  inElement.ctor = ctor;
  // store optional constructor reference
  var refName = inElement.getAttribute('constructor');
  if (refName) {
    window[refName] = ctor;
  }
}
  
// each property in inDictionary takes a value
// from the matching attribute in inElement, if any
function takeAttributes(inElement, inDictionary) {
  for (var n in inDictionary) {
    var a = inElement.attributes[n];
    if (a) {
      inDictionary[n] = a.value;
    }
  }
}

// invoke inScript in inContext scope
function executeComponentScript(inScript, inContext, inName) {
  // set (highlander) context
  context = inContext;
  // source location
  var owner = context.ownerDocument;
  var url = (owner._URL || owner.URL);
  // ensure the component has a unique source map so it can be debugged
  // if the name matches the filename part of the owning document's url,
  // use this, otherwise, add ":<name>" to the document url.
  var match = url.match(/.*\/([^.]*)[.]?.*$/);
  if (match) {
    var name = match[1];
    url += name != inName ? ':' + inName : '';
  }
  // compose script
  var code = "__componentScript('"
    + inName
    + "', function(){"
    + inScript
    + "});"
    + "\n//@ sourceURL=" + url + "\n"
  ;
  // inject script
  eval(code);
}

var context;

// global necessary for script injection
window.__componentScript = function(inName, inFunc) {
  inFunc.call(context);
};

// utility

// copy all properties from inProps (et al) to inObj
function mixin(inObj/*, inProps, inMoreProps, ...*/) {
  var obj = inObj || {};
  for (var i = 1; i < arguments.length; i++) {
    var p = arguments[i];
    try {
      for (var n in p) {
        copyProperty(n, p, obj);
      }
    } catch(x) {
    }
  }
  return obj;
}

// copy property inName from inSource object to inTarget object
function copyProperty(inName, inSource, inTarget) {
  var pd = getPropertyDescriptor(inSource, inName);
  Object.defineProperty(inTarget, inName, pd);
}

// get property descriptor for inName on inObject, even if
// inName exists on some link in inObject's prototype chain
function getPropertyDescriptor(inObject, inName) {
  if (inObject) {
    var pd = Object.getOwnPropertyDescriptor(inObject, inName);
    return pd || getPropertyDescriptor(Object.getPrototypeOf(inObject), inName);
  }
}

// exports

window.HTMLElementElement = HTMLElementElement;
// TODO(sjmiles): completely ad-hoc, used by toolkit.register
window.mixin = mixin;

})();