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

  var numberIsNaN = global.Number.isNaN || function isNaN(value) {
    return typeof value === 'number' && global.isNaN(value);
  }

  function areSameValue(left, right) {
    if (left === right)
      return left !== 0 || 1 / left === 1 / right;
    if (numberIsNaN(left) && numberIsNaN(right))
      return true;

    return left !== left && right !== right;
  }

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

    Map.getValueSet = function(map) {
      var set = new Set;
      map.forEach(function(value, key) {
        set.add(value);
      })
      return set;
    }
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

    Map.getValueSet = function(map) {
      var set = new Set;
      set.keys_ = map.values_.slice();
      return set;
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

  Path.prototype = createObject({
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

        if (i == this.length || val === null || val === undefined)
          val = undefined;
        else
          val = val[prop];
      }
    }
  });

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

  var MAX_DIRTY_CHECK_CYCLES = 1000;

  function ChangeSummary(externalCallback) {
    var observing = true;
    var isDisconnecting = false;
    var isDelivering = false;
    var changesDelivered = false;
    var summaries;

    var internal = {

      objectObservers: new Map,

      getObjectObserver: function(obj) {
        return this.objectObservers.get(obj);
      },

      getOrCreateObjectObserver: function(obj) {
        var observer = this.objectObservers.get(obj);
        if (!observer) {
          observer = new ObjectObserver(this, obj);
          this.objectObservers.set(obj, observer);
        }

        return observer;
      },

      removeObjectObserver: function(obj) {
        this.objectObservers.delete(obj);
      },

      addPathTracker: function(obj, pathTracker) {
        this.getOrCreateObjectObserver(obj).addPathTracker(pathTracker);
      },

      removePathTracker: function(obj, pathTracker) {
        this.getObjectObserver(obj).removePathTracker(pathTracker);
      },

      connect: function() {
        this.objectObservers.forEach(function(observer) {
          observer.connect();
        });
      },

      disconnect: function() {
        this.objectObservers.forEach(function(observer, object) {
          observer.disconnect();
        });
      },

      internalCallback: function(records) {
        if (!records || !records.length) {
          console.error('Object.observe callback called with no records');
          return;
        }

        try {
          if (!isDelivering)
            this.activeObservers = new Set;

          var changedObject;
          var observer;
          for (var i = 0; i < records.length; i++) {
            var record = records[i];
            if (changedObject !== record.object) {
              changedObject = record.object;
              observer = this.getObjectObserver(changedObject);
              if (!observer) {
                changedObject = undefined;
                continue;
              }

              this.activeObservers.add(observer);
            }

            observer.addChangeRecord(record);
          }

          if (isDelivering)
            return;

          isDelivering = true;
          this.deliverSummaries();
          isDelivering = false;

        } catch (ex) {
          console.error(ex);
        }
      },

      dirtyCheck: function() {
        var cycles = 0;

        do {
          try {
            cycles++;
            this.activeObservers = Map.getValueSet(this.objectObservers);
            this.deliverSummaries();
          } catch (ex) {
            console.error(ex);
          }
        } while (changesDelivered && cycles < MAX_DIRTY_CHECK_CYCLES)
      },

      deliverSummaries: function() {
        summaries = [];

        this.activeObservers.forEach(function(observer) {
          observer.checkPathValues();
        });

        this.activeObservers.forEach(function(observer) {
          observer.checkObjectsAndArrays();
        });

        this.activeObservers.forEach(function(observer) {
          var summary = observer.produceSummary();
          observer.reset();
          if (summary)
            summaries.push(summary);
        });

        this.activeObservers = undefined;

        if (!summaries.length)
          summaries = undefined;

        if (isDisconnecting || !summaries) {
          changesDelivered = false;
          return;
        }

        externalCallback(summaries);
        summaries = undefined;
        changesDelivered = true;
      }
    };

    internal.callback = internal.internalCallback.bind(internal);

    // Register callback to assign delivery order.
    if (hasObserve) {
      var register = {};
      Object.observe(register, internal.callback);
      Object.unobserve(register, internal.callback);
    }

    this.observeObject = function(obj) {
      if (!isObject(obj))
        throw Error('Invalid attempt to observe non-object: ' + obj);

      internal.getOrCreateObjectObserver(obj).observeObject();
    };

    this.unobserveObject = function(obj) {
      if (!isObject(obj))
        throw Error('Invalid attempt to unobserve non-object: ' + obj);

      var observer = internal.getObjectObserver(obj);
      if (!observer)
        return;

      observer.unobserveObject();
    };

    this.observeArray = function(arr) {
      if (!Array.isArray(arr))
        throw Error('Invalid attempt to observe non-array: ' + arr);

      internal.getOrCreateObjectObserver(arr).observeArray();
    };

    this.unobserveArray = function(arr) {
      if (!Array.isArray(arr))
        return;

      var observer = internal.getObjectObserver(arr);
      if (!observer)
        return;

      observer.unobserveArray();
    };

    this.observePath = function(obj, pathString) {
      if (!isPathValid(pathString))
        return undefined;

      var path = new Path(pathString);
      if (!path.length)
        return obj;

      if (!isObject(obj))
        return undefined;

      var pathTracker = internal.getOrCreateObjectObserver(obj).observePath(path);
      return pathTracker.value;
    };

    this.unobservePath = function(obj, pathString) {
      if (!isPathValid(pathString))
        return;

      var path = new Path(pathString);
      if (!path.length)
        return;

      if (!isObject(obj))
        return;

      var observer = internal.getObjectObserver(obj)
      if (!observer)
        return;

      observer.unobservePath(path);
    };

    this.deliver = function() {
      if (!observing)
        throw Error('Disconnected');

      if (hasObserve)
        Object.deliverChangeRecords(internal.callback);
      else
        internal.dirtyCheck();
    };

    this.disconnect = function() {
      if (!observing)
        return;
      isDisconnecting = true;
      this.deliver();
      isDisconnecting = false;

      internal.disconnect();

      observing = false;

      if (!summaries)
        return;
      var retval = summaries;
      summaries = undefined;
      return retval;
    };

    this.connect = function() {
      if (observing)
        return;

      internal.connect();

      observing = true;
    };
  }

  function newCompiledGetValueAtPath(path) {
    var str = '';
    var partStr = 'obj';
    var length = path.length;
    str += 'if (obj'
    for (var i = 0; i < (length - 1); i++) {
      var part = '["' + path[i] + '"]';
      partStr += part;
      str += ' && ' + partStr;
    }
    str += ') ';

    partStr += '["' + path[length - 1] + '"]';

    str += 'return ' + partStr + '; else return undefined;';
    return new Function('obj', str);
  }

  var compiledGettersCache = {};

  function compiledGetValueAtPath(object, path) {
    var pathString = path.toString();
    if (!compiledGettersCache[pathString])
      compiledGettersCache[pathString] = newCompiledGetValueAtPath(path);

    return compiledGettersCache[pathString](object);
  }

  function internalGetValueAtPath(object, path) {
    var newValue;
    path.walkPropertiesFrom(object, function(prop, value, i) {
      if (i === path.length)
        newValue = value;
    });

    return newValue;
  }

  ChangeSummary.getValueAtPath = function(obj, pathString) {
    if (!isPathValid(pathString))
      return undefined;

    var path = new Path(pathString);
    if (!path.length)
      return obj;

    if (!isObject(obj))
      return;

    if (hasEval)
      return compiledGetValueAtPath(obj, path);
    else
      return internalGetValueAtPath(obj, path);
  }

  function internalSetValueAtPath(obj, path, value) {
    var changed = false;

    path.walkPropertiesFrom(obj, function(prop, m, i) {
      if (isObject(m) && i == path.length - 1) {
        changed = true;
        m[prop] = value;
      }
    });

    return changed;
  }

  ChangeSummary.setValueAtPath = function(obj, pathString, value) {
    if (!isPathValid(pathString))
      return;

    var path = new Path(pathString);
    if (!path.length)
      return;

    if (!isObject(obj))
      return;

    internalSetValueAtPath(obj, path, value);
  };

  ChangeSummary.applySplices = function(previous, current, splices) {
    splices.forEach(function(splice) {
      var spliceArgs = [splice.index, splice.removed.length];
      var addIndex = splice.index;
      while (addIndex < splice.index + splice.addedCount) {
        spliceArgs.push(current[addIndex]);
        addIndex++;
      }

      Array.prototype.splice.apply(previous, spliceArgs);
    });
  };

  function objectIsEmpty(object) {
    for (var prop in object)
      return false;
    return true;
  }

  function diffIsEmpty(diff) {
    return objectIsEmpty(diff.added) &&
           objectIsEmpty(diff.removed) &&
           objectIsEmpty(diff.changed);
  }

  function diffObjectFromOldObject(object, oldObject) {
    var added = {};
    var removed = {};
    var changed = {};
    var oldObjectHas = {};

    for (var prop in oldObject) {
      var newValue = object[prop];

      if (newValue !== undefined && newValue === oldObject[prop])
        continue;

      if (!(prop in object)) {
        removed[prop] = undefined;
        continue;
      }

      if (newValue !== oldObject[prop])
        changed[prop] = newValue;
    }

    for (var prop in object) {
      if (prop in oldObject)
        continue;

      added[prop] = object[prop];
    }

    if (Array.isArray(object) && object.length !== oldObject.length)
      changed.length = object.length;

    return {
      added: added,
      removed: removed,
      changed: changed
    };
  }

  function copyObject(object, opt_copy) {
    var copy = opt_copy || (Array.isArray(object) ? [] : {});
    for (var prop in object) {
      copy[prop] = object[prop];
    };
    if (Array.isArray(object))
      copy.length = object.length;
    return copy;
  }

  function ObjectTracker(object) {
    this.object = object;
    this.changed = false;
    this.diff = undefined;
    this.oldValues = undefined;

    this.reset(true);
  }

  ObjectTracker.prototype = {
    check: function(changeRecords) {
      var diff;
      var oldValues;
      if (hasObserve) {
        if (!changeRecords)
          return false;

        oldValues = {};
        diff = diffObjectFromChangeRecords(this.object, changeRecords, oldValues);
      } else {
        oldValues = this.oldObject;
        diff = diffObjectFromOldObject(this.object, this.oldObject);
      }

      if (diffIsEmpty(diff))
        return false;

      this.diff = diff;
      this.oldValues = oldValues;
      this.changed = true;
      return true;
    },

    summarize: function(summary, oldValues) {
      summary.added = this.changed ? this.diff.added : {};
      summary.removed = this.changed ? this.diff.removed : {};
      summary.changed = this.changed ? this.diff.changed : {};

      copyObject(this.oldValues, oldValues);
    },

    reset: function(force) {
      if (!hasObserve && (force || this.diff))
        this.oldObject = copyObject(this.object);
      this.changed = false;
      this.diff = undefined;
      this.oldValues = undefined;
    }
  }

  function ArrayTracker(array) {
    this.array = array;
    this.changed = false;
    this.splices = undefined;
    this.reset(true);
  }

/*
  function splicesFromChangeRecords(array, changeRecords) {
    var lengthFound = false;
    var oldValues = [];
    var indices = [];
    var added = [];
    var updated = [];

    for (var i = 0; i < changeRecords.length; i++) {
      var record = changeRecords[i];

      if (!knownRecordTypes[record.type]) {
        console.error('Unknown changeRecord type: ' + record.type);
        console.error(record);
        continue;
      }

      if (!lengthFound && record.name == 'length') {
        oldValues.length = toNumber(record.oldValue);
        continue;
      }

      var index = toNumber(record.name);
      if (isNaN(index) || index < 0 ||
          index >= array.length ||
          (lengthFound && index >= oldValues.length));
        continue;

      if (!updated[index] &&
           (record.type === 'updated' || (record.type === 'deleted' && !added[index]))) {
        updated[index] = true;
        oldValues[index] = record.oldValue;
        indices.push(index);
        continue;
      }

      if (record.type === 'deleted' && addded[index])
        added[index] = false;
      else if (record.type === 'new' && !updated[index])
        added[index] = true;
    }
  }*/

  ArrayTracker.prototype = {
    check: function(changeRecords) {
      var splices;
      if (hasObserve) {
        if (!changeRecords)
          return false;

        var oldValues = {};
        var diff = diffObjectFromChangeRecords(this.array, changeRecords, oldValues);
        splices = projectArraySplices(this.array, diff, oldValues);
      } else {
        splices = calcSplices(this.array, 0, this.array.length,
                              this.oldArray, 0, this.oldArray.length);
      }

      if (!splices.length)
        return false;

      this.splices = splices;
      this.changed = true;
      return true;
    },

    summarize: function(summary) {
      summary.splices = this.splices ? this.splices : [];
    },

    reset: function(force) {
      if (!hasObserve && (force || this.splices))
        this.oldArray = this.array.slice();
      this.changed = false;
      this.splices = undefined;
    }
  }

  function PathTracker(object, path, pathString, internal) {
    this.object = object;
    this.path = path;
    this.pathString = pathString;
    this.observed = path.length > 1 ? new Array(path.length - 2) : undefined;
    this.changed = false;
    this.oldValue = undefined;

    this.internal = internal;

    this.reset(true);
  }

  var hasEval = false;
  try {
    var f = new Function('', 'return true;');
    hasEval = f();
  } catch (ex) {
  }

  var pathTrackerCheck;

  if (hasObserve) {
    pathTrackerCheck = function(initial) {
      var newValue;
      this.path.walkPropertiesFrom(this.object, function(prop, value, i) {
        if (i === this.path.length) {
          newValue = value;
          return;
        }

        if (i === 0)
          return;

        var observed = this.observed[i - 1];
        if (value === observed)
          return;

        if (observed !== undefined) {
          this.observed[i - 1] = observed = undefined;
          var stillObserving = false;
          for (var j = 0; j < this.observed.length; j++) {
            if (this.observed[j] === observed) {
              stillObserving = true;
              break;
            }
          }

          if (!stillObserving)
            this.internal.removePathTracker(observed, this);
        }

        if (!isObject(value))
          return;

        this.observed[i - 1] = observed = value;
        this.internal.addPathTracker(observed, this);
      }, this);

      return this.valueMaybeChanged(newValue, initial);
    };
  } else if (hasEval) {
    pathTrackerCheck = function(initial) {
      if (!this.checkFunc) {
        this.checkFunc = newCompiledGetValueAtPath(this.path);
      }

      return this.valueMaybeChanged(this.checkFunc(this.object), initial);
    };

  } else {
    pathTrackerCheck = function(initial) {
      var newValue = internalGetValueAtPath(this.object, this.path);
      return this.valueMaybeChanged(newValue, initial);
    };
  }

  PathTracker.prototype = {
    check: pathTrackerCheck,

    valueMaybeChanged: function(newValue, initial) {
      if (initial) {
        this.value = newValue;
      } else if (!this.changed) {
        if (!areSameValue(this.value, newValue)) {
          this.oldValue = this.value;
          this.value = newValue;
          this.changed = true;
        }
      } else {
        this.value = newValue;
        if (areSameValue(this.value, this.oldValue)) {
          this.changed = false;
          this.oldValue = undefined;
        }
      }

      return this.changed;
    },

    summarize: function(summary, oldValues) {
      summary.pathChanged[this.pathString] = this.value;
      oldValues[this.pathString] = this.oldValue;
    },

    reset: function(force) {
      if (force)
        this.check(true);
      this.oldValue = undefined;
      this.changed = false;
    },

    destroy: function() {
      this.object = undefined;
      this.reset(true);
    }
  }

  function ObjectObserver(internal, object) {
    this.internal = internal;
    this.object = object;
    this.objectTracker = undefined;
    this.arrayTracker = undefined;
    this.pathTrackers = undefined;
    this.pathTrackerMap = undefined;
    this.changeRecords = undefined;
    this.dirtyPathTrackers = undefined;

    this.connect();
  }

  ObjectObserver.prototype = {
    observeObject: function() {
      this.objectTracker = this.objectTracker || new ObjectTracker(this.object);
    },

    unobserveObject: function() {
      this.objectTracker = undefined;
      this.destroyIfEmpty();
    },

    observeArray: function() {
      this.arrayTracker = this.arrayTracker || new ArrayTracker(this.object);
    },

    unobserveArray: function() {
      this.arrayTracker = undefined;
      this.destroyIfEmpty();
    },

    addPathTracker: function(pathTracker, opt_pathString) {
      if (!this.pathTrackers) {
        this.pathTrackers = [];
        this.pathTrackerMap = {};
      }

      if (opt_pathString)
        this.pathTrackerMap[opt_pathString] = pathTracker;

      this.pathTrackers.push(pathTracker);
    },

    removePathTracker: function(pathTracker) {
      if (!this.pathTrackers)
        return;

      this.pathTrackers.splice(this.pathTrackers.indexOf(pathTracker), 1);
      if (!this.pathTrackers.length)
        this.pathTrackers = undefined;

      this.destroyIfEmpty();
    },

    observePath: function(path) {
      var pathTracker;
      var pathString = path.toString();
      if (this.pathTrackers && this.pathTrackerMap)
        pathTracker = this.pathTrackerMap[pathString];

      if (pathTracker) {
        pathTracker.check();
      } else {
        pathTracker = new PathTracker(this.object, path, pathString, this.internal);
        this.addPathTracker(pathTracker, pathString);
      }

      return pathTracker;
    },

    unobservePath: function(path) {
      if (!this.pathTrackerMap)
        return;

      var pathString = path.toString();
      var pathTracker = this.pathTrackerMap[pathString];
      if (!pathTracker)
        return;

      pathTracker.destroy();

      delete this.pathTrackerMap[pathString];
      if (!Object.keys(this.pathTrackerMap).length)
        this.pathTrackerMap = undefined;

      this.pathTrackers.splice(this.pathTrackers.indexOf(pathTracker), 1);
      if (!this.pathTrackers.length)
        this.pathTrackers = undefined;

      this.destroyIfEmpty();
    },

    connect: function() {
      if (hasObserve)
        Object.observe(this.object, this.internal.callback);
      this.reset(true);
    },

    disconnect: function() {
      if (hasObserve)
        Object.unobserve(this.object, this.internal.callback);
    },

    destroyIfEmpty: function() {
      if (this.objectTracker ||
          this.arrayTracker ||
          this.pathTrackers)
        return;

      this.internal.removeObjectObserver(this.object);
      this.destroy();
    },

    destroy: function() {
      this.disconnect();
      this.internal = undefined;
    },

    addChangeRecord: function(changeRecord) {
      if (!this.changeRecords)
        this.changeRecords = [];

      this.changeRecords.push(changeRecord);
    },

    checkPathValues: function(changeRecords) {
      if (!this.internal)
        return;

      if (!this.pathTrackers)
        return;

      for (var i = 0; i < this.pathTrackers.length; i++) {
        var pathTracker = this.pathTrackers[i];
        if (pathTracker.check()) {
          var isThis = this.object === pathTracker.object;
          var observer = isThis ? this : this.internal.getOrCreateObjectObserver(pathTracker.object);
          observer.addDirtyPath(pathTracker);
          if (!isThis)
            this.internal.activeObservers.add(observer);
        }
      }
    },

    checkObjectsAndArrays: function() {
      if (!this.internal)
        return;

      if (this.objectTracker)
        this.objectTracker.check(this.changeRecords);
      if (this.arrayTracker)
        this.arrayTracker.check(this.changeRecords);
    },

    addDirtyPath: function(pathTracker) {
      if (!this.dirtyPathTrackers)
        this.dirtyPathTrackers = new Set;
      this.dirtyPathTrackers.add(pathTracker);
    },

    produceSummary: function() {
      if ((!this.objectTracker || !this.objectTracker.changed) &&
          (!this.arrayTracker || !this.arrayTracker.changed) &&
          (!this.dirtyPathTrackers))
        return;

      var oldValues;
      var summary = {
        object: this.object
      };
      if (this.objectTracker || this.pathTrackerMap) {
        oldValues = {};
        summary.getOldValue = function(propOrPath) {
          return oldValues[propOrPath];
        };
      }
      if (this.pathTrackerMap)
        summary.pathChanged = {};

      var changed = false;
      if (this.objectTracker) {
        this.objectTracker.summarize(summary, oldValues);
        changed = changed || this.objectTracker.changed;
      }

      if (this.arrayTracker) {
        this.arrayTracker.summarize(summary);
        changed = changed || this.arrayTracker.changed;
      }

      if (this.dirtyPathTrackers) {
        this.dirtyPathTrackers.forEach(function(pathTracker) {
          if (!pathTracker.changed)
            return;

          pathTracker.summarize(summary, oldValues);
          changed = true;
        });
      }

      if (changed)
      return summary;
    },

    reset: function(force) {
      if (this.objectTracker)
        this.objectTracker.reset(force);
      if (this.arrayTracker)
        this.arrayTracker.reset(force);

      var pathTrackersToReset = force ? this.pathTrackers : this.dirtyPathTrackers;
      if (pathTrackersToReset)
        pathTrackersToReset.forEach(function(pathTracker) { pathTracker.reset(force); });

      this.changeRecords = undefined;
      this.dirtyPathTrackers = undefined;
    }
  };

  var knownRecordTypes = {
    'new': true,
    'updated': true,
    'deleted': true
  };

  function diffObjectFromChangeRecords(object, changeRecords, oldValues) {
    var added = {};
    var removed = {};

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
      if (prop in added || prop in removed)
        continue;

      var newValue = object[prop];
      if (oldValues[prop] !== newValue)
        changed[prop] = newValue;
    }

    return {
      added: added,
      removed: removed,
      changed: changed
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
  function calcEditDistances(current, currentStart, currentEnd,
                             old, oldStart, oldEnd) {
    // "Deletion" columns
    var rowCount = oldEnd - oldStart + 1;
    var columnCount = currentEnd - currentStart + 1;
    var distances = new Array(rowCount);

    // "Addition" rows. Initialize null column.
    for (var i = 0; i < rowCount; i++) {
      distances[i] = new Array(columnCount);
      distances[i][0] = i;
    }

    // Initialize null row
    for (var j = 0; j < columnCount; j++)
      distances[0][j] = j;

    for (var i = 1; i < rowCount; i++) {
      for (var j = 1; j < columnCount; j++) {
        if (old[oldStart + i - 1] === current[currentStart + j - 1])
          distances[i][j] = distances[i - 1][j - 1];
        else {
          var north = distances[i - 1][j] + 1;
          var west = distances[i][j - 1] + 1;
          distances[i][j] = north < west ? north : west;
        }
      }
    }

    return distances;
  }

  var EDIT_LEAVE = 0;
  var EDIT_UPDATE = 1;
  var EDIT_ADD = 2;
  var EDIT_DELETE = 3;

  // This starts at the final weight, and walks "backward" by finding
  // the minimum previous weight recursively until the origin of the weight
  // matrix.
  function spliceOperationsFromEditDistances(distances) {
    var i = distances.length - 1;
    var j = distances[0].length - 1;
    var current = distances[i][j];
    var edits = [];
    while (i > 0 || j > 0) {
      if (i == 0) {
        edits.push(EDIT_ADD);
        j--;
        continue;
      }
      if (j == 0) {
        edits.push(EDIT_DELETE);
        i--;
        continue;
      }
      var northWest = distances[i - 1][j - 1];
      var west = distances[i - 1][j];
      var north = distances[i][j - 1];

      var min;
      if (west < north)
        min = west < northWest ? west : northWest;
      else
        min = north < northWest ? north : northWest;

      if (min == northWest) {
        if (northWest == current) {
          edits.push(EDIT_LEAVE);
        } else {
          edits.push(EDIT_UPDATE);
          current = northWest;
        }
        i--;
        j--;
      } else if (min == west) {
        edits.push(EDIT_DELETE);
        i--;
        current = west;
      } else {
        edits.push(EDIT_ADD);
        j--;
        current = north;
      }
    }

    edits.reverse();
    return edits;
  }

  function sharedPrefix(arr1, arr2, searchLength) {
    for (var i = 0; i < searchLength; i++)
      if (arr1[i] !== arr2[i])
        return i;
    return searchLength;
  }

  function sharedSuffix(arr1, arr2, searchLength) {
    var index1 = arr1.length;
    var index2 = arr2.length;
    var count = 0;
    while (count < searchLength && arr1[--index1] === arr2[--index2])
      count++;

    return count;
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
  function calcSplices(current, currentStart, currentEnd,
                       old, oldStart, oldEnd) {
    var prefixCount = 0;
    var suffixCount = 0;

    var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
    if (currentStart == 0 && oldStart == 0)
      prefixCount = sharedPrefix(current, old, minLength);

    if (currentEnd == current.length && oldEnd == old.length)
      suffixCount = sharedSuffix(current, old, minLength - prefixCount);

    currentStart += prefixCount;
    oldStart += prefixCount;
    currentEnd -= suffixCount;
    oldEnd -= suffixCount;

    if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
      return [];

    function newSplice(index, removed, addedCount) {
      return {
        index: index,
        removed: removed,
        addedCount: addedCount
      };
    }

    if (currentStart == currentEnd) {
      var splice = newSplice(currentStart, [], 0);
      while (oldStart < oldEnd)
        splice.removed.push(old[oldStart++]);

      return [ splice ];
    } else if (oldStart == oldEnd)
      return [ newSplice(currentStart, [], currentEnd - currentStart) ];

    var ops = spliceOperationsFromEditDistances(calcEditDistances(current, currentStart, currentEnd,
                                           old, oldStart, oldEnd));

    var splice = undefined;
    var splices = [];
    var index = currentStart;
    var oldIndex = oldStart;
    for (var i = 0; i < ops.length; i++) {
      switch(ops[i]) {
        case EDIT_LEAVE:
          if (splice) {
            splices.push(splice);
            splice = undefined;
          }

          index++;
          oldIndex++;
          break;
        case EDIT_UPDATE:
          if (!splice)
            splice = newSplice(index, [], 0);

          splice.addedCount++;
          index++;

          splice.removed.push(old[oldIndex]);
          oldIndex++;
          break;
        case EDIT_ADD:
          if (!splice)
            splice = newSplice(index, [], 0);

          splice.addedCount++;
          index++;
          break;
        case EDIT_DELETE:
          if (!splice)
            splice = newSplice(index, [], 0);

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

  function createInitialSplicesFromDiff(array, diff, oldValues) {
    var oldLength = 'length' in oldValues ? toNumber(oldValues.length) : array.length;

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
          lengthChangeSplice.removed[index - array.length] = oldValues[index];
      });
    }

    addProperties(diff.added, oldValues);
    addProperties(diff.removed, oldValues);
    addProperties(diff.changed, oldValues);

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

  function projectArraySplices(array, diff, oldValues) {
    var splices = [];

    createInitialSplicesFromDiff(array, diff, oldValues).forEach(function(splice) {
      splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount,
                                           splice.removed, 0, splice.removed.length));
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
            ChangeSummary._errorThrownDuringCallback = true;
          }
        });
      }

      if (callbacks.array && summary.splices) {
        callbacks.array.forEach(function(callback) {
          try {
            callback(summary.splices, summary.object);
          } catch (ex) {
            console.log('Exception thrown during callback: ' + ex);
            ChangeSummary._errorThrownDuringCallback = true;
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
              ChangeSummary._errorThrownDuringCallback = true;
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
        observer.unobserveObject(object);
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
        observer.unobserveArray(array);
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
        retval = ChangeSummary.getValueAtPath(object, path);
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
