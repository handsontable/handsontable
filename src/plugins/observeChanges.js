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
  function markPaths(observer, node) {
    for(var key in node) {
      var kid = node[key];
      if(kid instanceof Object) {
        Object.unobserve(kid, observer);
        kid.____Path = node.____Path + "/" + key;
        markPaths(observer, kid);
      }
    }
  }
  function clearPaths(observer, node) {
    delete node.____Path;
    Object.observe(node, observer);
    for(var i, nodeLen = node.length; i < nodeLen; i++) {
      var kid = node[i];
      if(kid instanceof Object) {
        clearPaths(observer, kid);
      }
    }
  }
  var beforeDict = [];
  var callbacks = [];
  function observe(obj, callback) {
    var patches = [];
    var root = obj;
    if(Object.observe) {
      var observer = function (arr) {
        if(!root.___Path) {
          Object.unobserve(root, observer);
          root.____Path = "";
          markPaths(observer, root);

          for (var index = 0, arrLen = arr.length; i < arrLen; i++) {
            var elem = arr[index];

            if(elem.name != "____Path") {
              observeOps[elem.type].call(elem, patches, elem.object.____Path);
            }
          }

          clearPaths(observer, root);
        }
        if(callback) {
          callback.call(patches);
        }
      };
    } else {
      observer = {
      };
      var mirror;
      for(var i = 0, ilen = beforeDict.length; i < ilen; i++) {
        if(beforeDict[i].obj === obj) {
          mirror = beforeDict[i];
          break;
        }
      }
      if(!mirror) {
        mirror = {
          obj: obj
        };
        beforeDict.push(mirror);
      }

      mirror.value = simpleCopy(obj);

      if(callback) {
        callbacks.push(callback);
        var next;
        var intervals = [
          100
        ];
        var currentInterval = 0;
        var dirtyCheck = function () {
          var temp = generate(observer);
          if(temp.length > 0) {
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
          if(currentInterval == intervals.length) {
            currentInterval = intervals.length - 1;
          }
          next = setTimeout(slowCheck, intervals[currentInterval++]);
        };

        if(window.addEventListener){
          window.addEventListener('mousedown', fastCheck);
          window.addEventListener('mouseup', fastCheck);
          window.addEventListener('keydown', fastCheck);
        } else {
          //IE7 has different syntax
          window.attachEvent('onmousedown', fastCheck);
          window.attachEvent('onmouseup', fastCheck);
          window.attachEvent('onkeydown', fastCheck);
        }

        next = setTimeout(slowCheck, intervals[currentInterval++]);
      }
    }
    observer.patches = patches;
    observer.object = obj;
    return _observe(observer, obj, patches);
  }

  /// Listen to changes on an object tree, accumulate patches
  function _observe(observer, obj, patches) {
    if(Object.observe) {
      Object.observe(obj, observer);
    }
    for(var key in obj) {
      if(obj.hasOwnProperty(key)) {
        var v = obj[key];
        if(v && typeof (v) === "object") {
          _observe(observer, v, patches);
        }
      }
    }
    return observer;
  }
  function generate(observer) {
    if(Object.observe) {
      Object.deliverChangeRecords(observer);
    } else {
      var mirror;
      for(var i = 0, ilen = beforeDict.length; i < ilen; i++) {
        if(beforeDict[i].obj === observer.object) {
          mirror = beforeDict[i];
          break;
        }
      }
      _generate(mirror.value, observer.object, observer.patches, "");
    }
    return observer.patches;
  }

  function _generate(mirror, obj, patches, path) {


    var newKeys = [];

    for(var key in obj){
      if ( obj.hasOwnProperty(key) ){
        newKeys.push(key);
      }
    }

    var oldKeys = [];

    for(var key in mirror){
      if ( obj.hasOwnProperty(key) ){
        oldKeys.push(key);
      }
    }

    var changed = false;
    var deleted = false;
    var added = false;
    for(var t = 0; t < oldKeys.length; t++) {
      var key = oldKeys[t];
      var oldVal = mirror[key];
      if(obj.hasOwnProperty(key)) {
        var newVal = obj[key];
        if(oldVal instanceof Object) {
          _generate(oldVal, newVal, patches, path + "/" + key);
        } else {
          if(oldVal != newVal) {
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
        deleted = true;
      }
    }
    if(!deleted && newKeys.length == oldKeys.length) {
      return;
    }
    for(var t = 0; t < newKeys.length; t++) {
      var key = newKeys[t];
      if(!mirror.hasOwnProperty(key)) {
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

  function simpleCopy(source){
    var copy = {};

    copy.prototype = source.prototype;

    for (var key in source) {
      if(source.hasOwnProperty(key) && ['string', 'number'].indexOf(typeof source[key]) > -1){
        copy[key] = source[key];
      }
    }

    return copy;
  }

}
var htObserveChanges = new HandsontableObserveChanges();

Handsontable.PluginHooks.add('afterLoadData', htObserveChanges.afterLoadData);