/*!
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

// SideTable is a weak map where possible. If WeakMap is not available the
// association is stored as an expando property.
var SideTable;
// TODO(dfreedman): WeakMap does not allow for Events to be keys in Firefox
if (typeof WeakMap !== 'undefined' && navigator.userAgent.indexOf('Firefox/') < 0) {
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
    }
  }
}
