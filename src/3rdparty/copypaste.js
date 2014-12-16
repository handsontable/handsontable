/**
 * Creates a textarea that stays hidden on the page and gets focused when user presses CTRL while not having a form input focused
 * In future we may implement a better driver when better APIs are available
 * @constructor
 * @private
 */
var CopyPaste = (function () {
  var instance;
  return {
    getInstance: function () {
      if (!instance) {
        instance = new CopyPasteClass();
      } else if (instance.hasBeenDestroyed()){
        instance.init();
      }

      instance.refCounter++;

      return instance;
    }
  };
})();

function CopyPasteClass() {
  this.refCounter = 0;
  this.init();
}

CopyPasteClass.prototype.init = function () {
  var that = this
    , style
    , parent;

  this.copyCallbacks = [];
  this.cutCallbacks = [];
  this.pasteCallbacks = [];
  this._eventManager = Handsontable.eventManager(this);

//  this.listenerElement = document.documentElement;
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
    else {
      /*@cc_on @if (@_jscript)
       if(typeof style.filter === 'string') {
       style.filter = 'alpha(opacity=0)';
       }
       @end @*/
    }
  }

  this.keydownListener = function (event) {
    var isCtrlDown = false;
    if (event.metaKey) { //mac
      isCtrlDown = true;
    }
    else if (event.ctrlKey && navigator.userAgent.indexOf('Mac') === -1) { //pc
      isCtrlDown = true;
    }

    if (isCtrlDown) {
      if (document.activeElement !== that.elTextarea && (that.getSelectionText() != '' || ['INPUT', 'SELECT', 'TEXTAREA'].indexOf(document.activeElement.nodeName) != -1)) {
        return; //this is needed by fragmentSelection in Handsontable. Ignore copypaste.js behavior if fragment of cell text is selected
      }

      that.selectNodeText(that.elTextarea);
      setTimeout(function () {
        that.selectNodeText(that.elTextarea);
      }, 0);
    }

    /* 67 = c
     * 86 = v
     * 88 = x
     */
    if (isCtrlDown && (event.keyCode === 67 || event.keyCode === 86 || event.keyCode === 88)) {
      // that.selectNodeText(that.elTextarea);

      if (event.keyCode === 88) { //works in all browsers, incl. Opera < 12.12
        setTimeout(function () {
          that.triggerCut(event);
        }, 0);
      }
      else if (event.keyCode === 86) {
        setTimeout(function () {
          that.triggerPaste(event);
        }, 0);
      }
    }
  };

  this._eventManager.addEventListener(document.documentElement,'keydown',this.keydownListener, false);

//  this._bindEvent(this.listenerElement, 'keydown', this.keydownListener);
};

//http://jsperf.com/textara-selection
//http://stackoverflow.com/questions/1502385/how-can-i-make-this-code-work-in-ie
CopyPasteClass.prototype.selectNodeText = function (el) {
  if (el) {
    el.select();
  }
};

//http://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text
CopyPasteClass.prototype.getSelectionText = function () {
  var text = "";
  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type != "Control") {
    text = document.selection.createRange().text;
  }
  return text;
};

CopyPasteClass.prototype.copyable = function (str) {
  if (typeof str !== 'string' && str.toString === void 0) {
    throw new Error('copyable requires string parameter');
  }
  this.elTextarea.value = str;
};

/*CopyPasteClass.prototype.onCopy = function (fn) {
  this.copyCallbacks.push(fn);
};*/

CopyPasteClass.prototype.onCut = function (fn) {
  this.cutCallbacks.push(fn);
};

CopyPasteClass.prototype.onPaste = function (fn) {
  this.pasteCallbacks.push(fn);
};

CopyPasteClass.prototype.removeCallback = function (fn) {
  var i, ilen;
  for (i = 0, ilen = this.copyCallbacks.length; i < ilen; i++) {
    if (this.copyCallbacks[i] === fn) {
      this.copyCallbacks.splice(i, 1);
      return true;
    }
  }
  for (i = 0, ilen = this.cutCallbacks.length; i < ilen; i++) {
    if (this.cutCallbacks[i] === fn) {
      this.cutCallbacks.splice(i, 1);
      return true;
    }
  }
  for (i = 0, ilen = this.pasteCallbacks.length; i < ilen; i++) {
    if (this.pasteCallbacks[i] === fn) {
      this.pasteCallbacks.splice(i, 1);
      return true;
    }
  }
  return false;
};

CopyPasteClass.prototype.triggerCut = function (event) {
  var that = this;
  if (that.cutCallbacks) {
    setTimeout(function () {
      for (var i = 0, ilen = that.cutCallbacks.length; i < ilen; i++) {
        that.cutCallbacks[i](event);
      }
    }, 50);
  }
};

CopyPasteClass.prototype.triggerPaste = function (event, str) {
  var that = this;
  if (that.pasteCallbacks) {
    setTimeout(function () {
      var val = (str || that.elTextarea.value).replace(/\n$/, ''); //remove trailing newline
      for (var i = 0, ilen = that.pasteCallbacks.length; i < ilen; i++) {
        that.pasteCallbacks[i](val, event);
      }
    }, 50);
  }
};

CopyPasteClass.prototype.destroy = function () {

  if(!this.hasBeenDestroyed() && --this.refCounter == 0){
    if (this.elDiv && this.elDiv.parentNode) {
      this.elDiv.parentNode.removeChild(this.elDiv);
      this.elDiv = null;
      this.elTextarea = null;
    }

    this._eventManager.removeEventListener(document.documentElement, 'keydown', this.keydownListener, false);
//    this._unbindEvent(this.listenerElement, 'keydown', this.keydownListener);

  }

};

CopyPasteClass.prototype.hasBeenDestroyed = function () {
  return !this.refCounter;
};


