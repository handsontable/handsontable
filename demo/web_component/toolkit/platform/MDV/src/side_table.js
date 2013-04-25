/*
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

// This is originally from Toolkitchen
// https://github.com/toolkitchen/polyfills/blob/master/ShadowDOM/sidetable.js

// SideTable is a weak map where possible. If WeakMap is not available the
// association is stored as an expando property.
var SideTable;
if (typeof WeakMap !== 'undefined') {
  SideTable = WeakMap;
} else {
  SideTable = function(name) {
    this.name = '__$' + name + '$__';
  };
  SideTable.prototype = {
    set: function(key, value) {
      Object.defineProperty(key, this.name, {value: value, writable: true});
    },
    get: function(key) {
      return key[this.name];
    },
    delete: function(key) {
      this.set(key, undefined);
    }
  };
}

/**
 * Version of SideTable that walks the prototype chain for get.
 */
function SideTableInherit(name) {
  // V8 does not allow inheriting WeakMap so we use composition instead.
  this.map = new SideTable(name);
}
SideTableInherit.prototype = {
  set: function(key, value) {
    this.map.set(key, value);
  },
  get: function(key) {
    if (key === null)
      return undefined;
    var value = this.map.get(key);
    if (value !== undefined)
      return value;
    return this.get(Object.getPrototypeOf(key));
  },
  delete: function(key) {
    this.map.delete(key);
  }
};
