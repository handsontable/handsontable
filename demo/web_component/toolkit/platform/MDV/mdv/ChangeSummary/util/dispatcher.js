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

/*
 * NOTE: ChangeSummaryDispatcher is a utility class which allows a functional-style
 * registry for observation using ChangeSummary.
 *
 * It's important to understand that callbacks which are registered on the same
 * ChangeSummaryObserver will *not* be isolated from each other. That is, if
 * one callback makes any changes which affect observations, another callback
 * registerd on the same dispatcher, will be ignorant of those changes.
 *
 * If you're use case requires that callbacks be isolated from each other, use multiple
 * dipatchers.
 */

(function(global) {

  // FIXME: Use Map/Set iterators when available.
  if (!global.Map || !global.Set)
    throw Error('ChangeSummary requires harmony Maps and Sets');

  var HarmonyMap = global.Map;
  var HarmonySet = global.Set;

  function Map() {
    this.map_ = new HarmonyMap;
    this.keys_ = [];
  }

  Map.prototype = {
    get: function(key) {
      return this.map_.get(key);
    },

    set: function(key, value) {
      if (!this.map_.has(key))
        this.keys_.push(key);
      return this.map_.set(key, value);
    },

    has: function(key) {
      return this.map_.has(key);
    },

    delete: function(key) {
      this.keys_.splice(this.keys_.indexOf(key), 1);
      this.map_.delete(key);
    },

    keys: function() {
      return this.keys_.slice();
    }
  }

  function Set() {
    this.set_ = new HarmonySet;
    this.keys_ = [];
  }

  Set.prototype = {
    add: function(key) {
      if (!this.set_.has(key))
        this.keys_.push(key);
      return this.set_.add(key);
    },

    has: function(key) {
      return this.set_.has(key);
    },

    delete: function(key) {
      this.keys_.splice(this.keys_.indexOf(key), 1);
      this.set_.delete(key);
    },

    keys: function() {
      return this.keys_.slice();
    }
  }

  function ChangeSummaryDispatcher() {
    var pathValueObserverMap = new Map;
    var propertySetObserverMap = new Map;

    function dispatchPathValueObservers(pathValueObservers, summary) {
      if (!summary.pathValueChanged)
        return;

      summary.pathValueChanged.forEach(function(pathString) {
        var callbackSet = pathValueObservers[pathString];
        if (!callbackSet)
          return;

        callbackSet.keys().forEach(function(callback) {
          try {
            callback(summary.getNewPathValue(pathString), summary.getOldPathValue(pathString));
          } catch (ex) {
            console.error('Exception during dispatch: ', ex);
            if (ChangeSummaryDispatcher.rethrowExceptions)
              throw ex;
          }
        });
      });
    }

    function dispatchPropertySetObservers(callbackSet, summary) {
      var newProperties = summary.newProperties || [];
      var deletedProperties = summary.deletedProperties || [];
      var arraySplices = summary.arraySplices || [];
      if (!newProperties.length && !deletedProperties.length && !arraySplices.length)
        return;

      callbackSet.keys().forEach(function(callback) {
        try {
          callback(newProperties, deletedProperties, arraySplices);
        } catch (ex) {
          console.error('Exception during dispatch: ', ex)
          if (ChangeSummaryDispatcher.rethrowExceptions)
            throw ex;
        }
      });
    }

    function dispatch(summaries) {
      summaries.forEach(function(summary) {
        dispatchPathValueObservers(pathValueObserverMap.get(summary.object), summary);
        dispatchPropertySetObservers(propertySetObserverMap.get(summary.object), summary);
      });
    }

    var observer = new ChangeSummary(dispatch);

    // callback(newValue, oldValue);
    this.observePathValue = function(obj, pathString, callback) {
      if (typeof callback != 'function')
        throw Error('callback must be a function.');

      var pathValueObservers = pathValueObserverMap.get(obj);
      if (!pathValueObservers) {
        pathValueObservers = {};
        pathValueObserverMap.set(obj, pathValueObservers);
      }

      var callbackSet = pathValueObservers[pathString];
      if (!callbackSet) {
        callbackSet = new Set;
        pathValueObservers[pathString] = callbackSet;
        observer.observePathValue(obj, pathString);
      };

      callbackSet.add(callback);
    };

    this.unobservePathValue = function(obj, pathString, callback) {
      if (typeof callback != 'function')
        throw Error('callback must be a function.');

      var pathValueObservers = pathValueObserverMap.get(obj);
      if (!pathValueObservers)
        return;

      var callbackSet = pathValueObservers[pathString];
      if (!callbackSet)
        return;

      callbackSet.delete(callback);
      if (!callbackSet.keys().length) {
        delete pathValueObservers[pathString];
        observer.unobservePathValue(obj, pathString);

        if (!Object.keys(pathValueObservers).length)
          pathValueObserverMap.delete(obj);
      }
    };

    // callback(newProperties, deletedProperties, arraySplices)
    this.observePropertySet = function(obj, callback) {
      if (typeof callback != 'function')
        throw Error('callback must be a function.');

      var callbackSet = propertySetObserverMap.get(obj);
      if (!callbackSet) {
        callbackSet = new Set;
        propertySetObserverMap.set(obj, callbackSet);
        observer.observePropertySet(obj);
      }

      callbackSet.add(callback);
    };

    this.unobservePropertySet = function(obj, callback) {
      if (typeof callback != 'function')
        throw Error('callback must be a function.');

      var callbackSet = propertySetObserverMap.get(obj);
      if (!callbackSet)
        return;

      callbackSet.delete(callback);
      if (!callbackSet.keys().length) {
        observer.unobservePropertySet(obj);
        propertySetObserverMap.delete(obj);
      }
    };

    this.deliver = function() {
      observer.deliver();
    };

    this.disconnect = function() {
      var summaries = observer.disconnect();
      if (!summaries || !summaries.length)
        return;
      dispatch(summaries);
    };

    this.reconnect = function() {
      observer.reconnect();
    };
  }

  global.ChangeSummaryDispatcher = ChangeSummaryDispatcher;
})(window);