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

var Model = {};

(function() {

  function isObject(obj) {
    return obj === Object(obj);
  }

  var observedObjects = new WeakMap;
  var observedPaths = new WeakMap;

  var observer = new ChangeSummary(function(summaries) {
    summaries.forEach(function(summary) {
      var callbacks = observedObjects.get(summary.object);
      if (summary.arraySplices && callbacks) {
        callbacks.forEach(function(callback) {
          summary.arraySplices.forEach(function(splice) {
            callback(splice.index, splice.removed, splice.addedCount);
          });
        });
      }

      paths = observedPaths.get(summary.object);
      if (!paths || !summary.pathValueChanged)
        return;

      summary.pathValueChanged.forEach(function(pathString) {
        var callbacks = paths[pathString];
        if (!callbacks)
          return;
        callbacks.forEach(function(callback) {
          callback(summary.getNewPathValue(pathString), summary.getOldPathValue(pathString));
        });
      });
    });
  });

  /**
   * Returns the observable "model" at |path| from |data|.
   * @param {object} data The reference object.
   * @param {Path} path The path from the reference object to retrieve a value.
   * @return {*} The current value at |path| from |data| -- If the value is
   *     an object, then an "observable" (proxy) is returned.
   */
  Model.getValueAtPath = function(data, path) {
    if (path) {
      path = new Path(path);
      if (path.length > 0) {
        var copy = data;
        data = undefined;
        path.walk(copy, function(m, i) {
          if (i == path.length) {
            data = m;
          }
        });
      }
    }

    return data;
  };

  /**
   * Observes adds/deletes of properties on |data|.
   * @param {object} data The reference object.
   * @param {function} callback Function to be called when a property is added
   *     or deleted from |data|.
   */
  Model.observePropertySet = function(data, callback) {
    if (!isObject(data))
      return;

    var callbacks = observedObjects.get(data);
    if (!callbacks) {
      observedObjects.set(data, [callback]);
      observer.observePropertySet(data);
      return;
    }

    var index = callbacks.indexOf(callback);
    if (index >= 0)
      return;
    callbacks.push(callback);
  };

  /**
   * Stops observation of adds/deletes on |data|.
   * @param {object} data The reference object.
   * @param {function} callback Function previously registered with |data| via
   *     Model.observePropertySet().
   */
  Model.stopObservingPropertySet = function(data, callback) {
    if (!isObject(data))
      return;

    var callbacks = observedObjects.get(data);
    if (!callbacks)
      return;

    var index = callbacks.indexOf(callback);
    if (index < 0)
      return;

    callbacks.splice(index, 1);
    if (callbacks.length)
      return;

    observedObjects["delete"](data);
    observer.unobservePropertySet(data);
  };

  /**
   * Observes the value at a path from an object. |callback| is invoked
   * IFF the value changes.
   * @param {object} data The reference object.
   * @param {Path} path The path from the reference object to monitor a value.
   * @param {function} callback Function to be called when the value changes.
   * @return {*} The current value of the observed path from the object.
   */
  Model.observe = function(data, path, callback) {
    path = new Path(path);

    // If the data is unobservable
    if (!isObject(data))
      throw Error('Invalid path from unobservable data');

    var paths = observedPaths.get(data);
    if (!paths) {
      paths = {};
      observedPaths.set(data, paths);
    }

    var pathString = path.toString();
    var callbacks = paths[pathString];
    if (!callbacks) {
      paths[pathString] = [callback];
      observer.observePathValue(data, pathString);
      return Model.getValueAtPath(data, path);
    }

    var index = callbacks.indexOf(callback);
    if (index >= 0)
      return Model.getValueAtPath(data, path);
    callbacks.push(callback);

    return Model.getValueAtPath(data, path);
  };

  /**
   * Stops observation of changes to the value at a path from an object.
   * @param {object} data The reference object.
   * @param {Path} path The path from the reference object to monitor a value.
   * @param {function} callback Function previously registered with |data|  and
   *     |path| via Model.observe().
   */
  Model.stopObserving = function(data, path, callback) {
   if (!isObject(data))
      return;

    path = new Path(path);
    if (path.length == 0)
      return;

    var paths = observedPaths.get(data);
    if (!paths)
      return;

    var pathString = path.toString();
    var callbacks = paths[pathString];
    if (!callbacks)
      return;

    var index = callbacks.indexOf(callback);
    if (index < 0)
      return;

    callbacks.splice(index, 1);
    if (callbacks.length)
      return;

    delete paths[pathString];
    if (Object.keys(paths).length)
      return;

    observedPaths["delete"](data);
    observer.unobservePathValue(data, pathString);
  };

  Model.dirtyCheck = function() {
    observer.deliver();
  };
})();
