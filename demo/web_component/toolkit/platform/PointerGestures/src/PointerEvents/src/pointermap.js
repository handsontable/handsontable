/*!
 * Copyright 2012 The Toolkitchen Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/**
 * This module implements an ordered list of pointer states
 * Each pointer object here has two properties:
 *  - id: the id of the pointer
 *  - event: the source event of the pointer, complete with positions
 *
 * The ordering of the pointers is from oldest pointer to youngest pointer,
 * which allows for multi-pointer gestures to not rely on the actual ids
 * imported from the source events.
 *
 * Any operation that needs to store state information about pointers can hang
 * objects off of the pointer in the pointermap. This information will be
 * preserved until the pointer is removed from the pointermap.
 */
function PointerMap() {
  this.ids = [];
  this.pointers = [];
};

PointerMap.prototype = {
  set: function(inId, inEvent) {
    var i = this.ids.indexOf(inId);
    if (i > - 1) {
      this.pointers[i] = inEvent;
    } else {
      this.ids.push(inId);
      this.pointers.push(inEvent);
    }
  },
  has: function(inId) {
    return this.ids.indexOf(inId) > -1;
  },
  'delete': function(inId) {
    var i = this.ids.indexOf(inId);
    if (i > -1) {
      this.ids.splice(i, 1);
      this.pointers.splice(i, 1);
    }
  },
  get: function(inId) {
    var i = this.ids.indexOf(inId);
    return this.pointers[i];
  },
  item: function(inIndex) {
    return this.pointers[inIndex];
  },
  get size() {
    return this.pointers.length;
  }
};
