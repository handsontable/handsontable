/**
 * Creates a textarea that stays hidden on the page and gets focused when user presses CTRL while not having a form
 * input focused.
 * In future we may implement a better driver when better APIs are available.
 *
 * @constructor
 * @private
 */

var instance;

function copyPaste() {
  if (!instance) {
    instance = new CopyPasteClass();

  } else if (instance.hasBeenDestroyed()){
    instance.init();
  }
  instance.refCounter++;

  return instance;
}

if (typeof exports !== 'undefined') {
  module.exports = copyPaste;
}

function CopyPasteClass() {
  this.refCounter = 0;
  this.init();
}

CopyPasteClass.prototype.init = function () {
  var
    style,
    parent;

  this.copyCallbacks = [];
  this.cutCallbacks = [];
  this.pasteCallbacks = [];
  this.failedPasteCallbacks = [];

  // this.listenerElement = document.documentElement;
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
      var clipboardContents,
        temp;

      if ('WebkitAppearance' in document.documentElement.style) { // chrome and safari
        clipboardContents = event.clipboardData.getData("Text");

        // Safari adds an additional newline to copied text
        if (navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1) {
          temp = clipboardContents.split('\n');

          if (temp[temp.length - 1] === '') {
            temp.pop();
          }
          clipboardContents = temp.join('\n');
        }
        this.value = clipboardContents;

        event.preventDefault();
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
  this.onKeyDownRef = this.onKeyDown.bind(this);
  document.documentElement.addEventListener('keydown', this.onKeyDownRef, false);
};

/**
 * Call method on every key down event
 *
 * @param {Event} event
 */
CopyPasteClass.prototype.onKeyDown = function(event) {
  var _this = this,
    isCtrlDown = false;

  function isActiveElementEditable() {
    var element = document.activeElement;

    if (element.shadowRoot && element.shadowRoot.activeElement) {
      element = element.shadowRoot.activeElement;
    }

    return ['INPUT', 'SELECT', 'TEXTAREA'].indexOf(element.nodeName) > -1 || element.contentEditable === 'true';
  }

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
    if (document.activeElement !== this.elTextarea && (this.getSelectionText() !== '' || isActiveElementEditable())) {
      return;
    }
    this.selectPasteNode();
    setTimeout(function() {
      if (document.activeElement !== _this.elTextarea) {
        _this.selectPasteNode();
      }
    }, 0);
  }

  if (event.isImmediatePropagationEnabled !== false && isCtrlDown &&
      (event.keyCode === 67 ||
      event.keyCode === 86 ||
      event.keyCode === 88)) {
    // works in all browsers, incl. Opera < 12.12
    if (event.keyCode === 88) {
      setTimeout(function () {
        _this.triggerCut(event);
      }, 0);

    } else if (event.keyCode === 86) {
      setTimeout(function () {
        _this.triggerPaste(event, _this.elTextarea.value);
      }, 50);
    }
  }
};

//http://jsperf.com/textara-selection
//http://stackoverflow.com/questions/1502385/how-can-i-make-this-code-work-in-ie
/**
 * Select all text in our hidden text box, in preparation for a browser paste event
 *
 * @param {Element} element
 */
CopyPasteClass.prototype.selectPasteNode = function() {
  if (this.elTextarea) {
    this.elTextarea.select();
  }
};

//http://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
/**
 * Get selection text
 *
 * @returns {String}
 */
CopyPasteClass.prototype.getSelectionText = function() {
  var text = '';

  if (window.getSelection) {
    text = window.getSelection().toString();

  } else if (document.selection && document.selection.type !== 'Control') {
    text = document.selection.createRange().text;
  }

  return text;
};

/**
 * Make string copyable
 *
 * @param {String} string
 */
CopyPasteClass.prototype.copyable = function(string) {
  if (typeof string !== 'string' && string.toString === void 0) {
    throw new Error('copyable requires string parameter');
  }
  this.elTextarea.value = string;
  this.selectPasteNode();
};

/*CopyPasteClass.prototype.onCopy = function (fn) {
  this.copyCallbacks.push(fn);
};*/

/**
 * Add function callback to onCut event
 *
 * @param {Function} callback
 */
CopyPasteClass.prototype.onCut = function(callback) {
  this.cutCallbacks.push(callback);
};

/**
 * Add function callback to onPaste event
 *
 * @param {Function} callback
 */
CopyPasteClass.prototype.onPaste = function(callback) {
  this.pasteCallbacks.push(callback);
};

/**
 * Add function callback to onFailedPaste event
 *
 * @param {Function} callback
 */
CopyPasteClass.prototype.onFailedPaste = function(callback) {
  this.failedPasteCallbacks.push(callback);
}

/**
 * Remove callback from all events
 *
 * @param {Function} callback
 * @returns {Boolean}
 */
CopyPasteClass.prototype.removeCallback = function(callback) {
  var callbackArrays = [
    this.copyCallbacks,
    this.cutCallbacks,
    this.pasteCallbacks,
    this.failedPasteCallbacks
  ];
  for (var a = 0; a < callbackArrays.length; a++) {
    for (var i = 0, len = callbackArrays[a].length; i < len; i++) {
      if (callbackArrays[a][i] === callback) {
        callbackArrays[a].splice(i, 1);

        return true;
      }
    }
  }

  return false;
};

/**
 * Trigger cut event
 *
 * @param {DOMEvent} event
 */
CopyPasteClass.prototype.triggerCut = function(event) {
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
 * @param {String} string
 */
CopyPasteClass.prototype.triggerPaste = function(event, string) {
  var _this = this;

  if (_this.pasteCallbacks) {
    setTimeout(function () {
      if (string === null || string === undefined) {
        // No string was supplied, so try to trigger a paste event directly.
        if (window.clipboardData) {
          // Internet Explorer's odd implementation of w3c clipboard API
          string = window.clipboardData.getData('Text');
        } else if (window.queryCommandSupported && window.queryCommandSupported('paste')) {
          // w3c execCommand API
          _this.selectPasteNode();
          var result = document.execCommand("paste");
          if (result === true) {
            setTimeout(function () {
              _this.triggerPaste(event, _this.elTextarea.value);
            }, 50);
          } else {
            // Paste command was available but did not succeed, this is known to happen in
            // Firefox versions < 41.
            _this.triggerFailedPaste(event);
          }
          return;
        } else {
          _this.triggerFailedPaste(event);
          return;
        }
      }

      for (var i = 0, len = _this.pasteCallbacks.length; i < len; i++) {
        _this.pasteCallbacks[i](string, event);
      }
    }, 50);
  }
};

/**
 * Trigger failed paste event; this means that user must manually paste from their browser UI
 *
 * @param {DOMEvent} event
 * @param {String} string
 */
CopyPasteClass.prototype.triggerFailedPaste = function(event) {
  for (var i = 0, len = this.failedPasteCallbacks.length; i < len; i++) {
    this.failedPasteCallbacks[i](event);
  }
}

/**
 * Destroy instance
 */
CopyPasteClass.prototype.destroy = function() {
  if (!this.hasBeenDestroyed() && --this.refCounter === 0) {
    if (this.elDiv && this.elDiv.parentNode) {
      this.elDiv.parentNode.removeChild(this.elDiv);
      this.elDiv = null;
      this.elTextarea = null;
    }
    document.documentElement.removeEventListener('keydown', this.onKeyDownRef);
    this.onKeyDownRef = null;
  }
};

/**
 * Check if instance has been destroyed
 *
 * @returns {Boolean}
 */
CopyPasteClass.prototype.hasBeenDestroyed = function() {
  return !this.refCounter;
};


