/**
 * CopyPaste.js
 * Creates a textarea that stays hidden on the page and gets focused when user presses CTRL while not having a form input focused
 * In future we may implement a better driver when better APIs are available
 * @constructor
 */
function CopyPaste(listenerElement) {
  var that = this;
  listenerElement = listenerElement || document.body;

  this.elDiv = document.createElement('DIV');
  this.elDiv.style.position = 'fixed';
  this.elDiv.style.top = 0;
  this.elDiv.style.left = 0;
  listenerElement.appendChild(this.elDiv);

  this.elTextarea = document.createElement('TEXTAREA');
  this.elTextarea.className = 'copyPaste';
  this.elTextarea.style.width = '1px';
  this.elTextarea.style.height = '1px';
  this.elDiv.appendChild(this.elTextarea);

  if (typeof this.elTextarea.style.opacity !== 'undefined') {
    this.elTextarea.style.opacity = 0;
  }
  else {
    /*@cc_on @if (@_jscript)
     if(typeof this.elTextarea.style.filter === 'string') {
     this.elTextarea.style.filter = 'alpha(opacity=0)';
     }
     @end @*/
  }

  this._bindEvent(listenerElement, 'keydown', function (event) {
    var isCtrlDown = false;
    if (event.metaKey) { //mac
      isCtrlDown = true;
    }
    else if (event.ctrlKey && navigator.userAgent.indexOf('Mac') === -1) { //pc
      isCtrlDown = true;
    }

    /* 67 = c
     * 86 = v
     * 88 = x
     */
    if (isCtrlDown && (event.keyCode === 67 || event.keyCode === 86 || event.keyCode === 88)) {
      that.selectNodeText(that.elTextarea);

      if (event.keyCode === 88) { //works in all browsers, incl. Opera < 12.12
        setTimeout(function(){
          that.triggerCut(event);
        }, 0);
      }
      else if (event.keyCode === 86) {
        setTimeout(function(){
          that.triggerPaste(event);
        }, 0);
      }
    }
  });
}

//http://jsperf.com/textara-selection
//http://stackoverflow.com/questions/1502385/how-can-i-make-this-code-work-in-ie
CopyPaste.prototype.selectNodeText = function (el) {
  this.elTextarea.select();
};

CopyPaste.prototype.copyable = function (str) {
  if (typeof str !== 'string' && str.toString === void 0) {
    throw new Error('copyable requires string parameter');
  }
  this.elTextarea.value = str;
};

CopyPaste.prototype.onCopy = function (fn) {
  this.copyCallback = fn;
};

CopyPaste.prototype.onCut = function (fn) {
  this.cutCallback = fn;
};

CopyPaste.prototype.onPaste = function (fn) {
  this.pasteCallback = fn;
};

CopyPaste.prototype.triggerCut = function (event) {
  var that = this;
  if (that.cutCallback) {
    setTimeout(function () {
      that.cutCallback(event);
    }, 0);
  }
};

CopyPaste.prototype.triggerPaste = function (event, str) {
  var that = this;
  if (that.pasteCallback) {
    setTimeout(function () {
      that.pasteCallback((str || that.elTextarea.value).replace(/\n$/, ''), event); //remove trailing newline
    }, 0);
  }
};

//http://net.tutsplus.com/tutorials/javascript-ajax/javascript-from-null-cross-browser-event-binding/
//http://stackoverflow.com/questions/4643249/cross-browser-event-object-normalization
CopyPaste.prototype._bindEvent = (function () {
  if (document.addEventListener) {
    return function (elem, type, cb) {
      elem.addEventListener(type, cb, false);
    };
  }
  else {
    return function (elem, type, cb) {
      elem.attachEvent('on' + type, function () {
        var e = window['event'];
        e.target = e.srcElement;
        e.relatedTarget = e.relatedTarget || e.type == 'mouseover' ? e.fromElement : e.toElement;
        if (e.target.nodeType === 3) e.target = e.target.parentNode; //Safari bug
        return cb.call(elem, e)
      });
    };
  }
})();