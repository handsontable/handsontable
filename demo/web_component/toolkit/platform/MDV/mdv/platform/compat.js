// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

if (!Function.prototype.bind) {
  // JSC does not implement bind
  Object.defineProperty(Function.prototype, 'bind', {
    value: function(selfObj, var_args) {
      var fn = this;
      var context = selfObj || goog.global;
      var boundArgs = Array.prototype.slice.call(arguments, 1);
      return function() {
        // Prepend the bound arguments to the current arguments.
        var newArgs = Array.prototype.slice.call(arguments);
        Array.prototype.unshift.apply(newArgs, boundArgs);
        return fn.apply(context, newArgs);
      };
    },
    writable: true,
    configurable: true
  });
}

// JScript does not have __proto__. We wrap all object literals with
// createObject which uses Object.create, Object.defineProperty and
// Object.getOwnPropertyDescriptor to create a new object that does the exact
// same thing. The main downside to this solution is that we have to extract
// all those property descriptors for IE.
var createObject = ('__proto__' in {}) ?
    function(obj) { return obj; } :
    function(obj) {
      var proto = obj.__proto__;
      if (!proto)
        return obj;
      var newObject = Object.create(proto);
      Object.getOwnPropertyNames(obj).forEach(function(name) {
        Object.defineProperty(newObject, name,
                             Object.getOwnPropertyDescriptor(obj, name));
      });
      return newObject;
    };


// IE does not support the hidden attribute/property.
if (typeof document.createElement('div').hidden != 'boolean') {
  Object.defineProperty(HTMLElement.prototype, 'hidden', {
    get: function() {
      return this.hasAttribute('hidden');
    },
    set: function(b) {
      if (b)
        this.setAttribute('hidden', '');
      else
        this.removeAttribute('hidden');
    },
    enumerable: true,
    configurable: true
  });

  // Add default styling.
  var styleElement = document.createElement('style');
  styleElement.textContent = '[hidden] { display: none }';
  document.head.appendChild(styleElement);
}
