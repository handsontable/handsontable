/**
 * Creates a textarea that stays hidden on the page and gets focused when user presses CTRL while not having a form
 * input focused.
 * In future we may implement a better driver when better APIs are available.
 *
 * @constructor
 */
var CopyPaste = (function () {
  var instance;

  return {
    getInstance: function () {
      if (!instance) {
        instance = new CopyPasteClass();

      } else if (instance.hasBeenDestroyed()) {
        instance.init();
      }
      instance.refCounter ++;

      return instance;
    }
  };
})();

function CopyPasteClass() {
  this.refCounter = 0;
  this.init();
}

/**
 * Initialize CopyPaste class
 */
CopyPasteClass.prototype.init = function () {
  var
    style,
    parent;

  this.copyCallbacks = [];
  this.cutCallbacks = [];
  this.pasteCallbacks = [];
  this._eventManager = Handsontable.eventManager(this);

  // this.listenerElement = document.documentElement;
  parent = document.body;

  if (document.getElementById('CopyPasteDiv')) {
    this.elDiv = document.getElementById('CopyPasteDiv');
    this.elTextarea = this.elDiv.firstChild;
  }
  else {
    this.elDiv = document.createElement('DIV');
    this.elDiv.id = 'CopyPasteDiv';
    style = this.elDiv.style;
    style.position = 'fixed';
    style.top = '-10000px';
    style.left = '-10000px';
    parent.appendChild(this.elDiv);

    this.elTextarea = document.createElement('TEXTAREA');
    this.elTextarea.className = 'copyPaste';
    this.elTextarea.onpaste = function (event) {
      if('WebkitAppearance' in document.documentElement.style) { // chrome and safari
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

/**
 * Call method on every key down event
 *
 * @param {DOMEvent} event
 */
CopyPasteClass.prototype.onKeyDown = function (event) {
  var _this = this,
    isCtrlDown = false;

  // mac
  if (event.metaKey) {
    isCtrlDown = true;
  }
  // pc
  else if (event.ctrlKey && navigator.userAgent.indexOf('Mac') === -1) {
    isCtrlDown = true;
  }
  if (isCtrlDown) {
    // this is needed by fragmentSelection in Handsontable. Ignore copypaste.js behavior if fragment of cell text is selected
    if (document.activeElement !== this.elTextarea && (this.getSelectionText() !== '' ||
        ['INPUT', 'SELECT', 'TEXTAREA'].indexOf(document.activeElement.nodeName) !== -1)) {
      return;
    }

    this.selectNodeText(this.elTextarea);
    setTimeout(function () {
      _this.selectNodeText(_this.elTextarea);
    }, 0);
  }

  /* 67 = c
   * 86 = v
   * 88 = x
   */
  if (isCtrlDown && (event.keyCode === 67 || event.keyCode === 86 || event.keyCode === 88)) {
    // that.selectNodeText(that.elTextarea);

    // works in all browsers, incl. Opera < 12.12
    if (event.keyCode === 88) {
      setTimeout(function () {
        _this.triggerCut(event);
      }, 0);
    }
    else if (event.keyCode === 86) {
      setTimeout(function () {
        _this.triggerPaste(event);
      }, 0);
    }
  }
};

//http://jsperf.com/textara-selection
//http://stackoverflow.com/questions/1502385/how-can-i-make-this-code-work-in-ie
/**
 * Select all text contains in passed node element
 *
 * @param {Element} el
 */
CopyPasteClass.prototype.selectNodeText = function (el) {
  if (el) {
    el.select();
  }
};

//http://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
/**
 * Get selection text
 *
 * @returns {String}
 */
CopyPasteClass.prototype.getSelectionText = function () {
  var text = "";

  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type != "Control") {
    text = document.selection.createRange().text;
  }

  return text;
};

/**
 * Make string copyable
 *
 * @param {String} str
 */
CopyPasteClass.prototype.copyable = function (str) {
  if (typeof str !== 'string' && str.toString === void 0) {
    throw new Error('copyable requires string parameter');
  }
  this.elTextarea.value = str;
};

/*CopyPasteClass.prototype.onCopy = function (fn) {
  this.copyCallbacks.push(fn);
};*/

/**
 * Add function callback to onCut event
 *
 * @param {Function} fn
 */
CopyPasteClass.prototype.onCut = function (fn) {
  this.cutCallbacks.push(fn);
};

/**
 * Add function callback to onPaste event
 *
 * @param {Function} fn
 */
CopyPasteClass.prototype.onPaste = function (fn) {
  this.pasteCallbacks.push(fn);
};

/**
 * Remove callback from all events
 *
 * @param {Function} fn
 * @returns {Boolean}
 */
CopyPasteClass.prototype.removeCallback = function (fn) {
  var i, len;

  for (i = 0, len = this.copyCallbacks.length; i < len; i++) {
    if (this.copyCallbacks[i] === fn) {
      this.copyCallbacks.splice(i, 1);

      return true;
    }
  }
  for (i = 0, len = this.cutCallbacks.length; i < len; i++) {
    if (this.cutCallbacks[i] === fn) {
      this.cutCallbacks.splice(i, 1);

      return true;
    }
  }
  for (i = 0, len = this.pasteCallbacks.length; i < len; i++) {
    if (this.pasteCallbacks[i] === fn) {
      this.pasteCallbacks.splice(i, 1);

      return true;
    }
  }

  return false;
};

/**
 * Trigger cut event
 *
 * @param {DOMEvent} event
 */
CopyPasteClass.prototype.triggerCut = function (event) {
  var _this = this;

  if (_this.cutCallbacks) {
    setTimeout(function () {
      for (var i = 0, len = _this.cutCallbacks.length; i < len; i++) {
        _this.cutCallbacks[i](event);
      }
    }, 50);
  }
};

/**
 * Trigger paste event
 *
 * @param {DOMEvent} event
 * @param {String} str
 */
CopyPasteClass.prototype.triggerPaste = function (event, str) {
  var _this = this;

  if (_this.pasteCallbacks) {
    setTimeout(function () {
      var val = str || _this.elTextarea.value;

      for (var i = 0, len = _this.pasteCallbacks.length; i < len; i++) {
        _this.pasteCallbacks[i](val, event);
      }
    }, 50);
  }
};

/**
 * Destroy instance
 */
CopyPasteClass.prototype.destroy = function () {
  if(!this.hasBeenDestroyed() && --this.refCounter === 0){
    if (this.elDiv && this.elDiv.parentNode) {
      this.elDiv.parentNode.removeChild(this.elDiv);
      this.elDiv = null;
      this.elTextarea = null;
    }
    this.keyDownRemoveEvent();
  }
};

/**
 * Check if instance has been destroyed
 *
 * @returns {Boolean}
 */
CopyPasteClass.prototype.hasBeenDestroyed = function () {
  return !this.refCounter;
};


