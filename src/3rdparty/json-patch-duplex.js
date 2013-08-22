// json-patch-duplex.js 0.3.2
// (c) 2013 Joachim Wester
// MIT license
var jsonpatch;
(function (jsonpatch) {
  var objOps = {
    add: function (obj, key) {
      obj[key] = this.value;
      return true;
    },
    remove: function (obj, key) {
      delete obj[key];
      return true;
    },
    replace: function (obj, key) {
      obj[key] = this.value;
      return true;
    },
    move: function (obj, key, tree) {
      var temp = { op: "_get", path: this.from };
      apply(tree, [temp]);
      apply(tree, [
        { op: "remove", path: this.from }
      ]);
      apply(tree, [
        { op: "add", path: this.path, value: temp.value }
      ]);
      return true;
    },
    copy: function (obj, key, tree) {
      var temp = { op: "_get", path: this.from };
      apply(tree, [temp]);
      apply(tree, [
        { op: "add", path: this.path, value: temp.value }
      ]);
      return true;
    },
    test: function (obj, key) {
      return (JSON.stringify(obj[key]) === JSON.stringify(this.value));
    },
    _get: function (obj, key) {
      this.value = obj[key];
    }
  };

  var arrOps = {
    add: function (arr, i) {
      arr.splice(i, 0, this.value);
    },
    remove: function (arr, i) {
      arr.splice(i, 1);
    },
    replace: function (arr, i) {
      arr[i] = this.value;
    },
    move: objOps.move,
    copy: objOps.copy,
    test: objOps.test,
    _get: objOps._get
  };

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
      if (node.hasOwnProperty(key)) {
        var kid = node[key];
        if (kid instanceof Object) {
          Object.unobserve(kid, observer);
          kid.____Path = node.____Path + "/" + key;
          markPaths(observer, kid);
        }
      }
    }
  }

  // Detach poor mans ES6 symbols
  function clearPaths(observer, node) {
    delete node.____Path;
    Object.observe(node, observer);
    for (var key in node) {
      if (node.hasOwnProperty(key)) {
        var kid = node[key];
        if (kid instanceof Object) {
          clearPaths(observer, kid);
        }
      }
    }
  }

  var beforeDict = [];

  //var callbacks = []; this has no purpose
  jsonpatch.intervals;

  function unobserve(root, observer) {
    if (Object.observe) {
      Object.unobserve(root, observer);
      markPaths(observer, root);
    } else {
      clearTimeout(observer.next);
    }
  }
  jsonpatch.unobserve = unobserve;

  function observe(obj, callback) {
    var patches = [];
    var root = obj;
    var observer;
    if (Object.observe) {
      observer = function (arr) {
        if (!root.___Path) {
          Object.unobserve(root, observer);
          root.____Path = "";
          markPaths(observer, root);

          var a = 0, alen = arr.length;
          while (a < alen) {
            if (arr[a].name != "____Path") {
              observeOps[arr[a].type].call(arr[a], patches, arr[a].object.____Path);
            }
            a++;
          }

          clearPaths(observer, root);
        }
        if (callback) {
          callback(patches);
        }
        observer.patches = patches;
        patches = [];
      };
    } else {
      observer = {};

      var mirror;
      for (var i = 0, ilen = beforeDict.length; i < ilen; i++) {
        if (beforeDict[i].obj === obj) {
          mirror = beforeDict[i];
          break;
        }
      }

      if (!mirror) {
        mirror = { obj: obj };
        beforeDict.push(mirror);
      }

      mirror.value = JSON.parse(JSON.stringify(obj));

      if (callback) {
        //callbacks.push(callback); this has no purpose
        observer.callback = callback;
        observer.next = null;
        var intervals = this.intervals || [100, 1000, 10000, 60000];
        var currentInterval = 0;

        var dirtyCheck = function () {
          generate(observer);
        };
        var fastCheck = function () {
          clearTimeout(observer.next);
          observer.next = setTimeout(function () {
            dirtyCheck();
            currentInterval = 0;
            observer.next = setTimeout(slowCheck, intervals[currentInterval++]);
          }, 0);
        };
        var slowCheck = function () {
          dirtyCheck();
          if (currentInterval == intervals.length)
            currentInterval = intervals.length - 1;
          observer.next = setTimeout(slowCheck, intervals[currentInterval++]);
        };
        if (typeof window !== 'undefined') {
          if (window.addEventListener) {
            window.addEventListener('mousedown', fastCheck);
            window.addEventListener('mouseup', fastCheck);
            window.addEventListener('keydown', fastCheck);
          } else {
            window.attachEvent('onmousedown', fastCheck);
            window.attachEvent('onmouseup', fastCheck);
            window.attachEvent('onkeydown', fastCheck);
          }
        }
        observer.next = setTimeout(slowCheck, intervals[currentInterval++]);
      }
    }
    observer.patches = patches;
    observer.object = obj;
    return _observe(observer, obj, patches);
  }
  jsonpatch.observe = observe;

  /// Listen to changes on an object tree, accumulate patches
  function _observe(observer, obj, patches) {
    if (Object.observe) {
      Object.observe(obj, observer);
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          var v = obj[key];
          if (v && typeof (v) === "object") {
            _observe(observer, v, patches);
          }
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
      _generate(mirror.value, observer.object, observer.patches, "");
    }
    var temp = observer.patches;
    if (temp.length > 0) {
      observer.patches = [];
      if (observer.callback) {
        observer.callback(temp);
      }
    }
    return temp;
  }
  jsonpatch.generate = generate;

  var _objectKeys;
  if (Object.keys) {
    _objectKeys = Object.keys;
  } else {
    _objectKeys = function (obj) {
      var keys = [];
      for (var o in obj) {
        if (obj.hasOwnProperty(o)) {
          keys.push(o);
        }
      }
      return keys;
    };
  }

  // Dirty check if obj is different from mirror, generate patches and update mirror
  function _generate(mirror, obj, patches, path) {
    var newKeys = _objectKeys(obj);
    var oldKeys = _objectKeys(mirror);
    var changed = false;
    var deleted = false;

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
            patches.push({ op: "replace", path: path + "/" + key, value: newVal });
            mirror[key] = newVal;
          }
        }
      } else {
        patches.push({ op: "remove", path: path + "/" + key });
        delete mirror[key];
        deleted = true;
      }
    }

    if (!deleted && newKeys.length == oldKeys.length) {
      return;
    }

    for (var t = 0; t < newKeys.length; t++) {
      var key = newKeys[t];
      if (!mirror.hasOwnProperty(key)) {
        patches.push({ op: "add", path: path + "/" + key, value: obj[key] });
        mirror[key] = JSON.parse(JSON.stringify(obj[key]));
      }
    }
  }

  var _isArray;
  if (Array.isArray) {
    _isArray = Array.isArray;
  } else {
    _isArray = function (obj) {
      return obj.push && typeof obj.length === 'number';
    };
  }

  /// Apply a json-patch operation on an object tree
  function apply(tree, patches, listen) {
    var result = false, p = 0, plen = patches.length, patch;
    while (p < plen) {
      patch = patches[p];

      // Find the object
      var keys = patch.path.split('/');
      var obj = tree;
      var t = 1;
      var len = keys.length;
      while (true) {
        if (_isArray(obj)) {
          var index = parseInt(keys[t], 10);
          t++;
          if (t >= len) {
            result = arrOps[patch.op].call(patch, obj, index, tree);
            break;
          }
          obj = obj[index];
        } else {
          var key = keys[t];
          if (key.indexOf('~') != -1)
            key = key.replace('~1', '/').replace('~0', '~');
          t++;
          if (t >= len) {
            result = objOps[patch.op].call(patch, obj, key, tree);
            break;
          }
          obj = obj[key];
        }
      }
      p++;
    }
    return result;
  }
  jsonpatch.apply = apply;
})(jsonpatch || (jsonpatch = {}));

if (typeof exports !== "undefined") {
  exports.apply = jsonpatch.apply;
  exports.observe = jsonpatch.observe;
  exports.unobserve = jsonpatch.unobserve;
  exports.generate = jsonpatch.generate;
}
//# sourceMappingURL=json-patch-duplex.js.map