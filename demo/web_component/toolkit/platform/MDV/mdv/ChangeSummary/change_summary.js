// Copyright 2012 Google Inc.
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

(function(global) {
  'use strict';

  var hasObserve = typeof Object.observe == 'function';

  function isIndex(s) {
    return +s === s >>> 0;
  }

  function toNumber(s) {
    return +s;
  }

  function isObject(obj) {
    return obj === Object(obj);
  }

  function ensureMapSetForEach() {
    // Included inline from from https://github.com/arv/map-set-for-each.
    if (Map.prototype.forEach && Set.prototype.forEach)
      return;

    // We use an object to keep the ordering
    var keyMap = new WeakMap;

    function getKeyMap(obj) {
      var map = keyMap.get(obj);
      if (!map) {
        map = Object.create(null);
        keyMap.set(obj, map);
      }
      return map;
    }

    // These maps are used to map a value to a unique ID.
    var objectKeys = new WeakMap;
    var numberKeys = Object.create(null);
    var stringKeys = Object.create(null);

    var uidCounter = 4;  // 0 - 3 are used for null, undefined, false and true

    /**
     * @param {*} key
     * @return {string} A unique ID for a given key (of any type). This unique ID
     *    is a non numeric string since strings that can be used as array indexes
     *    causes different enumeration order.
     */
    function getUid(key) {
      if (key === null)
        return '$0';

      var keys, uid;

      switch (typeof key) {
        case 'undefined':
          return '$1';
        case 'boolean':
          // 2 & 3
          return '$' + (key + 2);
        case 'object':
        case 'function':
          uid = objectKeys.get(key);
          if (!uid) {
            uid = '$' + uidCounter++;
            objectKeys.set(key, uid);
          }
          return uid;
        case 'number':
          keys = numberKeys;
          break;
        case 'string':
          keys = stringKeys;
          break;
      }
      uid = keys[key];
      if (!uid) {
        uid = '$' + uidCounter++;
        keys[key] = uid;
      }
      return uid;
    }

    var MapSet = Map.prototype.set;
    var MapDelete = Map.prototype.delete;
    var SetAdd = Set.prototype.add;
    var SetDelete = Set.prototype.delete;

    Map.prototype.set = function(key, value) {
      var uid = getUid(key);
      var keyMap = getKeyMap(this);
      keyMap[uid] = key;
      return MapSet.call(this, key, value);
    };

    Map.prototype.delete = function(key) {
      var uid = getUid(key);
      var keyMap = getKeyMap(this);
      delete keyMap[uid];
      return MapDelete.call(this, key);
    };

    /**
     * For each key and value in the map call a function that takes the key and
     * the value (as well as the map).
     * @param {function(*, *, Map} f
     * @param {Object} opt_this The object to use as this in the callback.
     *     Defaults to the map itself.
     */
    Map.prototype.forEach = function(f, opt_this) {
      var keyMap = getKeyMap(this);
      for (var uid in keyMap) {
        var key = keyMap[uid]
        var value = this.get(key);
        f.call(opt_this || this, value, key, this);
      }
    };

    Set.prototype.add = function(key) {
      var uid = getUid(key);
      var keyMap = getKeyMap(this);
      keyMap[uid] = key;
      return SetAdd.call(this, key);
    };

    Set.prototype.delete = function(key) {
      var uid = getUid(key);
      var keyMap = getKeyMap(this);
      delete keyMap[uid];
      return SetDelete.call(this, key);
    };

    /**
     * For each value in the set call a function that takes the value and
     * the value (again) (as well as the set).
     * @param {function(*, *, Set} f
     * @param {Object} opt_this The object to use as this in the callback.
     *     Defaults to the set itself.
     */
    Set.prototype.forEach = function(f, opt_this) {
      var keyMap = getKeyMap(this);
      for (var uid in keyMap) {
        var key = keyMap[uid]
        f.call(opt_this || this, key, key, this);
      }
    };
  }

  function polyfillMapSet(global) {
    function Map() {
      this.values_ = [];
      this.keys_ = [];
    }

    Map.prototype = {
      get: function(key) {
        return this.values_[this.keys_.indexOf(key)];
      },

      set: function(key, value) {
        var index = this.keys_.indexOf(key);
        if (index < 0)
          index = this.keys_.length;

        this.keys_[index] = key;
        this.values_[index] = value;
      },

      has: function(key) {
        return this.keys_.indexOf(key) >= 0;
      },

      delete: function(key) {
        var index = this.keys_.indexOf(key);
        if (index < 0)
          return false;

        this.keys_.splice(index, 1);
        this.values_.splice(index, 1);
        return true;
      },

      forEach: function(f, opt_this) {
        for (var i = 0; i < this.keys_.length; i++)
          f.call(opt_this || this, this.values_[i], this.keys_[i], this);
      },

      get size() {
        return this.keys_.length;
      }
    }

    function Set() {
      this.keys_ = [];
    }

    Set.prototype = {
      add: function(key) {
        if (this.keys_.indexOf(key) < 0)
          this.keys_.push(key);
      },

      has: function(key) {
        return this.keys_.indexOf(key) >= 0;
      },

      delete: function(key) {
        var index = this.keys_.indexOf(key);
        if (index < 0)
          return false;

        this.keys_.splice(index, 1);
        return true;
      },

      forEach: function(f, opt_this) {
        for (var i = 0; i < this.keys_.length; i++)
          f.call(opt_this || this, this.keys_[i], this.keys_[i], this);
      },

      get size() {
        return this.keys_.length;
      }
    }

    global.Map = Map;
    global.Set = Set;
  }

  if (typeof Map === 'function' &&
      typeof Set === 'function' &&
      typeof WeakMap === 'function')
    ensureMapSetForEach();
  else
    polyfillMapSet(global);

  function valueSet(map) {
    var set = new Set;
    map.forEach(function(value, key) {
      set.add(value);
    })
    return set;
  }

  /*
   * TODO(rafaelw): Need rigorous definitions for path and "value at path".
   * Cases to consider:
   *   Path:
   *     -empty string (currently a path with 0 property componets)
   *     -index operators, e.g. "foo[2].baz" (currently not supported)
   *   Value at Path:
   *     -empty string path (the value is the model itself)
   *     -non-object model (valid, if path is non-empty, value is undefined)
   */

  var pathIndentPart = '[\$a-z0-9_]+[\$a-z0-9_\\d]*';
  var pathRegExp = new RegExp('^' +
                              '(?:#?' + pathIndentPart + ')?' +
                              '(?:' +
                                '(?:\\.' + pathIndentPart + ')' +
                              ')*' +
                              '$', 'i');

  function isPathValid(s) {
    if (typeof s != 'string')
      return false;
    s = s.replace(/\s/g, '');

    if (s == '')
      return true;

    if (s[0] == '.')
      return false;

    return pathRegExp.test(s);
  }

  function Path(s) {
    if (s.trim() == '')
      return this;

    if (isIndex(s)) {
      this.push(String(s));
      return this;
    }

    s.split(/\./).filter(function(part) {
      return part;
    }).forEach(function(part) {
      this.push(part);
    }, this);
  }

  Path.prototype = {
    __proto__: [],

    toString: function() {
      return this.join('.');
    },

    walkPropertiesFrom: function(val, f, that) {
      var caughtException;
      var prop;
      for (var i = 0; i < this.length + 1; i++) {
        prop = this[i];
        f.call(that, prop, val, i);

        if (isObject(val) && i < this.length && this[i] in val) {
          try {
            val = val[prop];
          } catch (ex) {
            val = undefined;
            caughtException = ex;
          }
        } else {
          val = undefined;
        }
      }
    }
  };

  /**
   * Callback looks like this
   *
  function callback(summaries) {
    summaries.forEach(function(summary) {
      summary.added;   // { prop => newValue }
      summary.removed; // { prop => newValue }
      summary.changed; // { prop => newValue }
      summary.splices; // [ Array of
                       //   {
                       //     index: [ Number ]
                       //     removed: [ Array of values ]
                       //     addedCount: [ Count ]
                       //   }
                       // ]

      summary.pathChanged; // { path => newValue }
      summary.getOldValue(propOrPath) = function() {};
    });
  }
  */

  function ChangeSummary(callback) {
    var observing = true;
    var isDisconnecting = false;
    var changesDelivered = false;
    var summaries;

    var internal = {};
    var objectTrackers = internal.objectTrackers = new Map;

    function getObjectTracker(obj) {
      var tracker = objectTrackers.get(obj);
      if (!tracker) {
        tracker = new ObjectTracker(internal, obj);
        objectTrackers.set(obj, tracker);
      }

      return tracker;
    }

    function removeObjectTracker(obj) {
      var tracker = objectTrackers.get(obj);
      tracker.destroy();
      objectTrackers.delete(obj);
    }

    internal.callback = function(records) {
      if (!records || !records.length) {
        console.error('Object.observe callback called with no records');
        return;
      }

      try {
        var activeTrackers = new Set;
        records.forEach(function(record) {
          var tracker = objectTrackers.get(record.object);
          tracker.addChangeRecord(record);
          activeTrackers.add(tracker);
        });

        internal.deliverSummaries(activeTrackers);

      } catch (ex) {
        console.error(ex);
      }
    };

    var MAX_DIRTY_CHECK_CYCLES = 1000;

    internal.dirtyCheck = function() {
      var cycles = 0;

      do {
        try {
          cycles++;
          internal.deliverSummaries(valueSet(objectTrackers));
        } catch (ex) {
          console.error(ex);
        }
      } while (changesDelivered && cycles < MAX_DIRTY_CHECK_CYCLES)
    }

    internal.deliverSummaries = function(activeTrackers) {
      summaries = [];

      activeTrackers.forEach(function(tracker) {
        tracker.process(activeTrackers);
      });

      activeTrackers.forEach(function(tracker) {
        var summary = tracker.produceSummary();
        if (summary)
          summaries.push(summary);
      });

      if (!summaries.length)
        summaries = undefined;

      if (isDisconnecting || !summaries) {
        changesDelivered = false;
        return;
      }

      callback(summaries);
      summaries = undefined;
      changesDelivered = true;
    }

    // Register callback to assign delivery order.
    if (hasObserve) {
      var register = {};
      Object.observe(register, internal.callback);
      Object.unobserve(register, internal.callback);
    }

    this.observeObject = function(obj) {
      if (!isObject(obj))
        throw Error('Invalid attempt to observe non-object: ' + obj);

      getObjectTracker(obj).observeObject = true;
    };

    this.unobserveObject = function(obj) {
      if (!isObject(obj))
        throw Error('Invalid attempt to unobserve non-object: ' + obj);

      var tracker = objectTrackers.get(obj);
      if (!tracker)
        return;

      tracker.observeObject = undefined;
      if (!tracker.observeArray && !tracker.propertyObserverCount)
        removeObjectTracker(obj);
    };

    this.observeArray = function(arr) {
      if (!Array.isArray(arr))
        throw Error('Invalid attempt to observe non-array: ' + arr);

      getObjectTracker(arr).observeArray = true;
    };

    this.unobserveArray = function(arr) {
      if (!Array.isArray(arr))
        return;

      var tracker = objectTrackers.get(arr);
      if (!tracker)
        return;

      tracker.observeArray = undefined;
      if (!tracker.observeObject && !tracker.propertyObserverCount)
        removeObjectTracker(arr);
    };

    // TODO(rafaelw): Notate and check all places where model values are retrieved and script may run.
    // TODO(rafaelw): Think about how things will react if observe/unobserve are called during processing.
    internal.observeProperty = function(obj, prop, pathValue) {
      getObjectTracker(obj).observeProperty(prop, pathValue);
    },

    internal.unobserveProperty = function(obj, prop, pathValue) {
      var tracker = objectTrackers.get(obj);
      if (!tracker)
        return;

      tracker.unobserveProperty(prop, pathValue);
      if (!tracker.propertyObserverCount && !tracker.observeArray && !tracker.observeObject)
        removeObjectTracker(obj);
    };

    this.observePath = function(obj, pathString) {
      if (!isPathValid(pathString))
        return undefined;

      var path = new Path(pathString);
      if (!path.length)
        return obj;

      if (!isObject(obj))
        return undefined;

      var tracker = getObjectTracker(obj);
      if (!tracker.pathValues)
        tracker.pathValues = {};

      var pathValue = tracker.pathValues[path.toString()];

      if (pathValue) {
        pathValue.reset();
      } else {
        pathValue = new PathValue(internal, obj, path);
        tracker.pathValues[path.toString()] = pathValue;
      }

      return pathValue.value;
    };

    this.unobservePath = function(obj, pathString) {
      if (!isPathValid(pathString))
        return;

      var path = new Path(pathString);
      if (!path.length)
        return;

      if (!isObject(obj))
        return;

      var tracker = objectTrackers.get(obj);
      if (!tracker || !tracker.pathValues)
        return;

      var pathValue = tracker.pathValues[path.toString()];
      if (!pathValue)
        return;

      tracker.pathValues[path.toString()] = undefined;
      pathValue.clear();
    };

    this.deliver = function() {
      if (hasObserve)
        Object.deliverChangeRecords(internal.callback);
      else
        internal.dirtyCheck();
    }

    this.disconnect = function() {
      if (!observing)
        return;
      isDisconnecting = true;
      this.deliver();
      isDisconnecting = false;

      objectTrackers.forEach(function(tracker, object) {
        tracker.endObservation();
      });

      observing = false;

      if (!summaries)
        return;
      var retval = summaries;
      summaries = undefined;
      return retval;
    };

    this.reconnect = function() {
      if (observing)
        return;

      objectTrackers.forEach(function(tracker) {
        tracker.startObservation();
      });

      observing = true;
    };
  }

  ChangeSummary.getValueAtPath = function(obj, pathString) {
    if (!isPathValid(pathString))
      return undefined;

    var path = new Path(pathString);
    if (!path.length)
      return obj;

    if (!isObject(obj))
      return;

    var retval;
    path.walkPropertiesFrom(obj, function(prop, value, i) {
      if (i == this.length)
        retval = value;
    }, path);

    return retval;
  }

  ChangeSummary.setValueAtPath = function(obj, pathString, value) {
    if (!isPathValid(pathString))
      return;

    var path = new Path(pathString);
    if (!path.length)
      return;

    if (!isObject(obj))
      return;

    path.walkPropertiesFrom(obj, function(prop, m, i) {
      if (isObject(m) && i == path.length - 1)
        m[prop] = value;
    });
  };

  function ObjectTracker(internal, object) {
    this.internal = internal;
    this.object = object;
    this.propertyObserverCount = 0;
    this.startObservation();
  }

  function copyObject(object) {
    var copy = Array.isArray(object) ? new Array(object.length) : {};
    for (var prop in object) {
      if (object.hasOwnProperty(prop))
        copy[prop] = object[prop];
    }
    return copy;
  }

  ObjectTracker.prototype = {
    startObservation: function() {
      if (hasObserve) {
        Object.observe(this.object, this.internal.callback);
        return;
      } else {
        this.oldObject = copyObject(this.object);
      }
    },

    endObservation: function() {
      if (hasObserve) {
        Object.unobserve(this.object, this.internal.callback);
        return;
      } else {
        this.oldObject = undefined;
      }
    },

    destroy: function() {
      this.endObservation();
      this.internal = undefined;
    },

    observeProperty: function(name, pathValue) {
      if (!this.propertyObservers)
        this.propertyObservers = {};

      var pathValueMap = this.propertyObservers[name];
      if (!pathValueMap) {
        pathValueMap = new Set;
        this.propertyObservers[name] = pathValueMap;
      }

      if (pathValueMap.has(pathValue))
        return;

      pathValueMap.add(pathValue);
      this.propertyObserverCount++;
    },

    unobserveProperty: function(name, pathValue) {
      if (!this.propertyObservers)
        return;

      var pathValueMap = this.propertyObservers[name];
      if (!pathValueMap)
        return;

      if (!pathValueMap.has(pathValue))
        return;

      pathValueMap.delete(pathValue);
      if (!pathValueMap.size)
        this.propertyObservers[name] = undefined;
      this.propertyObserverCount--;
    },

    addChangeRecord: function(changeRecord) {
      if (!this.changeRecords)
        this.changeRecords = [];

      this.changeRecords.push(changeRecord);
    },

    process: function(activeTrackers) {
      if (!this.internal)  // observation stopped mid-process. TODO(rafaelw): Is this really possible?
        return;

      var diff;
      if (hasObserve) {
        diff = diffObjectFromChangeRecords(this.object, this.changeRecords);
        this.changeRecords = undefined;
      } else {
        diff = diffObjectFromOldObject(this.object, this.oldObject);
        this.oldObject = copyObject(this.object);
      }

      this.diff = diff;

      if (this.observeArray)
        diff.splices = projectArraySplices(this.object, diff);

      if (!this.propertyObservers)
        return;

      this.addDirtyPathValues(Object.keys(diff.added), activeTrackers);
      this.addDirtyPathValues(Object.keys(diff.removed), activeTrackers);
      this.addDirtyPathValues(Object.keys(diff.changed), activeTrackers);
    },

    addDirtyPathValues: function(props, activeTrackers) {
      for (var i = 0; i < props.length; i++) {
        var pathValues = this.propertyObservers[props[i]];
        if (!pathValues)
          continue;

        pathValues.forEach(function(pathValue) {
          var observed = pathValue.observed[0];
          var tracker = this.internal.objectTrackers.get(observed);
          if (!tracker.dirtyPathValues)
            tracker.dirtyPathValues = new Set;
          tracker.dirtyPathValues.add(pathValue);
          activeTrackers.add(tracker)
        }, this);
      }
    },

    produceSummary: function() {
      var diff = this.diff || { added: {}, removed: {}, changed: {}, oldValues: {} }; // TODO(rafaelw): SLOW?
      this.diff = undefined;
      var oldValues = diff.oldValues;
      diff.oldValues = undefined;

      var objectChanges = false;
      if (this.observeObject) {
        // TODO(rafaelw): Slow
        objectChanges = Object.keys(diff.added).length ||
                        Object.keys(diff.removed).length ||
                        Object.keys(diff.changed).length;
      }

      var spliceChanges = this.observeArray && diff.splices.length;

      var pathChanges = false;
      if (this.dirtyPathValues) {
        var dirtyPathValues = this.dirtyPathValues;
        this.dirtyPathValues = undefined;

        diff.pathChanged = {};
        dirtyPathValues.forEach(function(pathValue) {
          var oldValue = pathValue.value;
          if (pathValue.reset()) {
            var pathString = pathValue.path.toString();
            oldValues[pathString] = oldValue;
            diff.pathChanged[pathString] = pathValue.value;
          }
        }, this);

        pathChanges = !!Object.keys(diff.pathChanged).length;
      }

      if (!objectChanges && !spliceChanges && !pathChanges)
        return;

      var summary = {
        object: this.object
      };

      var getOldValue = function(propOrPath) {
        return oldValues[propOrPath];
      };

      if (objectChanges) {
        summary.added = diff.added;
        summary.removed = diff.removed;
        summary.changed = diff.changed;
        summary.getOldValue = getOldValue;
      }

      if (spliceChanges)
        summary.splices = diff.splices;

      if (pathChanges) {
        summary.pathChanged = diff.pathChanged;
        summary.getOldValue = getOldValue;
      }

      return summary;
    }
  };

  function PathValue(internal, object, path) {
    this.path = path;
    this.observed = new Array(path.length - 1);

    var self = this;

    this.reset = function() {
      var changed = false;
      self.path.walkPropertiesFrom(object, function(prop, value, i) {
        if (i == this.path.length) {
          if (this.value === value)
            return;

          changed = true;
          this.value = value;
          return;
        }

        var observed = this.observed[i];
        if (value === observed)
          return;

        if (observed !== undefined) {
          internal.unobserveProperty(observed, prop, this);
          this.observed[i] = observed = undefined;
        }

        if (!isObject(value))
          return;

        this.observed[i] = observed = value;
        internal.observeProperty(observed, prop, this);
      }, self);

      return changed;
    };

    this.clear = function() {
      object = undefined;
      self.reset();
    };

    this.reset();
  }

  var knownRecordTypes = {
    'new': true,
    'updated': true,
    'deleted': true
  };

  function diffObjectFromOldObject(object, oldObject) {
    var added = {};
    var removed = {};
    var changed = {};

    for (var prop in oldObject) {
      if (!object.hasOwnProperty(prop)) {
        removed[prop] = undefined;
        continue;
      }

      var newValue = object[prop];
      if (newValue !== oldObject[prop])
        changed[prop] = newValue;
    }

    for (var prop in object) {
      if (object.hasOwnProperty(prop) && !oldObject.hasOwnProperty(prop))
        added[prop] = object[prop];
    }

    if (Array.isArray(object) && object.length !== oldObject.length)
      changed.length = object.length;

    return {
      added: added,
      removed: removed,
      changed: changed,
      oldValues: oldObject
    };
  }

  function diffObjectFromChangeRecords(object, changeRecords) {
    var added = {};
    var removed = {};
    var oldValues = {};

    for (var i = 0; i < changeRecords.length; i++) {
      var record = changeRecords[i];
      if (!knownRecordTypes[record.type]) {
        console.error('Unknown changeRecord type: ' + record.type);
        console.error(record);
        continue;
      }

      if (!(record.name in oldValues))
        oldValues[record.name] = record.oldValue;

      if (record.type == 'updated')
        continue;

      if (record.type == 'new') {
        if (record.name in removed)
          delete removed[record.name];
        else
          added[record.name] = true;

        continue;
      }

      // type = 'deleted'
      if (record.name in added) {
        delete added[record.name];
        delete oldValues[record.name];
      } else {
        removed[record.name] = true;
      }
    }

    for (var prop in added)
      added[prop] = object[prop];

    for (var prop in removed)
      removed[prop] = undefined;

    var changed = {};
    for (var prop in oldValues) {
      if (added.hasOwnProperty(prop) || removed.hasOwnProperty(prop))
        continue;

      var newValue = object[prop];
      if (oldValues[prop] !== newValue)
        changed[prop] = newValue;
    }

    return {
      added: added,
      removed: removed,
      changed: changed,
      oldValues: oldValues
    };
  }

  /**
   * Splice Projection functions:
   *
   * A splice map is a representation of how a previous array of items
   * was transformed into a new array of items. Conceptually it is a list of
   * tuples of
   *
   *   <index, removed, addedCount>
   *
   * which are kept in ascending index order of. The tuple represents that at
   * the |index|, |removed| sequence of items were removed, and counting forward
   * from |index|, |addedCount| items were added.
   */

  /**
   * Lacking individual splice mutation information, the minimal set of
   * splices can be synthesized given the previous state and final state of an
   * array. The basic approach is to calculate the edit distance matrix and
   * choose the shortest path through it.
   *
   * Complexity: O(l * p)
   *   l: The length of the current array
   *   p: The length of the old array
   */
  function calcSplices(current, currentIndex, currentLength, old) {
    var LEAVE = 0;
    var UPDATE = 1;
    var ADD = 2;
    var DELETE = 3;

    function newSplice(index, removed, addedCount) {
      return {
        index: index,
        removed: Array.prototype.slice.apply(removed),
        addedCount: addedCount
      };
    }

    // Note: This function is *based* on the computation of the Levenshtein
    // "edit" distance. The one change is that "updates" are treated as two
    // edits - not one. With Array splices, an update is really a delete
    // followed by an add. By retaining this, we optimize for "keeping" the
    // maximum array items in the original array. For example:
    //
    //   'xxxx123' -> '123yyyy'
    //
    // With 1-edit updates, the shortest path would be just to update all seven
    // characters. With 2-edit updates, we delete 4, leave 3, and add 4. This
    // leaves the substring '123' intact.
    function calcEditDistances(current, currentIndex, currentLength, old) {
      // "Deletion" columns
      var distances = new Array(old.length + 1);

      // "Addition" rows. Initialize null column.
      for (var i = 0; i < distances.length; i++) {
        distances[i] = new Array(currentLength + 1)
        distances[i][0] = i;
      }

      // Initialize null row
      for (var j = 0; j < distances[0].length; j++) {
        distances[0][j] = j;
      }

      for (var i = 1; i < distances.length; i++) {
        for (var j = 1; j < distances[i].length; j++) {
          if (old[i - 1] === current[currentIndex + j - 1])
            distances[i][j] = distances[i - 1][j - 1];
          else
            distances[i][j] = Math.min(distances[i - 1][j] + 1,      // 1 Edit
                                       distances[i][j - 1] + 1,      // 1 Edit
                                       distances[i - 1][j - 1] + 2); // 2 Edits
        }
      }

      return distances;
    }

    // This starts at the final weight, and walks "backward" by finding
    // the minimum previous weight recursively until the origin of the weight
    // matrix.
    function operations(distances) {
      var i = distances.length - 1;
      var j = distances[0].length - 1;
      var last = distances[i][j];
      var edits = [];
      while (i > 0 || j > 0) {
        if (i == 0) {
          edits.push(ADD);
          j--;
          continue;
        }
        if (j == 0) {
          edits.push(DELETE);
          i--;
          continue;
        }
        var updateOrNoop = distances[i - 1][j - 1];
        var deletion = distances[i - 1][j];
        var addition = distances[i][j - 1];

        var min = Math.min(updateOrNoop, deletion, addition);
        if (min == updateOrNoop) {
          if (updateOrNoop == last) {
            edits.push(LEAVE);
          } else {
            edits.push(UPDATE);
            last = updateOrNoop;
          }
          i--;
          j--;
        } else if (min == deletion) {
          edits.push(DELETE);
          i--;
          last = deletion;
        } else {
          edits.push(ADD);
          j--;
          last = addition;
        }
      }

      edits.reverse();
      return edits;
    }

    var ops = operations(calcEditDistances(current,
                                           currentIndex,
                                           currentLength,
                                           old));

    var splice = undefined;
    var splices = [];
    var index = 0;
    var oldIndex = 0;
    for (var i = 0; i < ops.length; i++) {
      switch(ops[i]) {
        case LEAVE:
          if (splice) {
            splices.push(splice);
            splice = undefined;
          }

          index++;
          oldIndex++;
          break;
        case UPDATE:
          if (!splice)
            splice = newSplice(currentIndex + index, [], 0);

          splice.addedCount++;
          index++;

          splice.removed.push(old[oldIndex]);
          oldIndex++;
          break;
        case ADD:
          if (!splice)
            splice = newSplice(currentIndex + index, [], 0);

          splice.addedCount++;
          index++;
          break;
        case DELETE:
          if (!splice)
            splice = newSplice(currentIndex + index, [], 0);

          splice.removed.push(old[oldIndex]);
          oldIndex++;
          break;
      }
    }

    if (splice) {
      splices.push(splice);
    }

    return splices;
  }

  function createInitialSplicesFromDiff(array, diff) {
    var oldLength = 'length' in diff.oldValues ? toNumber(diff.oldValues.length) : array.length;

    var lengthChangeSplice;
    if (array.length > oldLength) {
      lengthChangeSplice = {
        index: oldLength,
        removed: [],
        addedCount: array.length - oldLength
      };
    } else if (array.length < oldLength) {
      lengthChangeSplice = {
        index: array.length,
        removed: new Array(oldLength - array.length),
        addedCount: 0
      };
    }

    var indicesChanged = [];
    function addProperties(properties, oldValues) {
      Object.keys(properties).forEach(function(prop) {
        var index = toNumber(prop);
        if (isNaN(index) || index < 0 || index >= oldLength)
          return;

        var oldValue = oldValues[index];
        if (index < array.length)
          indicesChanged[index] = oldValue;
        else
          lengthChangeSplice.removed[index - array.length] = diff.oldValues[index];
      });
    }

    addProperties(diff.added, diff.oldValues);
    addProperties(diff.removed, diff.oldValues);
    addProperties(diff.changed, diff.oldValues);

    var splices = [];
    var current;

    for (var index in indicesChanged) {
      index = toNumber(index);

      if (current) {
        if (current.index + current.removed.length == index) {
          current.removed.push(indicesChanged[index]);
          continue;
        }

        current.addedCount = Math.min(array.length, current.index + current.removed.length) - current.index;
        splices.push(current);
        current = undefined;
      }

      current = {
        index: index,
        removed: [indicesChanged[index]]
      }
    }

    if (current) {
      current.addedCount = Math.min(array.length, current.index + current.removed.length) - current.index;

      if (lengthChangeSplice) {
        if (current.index + current.removed.length == lengthChangeSplice.index) {
          // Join splices
          current.addedCount = current.addedCount + lengthChangeSplice.addedCount;
          current.removed = current.removed.concat(lengthChangeSplice.removed);
          splices.push(current);
        } else {
          splices.push(current);
          splices.push(lengthChangeSplice);
        }
      } else {
        splices.push(current)
      }
    } else if (lengthChangeSplice) {
      splices.push(lengthChangeSplice);
    }

    return splices;
  }

  function projectArraySplices(array, diff) {
    var splices = [];

    createInitialSplicesFromDiff(array, diff).forEach(function(splice) {
      splices = splices.concat(calcSplices(array, splice.index, splice.addedCount, splice.removed));
    });

    return splices;
  }

  global.ChangeSummary = ChangeSummary;

  function CallbackRouter() {

    var callbacksMap = typeof WeakMap == 'function' ? new WeakMap : new Map;

    function invokeCallbacks(summary) {
      var callbacks = callbacksMap.get(summary.object);
      if (!callbacks)
        return;

      if (callbacks.object && (summary.added || summary.removed || summary.changed)) {
        callbacks.object.forEach(function(callback) {
          try {
            callback(summary.added, summary.removed, summary.changed, summary.getOldValue, summary.object);
          } catch (ex) {
            console.log('Exception thrown during callback: ' + ex);
          }
        });
      }

      if (callbacks.array && summary.splices) {
        callbacks.array.forEach(function(callback) {
          try {
            callback(summary.splices, summary.object);
          } catch (ex) {
            console.log('Exception thrown during callback: ' + ex);
          }
        });
      }

      if (callbacks.path && summary.pathChanged) {
        Object.keys(callbacks.path).forEach(function(path) {
          if (!summary.pathChanged.hasOwnProperty(path))
            return;

          callbacks.path[path].forEach(function(callback) {
            try {
              callback(summary.pathChanged[path], summary.getOldValue(path), summary.object, path);
            } catch (ex) {
              console.log('Exception thrown during callback: ' + ex);
            }
          });
        });
      }
    }

    var observer = new ChangeSummary(function(summaries) {
      summaries.forEach(invokeCallbacks);
    });

    this.observeObject = function(object, callback) {
      var callbacks = callbacksMap.get(object)
      if (!callbacks) {
        callbacks = {};
        callbacksMap.set(object, callbacks);
      }
      if (!callbacks.object) {
        callbacks.object = new Set;
        observer.observeObject(object);
      }

      callbacks.object.add(callback);
    };

    this.unobserveObject = function(object, callback) {
      var callbacks = callbacksMap.get(object)
      if (!callbacks || !callbacks.object)
        return;

      callbacks.object.delete(callback)

      if (!callbacks.object.size) {
        observe.unobserveArray(object);
        callbacks.object = undefined;
      }

      if (!callbacks.object && !callbacks.array && !callbacks.path)
        callbacksMap.delete(object);
    };

    this.observeArray = function(array, callback) {
      if (!Array.isArray(array))
        throw Error('Invalid attempt to observe non-array: ' + arr);

      var callbacks = callbacksMap.get(array)
      if (!callbacks) {
        callbacks = {};
        callbacksMap.set(array, callbacks);
      }
      if (!callbacks.array) {
        callbacks.array = new Set;
        observer.observeArray(array);
      }

      callbacks.array.add(callback);
    };

    this.unobserveArray = function(array, callback) {
      if (!Array.isArray(array))
        return;

      var callbacks = callbacksMap.get(array)
      if (!callbacks || !callbacks.array)
        return;

      callbacks.array.delete(callback)

      if (!callbacks.array.size) {
        observe.unobserveArray(array);
        callbacks.array = undefined;
      }

      if (!callbacks.object && !callbacks.array && !callbacks.path)
        callbacksMap.delete(array);
    };

    this.observePath = function(object, path, callback) {
      if (!isPathValid(path))
        return undefined;

      if (path.trim() == '')
        return object;

      if (!isObject(object))
        return undefined;

      var callbacks = callbacksMap.get(object)
      if (!callbacks) {
        callbacks = {};
        callbacksMap.set(object, callbacks);
      }

      if (!callbacks.path)
        callbacks.path = {};

      var pathCallbacks = callbacks.path[path];
      var retval;
      if (!pathCallbacks) {
        pathCallbacks = new Set;
        callbacks.path[path] = pathCallbacks;
        retval = observer.observePath(object, path);
      } else {
        retval = Model.getValueAtPath(object, path);
      }

      pathCallbacks.add(callback);
      return retval;
    };

    this.unobservePath = function(object, path, callback) {
      if (!isPathValid(path) || !isObject(object))
        return;

      var callbacks = callbacksMap.get(object)
      if (!callbacks || !callbacks.path)
        return;

      var pathCallbacks = callbacks.path[path];
      if (!pathCallbacks)
        return;

      pathCallbacks.delete(callback);

      if (!pathCallbacks.size) {
        observer.unobservePath(object, path);
        delete callbacks.path[path];
      }

      if (!Object.keys(callbacks.path).length)
        callbacks.path = undefined;

      if (!callbacks.object && !callbacks.array && !callbacks.path)
        callbacksMap.delete(object);
    };

    this.deliver = observer.deliver.bind(observer);
  }

  global.ChangeSummary.CallbackRouter = CallbackRouter;
})(this);
