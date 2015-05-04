/*!
 * Handsontable 0.15.0-beta2
 * Handsontable is a JavaScript library for editable tables with basic copy-paste compatibility with Excel and Google Docs
 *
 * Copyright (c) 2012-2014 Marcin Warpechowski
 * Copyright 2015 Handsoncode sp. z o.o. <hello@handsontable.com>
 * Licensed under the MIT license.
 * http://handsontable.com/
 *
 * Date: Mon May 04 2015 10:11:13 GMT+0200 (CEST)
 */
/*jslint white: true, browser: true, plusplus: true, indent: 4, maxerr: 50 */

window.Handsontable = {
  version: '0.15.0-beta2'
};
require=(function outer (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof require == "function" && require;
  var globalNS = JSON.parse('{"zeroclipboard":"ZeroClipboard","moment":"moment","numeral":"numeral","pikaday":"Pikaday"}') || {};

  function newRequire(name, jumped){
    if(!cache[name]) {

      if(!modules[name]) {
        // if we cannot find the the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof require == "function" && require;
        if (!jumped && currentRequire) return currentRequire(name, true);

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) return previousRequire(name, true);

        // Try find module from global scope
        if (globalNS[name] && typeof window[globalNS[name]] !== 'undefined') {
          return window[globalNS[name]];
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }
      var m = cache[name] = {exports:{}};
      modules[name][0].call(m.exports, function(x){
        var id = modules[name][1][x];
        return newRequire(id ? id : x);
      },m,m.exports,outer,modules,cache,entry);
    }
    return cache[name].exports;
  }
  for(var i=0;i<entry.length;i++) newRequire(entry[i]);

  // Override the current require with this new one
  return newRequire;
})
({1:[function(require,module,exports){
"use strict";
if (window.jQuery) {
  (function(window, $, Handsontable) {
    $.fn.handsontable = function(action) {
      var i,
          ilen,
          args,
          output,
          userSettings,
          $this = this.first(),
          instance = $this.data('handsontable');
      if (typeof action !== 'string') {
        userSettings = action || {};
        if (instance) {
          instance.updateSettings(userSettings);
        } else {
          instance = new Handsontable.Core($this[0], userSettings);
          $this.data('handsontable', instance);
          instance.init();
        }
        return $this;
      } else {
        args = [];
        if (arguments.length > 1) {
          for (i = 1, ilen = arguments.length; i < ilen; i++) {
            args.push(arguments[i]);
          }
        }
        if (instance) {
          if (typeof instance[action] !== 'undefined') {
            output = instance[action].apply(instance, args);
            if (action === 'destroy') {
              $this.removeData();
            }
          } else {
            throw new Error('Handsontable do not provide action: ' + action);
          }
        }
        return output;
      }
    };
  })(window, jQuery, Handsontable);
}


//# 
},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  autoResize: {get: function() {
      return autoResize;
    }},
  __esModule: {value: true}
});
;
function autoResize() {
  var defaults = {
    minHeight: 200,
    maxHeight: 300,
    minWidth: 100,
    maxWidth: 300
  },
      el,
      body = document.body,
      text = document.createTextNode(''),
      span = document.createElement('SPAN'),
      observe = function(element, event, handler) {
        if (window.attachEvent) {
          element.attachEvent('on' + event, handler);
        } else {
          element.addEventListener(event, handler, false);
        }
      },
      unObserve = function(element, event, handler) {
        if (window.removeEventListener) {
          element.removeEventListener(event, handler, false);
        } else {
          element.detachEvent('on' + event, handler);
        }
      },
      resize = function(newChar) {
        var width,
            scrollHeight;
        if (!newChar) {
          newChar = "";
        } else if (!/^[a-zA-Z \.,\\\/\|0-9]$/.test(newChar)) {
          newChar = ".";
        }
        if (text.textContent !== void 0) {
          text.textContent = el.value + newChar;
        } else {
          text.data = el.value + newChar;
        }
        span.style.fontSize = Handsontable.Dom.getComputedStyle(el).fontSize;
        span.style.fontFamily = Handsontable.Dom.getComputedStyle(el).fontFamily;
        span.style.whiteSpace = "pre";
        body.appendChild(span);
        width = span.clientWidth + 2;
        body.removeChild(span);
        el.style.height = defaults.minHeight + 'px';
        if (defaults.minWidth > width) {
          el.style.width = defaults.minWidth + 'px';
        } else if (width > defaults.maxWidth) {
          el.style.width = defaults.maxWidth + 'px';
        } else {
          el.style.width = width + 'px';
        }
        scrollHeight = el.scrollHeight ? el.scrollHeight - 1 : 0;
        if (defaults.minHeight > scrollHeight) {
          el.style.height = defaults.minHeight + 'px';
        } else if (defaults.maxHeight < scrollHeight) {
          el.style.height = defaults.maxHeight + 'px';
          el.style.overflowY = 'visible';
        } else {
          el.style.height = scrollHeight + 'px';
        }
      },
      delayedResize = function() {
        window.setTimeout(resize, 0);
      },
      extendDefaults = function(config) {
        if (config && config.minHeight) {
          if (config.minHeight == 'inherit') {
            defaults.minHeight = el.clientHeight;
          } else {
            var minHeight = parseInt(config.minHeight);
            if (!isNaN(minHeight)) {
              defaults.minHeight = minHeight;
            }
          }
        }
        if (config && config.maxHeight) {
          if (config.maxHeight == 'inherit') {
            defaults.maxHeight = el.clientHeight;
          } else {
            var maxHeight = parseInt(config.maxHeight);
            if (!isNaN(maxHeight)) {
              defaults.maxHeight = maxHeight;
            }
          }
        }
        if (config && config.minWidth) {
          if (config.minWidth == 'inherit') {
            defaults.minWidth = el.clientWidth;
          } else {
            var minWidth = parseInt(config.minWidth);
            if (!isNaN(minWidth)) {
              defaults.minWidth = minWidth;
            }
          }
        }
        if (config && config.maxWidth) {
          if (config.maxWidth == 'inherit') {
            defaults.maxWidth = el.clientWidth;
          } else {
            var maxWidth = parseInt(config.maxWidth);
            if (!isNaN(maxWidth)) {
              defaults.maxWidth = maxWidth;
            }
          }
        }
        if (!span.firstChild) {
          span.className = "autoResize";
          span.style.display = 'inline-block';
          span.appendChild(text);
        }
      },
      init = function(el_, config, doObserve) {
        el = el_;
        extendDefaults(config);
        if (el.nodeName == 'TEXTAREA') {
          el.style.resize = 'none';
          el.style.overflowY = '';
          el.style.height = defaults.minHeight + 'px';
          el.style.minWidth = defaults.minWidth + 'px';
          el.style.maxWidth = defaults.maxWidth + 'px';
          el.style.overflowY = 'hidden';
        }
        if (doObserve) {
          observe(el, 'change', resize);
          observe(el, 'cut', delayedResize);
          observe(el, 'paste', delayedResize);
          observe(el, 'drop', delayedResize);
          observe(el, 'keydown', delayedResize);
        }
        resize();
      };
  return {
    init: function(el_, config, doObserve) {
      init(el_, config, doObserve);
    },
    unObserve: function() {
      unObserve(el, 'change', resize);
      unObserve(el, 'cut', delayedResize);
      unObserve(el, 'paste', delayedResize);
      unObserve(el, 'drop', delayedResize);
      unObserve(el, 'keydown', delayedResize);
    },
    resize: resize
  };
}


//# 
},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  copyPasteManager: {get: function() {
      return copyPasteManager;
    }},
  __esModule: {value: true}
});
var $___46__46__47_helpers_46_js__,
    $___46__46__47_eventManager_46_js__;
var helper = ($___46__46__47_helpers_46_js__ = require("./../helpers.js"), $___46__46__47_helpers_46_js__ && $___46__46__47_helpers_46_js__.__esModule && $___46__46__47_helpers_46_js__ || {default: $___46__46__47_helpers_46_js__});
var eventManagerObject = ($___46__46__47_eventManager_46_js__ = require("./../eventManager.js"), $___46__46__47_eventManager_46_js__ && $___46__46__47_eventManager_46_js__.__esModule && $___46__46__47_eventManager_46_js__ || {default: $___46__46__47_eventManager_46_js__}).eventManager;
;
var instance;
function copyPasteManager() {
  if (!instance) {
    instance = new CopyPasteClass();
  } else if (instance.hasBeenDestroyed()) {
    instance.init();
  }
  instance.refCounter++;
  return instance;
}
function CopyPasteClass() {
  this.refCounter = 0;
  this.init();
}
CopyPasteClass.prototype.init = function() {
  var style,
      parent;
  this.copyCallbacks = [];
  this.cutCallbacks = [];
  this.pasteCallbacks = [];
  this._eventManager = eventManagerObject(this);
  parent = document.body;
  if (document.getElementById('CopyPasteDiv')) {
    this.elDiv = document.getElementById('CopyPasteDiv');
    this.elTextarea = this.elDiv.firstChild;
  } else {
    this.elDiv = document.createElement('div');
    this.elDiv.id = 'CopyPasteDiv';
    style = this.elDiv.style;
    style.position = 'fixed';
    style.top = '-10000px';
    style.left = '-10000px';
    parent.appendChild(this.elDiv);
    this.elTextarea = document.createElement('textarea');
    this.elTextarea.className = 'copyPaste';
    this.elTextarea.onpaste = function(event) {
      if ('WebkitAppearance' in document.documentElement.style) {
        this.value = event.clipboardData.getData("Text");
        return false;
      }
    };
    style = this.elTextarea.style;
    style.width = '10000px';
    style.height = '10000px';
    style.overflow = 'hidden';
    this.elDiv.appendChild(this.elTextarea);
    if (typeof style.opacity !== 'undefined') {
      style.opacity = 0;
    }
  }
  this.keyDownRemoveEvent = this._eventManager.addEventListener(document.documentElement, 'keydown', this.onKeyDown.bind(this), false);
};
CopyPasteClass.prototype.onKeyDown = function(event) {
  var _this = this,
      isCtrlDown = false;
  function isActiveElementEditable() {
    var element = document.activeElement;
    if (element.shadowRoot && element.shadowRoot.activeElement) {
      element = element.shadowRoot.activeElement;
    }
    return ['INPUT', 'SELECT', 'TEXTAREA'].indexOf(element.nodeName) > -1;
  }
  if (event.metaKey) {
    isCtrlDown = true;
  } else if (event.ctrlKey && navigator.userAgent.indexOf('Mac') === -1) {
    isCtrlDown = true;
  }
  if (isCtrlDown) {
    if (document.activeElement !== this.elTextarea && (this.getSelectionText() !== '' || isActiveElementEditable())) {
      return;
    }
    this.selectNodeText(this.elTextarea);
    setTimeout(function() {
      _this.selectNodeText(_this.elTextarea);
    }, 0);
  }
  if (isCtrlDown && (event.keyCode === helper.keyCode.C || event.keyCode === helper.keyCode.V || event.keyCode === helper.keyCode.X)) {
    if (event.keyCode === 88) {
      setTimeout(function() {
        _this.triggerCut(event);
      }, 0);
    } else if (event.keyCode === 86) {
      setTimeout(function() {
        _this.triggerPaste(event);
      }, 0);
    }
  }
};
CopyPasteClass.prototype.selectNodeText = function(element) {
  if (element) {
    element.select();
  }
};
CopyPasteClass.prototype.getSelectionText = function() {
  var text = '';
  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type !== 'Control') {
    text = document.selection.createRange().text;
  }
  return text;
};
CopyPasteClass.prototype.copyable = function(string) {
  if (typeof string !== 'string' && string.toString === void 0) {
    throw new Error('copyable requires string parameter');
  }
  this.elTextarea.value = string;
};
CopyPasteClass.prototype.onCut = function(callback) {
  this.cutCallbacks.push(callback);
};
CopyPasteClass.prototype.onPaste = function(callback) {
  this.pasteCallbacks.push(callback);
};
CopyPasteClass.prototype.removeCallback = function(callback) {
  var i,
      len;
  for (i = 0, len = this.copyCallbacks.length; i < len; i++) {
    if (this.copyCallbacks[i] === callback) {
      this.copyCallbacks.splice(i, 1);
      return true;
    }
  }
  for (i = 0, len = this.cutCallbacks.length; i < len; i++) {
    if (this.cutCallbacks[i] === callback) {
      this.cutCallbacks.splice(i, 1);
      return true;
    }
  }
  for (i = 0, len = this.pasteCallbacks.length; i < len; i++) {
    if (this.pasteCallbacks[i] === callback) {
      this.pasteCallbacks.splice(i, 1);
      return true;
    }
  }
  return false;
};
CopyPasteClass.prototype.triggerCut = function(event) {
  var _this = this;
  if (_this.cutCallbacks) {
    setTimeout(function() {
      for (var i = 0,
          len = _this.cutCallbacks.length; i < len; i++) {
        _this.cutCallbacks[i](event);
      }
    }, 50);
  }
};
CopyPasteClass.prototype.triggerPaste = function(event, string) {
  var _this = this;
  if (_this.pasteCallbacks) {
    setTimeout(function() {
      var val = string || _this.elTextarea.value;
      for (var i = 0,
          len = _this.pasteCallbacks.length; i < len; i++) {
        _this.pasteCallbacks[i](val, event);
      }
    }, 50);
  }
};
CopyPasteClass.prototype.destroy = function() {
  if (!this.hasBeenDestroyed() && --this.refCounter === 0) {
    if (this.elDiv && this.elDiv.parentNode) {
      this.elDiv.parentNode.removeChild(this.elDiv);
      this.elDiv = null;
      this.elTextarea = null;
    }
    this.keyDownRemoveEvent();
  }
};
CopyPasteClass.prototype.hasBeenDestroyed = function() {
  return !this.refCounter;
};


//# 
},{"./../eventManager.js":48,"./../helpers.js":49}],4:[function(require,module,exports){
"use strict";
var jsonpatch;
(function(jsonpatch) {
  var objOps = {
    add: function(obj, key) {
      obj[key] = this.value;
      return true;
    },
    remove: function(obj, key) {
      delete obj[key];
      return true;
    },
    replace: function(obj, key) {
      obj[key] = this.value;
      return true;
    },
    move: function(obj, key, tree) {
      var temp = {
        op: "_get",
        path: this.from
      };
      apply(tree, [temp]);
      apply(tree, [{
        op: "remove",
        path: this.from
      }]);
      apply(tree, [{
        op: "add",
        path: this.path,
        value: temp.value
      }]);
      return true;
    },
    copy: function(obj, key, tree) {
      var temp = {
        op: "_get",
        path: this.from
      };
      apply(tree, [temp]);
      apply(tree, [{
        op: "add",
        path: this.path,
        value: temp.value
      }]);
      return true;
    },
    test: function(obj, key) {
      return (JSON.stringify(obj[key]) === JSON.stringify(this.value));
    },
    _get: function(obj, key) {
      this.value = obj[key];
    }
  };
  var arrOps = {
    add: function(arr, i) {
      arr.splice(i, 0, this.value);
      return true;
    },
    remove: function(arr, i) {
      arr.splice(i, 1);
      return true;
    },
    replace: function(arr, i) {
      arr[i] = this.value;
      return true;
    },
    move: objOps.move,
    copy: objOps.copy,
    test: objOps.test,
    _get: objOps._get
  };
  var observeOps = {
    add: function(patches, path) {
      var patch = {
        op: "add",
        path: path + escapePathComponent(this.name),
        value: this.object[this.name]
      };
      patches.push(patch);
    },
    'delete': function(patches, path) {
      var patch = {
        op: "remove",
        path: path + escapePathComponent(this.name)
      };
      patches.push(patch);
    },
    update: function(patches, path) {
      var patch = {
        op: "replace",
        path: path + escapePathComponent(this.name),
        value: this.object[this.name]
      };
      patches.push(patch);
    }
  };
  function escapePathComponent(str) {
    if (str.indexOf('/') === -1 && str.indexOf('~') === -1) {
      return str;
    }
    return str.replace(/~/g, '~0').replace(/\//g, '~1');
  }
  function _getPathRecursive(root, obj) {
    var found;
    for (var key in root) {
      if (root.hasOwnProperty(key)) {
        if (root[key] === obj) {
          return escapePathComponent(key) + '/';
        } else if (typeof root[key] === 'object') {
          found = _getPathRecursive(root[key], obj);
          if (found != '') {
            return escapePathComponent(key) + '/' + found;
          }
        }
      }
    }
    return '';
  }
  function getPath(root, obj) {
    if (root === obj) {
      return '/';
    }
    var path = _getPathRecursive(root, obj);
    if (path === '') {
      throw new Error("Object not found in root");
    }
    return '/' + path;
  }
  var beforeDict = [];
  jsonpatch.intervals;
  var Mirror = (function() {
    function Mirror(obj) {
      this.observers = [];
      this.obj = obj;
    }
    return Mirror;
  })();
  var ObserverInfo = (function() {
    function ObserverInfo(callback, observer) {
      this.callback = callback;
      this.observer = observer;
    }
    return ObserverInfo;
  })();
  function getMirror(obj) {
    for (var i = 0,
        ilen = beforeDict.length; i < ilen; i++) {
      if (beforeDict[i].obj === obj) {
        return beforeDict[i];
      }
    }
  }
  function getObserverFromMirror(mirror, callback) {
    for (var j = 0,
        jlen = mirror.observers.length; j < jlen; j++) {
      if (mirror.observers[j].callback === callback) {
        return mirror.observers[j].observer;
      }
    }
  }
  function removeObserverFromMirror(mirror, observer) {
    for (var j = 0,
        jlen = mirror.observers.length; j < jlen; j++) {
      if (mirror.observers[j].observer === observer) {
        mirror.observers.splice(j, 1);
        return;
      }
    }
  }
  function unobserve(root, observer) {
    generate(observer);
    if (Object.observe) {
      _unobserve(observer, root);
    } else {
      clearTimeout(observer.next);
    }
    var mirror = getMirror(root);
    removeObserverFromMirror(mirror, observer);
  }
  jsonpatch.unobserve = unobserve;
  function observe(obj, callback) {
    var patches = [];
    var root = obj;
    var observer;
    var mirror = getMirror(obj);
    if (!mirror) {
      mirror = new Mirror(obj);
      beforeDict.push(mirror);
    } else {
      observer = getObserverFromMirror(mirror, callback);
    }
    if (observer) {
      return observer;
    }
    if (Object.observe) {
      observer = function(arr) {
        _unobserve(observer, obj);
        _observe(observer, obj);
        var a = 0,
            alen = arr.length;
        while (a < alen) {
          if (!(arr[a].name === 'length' && _isArray(arr[a].object)) && !(arr[a].name === '__Jasmine_been_here_before__')) {
            var type = arr[a].type;
            switch (type) {
              case 'new':
                type = 'add';
                break;
              case 'deleted':
                type = 'delete';
                break;
              case 'updated':
                type = 'update';
                break;
            }
            observeOps[type].call(arr[a], patches, getPath(root, arr[a].object));
          }
          a++;
        }
        if (patches) {
          if (callback) {
            callback(patches);
          }
        }
        observer.patches = patches;
        patches = [];
      };
    } else {
      observer = {};
      mirror.value = JSON.parse(JSON.stringify(obj));
      if (callback) {
        observer.callback = callback;
        observer.next = null;
        var intervals = this.intervals || [100, 1000, 10000, 60000];
        var currentInterval = 0;
        var dirtyCheck = function() {
          generate(observer);
        };
        var fastCheck = function() {
          clearTimeout(observer.next);
          observer.next = setTimeout(function() {
            dirtyCheck();
            currentInterval = 0;
            observer.next = setTimeout(slowCheck, intervals[currentInterval++]);
          }, 0);
        };
        var slowCheck = function() {
          dirtyCheck();
          if (currentInterval == intervals.length) {
            currentInterval = intervals.length - 1;
          }
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
    mirror.observers.push(new ObserverInfo(callback, observer));
    return _observe(observer, obj);
  }
  jsonpatch.observe = observe;
  function _observe(observer, obj) {
    if (Object.observe) {
      Object.observe(obj, observer);
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          var v = obj[key];
          if (v && typeof(v) === "object") {
            _observe(observer, v);
          }
        }
      }
    }
    return observer;
  }
  function _unobserve(observer, obj) {
    if (Object.observe) {
      Object.unobserve(obj, observer);
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          var v = obj[key];
          if (v && typeof(v) === "object") {
            _unobserve(observer, v);
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
      for (var i = 0,
          ilen = beforeDict.length; i < ilen; i++) {
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
    _objectKeys = function(obj) {
      var keys = [];
      for (var o in obj) {
        if (obj.hasOwnProperty(o)) {
          keys.push(o);
        }
      }
      return keys;
    };
  }
  function _generate(mirror, obj, patches, path) {
    var newKeys = _objectKeys(obj);
    var oldKeys = _objectKeys(mirror);
    var changed = false;
    var deleted = false;
    for (var t = oldKeys.length - 1; t >= 0; t--) {
      var key = oldKeys[t];
      var oldVal = mirror[key];
      if (obj.hasOwnProperty(key)) {
        var newVal = obj[key];
        if (oldVal instanceof Object) {
          _generate(oldVal, newVal, patches, path + "/" + escapePathComponent(key));
        } else {
          if (oldVal != newVal) {
            changed = true;
            patches.push({
              op: "replace",
              path: path + "/" + escapePathComponent(key),
              value: newVal
            });
            mirror[key] = newVal;
          }
        }
      } else {
        patches.push({
          op: "remove",
          path: path + "/" + escapePathComponent(key)
        });
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
        patches.push({
          op: "add",
          path: path + "/" + escapePathComponent(key),
          value: obj[key]
        });
        mirror[key] = JSON.parse(JSON.stringify(obj[key]));
      }
    }
  }
  var _isArray;
  if (Array.isArray) {
    _isArray = Array.isArray;
  } else {
    _isArray = function(obj) {
      return obj.push && typeof obj.length === 'number';
    };
  }
  function apply(tree, patches) {
    var result = false,
        p = 0,
        plen = patches.length,
        patch;
    while (p < plen) {
      patch = patches[p];
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
          if (key.indexOf('~') != -1) {
            key = key.replace(/~1/g, '/').replace(/~0/g, '~');
          }
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


//# 
},{}],5:[function(require,module,exports){
"use strict";
(function(global) {
  "use strict";
  function countQuotes(str) {
    return str.split('"').length - 1;
  }
  var SheetClip = {
    parse: function(str) {
      var r,
          rLen,
          rows,
          arr = [],
          a = 0,
          c,
          cLen,
          multiline,
          last;
      rows = str.split('\n');
      if (rows.length > 1 && rows[rows.length - 1] === '') {
        rows.pop();
      }
      for (r = 0, rLen = rows.length; r < rLen; r += 1) {
        rows[r] = rows[r].split('\t');
        for (c = 0, cLen = rows[r].length; c < cLen; c += 1) {
          if (!arr[a]) {
            arr[a] = [];
          }
          if (multiline && c === 0) {
            last = arr[a].length - 1;
            arr[a][last] = arr[a][last] + '\n' + rows[r][0];
            if (multiline && (countQuotes(rows[r][0]) & 1)) {
              multiline = false;
              arr[a][last] = arr[a][last].substring(0, arr[a][last].length - 1).replace(/""/g, '"');
            }
          } else {
            if (c === cLen - 1 && rows[r][c].indexOf('"') === 0) {
              arr[a].push(rows[r][c].substring(1).replace(/""/g, '"'));
              multiline = true;
            } else {
              arr[a].push(rows[r][c].replace(/""/g, '"'));
              multiline = false;
            }
          }
        }
        if (!multiline) {
          a += 1;
        }
      }
      return arr;
    },
    stringify: function(arr) {
      var r,
          rLen,
          c,
          cLen,
          str = '',
          val;
      for (r = 0, rLen = arr.length; r < rLen; r += 1) {
        cLen = arr[r].length;
        for (c = 0; c < cLen; c += 1) {
          if (c > 0) {
            str += '\t';
          }
          val = arr[r][c];
          if (typeof val === 'string') {
            if (val.indexOf('\n') > -1) {
              str += '"' + val.replace(/"/g, '""') + '"';
            } else {
              str += val;
            }
          } else if (val === null || val === void 0) {
            str += '';
          } else {
            str += val;
          }
        }
        str += '\n';
      }
      return str;
    }
  };
  if (typeof exports !== 'undefined') {
    exports.parse = SheetClip.parse;
    exports.stringify = SheetClip.stringify;
  } else {
    global.SheetClip = SheetClip;
  }
}(window));


//# 
},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableOverlay: {get: function() {
      return WalkontableOverlay;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__,
    $__columnStrategy_46_js__,
    $___46__46__47__46__46__47__46__46__47_eventManager_46_js__,
    $__scrollbarNativeHorizontal_46_js__,
    $__core_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
var ColumnStrategy = ($__columnStrategy_46_js__ = require("./columnStrategy.js"), $__columnStrategy_46_js__ && $__columnStrategy_46_js__.__esModule && $__columnStrategy_46_js__ || {default: $__columnStrategy_46_js__}).ColumnStrategy;
var eventManagerObject = ($___46__46__47__46__46__47__46__46__47_eventManager_46_js__ = require("./../../../eventManager.js"), $___46__46__47__46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var WalkontableHorizontalScrollbarNative = ($__scrollbarNativeHorizontal_46_js__ = require("./scrollbarNativeHorizontal.js"), $__scrollbarNativeHorizontal_46_js__ && $__scrollbarNativeHorizontal_46_js__.__esModule && $__scrollbarNativeHorizontal_46_js__ || {default: $__scrollbarNativeHorizontal_46_js__}).WalkontableHorizontalScrollbarNative;
var Walkontable = ($__core_46_js__ = require("./core.js"), $__core_46_js__ && $__core_46_js__.__esModule && $__core_46_js__ || {default: $__core_46_js__}).Walkontable;
;
window.WalkontableOverlay = WalkontableOverlay;
function WalkontableOverlay() {}
WalkontableOverlay.prototype.init = function() {
  this.TABLE = this.instance.wtTable.TABLE;
  this.hider = this.instance.wtTable.hider;
  this.spreader = this.instance.wtTable.spreader;
  this.holder = this.instance.wtTable.holder;
  this.wtRootElement = this.instance.wtTable.wtRootElement;
  this.trimmingContainer = dom.getTrimmingContainer(this.hider.parentNode.parentNode);
  this.mainTableScrollableElement = dom.getScrollableElement(this.instance.wtTable.TABLE);
};
WalkontableOverlay.prototype.makeClone = function(direction) {
  var clone = document.createElement('DIV');
  clone.className = 'ht_clone_' + direction + ' handsontable';
  clone.style.position = 'absolute';
  clone.style.top = 0;
  clone.style.left = 0;
  clone.style.overflow = 'hidden';
  var clonedTable = document.createElement('TABLE');
  clonedTable.className = this.instance.wtTable.TABLE.className;
  clone.appendChild(clonedTable);
  this.instance.wtTable.wtRootElement.parentNode.appendChild(clone);
  return new Walkontable({
    cloneSource: this.instance,
    cloneOverlay: this,
    table: clonedTable
  });
};
WalkontableOverlay.prototype.refresh = function(fastDraw) {
  if (this.clone) {
    this.clone.draw(fastDraw);
  }
};
WalkontableOverlay.prototype.destroy = function() {
  var eventManager = eventManagerObject(this.clone);
  eventManager.clear();
};


//# 
},{"./../../../dom.js":34,"./../../../eventManager.js":48,"./columnStrategy.js":11,"./core.js":12,"./scrollbarNativeHorizontal.js":19}],7:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableBorder: {get: function() {
      return WalkontableBorder;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47__46__46__47_eventManager_46_js__,
    $__cellCoords_46_js__,
    $__scrollbarNativeHorizontal_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
var eventManagerObject = ($___46__46__47__46__46__47__46__46__47_eventManager_46_js__ = require("./../../../eventManager.js"), $___46__46__47__46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var WalkontableCellCoords = ($__cellCoords_46_js__ = require("./cellCoords.js"), $__cellCoords_46_js__ && $__cellCoords_46_js__.__esModule && $__cellCoords_46_js__ || {default: $__cellCoords_46_js__}).WalkontableCellCoords;
var WalkontableHorizontalScrollbarNative = ($__scrollbarNativeHorizontal_46_js__ = require("./scrollbarNativeHorizontal.js"), $__scrollbarNativeHorizontal_46_js__ && $__scrollbarNativeHorizontal_46_js__.__esModule && $__scrollbarNativeHorizontal_46_js__ || {default: $__scrollbarNativeHorizontal_46_js__}).WalkontableHorizontalScrollbarNative;
;
window.WalkontableBorder = WalkontableBorder;
function WalkontableBorder(instance, settings) {
  var style;
  var createMultipleSelectorHandles = function() {
    this.selectionHandles = {
      topLeft: document.createElement('DIV'),
      topLeftHitArea: document.createElement('DIV'),
      bottomRight: document.createElement('DIV'),
      bottomRightHitArea: document.createElement('DIV')
    };
    var width = 10,
        hitAreaWidth = 40;
    this.selectionHandles.topLeft.className = 'topLeftSelectionHandle';
    this.selectionHandles.topLeftHitArea.className = 'topLeftSelectionHandle-HitArea';
    this.selectionHandles.bottomRight.className = 'bottomRightSelectionHandle';
    this.selectionHandles.bottomRightHitArea.className = 'bottomRightSelectionHandle-HitArea';
    this.selectionHandles.styles = {
      topLeft: this.selectionHandles.topLeft.style,
      topLeftHitArea: this.selectionHandles.topLeftHitArea.style,
      bottomRight: this.selectionHandles.bottomRight.style,
      bottomRightHitArea: this.selectionHandles.bottomRightHitArea.style
    };
    var hitAreaStyle = {
      'position': 'absolute',
      'height': hitAreaWidth + 'px',
      'width': hitAreaWidth + 'px',
      'border-radius': parseInt(hitAreaWidth / 1.5, 10) + 'px'
    };
    for (var prop in hitAreaStyle) {
      if (hitAreaStyle.hasOwnProperty(prop)) {
        this.selectionHandles.styles.bottomRightHitArea[prop] = hitAreaStyle[prop];
        this.selectionHandles.styles.topLeftHitArea[prop] = hitAreaStyle[prop];
      }
    }
    var handleStyle = {
      'position': 'absolute',
      'height': width + 'px',
      'width': width + 'px',
      'border-radius': parseInt(width / 1.5, 10) + 'px',
      'background': '#F5F5FF',
      'border': '1px solid #4285c8'
    };
    for (var prop in handleStyle) {
      if (handleStyle.hasOwnProperty(prop)) {
        this.selectionHandles.styles.bottomRight[prop] = handleStyle[prop];
        this.selectionHandles.styles.topLeft[prop] = handleStyle[prop];
      }
    }
    this.main.appendChild(this.selectionHandles.topLeft);
    this.main.appendChild(this.selectionHandles.bottomRight);
    this.main.appendChild(this.selectionHandles.topLeftHitArea);
    this.main.appendChild(this.selectionHandles.bottomRightHitArea);
  };
  if (!settings) {
    return;
  }
  var eventManager = eventManagerObject(instance);
  this.instance = instance;
  this.settings = settings;
  this.main = document.createElement("div");
  style = this.main.style;
  style.position = 'absolute';
  style.top = 0;
  style.left = 0;
  var borderDivs = ['top', 'left', 'bottom', 'right', 'corner'];
  for (var i = 0; i < 5; i++) {
    var position = borderDivs[i];
    var DIV = document.createElement('DIV');
    DIV.className = 'wtBorder ' + (this.settings.className || '');
    if (this.settings[position] && this.settings[position].hide) {
      DIV.className += " hidden";
    }
    style = DIV.style;
    style.backgroundColor = (this.settings[position] && this.settings[position].color) ? this.settings[position].color : settings.border.color;
    style.height = (this.settings[position] && this.settings[position].width) ? this.settings[position].width + 'px' : settings.border.width + 'px';
    style.width = (this.settings[position] && this.settings[position].width) ? this.settings[position].width + 'px' : settings.border.width + 'px';
    this.main.appendChild(DIV);
  }
  this.top = this.main.childNodes[0];
  this.left = this.main.childNodes[1];
  this.bottom = this.main.childNodes[2];
  this.right = this.main.childNodes[3];
  this.topStyle = this.top.style;
  this.leftStyle = this.left.style;
  this.bottomStyle = this.bottom.style;
  this.rightStyle = this.right.style;
  this.cornerDefaultStyle = {
    width: '5px',
    height: '5px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#FFF'
  };
  this.corner = this.main.childNodes[4];
  this.corner.className += ' corner';
  this.cornerStyle = this.corner.style;
  this.cornerStyle.width = this.cornerDefaultStyle.width;
  this.cornerStyle.height = this.cornerDefaultStyle.height;
  this.cornerStyle.border = [this.cornerDefaultStyle.borderWidth, this.cornerDefaultStyle.borderStyle, this.cornerDefaultStyle.borderColor].join(' ');
  if (Handsontable.mobileBrowser) {
    createMultipleSelectorHandles.call(this);
  }
  this.disappear();
  if (!instance.wtTable.bordersHolder) {
    instance.wtTable.bordersHolder = document.createElement('div');
    instance.wtTable.bordersHolder.className = 'htBorders';
    instance.wtTable.spreader.appendChild(instance.wtTable.bordersHolder);
  }
  instance.wtTable.bordersHolder.insertBefore(this.main, instance.wtTable.bordersHolder.firstChild);
  var down = false;
  eventManager.addEventListener(document.body, 'mousedown', function() {
    down = true;
  });
  eventManager.addEventListener(document.body, 'mouseup', function() {
    down = false;
  });
  for (var c = 0,
      len = this.main.childNodes.length; c < len; c++) {
    eventManager.addEventListener(this.main.childNodes[c], 'mouseenter', function(event) {
      if (!down || !instance.getSetting('hideBorderOnMouseDownOver')) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      var bounds = this.getBoundingClientRect();
      this.style.display = 'none';
      var isOutside = function(event) {
        if (event.clientY < Math.floor(bounds.top)) {
          return true;
        }
        if (event.clientY > Math.ceil(bounds.top + bounds.height)) {
          return true;
        }
        if (event.clientX < Math.floor(bounds.left)) {
          return true;
        }
        if (event.clientX > Math.ceil(bounds.left + bounds.width)) {
          return true;
        }
      };
      var handler = function(event) {
        if (isOutside(event)) {
          eventManager.removeEventListener(document.body, 'mousemove', handler);
          this.style.display = 'block';
        }
      };
      eventManager.addEventListener(document.body, 'mousemove', handler);
    });
  }
}
WalkontableBorder.prototype.appear = function(corners) {
  if (this.disabled) {
    return;
  }
  var instance = this.instance;
  var isMultiple,
      fromTD,
      toTD,
      fromOffset,
      toOffset,
      containerOffset,
      top,
      minTop,
      left,
      minLeft,
      height,
      width,
      fromRow,
      fromColumn,
      toRow,
      toColumn,
      i,
      ilen,
      s;
  var isPartRange = function() {
    if (this.instance.selections.area.cellRange) {
      if (toRow != this.instance.selections.area.cellRange.to.row || toColumn != this.instance.selections.area.cellRange.to.col) {
        return true;
      }
    }
    return false;
  };
  var updateMultipleSelectionHandlesPosition = function(top, left, width, height) {
    var handleWidth = parseInt(this.selectionHandles.styles.topLeft.width, 10),
        hitAreaWidth = parseInt(this.selectionHandles.styles.topLeftHitArea.width, 10);
    this.selectionHandles.styles.topLeft.top = parseInt(top - handleWidth, 10) + "px";
    this.selectionHandles.styles.topLeft.left = parseInt(left - handleWidth, 10) + "px";
    this.selectionHandles.styles.topLeftHitArea.top = parseInt(top - (hitAreaWidth / 4) * 3, 10) + "px";
    this.selectionHandles.styles.topLeftHitArea.left = parseInt(left - (hitAreaWidth / 4) * 3, 10) + "px";
    this.selectionHandles.styles.bottomRight.top = parseInt(top + height, 10) + "px";
    this.selectionHandles.styles.bottomRight.left = parseInt(left + width, 10) + "px";
    this.selectionHandles.styles.bottomRightHitArea.top = parseInt(top + height - hitAreaWidth / 4, 10) + "px";
    this.selectionHandles.styles.bottomRightHitArea.left = parseInt(left + width - hitAreaWidth / 4, 10) + "px";
    if (this.settings.border.multipleSelectionHandlesVisible && this.settings.border.multipleSelectionHandlesVisible()) {
      this.selectionHandles.styles.topLeft.display = "block";
      this.selectionHandles.styles.topLeftHitArea.display = "block";
      if (!isPartRange.call(this)) {
        this.selectionHandles.styles.bottomRight.display = "block";
        this.selectionHandles.styles.bottomRightHitArea.display = "block";
      } else {
        this.selectionHandles.styles.bottomRight.display = "none";
        this.selectionHandles.styles.bottomRightHitArea.display = "none";
      }
    } else {
      this.selectionHandles.styles.topLeft.display = "none";
      this.selectionHandles.styles.bottomRight.display = "none";
      this.selectionHandles.styles.topLeftHitArea.display = "none";
      this.selectionHandles.styles.bottomRightHitArea.display = "none";
    }
    if (fromRow == this.instance.wtSettings.getSetting('fixedRowsTop') || fromColumn == this.instance.wtSettings.getSetting('fixedColumnsLeft')) {
      this.selectionHandles.styles.topLeft.zIndex = "9999";
      this.selectionHandles.styles.topLeftHitArea.zIndex = "9999";
    } else {
      this.selectionHandles.styles.topLeft.zIndex = "";
      this.selectionHandles.styles.topLeftHitArea.zIndex = "";
    }
  };
  if (instance.cloneOverlay instanceof WalkontableTopOverlay || instance.cloneOverlay instanceof WalkontableCornerOverlay) {
    ilen = instance.getSetting('fixedRowsTop');
  } else {
    ilen = instance.wtTable.getRenderedRowsCount();
  }
  for (i = 0; i < ilen; i++) {
    s = instance.wtTable.rowFilter.renderedToSource(i);
    if (s >= corners[0] && s <= corners[2]) {
      fromRow = s;
      break;
    }
  }
  for (i = ilen - 1; i >= 0; i--) {
    s = instance.wtTable.rowFilter.renderedToSource(i);
    if (s >= corners[0] && s <= corners[2]) {
      toRow = s;
      break;
    }
  }
  ilen = instance.wtTable.getRenderedColumnsCount();
  for (i = 0; i < ilen; i++) {
    s = instance.wtTable.columnFilter.renderedToSource(i);
    if (s >= corners[1] && s <= corners[3]) {
      fromColumn = s;
      break;
    }
  }
  for (i = ilen - 1; i >= 0; i--) {
    s = instance.wtTable.columnFilter.renderedToSource(i);
    if (s >= corners[1] && s <= corners[3]) {
      toColumn = s;
      break;
    }
  }
  if (fromRow !== void 0 && fromColumn !== void 0) {
    isMultiple = (fromRow !== toRow || fromColumn !== toColumn);
    fromTD = instance.wtTable.getCell(new WalkontableCellCoords(fromRow, fromColumn));
    toTD = isMultiple ? instance.wtTable.getCell(new WalkontableCellCoords(toRow, toColumn)) : fromTD;
    fromOffset = dom.offset(fromTD);
    toOffset = isMultiple ? dom.offset(toTD) : fromOffset;
    containerOffset = dom.offset(instance.wtTable.TABLE);
    minTop = fromOffset.top;
    height = toOffset.top + dom.outerHeight(toTD) - minTop;
    minLeft = fromOffset.left;
    width = toOffset.left + dom.outerWidth(toTD) - minLeft;
    top = minTop - containerOffset.top - 1;
    left = minLeft - containerOffset.left - 1;
    var style = dom.getComputedStyle(fromTD);
    if (parseInt(style['borderTopWidth'], 10) > 0) {
      top += 1;
      height = height > 0 ? height - 1 : 0;
    }
    if (parseInt(style['borderLeftWidth'], 10) > 0) {
      left += 1;
      width = width > 0 ? width - 1 : 0;
    }
  } else {
    this.disappear();
    return;
  }
  this.topStyle.top = top + 'px';
  this.topStyle.left = left + 'px';
  this.topStyle.width = width + 'px';
  this.topStyle.display = 'block';
  this.leftStyle.top = top + 'px';
  this.leftStyle.left = left + 'px';
  this.leftStyle.height = height + 'px';
  this.leftStyle.display = 'block';
  var delta = Math.floor(this.settings.border.width / 2);
  this.bottomStyle.top = top + height - delta + 'px';
  this.bottomStyle.left = left + 'px';
  this.bottomStyle.width = width + 'px';
  this.bottomStyle.display = 'block';
  this.rightStyle.top = top + 'px';
  this.rightStyle.left = left + width - delta + 'px';
  this.rightStyle.height = height + 1 + 'px';
  this.rightStyle.display = 'block';
  if (Handsontable.mobileBrowser || (!this.hasSetting(this.settings.border.cornerVisible) || isPartRange.call(this))) {
    this.cornerStyle.display = 'none';
  } else {
    this.cornerStyle.top = top + height - 4 + 'px';
    this.cornerStyle.left = left + width - 4 + 'px';
    this.cornerStyle.borderRightWidth = this.cornerDefaultStyle.borderWidth;
    this.cornerStyle.width = this.cornerDefaultStyle.width;
    this.cornerStyle.display = 'block';
    if (toColumn === this.instance.getSetting('totalColumns') - 1) {
      var trimmingContainer = dom.getTrimmingContainer(instance.wtTable.TABLE),
          cornerOverlappingContainer = toTD.offsetLeft + dom.outerWidth(toTD) >= dom.innerWidth(trimmingContainer);
      if (cornerOverlappingContainer) {
        this.cornerStyle.left = Math.floor(left + width - 3 - parseInt(this.cornerDefaultStyle.width) / 2) + "px";
        this.cornerStyle.borderRightWidth = 0;
      }
    }
  }
  if (Handsontable.mobileBrowser) {
    updateMultipleSelectionHandlesPosition.call(this, top, left, width, height);
  }
};
WalkontableBorder.prototype.disappear = function() {
  this.topStyle.display = 'none';
  this.leftStyle.display = 'none';
  this.bottomStyle.display = 'none';
  this.rightStyle.display = 'none';
  this.cornerStyle.display = 'none';
  if (Handsontable.mobileBrowser) {
    this.selectionHandles.styles.topLeft.display = 'none';
    this.selectionHandles.styles.bottomRight.display = 'none';
  }
};
WalkontableBorder.prototype.hasSetting = function(setting) {
  if (typeof setting === 'function') {
    return setting();
  }
  return !!setting;
};


//# 
},{"./../../../dom.js":34,"./../../../eventManager.js":48,"./cellCoords.js":8,"./scrollbarNativeHorizontal.js":19}],8:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableCellCoords: {get: function() {
      return WalkontableCellCoords;
    }},
  __esModule: {value: true}
});
;
window.WalkontableCellCoords = WalkontableCellCoords;
function WalkontableCellCoords(row, col) {
  if (typeof row !== 'undefined' && typeof col !== 'undefined') {
    this.row = row;
    this.col = col;
  } else {
    this.row = null;
    this.col = null;
  }
}
WalkontableCellCoords.prototype.isValid = function(instance) {
  if (this.row < 0 || this.col < 0) {
    return false;
  }
  if (this.row >= instance.getSetting('totalRows') || this.col >= instance.getSetting('totalColumns')) {
    return false;
  }
  return true;
};
WalkontableCellCoords.prototype.isEqual = function(cellCoords) {
  if (cellCoords === this) {
    return true;
  }
  return (this.row === cellCoords.row && this.col === cellCoords.col);
};
WalkontableCellCoords.prototype.isSouthEastOf = function(testedCoords) {
  return this.row >= testedCoords.row && this.col >= testedCoords.col;
};
WalkontableCellCoords.prototype.isNorthWestOf = function(testedCoords) {
  return this.row <= testedCoords.row && this.col <= testedCoords.col;
};
WalkontableCellCoords.prototype.isSouthWestOf = function(testedCoords) {
  return this.row >= testedCoords.row && this.col <= testedCoords.col;
};
WalkontableCellCoords.prototype.isNorthEastOf = function(testedCoords) {
  return this.row <= testedCoords.row && this.col >= testedCoords.col;
};


//# 
},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableCellRange: {get: function() {
      return WalkontableCellRange;
    }},
  __esModule: {value: true}
});
var $__cellCoords_46_js__;
var WalkontableCellCoords = ($__cellCoords_46_js__ = require("./cellCoords.js"), $__cellCoords_46_js__ && $__cellCoords_46_js__.__esModule && $__cellCoords_46_js__ || {default: $__cellCoords_46_js__}).WalkontableCellCoords;
;
window.WalkontableCellRange = WalkontableCellRange;
function WalkontableCellRange(highlight, from, to) {
  this.highlight = highlight;
  this.from = from;
  this.to = to;
}
WalkontableCellRange.prototype.isValid = function(instance) {
  return this.from.isValid(instance) && this.to.isValid(instance);
};
WalkontableCellRange.prototype.isSingle = function() {
  return this.from.row === this.to.row && this.from.col === this.to.col;
};
WalkontableCellRange.prototype.getHeight = function() {
  return Math.max(this.from.row, this.to.row) - Math.min(this.from.row, this.to.row) + 1;
};
WalkontableCellRange.prototype.getWidth = function() {
  return Math.max(this.from.col, this.to.col) - Math.min(this.from.col, this.to.col) + 1;
};
WalkontableCellRange.prototype.includes = function(cellCoords) {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  if (cellCoords.row < 0) {
    cellCoords.row = 0;
  }
  if (cellCoords.col < 0) {
    cellCoords.col = 0;
  }
  return (topLeft.row <= cellCoords.row && bottomRight.row >= cellCoords.row && topLeft.col <= cellCoords.col && bottomRight.col >= cellCoords.col);
};
WalkontableCellRange.prototype.includesRange = function(testedRange) {
  return this.includes(testedRange.getTopLeftCorner()) && this.includes(testedRange.getBottomRightCorner());
};
WalkontableCellRange.prototype.isEqual = function(testedRange) {
  return (Math.min(this.from.row, this.to.row) == Math.min(testedRange.from.row, testedRange.to.row)) && (Math.max(this.from.row, this.to.row) == Math.max(testedRange.from.row, testedRange.to.row)) && (Math.min(this.from.col, this.to.col) == Math.min(testedRange.from.col, testedRange.to.col)) && (Math.max(this.from.col, this.to.col) == Math.max(testedRange.from.col, testedRange.to.col));
};
WalkontableCellRange.prototype.overlaps = function(testedRange) {
  return testedRange.isSouthEastOf(this.getTopLeftCorner()) && testedRange.isNorthWestOf(this.getBottomRightCorner());
};
WalkontableCellRange.prototype.isSouthEastOf = function(testedCoords) {
  return this.getTopLeftCorner().isSouthEastOf(testedCoords) || this.getBottomRightCorner().isSouthEastOf(testedCoords);
};
WalkontableCellRange.prototype.isNorthWestOf = function(testedCoords) {
  return this.getTopLeftCorner().isNorthWestOf(testedCoords) || this.getBottomRightCorner().isNorthWestOf(testedCoords);
};
WalkontableCellRange.prototype.expand = function(cellCoords) {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  if (cellCoords.row < topLeft.row || cellCoords.col < topLeft.col || cellCoords.row > bottomRight.row || cellCoords.col > bottomRight.col) {
    this.from = new WalkontableCellCoords(Math.min(topLeft.row, cellCoords.row), Math.min(topLeft.col, cellCoords.col));
    this.to = new WalkontableCellCoords(Math.max(bottomRight.row, cellCoords.row), Math.max(bottomRight.col, cellCoords.col));
    return true;
  }
  return false;
};
WalkontableCellRange.prototype.expandByRange = function(expandingRange) {
  if (this.includesRange(expandingRange) || !this.overlaps(expandingRange)) {
    return false;
  }
  var topLeft = this.getTopLeftCorner(),
      bottomRight = this.getBottomRightCorner(),
      topRight = this.getTopRightCorner(),
      bottomLeft = this.getBottomLeftCorner();
  var expandingTopLeft = expandingRange.getTopLeftCorner();
  var expandingBottomRight = expandingRange.getBottomRightCorner();
  var resultTopRow = Math.min(topLeft.row, expandingTopLeft.row);
  var resultTopCol = Math.min(topLeft.col, expandingTopLeft.col);
  var resultBottomRow = Math.max(bottomRight.row, expandingBottomRight.row);
  var resultBottomCol = Math.max(bottomRight.col, expandingBottomRight.col);
  var finalFrom = new WalkontableCellCoords(resultTopRow, resultTopCol),
      finalTo = new WalkontableCellCoords(resultBottomRow, resultBottomCol);
  var isCorner = new WalkontableCellRange(finalFrom, finalFrom, finalTo).isCorner(this.from, expandingRange),
      onlyMerge = expandingRange.isEqual(new WalkontableCellRange(finalFrom, finalFrom, finalTo));
  if (isCorner && !onlyMerge) {
    if (this.from.col > finalFrom.col) {
      finalFrom.col = resultBottomCol;
      finalTo.col = resultTopCol;
    }
    if (this.from.row > finalFrom.row) {
      finalFrom.row = resultBottomRow;
      finalTo.row = resultTopRow;
    }
  }
  this.from = finalFrom;
  this.to = finalTo;
  return true;
};
WalkontableCellRange.prototype.getDirection = function() {
  if (this.from.isNorthWestOf(this.to)) {
    return "NW-SE";
  } else if (this.from.isNorthEastOf(this.to)) {
    return "NE-SW";
  } else if (this.from.isSouthEastOf(this.to)) {
    return "SE-NW";
  } else if (this.from.isSouthWestOf(this.to)) {
    return "SW-NE";
  }
};
WalkontableCellRange.prototype.setDirection = function(direction) {
  switch (direction) {
    case "NW-SE":
      this.from = this.getTopLeftCorner();
      this.to = this.getBottomRightCorner();
      break;
    case "NE-SW":
      this.from = this.getTopRightCorner();
      this.to = this.getBottomLeftCorner();
      break;
    case "SE-NW":
      this.from = this.getBottomRightCorner();
      this.to = this.getTopLeftCorner();
      break;
    case "SW-NE":
      this.from = this.getBottomLeftCorner();
      this.to = this.getTopRightCorner();
      break;
  }
};
WalkontableCellRange.prototype.getTopLeftCorner = function() {
  return new WalkontableCellCoords(Math.min(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
};
WalkontableCellRange.prototype.getBottomRightCorner = function() {
  return new WalkontableCellCoords(Math.max(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
};
WalkontableCellRange.prototype.getTopRightCorner = function() {
  return new WalkontableCellCoords(Math.min(this.from.row, this.to.row), Math.max(this.from.col, this.to.col));
};
WalkontableCellRange.prototype.getBottomLeftCorner = function() {
  return new WalkontableCellCoords(Math.max(this.from.row, this.to.row), Math.min(this.from.col, this.to.col));
};
WalkontableCellRange.prototype.isCorner = function(coords, expandedRange) {
  if (expandedRange) {
    if (expandedRange.includes(coords)) {
      if (this.getTopLeftCorner().isEqual(new WalkontableCellCoords(expandedRange.from.row, expandedRange.from.col)) || this.getTopRightCorner().isEqual(new WalkontableCellCoords(expandedRange.from.row, expandedRange.to.col)) || this.getBottomLeftCorner().isEqual(new WalkontableCellCoords(expandedRange.to.row, expandedRange.from.col)) || this.getBottomRightCorner().isEqual(new WalkontableCellCoords(expandedRange.to.row, expandedRange.to.col))) {
        return true;
      }
    }
  }
  return coords.isEqual(this.getTopLeftCorner()) || coords.isEqual(this.getTopRightCorner()) || coords.isEqual(this.getBottomLeftCorner()) || coords.isEqual(this.getBottomRightCorner());
};
WalkontableCellRange.prototype.getOppositeCorner = function(coords, expandedRange) {
  if (!(coords instanceof WalkontableCellCoords)) {
    return false;
  }
  if (expandedRange) {
    if (expandedRange.includes(coords)) {
      if (this.getTopLeftCorner().isEqual(new WalkontableCellCoords(expandedRange.from.row, expandedRange.from.col))) {
        return this.getBottomRightCorner();
      }
      if (this.getTopRightCorner().isEqual(new WalkontableCellCoords(expandedRange.from.row, expandedRange.to.col))) {
        return this.getBottomLeftCorner();
      }
      if (this.getBottomLeftCorner().isEqual(new WalkontableCellCoords(expandedRange.to.row, expandedRange.from.col))) {
        return this.getTopRightCorner();
      }
      if (this.getBottomRightCorner().isEqual(new WalkontableCellCoords(expandedRange.to.row, expandedRange.to.col))) {
        return this.getTopLeftCorner();
      }
    }
  }
  if (coords.isEqual(this.getBottomRightCorner())) {
    return this.getTopLeftCorner();
  } else if (coords.isEqual(this.getTopLeftCorner())) {
    return this.getBottomRightCorner();
  } else if (coords.isEqual(this.getTopRightCorner())) {
    return this.getBottomLeftCorner();
  } else if (coords.isEqual(this.getBottomLeftCorner())) {
    return this.getTopRightCorner();
  }
};
WalkontableCellRange.prototype.getBordersSharedWith = function(range) {
  if (!this.includesRange(range)) {
    return [];
  }
  var thisBorders = {
    top: Math.min(this.from.row, this.to.row),
    bottom: Math.max(this.from.row, this.to.row),
    left: Math.min(this.from.col, this.to.col),
    right: Math.max(this.from.col, this.to.col)
  },
      rangeBorders = {
        top: Math.min(range.from.row, range.to.row),
        bottom: Math.max(range.from.row, range.to.row),
        left: Math.min(range.from.col, range.to.col),
        right: Math.max(range.from.col, range.to.col)
      },
      result = [];
  if (thisBorders.top == rangeBorders.top) {
    result.push('top');
  }
  if (thisBorders.right == rangeBorders.right) {
    result.push('right');
  }
  if (thisBorders.bottom == rangeBorders.bottom) {
    result.push('bottom');
  }
  if (thisBorders.left == rangeBorders.left) {
    result.push('left');
  }
  return result;
};
WalkontableCellRange.prototype.getInner = function() {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  var out = [];
  for (var r = topLeft.row; r <= bottomRight.row; r++) {
    for (var c = topLeft.col; c <= bottomRight.col; c++) {
      if (!(this.from.row === r && this.from.col === c) && !(this.to.row === r && this.to.col === c)) {
        out.push(new WalkontableCellCoords(r, c));
      }
    }
  }
  return out;
};
WalkontableCellRange.prototype.getAll = function() {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  var out = [];
  for (var r = topLeft.row; r <= bottomRight.row; r++) {
    for (var c = topLeft.col; c <= bottomRight.col; c++) {
      if (topLeft.row === r && topLeft.col === c) {
        out.push(topLeft);
      } else if (bottomRight.row === r && bottomRight.col === c) {
        out.push(bottomRight);
      } else {
        out.push(new WalkontableCellCoords(r, c));
      }
    }
  }
  return out;
};
WalkontableCellRange.prototype.forAll = function(callback) {
  var topLeft = this.getTopLeftCorner();
  var bottomRight = this.getBottomRightCorner();
  for (var r = topLeft.row; r <= bottomRight.row; r++) {
    for (var c = topLeft.col; c <= bottomRight.col; c++) {
      var breakIteration = callback(r, c);
      if (breakIteration === false) {
        return;
      }
    }
  }
};


//# 
},{"./cellCoords.js":8}],10:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableColumnFilter: {get: function() {
      return WalkontableColumnFilter;
    }},
  __esModule: {value: true}
});
;
window.WalkontableColumnFilter = WalkontableColumnFilter;
function WalkontableColumnFilter(offset, total, countTH) {
  this.offset = offset;
  this.total = total;
  this.countTH = countTH;
}
WalkontableColumnFilter.prototype.offsetted = function(n) {
  return n + this.offset;
};
WalkontableColumnFilter.prototype.unOffsetted = function(n) {
  return n - this.offset;
};
WalkontableColumnFilter.prototype.renderedToSource = function(n) {
  return this.offsetted(n);
};
WalkontableColumnFilter.prototype.sourceToRendered = function(n) {
  return this.unOffsetted(n);
};
WalkontableColumnFilter.prototype.offsettedTH = function(n) {
  return n - this.countTH;
};
WalkontableColumnFilter.prototype.unOffsettedTH = function(n) {
  return n + this.countTH;
};
WalkontableColumnFilter.prototype.visibleRowHeadedColumnToSourceColumn = function(n) {
  return this.renderedToSource(this.offsettedTH(n));
};
WalkontableColumnFilter.prototype.sourceColumnToVisibleRowHeadedColumn = function(n) {
  return this.unOffsettedTH(this.sourceToRendered(n));
};


//# 
},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableColumnStrategy: {get: function() {
      return WalkontableColumnStrategy;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__,
    $__cellCoords_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
var WalkontableCellCoords = ($__cellCoords_46_js__ = require("./cellCoords.js"), $__cellCoords_46_js__ && $__cellCoords_46_js__.__esModule && $__cellCoords_46_js__ || {default: $__cellCoords_46_js__}).WalkontableCellCoords;
;
window.WalkontableColumnStrategy = WalkontableColumnStrategy;
function WalkontableColumnStrategy(instance, containerSizeFn, sizeAtIndex, strategy) {
  var size,
      i = 0;
  this.instance = instance;
  this.containerSizeFn = containerSizeFn;
  this.cellSizesSum = 0;
  this.cellSizes = [];
  this.cellStretch = [];
  this.cellCount = 0;
  this.visibleCellCount = 0;
  this.remainingSize = 0;
  this.strategy = strategy;
  while (true) {
    size = sizeAtIndex(i);
    if (size === void 0) {
      break;
    }
    if (this.cellSizesSum < this.getContainerSize()) {
      this.visibleCellCount++;
    }
    this.cellSizes.push(size);
    this.cellSizesSum += size;
    this.cellCount++;
    i++;
  }
  var containerSize = this.getContainerSize();
  this.remainingSize = this.cellSizesSum - containerSize;
}
WalkontableColumnStrategy.prototype.getContainerSize = function() {
  return typeof this.containerSizeFn === 'function' ? this.containerSizeFn() : this.containerSizeFn;
};
WalkontableColumnStrategy.prototype.getSize = function(index) {
  return this.cellSizes[index] + (this.cellStretch[index] || 0);
};
WalkontableColumnStrategy.prototype.stretch = function() {
  var containerSize = this.getContainerSize(),
      i = 0;
  this.remainingSize = this.cellSizesSum - containerSize;
  this.cellStretch.length = 0;
  if (this.strategy === 'all') {
    if (this.remainingSize < 0) {
      var ratio = containerSize / this.cellSizesSum;
      var newSize;
      while (i < this.cellCount - 1) {
        newSize = Math.floor(ratio * this.cellSizes[i]);
        this.remainingSize += newSize - this.cellSizes[i];
        this.cellStretch[i] = newSize - this.cellSizes[i];
        i++;
      }
      this.cellStretch[this.cellCount - 1] = -this.remainingSize;
      this.remainingSize = 0;
    }
  } else if (this.strategy === 'last') {
    if (this.remainingSize < 0 && containerSize !== Infinity) {
      this.cellStretch[this.cellCount - 1] = -this.remainingSize;
      this.remainingSize = 0;
    }
  }
};
WalkontableColumnStrategy.prototype.countVisible = function() {
  return this.visibleCellCount;
};
WalkontableColumnStrategy.prototype.isLastIncomplete = function() {
  var firstRow = this.instance.wtTable.getFirstVisibleRow();
  var lastCol = this.instance.wtTable.getLastVisibleColumn();
  var cell = this.instance.wtTable.getCell(new WalkontableCellCoords(firstRow, lastCol));
  var cellOffset = dom.offset(cell);
  var cellWidth = dom.outerWidth(cell);
  var cellEnd = cellOffset.left + cellWidth;
  var viewportOffsetLeft = this.instance.wtOverlays.topOverlay.getScrollPosition();
  var viewportWitdh = this.instance.wtViewport.getViewportWidth();
  var viewportEnd = viewportOffsetLeft + viewportWitdh;
  return viewportEnd >= cellEnd;
};


//# 
},{"./../../../dom.js":34,"./cellCoords.js":8}],12:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  Walkontable: {get: function() {
      return Walkontable;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__,
    $__event_46_js__,
    $__overlays_46_js__,
    $__helpers_46_js__,
    $__scroll_46_js__,
    $__settings_46_js__,
    $__table_46_js__,
    $__viewport_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
var WalkontableEvent = ($__event_46_js__ = require("./event.js"), $__event_46_js__ && $__event_46_js__.__esModule && $__event_46_js__ || {default: $__event_46_js__}).WalkontableEvent;
var WalkontableOverlays = ($__overlays_46_js__ = require("./overlays.js"), $__overlays_46_js__ && $__overlays_46_js__.__esModule && $__overlays_46_js__ || {default: $__overlays_46_js__}).WalkontableOverlays;
var walkontableRandomString = ($__helpers_46_js__ = require("./helpers.js"), $__helpers_46_js__ && $__helpers_46_js__.__esModule && $__helpers_46_js__ || {default: $__helpers_46_js__}).walkontableRandomString;
var WalkontableScroll = ($__scroll_46_js__ = require("./scroll.js"), $__scroll_46_js__ && $__scroll_46_js__.__esModule && $__scroll_46_js__ || {default: $__scroll_46_js__}).WalkontableScroll;
var WalkontableSettings = ($__settings_46_js__ = require("./settings.js"), $__settings_46_js__ && $__settings_46_js__.__esModule && $__settings_46_js__ || {default: $__settings_46_js__}).WalkontableSettings;
var WalkontableTable = ($__table_46_js__ = require("./table.js"), $__table_46_js__ && $__table_46_js__.__esModule && $__table_46_js__ || {default: $__table_46_js__}).WalkontableTable;
var WalkontableViewport = ($__viewport_46_js__ = require("./viewport.js"), $__viewport_46_js__ && $__viewport_46_js__.__esModule && $__viewport_46_js__ || {default: $__viewport_46_js__}).WalkontableViewport;
;
window.Walkontable = Walkontable;
function Walkontable(settings) {
  var originalHeaders = [];
  this.guid = 'wt_' + walkontableRandomString();
  if (settings.cloneSource) {
    this.cloneSource = settings.cloneSource;
    this.cloneOverlay = settings.cloneOverlay;
    this.wtSettings = settings.cloneSource.wtSettings;
    this.wtTable = new WalkontableTable(this, settings.table, settings.wtRootElement);
    this.wtScroll = new WalkontableScroll(this);
    this.wtViewport = settings.cloneSource.wtViewport;
    this.wtEvent = new WalkontableEvent(this);
    this.selections = this.cloneSource.selections;
  } else {
    this.wtSettings = new WalkontableSettings(this, settings);
    this.wtTable = new WalkontableTable(this, settings.table);
    this.wtScroll = new WalkontableScroll(this);
    this.wtViewport = new WalkontableViewport(this);
    this.wtEvent = new WalkontableEvent(this);
    this.selections = this.getSetting('selections');
    this.wtOverlays = new WalkontableOverlays(this);
  }
  if (this.wtTable.THEAD.childNodes.length && this.wtTable.THEAD.childNodes[0].childNodes.length) {
    for (var c = 0,
        clen = this.wtTable.THEAD.childNodes[0].childNodes.length; c < clen; c++) {
      originalHeaders.push(this.wtTable.THEAD.childNodes[0].childNodes[c].innerHTML);
    }
    if (!this.getSetting('columnHeaders').length) {
      this.update('columnHeaders', [function(column, TH) {
        dom.fastInnerText(TH, originalHeaders[column]);
      }]);
    }
  }
  this.drawn = false;
  this.drawInterrupted = false;
}
Walkontable.prototype.draw = function(fastDraw) {
  this.drawInterrupted = false;
  if (!fastDraw && !dom.isVisible(this.wtTable.TABLE)) {
    this.drawInterrupted = true;
    return this;
  }
  this.wtTable.draw(fastDraw);
  return this;
};
Walkontable.prototype.getCell = function(coords, topmost) {
  if (!topmost) {
    return this.wtTable.getCell(coords);
  } else {
    var fixedRows = this.wtSettings.getSetting('fixedRowsTop'),
        fixedColumns = this.wtSettings.getSetting('fixedColumnsLeft');
    if (coords.row < fixedRows && coords.col < fixedColumns) {
      return this.wtOverlays.topLeftCornerOverlay.clone.wtTable.getCell(coords);
    } else if (coords.row < fixedRows) {
      return this.wtOverlays.topOverlay.clone.wtTable.getCell(coords);
    } else if (coords.col < fixedColumns) {
      return this.wtOverlays.leftOverlay.clone.wtTable.getCell(coords);
    } else {
      return this.wtTable.getCell(coords);
    }
  }
};
Walkontable.prototype.update = function(settings, value) {
  return this.wtSettings.update(settings, value);
};
Walkontable.prototype.scrollVertical = function(row) {
  this.wtOverlays.topOverlay.scrollTo(row);
  this.getSetting('onScrollVertically');
  return this;
};
Walkontable.prototype.scrollHorizontal = function(column) {
  this.wtOverlays.leftOverlay.scrollTo(column);
  this.getSetting('onScrollHorizontally');
  return this;
};
Walkontable.prototype.scrollViewport = function(coords) {
  this.wtScroll.scrollViewport(coords);
  return this;
};
Walkontable.prototype.getViewport = function() {
  return [this.wtTable.getFirstVisibleRow(), this.wtTable.getFirstVisibleColumn(), this.wtTable.getLastVisibleRow(), this.wtTable.getLastVisibleColumn()];
};
Walkontable.prototype.getSetting = function(key, param1, param2, param3, param4) {
  return this.wtSettings.getSetting(key, param1, param2, param3, param4);
};
Walkontable.prototype.hasSetting = function(key) {
  return this.wtSettings.has(key);
};
Walkontable.prototype.destroy = function() {
  this.wtOverlays.destroy();
  if (this.wtEvent) {
    this.wtEvent.destroy();
  }
};


//# 
},{"./../../../dom.js":34,"./event.js":14,"./helpers.js":15,"./overlays.js":16,"./scroll.js":18,"./settings.js":21,"./table.js":22,"./viewport.js":24}],13:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableDebugOverlay: {get: function() {
      return WalkontableDebugOverlay;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__,
    $___95_overlay_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
var WalkontableOverlay = ($___95_overlay_46_js__ = require("./_overlay.js"), $___95_overlay_46_js__ && $___95_overlay_46_js__.__esModule && $___95_overlay_46_js__ || {default: $___95_overlay_46_js__}).WalkontableOverlay;
;
window.WalkontableDebugOverlay = WalkontableDebugOverlay;
function WalkontableDebugOverlay(instance) {
  this.instance = instance;
  this.init();
  this.clone = this.makeClone('debug');
  this.clone.wtTable.holder.style.opacity = 0.4;
  this.clone.wtTable.holder.style.textShadow = '0 0 2px #ff0000';
  this.lastTimeout = null;
  dom.addClass(this.clone.wtTable.holder.parentNode, 'wtDebugVisible');
}
WalkontableDebugOverlay.prototype = new WalkontableOverlay();
WalkontableDebugOverlay.prototype.destroy = function() {
  WalkontableOverlay.prototype.destroy.call(this);
  clearTimeout(this.lastTimeout);
};


//# 
},{"./../../../dom.js":34,"./_overlay.js":6}],14:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableEvent: {get: function() {
      return WalkontableEvent;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47__46__46__47_eventManager_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
var eventManagerObject = ($___46__46__47__46__46__47__46__46__47_eventManager_46_js__ = require("./../../../eventManager.js"), $___46__46__47__46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_eventManager_46_js__}).eventManager;
;
window.WalkontableEvent = WalkontableEvent;
function WalkontableEvent(instance) {
  var that = this;
  var eventManager = eventManagerObject(instance);
  this.instance = instance;
  var dblClickOrigin = [null, null];
  this.dblClickTimeout = [null, null];
  var onMouseDown = function(event) {
    var cell = that.parentCell(event.realTarget);
    if (dom.hasClass(event.realTarget, 'corner')) {
      that.instance.getSetting('onCellCornerMouseDown', event, event.realTarget);
    } else if (cell.TD) {
      if (that.instance.hasSetting('onCellMouseDown')) {
        that.instance.getSetting('onCellMouseDown', event, cell.coords, cell.TD, that.instance);
      }
    }
    if (event.button !== 2) {
      if (cell.TD) {
        dblClickOrigin[0] = cell.TD;
        clearTimeout(that.dblClickTimeout[0]);
        that.dblClickTimeout[0] = setTimeout(function() {
          dblClickOrigin[0] = null;
        }, 1000);
      }
    }
  };
  var onTouchMove = function(event) {
    that.instance.touchMoving = true;
  };
  var longTouchTimeout;
  var onTouchStart = function(event) {
    var container = this;
    eventManager.addEventListener(this, 'touchmove', onTouchMove);
    that.checkIfTouchMove = setTimeout(function() {
      if (that.instance.touchMoving === true) {
        that.instance.touchMoving = void 0;
        eventManager.removeEventListener("touchmove", onTouchMove, false);
        return;
      } else {
        onMouseDown(event);
      }
    }, 30);
  };
  var lastMouseOver;
  var onMouseOver = function(event) {
    var table,
        td;
    if (that.instance.hasSetting('onCellMouseOver')) {
      table = that.instance.wtTable.TABLE;
      td = dom.closest(event.realTarget, ['TD', 'TH'], table);
      if (td && td !== lastMouseOver && dom.isChildOf(td, table)) {
        lastMouseOver = td;
        that.instance.getSetting('onCellMouseOver', event, that.instance.wtTable.getCoords(td), td, that.instance);
      }
    }
  };
  var onMouseUp = function(event) {
    if (event.button !== 2) {
      var cell = that.parentCell(event.realTarget);
      if (cell.TD === dblClickOrigin[0] && cell.TD === dblClickOrigin[1]) {
        if (dom.hasClass(event.realTarget, 'corner')) {
          that.instance.getSetting('onCellCornerDblClick', event, cell.coords, cell.TD, that.instance);
        } else {
          that.instance.getSetting('onCellDblClick', event, cell.coords, cell.TD, that.instance);
        }
        dblClickOrigin[0] = null;
        dblClickOrigin[1] = null;
      } else if (cell.TD === dblClickOrigin[0]) {
        dblClickOrigin[1] = cell.TD;
        clearTimeout(that.dblClickTimeout[1]);
        that.dblClickTimeout[1] = setTimeout(function() {
          dblClickOrigin[1] = null;
        }, 500);
      }
    }
  };
  var onTouchEnd = function(event) {
    clearTimeout(longTouchTimeout);
    event.preventDefault();
    onMouseUp(event);
  };
  eventManager.addEventListener(this.instance.wtTable.holder, 'mousedown', onMouseDown);
  eventManager.addEventListener(this.instance.wtTable.TABLE, 'mouseover', onMouseOver);
  eventManager.addEventListener(this.instance.wtTable.holder, 'mouseup', onMouseUp);
  if (this.instance.wtTable.holder.parentNode.parentNode && Handsontable.mobileBrowser && !that.instance.wtTable.isWorkingOnClone()) {
    var classSelector = "." + this.instance.wtTable.holder.parentNode.className.split(" ").join(".");
    eventManager.addEventListener(this.instance.wtTable.holder, 'touchstart', function(event) {
      that.instance.touchApplied = true;
      if (dom.isChildOf(event.target, classSelector)) {
        onTouchStart.call(event.target, event);
      }
    });
    eventManager.addEventListener(this.instance.wtTable.holder, 'touchend', function(event) {
      that.instance.touchApplied = false;
      if (dom.isChildOf(event.target, classSelector)) {
        onTouchEnd.call(event.target, event);
      }
    });
    if (!that.instance.momentumScrolling) {
      that.instance.momentumScrolling = {};
    }
    eventManager.addEventListener(this.instance.wtTable.holder, 'scroll', function(event) {
      clearTimeout(that.instance.momentumScrolling._timeout);
      if (!that.instance.momentumScrolling.ongoing) {
        that.instance.getSetting('onBeforeTouchScroll');
      }
      that.instance.momentumScrolling.ongoing = true;
      that.instance.momentumScrolling._timeout = setTimeout(function() {
        if (!that.instance.touchApplied) {
          that.instance.momentumScrolling.ongoing = false;
          that.instance.getSetting('onAfterMomentumScroll');
        }
      }, 200);
    });
  }
  eventManager.addEventListener(window, 'resize', function() {
    that.instance.draw();
  });
  this.destroy = function() {
    clearTimeout(this.dblClickTimeout[0]);
    clearTimeout(this.dblClickTimeout[1]);
    eventManager.clear();
  };
}
WalkontableEvent.prototype.parentCell = function(elem) {
  var cell = {};
  var TABLE = this.instance.wtTable.TABLE;
  var TD = dom.closest(elem, ['TD', 'TH'], TABLE);
  if (TD && dom.isChildOf(TD, TABLE)) {
    cell.coords = this.instance.wtTable.getCoords(TD);
    cell.TD = TD;
  } else if (dom.hasClass(elem, 'wtBorder') && dom.hasClass(elem, 'current')) {
    cell.coords = this.instance.selections.current.cellRange.highlight;
    cell.TD = this.instance.wtTable.getCell(cell.coords);
  } else if (dom.hasClass(elem, 'wtBorder') && dom.hasClass(elem, 'area')) {
    if (this.instance.selections.area.cellRange) {
      cell.coords = this.instance.selections.area.cellRange.to;
      cell.TD = this.instance.wtTable.getCell(cell.coords);
    }
  }
  return cell;
};


//# 
},{"./../../../dom.js":34,"./../../../eventManager.js":48}],15:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  walkontableRangesIntersect: {get: function() {
      return walkontableRangesIntersect;
    }},
  walkontableRandomString: {get: function() {
      return walkontableRandomString;
    }},
  __esModule: {value: true}
});
window.walkontableRangesIntersect = walkontableRangesIntersect;
window.walkontableRandomString = walkontableRandomString;
function walkontableRangesIntersect() {
  var from = arguments[0];
  var to = arguments[1];
  for (var i = 1,
      ilen = arguments.length / 2; i < ilen; i++) {
    if (from <= arguments[2 * i + 1] && to >= arguments[2 * i]) {
      return true;
    }
  }
  return false;
}
function walkontableRandomString() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + s4() + s4();
}


//# 
},{}],16:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableOverlays: {get: function() {
      return WalkontableOverlays;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_eventManager_46_js__,
    $___46__46__47__46__46__47__46__46__47_dom_46_js__;
var eventManagerObject = ($___46__46__47__46__46__47__46__46__47_eventManager_46_js__ = require("./../../../eventManager.js"), $___46__46__47__46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
;
window.WalkontableOverlays = WalkontableOverlays;
function WalkontableOverlays(instance) {
  this.instance = instance;
  instance.update('scrollbarWidth', dom.getScrollbarWidth());
  instance.update('scrollbarHeight', dom.getScrollbarWidth());
  this.topOverlay = new WalkontableTopOverlay(instance);
  this.leftOverlay = new WalkontableLeftOverlay(instance);
  this.topLeftCornerOverlay = new WalkontableCornerOverlay(instance);
  this.scrollCallbacksPending = 0;
  if (instance.getSetting('debug')) {
    this.debug = new WalkontableDebugOverlay(instance);
  }
  this.registerListeners();
}
WalkontableOverlays.prototype.registerListeners = function() {
  var that = this;
  this.mainTableScrollableElement = dom.getScrollableElement(this.instance.wtTable.TABLE);
  this.refreshAll = function refreshAll() {
    if (!that.instance.drawn) {
      return;
    }
    if (!that.instance.wtTable.holder.parentNode) {
      that.destroy();
      return;
    }
    that.instance.draw(true);
    that.topOverlay.onScroll();
    that.leftOverlay.onScroll();
  };
  var eventManager = eventManagerObject(that.instance);
  this.requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
  this.overlayScrollPositions = {
    'master': {
      top: 0,
      left: 0
    },
    'top': {
      top: null,
      left: 0
    },
    'left': {
      top: 0,
      left: null
    }
  };
  eventManager.addEventListener(this.mainTableScrollableElement, 'scroll', function(e) {
    that.requestAnimFrame.call(window, function() {
      that.syncScrollPositions(e);
    });
  });
  eventManager.addEventListener(this.topOverlay.clone.wtTable.holder, 'scroll', function(e) {
    that.requestAnimFrame.call(window, function() {
      that.syncScrollPositions(e);
    });
  });
  eventManager.addEventListener(this.topOverlay.clone.wtTable.holder, 'wheel', function(e) {
    that.requestAnimFrame.call(window, function() {
      that.translateMouseWheelToScroll(e);
    });
  });
  eventManager.addEventListener(this.leftOverlay.clone.wtTable.holder, 'scroll', function(e) {
    that.requestAnimFrame.call(window, function() {
      that.syncScrollPositions(e);
    });
  });
  eventManager.addEventListener(this.leftOverlay.clone.wtTable.holder, 'wheel', function(e) {
    that.requestAnimFrame.call(window, function() {
      that.translateMouseWheelToScroll(e);
    });
  });
  if (this.topOverlay.trimmingContainer !== window && this.leftOverlay.trimmingContainer !== window) {
    eventManager.addEventListener(window, 'scroll', function(e) {
      that.refreshAll();
    });
    eventManager.addEventListener(window, 'wheel', function(e) {
      var overlay,
          deltaY = e.wheelDeltaY || e.deltaY,
          deltaX = e.wheelDeltaX || e.deltaX;
      if (that.topOverlay.clone.wtTable.holder.contains(e.target)) {
        overlay = 'top';
      } else if (that.leftOverlay.clone.wtTable.holder.contains(e.target)) {
        overlay = 'left';
      }
      if (overlay == 'top' && deltaY !== 0) {
        e.preventDefault();
      } else if (overlay == 'left' && deltaX !== 0) {
        e.preventDefault();
      }
    });
  }
};
WalkontableOverlays.prototype.translateMouseWheelToScroll = function(e) {
  var topOverlay = this.topOverlay.clone.wtTable.holder,
      leftOverlay = this.leftOverlay.clone.wtTable.holder,
      parentHolder,
      tempElem = e.target,
      eventMockup = {},
      deltaY = e.wheelDeltaY || (-1) * e.deltaY,
      deltaX = e.wheelDeltaX || (-1) * e.deltaX;
  while (tempElem != document && tempElem != null) {
    if (tempElem.className.indexOf('wtHolder') > -1) {
      parentHolder = tempElem;
      break;
    }
    tempElem = tempElem.parentNode;
  }
  eventMockup.target = parentHolder;
  if (parentHolder == topOverlay) {
    this.syncScrollPositions(eventMockup, (-0.2) * deltaY);
  } else if (parentHolder == leftOverlay) {
    this.syncScrollPositions(eventMockup, (-0.2) * deltaX);
  }
  return false;
};
WalkontableOverlays.prototype.syncScrollPositions = function(e, fakeScrollValue) {
  if (this.destroyed) {
    return;
  }
  if (this.scrollCallbacksPending > 0) {
    this.scrollCallbacksPending--;
    return;
  }
  var target = e.target,
      master = this.topOverlay.mainTableScrollableElement,
      topOverlay = this.topOverlay.clone.wtTable.holder,
      leftOverlay = this.leftOverlay.clone.wtTable.holder,
      tempScrollValue = 0,
      scrollValueChanged = false;
  if (target === document) {
    target = window;
  }
  if (target === master || target === document) {
    tempScrollValue = dom.getScrollLeft(target);
    if (this.overlayScrollPositions.master.left !== tempScrollValue) {
      this.scrollCallbacksPending++;
      topOverlay.scrollLeft = tempScrollValue;
      this.overlayScrollPositions.master.left = tempScrollValue;
      scrollValueChanged = true;
    }
    tempScrollValue = dom.getScrollTop(target);
    if (this.overlayScrollPositions.master.top !== tempScrollValue) {
      this.scrollCallbacksPending++;
      leftOverlay.scrollTop = tempScrollValue;
      this.overlayScrollPositions.master.top = tempScrollValue;
      scrollValueChanged = true;
    }
  } else if (target === topOverlay) {
    tempScrollValue = dom.getScrollLeft(target);
    if (this.overlayScrollPositions.top.left !== tempScrollValue) {
      this.scrollCallbacksPending++;
      master.scrollLeft = tempScrollValue;
      this.overlayScrollPositions.top.left = tempScrollValue;
      scrollValueChanged = true;
    }
    if (fakeScrollValue) {
      master.scrollTop += fakeScrollValue;
    }
  } else if (target === leftOverlay) {
    tempScrollValue = dom.getScrollTop(target);
    if (this.overlayScrollPositions.left.top !== tempScrollValue) {
      this.scrollCallbacksPending++;
      master.scrollTop = tempScrollValue;
      this.overlayScrollPositions.left.top = tempScrollValue;
      scrollValueChanged = true;
    }
    if (fakeScrollValue) {
      master.scrollLeft += fakeScrollValue;
    }
  }
  if (scrollValueChanged) {
    this.refreshAll();
  }
};
WalkontableOverlays.prototype.destroy = function() {
  var eventManager = eventManagerObject(this.instance);
  if (this.topOverlay) {
    this.topOverlay.destroy();
    eventManager.removeEventListener(this.topOverlay.trimmingContainer, 'scroll', this.refreshAll);
  }
  if (this.leftOverlay) {
    this.leftOverlay.destroy();
    eventManager.removeEventListener(this.leftOverlay.trimmingContainer, 'scroll', this.refreshAll);
  }
  eventManager.removeEventListener(window, 'scroll', this.refreshAll);
  if (this.topLeftCornerOverlay) {
    this.topLeftCornerOverlay.destroy();
  }
  if (this.debug) {
    this.debug.destroy();
  }
  this.destroyed = true;
};
WalkontableOverlays.prototype.refresh = function(fastDraw) {
  if (this.leftOverlay) {
    this.leftOverlay.refresh(fastDraw);
  }
  if (this.topOverlay) {
    this.topOverlay.refresh(fastDraw);
  }
  if (this.topLeftCornerOverlay) {
    this.topLeftCornerOverlay.refresh(fastDraw);
  }
  if (this.debug) {
    this.debug.refresh(fastDraw);
  }
};
WalkontableOverlays.prototype.applyToDOM = function() {
  if (this.leftOverlay) {
    this.leftOverlay.applyToDOM();
  }
  if (this.topOverlay) {
    this.topOverlay.applyToDOM();
  }
};


//# 
},{"./../../../dom.js":34,"./../../../eventManager.js":48}],17:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableRowFilter: {get: function() {
      return WalkontableRowFilter;
    }},
  __esModule: {value: true}
});
;
window.WalkontableRowFilter = WalkontableRowFilter;
function WalkontableRowFilter(offset, total, countTH) {
  this.offset = offset;
  this.total = total;
  this.countTH = countTH;
}
WalkontableRowFilter.prototype.offsetted = function(n) {
  return n + this.offset;
};
WalkontableRowFilter.prototype.unOffsetted = function(n) {
  return n - this.offset;
};
WalkontableRowFilter.prototype.renderedToSource = function(n) {
  return this.offsetted(n);
};
WalkontableRowFilter.prototype.sourceToRendered = function(n) {
  return this.unOffsetted(n);
};
WalkontableRowFilter.prototype.offsettedTH = function(n) {
  return n - this.countTH;
};
WalkontableRowFilter.prototype.visibleColHeadedRowToSourceRow = function(n) {
  return this.renderedToSource(this.offsettedTH(n));
};
WalkontableRowFilter.prototype.sourceRowToVisibleColHeadedRow = function(n) {
  return this.unOffsettedTH(this.sourceToRendered(n));
};


//# 
},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableScroll: {get: function() {
      return WalkontableScroll;
    }},
  __esModule: {value: true}
});
;
window.WalkontableScroll = WalkontableScroll;
function WalkontableScroll(instance) {
  this.instance = instance;
}
WalkontableScroll.prototype.scrollViewport = function(coords) {
  if (!this.instance.drawn) {
    return;
  }
  var totalRows = this.instance.getSetting('totalRows'),
      totalColumns = this.instance.getSetting('totalColumns');
  if (coords.row < 0 || coords.row > totalRows - 1) {
    throw new Error('row ' + coords.row + ' does not exist');
  }
  if (coords.col < 0 || coords.col > totalColumns - 1) {
    throw new Error('column ' + coords.col + ' does not exist');
  }
  if (coords.row > this.instance.wtTable.getLastVisibleRow()) {
    this.instance.wtOverlays.topOverlay.scrollTo(coords.row, true);
  } else if (coords.row >= this.instance.getSetting('fixedRowsTop') && coords.row < this.instance.wtTable.getFirstVisibleRow()) {
    this.instance.wtOverlays.topOverlay.scrollTo(coords.row);
  }
  if (coords.col > this.instance.wtTable.getLastVisibleColumn()) {
    this.instance.wtOverlays.leftOverlay.scrollTo(coords.col, true);
  } else if (coords.col >= this.instance.getSetting('fixedColumnsLeft') && coords.col < this.instance.wtTable.getFirstVisibleColumn()) {
    this.instance.wtOverlays.leftOverlay.scrollTo(coords.col);
  }
};


//# 
},{}],19:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableHorizontalScrollbarNative: {get: function() {
      return WalkontableHorizontalScrollbarNative;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__,
    $___95_overlay_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
var WalkontableOverlay = ($___95_overlay_46_js__ = require("./_overlay.js"), $___95_overlay_46_js__ && $___95_overlay_46_js__.__esModule && $___95_overlay_46_js__ || {default: $___95_overlay_46_js__}).WalkontableOverlay;
;
window.WalkontableHorizontalScrollbarNative = WalkontableHorizontalScrollbarNative;
function WalkontableHorizontalScrollbarNative(instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.offset = 0;
  this.init();
  this.clone = this.makeClone('left');
}
WalkontableHorizontalScrollbarNative.prototype = new WalkontableOverlay();
WalkontableHorizontalScrollbarNative.prototype.resetFixedPosition = function() {
  var finalLeft,
      finalTop;
  if (!this.instance.wtTable.holder.parentNode) {
    return;
  }
  var elem = this.clone.wtTable.holder.parentNode;
  if (this.scrollHandler === window) {
    var box = this.instance.wtTable.holder.getBoundingClientRect();
    var left = Math.ceil(box.left);
    var right = Math.ceil(box.right);
    if (left < 0 && (right - elem.offsetWidth) > 0) {
      finalLeft = -left + 'px';
    } else {
      finalLeft = '0';
    }
    finalTop = this.instance.wtTable.hider.style.top;
  } else if (!Handsontable.freezeOverlays) {
    finalLeft = this.getScrollPosition() + "px";
    finalTop = this.instance.wtTable.hider.style.top;
  }
  dom.setOverlayPosition(elem, finalLeft, finalTop);
  elem.style.height = dom.outerHeight(this.clone.wtTable.TABLE) + 'px';
  elem.style.width = dom.outerWidth(this.clone.wtTable.TABLE) + 4 + 'px';
};
WalkontableHorizontalScrollbarNative.prototype.refresh = function(fastDraw) {
  this.applyToDOM();
  WalkontableOverlay.prototype.refresh.call(this, fastDraw);
};
WalkontableHorizontalScrollbarNative.prototype.getScrollPosition = function() {
  return dom.getScrollLeft(this.scrollHandler);
};
WalkontableHorizontalScrollbarNative.prototype.setScrollPosition = function(pos) {
  if (this.scrollHandler === window) {
    window.scrollTo(pos, dom.getWindowScrollTop());
  } else {
    this.scrollHandler.scrollLeft = pos;
  }
};
WalkontableHorizontalScrollbarNative.prototype.onScroll = function() {
  this.instance.getSetting('onScrollHorizontally');
};
WalkontableHorizontalScrollbarNative.prototype.sumCellSizes = function(from, length) {
  var sum = 0;
  while (from < length) {
    sum += this.instance.wtTable.getStretchedColumnWidth(from) || this.instance.wtSettings.defaultColumnWidth;
    from++;
  }
  return sum;
};
WalkontableHorizontalScrollbarNative.prototype.applyToDOM = function() {
  var total = this.instance.getSetting('totalColumns');
  var headerSize = this.instance.wtViewport.getRowHeaderWidth();
  this.fixedContainer.style.width = headerSize + this.sumCellSizes(0, total) + 'px';
  if (typeof this.instance.wtViewport.columnsRenderCalculator.startPosition === 'number') {
    this.fixed.style.left = this.instance.wtViewport.columnsRenderCalculator.startPosition + 'px';
  } else if (total === 0) {
    this.fixed.style.left = '0';
  } else {
    throw new Error('Incorrect value of the columnsRenderCalculator');
  }
  this.fixed.style.right = '';
};
WalkontableHorizontalScrollbarNative.prototype.scrollTo = function(sourceCol, beyondRendered) {
  var newX = this.getTableParentOffset();
  if (beyondRendered) {
    newX += this.sumCellSizes(0, sourceCol + 1);
    newX -= this.instance.wtViewport.getViewportWidth();
  } else {
    var fixedColumnsLeft = this.instance.getSetting('fixedColumnsLeft');
    newX += this.sumCellSizes(fixedColumnsLeft, sourceCol);
  }
  this.setScrollPosition(newX);
};
WalkontableHorizontalScrollbarNative.prototype.getTableParentOffset = function() {
  if (this.scrollHandler === window) {
    return this.instance.wtTable.holderOffset.left;
  } else {
    return 0;
  }
};


//# 
},{"./../../../dom.js":34,"./_overlay.js":6}],20:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableSelection: {get: function() {
      return WalkontableSelection;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__,
    $__border_46_js__,
    $__cellCoords_46_js__,
    $__cellRange_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
var WalkontableBorder = ($__border_46_js__ = require("./border.js"), $__border_46_js__ && $__border_46_js__.__esModule && $__border_46_js__ || {default: $__border_46_js__}).WalkontableBorder;
var WalkontableCellCoords = ($__cellCoords_46_js__ = require("./cellCoords.js"), $__cellCoords_46_js__ && $__cellCoords_46_js__.__esModule && $__cellCoords_46_js__ || {default: $__cellCoords_46_js__}).WalkontableCellCoords;
var WalkontableCellRange = ($__cellRange_46_js__ = require("./cellRange.js"), $__cellRange_46_js__ && $__cellRange_46_js__.__esModule && $__cellRange_46_js__ || {default: $__cellRange_46_js__}).WalkontableCellRange;
;
window.WalkontableSelection = WalkontableSelection;
function WalkontableSelection(settings, cellRange) {
  this.settings = settings;
  this.cellRange = cellRange || null;
  this.instanceBorders = {};
}
WalkontableSelection.prototype.getBorder = function(instance) {
  if (this.instanceBorders[instance.guid]) {
    return this.instanceBorders[instance.guid];
  }
  this.instanceBorders[instance.guid] = new WalkontableBorder(instance, this.settings);
};
WalkontableSelection.prototype.isEmpty = function() {
  return this.cellRange === null;
};
WalkontableSelection.prototype.add = function(coords) {
  if (this.isEmpty()) {
    this.cellRange = new WalkontableCellRange(coords, coords, coords);
  } else {
    this.cellRange.expand(coords);
  }
};
WalkontableSelection.prototype.replace = function(oldCoords, newCoords) {
  if (!this.isEmpty()) {
    if (this.cellRange.from.isEqual(oldCoords)) {
      this.cellRange.from = newCoords;
      return true;
    }
    if (this.cellRange.to.isEqual(oldCoords)) {
      this.cellRange.to = newCoords;
      return true;
    }
  }
  return false;
};
WalkontableSelection.prototype.clear = function() {
  this.cellRange = null;
};
WalkontableSelection.prototype.getCorners = function() {
  var topLeft = this.cellRange.getTopLeftCorner(),
      bottomRight = this.cellRange.getBottomRightCorner();
  return [topLeft.row, topLeft.col, bottomRight.row, bottomRight.col];
};
WalkontableSelection.prototype.addClassAtCoords = function(instance, sourceRow, sourceColumn, cls) {
  var TD = instance.wtTable.getCell(new WalkontableCellCoords(sourceRow, sourceColumn));
  if (typeof TD === 'object') {
    dom.addClass(TD, cls);
  }
};
WalkontableSelection.prototype.draw = function(instance) {
  var _this = this,
      renderedRows = instance.wtTable.getRenderedRowsCount(),
      renderedColumns = instance.wtTable.getRenderedColumnsCount(),
      corners,
      sourceRow,
      sourceCol,
      border,
      TH;
  if (this.isEmpty()) {
    if (this.settings.border) {
      border = this.getBorder(instance);
      if (border) {
        border.disappear();
      }
    }
    return;
  }
  corners = this.getCorners();
  for (var column = 0; column < renderedColumns; column++) {
    sourceCol = instance.wtTable.columnFilter.renderedToSource(column);
    if (sourceCol >= corners[1] && sourceCol <= corners[3]) {
      TH = instance.wtTable.getColumnHeader(sourceCol);
      if (TH && _this.settings.highlightColumnClassName) {
        dom.addClass(TH, _this.settings.highlightColumnClassName);
      }
    }
  }
  for (var row = 0; row < renderedRows; row++) {
    sourceRow = instance.wtTable.rowFilter.renderedToSource(row);
    if (sourceRow >= corners[0] && sourceRow <= corners[2]) {
      TH = instance.wtTable.getRowHeader(sourceRow);
      if (TH && _this.settings.highlightRowClassName) {
        dom.addClass(TH, _this.settings.highlightRowClassName);
      }
    }
    for (var column = 0; column < renderedColumns; column++) {
      sourceCol = instance.wtTable.columnFilter.renderedToSource(column);
      if (sourceRow >= corners[0] && sourceRow <= corners[2] && sourceCol >= corners[1] && sourceCol <= corners[3]) {
        if (_this.settings.className) {
          _this.addClassAtCoords(instance, sourceRow, sourceCol, _this.settings.className);
        }
      } else if (sourceRow >= corners[0] && sourceRow <= corners[2]) {
        if (_this.settings.highlightRowClassName) {
          _this.addClassAtCoords(instance, sourceRow, sourceCol, _this.settings.highlightRowClassName);
        }
      } else if (sourceCol >= corners[1] && sourceCol <= corners[3]) {
        if (_this.settings.highlightColumnClassName) {
          _this.addClassAtCoords(instance, sourceRow, sourceCol, _this.settings.highlightColumnClassName);
        }
      }
    }
  }
  instance.getSetting('onBeforeDrawBorders', corners, this.settings.className);
  if (this.settings.border) {
    border = this.getBorder(instance);
    if (border) {
      border.appear(corners);
    }
  }
};


//# 
},{"./../../../dom.js":34,"./border.js":7,"./cellCoords.js":8,"./cellRange.js":9}],21:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableSettings: {get: function() {
      return WalkontableSettings;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
;
window.WalkontableSettings = WalkontableSettings;
function WalkontableSettings(instance, settings) {
  var that = this;
  this.instance = instance;
  this.defaults = {
    table: void 0,
    debug: false,
    stretchH: 'none',
    currentRowClassName: null,
    currentColumnClassName: null,
    data: void 0,
    fixedColumnsLeft: 0,
    fixedRowsTop: 0,
    rowHeaders: function() {
      return [];
    },
    columnHeaders: function() {
      return [];
    },
    totalRows: void 0,
    totalColumns: void 0,
    cellRenderer: function(row, column, TD) {
      var cellData = that.getSetting('data', row, column);
      dom.fastInnerText(TD, cellData === void 0 || cellData === null ? '' : cellData);
    },
    columnWidth: function(col) {
      return;
    },
    rowHeight: function(row) {
      return;
    },
    defaultRowHeight: 23,
    defaultColumnWidth: 50,
    selections: null,
    hideBorderOnMouseDownOver: false,
    viewportRowCalculatorOverride: null,
    viewportColumnCalculatorOverride: null,
    onCellMouseDown: null,
    onCellMouseOver: null,
    onCellDblClick: null,
    onCellCornerMouseDown: null,
    onCellCornerDblClick: null,
    beforeDraw: null,
    onDraw: null,
    onBeforeDrawBorders: null,
    onScrollVertically: null,
    onScrollHorizontally: null,
    onBeforeTouchScroll: null,
    onAfterMomentumScroll: null,
    scrollbarWidth: 10,
    scrollbarHeight: 10,
    renderAllRows: false,
    groups: false
  };
  this.settings = {};
  for (var i in this.defaults) {
    if (this.defaults.hasOwnProperty(i)) {
      if (settings[i] !== void 0) {
        this.settings[i] = settings[i];
      } else if (this.defaults[i] === void 0) {
        throw new Error('A required setting "' + i + '" was not provided');
      } else {
        this.settings[i] = this.defaults[i];
      }
    }
  }
}
WalkontableSettings.prototype.update = function(settings, value) {
  if (value === void 0) {
    for (var i in settings) {
      if (settings.hasOwnProperty(i)) {
        this.settings[i] = settings[i];
      }
    }
  } else {
    this.settings[settings] = value;
  }
  return this.instance;
};
WalkontableSettings.prototype.getSetting = function(key, param1, param2, param3, param4) {
  if (typeof this.settings[key] === 'function') {
    return this.settings[key](param1, param2, param3, param4);
  } else if (param1 !== void 0 && Array.isArray(this.settings[key])) {
    return this.settings[key][param1];
  } else {
    return this.settings[key];
  }
};
WalkontableSettings.prototype.has = function(key) {
  return !!this.settings[key];
};


//# 
},{"./../../../dom.js":34}],22:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableTable: {get: function() {
      return WalkontableTable;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__,
    $__cellCoords_46_js__,
    $__cellRange_46_js__,
    $__columnFilter_46_js__,
    $__walkontableCornerOverlay_46_js__,
    $__debugOverlay_46_js__,
    $__scrollbarNativeHorizontal_46_js__,
    $__walkontableLeftOverlay_46_js__,
    $__rowFilter_46_js__,
    $__tableRenderer_46_js__,
    $__walkontableTopOverlay_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
var WalkontableCellCoords = ($__cellCoords_46_js__ = require("./cellCoords.js"), $__cellCoords_46_js__ && $__cellCoords_46_js__.__esModule && $__cellCoords_46_js__ || {default: $__cellCoords_46_js__}).WalkontableCellCoords;
var WalkontableCellRange = ($__cellRange_46_js__ = require("./cellRange.js"), $__cellRange_46_js__ && $__cellRange_46_js__.__esModule && $__cellRange_46_js__ || {default: $__cellRange_46_js__}).WalkontableCellRange;
var WalkontableColumnFilter = ($__columnFilter_46_js__ = require("./columnFilter.js"), $__columnFilter_46_js__ && $__columnFilter_46_js__.__esModule && $__columnFilter_46_js__ || {default: $__columnFilter_46_js__}).WalkontableColumnFilter;
var WalkontableCornerOverlay = ($__walkontableCornerOverlay_46_js__ = require("./walkontableCornerOverlay.js"), $__walkontableCornerOverlay_46_js__ && $__walkontableCornerOverlay_46_js__.__esModule && $__walkontableCornerOverlay_46_js__ || {default: $__walkontableCornerOverlay_46_js__}).WalkontableCornerOverlay;
var WalkontableDebugOverlay = ($__debugOverlay_46_js__ = require("./debugOverlay.js"), $__debugOverlay_46_js__ && $__debugOverlay_46_js__.__esModule && $__debugOverlay_46_js__ || {default: $__debugOverlay_46_js__}).WalkontableDebugOverlay;
var WalkontableHorizontalScrollbarNative = ($__scrollbarNativeHorizontal_46_js__ = require("./scrollbarNativeHorizontal.js"), $__scrollbarNativeHorizontal_46_js__ && $__scrollbarNativeHorizontal_46_js__.__esModule && $__scrollbarNativeHorizontal_46_js__ || {default: $__scrollbarNativeHorizontal_46_js__}).WalkontableHorizontalScrollbarNative;
var WalkontableLeftOverlay = ($__walkontableLeftOverlay_46_js__ = require("./walkontableLeftOverlay.js"), $__walkontableLeftOverlay_46_js__ && $__walkontableLeftOverlay_46_js__.__esModule && $__walkontableLeftOverlay_46_js__ || {default: $__walkontableLeftOverlay_46_js__}).WalkontableLeftOverlay;
var WalkontableRowFilter = ($__rowFilter_46_js__ = require("./rowFilter.js"), $__rowFilter_46_js__ && $__rowFilter_46_js__.__esModule && $__rowFilter_46_js__ || {default: $__rowFilter_46_js__}).WalkontableRowFilter;
var WalkontableTableRenderer = ($__tableRenderer_46_js__ = require("./tableRenderer.js"), $__tableRenderer_46_js__ && $__tableRenderer_46_js__.__esModule && $__tableRenderer_46_js__ || {default: $__tableRenderer_46_js__}).WalkontableTableRenderer;
var WalkontableTopOverlay = ($__walkontableTopOverlay_46_js__ = require("./walkontableTopOverlay.js"), $__walkontableTopOverlay_46_js__ && $__walkontableTopOverlay_46_js__.__esModule && $__walkontableTopOverlay_46_js__ || {default: $__walkontableTopOverlay_46_js__}).WalkontableTopOverlay;
;
window.WalkontableTable = WalkontableTable;
function WalkontableTable(instance, table) {
  this.instance = instance;
  this.TABLE = table;
  dom.removeTextNodes(this.TABLE);
  var parent = this.TABLE.parentNode;
  if (!parent || parent.nodeType !== 1 || !dom.hasClass(parent, 'wtHolder')) {
    var spreader = document.createElement('DIV');
    spreader.className = 'wtSpreader';
    if (parent) {
      parent.insertBefore(spreader, this.TABLE);
    }
    spreader.appendChild(this.TABLE);
  }
  this.spreader = this.TABLE.parentNode;
  this.spreader.style.position = 'relative';
  parent = this.spreader.parentNode;
  if (!parent || parent.nodeType !== 1 || !dom.hasClass(parent, 'wtHolder')) {
    var hider = document.createElement('DIV');
    hider.className = 'wtHider';
    if (parent) {
      parent.insertBefore(hider, this.spreader);
    }
    hider.appendChild(this.spreader);
  }
  this.hider = this.spreader.parentNode;
  parent = this.hider.parentNode;
  if (!parent || parent.nodeType !== 1 || !dom.hasClass(parent, 'wtHolder')) {
    var holder = document.createElement('DIV');
    holder.style.position = 'relative';
    holder.className = 'wtHolder';
    if (parent) {
      parent.insertBefore(holder, this.hider);
    }
    if (!instance.cloneSource) {
      holder.parentNode.className += 'ht_master handsontable';
    }
    holder.appendChild(this.hider);
  }
  this.holder = this.hider.parentNode;
  this.wtRootElement = this.holder.parentNode;
  this.alignOverlaysWithTrimmingContainer();
  this.TBODY = this.TABLE.getElementsByTagName('TBODY')[0];
  if (!this.TBODY) {
    this.TBODY = document.createElement('TBODY');
    this.TABLE.appendChild(this.TBODY);
  }
  this.THEAD = this.TABLE.getElementsByTagName('THEAD')[0];
  if (!this.THEAD) {
    this.THEAD = document.createElement('THEAD');
    this.TABLE.insertBefore(this.THEAD, this.TBODY);
  }
  this.COLGROUP = this.TABLE.getElementsByTagName('COLGROUP')[0];
  if (!this.COLGROUP) {
    this.COLGROUP = document.createElement('COLGROUP');
    this.TABLE.insertBefore(this.COLGROUP, this.THEAD);
  }
  if (this.instance.getSetting('columnHeaders').length) {
    if (!this.THEAD.childNodes.length) {
      var TR = document.createElement('TR');
      this.THEAD.appendChild(TR);
    }
  }
  this.colgroupChildrenLength = this.COLGROUP.childNodes.length;
  this.theadChildrenLength = this.THEAD.firstChild ? this.THEAD.firstChild.childNodes.length : 0;
  this.tbodyChildrenLength = this.TBODY.childNodes.length;
  this.rowFilter = null;
  this.columnFilter = null;
}
WalkontableTable.prototype.alignOverlaysWithTrimmingContainer = function() {
  var trimmingElement = dom.getTrimmingContainer(this.wtRootElement);
  if (!this.isWorkingOnClone()) {
    this.holder.parentNode.style.position = 'relative';
    if (trimmingElement !== window) {
      this.holder.style.width = dom.getStyle(trimmingElement, 'width');
      this.holder.style.height = dom.getStyle(trimmingElement, 'height');
      this.holder.style.overflow = '';
    } else {
      this.holder.style.overflow = 'visible';
      this.wtRootElement.style.overflow = 'visible';
    }
  }
};
WalkontableTable.prototype.isWorkingOnClone = function() {
  return !!this.instance.cloneSource;
};
WalkontableTable.prototype.draw = function(fastDraw) {
  if (!this.isWorkingOnClone()) {
    this.holderOffset = dom.offset(this.holder);
    fastDraw = this.instance.wtViewport.createRenderCalculators(fastDraw);
  }
  if (!fastDraw) {
    if (this.isWorkingOnClone()) {
      this.tableOffset = this.instance.cloneSource.wtTable.tableOffset;
    } else {
      this.tableOffset = dom.offset(this.TABLE);
    }
    var startRow;
    if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay || this.instance.cloneOverlay instanceof WalkontableTopOverlay || this.instance.cloneOverlay instanceof WalkontableCornerOverlay) {
      startRow = 0;
    } else {
      startRow = this.instance.wtViewport.rowsRenderCalculator.startRow;
    }
    var startColumn;
    if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay || this.instance.cloneOverlay instanceof WalkontableLeftOverlay || this.instance.cloneOverlay instanceof WalkontableCornerOverlay) {
      startColumn = 0;
    } else {
      startColumn = this.instance.wtViewport.columnsRenderCalculator.startColumn;
    }
    this.rowFilter = new WalkontableRowFilter(startRow, this.instance.getSetting('totalRows'), this.instance.getSetting('columnHeaders').length);
    this.columnFilter = new WalkontableColumnFilter(startColumn, this.instance.getSetting('totalColumns'), this.instance.getSetting('rowHeaders').length);
    this._doDraw();
    this.alignOverlaysWithTrimmingContainer();
  } else {
    if (!this.isWorkingOnClone()) {
      this.instance.wtViewport.createVisibleCalculators();
    }
    if (this.instance.wtOverlays) {
      this.instance.wtOverlays.refresh(true);
    }
  }
  this.refreshSelections(fastDraw);
  if (!this.isWorkingOnClone()) {
    this.instance.wtOverlays.topOverlay.resetFixedPosition();
    this.instance.wtOverlays.leftOverlay.resetFixedPosition();
    this.instance.wtOverlays.topLeftCornerOverlay.resetFixedPosition();
  }
  this.instance.drawn = true;
  return this;
};
WalkontableTable.prototype._doDraw = function() {
  var wtRenderer = new WalkontableTableRenderer(this);
  wtRenderer.render();
};
WalkontableTable.prototype.removeClassFromCells = function(className) {
  var nodes = this.TABLE.querySelectorAll('.' + className);
  for (var i = 0,
      ilen = nodes.length; i < ilen; i++) {
    dom.removeClass(nodes[i], className);
  }
};
WalkontableTable.prototype.refreshSelections = function(fastDraw) {
  var i,
      len;
  if (!this.instance.selections) {
    return;
  }
  len = this.instance.selections.length;
  if (fastDraw) {
    for (i = 0; i < len; i++) {
      if (this.instance.selections[i].settings.className) {
        this.removeClassFromCells(this.instance.selections[i].settings.className);
      }
      if (this.instance.selections[i].settings.highlightRowClassName) {
        this.removeClassFromCells(this.instance.selections[i].settings.highlightRowClassName);
      }
      if (this.instance.selections[i].settings.highlightColumnClassName) {
        this.removeClassFromCells(this.instance.selections[i].settings.highlightColumnClassName);
      }
    }
  }
  for (i = 0; i < len; i++) {
    this.instance.selections[i].draw(this.instance, fastDraw);
  }
};
WalkontableTable.prototype.getCell = function(coords) {
  if (this.isRowBeforeRenderedRows(coords.row)) {
    return -1;
  } else if (this.isRowAfterRenderedRows(coords.row)) {
    return -2;
  }
  var TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(coords.row)];
  if (TR) {
    return TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(coords.col)];
  }
};
WalkontableTable.prototype.getColumnHeader = function(col, level) {
  if (!level) {
    level = 0;
  }
  var TR = this.THEAD.childNodes[level];
  if (TR) {
    return TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(col)];
  }
};
WalkontableTable.prototype.getRowHeader = function(row) {
  if (this.columnFilter.sourceColumnToVisibleRowHeadedColumn(0) === 0) {
    return null;
  }
  var TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];
  if (TR) {
    return TR.childNodes[0];
  }
};
WalkontableTable.prototype.getCoords = function(TD) {
  var TR = TD.parentNode;
  var row = dom.index(TR);
  if (TR.parentNode === this.THEAD) {
    row = this.rowFilter.visibleColHeadedRowToSourceRow(row);
  } else {
    row = this.rowFilter.renderedToSource(row);
  }
  return new WalkontableCellCoords(row, this.columnFilter.visibleRowHeadedColumnToSourceColumn(TD.cellIndex));
};
WalkontableTable.prototype.getTrForRow = function(row) {
  return this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];
};
WalkontableTable.prototype.getFirstRenderedRow = function() {
  return this.instance.wtViewport.rowsRenderCalculator.startRow;
};
WalkontableTable.prototype.getFirstVisibleRow = function() {
  return this.instance.wtViewport.rowsVisibleCalculator.startRow;
};
WalkontableTable.prototype.getFirstRenderedColumn = function() {
  return this.instance.wtViewport.columnsRenderCalculator.startColumn;
};
WalkontableTable.prototype.getFirstVisibleColumn = function() {
  return this.instance.wtViewport.columnsVisibleCalculator.startColumn;
};
WalkontableTable.prototype.getLastRenderedRow = function() {
  return this.instance.wtViewport.rowsRenderCalculator.endRow;
};
WalkontableTable.prototype.getLastVisibleRow = function() {
  return this.instance.wtViewport.rowsVisibleCalculator.endRow;
};
WalkontableTable.prototype.getLastRenderedColumn = function() {
  return this.instance.wtViewport.columnsRenderCalculator.endColumn;
};
WalkontableTable.prototype.getLastVisibleColumn = function() {
  return this.instance.wtViewport.columnsVisibleCalculator.endColumn;
};
WalkontableTable.prototype.isRowBeforeRenderedRows = function(r) {
  return (this.rowFilter.sourceToRendered(r) < 0 && r >= 0);
};
WalkontableTable.prototype.isRowAfterViewport = function(r) {
  return (r > this.getLastVisibleRow());
};
WalkontableTable.prototype.isRowAfterRenderedRows = function(r) {
  return (r > this.getLastRenderedRow());
};
WalkontableTable.prototype.isColumnBeforeViewport = function(c) {
  return (this.columnFilter.sourceToRendered(c) < 0 && c >= 0);
};
WalkontableTable.prototype.isColumnAfterViewport = function(c) {
  return (c > this.getLastVisibleColumn());
};
WalkontableTable.prototype.isLastRowFullyVisible = function() {
  return (this.getLastVisibleRow() === this.getLastRenderedRow());
};
WalkontableTable.prototype.isLastColumnFullyVisible = function() {
  return (this.getLastVisibleColumn() === this.getLastRenderedColumn);
};
WalkontableTable.prototype.getRenderedColumnsCount = function() {
  if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay) {
    return this.instance.getSetting('totalColumns');
  } else if (this.instance.cloneOverlay instanceof WalkontableLeftOverlay || this.instance.cloneOverlay instanceof WalkontableCornerOverlay) {
    return this.instance.getSetting('fixedColumnsLeft');
  } else {
    return this.instance.wtViewport.columnsRenderCalculator.count;
  }
};
WalkontableTable.prototype.getRenderedRowsCount = function() {
  if (this.instance.cloneOverlay instanceof WalkontableDebugOverlay) {
    return this.instance.getSetting('totalRows');
  } else if (this.instance.cloneOverlay instanceof WalkontableTopOverlay || this.instance.cloneOverlay instanceof WalkontableCornerOverlay) {
    return this.instance.getSetting('fixedRowsTop');
  }
  return this.instance.wtViewport.rowsRenderCalculator.count;
};
WalkontableTable.prototype.getVisibleRowsCount = function() {
  return this.instance.wtViewport.rowsVisibleCalculator.count;
};
WalkontableTable.prototype.allRowsInViewport = function() {
  return this.instance.getSetting('totalRows') == this.getVisibleRowsCount();
};
WalkontableTable.prototype.getRowHeight = function(sourceRow) {
  var height = this.instance.wtSettings.settings.rowHeight(sourceRow),
      oversizedHeight = this.instance.wtViewport.oversizedRows[sourceRow];
  if (oversizedHeight !== void 0) {
    height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
  }
  return height;
};
WalkontableTable.prototype.getColumnHeaderHeight = function(level) {
  var height = this.instance.wtSettings.settings.defaultRowHeight,
      oversizedHeight = this.instance.wtViewport.oversizedColumnHeaders[level];
  if (oversizedHeight !== void 0) {
    height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
  }
  return height;
};
WalkontableTable.prototype.getVisibleColumnsCount = function() {
  return this.instance.wtViewport.columnsVisibleCalculator.count;
};
WalkontableTable.prototype.allColumnsInViewport = function() {
  return this.instance.getSetting('totalColumns') == this.getVisibleColumnsCount();
};
WalkontableTable.prototype.getColumnWidth = function(sourceColumn) {
  var width = this.instance.wtSettings.settings.columnWidth;
  if (typeof width === 'function') {
    width = width(sourceColumn);
  } else if (typeof width === 'object') {
    width = width[sourceColumn];
  }
  var oversizedWidth = this.instance.wtViewport.oversizedCols[sourceColumn];
  if (oversizedWidth !== void 0) {
    width = width ? Math.max(width, oversizedWidth) : oversizedWidth;
  }
  return width;
};
WalkontableTable.prototype.getStretchedColumnWidth = function(sourceColumn) {
  var width = this.getColumnWidth(sourceColumn) || this.instance.wtSettings.settings.defaultColumnWidth,
      calculator = this.instance.wtViewport.columnsRenderCalculator,
      stretchedWidth;
  if (calculator) {
    stretchedWidth = calculator.getStretchedColumnWidth(sourceColumn, width);
    if (stretchedWidth) {
      width = stretchedWidth;
    }
  }
  return width;
};


//# 
},{"./../../../dom.js":34,"./cellCoords.js":8,"./cellRange.js":9,"./columnFilter.js":10,"./debugOverlay.js":13,"./rowFilter.js":17,"./scrollbarNativeHorizontal.js":19,"./tableRenderer.js":23,"./walkontableCornerOverlay.js":27,"./walkontableLeftOverlay.js":28,"./walkontableTopOverlay.js":29}],23:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableTableRenderer: {get: function() {
      return WalkontableTableRenderer;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
;
window.WalkontableTableRenderer = WalkontableTableRenderer;
function WalkontableTableRenderer(wtTable) {
  this.wtTable = wtTable;
  this.instance = wtTable.instance;
  this.rowFilter = wtTable.rowFilter;
  this.columnFilter = wtTable.columnFilter;
  this.TABLE = wtTable.TABLE;
  this.THEAD = wtTable.THEAD;
  this.TBODY = wtTable.TBODY;
  this.COLGROUP = wtTable.COLGROUP;
  this.utils = WalkontableTableRenderer.utils;
}
WalkontableTableRenderer.prototype.render = function() {
  if (!this.wtTable.isWorkingOnClone()) {
    this.instance.getSetting('beforeDraw', true);
  }
  this.rowHeaders = this.instance.getSetting('rowHeaders');
  this.rowHeaderCount = this.rowHeaders.length;
  this.fixedRowsTop = this.instance.getSetting('fixedRowsTop');
  this.columnHeaders = this.instance.getSetting('columnHeaders');
  this.columnHeaderCount = this.columnHeaders.length;
  var visibleColIndex,
      totalRows = this.instance.getSetting('totalRows'),
      totalColumns = this.instance.getSetting('totalColumns'),
      columnsToRender = this.wtTable.getRenderedColumnsCount(),
      adjusted = false,
      workspaceWidth,
      rowsToRender = this.wtTable.getRenderedRowsCount();
  if (totalColumns > 0) {
    this.adjustAvailableNodes();
    adjusted = true;
    this.renderColGroups();
    this.renderColumnHeaders();
    this.renderRows(totalRows, rowsToRender, columnsToRender);
    if (!this.wtTable.isWorkingOnClone()) {
      workspaceWidth = this.instance.wtViewport.getWorkspaceWidth();
      this.instance.wtViewport.containerWidth = null;
    } else {
      this.adjustColumnHeaderHeights();
    }
    this.adjustColumnWidths(columnsToRender);
  }
  if (!adjusted) {
    this.adjustAvailableNodes();
  }
  this.removeRedundantRows(rowsToRender);
  if (!this.wtTable.isWorkingOnClone()) {
    this.markOversizedRows();
    this.instance.wtViewport.createVisibleCalculators();
    this.instance.wtOverlays.applyToDOM();
    this.instance.wtOverlays.refresh(false);
    if (workspaceWidth !== this.instance.wtViewport.getWorkspaceWidth()) {
      this.instance.wtViewport.containerWidth = null;
      var firstRendered = this.wtTable.getFirstRenderedColumn();
      var lastRendered = this.wtTable.getLastRenderedColumn();
      for (var i = firstRendered; i < lastRendered; i++) {
        var width = this.wtTable.getStretchedColumnWidth(i);
        var renderedIndex = this.columnFilter.sourceToRendered(i);
        this.COLGROUP.childNodes[renderedIndex + this.rowHeaderCount].style.width = width + 'px';
      }
    }
    this.instance.getSetting('onDraw', true);
  }
};
WalkontableTableRenderer.prototype.removeRedundantRows = function(renderedRowsCount) {
  while (this.wtTable.tbodyChildrenLength > renderedRowsCount) {
    this.TBODY.removeChild(this.TBODY.lastChild);
    this.wtTable.tbodyChildrenLength--;
  }
};
WalkontableTableRenderer.prototype.renderRows = function(totalRows, rowsToRender, columnsToRender) {
  var lastTD,
      TR;
  var visibleRowIndex = 0;
  var sourceRowIndex = this.rowFilter.renderedToSource(visibleRowIndex);
  var isWorkingOnClone = this.wtTable.isWorkingOnClone();
  while (sourceRowIndex < totalRows && sourceRowIndex >= 0) {
    if (visibleRowIndex > 1000) {
      throw new Error('Security brake: Too much TRs. Please define height for your table, which will enforce scrollbars.');
    }
    if (rowsToRender !== void 0 && visibleRowIndex === rowsToRender) {
      break;
    }
    TR = this.getOrCreateTrForRow(visibleRowIndex, TR);
    this.renderRowHeaders(sourceRowIndex, TR);
    this.adjustColumns(TR, columnsToRender + this.rowHeaderCount);
    lastTD = this.renderCells(sourceRowIndex, TR, columnsToRender);
    if (!isWorkingOnClone) {
      this.resetOversizedRow(sourceRowIndex);
    }
    if (TR.firstChild) {
      var height = this.instance.wtTable.getRowHeight(sourceRowIndex);
      if (height) {
        TR.firstChild.style.height = height + 'px';
      } else {
        TR.firstChild.style.height = '';
      }
    }
    visibleRowIndex++;
    sourceRowIndex = this.rowFilter.renderedToSource(visibleRowIndex);
  }
};
WalkontableTableRenderer.prototype.resetOversizedRow = function(sourceRow) {
  if (this.instance.wtViewport.oversizedRows && this.instance.wtViewport.oversizedRows[sourceRow]) {
    this.instance.wtViewport.oversizedRows[sourceRow] = void 0;
  }
};
WalkontableTableRenderer.prototype.markOversizedRows = function() {
  var previousRowHeight,
      trInnerHeight,
      sourceRowIndex,
      currentTr;
  var rowCount = this.instance.wtTable.TBODY.childNodes.length;
  while (rowCount) {
    rowCount--;
    sourceRowIndex = this.instance.wtTable.rowFilter.renderedToSource(rowCount);
    previousRowHeight = this.instance.wtTable.getRowHeight(sourceRowIndex);
    currentTr = this.instance.wtTable.getTrForRow(sourceRowIndex);
    trInnerHeight = dom.innerHeight(currentTr) - 1;
    if ((!previousRowHeight && this.instance.wtSettings.settings.defaultRowHeight < trInnerHeight || previousRowHeight < trInnerHeight)) {
      this.instance.wtViewport.oversizedRows[sourceRowIndex] = trInnerHeight;
    }
  }
};
WalkontableTableRenderer.prototype.adjustColumnHeaderHeights = function() {
  var columnHeaders = this.instance.getSetting('columnHeaders'),
      childs = this.instance.wtTable.THEAD.childNodes;
  for (var i = 0,
      columnHeadersCount = columnHeaders.length; i < columnHeadersCount; i++) {
    if (this.instance.wtViewport.oversizedColumnHeaders[i]) {
      if (childs[i].childNodes.length === 0) {
        return;
      }
      childs[i].childNodes[0].style.height = this.instance.wtViewport.oversizedColumnHeaders[i] + "px";
    }
  }
};
WalkontableTableRenderer.prototype.markIfOversizedColumnHeader = function(col) {
  var level = this.instance.getSetting('columnHeaders').length,
      defaultRowHeight = this.instance.wtSettings.settings.defaultRowHeight,
      sourceColIndex,
      previousColHeaderHeight,
      currentHeader,
      currentHeaderHeight;
  sourceColIndex = this.instance.wtTable.columnFilter.renderedToSource(col);
  while (level) {
    level--;
    previousColHeaderHeight = this.instance.wtTable.getColumnHeaderHeight(level);
    currentHeader = this.instance.wtTable.getColumnHeader(sourceColIndex, level);
    if (!currentHeader) {
      continue;
    }
    currentHeaderHeight = defaultRowHeight;
    if (!previousColHeaderHeight && defaultRowHeight < currentHeaderHeight || previousColHeaderHeight < currentHeaderHeight) {
      this.instance.wtViewport.oversizedColumnHeaders[level] = currentHeaderHeight;
    }
  }
};
WalkontableTableRenderer.prototype.renderCells = function(sourceRowIndex, TR, columnsToRender) {
  var TD,
      sourceColIndex;
  for (var visibleColIndex = 0; visibleColIndex < columnsToRender; visibleColIndex++) {
    sourceColIndex = this.columnFilter.renderedToSource(visibleColIndex);
    if (visibleColIndex === 0) {
      TD = TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(sourceColIndex)];
    } else {
      TD = TD.nextSibling;
    }
    if (TD.nodeName == 'TH') {
      TD = this.utils.replaceThWithTd(TD, TR);
    }
    if (!dom.hasClass(TD, 'hide')) {
      TD.className = '';
    }
    TD.removeAttribute('style');
    this.instance.wtSettings.settings.cellRenderer(sourceRowIndex, sourceColIndex, TD);
  }
  return TD;
};
WalkontableTableRenderer.prototype.adjustColumnWidths = function(columnsToRender) {
  var width,
      rowsCalculator = this.instance.wtViewport.rowsRenderCalculator,
      scrollbarCompensation = 0,
      sourceInstance = this.instance.cloneSource ? this.instance.cloneSource : this.instance,
      mainHolder = sourceInstance.wtTable.holder,
      trimmingContainer = dom.getTrimmingContainer(sourceInstance.wtTable.TABLE);
  if (mainHolder.offsetHeight < mainHolder.scrollHeight) {
    scrollbarCompensation = dom.getScrollbarWidth();
  }
  this.instance.wtViewport.columnsRenderCalculator.refreshStretching(this.instance.wtViewport.getViewportWidth() - scrollbarCompensation);
  for (var renderedColIndex = 0; renderedColIndex < columnsToRender; renderedColIndex++) {
    width = this.wtTable.getStretchedColumnWidth(this.columnFilter.renderedToSource(renderedColIndex));
    this.COLGROUP.childNodes[renderedColIndex + this.rowHeaderCount].style.width = width + 'px';
  }
};
WalkontableTableRenderer.prototype.appendToTbody = function(TR) {
  this.TBODY.appendChild(TR);
  this.wtTable.tbodyChildrenLength++;
};
WalkontableTableRenderer.prototype.getOrCreateTrForRow = function(rowIndex, currentTr) {
  var TR;
  if (rowIndex >= this.wtTable.tbodyChildrenLength) {
    TR = this.createRow();
    this.appendToTbody(TR);
  } else if (rowIndex === 0) {
    TR = this.TBODY.firstChild;
  } else {
    TR = currentTr.nextSibling;
  }
  return TR;
};
WalkontableTableRenderer.prototype.createRow = function() {
  var TR = document.createElement('TR');
  for (var visibleColIndex = 0; visibleColIndex < this.rowHeaderCount; visibleColIndex++) {
    TR.appendChild(document.createElement('TH'));
  }
  return TR;
};
WalkontableTableRenderer.prototype.renderRowHeader = function(row, col, TH) {
  TH.className = '';
  TH.removeAttribute('style');
  this.rowHeaders[col](row, TH, col);
};
WalkontableTableRenderer.prototype.renderRowHeaders = function(row, TR) {
  for (var TH = TR.firstChild,
      visibleColIndex = 0; visibleColIndex < this.rowHeaderCount; visibleColIndex++) {
    if (!TH) {
      TH = document.createElement('TH');
      TR.appendChild(TH);
    } else if (TH.nodeName == 'TD') {
      TH = this.utils.replaceTdWithTh(TH, TR);
    }
    this.renderRowHeader(row, visibleColIndex, TH);
    TH = TH.nextSibling;
  }
};
WalkontableTableRenderer.prototype.adjustAvailableNodes = function() {
  this.adjustColGroups();
  this.adjustThead();
};
WalkontableTableRenderer.prototype.renderColumnHeaders = function() {
  if (!this.columnHeaderCount) {
    return;
  }
  var columnCount = this.wtTable.getRenderedColumnsCount(),
      TR,
      renderedColumnIndex;
  for (var i = 0; i < this.columnHeaderCount; i++) {
    TR = this.getTrForColumnHeaders(i);
    for (renderedColumnIndex = (-1) * this.rowHeaderCount; renderedColumnIndex < columnCount; renderedColumnIndex++) {
      var sourceCol = this.columnFilter.renderedToSource(renderedColumnIndex);
      this.renderColumnHeader(i, sourceCol, TR.childNodes[renderedColumnIndex + this.rowHeaderCount]);
      if (!this.wtTable.isWorkingOnClone()) {
        this.markIfOversizedColumnHeader(renderedColumnIndex);
      }
    }
  }
};
WalkontableTableRenderer.prototype.adjustColGroups = function() {
  var columnCount = this.wtTable.getRenderedColumnsCount();
  while (this.wtTable.colgroupChildrenLength < columnCount + this.rowHeaderCount) {
    this.COLGROUP.appendChild(document.createElement('COL'));
    this.wtTable.colgroupChildrenLength++;
  }
  while (this.wtTable.colgroupChildrenLength > columnCount + this.rowHeaderCount) {
    this.COLGROUP.removeChild(this.COLGROUP.lastChild);
    this.wtTable.colgroupChildrenLength--;
  }
};
WalkontableTableRenderer.prototype.adjustThead = function() {
  var columnCount = this.wtTable.getRenderedColumnsCount();
  var TR = this.THEAD.firstChild;
  if (this.columnHeaders.length) {
    for (var i = 0,
        columnHeadersLength = this.columnHeaders.length; i < columnHeadersLength; i++) {
      TR = this.THEAD.childNodes[i];
      if (!TR) {
        TR = document.createElement('TR');
        this.THEAD.appendChild(TR);
      }
      this.theadChildrenLength = TR.childNodes.length;
      while (this.theadChildrenLength < columnCount + this.rowHeaderCount) {
        TR.appendChild(document.createElement('TH'));
        this.theadChildrenLength++;
      }
      while (this.theadChildrenLength > columnCount + this.rowHeaderCount) {
        TR.removeChild(TR.lastChild);
        this.theadChildrenLength--;
      }
    }
    var theadChildrenLength = this.THEAD.childNodes.length;
    if (theadChildrenLength > this.columnHeaders.length) {
      for (var i = this.columnHeaders.length; i < theadChildrenLength; i++) {
        this.THEAD.removeChild(this.THEAD.lastChild);
      }
    }
  } else if (TR) {
    dom.empty(TR);
  }
};
WalkontableTableRenderer.prototype.getTrForColumnHeaders = function(index) {
  var TR = this.THEAD.childNodes[index];
  return TR;
};
WalkontableTableRenderer.prototype.renderColumnHeader = function(row, col, TH) {
  TH.className = '';
  TH.removeAttribute('style');
  return this.columnHeaders[row](col, TH, row);
};
WalkontableTableRenderer.prototype.renderColGroups = function() {
  for (var colIndex = 0; colIndex < this.wtTable.colgroupChildrenLength; colIndex++) {
    if (colIndex < this.rowHeaderCount) {
      dom.addClass(this.COLGROUP.childNodes[colIndex], 'rowHeader');
    } else {
      dom.removeClass(this.COLGROUP.childNodes[colIndex], 'rowHeader');
    }
  }
};
WalkontableTableRenderer.prototype.adjustColumns = function(TR, desiredCount) {
  var count = TR.childNodes.length;
  while (count < desiredCount) {
    var TD = document.createElement('TD');
    TR.appendChild(TD);
    count++;
  }
  while (count > desiredCount) {
    TR.removeChild(TR.lastChild);
    count--;
  }
};
WalkontableTableRenderer.prototype.removeRedundantColumns = function(columnsToRender) {
  while (this.wtTable.tbodyChildrenLength > columnsToRender) {
    this.TBODY.removeChild(this.TBODY.lastChild);
    this.wtTable.tbodyChildrenLength--;
  }
};
WalkontableTableRenderer.utils = {};
WalkontableTableRenderer.utils.replaceTdWithTh = function(TD, TR) {
  var TH;
  TH = document.createElement('TH');
  TR.insertBefore(TH, TD);
  TR.removeChild(TD);
  return TH;
};
WalkontableTableRenderer.utils.replaceThWithTd = function(TH, TR) {
  var TD = document.createElement('TD');
  TR.insertBefore(TD, TH);
  TR.removeChild(TH);
  return TD;
};


//# 
},{"./../../../dom.js":34}],24:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableViewport: {get: function() {
      return WalkontableViewport;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47__46__46__47_eventManager_46_js__,
    $__viewportColumnsCalculator_46_js__,
    $__viewportRowsCalculator_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
var eventManagerObject = ($___46__46__47__46__46__47__46__46__47_eventManager_46_js__ = require("./../../../eventManager.js"), $___46__46__47__46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var WalkontableViewportColumnsCalculator = ($__viewportColumnsCalculator_46_js__ = require("./viewportColumnsCalculator.js"), $__viewportColumnsCalculator_46_js__ && $__viewportColumnsCalculator_46_js__.__esModule && $__viewportColumnsCalculator_46_js__ || {default: $__viewportColumnsCalculator_46_js__}).WalkontableViewportColumnsCalculator;
var WalkontableViewportRowsCalculator = ($__viewportRowsCalculator_46_js__ = require("./viewportRowsCalculator.js"), $__viewportRowsCalculator_46_js__ && $__viewportRowsCalculator_46_js__.__esModule && $__viewportRowsCalculator_46_js__ || {default: $__viewportRowsCalculator_46_js__}).WalkontableViewportRowsCalculator;
;
window.WalkontableViewport = WalkontableViewport;
function WalkontableViewport(instance) {
  this.instance = instance;
  this.oversizedRows = [];
  this.oversizedCols = [];
  this.oversizedColumnHeaders = [];
  var that = this;
  var eventManager = eventManagerObject(instance);
  eventManager.addEventListener(window, 'resize', function() {
    that.clientHeight = that.getWorkspaceHeight();
  });
}
WalkontableViewport.prototype.getWorkspaceHeight = function() {
  var trimmingContainer = this.instance.wtOverlays.topOverlay.trimmingContainer;
  if (trimmingContainer === window) {
    return document.documentElement.clientHeight;
  } else {
    var elemHeight = dom.outerHeight(trimmingContainer);
    var height = (elemHeight > 0 && trimmingContainer.clientHeight > 0) ? trimmingContainer.clientHeight : Infinity;
    return height;
  }
};
WalkontableViewport.prototype.getWorkspaceWidth = function() {
  var width,
      totalColumns = this.instance.getSetting("totalColumns"),
      trimmingContainer = this.instance.wtOverlays.leftOverlay.trimmingContainer,
      overflow,
      stretchSetting = this.instance.getSetting('stretchH');
  if (Handsontable.freezeOverlays) {
    width = Math.min(document.documentElement.offsetWidth - this.getWorkspaceOffset().left, document.documentElement.offsetWidth);
  } else {
    width = Math.min(this.getContainerFillWidth(), document.documentElement.offsetWidth - this.getWorkspaceOffset().left, document.documentElement.offsetWidth);
  }
  if (trimmingContainer === window && totalColumns > 0 && this.sumColumnWidths(0, totalColumns - 1) > width) {
    return document.documentElement.clientWidth;
  }
  if (trimmingContainer !== window) {
    overflow = dom.getStyle(this.instance.wtOverlays.leftOverlay.trimmingContainer, 'overflow');
    if (overflow == "scroll" || overflow == "hidden" || overflow == "auto") {
      return Math.max(width, trimmingContainer.clientWidth);
    }
  }
  if (stretchSetting === 'none' || !stretchSetting) {
    return Math.max(width, dom.outerWidth(this.instance.wtTable.TABLE));
  } else {
    return width;
  }
};
WalkontableViewport.prototype.sumColumnWidths = function(from, length) {
  var sum = 0;
  while (from < length) {
    sum += this.instance.wtTable.getColumnWidth(from) || this.instance.wtSettings.defaultColumnWidth;
    from++;
  }
  return sum;
};
WalkontableViewport.prototype.getContainerFillWidth = function() {
  if (this.containerWidth) {
    return this.containerWidth;
  }
  var mainContainer = this.instance.wtTable.holder,
      fillWidth,
      dummyElement;
  dummyElement = document.createElement("DIV");
  dummyElement.style.width = "100%";
  dummyElement.style.height = "1px";
  mainContainer.appendChild(dummyElement);
  fillWidth = dummyElement.offsetWidth;
  this.containerWidth = fillWidth;
  mainContainer.removeChild(dummyElement);
  return fillWidth;
};
WalkontableViewport.prototype.getWorkspaceOffset = function() {
  return dom.offset(this.instance.wtTable.TABLE);
};
WalkontableViewport.prototype.getWorkspaceActualHeight = function() {
  return dom.outerHeight(this.instance.wtTable.TABLE);
};
WalkontableViewport.prototype.getWorkspaceActualWidth = function() {
  return dom.outerWidth(this.instance.wtTable.TABLE) || dom.outerWidth(this.instance.wtTable.TBODY) || dom.outerWidth(this.instance.wtTable.THEAD);
};
WalkontableViewport.prototype.getColumnHeaderHeight = function() {
  if (isNaN(this.columnHeaderHeight)) {
    this.columnHeaderHeight = dom.outerHeight(this.instance.wtTable.THEAD);
  }
  return this.columnHeaderHeight;
};
WalkontableViewport.prototype.getViewportHeight = function() {
  var containerHeight = this.getWorkspaceHeight();
  if (containerHeight === Infinity) {
    return containerHeight;
  }
  var columnHeaderHeight = this.getColumnHeaderHeight();
  if (columnHeaderHeight > 0) {
    containerHeight -= columnHeaderHeight;
  }
  return containerHeight;
};
WalkontableViewport.prototype.getRowHeaderWidth = function() {
  if (this.instance.cloneSource) {
    return this.instance.cloneSource.wtViewport.getRowHeaderWidth();
  }
  if (isNaN(this.rowHeaderWidth)) {
    var rowHeaders = this.instance.getSetting('rowHeaders');
    if (rowHeaders.length) {
      var TH = this.instance.wtTable.TABLE.querySelector('TH');
      this.rowHeaderWidth = 0;
      for (var i = 0,
          ilen = rowHeaders.length; i < ilen; i++) {
        if (TH) {
          this.rowHeaderWidth += dom.outerWidth(TH);
          TH = TH.nextSibling;
        } else {
          this.rowHeaderWidth += 50;
        }
      }
    } else {
      this.rowHeaderWidth = 0;
    }
  }
  return this.rowHeaderWidth;
};
WalkontableViewport.prototype.getViewportWidth = function() {
  var containerWidth = this.getWorkspaceWidth(),
      rowHeaderWidth;
  if (containerWidth === Infinity) {
    return containerWidth;
  }
  rowHeaderWidth = this.getRowHeaderWidth();
  if (rowHeaderWidth > 0) {
    return containerWidth - rowHeaderWidth;
  }
  return containerWidth;
};
WalkontableViewport.prototype.createRowsCalculator = function(visible) {
  this.rowHeaderWidth = NaN;
  var height;
  if (this.instance.wtSettings.settings.renderAllRows) {
    height = Infinity;
  } else {
    height = this.getViewportHeight();
  }
  var pos = dom.getScrollTop(this.instance.wtOverlays.mainTableScrollableElement) - this.instance.wtOverlays.topOverlay.getTableParentOffset();
  if (pos < 0) {
    pos = 0;
  }
  var fixedRowsTop = this.instance.getSetting('fixedRowsTop');
  if (fixedRowsTop) {
    var fixedRowsHeight = this.instance.wtOverlays.topOverlay.sumCellSizes(0, fixedRowsTop);
    pos += fixedRowsHeight;
    height -= fixedRowsHeight;
  }
  var that = this;
  return new WalkontableViewportRowsCalculator(height, pos, this.instance.getSetting('totalRows'), function(sourceRow) {
    return that.instance.wtTable.getRowHeight(sourceRow);
  }, visible ? null : this.instance.wtSettings.settings.viewportRowCalculatorOverride, visible ? true : false);
};
WalkontableViewport.prototype.createColumnsCalculator = function(visible) {
  this.columnHeaderHeight = NaN;
  var width = this.getViewportWidth();
  var pos = this.instance.wtOverlays.leftOverlay.getScrollPosition() - this.instance.wtOverlays.topOverlay.getTableParentOffset();
  if (pos < 0) {
    pos = 0;
  }
  var fixedColumnsLeft = this.instance.getSetting('fixedColumnsLeft');
  if (fixedColumnsLeft) {
    var fixedColumnsWidth = this.instance.wtOverlays.leftOverlay.sumCellSizes(0, fixedColumnsLeft);
    pos += fixedColumnsWidth;
    width -= fixedColumnsWidth;
  }
  if (this.instance.wtTable.holder.clientWidth !== this.instance.wtTable.holder.offsetWidth) {
    width -= dom.getScrollbarWidth();
  }
  var that = this;
  return new WalkontableViewportColumnsCalculator(width, pos, this.instance.getSetting('totalColumns'), function(sourceCol) {
    return that.instance.wtTable.getColumnWidth(sourceCol);
  }, visible ? null : this.instance.wtSettings.settings.viewportColumnCalculatorOverride, visible ? true : false, this.instance.getSetting('stretchH'));
};
WalkontableViewport.prototype.createRenderCalculators = function(fastDraw) {
  if (fastDraw) {
    var proposedRowsVisibleCalculator = this.createRowsCalculator(true);
    var proposedColumnsVisibleCalculator = this.createColumnsCalculator(true);
    if (!(this.areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator) && this.areAllProposedVisibleColumnsAlreadyRendered(proposedColumnsVisibleCalculator))) {
      fastDraw = false;
    }
  }
  if (!fastDraw) {
    this.rowsRenderCalculator = this.createRowsCalculator();
    this.columnsRenderCalculator = this.createColumnsCalculator();
  }
  this.rowsVisibleCalculator = null;
  this.columnsVisibleCalculator = null;
  return fastDraw;
};
WalkontableViewport.prototype.createVisibleCalculators = function() {
  this.rowsVisibleCalculator = this.createRowsCalculator(true);
  this.columnsVisibleCalculator = this.createColumnsCalculator(true);
};
WalkontableViewport.prototype.areAllProposedVisibleRowsAlreadyRendered = function(proposedRowsVisibleCalculator) {
  if (this.rowsVisibleCalculator) {
    if (proposedRowsVisibleCalculator.startRow < this.rowsRenderCalculator.startRow || (proposedRowsVisibleCalculator.startRow === this.rowsRenderCalculator.startRow && proposedRowsVisibleCalculator.startRow > 0)) {
      return false;
    } else if (proposedRowsVisibleCalculator.endRow > this.rowsRenderCalculator.endRow || (proposedRowsVisibleCalculator.endRow === this.rowsRenderCalculator.endRow && proposedRowsVisibleCalculator.endRow < this.instance.getSetting('totalRows') - 1)) {
      return false;
    } else {
      return true;
    }
  }
  return false;
};
WalkontableViewport.prototype.areAllProposedVisibleColumnsAlreadyRendered = function(proposedColumnsVisibleCalculator) {
  if (this.columnsVisibleCalculator) {
    if (proposedColumnsVisibleCalculator.startColumn < this.columnsRenderCalculator.startColumn || (proposedColumnsVisibleCalculator.startColumn === this.columnsRenderCalculator.startColumn && proposedColumnsVisibleCalculator.startColumn > 0)) {
      return false;
    } else if (proposedColumnsVisibleCalculator.endColumn > this.columnsRenderCalculator.endColumn || (proposedColumnsVisibleCalculator.endColumn === this.columnsRenderCalculator.endColumn && proposedColumnsVisibleCalculator.endColumn < this.instance.getSetting('totalColumns') - 1)) {
      return false;
    } else {
      return true;
    }
  }
  return false;
};


//# 
},{"./../../../dom.js":34,"./../../../eventManager.js":48,"./viewportColumnsCalculator.js":25,"./viewportRowsCalculator.js":26}],25:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableViewportColumnsCalculator: {get: function() {
      return WalkontableViewportColumnsCalculator;
    }},
  __esModule: {value: true}
});
;
window.WalkontableViewportColumnsCalculator = WalkontableViewportColumnsCalculator;
function WalkontableViewportColumnsCalculator(width, scrollOffset, totalColumns, columnWidthFn, overrideFn, onlyFullyVisible, stretchH) {
  var _this = this,
      ratio = 1,
      sum = 0,
      needReverse = true,
      defaultColumnWidth = 50,
      startPositions = [],
      getColumnWidth,
      columnWidth,
      i;
  this.scrollOffset = scrollOffset;
  this.startColumn = null;
  this.endColumn = null;
  this.startPosition = null;
  this.count = 0;
  this.stretchAllRatio = 0;
  this.stretchLastWidth = 0;
  this.stretch = stretchH;
  this.totalTargetWidth = 0;
  this.needVerifyLastColumnWidth = true;
  this.stretchAllColumnsWidth = [];
  function getStretchedAllColumnWidth(column, baseWidth) {
    var sumRatioWidth = 0;
    if (!_this.stretchAllColumnsWidth[column]) {
      _this.stretchAllColumnsWidth[column] = Math.round(baseWidth * _this.stretchAllRatio);
    }
    if (_this.stretchAllColumnsWidth.length === totalColumns && _this.needVerifyLastColumnWidth) {
      _this.needVerifyLastColumnWidth = false;
      for (var i = 0; i < _this.stretchAllColumnsWidth.length; i++) {
        sumRatioWidth += _this.stretchAllColumnsWidth[i];
      }
      if (sumRatioWidth != _this.totalTargetWidth) {
        _this.stretchAllColumnsWidth[_this.stretchAllColumnsWidth.length - 1] += _this.totalTargetWidth - sumRatioWidth;
      }
    }
    return _this.stretchAllColumnsWidth[column];
  }
  function getStretchedLastColumnWidth(column, baseWidth) {
    if (column === totalColumns - 1) {
      return _this.stretchLastWidth;
    }
    return null;
  }
  getColumnWidth = function getColumnWidth(i) {
    var width = columnWidthFn(i);
    ratio = ratio || 1;
    if (width === undefined) {
      width = defaultColumnWidth;
    }
    return width;
  };
  this.refreshStretching = function(totalWidth) {
    var sumAll = 0,
        columnWidth,
        remainingSize;
    for (var i = 0; i < totalColumns; i++) {
      columnWidth = getColumnWidth(i);
      sumAll += columnWidth;
    }
    this.totalTargetWidth = totalWidth;
    remainingSize = sumAll - totalWidth;
    if (this.stretch === 'all' && remainingSize < 0) {
      this.stretchAllRatio = totalWidth / sumAll;
      this.stretchAllColumnsWidth = [];
      this.needVerifyLastColumnWidth = true;
    } else if (this.stretch === 'last' && totalWidth !== Infinity) {
      this.stretchLastWidth = -remainingSize + getColumnWidth(totalColumns - 1);
    }
  };
  this.getStretchedColumnWidth = function(column, baseWidth) {
    var result = null;
    if (this.stretch === 'all' && this.stretchAllRatio !== 0) {
      result = getStretchedAllColumnWidth(column, baseWidth);
    } else if (this.stretch === 'last' && this.stretchLastWidth !== 0) {
      result = getStretchedLastColumnWidth(column, baseWidth);
    }
    return result;
  };
  for (i = 0; i < totalColumns; i++) {
    columnWidth = getColumnWidth(i);
    if (sum <= scrollOffset && !onlyFullyVisible) {
      this.startColumn = i;
    }
    if (sum >= scrollOffset && sum + columnWidth <= scrollOffset + width) {
      if (this.startColumn == null) {
        this.startColumn = i;
      }
      this.endColumn = i;
    }
    startPositions.push(sum);
    sum += columnWidth;
    if (!onlyFullyVisible) {
      this.endColumn = i;
    }
    if (sum >= scrollOffset + width) {
      needReverse = false;
      break;
    }
  }
  if (this.endColumn == totalColumns - 1 && needReverse) {
    this.startColumn = this.endColumn;
    while (this.startColumn > 0) {
      var viewportSum = startPositions[this.endColumn] + columnWidth - startPositions[this.startColumn - 1];
      if (viewportSum <= width || !onlyFullyVisible) {
        this.startColumn--;
      }
      if (viewportSum > width) {
        break;
      }
    }
  }
  if (this.startColumn !== null && overrideFn) {
    overrideFn(this);
  }
  this.startPosition = startPositions[this.startColumn];
  if (this.startPosition == void 0) {
    this.startPosition = null;
  }
  if (this.startColumn != null) {
    this.count = this.endColumn - this.startColumn + 1;
  }
}


//# 
},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableViewportRowsCalculator: {get: function() {
      return WalkontableViewportRowsCalculator;
    }},
  __esModule: {value: true}
});
;
window.WalkontableViewportRowsCalculator = WalkontableViewportRowsCalculator;
function WalkontableViewportRowsCalculator(height, scrollOffset, totalRows, rowHeightFn, overrideFn, onlyFullyVisible) {
  this.scrollOffset = scrollOffset;
  this.startRow = null;
  this.startPosition = null;
  this.endRow = null;
  this.count = 0;
  var sum = 0;
  var rowHeight;
  var needReverse = true;
  var defaultRowHeight = 23;
  var startPositions = [];
  for (var i = 0; i < totalRows; i++) {
    rowHeight = rowHeightFn(i);
    if (rowHeight === undefined) {
      rowHeight = defaultRowHeight;
    }
    if (sum <= scrollOffset && !onlyFullyVisible) {
      this.startRow = i;
    }
    if (sum >= scrollOffset && sum + rowHeight <= scrollOffset + height) {
      if (this.startRow == null) {
        this.startRow = i;
      }
      this.endRow = i;
    }
    startPositions.push(sum);
    sum += rowHeight;
    if (!onlyFullyVisible) {
      this.endRow = i;
    }
    if (sum >= scrollOffset + height) {
      needReverse = false;
      break;
    }
  }
  if (this.endRow == totalRows - 1 && needReverse) {
    this.startRow = this.endRow;
    while (this.startRow > 0) {
      var viewportSum = startPositions[this.endRow] + rowHeight - startPositions[this.startRow - 1];
      if (viewportSum <= height || !onlyFullyVisible) {
        this.startRow--;
      }
      if (viewportSum >= height) {
        break;
      }
    }
  }
  if (this.startRow !== null && overrideFn) {
    overrideFn(this);
  }
  this.startPosition = startPositions[this.startRow];
  if (this.startPosition == void 0) {
    this.startPosition = null;
  }
  if (this.startRow != null) {
    this.count = this.endRow - this.startRow + 1;
  }
}


//# 
},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableCornerOverlay: {get: function() {
      return WalkontableCornerOverlay;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__,
    $___95_overlay_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
var WalkontableOverlay = ($___95_overlay_46_js__ = require("./_overlay.js"), $___95_overlay_46_js__ && $___95_overlay_46_js__.__esModule && $___95_overlay_46_js__ || {default: $___95_overlay_46_js__}).WalkontableOverlay;
;
window.WalkontableCornerOverlay = WalkontableCornerOverlay;
function WalkontableCornerOverlay(instance) {
  this.instance = instance;
  this.type = 'corner';
  this.init();
  this.clone = this.makeClone('corner');
}
WalkontableCornerOverlay.prototype = new WalkontableOverlay();
WalkontableCornerOverlay.prototype.resetFixedPosition = function() {
  if (!this.instance.wtTable.holder.parentNode) {
    return;
  }
  var elem = this.clone.wtTable.holder.parentNode,
      finalLeft,
      finalTop;
  if (this.trimmingContainer === window) {
    var box = this.instance.wtTable.hider.getBoundingClientRect();
    var top = Math.ceil(box.top);
    var left = Math.ceil(box.left);
    var bottom = Math.ceil(box.bottom);
    var right = Math.ceil(box.right);
    if (left < 0 && (right - elem.offsetWidth) > 0) {
      finalLeft = -left + 'px';
    } else {
      finalLeft = '0';
    }
    if (top < 0 && (bottom - elem.offsetHeight) > 0) {
      finalTop = -top + "px";
    } else {
      finalTop = "0";
    }
    dom.setOverlayPosition(elem, finalLeft, finalTop);
  }
  var tableHeight = dom.outerHeight(this.clone.wtTable.TABLE);
  var tableWidth = dom.outerWidth(this.clone.wtTable.TABLE);
  elem.style.height = (tableHeight === 0 ? tableHeight : tableHeight + 4) + 'px';
  elem.style.width = (tableWidth === 0 ? tableWidth : tableWidth + 4) + 'px';
};


//# 
},{"./../../../dom.js":34,"./_overlay.js":6}],28:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableLeftOverlay: {get: function() {
      return WalkontableLeftOverlay;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__,
    $___95_overlay_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
var WalkontableOverlay = ($___95_overlay_46_js__ = require("./_overlay.js"), $___95_overlay_46_js__ && $___95_overlay_46_js__.__esModule && $___95_overlay_46_js__ || {default: $___95_overlay_46_js__}).WalkontableOverlay;
;
window.WalkontableLeftOverlay = WalkontableLeftOverlay;
function WalkontableLeftOverlay(instance) {
  this.instance = instance;
  this.type = 'horizontal';
  this.offset = 0;
  this.init();
  this.clone = this.makeClone('left');
}
WalkontableLeftOverlay.prototype = new WalkontableOverlay();
WalkontableLeftOverlay.prototype.resetFixedPosition = function() {
  var finalLeft,
      finalTop;
  if (!this.instance.wtTable.holder.parentNode) {
    return;
  }
  var elem = this.clone.wtTable.holder.parentNode,
      scrollbarHeight = this.instance.wtTable.holder.clientHeight !== this.instance.wtTable.holder.offsetHeight ? dom.getScrollbarWidth() : 0,
      scrollbarWidth = this.instance.wtTable.holder.clientWidth !== this.instance.wtTable.holder.offsetWidth ? dom.getScrollbarWidth() : 0;
  if (this.instance.wtOverlays.leftOverlay.trimmingContainer !== window) {
    elem.style.height = this.instance.wtViewport.getWorkspaceHeight() - scrollbarHeight + 'px';
  } else {
    var box = this.instance.wtTable.hider.getBoundingClientRect();
    var left = Math.ceil(box.left);
    var right = Math.ceil(box.right);
    if (left < 0 && (right - elem.offsetWidth) > 0) {
      finalLeft = -left + 'px';
    } else {
      finalLeft = '0';
    }
    finalTop = this.instance.wtTable.hider.style.top;
    finalTop = finalTop === "" ? 0 : finalTop;
    dom.setOverlayPosition(elem, finalLeft, finalTop);
  }
  var tableWidth = dom.outerWidth(this.clone.wtTable.TABLE);
  var elemWidth = (tableWidth === 0 ? tableWidth : tableWidth + 4);
  elem.style.width = elemWidth + 'px';
  this.clone.wtTable.holder.style.width = elemWidth + scrollbarWidth + 'px';
  this.hideBorderOnInitialPosition();
};
WalkontableLeftOverlay.prototype.hideBorderOnInitialPosition = function() {
  if (this.instance.getSetting('fixedColumnsLeft') === 0 && this.instance.getSetting('rowHeaders').length > 0) {
    var masterParent = this.instance.wtTable.holder.parentNode;
    if (this.getScrollPosition() === 0) {
      dom.removeClass(masterParent, 'innerBorderLeft');
    } else {
      dom.addClass(masterParent, 'innerBorderLeft');
    }
  }
};
WalkontableLeftOverlay.prototype.refresh = function(fastDraw) {
  this.applyToDOM();
  WalkontableOverlay.prototype.refresh.call(this, fastDraw);
};
WalkontableLeftOverlay.prototype.getScrollPosition = function() {
  return dom.getScrollLeft(this.mainTableScrollableElement);
};
WalkontableLeftOverlay.prototype.setScrollPosition = function(pos) {
  if (this.mainTableScrollableElement === window) {
    window.scrollTo(pos, dom.getWindowScrollTop());
  } else {
    this.mainTableScrollableElement.scrollLeft = pos;
  }
};
WalkontableLeftOverlay.prototype.onScroll = function() {
  this.instance.getSetting('onScrollHorizontally');
};
WalkontableLeftOverlay.prototype.sumCellSizes = function(from, length) {
  var sum = 0,
      defaultColumnWidth = this.instance.wtSettings.defaultColumnWidth;
  while (from < length) {
    sum += this.instance.wtTable.getStretchedColumnWidth(from) || defaultColumnWidth;
    from++;
  }
  return sum;
};
WalkontableLeftOverlay.prototype.applyToDOM = function() {
  var total = this.instance.getSetting('totalColumns'),
      headerSize = this.instance.wtViewport.getRowHeaderWidth(),
      cloneHolder = this.clone.wtTable.holder,
      cloneHider = this.clone.wtTable.hider,
      masterHider = this.hider,
      cloneHolderParent = cloneHolder.parentNode,
      scrollbarWidth = dom.getScrollbarWidth(true);
  masterHider.style.width = headerSize + this.sumCellSizes(0, total) + 'px';
  cloneHolder.style.width = parseInt(cloneHolderParent.style.width, 10) + scrollbarWidth + 'px';
  cloneHider.style.height = masterHider.style.height;
  cloneHolder.style.height = cloneHolderParent.style.height;
  if (typeof this.instance.wtViewport.columnsRenderCalculator.startPosition === 'number') {
    this.spreader.style.left = this.instance.wtViewport.columnsRenderCalculator.startPosition + 'px';
  } else if (total === 0) {
    this.spreader.style.left = '0';
  } else {
    throw new Error('Incorrect value of the columnsRenderCalculator');
  }
  this.spreader.style.right = '';
  this.syncOverlayOffset();
};
WalkontableLeftOverlay.prototype.syncOverlayOffset = function() {
  if (typeof this.instance.wtViewport.rowsRenderCalculator.startPosition === 'number') {
    this.clone.wtTable.spreader.style.top = this.instance.wtViewport.rowsRenderCalculator.startPosition + 'px';
  } else {
    this.clone.wtTable.spreader.style.top = '';
  }
};
WalkontableLeftOverlay.prototype.scrollTo = function(sourceCol, beyondRendered) {
  var newX = this.getTableParentOffset(),
      sourceInstance = this.instance.cloneSource ? this.instance.cloneSource : this.instance,
      mainHolder = sourceInstance.wtTable.holder,
      scrollbarCompensation = 0;
  if (beyondRendered && mainHolder.offsetWidth !== mainHolder.clientWidth) {
    scrollbarCompensation = dom.getScrollbarWidth();
  }
  if (beyondRendered) {
    newX += this.sumCellSizes(0, sourceCol + 1);
    newX -= this.instance.wtViewport.getViewportWidth();
  } else {
    var fixedColumnsLeft = this.instance.getSetting('fixedColumnsLeft');
    newX += this.sumCellSizes(fixedColumnsLeft, sourceCol);
  }
  newX += scrollbarCompensation;
  this.setScrollPosition(newX);
};
WalkontableLeftOverlay.prototype.getTableParentOffset = function() {
  if (this.trimmingContainer === window) {
    return this.instance.wtTable.holderOffset.left;
  } else {
    return 0;
  }
};


//# 
},{"./../../../dom.js":34,"./_overlay.js":6}],29:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  WalkontableTopOverlay: {get: function() {
      return WalkontableTopOverlay;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47__46__46__47_dom_46_js__,
    $___95_overlay_46_js__;
var dom = ($___46__46__47__46__46__47__46__46__47_dom_46_js__ = require("./../../../dom.js"), $___46__46__47__46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47__46__46__47_dom_46_js__});
var WalkontableOverlay = ($___95_overlay_46_js__ = require("./_overlay.js"), $___95_overlay_46_js__ && $___95_overlay_46_js__.__esModule && $___95_overlay_46_js__ || {default: $___95_overlay_46_js__}).WalkontableOverlay;
;
window.WalkontableTopOverlay = WalkontableTopOverlay;
function WalkontableTopOverlay(instance) {
  this.instance = instance;
  this.type = 'vertical';
  this.init();
  this.clone = this.makeClone('top');
}
WalkontableTopOverlay.prototype = new WalkontableOverlay();
WalkontableTopOverlay.prototype.resetFixedPosition = function() {
  var finalLeft,
      finalTop;
  if (!this.instance.wtTable.holder.parentNode) {
    return;
  }
  var elem = this.clone.wtTable.holder.parentNode,
      scrollbarWidth = this.instance.wtTable.holder.clientWidth !== this.instance.wtTable.holder.offsetWidth ? dom.getScrollbarWidth() : 0;
  if (this.instance.wtOverlays.leftOverlay.trimmingContainer !== window) {
    elem.style.width = this.instance.wtViewport.getWorkspaceWidth() - scrollbarWidth + 'px';
  } else {
    var box = this.instance.wtTable.hider.getBoundingClientRect();
    var top = Math.ceil(box.top);
    var bottom = Math.ceil(box.bottom);
    finalLeft = this.instance.wtTable.hider.style.left;
    finalLeft = finalLeft === "" ? 0 : finalLeft;
    if (top < 0 && (bottom - elem.offsetHeight) > 0) {
      finalTop = -top + "px";
    } else {
      finalTop = "0";
    }
    dom.setOverlayPosition(elem, finalLeft, finalTop);
  }
  this.clone.wtTable.holder.style.width = elem.style.width;
  var tableHeight = dom.outerHeight(this.clone.wtTable.TABLE);
  elem.style.height = (tableHeight === 0 ? tableHeight : tableHeight + 4) + 'px';
  this.hideBorderOnInitialPosition();
};
WalkontableTopOverlay.prototype.hideBorderOnInitialPosition = function() {
  if (this.instance.getSetting('fixedRowsTop') === 0 && this.instance.getSetting('columnHeaders').length > 0) {
    var masterParent = this.instance.wtTable.holder.parentNode;
    if (this.getScrollPosition() === 0) {
      dom.removeClass(masterParent, 'innerBorderTop');
    } else {
      dom.addClass(masterParent, 'innerBorderTop');
    }
  }
  if (this.instance.getSetting('rowHeaders').length === 0) {
    var secondHeaderCell = this.clone.wtTable.THEAD.querySelector('th:nth-of-type(2)');
    if (secondHeaderCell) {
      secondHeaderCell.style['border-left-width'] = 0;
    }
  }
};
WalkontableTopOverlay.prototype.getScrollPosition = function() {
  return dom.getScrollTop(this.mainTableScrollableElement);
};
WalkontableTopOverlay.prototype.setScrollPosition = function(pos) {
  if (this.mainTableScrollableElement === window) {
    window.scrollTo(dom.getWindowScrollLeft(), pos);
  } else {
    this.mainTableScrollableElement.scrollTop = pos;
  }
};
WalkontableTopOverlay.prototype.onScroll = function() {
  this.instance.getSetting('onScrollVertically');
};
WalkontableTopOverlay.prototype.sumCellSizes = function(from, length) {
  var sum = 0,
      defaultRowHeight = this.instance.wtSettings.settings.defaultRowHeight;
  while (from < length) {
    sum += this.instance.wtTable.getRowHeight(from) || defaultRowHeight;
    from++;
  }
  return sum;
};
WalkontableTopOverlay.prototype.refresh = function(fastDraw) {
  this.applyToDOM();
  WalkontableOverlay.prototype.refresh.call(this, fastDraw);
};
WalkontableTopOverlay.prototype.applyToDOM = function() {
  var total = this.instance.getSetting('totalRows');
  var headerSize = this.instance.wtViewport.getColumnHeaderHeight();
  var scrollbarWidth = dom.getScrollbarWidth(true);
  var totalEstimatedHeight = headerSize + this.sumCellSizes(0, total) + 1 + 'px';
  this.hider.style.height = totalEstimatedHeight;
  this.clone.wtTable.hider.style.width = this.hider.style.width;
  this.clone.wtTable.holder.style.width = this.clone.wtTable.holder.parentNode.style.width;
  this.clone.wtTable.holder.style.height = parseInt(this.clone.wtTable.holder.parentNode.style.height, 10) + scrollbarWidth + 'px';
  if (typeof this.instance.wtViewport.rowsRenderCalculator.startPosition === 'number') {
    this.spreader.style.top = this.instance.wtViewport.rowsRenderCalculator.startPosition + 'px';
  } else if (total === 0) {
    this.spreader.style.top = '0';
  } else {
    throw new Error("Incorrect value of the rowsRenderCalculator");
  }
  this.spreader.style.bottom = '';
  this.syncOverlayOffset();
};
WalkontableTopOverlay.prototype.syncOverlayOffset = function() {
  if (typeof this.instance.wtViewport.columnsRenderCalculator.startPosition === 'number') {
    this.clone.wtTable.spreader.style.left = this.instance.wtViewport.columnsRenderCalculator.startPosition + 'px';
  } else {
    this.clone.wtTable.spreader.style.left = '';
  }
};
WalkontableTopOverlay.prototype.scrollTo = function(sourceRow, bottomEdge) {
  var newY = this.getTableParentOffset(),
      sourceInstance = this.instance.cloneSource ? this.instance.cloneSource : this.instance,
      mainHolder = sourceInstance.wtTable.holder,
      scrollbarCompensation = 0;
  if (bottomEdge && mainHolder.offsetHeight !== mainHolder.clientHeight) {
    scrollbarCompensation = dom.getScrollbarWidth();
  }
  if (bottomEdge) {
    newY += this.sumCellSizes(0, sourceRow + 1);
    newY -= this.instance.wtViewport.getViewportHeight();
    newY += 1;
  } else {
    var fixedRowsTop = this.instance.getSetting('fixedRowsTop');
    newY += this.sumCellSizes(fixedRowsTop, sourceRow);
  }
  newY += scrollbarCompensation;
  this.setScrollPosition(newY);
};
WalkontableTopOverlay.prototype.getTableParentOffset = function() {
  if (this.mainTableScrollableElement === window) {
    return this.instance.wtTable.holderOffset.top;
  } else {
    return 0;
  }
};


//# 
},{"./../../../dom.js":34,"./_overlay.js":6}],30:[function(require,module,exports){
"use strict";
var $__shims_47_array_46_filter_46_js__,
    $__shims_47_array_46_indexOf_46_js__,
    $__shims_47_array_46_isArray_46_js__,
    $__shims_47_object_46_keys_46_js__,
    $__shims_47_classes_46_js__,
    $__shims_47_weakmap_46_js__,
    $__pluginHooks_46_js__,
    $__core_46_js__,
    $__renderers_47__95_cellDecorator_46_js__,
    $__cellTypes_46_js__,
    $___46__46__47_plugins_47_jqueryHandsontable_46_js__;
var version = Handsontable.version;
window.Handsontable = function(rootElement, userSettings) {
  var instance = new Handsontable.Core(rootElement, userSettings || {});
  instance.init();
  return instance;
};
Handsontable.version = version;
($__shims_47_array_46_filter_46_js__ = require("./shims/array.filter.js"), $__shims_47_array_46_filter_46_js__ && $__shims_47_array_46_filter_46_js__.__esModule && $__shims_47_array_46_filter_46_js__ || {default: $__shims_47_array_46_filter_46_js__});
($__shims_47_array_46_indexOf_46_js__ = require("./shims/array.indexOf.js"), $__shims_47_array_46_indexOf_46_js__ && $__shims_47_array_46_indexOf_46_js__.__esModule && $__shims_47_array_46_indexOf_46_js__ || {default: $__shims_47_array_46_indexOf_46_js__});
($__shims_47_array_46_isArray_46_js__ = require("./shims/array.isArray.js"), $__shims_47_array_46_isArray_46_js__ && $__shims_47_array_46_isArray_46_js__.__esModule && $__shims_47_array_46_isArray_46_js__ || {default: $__shims_47_array_46_isArray_46_js__});
($__shims_47_object_46_keys_46_js__ = require("./shims/object.keys.js"), $__shims_47_object_46_keys_46_js__ && $__shims_47_object_46_keys_46_js__.__esModule && $__shims_47_object_46_keys_46_js__ || {default: $__shims_47_object_46_keys_46_js__});
($__shims_47_classes_46_js__ = require("./shims/classes.js"), $__shims_47_classes_46_js__ && $__shims_47_classes_46_js__.__esModule && $__shims_47_classes_46_js__ || {default: $__shims_47_classes_46_js__});
($__shims_47_weakmap_46_js__ = require("./shims/weakmap.js"), $__shims_47_weakmap_46_js__ && $__shims_47_weakmap_46_js__.__esModule && $__shims_47_weakmap_46_js__ || {default: $__shims_47_weakmap_46_js__});
Handsontable.plugins = {};
var PluginHook = ($__pluginHooks_46_js__ = require("./pluginHooks.js"), $__pluginHooks_46_js__ && $__pluginHooks_46_js__.__esModule && $__pluginHooks_46_js__ || {default: $__pluginHooks_46_js__}).PluginHook;
if (!Handsontable.hooks) {
  Handsontable.hooks = new PluginHook();
}
($__core_46_js__ = require("./core.js"), $__core_46_js__ && $__core_46_js__.__esModule && $__core_46_js__ || {default: $__core_46_js__});
($__renderers_47__95_cellDecorator_46_js__ = require("./renderers/_cellDecorator.js"), $__renderers_47__95_cellDecorator_46_js__ && $__renderers_47__95_cellDecorator_46_js__.__esModule && $__renderers_47__95_cellDecorator_46_js__ || {default: $__renderers_47__95_cellDecorator_46_js__});
($__cellTypes_46_js__ = require("./cellTypes.js"), $__cellTypes_46_js__ && $__cellTypes_46_js__.__esModule && $__cellTypes_46_js__ || {default: $__cellTypes_46_js__});
($___46__46__47_plugins_47_jqueryHandsontable_46_js__ = require("./../plugins/jqueryHandsontable.js"), $___46__46__47_plugins_47_jqueryHandsontable_46_js__ && $___46__46__47_plugins_47_jqueryHandsontable_46_js__.__esModule && $___46__46__47_plugins_47_jqueryHandsontable_46_js__ || {default: $___46__46__47_plugins_47_jqueryHandsontable_46_js__});


//# 
},{"./../plugins/jqueryHandsontable.js":1,"./cellTypes.js":31,"./core.js":32,"./pluginHooks.js":51,"./renderers/_cellDecorator.js":77,"./shims/array.filter.js":84,"./shims/array.indexOf.js":85,"./shims/array.isArray.js":86,"./shims/classes.js":87,"./shims/object.keys.js":88,"./shims/weakmap.js":89}],31:[function(require,module,exports){
"use strict";
var $__helpers_46_js__,
    $__editors_46_js__,
    $__renderers_46_js__,
    $__editors_47_autocompleteEditor_46_js__,
    $__editors_47_checkboxEditor_46_js__,
    $__editors_47_dateEditor_46_js__,
    $__editors_47_dropdownEditor_46_js__,
    $__editors_47_handsontableEditor_46_js__,
    $__editors_47_mobileTextEditor_46_js__,
    $__editors_47_numericEditor_46_js__,
    $__editors_47_passwordEditor_46_js__,
    $__editors_47_selectEditor_46_js__,
    $__editors_47_textEditor_46_js__,
    $__renderers_47_autocompleteRenderer_46_js__,
    $__renderers_47_checkboxRenderer_46_js__,
    $__renderers_47_htmlRenderer_46_js__,
    $__renderers_47_numericRenderer_46_js__,
    $__renderers_47_passwordRenderer_46_js__,
    $__renderers_47_textRenderer_46_js__,
    $__validators_47_autocompleteValidator_46_js__,
    $__validators_47_dateValidator_46_js__,
    $__validators_47_numericValidator_46_js__;
var helper = ($__helpers_46_js__ = require("./helpers.js"), $__helpers_46_js__ && $__helpers_46_js__.__esModule && $__helpers_46_js__ || {default: $__helpers_46_js__});
var getEditorConstructor = ($__editors_46_js__ = require("./editors.js"), $__editors_46_js__ && $__editors_46_js__.__esModule && $__editors_46_js__ || {default: $__editors_46_js__}).getEditorConstructor;
var getRenderer = ($__renderers_46_js__ = require("./renderers.js"), $__renderers_46_js__ && $__renderers_46_js__.__esModule && $__renderers_46_js__ || {default: $__renderers_46_js__}).getRenderer;
var AutocompleteEditor = ($__editors_47_autocompleteEditor_46_js__ = require("./editors/autocompleteEditor.js"), $__editors_47_autocompleteEditor_46_js__ && $__editors_47_autocompleteEditor_46_js__.__esModule && $__editors_47_autocompleteEditor_46_js__ || {default: $__editors_47_autocompleteEditor_46_js__}).AutocompleteEditor;
var CheckboxEditor = ($__editors_47_checkboxEditor_46_js__ = require("./editors/checkboxEditor.js"), $__editors_47_checkboxEditor_46_js__ && $__editors_47_checkboxEditor_46_js__.__esModule && $__editors_47_checkboxEditor_46_js__ || {default: $__editors_47_checkboxEditor_46_js__}).CheckboxEditor;
var DateEditor = ($__editors_47_dateEditor_46_js__ = require("./editors/dateEditor.js"), $__editors_47_dateEditor_46_js__ && $__editors_47_dateEditor_46_js__.__esModule && $__editors_47_dateEditor_46_js__ || {default: $__editors_47_dateEditor_46_js__}).DateEditor;
var DropdownEditor = ($__editors_47_dropdownEditor_46_js__ = require("./editors/dropdownEditor.js"), $__editors_47_dropdownEditor_46_js__ && $__editors_47_dropdownEditor_46_js__.__esModule && $__editors_47_dropdownEditor_46_js__ || {default: $__editors_47_dropdownEditor_46_js__}).DropdownEditor;
var HandsontableEditor = ($__editors_47_handsontableEditor_46_js__ = require("./editors/handsontableEditor.js"), $__editors_47_handsontableEditor_46_js__ && $__editors_47_handsontableEditor_46_js__.__esModule && $__editors_47_handsontableEditor_46_js__ || {default: $__editors_47_handsontableEditor_46_js__}).HandsontableEditor;
var MobileTextEditor = ($__editors_47_mobileTextEditor_46_js__ = require("./editors/mobileTextEditor.js"), $__editors_47_mobileTextEditor_46_js__ && $__editors_47_mobileTextEditor_46_js__.__esModule && $__editors_47_mobileTextEditor_46_js__ || {default: $__editors_47_mobileTextEditor_46_js__}).MobileTextEditor;
var NumericEditor = ($__editors_47_numericEditor_46_js__ = require("./editors/numericEditor.js"), $__editors_47_numericEditor_46_js__ && $__editors_47_numericEditor_46_js__.__esModule && $__editors_47_numericEditor_46_js__ || {default: $__editors_47_numericEditor_46_js__}).NumericEditor;
var PasswordEditor = ($__editors_47_passwordEditor_46_js__ = require("./editors/passwordEditor.js"), $__editors_47_passwordEditor_46_js__ && $__editors_47_passwordEditor_46_js__.__esModule && $__editors_47_passwordEditor_46_js__ || {default: $__editors_47_passwordEditor_46_js__}).PasswordEditor;
var SelectEditor = ($__editors_47_selectEditor_46_js__ = require("./editors/selectEditor.js"), $__editors_47_selectEditor_46_js__ && $__editors_47_selectEditor_46_js__.__esModule && $__editors_47_selectEditor_46_js__ || {default: $__editors_47_selectEditor_46_js__}).SelectEditor;
var TextEditor = ($__editors_47_textEditor_46_js__ = require("./editors/textEditor.js"), $__editors_47_textEditor_46_js__ && $__editors_47_textEditor_46_js__.__esModule && $__editors_47_textEditor_46_js__ || {default: $__editors_47_textEditor_46_js__}).TextEditor;
var AutocompleteRenderer = ($__renderers_47_autocompleteRenderer_46_js__ = require("./renderers/autocompleteRenderer.js"), $__renderers_47_autocompleteRenderer_46_js__ && $__renderers_47_autocompleteRenderer_46_js__.__esModule && $__renderers_47_autocompleteRenderer_46_js__ || {default: $__renderers_47_autocompleteRenderer_46_js__}).AutocompleteRenderer;
var CheckboxRenderer = ($__renderers_47_checkboxRenderer_46_js__ = require("./renderers/checkboxRenderer.js"), $__renderers_47_checkboxRenderer_46_js__ && $__renderers_47_checkboxRenderer_46_js__.__esModule && $__renderers_47_checkboxRenderer_46_js__ || {default: $__renderers_47_checkboxRenderer_46_js__}).CheckboxRenderer;
var HtmlRenderer = ($__renderers_47_htmlRenderer_46_js__ = require("./renderers/htmlRenderer.js"), $__renderers_47_htmlRenderer_46_js__ && $__renderers_47_htmlRenderer_46_js__.__esModule && $__renderers_47_htmlRenderer_46_js__ || {default: $__renderers_47_htmlRenderer_46_js__}).HtmlRenderer;
var NumericRenderer = ($__renderers_47_numericRenderer_46_js__ = require("./renderers/numericRenderer.js"), $__renderers_47_numericRenderer_46_js__ && $__renderers_47_numericRenderer_46_js__.__esModule && $__renderers_47_numericRenderer_46_js__ || {default: $__renderers_47_numericRenderer_46_js__}).NumericRenderer;
var PasswordRenderer = ($__renderers_47_passwordRenderer_46_js__ = require("./renderers/passwordRenderer.js"), $__renderers_47_passwordRenderer_46_js__ && $__renderers_47_passwordRenderer_46_js__.__esModule && $__renderers_47_passwordRenderer_46_js__ || {default: $__renderers_47_passwordRenderer_46_js__}).PasswordRenderer;
var TextRenderer = ($__renderers_47_textRenderer_46_js__ = require("./renderers/textRenderer.js"), $__renderers_47_textRenderer_46_js__ && $__renderers_47_textRenderer_46_js__.__esModule && $__renderers_47_textRenderer_46_js__ || {default: $__renderers_47_textRenderer_46_js__}).TextRenderer;
var AutocompleteValidator = ($__validators_47_autocompleteValidator_46_js__ = require("./validators/autocompleteValidator.js"), $__validators_47_autocompleteValidator_46_js__ && $__validators_47_autocompleteValidator_46_js__.__esModule && $__validators_47_autocompleteValidator_46_js__ || {default: $__validators_47_autocompleteValidator_46_js__}).AutocompleteValidator;
var DateValidator = ($__validators_47_dateValidator_46_js__ = require("./validators/dateValidator.js"), $__validators_47_dateValidator_46_js__ && $__validators_47_dateValidator_46_js__.__esModule && $__validators_47_dateValidator_46_js__ || {default: $__validators_47_dateValidator_46_js__}).DateValidator;
var NumericValidator = ($__validators_47_numericValidator_46_js__ = require("./validators/numericValidator.js"), $__validators_47_numericValidator_46_js__ && $__validators_47_numericValidator_46_js__.__esModule && $__validators_47_numericValidator_46_js__ || {default: $__validators_47_numericValidator_46_js__}).NumericValidator;
Handsontable.mobileBrowser = helper.isMobileBrowser();
Handsontable.AutocompleteCell = {
  editor: getEditorConstructor('autocomplete'),
  renderer: getRenderer('autocomplete'),
  validator: Handsontable.AutocompleteValidator
};
Handsontable.CheckboxCell = {
  editor: getEditorConstructor('checkbox'),
  renderer: getRenderer('checkbox')
};
Handsontable.TextCell = {
  editor: Handsontable.mobileBrowser ? getEditorConstructor('mobile') : getEditorConstructor('text'),
  renderer: getRenderer('text')
};
Handsontable.NumericCell = {
  editor: getEditorConstructor('numeric'),
  renderer: getRenderer('numeric'),
  validator: Handsontable.NumericValidator,
  dataType: 'number'
};
Handsontable.DateCell = {
  editor: getEditorConstructor('date'),
  validator: Handsontable.DateValidator,
  renderer: getRenderer('autocomplete')
};
Handsontable.HandsontableCell = {
  editor: getEditorConstructor('handsontable'),
  renderer: getRenderer('autocomplete')
};
Handsontable.PasswordCell = {
  editor: getEditorConstructor('password'),
  renderer: getRenderer('password'),
  copyable: false
};
Handsontable.DropdownCell = {
  editor: getEditorConstructor('dropdown'),
  renderer: getRenderer('autocomplete'),
  validator: Handsontable.AutocompleteValidator
};
Handsontable.cellTypes = {
  text: Handsontable.TextCell,
  date: Handsontable.DateCell,
  numeric: Handsontable.NumericCell,
  checkbox: Handsontable.CheckboxCell,
  autocomplete: Handsontable.AutocompleteCell,
  handsontable: Handsontable.HandsontableCell,
  password: Handsontable.PasswordCell,
  dropdown: Handsontable.DropdownCell
};
Handsontable.cellLookup = {validator: {
    numeric: Handsontable.NumericValidator,
    autocomplete: Handsontable.AutocompleteValidator
  }};


//# 
},{"./editors.js":36,"./editors/autocompleteEditor.js":38,"./editors/checkboxEditor.js":39,"./editors/dateEditor.js":40,"./editors/dropdownEditor.js":41,"./editors/handsontableEditor.js":42,"./editors/mobileTextEditor.js":43,"./editors/numericEditor.js":44,"./editors/passwordEditor.js":45,"./editors/selectEditor.js":46,"./editors/textEditor.js":47,"./helpers.js":49,"./renderers.js":76,"./renderers/autocompleteRenderer.js":78,"./renderers/checkboxRenderer.js":79,"./renderers/htmlRenderer.js":80,"./renderers/numericRenderer.js":81,"./renderers/passwordRenderer.js":82,"./renderers/textRenderer.js":83,"./validators/autocompleteValidator.js":91,"./validators/dateValidator.js":92,"./validators/numericValidator.js":93}],32:[function(require,module,exports){
"use strict";
var $__dom_46_js__,
    $__helpers_46_js__,
    $__numeral__,
    $__dataMap_46_js__,
    $__editorManager_46_js__,
    $__eventManager_46_js__,
    $__plugins_46_js__,
    $__renderers_46_js__,
    $__pluginHooks_46_js__,
    $__tableView_46_js__,
    $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__,
    $__3rdparty_47_walkontable_47_src_47_cellRange_46_js__,
    $__3rdparty_47_walkontable_47_src_47_selection_46_js__;
var dom = ($__dom_46_js__ = require("./dom.js"), $__dom_46_js__ && $__dom_46_js__.__esModule && $__dom_46_js__ || {default: $__dom_46_js__});
var helper = ($__helpers_46_js__ = require("./helpers.js"), $__helpers_46_js__ && $__helpers_46_js__.__esModule && $__helpers_46_js__ || {default: $__helpers_46_js__});
var numeral = ($__numeral__ = require("numeral"), $__numeral__ && $__numeral__.__esModule && $__numeral__ || {default: $__numeral__}).default;
var DataMap = ($__dataMap_46_js__ = require("./dataMap.js"), $__dataMap_46_js__ && $__dataMap_46_js__.__esModule && $__dataMap_46_js__ || {default: $__dataMap_46_js__}).DataMap;
var EditorManager = ($__editorManager_46_js__ = require("./editorManager.js"), $__editorManager_46_js__ && $__editorManager_46_js__.__esModule && $__editorManager_46_js__ || {default: $__editorManager_46_js__}).EditorManager;
var eventManagerObject = ($__eventManager_46_js__ = require("./eventManager.js"), $__eventManager_46_js__ && $__eventManager_46_js__.__esModule && $__eventManager_46_js__ || {default: $__eventManager_46_js__}).eventManager;
var getPlugin = ($__plugins_46_js__ = require("./plugins.js"), $__plugins_46_js__ && $__plugins_46_js__.__esModule && $__plugins_46_js__ || {default: $__plugins_46_js__}).getPlugin;
var getRenderer = ($__renderers_46_js__ = require("./renderers.js"), $__renderers_46_js__ && $__renderers_46_js__.__esModule && $__renderers_46_js__ || {default: $__renderers_46_js__}).getRenderer;
var PluginHook = ($__pluginHooks_46_js__ = require("./pluginHooks.js"), $__pluginHooks_46_js__ && $__pluginHooks_46_js__.__esModule && $__pluginHooks_46_js__ || {default: $__pluginHooks_46_js__}).PluginHook;
var TableView = ($__tableView_46_js__ = require("./tableView.js"), $__tableView_46_js__ && $__tableView_46_js__.__esModule && $__tableView_46_js__ || {default: $__tableView_46_js__}).TableView;
var WalkontableCellCoords = ($__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ = require("./3rdparty/walkontable/src/cellCoords.js"), $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ && $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__.__esModule && $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ || {default: $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__}).WalkontableCellCoords;
var WalkontableCellRange = ($__3rdparty_47_walkontable_47_src_47_cellRange_46_js__ = require("./3rdparty/walkontable/src/cellRange.js"), $__3rdparty_47_walkontable_47_src_47_cellRange_46_js__ && $__3rdparty_47_walkontable_47_src_47_cellRange_46_js__.__esModule && $__3rdparty_47_walkontable_47_src_47_cellRange_46_js__ || {default: $__3rdparty_47_walkontable_47_src_47_cellRange_46_js__}).WalkontableCellRange;
var WalkontableSelection = ($__3rdparty_47_walkontable_47_src_47_selection_46_js__ = require("./3rdparty/walkontable/src/selection.js"), $__3rdparty_47_walkontable_47_src_47_selection_46_js__ && $__3rdparty_47_walkontable_47_src_47_selection_46_js__.__esModule && $__3rdparty_47_walkontable_47_src_47_selection_46_js__ || {default: $__3rdparty_47_walkontable_47_src_47_selection_46_js__}).WalkontableSelection;
Handsontable.activeGuid = null;
Handsontable.Core = function Core(rootElement, userSettings) {
  var priv,
      datamap,
      grid,
      selection,
      editorManager,
      instance = this,
      GridSettings = function() {},
      eventManager = eventManagerObject(instance);
  helper.extend(GridSettings.prototype, DefaultSettings.prototype);
  helper.extend(GridSettings.prototype, userSettings);
  helper.extend(GridSettings.prototype, expandType(userSettings));
  this.rootElement = rootElement;
  this.isHotTableEnv = dom.isChildOfWebComponentTable(this.rootElement);
  Handsontable.eventManager.isHotTableEnv = this.isHotTableEnv;
  this.container = document.createElement('DIV');
  rootElement.insertBefore(this.container, rootElement.firstChild);
  this.guid = 'ht_' + helper.randomString();
  if (!this.rootElement.id || this.rootElement.id.substring(0, 3) === "ht_") {
    this.rootElement.id = this.guid;
  }
  priv = {
    cellSettings: [],
    columnSettings: [],
    columnsSettingConflicts: ['data', 'width'],
    settings: new GridSettings(),
    selRange: null,
    isPopulated: null,
    scrollable: null,
    firstRun: true
  };
  grid = {
    alter: function(action, index, amount, source, keepEmptyRows) {
      var delta;
      amount = amount || 1;
      switch (action) {
        case "insert_row":
          if (instance.getSettings().maxRows === instance.countRows()) {
            return;
          }
          delta = datamap.createRow(index, amount);
          if (delta) {
            if (selection.isSelected() && priv.selRange.from.row >= index) {
              priv.selRange.from.row = priv.selRange.from.row + delta;
              selection.transformEnd(delta, 0);
            } else {
              selection.refreshBorders();
            }
          }
          break;
        case "insert_col":
          delta = datamap.createCol(index, amount);
          if (delta) {
            if (Array.isArray(instance.getSettings().colHeaders)) {
              var spliceArray = [index, 0];
              spliceArray.length += delta;
              Array.prototype.splice.apply(instance.getSettings().colHeaders, spliceArray);
            }
            if (selection.isSelected() && priv.selRange.from.col >= index) {
              priv.selRange.from.col = priv.selRange.from.col + delta;
              selection.transformEnd(0, delta);
            } else {
              selection.refreshBorders();
            }
          }
          break;
        case "remove_row":
          index = instance.runHooks('modifyCol', index);
          datamap.removeRow(index, amount);
          priv.cellSettings.splice(index, amount);
          var fixedRowsTop = instance.getSettings().fixedRowsTop;
          if (fixedRowsTop >= index + 1) {
            instance.getSettings().fixedRowsTop -= Math.min(amount, fixedRowsTop - index);
          }
          grid.adjustRowsAndCols();
          selection.refreshBorders();
          break;
        case "remove_col":
          datamap.removeCol(index, amount);
          for (var row = 0,
              len = datamap.getAll().length; row < len; row++) {
            if (row in priv.cellSettings) {
              priv.cellSettings[row].splice(index, amount);
            }
          }
          var fixedColumnsLeft = instance.getSettings().fixedColumnsLeft;
          if (fixedColumnsLeft >= index + 1) {
            instance.getSettings().fixedColumnsLeft -= Math.min(amount, fixedColumnsLeft - index);
          }
          if (Array.isArray(instance.getSettings().colHeaders)) {
            if (typeof index == 'undefined') {
              index = -1;
            }
            instance.getSettings().colHeaders.splice(index, amount);
          }
          grid.adjustRowsAndCols();
          selection.refreshBorders();
          break;
        default:
          throw new Error('There is no such action "' + action + '"');
          break;
      }
      if (!keepEmptyRows) {
        grid.adjustRowsAndCols();
      }
    },
    adjustRowsAndCols: function() {
      var r,
          rlen,
          emptyRows,
          emptyCols;
      rlen = instance.countRows();
      if (rlen < priv.settings.minRows) {
        for (r = 0; r < priv.settings.minRows - rlen; r++) {
          datamap.createRow(instance.countRows(), 1, true);
        }
      }
      emptyRows = instance.countEmptyRows(true);
      if (emptyRows < priv.settings.minSpareRows) {
        for (; emptyRows < priv.settings.minSpareRows && instance.countRows() < priv.settings.maxRows; emptyRows++) {
          datamap.createRow(instance.countRows(), 1, true);
        }
      }
      emptyCols = instance.countEmptyCols(true);
      if (!priv.settings.columns && instance.countCols() < priv.settings.minCols) {
        for (; instance.countCols() < priv.settings.minCols; emptyCols++) {
          datamap.createCol(instance.countCols(), 1, true);
        }
      }
      if (!priv.settings.columns && instance.dataType === 'array' && emptyCols < priv.settings.minSpareCols) {
        for (; emptyCols < priv.settings.minSpareCols && instance.countCols() < priv.settings.maxCols; emptyCols++) {
          datamap.createCol(instance.countCols(), 1, true);
        }
      }
      var rowCount = instance.countRows();
      var colCount = instance.countCols();
      if (rowCount === 0 || colCount === 0) {
        selection.deselect();
      }
      if (selection.isSelected()) {
        var selectionChanged;
        var fromRow = priv.selRange.from.row;
        var fromCol = priv.selRange.from.col;
        var toRow = priv.selRange.to.row;
        var toCol = priv.selRange.to.col;
        if (fromRow > rowCount - 1) {
          fromRow = rowCount - 1;
          selectionChanged = true;
          if (toRow > fromRow) {
            toRow = fromRow;
          }
        } else if (toRow > rowCount - 1) {
          toRow = rowCount - 1;
          selectionChanged = true;
          if (fromRow > toRow) {
            fromRow = toRow;
          }
        }
        if (fromCol > colCount - 1) {
          fromCol = colCount - 1;
          selectionChanged = true;
          if (toCol > fromCol) {
            toCol = fromCol;
          }
        } else if (toCol > colCount - 1) {
          toCol = colCount - 1;
          selectionChanged = true;
          if (fromCol > toCol) {
            fromCol = toCol;
          }
        }
        if (selectionChanged) {
          instance.selectCell(fromRow, fromCol, toRow, toCol);
        }
      }
    },
    populateFromArray: function(start, input, end, source, method, direction, deltas) {
      var r,
          rlen,
          c,
          clen,
          setData = [],
          current = {};
      rlen = input.length;
      if (rlen === 0) {
        return false;
      }
      var repeatCol,
          repeatRow,
          cmax,
          rmax;
      switch (method) {
        case 'shift_down':
          repeatCol = end ? end.col - start.col + 1 : 0;
          repeatRow = end ? end.row - start.row + 1 : 0;
          input = helper.translateRowsToColumns(input);
          for (c = 0, clen = input.length, cmax = Math.max(clen, repeatCol); c < cmax; c++) {
            if (c < clen) {
              for (r = 0, rlen = input[c].length; r < repeatRow - rlen; r++) {
                input[c].push(input[c][r % rlen]);
              }
              input[c].unshift(start.col + c, start.row, 0);
              instance.spliceCol.apply(instance, input[c]);
            } else {
              input[c % clen][0] = start.col + c;
              instance.spliceCol.apply(instance, input[c % clen]);
            }
          }
          break;
        case 'shift_right':
          repeatCol = end ? end.col - start.col + 1 : 0;
          repeatRow = end ? end.row - start.row + 1 : 0;
          for (r = 0, rlen = input.length, rmax = Math.max(rlen, repeatRow); r < rmax; r++) {
            if (r < rlen) {
              for (c = 0, clen = input[r].length; c < repeatCol - clen; c++) {
                input[r].push(input[r][c % clen]);
              }
              input[r].unshift(start.row + r, start.col, 0);
              instance.spliceRow.apply(instance, input[r]);
            } else {
              input[r % rlen][0] = start.row + r;
              instance.spliceRow.apply(instance, input[r % rlen]);
            }
          }
          break;
        case 'overwrite':
        default:
          current.row = start.row;
          current.col = start.col;
          var iterators = {
            row: 0,
            col: 0
          },
              selected = {
                row: (end && start) ? (end.row - start.row + 1) : 1,
                col: (end && start) ? (end.col - start.col + 1) : 1
              },
              pushData = true;
          if (['up', 'left'].indexOf(direction) !== -1) {
            iterators = {
              row: Math.ceil(selected.row / rlen) || 1,
              col: Math.ceil(selected.col / input[0].length) || 1
            };
          } else if (['down', 'right'].indexOf(direction) !== -1) {
            iterators = {
              row: 1,
              col: 1
            };
          }
          for (r = 0; r < rlen; r++) {
            if ((end && current.row > end.row) || (!priv.settings.allowInsertRow && current.row > instance.countRows() - 1) || (current.row >= priv.settings.maxRows)) {
              break;
            }
            current.col = start.col;
            clen = input[r] ? input[r].length : 0;
            for (c = 0; c < clen; c++) {
              if ((end && current.col > end.col) || (!priv.settings.allowInsertColumn && current.col > instance.countCols() - 1) || (current.col >= priv.settings.maxCols)) {
                break;
              }
              if (!instance.getCellMeta(current.row, current.col).readOnly) {
                var result,
                    value = input[r][c],
                    orgValue = instance.getDataAtCell(current.row, current.col),
                    index = {
                      row: r,
                      col: c
                    },
                    valueSchema,
                    orgValueSchema;
                if (source === 'autofill') {
                  result = instance.runHooks('beforeAutofillInsidePopulate', index, direction, input, deltas, iterators, selected);
                  if (result) {
                    iterators = typeof(result.iterators) !== 'undefined' ? result.iterators : iterators;
                    value = typeof(result.value) !== 'undefined' ? result.value : value;
                  }
                }
                if (value !== null && typeof value === 'object') {
                  if (orgValue === null || typeof orgValue !== 'object') {
                    pushData = false;
                  } else {
                    orgValueSchema = Handsontable.helper.duckSchema(orgValue[0] || orgValue);
                    valueSchema = Handsontable.helper.duckSchema(value[0] || value);
                    if (Handsontable.helper.isObjectEquals(orgValueSchema, valueSchema)) {
                      value = Handsontable.helper.deepClone(value);
                    } else {
                      pushData = false;
                    }
                  }
                } else if (orgValue !== null && typeof orgValue === 'object') {
                  pushData = false;
                }
                if (pushData) {
                  setData.push([current.row, current.col, value]);
                }
                pushData = true;
              }
              current.col++;
              if (end && c === clen - 1) {
                c = -1;
                if (['down', 'right'].indexOf(direction) !== -1) {
                  iterators.col++;
                } else if (['up', 'left'].indexOf(direction) !== -1) {
                  if (iterators.col > 1) {
                    iterators.col--;
                  }
                }
              }
            }
            current.row++;
            iterators.col = 1;
            if (end && r === rlen - 1) {
              r = -1;
              if (['down', 'right'].indexOf(direction) !== -1) {
                iterators.row++;
              } else if (['up', 'left'].indexOf(direction) !== -1) {
                if (iterators.row > 1) {
                  iterators.row--;
                }
              }
            }
          }
          instance.setDataAtCell(setData, null, null, source || 'populateFromArray');
          break;
      }
    }
  };
  this.selection = selection = {
    inProgress: false,
    selectedHeader: {
      cols: false,
      rows: false
    },
    setSelectedHeaders: function(rows, cols) {
      instance.selection.selectedHeader.rows = rows;
      instance.selection.selectedHeader.cols = cols;
    },
    begin: function() {
      instance.selection.inProgress = true;
    },
    finish: function() {
      var sel = instance.getSelected();
      Handsontable.hooks.run(instance, "afterSelectionEnd", sel[0], sel[1], sel[2], sel[3]);
      Handsontable.hooks.run(instance, "afterSelectionEndByProp", sel[0], instance.colToProp(sel[1]), sel[2], instance.colToProp(sel[3]));
      instance.selection.inProgress = false;
    },
    isInProgress: function() {
      return instance.selection.inProgress;
    },
    setRangeStart: function(coords, keepEditorOpened) {
      Handsontable.hooks.run(instance, "beforeSetRangeStart", coords);
      priv.selRange = new WalkontableCellRange(coords, coords, coords);
      selection.setRangeEnd(coords, null, keepEditorOpened);
    },
    setRangeEnd: function(coords, scrollToCell, keepEditorOpened) {
      if (priv.selRange === null) {
        return;
      }
      var disableVisualSelection;
      Handsontable.hooks.run(instance, "beforeSetRangeEnd", coords);
      instance.selection.begin();
      priv.selRange.to = new WalkontableCellCoords(coords.row, coords.col);
      if (!priv.settings.multiSelect) {
        priv.selRange.from = coords;
      }
      instance.view.wt.selections.current.clear();
      disableVisualSelection = instance.getCellMeta(priv.selRange.highlight.row, priv.selRange.highlight.col).disableVisualSelection;
      if (typeof disableVisualSelection === 'string') {
        disableVisualSelection = [disableVisualSelection];
      }
      if (disableVisualSelection === false || Array.isArray(disableVisualSelection) && disableVisualSelection.indexOf('current') === -1) {
        instance.view.wt.selections.current.add(priv.selRange.highlight);
      }
      instance.view.wt.selections.area.clear();
      if ((disableVisualSelection === false || Array.isArray(disableVisualSelection) && disableVisualSelection.indexOf('area') === -1) && selection.isMultiple()) {
        instance.view.wt.selections.area.add(priv.selRange.from);
        instance.view.wt.selections.area.add(priv.selRange.to);
      }
      if (priv.settings.currentRowClassName || priv.settings.currentColClassName) {
        instance.view.wt.selections.highlight.clear();
        instance.view.wt.selections.highlight.add(priv.selRange.from);
        instance.view.wt.selections.highlight.add(priv.selRange.to);
      }
      Handsontable.hooks.run(instance, "afterSelection", priv.selRange.from.row, priv.selRange.from.col, priv.selRange.to.row, priv.selRange.to.col);
      Handsontable.hooks.run(instance, "afterSelectionByProp", priv.selRange.from.row, datamap.colToProp(priv.selRange.from.col), priv.selRange.to.row, datamap.colToProp(priv.selRange.to.col));
      if (scrollToCell !== false && instance.view.mainViewIsActive()) {
        if (priv.selRange.from && !selection.isMultiple()) {
          instance.view.scrollViewport(priv.selRange.from);
        } else {
          instance.view.scrollViewport(coords);
        }
      }
      selection.refreshBorders(null, keepEditorOpened);
    },
    refreshBorders: function(revertOriginal, keepEditor) {
      if (!keepEditor) {
        editorManager.destroyEditor(revertOriginal);
      }
      instance.view.render();
      if (selection.isSelected() && !keepEditor) {
        editorManager.prepareEditor();
      }
    },
    isMultiple: function() {
      var isMultiple = !(priv.selRange.to.col === priv.selRange.from.col && priv.selRange.to.row === priv.selRange.from.row),
          modifier = Handsontable.hooks.run(instance, 'afterIsMultipleSelection', isMultiple);
      if (isMultiple) {
        return modifier;
      }
    },
    transformStart: function(rowDelta, colDelta, force, keepEditorOpened) {
      var delta = new WalkontableCellCoords(rowDelta, colDelta),
          rowTransformDir = 0,
          colTransformDir = 0,
          totalRows,
          totalCols,
          coords;
      instance.runHooks('modifyTransformStart', delta);
      totalRows = instance.countRows();
      totalCols = instance.countCols();
      if (priv.selRange.highlight.row + rowDelta > totalRows - 1) {
        if (force && priv.settings.minSpareRows > 0) {
          instance.alter("insert_row", totalRows);
          totalRows = instance.countRows();
        } else if (priv.settings.autoWrapCol) {
          delta.row = 1 - totalRows;
          delta.col = priv.selRange.highlight.col + delta.col == totalCols - 1 ? 1 - totalCols : 1;
        }
      } else if (priv.settings.autoWrapCol && priv.selRange.highlight.row + delta.row < 0 && priv.selRange.highlight.col + delta.col >= 0) {
        delta.row = totalRows - 1;
        delta.col = priv.selRange.highlight.col + delta.col == 0 ? totalCols - 1 : -1;
      }
      if (priv.selRange.highlight.col + delta.col > totalCols - 1) {
        if (force && priv.settings.minSpareCols > 0) {
          instance.alter("insert_col", totalCols);
          totalCols = instance.countCols();
        } else if (priv.settings.autoWrapRow) {
          delta.row = priv.selRange.highlight.row + delta.row == totalRows - 1 ? 1 - totalRows : 1;
          delta.col = 1 - totalCols;
        }
      } else if (priv.settings.autoWrapRow && priv.selRange.highlight.col + delta.col < 0 && priv.selRange.highlight.row + delta.row >= 0) {
        delta.row = priv.selRange.highlight.row + delta.row == 0 ? totalRows - 1 : -1;
        delta.col = totalCols - 1;
      }
      coords = new WalkontableCellCoords(priv.selRange.highlight.row + delta.row, priv.selRange.highlight.col + delta.col);
      if (coords.row < 0) {
        rowTransformDir = -1;
        coords.row = 0;
      } else if (coords.row > 0 && coords.row >= totalRows) {
        rowTransformDir = 1;
        coords.row = totalRows - 1;
      }
      if (coords.col < 0) {
        colTransformDir = -1;
        coords.col = 0;
      } else if (coords.col > 0 && coords.col >= totalCols) {
        colTransformDir = 1;
        coords.col = totalCols - 1;
      }
      instance.runHooks('afterModifyTransformStart', coords, rowTransformDir, colTransformDir);
      selection.setRangeStart(coords, keepEditorOpened);
    },
    transformEnd: function(rowDelta, colDelta) {
      var delta = new WalkontableCellCoords(rowDelta, colDelta),
          rowTransformDir = 0,
          colTransformDir = 0,
          totalRows,
          totalCols,
          coords;
      instance.runHooks('modifyTransformEnd', delta);
      totalRows = instance.countRows();
      totalCols = instance.countCols();
      coords = new WalkontableCellCoords(priv.selRange.to.row + delta.row, priv.selRange.to.col + delta.col);
      if (coords.row < 0) {
        rowTransformDir = -1;
        coords.row = 0;
      } else if (coords.row > 0 && coords.row >= totalRows) {
        rowTransformDir = 1;
        coords.row = totalRows - 1;
      }
      if (coords.col < 0) {
        colTransformDir = -1;
        coords.col = 0;
      } else if (coords.col > 0 && coords.col >= totalCols) {
        colTransformDir = 1;
        coords.col = totalCols - 1;
      }
      instance.runHooks('afterModifyTransformEnd', coords, rowTransformDir, colTransformDir);
      selection.setRangeEnd(coords, true);
    },
    isSelected: function() {
      return (priv.selRange !== null);
    },
    inInSelection: function(coords) {
      if (!selection.isSelected()) {
        return false;
      }
      return priv.selRange.includes(coords);
    },
    deselect: function() {
      if (!selection.isSelected()) {
        return;
      }
      instance.selection.inProgress = false;
      priv.selRange = null;
      instance.view.wt.selections.current.clear();
      instance.view.wt.selections.area.clear();
      if (priv.settings.currentRowClassName || priv.settings.currentColClassName) {
        instance.view.wt.selections.highlight.clear();
      }
      editorManager.destroyEditor();
      selection.refreshBorders();
      Handsontable.hooks.run(instance, 'afterDeselect');
    },
    selectAll: function() {
      if (!priv.settings.multiSelect) {
        return;
      }
      selection.setRangeStart(new WalkontableCellCoords(0, 0));
      selection.setRangeEnd(new WalkontableCellCoords(instance.countRows() - 1, instance.countCols() - 1), false);
    },
    empty: function() {
      if (!selection.isSelected()) {
        return;
      }
      var topLeft = priv.selRange.getTopLeftCorner();
      var bottomRight = priv.selRange.getBottomRightCorner();
      var r,
          c,
          changes = [];
      for (r = topLeft.row; r <= bottomRight.row; r++) {
        for (c = topLeft.col; c <= bottomRight.col; c++) {
          if (!instance.getCellMeta(r, c).readOnly) {
            changes.push([r, c, '']);
          }
        }
      }
      instance.setDataAtCell(changes);
    }
  };
  this.init = function() {
    Handsontable.hooks.run(instance, 'beforeInit');
    if (Handsontable.mobileBrowser) {
      dom.addClass(instance.rootElement, 'mobile');
    }
    this.updateSettings(priv.settings, true);
    this.view = new TableView(this);
    editorManager = new EditorManager(instance, priv, selection, datamap);
    this.forceFullRender = true;
    this.view.render();
    if (typeof priv.firstRun === 'object') {
      Handsontable.hooks.run(instance, 'afterChange', priv.firstRun[0], priv.firstRun[1]);
      priv.firstRun = false;
    }
    Handsontable.hooks.run(instance, 'afterInit');
  };
  function ValidatorsQueue() {
    var resolved = false;
    return {
      validatorsInQueue: 0,
      addValidatorToQueue: function() {
        this.validatorsInQueue++;
        resolved = false;
      },
      removeValidatorFormQueue: function() {
        this.validatorsInQueue = this.validatorsInQueue - 1 < 0 ? 0 : this.validatorsInQueue - 1;
        this.checkIfQueueIsEmpty();
      },
      onQueueEmpty: function() {},
      checkIfQueueIsEmpty: function() {
        if (this.validatorsInQueue == 0 && resolved == false) {
          resolved = true;
          this.onQueueEmpty();
        }
      }
    };
  }
  function validateChanges(changes, source, callback) {
    var waitingForValidator = new ValidatorsQueue();
    waitingForValidator.onQueueEmpty = resolve;
    for (var i = changes.length - 1; i >= 0; i--) {
      if (changes[i] === null) {
        changes.splice(i, 1);
      } else {
        var row = changes[i][0];
        var col = datamap.propToCol(changes[i][1]);
        var logicalCol = instance.runHooks('modifyCol', col);
        var cellProperties = instance.getCellMeta(row, logicalCol);
        if (cellProperties.type === 'numeric' && typeof changes[i][3] === 'string') {
          if (changes[i][3].length > 0 && (/^-?[\d\s]*(\.|\,)?\d*$/.test(changes[i][3]) || cellProperties.format)) {
            var len = changes[i][3].length;
            if (typeof cellProperties.language == 'undefined') {
              numeral.language('en');
            } else if (changes[i][3].indexOf(".") === len - 3 && changes[i][3].indexOf(",") === -1) {
              numeral.language('en');
            } else {
              numeral.language(cellProperties.language);
            }
            if (numeral.validate(changes[i][3])) {
              changes[i][3] = numeral().unformat(changes[i][3]);
            }
          }
        }
        if (instance.getCellValidator(cellProperties)) {
          waitingForValidator.addValidatorToQueue();
          instance.validateCell(changes[i][3], cellProperties, (function(i, cellProperties) {
            return function(result) {
              if (typeof result !== 'boolean') {
                throw new Error("Validation error: result is not boolean");
              }
              if (result === false && cellProperties.allowInvalid === false) {
                changes.splice(i, 1);
                cellProperties.valid = true;
                --i;
              }
              waitingForValidator.removeValidatorFormQueue();
            };
          })(i, cellProperties), source);
        }
      }
    }
    waitingForValidator.checkIfQueueIsEmpty();
    function resolve() {
      var beforeChangeResult;
      if (changes.length) {
        beforeChangeResult = Handsontable.hooks.run(instance, "beforeChange", changes, source);
        if (typeof beforeChangeResult === 'function') {
          console.warn("Your beforeChange callback returns a function. It's not supported since Handsontable 0.12.1 (and the returned function will not be executed).");
        } else if (beforeChangeResult === false) {
          changes.splice(0, changes.length);
        }
      }
      callback();
    }
  }
  function applyChanges(changes, source) {
    var i = changes.length - 1;
    if (i < 0) {
      return;
    }
    for (; 0 <= i; i--) {
      if (changes[i] === null) {
        changes.splice(i, 1);
        continue;
      }
      if (changes[i][2] == null && changes[i][3] == null) {
        continue;
      }
      if (priv.settings.allowInsertRow) {
        while (changes[i][0] > instance.countRows() - 1) {
          datamap.createRow();
        }
      }
      if (instance.dataType === 'array' && priv.settings.allowInsertColumn) {
        while (datamap.propToCol(changes[i][1]) > instance.countCols() - 1) {
          datamap.createCol();
        }
      }
      datamap.set(changes[i][0], changes[i][1], changes[i][3]);
    }
    instance.forceFullRender = true;
    grid.adjustRowsAndCols();
    Handsontable.hooks.run(instance, 'beforeChangeRender', changes, source);
    selection.refreshBorders(null, true);
    Handsontable.hooks.run(instance, 'afterChange', changes, source || 'edit');
  }
  this.validateCell = function(value, cellProperties, callback, source) {
    var validator = instance.getCellValidator(cellProperties);
    function done(valid) {
      var col = cellProperties.col,
          row = cellProperties.row,
          td = instance.getCell(row, col, true);
      if (td) {
        instance.view.wt.wtSettings.settings.cellRenderer(row, col, td);
      }
      callback(valid);
    }
    if (Object.prototype.toString.call(validator) === '[object RegExp]') {
      validator = (function(validator) {
        return function(value, callback) {
          callback(validator.test(value));
        };
      })(validator);
    }
    if (typeof validator == 'function') {
      value = Handsontable.hooks.run(instance, "beforeValidate", value, cellProperties.row, cellProperties.prop, source);
      instance._registerTimeout(setTimeout(function() {
        validator.call(cellProperties, value, function(valid) {
          valid = Handsontable.hooks.run(instance, "afterValidate", valid, value, cellProperties.row, cellProperties.prop, source);
          cellProperties.valid = valid;
          done(valid);
          Handsontable.hooks.run(instance, "postAfterValidate", valid, value, cellProperties.row, cellProperties.prop, source);
        });
      }, 0));
    } else {
      cellProperties.valid = true;
      done(cellProperties.valid);
    }
  };
  function setDataInputToArray(row, propOrCol, value) {
    if (typeof row === "object") {
      return row;
    } else {
      return [[row, propOrCol, value]];
    }
  }
  this.setDataAtCell = function(row, col, value, source) {
    var input = setDataInputToArray(row, col, value),
        i,
        ilen,
        changes = [],
        prop;
    for (i = 0, ilen = input.length; i < ilen; i++) {
      if (typeof input[i] !== 'object') {
        throw new Error('Method `setDataAtCell` accepts row number or changes array of arrays as its first parameter');
      }
      if (typeof input[i][1] !== 'number') {
        throw new Error('Method `setDataAtCell` accepts row and column number as its parameters. If you want to use object property name, use method `setDataAtRowProp`');
      }
      prop = datamap.colToProp(input[i][1]);
      changes.push([input[i][0], prop, datamap.get(input[i][0], prop), input[i][2]]);
    }
    if (!source && typeof row === "object") {
      source = col;
    }
    validateChanges(changes, source, function() {
      applyChanges(changes, source);
    });
  };
  this.setDataAtRowProp = function(row, prop, value, source) {
    var input = setDataInputToArray(row, prop, value),
        i,
        ilen,
        changes = [];
    for (i = 0, ilen = input.length; i < ilen; i++) {
      changes.push([input[i][0], input[i][1], datamap.get(input[i][0], input[i][1]), input[i][2]]);
    }
    if (!source && typeof row === "object") {
      source = prop;
    }
    validateChanges(changes, source, function() {
      applyChanges(changes, source);
    });
  };
  this.listen = function() {
    Handsontable.activeGuid = instance.guid;
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    } else if (!document.activeElement) {
      document.body.focus();
    }
  };
  this.unlisten = function() {
    Handsontable.activeGuid = null;
  };
  this.isListening = function() {
    return Handsontable.activeGuid === instance.guid;
  };
  this.destroyEditor = function(revertOriginal) {
    selection.refreshBorders(revertOriginal);
  };
  this.populateFromArray = function(row, col, input, endRow, endCol, source, method, direction, deltas) {
    var c;
    if (!(typeof input === 'object' && typeof input[0] === 'object')) {
      throw new Error("populateFromArray parameter `input` must be an array of arrays");
    }
    c = typeof endRow === 'number' ? new WalkontableCellCoords(endRow, endCol) : null;
    return grid.populateFromArray(new WalkontableCellCoords(row, col), input, c, source, method, direction, deltas);
  };
  this.spliceCol = function(col, index, amount) {
    return datamap.spliceCol.apply(datamap, arguments);
  };
  this.spliceRow = function(row, index, amount) {
    return datamap.spliceRow.apply(datamap, arguments);
  };
  this.getSelected = function() {
    if (selection.isSelected()) {
      return [priv.selRange.from.row, priv.selRange.from.col, priv.selRange.to.row, priv.selRange.to.col];
    }
  };
  this.getSelectedRange = function() {
    if (selection.isSelected()) {
      return priv.selRange;
    }
  };
  this.render = function() {
    if (instance.view) {
      instance.forceFullRender = true;
      selection.refreshBorders(null, true);
    }
  };
  this.loadData = function(data) {
    if (typeof data === 'object' && data !== null) {
      if (!(data.push && data.splice)) {
        data = [data];
      }
    } else if (data === null) {
      data = [];
      var row;
      for (var r = 0,
          rlen = priv.settings.startRows; r < rlen; r++) {
        row = [];
        for (var c = 0,
            clen = priv.settings.startCols; c < clen; c++) {
          row.push(null);
        }
        data.push(row);
      }
    } else {
      throw new Error("loadData only accepts array of objects or array of arrays (" + typeof data + " given)");
    }
    priv.isPopulated = false;
    GridSettings.prototype.data = data;
    if (Array.isArray(priv.settings.dataSchema) || Array.isArray(data[0])) {
      instance.dataType = 'array';
    } else if (typeof priv.settings.dataSchema === 'function') {
      instance.dataType = 'function';
    } else {
      instance.dataType = 'object';
    }
    datamap = new DataMap(instance, priv, GridSettings);
    clearCellSettingCache();
    grid.adjustRowsAndCols();
    Handsontable.hooks.run(instance, 'afterLoadData');
    if (priv.firstRun) {
      priv.firstRun = [null, 'loadData'];
    } else {
      Handsontable.hooks.run(instance, 'afterChange', null, 'loadData');
      instance.render();
    }
    priv.isPopulated = true;
    function clearCellSettingCache() {
      priv.cellSettings.length = 0;
    }
  };
  this.getData = function(r, c, r2, c2) {
    if (typeof r === 'undefined') {
      return datamap.getAll();
    } else {
      return datamap.getRange(new WalkontableCellCoords(r, c), new WalkontableCellCoords(r2, c2), datamap.DESTINATION_RENDERER);
    }
  };
  this.getCopyableData = function(startRow, startCol, endRow, endCol) {
    return datamap.getCopyableText(new WalkontableCellCoords(startRow, startCol), new WalkontableCellCoords(endRow, endCol));
  };
  this.getSchema = function() {
    return datamap.getSchema();
  };
  this.updateSettings = function(settings, init) {
    var i,
        clen;
    if (typeof settings.rows !== "undefined") {
      throw new Error("'rows' setting is no longer supported. do you mean startRows, minRows or maxRows?");
    }
    if (typeof settings.cols !== "undefined") {
      throw new Error("'cols' setting is no longer supported. do you mean startCols, minCols or maxCols?");
    }
    for (i in settings) {
      if (i === 'data') {
        continue;
      } else {
        if (Handsontable.hooks.hooks[i] !== void 0 || Handsontable.hooks.legacy[i] !== void 0) {
          if (typeof settings[i] === 'function' || Array.isArray(settings[i])) {
            instance.addHook(i, settings[i]);
          }
        } else {
          if (!init && settings.hasOwnProperty(i)) {
            GridSettings.prototype[i] = settings[i];
          }
        }
      }
    }
    if (settings.data === void 0 && priv.settings.data === void 0) {
      instance.loadData(null);
    } else if (settings.data !== void 0) {
      instance.loadData(settings.data);
    } else if (settings.columns !== void 0) {
      datamap.createMap();
    }
    clen = instance.countCols();
    priv.cellSettings.length = 0;
    if (clen > 0) {
      var proto,
          column;
      for (i = 0; i < clen; i++) {
        priv.columnSettings[i] = helper.columnFactory(GridSettings, priv.columnsSettingConflicts);
        proto = priv.columnSettings[i].prototype;
        if (GridSettings.prototype.columns) {
          column = GridSettings.prototype.columns[i];
          helper.extend(proto, column);
          helper.extend(proto, expandType(column));
        }
      }
    }
    if (typeof settings.cell !== 'undefined') {
      for (i in settings.cell) {
        if (settings.cell.hasOwnProperty(i)) {
          var cell = settings.cell[i];
          instance.setCellMetaObject(cell.row, cell.col, cell);
        }
      }
    }
    Handsontable.hooks.run(instance, 'afterCellMetaReset');
    if (typeof settings.className !== "undefined") {
      if (GridSettings.prototype.className) {
        dom.removeClass(instance.rootElement, GridSettings.prototype.className);
      }
      if (settings.className) {
        dom.addClass(instance.rootElement, settings.className);
      }
    }
    if (typeof settings.height != 'undefined') {
      var height = settings.height;
      if (typeof height == 'function') {
        height = height();
      }
      instance.rootElement.style.height = height + 'px';
    }
    if (typeof settings.width != 'undefined') {
      var width = settings.width;
      if (typeof width == 'function') {
        width = width();
      }
      instance.rootElement.style.width = width + 'px';
    }
    if (height) {
      instance.rootElement.style.overflow = 'hidden';
    }
    if (!init) {
      Handsontable.hooks.run(instance, 'afterUpdateSettings');
    }
    grid.adjustRowsAndCols();
    if (instance.view && !priv.firstRun) {
      instance.forceFullRender = true;
      selection.refreshBorders(null, true);
    }
  };
  this.getValue = function() {
    var sel = instance.getSelected();
    if (GridSettings.prototype.getValue) {
      if (typeof GridSettings.prototype.getValue === 'function') {
        return GridSettings.prototype.getValue.call(instance);
      } else if (sel) {
        return instance.getData()[sel[0]][GridSettings.prototype.getValue];
      }
    } else if (sel) {
      return instance.getDataAtCell(sel[0], sel[1]);
    }
  };
  function expandType(obj) {
    if (!obj.hasOwnProperty('type')) {
      return;
    }
    var type,
        expandedType = {};
    if (typeof obj.type === 'object') {
      type = obj.type;
    } else if (typeof obj.type === 'string') {
      type = Handsontable.cellTypes[obj.type];
      if (type === void 0) {
        throw new Error('You declared cell type "' + obj.type + '" as a string that is not mapped to a known object. Cell type must be an object or a string mapped to an object in Handsontable.cellTypes');
      }
    }
    for (var i in type) {
      if (type.hasOwnProperty(i) && !obj.hasOwnProperty(i)) {
        expandedType[i] = type[i];
      }
    }
    return expandedType;
  }
  this.getSettings = function() {
    return priv.settings;
  };
  this.clear = function() {
    selection.selectAll();
    selection.empty();
  };
  this.alter = function(action, index, amount, source, keepEmptyRows) {
    grid.alter(action, index, amount, source, keepEmptyRows);
  };
  this.getCell = function(row, col, topmost) {
    return instance.view.getCellAtCoords(new WalkontableCellCoords(row, col), topmost);
  };
  this.getCoords = function(elem) {
    return this.view.wt.wtTable.getCoords.call(this.view.wt.wtTable, elem);
  };
  this.colToProp = function(col) {
    return datamap.colToProp(col);
  };
  this.propToCol = function(prop) {
    return datamap.propToCol(prop);
  };
  this.getDataAtCell = function(row, col) {
    return datamap.get(row, datamap.colToProp(col));
  };
  this.getDataAtRowProp = function(row, prop) {
    return datamap.get(row, prop);
  };
  this.getDataAtCol = function(col) {
    var out = [];
    return out.concat.apply(out, datamap.getRange(new WalkontableCellCoords(0, col), new WalkontableCellCoords(priv.settings.data.length - 1, col), datamap.DESTINATION_RENDERER));
  };
  this.getDataAtProp = function(prop) {
    var out = [],
        range;
    range = datamap.getRange(new WalkontableCellCoords(0, datamap.propToCol(prop)), new WalkontableCellCoords(priv.settings.data.length - 1, datamap.propToCol(prop)), datamap.DESTINATION_RENDERER);
    return out.concat.apply(out, range);
  };
  this.getSourceDataAtCol = function(col) {
    var out = [],
        data = priv.settings.data;
    for (var i = 0; i < data.length; i++) {
      out.push(data[i][col]);
    }
    return out;
  };
  this.getSourceDataAtRow = function(row) {
    return priv.settings.data[row];
  };
  this.getDataAtRow = function(row) {
    var data = datamap.getRange(new WalkontableCellCoords(row, 0), new WalkontableCellCoords(row, this.countCols() - 1), datamap.DESTINATION_RENDERER);
    return data[0];
  };
  this.removeCellMeta = function(row, col, key) {
    var cellMeta = instance.getCellMeta(row, col);
    if (cellMeta[key] != undefined) {
      delete priv.cellSettings[row][col][key];
    }
  };
  this.setCellMetaObject = function(row, col, prop) {
    if (typeof prop === 'object') {
      for (var key in prop) {
        if (prop.hasOwnProperty(key)) {
          var value = prop[key];
          this.setCellMeta(row, col, key, value);
        }
      }
    }
  };
  this.setCellMeta = function(row, col, key, val) {
    if (!priv.cellSettings[row]) {
      priv.cellSettings[row] = [];
    }
    if (!priv.cellSettings[row][col]) {
      priv.cellSettings[row][col] = new priv.columnSettings[col]();
    }
    priv.cellSettings[row][col][key] = val;
    Handsontable.hooks.run(instance, 'afterSetCellMeta', row, col, key, val);
  };
  this.getCellMeta = function(row, col) {
    var prop = datamap.colToProp(col),
        cellProperties;
    row = translateRowIndex(row);
    col = translateColIndex(col);
    if (!priv.columnSettings[col]) {
      priv.columnSettings[col] = helper.columnFactory(GridSettings, priv.columnsSettingConflicts);
    }
    if (!priv.cellSettings[row]) {
      priv.cellSettings[row] = [];
    }
    if (!priv.cellSettings[row][col]) {
      priv.cellSettings[row][col] = new priv.columnSettings[col]();
    }
    cellProperties = priv.cellSettings[row][col];
    cellProperties.row = row;
    cellProperties.col = col;
    cellProperties.prop = prop;
    cellProperties.instance = instance;
    Handsontable.hooks.run(instance, 'beforeGetCellMeta', row, col, cellProperties);
    helper.extend(cellProperties, expandType(cellProperties));
    if (cellProperties.cells) {
      var settings = cellProperties.cells.call(cellProperties, row, col, prop);
      if (settings) {
        helper.extend(cellProperties, settings);
        helper.extend(cellProperties, expandType(settings));
      }
    }
    Handsontable.hooks.run(instance, 'afterGetCellMeta', row, col, cellProperties);
    return cellProperties;
  };
  function translateRowIndex(row) {
    return Handsontable.hooks.run(instance, 'modifyRow', row);
  }
  function translateColIndex(col) {
    return Handsontable.hooks.run(instance, 'modifyCol', col);
  }
  var rendererLookup = helper.cellMethodLookupFactory('renderer');
  this.getCellRenderer = function(row, col) {
    var renderer = rendererLookup.call(this, row, col);
    return getRenderer(renderer);
  };
  this.getCellEditor = helper.cellMethodLookupFactory('editor');
  this.getCellValidator = helper.cellMethodLookupFactory('validator');
  this.validateCells = function(callback) {
    var waitingForValidator = new ValidatorsQueue();
    waitingForValidator.onQueueEmpty = callback;
    var i = instance.countRows() - 1;
    while (i >= 0) {
      var j = instance.countCols() - 1;
      while (j >= 0) {
        waitingForValidator.addValidatorToQueue();
        instance.validateCell(instance.getDataAtCell(i, j), instance.getCellMeta(i, j), function() {
          waitingForValidator.removeValidatorFormQueue();
        }, 'validateCells');
        j--;
      }
      i--;
    }
    waitingForValidator.checkIfQueueIsEmpty();
  };
  this.getRowHeader = function(row) {
    if (row === void 0) {
      var out = [];
      for (var i = 0,
          ilen = instance.countRows(); i < ilen; i++) {
        out.push(instance.getRowHeader(i));
      }
      return out;
    } else if (Array.isArray(priv.settings.rowHeaders) && priv.settings.rowHeaders[row] !== void 0) {
      return priv.settings.rowHeaders[row];
    } else if (typeof priv.settings.rowHeaders === 'function') {
      return priv.settings.rowHeaders(row);
    } else if (priv.settings.rowHeaders && typeof priv.settings.rowHeaders !== 'string' && typeof priv.settings.rowHeaders !== 'number') {
      return row + 1;
    } else {
      return priv.settings.rowHeaders;
    }
  };
  this.hasRowHeaders = function() {
    return !!priv.settings.rowHeaders;
  };
  this.hasColHeaders = function() {
    if (priv.settings.colHeaders !== void 0 && priv.settings.colHeaders !== null) {
      return !!priv.settings.colHeaders;
    }
    for (var i = 0,
        ilen = instance.countCols(); i < ilen; i++) {
      if (instance.getColHeader(i)) {
        return true;
      }
    }
    return false;
  };
  this.getColHeader = function(col) {
    if (col === void 0) {
      var out = [];
      for (var i = 0,
          ilen = instance.countCols(); i < ilen; i++) {
        out.push(instance.getColHeader(i));
      }
      return out;
    } else {
      var baseCol = col;
      col = Handsontable.hooks.run(instance, 'modifyCol', col);
      if (priv.settings.columns && priv.settings.columns[col] && priv.settings.columns[col].title) {
        return priv.settings.columns[col].title;
      } else if (Array.isArray(priv.settings.colHeaders) && priv.settings.colHeaders[col] !== void 0) {
        return priv.settings.colHeaders[col];
      } else if (typeof priv.settings.colHeaders === 'function') {
        return priv.settings.colHeaders(col);
      } else if (priv.settings.colHeaders && typeof priv.settings.colHeaders !== 'string' && typeof priv.settings.colHeaders !== 'number') {
        return helper.spreadsheetColumnLabel(baseCol);
      } else {
        return priv.settings.colHeaders;
      }
    }
  };
  this._getColWidthFromSettings = function(col) {
    var cellProperties = instance.getCellMeta(0, col);
    var width = cellProperties.width;
    if (width === void 0 || width === priv.settings.width) {
      width = cellProperties.colWidths;
    }
    if (width !== void 0 && width !== null) {
      switch (typeof width) {
        case 'object':
          width = width[col];
          break;
        case 'function':
          width = width(col);
          break;
      }
      if (typeof width === 'string') {
        width = parseInt(width, 10);
      }
    }
    return width;
  };
  this.getColWidth = function(col) {
    var width = instance._getColWidthFromSettings(col);
    if (!width) {
      width = 50;
    }
    width = Handsontable.hooks.run(instance, 'modifyColWidth', width, col);
    return width;
  };
  this._getRowHeightFromSettings = function(row) {
    var height = priv.settings.rowHeights;
    if (height !== void 0 && height !== null) {
      switch (typeof height) {
        case 'object':
          height = height[row];
          break;
        case 'function':
          height = height(row);
          break;
      }
      if (typeof height === 'string') {
        height = parseInt(height, 10);
      }
    }
    return height;
  };
  this.getRowHeight = function(row) {
    var height = instance._getRowHeightFromSettings(row);
    height = Handsontable.hooks.run(instance, 'modifyRowHeight', height, row);
    return height;
  };
  this.countRows = function() {
    return priv.settings.data.length;
  };
  this.countCols = function() {
    if (instance.dataType === 'object' || instance.dataType === 'function') {
      if (priv.settings.columns && priv.settings.columns.length) {
        return priv.settings.columns.length;
      } else {
        return datamap.colToPropCache.length;
      }
    } else if (instance.dataType === 'array') {
      if (priv.settings.columns && priv.settings.columns.length) {
        return priv.settings.columns.length;
      } else if (priv.settings.data && priv.settings.data[0] && priv.settings.data[0].length) {
        return priv.settings.data[0].length;
      } else {
        return 0;
      }
    }
  };
  this.rowOffset = function() {
    return instance.view.wt.wtTable.getFirstRenderedRow();
  };
  this.colOffset = function() {
    return instance.view.wt.wtTable.getFirstRenderedColumn();
  };
  this.countRenderedRows = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getRenderedRowsCount() : -1;
  };
  this.countVisibleRows = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getVisibleRowsCount() : -1;
  };
  this.countRenderedCols = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getRenderedColumnsCount() : -1;
  };
  this.countVisibleCols = function() {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.getVisibleColumnsCount() : -1;
  };
  this.countEmptyRows = function(ending) {
    var i = instance.countRows() - 1,
        empty = 0,
        row;
    while (i >= 0) {
      row = Handsontable.hooks.run(this, 'modifyRow', i);
      if (instance.isEmptyRow(row)) {
        empty++;
      } else if (ending) {
        break;
      }
      i--;
    }
    return empty;
  };
  this.countEmptyCols = function(ending) {
    if (instance.countRows() < 1) {
      return 0;
    }
    var i = instance.countCols() - 1,
        empty = 0;
    while (i >= 0) {
      if (instance.isEmptyCol(i)) {
        empty++;
      } else if (ending) {
        break;
      }
      i--;
    }
    return empty;
  };
  this.isEmptyRow = function(row) {
    return priv.settings.isEmptyRow.call(instance, row);
  };
  this.isEmptyCol = function(col) {
    return priv.settings.isEmptyCol.call(instance, col);
  };
  this.selectCell = function(row, col, endRow, endCol, scrollToCell, changeListener) {
    var coords;
    changeListener = typeof changeListener === 'undefined' || changeListener === true;
    if (typeof row !== 'number' || row < 0 || row >= instance.countRows()) {
      return false;
    }
    if (typeof col !== 'number' || col < 0 || col >= instance.countCols()) {
      return false;
    }
    if (typeof endRow !== 'undefined') {
      if (typeof endRow !== 'number' || endRow < 0 || endRow >= instance.countRows()) {
        return false;
      }
      if (typeof endCol !== 'number' || endCol < 0 || endCol >= instance.countCols()) {
        return false;
      }
    }
    coords = new WalkontableCellCoords(row, col);
    priv.selRange = new WalkontableCellRange(coords, coords, coords);
    if (document.activeElement && document.activeElement !== document.documentElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    if (changeListener) {
      instance.listen();
    }
    if (typeof endRow === 'undefined') {
      selection.setRangeEnd(priv.selRange.from, scrollToCell);
    } else {
      selection.setRangeEnd(new WalkontableCellCoords(endRow, endCol), scrollToCell);
    }
    instance.selection.finish();
    return true;
  };
  this.selectCellByProp = function(row, prop, endRow, endProp, scrollToCell) {
    arguments[1] = datamap.propToCol(arguments[1]);
    if (typeof arguments[3] !== "undefined") {
      arguments[3] = datamap.propToCol(arguments[3]);
    }
    return instance.selectCell.apply(instance, arguments);
  };
  this.deselectCell = function() {
    selection.deselect();
  };
  this.destroy = function() {
    instance._clearTimeouts();
    if (instance.view) {
      instance.view.destroy();
    }
    dom.empty(instance.rootElement);
    eventManager.clear();
    Handsontable.hooks.run(instance, 'afterDestroy');
    Handsontable.hooks.destroy(instance);
    for (var i in instance) {
      if (instance.hasOwnProperty(i)) {
        if (typeof instance[i] === "function") {
          if (i !== "runHooks") {
            instance[i] = postMortem;
          }
        } else if (i !== "guid") {
          instance[i] = null;
        }
      }
    }
    priv = null;
    datamap = null;
    grid = null;
    selection = null;
    editorManager = null;
    instance = null;
    GridSettings = null;
  };
  function postMortem() {
    throw new Error("This method cannot be called because this Handsontable instance has been destroyed");
  }
  this.getActiveEditor = function() {
    return editorManager.getActiveEditor();
  };
  this.getPlugin = function(pluginName) {
    return getPlugin(this, pluginName);
  };
  this.getInstance = function() {
    return instance;
  };
  this.addHook = function(key, fn) {
    Handsontable.hooks.add(key, fn, instance);
  };
  this.addHookOnce = function(key, fn) {
    Handsontable.hooks.once(key, fn, instance);
  };
  this.removeHook = function(key, fn) {
    Handsontable.hooks.remove(key, fn, instance);
  };
  this.runHooks = function(key, p1, p2, p3, p4, p5, p6) {
    return Handsontable.hooks.run(instance, key, p1, p2, p3, p4, p5, p6);
  };
  this.timeouts = [];
  this._registerTimeout = function(handle) {
    this.timeouts.push(handle);
  };
  this._clearTimeouts = function() {
    for (var i = 0,
        ilen = this.timeouts.length; i < ilen; i++) {
      clearTimeout(this.timeouts[i]);
    }
  };
  this.version = Handsontable.version;
};
var DefaultSettings = function() {};
DefaultSettings.prototype = {
  data: void 0,
  dataSchema: void 0,
  width: void 0,
  height: void 0,
  startRows: 5,
  startCols: 5,
  rowHeaders: null,
  colHeaders: null,
  colWidths: void 0,
  columns: void 0,
  cells: void 0,
  cell: [],
  comments: false,
  customBorders: false,
  minRows: 0,
  minCols: 0,
  maxRows: Infinity,
  maxCols: Infinity,
  minSpareRows: 0,
  minSpareCols: 0,
  allowInsertRow: true,
  allowInsertColumn: true,
  allowRemoveRow: true,
  allowRemoveColumn: true,
  multiSelect: true,
  fillHandle: true,
  fixedRowsTop: 0,
  fixedColumnsLeft: 0,
  outsideClickDeselects: true,
  enterBeginsEditing: true,
  enterMoves: {
    row: 1,
    col: 0
  },
  tabMoves: {
    row: 0,
    col: 1
  },
  autoWrapRow: false,
  autoWrapCol: false,
  copyRowsLimit: 1000,
  copyColsLimit: 1000,
  pasteMode: 'overwrite',
  persistentState: false,
  currentRowClassName: void 0,
  currentColClassName: void 0,
  stretchH: 'none',
  isEmptyRow: function(row) {
    var col,
        colLen,
        value,
        meta;
    for (col = 0, colLen = this.countCols(); col < colLen; col++) {
      value = this.getDataAtCell(row, col);
      if (value !== '' && value !== null && typeof value !== 'undefined') {
        if (typeof value === 'object') {
          meta = this.getCellMeta(row, col);
          return helper.isObjectEquals(this.getSchema()[meta.prop], value);
        }
        return false;
      }
    }
    return true;
  },
  isEmptyCol: function(col) {
    var row,
        rowLen,
        value;
    for (row = 0, rowLen = this.countRows(); row < rowLen; row++) {
      value = this.getDataAtCell(row, col);
      if (value !== '' && value !== null && typeof value !== 'undefined') {
        return false;
      }
    }
    return true;
  },
  observeDOMVisibility: true,
  allowInvalid: true,
  invalidCellClassName: 'htInvalid',
  placeholder: false,
  placeholderCellClassName: 'htPlaceholder',
  readOnlyCellClassName: 'htDimmed',
  renderer: void 0,
  commentedCellClassName: 'htCommentCell',
  fragmentSelection: false,
  readOnly: false,
  search: false,
  type: 'text',
  copyable: true,
  editor: void 0,
  autoComplete: void 0,
  debug: false,
  wordWrap: true,
  noWordWrapClassName: 'htNoWrap',
  contextMenu: void 0,
  undo: void 0,
  columnSorting: void 0,
  manualColumnMove: void 0,
  manualColumnResize: void 0,
  manualRowMove: void 0,
  manualRowResize: void 0,
  mergeCells: false,
  viewportRowRenderingOffset: 10,
  viewportColumnRenderingOffset: 10,
  groups: void 0,
  validator: void 0,
  disableVisualSelection: false,
  manualColumnFreeze: void 0,
  trimWhitespace: true,
  settings: void 0,
  source: void 0,
  title: void 0,
  checkedTemplate: void 0,
  uncheckedTemplate: void 0,
  format: void 0,
  className: void 0
};
Handsontable.DefaultSettings = DefaultSettings;


//# 
},{"./3rdparty/walkontable/src/cellCoords.js":8,"./3rdparty/walkontable/src/cellRange.js":9,"./3rdparty/walkontable/src/selection.js":20,"./dataMap.js":33,"./dom.js":34,"./editorManager.js":35,"./eventManager.js":48,"./helpers.js":49,"./pluginHooks.js":51,"./plugins.js":52,"./renderers.js":76,"./tableView.js":90,"numeral":"numeral"}],33:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  DataMap: {get: function() {
      return DataMap;
    }},
  __esModule: {value: true}
});
var $__helpers_46_js__,
    $__multiMap_46_js__,
    $__3rdparty_47_sheetclip_46_js__;
var helper = ($__helpers_46_js__ = require("./helpers.js"), $__helpers_46_js__ && $__helpers_46_js__.__esModule && $__helpers_46_js__ || {default: $__helpers_46_js__});
var MultiMap = ($__multiMap_46_js__ = require("./multiMap.js"), $__multiMap_46_js__ && $__multiMap_46_js__.__esModule && $__multiMap_46_js__ || {default: $__multiMap_46_js__}).MultiMap;
var SheetClip = ($__3rdparty_47_sheetclip_46_js__ = require("./3rdparty/sheetclip.js"), $__3rdparty_47_sheetclip_46_js__ && $__3rdparty_47_sheetclip_46_js__.__esModule && $__3rdparty_47_sheetclip_46_js__ || {default: $__3rdparty_47_sheetclip_46_js__}).default;
;
Handsontable.DataMap = DataMap;
function DataMap(instance, priv, GridSettings) {
  this.instance = instance;
  this.priv = priv;
  this.GridSettings = GridSettings;
  this.dataSource = this.instance.getSettings().data;
  if (this.dataSource[0]) {
    this.duckSchema = this.recursiveDuckSchema(this.dataSource[0]);
  } else {
    this.duckSchema = {};
  }
  this.createMap();
}
DataMap.prototype.DESTINATION_RENDERER = 1;
DataMap.prototype.DESTINATION_CLIPBOARD_GENERATOR = 2;
DataMap.prototype.recursiveDuckSchema = function(object) {
  return Handsontable.helper.duckSchema(object);
};
DataMap.prototype.recursiveDuckColumns = function(schema, lastCol, parent) {
  var prop,
      i;
  if (typeof lastCol === 'undefined') {
    lastCol = 0;
    parent = '';
  }
  if (typeof schema === "object" && !Array.isArray(schema)) {
    for (i in schema) {
      if (schema.hasOwnProperty(i)) {
        if (schema[i] === null) {
          prop = parent + i;
          this.colToPropCache.push(prop);
          this.propToColCache.set(prop, lastCol);
          lastCol++;
        } else {
          lastCol = this.recursiveDuckColumns(schema[i], lastCol, i + '.');
        }
      }
    }
  }
  return lastCol;
};
DataMap.prototype.createMap = function() {
  var i,
      ilen,
      schema = this.getSchema();
  if (typeof schema === "undefined") {
    throw new Error("trying to create `columns` definition but you didnt' provide `schema` nor `data`");
  }
  this.colToPropCache = [];
  this.propToColCache = new MultiMap();
  var columns = this.instance.getSettings().columns;
  if (columns) {
    for (i = 0, ilen = columns.length; i < ilen; i++) {
      if (typeof columns[i].data != 'undefined') {
        this.colToPropCache[i] = columns[i].data;
        this.propToColCache.set(columns[i].data, i);
      }
    }
  } else {
    this.recursiveDuckColumns(schema);
  }
};
DataMap.prototype.colToProp = function(col) {
  col = Handsontable.hooks.run(this.instance, 'modifyCol', col);
  if (this.colToPropCache && typeof this.colToPropCache[col] !== 'undefined') {
    return this.colToPropCache[col];
  }
  return col;
};
DataMap.prototype.propToCol = function(prop) {
  var col;
  if (typeof this.propToColCache.get(prop) !== 'undefined') {
    col = this.propToColCache.get(prop);
  } else {
    col = prop;
  }
  col = Handsontable.hooks.run(this.instance, 'modifyCol', col);
  return col;
};
DataMap.prototype.getSchema = function() {
  var schema = this.instance.getSettings().dataSchema;
  if (schema) {
    if (typeof schema === 'function') {
      return schema();
    }
    return schema;
  }
  return this.duckSchema;
};
DataMap.prototype.createRow = function(index, amount, createdAutomatically) {
  var row,
      colCount = this.instance.countCols(),
      numberOfCreatedRows = 0,
      currentIndex;
  if (!amount) {
    amount = 1;
  }
  if (typeof index !== 'number' || index >= this.instance.countRows()) {
    index = this.instance.countRows();
  }
  currentIndex = index;
  var maxRows = this.instance.getSettings().maxRows;
  while (numberOfCreatedRows < amount && this.instance.countRows() < maxRows) {
    if (this.instance.dataType === 'array') {
      row = [];
      for (var c = 0; c < colCount; c++) {
        row.push(null);
      }
    } else if (this.instance.dataType === 'function') {
      row = this.instance.getSettings().dataSchema(index);
    } else {
      row = {};
      helper.deepExtend(row, this.getSchema());
    }
    if (index === this.instance.countRows()) {
      this.dataSource.push(row);
    } else {
      this.dataSource.splice(index, 0, row);
    }
    numberOfCreatedRows++;
    currentIndex++;
  }
  Handsontable.hooks.run(this.instance, 'afterCreateRow', index, numberOfCreatedRows, createdAutomatically);
  this.instance.forceFullRender = true;
  return numberOfCreatedRows;
};
DataMap.prototype.createCol = function(index, amount, createdAutomatically) {
  if (this.instance.dataType === 'object' || this.instance.getSettings().columns) {
    throw new Error("Cannot create new column. When data source in an object, " + "you can only have as much columns as defined in first data row, data schema or in the 'columns' setting." + "If you want to be able to add new columns, you have to use array datasource.");
  }
  var rlen = this.instance.countRows(),
      data = this.dataSource,
      constructor,
      numberOfCreatedCols = 0,
      currentIndex;
  if (!amount) {
    amount = 1;
  }
  currentIndex = index;
  var maxCols = this.instance.getSettings().maxCols;
  while (numberOfCreatedCols < amount && this.instance.countCols() < maxCols) {
    constructor = helper.columnFactory(this.GridSettings, this.priv.columnsSettingConflicts);
    if (typeof index !== 'number' || index >= this.instance.countCols()) {
      for (var r = 0; r < rlen; r++) {
        if (typeof data[r] === 'undefined') {
          data[r] = [];
        }
        data[r].push(null);
      }
      this.priv.columnSettings.push(constructor);
    } else {
      for (var r = 0; r < rlen; r++) {
        data[r].splice(currentIndex, 0, null);
      }
      this.priv.columnSettings.splice(currentIndex, 0, constructor);
    }
    numberOfCreatedCols++;
    currentIndex++;
  }
  Handsontable.hooks.run(this.instance, 'afterCreateCol', index, numberOfCreatedCols, createdAutomatically);
  this.instance.forceFullRender = true;
  return numberOfCreatedCols;
};
DataMap.prototype.removeRow = function(index, amount) {
  if (!amount) {
    amount = 1;
  }
  if (typeof index !== 'number') {
    index = -amount;
  }
  index = (this.instance.countRows() + index) % this.instance.countRows();
  var logicRows = this.physicalRowsToLogical(index, amount);
  var actionWasNotCancelled = Handsontable.hooks.run(this.instance, 'beforeRemoveRow', index, amount);
  if (actionWasNotCancelled === false) {
    return;
  }
  var data = this.dataSource;
  var newData = data.filter(function(row, index) {
    return logicRows.indexOf(index) == -1;
  });
  data.length = 0;
  Array.prototype.push.apply(data, newData);
  Handsontable.hooks.run(this.instance, 'afterRemoveRow', index, amount);
  this.instance.forceFullRender = true;
};
DataMap.prototype.removeCol = function(index, amount) {
  if (this.instance.dataType === 'object' || this.instance.getSettings().columns) {
    throw new Error("cannot remove column with object data source or columns option specified");
  }
  if (!amount) {
    amount = 1;
  }
  if (typeof index !== 'number') {
    index = -amount;
  }
  index = (this.instance.countCols() + index) % this.instance.countCols();
  var actionWasNotCancelled = Handsontable.hooks.run(this.instance, 'beforeRemoveCol', index, amount);
  if (actionWasNotCancelled === false) {
    return;
  }
  var data = this.dataSource;
  for (var r = 0,
      rlen = this.instance.countRows(); r < rlen; r++) {
    data[r].splice(index, amount);
  }
  this.priv.columnSettings.splice(index, amount);
  Handsontable.hooks.run(this.instance, 'afterRemoveCol', index, amount);
  this.instance.forceFullRender = true;
};
DataMap.prototype.spliceCol = function(col, index, amount) {
  var elements = 4 <= arguments.length ? [].slice.call(arguments, 3) : [];
  var colData = this.instance.getDataAtCol(col);
  var removed = colData.slice(index, index + amount);
  var after = colData.slice(index + amount);
  helper.extendArray(elements, after);
  var i = 0;
  while (i < amount) {
    elements.push(null);
    i++;
  }
  helper.to2dArray(elements);
  this.instance.populateFromArray(index, col, elements, null, null, 'spliceCol');
  return removed;
};
DataMap.prototype.spliceRow = function(row, index, amount) {
  var elements = 4 <= arguments.length ? [].slice.call(arguments, 3) : [];
  var rowData = this.instance.getSourceDataAtRow(row);
  var removed = rowData.slice(index, index + amount);
  var after = rowData.slice(index + amount);
  helper.extendArray(elements, after);
  var i = 0;
  while (i < amount) {
    elements.push(null);
    i++;
  }
  this.instance.populateFromArray(row, index, [elements], null, null, 'spliceRow');
  return removed;
};
DataMap.prototype.get = function(row, prop) {
  row = Handsontable.hooks.run(this.instance, 'modifyRow', row);
  if (typeof prop === 'string' && prop.indexOf('.') > -1) {
    var sliced = prop.split(".");
    var out = this.dataSource[row];
    if (!out) {
      return null;
    }
    for (var i = 0,
        ilen = sliced.length; i < ilen; i++) {
      out = out[sliced[i]];
      if (typeof out === 'undefined') {
        return null;
      }
    }
    return out;
  } else if (typeof prop === 'function') {
    return prop(this.dataSource.slice(row, row + 1)[0]);
  } else {
    return this.dataSource[row] ? this.dataSource[row][prop] : null;
  }
};
var copyableLookup = helper.cellMethodLookupFactory('copyable', false);
DataMap.prototype.getCopyable = function(row, prop) {
  if (copyableLookup.call(this.instance, row, this.propToCol(prop))) {
    return this.get(row, prop);
  }
  return '';
};
DataMap.prototype.set = function(row, prop, value, source) {
  row = Handsontable.hooks.run(this.instance, 'modifyRow', row, source || "datamapGet");
  if (typeof prop === 'string' && prop.indexOf('.') > -1) {
    var sliced = prop.split(".");
    var out = this.dataSource[row];
    for (var i = 0,
        ilen = sliced.length - 1; i < ilen; i++) {
      if (typeof out[sliced[i]] === 'undefined') {
        out[sliced[i]] = {};
      }
      out = out[sliced[i]];
    }
    out[sliced[i]] = value;
  } else if (typeof prop === 'function') {
    prop(this.dataSource.slice(row, row + 1)[0], value);
  } else {
    this.dataSource[row][prop] = value;
  }
};
DataMap.prototype.physicalRowsToLogical = function(index, amount) {
  var totalRows = this.instance.countRows();
  var physicRow = (totalRows + index) % totalRows;
  var logicRows = [];
  var rowsToRemove = amount;
  var row;
  while (physicRow < totalRows && rowsToRemove) {
    row = Handsontable.hooks.run(this.instance, 'modifyRow', physicRow);
    logicRows.push(row);
    rowsToRemove--;
    physicRow++;
  }
  return logicRows;
};
DataMap.prototype.clear = function() {
  for (var r = 0; r < this.instance.countRows(); r++) {
    for (var c = 0; c < this.instance.countCols(); c++) {
      this.set(r, this.colToProp(c), '');
    }
  }
};
DataMap.prototype.getAll = function() {
  return this.dataSource;
};
DataMap.prototype.getRange = function(start, end, destination) {
  var r,
      rlen,
      c,
      clen,
      output = [],
      row;
  var getFn = destination === this.DESTINATION_CLIPBOARD_GENERATOR ? this.getCopyable : this.get;
  rlen = Math.max(start.row, end.row);
  clen = Math.max(start.col, end.col);
  for (r = Math.min(start.row, end.row); r <= rlen; r++) {
    row = [];
    for (c = Math.min(start.col, end.col); c <= clen; c++) {
      row.push(getFn.call(this, r, this.colToProp(c)));
    }
    output.push(row);
  }
  return output;
};
DataMap.prototype.getText = function(start, end) {
  return SheetClip.stringify(this.getRange(start, end, this.DESTINATION_RENDERER));
};
DataMap.prototype.getCopyableText = function(start, end) {
  return SheetClip.stringify(this.getRange(start, end, this.DESTINATION_CLIPBOARD_GENERATOR));
};


//# 
},{"./3rdparty/sheetclip.js":5,"./helpers.js":49,"./multiMap.js":50}],34:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  enableImmediatePropagation: {get: function() {
      return enableImmediatePropagation;
    }},
  closest: {get: function() {
      return closest;
    }},
  isChildOf: {get: function() {
      return isChildOf;
    }},
  isChildOfWebComponentTable: {get: function() {
      return isChildOfWebComponentTable;
    }},
  polymerWrap: {get: function() {
      return polymerWrap;
    }},
  polymerUnwrap: {get: function() {
      return polymerUnwrap;
    }},
  isWebComponentSupportedNatively: {get: function() {
      return isWebComponentSupportedNatively;
    }},
  index: {get: function() {
      return index;
    }},
  hasClass: {get: function() {
      return hasClass;
    }},
  addClass: {get: function() {
      return addClass;
    }},
  removeClass: {get: function() {
      return removeClass;
    }},
  removeTextNodes: {get: function() {
      return removeTextNodes;
    }},
  empty: {get: function() {
      return empty;
    }},
  HTML_CHARACTERS: {get: function() {
      return HTML_CHARACTERS;
    }},
  fastInnerHTML: {get: function() {
      return fastInnerHTML;
    }},
  fastInnerText: {get: function() {
      return fastInnerText;
    }},
  isVisible: {get: function() {
      return isVisible;
    }},
  offset: {get: function() {
      return offset;
    }},
  getWindowScrollTop: {get: function() {
      return getWindowScrollTop;
    }},
  getWindowScrollLeft: {get: function() {
      return getWindowScrollLeft;
    }},
  getScrollTop: {get: function() {
      return getScrollTop;
    }},
  getScrollLeft: {get: function() {
      return getScrollLeft;
    }},
  getScrollableElement: {get: function() {
      return getScrollableElement;
    }},
  getTrimmingContainer: {get: function() {
      return getTrimmingContainer;
    }},
  getStyle: {get: function() {
      return getStyle;
    }},
  getComputedStyle: {get: function() {
      return getComputedStyle;
    }},
  outerWidth: {get: function() {
      return outerWidth;
    }},
  outerHeight: {get: function() {
      return outerHeight;
    }},
  innerHeight: {get: function() {
      return innerHeight;
    }},
  innerWidth: {get: function() {
      return innerWidth;
    }},
  addEvent: {get: function() {
      return addEvent;
    }},
  removeEvent: {get: function() {
      return removeEvent;
    }},
  hasCaptionProblem: {get: function() {
      return hasCaptionProblem;
    }},
  getCaretPosition: {get: function() {
      return getCaretPosition;
    }},
  getSelectionEndPosition: {get: function() {
      return getSelectionEndPosition;
    }},
  setCaretPosition: {get: function() {
      return setCaretPosition;
    }},
  getScrollbarWidth: {get: function() {
      return getScrollbarWidth;
    }},
  isIE8: {get: function() {
      return isIE8;
    }},
  isIE9: {get: function() {
      return isIE9;
    }},
  isSafari: {get: function() {
      return isSafari;
    }},
  setOverlayPosition: {get: function() {
      return setOverlayPosition;
    }},
  getCssTransform: {get: function() {
      return getCssTransform;
    }},
  resetCssTransform: {get: function() {
      return resetCssTransform;
    }},
  __esModule: {value: true}
});
function enableImmediatePropagation(event) {
  if (event != null && event.isImmediatePropagationEnabled == null) {
    event.stopImmediatePropagation = function() {
      this.isImmediatePropagationEnabled = false;
      this.cancelBubble = true;
    };
    event.isImmediatePropagationEnabled = true;
    event.isImmediatePropagationStopped = function() {
      return !this.isImmediatePropagationEnabled;
    };
  }
}
function closest(element, nodes, until) {
  while (element != null && element !== until) {
    if (element.nodeType === Node.ELEMENT_NODE && (nodes.indexOf(element.nodeName) > -1 || nodes.indexOf(element) > -1)) {
      return element;
    }
    if (element.host && element.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      element = element.host;
    } else {
      element = element.parentNode;
    }
  }
  return null;
}
function isChildOf(child, parent) {
  var node = child.parentNode;
  var queriedParents = [];
  if (typeof parent === "string") {
    queriedParents = Array.prototype.slice.call(document.querySelectorAll(parent), 0);
  } else {
    queriedParents.push(parent);
  }
  while (node != null) {
    if (queriedParents.indexOf(node) > -1) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}
function isChildOfWebComponentTable(element) {
  var hotTableName = 'hot-table',
      result = false,
      parentNode;
  parentNode = polymerWrap(element);
  function isHotTable(element) {
    return element.nodeType === Node.ELEMENT_NODE && element.nodeName === hotTableName.toUpperCase();
  }
  while (parentNode != null) {
    if (isHotTable(parentNode)) {
      result = true;
      break;
    } else if (parentNode.host && parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      result = isHotTable(parentNode.host);
      if (result) {
        break;
      }
      parentNode = parentNode.host;
    }
    parentNode = parentNode.parentNode;
  }
  return result;
}
function polymerWrap(element) {
  return typeof Polymer !== 'undefined' && typeof wrap === 'function' ? wrap(element) : element;
}
function polymerUnwrap(element) {
  return typeof Polymer !== 'undefined' && typeof unwrap === 'function' ? unwrap(element) : element;
}
function isWebComponentSupportedNatively() {
  var test = document.createElement('div');
  return test.createShadowRoot && test.createShadowRoot.toString().match(/\[native code\]/) ? true : false;
}
function index(elem) {
  var i = 0;
  if (elem.previousSibling) {
    while (elem = elem.previousSibling) {
      ++i;
    }
  }
  return i;
}
var classListSupport = document.documentElement.classList ? true : false;
var _hasClass,
    _addClass,
    _removeClass;
function filterEmptyClassNames(classNames) {
  var len = 0,
      result = [];
  if (!classNames || !classNames.length) {
    return result;
  }
  while (classNames[len]) {
    result.push(classNames[len]);
    len++;
  }
  return result;
}
if (classListSupport) {
  var isSupportMultipleClassesArg = (function() {
    var element = document.createElement('div');
    element.classList.add('test', 'test2');
    return element.classList.contains('test2');
  }());
  _hasClass = function _hasClass(element, className) {
    if (className === '') {
      return false;
    }
    return element.classList.contains(className);
  };
  _addClass = function _addClass(element, className) {
    var len = 0;
    if (typeof className === 'string') {
      className = className.split(' ');
    }
    className = filterEmptyClassNames(className);
    if (isSupportMultipleClassesArg) {
      element.classList.add.apply(element.classList, className);
    } else {
      while (className && className[len]) {
        element.classList.add(className[len]);
        len++;
      }
    }
  };
  _removeClass = function _removeClass(element, className) {
    var len = 0;
    if (typeof className === 'string') {
      className = className.split(' ');
    }
    className = filterEmptyClassNames(className);
    if (isSupportMultipleClassesArg) {
      element.classList.remove.apply(element.classList, className);
    } else {
      while (className && className[len]) {
        element.classList.remove(className[len]);
        len++;
      }
    }
  };
} else {
  var createClassNameRegExp = function createClassNameRegExp(className) {
    return new RegExp('(\\s|^)' + className + '(\\s|$)');
  };
  _hasClass = function _hasClass(element, className) {
    return element.className.match(createClassNameRegExp(className)) ? true : false;
  };
  _addClass = function _addClass(element, className) {
    var len = 0,
        _className = element.className;
    if (typeof className === 'string') {
      className = className.split(' ');
    }
    if (_className === '') {
      _className = className.join(' ');
    } else {
      while (className && className[len]) {
        if (!createClassNameRegExp(className[len]).test(_className)) {
          _className += ' ' + className[len];
        }
        len++;
      }
    }
    element.className = _className;
  };
  _removeClass = function _removeClass(element, className) {
    var len = 0,
        _className = element.className;
    if (typeof className === 'string') {
      className = className.split(' ');
    }
    while (className && className[len]) {
      _className = _className.replace(createClassNameRegExp(className[len]), ' ').trim();
      len++;
    }
    if (element.className !== _className) {
      element.className = _className;
    }
  };
}
function hasClass(element, className) {
  return _hasClass(element, className);
}
function addClass(element, className) {
  return _addClass(element, className);
}
function removeClass(element, className) {
  return _removeClass(element, className);
}
function removeTextNodes(elem, parent) {
  if (elem.nodeType === 3) {
    parent.removeChild(elem);
  } else if (['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR'].indexOf(elem.nodeName) > -1) {
    var childs = elem.childNodes;
    for (var i = childs.length - 1; i >= 0; i--) {
      removeTextNodes(childs[i], elem);
    }
  }
}
function empty(element) {
  var child;
  while (child = element.lastChild) {
    element.removeChild(child);
  }
}
var HTML_CHARACTERS = /(<(.*)>|&(.*);)/;
function fastInnerHTML(element, content) {
  if (HTML_CHARACTERS.test(content)) {
    element.innerHTML = content;
  } else {
    fastInnerText(element, content);
  }
}
var textContextSupport = document.createTextNode('test').textContent ? true : false;
function fastInnerText(element, content) {
  var child = element.firstChild;
  if (child && child.nodeType === 3 && child.nextSibling === null) {
    if (textContextSupport) {
      child.textContent = content;
    } else {
      child.data = content;
    }
  } else {
    empty(element);
    element.appendChild(document.createTextNode(content));
  }
}
function isVisible(elem) {
  var next = elem;
  while (polymerUnwrap(next) !== document.documentElement) {
    if (next === null) {
      return false;
    } else if (next.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      if (next.host) {
        if (next.host.impl) {
          return isVisible(next.host.impl);
        } else if (next.host) {
          return isVisible(next.host);
        } else {
          throw new Error("Lost in Web Components world");
        }
      } else {
        return false;
      }
    } else if (next.style.display === 'none') {
      return false;
    }
    next = next.parentNode;
  }
  return true;
}
function offset(elem) {
  var offsetLeft,
      offsetTop,
      lastElem,
      docElem,
      box;
  docElem = document.documentElement;
  if (hasCaptionProblem() && elem.firstChild && elem.firstChild.nodeName === 'CAPTION') {
    box = elem.getBoundingClientRect();
    return {
      top: box.top + (window.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0),
      left: box.left + (window.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
    };
  }
  offsetLeft = elem.offsetLeft;
  offsetTop = elem.offsetTop;
  lastElem = elem;
  while (elem = elem.offsetParent) {
    if (elem === document.body) {
      break;
    }
    offsetLeft += elem.offsetLeft;
    offsetTop += elem.offsetTop;
    lastElem = elem;
  }
  if (lastElem && lastElem.style.position === 'fixed') {
    offsetLeft += window.pageXOffset || docElem.scrollLeft;
    offsetTop += window.pageYOffset || docElem.scrollTop;
  }
  return {
    left: offsetLeft,
    top: offsetTop
  };
}
function getWindowScrollTop() {
  var res = window.scrollY;
  if (res == void 0) {
    res = document.documentElement.scrollTop;
  }
  return res;
}
function getWindowScrollLeft() {
  var res = window.scrollX;
  if (res == void 0) {
    res = document.documentElement.scrollLeft;
  }
  return res;
}
function getScrollTop(elem) {
  if (elem === window) {
    return getWindowScrollTop(elem);
  } else {
    return elem.scrollTop;
  }
}
function getScrollLeft(elem) {
  if (elem === window) {
    return getWindowScrollLeft(elem);
  } else {
    return elem.scrollLeft;
  }
}
function getScrollableElement(element) {
  var el = element.parentNode,
      props = ['auto', 'scroll'],
      overflow,
      overflowX,
      overflowY,
      computedStyle = '',
      computedOverflow = '',
      computedOverflowY = '',
      computedOverflowX = '';
  while (el && el.style && document.body !== el) {
    overflow = el.style.overflow;
    overflowX = el.style.overflowX;
    overflowY = el.style.overflowY;
    if (overflow == 'scroll' || overflowX == 'scroll' || overflowY == 'scroll') {
      return el;
    } else if (window.getComputedStyle) {
      computedStyle = window.getComputedStyle(el);
      computedOverflow = computedStyle.getPropertyValue('overflow');
      computedOverflowY = computedStyle.getPropertyValue('overflow-y');
      computedOverflowX = computedStyle.getPropertyValue('overflow-x');
      if (computedOverflow === 'scroll' || computedOverflowX === 'scroll' || computedOverflowY === 'scroll') {
        return el;
      }
    }
    if (el.clientHeight <= el.scrollHeight && (props.indexOf(overflowY) !== -1 || props.indexOf(overflow) !== -1 || props.indexOf(computedOverflow) !== -1 || props.indexOf(computedOverflowY) !== -1)) {
      return el;
    }
    if (el.clientWidth <= el.scrollWidth && (props.indexOf(overflowX) !== -1 || props.indexOf(overflow) !== -1 || props.indexOf(computedOverflow) !== -1 || props.indexOf(computedOverflowX) !== -1)) {
      return el;
    }
    el = el.parentNode;
  }
  return window;
}
function getTrimmingContainer(base) {
  var el = base.parentNode;
  while (el && el.style && document.body !== el) {
    if (el.style.overflow !== 'visible' && el.style.overflow !== '') {
      return el;
    } else if (window.getComputedStyle) {
      var computedStyle = window.getComputedStyle(el);
      if (computedStyle.getPropertyValue('overflow') !== 'visible' && computedStyle.getPropertyValue('overflow') !== '') {
        return el;
      }
    }
    el = el.parentNode;
  }
  return window;
}
function getStyle(elem, prop) {
  if (!elem) {
    return;
  } else if (elem === window) {
    if (prop === 'width') {
      return window.innerWidth + 'px';
    } else if (prop === 'height') {
      return window.innerHeight + 'px';
    }
    return;
  }
  var styleProp = elem.style[prop],
      computedStyle;
  if (styleProp !== "" && styleProp !== void 0) {
    return styleProp;
  } else {
    computedStyle = getComputedStyle(elem);
    if (computedStyle[prop] !== "" && computedStyle[prop] !== void 0) {
      return computedStyle[prop];
    }
    return void 0;
  }
}
function getComputedStyle(elem) {
  return elem.currentStyle || document.defaultView.getComputedStyle(elem);
}
function outerWidth(elem) {
  return elem.offsetWidth;
}
function outerHeight(elem) {
  if (hasCaptionProblem() && elem.firstChild && elem.firstChild.nodeName === 'CAPTION') {
    return elem.offsetHeight + elem.firstChild.offsetHeight;
  } else {
    return elem.offsetHeight;
  }
}
function innerHeight(elem) {
  return elem.clientHeight || elem.innerHeight;
}
function innerWidth(elem) {
  return elem.clientWidth || elem.innerWidth;
}
function addEvent(element, event, callback) {
  if (window.addEventListener) {
    element.addEventListener(event, callback, false);
  } else {
    element.attachEvent('on' + event, callback);
  }
}
function removeEvent(element, event, callback) {
  if (window.removeEventListener) {
    element.removeEventListener(event, callback, false);
  } else {
    element.detachEvent('on' + event, callback);
  }
}
var _hasCaptionProblem;
function detectCaptionProblem() {
  var TABLE = document.createElement('TABLE');
  TABLE.style.borderSpacing = 0;
  TABLE.style.borderWidth = 0;
  TABLE.style.padding = 0;
  var TBODY = document.createElement('TBODY');
  TABLE.appendChild(TBODY);
  TBODY.appendChild(document.createElement('TR'));
  TBODY.firstChild.appendChild(document.createElement('TD'));
  TBODY.firstChild.firstChild.innerHTML = '<tr><td>t<br>t</td></tr>';
  var CAPTION = document.createElement('CAPTION');
  CAPTION.innerHTML = 'c<br>c<br>c<br>c';
  CAPTION.style.padding = 0;
  CAPTION.style.margin = 0;
  TABLE.insertBefore(CAPTION, TBODY);
  document.body.appendChild(TABLE);
  _hasCaptionProblem = (TABLE.offsetHeight < 2 * TABLE.lastChild.offsetHeight);
  document.body.removeChild(TABLE);
}
function hasCaptionProblem() {
  if (_hasCaptionProblem === void 0) {
    detectCaptionProblem();
  }
  return _hasCaptionProblem;
}
function getCaretPosition(el) {
  if (el.selectionStart) {
    return el.selectionStart;
  } else if (document.selection) {
    el.focus();
    var r = document.selection.createRange();
    if (r == null) {
      return 0;
    }
    var re = el.createTextRange(),
        rc = re.duplicate();
    re.moveToBookmark(r.getBookmark());
    rc.setEndPoint('EndToStart', re);
    return rc.text.length;
  }
  return 0;
}
function getSelectionEndPosition(el) {
  if (el.selectionEnd) {
    return el.selectionEnd;
  } else if (document.selection) {
    var r = document.selection.createRange();
    if (r == null) {
      return 0;
    }
    var re = el.createTextRange();
    return re.text.indexOf(r.text) + r.text.length;
  }
}
function setCaretPosition(el, pos, endPos) {
  if (endPos === void 0) {
    endPos = pos;
  }
  if (el.setSelectionRange) {
    el.focus();
    el.setSelectionRange(pos, endPos);
  } else if (el.createTextRange) {
    var range = el.createTextRange();
    range.collapse(true);
    range.moveEnd('character', endPos);
    range.moveStart('character', pos);
    range.select();
  }
}
var cachedScrollbarWidth;
function walkontableCalculateScrollbarWidth() {
  var inner = document.createElement('p');
  inner.style.width = "100%";
  inner.style.height = "200px";
  var outer = document.createElement('div');
  outer.style.position = "absolute";
  outer.style.top = "0px";
  outer.style.left = "0px";
  outer.style.visibility = "hidden";
  outer.style.width = "200px";
  outer.style.height = "150px";
  outer.style.overflow = "hidden";
  outer.appendChild(inner);
  (document.body || document.documentElement).appendChild(outer);
  var w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  var w2 = inner.offsetWidth;
  if (w1 == w2) {
    w2 = outer.clientWidth;
  }
  (document.body || document.documentElement).removeChild(outer);
  return (w1 - w2);
}
function getScrollbarWidth() {
  if (cachedScrollbarWidth === void 0) {
    cachedScrollbarWidth = walkontableCalculateScrollbarWidth();
  }
  return cachedScrollbarWidth;
}
var _isIE8 = !(document.createTextNode('test').textContent);
function isIE8() {
  return isIE8;
}
var _isIE9 = !!(document.documentMode);
function isIE9() {
  return _isIE9;
}
var _isSafari = (/Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor));
function isSafari() {
  return _isSafari;
}
function setOverlayPosition(overlayElem, left, top) {
  if (_isIE8 || _isIE9) {
    overlayElem.style.top = top;
    overlayElem.style.left = left;
  } else if (_isSafari) {
    overlayElem.style['-webkit-transform'] = 'translate3d(' + left + ',' + top + ',0)';
  } else {
    overlayElem.style['transform'] = 'translate3d(' + left + ',' + top + ',0)';
  }
}
function getCssTransform(elem) {
  var transform;
  if (elem.style['transform'] && (transform = elem.style['transform']) != "") {
    return ['transform', transform];
  } else if (elem.style['-webkit-transform'] && (transform = elem.style['-webkit-transform']) != "") {
    return ['-webkit-transform', transform];
  } else {
    return -1;
  }
}
function resetCssTransform(elem) {
  if (elem['transform'] && elem['transform'] != "") {
    elem['transform'] = "";
  } else if (elem['-webkit-transform'] && elem['-webkit-transform'] != "") {
    elem['-webkit-transform'] = "";
  }
}
window.Handsontable = window.Handsontable || {};
Handsontable.Dom = {
  addClass: addClass,
  addEvent: addEvent,
  closest: closest,
  empty: empty,
  enableImmediatePropagation: enableImmediatePropagation,
  fastInnerHTML: fastInnerHTML,
  fastInnerText: fastInnerText,
  getCaretPosition: getCaretPosition,
  getComputedStyle: getComputedStyle,
  getCssTransform: getCssTransform,
  getScrollableElement: getScrollableElement,
  getScrollbarWidth: getScrollbarWidth,
  getScrollLeft: getScrollLeft,
  getScrollTop: getScrollTop,
  getStyle: getStyle,
  getSelectionEndPosition: getSelectionEndPosition,
  getWindowScrollLeft: getWindowScrollLeft,
  getWindowScrollTop: getWindowScrollTop,
  hasCaptionProblem: hasCaptionProblem,
  hasClass: hasClass,
  HTML_CHARACTERS: HTML_CHARACTERS,
  index: index,
  innerHeight: innerHeight,
  innerWidth: innerWidth,
  isChildOf: isChildOf,
  isChildOfWebComponentTable: isChildOfWebComponentTable,
  isIE8: isIE8,
  isIE9: isIE9,
  isSafari: isSafari,
  isVisible: isVisible,
  isWebComponentSupportedNatively: isWebComponentSupportedNatively,
  offset: offset,
  outerHeight: outerHeight,
  outerWidth: outerWidth,
  polymerUnwrap: polymerUnwrap,
  polymerWrap: polymerWrap,
  removeClass: removeClass,
  removeEvent: removeEvent,
  removeTextNodes: removeTextNodes,
  resetCssTransform: resetCssTransform,
  setCaretPosition: setCaretPosition,
  setOverlayPosition: setOverlayPosition
};


//# 
},{}],35:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  EditorManager: {get: function() {
      return EditorManager;
    }},
  __esModule: {value: true}
});
var $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__,
    $__helpers_46_js__,
    $__dom_46_js__,
    $__editors_46_js__,
    $__eventManager_46_js__;
var WalkontableCellCoords = ($__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ = require("./3rdparty/walkontable/src/cellCoords.js"), $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ && $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__.__esModule && $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ || {default: $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__}).WalkontableCellCoords;
var helper = ($__helpers_46_js__ = require("./helpers.js"), $__helpers_46_js__ && $__helpers_46_js__.__esModule && $__helpers_46_js__ || {default: $__helpers_46_js__});
var dom = ($__dom_46_js__ = require("./dom.js"), $__dom_46_js__ && $__dom_46_js__.__esModule && $__dom_46_js__ || {default: $__dom_46_js__});
var getEditor = ($__editors_46_js__ = require("./editors.js"), $__editors_46_js__ && $__editors_46_js__.__esModule && $__editors_46_js__ || {default: $__editors_46_js__}).getEditor;
var eventManagerObject = ($__eventManager_46_js__ = require("./eventManager.js"), $__eventManager_46_js__ && $__eventManager_46_js__.__esModule && $__eventManager_46_js__ || {default: $__eventManager_46_js__}).eventManager;
;
Handsontable.EditorManager = EditorManager;
function EditorManager(instance, priv, selection) {
  var _this = this,
      keyCodes = helper.keyCode,
      destroyed = false,
      eventManager,
      activeEditor;
  eventManager = eventManagerObject(instance);
  function moveSelectionAfterEnter(shiftKey) {
    var enterMoves = typeof priv.settings.enterMoves === 'function' ? priv.settings.enterMoves(event) : priv.settings.enterMoves;
    if (shiftKey) {
      selection.transformStart(-enterMoves.row, -enterMoves.col);
    } else {
      selection.transformStart(enterMoves.row, enterMoves.col, true);
    }
  }
  function moveSelectionUp(shiftKey) {
    if (shiftKey) {
      selection.transformEnd(-1, 0);
    } else {
      selection.transformStart(-1, 0);
    }
  }
  function moveSelectionDown(shiftKey) {
    if (shiftKey) {
      selection.transformEnd(1, 0);
    } else {
      selection.transformStart(1, 0);
    }
  }
  function moveSelectionRight(shiftKey) {
    if (shiftKey) {
      selection.transformEnd(0, 1);
    } else {
      selection.transformStart(0, 1);
    }
  }
  function moveSelectionLeft(shiftKey) {
    if (shiftKey) {
      selection.transformEnd(0, -1);
    } else {
      selection.transformStart(0, -1);
    }
  }
  function onKeyDown(event) {
    var ctrlDown,
        rangeModifier;
    if (!instance.isListening()) {
      return;
    }
    Handsontable.hooks.run(instance, 'beforeKeyDown', event);
    if (destroyed) {
      return;
    }
    dom.enableImmediatePropagation(event);
    if (event.isImmediatePropagationStopped()) {
      return;
    }
    priv.lastKeyCode = event.keyCode;
    if (!selection.isSelected()) {
      return;
    }
    ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;
    if (activeEditor && !activeEditor.isWaiting()) {
      if (!helper.isMetaKey(event.keyCode) && !ctrlDown && !_this.isEditorOpened()) {
        _this.openEditor("", event);
        return;
      }
    }
    rangeModifier = event.shiftKey ? selection.setRangeEnd : selection.setRangeStart;
    switch (event.keyCode) {
      case keyCodes.A:
        if (ctrlDown) {
          selection.selectAll();
          event.preventDefault();
          helper.stopPropagation(event);
        }
        break;
      case keyCodes.ARROW_UP:
        if (_this.isEditorOpened() && activeEditor && !activeEditor.isWaiting()) {
          _this.closeEditorAndSaveChanges(ctrlDown);
        }
        moveSelectionUp(event.shiftKey);
        event.preventDefault();
        helper.stopPropagation(event);
        break;
      case keyCodes.ARROW_DOWN:
        if (_this.isEditorOpened() && activeEditor && !activeEditor.isWaiting()) {
          _this.closeEditorAndSaveChanges(ctrlDown);
        }
        moveSelectionDown(event.shiftKey);
        event.preventDefault();
        helper.stopPropagation(event);
        break;
      case keyCodes.ARROW_RIGHT:
        if (_this.isEditorOpened() && activeEditor && !activeEditor.isWaiting()) {
          _this.closeEditorAndSaveChanges(ctrlDown);
        }
        moveSelectionRight(event.shiftKey);
        event.preventDefault();
        helper.stopPropagation(event);
        break;
      case keyCodes.ARROW_LEFT:
        if (_this.isEditorOpened() && activeEditor && !activeEditor.isWaiting()) {
          _this.closeEditorAndSaveChanges(ctrlDown);
        }
        moveSelectionLeft(event.shiftKey);
        event.preventDefault();
        helper.stopPropagation(event);
        break;
      case keyCodes.TAB:
        var tabMoves = typeof priv.settings.tabMoves === 'function' ? priv.settings.tabMoves(event) : priv.settings.tabMoves;
        if (event.shiftKey) {
          selection.transformStart(-tabMoves.row, -tabMoves.col);
        } else {
          selection.transformStart(tabMoves.row, tabMoves.col, true);
        }
        event.preventDefault();
        helper.stopPropagation(event);
        break;
      case keyCodes.BACKSPACE:
      case keyCodes.DELETE:
        selection.empty(event);
        _this.prepareEditor();
        event.preventDefault();
        break;
      case keyCodes.F2:
        _this.openEditor(null, event);
        event.preventDefault();
        break;
      case keyCodes.ENTER:
        if (_this.isEditorOpened()) {
          if (activeEditor && activeEditor.state !== Handsontable.EditorState.WAITING) {
            _this.closeEditorAndSaveChanges(ctrlDown);
          }
          moveSelectionAfterEnter(event.shiftKey);
        } else {
          if (instance.getSettings().enterBeginsEditing) {
            _this.openEditor(null, event);
          } else {
            moveSelectionAfterEnter(event.shiftKey);
          }
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        break;
      case keyCodes.ESCAPE:
        if (_this.isEditorOpened()) {
          _this.closeEditorAndRestoreOriginalValue(ctrlDown);
        }
        event.preventDefault();
        break;
      case keyCodes.HOME:
        if (event.ctrlKey || event.metaKey) {
          rangeModifier(new WalkontableCellCoords(0, priv.selRange.from.col));
        } else {
          rangeModifier(new WalkontableCellCoords(priv.selRange.from.row, 0));
        }
        event.preventDefault();
        helper.stopPropagation(event);
        break;
      case keyCodes.END:
        if (event.ctrlKey || event.metaKey) {
          rangeModifier(new WalkontableCellCoords(instance.countRows() - 1, priv.selRange.from.col));
        } else {
          rangeModifier(new WalkontableCellCoords(priv.selRange.from.row, instance.countCols() - 1));
        }
        event.preventDefault();
        helper.stopPropagation(event);
        break;
      case keyCodes.PAGE_UP:
        selection.transformStart(-instance.countVisibleRows(), 0);
        event.preventDefault();
        helper.stopPropagation(event);
        break;
      case keyCodes.PAGE_DOWN:
        selection.transformStart(instance.countVisibleRows(), 0);
        event.preventDefault();
        helper.stopPropagation(event);
        break;
    }
  }
  function init() {
    instance.addHook('afterDocumentKeyDown', onKeyDown);
    eventManager.addEventListener(document.documentElement, 'keydown', function(event) {
      instance.runHooks('afterDocumentKeyDown', event);
    });
    function onDblClick(event, coords, elem) {
      if (elem.nodeName == "TD") {
        _this.openEditor();
      }
    }
    instance.view.wt.update('onCellDblClick', onDblClick);
    instance.addHook('afterDestroy', function() {
      destroyed = true;
    });
  }
  this.destroyEditor = function(revertOriginal) {
    this.closeEditor(revertOriginal);
  };
  this.getActiveEditor = function() {
    return activeEditor;
  };
  this.prepareEditor = function() {
    var row,
        col,
        prop,
        td,
        originalValue,
        cellProperties,
        editorClass;
    if (activeEditor && activeEditor.isWaiting()) {
      this.closeEditor(false, false, function(dataSaved) {
        if (dataSaved) {
          _this.prepareEditor();
        }
      });
      return;
    }
    row = priv.selRange.highlight.row;
    col = priv.selRange.highlight.col;
    prop = instance.colToProp(col);
    td = instance.getCell(row, col);
    originalValue = instance.getDataAtCell(row, col);
    cellProperties = instance.getCellMeta(row, col);
    editorClass = instance.getCellEditor(cellProperties);
    if (editorClass) {
      activeEditor = Handsontable.editors.getEditor(editorClass, instance);
      activeEditor.prepare(row, col, prop, td, originalValue, cellProperties);
    } else {
      activeEditor = void 0;
    }
  };
  this.isEditorOpened = function() {
    return activeEditor && activeEditor.isOpened();
  };
  this.openEditor = function(initialValue, event) {
    if (activeEditor && !activeEditor.cellProperties.readOnly) {
      activeEditor.beginEditing(initialValue, event);
    } else if (activeEditor && activeEditor.cellProperties.readOnly) {
      if (event && event.keyCode === helper.keyCode.ENTER) {
        moveSelectionAfterEnter();
      }
    }
  };
  this.closeEditor = function(restoreOriginalValue, ctrlDown, callback) {
    if (!activeEditor) {
      if (callback) {
        callback(false);
      }
    } else {
      activeEditor.finishEditing(restoreOriginalValue, ctrlDown, callback);
    }
  };
  this.closeEditorAndSaveChanges = function(ctrlDown) {
    return this.closeEditor(false, ctrlDown);
  };
  this.closeEditorAndRestoreOriginalValue = function(ctrlDown) {
    return this.closeEditor(true, ctrlDown);
  };
  init();
}


//# 
},{"./3rdparty/walkontable/src/cellCoords.js":8,"./dom.js":34,"./editors.js":36,"./eventManager.js":48,"./helpers.js":49}],36:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  registerEditor: {get: function() {
      return registerEditor;
    }},
  getEditor: {get: function() {
      return getEditor;
    }},
  hasEditor: {get: function() {
      return hasEditor;
    }},
  getEditorConstructor: {get: function() {
      return getEditorConstructor;
    }},
  __esModule: {value: true}
});
var $__helpers_46_js__;
var helper = ($__helpers_46_js__ = require("./helpers.js"), $__helpers_46_js__ && $__helpers_46_js__.__esModule && $__helpers_46_js__ || {default: $__helpers_46_js__});
;
var registeredEditorNames = {},
    registeredEditorClasses = new WeakMap();
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.registerEditor = registerEditor;
Handsontable.editors.getEditor = getEditor;
function RegisteredEditor(editorClass) {
  var Clazz,
      instances;
  instances = {};
  Clazz = editorClass;
  this.getConstructor = function() {
    return editorClass;
  };
  this.getInstance = function(hotInstance) {
    if (!(hotInstance.guid in instances)) {
      instances[hotInstance.guid] = new Clazz(hotInstance);
    }
    return instances[hotInstance.guid];
  };
}
function registerEditor(editorName, editorClass) {
  var editor = new RegisteredEditor(editorClass);
  if (typeof editorName === "string") {
    registeredEditorNames[editorName] = editor;
  }
  registeredEditorClasses.set(editorClass, editor);
}
function getEditor(editorName, hotInstance) {
  var editor;
  if (typeof editorName == 'function') {
    if (!(registeredEditorClasses.get(editorName))) {
      registerEditor(null, editorName);
    }
    editor = registeredEditorClasses.get(editorName);
  } else if (typeof editorName == 'string') {
    editor = registeredEditorNames[editorName];
  } else {
    throw Error('Only strings and functions can be passed as "editor" parameter ');
  }
  if (!editor) {
    throw Error('No editor registered under name "' + editorName + '"');
  }
  return editor.getInstance(hotInstance);
}
function getEditorConstructor(editorName) {
  var editor;
  if (typeof editorName == 'string') {
    editor = registeredEditorNames[editorName];
  } else {
    throw Error('Only strings and functions can be passed as "editor" parameter ');
  }
  if (!editor) {
    throw Error('No editor registered under name "' + editorName + '"');
  }
  return editor.getConstructor();
}
function hasEditor(editorName) {
  return registeredEditorNames[editorName] ? true : false;
}


//# 
},{"./helpers.js":49}],37:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  BaseEditor: {get: function() {
      return BaseEditor;
    }},
  __esModule: {value: true}
});
var $___46__46__47_helpers_46_js__,
    $___46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__;
var helper = ($___46__46__47_helpers_46_js__ = require("./../helpers.js"), $___46__46__47_helpers_46_js__ && $___46__46__47_helpers_46_js__.__esModule && $___46__46__47_helpers_46_js__ || {default: $___46__46__47_helpers_46_js__});
var WalkontableCellCoords = ($___46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ = require("./../3rdparty/walkontable/src/cellCoords.js"), $___46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ && $___46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__.__esModule && $___46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ || {default: $___46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__}).WalkontableCellCoords;
;
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.BaseEditor = BaseEditor;
Handsontable.EditorState = {
  VIRGIN: 'STATE_VIRGIN',
  EDITING: 'STATE_EDITING',
  WAITING: 'STATE_WAITING',
  FINISHED: 'STATE_FINISHED'
};
function BaseEditor(instance) {
  this.instance = instance;
  this.state = Handsontable.EditorState.VIRGIN;
  this._opened = false;
  this._closeCallback = null;
  this.init();
}
BaseEditor.prototype._fireCallbacks = function(result) {
  if (this._closeCallback) {
    this._closeCallback(result);
    this._closeCallback = null;
  }
};
BaseEditor.prototype.init = function() {};
BaseEditor.prototype.getValue = function() {
  throw Error('Editor getValue() method unimplemented');
};
BaseEditor.prototype.setValue = function(newValue) {
  throw Error('Editor setValue() method unimplemented');
};
BaseEditor.prototype.open = function() {
  throw Error('Editor open() method unimplemented');
};
BaseEditor.prototype.close = function() {
  throw Error('Editor close() method unimplemented');
};
BaseEditor.prototype.prepare = function(row, col, prop, td, originalValue, cellProperties) {
  this.TD = td;
  this.row = row;
  this.col = col;
  this.prop = prop;
  this.originalValue = originalValue;
  this.cellProperties = cellProperties;
  this.state = Handsontable.EditorState.VIRGIN;
};
BaseEditor.prototype.extend = function() {
  var baseClass = this.constructor;
  function Editor() {
    baseClass.apply(this, arguments);
  }
  function inherit(Child, Parent) {
    function Bridge() {}
    Bridge.prototype = Parent.prototype;
    Child.prototype = new Bridge();
    Child.prototype.constructor = Child;
    return Child;
  }
  return inherit(Editor, baseClass);
};
BaseEditor.prototype.saveValue = function(val, ctrlDown) {
  var sel,
      tmp;
  if (ctrlDown) {
    sel = this.instance.getSelected();
    if (sel[0] > sel[2]) {
      tmp = sel[0];
      sel[0] = sel[2];
      sel[2] = tmp;
    }
    if (sel[1] > sel[3]) {
      tmp = sel[1];
      sel[1] = sel[3];
      sel[3] = tmp;
    }
    this.instance.populateFromArray(sel[0], sel[1], val, sel[2], sel[3], 'edit');
  } else {
    this.instance.populateFromArray(this.row, this.col, val, null, null, 'edit');
  }
};
BaseEditor.prototype.beginEditing = function(initialValue, event) {
  if (this.state != Handsontable.EditorState.VIRGIN) {
    return;
  }
  this.instance.view.scrollViewport(new WalkontableCellCoords(this.row, this.col));
  this.instance.view.render();
  this.state = Handsontable.EditorState.EDITING;
  initialValue = typeof initialValue == 'string' ? initialValue : this.originalValue;
  this.setValue(helper.stringify(initialValue));
  this.open(event);
  this._opened = true;
  this.focus();
  this.instance.view.render();
};
BaseEditor.prototype.finishEditing = function(restoreOriginalValue, ctrlDown, callback) {
  var _this = this,
      val;
  if (callback) {
    var previousCloseCallback = this._closeCallback;
    this._closeCallback = function(result) {
      if (previousCloseCallback) {
        previousCloseCallback(result);
      }
      callback(result);
    };
  }
  if (this.isWaiting()) {
    return;
  }
  if (this.state == Handsontable.EditorState.VIRGIN) {
    this.instance._registerTimeout(setTimeout(function() {
      _this._fireCallbacks(true);
    }, 0));
    return;
  }
  if (this.state == Handsontable.EditorState.EDITING) {
    if (restoreOriginalValue) {
      this.cancelChanges();
      this.instance.view.render();
      return;
    }
    if (this.instance.getSettings().trimWhitespace) {
      val = [[typeof this.getValue() === 'string' ? String.prototype.trim.call(this.getValue() || '') : this.getValue()]];
    } else {
      val = [[this.getValue()]];
    }
    this.state = Handsontable.EditorState.WAITING;
    this.saveValue(val, ctrlDown);
    if (this.instance.getCellValidator(this.cellProperties)) {
      this.instance.addHookOnce('postAfterValidate', function(result) {
        _this.state = Handsontable.EditorState.FINISHED;
        _this.discardEditor(result);
      });
    } else {
      this.state = Handsontable.EditorState.FINISHED;
      this.discardEditor(true);
    }
  }
};
BaseEditor.prototype.cancelChanges = function() {
  this.state = Handsontable.EditorState.FINISHED;
  this.discardEditor();
};
BaseEditor.prototype.discardEditor = function(result) {
  if (this.state !== Handsontable.EditorState.FINISHED) {
    return;
  }
  if (result === false && this.cellProperties.allowInvalid !== true) {
    this.instance.selectCell(this.row, this.col);
    this.focus();
    this.state = Handsontable.EditorState.EDITING;
    this._fireCallbacks(false);
  } else {
    this.close();
    this._opened = false;
    this.state = Handsontable.EditorState.VIRGIN;
    this._fireCallbacks(true);
  }
};
BaseEditor.prototype.isOpened = function() {
  return this._opened;
};
BaseEditor.prototype.isWaiting = function() {
  return this.state === Handsontable.EditorState.WAITING;
};


//# 
},{"./../3rdparty/walkontable/src/cellCoords.js":8,"./../helpers.js":49}],38:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  AutocompleteEditor: {get: function() {
      return AutocompleteEditor;
    }},
  __esModule: {value: true}
});
var $___46__46__47_helpers_46_js__,
    $___46__46__47_dom_46_js__,
    $___46__46__47_editors_46_js__,
    $__handsontableEditor_46_js__;
var helper = ($___46__46__47_helpers_46_js__ = require("./../helpers.js"), $___46__46__47_helpers_46_js__ && $___46__46__47_helpers_46_js__.__esModule && $___46__46__47_helpers_46_js__ || {default: $___46__46__47_helpers_46_js__});
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var $__0 = ($___46__46__47_editors_46_js__ = require("./../editors.js"), $___46__46__47_editors_46_js__ && $___46__46__47_editors_46_js__.__esModule && $___46__46__47_editors_46_js__ || {default: $___46__46__47_editors_46_js__}),
    getEditorConstructor = $__0.getEditorConstructor,
    registerEditor = $__0.registerEditor;
var HandsontableEditor = ($__handsontableEditor_46_js__ = require("./handsontableEditor.js"), $__handsontableEditor_46_js__ && $__handsontableEditor_46_js__.__esModule && $__handsontableEditor_46_js__ || {default: $__handsontableEditor_46_js__}).HandsontableEditor;
var AutocompleteEditor = HandsontableEditor.prototype.extend();
;
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.AutocompleteEditor = AutocompleteEditor;
AutocompleteEditor.prototype.init = function() {
  HandsontableEditor.prototype.init.apply(this, arguments);
  this.query = null;
  this.choices = [];
};
AutocompleteEditor.prototype.createElements = function() {
  HandsontableEditor.prototype.createElements.apply(this, arguments);
  dom.addClass(this.htContainer, 'autocompleteEditor');
  dom.addClass(this.htContainer, window.navigator.platform.indexOf('Mac') !== -1 ? 'htMacScroll' : '');
};
var skipOne = false;
function onBeforeKeyDown(event) {
  skipOne = false;
  var editor = this.getActiveEditor();
  var keyCodes = helper.keyCode;
  if (helper.isPrintableChar(event.keyCode) || event.keyCode === keyCodes.BACKSPACE || event.keyCode === keyCodes.DELETE || event.keyCode === keyCodes.INSERT) {
    var timeOffset = 0;
    if (event.keyCode === keyCodes.C && (event.ctrlKey || event.metaKey)) {
      return;
    }
    if (!editor.isOpened()) {
      timeOffset += 10;
    }
    editor.instance._registerTimeout(setTimeout(function() {
      editor.queryChoices(editor.TEXTAREA.value);
      skipOne = true;
    }, timeOffset));
  }
}
AutocompleteEditor.prototype.prepare = function() {
  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
  HandsontableEditor.prototype.prepare.apply(this, arguments);
};
AutocompleteEditor.prototype.open = function() {
  HandsontableEditor.prototype.open.apply(this, arguments);
  var choicesListHot = this.htEditor.getInstance();
  var that = this;
  this.TEXTAREA.style.visibility = 'visible';
  this.focus();
  choicesListHot.updateSettings({
    'colWidths': [dom.outerWidth(this.TEXTAREA) - 2],
    width: dom.outerWidth(this.TEXTAREA) + dom.getScrollbarWidth() + 2,
    afterRenderer: function(TD, row, col, prop, value) {
      var caseSensitive = this.getCellMeta(row, col).filteringCaseSensitive === true,
          indexOfMatch,
          match;
      if (value) {
        indexOfMatch = caseSensitive ? value.indexOf(this.query) : value.toLowerCase().indexOf(that.query.toLowerCase());
        if (indexOfMatch != -1) {
          match = value.substr(indexOfMatch, that.query.length);
          TD.innerHTML = value.replace(match, '<strong>' + match + '</strong>');
        }
      }
    }
  });
  this.htEditor.view.wt.wtTable.holder.parentNode.style['padding-right'] = dom.getScrollbarWidth() + 2 + 'px';
  if (skipOne) {
    skipOne = false;
  }
  that.instance._registerTimeout(setTimeout(function() {
    that.queryChoices(that.TEXTAREA.value);
  }, 0));
};
AutocompleteEditor.prototype.close = function() {
  HandsontableEditor.prototype.close.apply(this, arguments);
};
AutocompleteEditor.prototype.queryChoices = function(query) {
  this.query = query;
  if (typeof this.cellProperties.source == 'function') {
    var that = this;
    this.cellProperties.source(query, function(choices) {
      that.updateChoicesList(choices);
    });
  } else if (Array.isArray(this.cellProperties.source)) {
    var choices;
    if (!query || this.cellProperties.filter === false) {
      choices = this.cellProperties.source;
    } else {
      var filteringCaseSensitive = this.cellProperties.filteringCaseSensitive === true;
      var lowerCaseQuery = query.toLowerCase();
      choices = this.cellProperties.source.filter(function(choice) {
        if (filteringCaseSensitive) {
          return choice.indexOf(query) != -1;
        } else {
          return choice.toLowerCase().indexOf(lowerCaseQuery) != -1;
        }
      });
    }
    this.updateChoicesList(choices);
  } else {
    this.updateChoicesList([]);
  }
};
AutocompleteEditor.prototype.updateChoicesList = function(choices) {
  var pos = dom.getCaretPosition(this.TEXTAREA),
      endPos = dom.getSelectionEndPosition(this.TEXTAREA);
  var orderByRelevance = AutocompleteEditor.sortByRelevance(this.getValue(), choices, this.cellProperties.filteringCaseSensitive);
  var highlightIndex;
  if (this.cellProperties.filter != false) {
    var sorted = [];
    for (var i = 0,
        choicesCount = orderByRelevance.length; i < choicesCount; i++) {
      sorted.push(choices[orderByRelevance[i]]);
    }
    highlightIndex = 0;
    choices = sorted;
  } else {
    highlightIndex = orderByRelevance[0];
  }
  this.choices = choices;
  this.htEditor.loadData(helper.pivot([choices]));
  this.updateDropdownHeight();
  if (this.cellProperties.strict === true) {
    this.highlightBestMatchingChoice(highlightIndex);
  }
  this.instance.listen();
  this.TEXTAREA.focus();
  dom.setCaretPosition(this.TEXTAREA, pos, (pos != endPos ? endPos : void 0));
};
AutocompleteEditor.prototype.updateDropdownHeight = function() {
  this.htEditor.updateSettings({height: this.getDropdownHeight()});
  this.htEditor.view.wt.wtTable.alignOverlaysWithTrimmingContainer();
};
AutocompleteEditor.prototype.finishEditing = function(restoreOriginalValue) {
  if (!restoreOriginalValue) {
    this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
  }
  HandsontableEditor.prototype.finishEditing.apply(this, arguments);
};
AutocompleteEditor.prototype.highlightBestMatchingChoice = function(index) {
  if (typeof index === "number") {
    this.htEditor.selectCell(index, 0);
  } else {
    this.htEditor.deselectCell();
  }
};
AutocompleteEditor.sortByRelevance = function(value, choices, caseSensitive) {
  var choicesRelevance = [],
      currentItem,
      valueLength = value.length,
      valueIndex,
      charsLeft,
      result = [],
      i,
      choicesCount;
  if (valueLength === 0) {
    for (i = 0, choicesCount = choices.length; i < choicesCount; i++) {
      result.push(i);
    }
    return result;
  }
  for (i = 0, choicesCount = choices.length; i < choicesCount; i++) {
    currentItem = choices[i];
    if (caseSensitive) {
      valueIndex = currentItem.indexOf(value);
    } else {
      valueIndex = currentItem.toLowerCase().indexOf(value.toLowerCase());
    }
    if (valueIndex == -1) {
      continue;
    }
    charsLeft = currentItem.length - valueIndex - valueLength;
    choicesRelevance.push({
      baseIndex: i,
      index: valueIndex,
      charsLeft: charsLeft,
      value: currentItem
    });
  }
  choicesRelevance.sort(function(a, b) {
    if (b.index === -1) {
      return -1;
    }
    if (a.index === -1) {
      return 1;
    }
    if (a.index < b.index) {
      return -1;
    } else if (b.index < a.index) {
      return 1;
    } else if (a.index === b.index) {
      if (a.charsLeft < b.charsLeft) {
        return -1;
      } else if (a.charsLeft > b.charsLeft) {
        return 1;
      } else {
        return 0;
      }
    }
  });
  for (i = 0, choicesCount = choicesRelevance.length; i < choicesCount; i++) {
    result.push(choicesRelevance[i].baseIndex);
  }
  return result;
};
AutocompleteEditor.prototype.getDropdownHeight = function() {
  var firstRowHeight = this.htEditor.getInstance().getRowHeight(0) || 23;
  return this.choices.length >= 10 ? 10 * firstRowHeight : this.choices.length * firstRowHeight + 8;
};
registerEditor('autocomplete', AutocompleteEditor);


//# 
},{"./../dom.js":34,"./../editors.js":36,"./../helpers.js":49,"./handsontableEditor.js":42}],39:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  CheckboxEditor: {get: function() {
      return CheckboxEditor;
    }},
  __esModule: {value: true}
});
var $___46__46__47_editors_46_js__,
    $___95_baseEditor_46_js__;
var registerEditor = ($___46__46__47_editors_46_js__ = require("./../editors.js"), $___46__46__47_editors_46_js__ && $___46__46__47_editors_46_js__.__esModule && $___46__46__47_editors_46_js__ || {default: $___46__46__47_editors_46_js__}).registerEditor;
var BaseEditor = ($___95_baseEditor_46_js__ = require("./_baseEditor.js"), $___95_baseEditor_46_js__ && $___95_baseEditor_46_js__.__esModule && $___95_baseEditor_46_js__ || {default: $___95_baseEditor_46_js__}).BaseEditor;
var CheckboxEditor = BaseEditor.prototype.extend();
;
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.CheckboxEditor = CheckboxEditor;
CheckboxEditor.prototype.beginEditing = function() {
  var checkbox = this.TD.querySelector('input[type="checkbox"]');
  if (checkbox) {
    checkbox.click();
  }
};
CheckboxEditor.prototype.finishEditing = function() {};
CheckboxEditor.prototype.init = function() {};
CheckboxEditor.prototype.open = function() {};
CheckboxEditor.prototype.close = function() {};
CheckboxEditor.prototype.getValue = function() {};
CheckboxEditor.prototype.setValue = function() {};
CheckboxEditor.prototype.focus = function() {};
registerEditor('checkbox', CheckboxEditor);


//# 
},{"./../editors.js":36,"./_baseEditor.js":37}],40:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  DateEditor: {get: function() {
      return DateEditor;
    }},
  __esModule: {value: true}
});
var $___46__46__47_helpers_46_js__,
    $___46__46__47_dom_46_js__,
    $___46__46__47_editors_46_js__,
    $__textEditor_46_js__,
    $___46__46__47_eventManager_46_js__,
    $__moment__,
    $__pikaday__;
var helper = ($___46__46__47_helpers_46_js__ = require("./../helpers.js"), $___46__46__47_helpers_46_js__ && $___46__46__47_helpers_46_js__.__esModule && $___46__46__47_helpers_46_js__ || {default: $___46__46__47_helpers_46_js__});
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var $__0 = ($___46__46__47_editors_46_js__ = require("./../editors.js"), $___46__46__47_editors_46_js__ && $___46__46__47_editors_46_js__.__esModule && $___46__46__47_editors_46_js__ || {default: $___46__46__47_editors_46_js__}),
    getEditor = $__0.getEditor,
    registerEditor = $__0.registerEditor;
var TextEditor = ($__textEditor_46_js__ = require("./textEditor.js"), $__textEditor_46_js__ && $__textEditor_46_js__.__esModule && $__textEditor_46_js__ || {default: $__textEditor_46_js__}).TextEditor;
var eventManagerObject = ($___46__46__47_eventManager_46_js__ = require("./../eventManager.js"), $___46__46__47_eventManager_46_js__ && $___46__46__47_eventManager_46_js__.__esModule && $___46__46__47_eventManager_46_js__ || {default: $___46__46__47_eventManager_46_js__}).eventManager;
var moment = ($__moment__ = require("moment"), $__moment__ && $__moment__.__esModule && $__moment__ || {default: $__moment__}).default;
var Pikaday = ($__pikaday__ = require("pikaday"), $__pikaday__ && $__pikaday__.__esModule && $__pikaday__ || {default: $__pikaday__}).default;
var DateEditor = TextEditor.prototype.extend();
;
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.DateEditor = DateEditor;
DateEditor.prototype.init = function() {
  if (typeof moment !== 'function') {
    throw new Error("You need to include moment.js to your project.");
  }
  if (typeof Pikaday !== 'function') {
    throw new Error("You need to include Pikaday to your project.");
  }
  TextEditor.prototype.init.apply(this, arguments);
  this.isCellEdited = false;
  var that = this;
  this.instance.addHook('afterDestroy', function() {
    that.parentDestroyed = true;
    that.destroyElements();
  });
};
DateEditor.prototype.createElements = function() {
  var that = this;
  TextEditor.prototype.createElements.apply(this, arguments);
  this.defaultDateFormat = 'DD/MM/YYYY';
  this.datePicker = document.createElement('DIV');
  this.datePickerStyle = this.datePicker.style;
  this.datePickerStyle.position = 'absolute';
  this.datePickerStyle.top = 0;
  this.datePickerStyle.left = 0;
  this.datePickerStyle.zIndex = 9999;
  dom.addClass(this.datePicker, 'htDatepickerHolder');
  document.body.appendChild(this.datePicker);
  var htInput = this.TEXTAREA;
  var defaultOptions = {
    format: that.defaultDateFormat,
    field: htInput,
    trigger: htInput,
    container: that.datePicker,
    reposition: false,
    bound: false,
    onSelect: function(dateStr) {
      if (!isNaN(dateStr.getTime())) {
        dateStr = moment(dateStr).format(that.cellProperties.dateFormat || that.defaultDateFormat);
      }
      that.setValue(dateStr);
      that.hideDatepicker();
    },
    onClose: function() {
      if (!that.parentDestroyed) {
        that.finishEditing(false);
      }
    }
  };
  this.$datePicker = new Pikaday(defaultOptions);
  var eventManager = eventManagerObject(this);
  eventManager.addEventListener(this.datePicker, 'mousedown', function(event) {
    helper.stopPropagation(event);
  });
  this.hideDatepicker();
};
DateEditor.prototype.destroyElements = function() {
  this.$datePicker.destroy();
};
DateEditor.prototype.prepare = function() {
  this._opened = false;
  TextEditor.prototype.prepare.apply(this, arguments);
};
DateEditor.prototype.open = function(event) {
  TextEditor.prototype.open.call(this);
  this.showDatepicker(event);
};
DateEditor.prototype.close = function() {
  var that = this;
  this._opened = false;
  this.instance._registerTimeout(setTimeout(function() {
    that.instance.selection.refreshBorders();
  }, 0));
  TextEditor.prototype.close.apply(this, arguments);
};
DateEditor.prototype.finishEditing = function(isCancelled, ctrlDown) {
  if (isCancelled) {
    var value = this.originalValue;
    if (value !== void 0) {
      this.setValue(value);
    }
  }
  this.hideDatepicker();
  TextEditor.prototype.finishEditing.apply(this, arguments);
};
DateEditor.prototype.showDatepicker = function(event) {
  var offset = this.TD.getBoundingClientRect(),
      dateFormat = this.cellProperties.dateFormat || this.defaultDateFormat,
      datePickerConfig = this.$datePicker.config(),
      dateStr,
      isMouseDown = this.instance.view.isMouseDown(),
      isMeta = event ? helper.isMetaKey(event.keyCode) : false;
  this.datePickerStyle.top = (window.pageYOffset + offset.top + dom.outerHeight(this.TD)) + 'px';
  this.datePickerStyle.left = (window.pageXOffset + offset.left) + 'px';
  this.$datePicker._onInputFocus = function() {};
  datePickerConfig.format = dateFormat;
  if (this.originalValue) {
    dateStr = this.originalValue;
    if (moment(dateStr, dateFormat, true).isValid()) {
      this.$datePicker.setMoment(moment(dateStr, dateFormat), true);
    }
    if (!isMeta) {
      if (!isMouseDown) {
        this.setValue('');
      }
    }
  } else {
    if (this.cellProperties.defaultDate) {
      dateStr = this.cellProperties.defaultDate;
      datePickerConfig.defaultDate = dateStr;
      if (moment(dateStr, dateFormat, true).isValid()) {
        this.$datePicker.setMoment(moment(dateStr, dateFormat), true);
      }
      if (!isMeta) {
        if (!isMouseDown) {
          this.setValue('');
        }
      }
    }
  }
  this.datePickerStyle.display = 'block';
  this.$datePicker.show();
};
DateEditor.prototype.hideDatepicker = function() {
  this.datePickerStyle.display = 'none';
  this.$datePicker.hide();
};
registerEditor('date', DateEditor);


//# 
},{"./../dom.js":34,"./../editors.js":36,"./../eventManager.js":48,"./../helpers.js":49,"./textEditor.js":47,"moment":"moment","pikaday":"pikaday"}],41:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  DropdownEditor: {get: function() {
      return DropdownEditor;
    }},
  __esModule: {value: true}
});
var $___46__46__47_editors_46_js__,
    $__autocompleteEditor_46_js__;
var $__0 = ($___46__46__47_editors_46_js__ = require("./../editors.js"), $___46__46__47_editors_46_js__ && $___46__46__47_editors_46_js__.__esModule && $___46__46__47_editors_46_js__ || {default: $___46__46__47_editors_46_js__}),
    getEditor = $__0.getEditor,
    registerEditor = $__0.registerEditor;
var AutocompleteEditor = ($__autocompleteEditor_46_js__ = require("./autocompleteEditor.js"), $__autocompleteEditor_46_js__ && $__autocompleteEditor_46_js__.__esModule && $__autocompleteEditor_46_js__ || {default: $__autocompleteEditor_46_js__}).AutocompleteEditor;
var DropdownEditor = AutocompleteEditor.prototype.extend();
;
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.DropdownEditor = DropdownEditor;
DropdownEditor.prototype.prepare = function() {
  AutocompleteEditor.prototype.prepare.apply(this, arguments);
  this.cellProperties.filter = false;
  this.cellProperties.strict = true;
};
registerEditor('dropdown', DropdownEditor);


//# 
},{"./../editors.js":36,"./autocompleteEditor.js":38}],42:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  HandsontableEditor: {get: function() {
      return HandsontableEditor;
    }},
  __esModule: {value: true}
});
var $___46__46__47_helpers_46_js__,
    $___46__46__47_dom_46_js__,
    $___46__46__47_editors_46_js__,
    $__textEditor_46_js__;
var helper = ($___46__46__47_helpers_46_js__ = require("./../helpers.js"), $___46__46__47_helpers_46_js__ && $___46__46__47_helpers_46_js__.__esModule && $___46__46__47_helpers_46_js__ || {default: $___46__46__47_helpers_46_js__});
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var $__0 = ($___46__46__47_editors_46_js__ = require("./../editors.js"), $___46__46__47_editors_46_js__ && $___46__46__47_editors_46_js__.__esModule && $___46__46__47_editors_46_js__ || {default: $___46__46__47_editors_46_js__}),
    getEditor = $__0.getEditor,
    registerEditor = $__0.registerEditor;
var TextEditor = ($__textEditor_46_js__ = require("./textEditor.js"), $__textEditor_46_js__ && $__textEditor_46_js__.__esModule && $__textEditor_46_js__ || {default: $__textEditor_46_js__}).TextEditor;
var HandsontableEditor = TextEditor.prototype.extend();
;
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.HandsontableEditor = HandsontableEditor;
HandsontableEditor.prototype.createElements = function() {
  TextEditor.prototype.createElements.apply(this, arguments);
  var DIV = document.createElement('DIV');
  DIV.className = 'handsontableEditor';
  this.TEXTAREA_PARENT.appendChild(DIV);
  this.htContainer = DIV;
  this.htEditor = new Handsontable(DIV);
  this.assignHooks();
};
HandsontableEditor.prototype.prepare = function(td, row, col, prop, value, cellProperties) {
  TextEditor.prototype.prepare.apply(this, arguments);
  var parent = this;
  var options = {
    startRows: 0,
    startCols: 0,
    minRows: 0,
    minCols: 0,
    className: 'listbox',
    copyPaste: false,
    cells: function() {
      return {readOnly: true};
    },
    fillHandle: false,
    afterOnCellMouseDown: function() {
      var value = this.getValue();
      if (value !== void 0) {
        parent.setValue(value);
      }
      parent.instance.destroyEditor();
    }
  };
  if (this.cellProperties.handsontable) {
    helper.extend(options, cellProperties.handsontable);
  }
  if (this.htEditor) {
    this.htEditor.destroy();
  }
  this.htEditor = new Handsontable(this.htContainer, options);
};
var onBeforeKeyDown = function(event) {
  if (event != null && event.isImmediatePropagationEnabled == null) {
    event.stopImmediatePropagation = function() {
      this.isImmediatePropagationEnabled = false;
      this.cancelBubble = true;
    };
    event.isImmediatePropagationEnabled = true;
    event.isImmediatePropagationStopped = function() {
      return !this.isImmediatePropagationEnabled;
    };
  }
  if (event.isImmediatePropagationStopped()) {
    return;
  }
  var editor = this.getActiveEditor();
  var innerHOT = editor.htEditor.getInstance();
  var rowToSelect;
  if (event.keyCode == helper.keyCode.ARROW_DOWN) {
    if (!innerHOT.getSelected()) {
      rowToSelect = 0;
    } else {
      var selectedRow = innerHOT.getSelected()[0];
      var lastRow = innerHOT.countRows() - 1;
      rowToSelect = Math.min(lastRow, selectedRow + 1);
    }
  } else if (event.keyCode == helper.keyCode.ARROW_UP) {
    if (innerHOT.getSelected()) {
      var selectedRow = innerHOT.getSelected()[0];
      rowToSelect = selectedRow - 1;
    }
  }
  if (rowToSelect !== void 0) {
    if (rowToSelect < 0) {
      innerHOT.deselectCell();
    } else {
      innerHOT.selectCell(rowToSelect, 0);
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    editor.instance.listen();
    editor.TEXTAREA.focus();
  }
};
HandsontableEditor.prototype.open = function() {
  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
  TextEditor.prototype.open.apply(this, arguments);
  this.htEditor.render();
  if (this.cellProperties.strict) {
    this.htEditor.selectCell(0, 0);
    this.TEXTAREA.style.visibility = 'hidden';
  } else {
    this.htEditor.deselectCell();
    this.TEXTAREA.style.visibility = 'visible';
  }
  dom.setCaretPosition(this.TEXTAREA, 0, this.TEXTAREA.value.length);
};
HandsontableEditor.prototype.close = function() {
  this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
  this.instance.listen();
  TextEditor.prototype.close.apply(this, arguments);
};
HandsontableEditor.prototype.focus = function() {
  this.instance.listen();
  TextEditor.prototype.focus.apply(this, arguments);
};
HandsontableEditor.prototype.beginEditing = function(initialValue) {
  var onBeginEditing = this.instance.getSettings().onBeginEditing;
  if (onBeginEditing && onBeginEditing() === false) {
    return;
  }
  TextEditor.prototype.beginEditing.apply(this, arguments);
};
HandsontableEditor.prototype.finishEditing = function(isCancelled, ctrlDown) {
  if (this.htEditor.isListening()) {
    this.instance.listen();
  }
  if (this.htEditor.getSelected()) {
    var value = this.htEditor.getInstance().getValue();
    if (value !== void 0) {
      this.setValue(value);
    }
  }
  return TextEditor.prototype.finishEditing.apply(this, arguments);
};
HandsontableEditor.prototype.assignHooks = function() {
  var _this = this;
  this.instance.addHook('afterDestroy', function() {
    if (_this.htEditor) {
      _this.htEditor.destroy();
    }
  });
};
registerEditor('handsontable', HandsontableEditor);


//# 
},{"./../dom.js":34,"./../editors.js":36,"./../helpers.js":49,"./textEditor.js":47}],43:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  MobileTextEditor: {get: function() {
      return MobileTextEditor;
    }},
  __esModule: {value: true}
});
var $___46__46__47_helpers_46_js__,
    $___46__46__47_dom_46_js__,
    $___46__46__47_editors_46_js__,
    $___95_baseEditor_46_js__,
    $___46__46__47_eventManager_46_js__;
var helper = ($___46__46__47_helpers_46_js__ = require("./../helpers.js"), $___46__46__47_helpers_46_js__ && $___46__46__47_helpers_46_js__.__esModule && $___46__46__47_helpers_46_js__ || {default: $___46__46__47_helpers_46_js__});
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var $__0 = ($___46__46__47_editors_46_js__ = require("./../editors.js"), $___46__46__47_editors_46_js__ && $___46__46__47_editors_46_js__.__esModule && $___46__46__47_editors_46_js__ || {default: $___46__46__47_editors_46_js__}),
    getEditor = $__0.getEditor,
    registerEditor = $__0.registerEditor;
var BaseEditor = ($___95_baseEditor_46_js__ = require("./_baseEditor.js"), $___95_baseEditor_46_js__ && $___95_baseEditor_46_js__.__esModule && $___95_baseEditor_46_js__ || {default: $___95_baseEditor_46_js__}).BaseEditor;
var eventManagerObject = ($___46__46__47_eventManager_46_js__ = require("./../eventManager.js"), $___46__46__47_eventManager_46_js__ && $___46__46__47_eventManager_46_js__.__esModule && $___46__46__47_eventManager_46_js__ || {default: $___46__46__47_eventManager_46_js__}).eventManager;
var MobileTextEditor = BaseEditor.prototype.extend(),
    domDimensionsCache = {};
;
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.MobileTextEditor = MobileTextEditor;
var createControls = function() {
  this.controls = {};
  this.controls.leftButton = document.createElement('DIV');
  this.controls.leftButton.className = 'leftButton';
  this.controls.rightButton = document.createElement('DIV');
  this.controls.rightButton.className = 'rightButton';
  this.controls.upButton = document.createElement('DIV');
  this.controls.upButton.className = 'upButton';
  this.controls.downButton = document.createElement('DIV');
  this.controls.downButton.className = 'downButton';
  for (var button in this.controls) {
    if (this.controls.hasOwnProperty(button)) {
      this.positionControls.appendChild(this.controls[button]);
    }
  }
};
MobileTextEditor.prototype.valueChanged = function() {
  return this.initValue != this.getValue();
};
MobileTextEditor.prototype.init = function() {
  var that = this;
  this.eventManager = eventManagerObject(this.instance);
  this.createElements();
  this.bindEvents();
  this.instance.addHook('afterDestroy', function() {
    that.destroy();
  });
};
MobileTextEditor.prototype.getValue = function() {
  return this.TEXTAREA.value;
};
MobileTextEditor.prototype.setValue = function(newValue) {
  this.initValue = newValue;
  this.TEXTAREA.value = newValue;
};
MobileTextEditor.prototype.createElements = function() {
  this.editorContainer = document.createElement('DIV');
  this.editorContainer.className = "htMobileEditorContainer";
  this.cellPointer = document.createElement('DIV');
  this.cellPointer.className = "cellPointer";
  this.moveHandle = document.createElement('DIV');
  this.moveHandle.className = "moveHandle";
  this.inputPane = document.createElement('DIV');
  this.inputPane.className = "inputs";
  this.positionControls = document.createElement('DIV');
  this.positionControls.className = "positionControls";
  this.TEXTAREA = document.createElement('TEXTAREA');
  dom.addClass(this.TEXTAREA, 'handsontableInput');
  this.inputPane.appendChild(this.TEXTAREA);
  this.editorContainer.appendChild(this.cellPointer);
  this.editorContainer.appendChild(this.moveHandle);
  this.editorContainer.appendChild(this.inputPane);
  this.editorContainer.appendChild(this.positionControls);
  createControls.call(this);
  document.body.appendChild(this.editorContainer);
};
MobileTextEditor.prototype.onBeforeKeyDown = function(event) {
  var instance = this;
  var that = instance.getActiveEditor();
  dom.enableImmediatePropagation(event);
  if (event.target !== that.TEXTAREA || event.isImmediatePropagationStopped()) {
    return;
  }
  var keyCodes = helper.keyCode;
  switch (event.keyCode) {
    case keyCodes.ENTER:
      that.close();
      event.preventDefault();
      break;
    case keyCodes.BACKSPACE:
      event.stopImmediatePropagation();
      break;
  }
};
MobileTextEditor.prototype.open = function() {
  this.instance.addHook('beforeKeyDown', this.onBeforeKeyDown);
  dom.addClass(this.editorContainer, 'active');
  dom.removeClass(this.cellPointer, 'hidden');
  this.updateEditorPosition();
};
MobileTextEditor.prototype.focus = function() {
  this.TEXTAREA.focus();
  dom.setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
};
MobileTextEditor.prototype.close = function() {
  this.TEXTAREA.blur();
  this.instance.removeHook('beforeKeyDown', this.onBeforeKeyDown);
  dom.removeClass(this.editorContainer, 'active');
};
MobileTextEditor.prototype.scrollToView = function() {
  var coords = this.instance.getSelectedRange().highlight;
  this.instance.view.scrollViewport(coords);
};
MobileTextEditor.prototype.hideCellPointer = function() {
  if (!dom.hasClass(this.cellPointer, 'hidden')) {
    dom.addClass(this.cellPointer, 'hidden');
  }
};
MobileTextEditor.prototype.updateEditorPosition = function(x, y) {
  if (x && y) {
    x = parseInt(x, 10);
    y = parseInt(y, 10);
    this.editorContainer.style.top = y + "px";
    this.editorContainer.style.left = x + "px";
  } else {
    var selection = this.instance.getSelected(),
        selectedCell = this.instance.getCell(selection[0], selection[1]);
    if (!domDimensionsCache.cellPointer) {
      domDimensionsCache.cellPointer = {
        height: dom.outerHeight(this.cellPointer),
        width: dom.outerWidth(this.cellPointer)
      };
    }
    if (!domDimensionsCache.editorContainer) {
      domDimensionsCache.editorContainer = {width: dom.outerWidth(this.editorContainer)};
    }
    if (selectedCell !== undefined) {
      var scrollLeft = this.instance.view.wt.wtOverlays.leftOverlay.trimmingContainer == window ? 0 : dom.getScrollLeft(this.instance.view.wt.wtOverlays.leftOverlay.holder);
      var scrollTop = this.instance.view.wt.wtOverlays.topOverlay.trimmingContainer == window ? 0 : dom.getScrollTop(this.instance.view.wt.wtOverlays.topOverlay.holder);
      var selectedCellOffset = dom.offset(selectedCell),
          selectedCellWidth = dom.outerWidth(selectedCell),
          currentScrollPosition = {
            x: scrollLeft,
            y: scrollTop
          };
      this.editorContainer.style.top = parseInt(selectedCellOffset.top + dom.outerHeight(selectedCell) - currentScrollPosition.y + domDimensionsCache.cellPointer.height, 10) + "px";
      this.editorContainer.style.left = parseInt((window.innerWidth / 2) - (domDimensionsCache.editorContainer.width / 2), 10) + "px";
      if (selectedCellOffset.left + selectedCellWidth / 2 > parseInt(this.editorContainer.style.left, 10) + domDimensionsCache.editorContainer.width) {
        this.editorContainer.style.left = window.innerWidth - domDimensionsCache.editorContainer.width + "px";
      } else if (selectedCellOffset.left + selectedCellWidth / 2 < parseInt(this.editorContainer.style.left, 10) + 20) {
        this.editorContainer.style.left = 0 + "px";
      }
      this.cellPointer.style.left = parseInt(selectedCellOffset.left - (domDimensionsCache.cellPointer.width / 2) - dom.offset(this.editorContainer).left + (selectedCellWidth / 2) - currentScrollPosition.x, 10) + "px";
    }
  }
};
MobileTextEditor.prototype.updateEditorData = function() {
  var selected = this.instance.getSelected(),
      selectedValue = this.instance.getDataAtCell(selected[0], selected[1]);
  this.row = selected[0];
  this.col = selected[1];
  this.setValue(selectedValue);
  this.updateEditorPosition();
};
MobileTextEditor.prototype.prepareAndSave = function() {
  var val;
  if (!this.valueChanged()) {
    return true;
  }
  if (this.instance.getSettings().trimWhitespace) {
    val = [[String.prototype.trim.call(this.getValue())]];
  } else {
    val = [[this.getValue()]];
  }
  this.saveValue(val);
};
MobileTextEditor.prototype.bindEvents = function() {
  var that = this;
  this.eventManager.addEventListener(this.controls.leftButton, "touchend", function(event) {
    that.prepareAndSave();
    that.instance.selection.transformStart(0, -1, null, true);
    that.updateEditorData();
    event.preventDefault();
  });
  this.eventManager.addEventListener(this.controls.rightButton, "touchend", function(event) {
    that.prepareAndSave();
    that.instance.selection.transformStart(0, 1, null, true);
    that.updateEditorData();
    event.preventDefault();
  });
  this.eventManager.addEventListener(this.controls.upButton, "touchend", function(event) {
    that.prepareAndSave();
    that.instance.selection.transformStart(-1, 0, null, true);
    that.updateEditorData();
    event.preventDefault();
  });
  this.eventManager.addEventListener(this.controls.downButton, "touchend", function(event) {
    that.prepareAndSave();
    that.instance.selection.transformStart(1, 0, null, true);
    that.updateEditorData();
    event.preventDefault();
  });
  this.eventManager.addEventListener(this.moveHandle, "touchstart", function(event) {
    if (event.touches.length == 1) {
      var touch = event.touches[0],
          onTouchPosition = {
            x: that.editorContainer.offsetLeft,
            y: that.editorContainer.offsetTop
          },
          onTouchOffset = {
            x: touch.pageX - onTouchPosition.x,
            y: touch.pageY - onTouchPosition.y
          };
      that.eventManager.addEventListener(this, "touchmove", function(event) {
        var touch = event.touches[0];
        that.updateEditorPosition(touch.pageX - onTouchOffset.x, touch.pageY - onTouchOffset.y);
        that.hideCellPointer();
        event.preventDefault();
      });
    }
  });
  this.eventManager.addEventListener(document.body, "touchend", function(event) {
    if (!dom.isChildOf(event.target, that.editorContainer) && !dom.isChildOf(event.target, that.instance.rootElement)) {
      that.close();
    }
  });
  this.eventManager.addEventListener(this.instance.view.wt.wtOverlays.leftOverlay.holder, "scroll", function(event) {
    if (that.instance.view.wt.wtOverlays.leftOverlay.trimmingContainer != window) {
      that.hideCellPointer();
    }
  });
  this.eventManager.addEventListener(this.instance.view.wt.wtOverlays.topOverlay.holder, "scroll", function(event) {
    if (that.instance.view.wt.wtOverlays.topOverlay.trimmingContainer != window) {
      that.hideCellPointer();
    }
  });
};
MobileTextEditor.prototype.destroy = function() {
  this.eventManager.clear();
  this.editorContainer.parentNode.removeChild(this.editorContainer);
};
registerEditor('mobile', MobileTextEditor);


//# 
},{"./../dom.js":34,"./../editors.js":36,"./../eventManager.js":48,"./../helpers.js":49,"./_baseEditor.js":37}],44:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  NumericEditor: {get: function() {
      return NumericEditor;
    }},
  __esModule: {value: true}
});
var $__numeral__,
    $___46__46__47_editors_46_js__,
    $__textEditor_46_js__;
var numeral = ($__numeral__ = require("numeral"), $__numeral__ && $__numeral__.__esModule && $__numeral__ || {default: $__numeral__}).default;
var $__1 = ($___46__46__47_editors_46_js__ = require("./../editors.js"), $___46__46__47_editors_46_js__ && $___46__46__47_editors_46_js__.__esModule && $___46__46__47_editors_46_js__ || {default: $___46__46__47_editors_46_js__}),
    getEditor = $__1.getEditor,
    registerEditor = $__1.registerEditor;
var TextEditor = ($__textEditor_46_js__ = require("./textEditor.js"), $__textEditor_46_js__ && $__textEditor_46_js__.__esModule && $__textEditor_46_js__ || {default: $__textEditor_46_js__}).TextEditor;
var NumericEditor = TextEditor.prototype.extend();
;
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.NumericEditor = NumericEditor;
NumericEditor.prototype.beginEditing = function(initialValue) {
  var BaseEditor = TextEditor.prototype;
  if (typeof(initialValue) === 'undefined' && this.originalValue) {
    var value = '' + this.originalValue;
    if (typeof this.cellProperties.language !== 'undefined') {
      numeral.language(this.cellProperties.language);
    }
    var decimalDelimiter = numeral.languageData().delimiters.decimal;
    value = value.replace('.', decimalDelimiter);
    BaseEditor.beginEditing.apply(this, [value]);
  } else {
    BaseEditor.beginEditing.apply(this, arguments);
  }
};
registerEditor('numeric', NumericEditor);


//# 
},{"./../editors.js":36,"./textEditor.js":47,"numeral":"numeral"}],45:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  PasswordEditor: {get: function() {
      return PasswordEditor;
    }},
  __esModule: {value: true}
});
var $___46__46__47_dom_46_js__,
    $___46__46__47_editors_46_js__,
    $__textEditor_46_js__;
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var $__0 = ($___46__46__47_editors_46_js__ = require("./../editors.js"), $___46__46__47_editors_46_js__ && $___46__46__47_editors_46_js__.__esModule && $___46__46__47_editors_46_js__ || {default: $___46__46__47_editors_46_js__}),
    getEditor = $__0.getEditor,
    registerEditor = $__0.registerEditor;
var TextEditor = ($__textEditor_46_js__ = require("./textEditor.js"), $__textEditor_46_js__ && $__textEditor_46_js__.__esModule && $__textEditor_46_js__ || {default: $__textEditor_46_js__}).TextEditor;
var PasswordEditor = TextEditor.prototype.extend();
;
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.PasswordEditor = PasswordEditor;
PasswordEditor.prototype.createElements = function() {
  TextEditor.prototype.createElements.apply(this, arguments);
  this.TEXTAREA = document.createElement('input');
  this.TEXTAREA.setAttribute('type', 'password');
  this.TEXTAREA.className = 'handsontableInput';
  this.textareaStyle = this.TEXTAREA.style;
  this.textareaStyle.width = 0;
  this.textareaStyle.height = 0;
  dom.empty(this.TEXTAREA_PARENT);
  this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
};
registerEditor('password', PasswordEditor);


//# 
},{"./../dom.js":34,"./../editors.js":36,"./textEditor.js":47}],46:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  SelectEditor: {get: function() {
      return SelectEditor;
    }},
  __esModule: {value: true}
});
var $___46__46__47_dom_46_js__,
    $___46__46__47_helpers_46_js__,
    $___46__46__47_editors_46_js__,
    $___95_baseEditor_46_js__;
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var helper = ($___46__46__47_helpers_46_js__ = require("./../helpers.js"), $___46__46__47_helpers_46_js__ && $___46__46__47_helpers_46_js__.__esModule && $___46__46__47_helpers_46_js__ || {default: $___46__46__47_helpers_46_js__});
var $__0 = ($___46__46__47_editors_46_js__ = require("./../editors.js"), $___46__46__47_editors_46_js__ && $___46__46__47_editors_46_js__.__esModule && $___46__46__47_editors_46_js__ || {default: $___46__46__47_editors_46_js__}),
    getEditor = $__0.getEditor,
    registerEditor = $__0.registerEditor;
var BaseEditor = ($___95_baseEditor_46_js__ = require("./_baseEditor.js"), $___95_baseEditor_46_js__ && $___95_baseEditor_46_js__.__esModule && $___95_baseEditor_46_js__ || {default: $___95_baseEditor_46_js__}).BaseEditor;
var SelectEditor = BaseEditor.prototype.extend();
;
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.SelectEditor = SelectEditor;
SelectEditor.prototype.init = function() {
  this.select = document.createElement('SELECT');
  dom.addClass(this.select, 'htSelectEditor');
  this.select.style.display = 'none';
  this.instance.rootElement.appendChild(this.select);
};
SelectEditor.prototype.prepare = function() {
  BaseEditor.prototype.prepare.apply(this, arguments);
  var selectOptions = this.cellProperties.selectOptions;
  var options;
  if (typeof selectOptions == 'function') {
    options = this.prepareOptions(selectOptions(this.row, this.col, this.prop));
  } else {
    options = this.prepareOptions(selectOptions);
  }
  dom.empty(this.select);
  for (var option in options) {
    if (options.hasOwnProperty(option)) {
      var optionElement = document.createElement('OPTION');
      optionElement.value = option;
      dom.fastInnerHTML(optionElement, options[option]);
      this.select.appendChild(optionElement);
    }
  }
};
SelectEditor.prototype.prepareOptions = function(optionsToPrepare) {
  var preparedOptions = {};
  if (Array.isArray(optionsToPrepare)) {
    for (var i = 0,
        len = optionsToPrepare.length; i < len; i++) {
      preparedOptions[optionsToPrepare[i]] = optionsToPrepare[i];
    }
  } else if (typeof optionsToPrepare == 'object') {
    preparedOptions = optionsToPrepare;
  }
  return preparedOptions;
};
SelectEditor.prototype.getValue = function() {
  return this.select.value;
};
SelectEditor.prototype.setValue = function(value) {
  this.select.value = value;
};
var onBeforeKeyDown = function(event) {
  var instance = this;
  var editor = instance.getActiveEditor();
  if (event != null && event.isImmediatePropagationEnabled == null) {
    event.stopImmediatePropagation = function() {
      this.isImmediatePropagationEnabled = false;
    };
    event.isImmediatePropagationEnabled = true;
    event.isImmediatePropagationStopped = function() {
      return !this.isImmediatePropagationEnabled;
    };
  }
  switch (event.keyCode) {
    case helper.keyCode.ARROW_UP:
      var previousOptionIndex = editor.select.selectedIndex - 1;
      if (previousOptionIndex >= 0) {
        editor.select[previousOptionIndex].selected = true;
      }
      event.stopImmediatePropagation();
      event.preventDefault();
      break;
    case helper.keyCode.ARROW_DOWN:
      var nextOptionIndex = editor.select.selectedIndex + 1;
      if (nextOptionIndex <= editor.select.length - 1) {
        editor.select[nextOptionIndex].selected = true;
      }
      event.stopImmediatePropagation();
      event.preventDefault();
      break;
  }
};
SelectEditor.prototype.checkEditorSection = function() {
  if (this.row < this.instance.getSettings().fixedRowsTop) {
    if (this.col < this.instance.getSettings().fixedColumnsLeft) {
      return 'corner';
    } else {
      return 'top';
    }
  } else {
    if (this.col < this.instance.getSettings().fixedColumnsLeft) {
      return 'left';
    }
  }
};
SelectEditor.prototype.open = function() {
  var width = dom.outerWidth(this.TD);
  var height = dom.outerHeight(this.TD);
  var rootOffset = dom.offset(this.instance.rootElement);
  var tdOffset = dom.offset(this.TD);
  var editorSection = this.checkEditorSection();
  var cssTransformOffset;
  switch (editorSection) {
    case 'top':
      cssTransformOffset = dom.getCssTransform(this.instance.view.wt.wtOverlays.topOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'left':
      cssTransformOffset = dom.getCssTransform(this.instance.view.wt.wtOverlays.leftOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'corner':
      cssTransformOffset = dom.getCssTransform(this.instance.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder.parentNode);
      break;
  }
  var selectStyle = this.select.style;
  if (cssTransformOffset && cssTransformOffset != -1) {
    selectStyle[cssTransformOffset[0]] = cssTransformOffset[1];
  } else {
    dom.resetCssTransform(this.select);
  }
  selectStyle.height = height + 'px';
  selectStyle.minWidth = width + 'px';
  selectStyle.top = tdOffset.top - rootOffset.top + 'px';
  selectStyle.left = tdOffset.left - rootOffset.left + 'px';
  selectStyle.margin = '0px';
  selectStyle.display = '';
  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
};
SelectEditor.prototype.close = function() {
  this.select.style.display = 'none';
  this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
};
SelectEditor.prototype.focus = function() {
  this.select.focus();
};
registerEditor('select', SelectEditor);


//# 
},{"./../dom.js":34,"./../editors.js":36,"./../helpers.js":49,"./_baseEditor.js":37}],47:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  TextEditor: {get: function() {
      return TextEditor;
    }},
  __esModule: {value: true}
});
var $___46__46__47_dom_46_js__,
    $___46__46__47_helpers_46_js__,
    $___46__46__47_3rdparty_47_autoResize_46_js__,
    $___95_baseEditor_46_js__,
    $___46__46__47_eventManager_46_js__,
    $___46__46__47_editors_46_js__;
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var helper = ($___46__46__47_helpers_46_js__ = require("./../helpers.js"), $___46__46__47_helpers_46_js__ && $___46__46__47_helpers_46_js__.__esModule && $___46__46__47_helpers_46_js__ || {default: $___46__46__47_helpers_46_js__});
var autoResize = ($___46__46__47_3rdparty_47_autoResize_46_js__ = require("./../3rdparty/autoResize.js"), $___46__46__47_3rdparty_47_autoResize_46_js__ && $___46__46__47_3rdparty_47_autoResize_46_js__.__esModule && $___46__46__47_3rdparty_47_autoResize_46_js__ || {default: $___46__46__47_3rdparty_47_autoResize_46_js__}).autoResize;
var BaseEditor = ($___95_baseEditor_46_js__ = require("./_baseEditor.js"), $___95_baseEditor_46_js__ && $___95_baseEditor_46_js__.__esModule && $___95_baseEditor_46_js__ || {default: $___95_baseEditor_46_js__}).BaseEditor;
var eventManagerObject = ($___46__46__47_eventManager_46_js__ = require("./../eventManager.js"), $___46__46__47_eventManager_46_js__ && $___46__46__47_eventManager_46_js__.__esModule && $___46__46__47_eventManager_46_js__ || {default: $___46__46__47_eventManager_46_js__}).eventManager;
var $__3 = ($___46__46__47_editors_46_js__ = require("./../editors.js"), $___46__46__47_editors_46_js__ && $___46__46__47_editors_46_js__.__esModule && $___46__46__47_editors_46_js__ || {default: $___46__46__47_editors_46_js__}),
    getEditor = $__3.getEditor,
    registerEditor = $__3.registerEditor;
var TextEditor = BaseEditor.prototype.extend();
;
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.TextEditor = TextEditor;
TextEditor.prototype.init = function() {
  var that = this;
  this.createElements();
  this.eventManager = eventManagerObject(this);
  this.bindEvents();
  this.autoResize = autoResize();
  this.instance.addHook('afterDestroy', function() {
    that.destroy();
  });
};
TextEditor.prototype.getValue = function() {
  return this.TEXTAREA.value;
};
TextEditor.prototype.setValue = function(newValue) {
  this.TEXTAREA.value = newValue;
};
var onBeforeKeyDown = function onBeforeKeyDown(event) {
  var instance = this,
      that = instance.getActiveEditor(),
      keyCodes,
      ctrlDown;
  keyCodes = helper.keyCode;
  ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;
  dom.enableImmediatePropagation(event);
  if (event.target !== that.TEXTAREA || event.isImmediatePropagationStopped()) {
    return;
  }
  if (event.keyCode === 17 || event.keyCode === 224 || event.keyCode === 91 || event.keyCode === 93) {
    event.stopImmediatePropagation();
    return;
  }
  switch (event.keyCode) {
    case keyCodes.ARROW_RIGHT:
      if (dom.getCaretPosition(that.TEXTAREA) !== that.TEXTAREA.value.length) {
        event.stopImmediatePropagation();
      }
      break;
    case keyCodes.ARROW_LEFT:
      if (dom.getCaretPosition(that.TEXTAREA) !== 0) {
        event.stopImmediatePropagation();
      }
      break;
    case keyCodes.ENTER:
      var selected = that.instance.getSelected();
      var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
      if ((ctrlDown && !isMultipleSelection) || event.altKey) {
        if (that.isOpened()) {
          var caretPosition = dom.getCaretPosition(that.TEXTAREA),
              value = that.getValue();
          var newValue = value.slice(0, caretPosition) + '\n' + value.slice(caretPosition);
          that.setValue(newValue);
          dom.setCaretPosition(that.TEXTAREA, caretPosition + 1);
        } else {
          that.beginEditing(that.originalValue + '\n');
        }
        event.stopImmediatePropagation();
      }
      event.preventDefault();
      break;
    case keyCodes.A:
    case keyCodes.X:
    case keyCodes.C:
    case keyCodes.V:
      if (ctrlDown) {
        event.stopImmediatePropagation();
      }
      break;
    case keyCodes.BACKSPACE:
    case keyCodes.DELETE:
    case keyCodes.HOME:
    case keyCodes.END:
      event.stopImmediatePropagation();
      break;
  }
  that.autoResize.resize(String.fromCharCode(event.keyCode));
};
TextEditor.prototype.open = function() {
  this.refreshDimensions();
  this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
};
TextEditor.prototype.close = function() {
  this.textareaParentStyle.display = 'none';
  this.autoResize.unObserve();
  if (document.activeElement === this.TEXTAREA) {
    this.instance.listen();
  }
  this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
};
TextEditor.prototype.focus = function() {
  this.TEXTAREA.focus();
  dom.setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
};
TextEditor.prototype.createElements = function() {
  this.TEXTAREA = document.createElement('TEXTAREA');
  dom.addClass(this.TEXTAREA, 'handsontableInput');
  this.textareaStyle = this.TEXTAREA.style;
  this.textareaStyle.width = 0;
  this.textareaStyle.height = 0;
  this.TEXTAREA_PARENT = document.createElement('DIV');
  dom.addClass(this.TEXTAREA_PARENT, 'handsontableInputHolder');
  this.textareaParentStyle = this.TEXTAREA_PARENT.style;
  this.textareaParentStyle.top = 0;
  this.textareaParentStyle.left = 0;
  this.textareaParentStyle.display = 'none';
  this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  this.instance.rootElement.appendChild(this.TEXTAREA_PARENT);
  var that = this;
  this.instance._registerTimeout(setTimeout(function() {
    that.refreshDimensions();
  }, 0));
};
TextEditor.prototype.checkEditorSection = function() {
  if (this.row < this.instance.getSettings().fixedRowsTop) {
    if (this.col < this.instance.getSettings().fixedColumnsLeft) {
      return 'corner';
    } else {
      return 'top';
    }
  } else {
    if (this.col < this.instance.getSettings().fixedColumnsLeft) {
      return 'left';
    }
  }
};
TextEditor.prototype.getEditedCell = function() {
  var editorSection = this.checkEditorSection(),
      editedCell;
  switch (editorSection) {
    case 'top':
      editedCell = this.instance.view.wt.wtOverlays.topOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.textareaParentStyle.zIndex = 101;
      break;
    case 'corner':
      editedCell = this.instance.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.textareaParentStyle.zIndex = 103;
      break;
    case 'left':
      editedCell = this.instance.view.wt.wtOverlays.leftOverlay.clone.wtTable.getCell({
        row: this.row,
        col: this.col
      });
      this.textareaParentStyle.zIndex = 102;
      break;
    default:
      editedCell = this.instance.getCell(this.row, this.col);
      this.textareaParentStyle.zIndex = "";
      break;
  }
  return editedCell != -1 && editedCell != -2 ? editedCell : void 0;
};
TextEditor.prototype.refreshDimensions = function() {
  if (this.state !== Handsontable.EditorState.EDITING) {
    return;
  }
  this.TD = this.getEditedCell();
  if (!this.TD) {
    return;
  }
  var currentOffset = dom.offset(this.TD),
      containerOffset = dom.offset(this.instance.rootElement),
      scrollableContainer = dom.getScrollableElement(this.TD),
      editTop = currentOffset.top - containerOffset.top - 1 - (scrollableContainer.scrollTop || 0),
      editLeft = currentOffset.left - containerOffset.left - 1 - (scrollableContainer.scrollLeft || 0),
      settings = this.instance.getSettings(),
      rowHeadersCount = settings.rowHeaders ? 1 : 0,
      colHeadersCount = settings.colHeaders ? 1 : 0,
      editorSection = this.checkEditorSection(),
      backgroundColor = this.TD.style.backgroundColor,
      cssTransformOffset;
  switch (editorSection) {
    case 'top':
      cssTransformOffset = dom.getCssTransform(this.instance.view.wt.wtOverlays.topOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'left':
      cssTransformOffset = dom.getCssTransform(this.instance.view.wt.wtOverlays.leftOverlay.clone.wtTable.holder.parentNode);
      break;
    case 'corner':
      cssTransformOffset = dom.getCssTransform(this.instance.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder.parentNode);
      break;
  }
  if (editTop < 0) {
    editTop = 0;
  }
  if (editLeft < 0) {
    editLeft = 0;
  }
  if (colHeadersCount && this.instance.getSelected()[0] === 0) {
    editTop += 1;
  }
  if (rowHeadersCount && this.instance.getSelected()[1] === 0) {
    editLeft += 1;
  }
  if (cssTransformOffset && cssTransformOffset != -1) {
    this.textareaParentStyle[cssTransformOffset[0]] = cssTransformOffset[1];
  } else {
    dom.resetCssTransform(this.textareaParentStyle);
  }
  this.textareaParentStyle.top = editTop + 'px';
  this.textareaParentStyle.left = editLeft + 'px';
  var cellTopOffset = this.TD.offsetTop - this.instance.view.wt.wtOverlays.topOverlay.getScrollPosition(),
      cellLeftOffset = this.TD.offsetLeft - this.instance.view.wt.wtOverlays.leftOverlay.getScrollPosition();
  var width = dom.innerWidth(this.TD) - 8,
      maxWidth = this.instance.view.maximumVisibleElementWidth(cellLeftOffset) - 10,
      height = this.TD.scrollHeight + 1,
      maxHeight = this.instance.view.maximumVisibleElementHeight(cellTopOffset) - 2;
  if (parseInt(this.TD.style.borderTopWidth, 10) > 0) {
    height -= 1;
  }
  if (parseInt(this.TD.style.borderLeftWidth, 10) > 0) {
    if (rowHeadersCount > 0) {
      width -= 1;
    }
  }
  this.TEXTAREA.style.fontSize = dom.getComputedStyle(this.TD).fontSize;
  this.TEXTAREA.style.fontFamily = dom.getComputedStyle(this.TD).fontFamily;
  this.TEXTAREA.style.backgroundColor = '';
  this.TEXTAREA.style.backgroundColor = backgroundColor ? backgroundColor : dom.getComputedStyle(this.TEXTAREA).backgroundColor;
  this.autoResize.init(this.TEXTAREA, {
    minHeight: Math.min(height, maxHeight),
    maxHeight: maxHeight,
    minWidth: Math.min(width, maxWidth),
    maxWidth: maxWidth
  }, true);
  this.textareaParentStyle.display = 'block';
};
TextEditor.prototype.bindEvents = function() {
  var editor = this;
  this.eventManager.addEventListener(this.TEXTAREA, 'cut', function(event) {
    helper.stopPropagation(event);
  });
  this.eventManager.addEventListener(this.TEXTAREA, 'paste', function(event) {
    helper.stopPropagation(event);
  });
  this.instance.addHook('afterScrollVertically', function() {
    editor.refreshDimensions();
  });
  this.instance.addHook('afterColumnResize', function() {
    editor.refreshDimensions();
    editor.focus();
  });
  this.instance.addHook('afterRowResize', function() {
    editor.refreshDimensions();
    editor.focus();
  });
  this.instance.addHook('afterDestroy', function() {
    editor.eventManager.clear();
  });
};
TextEditor.prototype.destroy = function() {
  this.eventManager.clear();
};
registerEditor('text', TextEditor);


//# 
},{"./../3rdparty/autoResize.js":2,"./../dom.js":34,"./../editors.js":36,"./../eventManager.js":48,"./../helpers.js":49,"./_baseEditor.js":37}],48:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  eventManager: {get: function() {
      return eventManager;
    }},
  __esModule: {value: true}
});
var $__dom_46_js__;
var dom = ($__dom_46_js__ = require("./dom.js"), $__dom_46_js__ && $__dom_46_js__.__esModule && $__dom_46_js__ || {default: $__dom_46_js__});
;
window.Handsontable = window.Handsontable || {};
Handsontable.countEventManagerListeners = 0;
Handsontable.eventManager = eventManager;
function eventManager(instance) {
  if (!instance) {
    throw new Error('instance not defined');
  }
  if (!instance.eventListeners) {
    instance.eventListeners = [];
  }
  function extendEvent(event) {
    var componentName = 'HOT-TABLE',
        isHotTableSpotted,
        fromElement,
        realTarget,
        target,
        len;
    event.isTargetWebComponent = false;
    event.realTarget = event.target;
    if (!Handsontable.eventManager.isHotTableEnv) {
      return event;
    }
    event = dom.polymerWrap(event);
    len = event.path.length;
    while (len--) {
      if (event.path[len].nodeName === componentName) {
        isHotTableSpotted = true;
      } else if (isHotTableSpotted && event.path[len].shadowRoot) {
        target = event.path[len];
        break;
      }
      if (len === 0 && !target) {
        target = event.path[len];
      }
    }
    if (!target) {
      target = event.target;
    }
    event.isTargetWebComponent = true;
    if (dom.isWebComponentSupportedNatively()) {
      event.realTarget = event.srcElement || event.toElement;
    } else if (instance instanceof Handsontable.Core || instance instanceof Walkontable) {
      if (instance instanceof Handsontable.Core) {
        fromElement = instance.view.wt.wtTable.TABLE;
      } else if (instance instanceof Walkontable) {
        fromElement = instance.wtTable.TABLE.parentNode.parentNode;
      }
      realTarget = dom.closest(event.target, [componentName], fromElement);
      if (realTarget) {
        event.realTarget = fromElement.querySelector(componentName) || event.target;
      } else {
        event.realTarget = event.target;
      }
    }
    Object.defineProperty(event, 'target', {
      get: function() {
        return dom.polymerWrap(target);
      },
      enumerable: true,
      configurable: true
    });
    return event;
  }
  function addEvent(element, event, callback) {
    var callbackProxy;
    callbackProxy = function callbackProxy(event) {
      if (event.target == void 0 && event.srcElement != void 0) {
        if (event.definePoperty) {
          event.definePoperty('target', {value: event.srcElement});
        } else {
          event.target = event.srcElement;
        }
      }
      if (event.preventDefault == void 0) {
        if (event.definePoperty) {
          event.definePoperty('preventDefault', {value: function() {
              this.returnValue = false;
            }});
        } else {
          event.preventDefault = function() {
            this.returnValue = false;
          };
        }
      }
      event = extendEvent(event);
      callback.call(this, event);
    };
    instance.eventListeners.push({
      element: element,
      event: event,
      callback: callback,
      callbackProxy: callbackProxy
    });
    if (window.addEventListener) {
      element.addEventListener(event, callbackProxy, false);
    } else {
      element.attachEvent('on' + event, callbackProxy);
    }
    Handsontable.countEventManagerListeners++;
    return function _removeEvent() {
      removeEvent(element, event, callback);
    };
  }
  function removeEvent(element, event, callback) {
    var len = instance.eventListeners.length,
        tmpEvent;
    while (len--) {
      tmpEvent = instance.eventListeners[len];
      if (tmpEvent.event == event && tmpEvent.element == element) {
        if (callback && callback != tmpEvent.callback) {
          continue;
        }
        instance.eventListeners.splice(len, 1);
        if (tmpEvent.element.removeEventListener) {
          tmpEvent.element.removeEventListener(tmpEvent.event, tmpEvent.callbackProxy, false);
        } else {
          tmpEvent.element.detachEvent('on' + tmpEvent.event, tmpEvent.callbackProxy);
        }
        Handsontable.countEventManagerListeners--;
      }
    }
  }
  function clearEvents() {
    var len = instance.eventListeners.length,
        event;
    while (len--) {
      event = instance.eventListeners[len];
      if (event) {
        removeEvent(event.element, event.event, event.callback);
      }
    }
  }
  function fireEvent(element, type) {
    var options = {
      bubbles: true,
      cancelable: (type !== "mousemove"),
      view: window,
      detail: 0,
      screenX: 0,
      screenY: 0,
      clientX: 1,
      clientY: 1,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 0,
      relatedTarget: undefined
    };
    var event;
    if (document.createEvent) {
      event = document.createEvent("MouseEvents");
      event.initMouseEvent(type, options.bubbles, options.cancelable, options.view, options.detail, options.screenX, options.screenY, options.clientX, options.clientY, options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, options.relatedTarget || document.body.parentNode);
    } else {
      event = document.createEventObject();
    }
    if (element.dispatchEvent) {
      element.dispatchEvent(event);
    } else {
      element.fireEvent('on' + type, event);
    }
  }
  return {
    addEventListener: addEvent,
    removeEventListener: removeEvent,
    clear: clearEvents,
    fireEvent: fireEvent
  };
}


//# 
},{"./dom.js":34}],49:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  isPrintableChar: {get: function() {
      return isPrintableChar;
    }},
  isMetaKey: {get: function() {
      return isMetaKey;
    }},
  isCtrlKey: {get: function() {
      return isCtrlKey;
    }},
  stringify: {get: function() {
      return stringify;
    }},
  toUpperCaseFirst: {get: function() {
      return toUpperCaseFirst;
    }},
  duckSchema: {get: function() {
      return duckSchema;
    }},
  spreadsheetColumnLabel: {get: function() {
      return spreadsheetColumnLabel;
    }},
  createSpreadsheetData: {get: function() {
      return createSpreadsheetData;
    }},
  createSpreadsheetObjectData: {get: function() {
      return createSpreadsheetObjectData;
    }},
  isNumeric: {get: function() {
      return isNumeric;
    }},
  randomString: {get: function() {
      return randomString;
    }},
  inherit: {get: function() {
      return inherit;
    }},
  extend: {get: function() {
      return extend;
    }},
  deepExtend: {get: function() {
      return deepExtend;
    }},
  deepClone: {get: function() {
      return deepClone;
    }},
  isObjectEquals: {get: function() {
      return isObjectEquals;
    }},
  getPrototypeOf: {get: function() {
      return getPrototypeOf;
    }},
  columnFactory: {get: function() {
      return columnFactory;
    }},
  translateRowsToColumns: {get: function() {
      return translateRowsToColumns;
    }},
  to2dArray: {get: function() {
      return to2dArray;
    }},
  extendArray: {get: function() {
      return extendArray;
    }},
  isInput: {get: function() {
      return isInput;
    }},
  isOutsideInput: {get: function() {
      return isOutsideInput;
    }},
  keyCode: {get: function() {
      return keyCode;
    }},
  isObject: {get: function() {
      return isObject;
    }},
  pivot: {get: function() {
      return pivot;
    }},
  proxy: {get: function() {
      return proxy;
    }},
  cellMethodLookupFactory: {get: function() {
      return cellMethodLookupFactory;
    }},
  isMobileBrowser: {get: function() {
      return isMobileBrowser;
    }},
  isTouchSupported: {get: function() {
      return isTouchSupported;
    }},
  stopPropagation: {get: function() {
      return stopPropagation;
    }},
  pageX: {get: function() {
      return pageX;
    }},
  pageY: {get: function() {
      return pageY;
    }},
  defineGetter: {get: function() {
      return defineGetter;
    }},
  __esModule: {value: true}
});
var $__dom_46_js__;
var dom = ($__dom_46_js__ = require("./dom.js"), $__dom_46_js__ && $__dom_46_js__.__esModule && $__dom_46_js__ || {default: $__dom_46_js__});
function isPrintableChar(keyCode) {
  return ((keyCode == 32) || (keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 111) || (keyCode >= 186 && keyCode <= 192) || (keyCode >= 219 && keyCode <= 222) || keyCode >= 226 || (keyCode >= 65 && keyCode <= 90));
}
function isMetaKey(_keyCode) {
  var metaKeys = [keyCode.ARROW_DOWN, keyCode.ARROW_UP, keyCode.ARROW_LEFT, keyCode.ARROW_RIGHT, keyCode.HOME, keyCode.END, keyCode.DELETE, keyCode.BACKSPACE, keyCode.F1, keyCode.F2, keyCode.F3, keyCode.F4, keyCode.F5, keyCode.F6, keyCode.F7, keyCode.F8, keyCode.F9, keyCode.F10, keyCode.F11, keyCode.F12, keyCode.TAB, keyCode.PAGE_DOWN, keyCode.PAGE_UP, keyCode.ENTER, keyCode.ESCAPE, keyCode.SHIFT, keyCode.CAPS_LOCK, keyCode.ALT];
  return metaKeys.indexOf(_keyCode) != -1;
}
function isCtrlKey(_keyCode) {
  return [keyCode.CONTROL_LEFT, 224, keyCode.COMMAND_LEFT, keyCode.COMMAND_RIGHT].indexOf(_keyCode) != -1;
}
function stringify(value) {
  switch (typeof value) {
    case 'string':
    case 'number':
      return value + '';
    case 'object':
      if (value === null) {
        return '';
      } else {
        return value.toString();
      }
      break;
    case 'undefined':
      return '';
    default:
      return value.toString();
  }
}
function toUpperCaseFirst(string) {
  return string[0].toUpperCase() + string.substr(1);
}
function duckSchema(object) {
  var schema;
  if (Array.isArray(object)) {
    schema = [];
  } else {
    schema = {};
    for (var i in object) {
      if (object.hasOwnProperty(i)) {
        if (object[i] && typeof object[i] === 'object' && !Array.isArray(object[i])) {
          schema[i] = duckSchema(object[i]);
        } else if (Array.isArray(object[i])) {
          if (object[i].length && typeof object[i][0] === 'object' && !Array.isArray(object[i][0])) {
            schema[i] = [duckSchema(object[i][0])];
          } else {
            schema[i] = [];
          }
        } else {
          schema[i] = null;
        }
      }
    }
  }
  return schema;
}
function spreadsheetColumnLabel(index) {
  var dividend = index + 1;
  var columnLabel = '';
  var modulo;
  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = parseInt((dividend - modulo) / 26, 10);
  }
  return columnLabel;
}
function createSpreadsheetData(rowCount, colCount) {
  rowCount = typeof rowCount === 'number' ? rowCount : 100;
  colCount = typeof colCount === 'number' ? colCount : 4;
  var rows = [],
      i,
      j;
  for (i = 0; i < rowCount; i++) {
    var row = [];
    for (j = 0; j < colCount; j++) {
      row.push(spreadsheetColumnLabel(j) + (i + 1));
    }
    rows.push(row);
  }
  return rows;
}
function createSpreadsheetObjectData(rowCount, colCount) {
  rowCount = typeof rowCount === 'number' ? rowCount : 100;
  colCount = typeof colCount === 'number' ? colCount : 4;
  var rows = [],
      i,
      j;
  for (i = 0; i < rowCount; i++) {
    var row = {};
    for (j = 0; j < colCount; j++) {
      row['prop' + j] = spreadsheetColumnLabel(j) + (i + 1);
    }
    rows.push(row);
  }
  return rows;
}
function isNumeric(n) {
  var t = typeof n;
  return t == 'number' ? !isNaN(n) && isFinite(n) : t == 'string' ? !n.length ? false : n.length == 1 ? /\d/.test(n) : /^\s*[+-]?\s*(?:(?:\d+(?:\.\d+)?(?:e[+-]?\d+)?)|(?:0x[a-f\d]+))\s*$/i.test(n) : t == 'object' ? !!n && typeof n.valueOf() == "number" && !(n instanceof Date) : false;
}
function randomString() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + s4() + s4();
}
function inherit(Child, Parent) {
  Parent.prototype.constructor = Parent;
  Child.prototype = new Parent();
  Child.prototype.constructor = Child;
  return Child;
}
function extend(target, extension) {
  for (var i in extension) {
    if (extension.hasOwnProperty(i)) {
      target[i] = extension[i];
    }
  }
}
function deepExtend(target, extension) {
  for (var key in extension) {
    if (extension.hasOwnProperty(key)) {
      if (extension[key] && typeof extension[key] === 'object') {
        if (!target[key]) {
          if (Array.isArray(extension[key])) {
            target[key] = [];
          } else {
            target[key] = {};
          }
        }
        deepExtend(target[key], extension[key]);
      } else {
        target[key] = extension[key];
      }
    }
  }
}
function deepClone(obj) {
  if (typeof obj === "object") {
    return JSON.parse(JSON.stringify(obj));
  } else {
    return obj;
  }
}
function isObjectEquals(object1, object2) {
  return JSON.stringify(object1) === JSON.stringify(object2);
}
function getPrototypeOf(obj) {
  var prototype;
  if (typeof obj.__proto__ == "object") {
    prototype = obj.__proto__;
  } else {
    var oldConstructor,
        constructor = obj.constructor;
    if (typeof obj.constructor == "function") {
      oldConstructor = constructor;
      if (delete obj.constructor) {
        constructor = obj.constructor;
        obj.constructor = oldConstructor;
      }
    }
    prototype = constructor ? constructor.prototype : null;
  }
  return prototype;
}
function columnFactory(GridSettings, conflictList) {
  function ColumnSettings() {}
  inherit(ColumnSettings, GridSettings);
  for (var i = 0,
      len = conflictList.length; i < len; i++) {
    ColumnSettings.prototype[conflictList[i]] = void 0;
  }
  return ColumnSettings;
}
function translateRowsToColumns(input) {
  var i,
      ilen,
      j,
      jlen,
      output = [],
      olen = 0;
  for (i = 0, ilen = input.length; i < ilen; i++) {
    for (j = 0, jlen = input[i].length; j < jlen; j++) {
      if (j == olen) {
        output.push([]);
        olen++;
      }
      output[j].push(input[i][j]);
    }
  }
  return output;
}
function to2dArray(arr) {
  var i = 0,
      ilen = arr.length;
  while (i < ilen) {
    arr[i] = [arr[i]];
    i++;
  }
}
function extendArray(arr, extension) {
  var i = 0,
      ilen = extension.length;
  while (i < ilen) {
    arr.push(extension[i]);
    i++;
  }
}
function isInput(element) {
  var inputs = ['INPUT', 'SELECT', 'TEXTAREA'];
  return inputs.indexOf(element.nodeName) > -1;
}
function isOutsideInput(element) {
  return isInput(element) && element.className.indexOf('handsontableInput') == -1;
}
var keyCode = {
  MOUSE_LEFT: 1,
  MOUSE_RIGHT: 3,
  MOUSE_MIDDLE: 2,
  BACKSPACE: 8,
  COMMA: 188,
  INSERT: 45,
  DELETE: 46,
  END: 35,
  ENTER: 13,
  ESCAPE: 27,
  CONTROL_LEFT: 91,
  COMMAND_LEFT: 17,
  COMMAND_RIGHT: 93,
  ALT: 18,
  HOME: 36,
  PAGE_DOWN: 34,
  PAGE_UP: 33,
  PERIOD: 190,
  SPACE: 32,
  SHIFT: 16,
  CAPS_LOCK: 20,
  TAB: 9,
  ARROW_RIGHT: 39,
  ARROW_LEFT: 37,
  ARROW_UP: 38,
  ARROW_DOWN: 40,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  A: 65,
  X: 88,
  C: 67,
  V: 86
};
function isObject(obj) {
  return Object.prototype.toString.call(obj) == '[object Object]';
}
function pivot(arr) {
  var pivotedArr = [];
  if (!arr || arr.length === 0 || !arr[0] || arr[0].length === 0) {
    return pivotedArr;
  }
  var rowCount = arr.length;
  var colCount = arr[0].length;
  for (var i = 0; i < rowCount; i++) {
    for (var j = 0; j < colCount; j++) {
      if (!pivotedArr[j]) {
        pivotedArr[j] = [];
      }
      pivotedArr[j][i] = arr[i][j];
    }
  }
  return pivotedArr;
}
function proxy(fun, context) {
  return function() {
    return fun.apply(context, arguments);
  };
}
function cellMethodLookupFactory(methodName, allowUndefined) {
  allowUndefined = typeof allowUndefined == 'undefined' ? true : allowUndefined;
  return function cellMethodLookup(row, col) {
    return (function getMethodFromProperties(properties) {
      if (!properties) {
        return;
      } else if (properties.hasOwnProperty(methodName) && properties[methodName] !== void 0) {
        return properties[methodName];
      } else if (properties.hasOwnProperty('type') && properties.type) {
        var type;
        if (typeof properties.type != 'string') {
          throw new Error('Cell type must be a string ');
        }
        type = translateTypeNameToObject(properties.type);
        if (type.hasOwnProperty(methodName)) {
          return type[methodName];
        } else if (allowUndefined) {
          return;
        }
      }
      return getMethodFromProperties(getPrototypeOf(properties));
    })(typeof row == 'number' ? this.getCellMeta(row, col) : row);
  };
  function translateTypeNameToObject(typeName) {
    var type = Handsontable.cellTypes[typeName];
    if (typeof type == 'undefined') {
      throw new Error('You declared cell type "' + typeName + '" as a string that is not mapped to a known object. ' + 'Cell type must be an object or a string mapped to an object in Handsontable.cellTypes');
    }
    return type;
  }
}
function isMobileBrowser(userAgent) {
  if (!userAgent) {
    userAgent = navigator.userAgent;
  }
  return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent));
}
function isTouchSupported() {
  return ('ontouchstart' in window);
}
function stopPropagation(event) {
  if (typeof(event.stopPropagation) === 'function') {
    event.stopPropagation();
  } else {
    event.cancelBubble = true;
  }
}
function pageX(event) {
  if (event.pageX) {
    return event.pageX;
  }
  var scrollLeft = dom.getWindowScrollLeft();
  var cursorX = event.clientX + scrollLeft;
  return cursorX;
}
function pageY(event) {
  if (event.pageY) {
    return event.pageY;
  }
  var scrollTop = dom.getWindowScrollTop();
  var cursorY = event.clientY + scrollTop;
  return cursorY;
}
function defineGetter(object, property, value, options) {
  options.value = value;
  options.writable = options.writable === false ? false : true;
  options.enumerable = options.enumerable === false ? false : true;
  options.configurable = options.configurable === false ? false : true;
  Object.defineProperty(object, property, options);
}
window.Handsontable = window.Handsontable || {};
Handsontable.helper = {
  cellMethodLookupFactory: cellMethodLookupFactory,
  columnFactory: columnFactory,
  createSpreadsheetData: createSpreadsheetData,
  createSpreadsheetObjectData: createSpreadsheetObjectData,
  duckSchema: duckSchema,
  deepClone: deepClone,
  deepExtend: deepExtend,
  defineGetter: defineGetter,
  extend: extend,
  extendArray: extendArray,
  getPrototypeOf: getPrototypeOf,
  inherit: inherit,
  isCtrlKey: isCtrlKey,
  isInput: isInput,
  isMetaKey: isMetaKey,
  isMobileBrowser: isMobileBrowser,
  isNumeric: isNumeric,
  isObject: isObject,
  isObjectEquals: isObjectEquals,
  isOutsideInput: isOutsideInput,
  isPrintableChar: isPrintableChar,
  isTouchSupported: isTouchSupported,
  keyCode: keyCode,
  pageX: pageX,
  pageY: pageY,
  pivot: pivot,
  proxy: proxy,
  randomString: randomString,
  spreadsheetColumnLabel: spreadsheetColumnLabel,
  stopPropagation: stopPropagation,
  stringify: stringify,
  to2dArray: to2dArray,
  toUpperCaseFirst: toUpperCaseFirst,
  translateRowsToColumns: translateRowsToColumns
};


//# 
},{"./dom.js":34}],50:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  MultiMap: {get: function() {
      return MultiMap;
    }},
  __esModule: {value: true}
});
;
window.MultiMap = MultiMap;
function MultiMap() {
  var map = {
    arrayMap: [],
    weakMap: new WeakMap()
  };
  return {
    'get': function(key) {
      if (canBeAnArrayMapKey(key)) {
        return map.arrayMap[key];
      } else if (canBeAWeakMapKey(key)) {
        return map.weakMap.get(key);
      }
    },
    'set': function(key, value) {
      if (canBeAnArrayMapKey(key)) {
        map.arrayMap[key] = value;
      } else if (canBeAWeakMapKey(key)) {
        map.weakMap.set(key, value);
      } else {
        throw new Error('Invalid key type');
      }
    },
    'delete': function(key) {
      if (canBeAnArrayMapKey(key)) {
        delete map.arrayMap[key];
      } else if (canBeAWeakMapKey(key)) {
        map.weakMap['delete'](key);
      }
    }
  };
  function canBeAnArrayMapKey(obj) {
    return obj !== null && !isNaNSymbol(obj) && (typeof obj == 'string' || typeof obj == 'number');
  }
  function canBeAWeakMapKey(obj) {
    return obj !== null && (typeof obj == 'object' || typeof obj == 'function');
  }
  function isNaNSymbol(obj) {
    return obj !== obj;
  }
}


//# 
},{}],51:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  PluginHook: {get: function() {
      return PluginHook;
    }},
  __esModule: {value: true}
});
;
var Hooks = function() {
  return {
    beforeInitWalkontable: [],
    beforeInit: [],
    beforeRender: [],
    beforeSetRangeEnd: [],
    beforeDrawBorders: [],
    beforeChange: [],
    beforeChangeRender: [],
    beforeRemoveCol: [],
    beforeRemoveRow: [],
    beforeValidate: [],
    beforeGetCellMeta: [],
    beforeAutofill: [],
    beforeKeyDown: [],
    beforeOnCellMouseDown: [],
    beforeTouchScroll: [],
    afterInit: [],
    afterLoadData: [],
    afterUpdateSettings: [],
    afterRender: [],
    afterRenderer: [],
    afterChange: [],
    afterValidate: [],
    afterGetCellMeta: [],
    afterSetCellMeta: [],
    afterGetColHeader: [],
    afterGetRowHeader: [],
    afterDestroy: [],
    afterRemoveRow: [],
    afterCreateRow: [],
    afterRemoveCol: [],
    afterCreateCol: [],
    afterDeselect: [],
    afterSelection: [],
    afterSelectionByProp: [],
    afterSelectionEnd: [],
    afterSelectionEndByProp: [],
    afterOnCellMouseDown: [],
    afterOnCellMouseOver: [],
    afterOnCellCornerMouseDown: [],
    afterScrollVertically: [],
    afterScrollHorizontally: [],
    afterCellMetaReset: [],
    afterIsMultipleSelectionCheck: [],
    afterDocumentKeyDown: [],
    afterMomentumScroll: [],
    beforeCellAlignment: [],
    modifyColWidth: [],
    modifyRowHeight: [],
    modifyRow: [],
    modifyCol: []
  };
};
var legacy = {
  onBeforeChange: "beforeChange",
  onChange: "afterChange",
  onCreateRow: "afterCreateRow",
  onCreateCol: "afterCreateCol",
  onSelection: "afterSelection",
  onCopyLimit: "afterCopyLimit",
  onSelectionEnd: "afterSelectionEnd",
  onSelectionByProp: "afterSelectionByProp",
  onSelectionEndByProp: "afterSelectionEndByProp"
};
function PluginHook() {
  this.hooks = Hooks();
  this.globalBucket = {};
  this.legacy = legacy;
}
PluginHook.prototype.getBucket = function(instance) {
  if (instance) {
    if (!instance.pluginHookBucket) {
      instance.pluginHookBucket = {};
    }
    return instance.pluginHookBucket;
  }
  return this.globalBucket;
};
PluginHook.prototype.add = function(key, fn, instance) {
  if (Array.isArray(fn)) {
    for (var i = 0,
        len = fn.length; i < len; i++) {
      this.add(key, fn[i]);
    }
  } else {
    if (key in legacy) {
      key = legacy[key];
    }
    var bucket = this.getBucket(instance);
    if (typeof bucket[key] === 'undefined') {
      bucket[key] = [];
    }
    fn.skip = false;
    if (bucket[key].indexOf(fn) === -1) {
      bucket[key].push(fn);
    }
  }
  return this;
};
PluginHook.prototype.once = function(key, fn, instance) {
  if (Array.isArray(fn)) {
    for (var i = 0,
        len = fn.length; i < len; i++) {
      fn[i].runOnce = true;
      this.add(key, fn[i], instance);
    }
  } else {
    fn.runOnce = true;
    this.add(key, fn, instance);
  }
};
PluginHook.prototype.remove = function(key, fn, instance) {
  var status = false;
  if (key in legacy) {
    key = legacy[key];
  }
  var bucket = this.getBucket(instance);
  if (typeof bucket[key] !== 'undefined') {
    for (var i = 0,
        leni = bucket[key].length; i < leni; i++) {
      if (bucket[key][i] == fn) {
        bucket[key][i].skip = true;
        status = true;
        break;
      }
    }
  }
  return status;
};
PluginHook.prototype.run = function(instance, key, p1, p2, p3, p4, p5, p6) {
  if (legacy[key]) {
    key = legacy[key];
  }
  p1 = this._runBucket(this.globalBucket, instance, key, p1, p2, p3, p4, p5, p6);
  p1 = this._runBucket(this.getBucket(instance), instance, key, p1, p2, p3, p4, p5, p6);
  return p1;
};
PluginHook.prototype._runBucket = function(bucket, instance, key, p1, p2, p3, p4, p5, p6) {
  var handlers = bucket[key],
      res,
      i,
      len;
  if (handlers) {
    for (i = 0, len = handlers.length; i < len; i++) {
      if (!handlers[i].skip) {
        res = handlers[i].call(instance, p1, p2, p3, p4, p5, p6);
        if (res !== void 0) {
          p1 = res;
        }
        if (handlers[i].runOnce) {
          this.remove(key, handlers[i], bucket === this.globalBucket ? null : instance);
        }
      }
    }
  }
  return p1;
};
PluginHook.prototype.destroy = function(instance) {
  var bucket = this.getBucket(instance);
  for (var key in bucket) {
    if (bucket.hasOwnProperty(key)) {
      for (var i = 0,
          leni = bucket[key].length; i < leni; i++) {
        this.remove(key, bucket[key], instance);
      }
    }
  }
};
PluginHook.prototype.register = function(key) {
  if (!this.isRegistered(key)) {
    this.hooks[key] = [];
  }
};
PluginHook.prototype.deregister = function(key) {
  delete this.hooks[key];
};
PluginHook.prototype.isRegistered = function(key) {
  return (typeof this.hooks[key] !== "undefined");
};
PluginHook.prototype.getRegistered = function() {
  return Object.keys(this.hooks);
};


//# 
},{}],52:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  registerPlugin: {get: function() {
      return registerPlugin;
    }},
  getPlugin: {get: function() {
      return getPlugin;
    }},
  __esModule: {value: true}
});
;
var registeredPlugins = new WeakMap();
function registerPlugin(pluginName, PluginClass) {
  Handsontable.hooks.add('beforeInit', function() {
    var holder;
    if (!registeredPlugins.has(this)) {
      registeredPlugins.set(this, {});
    }
    holder = registeredPlugins.get(this);
    if (!holder[pluginName]) {
      holder[pluginName] = new PluginClass(this);
    }
  });
  Handsontable.hooks.add('afterDestroy', function() {
    var i,
        pluginsHolder;
    if (registeredPlugins.has(this)) {
      pluginsHolder = registeredPlugins.get(this);
      for (i in pluginsHolder) {
        if (pluginsHolder.hasOwnProperty(i) && pluginsHolder[i].destroy) {
          pluginsHolder[i].destroy();
        }
      }
      registeredPlugins.delete(this);
    }
  });
}
function getPlugin(instance, pluginName) {
  if (typeof pluginName != 'string') {
    throw Error('Only strings can be passed as "plugin" parameter');
  }
  if (!registeredPlugins.has(instance) || !registeredPlugins.get(instance)[pluginName]) {
    throw Error('No plugin registered under name "' + pluginName + '"');
  }
  return registeredPlugins.get(instance)[pluginName];
}


//# 
},{}],53:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  default: {get: function() {
      return $__default;
    }},
  __esModule: {value: true}
});
var $___46__46__47_helpers_46_js__;
var defineGetter = ($___46__46__47_helpers_46_js__ = require("./../helpers.js"), $___46__46__47_helpers_46_js__ && $___46__46__47_helpers_46_js__.__esModule && $___46__46__47_helpers_46_js__ || {default: $___46__46__47_helpers_46_js__}).defineGetter;
var BasePlugin = function BasePlugin(hotInstance) {
  defineGetter(this, 'hot', hotInstance, {writable: false});
};
($traceurRuntime.createClass)(BasePlugin, {destroy: function() {
    delete this.hot;
  }}, {});
var $__default = BasePlugin;


//# 
},{"./../helpers.js":49}],54:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  AutoColumnSize: {get: function() {
      return AutoColumnSize;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_helpers_46_js__,
    $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__;
var helper = ($___46__46__47__46__46__47_helpers_46_js__ = require("./../../helpers.js"), $___46__46__47__46__46__47_helpers_46_js__ && $___46__46__47__46__46__47_helpers_46_js__.__esModule && $___46__46__47__46__46__47_helpers_46_js__ || {default: $___46__46__47__46__46__47_helpers_46_js__});
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
;
function AutoColumnSize() {
  var plugin = this,
      sampleCount = 5;
  this.beforeInit = function() {
    var instance = this;
    instance.autoColumnWidths = [];
    if (instance.getSettings().autoColumnSize !== false) {
      if (!instance.autoColumnSizeTmp) {
        instance.autoColumnSizeTmp = {
          table: null,
          tableStyle: null,
          theadTh: null,
          tbody: null,
          container: null,
          containerStyle: null,
          determineBeforeNextRender: true
        };
        instance.addHook('beforeRender', htAutoColumnSize.determineIfChanged);
        instance.addHook('modifyColWidth', htAutoColumnSize.modifyColWidth);
        instance.addHook('afterDestroy', htAutoColumnSize.afterDestroy);
        instance.determineColumnWidth = plugin.determineColumnWidth;
      }
    } else {
      if (instance.autoColumnSizeTmp) {
        instance.removeHook('beforeRender', htAutoColumnSize.determineIfChanged);
        instance.removeHook('modifyColWidth', htAutoColumnSize.modifyColWidth);
        instance.removeHook('afterDestroy', htAutoColumnSize.afterDestroy);
        delete instance.determineColumnWidth;
        plugin.afterDestroy.call(instance);
      }
    }
  };
  this.determineIfChanged = function(force) {
    if (force) {
      htAutoColumnSize.determineColumnsWidth.apply(this, arguments);
    }
  };
  this.determineColumnWidth = function(col) {
    var instance = this,
        tmp = instance.autoColumnSizeTmp;
    if (!tmp.container) {
      createTmpContainer.call(tmp, instance);
    }
    tmp.container.className = instance.rootElement.className + ' htAutoColumnSize';
    tmp.table.className = instance.table.className;
    var rows = instance.countRows();
    var samples = {};
    for (var r = 0; r < rows; r++) {
      var value = instance.getDataAtCell(r, col);
      if (!Array.isArray(value)) {
        value = helper.stringify(value);
      }
      var len = value.length;
      if (!samples[len]) {
        samples[len] = {
          needed: sampleCount,
          strings: []
        };
      }
      if (samples[len].needed) {
        samples[len].strings.push({
          value: value,
          row: r
        });
        samples[len].needed--;
      }
    }
    var settings = instance.getSettings();
    if (settings.colHeaders) {
      instance.view.appendColHeader(col, tmp.theadTh);
    }
    dom.empty(tmp.tbody);
    for (var i in samples) {
      if (samples.hasOwnProperty(i)) {
        for (var j = 0,
            jlen = samples[i].strings.length; j < jlen; j++) {
          var row = samples[i].strings[j].row;
          var cellProperties = instance.getCellMeta(row, col);
          cellProperties.col = col;
          cellProperties.row = row;
          var renderer = instance.getCellRenderer(cellProperties);
          var tr = document.createElement('tr');
          var td = document.createElement('td');
          renderer(instance, td, row, col, instance.colToProp(col), samples[i].strings[j].value, cellProperties);
          r++;
          tr.appendChild(td);
          tmp.tbody.appendChild(tr);
        }
      }
    }
    var parent = instance.rootElement.parentNode;
    parent.appendChild(tmp.container);
    var width = dom.outerWidth(tmp.table);
    parent.removeChild(tmp.container);
    return width;
  };
  this.determineColumnsWidth = function() {
    var instance = this;
    var settings = this.getSettings();
    if (settings.autoColumnSize || !settings.colWidths) {
      var cols = this.countCols();
      for (var c = 0; c < cols; c++) {
        if (!instance._getColWidthFromSettings(c)) {
          this.autoColumnWidths[c] = plugin.determineColumnWidth.call(instance, c);
        }
      }
    }
  };
  this.modifyColWidth = function(width, col) {
    if (this.autoColumnWidths[col] && this.autoColumnWidths[col] > width) {
      return this.autoColumnWidths[col];
    }
    return width;
  };
  this.afterDestroy = function() {
    var instance = this;
    if (instance.autoColumnSizeTmp && instance.autoColumnSizeTmp.container && instance.autoColumnSizeTmp.container.parentNode) {
      instance.autoColumnSizeTmp.container.parentNode.removeChild(instance.autoColumnSizeTmp.container);
    }
    instance.autoColumnSizeTmp = null;
  };
  function createTmpContainer(instance) {
    var d = document,
        tmp = this;
    tmp.table = d.createElement('table');
    tmp.theadTh = d.createElement('th');
    tmp.table.appendChild(d.createElement('thead')).appendChild(d.createElement('tr')).appendChild(tmp.theadTh);
    tmp.tableStyle = tmp.table.style;
    tmp.tableStyle.tableLayout = 'auto';
    tmp.tableStyle.width = 'auto';
    tmp.tbody = d.createElement('tbody');
    tmp.table.appendChild(tmp.tbody);
    tmp.container = d.createElement('div');
    tmp.container.className = instance.rootElement.className + ' hidden';
    tmp.containerStyle = tmp.container.style;
    tmp.container.appendChild(tmp.table);
  }
}
var htAutoColumnSize = new AutoColumnSize();
Handsontable.hooks.add('beforeInit', htAutoColumnSize.beforeInit);
Handsontable.hooks.add('afterUpdateSettings', htAutoColumnSize.beforeInit);


//# 
},{"./../../dom.js":34,"./../../helpers.js":49,"./../../plugins.js":52}],55:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  Autofill: {get: function() {
      return Autofill;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_eventManager_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__,
    $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__;
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var eventManagerObject = ($___46__46__47__46__46__47_eventManager_46_js__ = require("./../../eventManager.js"), $___46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
var WalkontableCellCoords = ($___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ = require("./../../3rdparty/walkontable/src/cellCoords.js"), $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__.__esModule && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ || {default: $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__}).WalkontableCellCoords;
;
function getDeltas(start, end, data, direction) {
  var rlength = data.length,
      clength = data ? data[0].length : 0,
      deltas = [],
      arr = [],
      diffRow,
      diffCol,
      startValue,
      endValue,
      delta;
  diffRow = end.row - start.row;
  diffCol = end.col - start.col;
  if (['down', 'up'].indexOf(direction) !== -1) {
    for (var col = 0; col <= diffCol; col++) {
      startValue = parseInt(data[0][col], 10);
      endValue = parseInt(data[rlength - 1][col], 10);
      delta = (direction === 'down' ? (endValue - startValue) : (startValue - endValue)) / (rlength - 1) || 0;
      arr.push(delta);
    }
    deltas.push(arr);
  }
  if (['right', 'left'].indexOf(direction) !== -1) {
    for (var row = 0; row <= diffRow; row++) {
      startValue = parseInt(data[row][0], 10);
      endValue = parseInt(data[row][clength - 1], 10);
      delta = (direction === 'right' ? (endValue - startValue) : (startValue - endValue)) / (clength - 1) || 0;
      arr = [];
      arr.push(delta);
      deltas.push(arr);
    }
  }
  return deltas;
}
function Autofill(instance) {
  var _this = this,
      mouseDownOnCellCorner = false,
      wtOnCellCornerMouseDown,
      wtOnCellMouseOver,
      eventManager;
  this.instance = instance;
  this.addingStarted = false;
  eventManager = eventManagerObject(instance);
  function mouseUpCallback(event) {
    if (!instance.autofill) {
      return true;
    }
    if (instance.autofill.handle && instance.autofill.handle.isDragged) {
      if (instance.autofill.handle.isDragged > 1) {
        instance.autofill.apply();
      }
      instance.autofill.handle.isDragged = 0;
      mouseDownOnCellCorner = false;
    }
  }
  function mouseMoveCallback(event) {
    var tableBottom,
        tableRight;
    if (!_this.instance.autofill) {
      return false;
    }
    tableBottom = dom.offset(_this.instance.table).top - (window.pageYOffset || document.documentElement.scrollTop) + dom.outerHeight(_this.instance.table);
    tableRight = dom.offset(_this.instance.table).left - (window.pageXOffset || document.documentElement.scrollLeft) + dom.outerWidth(_this.instance.table);
    if (_this.addingStarted === false && _this.instance.autofill.handle.isDragged > 0 && event.clientY > tableBottom && event.clientX <= tableRight) {
      _this.instance.mouseDragOutside = true;
      _this.addingStarted = true;
    } else {
      _this.instance.mouseDragOutside = false;
    }
    if (_this.instance.mouseDragOutside) {
      setTimeout(function() {
        _this.addingStarted = false;
        _this.instance.alter('insert_row');
      }, 200);
    }
  }
  eventManager.addEventListener(document, 'mouseup', mouseUpCallback);
  eventManager.addEventListener(document, 'mousemove', mouseMoveCallback);
  wtOnCellCornerMouseDown = this.instance.view.wt.wtSettings.settings.onCellCornerMouseDown;
  this.instance.view.wt.wtSettings.settings.onCellCornerMouseDown = function(event) {
    instance.autofill.handle.isDragged = 1;
    mouseDownOnCellCorner = true;
    wtOnCellCornerMouseDown(event);
  };
  wtOnCellMouseOver = this.instance.view.wt.wtSettings.settings.onCellMouseOver;
  this.instance.view.wt.wtSettings.settings.onCellMouseOver = function(event, coords, TD, wt) {
    if (instance.autofill && mouseDownOnCellCorner && !instance.view.isMouseDown() && instance.autofill.handle && instance.autofill.handle.isDragged) {
      instance.autofill.handle.isDragged++;
      instance.autofill.showBorder(coords);
      instance.autofill.checkIfNewRowNeeded();
    }
    wtOnCellMouseOver(event, coords, TD, wt);
  };
  this.instance.view.wt.wtSettings.settings.onCellCornerDblClick = function() {
    instance.autofill.selectAdjacent();
  };
}
Autofill.prototype.init = function() {
  this.handle = {};
};
Autofill.prototype.disable = function() {
  this.handle.disabled = true;
};
Autofill.prototype.selectAdjacent = function() {
  var select,
      data,
      r,
      maxR,
      c;
  if (this.instance.selection.isMultiple()) {
    select = this.instance.view.wt.selections.area.getCorners();
  } else {
    select = this.instance.view.wt.selections.current.getCorners();
  }
  data = this.instance.getData();
  rows: for (r = select[2] + 1; r < this.instance.countRows(); r++) {
    for (c = select[1]; c <= select[3]; c++) {
      if (data[r][c]) {
        break rows;
      }
    }
    if (!!data[r][select[1] - 1] || !!data[r][select[3] + 1]) {
      maxR = r;
    }
  }
  if (maxR) {
    this.instance.view.wt.selections.fill.clear();
    this.instance.view.wt.selections.fill.add(new WalkontableCellCoords(select[0], select[1]));
    this.instance.view.wt.selections.fill.add(new WalkontableCellCoords(maxR, select[3]));
    this.apply();
  }
};
Autofill.prototype.apply = function() {
  var drag,
      select,
      start,
      end,
      _data,
      direction,
      deltas,
      selRange;
  this.handle.isDragged = 0;
  drag = this.instance.view.wt.selections.fill.getCorners();
  if (!drag) {
    return;
  }
  this.instance.view.wt.selections.fill.clear();
  if (this.instance.selection.isMultiple()) {
    select = this.instance.view.wt.selections.area.getCorners();
  } else {
    select = this.instance.view.wt.selections.current.getCorners();
  }
  if (drag[0] === select[0] && drag[1] < select[1]) {
    direction = 'left';
    start = new WalkontableCellCoords(drag[0], drag[1]);
    end = new WalkontableCellCoords(drag[2], select[1] - 1);
  } else if (drag[0] === select[0] && drag[3] > select[3]) {
    direction = 'right';
    start = new WalkontableCellCoords(drag[0], select[3] + 1);
    end = new WalkontableCellCoords(drag[2], drag[3]);
  } else if (drag[0] < select[0] && drag[1] === select[1]) {
    direction = 'up';
    start = new WalkontableCellCoords(drag[0], drag[1]);
    end = new WalkontableCellCoords(select[0] - 1, drag[3]);
  } else if (drag[2] > select[2] && drag[1] === select[1]) {
    direction = 'down';
    start = new WalkontableCellCoords(select[2] + 1, drag[1]);
    end = new WalkontableCellCoords(drag[2], drag[3]);
  }
  if (start && start.row > -1 && start.col > -1) {
    selRange = {
      from: this.instance.getSelectedRange().from,
      to: this.instance.getSelectedRange().to
    };
    _data = this.instance.getData(selRange.from.row, selRange.from.col, selRange.to.row, selRange.to.col);
    deltas = getDeltas(start, end, _data, direction);
    Handsontable.hooks.run(this.instance, 'beforeAutofill', start, end, _data);
    this.instance.populateFromArray(start.row, start.col, _data, end.row, end.col, 'autofill', null, direction, deltas);
    this.instance.selection.setRangeStart(new WalkontableCellCoords(drag[0], drag[1]));
    this.instance.selection.setRangeEnd(new WalkontableCellCoords(drag[2], drag[3]));
  } else {
    this.instance.selection.refreshBorders();
  }
};
Autofill.prototype.showBorder = function(coords) {
  var topLeft = this.instance.getSelectedRange().getTopLeftCorner(),
      bottomRight = this.instance.getSelectedRange().getBottomRightCorner();
  if (this.instance.getSettings().fillHandle !== 'horizontal' && (bottomRight.row < coords.row || topLeft.row > coords.row)) {
    coords = new WalkontableCellCoords(coords.row, bottomRight.col);
  } else if (this.instance.getSettings().fillHandle !== 'vertical') {
    coords = new WalkontableCellCoords(bottomRight.row, coords.col);
  } else {
    return;
  }
  this.instance.view.wt.selections.fill.clear();
  this.instance.view.wt.selections.fill.add(this.instance.getSelectedRange().from);
  this.instance.view.wt.selections.fill.add(this.instance.getSelectedRange().to);
  this.instance.view.wt.selections.fill.add(coords);
  this.instance.view.render();
};
Autofill.prototype.checkIfNewRowNeeded = function() {
  var fillCorners,
      selection,
      tableRows = this.instance.countRows(),
      that = this;
  if (this.instance.view.wt.selections.fill.cellRange && this.addingStarted === false) {
    selection = this.instance.getSelected();
    fillCorners = this.instance.view.wt.selections.fill.getCorners();
    if (selection[2] < tableRows - 1 && fillCorners[2] === tableRows - 1) {
      this.addingStarted = true;
      this.instance._registerTimeout(setTimeout(function() {
        that.instance.alter('insert_row');
        that.addingStarted = false;
      }, 200));
    }
  }
};
Handsontable.hooks.add('afterInit', function() {
  var autofill = new Autofill(this);
  if (typeof this.getSettings().fillHandle !== 'undefined') {
    if (autofill.handle && this.getSettings().fillHandle === false) {
      autofill.disable();
    } else if (!autofill.handle && this.getSettings().fillHandle !== false) {
      this.autofill = autofill;
      this.autofill.init();
    }
  }
});
Handsontable.Autofill = Autofill;


//# 
},{"./../../3rdparty/walkontable/src/cellCoords.js":8,"./../../dom.js":34,"./../../eventManager.js":48,"./../../plugins.js":52}],56:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  ColumnSorting: {get: function() {
      return ColumnSorting;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_eventManager_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__;
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var eventManagerObject = ($___46__46__47__46__46__47_eventManager_46_js__ = require("./../../eventManager.js"), $___46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
;
function ColumnSorting() {
  var plugin = this;
  this.init = function(source) {
    var instance = this;
    var sortingSettings = instance.getSettings().columnSorting;
    var sortingColumn,
        sortingOrder;
    instance.sortingEnabled = !!(sortingSettings);
    if (instance.sortingEnabled) {
      instance.sortIndex = [];
      var loadedSortingState = loadSortingState.call(instance);
      if (typeof loadedSortingState != 'undefined') {
        sortingColumn = loadedSortingState.sortColumn;
        sortingOrder = loadedSortingState.sortOrder;
      } else {
        sortingColumn = sortingSettings.column;
        sortingOrder = sortingSettings.sortOrder;
      }
      plugin.sortByColumn.call(instance, sortingColumn, sortingOrder);
      instance.sort = function() {
        var args = Array.prototype.slice.call(arguments);
        return plugin.sortByColumn.apply(instance, args);
      };
      if (typeof instance.getSettings().observeChanges == 'undefined') {
        enableObserveChangesPlugin.call(instance);
      }
      if (source == 'afterInit') {
        bindColumnSortingAfterClick.call(instance);
        instance.addHook('afterCreateRow', plugin.afterCreateRow);
        instance.addHook('afterRemoveRow', plugin.afterRemoveRow);
        instance.addHook('afterLoadData', plugin.init);
      }
    } else {
      delete instance.sort;
      instance.removeHook('afterCreateRow', plugin.afterCreateRow);
      instance.removeHook('afterRemoveRow', plugin.afterRemoveRow);
      instance.removeHook('afterLoadData', plugin.init);
    }
  };
  this.setSortingColumn = function(col, order) {
    var instance = this;
    if (typeof col == 'undefined') {
      delete instance.sortColumn;
      delete instance.sortOrder;
      return;
    } else if (instance.sortColumn === col && typeof order == 'undefined') {
      instance.sortOrder = !instance.sortOrder;
    } else {
      instance.sortOrder = typeof order != 'undefined' ? order : true;
    }
    instance.sortColumn = col;
  };
  this.sortByColumn = function(col, order) {
    var instance = this;
    plugin.setSortingColumn.call(instance, col, order);
    if (typeof instance.sortColumn == 'undefined') {
      return;
    }
    Handsontable.hooks.run(instance, 'beforeColumnSort', instance.sortColumn, instance.sortOrder);
    plugin.sort.call(instance);
    instance.render();
    saveSortingState.call(instance);
    Handsontable.hooks.run(instance, 'afterColumnSort', instance.sortColumn, instance.sortOrder);
  };
  var saveSortingState = function() {
    var instance = this;
    var sortingState = {};
    if (typeof instance.sortColumn != 'undefined') {
      sortingState.sortColumn = instance.sortColumn;
    }
    if (typeof instance.sortOrder != 'undefined') {
      sortingState.sortOrder = instance.sortOrder;
    }
    if (sortingState.hasOwnProperty('sortColumn') || sortingState.hasOwnProperty('sortOrder')) {
      Handsontable.hooks.run(instance, 'persistentStateSave', 'columnSorting', sortingState);
    }
  };
  var loadSortingState = function() {
    var instance = this;
    var storedState = {};
    Handsontable.hooks.run(instance, 'persistentStateLoad', 'columnSorting', storedState);
    return storedState.value;
  };
  var bindColumnSortingAfterClick = function() {
    var instance = this;
    var eventManager = eventManagerObject(instance);
    eventManager.addEventListener(instance.rootElement, 'click', function(e) {
      if (dom.hasClass(e.target, 'columnSorting')) {
        var col = getColumn(e.target);
        plugin.sortByColumn.call(instance, col);
      }
    });
    function countRowHeaders() {
      var THs = instance.view.TBODY.querySelector('tr').querySelectorAll('th');
      return THs.length;
    }
    function getColumn(target) {
      var TH = dom.closest(target, 'TH');
      return dom.index(TH) - countRowHeaders();
    }
  };
  function enableObserveChangesPlugin() {
    var instance = this;
    instance._registerTimeout(setTimeout(function() {
      instance.updateSettings({observeChanges: true});
    }, 0));
  }
  function defaultSort(sortOrder) {
    return function(a, b) {
      if (typeof a[1] == "string") {
        a[1] = a[1].toLowerCase();
      }
      if (typeof b[1] == "string") {
        b[1] = b[1].toLowerCase();
      }
      if (a[1] === b[1]) {
        return 0;
      }
      if (a[1] === null || a[1] === "") {
        return 1;
      }
      if (b[1] === null || b[1] === "") {
        return -1;
      }
      if (a[1] < b[1]) {
        return sortOrder ? -1 : 1;
      }
      if (a[1] > b[1]) {
        return sortOrder ? 1 : -1;
      }
      return 0;
    };
  }
  function dateSort(sortOrder) {
    return function(a, b) {
      if (a[1] === b[1]) {
        return 0;
      }
      if (a[1] === null) {
        return 1;
      }
      if (b[1] === null) {
        return -1;
      }
      var aDate = new Date(a[1]);
      var bDate = new Date(b[1]);
      if (aDate < bDate) {
        return sortOrder ? -1 : 1;
      }
      if (aDate > bDate) {
        return sortOrder ? 1 : -1;
      }
      return 0;
    };
  }
  this.sort = function() {
    var instance = this;
    if (typeof instance.sortOrder == 'undefined') {
      return;
    }
    instance.sortingEnabled = false;
    instance.sortIndex.length = 0;
    var colOffset = this.colOffset();
    for (var i = 0,
        ilen = this.countRows() - instance.getSettings()['minSpareRows']; i < ilen; i++) {
      this.sortIndex.push([i, instance.getDataAtCell(i, this.sortColumn + colOffset)]);
    }
    var colMeta = instance.getCellMeta(0, instance.sortColumn);
    var sortFunction;
    switch (colMeta.type) {
      case 'date':
        sortFunction = dateSort;
        break;
      default:
        sortFunction = defaultSort;
    }
    this.sortIndex.sort(sortFunction(instance.sortOrder));
    for (var i = this.sortIndex.length; i < instance.countRows(); i++) {
      this.sortIndex.push([i, instance.getDataAtCell(i, this.sortColumn + colOffset)]);
    }
    instance.sortingEnabled = true;
  };
  this.translateRow = function(row) {
    var instance = this;
    if (instance.sortingEnabled && instance.sortIndex && instance.sortIndex.length && instance.sortIndex[row]) {
      return instance.sortIndex[row][0];
    }
    return row;
  };
  this.untranslateRow = function(row) {
    var instance = this;
    if (instance.sortingEnabled && instance.sortIndex && instance.sortIndex.length) {
      for (var i = 0; i < instance.sortIndex.length; i++) {
        if (instance.sortIndex[i][0] == row) {
          return i;
        }
      }
    }
  };
  this.getColHeader = function(col, TH) {
    if (this.getSettings().columnSorting && col >= 0) {
      dom.addClass(TH.querySelector('.colHeader'), 'columnSorting');
    }
  };
  function isSorted(instance) {
    return typeof instance.sortColumn != 'undefined';
  }
  this.afterCreateRow = function(index, amount) {
    var instance = this;
    if (!isSorted(instance)) {
      return;
    }
    for (var i = 0; i < instance.sortIndex.length; i++) {
      if (instance.sortIndex[i][0] >= index) {
        instance.sortIndex[i][0] += amount;
      }
    }
    for (var i = 0; i < amount; i++) {
      instance.sortIndex.splice(index + i, 0, [index + i, instance.getData()[index + i][instance.sortColumn + instance.colOffset()]]);
    }
    saveSortingState.call(instance);
  };
  this.afterRemoveRow = function(index, amount) {
    var instance = this;
    if (!isSorted(instance)) {
      return;
    }
    var physicalRemovedIndex = plugin.translateRow.call(instance, index);
    instance.sortIndex.splice(index, amount);
    for (var i = 0; i < instance.sortIndex.length; i++) {
      if (instance.sortIndex[i][0] > physicalRemovedIndex) {
        instance.sortIndex[i][0] -= amount;
      }
    }
    saveSortingState.call(instance);
  };
  this.afterChangeSort = function(changes) {
    var instance = this;
    var sortColumnChanged = false;
    var selection = {};
    if (!changes) {
      return;
    }
    for (var i = 0; i < changes.length; i++) {
      if (changes[i][1] == instance.sortColumn) {
        sortColumnChanged = true;
        selection.row = plugin.translateRow.call(instance, changes[i][0]);
        selection.col = changes[i][1];
        break;
      }
    }
    if (sortColumnChanged) {
      instance._registerTimeout(setTimeout(function() {
        plugin.sort.call(instance);
        instance.render();
        instance.selectCell(plugin.untranslateRow.call(instance, selection.row), selection.col);
      }, 0));
    }
  };
}
var htSortColumn = new ColumnSorting();
Handsontable.hooks.add('afterInit', function() {
  htSortColumn.init.call(this, 'afterInit');
});
Handsontable.hooks.add('afterUpdateSettings', function() {
  htSortColumn.init.call(this, 'afterUpdateSettings');
});
Handsontable.hooks.add('modifyRow', htSortColumn.translateRow);
Handsontable.hooks.add('afterGetColHeader', htSortColumn.getColHeader);
Handsontable.hooks.register('beforeColumnSort');
Handsontable.hooks.register('afterColumnSort');


//# 
},{"./../../dom.js":34,"./../../eventManager.js":48,"./../../plugins.js":52}],57:[function(require,module,exports){
"use strict";
var $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_helpers_46_js__,
    $___46__46__47__46__46__47_eventManager_46_js__,
    $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__;
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var helper = ($___46__46__47__46__46__47_helpers_46_js__ = require("./../../helpers.js"), $___46__46__47__46__46__47_helpers_46_js__ && $___46__46__47__46__46__47_helpers_46_js__.__esModule && $___46__46__47__46__46__47_helpers_46_js__ || {default: $___46__46__47__46__46__47_helpers_46_js__});
var eventManagerObject = ($___46__46__47__46__46__47_eventManager_46_js__ = require("./../../eventManager.js"), $___46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var WalkontableCellCoords = ($___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ = require("./../../3rdparty/walkontable/src/cellCoords.js"), $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__.__esModule && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ || {default: $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__}).WalkontableCellCoords;
function Comments(instance) {
  var eventManager = eventManagerObject(instance),
      doSaveComment = function(row, col, comment, instance) {
        instance.setCellMeta(row, col, 'comment', comment);
        instance.render();
      },
      saveComment = function(range, comment, instance) {
        doSaveComment(range.from.row, range.from.col, comment, instance);
      },
      hideCommentTextArea = function() {
        var commentBox = createCommentBox();
        commentBox.style.display = 'none';
        commentBox.value = '';
      },
      bindMouseEvent = function(range) {
        function commentsListener(event) {
          eventManager.removeEventListener(document, 'mouseover');
          if (!(event.target.className == 'htCommentTextArea' || event.target.innerHTML.indexOf('Comment') != -1)) {
            var value = document.querySelector('.htCommentTextArea').value;
            if (value.trim().length > 1) {
              saveComment(range, value, instance);
            }
            unBindMouseEvent();
            hideCommentTextArea();
          }
        }
        eventManager.addEventListener(document, 'mousedown', helper.proxy(commentsListener));
      },
      unBindMouseEvent = function() {
        eventManager.removeEventListener(document, 'mousedown');
        eventManager.addEventListener(document, 'mousedown', helper.proxy(commentsMouseOverListener));
      },
      placeCommentBox = function(range, commentBox) {
        var TD = instance.view.wt.wtTable.getCell(range.from),
            offset = dom.offset(TD),
            lastColWidth = instance.getColWidth(range.from.col);
        commentBox.style.position = 'absolute';
        commentBox.style.left = offset.left + lastColWidth + 'px';
        commentBox.style.top = offset.top + 'px';
        commentBox.style.zIndex = 2;
        bindMouseEvent(range, commentBox);
      },
      createCommentBox = function(value) {
        var comments = document.querySelector('.htComments');
        if (!comments) {
          comments = document.createElement('DIV');
          var textArea = document.createElement('TEXTAREA');
          dom.addClass(textArea, 'htCommentTextArea');
          comments.appendChild(textArea);
          dom.addClass(comments, 'htComments');
          document.getElementsByTagName('body')[0].appendChild(comments);
        }
        value = value || '';
        document.querySelector('.htCommentTextArea').value = value;
        return comments;
      },
      commentsMouseOverListener = function(event) {
        if (event.target.className.indexOf('htCommentCell') != -1) {
          unBindMouseEvent();
          var coords = instance.view.wt.wtTable.getCoords(event.target);
          var range = {from: new WalkontableCellCoords(coords.row, coords.col)};
          Handsontable.Comments.showComment(range);
        } else if (event.target.className != 'htCommentTextArea') {
          hideCommentTextArea();
        }
      };
  return {
    init: function() {
      eventManager.addEventListener(document, 'mouseover', helper.proxy(commentsMouseOverListener));
    },
    showComment: function(range) {
      var meta = instance.getCellMeta(range.from.row, range.from.col),
          value = '';
      if (meta.comment) {
        value = meta.comment;
      }
      var commentBox = createCommentBox(value);
      commentBox.style.display = 'block';
      placeCommentBox(range, commentBox);
    },
    removeComment: function(row, col) {
      instance.removeCellMeta(row, col, 'comment');
      instance.render();
    },
    checkSelectionCommentsConsistency: function() {
      var hasComment = false;
      var cell = instance.getSelectedRange().from;
      if (instance.getCellMeta(cell.row, cell.col).comment) {
        hasComment = true;
      }
      return hasComment;
    }
  };
}
var init = function() {
  var instance = this;
  var commentsSetting = instance.getSettings().comments;
  if (commentsSetting) {
    Handsontable.Comments = new Comments(instance);
    Handsontable.Comments.init();
  }
},
    afterRenderer = function(TD, row, col, prop, value, cellProperties) {
      if (cellProperties.comment) {
        dom.addClass(TD, cellProperties.commentedCellClassName);
      }
    },
    addCommentsActionsToContextMenu = function(defaultOptions) {
      var instance = this;
      if (!instance.getSettings().comments) {
        return;
      }
      defaultOptions.items.push(Handsontable.ContextMenu.SEPARATOR);
      defaultOptions.items.push({
        key: 'commentsAddEdit',
        name: function() {
          var hasComment = Handsontable.Comments.checkSelectionCommentsConsistency();
          return hasComment ? "Edit Comment" : "Add Comment";
        },
        callback: function(key, selection, event) {
          Handsontable.Comments.showComment(this.getSelectedRange());
        },
        disabled: function() {
          return false;
        }
      });
      defaultOptions.items.push({
        key: 'commentsRemove',
        name: function() {
          return "Delete Comment";
        },
        callback: function(key, selection, event) {
          Handsontable.Comments.removeComment(selection.start.row, selection.start.col);
        },
        disabled: function() {
          var hasComment = Handsontable.Comments.checkSelectionCommentsConsistency();
          return !hasComment;
        }
      });
    };
Handsontable.hooks.add('beforeInit', init);
Handsontable.hooks.add('afterContextMenuDefaultOptions', addCommentsActionsToContextMenu);
Handsontable.hooks.add('afterRenderer', afterRenderer);


//# 
},{"./../../3rdparty/walkontable/src/cellCoords.js":8,"./../../dom.js":34,"./../../eventManager.js":48,"./../../helpers.js":49}],58:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  ContextMenu: {get: function() {
      return ContextMenu;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_helpers_46_js__,
    $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_eventManager_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__;
var helper = ($___46__46__47__46__46__47_helpers_46_js__ = require("./../../helpers.js"), $___46__46__47__46__46__47_helpers_46_js__ && $___46__46__47__46__46__47_helpers_46_js__.__esModule && $___46__46__47__46__46__47_helpers_46_js__ || {default: $___46__46__47__46__46__47_helpers_46_js__});
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var eventManagerObject = ($___46__46__47__46__46__47_eventManager_46_js__ = require("./../../eventManager.js"), $___46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
;
function ContextMenu(instance, customOptions) {
  this.instance = instance;
  var contextMenu = this;
  contextMenu.menus = [];
  contextMenu.htMenus = {};
  contextMenu.triggerRows = [];
  contextMenu.eventManager = eventManagerObject(contextMenu);
  this.enabled = true;
  this.instance.addHook('afterDestroy', function() {
    contextMenu.destroy();
  });
  this.defaultOptions = {items: [{
      key: 'row_above',
      name: 'Insert row above',
      callback: function(key, selection) {
        this.alter("insert_row", selection.start.row);
      },
      disabled: function() {
        var selected = this.getSelected(),
            entireColumnSelection = [0, selected[1], this.countRows() - 1, selected[1]],
            columnSelected = entireColumnSelection.join(',') == selected.join(',');
        return selected[0] < 0 || this.countRows() >= this.getSettings().maxRows || columnSelected;
      }
    }, {
      key: 'row_below',
      name: 'Insert row below',
      callback: function(key, selection) {
        this.alter("insert_row", selection.end.row + 1);
      },
      disabled: function() {
        var selected = this.getSelected(),
            entireColumnSelection = [0, selected[1], this.countRows() - 1, selected[1]],
            columnSelected = entireColumnSelection.join(',') == selected.join(',');
        return this.getSelected()[0] < 0 || this.countRows() >= this.getSettings().maxRows || columnSelected;
      }
    }, ContextMenu.SEPARATOR, {
      key: 'col_left',
      name: 'Insert column on the left',
      callback: function(key, selection) {
        this.alter("insert_col", selection.start.col);
      },
      disabled: function() {
        var selected = this.getSelected(),
            entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1],
            rowSelected = entireRowSelection.join(',') == selected.join(',');
        return this.getSelected()[1] < 0 || this.countCols() >= this.getSettings().maxCols || rowSelected;
      }
    }, {
      key: 'col_right',
      name: 'Insert column on the right',
      callback: function(key, selection) {
        this.alter("insert_col", selection.end.col + 1);
      },
      disabled: function() {
        var selected = this.getSelected(),
            entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1],
            rowSelected = entireRowSelection.join(',') == selected.join(',');
        return selected[1] < 0 || this.countCols() >= this.getSettings().maxCols || rowSelected;
      }
    }, ContextMenu.SEPARATOR, {
      key: 'remove_row',
      name: 'Remove row',
      callback: function(key, selection) {
        var amount = selection.end.row - selection.start.row + 1;
        this.alter("remove_row", selection.start.row, amount);
      },
      disabled: function() {
        var selected = this.getSelected(),
            entireColumnSelection = [0, selected[1], this.countRows() - 1, selected[1]],
            columnSelected = entireColumnSelection.join(',') == selected.join(',');
        return (selected[0] < 0 || columnSelected);
      }
    }, {
      key: 'remove_col',
      name: 'Remove column',
      callback: function(key, selection) {
        var amount = selection.end.col - selection.start.col + 1;
        this.alter("remove_col", selection.start.col, amount);
      },
      disabled: function() {
        var selected = this.getSelected(),
            entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1],
            rowSelected = entireRowSelection.join(',') == selected.join(',');
        return (selected[1] < 0 || rowSelected);
      }
    }, ContextMenu.SEPARATOR, {
      key: 'undo',
      name: 'Undo',
      callback: function() {
        this.undo();
      },
      disabled: function() {
        return this.undoRedo && !this.undoRedo.isUndoAvailable();
      }
    }, {
      key: 'redo',
      name: 'Redo',
      callback: function() {
        this.redo();
      },
      disabled: function() {
        return this.undoRedo && !this.undoRedo.isRedoAvailable();
      }
    }, ContextMenu.SEPARATOR, {
      key: 'make_read_only',
      name: function() {
        var label = "Read only";
        var atLeastOneReadOnly = contextMenu.checkSelectionReadOnlyConsistency(this);
        if (atLeastOneReadOnly) {
          label = contextMenu.markSelected(label);
        }
        return label;
      },
      callback: function() {
        var atLeastOneReadOnly = contextMenu.checkSelectionReadOnlyConsistency(this);
        var that = this;
        this.getSelectedRange().forAll(function(r, c) {
          that.getCellMeta(r, c).readOnly = atLeastOneReadOnly ? false : true;
        });
        this.render();
      }
    }, ContextMenu.SEPARATOR, {
      key: 'alignment',
      name: 'Alignment',
      submenu: {items: [{
          name: function() {
            var label = "Left";
            var hasClass = contextMenu.checkSelectionAlignment(this, 'htLeft');
            if (hasClass) {
              label = contextMenu.markSelected(label);
            }
            return label;
          },
          callback: function() {
            align.call(this, this.getSelectedRange(), 'horizontal', 'htLeft');
          },
          disabled: false
        }, {
          name: function() {
            var label = "Center";
            var hasClass = contextMenu.checkSelectionAlignment(this, 'htCenter');
            if (hasClass) {
              label = contextMenu.markSelected(label);
            }
            return label;
          },
          callback: function() {
            align.call(this, this.getSelectedRange(), 'horizontal', 'htCenter');
          },
          disabled: false
        }, {
          name: function() {
            var label = "Right";
            var hasClass = contextMenu.checkSelectionAlignment(this, 'htRight');
            if (hasClass) {
              label = contextMenu.markSelected(label);
            }
            return label;
          },
          callback: function() {
            align.call(this, this.getSelectedRange(), 'horizontal', 'htRight');
          },
          disabled: false
        }, {
          name: function() {
            var label = "Justify";
            var hasClass = contextMenu.checkSelectionAlignment(this, 'htJustify');
            if (hasClass) {
              label = contextMenu.markSelected(label);
            }
            return label;
          },
          callback: function() {
            align.call(this, this.getSelectedRange(), 'horizontal', 'htJustify');
          },
          disabled: false
        }, ContextMenu.SEPARATOR, {
          name: function() {
            var label = "Top";
            var hasClass = contextMenu.checkSelectionAlignment(this, 'htTop');
            if (hasClass) {
              label = contextMenu.markSelected(label);
            }
            return label;
          },
          callback: function() {
            align.call(this, this.getSelectedRange(), 'vertical', 'htTop');
          },
          disabled: false
        }, {
          name: function() {
            var label = "Middle";
            var hasClass = contextMenu.checkSelectionAlignment(this, 'htMiddle');
            if (hasClass) {
              label = contextMenu.markSelected(label);
            }
            return label;
          },
          callback: function() {
            align.call(this, this.getSelectedRange(), 'vertical', 'htMiddle');
          },
          disabled: false
        }, {
          name: function() {
            var label = "Bottom";
            var hasClass = contextMenu.checkSelectionAlignment(this, 'htBottom');
            if (hasClass) {
              label = contextMenu.markSelected(label);
            }
            return label;
          },
          callback: function() {
            align.call(this, this.getSelectedRange(), 'vertical', 'htBottom');
          },
          disabled: false
        }]}
    }]};
  contextMenu.options = {};
  helper.extend(contextMenu.options, this.options);
  this.bindMouseEvents();
  this.markSelected = function(label) {
    return "<span class='selected'>" + String.fromCharCode(10003) + "</span>" + label;
  };
  this.checkSelectionAlignment = function(hot, className) {
    var hasAlignment = false;
    hot.getSelectedRange().forAll(function(r, c) {
      var metaClassName = hot.getCellMeta(r, c).className;
      if (metaClassName && metaClassName.indexOf(className) != -1) {
        hasAlignment = true;
        return false;
      }
    });
    return hasAlignment;
  };
  if (!this.instance.getSettings().allowInsertRow) {
    var rowAboveIndex = findIndexByKey(this.defaultOptions.items, 'row_above');
    this.defaultOptions.items.splice(rowAboveIndex, 1);
    var rowBelowIndex = findIndexByKey(this.defaultOptions.items, 'row_above');
    this.defaultOptions.items.splice(rowBelowIndex, 1);
    this.defaultOptions.items.splice(rowBelowIndex, 1);
  }
  if (!this.instance.getSettings().allowInsertColumn) {
    var colLeftIndex = findIndexByKey(this.defaultOptions.items, 'col_left');
    this.defaultOptions.items.splice(colLeftIndex, 1);
    var colRightIndex = findIndexByKey(this.defaultOptions.items, 'col_right');
    this.defaultOptions.items.splice(colRightIndex, 1);
    this.defaultOptions.items.splice(colRightIndex, 1);
  }
  var removeRow = false;
  var removeCol = false;
  var removeRowIndex,
      removeColumnIndex;
  if (!this.instance.getSettings().allowRemoveRow) {
    removeRowIndex = findIndexByKey(this.defaultOptions.items, 'remove_row');
    this.defaultOptions.items.splice(removeRowIndex, 1);
    removeRow = true;
  }
  if (!this.instance.getSettings().allowRemoveColumn) {
    removeColumnIndex = findIndexByKey(this.defaultOptions.items, 'remove_col');
    this.defaultOptions.items.splice(removeColumnIndex, 1);
    removeCol = true;
  }
  if (removeRow && removeCol) {
    this.defaultOptions.items.splice(removeColumnIndex, 1);
  }
  this.checkSelectionReadOnlyConsistency = function(hot) {
    var atLeastOneReadOnly = false;
    hot.getSelectedRange().forAll(function(r, c) {
      if (hot.getCellMeta(r, c).readOnly) {
        atLeastOneReadOnly = true;
        return false;
      }
    });
    return atLeastOneReadOnly;
  };
  Handsontable.hooks.run(instance, 'afterContextMenuDefaultOptions', this.defaultOptions);
}
ContextMenu.prototype.createMenu = function(menuName, row) {
  if (menuName) {
    menuName = menuName.replace(/ /g, '_');
    menuName = 'htContextSubMenu_' + menuName;
  }
  var menu;
  if (menuName) {
    menu = document.querySelector('.htContextMenu.' + menuName);
  } else {
    menu = document.querySelector('.htContextMenu');
  }
  if (!menu) {
    menu = document.createElement('DIV');
    dom.addClass(menu, 'htContextMenu');
    if (menuName) {
      dom.addClass(menu, menuName);
    }
    document.getElementsByTagName('body')[0].appendChild(menu);
  }
  if (this.menus.indexOf(menu) < 0) {
    this.menus.push(menu);
    row = row || 0;
    this.triggerRows.push(row);
  }
  return menu;
};
ContextMenu.prototype.bindMouseEvents = function() {
  function contextMenuOpenListener(event) {
    var settings = this.instance.getSettings(),
        showRowHeaders = this.instance.getSettings().rowHeaders,
        showColHeaders = this.instance.getSettings().colHeaders,
        containsCornerHeader,
        element,
        items,
        menu;
    function isValidElement(element) {
      return element.nodeName === 'TD' || element.parentNode.nodeName === 'TD';
    }
    element = event.realTarget;
    this.closeAll();
    event.preventDefault();
    helper.stopPropagation(event);
    if (!(showRowHeaders || showColHeaders)) {
      if (!isValidElement(element) && !(dom.hasClass(element, 'current') && dom.hasClass(element, 'wtBorder'))) {
        return;
      }
    } else if (showRowHeaders && showColHeaders) {
      containsCornerHeader = element.parentNode.querySelectorAll('.cornerHeader').length > 0;
      if (containsCornerHeader) {
        return;
      }
    }
    menu = this.createMenu();
    items = this.getItems(settings.contextMenu);
    this.show(menu, items);
    this.setMenuPosition(event, menu);
    this.eventManager.addEventListener(document.documentElement, 'mousedown', helper.proxy(ContextMenu.prototype.closeAll, this));
  }
  var eventManager = eventManagerObject(this.instance);
  eventManager.addEventListener(this.instance.rootElement, 'contextmenu', helper.proxy(contextMenuOpenListener, this));
};
ContextMenu.prototype.bindTableEvents = function() {
  this._afterScrollCallback = function() {};
  this.instance.addHook('afterScrollVertically', this._afterScrollCallback);
  this.instance.addHook('afterScrollHorizontally', this._afterScrollCallback);
};
ContextMenu.prototype.unbindTableEvents = function() {
  if (this._afterScrollCallback) {
    this.instance.removeHook('afterScrollVertically', this._afterScrollCallback);
    this.instance.removeHook('afterScrollHorizontally', this._afterScrollCallback);
    this._afterScrollCallback = null;
  }
};
ContextMenu.prototype.performAction = function(event, hot) {
  var contextMenu = this;
  var selectedItemIndex = hot.getSelected()[0];
  var selectedItem = hot.getData()[selectedItemIndex];
  if (selectedItem.disabled === true || (typeof selectedItem.disabled == 'function' && selectedItem.disabled.call(this.instance) === true)) {
    return;
  }
  if (!selectedItem.hasOwnProperty('submenu')) {
    if (typeof selectedItem.callback != 'function') {
      return;
    }
    var selRange = this.instance.getSelectedRange();
    var normalizedSelection = ContextMenu.utils.normalizeSelection(selRange);
    selectedItem.callback.call(this.instance, selectedItem.key, normalizedSelection, event);
    contextMenu.closeAll();
  }
};
ContextMenu.prototype.unbindMouseEvents = function() {
  this.eventManager.clear();
  var eventManager = eventManagerObject(this.instance);
  eventManager.removeEventListener(this.instance.rootElement, 'contextmenu');
};
ContextMenu.prototype.show = function(menu, items) {
  var that = this;
  menu.removeAttribute('style');
  menu.style.display = 'block';
  var settings = {
    data: items,
    colHeaders: false,
    colWidths: [200],
    readOnly: true,
    copyPaste: false,
    columns: [{
      data: 'name',
      renderer: helper.proxy(this.renderer, this)
    }],
    renderAllRows: true,
    beforeKeyDown: function(event) {
      that.onBeforeKeyDown(event, htContextMenu);
    },
    afterOnCellMouseOver: function(event, coords, TD) {
      that.onCellMouseOver(event, coords, TD, htContextMenu);
    }
  };
  var htContextMenu = new Handsontable(menu, settings);
  htContextMenu.isHotTableEnv = this.instance.isHotTableEnv;
  Handsontable.eventManager.isHotTableEnv = this.instance.isHotTableEnv;
  this.eventManager.removeEventListener(menu, 'mousedown');
  this.eventManager.addEventListener(menu, 'mousedown', function(event) {
    that.performAction(event, htContextMenu);
  });
  this.bindTableEvents();
  htContextMenu.listen();
  this.htMenus[htContextMenu.guid] = htContextMenu;
  Handsontable.hooks.run(this.instance, 'afterContextMenuShow', htContextMenu);
};
ContextMenu.prototype.close = function(menu) {
  this.hide(menu);
  this.eventManager.clear();
  this.unbindTableEvents();
  this.instance.listen();
};
ContextMenu.prototype.closeAll = function() {
  while (this.menus.length > 0) {
    var menu = this.menus.pop();
    if (menu) {
      this.close(menu);
    }
  }
  this.triggerRows = [];
};
ContextMenu.prototype.closeLastOpenedSubMenu = function() {
  var menu = this.menus.pop();
  if (menu) {
    this.hide(menu);
  }
};
ContextMenu.prototype.hide = function(menu) {
  menu.style.display = 'none';
  var instance = this.htMenus[menu.id];
  Handsontable.hooks.run(this.instance, 'afterContextMenuHide', instance);
  instance.destroy();
  delete this.htMenus[menu.id];
};
ContextMenu.prototype.renderer = function(instance, TD, row, col, prop, value) {
  var contextMenu = this;
  var item = instance.getData()[row];
  var wrapper = document.createElement('DIV');
  if (typeof value === 'function') {
    value = value.call(this.instance);
  }
  dom.empty(TD);
  TD.appendChild(wrapper);
  if (itemIsSeparator(item)) {
    dom.addClass(TD, 'htSeparator');
  } else {
    dom.fastInnerHTML(wrapper, value);
  }
  if (itemIsDisabled(item)) {
    dom.addClass(TD, 'htDisabled');
    this.eventManager.addEventListener(wrapper, 'mouseenter', function() {
      instance.deselectCell();
    });
  } else {
    if (isSubMenu(item)) {
      dom.addClass(TD, 'htSubmenu');
      this.eventManager.addEventListener(wrapper, 'mouseenter', function() {
        instance.selectCell(row, col);
      });
    } else {
      dom.removeClass(TD, 'htSubmenu');
      dom.removeClass(TD, 'htDisabled');
      this.eventManager.addEventListener(wrapper, 'mouseenter', function() {
        instance.selectCell(row, col);
      });
    }
  }
  function isSubMenu(item) {
    return item.hasOwnProperty('submenu');
  }
  function itemIsSeparator(item) {
    return new RegExp(ContextMenu.SEPARATOR.name, 'i').test(item.name);
  }
  function itemIsDisabled(item) {
    return item.disabled === true || (typeof item.disabled == 'function' && item.disabled.call(contextMenu.instance) === true);
  }
};
ContextMenu.prototype.onCellMouseOver = function(event, coords, TD, hot) {
  var menusLength = this.menus.length;
  if (menusLength > 0) {
    var lastMenu = this.menus[menusLength - 1];
    if (lastMenu.id != hot.guid) {
      this.closeLastOpenedSubMenu();
    }
  } else {
    this.closeLastOpenedSubMenu();
  }
  if (TD.className.indexOf('htSubmenu') != -1) {
    var selectedItem = hot.getData()[coords.row];
    var items = this.getItems(selectedItem.submenu);
    var subMenu = this.createMenu(selectedItem.name, coords.row);
    var tdCoords = TD.getBoundingClientRect();
    this.show(subMenu, items);
    this.setSubMenuPosition(tdCoords, subMenu);
  }
};
ContextMenu.prototype.onBeforeKeyDown = function(event, instance) {
  dom.enableImmediatePropagation(event);
  var contextMenu = this;
  var selection = instance.getSelected();
  switch (event.keyCode) {
    case helper.keyCode.ESCAPE:
      contextMenu.closeAll();
      event.preventDefault();
      event.stopImmediatePropagation();
      break;
    case helper.keyCode.ENTER:
      if (selection) {
        contextMenu.performAction(event, instance);
      }
      break;
    case helper.keyCode.ARROW_DOWN:
      if (!selection) {
        selectFirstCell(instance, contextMenu);
      } else {
        selectNextCell(selection[0], selection[1], instance, contextMenu);
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      break;
    case helper.keyCode.ARROW_UP:
      if (!selection) {
        selectLastCell(instance, contextMenu);
      } else {
        selectPrevCell(selection[0], selection[1], instance, contextMenu);
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      break;
    case helper.keyCode.ARROW_RIGHT:
      if (selection) {
        var row = selection[0];
        var cell = instance.getCell(selection[0], 0);
        if (ContextMenu.utils.hasSubMenu(cell)) {
          openSubMenu(instance, contextMenu, cell, row);
        }
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      break;
    case helper.keyCode.ARROW_LEFT:
      if (selection) {
        if (instance.rootElement.className.indexOf('htContextSubMenu_') != -1) {
          contextMenu.closeLastOpenedSubMenu();
          var index = contextMenu.menus.length;
          if (index > 0) {
            var menu = contextMenu.menus[index - 1];
            var triggerRow = contextMenu.triggerRows.pop();
            instance = this.htMenus[menu.id];
            instance.selectCell(triggerRow, 0);
          }
        }
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      break;
  }
  function selectFirstCell(instance) {
    var firstCell = instance.getCell(0, 0);
    if (ContextMenu.utils.isSeparator(firstCell) || ContextMenu.utils.isDisabled(firstCell)) {
      selectNextCell(0, 0, instance);
    } else {
      instance.selectCell(0, 0);
    }
  }
  function selectLastCell(instance) {
    var lastRow = instance.countRows() - 1;
    var lastCell = instance.getCell(lastRow, 0);
    if (ContextMenu.utils.isSeparator(lastCell) || ContextMenu.utils.isDisabled(lastCell)) {
      selectPrevCell(lastRow, 0, instance);
    } else {
      instance.selectCell(lastRow, 0);
    }
  }
  function selectNextCell(row, col, instance) {
    var nextRow = row + 1;
    var nextCell = nextRow < instance.countRows() ? instance.getCell(nextRow, col) : null;
    if (!nextCell) {
      return;
    }
    if (ContextMenu.utils.isSeparator(nextCell) || ContextMenu.utils.isDisabled(nextCell)) {
      selectNextCell(nextRow, col, instance);
    } else {
      instance.selectCell(nextRow, col);
    }
  }
  function selectPrevCell(row, col, instance) {
    var prevRow = row - 1;
    var prevCell = prevRow >= 0 ? instance.getCell(prevRow, col) : null;
    if (!prevCell) {
      return;
    }
    if (ContextMenu.utils.isSeparator(prevCell) || ContextMenu.utils.isDisabled(prevCell)) {
      selectPrevCell(prevRow, col, instance);
    } else {
      instance.selectCell(prevRow, col);
    }
  }
  function openSubMenu(instance, contextMenu, cell, row) {
    var selectedItem = instance.getData()[row];
    var items = contextMenu.getItems(selectedItem.submenu);
    var subMenu = contextMenu.createMenu(selectedItem.name, row);
    var coords = cell.getBoundingClientRect();
    var subMenuInstance = contextMenu.show(subMenu, items);
    contextMenu.setSubMenuPosition(coords, subMenu);
    subMenuInstance.selectCell(0, 0);
  }
};
function findByKey(items, key) {
  for (var i = 0,
      ilen = items.length; i < ilen; i++) {
    if (items[i].key === key) {
      return items[i];
    }
  }
}
function findIndexByKey(items, key) {
  for (var i = 0,
      ilen = items.length; i < ilen; i++) {
    if (items[i].key === key) {
      return i;
    }
  }
}
ContextMenu.prototype.getItems = function(items) {
  var menu,
      item;
  function ContextMenuItem(rawItem) {
    if (typeof rawItem == 'string') {
      this.name = rawItem;
    } else {
      helper.extend(this, rawItem);
    }
  }
  ContextMenuItem.prototype = items;
  if (items && items.items) {
    items = items.items;
  }
  if (items === true) {
    items = this.defaultOptions.items;
  }
  if (1 == 1) {
    menu = [];
    for (var key in items) {
      if (items.hasOwnProperty(key)) {
        if (typeof items[key] === 'string') {
          item = findByKey(this.defaultOptions.items, items[key]);
        } else {
          item = findByKey(this.defaultOptions.items, key);
        }
        if (!item) {
          item = items[key];
        }
        item = new ContextMenuItem(item);
        if (typeof items[key] === 'object') {
          helper.extend(item, items[key]);
        }
        if (!item.key) {
          item.key = key;
        }
        menu.push(item);
      }
    }
  }
  return menu;
};
ContextMenu.prototype.setSubMenuPosition = function(coords, menu) {
  var scrollTop = dom.getWindowScrollTop();
  var scrollLeft = dom.getWindowScrollLeft();
  var cursor = {
    top: scrollTop + coords.top,
    topRelative: coords.top,
    left: coords.left,
    leftRelative: coords.left - scrollLeft,
    scrollTop: scrollTop,
    scrollLeft: scrollLeft,
    cellHeight: coords.height,
    cellWidth: coords.width
  };
  if (this.menuFitsBelowCursor(cursor, menu, document.body.clientWidth)) {
    this.positionMenuBelowCursor(cursor, menu, true);
  } else {
    if (this.menuFitsAboveCursor(cursor, menu)) {
      this.positionMenuAboveCursor(cursor, menu, true);
    } else {
      this.positionMenuBelowCursor(cursor, menu, true);
    }
  }
  if (this.menuFitsOnRightOfCursor(cursor, menu, document.body.clientWidth)) {
    this.positionMenuOnRightOfCursor(cursor, menu, true);
  } else {
    this.positionMenuOnLeftOfCursor(cursor, menu, true);
  }
};
ContextMenu.prototype.setMenuPosition = function(event, menu) {
  var scrollTop = dom.getWindowScrollTop();
  var scrollLeft = dom.getWindowScrollLeft();
  var cursorY = event.pageY || (event.clientY + scrollTop);
  var cursorX = event.pageX || (event.clientX + scrollLeft);
  var cursor = {
    top: cursorY,
    topRelative: cursorY - scrollTop,
    left: cursorX,
    leftRelative: cursorX - scrollLeft,
    scrollTop: scrollTop,
    scrollLeft: scrollLeft,
    cellHeight: event.target.clientHeight,
    cellWidth: event.target.clientWidth
  };
  if (this.menuFitsBelowCursor(cursor, menu, document.body.clientHeight)) {
    this.positionMenuBelowCursor(cursor, menu);
  } else {
    if (this.menuFitsAboveCursor(cursor, menu)) {
      this.positionMenuAboveCursor(cursor, menu);
    } else {
      this.positionMenuBelowCursor(cursor, menu);
    }
  }
  if (this.menuFitsOnRightOfCursor(cursor, menu, document.body.clientWidth)) {
    this.positionMenuOnRightOfCursor(cursor, menu);
  } else {
    this.positionMenuOnLeftOfCursor(cursor, menu);
  }
};
ContextMenu.prototype.menuFitsAboveCursor = function(cursor, menu) {
  return cursor.topRelative >= menu.offsetHeight;
};
ContextMenu.prototype.menuFitsBelowCursor = function(cursor, menu, viewportHeight) {
  return cursor.topRelative + menu.offsetHeight <= viewportHeight;
};
ContextMenu.prototype.menuFitsOnRightOfCursor = function(cursor, menu, viewportHeight) {
  return cursor.leftRelative + menu.offsetWidth <= viewportHeight;
};
ContextMenu.prototype.positionMenuBelowCursor = function(cursor, menu) {
  menu.style.top = cursor.top + 'px';
};
ContextMenu.prototype.positionMenuAboveCursor = function(cursor, menu, subMenu) {
  if (subMenu) {
    menu.style.top = (cursor.top + cursor.cellHeight - menu.offsetHeight) + 'px';
  } else {
    menu.style.top = (cursor.top - menu.offsetHeight) + 'px';
  }
};
ContextMenu.prototype.positionMenuOnRightOfCursor = function(cursor, menu, subMenu) {
  if (subMenu) {
    menu.style.left = 1 + cursor.left + cursor.cellWidth + 'px';
  } else {
    menu.style.left = 1 + cursor.left + 'px';
  }
};
ContextMenu.prototype.positionMenuOnLeftOfCursor = function(cursor, menu, subMenu) {
  if (subMenu) {
    menu.style.left = (cursor.left - menu.offsetWidth) + 'px';
  } else {
    menu.style.left = (cursor.left - menu.offsetWidth) + 'px';
  }
};
ContextMenu.utils = {};
ContextMenu.utils.normalizeSelection = function(selRange) {
  return {
    start: selRange.getTopLeftCorner(),
    end: selRange.getBottomRightCorner()
  };
};
ContextMenu.utils.isSeparator = function(cell) {
  return dom.hasClass(cell, 'htSeparator');
};
ContextMenu.utils.hasSubMenu = function(cell) {
  return dom.hasClass(cell, 'htSubmenu');
};
ContextMenu.utils.isDisabled = function(cell) {
  return dom.hasClass(cell, 'htDisabled');
};
ContextMenu.prototype.enable = function() {
  if (!this.enabled) {
    this.enabled = true;
    this.bindMouseEvents();
  }
};
ContextMenu.prototype.disable = function() {
  if (this.enabled) {
    this.enabled = false;
    this.closeAll();
    this.unbindMouseEvents();
    this.unbindTableEvents();
  }
};
ContextMenu.prototype.destroy = function() {
  this.closeAll();
  while (this.menus.length > 0) {
    var menu = this.menus.pop();
    this.triggerRows.pop();
    if (menu) {
      this.close(menu);
      if (!this.isMenuEnabledByOtherHotInstance()) {
        this.removeMenu(menu);
      }
    }
  }
  this.unbindMouseEvents();
  this.unbindTableEvents();
};
ContextMenu.prototype.isMenuEnabledByOtherHotInstance = function() {
  var hotContainers = document.querySelectorAll('.handsontable');
  var menuEnabled = false;
  for (var i = 0,
      len = hotContainers.length; i < len; i++) {
    var instance = this.htMenus[hotContainers[i].id];
    if (instance && instance.getSettings().contextMenu) {
      menuEnabled = true;
      break;
    }
  }
  return menuEnabled;
};
ContextMenu.prototype.removeMenu = function(menu) {
  if (menu.parentNode) {
    this.menu.parentNode.removeChild(menu);
  }
};
ContextMenu.prototype.align = function(range, type, alignment) {
  align.call(this, range, type, alignment);
};
ContextMenu.SEPARATOR = {name: "---------"};
function updateHeight() {
  if (this.rootElement.className.indexOf('htContextMenu')) {
    return;
  }
  var realSeparatorHeight = 0,
      realEntrySize = 0,
      dataSize = this.getSettings().data.length,
      currentHiderWidth = parseInt(this.view.wt.wtTable.hider.style.width, 10);
  for (var i = 0; i < dataSize; i++) {
    if (this.getSettings().data[i].name == ContextMenu.SEPARATOR.name) {
      realSeparatorHeight += 1;
    } else {
      realEntrySize += 26;
    }
  }
  this.view.wt.wtTable.holder.style.width = currentHiderWidth + 22 + "px";
  this.view.wt.wtTable.holder.style.height = realEntrySize + realSeparatorHeight + 4 + "px";
}
function prepareVerticalAlignClass(className, alignment) {
  if (className.indexOf(alignment) != -1) {
    return className;
  }
  className = className.replace('htTop', '').replace('htMiddle', '').replace('htBottom', '').replace('  ', '');
  className += " " + alignment;
  return className;
}
function prepareHorizontalAlignClass(className, alignment) {
  if (className.indexOf(alignment) != -1) {
    return className;
  }
  className = className.replace('htLeft', '').replace('htCenter', '').replace('htRight', '').replace('htJustify', '').replace('  ', '');
  className += " " + alignment;
  return className;
}
function getAlignmentClasses(range) {
  var classesArray = {};
  for (var row = range.from.row; row <= range.to.row; row++) {
    for (var col = range.from.col; col <= range.to.col; col++) {
      if (!classesArray[row]) {
        classesArray[row] = [];
      }
      classesArray[row][col] = this.getCellMeta(row, col).className;
    }
  }
  return classesArray;
}
function doAlign(row, col, type, alignment) {
  var cellMeta = this.getCellMeta(row, col),
      className = alignment;
  if (cellMeta.className) {
    if (type === 'vertical') {
      className = prepareVerticalAlignClass(cellMeta.className, alignment);
    } else {
      className = prepareHorizontalAlignClass(cellMeta.className, alignment);
    }
  }
  this.setCellMeta(row, col, 'className', className);
}
function align(range, type, alignment) {
  var stateBefore = getAlignmentClasses.call(this, range);
  this.runHooks('beforeCellAlignment', stateBefore, range, type, alignment);
  if (range.from.row == range.to.row && range.from.col == range.to.col) {
    doAlign.call(this, range.from.row, range.from.col, type, alignment);
  } else {
    for (var row = range.from.row; row <= range.to.row; row++) {
      for (var col = range.from.col; col <= range.to.col; col++) {
        doAlign.call(this, row, col, type, alignment);
      }
    }
  }
  this.render();
}
function init() {
  var instance = this;
  var contextMenuSetting = instance.getSettings().contextMenu;
  var customOptions = helper.isObject(contextMenuSetting) ? contextMenuSetting : {};
  if (contextMenuSetting) {
    if (!instance.contextMenu) {
      instance.contextMenu = new ContextMenu(instance, customOptions);
    }
    instance.contextMenu.enable();
  } else if (instance.contextMenu) {
    instance.contextMenu.destroy();
    delete instance.contextMenu;
  }
}
Handsontable.hooks.add('afterInit', init);
Handsontable.hooks.add('afterUpdateSettings', init);
Handsontable.hooks.add('afterInit', updateHeight);
Handsontable.hooks.register('afterContextMenuDefaultOptions');
Handsontable.hooks.register('afterContextMenuShow');
Handsontable.hooks.register('afterContextMenuHide');
Handsontable.ContextMenu = ContextMenu;


//# 
},{"./../../dom.js":34,"./../../eventManager.js":48,"./../../helpers.js":49,"./../../plugins.js":52}],59:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  default: {get: function() {
      return $__default;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_eventManager_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__,
    $___46__46__47__95_base_46_js__,
    $__zeroclipboard__;
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var eventManagerObject = ($___46__46__47__46__46__47_eventManager_46_js__ = require("./../../eventManager.js"), $___46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
var BasePlugin = ($___46__46__47__95_base_46_js__ = require("./../_base.js"), $___46__46__47__95_base_46_js__ && $___46__46__47__95_base_46_js__.__esModule && $___46__46__47__95_base_46_js__ || {default: $___46__46__47__95_base_46_js__}).default;
var ZeroClipboard = ($__zeroclipboard__ = require("zeroclipboard"), $__zeroclipboard__ && $__zeroclipboard__.__esModule && $__zeroclipboard__ || {default: $__zeroclipboard__}).default;
var ContextMenuCopyPaste = function ContextMenuCopyPaste(hotInstance) {
  var $__4 = this;
  $traceurRuntime.superConstructor($ContextMenuCopyPaste).call(this, hotInstance);
  this.swfPath = null;
  this.hotContextMenu = null;
  this.outsideClickDeselectsCache = null;
  this.hot.addHook('afterContextMenuShow', (function(htContextMenu) {
    return $__4.setupZeroClipboard(htContextMenu);
  }));
  this.hot.addHook('afterInit', (function() {
    return $__4.afterInit();
  }));
  this.hot.addHook('afterContextMenuDefaultOptions', (function(options) {
    return $__4.addToContextMenu(options);
  }));
};
var $ContextMenuCopyPaste = ContextMenuCopyPaste;
($traceurRuntime.createClass)(ContextMenuCopyPaste, {
  afterInit: function() {
    if (!this.hot.getSettings().contextMenuCopyPaste) {
      return;
    } else if (typeof this.hot.getSettings().contextMenuCopyPaste == 'object') {
      this.swfPath = this.hot.getSettings().contextMenuCopyPaste.swfPath;
    }
    if (typeof ZeroClipboard === 'undefined') {
      throw new Error("To be able to use the Copy/Paste feature from the context menu, you need to manualy include ZeroClipboard.js file to your website.");
    }
    try {
      new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
    } catch (exception) {
      if ('undefined' == typeof navigator.mimeTypes['application/x-shockwave-flash']) {
        throw new Error("To be able to use the Copy/Paste feature from the context menu, your browser needs to have Flash Plugin installed.");
      }
    }
    this.prepareZeroClipboard();
  },
  prepareZeroClipboard: function() {
    if (this.swfPath) {
      ZeroClipboard.config({swfPath: this.swfPath});
    }
  },
  getCopyValue: function() {
    this.hot.copyPaste.setCopyableText();
    return this.hot.copyPaste.copyPasteInstance.elTextarea.value;
  },
  addToContextMenu: function(defaultOptions) {
    if (!this.hot.getSettings().contextMenuCopyPaste) {
      return;
    }
    defaultOptions.items.unshift({
      key: 'copy',
      name: 'Copy'
    }, {
      key: 'paste',
      name: 'Paste',
      callback: function() {
        this.copyPaste.triggerPaste();
      }
    }, Handsontable.ContextMenu.SEPARATOR);
  },
  setupZeroClipboard: function(hotContextMenu) {
    var $__4 = this;
    var data,
        zeroClipboardInstance;
    if (!this.hot.getSettings().contextMenuCopyPaste) {
      return;
    }
    this.hotContextMenu = hotContextMenu;
    data = this.hotContextMenu.getData();
    for (var i = 0,
        ilen = data.length; i < ilen; i++) {
      if (data[i].key === 'copy') {
        zeroClipboardInstance = new ZeroClipboard(this.hotContextMenu.getCell(i, 0));
        zeroClipboardInstance.off();
        zeroClipboardInstance.on('copy', (function(event) {
          var clipboard = event.clipboardData;
          clipboard.setData('text/plain', $__4.getCopyValue());
          $__4.hot.getSettings().outsideClickDeselects = $__4.outsideClickDeselectsCache;
        }));
        this.bindEvents();
        break;
      }
    }
  },
  removeCurrentClass: function() {
    if (this.hotContextMenu.rootElement) {
      var element = this.hotContextMenu.rootElement.querySelector('td.current');
      if (element) {
        dom.removeClass(element, 'current');
      }
    }
    this.outsideClickDeselectsCache = this.hot.getSettings().outsideClickDeselects;
    this.hot.getSettings().outsideClickDeselects = false;
  },
  removeZeroClipboardClass: function() {
    if (this.hotContextMenu.rootElement) {
      var element = this.hotContextMenu.rootElement.querySelector('td.zeroclipboard-is-hover');
      if (element) {
        dom.removeClass(element, 'zeroclipboard-is-hover');
      }
    }
    this.hot.getSettings().outsideClickDeselects = this.outsideClickDeselectsCache;
  },
  bindEvents: function() {
    var $__4 = this;
    var eventManager = eventManagerObject(this.hotContextMenu);
    eventManager.addEventListener(document, 'mouseenter', (function() {
      return $__4.removeCurrentClass();
    }));
    eventManager.addEventListener(document, 'mouseleave', (function() {
      return $__4.removeZeroClipboardClass();
    }));
  }
}, {}, BasePlugin);
var $__default = ContextMenuCopyPaste;
registerPlugin('contextMenuCopyPaste', ContextMenuCopyPaste);


//# 
},{"./../../dom.js":34,"./../../eventManager.js":48,"./../../plugins.js":52,"./../_base.js":53,"zeroclipboard":"zeroclipboard"}],60:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  CopyPaste: {get: function() {
      return CopyPaste;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_helpers_46_js__,
    $___46__46__47__46__46__47_3rdparty_47_sheetclip_46_js__,
    $___46__46__47__46__46__47_3rdparty_47_copypaste_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__,
    $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__,
    $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__;
var helper = ($___46__46__47__46__46__47_helpers_46_js__ = require("./../../helpers.js"), $___46__46__47__46__46__47_helpers_46_js__ && $___46__46__47__46__46__47_helpers_46_js__.__esModule && $___46__46__47__46__46__47_helpers_46_js__ || {default: $___46__46__47__46__46__47_helpers_46_js__});
var SheetClip = ($___46__46__47__46__46__47_3rdparty_47_sheetclip_46_js__ = require("./../../3rdparty/sheetclip.js"), $___46__46__47__46__46__47_3rdparty_47_sheetclip_46_js__ && $___46__46__47__46__46__47_3rdparty_47_sheetclip_46_js__.__esModule && $___46__46__47__46__46__47_3rdparty_47_sheetclip_46_js__ || {default: $___46__46__47__46__46__47_3rdparty_47_sheetclip_46_js__}).default;
var copyPasteManager = ($___46__46__47__46__46__47_3rdparty_47_copypaste_46_js__ = require("./../../3rdparty/copypaste.js"), $___46__46__47__46__46__47_3rdparty_47_copypaste_46_js__ && $___46__46__47__46__46__47_3rdparty_47_copypaste_46_js__.__esModule && $___46__46__47__46__46__47_3rdparty_47_copypaste_46_js__ || {default: $___46__46__47__46__46__47_3rdparty_47_copypaste_46_js__}).copyPasteManager;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
var WalkontableCellCoords = ($___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ = require("./../../3rdparty/walkontable/src/cellCoords.js"), $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__.__esModule && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ || {default: $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__}).WalkontableCellCoords;
var WalkontableCellRange = ($___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__ = require("./../../3rdparty/walkontable/src/cellRange.js"), $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__ && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__.__esModule && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__ || {default: $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__}).WalkontableCellRange;
;
function CopyPastePlugin(instance) {
  var _this = this;
  this.copyPasteInstance = copyPasteManager();
  this.copyPasteInstance.onCut(onCut);
  this.copyPasteInstance.onPaste(onPaste);
  instance.addHook('beforeKeyDown', onBeforeKeyDown);
  function onCut() {
    if (!instance.isListening()) {
      return;
    }
    instance.selection.empty();
  }
  function onPaste(str) {
    var input,
        inputArray,
        selected,
        coordsFrom,
        coordsTo,
        cellRange,
        topLeftCorner,
        bottomRightCorner,
        areaStart,
        areaEnd;
    if (!instance.isListening() || !instance.selection.isSelected()) {
      return;
    }
    input = str;
    inputArray = SheetClip.parse(input);
    selected = instance.getSelected();
    coordsFrom = new WalkontableCellCoords(selected[0], selected[1]);
    coordsTo = new WalkontableCellCoords(selected[2], selected[3]);
    cellRange = new WalkontableCellRange(coordsFrom, coordsFrom, coordsTo);
    topLeftCorner = cellRange.getTopLeftCorner();
    bottomRightCorner = cellRange.getBottomRightCorner();
    areaStart = topLeftCorner;
    areaEnd = new WalkontableCellCoords(Math.max(bottomRightCorner.row, inputArray.length - 1 + topLeftCorner.row), Math.max(bottomRightCorner.col, inputArray[0].length - 1 + topLeftCorner.col));
    instance.addHookOnce('afterChange', function(changes, source) {
      if (changes && changes.length) {
        this.selectCell(areaStart.row, areaStart.col, areaEnd.row, areaEnd.col);
      }
    });
    instance.populateFromArray(areaStart.row, areaStart.col, inputArray, areaEnd.row, areaEnd.col, 'paste', instance.getSettings().pasteMode);
  }
  function onBeforeKeyDown(event) {
    var ctrlDown;
    if (instance.getSelected()) {
      if (helper.isCtrlKey(event.keyCode)) {
        _this.setCopyableText();
        event.stopImmediatePropagation();
        return;
      }
      ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;
      if (event.keyCode == helper.keyCode.A && ctrlDown) {
        instance._registerTimeout(setTimeout(helper.proxy(_this.setCopyableText, _this), 0));
      }
    }
  }
  this.destroy = function() {
    this.copyPasteInstance.removeCallback(onCut);
    this.copyPasteInstance.removeCallback(onPaste);
    this.copyPasteInstance.destroy();
    instance.removeHook('beforeKeyDown', onBeforeKeyDown);
  };
  instance.addHook('afterDestroy', helper.proxy(this.destroy, this));
  this.triggerPaste = helper.proxy(this.copyPasteInstance.triggerPaste, this.copyPasteInstance);
  this.triggerCut = helper.proxy(this.copyPasteInstance.triggerCut, this.copyPasteInstance);
  this.setCopyableText = function() {
    var settings = instance.getSettings();
    var copyRowsLimit = settings.copyRowsLimit;
    var copyColsLimit = settings.copyColsLimit;
    var selRange = instance.getSelectedRange();
    var topLeft = selRange.getTopLeftCorner();
    var bottomRight = selRange.getBottomRightCorner();
    var startRow = topLeft.row;
    var startCol = topLeft.col;
    var endRow = bottomRight.row;
    var endCol = bottomRight.col;
    var finalEndRow = Math.min(endRow, startRow + copyRowsLimit - 1);
    var finalEndCol = Math.min(endCol, startCol + copyColsLimit - 1);
    instance.copyPaste.copyPasteInstance.copyable(instance.getCopyableData(startRow, startCol, finalEndRow, finalEndCol));
    if (endRow !== finalEndRow || endCol !== finalEndCol) {
      Handsontable.hooks.run(instance, "afterCopyLimit", endRow - startRow + 1, endCol - startCol + 1, copyRowsLimit, copyColsLimit);
    }
  };
}
function init() {
  var instance = this,
      pluginEnabled = instance.getSettings().copyPaste !== false;
  if (pluginEnabled && !instance.copyPaste) {
    instance.copyPaste = new CopyPastePlugin(instance);
  } else if (!pluginEnabled && instance.copyPaste) {
    instance.copyPaste.destroy();
    delete instance.copyPaste;
  }
}
Handsontable.hooks.add('afterInit', init);
Handsontable.hooks.add('afterUpdateSettings', init);
Handsontable.hooks.register('afterCopyLimit');


//# 
},{"./../../3rdparty/copypaste.js":3,"./../../3rdparty/sheetclip.js":5,"./../../3rdparty/walkontable/src/cellCoords.js":8,"./../../3rdparty/walkontable/src/cellRange.js":9,"./../../helpers.js":49,"./../../plugins.js":52}],61:[function(require,module,exports){
"use strict";
var $___46__46__47__46__46__47_plugins_46_js__,
    $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__,
    $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_selection_46_js__;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
var WalkontableCellRange = ($___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__ = require("./../../3rdparty/walkontable/src/cellRange.js"), $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__ && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__.__esModule && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__ || {default: $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__}).WalkontableCellRange;
var WalkontableSelection = ($___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_selection_46_js__ = require("./../../3rdparty/walkontable/src/selection.js"), $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_selection_46_js__ && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_selection_46_js__.__esModule && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_selection_46_js__ || {default: $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_selection_46_js__}).WalkontableSelection;
function CustomBorders() {}
var instance;
var checkEnable = function(customBorders) {
  if (typeof customBorders === "boolean") {
    if (customBorders === true) {
      return true;
    }
  }
  if (typeof customBorders === "object") {
    if (customBorders.length > 0) {
      return true;
    }
  }
  return false;
};
var init = function() {
  if (checkEnable(this.getSettings().customBorders)) {
    if (!this.customBorders) {
      instance = this;
      this.customBorders = new CustomBorders();
    }
  }
};
var getSettingIndex = function(className) {
  for (var i = 0; i < instance.view.wt.selections.length; i++) {
    if (instance.view.wt.selections[i].settings.className == className) {
      return i;
    }
  }
  return -1;
};
var insertBorderIntoSettings = function(border) {
  var coordinates = {
    row: border.row,
    col: border.col
  };
  var selection = new WalkontableSelection(border, new WalkontableCellRange(coordinates, coordinates, coordinates));
  var index = getSettingIndex(border.className);
  if (index >= 0) {
    instance.view.wt.selections[index] = selection;
  } else {
    instance.view.wt.selections.push(selection);
  }
};
var prepareBorderFromCustomAdded = function(row, col, borderObj) {
  var border = createEmptyBorders(row, col);
  border = extendDefaultBorder(border, borderObj);
  this.setCellMeta(row, col, 'borders', border);
  insertBorderIntoSettings(border);
};
var prepareBorderFromCustomAddedRange = function(rowObj) {
  var range = rowObj.range;
  for (var row = range.from.row; row <= range.to.row; row++) {
    for (var col = range.from.col; col <= range.to.col; col++) {
      var border = createEmptyBorders(row, col);
      var add = 0;
      if (row == range.from.row) {
        add++;
        if (rowObj.hasOwnProperty('top')) {
          border.top = rowObj.top;
        }
      }
      if (row == range.to.row) {
        add++;
        if (rowObj.hasOwnProperty('bottom')) {
          border.bottom = rowObj.bottom;
        }
      }
      if (col == range.from.col) {
        add++;
        if (rowObj.hasOwnProperty('left')) {
          border.left = rowObj.left;
        }
      }
      if (col == range.to.col) {
        add++;
        if (rowObj.hasOwnProperty('right')) {
          border.right = rowObj.right;
        }
      }
      if (add > 0) {
        this.setCellMeta(row, col, 'borders', border);
        insertBorderIntoSettings(border);
      }
    }
  }
};
var createClassName = function(row, col) {
  return "border_row" + row + "col" + col;
};
var createDefaultCustomBorder = function() {
  return {
    width: 1,
    color: '#000'
  };
};
var createSingleEmptyBorder = function() {
  return {hide: true};
};
var createDefaultHtBorder = function() {
  return {
    width: 1,
    color: '#000',
    cornerVisible: false
  };
};
var createEmptyBorders = function(row, col) {
  return {
    className: createClassName(row, col),
    border: createDefaultHtBorder(),
    row: row,
    col: col,
    top: createSingleEmptyBorder(),
    right: createSingleEmptyBorder(),
    bottom: createSingleEmptyBorder(),
    left: createSingleEmptyBorder()
  };
};
var extendDefaultBorder = function(defaultBorder, customBorder) {
  if (customBorder.hasOwnProperty('border')) {
    defaultBorder.border = customBorder.border;
  }
  if (customBorder.hasOwnProperty('top')) {
    defaultBorder.top = customBorder.top;
  }
  if (customBorder.hasOwnProperty('right')) {
    defaultBorder.right = customBorder.right;
  }
  if (customBorder.hasOwnProperty('bottom')) {
    defaultBorder.bottom = customBorder.bottom;
  }
  if (customBorder.hasOwnProperty('left')) {
    defaultBorder.left = customBorder.left;
  }
  return defaultBorder;
};
var removeBordersFromDom = function(borderClassName) {
  var borders = document.querySelectorAll("." + borderClassName);
  for (var i = 0; i < borders.length; i++) {
    if (borders[i]) {
      if (borders[i].nodeName != 'TD') {
        var parent = borders[i].parentNode;
        if (parent.parentNode) {
          parent.parentNode.removeChild(parent);
        }
      }
    }
  }
};
var removeAllBorders = function(row, col) {
  var borderClassName = createClassName(row, col);
  removeBordersFromDom(borderClassName);
  this.removeCellMeta(row, col, 'borders');
};
var setBorder = function(row, col, place, remove) {
  var bordersMeta = this.getCellMeta(row, col).borders;
  if (!bordersMeta || bordersMeta.border == undefined) {
    bordersMeta = createEmptyBorders(row, col);
  }
  if (remove) {
    bordersMeta[place] = createSingleEmptyBorder();
  } else {
    bordersMeta[place] = createDefaultCustomBorder();
  }
  this.setCellMeta(row, col, 'borders', bordersMeta);
  var borderClassName = createClassName(row, col);
  removeBordersFromDom(borderClassName);
  insertBorderIntoSettings(bordersMeta);
  this.render();
};
var prepareBorder = function(range, place, remove) {
  if (range.from.row == range.to.row && range.from.col == range.to.col) {
    if (place == "noBorders") {
      removeAllBorders.call(this, range.from.row, range.from.col);
    } else {
      setBorder.call(this, range.from.row, range.from.col, place, remove);
    }
  } else {
    switch (place) {
      case "noBorders":
        for (var column = range.from.col; column <= range.to.col; column++) {
          for (var row = range.from.row; row <= range.to.row; row++) {
            removeAllBorders.call(this, row, column);
          }
        }
        break;
      case "top":
        for (var topCol = range.from.col; topCol <= range.to.col; topCol++) {
          setBorder.call(this, range.from.row, topCol, place, remove);
        }
        break;
      case "right":
        for (var rowRight = range.from.row; rowRight <= range.to.row; rowRight++) {
          setBorder.call(this, rowRight, range.to.col, place);
        }
        break;
      case "bottom":
        for (var bottomCol = range.from.col; bottomCol <= range.to.col; bottomCol++) {
          setBorder.call(this, range.to.row, bottomCol, place);
        }
        break;
      case "left":
        for (var rowLeft = range.from.row; rowLeft <= range.to.row; rowLeft++) {
          setBorder.call(this, rowLeft, range.from.col, place);
        }
        break;
    }
  }
};
var checkSelectionBorders = function(hot, direction) {
  var atLeastOneHasBorder = false;
  hot.getSelectedRange().forAll(function(r, c) {
    var metaBorders = hot.getCellMeta(r, c).borders;
    if (metaBorders) {
      if (direction) {
        if (!metaBorders[direction].hasOwnProperty('hide')) {
          atLeastOneHasBorder = true;
          return false;
        }
      } else {
        atLeastOneHasBorder = true;
        return false;
      }
    }
  });
  return atLeastOneHasBorder;
};
var markSelected = function(label) {
  return "<span class='selected'>" + String.fromCharCode(10003) + "</span>" + label;
};
var addBordersOptionsToContextMenu = function(defaultOptions) {
  if (!this.getSettings().customBorders) {
    return;
  }
  defaultOptions.items.push(Handsontable.ContextMenu.SEPARATOR);
  defaultOptions.items.push({
    key: 'borders',
    name: 'Borders',
    submenu: {items: {
        top: {
          name: function() {
            var label = "Top";
            var hasBorder = checkSelectionBorders(this, 'top');
            if (hasBorder) {
              label = markSelected(label);
            }
            return label;
          },
          callback: function() {
            var hasBorder = checkSelectionBorders(this, 'top');
            prepareBorder.call(this, this.getSelectedRange(), 'top', hasBorder);
          },
          disabled: false
        },
        right: {
          name: function() {
            var label = 'Right';
            var hasBorder = checkSelectionBorders(this, 'right');
            if (hasBorder) {
              label = markSelected(label);
            }
            return label;
          },
          callback: function() {
            var hasBorder = checkSelectionBorders(this, 'right');
            prepareBorder.call(this, this.getSelectedRange(), 'right', hasBorder);
          },
          disabled: false
        },
        bottom: {
          name: function() {
            var label = 'Bottom';
            var hasBorder = checkSelectionBorders(this, 'bottom');
            if (hasBorder) {
              label = markSelected(label);
            }
            return label;
          },
          callback: function() {
            var hasBorder = checkSelectionBorders(this, 'bottom');
            prepareBorder.call(this, this.getSelectedRange(), 'bottom', hasBorder);
          },
          disabled: false
        },
        left: {
          name: function() {
            var label = 'Left';
            var hasBorder = checkSelectionBorders(this, 'left');
            if (hasBorder) {
              label = markSelected(label);
            }
            return label;
          },
          callback: function() {
            var hasBorder = checkSelectionBorders(this, 'left');
            prepareBorder.call(this, this.getSelectedRange(), 'left', hasBorder);
          },
          disabled: false
        },
        remove: {
          name: 'Remove border(s)',
          callback: function() {
            prepareBorder.call(this, this.getSelectedRange(), 'noBorders');
          },
          disabled: function() {
            return !checkSelectionBorders(this);
          }
        }
      }}
  });
};
Handsontable.hooks.add('beforeInit', init);
Handsontable.hooks.add('afterContextMenuDefaultOptions', addBordersOptionsToContextMenu);
Handsontable.hooks.add('afterInit', function() {
  var customBorders = this.getSettings().customBorders;
  if (customBorders) {
    for (var i = 0; i < customBorders.length; i++) {
      if (customBorders[i].range) {
        prepareBorderFromCustomAddedRange.call(this, customBorders[i]);
      } else {
        prepareBorderFromCustomAdded.call(this, customBorders[i].row, customBorders[i].col, customBorders[i]);
      }
    }
    this.render();
    this.view.wt.draw(true);
  }
});
Handsontable.CustomBorders = CustomBorders;


//# 
},{"./../../3rdparty/walkontable/src/cellRange.js":9,"./../../3rdparty/walkontable/src/selection.js":20,"./../../plugins.js":52}],62:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  DragToScroll: {get: function() {
      return DragToScroll;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_eventManager_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__;
var eventManagerObject = ($___46__46__47__46__46__47_eventManager_46_js__ = require("./../../eventManager.js"), $___46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
;
Handsontable.plugins.DragToScroll = DragToScroll;
function DragToScroll() {
  this.boundaries = null;
  this.callback = null;
}
DragToScroll.prototype.setBoundaries = function(boundaries) {
  this.boundaries = boundaries;
};
DragToScroll.prototype.setCallback = function(callback) {
  this.callback = callback;
};
DragToScroll.prototype.check = function(x, y) {
  var diffX = 0;
  var diffY = 0;
  if (y < this.boundaries.top) {
    diffY = y - this.boundaries.top;
  } else if (y > this.boundaries.bottom) {
    diffY = y - this.boundaries.bottom;
  }
  if (x < this.boundaries.left) {
    diffX = x - this.boundaries.left;
  } else if (x > this.boundaries.right) {
    diffX = x - this.boundaries.right;
  }
  this.callback(diffX, diffY);
};
var dragToScroll;
var instance;
if (typeof Handsontable !== 'undefined') {
  var setupListening = function(instance) {
    instance.dragToScrollListening = false;
    var scrollHandler = instance.view.wt.wtTable.holder;
    dragToScroll = new DragToScroll();
    if (scrollHandler === window) {
      return;
    } else {
      dragToScroll.setBoundaries(scrollHandler.getBoundingClientRect());
    }
    dragToScroll.setCallback(function(scrollX, scrollY) {
      if (scrollX < 0) {
        scrollHandler.scrollLeft -= 50;
      } else if (scrollX > 0) {
        scrollHandler.scrollLeft += 50;
      }
      if (scrollY < 0) {
        scrollHandler.scrollTop -= 20;
      } else if (scrollY > 0) {
        scrollHandler.scrollTop += 20;
      }
    });
    instance.dragToScrollListening = true;
  };
}
Handsontable.hooks.add('afterInit', function() {
  var instance = this;
  var eventManager = eventManagerObject(this);
  eventManager.addEventListener(document, 'mouseup', function() {
    instance.dragToScrollListening = false;
  });
  eventManager.addEventListener(document, 'mousemove', function(event) {
    if (instance.dragToScrollListening) {
      dragToScroll.check(event.clientX, event.clientY);
    }
  });
});
Handsontable.hooks.add('afterDestroy', function() {
  eventManagerObject(this).clear();
});
Handsontable.hooks.add('afterOnCellMouseDown', function() {
  setupListening(this);
});
Handsontable.hooks.add('afterOnCellCornerMouseDown', function() {
  setupListening(this);
});
Handsontable.plugins.DragToScroll = DragToScroll;


//# 
},{"./../../eventManager.js":48,"./../../plugins.js":52}],63:[function(require,module,exports){
"use strict";
var $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__;
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
function Grouping(instance) {
  var groups = [];
  var item = {
    id: '',
    level: 0,
    hidden: 0,
    rows: [],
    cols: []
  };
  var counters = {
    rows: 0,
    cols: 0
  };
  var levels = {
    rows: 0,
    cols: 0
  };
  var hiddenRows = [];
  var hiddenCols = [];
  var classes = {
    'groupIndicatorContainer': 'htGroupIndicatorContainer',
    'groupIndicator': function(direction) {
      return 'ht' + direction + 'Group';
    },
    'groupStart': 'htGroupStart',
    'collapseButton': 'htCollapseButton',
    'expandButton': 'htExpandButton',
    'collapseGroupId': function(id) {
      return 'htCollapse-' + id;
    },
    'collapseFromLevel': function(direction, level) {
      return 'htCollapse' + direction + 'FromLevel-' + level;
    },
    'clickable': 'clickable',
    'levelTrigger': 'htGroupLevelTrigger'
  };
  var compare = function(property, orderDirection) {
    return function(item1, item2) {
      return typeof(orderDirection) === 'undefined' || orderDirection === 'asc' ? item1[property] - item2[property] : item2[property] - item1[property];
    };
  };
  var range = function(from, to) {
    var arr = [];
    while (from <= to) {
      arr.push(from++);
    }
    return arr;
  };
  var getRangeGroups = function(dataType, from, to) {
    var cells = [],
        cell = {
          row: null,
          col: null
        };
    if (dataType == "cols") {
      while (from <= to) {
        cell = {
          row: -1,
          col: from++
        };
        cells.push(cell);
      }
    } else {
      while (from <= to) {
        cell = {
          row: from++,
          col: -1
        };
        cells.push(cell);
      }
    }
    var cellsGroups = getCellsGroups(cells),
        totalRows = 0,
        totalCols = 0;
    for (var i = 0; i < cellsGroups.length; i++) {
      totalRows += cellsGroups[i].filter(function(item) {
        return item['rows'];
      }).length;
      totalCols += cellsGroups[i].filter(function(item) {
        return item['cols'];
      }).length;
    }
    return {
      total: {
        rows: totalRows,
        cols: totalCols
      },
      groups: cellsGroups
    };
  };
  var getCellsGroups = function(cells) {
    var _groups = [];
    for (var i = 0; i < cells.length; i++) {
      _groups.push(getCellGroups(cells[i]));
    }
    return _groups;
  };
  var getCellGroups = function(coords, groupLevel, groupType) {
    var row = coords.row,
        col = coords.col;
    var tmpRow = (row === -1 ? 0 : row),
        tmpCol = (col === -1 ? 0 : col);
    var _groups = [];
    for (var i = 0; i < groups.length; i++) {
      var group = groups[i],
          id = group['id'],
          level = group['level'],
          rows = group['rows'] || [],
          cols = group['cols'] || [];
      if (_groups.indexOf(id) === -1) {
        if (rows.indexOf(tmpRow) !== -1 || cols.indexOf(tmpCol) !== -1) {
          _groups.push(group);
        }
      }
    }
    if (col === -1) {
      _groups = _groups.concat(getColGroups());
    } else if (row === -1) {
      _groups = _groups.concat(getRowGroups());
    }
    if (groupLevel) {
      _groups = _groups.filter(function(item) {
        return item['level'] === groupLevel;
      });
    }
    if (groupType) {
      if (groupType === 'cols') {
        _groups = _groups.filter(function(item) {
          return item['cols'];
        });
      } else if (groupType === 'rows') {
        _groups = _groups.filter(function(item) {
          return item['rows'];
        });
      }
    }
    var tmp = [];
    return _groups.filter(function(item) {
      if (tmp.indexOf(item.id) === -1) {
        tmp.push(item.id);
        return item;
      }
    });
  };
  var getGroupById = function(id) {
    for (var i = 0,
        groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i].id == id) {
        return groups[i];
      }
    }
    return false;
  };
  var getGroupByRowAndLevel = function(row, level) {
    for (var i = 0,
        groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i].level == level && groups[i].rows && groups[i].rows.indexOf(row) > -1) {
        return groups[i];
      }
    }
    return false;
  };
  var getGroupByColAndLevel = function(col, level) {
    for (var i = 0,
        groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i].level == level && groups[i].cols && groups[i].cols.indexOf(col) > -1) {
        return groups[i];
      }
    }
    return false;
  };
  var getColGroups = function() {
    var result = [];
    for (var i = 0,
        groupsLength = groups.length; i < groupsLength; i++) {
      if (Array.isArray(groups[i]['cols'])) {
        result.push(groups[i]);
      }
    }
    return result;
  };
  var getColGroupsByLevel = function(level) {
    var result = [];
    for (var i = 0,
        groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i]['cols'] && groups[i]['level'] === level) {
        result.push(groups[i]);
      }
    }
    return result;
  };
  var getRowGroups = function() {
    var result = [];
    for (var i = 0,
        groupsLength = groups.length; i < groupsLength; i++) {
      if (Array.isArray(groups[i]['rows'])) {
        result.push(groups[i]);
      }
    }
    return result;
  };
  var getRowGroupsByLevel = function(level) {
    var result = [];
    for (var i = 0,
        groupsLength = groups.length; i < groupsLength; i++) {
      if (groups[i]['rows'] && groups[i]['level'] === level) {
        result.push(groups[i]);
      }
    }
    return result;
  };
  var getLastLevelColsInRange = function(rangeGroups) {
    var level = 0;
    if (rangeGroups.length) {
      rangeGroups.forEach(function(items) {
        items = items.filter(function(item) {
          return item['cols'];
        });
        if (items.length) {
          var sortedGroup = items.sort(compare('level', 'desc')),
              lastLevel = sortedGroup[0].level;
          if (level < lastLevel) {
            level = lastLevel;
          }
        }
      });
    }
    return level;
  };
  var getLastLevelRowsInRange = function(rangeGroups) {
    var level = 0;
    if (rangeGroups.length) {
      rangeGroups.forEach(function(items) {
        items = items.filter(function(item) {
          return item['rows'];
        });
        if (items.length) {
          var sortedGroup = items.sort(compare('level', 'desc')),
              lastLevel = sortedGroup[0].level;
          if (level < lastLevel) {
            level = lastLevel;
          }
        }
      });
    }
    return level;
  };
  var groupCols = function(from, to) {
    var rangeGroups = getRangeGroups("cols", from, to),
        lastLevel = getLastLevelColsInRange(rangeGroups.groups);
    if (lastLevel === levels.cols) {
      levels.cols++;
    } else if (lastLevel > levels.cols) {
      levels.cols = lastLevel + 1;
    }
    if (!counters.cols) {
      counters.cols = getColGroups().length;
    }
    counters.cols++;
    groups.push({
      id: 'c' + counters.cols,
      level: lastLevel + 1,
      cols: range(from, to),
      hidden: 0
    });
  };
  var groupRows = function(from, to) {
    var rangeGroups = getRangeGroups("rows", from, to),
        lastLevel = getLastLevelRowsInRange(rangeGroups.groups);
    levels.rows = Math.max(levels.rows, lastLevel + 1);
    if (!counters.rows) {
      counters.rows = getRowGroups().length;
    }
    counters.rows++;
    groups.push({
      id: 'r' + counters.rows,
      level: lastLevel + 1,
      rows: range(from, to),
      hidden: 0
    });
  };
  var showHideGroups = function(hidden, groups) {
    var level;
    for (var i = 0,
        groupsLength = groups.length; i < groupsLength; i++) {
      groups[i].hidden = hidden;
      level = groups[i].level;
      if (!hiddenRows[level]) {
        hiddenRows[level] = [];
      }
      if (!hiddenCols[level]) {
        hiddenCols[level] = [];
      }
      if (groups[i].rows) {
        for (var j = 0,
            rowsLength = groups[i].rows.length; j < rowsLength; j++) {
          if (hidden > 0) {
            hiddenRows[level][groups[i].rows[j]] = true;
          } else {
            hiddenRows[level][groups[i].rows[j]] = void 0;
          }
        }
      } else if (groups[i].cols) {
        for (var j = 0,
            colsLength = groups[i].cols.length; j < colsLength; j++) {
          if (hidden > 0) {
            hiddenCols[level][groups[i].cols[j]] = true;
          } else {
            hiddenCols[level][groups[i].cols[j]] = void 0;
          }
        }
      }
    }
  };
  var nextIndexSharesLevel = function(dimension, currentPosition, level, currentGroupId) {
    var nextCellGroupId,
        levelsByOrder;
    switch (dimension) {
      case 'rows':
        nextCellGroupId = getGroupByRowAndLevel(currentPosition + 1, level).id;
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByRows();
        break;
      case 'cols':
        nextCellGroupId = getGroupByColAndLevel(currentPosition + 1, level).id;
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByCols();
        break;
    }
    return !!(levelsByOrder[currentPosition + 1] && levelsByOrder[currentPosition + 1].indexOf(level) > -1 && currentGroupId == nextCellGroupId);
  };
  var previousIndexSharesLevel = function(dimension, currentPosition, level, currentGroupId) {
    var previousCellGroupId,
        levelsByOrder;
    switch (dimension) {
      case 'rows':
        previousCellGroupId = getGroupByRowAndLevel(currentPosition - 1, level).id;
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByRows();
        break;
      case 'cols':
        previousCellGroupId = getGroupByColAndLevel(currentPosition - 1, level).id;
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByCols();
        break;
    }
    return !!(levelsByOrder[currentPosition - 1] && levelsByOrder[currentPosition - 1].indexOf(level) > -1 && currentGroupId == previousCellGroupId);
  };
  var isLastIndexOfTheLine = function(dimension, index, level, currentGroupId) {
    if (index === 0) {
      return false;
    }
    var levelsByOrder,
        entriesLength,
        previousSharesLevel = previousIndexSharesLevel(dimension, index, level, currentGroupId),
        nextSharesLevel = nextIndexSharesLevel(dimension, index, level, currentGroupId),
        nextIsHidden = false;
    switch (dimension) {
      case 'rows':
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByRows();
        entriesLength = instance.countRows();
        for (var i = 0; i <= levels.rows; i++) {
          if (hiddenRows[i] && hiddenRows[i][index + 1]) {
            nextIsHidden = true;
            break;
          }
        }
        break;
      case 'cols':
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByCols();
        entriesLength = instance.countCols();
        for (var i = 0; i <= levels.cols; i++) {
          if (hiddenCols[i] && hiddenCols[i][index + 1]) {
            nextIsHidden = true;
            break;
          }
        }
        break;
    }
    if (previousSharesLevel) {
      if (index == entriesLength - 1) {
        return true;
      } else if (!nextSharesLevel || (nextSharesLevel && nextIsHidden)) {
        return true;
      } else if (!levelsByOrder[index + 1]) {
        return true;
      }
    }
    return false;
  };
  var isLastHidden = function(dataType) {
    var levelAmount;
    switch (dataType) {
      case 'rows':
        levelAmount = levels.rows;
        for (var j = 0; j <= levelAmount; j++) {
          if (hiddenRows[j] && hiddenRows[j][instance.countRows() - 1]) {
            return true;
          }
        }
        break;
      case 'cols':
        levelAmount = levels.cols;
        for (var j = 0; j <= levelAmount; j++) {
          if (hiddenCols[j] && hiddenCols[j][instance.countCols() - 1]) {
            return true;
          }
        }
        break;
    }
    return false;
  };
  var isFirstIndexOfTheLine = function(dimension, index, level, currentGroupId) {
    var levelsByOrder,
        entriesLength,
        currentGroup = getGroupById(currentGroupId),
        previousAreHidden = false,
        arePreviousHidden = function(dimension) {
          var hidden = false,
              hiddenArr = dimension == 'rows' ? hiddenRows : hiddenCols;
          for (var i = 0; i <= levels[dimension]; i++) {
            tempInd = index;
            while (currentGroup[dimension].indexOf(tempInd) > -1) {
              hidden = !!(hiddenArr[i] && hiddenArr[i][tempInd]);
              tempInd--;
            }
            if (hidden) {
              break;
            }
          }
          return hidden;
        },
        previousSharesLevel = previousIndexSharesLevel(dimension, index, level, currentGroupId),
        nextSharesLevel = nextIndexSharesLevel(dimension, index, level, currentGroupId),
        tempInd;
    switch (dimension) {
      case 'rows':
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByRows();
        entriesLength = instance.countRows();
        previousAreHidden = arePreviousHidden(dimension);
        break;
      case 'cols':
        levelsByOrder = Handsontable.Grouping.getGroupLevelsByCols();
        entriesLength = instance.countCols();
        previousAreHidden = arePreviousHidden(dimension);
        break;
    }
    if (index == entriesLength - 1) {
      return false;
    } else if (index === 0) {
      if (nextSharesLevel) {
        return true;
      }
    } else if (!previousSharesLevel || (previousSharesLevel && previousAreHidden)) {
      if (nextSharesLevel) {
        return true;
      }
    } else if (!levelsByOrder[index - 1]) {
      if (nextSharesLevel) {
        return true;
      }
    }
    return false;
  };
  var addGroupExpander = function(dataType, index, level, id, elem) {
    var previousIndexGroupId;
    switch (dataType) {
      case 'rows':
        previousIndexGroupId = getGroupByRowAndLevel(index - 1, level).id;
        break;
      case 'cols':
        previousIndexGroupId = getGroupByColAndLevel(index - 1, level).id;
        break;
    }
    if (!previousIndexGroupId) {
      return null;
    }
    if (index > 0) {
      if (previousIndexSharesLevel(dataType, index - 1, level, previousIndexGroupId) && previousIndexGroupId != id) {
        var expanderButton = document.createElement('DIV');
        dom.addClass(expanderButton, classes.expandButton);
        expanderButton.id = 'htExpand-' + previousIndexGroupId;
        expanderButton.appendChild(document.createTextNode('+'));
        expanderButton.setAttribute('data-level', level);
        expanderButton.setAttribute('data-type', dataType);
        expanderButton.setAttribute('data-hidden', "1");
        elem.appendChild(expanderButton);
        return expanderButton;
      }
    }
    return null;
  };
  var isCollapsed = function(currentPosition) {
    var rowGroups = getRowGroups(),
        colGroups = getColGroups();
    for (var i = 0,
        rowGroupsCount = rowGroups.length; i < rowGroupsCount; i++) {
      if (rowGroups[i].rows.indexOf(currentPosition.row) > -1 && rowGroups[i].hidden) {
        return true;
      }
    }
    if (currentPosition.col === null) {
      return false;
    }
    for (var i = 0,
        colGroupsCount = colGroups.length; i < colGroupsCount; i++) {
      if (colGroups[i].cols.indexOf(currentPosition.col) > -1 && colGroups[i].hidden) {
        return true;
      }
    }
    return false;
  };
  return {
    getGroups: function() {
      return groups;
    },
    getLevels: function() {
      return levels;
    },
    instance: instance,
    baseSpareRows: instance.getSettings().minSpareRows,
    baseSpareCols: instance.getSettings().minSpareCols,
    getRowGroups: getRowGroups,
    getColGroups: getColGroups,
    init: function() {
      var groupsSetting = instance.getSettings().groups;
      if (groupsSetting) {
        if (Array.isArray(groupsSetting)) {
          Handsontable.Grouping.initGroups(groupsSetting);
        }
      }
    },
    initGroups: function(initialGroups) {
      var that = this;
      groups = [];
      initialGroups.forEach(function(item) {
        var _group = [],
            isRow = false,
            isCol = false;
        if (Array.isArray(item.rows)) {
          _group = item.rows;
          isRow = true;
        } else if (Array.isArray(item.cols)) {
          _group = item.cols;
          isCol = true;
        }
        var from = _group[0],
            to = _group[_group.length - 1];
        if (isRow) {
          groupRows(from, to);
        } else if (isCol) {
          groupCols(from, to);
        }
      });
    },
    resetGroups: function() {
      groups = [];
      counters = {
        rows: 0,
        cols: 0
      };
      levels = {
        rows: 0,
        cols: 0
      };
      var allOccurrences;
      for (var i in classes) {
        if (typeof classes[i] != 'function') {
          allOccurrences = document.querySelectorAll('.' + classes[i]);
          for (var j = 0,
              occurrencesLength = allOccurrences.length; j < occurrencesLength; j++) {
            dom.removeClass(allOccurrences[j], classes[i]);
          }
        }
      }
      var otherClasses = ['htGroupColClosest', 'htGroupCol'];
      for (var i = 0,
          otherClassesLength = otherClasses.length; i < otherClassesLength; i++) {
        allOccurrences = document.querySelectorAll('.' + otherClasses[i]);
        for (var j = 0,
            occurrencesLength = allOccurrences.length; j < occurrencesLength; j++) {
          dom.removeClass(allOccurrences[j], otherClasses[i]);
        }
      }
    },
    updateGroups: function() {
      var groupSettings = this.getSettings().groups;
      Handsontable.Grouping.resetGroups();
      Handsontable.Grouping.initGroups(groupSettings);
    },
    afterGetRowHeader: function(row, TH) {
      var currentRowHidden = false;
      for (var i = 0,
          levels = hiddenRows.length; i < levels; i++) {
        if (hiddenRows[i] && hiddenRows[i][row] === true) {
          currentRowHidden = true;
        }
      }
      if (currentRowHidden) {
        dom.addClass(TH.parentNode, 'hidden');
      } else if (!currentRowHidden && dom.hasClass(TH.parentNode, 'hidden')) {
        dom.removeClass(TH.parentNode, 'hidden');
      }
    },
    afterGetColHeader: function(col, TH) {
      var rowHeaders = this.view.wt.wtSettings.getSetting('rowHeaders').length,
          thisColgroup = instance.rootElement.querySelectorAll('colgroup col:nth-child(' + parseInt(col + rowHeaders + 1, 10) + ')');
      if (thisColgroup.length === 0) {
        return;
      }
      var currentColHidden = false;
      for (var i = 0,
          levels = hiddenCols.length; i < levels; i++) {
        if (hiddenCols[i] && hiddenCols[i][col] === true) {
          currentColHidden = true;
        }
      }
      if (currentColHidden) {
        for (var i = 0,
            colsAmount = thisColgroup.length; i < colsAmount; i++) {
          dom.addClass(thisColgroup[i], 'hidden');
        }
      } else if (!currentColHidden && dom.hasClass(thisColgroup[0], 'hidden')) {
        for (var i = 0,
            colsAmount = thisColgroup.length; i < colsAmount; i++) {
          dom.removeClass(thisColgroup[i], 'hidden');
        }
      }
    },
    groupIndicatorsFactory: function(renderersArr, direction) {
      var groupsLevelsList,
          getCurrentLevel,
          getCurrentGroupId,
          dataType,
          getGroupByIndexAndLevel,
          headersType,
          currentHeaderModifier,
          createLevelTriggers;
      switch (direction) {
        case 'horizontal':
          groupsLevelsList = Handsontable.Grouping.getGroupLevelsByCols();
          getCurrentLevel = function(elem) {
            return Array.prototype.indexOf.call(elem.parentNode.parentNode.childNodes, elem.parentNode) + 1;
          };
          getCurrentGroupId = function(col, level) {
            return getGroupByColAndLevel(col, level).id;
          };
          dataType = 'cols';
          getGroupByIndexAndLevel = function(col, level) {
            return getGroupByColAndLevel(col - 1, level);
          };
          headersType = "columnHeaders";
          currentHeaderModifier = function(headerRenderers) {
            if (headerRenderers.length === 1) {
              var oldFn = headerRenderers[0];
              headerRenderers[0] = function(index, elem, level) {
                if (index < -1) {
                  makeGroupIndicatorsForLevel()(index, elem, level);
                } else {
                  dom.removeClass(elem, classes.groupIndicatorContainer);
                  oldFn(index, elem, level);
                }
              };
            }
            return function() {
              return headerRenderers;
            };
          };
          createLevelTriggers = true;
          break;
        case 'vertical':
          groupsLevelsList = Handsontable.Grouping.getGroupLevelsByRows();
          getCurrentLevel = function(elem) {
            return dom.index(elem) + 1;
          };
          getCurrentGroupId = function(row, level) {
            return getGroupByRowAndLevel(row, level).id;
          };
          dataType = 'rows';
          getGroupByIndexAndLevel = function(row, level) {
            return getGroupByRowAndLevel(row - 1, level);
          };
          headersType = "rowHeaders";
          currentHeaderModifier = function(headerRenderers) {
            return headerRenderers;
          };
          break;
      }
      var createButton = function(parent) {
        var button = document.createElement('div');
        parent.appendChild(button);
        return {
          button: button,
          addClass: function(className) {
            dom.addClass(button, className);
          }
        };
      };
      var makeGroupIndicatorsForLevel = function() {
        var directionClassname = direction.charAt(0).toUpperCase() + direction.slice(1);
        return function(index, elem, level) {
          level++;
          var child,
              collapseButton;
          while (child = elem.lastChild) {
            elem.removeChild(child);
          }
          dom.addClass(elem, classes.groupIndicatorContainer);
          var currentGroupId = getCurrentGroupId(index, level);
          if (index > -1 && (groupsLevelsList[index] && groupsLevelsList[index].indexOf(level) > -1)) {
            collapseButton = createButton(elem);
            collapseButton.addClass(classes.groupIndicator(directionClassname));
            if (isFirstIndexOfTheLine(dataType, index, level, currentGroupId)) {
              collapseButton.addClass(classes.groupStart);
            }
            if (isLastIndexOfTheLine(dataType, index, level, currentGroupId)) {
              collapseButton.button.appendChild(document.createTextNode('-'));
              collapseButton.addClass(classes.collapseButton);
              collapseButton.button.id = classes.collapseGroupId(currentGroupId);
              collapseButton.button.setAttribute('data-level', level);
              collapseButton.button.setAttribute('data-type', dataType);
            }
          }
          if (createLevelTriggers) {
            var rowInd = dom.index(elem.parentNode);
            if (index === -1 || (index < -1 && rowInd === Handsontable.Grouping.getLevels().cols + 1) || (rowInd === 0 && Handsontable.Grouping.getLevels().cols === 0)) {
              collapseButton = createButton(elem);
              collapseButton.addClass(classes.levelTrigger);
              if (index === -1) {
                collapseButton.button.id = classes.collapseFromLevel("Cols", level);
                collapseButton.button.appendChild(document.createTextNode(level));
              } else if (index < -1 && rowInd === Handsontable.Grouping.getLevels().cols + 1 || (rowInd === 0 && Handsontable.Grouping.getLevels().cols === 0)) {
                var colInd = dom.index(elem) + 1;
                collapseButton.button.id = classes.collapseFromLevel("Rows", colInd);
                collapseButton.button.appendChild(document.createTextNode(colInd));
              }
            }
          }
          var expanderButton = addGroupExpander(dataType, index, level, currentGroupId, elem);
          if (index > 0) {
            var previousGroupObj = getGroupByIndexAndLevel(index - 1, level);
            if (expanderButton && previousGroupObj.hidden) {
              dom.addClass(expanderButton, classes.clickable);
            }
          }
          updateHeaderWidths();
        };
      };
      renderersArr = currentHeaderModifier(renderersArr);
      if (counters[dataType] > 0) {
        for (var i = 0; i < levels[dataType] + 1; i++) {
          if (!Array.isArray(renderersArr)) {
            renderersArr = typeof renderersArr === 'function' ? renderersArr() : new Array(renderersArr);
          }
          renderersArr.unshift(makeGroupIndicatorsForLevel());
        }
      }
    },
    getGroupLevelsByRows: function() {
      var rowGroups = getRowGroups(),
          result = [];
      for (var i = 0,
          groupsLength = rowGroups.length; i < groupsLength; i++) {
        if (rowGroups[i].rows) {
          for (var j = 0,
              groupRowsLength = rowGroups[i].rows.length; j < groupRowsLength; j++) {
            if (!result[rowGroups[i].rows[j]]) {
              result[rowGroups[i].rows[j]] = [];
            }
            result[rowGroups[i].rows[j]].push(rowGroups[i].level);
          }
        }
      }
      return result;
    },
    getGroupLevelsByCols: function() {
      var colGroups = getColGroups(),
          result = [];
      for (var i = 0,
          groupsLength = colGroups.length; i < groupsLength; i++) {
        if (colGroups[i].cols) {
          for (var j = 0,
              groupColsLength = colGroups[i].cols.length; j < groupColsLength; j++) {
            if (!result[colGroups[i].cols[j]]) {
              result[colGroups[i].cols[j]] = [];
            }
            result[colGroups[i].cols[j]].push(colGroups[i].level);
          }
        }
      }
      return result;
    },
    toggleGroupVisibility: function(event, coords, TD) {
      if (dom.hasClass(event.target, classes.expandButton) || dom.hasClass(event.target, classes.collapseButton) || dom.hasClass(event.target, classes.levelTrigger)) {
        var element = event.target,
            elemIdSplit = element.id.split('-');
        var groups = [],
            id,
            level,
            type,
            hidden;
        var prepareGroupData = function(componentElement) {
          if (componentElement) {
            element = componentElement;
          }
          elemIdSplit = element.id.split('-');
          id = elemIdSplit[1];
          level = parseInt(element.getAttribute('data-level'), 10);
          type = element.getAttribute('data-type');
          hidden = parseInt(element.getAttribute('data-hidden'));
          if (isNaN(hidden)) {
            hidden = 1;
          } else {
            hidden = (hidden ? 0 : 1);
          }
          element.setAttribute('data-hidden', hidden.toString());
          groups.push(getGroupById(id));
        };
        if (element.className.indexOf(classes.levelTrigger) > -1) {
          var groupsInLevel,
              groupsToExpand = [],
              groupsToCollapse = [],
              levelType = element.id.indexOf("Rows") > -1 ? "rows" : "cols";
          for (var i = 1,
              levelsCount = levels[levelType]; i <= levelsCount; i++) {
            groupsInLevel = levelType == "rows" ? getRowGroupsByLevel(i) : getColGroupsByLevel(i);
            if (i >= parseInt(elemIdSplit[1], 10)) {
              for (var j = 0,
                  groupCount = groupsInLevel.length; j < groupCount; j++) {
                groupsToCollapse.push(groupsInLevel[j]);
              }
            } else {
              for (var j = 0,
                  groupCount = groupsInLevel.length; j < groupCount; j++) {
                groupsToExpand.push(groupsInLevel[j]);
              }
            }
          }
          showHideGroups(true, groupsToCollapse);
          showHideGroups(false, groupsToExpand);
        } else {
          prepareGroupData();
          showHideGroups(hidden, groups);
        }
        type = type || levelType;
        var lastHidden = isLastHidden(type),
            typeUppercase = type.charAt(0).toUpperCase() + type.slice(1),
            spareElements = Handsontable.Grouping['baseSpare' + typeUppercase];
        if (lastHidden) {
          if (spareElements == 0) {
            instance.alter('insert_' + type.slice(0, -1), instance['count' + typeUppercase]());
            Handsontable.Grouping["dummy" + type.slice(0, -1)] = true;
          }
        } else {
          if (spareElements == 0) {
            if (Handsontable.Grouping["dummy" + type.slice(0, -1)]) {
              instance.alter('remove_' + type.slice(0, -1), instance['count' + typeUppercase]() - 1);
              Handsontable.Grouping["dummy" + type.slice(0, -1)] = false;
            }
          }
        }
        instance.render();
        event.stopImmediatePropagation();
      }
    },
    modifySelectionFactory: function(position) {
      var instance = this.instance;
      var currentlySelected,
          nextPosition = new WalkontableCellCoords(0, 0),
          nextVisible = function(direction, currentPosition) {
            var updateDelta = 0;
            switch (direction) {
              case 'down':
                while (isCollapsed(currentPosition)) {
                  updateDelta++;
                  currentPosition.row += 1;
                }
                break;
              case 'up':
                while (isCollapsed(currentPosition)) {
                  updateDelta--;
                  currentPosition.row -= 1;
                }
                break;
              case 'right':
                while (isCollapsed(currentPosition)) {
                  updateDelta++;
                  currentPosition.col += 1;
                }
                break;
              case 'left':
                while (isCollapsed(currentPosition)) {
                  updateDelta--;
                  currentPosition.col -= 1;
                }
                break;
            }
            return updateDelta;
          },
          updateDelta = function(delta, nextPosition) {
            if (delta.row > 0) {
              if (isCollapsed(nextPosition)) {
                delta.row += nextVisible('down', nextPosition);
              }
            } else if (delta.row < 0) {
              if (isCollapsed(nextPosition)) {
                delta.row += nextVisible('up', nextPosition);
              }
            }
            if (delta.col > 0) {
              if (isCollapsed(nextPosition)) {
                delta.col += nextVisible('right', nextPosition);
              }
            } else if (delta.col < 0) {
              if (isCollapsed(nextPosition)) {
                delta.col += nextVisible('left', nextPosition);
              }
            }
          };
      switch (position) {
        case 'start':
          return function(delta) {
            currentlySelected = instance.getSelected();
            nextPosition.row = currentlySelected[0] + delta.row;
            nextPosition.col = currentlySelected[1] + delta.col;
            updateDelta(delta, nextPosition);
          };
          break;
        case 'end':
          return function(delta) {
            currentlySelected = instance.getSelected();
            nextPosition.row = currentlySelected[2] + delta.row;
            nextPosition.col = currentlySelected[3] + delta.col;
            updateDelta(delta, nextPosition);
          };
          break;
      }
    },
    modifyRowHeight: function(height, row) {
      if (instance.view.wt.wtTable.rowFilter && isCollapsed({
        row: row,
        col: null
      })) {
        return 0;
      }
    },
    validateGroups: function() {
      var areRangesOverlapping = function(a, b) {
        if ((a[0] < b[0] && a[1] < b[1] && b[0] <= a[1]) || (a[0] > b[0] && b[1] < a[1] && a[0] <= b[1])) {
          return true;
        }
      };
      var configGroups = instance.getSettings().groups,
          cols = [],
          rows = [];
      for (var i = 0,
          groupsLength = configGroups.length; i < groupsLength; i++) {
        if (configGroups[i].rows) {
          if (configGroups[i].rows.length === 1) {
            throw new Error("Grouping error:  Group {" + configGroups[i].rows[0] + "} is invalid. Cannot define single-entry groups.");
            return false;
          } else if (configGroups[i].rows.length === 0) {
            throw new Error("Grouping error:  Cannot define empty groups.");
            return false;
          }
          rows.push(configGroups[i].rows);
          for (var j = 0,
              rowsLength = rows.length; j < rowsLength; j++) {
            if (areRangesOverlapping(configGroups[i].rows, rows[j])) {
              throw new Error("Grouping error:  ranges {" + configGroups[i].rows[0] + ", " + configGroups[i].rows[1] + "} and {" + rows[j][0] + ", " + rows[j][1] + "} are overlapping.");
              return false;
            }
          }
        } else if (configGroups[i].cols) {
          if (configGroups[i].cols.length === 1) {
            throw new Error("Grouping error:  Group {" + configGroups[i].cols[0] + "} is invalid. Cannot define single-entry groups.");
            return false;
          } else if (configGroups[i].cols.length === 0) {
            throw new Error("Grouping error:  Cannot define empty groups.");
            return false;
          }
          cols.push(configGroups[i].cols);
          for (var j = 0,
              colsLength = cols.length; j < colsLength; j++) {
            if (areRangesOverlapping(configGroups[i].cols, cols[j])) {
              throw new Error("Grouping error:  ranges {" + configGroups[i].cols[0] + ", " + configGroups[i].cols[1] + "} and {" + cols[j][0] + ", " + cols[j][1] + "} are overlapping.");
              return false;
            }
          }
        }
      }
      return true;
    },
    afterGetRowHeaderRenderers: function(arr) {
      Handsontable.Grouping.groupIndicatorsFactory(arr, 'vertical');
    },
    afterGetColumnHeaderRenderers: function(arr) {
      Handsontable.Grouping.groupIndicatorsFactory(arr, 'horizontal');
    },
    hookProxy: function(fn, arg) {
      return function() {
        if (instance.getSettings().groups) {
          return arg ? Handsontable.Grouping[fn](arg).apply(this, arguments) : Handsontable.Grouping[fn].apply(this, arguments);
        } else {
          return void 0;
        }
      };
    }
  };
}
Grouping.prototype.beforeInit = function() {};
var init = function() {
  var instance = this,
      groupingSetting = !!(instance.getSettings().groups);
  if (groupingSetting) {
    var headerUpdates = {};
    Handsontable.Grouping = new Grouping(instance);
    if (!instance.getSettings().rowHeaders) {
      headerUpdates.rowHeaders = true;
    }
    if (!instance.getSettings().colHeaders) {
      headerUpdates.colHeaders = true;
    }
    if (headerUpdates.colHeaders || headerUpdates.rowHeaders) {
      instance.updateSettings(headerUpdates);
    }
    var groupConfigValid = Handsontable.Grouping.validateGroups();
    if (!groupConfigValid) {
      return;
    }
    instance.addHook('beforeInit', Handsontable.Grouping.hookProxy('init'));
    instance.addHook('afterUpdateSettings', Handsontable.Grouping.hookProxy('updateGroups'));
    instance.addHook('afterGetColumnHeaderRenderers', Handsontable.Grouping.hookProxy('afterGetColumnHeaderRenderers'));
    instance.addHook('afterGetRowHeaderRenderers', Handsontable.Grouping.hookProxy('afterGetRowHeaderRenderers'));
    instance.addHook('afterGetRowHeader', Handsontable.Grouping.hookProxy('afterGetRowHeader'));
    instance.addHook('afterGetColHeader', Handsontable.Grouping.hookProxy('afterGetColHeader'));
    instance.addHook('beforeOnCellMouseDown', Handsontable.Grouping.hookProxy('toggleGroupVisibility'));
    instance.addHook('modifyTransformStart', Handsontable.Grouping.hookProxy('modifySelectionFactory', 'start'));
    instance.addHook('modifyTransformEnd', Handsontable.Grouping.hookProxy('modifySelectionFactory', 'end'));
    instance.addHook('modifyRowHeight', Handsontable.Grouping.hookProxy('modifyRowHeight'));
  }
};
var updateHeaderWidths = function() {
  var colgroups = document.querySelectorAll('colgroup');
  for (var i = 0,
      colgroupsLength = colgroups.length; i < colgroupsLength; i++) {
    var rowHeaders = colgroups[i].querySelectorAll('col.rowHeader');
    if (rowHeaders.length === 0) {
      return;
    }
    for (var j = 0,
        rowHeadersLength = rowHeaders.length + 1; j < rowHeadersLength; j++) {
      if (rowHeadersLength == 2) {
        return;
      }
      if (j < Handsontable.Grouping.getLevels().rows + 1) {
        if (j == Handsontable.Grouping.getLevels().rows) {
          dom.addClass(rowHeaders[j], 'htGroupColClosest');
        } else {
          dom.addClass(rowHeaders[j], 'htGroupCol');
        }
      }
    }
  }
};
Handsontable.hooks.add('beforeInit', init);
Handsontable.hooks.add('afterUpdateSettings', function() {
  if (this.getSettings().groups && !Handsontable.Grouping) {
    init.call(this, arguments);
  } else if (!this.getSettings().groups && Handsontable.Grouping) {
    Handsontable.Grouping.resetGroups();
    Handsontable.Grouping = void 0;
  }
});
Handsontable.plugins.Grouping = Grouping;


//# 
},{"./../../dom.js":34,"./../../plugins.js":52}],64:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  ManualColumnFreeze: {get: function() {
      return ManualColumnFreeze;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_plugins_46_js__;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
;
function ManualColumnFreeze(instance) {
  var fixedColumnsCount = instance.getSettings().fixedColumnsLeft;
  var init = function() {
    if (typeof instance.manualColumnPositionsPluginUsages !== 'undefined') {
      instance.manualColumnPositionsPluginUsages.push('manualColumnFreeze');
    } else {
      instance.manualColumnPositionsPluginUsages = ['manualColumnFreeze'];
    }
    bindHooks();
  };
  function addContextMenuEntry(defaultOptions) {
    defaultOptions.items.push(Handsontable.ContextMenu.SEPARATOR, {
      key: 'freeze_column',
      name: function() {
        var selectedColumn = instance.getSelected()[1];
        if (selectedColumn > fixedColumnsCount - 1) {
          return 'Freeze this column';
        } else {
          return 'Unfreeze this column';
        }
      },
      disabled: function() {
        var selection = instance.getSelected();
        return selection[1] !== selection[3];
      },
      callback: function() {
        var selectedColumn = instance.getSelected()[1];
        if (selectedColumn > fixedColumnsCount - 1) {
          freezeColumn(selectedColumn);
        } else {
          unfreezeColumn(selectedColumn);
        }
      }
    });
  }
  function addFixedColumn() {
    instance.updateSettings({fixedColumnsLeft: fixedColumnsCount + 1});
    fixedColumnsCount++;
  }
  function removeFixedColumn() {
    instance.updateSettings({fixedColumnsLeft: fixedColumnsCount - 1});
    fixedColumnsCount--;
  }
  function checkPositionData(col) {
    if (!instance.manualColumnPositions || instance.manualColumnPositions.length === 0) {
      if (!instance.manualColumnPositions) {
        instance.manualColumnPositions = [];
      }
    }
    if (col) {
      if (!instance.manualColumnPositions[col]) {
        createPositionData(col + 1);
      }
    } else {
      createPositionData(instance.countCols());
    }
  }
  function createPositionData(len) {
    if (instance.manualColumnPositions.length < len) {
      for (var i = instance.manualColumnPositions.length; i < len; i++) {
        instance.manualColumnPositions[i] = i;
      }
    }
  }
  function modifyColumnOrder(col, actualCol, returnCol, action) {
    if (returnCol == null) {
      returnCol = col;
    }
    if (action === 'freeze') {
      instance.manualColumnPositions.splice(fixedColumnsCount, 0, instance.manualColumnPositions.splice(actualCol, 1)[0]);
    } else if (action === 'unfreeze') {
      instance.manualColumnPositions.splice(returnCol, 0, instance.manualColumnPositions.splice(actualCol, 1)[0]);
    }
  }
  function getBestColumnReturnPosition(col) {
    var i = fixedColumnsCount,
        j = getModifiedColumnIndex(i),
        initialCol = getModifiedColumnIndex(col);
    while (j < initialCol) {
      i++;
      j = getModifiedColumnIndex(i);
    }
    return i - 1;
  }
  function freezeColumn(col) {
    if (col <= fixedColumnsCount - 1) {
      return;
    }
    var modifiedColumn = getModifiedColumnIndex(col) || col;
    checkPositionData(modifiedColumn);
    modifyColumnOrder(modifiedColumn, col, null, 'freeze');
    addFixedColumn();
    instance.view.wt.wtOverlays.leftOverlay.refresh();
  }
  function unfreezeColumn(col) {
    if (col > fixedColumnsCount - 1) {
      return;
    }
    var returnCol = getBestColumnReturnPosition(col);
    var modifiedColumn = getModifiedColumnIndex(col) || col;
    checkPositionData(modifiedColumn);
    modifyColumnOrder(modifiedColumn, col, returnCol, 'unfreeze');
    removeFixedColumn();
    instance.view.wt.wtOverlays.leftOverlay.refresh();
  }
  function getModifiedColumnIndex(col) {
    return instance.manualColumnPositions[col];
  }
  function onModifyCol(col) {
    if (this.manualColumnPositionsPluginUsages.length > 1) {
      return col;
    }
    return getModifiedColumnIndex(col);
  }
  function bindHooks() {
    instance.addHook('modifyCol', onModifyCol);
    instance.addHook('afterContextMenuDefaultOptions', addContextMenuEntry);
  }
  return {
    init: init,
    freezeColumn: freezeColumn,
    unfreezeColumn: unfreezeColumn,
    helpers: {
      addFixedColumn: addFixedColumn,
      removeFixedColumn: removeFixedColumn,
      checkPositionData: checkPositionData,
      modifyColumnOrder: modifyColumnOrder,
      getBestColumnReturnPosition: getBestColumnReturnPosition
    }
  };
}
var init = function init() {
  if (!this.getSettings().manualColumnFreeze) {
    return;
  }
  var mcfPlugin;
  Handsontable.plugins.manualColumnFreeze = ManualColumnFreeze;
  this.manualColumnFreeze = new ManualColumnFreeze(this);
  mcfPlugin = this.manualColumnFreeze;
  mcfPlugin.init.call(this);
};
Handsontable.hooks.add('beforeInit', init);


//# 
},{"./../../plugins.js":52}],65:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  ManualColumnMove: {get: function() {
      return ManualColumnMove;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_helpers_46_js__,
    $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_eventManager_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__;
var helper = ($___46__46__47__46__46__47_helpers_46_js__ = require("./../../helpers.js"), $___46__46__47__46__46__47_helpers_46_js__ && $___46__46__47__46__46__47_helpers_46_js__.__esModule && $___46__46__47__46__46__47_helpers_46_js__ || {default: $___46__46__47__46__46__47_helpers_46_js__});
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var eventManagerObject = ($___46__46__47__46__46__47_eventManager_46_js__ = require("./../../eventManager.js"), $___46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
;
function ManualColumnMove() {
  var startCol,
      endCol,
      startX,
      startOffset,
      currentCol,
      instance,
      currentTH,
      handle = document.createElement('DIV'),
      guide = document.createElement('DIV'),
      eventManager = eventManagerObject(this);
  handle.className = 'manualColumnMover';
  guide.className = 'manualColumnMoverGuide';
  var saveManualColumnPositions = function() {
    var instance = this;
    Handsontable.hooks.run(instance, 'persistentStateSave', 'manualColumnPositions', instance.manualColumnPositions);
  };
  var loadManualColumnPositions = function() {
    var instance = this;
    var storedState = {};
    Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualColumnPositions', storedState);
    return storedState.value;
  };
  function setupHandlePosition(TH) {
    instance = this;
    currentTH = TH;
    var col = this.view.wt.wtTable.getCoords(TH).col;
    if (col >= 0) {
      currentCol = col;
      var box = currentTH.getBoundingClientRect();
      startOffset = box.left;
      handle.style.top = box.top + 'px';
      handle.style.left = startOffset + 'px';
      instance.rootElement.appendChild(handle);
    }
  }
  function refreshHandlePosition(TH, delta) {
    var box = TH.getBoundingClientRect();
    var handleWidth = 6;
    if (delta > 0) {
      handle.style.left = (box.left + box.width - handleWidth) + 'px';
    } else {
      handle.style.left = box.left + 'px';
    }
  }
  function setupGuidePosition() {
    var instance = this;
    dom.addClass(handle, 'active');
    dom.addClass(guide, 'active');
    var box = currentTH.getBoundingClientRect();
    guide.style.width = box.width + 'px';
    guide.style.height = instance.view.maximumVisibleElementHeight(0) + 'px';
    guide.style.top = handle.style.top;
    guide.style.left = startOffset + 'px';
    instance.rootElement.appendChild(guide);
  }
  function refreshGuidePosition(diff) {
    guide.style.left = startOffset + diff + 'px';
  }
  function hideHandleAndGuide() {
    dom.removeClass(handle, 'active');
    dom.removeClass(guide, 'active');
  }
  var checkColumnHeader = function(element) {
    if (element.tagName != 'BODY') {
      if (element.parentNode.tagName == 'THEAD') {
        return true;
      } else {
        element = element.parentNode;
        return checkColumnHeader(element);
      }
    }
    return false;
  };
  var getTHFromTargetElement = function(element) {
    if (element.tagName != 'TABLE') {
      if (element.tagName == 'TH') {
        return element;
      } else {
        return getTHFromTargetElement(element.parentNode);
      }
    }
    return null;
  };
  var bindEvents = function() {
    var instance = this;
    var pressed;
    eventManager.addEventListener(instance.rootElement, 'mouseover', function(e) {
      if (checkColumnHeader(e.target)) {
        var th = getTHFromTargetElement(e.target);
        if (th) {
          if (pressed) {
            var col = instance.view.wt.wtTable.getCoords(th).col;
            if (col >= 0) {
              endCol = col;
              refreshHandlePosition(e.target, endCol - startCol);
            }
          } else {
            setupHandlePosition.call(instance, th);
          }
        }
      }
    });
    eventManager.addEventListener(instance.rootElement, 'mousedown', function(e) {
      if (dom.hasClass(e.target, 'manualColumnMover')) {
        startX = helper.pageX(e);
        setupGuidePosition.call(instance);
        pressed = instance;
        startCol = currentCol;
        endCol = currentCol;
      }
    });
    eventManager.addEventListener(window, 'mousemove', function(e) {
      if (pressed) {
        refreshGuidePosition(helper.pageX(e) - startX);
      }
    });
    eventManager.addEventListener(window, 'mouseup', function(e) {
      if (pressed) {
        hideHandleAndGuide();
        pressed = false;
        createPositionData(instance.manualColumnPositions, instance.countCols());
        instance.manualColumnPositions.splice(endCol, 0, instance.manualColumnPositions.splice(startCol, 1)[0]);
        instance.forceFullRender = true;
        instance.view.render();
        saveManualColumnPositions.call(instance);
        Handsontable.hooks.run(instance, 'afterColumnMove', startCol, endCol);
        setupHandlePosition.call(instance, currentTH);
      }
    });
    instance.addHook('afterDestroy', unbindEvents);
  };
  var unbindEvents = function() {
    eventManager.clear();
  };
  var createPositionData = function(positionArr, len) {
    if (positionArr.length < len) {
      for (var i = positionArr.length; i < len; i++) {
        positionArr[i] = i;
      }
    }
  };
  this.beforeInit = function() {
    this.manualColumnPositions = [];
  };
  this.init = function(source) {
    var instance = this;
    var manualColMoveEnabled = !!(this.getSettings().manualColumnMove);
    if (manualColMoveEnabled) {
      var initialManualColumnPositions = this.getSettings().manualColumnMove;
      var loadedManualColumnPositions = loadManualColumnPositions.call(instance);
      if (typeof loadedManualColumnPositions != 'undefined') {
        this.manualColumnPositions = loadedManualColumnPositions;
      } else if (Array.isArray(initialManualColumnPositions)) {
        this.manualColumnPositions = initialManualColumnPositions;
      } else {
        this.manualColumnPositions = [];
      }
      if (source == 'afterInit') {
        if (typeof instance.manualColumnPositionsPluginUsages != 'undefined') {
          instance.manualColumnPositionsPluginUsages.push('manualColumnMove');
        } else {
          instance.manualColumnPositionsPluginUsages = ['manualColumnMove'];
        }
        bindEvents.call(this);
        if (this.manualColumnPositions.length > 0) {
          this.forceFullRender = true;
          this.render();
        }
      }
    } else {
      var pluginUsagesIndex = instance.manualColumnPositionsPluginUsages ? instance.manualColumnPositionsPluginUsages.indexOf('manualColumnMove') : -1;
      if (pluginUsagesIndex > -1) {
        unbindEvents.call(this);
        this.manualColumnPositions = [];
        instance.manualColumnPositionsPluginUsages[pluginUsagesIndex] = void 0;
      }
    }
  };
  this.modifyCol = function(col) {
    if (this.getSettings().manualColumnMove) {
      if (typeof this.manualColumnPositions[col] === 'undefined') {
        createPositionData(this.manualColumnPositions, col + 1);
      }
      return this.manualColumnPositions[col];
    }
    return col;
  };
  this.afterRemoveCol = function(index, amount) {
    if (!this.getSettings().manualColumnMove) {
      return;
    }
    var rmindx,
        colpos = this.manualColumnPositions;
    rmindx = colpos.splice(index, amount);
    colpos = colpos.map(function(colpos) {
      var i,
          newpos = colpos;
      for (i = 0; i < rmindx.length; i++) {
        if (colpos > rmindx[i]) {
          newpos--;
        }
      }
      return newpos;
    });
    this.manualColumnPositions = colpos;
  };
  this.afterCreateCol = function(index, amount) {
    if (!this.getSettings().manualColumnMove) {
      return;
    }
    var colpos = this.manualColumnPositions;
    if (!colpos.length) {
      return;
    }
    var addindx = [];
    for (var i = 0; i < amount; i++) {
      addindx.push(index + i);
    }
    if (index >= colpos.length) {
      colpos.concat(addindx);
    } else {
      colpos = colpos.map(function(colpos) {
        return (colpos >= index) ? (colpos + amount) : colpos;
      });
      colpos.splice.apply(colpos, [index, 0].concat(addindx));
    }
    this.manualColumnPositions = colpos;
  };
}
var htManualColumnMove = new ManualColumnMove();
Handsontable.hooks.add('beforeInit', htManualColumnMove.beforeInit);
Handsontable.hooks.add('afterInit', function() {
  htManualColumnMove.init.call(this, 'afterInit');
});
Handsontable.hooks.add('afterUpdateSettings', function() {
  htManualColumnMove.init.call(this, 'afterUpdateSettings');
});
Handsontable.hooks.add('modifyCol', htManualColumnMove.modifyCol);
Handsontable.hooks.add('afterRemoveCol', htManualColumnMove.afterRemoveCol);
Handsontable.hooks.add('afterCreateCol', htManualColumnMove.afterCreateCol);
Handsontable.hooks.register('afterColumnMove');


//# 
},{"./../../dom.js":34,"./../../eventManager.js":48,"./../../helpers.js":49,"./../../plugins.js":52}],66:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  ManualColumnResize: {get: function() {
      return ManualColumnResize;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_helpers_46_js__,
    $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_eventManager_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__;
var helper = ($___46__46__47__46__46__47_helpers_46_js__ = require("./../../helpers.js"), $___46__46__47__46__46__47_helpers_46_js__ && $___46__46__47__46__46__47_helpers_46_js__.__esModule && $___46__46__47__46__46__47_helpers_46_js__ || {default: $___46__46__47__46__46__47_helpers_46_js__});
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var eventManagerObject = ($___46__46__47__46__46__47_eventManager_46_js__ = require("./../../eventManager.js"), $___46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
;
function ManualColumnResize() {
  var currentTH,
      currentCol,
      currentWidth,
      instance,
      newSize,
      startX,
      startWidth,
      startOffset,
      handle = document.createElement('DIV'),
      guide = document.createElement('DIV'),
      eventManager = eventManagerObject(this);
  handle.className = 'manualColumnResizer';
  guide.className = 'manualColumnResizerGuide';
  var saveManualColumnWidths = function() {
    var instance = this;
    Handsontable.hooks.run(instance, 'persistentStateSave', 'manualColumnWidths', instance.manualColumnWidths);
  };
  var loadManualColumnWidths = function() {
    var instance = this;
    var storedState = {};
    Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualColumnWidths', storedState);
    return storedState.value;
  };
  function setupHandlePosition(TH) {
    instance = this;
    currentTH = TH;
    var col = this.view.wt.wtTable.getCoords(TH).col;
    if (col >= 0) {
      currentCol = col;
      var box = currentTH.getBoundingClientRect();
      startOffset = box.left - 6;
      startWidth = parseInt(box.width, 10);
      handle.style.top = box.top + 'px';
      handle.style.left = startOffset + startWidth + 'px';
      instance.rootElement.appendChild(handle);
    }
  }
  function refreshHandlePosition() {
    handle.style.left = startOffset + currentWidth + 'px';
  }
  function setupGuidePosition() {
    var instance = this;
    dom.addClass(handle, 'active');
    dom.addClass(guide, 'active');
    guide.style.top = handle.style.top;
    guide.style.left = handle.style.left;
    guide.style.height = instance.view.maximumVisibleElementHeight(0) + 'px';
    instance.rootElement.appendChild(guide);
  }
  function refreshGuidePosition() {
    guide.style.left = handle.style.left;
  }
  function hideHandleAndGuide() {
    dom.removeClass(handle, 'active');
    dom.removeClass(guide, 'active');
  }
  var checkColumnHeader = function(element) {
    if (element.tagName != 'BODY') {
      if (element.parentNode.tagName == 'THEAD') {
        return true;
      } else {
        element = element.parentNode;
        return checkColumnHeader(element);
      }
    }
    return false;
  };
  var getTHFromTargetElement = function(element) {
    if (element.tagName != 'TABLE') {
      if (element.tagName == 'TH') {
        return element;
      } else {
        return getTHFromTargetElement(element.parentNode);
      }
    }
    return null;
  };
  var bindEvents = function() {
    var instance = this;
    var pressed;
    var dblclick = 0;
    var autoresizeTimeout = null;
    eventManager.addEventListener(instance.rootElement, 'mouseover', function(e) {
      if (checkColumnHeader(e.target)) {
        var th = getTHFromTargetElement(e.target);
        if (th) {
          if (!pressed) {
            setupHandlePosition.call(instance, th);
          }
        }
      }
    });
    eventManager.addEventListener(instance.rootElement, 'mousedown', function(e) {
      if (dom.hasClass(e.target, 'manualColumnResizer')) {
        setupGuidePosition.call(instance);
        pressed = instance;
        if (autoresizeTimeout == null) {
          autoresizeTimeout = setTimeout(function() {
            if (dblclick >= 2) {
              newSize = instance.determineColumnWidth.call(instance, currentCol);
              setManualSize(currentCol, newSize);
              instance.forceFullRender = true;
              instance.view.render();
              Handsontable.hooks.run(instance, 'afterColumnResize', currentCol, newSize);
            }
            dblclick = 0;
            autoresizeTimeout = null;
          }, 500);
          instance._registerTimeout(autoresizeTimeout);
        }
        dblclick++;
        startX = helper.pageX(e);
        newSize = startWidth;
      }
    });
    eventManager.addEventListener(window, 'mousemove', function(e) {
      if (pressed) {
        currentWidth = startWidth + (helper.pageX(e) - startX);
        newSize = setManualSize(currentCol, currentWidth);
        refreshHandlePosition();
        refreshGuidePosition();
      }
    });
    eventManager.addEventListener(window, 'mouseup', function() {
      if (pressed) {
        hideHandleAndGuide();
        pressed = false;
        if (newSize != startWidth) {
          instance.forceFullRender = true;
          instance.view.render();
          saveManualColumnWidths.call(instance);
          Handsontable.hooks.run(instance, 'afterColumnResize', currentCol, newSize);
        }
        setupHandlePosition.call(instance, currentTH);
      }
    });
    instance.addHook('afterDestroy', unbindEvents);
  };
  var unbindEvents = function() {
    eventManager.clear();
  };
  this.beforeInit = function() {
    this.manualColumnWidths = [];
  };
  this.init = function(source) {
    var instance = this;
    var manualColumnWidthEnabled = !!(this.getSettings().manualColumnResize);
    if (manualColumnWidthEnabled) {
      var initialColumnWidths = this.getSettings().manualColumnResize;
      var loadedManualColumnWidths = loadManualColumnWidths.call(instance);
      if (typeof instance.manualColumnWidthsPluginUsages != 'undefined') {
        instance.manualColumnWidthsPluginUsages.push('manualColumnResize');
      } else {
        instance.manualColumnWidthsPluginUsages = ['manualColumnResize'];
      }
      if (typeof loadedManualColumnWidths != 'undefined') {
        this.manualColumnWidths = loadedManualColumnWidths;
      } else if (Array.isArray(initialColumnWidths)) {
        this.manualColumnWidths = initialColumnWidths;
      } else {
        this.manualColumnWidths = [];
      }
      if (source == 'afterInit') {
        bindEvents.call(this);
        if (this.manualColumnWidths.length > 0) {
          this.forceFullRender = true;
          this.render();
        }
      }
    } else {
      var pluginUsagesIndex = instance.manualColumnWidthsPluginUsages ? instance.manualColumnWidthsPluginUsages.indexOf('manualColumnResize') : -1;
      if (pluginUsagesIndex > -1) {
        unbindEvents.call(this);
        this.manualColumnWidths = [];
      }
    }
  };
  var setManualSize = function(col, width) {
    width = Math.max(width, 20);
    col = Handsontable.hooks.run(instance, 'modifyCol', col);
    instance.manualColumnWidths[col] = width;
    return width;
  };
  this.modifyColWidth = function(width, col) {
    col = this.runHooks('modifyCol', col);
    if (this.getSettings().manualColumnResize && this.manualColumnWidths[col]) {
      return this.manualColumnWidths[col];
    }
    return width;
  };
}
var htManualColumnResize = new ManualColumnResize();
Handsontable.hooks.add('beforeInit', htManualColumnResize.beforeInit);
Handsontable.hooks.add('afterInit', function() {
  htManualColumnResize.init.call(this, 'afterInit');
});
Handsontable.hooks.add('afterUpdateSettings', function() {
  htManualColumnResize.init.call(this, 'afterUpdateSettings');
});
Handsontable.hooks.add('modifyColWidth', htManualColumnResize.modifyColWidth);
Handsontable.hooks.register('afterColumnResize');


//# 
},{"./../../dom.js":34,"./../../eventManager.js":48,"./../../helpers.js":49,"./../../plugins.js":52}],67:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  ManualRowMove: {get: function() {
      return ManualRowMove;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_helpers_46_js__,
    $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_eventManager_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__;
var helper = ($___46__46__47__46__46__47_helpers_46_js__ = require("./../../helpers.js"), $___46__46__47__46__46__47_helpers_46_js__ && $___46__46__47__46__46__47_helpers_46_js__.__esModule && $___46__46__47__46__46__47_helpers_46_js__ || {default: $___46__46__47__46__46__47_helpers_46_js__});
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var eventManagerObject = ($___46__46__47__46__46__47_eventManager_46_js__ = require("./../../eventManager.js"), $___46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
;
function ManualRowMove() {
  var startRow,
      endRow,
      startY,
      startOffset,
      currentRow,
      currentTH,
      handle = document.createElement('DIV'),
      guide = document.createElement('DIV'),
      eventManager = eventManagerObject(this);
  handle.className = 'manualRowMover';
  guide.className = 'manualRowMoverGuide';
  var saveManualRowPositions = function() {
    var instance = this;
    Handsontable.hooks.run(instance, 'persistentStateSave', 'manualRowPositions', instance.manualRowPositions);
  };
  var loadManualRowPositions = function() {
    var instance = this,
        storedState = {};
    Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualRowPositions', storedState);
    return storedState.value;
  };
  function setupHandlePosition(TH) {
    var instance = this;
    currentTH = TH;
    var row = this.view.wt.wtTable.getCoords(TH).row;
    if (row >= 0) {
      currentRow = row;
      var box = currentTH.getBoundingClientRect();
      startOffset = box.top;
      handle.style.top = startOffset + 'px';
      handle.style.left = box.left + 'px';
      instance.rootElement.appendChild(handle);
    }
  }
  function refreshHandlePosition(TH, delta) {
    var box = TH.getBoundingClientRect();
    var handleHeight = 6;
    if (delta > 0) {
      handle.style.top = (box.top + box.height - handleHeight) + 'px';
    } else {
      handle.style.top = box.top + 'px';
    }
  }
  function setupGuidePosition() {
    var instance = this;
    dom.addClass(handle, 'active');
    dom.addClass(guide, 'active');
    var box = currentTH.getBoundingClientRect();
    guide.style.width = instance.view.maximumVisibleElementWidth(0) + 'px';
    guide.style.height = box.height + 'px';
    guide.style.top = startOffset + 'px';
    guide.style.left = handle.style.left;
    instance.rootElement.appendChild(guide);
  }
  function refreshGuidePosition(diff) {
    guide.style.top = startOffset + diff + 'px';
  }
  function hideHandleAndGuide() {
    dom.removeClass(handle, 'active');
    dom.removeClass(guide, 'active');
  }
  var checkRowHeader = function(element) {
    if (element.tagName != 'BODY') {
      if (element.parentNode.tagName == 'TBODY') {
        return true;
      } else {
        element = element.parentNode;
        return checkRowHeader(element);
      }
    }
    return false;
  };
  var getTHFromTargetElement = function(element) {
    if (element.tagName != 'TABLE') {
      if (element.tagName == 'TH') {
        return element;
      } else {
        return getTHFromTargetElement(element.parentNode);
      }
    }
    return null;
  };
  var bindEvents = function() {
    var instance = this;
    var pressed;
    eventManager.addEventListener(instance.rootElement, 'mouseover', function(e) {
      if (checkRowHeader(e.target)) {
        var th = getTHFromTargetElement(e.target);
        if (th) {
          if (pressed) {
            endRow = instance.view.wt.wtTable.getCoords(th).row;
            refreshHandlePosition(th, endRow - startRow);
          } else {
            setupHandlePosition.call(instance, th);
          }
        }
      }
    });
    eventManager.addEventListener(instance.rootElement, 'mousedown', function(e) {
      if (dom.hasClass(e.target, 'manualRowMover')) {
        startY = helper.pageY(e);
        setupGuidePosition.call(instance);
        pressed = instance;
        startRow = currentRow;
        endRow = currentRow;
      }
    });
    eventManager.addEventListener(window, 'mousemove', function(e) {
      if (pressed) {
        refreshGuidePosition(helper.pageY(e) - startY);
      }
    });
    eventManager.addEventListener(window, 'mouseup', function(e) {
      if (pressed) {
        hideHandleAndGuide();
        pressed = false;
        createPositionData(instance.manualRowPositions, instance.countRows());
        instance.manualRowPositions.splice(endRow, 0, instance.manualRowPositions.splice(startRow, 1)[0]);
        instance.forceFullRender = true;
        instance.view.render();
        saveManualRowPositions.call(instance);
        Handsontable.hooks.run(instance, 'afterRowMove', startRow, endRow);
        setupHandlePosition.call(instance, currentTH);
      }
    });
    instance.addHook('afterDestroy', unbindEvents);
  };
  var unbindEvents = function() {
    eventManager.clear();
  };
  var createPositionData = function(positionArr, len) {
    if (positionArr.length < len) {
      for (var i = positionArr.length; i < len; i++) {
        positionArr[i] = i;
      }
    }
  };
  this.beforeInit = function() {
    this.manualRowPositions = [];
  };
  this.init = function(source) {
    var instance = this;
    var manualRowMoveEnabled = !!(instance.getSettings().manualRowMove);
    if (manualRowMoveEnabled) {
      var initialManualRowPositions = instance.getSettings().manualRowMove;
      var loadedManualRowPostions = loadManualRowPositions.call(instance);
      if (typeof instance.manualRowPositionsPluginUsages != 'undefined') {
        instance.manualRowPositionsPluginUsages.push('manualColumnMove');
      } else {
        instance.manualRowPositionsPluginUsages = ['manualColumnMove'];
      }
      if (typeof loadedManualRowPostions != 'undefined') {
        this.manualRowPositions = loadedManualRowPostions;
      } else if (Array.isArray(initialManualRowPositions)) {
        this.manualRowPositions = initialManualRowPositions;
      } else {
        this.manualRowPositions = [];
      }
      if (source === 'afterInit') {
        bindEvents.call(this);
        if (this.manualRowPositions.length > 0) {
          instance.forceFullRender = true;
          instance.render();
        }
      }
    } else {
      var pluginUsagesIndex = instance.manualRowPositionsPluginUsages ? instance.manualRowPositionsPluginUsages.indexOf('manualColumnMove') : -1;
      if (pluginUsagesIndex > -1) {
        unbindEvents.call(this);
        instance.manualRowPositions = [];
        instance.manualRowPositionsPluginUsages[pluginUsagesIndex] = void 0;
      }
    }
  };
  this.modifyRow = function(row) {
    var instance = this;
    if (instance.getSettings().manualRowMove) {
      if (typeof instance.manualRowPositions[row] === 'undefined') {
        createPositionData(this.manualRowPositions, row + 1);
      }
      return instance.manualRowPositions[row];
    }
    return row;
  };
}
var htManualRowMove = new ManualRowMove();
Handsontable.hooks.add('beforeInit', htManualRowMove.beforeInit);
Handsontable.hooks.add('afterInit', function() {
  htManualRowMove.init.call(this, 'afterInit');
});
Handsontable.hooks.add('afterUpdateSettings', function() {
  htManualRowMove.init.call(this, 'afterUpdateSettings');
});
Handsontable.hooks.add('modifyRow', htManualRowMove.modifyRow);
Handsontable.hooks.register('afterRowMove');


//# 
},{"./../../dom.js":34,"./../../eventManager.js":48,"./../../helpers.js":49,"./../../plugins.js":52}],68:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  ManualRowResize: {get: function() {
      return ManualRowResize;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_helpers_46_js__,
    $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_eventManager_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__;
var helper = ($___46__46__47__46__46__47_helpers_46_js__ = require("./../../helpers.js"), $___46__46__47__46__46__47_helpers_46_js__ && $___46__46__47__46__46__47_helpers_46_js__.__esModule && $___46__46__47__46__46__47_helpers_46_js__ || {default: $___46__46__47__46__46__47_helpers_46_js__});
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var eventManagerObject = ($___46__46__47__46__46__47_eventManager_46_js__ = require("./../../eventManager.js"), $___46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
;
function ManualRowResize() {
  var currentTH,
      currentRow,
      currentHeight,
      instance,
      newSize,
      startY,
      startHeight,
      startOffset,
      handle = document.createElement('DIV'),
      guide = document.createElement('DIV'),
      eventManager = eventManagerObject(this);
  handle.className = 'manualRowResizer';
  guide.className = 'manualRowResizerGuide';
  var saveManualRowHeights = function() {
    var instance = this;
    Handsontable.hooks.run(instance, 'persistentStateSave', 'manualRowHeights', instance.manualRowHeights);
  };
  var loadManualRowHeights = function() {
    var instance = this,
        storedState = {};
    Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualRowHeights', storedState);
    return storedState.value;
  };
  function setupHandlePosition(TH) {
    instance = this;
    currentTH = TH;
    var row = this.view.wt.wtTable.getCoords(TH).row;
    if (row >= 0) {
      currentRow = row;
      var box = currentTH.getBoundingClientRect();
      startOffset = box.top - 6;
      startHeight = parseInt(box.height, 10);
      handle.style.left = box.left + 'px';
      handle.style.top = startOffset + startHeight + 'px';
      instance.rootElement.appendChild(handle);
    }
  }
  function refreshHandlePosition() {
    handle.style.top = startOffset + currentHeight + 'px';
  }
  function setupGuidePosition() {
    var instance = this;
    dom.addClass(handle, 'active');
    dom.addClass(guide, 'active');
    guide.style.top = handle.style.top;
    guide.style.left = handle.style.left;
    guide.style.width = instance.view.maximumVisibleElementWidth(0) + 'px';
    instance.rootElement.appendChild(guide);
  }
  function refreshGuidePosition() {
    guide.style.top = handle.style.top;
  }
  function hideHandleAndGuide() {
    dom.removeClass(handle, 'active');
    dom.removeClass(guide, 'active');
  }
  var checkRowHeader = function(element) {
    if (element.tagName != 'BODY') {
      if (element.parentNode.tagName == 'TBODY') {
        return true;
      } else {
        element = element.parentNode;
        return checkRowHeader(element);
      }
    }
    return false;
  };
  var getTHFromTargetElement = function(element) {
    if (element.tagName != 'TABLE') {
      if (element.tagName == 'TH') {
        return element;
      } else {
        return getTHFromTargetElement(element.parentNode);
      }
    }
    return null;
  };
  var bindEvents = function() {
    var instance = this;
    var pressed;
    var dblclick = 0;
    var autoresizeTimeout = null;
    eventManager.addEventListener(instance.rootElement, 'mouseover', function(e) {
      if (checkRowHeader(e.target)) {
        var th = getTHFromTargetElement(e.target);
        if (th) {
          if (!pressed) {
            setupHandlePosition.call(instance, th);
          }
        }
      }
    });
    eventManager.addEventListener(instance.rootElement, 'mousedown', function(e) {
      if (dom.hasClass(e.target, 'manualRowResizer')) {
        setupGuidePosition.call(instance);
        pressed = instance;
        if (autoresizeTimeout == null) {
          autoresizeTimeout = setTimeout(function() {
            if (dblclick >= 2) {
              setManualSize(currentRow, null);
              instance.forceFullRender = true;
              instance.view.render();
              Handsontable.hooks.run(instance, 'afterRowResize', currentRow, newSize);
            }
            dblclick = 0;
            autoresizeTimeout = null;
          }, 500);
          instance._registerTimeout(autoresizeTimeout);
        }
        dblclick++;
        startY = helper.pageY(e);
        newSize = startHeight;
      }
    });
    eventManager.addEventListener(window, 'mousemove', function(e) {
      if (pressed) {
        currentHeight = startHeight + (helper.pageY(e) - startY);
        newSize = setManualSize(currentRow, currentHeight);
        refreshHandlePosition();
        refreshGuidePosition();
      }
    });
    eventManager.addEventListener(window, 'mouseup', function(e) {
      if (pressed) {
        hideHandleAndGuide();
        pressed = false;
        if (newSize != startHeight) {
          instance.forceFullRender = true;
          instance.view.render();
          saveManualRowHeights.call(instance);
          Handsontable.hooks.run(instance, 'afterRowResize', currentRow, newSize);
        }
        setupHandlePosition.call(instance, currentTH);
      }
    });
    instance.addHook('afterDestroy', unbindEvents);
  };
  var unbindEvents = function() {
    eventManager.clear();
  };
  this.beforeInit = function() {
    this.manualRowHeights = [];
  };
  this.init = function(source) {
    var instance = this;
    var manualColumnHeightEnabled = !!(this.getSettings().manualRowResize);
    if (manualColumnHeightEnabled) {
      var initialRowHeights = this.getSettings().manualRowResize;
      var loadedManualRowHeights = loadManualRowHeights.call(instance);
      if (typeof instance.manualRowHeightsPluginUsages != 'undefined') {
        instance.manualRowHeightsPluginUsages.push('manualRowResize');
      } else {
        instance.manualRowHeightsPluginUsages = ['manualRowResize'];
      }
      if (typeof loadedManualRowHeights != 'undefined') {
        this.manualRowHeights = loadedManualRowHeights;
      } else if (Array.isArray(initialRowHeights)) {
        this.manualRowHeights = initialRowHeights;
      } else {
        this.manualRowHeights = [];
      }
      if (source === 'afterInit') {
        bindEvents.call(this);
        if (this.manualRowHeights.length > 0) {
          this.forceFullRender = true;
          this.render();
        }
      } else {
        this.forceFullRender = true;
        this.render();
      }
    } else {
      var pluginUsagesIndex = instance.manualRowHeightsPluginUsages ? instance.manualRowHeightsPluginUsages.indexOf('manualRowResize') : -1;
      if (pluginUsagesIndex > -1) {
        unbindEvents.call(this);
        this.manualRowHeights = [];
        instance.manualRowHeightsPluginUsages[pluginUsagesIndex] = void 0;
      }
    }
  };
  var setManualSize = function(row, height) {
    row = Handsontable.hooks.run(instance, 'modifyRow', row);
    instance.manualRowHeights[row] = height;
    return height;
  };
  this.modifyRowHeight = function(height, row) {
    if (this.getSettings().manualRowResize) {
      row = this.runHooks('modifyRow', row);
      if (this.manualRowHeights[row] !== void 0) {
        return this.manualRowHeights[row];
      }
    }
    return height;
  };
}
var htManualRowResize = new ManualRowResize();
Handsontable.hooks.add('beforeInit', htManualRowResize.beforeInit);
Handsontable.hooks.add('afterInit', function() {
  htManualRowResize.init.call(this, 'afterInit');
});
Handsontable.hooks.add('afterUpdateSettings', function() {
  htManualRowResize.init.call(this, 'afterUpdateSettings');
});
Handsontable.hooks.add('modifyRowHeight', htManualRowResize.modifyRowHeight);
Handsontable.hooks.register('afterRowResize');


//# 
},{"./../../dom.js":34,"./../../eventManager.js":48,"./../../helpers.js":49,"./../../plugins.js":52}],69:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  MergeCells: {get: function() {
      return MergeCells;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_plugins_46_js__,
    $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__,
    $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__,
    $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_table_46_js__;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
var WalkontableCellCoords = ($___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ = require("./../../3rdparty/walkontable/src/cellCoords.js"), $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__.__esModule && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ || {default: $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__}).WalkontableCellCoords;
var WalkontableCellRange = ($___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__ = require("./../../3rdparty/walkontable/src/cellRange.js"), $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__ && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__.__esModule && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__ || {default: $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_cellRange_46_js__}).WalkontableCellRange;
var WalkontableTable = ($___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_table_46_js__ = require("./../../3rdparty/walkontable/src/table.js"), $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_table_46_js__ && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_table_46_js__.__esModule && $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_table_46_js__ || {default: $___46__46__47__46__46__47_3rdparty_47_walkontable_47_src_47_table_46_js__}).WalkontableTable;
;
function CellInfoCollection() {
  var collection = [];
  collection.getInfo = function(row, col) {
    for (var i = 0,
        ilen = this.length; i < ilen; i++) {
      if (this[i].row <= row && this[i].row + this[i].rowspan - 1 >= row && this[i].col <= col && this[i].col + this[i].colspan - 1 >= col) {
        return this[i];
      }
    }
  };
  collection.setInfo = function(info) {
    for (var i = 0,
        ilen = this.length; i < ilen; i++) {
      if (this[i].row === info.row && this[i].col === info.col) {
        this[i] = info;
        return;
      }
    }
    this.push(info);
  };
  collection.removeInfo = function(row, col) {
    for (var i = 0,
        ilen = this.length; i < ilen; i++) {
      if (this[i].row === row && this[i].col === col) {
        this.splice(i, 1);
        break;
      }
    }
  };
  return collection;
}
function MergeCells(mergeCellsSetting) {
  this.mergedCellInfoCollection = new CellInfoCollection();
  if (Array.isArray(mergeCellsSetting)) {
    for (var i = 0,
        ilen = mergeCellsSetting.length; i < ilen; i++) {
      this.mergedCellInfoCollection.setInfo(mergeCellsSetting[i]);
    }
  }
}
MergeCells.prototype.canMergeRange = function(cellRange) {
  return !cellRange.isSingle();
};
MergeCells.prototype.mergeRange = function(cellRange) {
  if (!this.canMergeRange(cellRange)) {
    return;
  }
  var topLeft = cellRange.getTopLeftCorner();
  var bottomRight = cellRange.getBottomRightCorner();
  var mergeParent = {};
  mergeParent.row = topLeft.row;
  mergeParent.col = topLeft.col;
  mergeParent.rowspan = bottomRight.row - topLeft.row + 1;
  mergeParent.colspan = bottomRight.col - topLeft.col + 1;
  this.mergedCellInfoCollection.setInfo(mergeParent);
};
MergeCells.prototype.mergeOrUnmergeSelection = function(cellRange) {
  var info = this.mergedCellInfoCollection.getInfo(cellRange.from.row, cellRange.from.col);
  if (info) {
    this.unmergeSelection(cellRange.from);
  } else {
    this.mergeSelection(cellRange);
  }
};
MergeCells.prototype.mergeSelection = function(cellRange) {
  this.mergeRange(cellRange);
};
MergeCells.prototype.unmergeSelection = function(cellRange) {
  var info = this.mergedCellInfoCollection.getInfo(cellRange.row, cellRange.col);
  this.mergedCellInfoCollection.removeInfo(info.row, info.col);
};
MergeCells.prototype.applySpanProperties = function(TD, row, col) {
  var info = this.mergedCellInfoCollection.getInfo(row, col);
  if (info) {
    if (info.row === row && info.col === col) {
      TD.setAttribute('rowspan', info.rowspan);
      TD.setAttribute('colspan', info.colspan);
    } else {
      TD.removeAttribute('rowspan');
      TD.removeAttribute('colspan');
      TD.style.display = "none";
    }
  } else {
    TD.removeAttribute('rowspan');
    TD.removeAttribute('colspan');
  }
};
MergeCells.prototype.modifyTransform = function(hook, currentSelectedRange, delta) {
  var sameRowspan = function(merged, coords) {
    if (coords.row >= merged.row && coords.row <= (merged.row + merged.rowspan - 1)) {
      return true;
    }
    return false;
  },
      sameColspan = function(merged, coords) {
        if (coords.col >= merged.col && coords.col <= (merged.col + merged.colspan - 1)) {
          return true;
        }
        return false;
      },
      getNextPosition = function(newDelta) {
        return new WalkontableCellCoords(currentSelectedRange.to.row + newDelta.row, currentSelectedRange.to.col + newDelta.col);
      };
  var newDelta = {
    row: delta.row,
    col: delta.col
  };
  if (hook == 'modifyTransformStart') {
    if (!this.lastDesiredCoords) {
      this.lastDesiredCoords = new WalkontableCellCoords(null, null);
    }
    var currentPosition = new WalkontableCellCoords(currentSelectedRange.highlight.row, currentSelectedRange.highlight.col),
        mergedParent = this.mergedCellInfoCollection.getInfo(currentPosition.row, currentPosition.col),
        currentRangeContainsMerge;
    for (var i = 0,
        mergesLength = this.mergedCellInfoCollection.length; i < mergesLength; i++) {
      var range = this.mergedCellInfoCollection[i];
      range = new WalkontableCellCoords(range.row + range.rowspan - 1, range.col + range.colspan - 1);
      if (currentSelectedRange.includes(range)) {
        currentRangeContainsMerge = true;
        break;
      }
    }
    if (mergedParent) {
      var mergeTopLeft = new WalkontableCellCoords(mergedParent.row, mergedParent.col),
          mergeBottomRight = new WalkontableCellCoords(mergedParent.row + mergedParent.rowspan - 1, mergedParent.col + mergedParent.colspan - 1),
          mergeRange = new WalkontableCellRange(mergeTopLeft, mergeTopLeft, mergeBottomRight);
      if (!mergeRange.includes(this.lastDesiredCoords)) {
        this.lastDesiredCoords = new WalkontableCellCoords(null, null);
      }
      newDelta.row = this.lastDesiredCoords.row ? this.lastDesiredCoords.row - currentPosition.row : newDelta.row;
      newDelta.col = this.lastDesiredCoords.col ? this.lastDesiredCoords.col - currentPosition.col : newDelta.col;
      if (delta.row > 0) {
        newDelta.row = mergedParent.row + mergedParent.rowspan - 1 - currentPosition.row + delta.row;
      } else if (delta.row < 0) {
        newDelta.row = currentPosition.row - mergedParent.row + delta.row;
      }
      if (delta.col > 0) {
        newDelta.col = mergedParent.col + mergedParent.colspan - 1 - currentPosition.col + delta.col;
      } else if (delta.col < 0) {
        newDelta.col = currentPosition.col - mergedParent.col + delta.col;
      }
    }
    var nextPosition = new WalkontableCellCoords(currentSelectedRange.highlight.row + newDelta.row, currentSelectedRange.highlight.col + newDelta.col),
        nextParentIsMerged = this.mergedCellInfoCollection.getInfo(nextPosition.row, nextPosition.col);
    if (nextParentIsMerged) {
      this.lastDesiredCoords = nextPosition;
      newDelta = {
        row: nextParentIsMerged.row - currentPosition.row,
        col: nextParentIsMerged.col - currentPosition.col
      };
    }
  } else if (hook == 'modifyTransformEnd') {
    for (var i = 0,
        mergesLength = this.mergedCellInfoCollection.length; i < mergesLength; i++) {
      var currentMerge = this.mergedCellInfoCollection[i],
          mergeTopLeft = new WalkontableCellCoords(currentMerge.row, currentMerge.col),
          mergeBottomRight = new WalkontableCellCoords(currentMerge.row + currentMerge.rowspan - 1, currentMerge.col + currentMerge.colspan - 1),
          mergedRange = new WalkontableCellRange(mergeTopLeft, mergeTopLeft, mergeBottomRight),
          sharedBorders = currentSelectedRange.getBordersSharedWith(mergedRange);
      if (mergedRange.isEqual(currentSelectedRange)) {
        currentSelectedRange.setDirection("NW-SE");
      } else if (sharedBorders.length > 0) {
        var mergeHighlighted = (currentSelectedRange.highlight.isEqual(mergedRange.from));
        if (sharedBorders.indexOf('top') > -1) {
          if (currentSelectedRange.to.isSouthEastOf(mergedRange.from) && mergeHighlighted) {
            currentSelectedRange.setDirection("NW-SE");
          } else if (currentSelectedRange.to.isSouthWestOf(mergedRange.from) && mergeHighlighted) {
            currentSelectedRange.setDirection("NE-SW");
          }
        } else if (sharedBorders.indexOf('bottom') > -1) {
          if (currentSelectedRange.to.isNorthEastOf(mergedRange.from) && mergeHighlighted) {
            currentSelectedRange.setDirection("SW-NE");
          } else if (currentSelectedRange.to.isNorthWestOf(mergedRange.from) && mergeHighlighted) {
            currentSelectedRange.setDirection("SE-NW");
          }
        }
      }
      var nextPosition = getNextPosition(newDelta),
          withinRowspan = sameRowspan(currentMerge, nextPosition),
          withinColspan = sameColspan(currentMerge, nextPosition);
      if (currentSelectedRange.includesRange(mergedRange) && (mergedRange.includes(nextPosition) || withinRowspan || withinColspan)) {
        if (withinRowspan) {
          if (newDelta.row < 0) {
            newDelta.row -= currentMerge.rowspan - 1;
          } else if (newDelta.row > 0) {
            newDelta.row += currentMerge.rowspan - 1;
          }
        }
        if (withinColspan) {
          if (newDelta.col < 0) {
            newDelta.col -= currentMerge.colspan - 1;
          } else if (newDelta.col > 0) {
            newDelta.col += currentMerge.colspan - 1;
          }
        }
      }
    }
  }
  if (newDelta.row !== 0) {
    delta.row = newDelta.row;
  }
  if (newDelta.col !== 0) {
    delta.col = newDelta.col;
  }
};
var beforeInit = function() {
  var instance = this;
  var mergeCellsSetting = instance.getSettings().mergeCells;
  if (mergeCellsSetting) {
    if (!instance.mergeCells) {
      instance.mergeCells = new MergeCells(mergeCellsSetting);
    }
  }
};
var afterInit = function() {
  var instance = this;
  if (instance.mergeCells) {
    instance.view.wt.wtTable.getCell = function(coords) {
      if (instance.getSettings().mergeCells) {
        var mergeParent = instance.mergeCells.mergedCellInfoCollection.getInfo(coords.row, coords.col);
        if (mergeParent) {
          coords = mergeParent;
        }
      }
      return WalkontableTable.prototype.getCell.call(this, coords);
    };
  }
};
var onBeforeKeyDown = function(event) {
  if (!this.mergeCells) {
    return;
  }
  var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;
  if (ctrlDown) {
    if (event.keyCode === 77) {
      this.mergeCells.mergeOrUnmergeSelection(this.getSelectedRange());
      this.render();
      event.stopImmediatePropagation();
    }
  }
};
var addMergeActionsToContextMenu = function(defaultOptions) {
  if (!this.getSettings().mergeCells) {
    return;
  }
  defaultOptions.items.push(Handsontable.ContextMenu.SEPARATOR);
  defaultOptions.items.push({
    key: 'mergeCells',
    name: function() {
      var sel = this.getSelected();
      var info = this.mergeCells.mergedCellInfoCollection.getInfo(sel[0], sel[1]);
      if (info) {
        return 'Unmerge cells';
      } else {
        return 'Merge cells';
      }
    },
    callback: function() {
      this.mergeCells.mergeOrUnmergeSelection(this.getSelectedRange());
      this.render();
    },
    disabled: function() {
      return false;
    }
  });
};
var afterRenderer = function(TD, row, col, prop, value, cellProperties) {
  if (this.mergeCells) {
    this.mergeCells.applySpanProperties(TD, row, col);
  }
};
var modifyTransformFactory = function(hook) {
  return function(delta) {
    var mergeCellsSetting = this.getSettings().mergeCells;
    if (mergeCellsSetting) {
      var currentSelectedRange = this.getSelectedRange();
      this.mergeCells.modifyTransform(hook, currentSelectedRange, delta);
      if (hook === "modifyTransformEnd") {
        var totalRows = this.countRows();
        var totalCols = this.countCols();
        if (currentSelectedRange.from.row < 0) {
          currentSelectedRange.from.row = 0;
        } else if (currentSelectedRange.from.row > 0 && currentSelectedRange.from.row >= totalRows) {
          currentSelectedRange.from.row = currentSelectedRange.from - 1;
        }
        if (currentSelectedRange.from.col < 0) {
          currentSelectedRange.from.col = 0;
        } else if (currentSelectedRange.from.col > 0 && currentSelectedRange.from.col >= totalCols) {
          currentSelectedRange.from.col = totalCols - 1;
        }
      }
    }
  };
};
var beforeSetRangeEnd = function(coords) {
  this.lastDesiredCoords = null;
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var selRange = this.getSelectedRange();
    selRange.highlight = new WalkontableCellCoords(selRange.highlight.row, selRange.highlight.col);
    selRange.to = coords;
    var rangeExpanded = false;
    do {
      rangeExpanded = false;
      for (var i = 0,
          ilen = this.mergeCells.mergedCellInfoCollection.length; i < ilen; i++) {
        var cellInfo = this.mergeCells.mergedCellInfoCollection[i];
        var mergedCellTopLeft = new WalkontableCellCoords(cellInfo.row, cellInfo.col);
        var mergedCellBottomRight = new WalkontableCellCoords(cellInfo.row + cellInfo.rowspan - 1, cellInfo.col + cellInfo.colspan - 1);
        var mergedCellRange = new WalkontableCellRange(mergedCellTopLeft, mergedCellTopLeft, mergedCellBottomRight);
        if (selRange.expandByRange(mergedCellRange)) {
          coords.row = selRange.to.row;
          coords.col = selRange.to.col;
          rangeExpanded = true;
        }
      }
    } while (rangeExpanded);
  }
};
var beforeDrawAreaBorders = function(corners, className) {
  if (className && className == 'area') {
    var mergeCellsSetting = this.getSettings().mergeCells;
    if (mergeCellsSetting) {
      var selRange = this.getSelectedRange();
      var startRange = new WalkontableCellRange(selRange.from, selRange.from, selRange.from);
      var stopRange = new WalkontableCellRange(selRange.to, selRange.to, selRange.to);
      for (var i = 0,
          ilen = this.mergeCells.mergedCellInfoCollection.length; i < ilen; i++) {
        var cellInfo = this.mergeCells.mergedCellInfoCollection[i];
        var mergedCellTopLeft = new WalkontableCellCoords(cellInfo.row, cellInfo.col);
        var mergedCellBottomRight = new WalkontableCellCoords(cellInfo.row + cellInfo.rowspan - 1, cellInfo.col + cellInfo.colspan - 1);
        var mergedCellRange = new WalkontableCellRange(mergedCellTopLeft, mergedCellTopLeft, mergedCellBottomRight);
        if (startRange.expandByRange(mergedCellRange)) {
          corners[0] = startRange.from.row;
          corners[1] = startRange.from.col;
        }
        if (stopRange.expandByRange(mergedCellRange)) {
          corners[2] = stopRange.from.row;
          corners[3] = stopRange.from.col;
        }
      }
    }
  }
};
var afterGetCellMeta = function(row, col, cellProperties) {
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(row, col);
    if (mergeParent && (mergeParent.row != row || mergeParent.col != col)) {
      cellProperties.copyable = false;
    }
  }
};
var afterViewportRowCalculatorOverride = function(calc) {
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var colCount = this.countCols();
    var mergeParent;
    for (var c = 0; c < colCount; c++) {
      mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(calc.startRow, c);
      if (mergeParent) {
        if (mergeParent.row < calc.startRow) {
          calc.startRow = mergeParent.row;
          return afterViewportRowCalculatorOverride.call(this, calc);
        }
      }
      mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(calc.endRow, c);
      if (mergeParent) {
        var mergeEnd = mergeParent.row + mergeParent.rowspan - 1;
        if (mergeEnd > calc.endRow) {
          calc.endRow = mergeEnd;
          return afterViewportRowCalculatorOverride.call(this, calc);
        }
      }
    }
  }
};
var afterViewportColumnCalculatorOverride = function(calc) {
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var rowCount = this.countRows();
    var mergeParent;
    for (var r = 0; r < rowCount; r++) {
      mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(r, calc.startColumn);
      if (mergeParent) {
        if (mergeParent.col < calc.startColumn) {
          calc.startColumn = mergeParent.col;
          return afterViewportColumnCalculatorOverride.call(this, calc);
        }
      }
      mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(r, calc.endColumn);
      if (mergeParent) {
        var mergeEnd = mergeParent.col + mergeParent.colspan - 1;
        if (mergeEnd > calc.endColumn) {
          calc.endColumn = mergeEnd;
          return afterViewportColumnCalculatorOverride.call(this, calc);
        }
      }
    }
  }
};
var isMultipleSelection = function(isMultiple) {
  if (isMultiple && this.mergeCells) {
    var mergedCells = this.mergeCells.mergedCellInfoCollection,
        selectionRange = this.getSelectedRange();
    for (var group in mergedCells) {
      if (selectionRange.highlight.row == mergedCells[group].row && selectionRange.highlight.col == mergedCells[group].col && selectionRange.to.row == mergedCells[group].row + mergedCells[group].rowspan - 1 && selectionRange.to.col == mergedCells[group].col + mergedCells[group].colspan - 1) {
        return false;
      }
    }
  }
  return isMultiple;
};
Handsontable.hooks.add('beforeInit', beforeInit);
Handsontable.hooks.add('afterInit', afterInit);
Handsontable.hooks.add('beforeKeyDown', onBeforeKeyDown);
Handsontable.hooks.add('modifyTransformStart', modifyTransformFactory('modifyTransformStart'));
Handsontable.hooks.add('modifyTransformEnd', modifyTransformFactory('modifyTransformEnd'));
Handsontable.hooks.add('beforeSetRangeEnd', beforeSetRangeEnd);
Handsontable.hooks.add('beforeDrawBorders', beforeDrawAreaBorders);
Handsontable.hooks.add('afterIsMultipleSelection', isMultipleSelection);
Handsontable.hooks.add('afterRenderer', afterRenderer);
Handsontable.hooks.add('afterContextMenuDefaultOptions', addMergeActionsToContextMenu);
Handsontable.hooks.add('afterGetCellMeta', afterGetCellMeta);
Handsontable.hooks.add('afterViewportRowCalculatorOverride', afterViewportRowCalculatorOverride);
Handsontable.hooks.add('afterViewportColumnCalculatorOverride', afterViewportColumnCalculatorOverride);
Handsontable.MergeCells = MergeCells;


//# 
},{"./../../3rdparty/walkontable/src/cellCoords.js":8,"./../../3rdparty/walkontable/src/cellRange.js":9,"./../../3rdparty/walkontable/src/table.js":22,"./../../plugins.js":52}],70:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  MultipleSelectionHandles: {get: function() {
      return MultipleSelectionHandles;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_eventManager_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__;
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var eventManagerObject = ($___46__46__47__46__46__47_eventManager_46_js__ = require("./../../eventManager.js"), $___46__46__47__46__46__47_eventManager_46_js__ && $___46__46__47__46__46__47_eventManager_46_js__.__esModule && $___46__46__47__46__46__47_eventManager_46_js__ || {default: $___46__46__47__46__46__47_eventManager_46_js__}).eventManager;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
;
function MultipleSelectionHandles(instance) {
  this.instance = instance;
  this.dragged = [];
  this.eventManager = eventManagerObject(instance);
  this.bindTouchEvents();
}
MultipleSelectionHandles.prototype.getCurrentRangeCoords = function(selectedRange, currentTouch, touchStartDirection, currentDirection, draggedHandle) {
  var topLeftCorner = selectedRange.getTopLeftCorner(),
      bottomRightCorner = selectedRange.getBottomRightCorner(),
      bottomLeftCorner = selectedRange.getBottomLeftCorner(),
      topRightCorner = selectedRange.getTopRightCorner();
  var newCoords = {
    start: null,
    end: null
  };
  switch (touchStartDirection) {
    case "NE-SW":
      switch (currentDirection) {
        case "NE-SW":
        case "NW-SE":
          if (draggedHandle == "topLeft") {
            newCoords = {
              start: new WalkontableCellCoords(currentTouch.row, selectedRange.highlight.col),
              end: new WalkontableCellCoords(bottomLeftCorner.row, currentTouch.col)
            };
          } else {
            newCoords = {
              start: new WalkontableCellCoords(selectedRange.highlight.row, currentTouch.col),
              end: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col)
            };
          }
          break;
        case "SE-NW":
          if (draggedHandle == "bottomRight") {
            newCoords = {
              start: new WalkontableCellCoords(bottomRightCorner.row, currentTouch.col),
              end: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col)
            };
          }
          break;
      }
      break;
    case "NW-SE":
      switch (currentDirection) {
        case "NE-SW":
          if (draggedHandle == "topLeft") {
            newCoords = {
              start: currentTouch,
              end: bottomLeftCorner
            };
          } else {
            newCoords.end = currentTouch;
          }
          break;
        case "NW-SE":
          if (draggedHandle == "topLeft") {
            newCoords = {
              start: currentTouch,
              end: bottomRightCorner
            };
          } else {
            newCoords.end = currentTouch;
          }
          break;
        case "SE-NW":
          if (draggedHandle == "topLeft") {
            newCoords = {
              start: currentTouch,
              end: topLeftCorner
            };
          } else {
            newCoords.end = currentTouch;
          }
          break;
        case "SW-NE":
          if (draggedHandle == "topLeft") {
            newCoords = {
              start: currentTouch,
              end: topRightCorner
            };
          } else {
            newCoords.end = currentTouch;
          }
          break;
      }
      break;
    case "SW-NE":
      switch (currentDirection) {
        case "NW-SE":
          if (draggedHandle == "bottomRight") {
            newCoords = {
              start: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col),
              end: new WalkontableCellCoords(bottomLeftCorner.row, currentTouch.col)
            };
          } else {
            newCoords = {
              start: new WalkontableCellCoords(topLeftCorner.row, currentTouch.col),
              end: new WalkontableCellCoords(currentTouch.row, bottomRightCorner.col)
            };
          }
          break;
        case "SW-NE":
          if (draggedHandle == "topLeft") {
            newCoords = {
              start: new WalkontableCellCoords(selectedRange.highlight.row, currentTouch.col),
              end: new WalkontableCellCoords(currentTouch.row, bottomRightCorner.col)
            };
          } else {
            newCoords = {
              start: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col),
              end: new WalkontableCellCoords(topLeftCorner.row, currentTouch.col)
            };
          }
          break;
        case "SE-NW":
          if (draggedHandle == "bottomRight") {
            newCoords = {
              start: new WalkontableCellCoords(currentTouch.row, topRightCorner.col),
              end: new WalkontableCellCoords(topLeftCorner.row, currentTouch.col)
            };
          } else if (draggedHandle == "topLeft") {
            newCoords = {
              start: bottomLeftCorner,
              end: currentTouch
            };
          }
          break;
      }
      break;
    case "SE-NW":
      switch (currentDirection) {
        case "NW-SE":
        case "NE-SW":
        case "SW-NE":
          if (draggedHandle == "topLeft") {
            newCoords.end = currentTouch;
          }
          break;
        case "SE-NW":
          if (draggedHandle == "topLeft") {
            newCoords.end = currentTouch;
          } else {
            newCoords = {
              start: currentTouch,
              end: topLeftCorner
            };
          }
          break;
      }
      break;
  }
  return newCoords;
};
MultipleSelectionHandles.prototype.bindTouchEvents = function() {
  var that = this;
  var removeFromDragged = function(query) {
    if (this.dragged.length == 1) {
      this.dragged = [];
      return true;
    }
    var entryPosition = this.dragged.indexOf(query);
    if (entryPosition == -1) {
      return false;
    } else if (entryPosition === 0) {
      this.dragged = this.dragged.slice(0, 1);
    } else if (entryPosition == 1) {
      this.dragged = this.dragged.slice(-1);
    }
  };
  this.eventManager.addEventListener(this.instance.rootElement, 'touchstart', function(event) {
    if (dom.hasClass(event.target, "topLeftSelectionHandle-HitArea")) {
      that.dragged.push("topLeft");
      var selectedRange = that.instance.getSelectedRange();
      that.touchStartRange = {
        width: selectedRange.getWidth(),
        height: selectedRange.getHeight(),
        direction: selectedRange.getDirection()
      };
      event.preventDefault();
      return false;
    } else if (dom.hasClass(event.target, "bottomRightSelectionHandle-HitArea")) {
      that.dragged.push("bottomRight");
      var selectedRange = that.instance.getSelectedRange();
      that.touchStartRange = {
        width: selectedRange.getWidth(),
        height: selectedRange.getHeight(),
        direction: selectedRange.getDirection()
      };
      event.preventDefault();
      return false;
    }
  });
  this.eventManager.addEventListener(this.instance.rootElement, 'touchend', function(event) {
    if (dom.hasClass(event.target, "topLeftSelectionHandle-HitArea")) {
      removeFromDragged.call(that, "topLeft");
      that.touchStartRange = void 0;
      event.preventDefault();
      return false;
    } else if (dom.hasClass(event.target, "bottomRightSelectionHandle-HitArea")) {
      removeFromDragged.call(that, "bottomRight");
      that.touchStartRange = void 0;
      event.preventDefault();
      return false;
    }
  });
  this.eventManager.addEventListener(this.instance.rootElement, 'touchmove', function(event) {
    var scrollTop = dom.getWindowScrollTop(),
        scrollLeft = dom.getWindowScrollLeft();
    if (that.dragged.length > 0) {
      var endTarget = document.elementFromPoint(event.touches[0].screenX - scrollLeft, event.touches[0].screenY - scrollTop);
      if (!endTarget) {
        return;
      }
      if (endTarget.nodeName == "TD" || endTarget.nodeName == "TH") {
        var targetCoords = that.instance.getCoords(endTarget);
        if (targetCoords.col == -1) {
          targetCoords.col = 0;
        }
        var selectedRange = that.instance.getSelectedRange(),
            rangeWidth = selectedRange.getWidth(),
            rangeHeight = selectedRange.getHeight(),
            rangeDirection = selectedRange.getDirection();
        if (rangeWidth == 1 && rangeHeight == 1) {
          that.instance.selection.setRangeEnd(targetCoords);
        }
        var newRangeCoords = that.getCurrentRangeCoords(selectedRange, targetCoords, that.touchStartRange.direction, rangeDirection, that.dragged[0]);
        if (newRangeCoords.start != null) {
          that.instance.selection.setRangeStart(newRangeCoords.start);
        }
        that.instance.selection.setRangeEnd(newRangeCoords.end);
      }
      event.preventDefault();
    }
  });
};
MultipleSelectionHandles.prototype.isDragged = function() {
  return this.dragged.length > 0;
};
var init = function() {
  var instance = this;
  Handsontable.plugins.multipleSelectionHandles = new MultipleSelectionHandles(instance);
};
Handsontable.hooks.add('afterInit', init);


//# 
},{"./../../dom.js":34,"./../../eventManager.js":48,"./../../plugins.js":52}],71:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  ObserveChanges: {get: function() {
      return ObserveChanges;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_plugins_46_js__,
    $___46__46__47__46__46__47_3rdparty_47_json_45_patch_45_duplex_46_js__;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
var jsonPatch = ($___46__46__47__46__46__47_3rdparty_47_json_45_patch_45_duplex_46_js__ = require("./../../3rdparty/json-patch-duplex.js"), $___46__46__47__46__46__47_3rdparty_47_json_45_patch_45_duplex_46_js__ && $___46__46__47__46__46__47_3rdparty_47_json_45_patch_45_duplex_46_js__.__esModule && $___46__46__47__46__46__47_3rdparty_47_json_45_patch_45_duplex_46_js__ || {default: $___46__46__47__46__46__47_3rdparty_47_json_45_patch_45_duplex_46_js__}).default;
;
function ObserveChanges() {}
Handsontable.hooks.add('afterLoadData', init);
Handsontable.hooks.add('afterUpdateSettings', init);
Handsontable.hooks.register('afterChangesObserved');
function init() {
  var instance = this;
  var pluginEnabled = instance.getSettings().observeChanges;
  if (pluginEnabled) {
    if (instance.observer) {
      destroy.call(instance);
    }
    createObserver.call(instance);
    bindEvents.call(instance);
  } else if (!pluginEnabled) {
    destroy.call(instance);
  }
}
function createObserver() {
  var instance = this;
  instance.observeChangesActive = true;
  instance.pauseObservingChanges = function() {
    instance.observeChangesActive = false;
  };
  instance.resumeObservingChanges = function() {
    instance.observeChangesActive = true;
  };
  instance.observedData = instance.getData();
  instance.observer = jsonPatch.observe(instance.observedData, function(patches) {
    if (instance.observeChangesActive) {
      runHookForOperation.call(instance, patches);
      instance.render();
    }
    instance.runHooks('afterChangesObserved');
  });
}
function runHookForOperation(rawPatches) {
  var instance = this;
  var patches = cleanPatches(rawPatches);
  for (var i = 0,
      len = patches.length; i < len; i++) {
    var patch = patches[i];
    var parsedPath = parsePath(patch.path);
    switch (patch.op) {
      case 'add':
        if (isNaN(parsedPath.col)) {
          instance.runHooks('afterCreateRow', parsedPath.row);
        } else {
          instance.runHooks('afterCreateCol', parsedPath.col);
        }
        break;
      case 'remove':
        if (isNaN(parsedPath.col)) {
          instance.runHooks('afterRemoveRow', parsedPath.row, 1);
        } else {
          instance.runHooks('afterRemoveCol', parsedPath.col, 1);
        }
        break;
      case 'replace':
        instance.runHooks('afterChange', [parsedPath.row, parsedPath.col, null, patch.value], 'external');
        break;
    }
  }
  function cleanPatches(rawPatches) {
    var patches;
    patches = removeLengthRelatedPatches(rawPatches);
    patches = removeMultipleAddOrRemoveColPatches(patches);
    return patches;
  }
  function removeMultipleAddOrRemoveColPatches(rawPatches) {
    var newOrRemovedColumns = [];
    return rawPatches.filter(function(patch) {
      var parsedPath = parsePath(patch.path);
      if (['add', 'remove'].indexOf(patch.op) != -1 && !isNaN(parsedPath.col)) {
        if (newOrRemovedColumns.indexOf(parsedPath.col) != -1) {
          return false;
        } else {
          newOrRemovedColumns.push(parsedPath.col);
        }
      }
      return true;
    });
  }
  function removeLengthRelatedPatches(rawPatches) {
    return rawPatches.filter(function(patch) {
      return !/[/]length/ig.test(patch.path);
    });
  }
  function parsePath(path) {
    var match = path.match(/^\/(\d+)\/?(.*)?$/);
    return {
      row: parseInt(match[1], 10),
      col: /^\d*$/.test(match[2]) ? parseInt(match[2], 10) : match[2]
    };
  }
}
function destroy() {
  var instance = this;
  if (instance.observer) {
    destroyObserver.call(instance);
    unbindEvents.call(instance);
  }
}
function destroyObserver() {
  var instance = this;
  jsonPatch.unobserve(instance.observedData, instance.observer);
  delete instance.observeChangesActive;
  delete instance.pauseObservingChanges;
  delete instance.resumeObservingChanges;
}
function bindEvents() {
  var instance = this;
  instance.addHook('afterDestroy', destroy);
  instance.addHook('afterCreateRow', afterTableAlter);
  instance.addHook('afterRemoveRow', afterTableAlter);
  instance.addHook('afterCreateCol', afterTableAlter);
  instance.addHook('afterRemoveCol', afterTableAlter);
  instance.addHook('afterChange', function(changes, source) {
    if (source != 'loadData') {
      afterTableAlter.call(this);
    }
  });
}
function unbindEvents() {
  var instance = this;
  instance.removeHook('afterDestroy', destroy);
  instance.removeHook('afterCreateRow', afterTableAlter);
  instance.removeHook('afterRemoveRow', afterTableAlter);
  instance.removeHook('afterCreateCol', afterTableAlter);
  instance.removeHook('afterRemoveCol', afterTableAlter);
  instance.removeHook('afterChange', afterTableAlter);
}
function afterTableAlter() {
  var instance = this;
  instance.pauseObservingChanges();
  instance.addHookOnce('afterChangesObserved', function() {
    instance.resumeObservingChanges();
  });
}


//# 
},{"./../../3rdparty/json-patch-duplex.js":4,"./../../plugins.js":52}],72:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  HandsontablePersistentState: {get: function() {
      return HandsontablePersistentState;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_plugins_46_js__;
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
;
function Storage(prefix) {
  var savedKeys;
  var saveSavedKeys = function() {
    window.localStorage[prefix + '__' + 'persistentStateKeys'] = JSON.stringify(savedKeys);
  };
  var loadSavedKeys = function() {
    var keysJSON = window.localStorage[prefix + '__' + 'persistentStateKeys'];
    var keys = typeof keysJSON == 'string' ? JSON.parse(keysJSON) : void 0;
    savedKeys = keys ? keys : [];
  };
  var clearSavedKeys = function() {
    savedKeys = [];
    saveSavedKeys();
  };
  loadSavedKeys();
  this.saveValue = function(key, value) {
    window.localStorage[prefix + '_' + key] = JSON.stringify(value);
    if (savedKeys.indexOf(key) == -1) {
      savedKeys.push(key);
      saveSavedKeys();
    }
  };
  this.loadValue = function(key, defaultValue) {
    key = typeof key != 'undefined' ? key : defaultValue;
    var value = window.localStorage[prefix + '_' + key];
    return typeof value == "undefined" ? void 0 : JSON.parse(value);
  };
  this.reset = function(key) {
    window.localStorage.removeItem(prefix + '_' + key);
  };
  this.resetAll = function() {
    for (var index = 0; index < savedKeys.length; index++) {
      window.localStorage.removeItem(prefix + '_' + savedKeys[index]);
    }
    clearSavedKeys();
  };
}
function HandsontablePersistentState() {
  var plugin = this;
  this.init = function() {
    var instance = this,
        pluginSettings = instance.getSettings()['persistentState'];
    plugin.enabled = !!(pluginSettings);
    if (!plugin.enabled) {
      removeHooks.call(instance);
      return;
    }
    if (!instance.storage) {
      instance.storage = new Storage(instance.rootElement.id);
    }
    instance.resetState = plugin.resetValue;
    addHooks.call(instance);
  };
  this.saveValue = function(key, value) {
    var instance = this;
    instance.storage.saveValue(key, value);
  };
  this.loadValue = function(key, saveTo) {
    var instance = this;
    saveTo.value = instance.storage.loadValue(key);
  };
  this.resetValue = function(key) {
    var instance = this;
    if (typeof key != 'undefined') {
      instance.storage.reset(key);
    } else {
      instance.storage.resetAll();
    }
  };
  var hooks = {
    'persistentStateSave': plugin.saveValue,
    'persistentStateLoad': plugin.loadValue,
    'persistentStateReset': plugin.resetValue
  };
  for (var hookName in hooks) {
    if (hooks.hasOwnProperty(hookName)) {
      Handsontable.hooks.register(hookName);
    }
  }
  function addHooks() {
    var instance = this;
    for (var hookName in hooks) {
      if (hooks.hasOwnProperty(hookName)) {
        instance.addHook(hookName, hooks[hookName]);
      }
    }
  }
  function removeHooks() {
    var instance = this;
    for (var hookName in hooks) {
      if (hooks.hasOwnProperty(hookName)) {
        instance.removeHook(hookName, hooks[hookName]);
      }
    }
  }
}
var htPersistentState = new HandsontablePersistentState();
Handsontable.hooks.add('beforeInit', htPersistentState.init);
Handsontable.hooks.add('afterUpdateSettings', htPersistentState.init);


//# 
},{"./../../plugins.js":52}],73:[function(require,module,exports){
"use strict";
var $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_renderers_46_js__;
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var $__0 = ($___46__46__47__46__46__47_renderers_46_js__ = require("./../../renderers.js"), $___46__46__47__46__46__47_renderers_46_js__ && $___46__46__47__46__46__47_renderers_46_js__.__esModule && $___46__46__47__46__46__47_renderers_46_js__ || {default: $___46__46__47__46__46__47_renderers_46_js__}),
    registerRenderer = $__0.registerRenderer,
    getRenderer = $__0.getRenderer;
Handsontable.Search = function Search(instance) {
  this.query = function(queryStr, callback, queryMethod) {
    var rowCount = instance.countRows();
    var colCount = instance.countCols();
    var queryResult = [];
    if (!callback) {
      callback = Handsontable.Search.global.getDefaultCallback();
    }
    if (!queryMethod) {
      queryMethod = Handsontable.Search.global.getDefaultQueryMethod();
    }
    for (var rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      for (var colIndex = 0; colIndex < colCount; colIndex++) {
        var cellData = instance.getDataAtCell(rowIndex, colIndex);
        var cellProperties = instance.getCellMeta(rowIndex, colIndex);
        var cellCallback = cellProperties.search.callback || callback;
        var cellQueryMethod = cellProperties.search.queryMethod || queryMethod;
        var testResult = cellQueryMethod(queryStr, cellData);
        if (testResult) {
          var singleResult = {
            row: rowIndex,
            col: colIndex,
            data: cellData
          };
          queryResult.push(singleResult);
        }
        if (cellCallback) {
          cellCallback(instance, rowIndex, colIndex, cellData, testResult);
        }
      }
    }
    return queryResult;
  };
};
Handsontable.Search.DEFAULT_CALLBACK = function(instance, row, col, data, testResult) {
  instance.getCellMeta(row, col).isSearchResult = testResult;
};
Handsontable.Search.DEFAULT_QUERY_METHOD = function(query, value) {
  if (typeof query == 'undefined' || query == null || !query.toLowerCase || query.length === 0) {
    return false;
  }
  if (typeof value == 'undefined' || value == null) {
    return false;
  }
  return value.toString().toLowerCase().indexOf(query.toLowerCase()) != -1;
};
Handsontable.Search.DEFAULT_SEARCH_RESULT_CLASS = 'htSearchResult';
Handsontable.Search.global = (function() {
  var defaultCallback = Handsontable.Search.DEFAULT_CALLBACK;
  var defaultQueryMethod = Handsontable.Search.DEFAULT_QUERY_METHOD;
  var defaultSearchResultClass = Handsontable.Search.DEFAULT_SEARCH_RESULT_CLASS;
  return {
    getDefaultCallback: function() {
      return defaultCallback;
    },
    setDefaultCallback: function(newDefaultCallback) {
      defaultCallback = newDefaultCallback;
    },
    getDefaultQueryMethod: function() {
      return defaultQueryMethod;
    },
    setDefaultQueryMethod: function(newDefaultQueryMethod) {
      defaultQueryMethod = newDefaultQueryMethod;
    },
    getDefaultSearchResultClass: function() {
      return defaultSearchResultClass;
    },
    setDefaultSearchResultClass: function(newSearchResultClass) {
      defaultSearchResultClass = newSearchResultClass;
    }
  };
})();
Handsontable.SearchCellDecorator = function(instance, TD, row, col, prop, value, cellProperties) {
  var searchResultClass = (cellProperties.search !== null && typeof cellProperties.search == 'object' && cellProperties.search.searchResultClass) || Handsontable.Search.global.getDefaultSearchResultClass();
  if (cellProperties.isSearchResult) {
    dom.addClass(TD, searchResultClass);
  } else {
    dom.removeClass(TD, searchResultClass);
  }
};
var originalBaseRenderer = getRenderer('base');
registerRenderer('base', function(instance, TD, row, col, prop, value, cellProperties) {
  originalBaseRenderer.apply(this, arguments);
  Handsontable.SearchCellDecorator.apply(this, arguments);
});
function init() {
  var instance = this;
  var pluginEnabled = !!instance.getSettings().search;
  if (pluginEnabled) {
    instance.search = new Handsontable.Search(instance);
  } else {
    delete instance.search;
  }
}
Handsontable.hooks.add('afterInit', init);
Handsontable.hooks.add('afterUpdateSettings', init);


//# 
},{"./../../dom.js":34,"./../../renderers.js":76}],74:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  TouchScroll: {get: function() {
      return TouchScroll;
    }},
  __esModule: {value: true}
});
var $___46__46__47__46__46__47_dom_46_js__,
    $___46__46__47__46__46__47_plugins_46_js__;
var dom = ($___46__46__47__46__46__47_dom_46_js__ = require("./../../dom.js"), $___46__46__47__46__46__47_dom_46_js__ && $___46__46__47__46__46__47_dom_46_js__.__esModule && $___46__46__47__46__46__47_dom_46_js__ || {default: $___46__46__47__46__46__47_dom_46_js__});
var registerPlugin = ($___46__46__47__46__46__47_plugins_46_js__ = require("./../../plugins.js"), $___46__46__47__46__46__47_plugins_46_js__ && $___46__46__47__46__46__47_plugins_46_js__.__esModule && $___46__46__47__46__46__47_plugins_46_js__ || {default: $___46__46__47__46__46__47_plugins_46_js__}).registerPlugin;
;
function TouchScroll() {}
TouchScroll.prototype.init = function(instance) {
  this.instance = instance;
  this.bindEvents();
  this.scrollbars = [this.instance.view.wt.wtOverlays.topOverlay, this.instance.view.wt.wtOverlays.leftOverlay, this.instance.view.wt.wtOverlays.topLeftCornerOverlay];
  this.clones = [this.instance.view.wt.wtOverlays.topOverlay.clone.wtTable.holder.parentNode, this.instance.view.wt.wtOverlays.leftOverlay.clone.wtTable.holder.parentNode, this.instance.view.wt.wtOverlays.topLeftCornerOverlay.clone.wtTable.holder.parentNode];
};
TouchScroll.prototype.bindEvents = function() {
  var that = this;
  this.instance.addHook('beforeTouchScroll', function() {
    Handsontable.freezeOverlays = true;
    for (var i = 0,
        cloneCount = that.clones.length; i < cloneCount; i++) {
      dom.addClass(that.clones[i], 'hide-tween');
    }
  });
  this.instance.addHook('afterMomentumScroll', function() {
    Handsontable.freezeOverlays = false;
    for (var i = 0,
        cloneCount = that.clones.length; i < cloneCount; i++) {
      dom.removeClass(that.clones[i], 'hide-tween');
    }
    for (var i = 0,
        cloneCount = that.clones.length; i < cloneCount; i++) {
      dom.addClass(that.clones[i], 'show-tween');
    }
    setTimeout(function() {
      for (var i = 0,
          cloneCount = that.clones.length; i < cloneCount; i++) {
        dom.removeClass(that.clones[i], 'show-tween');
      }
    }, 400);
    for (var i = 0,
        cloneCount = that.scrollbars.length; i < cloneCount; i++) {
      that.scrollbars[i].refresh();
      that.scrollbars[i].resetFixedPosition();
    }
  });
};
var touchScrollHandler = new TouchScroll();
Handsontable.hooks.add('afterInit', function() {
  touchScrollHandler.init.call(touchScrollHandler, this);
});


//# 
},{"./../../dom.js":34,"./../../plugins.js":52}],75:[function(require,module,exports){
"use strict";
var $___46__46__47__46__46__47_helpers_46_js__;
var helper = ($___46__46__47__46__46__47_helpers_46_js__ = require("./../../helpers.js"), $___46__46__47__46__46__47_helpers_46_js__ && $___46__46__47__46__46__47_helpers_46_js__.__esModule && $___46__46__47__46__46__47_helpers_46_js__ || {default: $___46__46__47__46__46__47_helpers_46_js__});
Handsontable.UndoRedo = function(instance) {
  var plugin = this;
  this.instance = instance;
  this.doneActions = [];
  this.undoneActions = [];
  this.ignoreNewActions = false;
  instance.addHook("afterChange", function(changes, origin) {
    if (changes) {
      var action = new Handsontable.UndoRedo.ChangeAction(changes);
      plugin.done(action);
    }
  });
  instance.addHook("afterCreateRow", function(index, amount, createdAutomatically) {
    if (createdAutomatically) {
      return;
    }
    var action = new Handsontable.UndoRedo.CreateRowAction(index, amount);
    plugin.done(action);
  });
  instance.addHook("beforeRemoveRow", function(index, amount) {
    var originalData = plugin.instance.getData();
    index = (originalData.length + index) % originalData.length;
    var removedData = originalData.slice(index, index + amount);
    var action = new Handsontable.UndoRedo.RemoveRowAction(index, removedData);
    plugin.done(action);
  });
  instance.addHook("afterCreateCol", function(index, amount, createdAutomatically) {
    if (createdAutomatically) {
      return;
    }
    var action = new Handsontable.UndoRedo.CreateColumnAction(index, amount);
    plugin.done(action);
  });
  instance.addHook("beforeRemoveCol", function(index, amount) {
    var originalData = plugin.instance.getData();
    index = (plugin.instance.countCols() + index) % plugin.instance.countCols();
    var removedData = [];
    for (var i = 0,
        len = originalData.length; i < len; i++) {
      removedData[i] = originalData[i].slice(index, index + amount);
    }
    var headers;
    if (Array.isArray(instance.getSettings().colHeaders)) {
      headers = instance.getSettings().colHeaders.slice(index, index + removedData.length);
    }
    var action = new Handsontable.UndoRedo.RemoveColumnAction(index, removedData, headers);
    plugin.done(action);
  });
  instance.addHook("beforeCellAlignment", function(stateBefore, range, type, alignment) {
    var action = new Handsontable.UndoRedo.CellAlignmentAction(stateBefore, range, type, alignment);
    plugin.done(action);
  });
};
Handsontable.UndoRedo.prototype.done = function(action) {
  if (!this.ignoreNewActions) {
    this.doneActions.push(action);
    this.undoneActions.length = 0;
  }
};
Handsontable.UndoRedo.prototype.undo = function() {
  if (this.isUndoAvailable()) {
    var action = this.doneActions.pop();
    this.ignoreNewActions = true;
    var that = this;
    action.undo(this.instance, function() {
      that.ignoreNewActions = false;
      that.undoneActions.push(action);
    });
  }
};
Handsontable.UndoRedo.prototype.redo = function() {
  if (this.isRedoAvailable()) {
    var action = this.undoneActions.pop();
    this.ignoreNewActions = true;
    var that = this;
    action.redo(this.instance, function() {
      that.ignoreNewActions = false;
      that.doneActions.push(action);
    });
  }
};
Handsontable.UndoRedo.prototype.isUndoAvailable = function() {
  return this.doneActions.length > 0;
};
Handsontable.UndoRedo.prototype.isRedoAvailable = function() {
  return this.undoneActions.length > 0;
};
Handsontable.UndoRedo.prototype.clear = function() {
  this.doneActions.length = 0;
  this.undoneActions.length = 0;
};
Handsontable.UndoRedo.Action = function() {};
Handsontable.UndoRedo.Action.prototype.undo = function() {};
Handsontable.UndoRedo.Action.prototype.redo = function() {};
Handsontable.UndoRedo.ChangeAction = function(changes) {
  this.changes = changes;
};
helper.inherit(Handsontable.UndoRedo.ChangeAction, Handsontable.UndoRedo.Action);
Handsontable.UndoRedo.ChangeAction.prototype.undo = function(instance, undoneCallback) {
  var data = helper.deepClone(this.changes),
      emptyRowsAtTheEnd = instance.countEmptyRows(true),
      emptyColsAtTheEnd = instance.countEmptyCols(true);
  for (var i = 0,
      len = data.length; i < len; i++) {
    data[i].splice(3, 1);
  }
  instance.addHookOnce('afterChange', undoneCallback);
  instance.setDataAtRowProp(data, null, null, 'undo');
  for (var i = 0,
      len = data.length; i < len; i++) {
    if (instance.getSettings().minSpareRows && data[i][0] + 1 + instance.getSettings().minSpareRows === instance.countRows() && emptyRowsAtTheEnd == instance.getSettings().minSpareRows) {
      instance.alter('remove_row', parseInt(data[i][0] + 1, 10), instance.getSettings().minSpareRows);
      instance.undoRedo.doneActions.pop();
    }
    if (instance.getSettings().minSpareCols && data[i][1] + 1 + instance.getSettings().minSpareCols === instance.countCols() && emptyColsAtTheEnd == instance.getSettings().minSpareCols) {
      instance.alter('remove_col', parseInt(data[i][1] + 1, 10), instance.getSettings().minSpareCols);
      instance.undoRedo.doneActions.pop();
    }
  }
};
Handsontable.UndoRedo.ChangeAction.prototype.redo = function(instance, onFinishCallback) {
  var data = helper.deepClone(this.changes);
  for (var i = 0,
      len = data.length; i < len; i++) {
    data[i].splice(2, 1);
  }
  instance.addHookOnce('afterChange', onFinishCallback);
  instance.setDataAtRowProp(data, null, null, 'redo');
};
Handsontable.UndoRedo.CreateRowAction = function(index, amount) {
  this.index = index;
  this.amount = amount;
};
helper.inherit(Handsontable.UndoRedo.CreateRowAction, Handsontable.UndoRedo.Action);
Handsontable.UndoRedo.CreateRowAction.prototype.undo = function(instance, undoneCallback) {
  var rowCount = instance.countRows(),
      minSpareRows = instance.getSettings().minSpareRows;
  if (this.index >= rowCount && this.index - minSpareRows < rowCount) {
    this.index -= minSpareRows;
  }
  instance.addHookOnce('afterRemoveRow', undoneCallback);
  instance.alter('remove_row', this.index, this.amount);
};
Handsontable.UndoRedo.CreateRowAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterCreateRow', redoneCallback);
  instance.alter('insert_row', this.index + 1, this.amount);
};
Handsontable.UndoRedo.RemoveRowAction = function(index, data) {
  this.index = index;
  this.data = data;
};
helper.inherit(Handsontable.UndoRedo.RemoveRowAction, Handsontable.UndoRedo.Action);
Handsontable.UndoRedo.RemoveRowAction.prototype.undo = function(instance, undoneCallback) {
  var spliceArgs = [this.index, 0];
  Array.prototype.push.apply(spliceArgs, this.data);
  Array.prototype.splice.apply(instance.getData(), spliceArgs);
  instance.addHookOnce('afterRender', undoneCallback);
  instance.render();
};
Handsontable.UndoRedo.RemoveRowAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterRemoveRow', redoneCallback);
  instance.alter('remove_row', this.index, this.data.length);
};
Handsontable.UndoRedo.CreateColumnAction = function(index, amount) {
  this.index = index;
  this.amount = amount;
};
helper.inherit(Handsontable.UndoRedo.CreateColumnAction, Handsontable.UndoRedo.Action);
Handsontable.UndoRedo.CreateColumnAction.prototype.undo = function(instance, undoneCallback) {
  instance.addHookOnce('afterRemoveCol', undoneCallback);
  instance.alter('remove_col', this.index, this.amount);
};
Handsontable.UndoRedo.CreateColumnAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterCreateCol', redoneCallback);
  instance.alter('insert_col', this.index + 1, this.amount);
};
Handsontable.UndoRedo.CellAlignmentAction = function(stateBefore, range, type, alignment) {
  this.stateBefore = stateBefore;
  this.range = range;
  this.type = type;
  this.alignment = alignment;
};
Handsontable.UndoRedo.CellAlignmentAction.prototype.undo = function(instance, undoneCallback) {
  if (!instance.contextMenu) {
    return;
  }
  for (var row = this.range.from.row; row <= this.range.to.row; row++) {
    for (var col = this.range.from.col; col <= this.range.to.col; col++) {
      instance.setCellMeta(row, col, 'className', this.stateBefore[row][col] || ' htLeft');
    }
  }
  instance.addHookOnce('afterRender', undoneCallback);
  instance.render();
};
Handsontable.UndoRedo.CellAlignmentAction.prototype.redo = function(instance, undoneCallback) {
  if (!instance.contextMenu) {
    return;
  }
  for (var row = this.range.from.row; row <= this.range.to.row; row++) {
    for (var col = this.range.from.col; col <= this.range.to.col; col++) {
      instance.contextMenu.align.call(instance, this.range, this.type, this.alignment);
    }
  }
  instance.addHookOnce('afterRender', undoneCallback);
  instance.render();
};
Handsontable.UndoRedo.RemoveColumnAction = function(index, data, headers) {
  this.index = index;
  this.data = data;
  this.amount = this.data[0].length;
  this.headers = headers;
};
helper.inherit(Handsontable.UndoRedo.RemoveColumnAction, Handsontable.UndoRedo.Action);
Handsontable.UndoRedo.RemoveColumnAction.prototype.undo = function(instance, undoneCallback) {
  var row,
      spliceArgs;
  for (var i = 0,
      len = instance.getData().length; i < len; i++) {
    row = instance.getSourceDataAtRow(i);
    spliceArgs = [this.index, 0];
    Array.prototype.push.apply(spliceArgs, this.data[i]);
    Array.prototype.splice.apply(row, spliceArgs);
  }
  if (typeof this.headers != 'undefined') {
    spliceArgs = [this.index, 0];
    Array.prototype.push.apply(spliceArgs, this.headers);
    Array.prototype.splice.apply(instance.getSettings().colHeaders, spliceArgs);
  }
  instance.addHookOnce('afterRender', undoneCallback);
  instance.render();
};
Handsontable.UndoRedo.RemoveColumnAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterRemoveCol', redoneCallback);
  instance.alter('remove_col', this.index, this.amount);
};
function init() {
  var instance = this;
  var pluginEnabled = typeof instance.getSettings().undo == 'undefined' || instance.getSettings().undo;
  if (pluginEnabled) {
    if (!instance.undoRedo) {
      instance.undoRedo = new Handsontable.UndoRedo(instance);
      exposeUndoRedoMethods(instance);
      instance.addHook('beforeKeyDown', onBeforeKeyDown);
      instance.addHook('afterChange', onAfterChange);
    }
  } else {
    if (instance.undoRedo) {
      delete instance.undoRedo;
      removeExposedUndoRedoMethods(instance);
      instance.removeHook('beforeKeyDown', onBeforeKeyDown);
      instance.removeHook('afterChange', onAfterChange);
    }
  }
}
function onBeforeKeyDown(event) {
  var instance = this;
  var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;
  if (ctrlDown) {
    if (event.keyCode === 89 || (event.shiftKey && event.keyCode === 90)) {
      instance.undoRedo.redo();
      event.stopImmediatePropagation();
    } else if (event.keyCode === 90) {
      instance.undoRedo.undo();
      event.stopImmediatePropagation();
    }
  }
}
function onAfterChange(changes, source) {
  var instance = this;
  if (source == 'loadData') {
    return instance.undoRedo.clear();
  }
}
function exposeUndoRedoMethods(instance) {
  instance.undo = function() {
    return instance.undoRedo.undo();
  };
  instance.redo = function() {
    return instance.undoRedo.redo();
  };
  instance.isUndoAvailable = function() {
    return instance.undoRedo.isUndoAvailable();
  };
  instance.isRedoAvailable = function() {
    return instance.undoRedo.isRedoAvailable();
  };
  instance.clearUndo = function() {
    return instance.undoRedo.clear();
  };
}
function removeExposedUndoRedoMethods(instance) {
  delete instance.undo;
  delete instance.redo;
  delete instance.isUndoAvailable;
  delete instance.isRedoAvailable;
  delete instance.clearUndo;
}
Handsontable.hooks.add('afterInit', init);
Handsontable.hooks.add('afterUpdateSettings', init);


//# 
},{"./../../helpers.js":49}],76:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  registerRenderer: {get: function() {
      return registerRenderer;
    }},
  getRenderer: {get: function() {
      return getRenderer;
    }},
  hasRenderer: {get: function() {
      return hasRenderer;
    }},
  __esModule: {value: true}
});
var $__helpers_46_js__;
var helper = ($__helpers_46_js__ = require("./helpers.js"), $__helpers_46_js__ && $__helpers_46_js__.__esModule && $__helpers_46_js__ || {default: $__helpers_46_js__});
;
var registeredRenderers = {};
Handsontable.renderers = Handsontable.renderers || {};
Handsontable.renderers.registerRenderer = registerRenderer;
Handsontable.renderers.getRenderer = getRenderer;
function registerRenderer(rendererName, rendererFunction) {
  var registerName;
  registeredRenderers[rendererName] = rendererFunction;
  registerName = helper.toUpperCaseFirst(rendererName) + 'Renderer';
  Handsontable.renderers[registerName] = rendererFunction;
  Handsontable[registerName] = rendererFunction;
}
function getRenderer(rendererName) {
  if (typeof rendererName == 'function') {
    return rendererName;
  }
  if (typeof rendererName != 'string') {
    throw Error('Only strings and functions can be passed as "renderer" parameter');
  }
  if (!(rendererName in registeredRenderers)) {
    throw Error('No editor registered under name "' + rendererName + '"');
  }
  return registeredRenderers[rendererName];
}
function hasRenderer(rendererName) {
  return rendererName in registeredRenderers;
}


//# 
},{"./helpers.js":49}],77:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  cellDecorator: {get: function() {
      return cellDecorator;
    }},
  __esModule: {value: true}
});
var $___46__46__47_dom_46_js__,
    $___46__46__47_renderers_46_js__;
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var registerRenderer = ($___46__46__47_renderers_46_js__ = require("./../renderers.js"), $___46__46__47_renderers_46_js__ && $___46__46__47_renderers_46_js__.__esModule && $___46__46__47_renderers_46_js__ || {default: $___46__46__47_renderers_46_js__}).registerRenderer;
;
registerRenderer('base', cellDecorator);
Handsontable.renderers.cellDecorator = cellDecorator;
function cellDecorator(instance, TD, row, col, prop, value, cellProperties) {
  if (cellProperties.className) {
    if (TD.className) {
      TD.className = TD.className + " " + cellProperties.className;
    } else {
      TD.className = cellProperties.className;
    }
  }
  if (cellProperties.readOnly) {
    dom.addClass(TD, cellProperties.readOnlyCellClassName);
  }
  if (cellProperties.valid === false && cellProperties.invalidCellClassName) {
    dom.addClass(TD, cellProperties.invalidCellClassName);
  } else {
    dom.removeClass(TD, cellProperties.invalidCellClassName);
  }
  if (cellProperties.wordWrap === false && cellProperties.noWordWrapClassName) {
    dom.addClass(TD, cellProperties.noWordWrapClassName);
  }
  if (!value && cellProperties.placeholder) {
    dom.addClass(TD, cellProperties.placeholderCellClassName);
  }
}


//# 
},{"./../dom.js":34,"./../renderers.js":76}],78:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  autocompleteRenderer: {get: function() {
      return autocompleteRenderer;
    }},
  __esModule: {value: true}
});
var $___46__46__47_dom_46_js__,
    $___46__46__47_eventManager_46_js__,
    $___46__46__47_renderers_46_js__,
    $___46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__;
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var eventManagerObject = ($___46__46__47_eventManager_46_js__ = require("./../eventManager.js"), $___46__46__47_eventManager_46_js__ && $___46__46__47_eventManager_46_js__.__esModule && $___46__46__47_eventManager_46_js__ || {default: $___46__46__47_eventManager_46_js__}).eventManager;
var $__1 = ($___46__46__47_renderers_46_js__ = require("./../renderers.js"), $___46__46__47_renderers_46_js__ && $___46__46__47_renderers_46_js__.__esModule && $___46__46__47_renderers_46_js__ || {default: $___46__46__47_renderers_46_js__}),
    getRenderer = $__1.getRenderer,
    registerRenderer = $__1.registerRenderer;
var WalkontableCellCoords = ($___46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ = require("./../3rdparty/walkontable/src/cellCoords.js"), $___46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ && $___46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__.__esModule && $___46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ || {default: $___46__46__47_3rdparty_47_walkontable_47_src_47_cellCoords_46_js__}).WalkontableCellCoords;
;
var clonableWRAPPER = document.createElement('DIV');
clonableWRAPPER.className = 'htAutocompleteWrapper';
var clonableARROW = document.createElement('DIV');
clonableARROW.className = 'htAutocompleteArrow';
clonableARROW.appendChild(document.createTextNode(String.fromCharCode(9660)));
var wrapTdContentWithWrapper = function(TD, WRAPPER) {
  WRAPPER.innerHTML = TD.innerHTML;
  dom.empty(TD);
  TD.appendChild(WRAPPER);
};
registerRenderer('autocomplete', autocompleteRenderer);
function autocompleteRenderer(instance, TD, row, col, prop, value, cellProperties) {
  var WRAPPER = clonableWRAPPER.cloneNode(true);
  var ARROW = clonableARROW.cloneNode(true);
  getRenderer('text')(instance, TD, row, col, prop, value, cellProperties);
  TD.appendChild(ARROW);
  dom.addClass(TD, 'htAutocomplete');
  if (!TD.firstChild) {
    TD.appendChild(document.createTextNode(String.fromCharCode(160)));
  }
  if (!instance.acArrowListener) {
    var eventManager = eventManagerObject(instance);
    instance.acArrowListener = function(event) {
      if (dom.hasClass(event.target, 'htAutocompleteArrow')) {
        instance.view.wt.getSetting('onCellDblClick', null, new WalkontableCellCoords(row, col), TD);
      }
    };
    eventManager.addEventListener(instance.rootElement, 'mousedown', instance.acArrowListener);
    instance.addHookOnce('afterDestroy', function() {
      eventManager.clear();
    });
  }
}


//# 
},{"./../3rdparty/walkontable/src/cellCoords.js":8,"./../dom.js":34,"./../eventManager.js":48,"./../renderers.js":76}],79:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  checkboxRenderer: {get: function() {
      return checkboxRenderer;
    }},
  __esModule: {value: true}
});
var $___46__46__47_dom_46_js__,
    $___46__46__47_helpers_46_js__,
    $___46__46__47_eventManager_46_js__,
    $___46__46__47_renderers_46_js__;
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var helper = ($___46__46__47_helpers_46_js__ = require("./../helpers.js"), $___46__46__47_helpers_46_js__ && $___46__46__47_helpers_46_js__.__esModule && $___46__46__47_helpers_46_js__ || {default: $___46__46__47_helpers_46_js__});
var eventManagerObject = ($___46__46__47_eventManager_46_js__ = require("./../eventManager.js"), $___46__46__47_eventManager_46_js__ && $___46__46__47_eventManager_46_js__.__esModule && $___46__46__47_eventManager_46_js__ || {default: $___46__46__47_eventManager_46_js__}).eventManager;
var $__1 = ($___46__46__47_renderers_46_js__ = require("./../renderers.js"), $___46__46__47_renderers_46_js__ && $___46__46__47_renderers_46_js__.__esModule && $___46__46__47_renderers_46_js__ || {default: $___46__46__47_renderers_46_js__}),
    getRenderer = $__1.getRenderer,
    registerRenderer = $__1.registerRenderer;
;
registerRenderer('checkbox', checkboxRenderer);
var clonableINPUT = document.createElement('INPUT');
clonableINPUT.className = 'htCheckboxRendererInput';
clonableINPUT.type = 'checkbox';
clonableINPUT.setAttribute('autocomplete', 'off');
function checkboxRenderer(instance, TD, row, col, prop, value, cellProperties) {
  var eventManager = eventManagerObject(instance);
  if (typeof cellProperties.checkedTemplate === "undefined") {
    cellProperties.checkedTemplate = true;
  }
  if (typeof cellProperties.uncheckedTemplate === "undefined") {
    cellProperties.uncheckedTemplate = false;
  }
  dom.empty(TD);
  var INPUT = clonableINPUT.cloneNode(false);
  if (value === cellProperties.checkedTemplate || value === helper.stringify(cellProperties.checkedTemplate)) {
    INPUT.checked = true;
    TD.appendChild(INPUT);
  } else if (value === cellProperties.uncheckedTemplate || value === helper.stringify(cellProperties.uncheckedTemplate)) {
    TD.appendChild(INPUT);
  } else if (value === null) {
    INPUT.className += ' noValue';
    TD.appendChild(INPUT);
  } else {
    dom.fastInnerText(TD, '#bad value#');
  }
  if (cellProperties.readOnly) {
    eventManager.addEventListener(INPUT, 'click', function(event) {
      event.preventDefault();
    });
  } else {
    eventManager.addEventListener(INPUT, 'mousedown', function(event) {
      helper.stopPropagation(event);
    });
    eventManager.addEventListener(INPUT, 'mouseup', function(event) {
      helper.stopPropagation(event);
    });
    eventManager.addEventListener(INPUT, 'change', function() {
      if (this.checked) {
        instance.setDataAtRowProp(row, prop, cellProperties.checkedTemplate);
      } else {
        instance.setDataAtRowProp(row, prop, cellProperties.uncheckedTemplate);
      }
    });
  }
  if (!instance.CheckboxRenderer || !instance.CheckboxRenderer.beforeKeyDownHookBound) {
    instance.CheckboxRenderer = {beforeKeyDownHookBound: true};
    instance.addHook('beforeKeyDown', function(event) {
      dom.enableImmediatePropagation(event);
      if (event.keyCode == helper.keyCode.SPACE || event.keyCode == helper.keyCode.ENTER) {
        var cell,
            checkbox,
            cellProperties;
        var selRange = instance.getSelectedRange();
        var topLeft = selRange.getTopLeftCorner();
        var bottomRight = selRange.getBottomRightCorner();
        for (var row = topLeft.row; row <= bottomRight.row; row++) {
          for (var col = topLeft.col; col <= bottomRight.col; col++) {
            cell = instance.getCell(row, col);
            cellProperties = instance.getCellMeta(row, col);
            checkbox = cell.querySelectorAll('input[type=checkbox]');
            if (checkbox.length > 0 && !cellProperties.readOnly) {
              if (!event.isImmediatePropagationStopped()) {
                event.stopImmediatePropagation();
                event.preventDefault();
              }
              for (var i = 0,
                  len = checkbox.length; i < len; i++) {
                checkbox[i].checked = !checkbox[i].checked;
                eventManager.fireEvent(checkbox[i], 'change');
              }
            }
          }
        }
      }
    });
  }
}


//# 
},{"./../dom.js":34,"./../eventManager.js":48,"./../helpers.js":49,"./../renderers.js":76}],80:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  htmlRenderer: {get: function() {
      return htmlRenderer;
    }},
  __esModule: {value: true}
});
var $___46__46__47_dom_46_js__,
    $___46__46__47_renderers_46_js__;
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var $__0 = ($___46__46__47_renderers_46_js__ = require("./../renderers.js"), $___46__46__47_renderers_46_js__ && $___46__46__47_renderers_46_js__.__esModule && $___46__46__47_renderers_46_js__ || {default: $___46__46__47_renderers_46_js__}),
    getRenderer = $__0.getRenderer,
    registerRenderer = $__0.registerRenderer;
;
registerRenderer('html', htmlRenderer);
function htmlRenderer(instance, TD, row, col, prop, value, cellProperties) {
  getRenderer('base').apply(this, arguments);
  dom.fastInnerHTML(TD, value);
}


//# 
},{"./../dom.js":34,"./../renderers.js":76}],81:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  numericRenderer: {get: function() {
      return numericRenderer;
    }},
  __esModule: {value: true}
});
var $___46__46__47_dom_46_js__,
    $___46__46__47_helpers_46_js__,
    $__numeral__,
    $___46__46__47_renderers_46_js__;
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var helper = ($___46__46__47_helpers_46_js__ = require("./../helpers.js"), $___46__46__47_helpers_46_js__ && $___46__46__47_helpers_46_js__.__esModule && $___46__46__47_helpers_46_js__ || {default: $___46__46__47_helpers_46_js__});
var numeral = ($__numeral__ = require("numeral"), $__numeral__ && $__numeral__.__esModule && $__numeral__ || {default: $__numeral__}).default;
var $__1 = ($___46__46__47_renderers_46_js__ = require("./../renderers.js"), $___46__46__47_renderers_46_js__ && $___46__46__47_renderers_46_js__.__esModule && $___46__46__47_renderers_46_js__ || {default: $___46__46__47_renderers_46_js__}),
    getRenderer = $__1.getRenderer,
    registerRenderer = $__1.registerRenderer;
;
registerRenderer('numeric', numericRenderer);
function numericRenderer(instance, TD, row, col, prop, value, cellProperties) {
  if (helper.isNumeric(value)) {
    if (typeof cellProperties.language !== 'undefined') {
      numeral.language(cellProperties.language);
    }
    value = numeral(value).format(cellProperties.format || '0');
    dom.addClass(TD, 'htNumeric');
  }
  getRenderer('text')(instance, TD, row, col, prop, value, cellProperties);
}


//# 
},{"./../dom.js":34,"./../helpers.js":49,"./../renderers.js":76,"numeral":"numeral"}],82:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  passwordRenderer: {get: function() {
      return passwordRenderer;
    }},
  __esModule: {value: true}
});
var $___46__46__47_dom_46_js__,
    $___46__46__47_renderers_46_js__;
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var $__0 = ($___46__46__47_renderers_46_js__ = require("./../renderers.js"), $___46__46__47_renderers_46_js__ && $___46__46__47_renderers_46_js__.__esModule && $___46__46__47_renderers_46_js__ || {default: $___46__46__47_renderers_46_js__}),
    getRenderer = $__0.getRenderer,
    registerRenderer = $__0.registerRenderer;
;
registerRenderer('password', passwordRenderer);
function passwordRenderer(instance, TD, row, col, prop, value, cellProperties) {
  getRenderer('text').apply(this, arguments);
  value = TD.innerHTML;
  var hash;
  var hashLength = cellProperties.hashLength || value.length;
  var hashSymbol = cellProperties.hashSymbol || '*';
  for (hash = ''; hash.split(hashSymbol).length - 1 < hashLength; hash += hashSymbol) {}
  dom.fastInnerHTML(TD, hash);
}


//# 
},{"./../dom.js":34,"./../renderers.js":76}],83:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  textRenderer: {get: function() {
      return textRenderer;
    }},
  __esModule: {value: true}
});
var $___46__46__47_dom_46_js__,
    $___46__46__47_helpers_46_js__,
    $___46__46__47_renderers_46_js__;
var dom = ($___46__46__47_dom_46_js__ = require("./../dom.js"), $___46__46__47_dom_46_js__ && $___46__46__47_dom_46_js__.__esModule && $___46__46__47_dom_46_js__ || {default: $___46__46__47_dom_46_js__});
var helper = ($___46__46__47_helpers_46_js__ = require("./../helpers.js"), $___46__46__47_helpers_46_js__ && $___46__46__47_helpers_46_js__.__esModule && $___46__46__47_helpers_46_js__ || {default: $___46__46__47_helpers_46_js__});
var $__0 = ($___46__46__47_renderers_46_js__ = require("./../renderers.js"), $___46__46__47_renderers_46_js__ && $___46__46__47_renderers_46_js__.__esModule && $___46__46__47_renderers_46_js__ || {default: $___46__46__47_renderers_46_js__}),
    getRenderer = $__0.getRenderer,
    registerRenderer = $__0.registerRenderer;
;
registerRenderer('text', textRenderer);
function textRenderer(instance, TD, row, col, prop, value, cellProperties) {
  getRenderer('base').apply(this, arguments);
  if (!value && cellProperties.placeholder) {
    value = cellProperties.placeholder;
  }
  var escaped = helper.stringify(value);
  if (!instance.getSettings().trimWhitespace) {
    escaped = escaped.replace(/ /g, String.fromCharCode(160));
  }
  if (cellProperties.rendererTemplate) {
    dom.empty(TD);
    var TEMPLATE = document.createElement('TEMPLATE');
    TEMPLATE.setAttribute('bind', '{{}}');
    TEMPLATE.innerHTML = cellProperties.rendererTemplate;
    HTMLTemplateElement.decorate(TEMPLATE);
    TEMPLATE.model = instance.getSourceDataAtRow(row);
    TD.appendChild(TEMPLATE);
  } else {
    dom.fastInnerText(TD, escaped);
  }
}


//# 
},{"./../dom.js":34,"./../helpers.js":49,"./../renderers.js":76}],84:[function(require,module,exports){
"use strict";
if (!Array.prototype.filter) {
  Array.prototype.filter = function(fun, thisp) {
    "use strict";
    if (typeof this === "undefined" || this === null) {
      throw new TypeError();
    }
    if (typeof fun !== "function") {
      throw new TypeError();
    }
    thisp = thisp || this;
    if (isNodeList(thisp)) {
      thisp = convertNodeListToArray(thisp);
    }
    var len = thisp.length,
        res = [],
        i,
        val;
    for (i = 0; i < len; i += 1) {
      if (thisp.hasOwnProperty(i)) {
        val = thisp[i];
        if (fun.call(thisp, val, i, thisp)) {
          res.push(val);
        }
      }
    }
    return res;
    function isNodeList(object) {
      return /NodeList/i.test(object.item);
    }
    function convertNodeListToArray(nodeList) {
      var array = [];
      for (var i = 0,
          len = nodeList.length; i < len; i++) {
        array[i] = nodeList[i];
      }
      return array;
    }
  };
}


//# 
},{}],85:[function(require,module,exports){
"use strict";
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(elt) {
    var len = this.length >>> 0;
    var from = Number(arguments[1]) || 0;
    from = (from < 0) ? Math.ceil(from) : Math.floor(from);
    if (from < 0) {
      from += len;
    }
    for (; from < len; from++) {
      if (from in this && this[from] === elt) {
        return from;
      }
    }
    return -1;
  };
}


//# 
},{}],86:[function(require,module,exports){
"use strict";
if (!Array.isArray) {
  Array.isArray = function(obj) {
    return Object.prototype.toString.call(obj) == '[object Array]';
  };
}


//# 
},{}],87:[function(require,module,exports){
"use strict";
(function(global) {
  'use strict';
  if (global.$traceurRuntime) {
    return;
  }
  var $Object = Object;
  var $TypeError = TypeError;
  var $create = $Object.create;
  var $defineProperties = $Object.defineProperties;
  var $defineProperty = $Object.defineProperty;
  var $freeze = $Object.freeze;
  var $getOwnPropertyDescriptor = $Object.getOwnPropertyDescriptor;
  var $getOwnPropertyNames = $Object.getOwnPropertyNames;
  var $keys = $Object.keys;
  var $hasOwnProperty = $Object.prototype.hasOwnProperty;
  var $toString = $Object.prototype.toString;
  var $preventExtensions = Object.preventExtensions;
  var $seal = Object.seal;
  var $isExtensible = Object.isExtensible;
  function nonEnum(value) {
    return {
      configurable: true,
      enumerable: false,
      value: value,
      writable: true
    };
  }
  var method = nonEnum;
  var counter = 0;
  function newUniqueString() {
    return '__$' + Math.floor(Math.random() * 1e9) + '$' + ++counter + '$__';
  }
  var symbolInternalProperty = newUniqueString();
  var symbolDescriptionProperty = newUniqueString();
  var symbolDataProperty = newUniqueString();
  var symbolValues = $create(null);
  var privateNames = $create(null);
  function isPrivateName(s) {
    return privateNames[s];
  }
  function createPrivateName() {
    var s = newUniqueString();
    privateNames[s] = true;
    return s;
  }
  function isShimSymbol(symbol) {
    return typeof symbol === 'object' && symbol instanceof SymbolValue;
  }
  function typeOf(v) {
    if (isShimSymbol(v))
      return 'symbol';
    return typeof v;
  }
  function Symbol(description) {
    var value = new SymbolValue(description);
    if (!(this instanceof Symbol))
      return value;
    throw new TypeError('Symbol cannot be new\'ed');
  }
  $defineProperty(Symbol.prototype, 'constructor', nonEnum(Symbol));
  $defineProperty(Symbol.prototype, 'toString', method(function() {
    var symbolValue = this[symbolDataProperty];
    if (!getOption('symbols'))
      return symbolValue[symbolInternalProperty];
    if (!symbolValue)
      throw TypeError('Conversion from symbol to string');
    var desc = symbolValue[symbolDescriptionProperty];
    if (desc === undefined)
      desc = '';
    return 'Symbol(' + desc + ')';
  }));
  $defineProperty(Symbol.prototype, 'valueOf', method(function() {
    var symbolValue = this[symbolDataProperty];
    if (!symbolValue)
      throw TypeError('Conversion from symbol to string');
    if (!getOption('symbols'))
      return symbolValue[symbolInternalProperty];
    return symbolValue;
  }));
  function SymbolValue(description) {
    var key = newUniqueString();
    $defineProperty(this, symbolDataProperty, {value: this});
    $defineProperty(this, symbolInternalProperty, {value: key});
    $defineProperty(this, symbolDescriptionProperty, {value: description});
    freeze(this);
    symbolValues[key] = this;
  }
  $defineProperty(SymbolValue.prototype, 'constructor', nonEnum(Symbol));
  $defineProperty(SymbolValue.prototype, 'toString', {
    value: Symbol.prototype.toString,
    enumerable: false
  });
  $defineProperty(SymbolValue.prototype, 'valueOf', {
    value: Symbol.prototype.valueOf,
    enumerable: false
  });
  var hashProperty = createPrivateName();
  var hashPropertyDescriptor = {value: undefined};
  var hashObjectProperties = {
    hash: {value: undefined},
    self: {value: undefined}
  };
  var hashCounter = 0;
  function getOwnHashObject(object) {
    var hashObject = object[hashProperty];
    if (hashObject && hashObject.self === object)
      return hashObject;
    if ($isExtensible(object)) {
      hashObjectProperties.hash.value = hashCounter++;
      hashObjectProperties.self.value = object;
      hashPropertyDescriptor.value = $create(null, hashObjectProperties);
      $defineProperty(object, hashProperty, hashPropertyDescriptor);
      return hashPropertyDescriptor.value;
    }
    return undefined;
  }
  function freeze(object) {
    getOwnHashObject(object);
    return $freeze.apply(this, arguments);
  }
  function preventExtensions(object) {
    getOwnHashObject(object);
    return $preventExtensions.apply(this, arguments);
  }
  function seal(object) {
    getOwnHashObject(object);
    return $seal.apply(this, arguments);
  }
  freeze(SymbolValue.prototype);
  function isSymbolString(s) {
    return symbolValues[s] || privateNames[s];
  }
  function toProperty(name) {
    if (isShimSymbol(name))
      return name[symbolInternalProperty];
    return name;
  }
  function removeSymbolKeys(array) {
    var rv = [];
    for (var i = 0; i < array.length; i++) {
      if (!isSymbolString(array[i])) {
        rv.push(array[i]);
      }
    }
    return rv;
  }
  function getOwnPropertyNames(object) {
    return removeSymbolKeys($getOwnPropertyNames(object));
  }
  function keys(object) {
    return removeSymbolKeys($keys(object));
  }
  function getOwnPropertySymbols(object) {
    var rv = [];
    var names = $getOwnPropertyNames(object);
    for (var i = 0; i < names.length; i++) {
      var symbol = symbolValues[names[i]];
      if (symbol) {
        rv.push(symbol);
      }
    }
    return rv;
  }
  function getOwnPropertyDescriptor(object, name) {
    return $getOwnPropertyDescriptor(object, toProperty(name));
  }
  function hasOwnProperty(name) {
    return $hasOwnProperty.call(this, toProperty(name));
  }
  function getOption(name) {
    return global.traceur && global.traceur.options[name];
  }
  function defineProperty(object, name, descriptor) {
    if (isShimSymbol(name)) {
      name = name[symbolInternalProperty];
    }
    $defineProperty(object, name, descriptor);
    return object;
  }
  function polyfillObject(Object) {
    $defineProperty(Object, 'defineProperty', {value: defineProperty});
    $defineProperty(Object, 'getOwnPropertyNames', {value: getOwnPropertyNames});
    $defineProperty(Object, 'getOwnPropertyDescriptor', {value: getOwnPropertyDescriptor});
    $defineProperty(Object.prototype, 'hasOwnProperty', {value: hasOwnProperty});
    $defineProperty(Object, 'freeze', {value: freeze});
    $defineProperty(Object, 'preventExtensions', {value: preventExtensions});
    $defineProperty(Object, 'seal', {value: seal});
    $defineProperty(Object, 'keys', {value: keys});
  }
  function exportStar(object) {
    for (var i = 1; i < arguments.length; i++) {
      var names = $getOwnPropertyNames(arguments[i]);
      for (var j = 0; j < names.length; j++) {
        var name = names[j];
        if (isSymbolString(name))
          continue;
        (function(mod, name) {
          $defineProperty(object, name, {
            get: function() {
              return mod[name];
            },
            enumerable: true
          });
        })(arguments[i], names[j]);
      }
    }
    return object;
  }
  function isObject(x) {
    return x != null && (typeof x === 'object' || typeof x === 'function');
  }
  function toObject(x) {
    if (x == null)
      throw $TypeError();
    return $Object(x);
  }
  function checkObjectCoercible(argument) {
    if (argument == null) {
      throw new TypeError('Value cannot be converted to an Object');
    }
    return argument;
  }
  function polyfillSymbol(global, Symbol) {
    if (!global.Symbol) {
      global.Symbol = Symbol;
      Object.getOwnPropertySymbols = getOwnPropertySymbols;
    }
    if (!global.Symbol.iterator) {
      global.Symbol.iterator = Symbol('Symbol.iterator');
    }
  }
  function setupGlobals(global) {
    polyfillSymbol(global, Symbol);
    global.Reflect = global.Reflect || {};
    global.Reflect.global = global.Reflect.global || global;
    polyfillObject(global.Object);
  }
  setupGlobals(global);
  global.$traceurRuntime = {
    checkObjectCoercible: checkObjectCoercible,
    createPrivateName: createPrivateName,
    defineProperties: $defineProperties,
    defineProperty: $defineProperty,
    exportStar: exportStar,
    getOwnHashObject: getOwnHashObject,
    getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
    getOwnPropertyNames: $getOwnPropertyNames,
    isObject: isObject,
    isPrivateName: isPrivateName,
    isSymbolString: isSymbolString,
    keys: $keys,
    setupGlobals: setupGlobals,
    toObject: toObject,
    toProperty: toProperty,
    typeof: typeOf
  };
})(window);
(function() {
  'use strict';
  var path;
  function relativeRequire(callerPath, requiredPath) {
    path = path || typeof require !== 'undefined' && require('path');
    function isDirectory(path) {
      return path.slice(-1) === '/';
    }
    function isAbsolute(path) {
      return path[0] === '/';
    }
    function isRelative(path) {
      return path[0] === '.';
    }
    if (isDirectory(requiredPath) || isAbsolute(requiredPath))
      return;
    return isRelative(requiredPath) ? require(path.resolve(path.dirname(callerPath), requiredPath)) : require(requiredPath);
  }
  $traceurRuntime.require = relativeRequire;
})();
(function() {
  'use strict';
  function spread() {
    var rv = [],
        j = 0,
        iterResult;
    for (var i = 0; i < arguments.length; i++) {
      var valueToSpread = $traceurRuntime.checkObjectCoercible(arguments[i]);
      if (typeof valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)] !== 'function') {
        throw new TypeError('Cannot spread non-iterable object.');
      }
      var iter = valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)]();
      while (!(iterResult = iter.next()).done) {
        rv[j++] = iterResult.value;
      }
    }
    return rv;
  }
  $traceurRuntime.spread = spread;
})();
(function() {
  'use strict';
  var $Object = Object;
  var $TypeError = TypeError;
  var $create = $Object.create;
  var $defineProperties = $traceurRuntime.defineProperties;
  var $defineProperty = $traceurRuntime.defineProperty;
  var $getOwnPropertyDescriptor = $traceurRuntime.getOwnPropertyDescriptor;
  var $getOwnPropertyNames = $traceurRuntime.getOwnPropertyNames;
  var $getPrototypeOf = Object.getPrototypeOf;
  var $__0 = Object,
      getOwnPropertyNames = $__0.getOwnPropertyNames,
      getOwnPropertySymbols = $__0.getOwnPropertySymbols;
  function superDescriptor(homeObject, name) {
    var proto = $getPrototypeOf(homeObject);
    do {
      var result = $getOwnPropertyDescriptor(proto, name);
      if (result)
        return result;
      proto = $getPrototypeOf(proto);
    } while (proto);
    return undefined;
  }
  function superConstructor(ctor) {
    return ctor.__proto__;
  }
  function superCall(self, homeObject, name, args) {
    return superGet(self, homeObject, name).apply(self, args);
  }
  function superGet(self, homeObject, name) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor) {
      if (!descriptor.get)
        return descriptor.value;
      return descriptor.get.call(self);
    }
    return undefined;
  }
  function superSet(self, homeObject, name, value) {
    var descriptor = superDescriptor(homeObject, name);
    if (descriptor && descriptor.set) {
      descriptor.set.call(self, value);
      return value;
    }
    throw $TypeError(("super has no setter '" + name + "'."));
  }
  function getDescriptors(object) {
    var descriptors = {};
    var names = getOwnPropertyNames(object);
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      descriptors[name] = $getOwnPropertyDescriptor(object, name);
    }
    var symbols = getOwnPropertySymbols(object);
    for (var i = 0; i < symbols.length; i++) {
      var symbol = symbols[i];
      descriptors[$traceurRuntime.toProperty(symbol)] = $getOwnPropertyDescriptor(object, $traceurRuntime.toProperty(symbol));
    }
    return descriptors;
  }
  function createClass(ctor, object, staticObject, superClass) {
    $defineProperty(object, 'constructor', {
      value: ctor,
      configurable: true,
      enumerable: false,
      writable: true
    });
    if (arguments.length > 3) {
      if (typeof superClass === 'function')
        ctor.__proto__ = superClass;
      ctor.prototype = $create(getProtoParent(superClass), getDescriptors(object));
    } else {
      ctor.prototype = object;
    }
    $defineProperty(ctor, 'prototype', {
      configurable: false,
      writable: false
    });
    return $defineProperties(ctor, getDescriptors(staticObject));
  }
  function getProtoParent(superClass) {
    if (typeof superClass === 'function') {
      var prototype = superClass.prototype;
      if ($Object(prototype) === prototype || prototype === null)
        return superClass.prototype;
      throw new $TypeError('super prototype must be an Object or null');
    }
    if (superClass === null)
      return null;
    throw new $TypeError(("Super expression must either be null or a function, not " + typeof superClass + "."));
  }
  function defaultSuperCall(self, homeObject, args) {
    if ($getPrototypeOf(homeObject) !== null)
      superCall(self, homeObject, 'constructor', args);
  }
  $traceurRuntime.createClass = createClass;
  $traceurRuntime.defaultSuperCall = defaultSuperCall;
  $traceurRuntime.superCall = superCall;
  $traceurRuntime.superConstructor = superConstructor;
  $traceurRuntime.superGet = superGet;
  $traceurRuntime.superSet = superSet;
})();


//# 
},{"path":undefined}],88:[function(require,module,exports){
"use strict";
if (!Object.keys) {
  Object.keys = (function() {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
        dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
        dontEnumsLength = dontEnums.length;
    return function(obj) {
      if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }
      var result = [],
          prop,
          i;
      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }
      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}


//# 
},{}],89:[function(require,module,exports){
"use strict";
if (typeof WeakMap === 'undefined') {
  (function() {
    var defineProperty = Object.defineProperty;
    try {
      var properDefineProperty = true;
      defineProperty(function() {}, 'foo', {});
    } catch (e) {
      properDefineProperty = false;
    }
    var counter = +(new Date) % 1e9;
    var WeakMap = function() {
      this.name = '__st' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
      if (!properDefineProperty) {
        this._wmCache = [];
      }
    };
    if (properDefineProperty) {
      WeakMap.prototype = {
        set: function(key, value) {
          var entry = key[this.name];
          if (entry && entry[0] === key)
            entry[1] = value;
          else
            defineProperty(key, this.name, {
              value: [key, value],
              writable: true
            });
        },
        get: function(key) {
          var entry;
          return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
        },
        has: function(key) {
          this.get(key) ? true : false;
        },
        'delete': function(key) {
          this.set(key, undefined);
        }
      };
    } else {
      WeakMap.prototype = {
        set: function(key, value) {
          if (typeof key == 'undefined' || typeof value == 'undefined')
            return;
          for (var i = 0,
              len = this._wmCache.length; i < len; i++) {
            if (this._wmCache[i].key == key) {
              this._wmCache[i].value = value;
              return;
            }
          }
          this._wmCache.push({
            key: key,
            value: value
          });
        },
        get: function(key) {
          if (typeof key == 'undefined')
            return;
          for (var i = 0,
              len = this._wmCache.length; i < len; i++) {
            if (this._wmCache[i].key == key) {
              return this._wmCache[i].value;
            }
          }
          return;
        },
        has: function(key) {
          this.get(key) ? true : false;
        },
        'delete': function(key) {
          if (typeof key == 'undefined')
            return;
          for (var i = 0,
              len = this._wmCache.length; i < len; i++) {
            if (this._wmCache[i].key == key) {
              Array.prototype.slice.call(this._wmCache, i, 1);
            }
          }
        }
      };
    }
    window.WeakMap = WeakMap;
  })();
}


//# 
},{}],90:[function(require,module,exports){
"use strict";
Object.defineProperties(exports, {
  TableView: {get: function() {
      return TableView;
    }},
  __esModule: {value: true}
});
var $__dom_46_js__,
    $__helpers_46_js__,
    $__eventManager_46_js__,
    $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__,
    $__3rdparty_47_walkontable_47_src_47_selection_46_js__,
    $__3rdparty_47_walkontable_47_src_47_core_46_js__;
var dom = ($__dom_46_js__ = require("./dom.js"), $__dom_46_js__ && $__dom_46_js__.__esModule && $__dom_46_js__ || {default: $__dom_46_js__});
var helper = ($__helpers_46_js__ = require("./helpers.js"), $__helpers_46_js__ && $__helpers_46_js__.__esModule && $__helpers_46_js__ || {default: $__helpers_46_js__});
var eventManagerObject = ($__eventManager_46_js__ = require("./eventManager.js"), $__eventManager_46_js__ && $__eventManager_46_js__.__esModule && $__eventManager_46_js__ || {default: $__eventManager_46_js__}).eventManager;
var WalkontableCellCoords = ($__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ = require("./3rdparty/walkontable/src/cellCoords.js"), $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ && $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__.__esModule && $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__ || {default: $__3rdparty_47_walkontable_47_src_47_cellCoords_46_js__}).WalkontableCellCoords;
var WalkontableSelection = ($__3rdparty_47_walkontable_47_src_47_selection_46_js__ = require("./3rdparty/walkontable/src/selection.js"), $__3rdparty_47_walkontable_47_src_47_selection_46_js__ && $__3rdparty_47_walkontable_47_src_47_selection_46_js__.__esModule && $__3rdparty_47_walkontable_47_src_47_selection_46_js__ || {default: $__3rdparty_47_walkontable_47_src_47_selection_46_js__}).WalkontableSelection;
var Walkontable = ($__3rdparty_47_walkontable_47_src_47_core_46_js__ = require("./3rdparty/walkontable/src/core.js"), $__3rdparty_47_walkontable_47_src_47_core_46_js__ && $__3rdparty_47_walkontable_47_src_47_core_46_js__.__esModule && $__3rdparty_47_walkontable_47_src_47_core_46_js__ || {default: $__3rdparty_47_walkontable_47_src_47_core_46_js__}).Walkontable;
;
Handsontable.TableView = TableView;
function TableView(instance) {
  var that = this;
  this.eventManager = eventManagerObject(instance);
  this.instance = instance;
  this.settings = instance.getSettings();
  var originalStyle = instance.rootElement.getAttribute('style');
  if (originalStyle) {
    instance.rootElement.setAttribute('data-originalstyle', originalStyle);
  }
  dom.addClass(instance.rootElement, 'handsontable');
  var table = document.createElement('TABLE');
  table.className = 'htCore';
  this.THEAD = document.createElement('THEAD');
  table.appendChild(this.THEAD);
  this.TBODY = document.createElement('TBODY');
  table.appendChild(this.TBODY);
  instance.table = table;
  instance.container.insertBefore(table, instance.container.firstChild);
  this.eventManager.addEventListener(instance.rootElement, 'mousedown', function(event) {
    if (!that.isTextSelectionAllowed(event.target)) {
      clearTextSelection();
      event.preventDefault();
      window.focus();
    }
  });
  this.eventManager.addEventListener(document.documentElement, 'keyup', function(event) {
    if (instance.selection.isInProgress() && !event.shiftKey) {
      instance.selection.finish();
    }
  });
  var isMouseDown;
  this.isMouseDown = function() {
    return isMouseDown;
  };
  this.eventManager.addEventListener(document.documentElement, 'mouseup', function(event) {
    if (instance.selection.isInProgress() && event.which === 1) {
      instance.selection.finish();
    }
    isMouseDown = false;
    if (helper.isOutsideInput(document.activeElement)) {
      instance.unlisten();
    }
  });
  this.eventManager.addEventListener(document.documentElement, 'mousedown', function(event) {
    var next = event.target;
    if (isMouseDown) {
      return;
    }
    if (next !== instance.view.wt.wtTable.holder) {
      while (next !== document.documentElement) {
        if (next === null) {
          if (event.isTargetWebComponent) {
            break;
          }
          return;
        }
        if (next === instance.rootElement) {
          return;
        }
        next = next.parentNode;
      }
    } else {
      var scrollbarWidth = Handsontable.Dom.getScrollbarWidth();
      if (document.elementFromPoint(event.x + scrollbarWidth, event.y) !== instance.view.wt.wtTable.holder || document.elementFromPoint(event.x, event.y + scrollbarWidth) !== instance.view.wt.wtTable.holder) {
        return;
      }
    }
    if (that.settings.outsideClickDeselects) {
      instance.deselectCell();
    } else {
      instance.destroyEditor();
    }
  });
  this.eventManager.addEventListener(table, 'selectstart', function(event) {
    if (that.settings.fragmentSelection) {
      return;
    }
    event.preventDefault();
  });
  var clearTextSelection = function() {
    if (window.getSelection) {
      if (window.getSelection().empty) {
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {
      document.selection.empty();
    }
  };
  var selections = [new WalkontableSelection({
    className: 'current',
    border: {
      width: 2,
      color: '#5292F7',
      cornerVisible: function() {
        return that.settings.fillHandle && !that.isCellEdited() && !instance.selection.isMultiple();
      },
      multipleSelectionHandlesVisible: function() {
        return !that.isCellEdited() && !instance.selection.isMultiple();
      }
    }
  }), new WalkontableSelection({
    className: 'area',
    border: {
      width: 1,
      color: '#89AFF9',
      cornerVisible: function() {
        return that.settings.fillHandle && !that.isCellEdited() && instance.selection.isMultiple();
      },
      multipleSelectionHandlesVisible: function() {
        return !that.isCellEdited() && instance.selection.isMultiple();
      }
    }
  }), new WalkontableSelection({
    className: 'highlight',
    highlightRowClassName: that.settings.currentRowClassName,
    highlightColumnClassName: that.settings.currentColClassName
  }), new WalkontableSelection({
    className: 'fill',
    border: {
      width: 1,
      color: 'red'
    }
  })];
  selections.current = selections[0];
  selections.area = selections[1];
  selections.highlight = selections[2];
  selections.fill = selections[3];
  var walkontableConfig = {
    debug: function() {
      return that.settings.debug;
    },
    table: table,
    stretchH: this.settings.stretchH,
    data: instance.getDataAtCell,
    totalRows: instance.countRows,
    totalColumns: instance.countCols,
    fixedColumnsLeft: function() {
      return that.settings.fixedColumnsLeft;
    },
    fixedRowsTop: function() {
      return that.settings.fixedRowsTop;
    },
    renderAllRows: that.settings.renderAllRows,
    rowHeaders: function() {
      var arr = [];
      if (instance.hasRowHeaders()) {
        arr.push(function(index, TH) {
          that.appendRowHeader(index, TH);
        });
      }
      Handsontable.hooks.run(instance, 'afterGetRowHeaderRenderers', arr);
      return arr;
    },
    columnHeaders: function() {
      var arr = [];
      if (instance.hasColHeaders()) {
        arr.push(function(index, TH) {
          that.appendColHeader(index, TH);
        });
      }
      Handsontable.hooks.run(instance, 'afterGetColumnHeaderRenderers', arr);
      return arr;
    },
    columnWidth: instance.getColWidth,
    rowHeight: instance.getRowHeight,
    cellRenderer: function(row, col, TD) {
      var prop = that.instance.colToProp(col),
          cellProperties = that.instance.getCellMeta(row, col),
          renderer = that.instance.getCellRenderer(cellProperties);
      var value = that.instance.getDataAtRowProp(row, prop);
      renderer(that.instance, TD, row, col, prop, value, cellProperties);
      Handsontable.hooks.run(that.instance, 'afterRenderer', TD, row, col, prop, value, cellProperties);
    },
    selections: selections,
    hideBorderOnMouseDownOver: function() {
      return that.settings.fragmentSelection;
    },
    onCellMouseDown: function(event, coords, TD, wt) {
      instance.listen();
      that.activeWt = wt;
      isMouseDown = true;
      dom.enableImmediatePropagation(event);
      Handsontable.hooks.run(instance, 'beforeOnCellMouseDown', event, coords, TD);
      if (!event.isImmediatePropagationStopped()) {
        if (event.button === 2 && instance.selection.inInSelection(coords)) {} else if (event.shiftKey) {
          if (coords.row >= 0 && coords.col >= 0) {
            instance.selection.setRangeEnd(coords);
          }
        } else {
          if ((coords.row < 0 || coords.col < 0) && (coords.row >= 0 || coords.col >= 0)) {
            if (coords.row < 0) {
              instance.selectCell(0, coords.col, instance.countRows() - 1, coords.col);
              instance.selection.setSelectedHeaders(false, true);
            }
            if (coords.col < 0) {
              instance.selectCell(coords.row, 0, coords.row, instance.countCols() - 1);
              instance.selection.setSelectedHeaders(true, false);
            }
          } else {
            coords.row = coords.row < 0 ? 0 : coords.row;
            coords.col = coords.col < 0 ? 0 : coords.col;
            instance.selection.setRangeStart(coords);
          }
        }
        Handsontable.hooks.run(instance, 'afterOnCellMouseDown', event, coords, TD);
        that.activeWt = that.wt;
      }
    },
    onCellMouseOver: function(event, coords, TD, wt) {
      that.activeWt = wt;
      if (coords.row >= 0 && coords.col >= 0) {
        if (isMouseDown) {
          instance.selection.setRangeEnd(coords);
        }
      } else {
        if (isMouseDown) {
          if (coords.row < 0) {
            instance.selection.setRangeEnd(new WalkontableCellCoords(instance.countRows() - 1, coords.col));
            instance.selection.setSelectedHeaders(false, true);
          }
          if (coords.col < 0) {
            instance.selection.setRangeEnd(new WalkontableCellCoords(coords.row, instance.countCols() - 1));
            instance.selection.setSelectedHeaders(true, false);
          }
        }
      }
      Handsontable.hooks.run(instance, 'afterOnCellMouseOver', event, coords, TD);
      that.activeWt = that.wt;
    },
    onCellCornerMouseDown: function(event) {
      event.preventDefault();
      Handsontable.hooks.run(instance, 'afterOnCellCornerMouseDown', event);
    },
    beforeDraw: function(force) {
      that.beforeRender(force);
    },
    onDraw: function(force) {
      that.onDraw(force);
    },
    onScrollVertically: function() {
      instance.runHooks('afterScrollVertically');
    },
    onScrollHorizontally: function() {
      instance.runHooks('afterScrollHorizontally');
    },
    onBeforeDrawBorders: function(corners, borderClassName) {
      instance.runHooks('beforeDrawBorders', corners, borderClassName);
    },
    onBeforeTouchScroll: function() {
      instance.runHooks('beforeTouchScroll');
    },
    onAfterMomentumScroll: function() {
      instance.runHooks('afterMomentumScroll');
    },
    viewportRowCalculatorOverride: function(calc) {
      if (that.settings.viewportRowRenderingOffset) {
        calc.startRow = Math.max(calc.startRow - that.settings.viewportRowRenderingOffset, 0);
        calc.endRow = Math.min(calc.endRow + that.settings.viewportRowRenderingOffset, instance.countRows() - 1);
      }
      instance.runHooks('afterViewportRowCalculatorOverride', calc);
    },
    viewportColumnCalculatorOverride: function(calc) {
      if (that.settings.viewportColumnRenderingOffset) {
        calc.startColumn = Math.max(calc.startColumn - that.settings.viewportColumnRenderingOffset, 0);
        calc.endColumn = Math.min(calc.endColumn + that.settings.viewportColumnRenderingOffset, instance.countCols() - 1);
      }
      instance.runHooks('afterViewportColumnCalculatorOverride', calc);
    }
  };
  Handsontable.hooks.run(instance, 'beforeInitWalkontable', walkontableConfig);
  this.wt = new Walkontable(walkontableConfig);
  this.activeWt = this.wt;
  this.eventManager.addEventListener(that.wt.wtTable.spreader, 'mousedown', function(event) {
    if (event.target === that.wt.wtTable.spreader && event.which === 3) {
      helper.stopPropagation(event);
    }
  });
  this.eventManager.addEventListener(that.wt.wtTable.spreader, 'contextmenu', function(event) {
    if (event.target === that.wt.wtTable.spreader && event.which === 3) {
      helper.stopPropagation(event);
    }
  });
  this.eventManager.addEventListener(document.documentElement, 'click', function() {
    if (that.settings.observeDOMVisibility) {
      if (that.wt.drawInterrupted) {
        that.instance.forceFullRender = true;
        that.render();
      }
    }
  });
}
TableView.prototype.isTextSelectionAllowed = function(el) {
  if (helper.isInput(el)) {
    return true;
  }
  if (this.settings.fragmentSelection && dom.isChildOf(el, this.TBODY)) {
    return true;
  }
  return false;
};
TableView.prototype.isCellEdited = function() {
  var activeEditor = this.instance.getActiveEditor();
  return activeEditor && activeEditor.isOpened();
};
TableView.prototype.beforeRender = function(force) {
  if (force) {
    Handsontable.hooks.run(this.instance, 'beforeRender', this.instance.forceFullRender);
  }
};
TableView.prototype.onDraw = function(force) {
  if (force) {
    Handsontable.hooks.run(this.instance, 'afterRender', this.instance.forceFullRender);
  }
};
TableView.prototype.render = function() {
  this.wt.draw(!this.instance.forceFullRender);
  this.instance.forceFullRender = false;
};
TableView.prototype.getCellAtCoords = function(coords, topmost) {
  var td = this.wt.getCell(coords, topmost);
  if (td < 0) {
    return null;
  } else {
    return td;
  }
};
TableView.prototype.scrollViewport = function(coords) {
  this.wt.scrollViewport(coords);
};
TableView.prototype.appendRowHeader = function(row, TH) {
  var DIV = document.createElement('DIV'),
      SPAN = document.createElement('SPAN');
  DIV.className = 'relative';
  SPAN.className = 'rowHeader';
  if (row > -1) {
    dom.fastInnerHTML(SPAN, this.instance.getRowHeader(row));
  } else {
    dom.fastInnerText(SPAN, String.fromCharCode(160));
  }
  DIV.appendChild(SPAN);
  dom.empty(TH);
  TH.appendChild(DIV);
  Handsontable.hooks.run(this.instance, 'afterGetRowHeader', row, TH);
};
TableView.prototype.appendColHeader = function(col, TH) {
  var DIV = document.createElement('DIV'),
      SPAN = document.createElement('SPAN');
  DIV.className = 'relative';
  SPAN.className = 'colHeader';
  if (col > -1) {
    dom.fastInnerHTML(SPAN, this.instance.getColHeader(col));
  } else {
    dom.fastInnerText(SPAN, String.fromCharCode(160));
    dom.addClass(SPAN, 'cornerHeader');
  }
  DIV.appendChild(SPAN);
  dom.empty(TH);
  TH.appendChild(DIV);
  Handsontable.hooks.run(this.instance, 'afterGetColHeader', col, TH);
};
TableView.prototype.maximumVisibleElementWidth = function(leftOffset) {
  var workspaceWidth = this.wt.wtViewport.getWorkspaceWidth();
  var maxWidth = workspaceWidth - leftOffset;
  return maxWidth > 0 ? maxWidth : 0;
};
TableView.prototype.maximumVisibleElementHeight = function(topOffset) {
  var workspaceHeight = this.wt.wtViewport.getWorkspaceHeight();
  var maxHeight = workspaceHeight - topOffset;
  return maxHeight > 0 ? maxHeight : 0;
};
TableView.prototype.mainViewIsActive = function() {
  return this.wt === this.activeWt;
};
TableView.prototype.destroy = function() {
  this.wt.destroy();
  this.eventManager.clear();
};


//# 
},{"./3rdparty/walkontable/src/cellCoords.js":8,"./3rdparty/walkontable/src/core.js":12,"./3rdparty/walkontable/src/selection.js":20,"./dom.js":34,"./eventManager.js":48,"./helpers.js":49}],91:[function(require,module,exports){
"use strict";
var process = function(value, callback) {
  var originalVal = value;
  var lowercaseVal = typeof originalVal === 'string' ? originalVal.toLowerCase() : null;
  return function(source) {
    var found = false;
    for (var s = 0,
        slen = source.length; s < slen; s++) {
      if (originalVal === source[s]) {
        found = true;
        break;
      } else if (lowercaseVal === source[s].toLowerCase()) {
        found = true;
        break;
      }
    }
    callback(found);
  };
};
Handsontable.AutocompleteValidator = function(value, callback) {
  if (this.strict && this.source) {
    if (typeof this.source === 'function') {
      this.source(value, process(value, callback));
    } else {
      process(value, callback)(this.source);
    }
  } else {
    callback(true);
  }
};


//# 
},{}],92:[function(require,module,exports){
"use strict";
var $__moment__;
var moment = ($__moment__ = require("moment"), $__moment__ && $__moment__.__esModule && $__moment__ || {default: $__moment__}).default;
Handsontable.DateValidator = function(value, callback) {
  var correctedValue = null,
      valid = true,
      dateEditor = Handsontable.editors.getEditor('date', this.instance);
  if (value === null) {
    value = '';
  }
  var isValidDate = moment(new Date(value)).isValid(),
      isValidFormat = moment(value, this.dateFormat || dateEditor.defaultDateFormat, true).isValid();
  if (!isValidDate) {
    valid = false;
  }
  if (!isValidDate && isValidFormat) {
    valid = true;
  }
  if (isValidDate && !isValidFormat) {
    if (this.correctFormat === true) {
      correctedValue = correctFormat(value, this.dateFormat);
      this.instance.setDataAtCell(this.row, this.col, correctedValue, 'dateValidator');
      valid = true;
    } else {
      valid = false;
    }
  }
  callback(valid);
};
var correctFormat = function(value, dateFormat) {
  value = moment(new Date(value)).format(dateFormat);
  return value;
};


//# 
},{"moment":"moment"}],93:[function(require,module,exports){
"use strict";
Handsontable.NumericValidator = function(value, callback) {
  if (value === null) {
    value = '';
  }
  callback(/^-?\d*(\.|\,)?\d*$/.test(value));
};


//# 
},{}],"moment":[function(require,module,exports){
//! moment.js
//! version : 2.10.2
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, function () { 'use strict';

    var hookCallback;

    function utils_hooks__hooks () {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback (callback) {
        hookCallback = callback;
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty           : false,
            unusedTokens    : [],
            unusedInput     : [],
            overflow        : -2,
            charsLeftOver   : 0,
            nullInput       : false,
            invalidMonth    : null,
            invalidFormat   : false,
            userInvalidated : false,
            iso             : false
        };
    }

    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return Object.prototype.toString.call(input) === '[object Date]' || input instanceof Date;
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function create_utc__createUTC (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function valid__isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0 &&
                    m._pf.bigHour === undefined;
            }
        }
        return m._isValid;
    }

    function valid__createInvalid (flags) {
        var m = create_utc__createUTC(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    }

    var momentProperties = utils_hooks__hooks.momentProperties = [];

    function copyConfig(to, from) {
        var i, prop, val;

        if (typeof from._isAMomentObject !== 'undefined') {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (typeof from._i !== 'undefined') {
            to._i = from._i;
        }
        if (typeof from._f !== 'undefined') {
            to._f = from._f;
        }
        if (typeof from._l !== 'undefined') {
            to._l = from._l;
        }
        if (typeof from._strict !== 'undefined') {
            to._strict = from._strict;
        }
        if (typeof from._tzm !== 'undefined') {
            to._tzm = from._tzm;
        }
        if (typeof from._isUTC !== 'undefined') {
            to._isUTC = from._isUTC;
        }
        if (typeof from._offset !== 'undefined') {
            to._offset = from._offset;
        }
        if (typeof from._pf !== 'undefined') {
            to._pf = from._pf;
        }
        if (typeof from._locale !== 'undefined') {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (typeof val !== 'undefined') {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(+config._d);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            utils_hooks__hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment (obj) {
        return obj instanceof Moment || (obj != null && hasOwnProp(obj, '_isAMomentObject'));
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function Locale() {
    }

    var locales = {};
    var globalLocale;

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        // TODO: Find a better way to register and load all the locales in Node
        if (!locales[name] && typeof module !== 'undefined' &&
                module && module.exports) {
            try {
                oldLocale = globalLocale._abbr;
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we
                // want to undo that for lazy loaded locales
                locale_locales__getSetGlobalLocale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function locale_locales__getSetGlobalLocale (key, values) {
        var data;
        if (key) {
            if (typeof values === 'undefined') {
                data = locale_locales__getLocale(key);
            }
            else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale (name, values) {
        if (values !== null) {
            values.abbr = name;
            if (!locales[name]) {
                locales[name] = new Locale();
            }
            locales[name].set(values);

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    // returns locale data
    function locale_locales__getLocale (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    var aliases = {};

    function addUnitAlias (unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeGetSet (unit, keepTime) {
        return function (value) {
            if (value != null) {
                get_set__set(this, unit, value);
                utils_hooks__hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get_set__get(this, unit);
            }
        };
    }

    function get_set__get (mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function get_set__set (mom, unit, value) {
        return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
    }

    // MOMENTS

    function getSet (units, value) {
        var unit;
        if (typeof units === 'object') {
            for (unit in units) {
                this.set(unit, units[unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (typeof this[units] === 'function') {
                return this[units](value);
            }
        }
        return this;
    }

    function zeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken (token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(func.apply(this, arguments), token);
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '';
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var match1         = /\d/;            //       0 - 9
    var match2         = /\d\d/;          //      00 - 99
    var match3         = /\d{3}/;         //     000 - 999
    var match4         = /\d{4}/;         //    0000 - 9999
    var match6         = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2      = /\d\d?/;         //       0 - 99
    var match1to3      = /\d{1,3}/;       //       0 - 999
    var match1to4      = /\d{1,4}/;       //       0 - 9999
    var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned  = /\d+/;           //       0 - inf
    var matchSigned    = /[+-]?\d+/;      //    -inf - inf

    var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;

    var regexes = {};

    function addRegexToken (token, regex, strictRegex) {
        regexes[token] = typeof regex === 'function' ? regex : function (isStrict) {
            return (isStrict && strictRegex) ? strictRegex : regex;
        };
    }

    function getParseRegexForToken (token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        }).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken (token, callback) {
        var i, func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (typeof callback === 'number') {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken (token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PARSING

    addRegexToken('M',    match1to2);
    addRegexToken('MM',   match1to2, match2);
    addRegexToken('MMM',  matchWord);
    addRegexToken('MMMM', matchWord);

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            config._pf.invalidMonth = input;
        }
    });

    // LOCALES

    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths (m) {
        return this._months[m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort (m) {
        return this._monthsShort[m.month()];
    }

    function localeMonthsParse (monthName, format, strict) {
        var i, mom, regex;

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
            }
            if (!strict && !this._monthsParse[i]) {
                regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                return i;
            } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth (mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth (value) {
        if (value != null) {
            setMonth(this, value);
            utils_hooks__hooks.updateOffset(this, true);
            return this;
        } else {
            return get_set__get(this, 'Month');
        }
    }

    function getDaysInMonth () {
        return daysInMonth(this.year(), this.month());
    }

    function checkOverflow (m) {
        var overflow;
        var a = m._a;

        if (a && m._pf.overflow === -2) {
            overflow =
                a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
                a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }

        return m;
    }

    function warn(msg) {
        if (utils_hooks__hooks.suppressDeprecationWarnings === false && typeof console !== 'undefined' && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;
        return extend(function () {
            if (firstTime) {
                warn(msg);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    utils_hooks__hooks.suppressDeprecationWarnings = false;

    var from_string__isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

    var isoDates = [
        ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
        ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
        ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
        ['GGGG-[W]WW', /\d{4}-W\d{2}/],
        ['YYYY-DDD', /\d{4}-\d{3}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
        ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
        ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
        ['HH:mm', /(T| )\d\d:\d\d/],
        ['HH', /(T| )\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
        var i, l,
            string = config._i,
            match = from_string__isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be 'T' or undefined
                    config._f = isoDates[i][0] + (match[6] || ' ');
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(matchOffset)) {
                config._f += 'Z';
            }
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);

        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    utils_hooks__hooks.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'https://github.com/moment/moment/issues/1407 for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    function createDate (y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function createUTCDate (y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY',   4],       0, 'year');
    addFormatToken(0, ['YYYYY',  5],       0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PARSING

    addRegexToken('Y',      matchSigned);
    addRegexToken('YY',     match1to2, match2);
    addRegexToken('YYYY',   match1to4, match4);
    addRegexToken('YYYYY',  match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYY', 'YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YY', function (input, array) {
        array[YEAR] = utils_hooks__hooks.parseTwoDigitYear(input);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    utils_hooks__hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', false);

    function getIsLeapYear () {
        return isLeapYear(this.year());
    }

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PARSING

    addRegexToken('w',  match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W',  match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = local__createLocal(mom).add(daysToDayOfWeek, 'd');
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    // LOCALES

    function localeWeek (mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    };

    function localeFirstDayOfWeek () {
        return this._week.dow;
    }

    function localeFirstDayOfYear () {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek (input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek (input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PARSING

    addRegexToken('DDD',  match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = createUTCDate(year, 0, 1).getUTCDay();
        var daysToAdd;
        var dayOfYear;

        d = d === 0 ? 7 : d;
        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year      : dayOfYear > 0 ? year      : year - 1,
            dayOfYear : dayOfYear > 0 ? dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    // MOMENTS

    function getSetDayOfYear (input) {
        var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()];
        }
        return [now.getFullYear(), now.getMonth(), now.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray (config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(local__createLocal(), 1, 4).year);
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = defaults(w.gg, config._a[YEAR], weekOfYear(local__createLocal(), dow, doy).year);
            week = defaults(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < dow) {
                    ++week;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }

    utils_hooks__hooks.ISO_8601 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === utils_hooks__hooks.ISO_8601) {
            configFromISO(config);
            return;
        }

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._pf.bigHour === true && config._a[HOUR] <= 12) {
            config._pf.bigHour = undefined;
        }
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

        configFromArray(config);
        checkOverflow(config);
    }


    function meridiemFixWrap (locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (!valid__isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i);
        config._a = [i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond];

        configFromArray(config);
    }

    function createFromConfig (config) {
        var input = config._i,
            format = config._f,
            res;

        config._locale = config._locale || locale_locales__getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return valid__createInvalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (format) {
            configFromStringAndFormat(config);
        } else {
            configFromInput(config);
        }

        res = new Moment(checkOverflow(config));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function configFromInput(config) {
        var input = config._i;
        if (input === undefined) {
            config._d = new Date();
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (typeof(input) === 'object') {
            configFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC (input, format, locale, strict, isUTC) {
        var c = {};

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return createFromConfig(c);
    }

    function local__createLocal (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
         'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
         function () {
             var other = local__createLocal.apply(null, arguments);
             return other < this ? this : other;
         }
     );

    var prototypeMax = deprecate(
        'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
        function () {
            var other = local__createLocal.apply(null, arguments);
            return other > this ? this : other;
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return local__createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    function Duration (duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = locale_locales__getLocale();

        this._bubble();
    }

    function isDuration (obj) {
        return obj instanceof Duration;
    }

    function offset (token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset();
            var sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z',  matchOffset);
    addRegexToken('ZZ', matchOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(string) {
        var matches = ((string || '').match(matchOffset) || []);
        var chunk   = matches[matches.length - 1] || [];
        var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        var minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (isMoment(input) || isDate(input) ? +input : +local__createLocal(input)) - (+res);
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(+res._d + diff);
            utils_hooks__hooks.updateOffset(res, false);
            return res;
        } else {
            return local__createLocal(input).local();
        }
        return model._isUTC ? local__createLocal(input).zone(model._offset || 0) : local__createLocal(input).local();
    }

    function getDateOffset (m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    utils_hooks__hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset (input, keepLocalTime) {
        var offset = this._offset || 0,
            localAdjust;
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(input);
            }
            if (Math.abs(input) < 16) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    add_subtract__addSubtract(this, create__createDuration(input - offset, 'm'), 1, false);
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    utils_hooks__hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone (input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC (keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal (keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset () {
        if (this._tzm) {
            this.utcOffset(this._tzm);
        } else if (typeof this._i === 'string') {
            this.utcOffset(offsetFromString(this._i));
        }
        return this;
    }

    function hasAlignedHourOffset (input) {
        if (!input) {
            input = 0;
        }
        else {
            input = local__createLocal(input).utcOffset();
        }

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime () {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted () {
        if (this._a) {
            var other = this._isUTC ? create_utc__createUTC(this._a) : local__createLocal(this._a);
            return this.isValid() && compareArrays(this._a, other.toArray()) > 0;
        }

        return false;
    }

    function isLocal () {
        return !this._isUTC;
    }

    function isUtcOffset () {
        return this._isUTC;
    }

    function isUtc () {
        return this._isUTC && this._offset === 0;
    }

    var aspNetRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    var create__isoRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/;

    function create__createDuration (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms : input._milliseconds,
                d  : input._days,
                M  : input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y  : 0,
                d  : toInt(match[DATE])        * sign,
                h  : toInt(match[HOUR])        * sign,
                m  : toInt(match[MINUTE])      * sign,
                s  : toInt(match[SECOND])      * sign,
                ms : toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = create__isoRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y : parseIso(match[2], sign),
                M : parseIso(match[3], sign),
                d : parseIso(match[4], sign),
                h : parseIso(match[5], sign),
                m : parseIso(match[6], sign),
                s : parseIso(match[7], sign),
                w : parseIso(match[8], sign)
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(local__createLocal(duration.from), local__createLocal(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    }

    create__createDuration.fn = Duration.prototype;

    function parseIso (inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = create__createDuration(val, period);
            add_subtract__addSubtract(this, dur, direction);
            return this;
        };
    }

    function add_subtract__addSubtract (mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            get_set__set(mom, 'Date', get_set__get(mom, 'Date') + days * isAdding);
        }
        if (months) {
            setMonth(mom, get_set__get(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            utils_hooks__hooks.updateOffset(mom, days || months);
        }
    }

    var add_subtract__add      = createAdder(1, 'add');
    var add_subtract__subtract = createAdder(-1, 'subtract');

    function moment_calendar__calendar (time) {
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || local__createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            diff = this.diff(sod, 'days', true),
            format = diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
        return this.format(this.localeData().calendar(format, this, local__createLocal(now)));
    }

    function clone () {
        return new Moment(this);
    }

    function isAfter (input, units) {
        var inputMs;
        units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
        if (units === 'millisecond') {
            input = isMoment(input) ? input : local__createLocal(input);
            return +this > +input;
        } else {
            inputMs = isMoment(input) ? +input : +local__createLocal(input);
            return inputMs < +this.clone().startOf(units);
        }
    }

    function isBefore (input, units) {
        var inputMs;
        units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
        if (units === 'millisecond') {
            input = isMoment(input) ? input : local__createLocal(input);
            return +this < +input;
        } else {
            inputMs = isMoment(input) ? +input : +local__createLocal(input);
            return +this.clone().endOf(units) < inputMs;
        }
    }

    function isBetween (from, to, units) {
        return this.isAfter(from, units) && this.isBefore(to, units);
    }

    function isSame (input, units) {
        var inputMs;
        units = normalizeUnits(units || 'millisecond');
        if (units === 'millisecond') {
            input = isMoment(input) ? input : local__createLocal(input);
            return +this === +input;
        } else {
            inputMs = +local__createLocal(input);
            return +(this.clone().startOf(units)) <= inputMs && inputMs <= +(this.clone().endOf(units));
        }
    }

    function absFloor (number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    function diff (input, units, asFloat) {
        var that = cloneWithOffset(input, this),
            zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4,
            delta, output;

        units = normalizeUnits(units);

        if (units === 'year' || units === 'month' || units === 'quarter') {
            output = monthDiff(this, that);
            if (units === 'quarter') {
                output = output / 3;
            } else if (units === 'year') {
                output = output / 12;
            }
        } else {
            delta = this - that;
            output = units === 'second' ? delta / 1e3 : // 1000
                units === 'minute' ? delta / 6e4 : // 1000 * 60
                units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
                units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                delta;
        }
        return asFloat ? output : absFloor(output);
    }

    function monthDiff (a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        return -(wholeMonthDiff + adjust);
    }

    utils_hooks__hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';

    function toString () {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function moment_format__toISOString () {
        var m = this.clone().utc();
        if (0 < m.year() && m.year() <= 9999) {
            if ('function' === typeof Date.prototype.toISOString) {
                // native implementation is ~50x faster, use it when we can
                return this.toDate().toISOString();
            } else {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        } else {
            return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
    }

    function format (inputString) {
        var output = formatMoment(this, inputString || utils_hooks__hooks.defaultFormat);
        return this.localeData().postformat(output);
    }

    function from (time, withoutSuffix) {
        return create__createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
    }

    function fromNow (withoutSuffix) {
        return this.from(local__createLocal(), withoutSuffix);
    }

    function locale (key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = locale_locales__getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData () {
        return this._locale;
    }

    function startOf (units) {
        units = normalizeUnits(units);
        // the following switch intentionally omits break keywords
        // to utilize falling through the cases.
        switch (units) {
        case 'year':
            this.month(0);
            /* falls through */
        case 'quarter':
        case 'month':
            this.date(1);
            /* falls through */
        case 'week':
        case 'isoWeek':
        case 'day':
            this.hours(0);
            /* falls through */
        case 'hour':
            this.minutes(0);
            /* falls through */
        case 'minute':
            this.seconds(0);
            /* falls through */
        case 'second':
            this.milliseconds(0);
        }

        // weeks are a special case
        if (units === 'week') {
            this.weekday(0);
        }
        if (units === 'isoWeek') {
            this.isoWeekday(1);
        }

        // quarters are also special
        if (units === 'quarter') {
            this.month(Math.floor(this.month() / 3) * 3);
        }

        return this;
    }

    function endOf (units) {
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond') {
            return this;
        }
        return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
    }

    function to_type__valueOf () {
        return +this._d - ((this._offset || 0) * 60000);
    }

    function unix () {
        return Math.floor(+this / 1000);
    }

    function toDate () {
        return this._offset ? new Date(+this) : this._d;
    }

    function toArray () {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function moment_valid__isValid () {
        return valid__isValid(this);
    }

    function parsingFlags () {
        return extend({}, this._pf);
    }

    function invalidAt () {
        return this._pf.overflow;
    }

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken (token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg',     'weekYear');
    addWeekYearFormatToken('ggggg',    'weekYear');
    addWeekYearFormatToken('GGGG',  'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PARSING

    addRegexToken('G',      matchSigned);
    addRegexToken('g',      matchSigned);
    addRegexToken('GG',     match1to2, match2);
    addRegexToken('gg',     match1to2, match2);
    addRegexToken('GGGG',   match1to4, match4);
    addRegexToken('gggg',   match1to4, match4);
    addRegexToken('GGGGG',  match1to6, match6);
    addRegexToken('ggggg',  match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = utils_hooks__hooks.parseTwoDigitYear(input);
    });

    // HELPERS

    function weeksInYear(year, dow, doy) {
        return weekOfYear(local__createLocal([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    // MOMENTS

    function getSetWeekYear (input) {
        var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
        return input == null ? year : this.add((input - year), 'y');
    }

    function getSetISOWeekYear (input) {
        var year = weekOfYear(this, 1, 4).year;
        return input == null ? year : this.add((input - year), 'y');
    }

    function getISOWeeksInYear () {
        return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear () {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    addFormatToken('Q', 0, 0, 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter (input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PARSING

    addRegexToken('D',  match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0], 10);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PARSING

    addRegexToken('d',    match1to2);
    addRegexToken('e',    match1to2);
    addRegexToken('E',    match1to2);
    addRegexToken('dd',   matchWord);
    addRegexToken('ddd',  matchWord);
    addRegexToken('dddd', matchWord);

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config) {
        var weekday = config._locale.weekdaysParse(input);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            config._pf.invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = locale.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    // LOCALES

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays (m) {
        return this._weekdays[m.day()];
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort (m) {
        return this._weekdaysShort[m.day()];
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin (m) {
        return this._weekdaysMin[m.day()];
    }

    function localeWeekdaysParse (weekdayName) {
        var i, mom, regex;

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            if (!this._weekdaysParse[i]) {
                mom = local__createLocal([2000, 1]).day(i);
                regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek (input) {
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek (input) {
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek (input) {
        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.
        return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, function () {
        return this.hours() % 12 || 12;
    });

    function meridiem (token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PARSING

    function matchMeridiem (isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a',  matchMeridiem);
    addRegexToken('A',  matchMeridiem);
    addRegexToken('H',  match1to2);
    addRegexToken('h',  match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        config._pf.bigHour = true;
    });

    // LOCALES

    function localeIsPM (input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PARSING

    addRegexToken('m',  match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PARSING

    addRegexToken('s',  match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    function millisecond__milliseconds (token) {
        addFormatToken(0, [token, 3], 0, 'millisecond');
    }

    millisecond__milliseconds('SSS');
    millisecond__milliseconds('SSSS');

    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PARSING

    addRegexToken('S',    match1to3, match1);
    addRegexToken('SS',   match1to3, match2);
    addRegexToken('SSS',  match1to3, match3);
    addRegexToken('SSSS', matchUnsigned);
    addParseToken(['S', 'SS', 'SSS', 'SSSS'], function (input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    });

    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    addFormatToken('z',  0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr () {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName () {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var momentPrototype__proto = Moment.prototype;

    momentPrototype__proto.add          = add_subtract__add;
    momentPrototype__proto.calendar     = moment_calendar__calendar;
    momentPrototype__proto.clone        = clone;
    momentPrototype__proto.diff         = diff;
    momentPrototype__proto.endOf        = endOf;
    momentPrototype__proto.format       = format;
    momentPrototype__proto.from         = from;
    momentPrototype__proto.fromNow      = fromNow;
    momentPrototype__proto.get          = getSet;
    momentPrototype__proto.invalidAt    = invalidAt;
    momentPrototype__proto.isAfter      = isAfter;
    momentPrototype__proto.isBefore     = isBefore;
    momentPrototype__proto.isBetween    = isBetween;
    momentPrototype__proto.isSame       = isSame;
    momentPrototype__proto.isValid      = moment_valid__isValid;
    momentPrototype__proto.lang         = lang;
    momentPrototype__proto.locale       = locale;
    momentPrototype__proto.localeData   = localeData;
    momentPrototype__proto.max          = prototypeMax;
    momentPrototype__proto.min          = prototypeMin;
    momentPrototype__proto.parsingFlags = parsingFlags;
    momentPrototype__proto.set          = getSet;
    momentPrototype__proto.startOf      = startOf;
    momentPrototype__proto.subtract     = add_subtract__subtract;
    momentPrototype__proto.toArray      = toArray;
    momentPrototype__proto.toDate       = toDate;
    momentPrototype__proto.toISOString  = moment_format__toISOString;
    momentPrototype__proto.toJSON       = moment_format__toISOString;
    momentPrototype__proto.toString     = toString;
    momentPrototype__proto.unix         = unix;
    momentPrototype__proto.valueOf      = to_type__valueOf;

    // Year
    momentPrototype__proto.year       = getSetYear;
    momentPrototype__proto.isLeapYear = getIsLeapYear;

    // Week Year
    momentPrototype__proto.weekYear    = getSetWeekYear;
    momentPrototype__proto.isoWeekYear = getSetISOWeekYear;

    // Quarter
    momentPrototype__proto.quarter = momentPrototype__proto.quarters = getSetQuarter;

    // Month
    momentPrototype__proto.month       = getSetMonth;
    momentPrototype__proto.daysInMonth = getDaysInMonth;

    // Week
    momentPrototype__proto.week           = momentPrototype__proto.weeks        = getSetWeek;
    momentPrototype__proto.isoWeek        = momentPrototype__proto.isoWeeks     = getSetISOWeek;
    momentPrototype__proto.weeksInYear    = getWeeksInYear;
    momentPrototype__proto.isoWeeksInYear = getISOWeeksInYear;

    // Day
    momentPrototype__proto.date       = getSetDayOfMonth;
    momentPrototype__proto.day        = momentPrototype__proto.days             = getSetDayOfWeek;
    momentPrototype__proto.weekday    = getSetLocaleDayOfWeek;
    momentPrototype__proto.isoWeekday = getSetISODayOfWeek;
    momentPrototype__proto.dayOfYear  = getSetDayOfYear;

    // Hour
    momentPrototype__proto.hour = momentPrototype__proto.hours = getSetHour;

    // Minute
    momentPrototype__proto.minute = momentPrototype__proto.minutes = getSetMinute;

    // Second
    momentPrototype__proto.second = momentPrototype__proto.seconds = getSetSecond;

    // Millisecond
    momentPrototype__proto.millisecond = momentPrototype__proto.milliseconds = getSetMillisecond;

    // Offset
    momentPrototype__proto.utcOffset            = getSetOffset;
    momentPrototype__proto.utc                  = setOffsetToUTC;
    momentPrototype__proto.local                = setOffsetToLocal;
    momentPrototype__proto.parseZone            = setOffsetToParsedOffset;
    momentPrototype__proto.hasAlignedHourOffset = hasAlignedHourOffset;
    momentPrototype__proto.isDST                = isDaylightSavingTime;
    momentPrototype__proto.isDSTShifted         = isDaylightSavingTimeShifted;
    momentPrototype__proto.isLocal              = isLocal;
    momentPrototype__proto.isUtcOffset          = isUtcOffset;
    momentPrototype__proto.isUtc                = isUtc;
    momentPrototype__proto.isUTC                = isUtc;

    // Timezone
    momentPrototype__proto.zoneAbbr = getZoneAbbr;
    momentPrototype__proto.zoneName = getZoneName;

    // Deprecations
    momentPrototype__proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    momentPrototype__proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    momentPrototype__proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    momentPrototype__proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. https://github.com/moment/moment/issues/1779', getSetZone);

    var momentPrototype = momentPrototype__proto;

    function moment__createUnix (input) {
        return local__createLocal(input * 1000);
    }

    function moment__createInZone () {
        return local__createLocal.apply(null, arguments).parseZone();
    }

    var defaultCalendar = {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    };

    function locale_calendar__calendar (key, mom, now) {
        var output = this._calendar[key];
        return typeof output === 'function' ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
        LTS  : 'h:mm:ss A',
        LT   : 'h:mm A',
        L    : 'MM/DD/YYYY',
        LL   : 'MMMM D, YYYY',
        LLL  : 'MMMM D, YYYY LT',
        LLLL : 'dddd, MMMM D, YYYY LT'
    };

    function longDateFormat (key) {
        var output = this._longDateFormat[key];
        if (!output && this._longDateFormat[key.toUpperCase()]) {
            output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                return val.slice(1);
            });
            this._longDateFormat[key] = output;
        }
        return output;
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate () {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultOrdinalParse = /\d{1,2}/;

    function ordinal (number) {
        return this._ordinal.replace('%d', number);
    }

    function preParsePostFormat (string) {
        return string;
    }

    var defaultRelativeTime = {
        future : 'in %s',
        past   : '%s ago',
        s  : 'a few seconds',
        m  : 'a minute',
        mm : '%d minutes',
        h  : 'an hour',
        hh : '%d hours',
        d  : 'a day',
        dd : '%d days',
        M  : 'a month',
        MM : '%d months',
        y  : 'a year',
        yy : '%d years'
    };

    function relative__relativeTime (number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (typeof output === 'function') ?
            output(number, withoutSuffix, string, isFuture) :
            output.replace(/%d/i, number);
    }

    function pastFuture (diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
    }

    function locale_set__set (config) {
        var prop, i;
        for (i in config) {
            prop = config[i];
            if (typeof prop === 'function') {
                this[i] = prop;
            } else {
                this['_' + i] = prop;
            }
        }
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _ordinalParseLenient.
        this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + /\d{1,2}/.source);
    }

    var prototype__proto = Locale.prototype;

    prototype__proto._calendar       = defaultCalendar;
    prototype__proto.calendar        = locale_calendar__calendar;
    prototype__proto._longDateFormat = defaultLongDateFormat;
    prototype__proto.longDateFormat  = longDateFormat;
    prototype__proto._invalidDate    = defaultInvalidDate;
    prototype__proto.invalidDate     = invalidDate;
    prototype__proto._ordinal        = defaultOrdinal;
    prototype__proto.ordinal         = ordinal;
    prototype__proto._ordinalParse   = defaultOrdinalParse;
    prototype__proto.preparse        = preParsePostFormat;
    prototype__proto.postformat      = preParsePostFormat;
    prototype__proto._relativeTime   = defaultRelativeTime;
    prototype__proto.relativeTime    = relative__relativeTime;
    prototype__proto.pastFuture      = pastFuture;
    prototype__proto.set             = locale_set__set;

    // Month
    prototype__proto.months       =        localeMonths;
    prototype__proto._months      = defaultLocaleMonths;
    prototype__proto.monthsShort  =        localeMonthsShort;
    prototype__proto._monthsShort = defaultLocaleMonthsShort;
    prototype__proto.monthsParse  =        localeMonthsParse;

    // Week
    prototype__proto.week = localeWeek;
    prototype__proto._week = defaultLocaleWeek;
    prototype__proto.firstDayOfYear = localeFirstDayOfYear;
    prototype__proto.firstDayOfWeek = localeFirstDayOfWeek;

    // Day of Week
    prototype__proto.weekdays       =        localeWeekdays;
    prototype__proto._weekdays      = defaultLocaleWeekdays;
    prototype__proto.weekdaysMin    =        localeWeekdaysMin;
    prototype__proto._weekdaysMin   = defaultLocaleWeekdaysMin;
    prototype__proto.weekdaysShort  =        localeWeekdaysShort;
    prototype__proto._weekdaysShort = defaultLocaleWeekdaysShort;
    prototype__proto.weekdaysParse  =        localeWeekdaysParse;

    // Hours
    prototype__proto.isPM = localeIsPM;
    prototype__proto._meridiemParse = defaultLocaleMeridiemParse;
    prototype__proto.meridiem = localeMeridiem;

    function lists__get (format, index, field, setter) {
        var locale = locale_locales__getLocale();
        var utc = create_utc__createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function list (format, index, field, count, setter) {
        if (typeof format === 'number') {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return lists__get(format, index, field, setter);
        }

        var i;
        var out = [];
        for (i = 0; i < count; i++) {
            out[i] = lists__get(format, i, field, setter);
        }
        return out;
    }

    function lists__listMonths (format, index) {
        return list(format, index, 'months', 12, 'month');
    }

    function lists__listMonthsShort (format, index) {
        return list(format, index, 'monthsShort', 12, 'month');
    }

    function lists__listWeekdays (format, index) {
        return list(format, index, 'weekdays', 7, 'day');
    }

    function lists__listWeekdaysShort (format, index) {
        return list(format, index, 'weekdaysShort', 7, 'day');
    }

    function lists__listWeekdaysMin (format, index) {
        return list(format, index, 'weekdaysMin', 7, 'day');
    }

    locale_locales__getSetGlobalLocale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // Side effect imports
    utils_hooks__hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', locale_locales__getSetGlobalLocale);
    utils_hooks__hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', locale_locales__getLocale);

    var mathAbs = Math.abs;

    function duration_abs__abs () {
        var data           = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days         = mathAbs(this._days);
        this._months       = mathAbs(this._months);

        data.milliseconds  = mathAbs(data.milliseconds);
        data.seconds       = mathAbs(data.seconds);
        data.minutes       = mathAbs(data.minutes);
        data.hours         = mathAbs(data.hours);
        data.months        = mathAbs(data.months);
        data.years         = mathAbs(data.years);

        return this;
    }

    function duration_add_subtract__addSubtract (duration, input, value, direction) {
        var other = create__createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days         += direction * other._days;
        duration._months       += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function duration_add_subtract__add (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function duration_add_subtract__subtract (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, -1);
    }

    function bubble () {
        var milliseconds = this._milliseconds;
        var days         = this._days;
        var months       = this._months;
        var data         = this._data;
        var seconds, minutes, hours, years = 0;

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds           = absFloor(milliseconds / 1000);
        data.seconds      = seconds % 60;

        minutes           = absFloor(seconds / 60);
        data.minutes      = minutes % 60;

        hours             = absFloor(minutes / 60);
        data.hours        = hours % 24;

        days += absFloor(hours / 24);

        // Accurately convert days to years, assume start from year 0.
        years = absFloor(daysToYears(days));
        days -= absFloor(yearsToDays(years));

        // 30 days to a month
        // TODO (iskren): Use anchor date (like 1st Jan) to compute this.
        months += absFloor(days / 30);
        days   %= 30;

        // 12 months -> 1 year
        years  += absFloor(months / 12);
        months %= 12;

        data.days   = days;
        data.months = months;
        data.years  = years;

        return this;
    }

    function daysToYears (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        return days * 400 / 146097;
    }

    function yearsToDays (years) {
        // years * 365 + absFloor(years / 4) -
        //     absFloor(years / 100) + absFloor(years / 400);
        return years * 146097 / 400;
    }

    function as (units) {
        var days;
        var months;
        var milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'year') {
            days   = this._days   + milliseconds / 864e5;
            months = this._months + daysToYears(days) * 12;
            return units === 'month' ? months : months / 12;
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(yearsToDays(this._months / 12));
            switch (units) {
                case 'week'   : return days / 7            + milliseconds / 6048e5;
                case 'day'    : return days                + milliseconds / 864e5;
                case 'hour'   : return days * 24           + milliseconds / 36e5;
                case 'minute' : return days * 24 * 60      + milliseconds / 6e4;
                case 'second' : return days * 24 * 60 * 60 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond': return Math.floor(days * 24 * 60 * 60 * 1000) + milliseconds;
                default: throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function duration_as__valueOf () {
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs (alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds      = makeAs('s');
    var asMinutes      = makeAs('m');
    var asHours        = makeAs('h');
    var asDays         = makeAs('d');
    var asWeeks        = makeAs('w');
    var asMonths       = makeAs('M');
    var asYears        = makeAs('y');

    function duration_get__get (units) {
        units = normalizeUnits(units);
        return this[units + 's']();
    }

    function makeGetter(name) {
        return function () {
            return this._data[name];
        };
    }

    var duration_get__milliseconds = makeGetter('milliseconds');
    var seconds      = makeGetter('seconds');
    var minutes      = makeGetter('minutes');
    var hours        = makeGetter('hours');
    var days         = makeGetter('days');
    var months       = makeGetter('months');
    var years        = makeGetter('years');

    function weeks () {
        return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
        s: 45,  // seconds to minute
        m: 45,  // minutes to hour
        h: 22,  // hours to day
        d: 26,  // days to month
        M: 11   // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function duration_humanize__relativeTime (posNegDuration, withoutSuffix, locale) {
        var duration = create__createDuration(posNegDuration).abs();
        var seconds  = round(duration.as('s'));
        var minutes  = round(duration.as('m'));
        var hours    = round(duration.as('h'));
        var days     = round(duration.as('d'));
        var months   = round(duration.as('M'));
        var years    = round(duration.as('y'));

        var a = seconds < thresholds.s && ['s', seconds]  ||
                minutes === 1          && ['m']           ||
                minutes < thresholds.m && ['mm', minutes] ||
                hours   === 1          && ['h']           ||
                hours   < thresholds.h && ['hh', hours]   ||
                days    === 1          && ['d']           ||
                days    < thresholds.d && ['dd', days]    ||
                months  === 1          && ['M']           ||
                months  < thresholds.M && ['MM', months]  ||
                years   === 1          && ['y']           || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set a threshold for relative time strings
    function duration_humanize__getSetRelativeTimeThreshold (threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        return true;
    }

    function humanize (withSuffix) {
        var locale = this.localeData();
        var output = duration_humanize__relativeTime(this, !withSuffix, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var iso_string__abs = Math.abs;

    function iso_string__toISOString() {
        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        var Y = iso_string__abs(this.years());
        var M = iso_string__abs(this.months());
        var D = iso_string__abs(this.days());
        var h = iso_string__abs(this.hours());
        var m = iso_string__abs(this.minutes());
        var s = iso_string__abs(this.seconds() + this.milliseconds() / 1000);
        var total = this.asSeconds();

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        return (total < 0 ? '-' : '') +
            'P' +
            (Y ? Y + 'Y' : '') +
            (M ? M + 'M' : '') +
            (D ? D + 'D' : '') +
            ((h || m || s) ? 'T' : '') +
            (h ? h + 'H' : '') +
            (m ? m + 'M' : '') +
            (s ? s + 'S' : '');
    }

    var duration_prototype__proto = Duration.prototype;

    duration_prototype__proto.abs            = duration_abs__abs;
    duration_prototype__proto.add            = duration_add_subtract__add;
    duration_prototype__proto.subtract       = duration_add_subtract__subtract;
    duration_prototype__proto.as             = as;
    duration_prototype__proto.asMilliseconds = asMilliseconds;
    duration_prototype__proto.asSeconds      = asSeconds;
    duration_prototype__proto.asMinutes      = asMinutes;
    duration_prototype__proto.asHours        = asHours;
    duration_prototype__proto.asDays         = asDays;
    duration_prototype__proto.asWeeks        = asWeeks;
    duration_prototype__proto.asMonths       = asMonths;
    duration_prototype__proto.asYears        = asYears;
    duration_prototype__proto.valueOf        = duration_as__valueOf;
    duration_prototype__proto._bubble        = bubble;
    duration_prototype__proto.get            = duration_get__get;
    duration_prototype__proto.milliseconds   = duration_get__milliseconds;
    duration_prototype__proto.seconds        = seconds;
    duration_prototype__proto.minutes        = minutes;
    duration_prototype__proto.hours          = hours;
    duration_prototype__proto.days           = days;
    duration_prototype__proto.weeks          = weeks;
    duration_prototype__proto.months         = months;
    duration_prototype__proto.years          = years;
    duration_prototype__proto.humanize       = humanize;
    duration_prototype__proto.toISOString    = iso_string__toISOString;
    duration_prototype__proto.toString       = iso_string__toISOString;
    duration_prototype__proto.toJSON         = iso_string__toISOString;
    duration_prototype__proto.locale         = locale;
    duration_prototype__proto.localeData     = localeData;

    // Deprecations
    duration_prototype__proto.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', iso_string__toISOString);
    duration_prototype__proto.lang = lang;

    // Side effect imports

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    // Side effect imports


    utils_hooks__hooks.version = '2.10.2';

    setHookCallback(local__createLocal);

    utils_hooks__hooks.fn                    = momentPrototype;
    utils_hooks__hooks.min                   = min;
    utils_hooks__hooks.max                   = max;
    utils_hooks__hooks.utc                   = create_utc__createUTC;
    utils_hooks__hooks.unix                  = moment__createUnix;
    utils_hooks__hooks.months                = lists__listMonths;
    utils_hooks__hooks.isDate                = isDate;
    utils_hooks__hooks.locale                = locale_locales__getSetGlobalLocale;
    utils_hooks__hooks.invalid               = valid__createInvalid;
    utils_hooks__hooks.duration              = create__createDuration;
    utils_hooks__hooks.isMoment              = isMoment;
    utils_hooks__hooks.weekdays              = lists__listWeekdays;
    utils_hooks__hooks.parseZone             = moment__createInZone;
    utils_hooks__hooks.localeData            = locale_locales__getLocale;
    utils_hooks__hooks.isDuration            = isDuration;
    utils_hooks__hooks.monthsShort           = lists__listMonthsShort;
    utils_hooks__hooks.weekdaysMin           = lists__listWeekdaysMin;
    utils_hooks__hooks.defineLocale          = defineLocale;
    utils_hooks__hooks.weekdaysShort         = lists__listWeekdaysShort;
    utils_hooks__hooks.normalizeUnits        = normalizeUnits;
    utils_hooks__hooks.relativeTimeThreshold = duration_humanize__getSetRelativeTimeThreshold;

    var _moment = utils_hooks__hooks;

    return _moment;

}));
},{}],"numeral":[function(require,module,exports){
"use strict";
(function() {
  var numeral,
      VERSION = '1.5.3',
      languages = {},
      currentLanguage = 'en',
      zeroFormat = null,
      defaultFormat = '0,0',
      hasModule = (typeof module !== 'undefined' && module.exports);
  function Numeral(number) {
    this._value = number;
  }
  function toFixed(value, precision, roundingFunction, optionals) {
    var power = Math.pow(10, precision),
        optionalsRegExp,
        output;
    output = (roundingFunction(value * power) / power).toFixed(precision);
    if (optionals) {
      optionalsRegExp = new RegExp('0{1,' + optionals + '}$');
      output = output.replace(optionalsRegExp, '');
    }
    return output;
  }
  function formatNumeral(n, format, roundingFunction) {
    var output;
    if (format.indexOf('$') > -1) {
      output = formatCurrency(n, format, roundingFunction);
    } else if (format.indexOf('%') > -1) {
      output = formatPercentage(n, format, roundingFunction);
    } else if (format.indexOf(':') > -1) {
      output = formatTime(n, format);
    } else {
      output = formatNumber(n._value, format, roundingFunction);
    }
    return output;
  }
  function unformatNumeral(n, string) {
    var stringOriginal = string,
        thousandRegExp,
        millionRegExp,
        billionRegExp,
        trillionRegExp,
        suffixes = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        bytesMultiplier = false,
        power;
    if (string.indexOf(':') > -1) {
      n._value = unformatTime(string);
    } else {
      if (string === zeroFormat) {
        n._value = 0;
      } else {
        if (languages[currentLanguage].delimiters.decimal !== '.') {
          string = string.replace(/\./g, '').replace(languages[currentLanguage].delimiters.decimal, '.');
        }
        thousandRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.thousand + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
        millionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.million + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
        billionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.billion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
        trillionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.trillion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');
        for (power = 0; power <= suffixes.length; power++) {
          bytesMultiplier = (string.indexOf(suffixes[power]) > -1) ? Math.pow(1024, power + 1) : false;
          if (bytesMultiplier) {
            break;
          }
        }
        n._value = ((bytesMultiplier) ? bytesMultiplier : 1) * ((stringOriginal.match(thousandRegExp)) ? Math.pow(10, 3) : 1) * ((stringOriginal.match(millionRegExp)) ? Math.pow(10, 6) : 1) * ((stringOriginal.match(billionRegExp)) ? Math.pow(10, 9) : 1) * ((stringOriginal.match(trillionRegExp)) ? Math.pow(10, 12) : 1) * ((string.indexOf('%') > -1) ? 0.01 : 1) * (((string.split('-').length + Math.min(string.split('(').length - 1, string.split(')').length - 1)) % 2) ? 1 : -1) * Number(string.replace(/[^0-9\.]+/g, ''));
        n._value = (bytesMultiplier) ? Math.ceil(n._value) : n._value;
      }
    }
    return n._value;
  }
  function formatCurrency(n, format, roundingFunction) {
    var symbolIndex = format.indexOf('$'),
        openParenIndex = format.indexOf('('),
        minusSignIndex = format.indexOf('-'),
        space = '',
        spliceIndex,
        output;
    if (format.indexOf(' $') > -1) {
      space = ' ';
      format = format.replace(' $', '');
    } else if (format.indexOf('$ ') > -1) {
      space = ' ';
      format = format.replace('$ ', '');
    } else {
      format = format.replace('$', '');
    }
    output = formatNumber(n._value, format, roundingFunction);
    if (symbolIndex <= 1) {
      if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
        output = output.split('');
        spliceIndex = 1;
        if (symbolIndex < openParenIndex || symbolIndex < minusSignIndex) {
          spliceIndex = 0;
        }
        output.splice(spliceIndex, 0, languages[currentLanguage].currency.symbol + space);
        output = output.join('');
      } else {
        output = languages[currentLanguage].currency.symbol + space + output;
      }
    } else {
      if (output.indexOf(')') > -1) {
        output = output.split('');
        output.splice(-1, 0, space + languages[currentLanguage].currency.symbol);
        output = output.join('');
      } else {
        output = output + space + languages[currentLanguage].currency.symbol;
      }
    }
    return output;
  }
  function formatPercentage(n, format, roundingFunction) {
    var space = '',
        output,
        value = n._value * 100;
    if (format.indexOf(' %') > -1) {
      space = ' ';
      format = format.replace(' %', '');
    } else {
      format = format.replace('%', '');
    }
    output = formatNumber(value, format, roundingFunction);
    if (output.indexOf(')') > -1) {
      output = output.split('');
      output.splice(-1, 0, space + '%');
      output = output.join('');
    } else {
      output = output + space + '%';
    }
    return output;
  }
  function formatTime(n) {
    var hours = Math.floor(n._value / 60 / 60),
        minutes = Math.floor((n._value - (hours * 60 * 60)) / 60),
        seconds = Math.round(n._value - (hours * 60 * 60) - (minutes * 60));
    return hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
  }
  function unformatTime(string) {
    var timeArray = string.split(':'),
        seconds = 0;
    if (timeArray.length === 3) {
      seconds = seconds + (Number(timeArray[0]) * 60 * 60);
      seconds = seconds + (Number(timeArray[1]) * 60);
      seconds = seconds + Number(timeArray[2]);
    } else if (timeArray.length === 2) {
      seconds = seconds + (Number(timeArray[0]) * 60);
      seconds = seconds + Number(timeArray[1]);
    }
    return Number(seconds);
  }
  function formatNumber(value, format, roundingFunction) {
    var negP = false,
        signed = false,
        optDec = false,
        abbr = '',
        abbrK = false,
        abbrM = false,
        abbrB = false,
        abbrT = false,
        abbrForce = false,
        bytes = '',
        ord = '',
        abs = Math.abs(value),
        suffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        min,
        max,
        power,
        w,
        precision,
        thousands,
        d = '',
        neg = false;
    if (value === 0 && zeroFormat !== null) {
      return zeroFormat;
    } else {
      if (format.indexOf('(') > -1) {
        negP = true;
        format = format.slice(1, -1);
      } else if (format.indexOf('+') > -1) {
        signed = true;
        format = format.replace(/\+/g, '');
      }
      if (format.indexOf('a') > -1) {
        abbrK = format.indexOf('aK') >= 0;
        abbrM = format.indexOf('aM') >= 0;
        abbrB = format.indexOf('aB') >= 0;
        abbrT = format.indexOf('aT') >= 0;
        abbrForce = abbrK || abbrM || abbrB || abbrT;
        if (format.indexOf(' a') > -1) {
          abbr = ' ';
          format = format.replace(' a', '');
        } else {
          format = format.replace('a', '');
        }
        if (abs >= Math.pow(10, 12) && !abbrForce || abbrT) {
          abbr = abbr + languages[currentLanguage].abbreviations.trillion;
          value = value / Math.pow(10, 12);
        } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9) && !abbrForce || abbrB) {
          abbr = abbr + languages[currentLanguage].abbreviations.billion;
          value = value / Math.pow(10, 9);
        } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6) && !abbrForce || abbrM) {
          abbr = abbr + languages[currentLanguage].abbreviations.million;
          value = value / Math.pow(10, 6);
        } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3) && !abbrForce || abbrK) {
          abbr = abbr + languages[currentLanguage].abbreviations.thousand;
          value = value / Math.pow(10, 3);
        }
      }
      if (format.indexOf('b') > -1) {
        if (format.indexOf(' b') > -1) {
          bytes = ' ';
          format = format.replace(' b', '');
        } else {
          format = format.replace('b', '');
        }
        for (power = 0; power <= suffixes.length; power++) {
          min = Math.pow(1024, power);
          max = Math.pow(1024, power + 1);
          if (value >= min && value < max) {
            bytes = bytes + suffixes[power];
            if (min > 0) {
              value = value / min;
            }
            break;
          }
        }
      }
      if (format.indexOf('o') > -1) {
        if (format.indexOf(' o') > -1) {
          ord = ' ';
          format = format.replace(' o', '');
        } else {
          format = format.replace('o', '');
        }
        ord = ord + languages[currentLanguage].ordinal(value);
      }
      if (format.indexOf('[.]') > -1) {
        optDec = true;
        format = format.replace('[.]', '.');
      }
      w = value.toString().split('.')[0];
      precision = format.split('.')[1];
      thousands = format.indexOf(',');
      if (precision) {
        if (precision.indexOf('[') > -1) {
          precision = precision.replace(']', '');
          precision = precision.split('[');
          d = toFixed(value, (precision[0].length + precision[1].length), roundingFunction, precision[1].length);
        } else {
          d = toFixed(value, precision.length, roundingFunction);
        }
        w = d.split('.')[0];
        if (d.split('.')[1].length) {
          d = languages[currentLanguage].delimiters.decimal + d.split('.')[1];
        } else {
          d = '';
        }
        if (optDec && Number(d.slice(1)) === 0) {
          d = '';
        }
      } else {
        w = toFixed(value, null, roundingFunction);
      }
      if (w.indexOf('-') > -1) {
        w = w.slice(1);
        neg = true;
      }
      if (thousands > -1) {
        w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + languages[currentLanguage].delimiters.thousands);
      }
      if (format.indexOf('.') === 0) {
        w = '';
      }
      return ((negP && neg) ? '(' : '') + ((!negP && neg) ? '-' : '') + ((!neg && signed) ? '+' : '') + w + d + ((ord) ? ord : '') + ((abbr) ? abbr : '') + ((bytes) ? bytes : '') + ((negP && neg) ? ')' : '');
    }
  }
  numeral = function(input) {
    if (numeral.isNumeral(input)) {
      input = input.value();
    } else if (input === 0 || typeof input === 'undefined') {
      input = 0;
    } else if (!Number(input)) {
      input = numeral.fn.unformat(input);
    }
    return new Numeral(Number(input));
  };
  numeral.version = VERSION;
  numeral.isNumeral = function(obj) {
    return obj instanceof Numeral;
  };
  numeral.language = function(key, values) {
    if (!key) {
      return currentLanguage;
    }
    if (key && !values) {
      if (!languages[key]) {
        throw new Error('Unknown language : ' + key);
      }
      currentLanguage = key;
    }
    if (values || !languages[key]) {
      loadLanguage(key, values);
    }
    return numeral;
  };
  numeral.languageData = function(key) {
    if (!key) {
      return languages[currentLanguage];
    }
    if (!languages[key]) {
      throw new Error('Unknown language : ' + key);
    }
    return languages[key];
  };
  numeral.language('en', {
    delimiters: {
      thousands: ',',
      decimal: '.'
    },
    abbreviations: {
      thousand: 'k',
      million: 'm',
      billion: 'b',
      trillion: 't'
    },
    ordinal: function(number) {
      var b = number % 10;
      return (~~(number % 100 / 10) === 1) ? 'th' : (b === 1) ? 'st' : (b === 2) ? 'nd' : (b === 3) ? 'rd' : 'th';
    },
    currency: {symbol: '$'}
  });
  numeral.zeroFormat = function(format) {
    zeroFormat = typeof(format) === 'string' ? format : null;
  };
  numeral.defaultFormat = function(format) {
    defaultFormat = typeof(format) === 'string' ? format : '0.0';
  };
  numeral.validate = function(val, culture) {
    var _decimalSep,
        _thousandSep,
        _currSymbol,
        _valArray,
        _abbrObj,
        _thousandRegEx,
        languageData,
        temp;
    if (typeof val !== 'string') {
      val += '';
      if (console.warn) {
        console.warn('Numeral.js: Value is not string. It has been co-erced to: ', val);
      }
    }
    val = val.trim();
    if (val === '') {
      return false;
    }
    val = val.replace(/^[+-]?/, '');
    try {
      languageData = numeral.languageData(culture);
    } catch (e) {
      languageData = numeral.languageData(numeral.language());
    }
    _currSymbol = languageData.currency.symbol;
    _abbrObj = languageData.abbreviations;
    _decimalSep = languageData.delimiters.decimal;
    if (languageData.delimiters.thousands === '.') {
      _thousandSep = '\\.';
    } else {
      _thousandSep = languageData.delimiters.thousands;
    }
    temp = val.match(/^[^\d]+/);
    if (temp !== null) {
      val = val.substr(1);
      if (temp[0] !== _currSymbol) {
        return false;
      }
    }
    temp = val.match(/[^\d]+$/);
    if (temp !== null) {
      val = val.slice(0, -1);
      if (temp[0] !== _abbrObj.thousand && temp[0] !== _abbrObj.million && temp[0] !== _abbrObj.billion && temp[0] !== _abbrObj.trillion) {
        return false;
      }
    }
    if (!!val.match(/^\d+$/)) {
      return true;
    }
    _thousandRegEx = new RegExp(_thousandSep + '{2}');
    if (!val.match(/[^\d.,]/g)) {
      _valArray = val.split(_decimalSep);
      if (_valArray.length > 2) {
        return false;
      } else {
        if (_valArray.length < 2) {
          return (!!_valArray[0].match(/^\d+.*\d$/) && !_valArray[0].match(_thousandRegEx));
        } else {
          if (_valArray[0].length === 1) {
            return (!!_valArray[0].match(/^\d+$/) && !_valArray[0].match(_thousandRegEx) && !!_valArray[1].match(/^\d+$/));
          } else {
            return (!!_valArray[0].match(/^\d+.*\d$/) && !_valArray[0].match(_thousandRegEx) && !!_valArray[1].match(/^\d+$/));
          }
        }
      }
    }
    return false;
  };
  function loadLanguage(key, values) {
    languages[key] = values;
  }
  if ('function' !== typeof Array.prototype.reduce) {
    Array.prototype.reduce = function(callback, opt_initialValue) {
      'use strict';
      if (null === this || 'undefined' === typeof this) {
        throw new TypeError('Array.prototype.reduce called on null or undefined');
      }
      if ('function' !== typeof callback) {
        throw new TypeError(callback + ' is not a function');
      }
      var index,
          value,
          length = this.length >>> 0,
          isValueSet = false;
      if (1 < arguments.length) {
        value = opt_initialValue;
        isValueSet = true;
      }
      for (index = 0; length > index; ++index) {
        if (this.hasOwnProperty(index)) {
          if (isValueSet) {
            value = callback(value, this[index], index, this);
          } else {
            value = this[index];
            isValueSet = true;
          }
        }
      }
      if (!isValueSet) {
        throw new TypeError('Reduce of empty array with no initial value');
      }
      return value;
    };
  }
  function multiplier(x) {
    var parts = x.toString().split('.');
    if (parts.length < 2) {
      return 1;
    }
    return Math.pow(10, parts[1].length);
  }
  function correctionFactor() {
    var args = Array.prototype.slice.call(arguments);
    return args.reduce(function(prev, next) {
      var mp = multiplier(prev),
          mn = multiplier(next);
      return mp > mn ? mp : mn;
    }, -Infinity);
  }
  numeral.fn = Numeral.prototype = {
    clone: function() {
      return numeral(this);
    },
    format: function(inputString, roundingFunction) {
      return formatNumeral(this, inputString ? inputString : defaultFormat, (roundingFunction !== undefined) ? roundingFunction : Math.round);
    },
    unformat: function(inputString) {
      if (Object.prototype.toString.call(inputString) === '[object Number]') {
        return inputString;
      }
      return unformatNumeral(this, inputString ? inputString : defaultFormat);
    },
    value: function() {
      return this._value;
    },
    valueOf: function() {
      return this._value;
    },
    set: function(value) {
      this._value = Number(value);
      return this;
    },
    add: function(value) {
      var corrFactor = correctionFactor.call(null, this._value, value);
      function cback(accum, curr, currI, O) {
        return accum + corrFactor * curr;
      }
      this._value = [this._value, value].reduce(cback, 0) / corrFactor;
      return this;
    },
    subtract: function(value) {
      var corrFactor = correctionFactor.call(null, this._value, value);
      function cback(accum, curr, currI, O) {
        return accum - corrFactor * curr;
      }
      this._value = [value].reduce(cback, this._value * corrFactor) / corrFactor;
      return this;
    },
    multiply: function(value) {
      function cback(accum, curr, currI, O) {
        var corrFactor = correctionFactor(accum, curr);
        return (accum * corrFactor) * (curr * corrFactor) / (corrFactor * corrFactor);
      }
      this._value = [this._value, value].reduce(cback, 1);
      return this;
    },
    divide: function(value) {
      function cback(accum, curr, currI, O) {
        var corrFactor = correctionFactor(accum, curr);
        return (accum * corrFactor) / (curr * corrFactor);
      }
      this._value = [this._value, value].reduce(cback);
      return this;
    },
    difference: function(value) {
      return Math.abs(numeral(this._value).subtract(value).value());
    }
  };
  if (hasModule) {
    module.exports = numeral;
  }
  if (typeof ender === 'undefined') {
    this['numeral'] = numeral;
  }
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return numeral;
    });
  }
}).call(window);


//# 
},{}],"pikaday":[function(require,module,exports){
/*!
 * Pikaday
 *
 * Copyright © 2014 David Bushell | BSD & MIT license | https://github.com/dbushell/Pikaday
 */

(function (root, factory)
{
    'use strict';

    var moment;
    if (typeof exports === 'object') {
        // CommonJS module
        // Load moment.js as an optional dependency
        try { moment = require('moment'); } catch (e) {}
        module.exports = factory(moment);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function (req)
        {
            // Load moment.js as an optional dependency
            var id = 'moment';
            try { moment = req(id); } catch (e) {}
            return factory(moment);
        });
    } else {
        root.Pikaday = factory(root.moment);
    }
}(this, function (moment)
{
    'use strict';

    /**
     * feature detection and helper functions
     */
    var hasMoment = typeof moment === 'function',

    hasEventListeners = !!window.addEventListener,

    document = window.document,

    sto = window.setTimeout,

    addEvent = function(el, e, callback, capture)
    {
        if (hasEventListeners) {
            el.addEventListener(e, callback, !!capture);
        } else {
            el.attachEvent('on' + e, callback);
        }
    },

    removeEvent = function(el, e, callback, capture)
    {
        if (hasEventListeners) {
            el.removeEventListener(e, callback, !!capture);
        } else {
            el.detachEvent('on' + e, callback);
        }
    },

    fireEvent = function(el, eventName, data)
    {
        var ev;

        if (document.createEvent) {
            ev = document.createEvent('HTMLEvents');
            ev.initEvent(eventName, true, false);
            ev = extend(ev, data);
            el.dispatchEvent(ev);
        } else if (document.createEventObject) {
            ev = document.createEventObject();
            ev = extend(ev, data);
            el.fireEvent('on' + eventName, ev);
        }
    },

    trim = function(str)
    {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g,'');
    },

    hasClass = function(el, cn)
    {
        return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
    },

    addClass = function(el, cn)
    {
        if (!hasClass(el, cn)) {
            el.className = (el.className === '') ? cn : el.className + ' ' + cn;
        }
    },

    removeClass = function(el, cn)
    {
        el.className = trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '));
    },

    isArray = function(obj)
    {
        return (/Array/).test(Object.prototype.toString.call(obj));
    },

    isDate = function(obj)
    {
        return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
    },

    isWeekend = function(date)
    {
        var day = date.getDay();
        return day === 0 || day === 6;
    },

    isLeapYear = function(year)
    {
        // solution by Matti Virkkunen: http://stackoverflow.com/a/4881951
        return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
    },

    getDaysInMonth = function(year, month)
    {
        return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    },

    setToStartOfDay = function(date)
    {
        if (isDate(date)) date.setHours(0,0,0,0);
    },

    compareDates = function(a,b)
    {
        // weak date comparison (use setToStartOfDay(date) to ensure correct result)
        return a.getTime() === b.getTime();
    },

    extend = function(to, from, overwrite)
    {
        var prop, hasProp;
        for (prop in from) {
            hasProp = to[prop] !== undefined;
            if (hasProp && typeof from[prop] === 'object' && from[prop] !== null && from[prop].nodeName === undefined) {
                if (isDate(from[prop])) {
                    if (overwrite) {
                        to[prop] = new Date(from[prop].getTime());
                    }
                }
                else if (isArray(from[prop])) {
                    if (overwrite) {
                        to[prop] = from[prop].slice(0);
                    }
                } else {
                    to[prop] = extend({}, from[prop], overwrite);
                }
            } else if (overwrite || !hasProp) {
                to[prop] = from[prop];
            }
        }
        return to;
    },

    adjustCalendar = function(calendar) {
        if (calendar.month < 0) {
            calendar.year -= Math.ceil(Math.abs(calendar.month)/12);
            calendar.month += 12;
        }
        if (calendar.month > 11) {
            calendar.year += Math.floor(Math.abs(calendar.month)/12);
            calendar.month -= 12;
        }
        return calendar;
    },

    /**
     * defaults and localisation
     */
    defaults = {

        // bind the picker to a form field
        field: null,

        // automatically show/hide the picker on `field` focus (default `true` if `field` is set)
        bound: undefined,

        // position of the datepicker, relative to the field (default to bottom & left)
        // ('bottom' & 'left' keywords are not used, 'top' & 'right' are modifier on the bottom/left position)
        position: 'bottom left',

        // automatically fit in the viewport even if it means repositioning from the position option
        reposition: true,

        // the default output format for `.toString()` and `field` value
        format: 'YYYY-MM-DD',

        // the initial date to view when first opened
        defaultDate: null,

        // make the `defaultDate` the initial selected value
        setDefaultDate: false,

        // first day of week (0: Sunday, 1: Monday etc)
        firstDay: 0,

        // the minimum/earliest date that can be selected
        minDate: null,
        // the maximum/latest date that can be selected
        maxDate: null,

        // number of years either side, or array of upper/lower range
        yearRange: 10,

        // show week numbers at head of row
        showWeekNumber: false,

        // used internally (don't config outside)
        minYear: 0,
        maxYear: 9999,
        minMonth: undefined,
        maxMonth: undefined,

        isRTL: false,

        // Additional text to append to the year in the calendar title
        yearSuffix: '',

        // Render the month after year in the calendar title
        showMonthAfterYear: false,

        // how many months are visible
        numberOfMonths: 1,

        // when numberOfMonths is used, this will help you to choose where the main calendar will be (default `left`, can be set to `right`)
        // only used for the first display or when a selected date is not visible
        mainCalendar: 'left',

        // Specify a DOM element to render the calendar in
        container: undefined,

        // internationalization
        i18n: {
            previousMonth : 'Previous Month',
            nextMonth     : 'Next Month',
            months        : ['January','February','March','April','May','June','July','August','September','October','November','December'],
            weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
            weekdaysShort : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
        },

        // callback function
        onSelect: null,
        onOpen: null,
        onClose: null,
        onDraw: null
    },


    /**
     * templating functions to abstract HTML rendering
     */
    renderDayName = function(opts, day, abbr)
    {
        day += opts.firstDay;
        while (day >= 7) {
            day -= 7;
        }
        return abbr ? opts.i18n.weekdaysShort[day] : opts.i18n.weekdays[day];
    },

    renderDay = function(d, m, y, isSelected, isToday, isDisabled, isEmpty)
    {
        if (isEmpty) {
            return '<td class="is-empty"></td>';
        }
        var arr = [];
        if (isDisabled) {
            arr.push('is-disabled');
        }
        if (isToday) {
            arr.push('is-today');
        }
        if (isSelected) {
            arr.push('is-selected');
        }
        return '<td data-day="' + d + '" class="' + arr.join(' ') + '">' +
                 '<button class="pika-button pika-day" type="button" ' +
                    'data-pika-year="' + y + '" data-pika-month="' + m + '" data-pika-day="' + d + '">' +
                        d +
                 '</button>' +
               '</td>';
    },

    renderWeek = function (d, m, y) {
        // Lifted from http://javascript.about.com/library/blweekyear.htm, lightly modified.
        var onejan = new Date(y, 0, 1),
            weekNum = Math.ceil((((new Date(y, m, d) - onejan) / 86400000) + onejan.getDay()+1)/7);
        return '<td class="pika-week">' + weekNum + '</td>';
    },

    renderRow = function(days, isRTL)
    {
        return '<tr>' + (isRTL ? days.reverse() : days).join('') + '</tr>';
    },

    renderBody = function(rows)
    {
        return '<tbody>' + rows.join('') + '</tbody>';
    },

    renderHead = function(opts)
    {
        var i, arr = [];
        if (opts.showWeekNumber) {
            arr.push('<th></th>');
        }
        for (i = 0; i < 7; i++) {
            arr.push('<th scope="col"><abbr title="' + renderDayName(opts, i) + '">' + renderDayName(opts, i, true) + '</abbr></th>');
        }
        return '<thead>' + (opts.isRTL ? arr.reverse() : arr).join('') + '</thead>';
    },

    renderTitle = function(instance, c, year, month, refYear)
    {
        var i, j, arr,
            opts = instance._o,
            isMinYear = year === opts.minYear,
            isMaxYear = year === opts.maxYear,
            html = '<div class="pika-title">',
            monthHtml,
            yearHtml,
            prev = true,
            next = true;

        for (arr = [], i = 0; i < 12; i++) {
            arr.push('<option value="' + (year === refYear ? i - c : 12 + i - c) + '"' +
                (i === month ? ' selected': '') +
                ((isMinYear && i < opts.minMonth) || (isMaxYear && i > opts.maxMonth) ? 'disabled' : '') + '>' +
                opts.i18n.months[i] + '</option>');
        }
        monthHtml = '<div class="pika-label">' + opts.i18n.months[month] + '<select class="pika-select pika-select-month">' + arr.join('') + '</select></div>';

        if (isArray(opts.yearRange)) {
            i = opts.yearRange[0];
            j = opts.yearRange[1] + 1;
        } else {
            i = year - opts.yearRange;
            j = 1 + year + opts.yearRange;
        }

        for (arr = []; i < j && i <= opts.maxYear; i++) {
            if (i >= opts.minYear) {
                arr.push('<option value="' + i + '"' + (i === year ? ' selected': '') + '>' + (i) + '</option>');
            }
        }
        yearHtml = '<div class="pika-label">' + year + opts.yearSuffix + '<select class="pika-select pika-select-year">' + arr.join('') + '</select></div>';

        if (opts.showMonthAfterYear) {
            html += yearHtml + monthHtml;
        } else {
            html += monthHtml + yearHtml;
        }

        if (isMinYear && (month === 0 || opts.minMonth >= month)) {
            prev = false;
        }

        if (isMaxYear && (month === 11 || opts.maxMonth <= month)) {
            next = false;
        }

        if (c === 0) {
            html += '<button class="pika-prev' + (prev ? '' : ' is-disabled') + '" type="button">' + opts.i18n.previousMonth + '</button>';
        }
        if (c === (instance._o.numberOfMonths - 1) ) {
            html += '<button class="pika-next' + (next ? '' : ' is-disabled') + '" type="button">' + opts.i18n.nextMonth + '</button>';
        }

        return html += '</div>';
    },

    renderTable = function(opts, data)
    {
        return '<table cellpadding="0" cellspacing="0" class="pika-table">' + renderHead(opts) + renderBody(data) + '</table>';
    },


    /**
     * Pikaday constructor
     */
    Pikaday = function(options)
    {
        var self = this,
            opts = self.config(options);

        self._onMouseDown = function(e)
        {
            if (!self._v) {
                return;
            }
            e = e || window.event;
            var target = e.target || e.srcElement;
            if (!target) {
                return;
            }

            if (!hasClass(target, 'is-disabled')) {
                if (hasClass(target, 'pika-button') && !hasClass(target, 'is-empty')) {
                    self.setDate(new Date(target.getAttribute('data-pika-year'), target.getAttribute('data-pika-month'), target.getAttribute('data-pika-day')));
                    if (opts.bound) {
                        sto(function() {
                            self.hide();
                            if (opts.field) {
                                opts.field.blur();
                            }
                        }, 100);
                    }
                    return;
                }
                else if (hasClass(target, 'pika-prev')) {
                    self.prevMonth();
                }
                else if (hasClass(target, 'pika-next')) {
                    self.nextMonth();
                }
            }
            if (!hasClass(target, 'pika-select')) {
                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                    return false;
                }
            } else {
                self._c = true;
            }
        };

        self._onChange = function(e)
        {
            e = e || window.event;
            var target = e.target || e.srcElement;
            if (!target) {
                return;
            }
            if (hasClass(target, 'pika-select-month')) {
                self.gotoMonth(target.value);
            }
            else if (hasClass(target, 'pika-select-year')) {
                self.gotoYear(target.value);
            }
        };

        self._onInputChange = function(e)
        {
            var date;

            if (e.firedBy === self) {
                return;
            }
            if (hasMoment) {
                date = moment(opts.field.value, opts.format);
                date = (date && date.isValid()) ? date.toDate() : null;
            }
            else {
                date = new Date(Date.parse(opts.field.value));
            }
            self.setDate(isDate(date) ? date : null);
            if (!self._v) {
                self.show();
            }
        };

        self._onInputFocus = function()
        {
            self.show();
        };

        self._onInputClick = function()
        {
            self.show();
        };

        self._onInputBlur = function()
        {
            // IE allows pika div to gain focus; catch blur the input field
            var pEl = document.activeElement;
            do {
                if (hasClass(pEl, 'pika-single')) {
                    return;
                }
            }
            while ((pEl = pEl.parentNode));
            
            if (!self._c) {
                self._b = sto(function() {
                    self.hide();
                }, 50);
            }
            self._c = false;
        };

        self._onClick = function(e)
        {
            e = e || window.event;
            var target = e.target || e.srcElement,
                pEl = target;
            if (!target) {
                return;
            }
            if (!hasEventListeners && hasClass(target, 'pika-select')) {
                if (!target.onchange) {
                    target.setAttribute('onchange', 'return;');
                    addEvent(target, 'change', self._onChange);
                }
            }
            do {
                if (hasClass(pEl, 'pika-single') || pEl === opts.trigger) {
                    return;
                }
            }
            while ((pEl = pEl.parentNode));
            if (self._v && target !== opts.trigger && pEl !== opts.trigger) {
                self.hide();
            }
        };

        self.el = document.createElement('div');
        self.el.className = 'pika-single' + (opts.isRTL ? ' is-rtl' : '');

        addEvent(self.el, 'mousedown', self._onMouseDown, true);
        addEvent(self.el, 'change', self._onChange);

        if (opts.field) {
            if (opts.container) {
                opts.container.appendChild(self.el);
            } else if (opts.bound) {
                document.body.appendChild(self.el);
            } else {
                opts.field.parentNode.insertBefore(self.el, opts.field.nextSibling);
            }
            addEvent(opts.field, 'change', self._onInputChange);

            if (!opts.defaultDate) {
                if (hasMoment && opts.field.value) {
                    opts.defaultDate = moment(opts.field.value, opts.format).toDate();
                } else {
                    opts.defaultDate = new Date(Date.parse(opts.field.value));
                }
                opts.setDefaultDate = true;
            }
        }

        var defDate = opts.defaultDate;

        if (isDate(defDate)) {
            if (opts.setDefaultDate) {
                self.setDate(defDate, true);
            } else {
                self.gotoDate(defDate);
            }
        } else {
            self.gotoDate(new Date());
        }

        if (opts.bound) {
            this.hide();
            self.el.className += ' is-bound';
            addEvent(opts.trigger, 'click', self._onInputClick);
            addEvent(opts.trigger, 'focus', self._onInputFocus);
            addEvent(opts.trigger, 'blur', self._onInputBlur);
        } else {
            this.show();
        }
    };


    /**
     * public Pikaday API
     */
    Pikaday.prototype = {


        /**
         * configure functionality
         */
        config: function(options)
        {
            if (!this._o) {
                this._o = extend({}, defaults, true);
            }

            var opts = extend(this._o, options, true);

            opts.isRTL = !!opts.isRTL;

            opts.field = (opts.field && opts.field.nodeName) ? opts.field : null;

            opts.bound = !!(opts.bound !== undefined ? opts.field && opts.bound : opts.field);

            opts.trigger = (opts.trigger && opts.trigger.nodeName) ? opts.trigger : opts.field;

            opts.disableWeekends = !!opts.disableWeekends;

            opts.disableDayFn = (typeof opts.disableDayFn) == "function" ? opts.disableDayFn : null;

            var nom = parseInt(opts.numberOfMonths, 10) || 1;
            opts.numberOfMonths = nom > 4 ? 4 : nom;

            if (!isDate(opts.minDate)) {
                opts.minDate = false;
            }
            if (!isDate(opts.maxDate)) {
                opts.maxDate = false;
            }
            if ((opts.minDate && opts.maxDate) && opts.maxDate < opts.minDate) {
                opts.maxDate = opts.minDate = false;
            }
            if (opts.minDate) {
                setToStartOfDay(opts.minDate);
                opts.minYear  = opts.minDate.getFullYear();
                opts.minMonth = opts.minDate.getMonth();
            }
            if (opts.maxDate) {
                setToStartOfDay(opts.maxDate);
                opts.maxYear  = opts.maxDate.getFullYear();
                opts.maxMonth = opts.maxDate.getMonth();
            }

            if (isArray(opts.yearRange)) {
                var fallback = new Date().getFullYear() - 10;
                opts.yearRange[0] = parseInt(opts.yearRange[0], 10) || fallback;
                opts.yearRange[1] = parseInt(opts.yearRange[1], 10) || fallback;
            } else {
                opts.yearRange = Math.abs(parseInt(opts.yearRange, 10)) || defaults.yearRange;
                if (opts.yearRange > 100) {
                    opts.yearRange = 100;
                }
            }

            return opts;
        },

        /**
         * return a formatted string of the current selection (using Moment.js if available)
         */
        toString: function(format)
        {
            return !isDate(this._d) ? '' : hasMoment ? moment(this._d).format(format || this._o.format) : this._d.toDateString();
        },

        /**
         * return a Moment.js object of the current selection (if available)
         */
        getMoment: function()
        {
            return hasMoment ? moment(this._d) : null;
        },

        /**
         * set the current selection from a Moment.js object (if available)
         */
        setMoment: function(date, preventOnSelect)
        {
            if (hasMoment && moment.isMoment(date)) {
                this.setDate(date.toDate(), preventOnSelect);
            }
        },

        /**
         * return a Date object of the current selection
         */
        getDate: function()
        {
            return isDate(this._d) ? new Date(this._d.getTime()) : null;
        },

        /**
         * set the current selection
         */
        setDate: function(date, preventOnSelect)
        {
            if (!date) {
                this._d = null;

                if (this._o.field) {
                    this._o.field.value = '';
                    fireEvent(this._o.field, 'change', { firedBy: this });
                }

                return this.draw();
            }
            if (typeof date === 'string') {
                date = new Date(Date.parse(date));
            }
            if (!isDate(date)) {
                return;
            }

            var min = this._o.minDate,
                max = this._o.maxDate;

            if (isDate(min) && date < min) {
                date = min;
            } else if (isDate(max) && date > max) {
                date = max;
            }

            this._d = new Date(date.getTime());
            setToStartOfDay(this._d);
            this.gotoDate(this._d);

            if (this._o.field) {
                this._o.field.value = this.toString();
                fireEvent(this._o.field, 'change', { firedBy: this });
            }
            if (!preventOnSelect && typeof this._o.onSelect === 'function') {
                this._o.onSelect.call(this, this.getDate());
            }
        },

        /**
         * change view to a specific date
         */
        gotoDate: function(date)
        {
            var newCalendar = true;

            if (!isDate(date)) {
                return;
            }

            if (this.calendars) {
                var firstVisibleDate = new Date(this.calendars[0].year, this.calendars[0].month, 1),
                    lastVisibleDate = new Date(this.calendars[this.calendars.length-1].year, this.calendars[this.calendars.length-1].month, 1),
                    visibleDate = date.getTime();
                // get the end of the month
                lastVisibleDate.setMonth(lastVisibleDate.getMonth()+1);
                lastVisibleDate.setDate(lastVisibleDate.getDate()-1);
                newCalendar = (visibleDate < firstVisibleDate.getTime() || lastVisibleDate.getTime() < visibleDate);
            }

            if (newCalendar) {
                this.calendars = [{
                    month: date.getMonth(),
                    year: date.getFullYear()
                }];
                if (this._o.mainCalendar === 'right') {
                    this.calendars[0].month += 1 - this._o.numberOfMonths;
                }
            }

            this.adjustCalendars();
        },

        adjustCalendars: function() {
            this.calendars[0] = adjustCalendar(this.calendars[0]);
            for (var c = 1; c < this._o.numberOfMonths; c++) {
                this.calendars[c] = adjustCalendar({
                    month: this.calendars[0].month + c,
                    year: this.calendars[0].year
                });
            }
            this.draw();
        },

        gotoToday: function()
        {
            this.gotoDate(new Date());
        },

        /**
         * change view to a specific month (zero-index, e.g. 0: January)
         */
        gotoMonth: function(month)
        {
            if (!isNaN(month)) {
                this.calendars[0].month = parseInt(month, 10);
                this.adjustCalendars();
            }
        },

        nextMonth: function()
        {
            this.calendars[0].month++;
            this.adjustCalendars();
        },

        prevMonth: function()
        {
            this.calendars[0].month--;
            this.adjustCalendars();
        },

        /**
         * change view to a specific full year (e.g. "2012")
         */
        gotoYear: function(year)
        {
            if (!isNaN(year)) {
                this.calendars[0].year = parseInt(year, 10);
                this.adjustCalendars();
            }
        },

        /**
         * change the minDate
         */
        setMinDate: function(value)
        {
            this._o.minDate = value;
        },

        /**
         * change the maxDate
         */
        setMaxDate: function(value)
        {
            this._o.maxDate = value;
        },

        /**
         * refresh the HTML
         */
        draw: function(force)
        {
            if (!this._v && !force) {
                return;
            }
            var opts = this._o,
                minYear = opts.minYear,
                maxYear = opts.maxYear,
                minMonth = opts.minMonth,
                maxMonth = opts.maxMonth,
                html = '';

            if (this._y <= minYear) {
                this._y = minYear;
                if (!isNaN(minMonth) && this._m < minMonth) {
                    this._m = minMonth;
                }
            }
            if (this._y >= maxYear) {
                this._y = maxYear;
                if (!isNaN(maxMonth) && this._m > maxMonth) {
                    this._m = maxMonth;
                }
            }

            for (var c = 0; c < opts.numberOfMonths; c++) {
                html += '<div class="pika-lendar">' + renderTitle(this, c, this.calendars[c].year, this.calendars[c].month, this.calendars[0].year) + this.render(this.calendars[c].year, this.calendars[c].month) + '</div>';
            }

            this.el.innerHTML = html;

            if (opts.bound) {
                if(opts.field.type !== 'hidden') {
                    sto(function() {
                        opts.trigger.focus();
                    }, 1);
                }
            }

            if (typeof this._o.onDraw === 'function') {
                var self = this;
                sto(function() {
                    self._o.onDraw.call(self);
                }, 0);
            }
        },

        adjustPosition: function()
        {
            if (this._o.container) return;
            var field = this._o.trigger, pEl = field,
            width = this.el.offsetWidth, height = this.el.offsetHeight,
            viewportWidth = window.innerWidth || document.documentElement.clientWidth,
            viewportHeight = window.innerHeight || document.documentElement.clientHeight,
            scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop,
            left, top, clientRect;

            if (typeof field.getBoundingClientRect === 'function') {
                clientRect = field.getBoundingClientRect();
                left = clientRect.left + window.pageXOffset;
                top = clientRect.bottom + window.pageYOffset;
            } else {
                left = pEl.offsetLeft;
                top  = pEl.offsetTop + pEl.offsetHeight;
                while((pEl = pEl.offsetParent)) {
                    left += pEl.offsetLeft;
                    top  += pEl.offsetTop;
                }
            }

            // default position is bottom & left
            if ((this._o.reposition && left + width > viewportWidth) ||
                (
                    this._o.position.indexOf('right') > -1 &&
                    left - width + field.offsetWidth > 0
                )
            ) {
                left = left - width + field.offsetWidth;
            }
            if ((this._o.reposition && top + height > viewportHeight + scrollTop) ||
                (
                    this._o.position.indexOf('top') > -1 &&
                    top - height - field.offsetHeight > 0
                )
            ) {
                top = top - height - field.offsetHeight;
            }

            this.el.style.cssText = [
                'position: absolute',
                'left: ' + left + 'px',
                'top: ' + top + 'px'
            ].join(';');
        },

        /**
         * render HTML for a particular month
         */
        render: function(year, month)
        {
            var opts   = this._o,
                now    = new Date(),
                days   = getDaysInMonth(year, month),
                before = new Date(year, month, 1).getDay(),
                data   = [],
                row    = [];
            setToStartOfDay(now);
            if (opts.firstDay > 0) {
                before -= opts.firstDay;
                if (before < 0) {
                    before += 7;
                }
            }
            var cells = days + before,
                after = cells;
            while(after > 7) {
                after -= 7;
            }
            cells += 7 - after;
            for (var i = 0, r = 0; i < cells; i++)
            {
                var day = new Date(year, month, 1 + (i - before)),
                    isSelected = isDate(this._d) ? compareDates(day, this._d) : false,
                    isToday = compareDates(day, now),
                    isEmpty = i < before || i >= (days + before),
                    isDisabled = (opts.minDate && day < opts.minDate) ||
                                 (opts.maxDate && day > opts.maxDate) ||
                                 (opts.disableWeekends && isWeekend(day)) ||
                                 (opts.disableDayFn && opts.disableDayFn(day));

                row.push(renderDay(1 + (i - before), month, year, isSelected, isToday, isDisabled, isEmpty));

                if (++r === 7) {
                    if (opts.showWeekNumber) {
                        row.unshift(renderWeek(i - before, month, year));
                    }
                    data.push(renderRow(row, opts.isRTL));
                    row = [];
                    r = 0;
                }
            }
            return renderTable(opts, data);
        },

        isVisible: function()
        {
            return this._v;
        },

        show: function()
        {
            if (!this._v) {
                removeClass(this.el, 'is-hidden');
                this._v = true;
                this.draw();
                if (this._o.bound) {
                    addEvent(document, 'click', this._onClick);
                    this.adjustPosition();
                }
                if (typeof this._o.onOpen === 'function') {
                    this._o.onOpen.call(this);
                }
            }
        },

        hide: function()
        {
            var v = this._v;
            if (v !== false) {
                if (this._o.bound) {
                    removeEvent(document, 'click', this._onClick);
                }
                this.el.style.cssText = '';
                addClass(this.el, 'is-hidden');
                this._v = false;
                if (v !== undefined && typeof this._o.onClose === 'function') {
                    this._o.onClose.call(this);
                }
            }
        },

        /**
         * GAME OVER
         */
        destroy: function()
        {
            this.hide();
            removeEvent(this.el, 'mousedown', this._onMouseDown, true);
            removeEvent(this.el, 'change', this._onChange);
            if (this._o.field) {
                removeEvent(this._o.field, 'change', this._onInputChange);
                if (this._o.bound) {
                    removeEvent(this._o.trigger, 'click', this._onInputClick);
                    removeEvent(this._o.trigger, 'focus', this._onInputFocus);
                    removeEvent(this._o.trigger, 'blur', this._onInputBlur);
                }
            }
            if (this.el.parentNode) {
                this.el.parentNode.removeChild(this.el);
            }
        }

    };

    return Pikaday;

}));

},{"moment":"moment"}],"zeroclipboard":[function(require,module,exports){
/*!
 * ZeroClipboard
 * The ZeroClipboard library provides an easy way to copy text to the clipboard using an invisible Adobe Flash movie and a JavaScript interface.
 * Copyright (c) 2009-2014 Jon Rohan, James M. Greene
 * Licensed MIT
 * http://zeroclipboard.org/
 * v2.2.0
 */
(function(window, undefined) {
  "use strict";
  /**
 * Store references to critically important global functions that may be
 * overridden on certain web pages.
 */
  var _window = window, _document = _window.document, _navigator = _window.navigator, _setTimeout = _window.setTimeout, _clearTimeout = _window.clearTimeout, _setInterval = _window.setInterval, _clearInterval = _window.clearInterval, _getComputedStyle = _window.getComputedStyle, _encodeURIComponent = _window.encodeURIComponent, _ActiveXObject = _window.ActiveXObject, _Error = _window.Error, _parseInt = _window.Number.parseInt || _window.parseInt, _parseFloat = _window.Number.parseFloat || _window.parseFloat, _isNaN = _window.Number.isNaN || _window.isNaN, _now = _window.Date.now, _keys = _window.Object.keys, _defineProperty = _window.Object.defineProperty, _hasOwn = _window.Object.prototype.hasOwnProperty, _slice = _window.Array.prototype.slice, _unwrap = function() {
    var unwrapper = function(el) {
      return el;
    };
    if (typeof _window.wrap === "function" && typeof _window.unwrap === "function") {
      try {
        var div = _document.createElement("div");
        var unwrappedDiv = _window.unwrap(div);
        if (div.nodeType === 1 && unwrappedDiv && unwrappedDiv.nodeType === 1) {
          unwrapper = _window.unwrap;
        }
      } catch (e) {}
    }
    return unwrapper;
  }();
  /**
 * Convert an `arguments` object into an Array.
 *
 * @returns The arguments as an Array
 * @private
 */
  var _args = function(argumentsObj) {
    return _slice.call(argumentsObj, 0);
  };
  /**
 * Shallow-copy the owned, enumerable properties of one object over to another, similar to jQuery's `$.extend`.
 *
 * @returns The target object, augmented
 * @private
 */
  var _extend = function() {
    var i, len, arg, prop, src, copy, args = _args(arguments), target = args[0] || {};
    for (i = 1, len = args.length; i < len; i++) {
      if ((arg = args[i]) != null) {
        for (prop in arg) {
          if (_hasOwn.call(arg, prop)) {
            src = target[prop];
            copy = arg[prop];
            if (target !== copy && copy !== undefined) {
              target[prop] = copy;
            }
          }
        }
      }
    }
    return target;
  };
  /**
 * Return a deep copy of the source object or array.
 *
 * @returns Object or Array
 * @private
 */
  var _deepCopy = function(source) {
    var copy, i, len, prop;
    if (typeof source !== "object" || source == null || typeof source.nodeType === "number") {
      copy = source;
    } else if (typeof source.length === "number") {
      copy = [];
      for (i = 0, len = source.length; i < len; i++) {
        if (_hasOwn.call(source, i)) {
          copy[i] = _deepCopy(source[i]);
        }
      }
    } else {
      copy = {};
      for (prop in source) {
        if (_hasOwn.call(source, prop)) {
          copy[prop] = _deepCopy(source[prop]);
        }
      }
    }
    return copy;
  };
  /**
 * Makes a shallow copy of `obj` (like `_extend`) but filters its properties based on a list of `keys` to keep.
 * The inverse of `_omit`, mostly. The big difference is that these properties do NOT need to be enumerable to
 * be kept.
 *
 * @returns A new filtered object.
 * @private
 */
  var _pick = function(obj, keys) {
    var newObj = {};
    for (var i = 0, len = keys.length; i < len; i++) {
      if (keys[i] in obj) {
        newObj[keys[i]] = obj[keys[i]];
      }
    }
    return newObj;
  };
  /**
 * Makes a shallow copy of `obj` (like `_extend`) but filters its properties based on a list of `keys` to omit.
 * The inverse of `_pick`.
 *
 * @returns A new filtered object.
 * @private
 */
  var _omit = function(obj, keys) {
    var newObj = {};
    for (var prop in obj) {
      if (keys.indexOf(prop) === -1) {
        newObj[prop] = obj[prop];
      }
    }
    return newObj;
  };
  /**
 * Remove all owned, enumerable properties from an object.
 *
 * @returns The original object without its owned, enumerable properties.
 * @private
 */
  var _deleteOwnProperties = function(obj) {
    if (obj) {
      for (var prop in obj) {
        if (_hasOwn.call(obj, prop)) {
          delete obj[prop];
        }
      }
    }
    return obj;
  };
  /**
 * Determine if an element is contained within another element.
 *
 * @returns Boolean
 * @private
 */
  var _containedBy = function(el, ancestorEl) {
    if (el && el.nodeType === 1 && el.ownerDocument && ancestorEl && (ancestorEl.nodeType === 1 && ancestorEl.ownerDocument && ancestorEl.ownerDocument === el.ownerDocument || ancestorEl.nodeType === 9 && !ancestorEl.ownerDocument && ancestorEl === el.ownerDocument)) {
      do {
        if (el === ancestorEl) {
          return true;
        }
        el = el.parentNode;
      } while (el);
    }
    return false;
  };
  /**
 * Get the URL path's parent directory.
 *
 * @returns String or `undefined`
 * @private
 */
  var _getDirPathOfUrl = function(url) {
    var dir;
    if (typeof url === "string" && url) {
      dir = url.split("#")[0].split("?")[0];
      dir = url.slice(0, url.lastIndexOf("/") + 1);
    }
    return dir;
  };
  /**
 * Get the current script's URL by throwing an `Error` and analyzing it.
 *
 * @returns String or `undefined`
 * @private
 */
  var _getCurrentScriptUrlFromErrorStack = function(stack) {
    var url, matches;
    if (typeof stack === "string" && stack) {
      matches = stack.match(/^(?:|[^:@]*@|.+\)@(?=http[s]?|file)|.+?\s+(?: at |@)(?:[^:\(]+ )*[\(]?)((?:http[s]?|file):\/\/[\/]?.+?\/[^:\)]*?)(?::\d+)(?::\d+)?/);
      if (matches && matches[1]) {
        url = matches[1];
      } else {
        matches = stack.match(/\)@((?:http[s]?|file):\/\/[\/]?.+?\/[^:\)]*?)(?::\d+)(?::\d+)?/);
        if (matches && matches[1]) {
          url = matches[1];
        }
      }
    }
    return url;
  };
  /**
 * Get the current script's URL by throwing an `Error` and analyzing it.
 *
 * @returns String or `undefined`
 * @private
 */
  var _getCurrentScriptUrlFromError = function() {
    var url, err;
    try {
      throw new _Error();
    } catch (e) {
      err = e;
    }
    if (err) {
      url = err.sourceURL || err.fileName || _getCurrentScriptUrlFromErrorStack(err.stack);
    }
    return url;
  };
  /**
 * Get the current script's URL.
 *
 * @returns String or `undefined`
 * @private
 */
  var _getCurrentScriptUrl = function() {
    var jsPath, scripts, i;
    if (_document.currentScript && (jsPath = _document.currentScript.src)) {
      return jsPath;
    }
    scripts = _document.getElementsByTagName("script");
    if (scripts.length === 1) {
      return scripts[0].src || undefined;
    }
    if ("readyState" in scripts[0]) {
      for (i = scripts.length; i--; ) {
        if (scripts[i].readyState === "interactive" && (jsPath = scripts[i].src)) {
          return jsPath;
        }
      }
    }
    if (_document.readyState === "loading" && (jsPath = scripts[scripts.length - 1].src)) {
      return jsPath;
    }
    if (jsPath = _getCurrentScriptUrlFromError()) {
      return jsPath;
    }
    return undefined;
  };
  /**
 * Get the unanimous parent directory of ALL script tags.
 * If any script tags are either (a) inline or (b) from differing parent
 * directories, this method must return `undefined`.
 *
 * @returns String or `undefined`
 * @private
 */
  var _getUnanimousScriptParentDir = function() {
    var i, jsDir, jsPath, scripts = _document.getElementsByTagName("script");
    for (i = scripts.length; i--; ) {
      if (!(jsPath = scripts[i].src)) {
        jsDir = null;
        break;
      }
      jsPath = _getDirPathOfUrl(jsPath);
      if (jsDir == null) {
        jsDir = jsPath;
      } else if (jsDir !== jsPath) {
        jsDir = null;
        break;
      }
    }
    return jsDir || undefined;
  };
  /**
 * Get the presumed location of the "ZeroClipboard.swf" file, based on the location
 * of the executing JavaScript file (e.g. "ZeroClipboard.js", etc.).
 *
 * @returns String
 * @private
 */
  var _getDefaultSwfPath = function() {
    var jsDir = _getDirPathOfUrl(_getCurrentScriptUrl()) || _getUnanimousScriptParentDir() || "";
    return jsDir + "ZeroClipboard.swf";
  };
  /**
 * Keep track of if the page is framed (in an `iframe`). This can never change.
 * @private
 */
  var _pageIsFramed = function() {
    return window.opener == null && (!!window.top && window != window.top || !!window.parent && window != window.parent);
  }();
  /**
 * Keep track of the state of the Flash object.
 * @private
 */
  var _flashState = {
    bridge: null,
    version: "0.0.0",
    pluginType: "unknown",
    disabled: null,
    outdated: null,
    sandboxed: null,
    unavailable: null,
    degraded: null,
    deactivated: null,
    overdue: null,
    ready: null
  };
  /**
 * The minimum Flash Player version required to use ZeroClipboard completely.
 * @readonly
 * @private
 */
  var _minimumFlashVersion = "11.0.0";
  /**
 * The ZeroClipboard library version number, as reported by Flash, at the time the SWF was compiled.
 */
  var _zcSwfVersion;
  /**
 * Keep track of all event listener registrations.
 * @private
 */
  var _handlers = {};
  /**
 * Keep track of the currently activated element.
 * @private
 */
  var _currentElement;
  /**
 * Keep track of the element that was activated when a `copy` process started.
 * @private
 */
  var _copyTarget;
  /**
 * Keep track of data for the pending clipboard transaction.
 * @private
 */
  var _clipData = {};
  /**
 * Keep track of data formats for the pending clipboard transaction.
 * @private
 */
  var _clipDataFormatMap = null;
  /**
 * Keep track of the Flash availability check timeout.
 * @private
 */
  var _flashCheckTimeout = 0;
  /**
 * Keep track of SWF network errors interval polling.
 * @private
 */
  var _swfFallbackCheckInterval = 0;
  /**
 * The `message` store for events
 * @private
 */
  var _eventMessages = {
    ready: "Flash communication is established",
    error: {
      "flash-disabled": "Flash is disabled or not installed. May also be attempting to run Flash in a sandboxed iframe, which is impossible.",
      "flash-outdated": "Flash is too outdated to support ZeroClipboard",
      "flash-sandboxed": "Attempting to run Flash in a sandboxed iframe, which is impossible",
      "flash-unavailable": "Flash is unable to communicate bidirectionally with JavaScript",
      "flash-degraded": "Flash is unable to preserve data fidelity when communicating with JavaScript",
      "flash-deactivated": "Flash is too outdated for your browser and/or is configured as click-to-activate.\nThis may also mean that the ZeroClipboard SWF object could not be loaded, so please check your `swfPath` configuration and/or network connectivity.\nMay also be attempting to run Flash in a sandboxed iframe, which is impossible.",
      "flash-overdue": "Flash communication was established but NOT within the acceptable time limit",
      "version-mismatch": "ZeroClipboard JS version number does not match ZeroClipboard SWF version number",
      "clipboard-error": "At least one error was thrown while ZeroClipboard was attempting to inject your data into the clipboard",
      "config-mismatch": "ZeroClipboard configuration does not match Flash's reality",
      "swf-not-found": "The ZeroClipboard SWF object could not be loaded, so please check your `swfPath` configuration and/or network connectivity"
    }
  };
  /**
 * The `name`s of `error` events that can only occur is Flash has at least
 * been able to load the SWF successfully.
 * @private
 */
  var _errorsThatOnlyOccurAfterFlashLoads = [ "flash-unavailable", "flash-degraded", "flash-overdue", "version-mismatch", "config-mismatch", "clipboard-error" ];
  /**
 * The `name`s of `error` events that should likely result in the `_flashState`
 * variable's property values being updated.
 * @private
 */
  var _flashStateErrorNames = [ "flash-disabled", "flash-outdated", "flash-sandboxed", "flash-unavailable", "flash-degraded", "flash-deactivated", "flash-overdue" ];
  /**
 * A RegExp to match the `name` property of `error` events related to Flash.
 * @private
 */
  var _flashStateErrorNameMatchingRegex = new RegExp("^flash-(" + _flashStateErrorNames.map(function(errorName) {
    return errorName.replace(/^flash-/, "");
  }).join("|") + ")$");
  /**
 * A RegExp to match the `name` property of `error` events related to Flash,
 * which is enabled.
 * @private
 */
  var _flashStateEnabledErrorNameMatchingRegex = new RegExp("^flash-(" + _flashStateErrorNames.slice(1).map(function(errorName) {
    return errorName.replace(/^flash-/, "");
  }).join("|") + ")$");
  /**
 * ZeroClipboard configuration defaults for the Core module.
 * @private
 */
  var _globalConfig = {
    swfPath: _getDefaultSwfPath(),
    trustedDomains: window.location.host ? [ window.location.host ] : [],
    cacheBust: true,
    forceEnhancedClipboard: false,
    flashLoadTimeout: 3e4,
    autoActivate: true,
    bubbleEvents: true,
    containerId: "global-zeroclipboard-html-bridge",
    containerClass: "global-zeroclipboard-container",
    swfObjectId: "global-zeroclipboard-flash-bridge",
    hoverClass: "zeroclipboard-is-hover",
    activeClass: "zeroclipboard-is-active",
    forceHandCursor: false,
    title: null,
    zIndex: 999999999
  };
  /**
 * The underlying implementation of `ZeroClipboard.config`.
 * @private
 */
  var _config = function(options) {
    if (typeof options === "object" && options !== null) {
      for (var prop in options) {
        if (_hasOwn.call(options, prop)) {
          if (/^(?:forceHandCursor|title|zIndex|bubbleEvents)$/.test(prop)) {
            _globalConfig[prop] = options[prop];
          } else if (_flashState.bridge == null) {
            if (prop === "containerId" || prop === "swfObjectId") {
              if (_isValidHtml4Id(options[prop])) {
                _globalConfig[prop] = options[prop];
              } else {
                throw new Error("The specified `" + prop + "` value is not valid as an HTML4 Element ID");
              }
            } else {
              _globalConfig[prop] = options[prop];
            }
          }
        }
      }
    }
    if (typeof options === "string" && options) {
      if (_hasOwn.call(_globalConfig, options)) {
        return _globalConfig[options];
      }
      return;
    }
    return _deepCopy(_globalConfig);
  };
  /**
 * The underlying implementation of `ZeroClipboard.state`.
 * @private
 */
  var _state = function() {
    _detectSandbox();
    return {
      browser: _pick(_navigator, [ "userAgent", "platform", "appName" ]),
      flash: _omit(_flashState, [ "bridge" ]),
      zeroclipboard: {
        version: ZeroClipboard.version,
        config: ZeroClipboard.config()
      }
    };
  };
  /**
 * The underlying implementation of `ZeroClipboard.isFlashUnusable`.
 * @private
 */
  var _isFlashUnusable = function() {
    return !!(_flashState.disabled || _flashState.outdated || _flashState.sandboxed || _flashState.unavailable || _flashState.degraded || _flashState.deactivated);
  };
  /**
 * The underlying implementation of `ZeroClipboard.on`.
 * @private
 */
  var _on = function(eventType, listener) {
    var i, len, events, added = {};
    if (typeof eventType === "string" && eventType) {
      events = eventType.toLowerCase().split(/\s+/);
    } else if (typeof eventType === "object" && eventType && typeof listener === "undefined") {
      for (i in eventType) {
        if (_hasOwn.call(eventType, i) && typeof i === "string" && i && typeof eventType[i] === "function") {
          ZeroClipboard.on(i, eventType[i]);
        }
      }
    }
    if (events && events.length) {
      for (i = 0, len = events.length; i < len; i++) {
        eventType = events[i].replace(/^on/, "");
        added[eventType] = true;
        if (!_handlers[eventType]) {
          _handlers[eventType] = [];
        }
        _handlers[eventType].push(listener);
      }
      if (added.ready && _flashState.ready) {
        ZeroClipboard.emit({
          type: "ready"
        });
      }
      if (added.error) {
        for (i = 0, len = _flashStateErrorNames.length; i < len; i++) {
          if (_flashState[_flashStateErrorNames[i].replace(/^flash-/, "")] === true) {
            ZeroClipboard.emit({
              type: "error",
              name: _flashStateErrorNames[i]
            });
            break;
          }
        }
        if (_zcSwfVersion !== undefined && ZeroClipboard.version !== _zcSwfVersion) {
          ZeroClipboard.emit({
            type: "error",
            name: "version-mismatch",
            jsVersion: ZeroClipboard.version,
            swfVersion: _zcSwfVersion
          });
        }
      }
    }
    return ZeroClipboard;
  };
  /**
 * The underlying implementation of `ZeroClipboard.off`.
 * @private
 */
  var _off = function(eventType, listener) {
    var i, len, foundIndex, events, perEventHandlers;
    if (arguments.length === 0) {
      events = _keys(_handlers);
    } else if (typeof eventType === "string" && eventType) {
      events = eventType.split(/\s+/);
    } else if (typeof eventType === "object" && eventType && typeof listener === "undefined") {
      for (i in eventType) {
        if (_hasOwn.call(eventType, i) && typeof i === "string" && i && typeof eventType[i] === "function") {
          ZeroClipboard.off(i, eventType[i]);
        }
      }
    }
    if (events && events.length) {
      for (i = 0, len = events.length; i < len; i++) {
        eventType = events[i].toLowerCase().replace(/^on/, "");
        perEventHandlers = _handlers[eventType];
        if (perEventHandlers && perEventHandlers.length) {
          if (listener) {
            foundIndex = perEventHandlers.indexOf(listener);
            while (foundIndex !== -1) {
              perEventHandlers.splice(foundIndex, 1);
              foundIndex = perEventHandlers.indexOf(listener, foundIndex);
            }
          } else {
            perEventHandlers.length = 0;
          }
        }
      }
    }
    return ZeroClipboard;
  };
  /**
 * The underlying implementation of `ZeroClipboard.handlers`.
 * @private
 */
  var _listeners = function(eventType) {
    var copy;
    if (typeof eventType === "string" && eventType) {
      copy = _deepCopy(_handlers[eventType]) || null;
    } else {
      copy = _deepCopy(_handlers);
    }
    return copy;
  };
  /**
 * The underlying implementation of `ZeroClipboard.emit`.
 * @private
 */
  var _emit = function(event) {
    var eventCopy, returnVal, tmp;
    event = _createEvent(event);
    if (!event) {
      return;
    }
    if (_preprocessEvent(event)) {
      return;
    }
    if (event.type === "ready" && _flashState.overdue === true) {
      return ZeroClipboard.emit({
        type: "error",
        name: "flash-overdue"
      });
    }
    eventCopy = _extend({}, event);
    _dispatchCallbacks.call(this, eventCopy);
    if (event.type === "copy") {
      tmp = _mapClipDataToFlash(_clipData);
      returnVal = tmp.data;
      _clipDataFormatMap = tmp.formatMap;
    }
    return returnVal;
  };
  /**
 * The underlying implementation of `ZeroClipboard.create`.
 * @private
 */
  var _create = function() {
    var previousState = _flashState.sandboxed;
    _detectSandbox();
    if (typeof _flashState.ready !== "boolean") {
      _flashState.ready = false;
    }
    if (_flashState.sandboxed !== previousState && _flashState.sandboxed === true) {
      _flashState.ready = false;
      ZeroClipboard.emit({
        type: "error",
        name: "flash-sandboxed"
      });
    } else if (!ZeroClipboard.isFlashUnusable() && _flashState.bridge === null) {
      var maxWait = _globalConfig.flashLoadTimeout;
      if (typeof maxWait === "number" && maxWait >= 0) {
        _flashCheckTimeout = _setTimeout(function() {
          if (typeof _flashState.deactivated !== "boolean") {
            _flashState.deactivated = true;
          }
          if (_flashState.deactivated === true) {
            ZeroClipboard.emit({
              type: "error",
              name: "flash-deactivated"
            });
          }
        }, maxWait);
      }
      _flashState.overdue = false;
      _embedSwf();
    }
  };
  /**
 * The underlying implementation of `ZeroClipboard.destroy`.
 * @private
 */
  var _destroy = function() {
    ZeroClipboard.clearData();
    ZeroClipboard.blur();
    ZeroClipboard.emit("destroy");
    _unembedSwf();
    ZeroClipboard.off();
  };
  /**
 * The underlying implementation of `ZeroClipboard.setData`.
 * @private
 */
  var _setData = function(format, data) {
    var dataObj;
    if (typeof format === "object" && format && typeof data === "undefined") {
      dataObj = format;
      ZeroClipboard.clearData();
    } else if (typeof format === "string" && format) {
      dataObj = {};
      dataObj[format] = data;
    } else {
      return;
    }
    for (var dataFormat in dataObj) {
      if (typeof dataFormat === "string" && dataFormat && _hasOwn.call(dataObj, dataFormat) && typeof dataObj[dataFormat] === "string" && dataObj[dataFormat]) {
        _clipData[dataFormat] = dataObj[dataFormat];
      }
    }
  };
  /**
 * The underlying implementation of `ZeroClipboard.clearData`.
 * @private
 */
  var _clearData = function(format) {
    if (typeof format === "undefined") {
      _deleteOwnProperties(_clipData);
      _clipDataFormatMap = null;
    } else if (typeof format === "string" && _hasOwn.call(_clipData, format)) {
      delete _clipData[format];
    }
  };
  /**
 * The underlying implementation of `ZeroClipboard.getData`.
 * @private
 */
  var _getData = function(format) {
    if (typeof format === "undefined") {
      return _deepCopy(_clipData);
    } else if (typeof format === "string" && _hasOwn.call(_clipData, format)) {
      return _clipData[format];
    }
  };
  /**
 * The underlying implementation of `ZeroClipboard.focus`/`ZeroClipboard.activate`.
 * @private
 */
  var _focus = function(element) {
    if (!(element && element.nodeType === 1)) {
      return;
    }
    if (_currentElement) {
      _removeClass(_currentElement, _globalConfig.activeClass);
      if (_currentElement !== element) {
        _removeClass(_currentElement, _globalConfig.hoverClass);
      }
    }
    _currentElement = element;
    _addClass(element, _globalConfig.hoverClass);
    var newTitle = element.getAttribute("title") || _globalConfig.title;
    if (typeof newTitle === "string" && newTitle) {
      var htmlBridge = _getHtmlBridge(_flashState.bridge);
      if (htmlBridge) {
        htmlBridge.setAttribute("title", newTitle);
      }
    }
    var useHandCursor = _globalConfig.forceHandCursor === true || _getStyle(element, "cursor") === "pointer";
    _setHandCursor(useHandCursor);
    _reposition();
  };
  /**
 * The underlying implementation of `ZeroClipboard.blur`/`ZeroClipboard.deactivate`.
 * @private
 */
  var _blur = function() {
    var htmlBridge = _getHtmlBridge(_flashState.bridge);
    if (htmlBridge) {
      htmlBridge.removeAttribute("title");
      htmlBridge.style.left = "0px";
      htmlBridge.style.top = "-9999px";
      htmlBridge.style.width = "1px";
      htmlBridge.style.height = "1px";
    }
    if (_currentElement) {
      _removeClass(_currentElement, _globalConfig.hoverClass);
      _removeClass(_currentElement, _globalConfig.activeClass);
      _currentElement = null;
    }
  };
  /**
 * The underlying implementation of `ZeroClipboard.activeElement`.
 * @private
 */
  var _activeElement = function() {
    return _currentElement || null;
  };
  /**
 * Check if a value is a valid HTML4 `ID` or `Name` token.
 * @private
 */
  var _isValidHtml4Id = function(id) {
    return typeof id === "string" && id && /^[A-Za-z][A-Za-z0-9_:\-\.]*$/.test(id);
  };
  /**
 * Create or update an `event` object, based on the `eventType`.
 * @private
 */
  var _createEvent = function(event) {
    var eventType;
    if (typeof event === "string" && event) {
      eventType = event;
      event = {};
    } else if (typeof event === "object" && event && typeof event.type === "string" && event.type) {
      eventType = event.type;
    }
    if (!eventType) {
      return;
    }
    eventType = eventType.toLowerCase();
    if (!event.target && (/^(copy|aftercopy|_click)$/.test(eventType) || eventType === "error" && event.name === "clipboard-error")) {
      event.target = _copyTarget;
    }
    _extend(event, {
      type: eventType,
      target: event.target || _currentElement || null,
      relatedTarget: event.relatedTarget || null,
      currentTarget: _flashState && _flashState.bridge || null,
      timeStamp: event.timeStamp || _now() || null
    });
    var msg = _eventMessages[event.type];
    if (event.type === "error" && event.name && msg) {
      msg = msg[event.name];
    }
    if (msg) {
      event.message = msg;
    }
    if (event.type === "ready") {
      _extend(event, {
        target: null,
        version: _flashState.version
      });
    }
    if (event.type === "error") {
      if (_flashStateErrorNameMatchingRegex.test(event.name)) {
        _extend(event, {
          target: null,
          minimumVersion: _minimumFlashVersion
        });
      }
      if (_flashStateEnabledErrorNameMatchingRegex.test(event.name)) {
        _extend(event, {
          version: _flashState.version
        });
      }
    }
    if (event.type === "copy") {
      event.clipboardData = {
        setData: ZeroClipboard.setData,
        clearData: ZeroClipboard.clearData
      };
    }
    if (event.type === "aftercopy") {
      event = _mapClipResultsFromFlash(event, _clipDataFormatMap);
    }
    if (event.target && !event.relatedTarget) {
      event.relatedTarget = _getRelatedTarget(event.target);
    }
    return _addMouseData(event);
  };
  /**
 * Get a relatedTarget from the target's `data-clipboard-target` attribute
 * @private
 */
  var _getRelatedTarget = function(targetEl) {
    var relatedTargetId = targetEl && targetEl.getAttribute && targetEl.getAttribute("data-clipboard-target");
    return relatedTargetId ? _document.getElementById(relatedTargetId) : null;
  };
  /**
 * Add element and position data to `MouseEvent` instances
 * @private
 */
  var _addMouseData = function(event) {
    if (event && /^_(?:click|mouse(?:over|out|down|up|move))$/.test(event.type)) {
      var srcElement = event.target;
      var fromElement = event.type === "_mouseover" && event.relatedTarget ? event.relatedTarget : undefined;
      var toElement = event.type === "_mouseout" && event.relatedTarget ? event.relatedTarget : undefined;
      var pos = _getElementPosition(srcElement);
      var screenLeft = _window.screenLeft || _window.screenX || 0;
      var screenTop = _window.screenTop || _window.screenY || 0;
      var scrollLeft = _document.body.scrollLeft + _document.documentElement.scrollLeft;
      var scrollTop = _document.body.scrollTop + _document.documentElement.scrollTop;
      var pageX = pos.left + (typeof event._stageX === "number" ? event._stageX : 0);
      var pageY = pos.top + (typeof event._stageY === "number" ? event._stageY : 0);
      var clientX = pageX - scrollLeft;
      var clientY = pageY - scrollTop;
      var screenX = screenLeft + clientX;
      var screenY = screenTop + clientY;
      var moveX = typeof event.movementX === "number" ? event.movementX : 0;
      var moveY = typeof event.movementY === "number" ? event.movementY : 0;
      delete event._stageX;
      delete event._stageY;
      _extend(event, {
        srcElement: srcElement,
        fromElement: fromElement,
        toElement: toElement,
        screenX: screenX,
        screenY: screenY,
        pageX: pageX,
        pageY: pageY,
        clientX: clientX,
        clientY: clientY,
        x: clientX,
        y: clientY,
        movementX: moveX,
        movementY: moveY,
        offsetX: 0,
        offsetY: 0,
        layerX: 0,
        layerY: 0
      });
    }
    return event;
  };
  /**
 * Determine if an event's registered handlers should be execute synchronously or asynchronously.
 *
 * @returns {boolean}
 * @private
 */
  var _shouldPerformAsync = function(event) {
    var eventType = event && typeof event.type === "string" && event.type || "";
    return !/^(?:(?:before)?copy|destroy)$/.test(eventType);
  };
  /**
 * Control if a callback should be executed asynchronously or not.
 *
 * @returns `undefined`
 * @private
 */
  var _dispatchCallback = function(func, context, args, async) {
    if (async) {
      _setTimeout(function() {
        func.apply(context, args);
      }, 0);
    } else {
      func.apply(context, args);
    }
  };
  /**
 * Handle the actual dispatching of events to client instances.
 *
 * @returns `undefined`
 * @private
 */
  var _dispatchCallbacks = function(event) {
    if (!(typeof event === "object" && event && event.type)) {
      return;
    }
    var async = _shouldPerformAsync(event);
    var wildcardTypeHandlers = _handlers["*"] || [];
    var specificTypeHandlers = _handlers[event.type] || [];
    var handlers = wildcardTypeHandlers.concat(specificTypeHandlers);
    if (handlers && handlers.length) {
      var i, len, func, context, eventCopy, originalContext = this;
      for (i = 0, len = handlers.length; i < len; i++) {
        func = handlers[i];
        context = originalContext;
        if (typeof func === "string" && typeof _window[func] === "function") {
          func = _window[func];
        }
        if (typeof func === "object" && func && typeof func.handleEvent === "function") {
          context = func;
          func = func.handleEvent;
        }
        if (typeof func === "function") {
          eventCopy = _extend({}, event);
          _dispatchCallback(func, context, [ eventCopy ], async);
        }
      }
    }
    return this;
  };
  /**
 * Check an `error` event's `name` property to see if Flash has
 * already loaded, which rules out possible `iframe` sandboxing.
 * @private
 */
  var _getSandboxStatusFromErrorEvent = function(event) {
    var isSandboxed = null;
    if (_pageIsFramed === false || event && event.type === "error" && event.name && _errorsThatOnlyOccurAfterFlashLoads.indexOf(event.name) !== -1) {
      isSandboxed = false;
    }
    return isSandboxed;
  };
  /**
 * Preprocess any special behaviors, reactions, or state changes after receiving this event.
 * Executes only once per event emitted, NOT once per client.
 * @private
 */
  var _preprocessEvent = function(event) {
    var element = event.target || _currentElement || null;
    var sourceIsSwf = event._source === "swf";
    delete event._source;
    switch (event.type) {
     case "error":
      var isSandboxed = event.name === "flash-sandboxed" || _getSandboxStatusFromErrorEvent(event);
      if (typeof isSandboxed === "boolean") {
        _flashState.sandboxed = isSandboxed;
      }
      if (_flashStateErrorNames.indexOf(event.name) !== -1) {
        _extend(_flashState, {
          disabled: event.name === "flash-disabled",
          outdated: event.name === "flash-outdated",
          unavailable: event.name === "flash-unavailable",
          degraded: event.name === "flash-degraded",
          deactivated: event.name === "flash-deactivated",
          overdue: event.name === "flash-overdue",
          ready: false
        });
      } else if (event.name === "version-mismatch") {
        _zcSwfVersion = event.swfVersion;
        _extend(_flashState, {
          disabled: false,
          outdated: false,
          unavailable: false,
          degraded: false,
          deactivated: false,
          overdue: false,
          ready: false
        });
      }
      _clearTimeoutsAndPolling();
      break;

     case "ready":
      _zcSwfVersion = event.swfVersion;
      var wasDeactivated = _flashState.deactivated === true;
      _extend(_flashState, {
        disabled: false,
        outdated: false,
        sandboxed: false,
        unavailable: false,
        degraded: false,
        deactivated: false,
        overdue: wasDeactivated,
        ready: !wasDeactivated
      });
      _clearTimeoutsAndPolling();
      break;

     case "beforecopy":
      _copyTarget = element;
      break;

     case "copy":
      var textContent, htmlContent, targetEl = event.relatedTarget;
      if (!(_clipData["text/html"] || _clipData["text/plain"]) && targetEl && (htmlContent = targetEl.value || targetEl.outerHTML || targetEl.innerHTML) && (textContent = targetEl.value || targetEl.textContent || targetEl.innerText)) {
        event.clipboardData.clearData();
        event.clipboardData.setData("text/plain", textContent);
        if (htmlContent !== textContent) {
          event.clipboardData.setData("text/html", htmlContent);
        }
      } else if (!_clipData["text/plain"] && event.target && (textContent = event.target.getAttribute("data-clipboard-text"))) {
        event.clipboardData.clearData();
        event.clipboardData.setData("text/plain", textContent);
      }
      break;

     case "aftercopy":
      _queueEmitClipboardErrors(event);
      ZeroClipboard.clearData();
      if (element && element !== _safeActiveElement() && element.focus) {
        element.focus();
      }
      break;

     case "_mouseover":
      ZeroClipboard.focus(element);
      if (_globalConfig.bubbleEvents === true && sourceIsSwf) {
        if (element && element !== event.relatedTarget && !_containedBy(event.relatedTarget, element)) {
          _fireMouseEvent(_extend({}, event, {
            type: "mouseenter",
            bubbles: false,
            cancelable: false
          }));
        }
        _fireMouseEvent(_extend({}, event, {
          type: "mouseover"
        }));
      }
      break;

     case "_mouseout":
      ZeroClipboard.blur();
      if (_globalConfig.bubbleEvents === true && sourceIsSwf) {
        if (element && element !== event.relatedTarget && !_containedBy(event.relatedTarget, element)) {
          _fireMouseEvent(_extend({}, event, {
            type: "mouseleave",
            bubbles: false,
            cancelable: false
          }));
        }
        _fireMouseEvent(_extend({}, event, {
          type: "mouseout"
        }));
      }
      break;

     case "_mousedown":
      _addClass(element, _globalConfig.activeClass);
      if (_globalConfig.bubbleEvents === true && sourceIsSwf) {
        _fireMouseEvent(_extend({}, event, {
          type: event.type.slice(1)
        }));
      }
      break;

     case "_mouseup":
      _removeClass(element, _globalConfig.activeClass);
      if (_globalConfig.bubbleEvents === true && sourceIsSwf) {
        _fireMouseEvent(_extend({}, event, {
          type: event.type.slice(1)
        }));
      }
      break;

     case "_click":
      _copyTarget = null;
      if (_globalConfig.bubbleEvents === true && sourceIsSwf) {
        _fireMouseEvent(_extend({}, event, {
          type: event.type.slice(1)
        }));
      }
      break;

     case "_mousemove":
      if (_globalConfig.bubbleEvents === true && sourceIsSwf) {
        _fireMouseEvent(_extend({}, event, {
          type: event.type.slice(1)
        }));
      }
      break;
    }
    if (/^_(?:click|mouse(?:over|out|down|up|move))$/.test(event.type)) {
      return true;
    }
  };
  /**
 * Check an "aftercopy" event for clipboard errors and emit a corresponding "error" event.
 * @private
 */
  var _queueEmitClipboardErrors = function(aftercopyEvent) {
    if (aftercopyEvent.errors && aftercopyEvent.errors.length > 0) {
      var errorEvent = _deepCopy(aftercopyEvent);
      _extend(errorEvent, {
        type: "error",
        name: "clipboard-error"
      });
      delete errorEvent.success;
      _setTimeout(function() {
        ZeroClipboard.emit(errorEvent);
      }, 0);
    }
  };
  /**
 * Dispatch a synthetic MouseEvent.
 *
 * @returns `undefined`
 * @private
 */
  var _fireMouseEvent = function(event) {
    if (!(event && typeof event.type === "string" && event)) {
      return;
    }
    var e, target = event.target || null, doc = target && target.ownerDocument || _document, defaults = {
      view: doc.defaultView || _window,
      canBubble: true,
      cancelable: true,
      detail: event.type === "click" ? 1 : 0,
      button: typeof event.which === "number" ? event.which - 1 : typeof event.button === "number" ? event.button : doc.createEvent ? 0 : 1
    }, args = _extend(defaults, event);
    if (!target) {
      return;
    }
    if (doc.createEvent && target.dispatchEvent) {
      args = [ args.type, args.canBubble, args.cancelable, args.view, args.detail, args.screenX, args.screenY, args.clientX, args.clientY, args.ctrlKey, args.altKey, args.shiftKey, args.metaKey, args.button, args.relatedTarget ];
      e = doc.createEvent("MouseEvents");
      if (e.initMouseEvent) {
        e.initMouseEvent.apply(e, args);
        e._source = "js";
        target.dispatchEvent(e);
      }
    }
  };
  /**
 * Continuously poll the DOM until either:
 *  (a) the fallback content becomes visible, or
 *  (b) we receive an event from SWF (handled elsewhere)
 *
 * IMPORTANT:
 * This is NOT a necessary check but it can result in significantly faster
 * detection of bad `swfPath` configuration and/or network/server issues [in
 * supported browsers] than waiting for the entire `flashLoadTimeout` duration
 * to elapse before detecting that the SWF cannot be loaded. The detection
 * duration can be anywhere from 10-30 times faster [in supported browsers] by
 * using this approach.
 *
 * @returns `undefined`
 * @private
 */
  var _watchForSwfFallbackContent = function() {
    var maxWait = _globalConfig.flashLoadTimeout;
    if (typeof maxWait === "number" && maxWait >= 0) {
      var pollWait = Math.min(1e3, maxWait / 10);
      var fallbackContentId = _globalConfig.swfObjectId + "_fallbackContent";
      _swfFallbackCheckInterval = _setInterval(function() {
        var el = _document.getElementById(fallbackContentId);
        if (_isElementVisible(el)) {
          _clearTimeoutsAndPolling();
          _flashState.deactivated = null;
          ZeroClipboard.emit({
            type: "error",
            name: "swf-not-found"
          });
        }
      }, pollWait);
    }
  };
  /**
 * Create the HTML bridge element to embed the Flash object into.
 * @private
 */
  var _createHtmlBridge = function() {
    var container = _document.createElement("div");
    container.id = _globalConfig.containerId;
    container.className = _globalConfig.containerClass;
    container.style.position = "absolute";
    container.style.left = "0px";
    container.style.top = "-9999px";
    container.style.width = "1px";
    container.style.height = "1px";
    container.style.zIndex = "" + _getSafeZIndex(_globalConfig.zIndex);
    return container;
  };
  /**
 * Get the HTML element container that wraps the Flash bridge object/element.
 * @private
 */
  var _getHtmlBridge = function(flashBridge) {
    var htmlBridge = flashBridge && flashBridge.parentNode;
    while (htmlBridge && htmlBridge.nodeName === "OBJECT" && htmlBridge.parentNode) {
      htmlBridge = htmlBridge.parentNode;
    }
    return htmlBridge || null;
  };
  /**
 * Create the SWF object.
 *
 * @returns The SWF object reference.
 * @private
 */
  var _embedSwf = function() {
    var len, flashBridge = _flashState.bridge, container = _getHtmlBridge(flashBridge);
    if (!flashBridge) {
      var allowScriptAccess = _determineScriptAccess(_window.location.host, _globalConfig);
      var allowNetworking = allowScriptAccess === "never" ? "none" : "all";
      var flashvars = _vars(_extend({
        jsVersion: ZeroClipboard.version
      }, _globalConfig));
      var swfUrl = _globalConfig.swfPath + _cacheBust(_globalConfig.swfPath, _globalConfig);
      container = _createHtmlBridge();
      var divToBeReplaced = _document.createElement("div");
      container.appendChild(divToBeReplaced);
      _document.body.appendChild(container);
      var tmpDiv = _document.createElement("div");
      var usingActiveX = _flashState.pluginType === "activex";
      tmpDiv.innerHTML = '<object id="' + _globalConfig.swfObjectId + '" name="' + _globalConfig.swfObjectId + '" ' + 'width="100%" height="100%" ' + (usingActiveX ? 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"' : 'type="application/x-shockwave-flash" data="' + swfUrl + '"') + ">" + (usingActiveX ? '<param name="movie" value="' + swfUrl + '"/>' : "") + '<param name="allowScriptAccess" value="' + allowScriptAccess + '"/>' + '<param name="allowNetworking" value="' + allowNetworking + '"/>' + '<param name="menu" value="false"/>' + '<param name="wmode" value="transparent"/>' + '<param name="flashvars" value="' + flashvars + '"/>' + '<div id="' + _globalConfig.swfObjectId + '_fallbackContent">&nbsp;</div>' + "</object>";
      flashBridge = tmpDiv.firstChild;
      tmpDiv = null;
      _unwrap(flashBridge).ZeroClipboard = ZeroClipboard;
      container.replaceChild(flashBridge, divToBeReplaced);
      _watchForSwfFallbackContent();
    }
    if (!flashBridge) {
      flashBridge = _document[_globalConfig.swfObjectId];
      if (flashBridge && (len = flashBridge.length)) {
        flashBridge = flashBridge[len - 1];
      }
      if (!flashBridge && container) {
        flashBridge = container.firstChild;
      }
    }
    _flashState.bridge = flashBridge || null;
    return flashBridge;
  };
  /**
 * Destroy the SWF object.
 * @private
 */
  var _unembedSwf = function() {
    var flashBridge = _flashState.bridge;
    if (flashBridge) {
      var htmlBridge = _getHtmlBridge(flashBridge);
      if (htmlBridge) {
        if (_flashState.pluginType === "activex" && "readyState" in flashBridge) {
          flashBridge.style.display = "none";
          (function removeSwfFromIE() {
            if (flashBridge.readyState === 4) {
              for (var prop in flashBridge) {
                if (typeof flashBridge[prop] === "function") {
                  flashBridge[prop] = null;
                }
              }
              if (flashBridge.parentNode) {
                flashBridge.parentNode.removeChild(flashBridge);
              }
              if (htmlBridge.parentNode) {
                htmlBridge.parentNode.removeChild(htmlBridge);
              }
            } else {
              _setTimeout(removeSwfFromIE, 10);
            }
          })();
        } else {
          if (flashBridge.parentNode) {
            flashBridge.parentNode.removeChild(flashBridge);
          }
          if (htmlBridge.parentNode) {
            htmlBridge.parentNode.removeChild(htmlBridge);
          }
        }
      }
      _clearTimeoutsAndPolling();
      _flashState.ready = null;
      _flashState.bridge = null;
      _flashState.deactivated = null;
      _zcSwfVersion = undefined;
    }
  };
  /**
 * Map the data format names of the "clipData" to Flash-friendly names.
 *
 * @returns A new transformed object.
 * @private
 */
  var _mapClipDataToFlash = function(clipData) {
    var newClipData = {}, formatMap = {};
    if (!(typeof clipData === "object" && clipData)) {
      return;
    }
    for (var dataFormat in clipData) {
      if (dataFormat && _hasOwn.call(clipData, dataFormat) && typeof clipData[dataFormat] === "string" && clipData[dataFormat]) {
        switch (dataFormat.toLowerCase()) {
         case "text/plain":
         case "text":
         case "air:text":
         case "flash:text":
          newClipData.text = clipData[dataFormat];
          formatMap.text = dataFormat;
          break;

         case "text/html":
         case "html":
         case "air:html":
         case "flash:html":
          newClipData.html = clipData[dataFormat];
          formatMap.html = dataFormat;
          break;

         case "application/rtf":
         case "text/rtf":
         case "rtf":
         case "richtext":
         case "air:rtf":
         case "flash:rtf":
          newClipData.rtf = clipData[dataFormat];
          formatMap.rtf = dataFormat;
          break;

         default:
          break;
        }
      }
    }
    return {
      data: newClipData,
      formatMap: formatMap
    };
  };
  /**
 * Map the data format names from Flash-friendly names back to their original "clipData" names (via a format mapping).
 *
 * @returns A new transformed object.
 * @private
 */
  var _mapClipResultsFromFlash = function(clipResults, formatMap) {
    if (!(typeof clipResults === "object" && clipResults && typeof formatMap === "object" && formatMap)) {
      return clipResults;
    }
    var newResults = {};
    for (var prop in clipResults) {
      if (_hasOwn.call(clipResults, prop)) {
        if (prop === "errors") {
          newResults[prop] = clipResults[prop] ? clipResults[prop].slice() : [];
          for (var i = 0, len = newResults[prop].length; i < len; i++) {
            newResults[prop][i].format = formatMap[newResults[prop][i].format];
          }
        } else if (prop !== "success" && prop !== "data") {
          newResults[prop] = clipResults[prop];
        } else {
          newResults[prop] = {};
          var tmpHash = clipResults[prop];
          for (var dataFormat in tmpHash) {
            if (dataFormat && _hasOwn.call(tmpHash, dataFormat) && _hasOwn.call(formatMap, dataFormat)) {
              newResults[prop][formatMap[dataFormat]] = tmpHash[dataFormat];
            }
          }
        }
      }
    }
    return newResults;
  };
  /**
 * Will look at a path, and will create a "?noCache={time}" or "&noCache={time}"
 * query param string to return. Does NOT append that string to the original path.
 * This is useful because ExternalInterface often breaks when a Flash SWF is cached.
 *
 * @returns The `noCache` query param with necessary "?"/"&" prefix.
 * @private
 */
  var _cacheBust = function(path, options) {
    var cacheBust = options == null || options && options.cacheBust === true;
    if (cacheBust) {
      return (path.indexOf("?") === -1 ? "?" : "&") + "noCache=" + _now();
    } else {
      return "";
    }
  };
  /**
 * Creates a query string for the FlashVars param.
 * Does NOT include the cache-busting query param.
 *
 * @returns FlashVars query string
 * @private
 */
  var _vars = function(options) {
    var i, len, domain, domains, str = "", trustedOriginsExpanded = [];
    if (options.trustedDomains) {
      if (typeof options.trustedDomains === "string") {
        domains = [ options.trustedDomains ];
      } else if (typeof options.trustedDomains === "object" && "length" in options.trustedDomains) {
        domains = options.trustedDomains;
      }
    }
    if (domains && domains.length) {
      for (i = 0, len = domains.length; i < len; i++) {
        if (_hasOwn.call(domains, i) && domains[i] && typeof domains[i] === "string") {
          domain = _extractDomain(domains[i]);
          if (!domain) {
            continue;
          }
          if (domain === "*") {
            trustedOriginsExpanded.length = 0;
            trustedOriginsExpanded.push(domain);
            break;
          }
          trustedOriginsExpanded.push.apply(trustedOriginsExpanded, [ domain, "//" + domain, _window.location.protocol + "//" + domain ]);
        }
      }
    }
    if (trustedOriginsExpanded.length) {
      str += "trustedOrigins=" + _encodeURIComponent(trustedOriginsExpanded.join(","));
    }
    if (options.forceEnhancedClipboard === true) {
      str += (str ? "&" : "") + "forceEnhancedClipboard=true";
    }
    if (typeof options.swfObjectId === "string" && options.swfObjectId) {
      str += (str ? "&" : "") + "swfObjectId=" + _encodeURIComponent(options.swfObjectId);
    }
    if (typeof options.jsVersion === "string" && options.jsVersion) {
      str += (str ? "&" : "") + "jsVersion=" + _encodeURIComponent(options.jsVersion);
    }
    return str;
  };
  /**
 * Extract the domain (e.g. "github.com") from an origin (e.g. "https://github.com") or
 * URL (e.g. "https://github.com/zeroclipboard/zeroclipboard/").
 *
 * @returns the domain
 * @private
 */
  var _extractDomain = function(originOrUrl) {
    if (originOrUrl == null || originOrUrl === "") {
      return null;
    }
    originOrUrl = originOrUrl.replace(/^\s+|\s+$/g, "");
    if (originOrUrl === "") {
      return null;
    }
    var protocolIndex = originOrUrl.indexOf("//");
    originOrUrl = protocolIndex === -1 ? originOrUrl : originOrUrl.slice(protocolIndex + 2);
    var pathIndex = originOrUrl.indexOf("/");
    originOrUrl = pathIndex === -1 ? originOrUrl : protocolIndex === -1 || pathIndex === 0 ? null : originOrUrl.slice(0, pathIndex);
    if (originOrUrl && originOrUrl.slice(-4).toLowerCase() === ".swf") {
      return null;
    }
    return originOrUrl || null;
  };
  /**
 * Set `allowScriptAccess` based on `trustedDomains` and `window.location.host` vs. `swfPath`.
 *
 * @returns The appropriate script access level.
 * @private
 */
  var _determineScriptAccess = function() {
    var _extractAllDomains = function(origins) {
      var i, len, tmp, resultsArray = [];
      if (typeof origins === "string") {
        origins = [ origins ];
      }
      if (!(typeof origins === "object" && origins && typeof origins.length === "number")) {
        return resultsArray;
      }
      for (i = 0, len = origins.length; i < len; i++) {
        if (_hasOwn.call(origins, i) && (tmp = _extractDomain(origins[i]))) {
          if (tmp === "*") {
            resultsArray.length = 0;
            resultsArray.push("*");
            break;
          }
          if (resultsArray.indexOf(tmp) === -1) {
            resultsArray.push(tmp);
          }
        }
      }
      return resultsArray;
    };
    return function(currentDomain, configOptions) {
      var swfDomain = _extractDomain(configOptions.swfPath);
      if (swfDomain === null) {
        swfDomain = currentDomain;
      }
      var trustedDomains = _extractAllDomains(configOptions.trustedDomains);
      var len = trustedDomains.length;
      if (len > 0) {
        if (len === 1 && trustedDomains[0] === "*") {
          return "always";
        }
        if (trustedDomains.indexOf(currentDomain) !== -1) {
          if (len === 1 && currentDomain === swfDomain) {
            return "sameDomain";
          }
          return "always";
        }
      }
      return "never";
    };
  }();
  /**
 * Get the currently active/focused DOM element.
 *
 * @returns the currently active/focused element, or `null`
 * @private
 */
  var _safeActiveElement = function() {
    try {
      return _document.activeElement;
    } catch (err) {
      return null;
    }
  };
  /**
 * Add a class to an element, if it doesn't already have it.
 *
 * @returns The element, with its new class added.
 * @private
 */
  var _addClass = function(element, value) {
    var c, cl, className, classNames = [];
    if (typeof value === "string" && value) {
      classNames = value.split(/\s+/);
    }
    if (element && element.nodeType === 1 && classNames.length > 0) {
      if (element.classList) {
        for (c = 0, cl = classNames.length; c < cl; c++) {
          element.classList.add(classNames[c]);
        }
      } else if (element.hasOwnProperty("className")) {
        className = " " + element.className + " ";
        for (c = 0, cl = classNames.length; c < cl; c++) {
          if (className.indexOf(" " + classNames[c] + " ") === -1) {
            className += classNames[c] + " ";
          }
        }
        element.className = className.replace(/^\s+|\s+$/g, "");
      }
    }
    return element;
  };
  /**
 * Remove a class from an element, if it has it.
 *
 * @returns The element, with its class removed.
 * @private
 */
  var _removeClass = function(element, value) {
    var c, cl, className, classNames = [];
    if (typeof value === "string" && value) {
      classNames = value.split(/\s+/);
    }
    if (element && element.nodeType === 1 && classNames.length > 0) {
      if (element.classList && element.classList.length > 0) {
        for (c = 0, cl = classNames.length; c < cl; c++) {
          element.classList.remove(classNames[c]);
        }
      } else if (element.className) {
        className = (" " + element.className + " ").replace(/[\r\n\t]/g, " ");
        for (c = 0, cl = classNames.length; c < cl; c++) {
          className = className.replace(" " + classNames[c] + " ", " ");
        }
        element.className = className.replace(/^\s+|\s+$/g, "");
      }
    }
    return element;
  };
  /**
 * Attempt to interpret the element's CSS styling. If `prop` is `"cursor"`,
 * then we assume that it should be a hand ("pointer") cursor if the element
 * is an anchor element ("a" tag).
 *
 * @returns The computed style property.
 * @private
 */
  var _getStyle = function(el, prop) {
    var value = _getComputedStyle(el, null).getPropertyValue(prop);
    if (prop === "cursor") {
      if (!value || value === "auto") {
        if (el.nodeName === "A") {
          return "pointer";
        }
      }
    }
    return value;
  };
  /**
 * Get the absolutely positioned coordinates of a DOM element.
 *
 * @returns Object containing the element's position, width, and height.
 * @private
 */
  var _getElementPosition = function(el) {
    var pos = {
      left: 0,
      top: 0,
      width: 0,
      height: 0
    };
    if (el.getBoundingClientRect) {
      var elRect = el.getBoundingClientRect();
      var pageXOffset = _window.pageXOffset;
      var pageYOffset = _window.pageYOffset;
      var leftBorderWidth = _document.documentElement.clientLeft || 0;
      var topBorderWidth = _document.documentElement.clientTop || 0;
      var leftBodyOffset = 0;
      var topBodyOffset = 0;
      if (_getStyle(_document.body, "position") === "relative") {
        var bodyRect = _document.body.getBoundingClientRect();
        var htmlRect = _document.documentElement.getBoundingClientRect();
        leftBodyOffset = bodyRect.left - htmlRect.left || 0;
        topBodyOffset = bodyRect.top - htmlRect.top || 0;
      }
      pos.left = elRect.left + pageXOffset - leftBorderWidth - leftBodyOffset;
      pos.top = elRect.top + pageYOffset - topBorderWidth - topBodyOffset;
      pos.width = "width" in elRect ? elRect.width : elRect.right - elRect.left;
      pos.height = "height" in elRect ? elRect.height : elRect.bottom - elRect.top;
    }
    return pos;
  };
  /**
 * Determine is an element is visible somewhere within the document (page).
 *
 * @returns Boolean
 * @private
 */
  var _isElementVisible = function(el) {
    if (!el) {
      return false;
    }
    var styles = _getComputedStyle(el, null);
    var hasCssHeight = _parseFloat(styles.height) > 0;
    var hasCssWidth = _parseFloat(styles.width) > 0;
    var hasCssTop = _parseFloat(styles.top) >= 0;
    var hasCssLeft = _parseFloat(styles.left) >= 0;
    var cssKnows = hasCssHeight && hasCssWidth && hasCssTop && hasCssLeft;
    var rect = cssKnows ? null : _getElementPosition(el);
    var isVisible = styles.display !== "none" && styles.visibility !== "collapse" && (cssKnows || !!rect && (hasCssHeight || rect.height > 0) && (hasCssWidth || rect.width > 0) && (hasCssTop || rect.top >= 0) && (hasCssLeft || rect.left >= 0));
    return isVisible;
  };
  /**
 * Clear all existing timeouts and interval polling delegates.
 *
 * @returns `undefined`
 * @private
 */
  var _clearTimeoutsAndPolling = function() {
    _clearTimeout(_flashCheckTimeout);
    _flashCheckTimeout = 0;
    _clearInterval(_swfFallbackCheckInterval);
    _swfFallbackCheckInterval = 0;
  };
  /**
 * Reposition the Flash object to cover the currently activated element.
 *
 * @returns `undefined`
 * @private
 */
  var _reposition = function() {
    var htmlBridge;
    if (_currentElement && (htmlBridge = _getHtmlBridge(_flashState.bridge))) {
      var pos = _getElementPosition(_currentElement);
      _extend(htmlBridge.style, {
        width: pos.width + "px",
        height: pos.height + "px",
        top: pos.top + "px",
        left: pos.left + "px",
        zIndex: "" + _getSafeZIndex(_globalConfig.zIndex)
      });
    }
  };
  /**
 * Sends a signal to the Flash object to display the hand cursor if `true`.
 *
 * @returns `undefined`
 * @private
 */
  var _setHandCursor = function(enabled) {
    if (_flashState.ready === true) {
      if (_flashState.bridge && typeof _flashState.bridge.setHandCursor === "function") {
        _flashState.bridge.setHandCursor(enabled);
      } else {
        _flashState.ready = false;
      }
    }
  };
  /**
 * Get a safe value for `zIndex`
 *
 * @returns an integer, or "auto"
 * @private
 */
  var _getSafeZIndex = function(val) {
    if (/^(?:auto|inherit)$/.test(val)) {
      return val;
    }
    var zIndex;
    if (typeof val === "number" && !_isNaN(val)) {
      zIndex = val;
    } else if (typeof val === "string") {
      zIndex = _getSafeZIndex(_parseInt(val, 10));
    }
    return typeof zIndex === "number" ? zIndex : "auto";
  };
  /**
 * Attempt to detect if ZeroClipboard is executing inside of a sandboxed iframe.
 * If it is, Flash Player cannot be used, so ZeroClipboard is dead in the water.
 *
 * @see {@link http://lists.w3.org/Archives/Public/public-whatwg-archive/2014Dec/0002.html}
 * @see {@link https://github.com/zeroclipboard/zeroclipboard/issues/511}
 * @see {@link http://zeroclipboard.org/test-iframes.html}
 *
 * @returns `true` (is sandboxed), `false` (is not sandboxed), or `null` (uncertain) 
 * @private
 */
  var _detectSandbox = function(doNotReassessFlashSupport) {
    var effectiveScriptOrigin, frame, frameError, previousState = _flashState.sandboxed, isSandboxed = null;
    doNotReassessFlashSupport = doNotReassessFlashSupport === true;
    if (_pageIsFramed === false) {
      isSandboxed = false;
    } else {
      try {
        frame = window.frameElement || null;
      } catch (e) {
        frameError = {
          name: e.name,
          message: e.message
        };
      }
      if (frame && frame.nodeType === 1 && frame.nodeName === "IFRAME") {
        try {
          isSandboxed = frame.hasAttribute("sandbox");
        } catch (e) {
          isSandboxed = null;
        }
      } else {
        try {
          effectiveScriptOrigin = document.domain || null;
        } catch (e) {
          effectiveScriptOrigin = null;
        }
        if (effectiveScriptOrigin === null || frameError && frameError.name === "SecurityError" && /(^|[\s\(\[@])sandbox(es|ed|ing|[\s\.,!\)\]@]|$)/.test(frameError.message.toLowerCase())) {
          isSandboxed = true;
        }
      }
    }
    _flashState.sandboxed = isSandboxed;
    if (previousState !== isSandboxed && !doNotReassessFlashSupport) {
      _detectFlashSupport(_ActiveXObject);
    }
    return isSandboxed;
  };
  /**
 * Detect the Flash Player status, version, and plugin type.
 *
 * @see {@link https://code.google.com/p/doctype-mirror/wiki/ArticleDetectFlash#The_code}
 * @see {@link http://stackoverflow.com/questions/12866060/detecting-pepper-ppapi-flash-with-javascript}
 *
 * @returns `undefined`
 * @private
 */
  var _detectFlashSupport = function(ActiveXObject) {
    var plugin, ax, mimeType, hasFlash = false, isActiveX = false, isPPAPI = false, flashVersion = "";
    /**
   * Derived from Apple's suggested sniffer.
   * @param {String} desc e.g. "Shockwave Flash 7.0 r61"
   * @returns {String} "7.0.61"
   * @private
   */
    function parseFlashVersion(desc) {
      var matches = desc.match(/[\d]+/g);
      matches.length = 3;
      return matches.join(".");
    }
    function isPepperFlash(flashPlayerFileName) {
      return !!flashPlayerFileName && (flashPlayerFileName = flashPlayerFileName.toLowerCase()) && (/^(pepflashplayer\.dll|libpepflashplayer\.so|pepperflashplayer\.plugin)$/.test(flashPlayerFileName) || flashPlayerFileName.slice(-13) === "chrome.plugin");
    }
    function inspectPlugin(plugin) {
      if (plugin) {
        hasFlash = true;
        if (plugin.version) {
          flashVersion = parseFlashVersion(plugin.version);
        }
        if (!flashVersion && plugin.description) {
          flashVersion = parseFlashVersion(plugin.description);
        }
        if (plugin.filename) {
          isPPAPI = isPepperFlash(plugin.filename);
        }
      }
    }
    if (_navigator.plugins && _navigator.plugins.length) {
      plugin = _navigator.plugins["Shockwave Flash"];
      inspectPlugin(plugin);
      if (_navigator.plugins["Shockwave Flash 2.0"]) {
        hasFlash = true;
        flashVersion = "2.0.0.11";
      }
    } else if (_navigator.mimeTypes && _navigator.mimeTypes.length) {
      mimeType = _navigator.mimeTypes["application/x-shockwave-flash"];
      plugin = mimeType && mimeType.enabledPlugin;
      inspectPlugin(plugin);
    } else if (typeof ActiveXObject !== "undefined") {
      isActiveX = true;
      try {
        ax = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
        hasFlash = true;
        flashVersion = parseFlashVersion(ax.GetVariable("$version"));
      } catch (e1) {
        try {
          ax = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
          hasFlash = true;
          flashVersion = "6.0.21";
        } catch (e2) {
          try {
            ax = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
            hasFlash = true;
            flashVersion = parseFlashVersion(ax.GetVariable("$version"));
          } catch (e3) {
            isActiveX = false;
          }
        }
      }
    }
    _flashState.disabled = hasFlash !== true;
    _flashState.outdated = flashVersion && _parseFloat(flashVersion) < _parseFloat(_minimumFlashVersion);
    _flashState.version = flashVersion || "0.0.0";
    _flashState.pluginType = isPPAPI ? "pepper" : isActiveX ? "activex" : hasFlash ? "netscape" : "unknown";
  };
  /**
 * Invoke the Flash detection algorithms immediately upon inclusion so we're not waiting later.
 */
  _detectFlashSupport(_ActiveXObject);
  /**
 * Always assess the `sandboxed` state of the page at important Flash-related moments.
 */
  _detectSandbox(true);
  /**
 * A shell constructor for `ZeroClipboard` client instances.
 *
 * @constructor
 */
  var ZeroClipboard = function() {
    if (!(this instanceof ZeroClipboard)) {
      return new ZeroClipboard();
    }
    if (typeof ZeroClipboard._createClient === "function") {
      ZeroClipboard._createClient.apply(this, _args(arguments));
    }
  };
  /**
 * The ZeroClipboard library's version number.
 *
 * @static
 * @readonly
 * @property {string}
 */
  _defineProperty(ZeroClipboard, "version", {
    value: "2.2.0",
    writable: false,
    configurable: true,
    enumerable: true
  });
  /**
 * Update or get a copy of the ZeroClipboard global configuration.
 * Returns a copy of the current/updated configuration.
 *
 * @returns Object
 * @static
 */
  ZeroClipboard.config = function() {
    return _config.apply(this, _args(arguments));
  };
  /**
 * Diagnostic method that describes the state of the browser, Flash Player, and ZeroClipboard.
 *
 * @returns Object
 * @static
 */
  ZeroClipboard.state = function() {
    return _state.apply(this, _args(arguments));
  };
  /**
 * Check if Flash is unusable for any reason: disabled, outdated, deactivated, etc.
 *
 * @returns Boolean
 * @static
 */
  ZeroClipboard.isFlashUnusable = function() {
    return _isFlashUnusable.apply(this, _args(arguments));
  };
  /**
 * Register an event listener.
 *
 * @returns `ZeroClipboard`
 * @static
 */
  ZeroClipboard.on = function() {
    return _on.apply(this, _args(arguments));
  };
  /**
 * Unregister an event listener.
 * If no `listener` function/object is provided, it will unregister all listeners for the provided `eventType`.
 * If no `eventType` is provided, it will unregister all listeners for every event type.
 *
 * @returns `ZeroClipboard`
 * @static
 */
  ZeroClipboard.off = function() {
    return _off.apply(this, _args(arguments));
  };
  /**
 * Retrieve event listeners for an `eventType`.
 * If no `eventType` is provided, it will retrieve all listeners for every event type.
 *
 * @returns array of listeners for the `eventType`; if no `eventType`, then a map/hash object of listeners for all event types; or `null`
 */
  ZeroClipboard.handlers = function() {
    return _listeners.apply(this, _args(arguments));
  };
  /**
 * Event emission receiver from the Flash object, forwarding to any registered JavaScript event listeners.
 *
 * @returns For the "copy" event, returns the Flash-friendly "clipData" object; otherwise `undefined`.
 * @static
 */
  ZeroClipboard.emit = function() {
    return _emit.apply(this, _args(arguments));
  };
  /**
 * Create and embed the Flash object.
 *
 * @returns The Flash object
 * @static
 */
  ZeroClipboard.create = function() {
    return _create.apply(this, _args(arguments));
  };
  /**
 * Self-destruct and clean up everything, including the embedded Flash object.
 *
 * @returns `undefined`
 * @static
 */
  ZeroClipboard.destroy = function() {
    return _destroy.apply(this, _args(arguments));
  };
  /**
 * Set the pending data for clipboard injection.
 *
 * @returns `undefined`
 * @static
 */
  ZeroClipboard.setData = function() {
    return _setData.apply(this, _args(arguments));
  };
  /**
 * Clear the pending data for clipboard injection.
 * If no `format` is provided, all pending data formats will be cleared.
 *
 * @returns `undefined`
 * @static
 */
  ZeroClipboard.clearData = function() {
    return _clearData.apply(this, _args(arguments));
  };
  /**
 * Get a copy of the pending data for clipboard injection.
 * If no `format` is provided, a copy of ALL pending data formats will be returned.
 *
 * @returns `String` or `Object`
 * @static
 */
  ZeroClipboard.getData = function() {
    return _getData.apply(this, _args(arguments));
  };
  /**
 * Sets the current HTML object that the Flash object should overlay. This will put the global
 * Flash object on top of the current element; depending on the setup, this may also set the
 * pending clipboard text data as well as the Flash object's wrapping element's title attribute
 * based on the underlying HTML element and ZeroClipboard configuration.
 *
 * @returns `undefined`
 * @static
 */
  ZeroClipboard.focus = ZeroClipboard.activate = function() {
    return _focus.apply(this, _args(arguments));
  };
  /**
 * Un-overlays the Flash object. This will put the global Flash object off-screen; depending on
 * the setup, this may also unset the Flash object's wrapping element's title attribute based on
 * the underlying HTML element and ZeroClipboard configuration.
 *
 * @returns `undefined`
 * @static
 */
  ZeroClipboard.blur = ZeroClipboard.deactivate = function() {
    return _blur.apply(this, _args(arguments));
  };
  /**
 * Returns the currently focused/"activated" HTML element that the Flash object is wrapping.
 *
 * @returns `HTMLElement` or `null`
 * @static
 */
  ZeroClipboard.activeElement = function() {
    return _activeElement.apply(this, _args(arguments));
  };
  /**
 * Keep track of the ZeroClipboard client instance counter.
 */
  var _clientIdCounter = 0;
  /**
 * Keep track of the state of the client instances.
 *
 * Entry structure:
 *   _clientMeta[client.id] = {
 *     instance: client,
 *     elements: [],
 *     handlers: {}
 *   };
 */
  var _clientMeta = {};
  /**
 * Keep track of the ZeroClipboard clipped elements counter.
 */
  var _elementIdCounter = 0;
  /**
 * Keep track of the state of the clipped element relationships to clients.
 *
 * Entry structure:
 *   _elementMeta[element.zcClippingId] = [client1.id, client2.id];
 */
  var _elementMeta = {};
  /**
 * Keep track of the state of the mouse event handlers for clipped elements.
 *
 * Entry structure:
 *   _mouseHandlers[element.zcClippingId] = {
 *     mouseover:  function(event) {},
 *     mouseout:   function(event) {},
 *     mouseenter: function(event) {},
 *     mouseleave: function(event) {},
 *     mousemove:  function(event) {}
 *   };
 */
  var _mouseHandlers = {};
  /**
 * Extending the ZeroClipboard configuration defaults for the Client module.
 */
  _extend(_globalConfig, {
    autoActivate: true
  });
  /**
 * The real constructor for `ZeroClipboard` client instances.
 * @private
 */
  var _clientConstructor = function(elements) {
    var client = this;
    client.id = "" + _clientIdCounter++;
    _clientMeta[client.id] = {
      instance: client,
      elements: [],
      handlers: {}
    };
    if (elements) {
      client.clip(elements);
    }
    ZeroClipboard.on("*", function(event) {
      return client.emit(event);
    });
    ZeroClipboard.on("destroy", function() {
      client.destroy();
    });
    ZeroClipboard.create();
  };
  /**
 * The underlying implementation of `ZeroClipboard.Client.prototype.on`.
 * @private
 */
  var _clientOn = function(eventType, listener) {
    var i, len, events, added = {}, meta = _clientMeta[this.id], handlers = meta && meta.handlers;
    if (!meta) {
      throw new Error("Attempted to add new listener(s) to a destroyed ZeroClipboard client instance");
    }
    if (typeof eventType === "string" && eventType) {
      events = eventType.toLowerCase().split(/\s+/);
    } else if (typeof eventType === "object" && eventType && typeof listener === "undefined") {
      for (i in eventType) {
        if (_hasOwn.call(eventType, i) && typeof i === "string" && i && typeof eventType[i] === "function") {
          this.on(i, eventType[i]);
        }
      }
    }
    if (events && events.length) {
      for (i = 0, len = events.length; i < len; i++) {
        eventType = events[i].replace(/^on/, "");
        added[eventType] = true;
        if (!handlers[eventType]) {
          handlers[eventType] = [];
        }
        handlers[eventType].push(listener);
      }
      if (added.ready && _flashState.ready) {
        this.emit({
          type: "ready",
          client: this
        });
      }
      if (added.error) {
        for (i = 0, len = _flashStateErrorNames.length; i < len; i++) {
          if (_flashState[_flashStateErrorNames[i].replace(/^flash-/, "")]) {
            this.emit({
              type: "error",
              name: _flashStateErrorNames[i],
              client: this
            });
            break;
          }
        }
        if (_zcSwfVersion !== undefined && ZeroClipboard.version !== _zcSwfVersion) {
          this.emit({
            type: "error",
            name: "version-mismatch",
            jsVersion: ZeroClipboard.version,
            swfVersion: _zcSwfVersion
          });
        }
      }
    }
    return this;
  };
  /**
 * The underlying implementation of `ZeroClipboard.Client.prototype.off`.
 * @private
 */
  var _clientOff = function(eventType, listener) {
    var i, len, foundIndex, events, perEventHandlers, meta = _clientMeta[this.id], handlers = meta && meta.handlers;
    if (!handlers) {
      return this;
    }
    if (arguments.length === 0) {
      events = _keys(handlers);
    } else if (typeof eventType === "string" && eventType) {
      events = eventType.split(/\s+/);
    } else if (typeof eventType === "object" && eventType && typeof listener === "undefined") {
      for (i in eventType) {
        if (_hasOwn.call(eventType, i) && typeof i === "string" && i && typeof eventType[i] === "function") {
          this.off(i, eventType[i]);
        }
      }
    }
    if (events && events.length) {
      for (i = 0, len = events.length; i < len; i++) {
        eventType = events[i].toLowerCase().replace(/^on/, "");
        perEventHandlers = handlers[eventType];
        if (perEventHandlers && perEventHandlers.length) {
          if (listener) {
            foundIndex = perEventHandlers.indexOf(listener);
            while (foundIndex !== -1) {
              perEventHandlers.splice(foundIndex, 1);
              foundIndex = perEventHandlers.indexOf(listener, foundIndex);
            }
          } else {
            perEventHandlers.length = 0;
          }
        }
      }
    }
    return this;
  };
  /**
 * The underlying implementation of `ZeroClipboard.Client.prototype.handlers`.
 * @private
 */
  var _clientListeners = function(eventType) {
    var copy = null, handlers = _clientMeta[this.id] && _clientMeta[this.id].handlers;
    if (handlers) {
      if (typeof eventType === "string" && eventType) {
        copy = handlers[eventType] ? handlers[eventType].slice(0) : [];
      } else {
        copy = _deepCopy(handlers);
      }
    }
    return copy;
  };
  /**
 * The underlying implementation of `ZeroClipboard.Client.prototype.emit`.
 * @private
 */
  var _clientEmit = function(event) {
    if (_clientShouldEmit.call(this, event)) {
      if (typeof event === "object" && event && typeof event.type === "string" && event.type) {
        event = _extend({}, event);
      }
      var eventCopy = _extend({}, _createEvent(event), {
        client: this
      });
      _clientDispatchCallbacks.call(this, eventCopy);
    }
    return this;
  };
  /**
 * The underlying implementation of `ZeroClipboard.Client.prototype.clip`.
 * @private
 */
  var _clientClip = function(elements) {
    if (!_clientMeta[this.id]) {
      throw new Error("Attempted to clip element(s) to a destroyed ZeroClipboard client instance");
    }
    elements = _prepClip(elements);
    for (var i = 0; i < elements.length; i++) {
      if (_hasOwn.call(elements, i) && elements[i] && elements[i].nodeType === 1) {
        if (!elements[i].zcClippingId) {
          elements[i].zcClippingId = "zcClippingId_" + _elementIdCounter++;
          _elementMeta[elements[i].zcClippingId] = [ this.id ];
          if (_globalConfig.autoActivate === true) {
            _addMouseHandlers(elements[i]);
          }
        } else if (_elementMeta[elements[i].zcClippingId].indexOf(this.id) === -1) {
          _elementMeta[elements[i].zcClippingId].push(this.id);
        }
        var clippedElements = _clientMeta[this.id] && _clientMeta[this.id].elements;
        if (clippedElements.indexOf(elements[i]) === -1) {
          clippedElements.push(elements[i]);
        }
      }
    }
    return this;
  };
  /**
 * The underlying implementation of `ZeroClipboard.Client.prototype.unclip`.
 * @private
 */
  var _clientUnclip = function(elements) {
    var meta = _clientMeta[this.id];
    if (!meta) {
      return this;
    }
    var clippedElements = meta.elements;
    var arrayIndex;
    if (typeof elements === "undefined") {
      elements = clippedElements.slice(0);
    } else {
      elements = _prepClip(elements);
    }
    for (var i = elements.length; i--; ) {
      if (_hasOwn.call(elements, i) && elements[i] && elements[i].nodeType === 1) {
        arrayIndex = 0;
        while ((arrayIndex = clippedElements.indexOf(elements[i], arrayIndex)) !== -1) {
          clippedElements.splice(arrayIndex, 1);
        }
        var clientIds = _elementMeta[elements[i].zcClippingId];
        if (clientIds) {
          arrayIndex = 0;
          while ((arrayIndex = clientIds.indexOf(this.id, arrayIndex)) !== -1) {
            clientIds.splice(arrayIndex, 1);
          }
          if (clientIds.length === 0) {
            if (_globalConfig.autoActivate === true) {
              _removeMouseHandlers(elements[i]);
            }
            delete elements[i].zcClippingId;
          }
        }
      }
    }
    return this;
  };
  /**
 * The underlying implementation of `ZeroClipboard.Client.prototype.elements`.
 * @private
 */
  var _clientElements = function() {
    var meta = _clientMeta[this.id];
    return meta && meta.elements ? meta.elements.slice(0) : [];
  };
  /**
 * The underlying implementation of `ZeroClipboard.Client.prototype.destroy`.
 * @private
 */
  var _clientDestroy = function() {
    if (!_clientMeta[this.id]) {
      return;
    }
    this.unclip();
    this.off();
    delete _clientMeta[this.id];
  };
  /**
 * Inspect an Event to see if the Client (`this`) should honor it for emission.
 * @private
 */
  var _clientShouldEmit = function(event) {
    if (!(event && event.type)) {
      return false;
    }
    if (event.client && event.client !== this) {
      return false;
    }
    var meta = _clientMeta[this.id];
    var clippedEls = meta && meta.elements;
    var hasClippedEls = !!clippedEls && clippedEls.length > 0;
    var goodTarget = !event.target || hasClippedEls && clippedEls.indexOf(event.target) !== -1;
    var goodRelTarget = event.relatedTarget && hasClippedEls && clippedEls.indexOf(event.relatedTarget) !== -1;
    var goodClient = event.client && event.client === this;
    if (!meta || !(goodTarget || goodRelTarget || goodClient)) {
      return false;
    }
    return true;
  };
  /**
 * Handle the actual dispatching of events to a client instance.
 *
 * @returns `undefined`
 * @private
 */
  var _clientDispatchCallbacks = function(event) {
    var meta = _clientMeta[this.id];
    if (!(typeof event === "object" && event && event.type && meta)) {
      return;
    }
    var async = _shouldPerformAsync(event);
    var wildcardTypeHandlers = meta && meta.handlers["*"] || [];
    var specificTypeHandlers = meta && meta.handlers[event.type] || [];
    var handlers = wildcardTypeHandlers.concat(specificTypeHandlers);
    if (handlers && handlers.length) {
      var i, len, func, context, eventCopy, originalContext = this;
      for (i = 0, len = handlers.length; i < len; i++) {
        func = handlers[i];
        context = originalContext;
        if (typeof func === "string" && typeof _window[func] === "function") {
          func = _window[func];
        }
        if (typeof func === "object" && func && typeof func.handleEvent === "function") {
          context = func;
          func = func.handleEvent;
        }
        if (typeof func === "function") {
          eventCopy = _extend({}, event);
          _dispatchCallback(func, context, [ eventCopy ], async);
        }
      }
    }
  };
  /**
 * Prepares the elements for clipping/unclipping.
 *
 * @returns An Array of elements.
 * @private
 */
  var _prepClip = function(elements) {
    if (typeof elements === "string") {
      elements = [];
    }
    return typeof elements.length !== "number" ? [ elements ] : elements;
  };
  /**
 * Add a `mouseover` handler function for a clipped element.
 *
 * @returns `undefined`
 * @private
 */
  var _addMouseHandlers = function(element) {
    if (!(element && element.nodeType === 1)) {
      return;
    }
    var _suppressMouseEvents = function(event) {
      if (!(event || (event = _window.event))) {
        return;
      }
      if (event._source !== "js") {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
      delete event._source;
    };
    var _elementMouseOver = function(event) {
      if (!(event || (event = _window.event))) {
        return;
      }
      _suppressMouseEvents(event);
      ZeroClipboard.focus(element);
    };
    element.addEventListener("mouseover", _elementMouseOver, false);
    element.addEventListener("mouseout", _suppressMouseEvents, false);
    element.addEventListener("mouseenter", _suppressMouseEvents, false);
    element.addEventListener("mouseleave", _suppressMouseEvents, false);
    element.addEventListener("mousemove", _suppressMouseEvents, false);
    _mouseHandlers[element.zcClippingId] = {
      mouseover: _elementMouseOver,
      mouseout: _suppressMouseEvents,
      mouseenter: _suppressMouseEvents,
      mouseleave: _suppressMouseEvents,
      mousemove: _suppressMouseEvents
    };
  };
  /**
 * Remove a `mouseover` handler function for a clipped element.
 *
 * @returns `undefined`
 * @private
 */
  var _removeMouseHandlers = function(element) {
    if (!(element && element.nodeType === 1)) {
      return;
    }
    var mouseHandlers = _mouseHandlers[element.zcClippingId];
    if (!(typeof mouseHandlers === "object" && mouseHandlers)) {
      return;
    }
    var key, val, mouseEvents = [ "move", "leave", "enter", "out", "over" ];
    for (var i = 0, len = mouseEvents.length; i < len; i++) {
      key = "mouse" + mouseEvents[i];
      val = mouseHandlers[key];
      if (typeof val === "function") {
        element.removeEventListener(key, val, false);
      }
    }
    delete _mouseHandlers[element.zcClippingId];
  };
  /**
 * Creates a new ZeroClipboard client instance.
 * Optionally, auto-`clip` an element or collection of elements.
 *
 * @constructor
 */
  ZeroClipboard._createClient = function() {
    _clientConstructor.apply(this, _args(arguments));
  };
  /**
 * Register an event listener to the client.
 *
 * @returns `this`
 */
  ZeroClipboard.prototype.on = function() {
    return _clientOn.apply(this, _args(arguments));
  };
  /**
 * Unregister an event handler from the client.
 * If no `listener` function/object is provided, it will unregister all handlers for the provided `eventType`.
 * If no `eventType` is provided, it will unregister all handlers for every event type.
 *
 * @returns `this`
 */
  ZeroClipboard.prototype.off = function() {
    return _clientOff.apply(this, _args(arguments));
  };
  /**
 * Retrieve event listeners for an `eventType` from the client.
 * If no `eventType` is provided, it will retrieve all listeners for every event type.
 *
 * @returns array of listeners for the `eventType`; if no `eventType`, then a map/hash object of listeners for all event types; or `null`
 */
  ZeroClipboard.prototype.handlers = function() {
    return _clientListeners.apply(this, _args(arguments));
  };
  /**
 * Event emission receiver from the Flash object for this client's registered JavaScript event listeners.
 *
 * @returns For the "copy" event, returns the Flash-friendly "clipData" object; otherwise `undefined`.
 */
  ZeroClipboard.prototype.emit = function() {
    return _clientEmit.apply(this, _args(arguments));
  };
  /**
 * Register clipboard actions for new element(s) to the client.
 *
 * @returns `this`
 */
  ZeroClipboard.prototype.clip = function() {
    return _clientClip.apply(this, _args(arguments));
  };
  /**
 * Unregister the clipboard actions of previously registered element(s) on the page.
 * If no elements are provided, ALL registered elements will be unregistered.
 *
 * @returns `this`
 */
  ZeroClipboard.prototype.unclip = function() {
    return _clientUnclip.apply(this, _args(arguments));
  };
  /**
 * Get all of the elements to which this client is clipped.
 *
 * @returns array of clipped elements
 */
  ZeroClipboard.prototype.elements = function() {
    return _clientElements.apply(this, _args(arguments));
  };
  /**
 * Self-destruct and clean up everything for a single client.
 * This will NOT destroy the embedded Flash object.
 *
 * @returns `undefined`
 */
  ZeroClipboard.prototype.destroy = function() {
    return _clientDestroy.apply(this, _args(arguments));
  };
  /**
 * Stores the pending plain text to inject into the clipboard.
 *
 * @returns `this`
 */
  ZeroClipboard.prototype.setText = function(text) {
    if (!_clientMeta[this.id]) {
      throw new Error("Attempted to set pending clipboard data from a destroyed ZeroClipboard client instance");
    }
    ZeroClipboard.setData("text/plain", text);
    return this;
  };
  /**
 * Stores the pending HTML text to inject into the clipboard.
 *
 * @returns `this`
 */
  ZeroClipboard.prototype.setHtml = function(html) {
    if (!_clientMeta[this.id]) {
      throw new Error("Attempted to set pending clipboard data from a destroyed ZeroClipboard client instance");
    }
    ZeroClipboard.setData("text/html", html);
    return this;
  };
  /**
 * Stores the pending rich text (RTF) to inject into the clipboard.
 *
 * @returns `this`
 */
  ZeroClipboard.prototype.setRichText = function(richText) {
    if (!_clientMeta[this.id]) {
      throw new Error("Attempted to set pending clipboard data from a destroyed ZeroClipboard client instance");
    }
    ZeroClipboard.setData("application/rtf", richText);
    return this;
  };
  /**
 * Stores the pending data to inject into the clipboard.
 *
 * @returns `this`
 */
  ZeroClipboard.prototype.setData = function() {
    if (!_clientMeta[this.id]) {
      throw new Error("Attempted to set pending clipboard data from a destroyed ZeroClipboard client instance");
    }
    ZeroClipboard.setData.apply(this, _args(arguments));
    return this;
  };
  /**
 * Clears the pending data to inject into the clipboard.
 * If no `format` is provided, all pending data formats will be cleared.
 *
 * @returns `this`
 */
  ZeroClipboard.prototype.clearData = function() {
    if (!_clientMeta[this.id]) {
      throw new Error("Attempted to clear pending clipboard data from a destroyed ZeroClipboard client instance");
    }
    ZeroClipboard.clearData.apply(this, _args(arguments));
    return this;
  };
  /**
 * Gets a copy of the pending data to inject into the clipboard.
 * If no `format` is provided, a copy of ALL pending data formats will be returned.
 *
 * @returns `String` or `Object`
 */
  ZeroClipboard.prototype.getData = function() {
    if (!_clientMeta[this.id]) {
      throw new Error("Attempted to get pending clipboard data from a destroyed ZeroClipboard client instance");
    }
    return ZeroClipboard.getData.apply(this, _args(arguments));
  };
  if (typeof define === "function" && define.amd) {
    define(function() {
      return ZeroClipboard;
    });
  } else if (typeof module === "object" && module && typeof module.exports === "object" && module.exports) {
    module.exports = ZeroClipboard;
  } else {
    window.ZeroClipboard = ZeroClipboard;
  }
})(function() {
  return this || window;
}());
},{}]},{},[30,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,91,92,93,78,79,80,81,82,83,38,42,47,39,40,41,43,44,45,46]);
