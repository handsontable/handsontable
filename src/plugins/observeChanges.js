function HandsontableObserveChanges() {
  // begin shim code
  // fragments from https://github.com/Starcounter-Jack/JSON-Patch/blob/master/src/json-patch-duplex.js
  //
  // json-patch.js 0.3
  // (c) 2013 Joachim Wester
  // MIT license
  var observeOps = {
    'new': function (patches, path) {
      var patch = {
        op: "add",
        path: path + "/" + this.name,
        value: this.object[this.name]
      };
      patches.push(patch);
    },
    deleted: function (patches, path) {
      var patch = {
        op: "remove",
        path: path + "/" + this.name
      };
      patches.push(patch);
    },
    updated: function (patches, path) {
      var patch = {
        op: "replace",
        path: path + "/" + this.name,
        value: this.object[this.name]
      };
      patches.push(patch);
    }
  };
  // ES6 symbols are not here yet. Used to calculate the json pointer to each object
  function markPaths(observer, node) {
    for (var key in node) {
      var kid = node[key];
      if (kid instanceof Object) {
        Object.unobserve(kid, observer);
        kid.____Path = node.____Path + "/" + key;
        markPaths(observer, kid);
      }
    }
  }

  // Detach poor mans ES6 symbols
  function clearPaths(observer, node) {
    delete node.____Path;
    Object.observe(node, observer);
    for (var key in node) {
      var kid = node[key];
      if (kid instanceof Object) {
        clearPaths(observer, kid);
      }
    }
  }

  var beforeDict = [];
  var callbacks = [];

  function observe(obj, callback) {
    var patches = [];
    var root = obj;
    if (Object.observe) {
      var observer = function (arr) {
        if (!root.___Path) {
          Object.unobserve(root, observer);
          root.____Path = "";
          markPaths(observer, root);
          arr.forEach(function (elem) {
            if (elem.name != "____Path") {
              observeOps[elem.type].call(elem, patches, elem.object.____Path);
            }
          });
          clearPaths(observer, root);
        }
        if (callback) {
          callback.call(patches);
        }
      };
    } else {
      observer = {
      };

      var found;
      for (var i = 0, ilen = beforeDict.length; i < ilen; i++) {
        if (beforeDict[i].obj === obj) {
          found = beforeDict[i];
          break;
        }
      }

      if (!found) {
        found = {obj: obj};
        beforeDict.push(found);
      }

      found.value = JSON.parse(JSON.stringify(obj))// Faster than ES5 clone

      if (callback) {
        callbacks.push(callback);
        var next;
        var intervals = [
          100
        ];
        var currentInterval = 0;
        var dirtyCheck = function () {
          var temp = generate(observer);
          if (temp.length > 0) {
            observer.patches = [];
            callback.call(null, temp);
          }
        };
        var fastCheck = function (e) {
          clearTimeout(next);
          next = setTimeout(function () {
            dirtyCheck();
            currentInterval = 0;
            next = setTimeout(slowCheck, intervals[currentInterval++]);
          }, 0);
        };
        var slowCheck = function () {
          dirtyCheck();
          if (currentInterval == intervals.length) {
            currentInterval = intervals.length - 1;
          }
          next = setTimeout(slowCheck, intervals[currentInterval++]);
        };
        [
          "mousedown",
          "mouseup",
          "keydown"
        ].forEach(function (str) {
            window.addEventListener(str, fastCheck);
          });
        next = setTimeout(slowCheck, intervals[currentInterval++]);
      }
    }
    observer.patches = patches;
    observer.object = obj;
    return _observe(observer, obj, patches);
  }

  /// Listen to changes on an object tree, accumulate patches
  function _observe(observer, obj, patches) {
    if (Object.observe) {
      Object.observe(obj, observer);
    }
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var v = obj[key];
        if (v && typeof (v) === "object") {
          _observe(observer, v, patches)//path+key);
          ;
        }
      }
    }
    return observer;
  }

  function generate(observer) {
    if (Object.observe) {
      Object.deliverChangeRecords(observer);
    } else {
      var mirror;
      for (var i = 0, ilen = beforeDict.length; i < ilen; i++) {
        if (beforeDict[i].obj === observer.object) {
          mirror = beforeDict[i];
          break;
        }
      }
      _generate(mirror, observer.object, observer.patches, "");
    }
    return observer.patches;
  }

  function _generate(mirror, obj, patches, path) {
    var newKeys = Object.keys(obj);
    var oldKeys = Object.keys(mirror);
    var changed = false;
    var deleted = false;
    var added = false;
    for (var t = 0; t < oldKeys.length; t++) {
      var key = oldKeys[t];
      var oldVal = mirror[key];
      if (obj.hasOwnProperty(key)) {
        var newVal = obj[key];
        if (oldVal instanceof Object) {
          _generate(oldVal, newVal, patches, path + "/" + key);
        } else {
          if (oldVal != newVal) {
            changed = true;
            patches.push({
              op: "replace",
              path: path + "/" + key,
              value: newVal
            });
            mirror[key] = newVal;
          }
        }
      } else {
        patches.push({
          op: "remove",
          path: path + "/" + key
        });
        deleted = true// property has been deleted
        ;
      }
    }
    if (!deleted && newKeys.length == oldKeys.length) {
      return;
    }
    for (var t = 0; t < newKeys.length; t++) {
      var key = newKeys[t];
      if (!mirror.hasOwnProperty(key)) {
        patches.push({
          op: "add",
          path: path + "/" + key,
          value: obj[key]
        });
      }
    }
  }
  //end shim code


  this.afterLoadData = function () {
    if (!this.observer && this.getSettings().observeChanges) {
      var that = this;
      this.observer = observe(this.getData(), function () {
        that.render();
      });
    }
  };
}
var htObserveChanges = new HandsontableObserveChanges();

Handsontable.PluginHooks.add('afterLoadData', htObserveChanges.afterLoadData);