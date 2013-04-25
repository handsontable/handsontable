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

// IE does not support have Document.prototype.contains.
if (typeof document.contains != 'function') {
  Document.prototype.contains = function(node) {
    return this.documentElement.contains(node);
  }
}